import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import {escapeHtml, litterRoute, renderLitterSlots, validateLitters} from './src/render-litters.mjs';

const root = path.resolve('dist');
const origin = 'https://lifewithlabr.ru';
const mainRoutes = ['/','/about/','/dogs/','/puppies/','/gallery/'];
const litters = JSON.parse(fs.readFileSync('src/data/litters.json', 'utf8'));
validateLitters(litters);
const russianRoutes = [...mainRoutes, ...litters.map(litterRoute)];
const routes = [...russianRoutes, ...russianRoutes.map(route => '/en' + route)];
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
  const english = route.startsWith('/en/');
  const prefix = english ? '/en' : '';
  const sourceRoute = english ? route.slice(3) : route;
  assert(html.includes(`<html lang="${english ? 'en' : 'ru'}">`), `${route}: document language`);
  assert(html.includes(`href="${sourceRoute}" lang="ru" hreflang="ru"`), `${route}: matching Russian page`);
  assert(html.includes(`href="/en${sourceRoute}" lang="en" hreflang="en"`), `${route}: matching English page`);
  if (english) {
    const visibleMarkup = html.replace(/<script\b[^>]*>[^]*?<\/script>/g, '').replace(/<[^>]+>/g, '');
    assert(!/[а-яё]/i.test(visibleMarkup), `${route}: English text is fully translated`);
  }
  assert.equal([...html.matchAll(/<h1(?:\s|>)/g)].length, 1, `${route}: one main heading`);
  assert(!html.includes('{{'), `${route}: unresolved template`);
  assert(!html.includes('paw-button'), `${route}: unpublished draft included`);
  const title = html.match(/<title>(.*?)<\/title>/)?.[1];
  assert(title && !titles.has(title), `${route}: unique title`);
  titles.add(title);
  const navigation = html.match(/<nav class="desktop-nav"[^]*?<\/nav>/)?.[0];
  assert(html.includes(`<link rel="canonical" href="${origin}${route}">`), `${route}: clean canonical URL`);
  assert(!/<meta name="robots" content="[^"]*noindex/.test(html), `${route}: public page allows indexing`);
  const graph = JSON.parse(html.match(/<script type="application\/ld\+json">([^]*?)<\/script>/)?.[1]);
  assert.equal(graph['@context'], 'https://schema.org', `${route}: structured data context`);
  const webPage = graph['@graph'].find(item => item['@id'] === `${origin}${route}#webpage`);
  assert.equal(webPage?.url, origin + route, `${route}: structured page URL`);
  assert.equal(escapeHtml(webPage?.name), title, `${route}: structured title matches page`);
  const organization = graph['@graph'].find(item => item['@type'] === 'Organization');
  assert.equal(organization?.name, 'Life with Labr', `${route}: kennel identity`);
  const image = html.match(/<meta property="og:image" content="([^"]+)"/)?.[1];
  assert(image && fs.existsSync(fileFor(new URL(image).pathname)), `${route}: social image exists`);
  assert(html.includes(`<meta property="og:url" content="${origin}${route}">`), `${route}: social URL matches canonical`);
  if (sourceRoute !== '/') {
    const breadcrumb = graph['@graph'].find(item => item['@type'] === 'BreadcrumbList');
    assert.deepEqual(breadcrumb?.itemListElement.map(item => item.item), [origin + prefix + '/', ...(!mainRoutes.includes(sourceRoute) ? [origin + prefix + '/puppies/'] : []), origin + route], `${route}: breadcrumb URLs`);
  }
  for (const target of mainRoutes.filter(target => target !== '/about/')) assert(navigation?.includes(`href="${prefix}${target}"`), `${route}: link to ${target}`);
  if (sourceRoute !== '/about/') assert(navigation.includes(`href="${prefix}${mainRoutes.includes(sourceRoute) ? sourceRoute : '/puppies/'}" aria-current="page"`), `${route}: active navigation`);
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
  if (!english && route !== '/' && mainRoutes.includes(route)) {
    const legacy = `${route.slice(0,-1)}.html`;
    const redirect = fs.readFileSync(fileFor(legacy), 'utf8');
    checkRedirect(redirect, legacy, `${route}?from=old%20link#contacts`);
    assert(redirect.includes(`<noscript><meta http-equiv="refresh" content="0;url=${route}"></noscript>`), `${legacy}: fallback without JavaScript`);
  }
  console.log(`OK ${route}: navigation, assets, anchors and metadata`);
}
assert(!pages.get('/').includes('id="dogs"'), 'Home should link to independent content');
assert.deepEqual([...new Set([...pages.get('/dogs/').matchAll(/data-dog="([^"]+)"/g)].map(match => match[1]))], ['edel','vanessa','mars','aria'], 'Four confirmed kennel dogs are displayed');
assert.equal([...pages.get('/gallery/').matchAll(/data-gallery="/g)].length, 7, 'Seven gallery photos retained');
for (const litter of litters) {
  const html = pages.get(litterRoute(litter));
  assert(pages.get('/puppies/').includes(`href="${litterRoute(litter)}"`), 'Each litter has a catalogue link');
  const data = JSON.parse(html.match(/<script type="application\/json" id="litter-data">([^]*?)<\/script>/)[1]);
  assert.deepEqual(data.puppies, litter.puppies, 'Gallery and inquiry data match visible puppy information');
  for (const puppy of litter.puppies) {
    const entry = html.match(new RegExp(`<article class="puppy-entry" id="${puppy.id}">([^]*?)<\\/article>`))[1];
    assert.equal(entry.includes('data-puppy-inquiry='), puppy.status == null || puppy.status === 'available', 'Only unreserved puppies offer a booking inquiry');
    assert.equal(entry.includes('class="puppy-price"'), puppy.price != null, 'No placeholder prices');
    assert.equal(entry.includes('class="puppy-status'), puppy.status != null, 'No invented availability');
  }
}
// Exercise optional states before the owner starts filling them in through an editor.
const sample = structuredClone(litters[0]);
sample.birthDate = '2026-08-18';
sample.puppies = ['available', 'reserved', 'home'].map((status, index) => ({...sample.puppies[0], id:`puppy-${index}`, name:'Имя < & "', status, price:70000}));
validateLitters([sample]);
const rendered = renderLitterSlots(sample);
assert(rendered.litterDate.includes('18 августа 2026'), 'Birth date renders when supplied');
assert.equal([...rendered.puppyGroups.matchAll(/data-puppy-inquiry=/g)].length, 1, 'Reserved and homed states hide the inquiry action');
assert(rendered.puppyGroups.includes('Имя &lt; &amp; &quot;'), 'Edited names are escaped in HTML');
assert.equal(JSON.parse(rendered.puppyData).puppies[0].name, sample.puppies[0].name, 'Names retain their original value in gallery data');
assert.throws(() => validateLitters([sample, sample]), /Invalid litter id/, 'Duplicate page addresses are rejected');
const sitemap = fs.readFileSync(path.join(root, 'sitemap.xml'), 'utf8');
assert.deepEqual([...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(match => match[1]), routes.map(route => origin + route), 'Sitemap contains only canonical routes');
console.log('All multi-page checks passed.');
