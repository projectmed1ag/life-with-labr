import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,readFile,rm} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {createApplication} from '../server.mjs';
import {openStore} from '../store.mjs';
import {hashPassword} from '../auth.mjs';
import {renderSite} from '../../build.mjs';
const litters=JSON.parse(await readFile('src/data/litters.json'));

test('Sold litters retain their catalogue card, close all detail routes and can reopen without publishing drafts',async()=>{
 const dir=await mkdtemp(path.join(os.tmpdir(),'lwl-litter-close-')),origin='http://127.0.0.1:4193';let failRender=false;
 const {server,store}=await createApplication({dataDir:dir,development:true,adminOrigin:origin,seed:{litters,gallery:[],dogs:[]},renderer:data=>{if(failRender)throw new Error('availability renderer unavailable');return renderSite(data);}});
 store.db.prepare('INSERT INTO users VALUES(?,?)').run('admin',await hashPassword('test-private'));
 await new Promise(resolve=>server.listen(4193,'127.0.0.1',resolve));let cookie='',csrf='';
 const request=(route,method='GET',data,headers={})=>fetch(origin+route,{method,redirect:'manual',headers:{Origin:origin,Cookie:cookie,'X-CSRF-Token':csrf,...(data?{'Content-Type':'application/json'}:{}),...headers},body:data?JSON.stringify(data):undefined});
 const id=litters[0].id,url='/api/content/litters/'+id;
 const change=(action,overrides={},headers={})=>{const record=store.get('litters',id);return request(url,'PUT',{data:record.data,version:record.version,action,...overrides},headers);};
 try{
  assert.equal((await change('close')).status,401);
  const login=await request('/api/login','POST',{username:'admin',password:'test-private'});cookie=login.headers.get('set-cookie').split(';')[0];csrf=(await login.json()).csrf;
  assert.equal((await change('close',{}, {'X-CSRF-Token':'bad'})).status,403);
  assert.equal((await change('close')).status,200);assert(!store.get('litters',id).dirty);
  assert.equal((await change('reopen')).status,200);assert(!store.get('litters',id).dirty);
  const unpublished={...store.get('litters',id).data,title:'Private draft title'};
  assert.equal((await change('draft',{data:unpublished})).status,200);
  const before=store.get('litters',id),original=store.published().litters[0];failRender=true;
  assert.equal((await change('close')).status,500);failRender=false;assert.deepEqual(store.get('litters',id),before);
  assert.equal((await change('close')).status,200);
  const closed=store.get('litters',id);assert(closed.closed&&closed.published&&closed.canReopen&&!closed.archived&&closed.dirty);
  assert.equal((await change('reopen',{version:before.version})).status,409);
  for(const language of ['','en/']){
   const html=await (await request('/'+language+'puppies/')).text();
   assert(html.includes('litter-sold-ribbon'));assert(html.includes('catalog-'+id+'-title'));assert(!html.includes('Private draft title'));
   assert(!html.includes(`href="/${language}puppies/${id}/"`));assert(!html.includes('litter-card-link'));
   assert(html.includes(language?'All puppies are sold':'Все щенки проданы'));
   for(const suffix of ['','/','/index.html']){
    const response=await request('/'+language+'puppies/'+id+suffix);assert.equal(response.status,302);assert.equal(response.headers.get('location'),'/'+language+'puppies/');assert.equal(response.headers.get('cache-control'),'no-store');
   }
  }
  assert(!(await (await request('/sitemap.xml')).text()).includes('/puppies/'+id+'/'));
  assert.deepEqual(store.published().litters[0].puppies,original.puppies);
  failRender=true;assert.equal((await change('reopen')).status,500);failRender=false;assert.deepEqual(store.get('litters',id),closed);
  assert.equal((await change('reopen')).status,200);assert.equal((await request('/puppies/'+id+'/')).status,200);
  assert.equal(store.published().litters[0].title,original.title);assert(store.get('litters',id).dirty);
  assert((await (await request('/sitemap.xml')).text()).includes('/puppies/'+id+'/'));
  // Old "all puppies sold" actions archived the record. Recover the last public snapshot,
  // preserving later edits as a private draft rather than publishing them by accident.
  assert.equal((await change('archive')).status,200);assert(store.get('litters',id).canReopen);
  assert.equal((await change('reopen')).status,200);assert.equal(store.published().litters[0].title,original.title);
  assert.equal(store.get('litters',id).data.title,unpublished.title);assert(!store.get('litters',id).archived);
  assert.equal((await change('close')).status,200);
  assert.equal((await change('publish')).status,200);assert.equal((await request('/puppies/'+id+'/')).status,302);
 }finally{await new Promise(resolve=>server.close(resolve));}
 const reopened=openStore(dir,{seed:{litters},assetDirectory:path.resolve('dist/assets')});
 try{assert(reopened.get('litters',id).closed);assert(reopened.published().litters[0].closed);assert(!reopened.get('litters',id).archived);}finally{reopened.close();await rm(dir,{recursive:true,force:true});}
});
