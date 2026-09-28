import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,readFile,rm} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {createApplication} from '../server.mjs';
import {openStore} from '../store.mjs';
import {hashPassword} from '../auth.mjs';
import {renderSite} from '../../build.mjs';

test('Quick puppy statuses publish only availability, protect drafts and reject stale or unavailable records',async()=>{
  const litters=JSON.parse(await readFile('src/data/litters.json'));
  for(const litter of litters)for(const puppy of litter.puppies)puppy.status='available';
  const dir=await mkdtemp(path.join(os.tmpdir(),'lwl-puppy-status-')),origin='http://127.0.0.1:4194';let failRender=false;
  const {server,store}=await createApplication({dataDir:dir,development:true,adminOrigin:origin,seed:{litters,gallery:[],dogs:[]},renderer:data=>{if(failRender)throw Error('status renderer unavailable');return renderSite(data);}});
  store.db.prepare('INSERT INTO users VALUES(?,?)').run('admin',await hashPassword('test-private'));
  await new Promise(resolve=>server.listen(4194,'127.0.0.1',resolve));let cookie='',csrf='';
  const request=(route,method='GET',data,headers={})=>fetch(origin+route,{method,redirect:'manual',headers:{Origin:origin,Cookie:cookie,'X-CSRF-Token':csrf,...(data?{'Content-Type':'application/json'}:{}),...headers},body:data?JSON.stringify(data):undefined});
  const id=litters[0].id,puppyId=litters[0].puppies[0].id,route=`/api/litters/${id}/puppy-status`;
  const change=(status,extra={},headers={})=>request(route,'POST',{puppyId,status,version:store.get('litters',id).version,...extra},headers);
  try{
    assert.equal((await change('reserved')).status,401);
    const login=await request('/api/login','POST',{username:'admin',password:'test-private'});cookie=login.headers.get('set-cookie').split(';')[0];csrf=(await login.json()).csrf;
    assert.equal((await change('reserved',{}, {'X-CSRF-Token':'bad'})).status,403);
    assert.equal((await change('reserved',{}, {Origin:'https://another.example'})).status,403);
    assert.equal((await change('invalid')).status,400);
    assert.equal((await change('home',{version:'1'})).status,400);
    assert.equal((await change('home',{puppyId:'missing'})).status,404);
    const original=store.published().litters[0];
    let response=await change('reserved');assert.equal(response.status,200);
    let record=(await response.json()).record;assert(!record.dirty);assert.equal(record.publishedPuppies[0].status,'reserved');
    assert.equal((await change('home',{version:record.version-1})).status,409);
    const privateDraft=structuredClone(record.data);privateDraft.title='Private title';privateDraft.puppies[0].name='Private name';privateDraft.puppies[0].price=234567;
    store.save('litters',id,privateDraft,record.version,'draft');
    const before=store.get('litters',id);failRender=true;assert.equal((await change('home')).status,500);failRender=false;
    assert.deepEqual(store.get('litters',id),before);
    assert((await(await request(`/puppies/${id}/`)).text()).includes('puppy-status--reserved'));
    assert.equal((await change('home')).status,200);
    const expected=structuredClone(original);expected.puppies[0].status='home';assert.deepEqual(store.published().litters[0],expected);
    const expectedDraft=structuredClone(before.data);expectedDraft.puppies[0].status='home';assert.deepEqual(store.get('litters',id).data,expectedDraft);
    assert(store.get('litters',id).dirty);assert.equal(store.get('litters',id).publishedPuppies[0].name,original.puppies[0].name);
    for(const language of ['','en/']){const html=await(await request(`/${language}puppies/${id}/`)).text();assert(html.includes('puppy-status--home'));assert(!html.includes('Private name'));assert(!html.includes('234567'));}
    // An unpublished removal must stay private while the visible puppy can still change status.
    record=store.get('litters',id);const removed={...record.data,puppies:record.data.puppies.slice(1)};store.save('litters',id,removed,record.version,'draft');
    assert.equal((await change('available')).status,200);assert(!store.get('litters',id).data.puppies.some(p=>p.id===puppyId));assert.equal(store.published().litters[0].puppies[0].status,'available');
    record=store.get('litters',id);const version=record.version;
    const results=await Promise.all([change('reserved',{version}),change('home',{version})]);assert.deepEqual(results.map(r=>r.status).sort(),[200,409]);
    const noChange=store.get('litters',id);await change(noChange.publishedPuppies[0].status);assert.equal(store.get('litters',id).version,noChange.version);
    record=store.get('litters',id);store.setLitterAvailability(id,record.data,record.version,'close');assert.equal((await change('home')).status,400);assert(store.get('litters',id).closed);
    record=store.get('litters',id);store.setLitterAvailability(id,record.data,record.version,'reopen');
    assert.equal((await change(null)).status,200);assert.equal((await change('home')).status,200);
    record=store.get('litters',id);store.save('litters',id,record.data,record.version,'unpublish');assert.equal((await change('available')).status,400);
    record=store.get('litters',id);store.save('litters',id,record.data,record.version,'archive');assert.equal((await change('available')).status,400);
    record=store.get('litters',id);store.setLitterAvailability(id,record.data,record.version,'reopen');
    assert.equal(store.published().litters[0].puppies[0].status,'home');
    assert(store.db.prepare("SELECT count(*) AS n FROM history WHERE action='puppy-status'").get().n>=5);
  }finally{await new Promise(resolve=>server.close(resolve));}
  const restarted=openStore(dir,{assetDirectory:path.resolve('dist/assets')});
  try{assert.equal(restarted.published().litters[0].puppies[0].status,'home');assert.equal(restarted.get('litters',id).data.title,'Private title');}finally{restarted.close();await rm(dir,{recursive:true,force:true});}
});
