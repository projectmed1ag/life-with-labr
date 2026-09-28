import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,readFile,rm} from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import {openStore} from '../store.mjs';
import {validateContent} from '../validation.mjs';
import {createApplication} from '../server.mjs';
import {hashPassword} from '../auth.mjs';
import {renderSite} from '../../build.mjs';
const dogs=JSON.parse(await readFile('src/data/dogs.json'));
const assetDirectory=path.resolve('dist/assets');

test('Dog import upgrades an existing database once and preserves edits, archives, photos and ancestry',async()=>{
 const dir=await mkdtemp(path.join(os.tmpdir(),'lwl-dogs-'));
 let store=openStore(dir,{seed:{litters:[],gallery:[]},assetDirectory});store.close();
 store=openStore(dir,{seed:{dogs},assetDirectory});
 try{
  assert.deepEqual(store.published().dogs,dogs);
  let row=store.get('dogs','edel');const edited={...row.data,name:'Изменённая кличка'};
  row=store.save('dogs','edel',edited,row.version,'draft');
  assert.equal(store.published().dogs[0].name,'Эдель');
  assert.throws(()=>store.save('dogs','edel',edited,1,'publish'),/другой вкладке/);
  row=store.save('dogs','edel',edited,row.version,'publish');
  assert.equal(store.published().dogs[0].name,edited.name);
  store.save('dogs','edel',edited,row.version,'archive');
  store.close();store=openStore(dir,{seed:{dogs},assetDirectory});
  assert.equal(store.all().filter(r=>r.kind==='dogs').length,4);
  assert.equal(store.published().dogs.length,3);
  row=store.get('dogs','edel');assert(row.archived);assert.equal(row.data.photos[0].src,'edel.jpg');assert.equal(row.data.pedigreeTree[0].name,'Никсон Лаб Бонапарт');
  row=store.save('dogs','edel',row.data,row.version,'restore');assert(!row.published);
  row=store.save('dogs','edel',{...row.data,pedigreeTree:[]},row.version,'publish');
  assert.deepEqual(store.published().dogs[0].pedigreeTree,[]);
 }finally{store.close();await rm(dir,{recursive:true,force:true});}
});

test('Dog validation rejects unsafe assets and incomplete publication but accepts a minimal draft',()=>{
 const minimal={id:'new-dog',name:'',sex:'female',photos:[]};
 assert.equal(validateContent('dogs',minimal).name,'');
 assert.throws(()=>validateContent('dogs',minimal,{publish:true}),/Кличка/);
 assert.throws(()=>validateContent('dogs',{...minimal,name:'Новая'},{publish:true}),/фотографию/);
 assert.throws(()=>validateContent('dogs',{...dogs[0],photos:[{...dogs[0].photos[0],src:'../secret.jpg'}]}),/Фотография/);
 assert.throws(()=>validateContent('dogs',{...dogs[0],birthDate:'2024-02-31'}),/дату/);
 assert.throws(()=>validateContent('dogs',{...dogs[0],order:1.5}),/Порядок/);
 assert.throws(()=>validateContent('dogs',{...dogs[0],health:[{title:'',value:'clear'}]},{publish:true}),/название/);
});

test('Dog create, draft, publish, archive and restore update public pages, ordering and sitemap with auth and rollback',async()=>{
 const dir=await mkdtemp(path.join(os.tmpdir(),'lwl-dogs-http-')),origin='http://127.0.0.1:4191';let failRender=false;
 const {server,store}=await createApplication({dataDir:dir,development:true,adminOrigin:origin,seed:{dogs,litters:[],gallery:[]},renderer:data=>{if(failRender)throw new Error('dog renderer unavailable');return renderSite(data);}});
 store.db.prepare('INSERT INTO users VALUES(?,?)').run('admin',await hashPassword('test-private'));
 await new Promise(resolve=>server.listen(4191,'127.0.0.1',resolve));let cookie='',csrf='';
 const request=(route,method='GET',data,headers={})=>fetch(origin+route,{method,redirect:'manual',headers:{Origin:origin,Cookie:cookie,'X-CSRF-Token':csrf,...(data?{'Content-Type':'application/json'}:{}),...headers},body:data?JSON.stringify(data):undefined});
 try{
  assert.equal((await request('/api/content/dogs/new-dog','PUT',{})).status,401);
  const login=await request('/api/login','POST',{username:'admin',password:'test-private'});cookie=login.headers.get('set-cookie').split(';')[0];csrf=(await login.json()).csrf;
  const d={...structuredClone(dogs[0]),id:'new-dog',name:'Новая <img src=x onerror=alert(1)>',order:1,photos:[...dogs[0].photos,...dogs[1].photos],titles:[{title:'Титул <script>',description:'Описание &'}],health:[{title:'Тест',value:'Результат'}]};
  const save=(action,version,data=d,headers={})=>request('/api/content/dogs/new-dog','PUT',{data,action,version},headers);
  assert.equal((await save('draft',0,d,{'X-CSRF-Token':'bad'})).status,403);
  assert.equal((await save('draft',0)).status,200);assert.equal((await request('/dogs/new-dog/')).status,404);
  assert(!(await (await request('/dogs/')).text()).includes('/dogs/new-dog/'));
  assert.equal((await save('publish',1)).status,200);
  let html=await (await request('/dogs/new-dog/')).text();assert(html.includes('Новая &lt;img'));assert(html.includes('Титул &lt;script&gt;'));assert(!html.includes('<img src=x'));assert(html.includes('Никсон Лаб Бонапарт'));assert(html.includes('data-gallery="1"'));assert(html.includes('<dt>Тест</dt><dd>Результат</dd>'));
  const listing=await (await request('/dogs/')).text();assert(listing.indexOf('/dogs/new-dog/')>listing.indexOf('/dogs/aria/'));assert.equal(store.get('dogs','new-dog').data.order,50);
  assert((await (await request('/sitemap.xml')).text()).includes('/en/dogs/new-dog/'));assert.equal((await request('/en/dogs/new-dog/')).status,200);
  assert.equal((await save('draft',2,{...d,name:'Не опубликовано'})).status,200);assert(!(await (await request('/dogs/new-dog/')).text()).includes('Не опубликовано'));
  failRender=true;assert.equal((await save('publish',3)).status,500);failRender=false;assert.equal(store.get('dogs','new-dog').version,3);
  assert.equal((await save('unpublish',3)).status,200);assert.equal((await request('/dogs/new-dog/')).status,404);
  assert.equal((await save('archive',4)).status,200);
  for(const [route,target] of [['/dogs/new-dog/','/dogs/'],['/en/dogs/new-dog/','/en/dogs/']]){const r=await request(route);assert.equal(r.status,302);assert.equal(r.headers.get('location'),target);}
  assert(!(await (await request('/sitemap.xml')).text()).includes('/dogs/new-dog/'));
  assert.equal((await save('restore',5)).status,200);assert.equal((await request('/dogs/new-dog/')).status,404);
  assert.equal((await save('publish',6)).status,200);assert.equal((await request('/dogs/new-dog/')).status,200);
 }finally{await new Promise(resolve=>server.close(resolve));await rm(dir,{recursive:true,force:true});}
});

test('List ordering is authenticated, atomic, persists and never publishes pending dog edits',async()=>{
 const dir=await mkdtemp(path.join(os.tmpdir(),'lwl-dog-order-')),origin='http://127.0.0.1:4192';let failRender=false;
 const {server,store}=await createApplication({dataDir:dir,development:true,adminOrigin:origin,seed:{dogs,litters:[],gallery:[]},renderer:data=>{if(failRender)throw new Error('order renderer unavailable');return renderSite(data);}});
 store.db.prepare('INSERT INTO users VALUES(?,?)').run('admin',await hashPassword('test-private'));
 await new Promise(resolve=>server.listen(4192,'127.0.0.1',resolve));let cookie='',csrf='';
 const request=(route,method='GET',data,headers={})=>fetch(origin+route,{method,headers:{Origin:origin,Cookie:cookie,'X-CSRF-Token':csrf,...(data?{'Content-Type':'application/json'}:{}),...headers},body:data?JSON.stringify(data):undefined});
 const items=ids=>ids.map(id=>({id,version:store.get('dogs',id).version}));
 try{
  assert.equal((await request('/api/dogs/reorder','POST',{items:[]})).status,401);
  const login=await request('/api/login','POST',{username:'admin',password:'test-private'});cookie=login.headers.get('set-cookie').split(';')[0];csrf=(await login.json()).csrf;
  let edel=store.get('dogs','edel');store.save('dogs','edel',{...edel.data,name:'Private edit'},edel.version,'draft');
  const aria=store.get('dogs','aria');store.save('dogs','aria',aria.data,aria.version,'archive');
  store.save('dogs','hidden-dog',{...dogs[0],name:'Private draft'},0,'draft');
  const ordered=items(['mars','hidden-dog','edel','vanessa']);
  assert.equal((await request('/api/dogs/reorder','POST',{items:ordered},{'X-CSRF-Token':'bad'})).status,403);
  assert.equal((await request('/api/dogs/reorder','POST',{items:[...ordered,ordered[0]]})).status,400);
  assert.equal((await request('/api/dogs/reorder','POST',{items:ordered.slice(1)})).status,409);
  const before=store.all();failRender=true;
  assert.equal((await request('/api/dogs/reorder','POST',{items:ordered})).status,500);failRender=false;
  assert.deepEqual(store.all(),before);
  assert.equal((await request('/api/dogs/reorder','POST',{items:ordered})).status,200);
  assert.deepEqual(store.published().dogs.map(d=>d.id),['mars','edel','vanessa']);
  assert.equal(store.get('dogs','edel').data.name,'Private edit');assert(store.get('dogs','edel').dirty);
  assert.equal(store.published().dogs.find(d=>d.id==='edel').name,'Эдель');
  assert(!store.get('dogs','mars').dirty);assert(!store.get('dogs','hidden-dog').published);assert(store.get('dogs','aria').archived);
  const html=await (await request('/dogs/')).text();assert(html.indexOf('/dogs/mars/')<html.indexOf('/dogs/edel/'));assert(!html.includes('Private edit'));assert(!html.includes('Private draft'));
  assert.equal((await request('/api/dogs/reorder','POST',{items:ordered})).status,409);
  edel=store.get('dogs','edel');
  assert.equal((await request('/api/content/dogs/edel','PUT',{action:'draft',version:edel.version,data:{...edel.data,order:1}})).status,200);assert.equal(store.get('dogs','edel').data.order,30);
  assert.equal((await request('/api/content/dogs/last-dog','PUT',{action:'draft',version:0,data:{...dogs[0],id:'last-dog',order:1}})).status,200);assert.equal(store.get('dogs','last-dog').data.order,50);
 }finally{await new Promise(resolve=>server.close(resolve));}
 const reopened=openStore(dir,{seed:{dogs},assetDirectory});
 try{assert.deepEqual(reopened.published().dogs.map(d=>d.id),['mars','edel','vanessa']);assert.equal(reopened.get('dogs','edel').data.name,'Private edit');}finally{reopened.close();await rm(dir,{recursive:true,force:true});}
});
