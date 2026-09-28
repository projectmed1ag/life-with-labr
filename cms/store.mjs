import {DatabaseSync, backup} from 'node:sqlite';
import {mkdirSync, existsSync, chmodSync} from 'node:fs';
import path from 'node:path';
import {HttpError, validateContent} from './validation.mjs';
import {migrateGallery} from './gallery.mjs';

export function openStore(directory, {seed, assetDirectory}={}) {
  mkdirSync(directory,{recursive:true,mode:0o700});
  mkdirSync(path.join(directory,'uploads'),{recursive:true,mode:0o700});
  const filename=path.join(directory,'content.sqlite');
  const db=new DatabaseSync(filename);
  if(process.platform!=='win32') chmodSync(filename,0o600);
  db.exec(`PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON; PRAGMA busy_timeout=5000;
    CREATE TABLE IF NOT EXISTS meta(key TEXT PRIMARY KEY,value TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS users(username TEXT PRIMARY KEY,password TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS sessions(token TEXT PRIMARY KEY,username TEXT NOT NULL,csrf TEXT NOT NULL,expires INTEGER NOT NULL);
    CREATE TABLE IF NOT EXISTS attempts(key TEXT PRIMARY KEY,count INTEGER NOT NULL,until INTEGER NOT NULL);
    CREATE TABLE IF NOT EXISTS records(kind TEXT NOT NULL,id TEXT NOT NULL,draft TEXT NOT NULL,published TEXT,version INTEGER NOT NULL DEFAULT 1,archived INTEGER NOT NULL DEFAULT 0,updated TEXT NOT NULL,PRIMARY KEY(kind,id));
    CREATE TABLE IF NOT EXISTS history(seq INTEGER PRIMARY KEY,kind TEXT NOT NULL,id TEXT NOT NULL,action TEXT NOT NULL,previous TEXT,created TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS media(src TEXT PRIMARY KEY,width INTEGER NOT NULL,height INTEGER NOT NULL,created TEXT NOT NULL);`);
  if(!db.prepare('PRAGMA table_info(records)').all().some(column=>column.name==='closed')) db.exec('ALTER TABLE records ADD COLUMN closed INTEGER NOT NULL DEFAULT 0');
  if(seed && !db.prepare('SELECT 1 FROM meta WHERE key=?').get('seeded')) {
    db.exec('BEGIN IMMEDIATE');
    try {
      for(const kind of ['litters','gallery']) for(const data of seed[kind]||[]) db.prepare('INSERT OR IGNORE INTO records(kind,id,draft,published,updated) VALUES(?,?,?,?,?)').run(kind,data.id,JSON.stringify(data),JSON.stringify(data),new Date().toISOString());
      db.prepare('INSERT INTO meta VALUES(?,?)').run('seeded','1'); db.exec('COMMIT');
    } catch(error) {db.exec('ROLLBACK');throw error;}
  }
  migrateGallery(db);
  // Existing installations already have the original seed marker. Import dogs once,
  // without replacing any owner edits or resurrecting archived records on restart.
  if(seed?.dogs && !db.prepare('SELECT 1 FROM meta WHERE key=?').get('dogs-seeded-v1')) {
    db.exec('BEGIN IMMEDIATE');
    try {
      for(const dog of seed.dogs) db.prepare('INSERT OR IGNORE INTO records(kind,id,draft,published,updated) VALUES(?,?,?,?,?)').run('dogs',dog.id,JSON.stringify(dog),JSON.stringify(dog),new Date().toISOString());
      db.prepare('INSERT INTO meta VALUES(?,?)').run('dogs-seeded-v1','1');db.exec('COMMIT');
    } catch(error) {db.exec('ROLLBACK');throw error;}
  }
  const mediaExists=src=> src.startsWith('upload-') ? !!db.prepare('SELECT 1 FROM media WHERE src=?').get(src) : !!assetDirectory && existsSync(path.join(assetDirectory,src));
  const lastPublished=id=>{
    const entry=db.prepare("SELECT previous FROM history WHERE kind='litters' AND id=? AND json_extract(previous,'$.published') IS NOT NULL ORDER BY seq DESC LIMIT 1").get(id);
    return entry?JSON.parse(entry.previous).published:null;
  };
  const unpack=row=>row?{kind:row.kind,id:row.id,data:JSON.parse(row.draft),version:row.version,archived:!!row.archived,published:!!row.published,closed:!!row.closed,canReopen:row.kind==='litters'&&(!!row.closed&&!!row.published||!!row.archived&&!!lastPublished(row.id)),dirty:row.draft!==row.published,updated:row.updated,...(row.kind==='litters'?{publishedPuppies:row.published?JSON.parse(row.published).puppies.map(p=>({id:p.id,name:p.name,sex:p.sex,status:p.status??null,photo:p.photos[0]?.src||''})):[]}:{} )}:null;
  const get=(kind,id)=>unpack(db.prepare('SELECT * FROM records WHERE kind=? AND id=?').get(kind,id));
  const all=()=>db.prepare("SELECT * FROM records WHERE kind!='gallery' OR id='gallery' ORDER BY updated DESC,id").all().map(unpack);
  const published=()=>{
    const data={litters:[],gallery:[],dogs:[]};
    for(const row of db.prepare('SELECT kind,published,closed FROM records WHERE published IS NOT NULL AND archived=0 ORDER BY updated DESC,id').all()) data[row.kind].push({...JSON.parse(row.published),...(row.kind==='litters'&&row.closed?{closed:true}:{})});
    data.gallery.sort((a,b)=>(b.date||'').localeCompare(a.date||''));data.dogs.sort((a,b)=>a.order-b.order||a.id.localeCompare(b.id));return data;
  };
  const save=(kind,id,input,version,action='draft')=>{
    if(kind==='gallery' && (id!=='gallery' || !['draft','publish'].includes(action))) throw new HttpError(400,'Галерея единая. Обновите страницу, чтобы редактировать фотографии.');
    if(!['draft','publish','unpublish','archive','restore'].includes(action)) throw new HttpError(400,'Неизвестное действие.');
    const data=validateContent(kind,{...input,id},{publish:action==='publish',mediaExists});
    db.exec('BEGIN IMMEDIATE');
    try {
      const old=db.prepare('SELECT * FROM records WHERE kind=? AND id=?').get(kind,id);
      if((old?.version||0)!==version) throw new HttpError(409,'Запись уже изменена в другой вкладке. Обновите её перед сохранением.');
      if(old?.archived && action!=='restore') throw new HttpError(400,'Сначала восстановите запись из архива.');
      const draft=JSON.stringify(data), updated=new Date().toISOString();
      const live=action==='publish'?draft:['unpublish','archive'].includes(action)?null:old?.published||null;
      db.prepare('INSERT INTO history(kind,id,action,previous,created) VALUES(?,?,?,?,?)').run(kind,id,action,old?JSON.stringify(old):null,updated);
      db.prepare(`INSERT INTO records(kind,id,draft,published,version,archived,updated) VALUES(?,?,?,?,?,?,?)
        ON CONFLICT(kind,id) DO UPDATE SET draft=excluded.draft,published=excluded.published,version=excluded.version,archived=excluded.archived,updated=excluded.updated`).run(kind,id,draft,live,version+1,action==='archive'?1:0,updated);
      db.exec('COMMIT');return get(kind,id);
    } catch(error) {db.exec('ROLLBACK');throw error;}
  };
  const prepareLitterAvailability=(id,input,version,action)=>{
    if(!['close','reopen'].includes(action))throw new HttpError(400,'Неизвестное действие.');
    const row=db.prepare("SELECT * FROM records WHERE kind='litters' AND id=?").get(id);
    if(!row||row.version!==version)throw new HttpError(409,'Помёт изменён в другой вкладке. Обновите страницу.');
    const live=row.published||(action==='reopen'&&row.archived?lastPublished(id):null);
    if(!live||action==='close'&&row.archived)throw new HttpError(400,'Сначала восстановите и опубликуйте помёт.');
    const draft=JSON.stringify(input)===row.draft?row.draft:JSON.stringify(validateContent('litters',{...input,id},{mediaExists}));
    return {row,draft,published:live,closed:action==='close'?1:0};
  };
  const setLitterAvailability=(id,input,version,action)=>{
    db.exec('BEGIN IMMEDIATE');
    try{
      const next=prepareLitterAvailability(id,input,version,action),updated=new Date().toISOString();
      db.prepare('INSERT INTO history(kind,id,action,previous,created) VALUES(?,?,?,?,?)').run('litters',id,action,JSON.stringify(next.row),updated);
      db.prepare("UPDATE records SET draft=?,published=?,closed=?,archived=0,version=version+1,updated=? WHERE kind='litters' AND id=?").run(next.draft,next.published,next.closed,updated,id);
      db.exec('COMMIT');return get('litters',id);
    }catch(error){db.exec('ROLLBACK');throw error;}
  };
  const preparePuppyStatus=(id,puppyId,status,version)=>{
    if(!Number.isInteger(version)||version<1||![null,'available','reserved','home'].includes(status))throw new HttpError(400,'Выберите статус щенка и повторите действие.');
    const row=db.prepare("SELECT * FROM records WHERE kind='litters' AND id=?").get(id);
    if(!row||row.version!==version)throw new HttpError(409,'Помёт изменён в другой вкладке. Обновите список и выберите статус ещё раз.');
    if(row.archived||row.closed||!row.published)throw new HttpError(400,'Быстрые статусы доступны у открытого опубликованного помёта.');
    const live=JSON.parse(row.published),draft=JSON.parse(row.draft);
    const puppy=live.puppies.find(p=>p.id===puppyId);
    if(!puppy)throw new HttpError(404,'Щенок не найден в опубликованном помёте. Обновите список.');
    puppy.status=status;
    const draftPuppy=draft.puppies.find(p=>p.id===puppyId);
    if(draftPuppy)draftPuppy.status=status;
    return {row,published:JSON.stringify(live),draft:JSON.stringify(draft)};
  };
  const setPuppyStatus=(id,puppyId,status,version)=>{
    db.exec('BEGIN IMMEDIATE');
    try{
      const next=preparePuppyStatus(id,puppyId,status,version);
      if(next.draft!==next.row.draft||next.published!==next.row.published){
        const updated=new Date().toISOString();
        db.prepare('INSERT INTO history(kind,id,action,previous,created) VALUES(?,?,?,?,?)').run('litters',id,'puppy-status',JSON.stringify(next.row),updated);
        db.prepare("UPDATE records SET draft=?,published=?,version=version+1,updated=? WHERE kind='litters' AND id=?").run(next.draft,next.published,updated,id);
      }
      db.exec('COMMIT');return get('litters',id);
    }catch(error){db.exec('ROLLBACK');throw error;}
  };
  const prepareDogOrder=items=>{
    if(!Array.isArray(items)||items.length>1000||new Set(items.map(item=>item?.id)).size!==items.length) throw new HttpError(400,'Не удалось изменить порядок. Обновите список собак.');
    const rows=db.prepare("SELECT * FROM records WHERE kind='dogs' AND archived=0").all();
    const byId=new Map(rows.map(row=>[row.id,row]));
    if(rows.length!==items.length||items.some(item=>!byId.has(item?.id)||item.version!==byId.get(item.id).version)) throw new HttpError(409,'Список собак изменился в другой вкладке. Обновите страницу и повторите действие.');
    return items.map((item,index)=>{
      const row=byId.get(item.id),order=(index+1)*10;
      return {row,draft:JSON.stringify({...JSON.parse(row.draft),order}),published:row.published?JSON.stringify({...JSON.parse(row.published),order}):null};
    });
  };
  const reorderDogs=items=>{
    db.exec('BEGIN IMMEDIATE');
    try {
      const updates=prepareDogOrder(items),updated=new Date().toISOString();
      for(const entry of updates){
        const {row,draft,published:live}=entry;
        if(row.draft===draft&&row.published===live)continue;
        db.prepare('INSERT INTO history(kind,id,action,previous,created) VALUES(?,?,?,?,?)').run('dogs',row.id,'reorder',JSON.stringify(row),updated);
        db.prepare("UPDATE records SET draft=?,published=?,version=version+1,updated=? WHERE kind='dogs' AND id=?").run(draft,live,updated,row.id);
      }
      db.exec('COMMIT');return all();
    } catch(error){db.exec('ROLLBACK');throw error;}
  };
  return {db,directory,mediaExists,get,all,published,save,prepareLitterAvailability,setLitterAvailability,preparePuppyStatus,setPuppyStatus,prepareDogOrder,reorderDogs,
    addMedia(photo){db.prepare('INSERT INTO media VALUES(?,?,?,?)').run(photo.src,photo.width,photo.height,new Date().toISOString());},
    backup:async()=>{const target=path.join(directory,'backups');mkdirSync(target,{recursive:true,mode:0o700});await backup(db,path.join(target,`content-${new Date().toISOString().slice(0,10)}.sqlite`));},
    close:()=>db.close()};
}
