import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,readFile,rm} from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import sharp from 'sharp';
import http from 'node:http';
import {openStore} from '../store.mjs';
import {hashPassword,verifyPassword} from '../auth.mjs';
import {validateContent} from '../validation.mjs';
import {createApplication} from '../server.mjs';
const litters=JSON.parse(await readFile('src/data/litters.json'));
const gallery=JSON.parse(await readFile('src/data/gallery.json'));
const seed={litters,gallery};
test('Password verification and malformed dates',async()=>{
  const encoded=await hashPassword('qa-private-password');assert(!encoded.includes('qa-private-password'));
  assert(await verifyPassword('qa-private-password',encoded));assert.equal(await verifyPassword('wrong',encoded),false);
  for(const date of ['not-date','2026-99-99','2026-02-31'])assert.throws(()=>validateContent('gallery',{id:'one',title:'Test',date,photos:[]}),/дату/);
});
test('Initialization, draft isolation, conflicts, archive and restart',async()=>{
  const dir=await mkdtemp(path.join(os.tmpdir(),'lwl-store-'));
  let store=openStore(dir);store.close(); // Initializing an account must not prevent seeding.
  store=openStore(dir,{seed,assetDirectory:path.resolve('dist/assets')});
  try{
    assert.equal(store.published().litters.length,1);
    const draft=structuredClone(litters[0]);draft.title='Changed';draft.puppies[0].price=90000;
    let row=store.save('litters',draft.id,draft,1,'draft');assert.equal(store.published().litters[0].title,litters[0].title);
    assert.throws(()=>store.save('litters',draft.id,draft,1,'publish'),/другой вкладке/);
    row=store.save('litters',draft.id,draft,row.version,'publish');assert.equal(store.published().litters[0].puppies[0].price,90000);
    row=store.save('litters',draft.id,draft,row.version,'archive');assert.equal(store.published().litters.length,0);
    row=store.save('litters',draft.id,draft,row.version,'restore');assert.equal(row.archived,false);assert.equal(store.published().litters.length,0);
    store.save('litters',draft.id,draft,row.version,'publish');await store.backup();store.close();store=openStore(dir,{seed});assert.equal(store.published().litters[0].title,'Changed');
  }finally{store.close();await rm(dir,{recursive:true,force:true});}
});
test('HTTP auth, CSRF, photos, publication and dynamic routes',async()=>{
  const dir=await mkdtemp(path.join(os.tmpdir(),'lwl-http-'));
  const origin='http://127.0.0.1:4189';
  const {server,store}=await createApplication({dataDir:dir,adminOrigin:origin,development:true,seed});
  store.db.prepare('INSERT INTO users VALUES(?,?)').run('admin',await hashPassword('qa-private-password'));
  await new Promise(resolve=>server.listen(4189,'127.0.0.1',resolve));
  let cookie='',csrf='';
  const request=(route,method='GET',data,overrides={})=>fetch(origin+route,{method,headers:{Origin:origin,Cookie:cookie,'X-CSRF-Token':csrf,...(data?{'Content-Type':'application/json'}:{}),...overrides},body:data?JSON.stringify(data):undefined,redirect:'manual'});
  try{
    assert.equal((await request('/api/content')).status,401);
    assert.equal((await request('/api/login','POST',{username:'admin',password:'wrong'})).status,401);
    const login=await request('/api/login','POST',{username:'admin',password:'qa-private-password'});assert.equal(login.status,200);cookie=login.headers.get('set-cookie').split(';')[0];csrf=(await login.json()).csrf;
    assert(login.headers.get('set-cookie').includes('HttpOnly'));
    assert.equal((await request('/api/content')).status,200);
    assert.equal((await request('/api/logout','POST',{}, {Origin:'https://evil.example'})).status,403);
    assert.equal((await request('/api/logout','POST',{}, {'X-CSRF-Token':'bad'})).status,403);
    const draft=structuredClone(litters[0]);draft.id='new-litter';draft.title='Новый помёт';draft.puppies[0].status='home';draft.puppies[0].price=95000;
    let response=await request('/api/content/litters/new-litter','PUT',{data:draft,version:0,action:'draft'});assert.equal(response.status,200);
    assert.equal((await request('/puppies/new-litter/')).status,404);
    response=await request('/api/content/litters/new-litter','PUT',{data:draft,version:1,action:'publish'});assert.equal(response.status,200);
    const html=await (await request('/puppies/new-litter/')).text();assert(html.includes('Уехала в новую семью'));assert(html.includes('puppy-price'));assert(!html.includes('data-puppy-inquiry="avrora"'));
    const changed=structuredClone(draft);changed.title='<img src=x onerror=alert(1)>';
    assert.equal((await request('/api/content/litters/new-litter','PUT',{data:changed,version:2,action:'publish'})).status,200);
    const escaped=await (await request('/puppies/new-litter/')).text();assert(escaped.includes('&lt;img src=x onerror=alert(1)&gt;'));
    const bytes=await sharp({create:{width:32,height:24,channels:3,background:'#ffffff'}}).png().toBuffer();
    const uploaded=await fetch(origin+'/api/upload',{method:'POST',headers:{Origin:origin,Cookie:cookie,'X-CSRF-Token':csrf},body:bytes});assert.equal(uploaded.status,201);const photo=await uploaded.json();assert.equal(photo.width,32);assert(photo.src.endsWith('.webp'));assert.equal((await request('/assets/'+photo.src)).status,200);
    assert.equal((await fetch(origin+'/api/upload',{method:'POST',headers:{Origin:origin,Cookie:cookie,'X-CSRF-Token':csrf},body:'<svg></svg>'})).status,400);
    assert.equal((await request('/assets/fonts/font-0.ttf')).status,200);assert.equal((await request('/admin/admin.js')).status,200);assert.equal((await request('/.env')).status,404);
    assert.equal((await request('/moments/')).status,308);
    assert.equal((await request('/api/content/litters/new-litter','PUT',{data:changed,version:3,action:'archive'})).status,200);assert.equal((await request('/puppies/new-litter/')).status,404);
    assert.equal((await request('/api/logout','POST',{})).status,200);assert.equal((await request('/api/content')).status,401);
  }finally{await new Promise(resolve=>server.close(resolve));await rm(dir,{recursive:true,force:true});}
});
test('Failed rendering leaves the published record unchanged; production admin is host-isolated',async()=>{
  const dir=await mkdtemp(path.join(os.tmpdir(),'lwl-atomic-'));
  const adminOrigin='https://admin.example.test';
  const renderer=async content=>{if(content.gallery.some(post=>post.title==='FAIL'))throw new Error('Intentional renderer failure');return new Map([['/index.html','old-public-version']]);};
  const {server,store}=await createApplication({dataDir:dir,adminOrigin,seed,renderer});
  store.db.prepare('INSERT INTO users VALUES(?,?)').run('admin',await hashPassword('qa-private-password'));
  await new Promise(resolve=>server.listen(4191,'127.0.0.1',resolve));
  const base='http://127.0.0.1:4191';
  // Explicit Host headers need node:http: fetch normalizes them to its URL host.
  const request=(url,options={})=>new Promise((resolve,reject)=>{const req=http.request(url,{method:options.method||'GET',headers:options.headers},res=>{const chunks=[];res.on('data',chunk=>chunks.push(chunk));res.on('end',()=>resolve(new Response(Buffer.concat(chunks),{status:res.statusCode,headers:res.headers})));});req.on('error',reject);req.end(options.body);});
  try{
    assert.equal((await request(base+'/api/content',{headers:{Host:'example.test'}})).status,404);
    const login=await request(base+'/api/login',{method:'POST',headers:{Host:'admin.example.test',Origin:adminOrigin,'Content-Type':'application/json'},body:JSON.stringify({username:'admin',password:'qa-private-password'})});
    assert.equal(login.status,200);assert(login.headers.get('set-cookie').includes('__Host-lwl_session='));assert(login.headers.get('set-cookie').includes('; Secure'));
    const cookie=login.headers.get('set-cookie').split(';')[0],{csrf}=await login.json();
    const before=store.get('gallery',gallery[0].id);
    const response=await request(base+'/api/content/gallery/'+gallery[0].id,{method:'PUT',headers:{Host:'admin.example.test',Origin:adminOrigin,Cookie:cookie,'X-CSRF-Token':csrf,'Content-Type':'application/json'},body:JSON.stringify({data:{...gallery[0],title:'FAIL'},version:before.version,action:'publish'})});
    assert.equal(response.status,500);assert.deepEqual(store.get('gallery',gallery[0].id),before);
    assert.equal(await (await request(base+'/',{headers:{Host:'example.test'}})).text(),'old-public-version');
  }finally{await new Promise(resolve=>server.close(resolve));await rm(dir,{recursive:true,force:true});}
});
