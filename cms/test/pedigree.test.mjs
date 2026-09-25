import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp, readFile, rm} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {openStore} from '../store.mjs';
import {validateContent} from '../validation.mjs';
import {editablePedigree, resolvePedigree, visiblePedigree} from '../../dist/pedigree-data.js';
import {renderLitterSlots} from '../../src/render-litters.mjs';
const litters=JSON.parse(await readFile('src/data/litters.json'));

test('Ancestry preserves legacy facts, explicit clearing, partial branches and escaped text',()=>{
  const litter=structuredClone(litters[0]);
  const migrated=validateContent('litters',litter);
  assert.equal(migrated.parents[0].pedigreeTree[0].name,'Никсон Лаб Бонапарт');
  assert.equal(migrated.parents[1].pedigreeTree[1].name,'Русмайрас Смайли');
  assert.deepEqual(resolvePedigree({...litter.parents[0],pedigree:'Старое описание'}),[]);
  const parent=litter.parents[0];
  parent.pedigreeTree=editablePedigree();
  assert.deepEqual(visiblePedigree(parent.pedigreeTree),[]);
  assert(!renderLitterSlots(litter).litterPedigree.includes('Никсон Лаб Бонапарт'));
  parent.pedigreeTree[1].parents[1].parents[1].name='<script>ancestor</script>';
  const visible=visiblePedigree(parent.pedigreeTree);
  assert.equal(visible[0].role,'Мать');
  assert.equal(visible[0].parents[0].parents[0].role,'Мать');
  const markup=renderLitterSlots(validateContent('litters',litter)).litterPedigree;
  assert(markup.includes('&lt;script&gt;ancestor&lt;/script&gt;'));
  assert(!markup.includes('<script>ancestor'));
  assert(markup.includes('Мать · 3-е поколение'));
  assert.equal((markup.match(/class="lineage-children lineage-children--partial"/g)||[]).length,2);
  parent.pedigreeTree[0].parents[0].parents[0].parents=[{name:'Too deep'}];
  assert.throws(()=>validateContent('litters',litter),/трёх поколений/);
  for(const invalid of [{},[null],[{name:7}],[{title:'x'.repeat(501)}],[{parents:{}}],[{},{},{}]]){
    parent.pedigreeTree=invalid;
    assert.throws(()=>validateContent('litters',litter));
  }
});

test('Ancestry draft, publication and restart retain both parent trees without overwriting live data',async()=>{
  const dir=await mkdtemp(path.join(os.tmpdir(),'lwl-pedigree-'));
  let store=openStore(dir,{seed:{litters,gallery:[]},assetDirectory:path.resolve('dist/assets')});
  try{
    const data=structuredClone(litters[0]);
    data.parents.forEach((parent,i)=>{
      parent.pedigreeTree=editablePedigree(resolvePedigree(parent));
      parent.pedigreeTree[1].parents[0].parents[1]={name:`Предок ${i}`,title:'Титул',parents:[]};
    });
    let record=store.save('litters',data.id,data,1,'draft');
    assert.equal(store.published().litters[0].parents[0].pedigreeTree,undefined);
    record=store.save('litters',data.id,record.data,record.version,'publish');
    store.close();store=openStore(dir);
    assert.deepEqual(store.published().litters[0].parents,record.data.parents);
    assert(renderLitterSlots(store.published().litters[0]).litterPedigree.includes('<h4>Предок 1</h4>'));
  }finally{store.close();await rm(dir,{recursive:true,force:true});}
});
