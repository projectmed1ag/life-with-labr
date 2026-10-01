import test from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {randomUUID} from 'node:crypto';
import {mkdtemp,rm} from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import {openVisitors, moscowDay, visitorPage} from '../visitors.mjs';
import {createApplication} from '../server.mjs';
import {hashPassword} from '../auth.mjs';
import {installVisitorCounter} from '../../dist/visitor-counter.js';

test('Unique browsers across pages/days, per-litter counts, and Moscow midnight',()=>{
  const db=new DatabaseSync(':memory:');db.exec('CREATE TABLE meta(key TEXT PRIMARY KEY,value TEXT NOT NULL)');
  let time=Date.parse('2026-10-01T20:59:00Z');
  const counter=openVisitors(db,()=>time),a=randomUUID(),b=randomUUID(),c=randomUUID();
  assert.equal(counter.report('yesterday').collecting,false);
  assert.equal(counter.report('today').collecting,true);
  counter.record(a,'/');counter.record(a,'/puppies/');counter.record(a,'/puppies/first/');counter.record(a,'/puppies/first/');
  counter.record(b,'/puppies/second/');
  assert.deepEqual([counter.report().site,counter.report().puppies,counter.report().litters],[2,1,2]);
  assert.equal(db.prepare("SELECT views FROM visitor_days WHERE page='/puppies/first/'").get().views,1);
  time+=120000;
  assert.equal(moscowDay(time),'2026-10-02');
  counter.record(a,'/puppies/second/');counter.record(c,'/');
  const report=counter.report('week',[{id:'first',title:'Первый'},{id:'second',title:'Второй'},{id:'empty',title:'Новый'}]);
  assert.equal(report.site,3);assert.equal(report.litters,2);
  assert.deepEqual(report.byLitter.map(r=>r.visitors),[1,2,0]);
  assert.equal(counter.report('yesterday').site,2);
  assert.equal(counter.report('today').site,2);
  assert(!JSON.stringify(report).includes(a));
  assert.equal(db.prepare('SELECT count(*) AS n FROM visitor_days WHERE visitor=?').get(a).n,0);
  time+=91*86400000;assert.equal(counter.report().site,0);
  assert.equal(db.prepare('SELECT count(*) AS n FROM visitor_days').get().n,0);db.close();
});

test('Tracking stores normalized page paths without queries or private URLs',()=>{
  assert.equal(visitorPage('/en/puppies/edel-enot/'),'/puppies/edel-enot/');
  for(const page of ['/puppies/?secret=a','https://evil.example/','/../../secret','/a#b','//puppies/','/UPPER/'])assert.equal(visitorPage(page),null);
});

test('Collector validates origin, route, method and auth; skips bots and persists counts',async()=>{
  const dir=await mkdtemp(path.join(os.tmpdir(),'lwl-visitors-'));
  const origin='http://127.0.0.1:4193';
  const renderer=async()=>new Map([['/index.html','home'],['/puppies/index.html','puppies'],['/puppies/test/index.html','test'],['/en/puppies/test/index.html','test']]);
  const {server,store}=await createApplication({dataDir:dir,adminOrigin:origin,development:true,seed:{litters:[],gallery:[]},renderer});
  store.db.prepare('INSERT INTO users VALUES(?,?)').run('admin',await hashPassword('local-only-test'));
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const endpoint=`http://127.0.0.1:${server.address().port}`;
  const visitor=randomUUID();
  const send=(page,headers={},id=visitor)=>fetch(endpoint+'/visit',{method:'POST',headers:{Origin:origin,'Content-Type':'application/json',...headers},body:JSON.stringify({visitor:id,page})});
  try{
    assert.equal((await fetch(endpoint+'/api/visitors')).status,401);
    assert.equal((await send('/')).status,204);
    assert.equal((await send('/en/puppies/test/')).status,204);
    assert.equal((await send('/puppies/test/')).status,204);
    assert.equal((await send('/puppies/',{'User-Agent':'Googlebot'},randomUUID())).status,204);
    assert.equal((await send('/puppies/',{Origin:'https://evil.example'})).status,403);
    assert.equal((await send('/puppies/',{},'not-a-browser')).status,400);
    for(const page of ['/admin/','/puppies/missing/','/puppies/?private=true'])assert.equal((await send(page)).status,400);
    const login=await fetch(endpoint+'/api/login',{method:'POST',headers:{Origin:origin,'Content-Type':'application/json'},body:JSON.stringify({username:'admin',password:'local-only-test'})});
    const Cookie=login.headers.get('set-cookie').split(';')[0];
    const stats=await (await fetch(endpoint+'/api/visitors',{headers:{Cookie}})).json();
    assert.equal(stats.site,1);assert.equal(stats.puppies,0);assert.equal(stats.litters,1);
    assert.equal((await fetch(endpoint+'/api/visitors?period=invalid',{headers:{Cookie}})).status,400);
    const rows=store.db.prepare('SELECT * FROM visitor_days').all();assert.equal(rows.length,2);
    const reopened=openVisitors(store.db);assert.equal(reopened.report().site,1);assert.equal(reopened.report().startedAt,stats.startedAt);
  }finally{await new Promise(resolve=>server.close(resolve));await rm(dir,{recursive:true,force:true});}
});

function browser(url='https://lifewithlabr.ru/puppies/',storage=new Map()){
  const calls=[],handlers=new Map();
  const win={location:new URL(url),navigator:{},crypto:{randomUUID},localStorage:{getItem:key=>storage.get(key),setItem:(key,value)=>storage.set(key,value)},fetch:(...args)=>{calls.push(args);return Promise.resolve();}};
  const doc={visibilityState:'visible',addEventListener:(key,fn)=>handlers.set(key,fn),removeEventListener:key=>handlers.delete(key)};
  return {win,doc,calls,handlers};
}
test('Counter reuses one browser identity, ignores private URL parameters and initializes once',()=>{
  const storage=new Map(),a=browser('https://lifewithlabr.ru/puppies/?secret=yes#photo',storage),b=browser('https://lifewithlabr.ru/',storage);
  assert(installVisitorCounter(a.win,a.doc));assert(!installVisitorCounter(a.win,a.doc));assert(installVisitorCounter(b.win,b.doc));
  assert.equal(a.calls.length,1);
  const event=JSON.parse(a.calls[0][1].body);assert.equal(event.page,'/puppies/');
  assert.equal(event.visitor,JSON.parse(b.calls[0][1].body).visitor);
  assert.equal(a.calls[0][1].credentials,'omit');
});
test('Local/admin/automated/hidden pages and blocked storage do not inflate visitors',()=>{
  for(const url of ['https://admin.lifewithlabr.ru/','http://localhost/','https://lifewithlabr.ru/admin/']){const b=browser(url);assert(!installVisitorCounter(b.win,b.doc));assert.equal(b.calls.length,0);}
  const automated=browser();automated.win.navigator.webdriver=true;assert(!installVisitorCounter(automated.win,automated.doc));
  const blocked=browser();blocked.win.localStorage.getItem=()=>{throw Error('Blocked');};assert.doesNotThrow(()=>installVisitorCounter(blocked.win,blocked.doc));assert.equal(blocked.calls.length,0);
  const hidden=browser();hidden.doc.visibilityState='hidden';installVisitorCounter(hidden.win,hidden.doc);assert.equal(hidden.calls.length,0);
  hidden.doc.visibilityState='visible';hidden.handlers.get('visibilitychange')();assert.equal(hidden.calls.length,1);assert.equal(hidden.handlers.size,0);
});
