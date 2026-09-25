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
  if(seed && !db.prepare('SELECT 1 FROM meta WHERE key=?').get('seeded')) {
    db.exec('BEGIN IMMEDIATE');
    try {
      for(const kind of ['litters','gallery']) for(const data of seed[kind]||[]) db.prepare('INSERT OR IGNORE INTO records(kind,id,draft,published,updated) VALUES(?,?,?,?,?)').run(kind,data.id,JSON.stringify(data),JSON.stringify(data),new Date().toISOString());
      db.prepare('INSERT INTO meta VALUES(?,?)').run('seeded','1'); db.exec('COMMIT');
    } catch(error) {db.exec('ROLLBACK');throw error;}
  }
  migrateGallery(db);
  const mediaExists=src=> src.startsWith('upload-') ? !!db.prepare('SELECT 1 FROM media WHERE src=?').get(src) : !!assetDirectory && existsSync(path.join(assetDirectory,src));
  const unpack=row=>row?{kind:row.kind,id:row.id,data:JSON.parse(row.draft),version:row.version,archived:!!row.archived,published:!!row.published,dirty:row.draft!==row.published,updated:row.updated}:null;
  const get=(kind,id)=>unpack(db.prepare('SELECT * FROM records WHERE kind=? AND id=?').get(kind,id));
  const all=()=>db.prepare("SELECT * FROM records WHERE kind!='gallery' OR id='gallery' ORDER BY updated DESC,id").all().map(unpack);
  const published=()=>{
    const data={litters:[],gallery:[]};
    for(const row of db.prepare('SELECT kind,published FROM records WHERE published IS NOT NULL AND archived=0 ORDER BY updated DESC,id').all()) data[row.kind].push(JSON.parse(row.published));
    data.gallery.sort((a,b)=>(b.date||'').localeCompare(a.date||''));return data;
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
  return {db,directory,mediaExists,get,all,published,save,
    addMedia(photo){db.prepare('INSERT INTO media VALUES(?,?,?,?)').run(photo.src,photo.width,photo.height,new Date().toISOString());},
    backup:async()=>{const target=path.join(directory,'backups');mkdirSync(target,{recursive:true,mode:0o700});await backup(db,path.join(target,`content-${new Date().toISOString().slice(0,10)}.sqlite`));},
    close:()=>db.close()};
}
