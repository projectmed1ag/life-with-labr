import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve('dist');
const routes = ['index.html','about.html','dogs.html','puppies.html','moments.html'];
const pages = new Map(routes.map(route => [route, fs.readFileSync(path.join(root, route), 'utf8')]));
const titles = new Set();
for (const [route, html] of pages) {
  assert.equal([...html.matchAll(/<h1(?:\s|>)/g)].length, 1, `${route}: one main heading`);
  assert(!html.includes('{{'), `${route}: unresolved template`);
  assert(!html.includes('paw-button'), `${route}: unpublished draft included`);
  const title = html.match(/<title>(.*?)<\/title>/)?.[1];
  assert(title && !titles.has(title), `${route}: unique title`);
  titles.add(title);
  const navigation = html.match(/<nav class="desktop-nav"[^]*?<\/nav>/)?.[0];
  for (const target of routes.slice(1)) assert(navigation?.includes(`href="./${target}"`), `${route}: link to ${target}`);
  if (route !== 'index.html') assert(navigation.includes(`href="./${route}" aria-current="page"`), `${route}: active navigation`);
  for (const [,attribute,value] of html.matchAll(/\b(href|src)="([^"]*)"/g)) {
    if (!value || /^(?:https?:|data:|tel:|mailto:)/.test(value)) continue;
    const url = new URL(value, `https://example.test/life-with-labr/${route}`);
    assert(url.pathname.startsWith('/life-with-labr/'), `${route}: escaped deployment directory ${value}`);
    const local = url.pathname.slice('/life-with-labr/'.length) || 'index.html';
    assert(fs.existsSync(path.join(root, local)), `${route}: missing ${attribute} ${value}`);
    // Dog dialog's accessible name is populated only when the profile opens.
    if (url.hash && local.endsWith('.html')) {
      const target = pages.get(local) ?? fs.readFileSync(path.join(root, local), 'utf8');
      assert(target.includes(`id="${url.hash.slice(1)}"`), `${route}: missing anchor ${value}`);
    }
  }
  console.log(`OK ${route}: navigation, assets, anchors and metadata`);
}
assert(!pages.get('index.html').includes('id="dogs"'), 'Home should link to independent content');
assert(pages.get('dogs.html').includes('data-dog="edel"') && pages.get('dogs.html').includes('data-dog="enot"'), 'Both dog profiles retained');
assert.equal([...pages.get('moments.html').matchAll(/data-gallery="/g)].length, 7, 'Seven gallery photos retained');
console.log('All multi-page checks passed.');
