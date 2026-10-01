import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,readFile,rm} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {validateContent} from '../validation.mjs';
import {openStore} from '../store.mjs';
import {litterCover,renderLitterCatalog} from '../../src/render-litters.mjs';
import {renderSite} from '../../build.mjs';

const litters=JSON.parse(await readFile('src/data/litters.json'));
const original=litters[0],cover=original.puppies[1].photos[0];

test('An optional litter cover validates its media and keeps the legacy automatic photo',()=>{
  assert.deepEqual(litterCover(validateContent('litters',original)),original.puppies[0].photos[0]);
  assert.deepEqual(validateContent('litters',{...original,cover}).cover,cover);
  assert.equal(validateContent('litters',{...original,cover:null}).cover,null);
  assert.throws(()=>validateContent('litters',{...original,cover:{...cover,src:'../secret.png'}}),/Фотография/);
  assert.throws(()=>validateContent('litters',{...original,cover:{...cover,width:0}}),/размеры/);
  assert.throws(()=>validateContent('litters',{...original,parents:[],puppies:[],cover},{mediaExists:()=>false}),/Фотография/);
  assert.deepEqual(validateContent('litters',{id:'new-litter',cover}).cover,cover);
});

test('Cover drafts stay private, publish to RU/EN catalogue and link previews, survive restart and reset',async()=>{
  const dir=await mkdtemp(path.join(os.tmpdir(),'lwl-cover-'));
  let store=openStore(dir,{seed:{litters},assetDirectory:path.resolve('dist/assets')});
  try{
    let record=store.get('litters',original.id);
    record=store.save('litters',original.id,{...record.data,cover},record.version,'draft');
    assert.deepEqual(litterCover(store.published().litters[0]),original.puppies[0].photos[0]);
    store.close();store=openStore(dir,{assetDirectory:path.resolve('dist/assets')});
    record=store.get('litters',original.id);assert.deepEqual(record.data.cover,cover);
    record=store.save('litters',original.id,record.data,record.version,'publish');
    const content=store.published(),pages=await renderSite(content);
    for(const prefix of ['','/en']){
      assert(pages.get(prefix+'/puppies/index.html').includes(`src="/assets/${cover.src}"`));
      const page=pages.get(prefix+'/puppies/'+original.id+'/index.html');
      assert(page.includes(`property="og:image" content="https://lifewithlabr.ru/assets/${cover.src}"`));
    }
    assert.deepEqual(content.litters[0].puppies,record.data.puppies);
    assert(renderLitterCatalog([{...content.litters[0],closed:true}]).includes(`src="/assets/${cover.src}"`));
    record=store.save('litters',original.id,{...record.data,cover:null},record.version,'draft');
    assert.deepEqual(litterCover(store.published().litters[0]),cover);
    store.save('litters',original.id,record.data,record.version,'publish');
    assert.deepEqual(litterCover(store.published().litters[0]),original.puppies[0].photos[0]);
  }finally{store.close();await rm(dir,{recursive:true,force:true});}
});
