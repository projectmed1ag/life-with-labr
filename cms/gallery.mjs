// Keep the previous records in the database and history so the migration is recoverable.
export function migrateGallery(db) {
  if(!db.prepare('SELECT 1 FROM meta WHERE key=?').get('seeded') || db.prepare('SELECT 1 FROM meta WHERE key=?').get('gallery-singleton-v1')) return;
  db.exec('BEGIN IMMEDIATE');
  try {
    const rows=db.prepare("SELECT * FROM records WHERE kind='gallery' AND archived=0 ORDER BY updated DESC,id").all();
    const merged=field=>({id:'gallery',title:'',text:'',date:null,photos:rows.filter(row=>row[field]).map(row=>JSON.parse(row[field]))
      .sort((a,b)=>(b.date||'').localeCompare(a.date||''))
      .flatMap(record=>record.photos.map(photo=>({...photo,alt:photo.alt||record.title||''})))});
    const updated=new Date().toISOString();
    for(const row of rows) db.prepare('INSERT INTO history(kind,id,action,previous,created) VALUES(?,?,?,?,?)').run('gallery',row.id,'merge-gallery',JSON.stringify(row),updated);
    db.prepare("UPDATE records SET archived=1,published=NULL WHERE kind='gallery' AND archived=0").run();
    db.prepare(`INSERT INTO records(kind,id,draft,published,version,archived,updated) VALUES('gallery','gallery',?,?,1,0,?)
      ON CONFLICT(kind,id) DO UPDATE SET draft=excluded.draft,published=excluded.published,version=records.version+1,archived=0,updated=excluded.updated`)
      .run(JSON.stringify(merged('draft')),JSON.stringify(merged('published')),updated);
    db.prepare('INSERT INTO meta VALUES(?,?)').run('gallery-singleton-v1','1');
    db.exec('COMMIT');
  } catch(error) {db.exec('ROLLBACK');throw error;}
}
