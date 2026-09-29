import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {renderSite} from '../../build.mjs';

const seed=JSON.parse(await readFile('src/data/litters.json','utf8'))[0];
const graph=html=>JSON.parse(html.match(/<script type="application\/ld\+json">([^]*?)<\/script>/)[1])['@graph'];

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
