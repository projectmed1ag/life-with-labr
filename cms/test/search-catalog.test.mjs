import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {renderSite} from '../../build.mjs';

const seed=JSON.parse(await readFile('src/data/litters.json','utf8'))[0];
const dogs=JSON.parse(await readFile('src/data/dogs.json','utf8'));
const graph=html=>JSON.parse(html.match(/<script type="application\/ld\+json">([^]*?)<\/script>/)[1])['@graph'];

test('Search metadata remains concise with a large litter or a long dog description',async()=>{
  const litter=structuredClone(seed);
  litter.puppies=Array.from({length:12},(_,i)=>({...structuredClone(seed.puppies[0]),id:`puppy-${i}`,name:`Щенок ${i}`}));
  const dog={...structuredClone(dogs[0]),summary:'Описание собаки. '.repeat(100)};
  const pages=await renderSite({litters:[litter],dogs:[dog],gallery:[]});
  for(const route of [`/puppies/${litter.id}/`,`/dogs/${dog.id}/`]){
    const html=pages.get(`${route}index.html`),data=graph(html);
    const meta=html.match(/name="description" content="([^"]+)"/)[1];
    assert(meta.length<=180);
    assert.match(html.match(/<title>(.*?)<\/title>/)[1],/лабрадор/i);
    assert.equal(data.find(item=>item['@id'].endsWith('#webpage'))['@type'],'WebPage');
    assert.match(html,/<nav class="footer-nav"[^]*?href="\/about\/"/);
  }
});

test('Search catalogue lists only public litter pages, in both languages, for any litter count',async()=>{
  const litters=[
    {...structuredClone(seed),id:'first',title:'Помёт <script> & первый'},
    {...structuredClone(seed),id:'sold',closed:true},
    {...structuredClone(seed),id:'second'},
    {...structuredClone(seed),id:'third'}
  ];
  const pages=await renderSite({litters,dogs:[],gallery:[]});
  for(const prefix of ['','/en']){
    const route=`${prefix}/puppies/`,html=pages.get(`${route}index.html`);
    const entries=graph(html),list=entries.find(item=>item['@type']==='ItemList');
    assert.equal(list.numberOfItems,3);
    assert.deepEqual(list.itemListElement.map(item=>[item.position,item.url]),['first','second','third'].map((id,index)=>[index+1,`https://lifewithlabr.ru${route}${id}/`]));
    assert.equal(list.itemListElement[0].name,litters[0].title);
    assert(!html.includes('<script> & первый'));
    assert.equal(entries.find(item=>item['@type']==='CollectionPage').mainEntity['@id'],list['@id']);
    for(const item of list.itemListElement)assert(html.includes(`href="${new URL(item.url).pathname}"`));
    assert(!pages.has(`${route}sold/index.html`));
  }
});

test('An empty or fully sold catalogue never advertises a closed litter to search',async()=>{
  for(const litters of [[],[{...structuredClone(seed),closed:true}]]){
    const pages=await renderSite({litters,dogs:[],gallery:[]});
    for(const prefix of ['','/en']){
      const html=pages.get(`${prefix}/puppies/index.html`);
      const list=graph(html).find(item=>item['@type']==='ItemList');
      assert.equal(list.numberOfItems,0);
      assert.deepEqual(list.itemListElement,[]);
      assert(!html.includes('"@type":"Offer"'));
    }
  }
});
