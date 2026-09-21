import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

const root = path.resolve('dist');
const origin = 'https://lifewithlabr.ru';
const routes = ['/','/about/','/dogs/','/puppies/','/moments/'];
const fileFor = pathname => path.join(root, pathname, pathname.endsWith('/') ? 'index.html' : '');
const pages = new Map(routes.map(route => [route, fs.readFileSync(fileFor(route), 'utf8')]));
function checkRedirect(html, pathname, expected) {
  const script = html.match(/<script>([^]*?)<\/script>/)?.[1];
  assert(script, `${pathname}: redirect script exists`);
  let destination;
  const location = {pathname, search:'?from=old%20link', hash:'#contacts', replace(url) {destination = url;}};
  vm.runInNewContext(script, {location});
  assert.equal(destination, expected, `${pathname}: redirect keeps query and anchor`);
}
const titles = new Set();
for (const [route, html] of pages) {
  assert.equal([...html.matchAll(/<h1(?:\s|>)/g)].length, 1, `${route}: one main heading`);
  assert(!html.includes('{{'), `${route}: unresolved template`);
  assert(!html.includes('paw-button'), `${route}: unpublished draft included`);
  const title = html.match(/<title>(.*?)<\/title>/)?.[1];
  assert(title && !titles.has(title), `${route}: unique title`);
  titles.add(title);
  const navigation = html.match(/<nav class="desktop-nav"[^]*?<\/nav>/)?.[0];
  assert(html.includes(`<link rel="canonical" href="${origin}${route}">`), `${route}: clean canonical URL`);
  for (const target of routes.slice(1)) assert(navigation?.includes(`href="${target}"`), `${route}: link to ${target}`);
  if (route !== '/') assert(navigation.includes(`href="${route}" aria-current="page"`), `${route}: active navigation`);
  const references = [...html.matchAll(/\b(href|src|poster|data-loop-src)="([^"]*)"/g)];
  for (const [, value] of html.matchAll(/\bsrcset="([^"]*)"/g)) {
    for (const candidate of value.split(',')) references.push(['','srcset',candidate.trim().split(/\s+/)[0]]);
  }
  for (const [,attribute,value] of references) {
    if (!value || /^(?:https?:|data:|tel:|mailto:)/.test(value)) continue;
    assert(value.startsWith('/') || value.startsWith('#'), `${route}: nested route needs a root-relative reference: ${value}`);
    const url = new URL(value, origin + route);
    const local = fileFor(url.pathname);
    assert(fs.existsSync(local) && fs.statSync(local).isFile(), `${route}: missing ${attribute} ${value}`);
    if (attribute === 'href') assert(!url.pathname.endsWith('.html'), `${route}: old page link ${value}`);
    if (url.hash && local.endsWith('.html')) {
      const target = pages.get(url.pathname) ?? fs.readFileSync(local, 'utf8');
      assert(target.includes(`id="${url.hash.slice(1)}"`), `${route}: missing anchor ${value}`);
    }
  }
  checkRedirect(html, route, undefined);
  checkRedirect(html, `${route}index.html`, `${route}?from=old%20link#contacts`);
  if (route !== '/') {
    const legacy = `${route.slice(0,-1)}.html`;
    const redirect = fs.readFileSync(fileFor(legacy), 'utf8');
    checkRedirect(redirect, legacy, `${route}?from=old%20link#contacts`);
    assert(redirect.includes(`<noscript><meta http-equiv="refresh" content="0;url=${route}"></noscript>`), `${legacy}: fallback without JavaScript`);
  }
  console.log(`OK ${route}: navigation, assets, anchors and metadata`);
}
assert(!pages.get('/').includes('id="dogs"'), 'Home should link to independent content');
assert(pages.get('/dogs/').includes('data-dog="edel"') && pages.get('/dogs/').includes('data-dog="enot"'), 'Both dog profiles retained');
assert.equal([...pages.get('/moments/').matchAll(/data-gallery="/g)].length, 7, 'Seven gallery photos retained');
const sitemap = fs.readFileSync(path.join(root, 'sitemap.xml'), 'utf8');
assert.deepEqual([...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(match => match[1]), routes.map(route => origin + route), 'Sitemap contains only canonical routes');
console.log('All multi-page checks passed.');
