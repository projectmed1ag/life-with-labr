import {mkdir, readFile, writeFile} from 'node:fs/promises';
import {escapeHtml, litterRoute, renderLitterCatalog, renderLitterSlots, validateLitters} from './src/render-litters.mjs';
import {translateText, translateMarkup} from './dist/localization.js';
import {localizeLinks} from './src/localize-links.mjs';
import {socials} from './src/data/socials.mjs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {renderGallery} from './src/render-gallery.mjs';

const origin = 'https://lifewithlabr.ru/';
export async function renderSite(contentData) {
const output = new Map();
const pages = [
  {key:'home', file:'index.html', label:'Главная', title:'Питомник лабрадоров в Москве — Life with Labr', description:'Life with Labr — питомник лабрадоров Евгении Скобликовой в Москве. Палевые щенки, фотографии родителей, достижения и поддержка после переезда.'},
  {key:'about', file:'about.html', label:'О питомнике', title:'О питомнике лабрадоров и заводчике — Life with Labr', description:'Питомник лабрадоров Life with Labr в Москве. Заводчик Евгения Скобликова: знакомство со щенками, их родителями и поддержка владельцев.'},
  {key:'dogs', file:'dogs.html', label:'Наши собаки', title:'Наши собаки, достижения и родословные — Life with Labr', description:'Эдель, Ванесса, Марс и Ария — четыре лабрадора питомника Life with Labr. Фотографии, выставочные достижения и родословные наших собак.'},
  {key:'puppies', file:'puppies.html', label:'Щенки', title:'Палевые щенки лабрадора в Москве — Life with Labr', description:'Палевые щенки лабрадора от Эдель и Енота в питомнике Life with Labr, Москва. Знакомство с малышами, фотографии родителей и поддержка заводчика.'},
  {key:'moments', route:'/gallery/', file:'gallery.html', label:'Галерея', title:'Галерея: фотоальбом лабрадоров — Life with Labr', description:'Фотографии собак и щенков лабрадора питомника Life with Labr.'}
];
const layout = await readFile('src/layout.html', 'utf8');
const navigationPages = pages.filter(page => page.key !== 'about');
const brand = await readFile('src/brand.html', 'utf8');
const socialSymbols = await readFile('src/social-symbols.html', 'utf8');
const socialLinks = socials.map(([icon,label,url]) => `<a href="${url}" target="_blank" rel="noopener noreferrer" aria-label="${label}" title="${label}"><svg aria-hidden="true"><use href="#icon-${icon}"></use></svg></a>`).join('');
const litters = contentData?.litters ?? JSON.parse(await readFile('src/data/litters.json','utf8'));
const gallery = contentData?.gallery ?? JSON.parse(await readFile('src/data/gallery.json','utf8'));
validateLitters(litters);
const litterTemplate = await readFile('src/pages/litter.html','utf8');
const allPages = [...pages, ...litters.map(litter => ({
  key:`litter-${litter.id}`, section:'puppies', route:litterRoute(litter), label:litter.title, litter,
  title:`Щенки: ${litter.title} — Life with Labr`,
  description:`Помёт ${litter.title} питомника Life with Labr. ${litter.puppies.map(puppy => puppy.name).join(', ')}: фотографии щенков, родители, родословная и знакомство с заводчиком.`
}))];
const routeFor = page => page.route || (page.key === 'home' ? '/' : `/${page.key}/`);
const organizationId = `${origin}#organization`;
const websiteId = `${origin}#website`;
const shareImages = {
  home:['puppy-hero.jpg','Палевый щенок лабрадора Life with Labr'],
  about:['brand-watercolor-cutout-v1.webp','Акварельный логотип питомника Life with Labr'],
  dogs:['edel.jpg','Эдель — лабрадор питомника Life with Labr'],
  puppies:['puppy-avrora.jpg','Аврора — щенок лабрадора Life with Labr'],
  moments:['puppy-rest.jpg','Щенок Life with Labr на отдыхе']
};
const builtRoutes = [];
for (const language of ['ru','en']) {
for (const page of allPages) {
  const t = text => translateText(text, language);
  const russianRoute = routeFor(page);
  const route = (language === 'en' ? '/en' : '') + russianRoute;
  const localHome = new URL(language === 'en' ? '/en/' : '/', origin).href;
  const canonical = new URL(route, origin).href;
  const graph = [
    {'@type':'Organization','@id':organizationId,name:'Life with Labr',url:origin,
      description:t('Питомник лабрадоров Евгении Скобликовой в Москве.'),
      logo:`${origin}assets/brand-header-v1.webp`,telephone:'+79251448648',
      sameAs:socials.map(([, , url]) => url),
      address:{'@type':'PostalAddress',addressLocality:t('Москва'),addressCountry:'RU'}},
    {'@type':'WebSite','@id':websiteId,url:origin,name:'Life with Labr',inLanguage:['ru-RU','en'],publisher:{'@id':organizationId}},
    {'@type':page.key === 'about' ? 'AboutPage' : ['dogs','moments','puppies'].includes(page.section || page.key) ? 'CollectionPage' : 'WebPage',
      '@id':`${canonical}#webpage`,url:canonical,name:t(page.title),description:t(page.description),
      inLanguage:language,isPartOf:{'@id':websiteId},about:{'@id':organizationId},
      ...(page.key !== 'home' ? {breadcrumb:{'@id':`${canonical}#breadcrumb`}} : {})}
  ];
  if (page.key !== 'home') graph.push({'@type':'BreadcrumbList','@id':`${canonical}#breadcrumb`,itemListElement:[
    {'@type':'ListItem',position:1,name:t('Главная'),item:localHome},
    ...(page.litter ? [{'@type':'ListItem',position:2,name:t('Щенки'),item:`${localHome}puppies/`}] : []),
    {'@type':'ListItem',position:page.litter ? 3 : 2,name:t(page.label),item:canonical}
  ]});
  const links = list => list.map(item => `<a href="${routeFor(item)}"${item.key === (page.section || page.key) ? ' aria-current="page"' : ''}>${item.label}</a>`).join('');
  let content;
  if (page.litter) {
    const slots = renderLitterSlots(page.litter);
    content = litterTemplate.replace(/\{\{(\w+)\}\}/g, (_, key) => {
      if (!(key in slots)) throw new Error(`Unknown litter slot ${key}`);
      return slots[key];
    });
  } else {
    content = (await readFile(`src/pages/${page.key}.html`, 'utf8'))
      .replace('{{sittingLabradors}}', page.key === 'about' ? await readFile('src/sitting-labradors.html','utf8') : '')
      .replace('{{litterCatalog}}', page.key === 'puppies' ? renderLitterCatalog(litters) : '')
      .replace('{{gallery}}', page.key === 'moments' ? renderGallery(gallery) : '');
  }
  const share = page.litter ? [page.litter.puppies[0].photos[0].src,page.litter.puppies[0].photos[0].alt] : shareImages[page.key];
  const values = {
    title: escapeHtml(page.title), description: escapeHtml(page.description), page:page.litter ? 'litter' : page.key, brand,
    canonical, routeJson: JSON.stringify(route), language, ogLocale:language === 'en' ? 'en_GB' : 'ru_RU', socialSymbols, socialLinks,
    languageSwitch:`<nav class="language-switch" aria-label="Язык сайта"><a href="${russianRoute}" lang="ru" hreflang="ru" aria-label="Русский" title="Русский"${language === 'ru' ? ' aria-current="true"' : ''}><img src="/assets/flag-ru.svg" width="33" height="22" alt=""></a><a href="/en${russianRoute}" lang="en" hreflang="en" aria-label="English" title="English"${language === 'en' ? ' aria-current="true"' : ''}><img src="/assets/flag-gb.svg" width="33" height="22" alt=""></a></nav>`,
    languageAlternates:['ru','en','x-default'].map(lang => `<link rel="alternate" hreflang="${lang}" href="${new URL((lang === 'en' ? '/en' : '') + russianRoute,origin).href}">`).join('\n'),
    shareImage:`${origin}assets/${share[0]}`,shareImageAlt:escapeHtml(share[1]),
    structuredData:JSON.stringify({'@context':'https://schema.org','@graph':graph}).replaceAll('<','\\u003c'),
    nav:links(navigationPages), mobileNav:links(navigationPages),
    content,
    pageAssets:page.key === 'home' ? '<link rel="stylesheet" href="/living-puppies.css?v=photo-motion-7"><link rel="stylesheet" href="/home.css?v=story-1">' : page.key === 'dogs' ? '<link rel="stylesheet" href="/dogs.css?v=aria-photo-2">' : (page.litter || page.key === 'puppies') ? '<link rel="stylesheet" href="/puppies-catalog.css?v=price-5"><script type="module" src="/puppies-motion.js?v=album-2"></script>' : page.key === 'about' ? '<link rel="stylesheet" href="/living-puppies.css?v=photo-motion-7">' : '',
    appVersion:'pedigree-2'
  };
  const html = layout.replace(/\{\{(\w+)\}\}/g, (_, key) => {
    if (!(key in values)) throw new Error(`Unknown layout slot ${key}`);
    return values[key];
  }).replace(/[\t ]+$/gm, '');
  output.set(`${route}index.html`, localizeLinks(translateMarkup(html, language), language, page.litter?.puppies));
  builtRoutes.push(route);
  if (language === 'ru' && page.file && page.key !== 'home') {
    output.set(`/${page.file}`, `<!doctype html>
<html lang="ru"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>${page.title}</title>
<link rel="canonical" href="${values.canonical}">
<meta name="robots" content="noindex,follow">
<script>location.replace(${JSON.stringify(route)} + location.search + location.hash);</script>
<noscript><meta http-equiv="refresh" content="0;url=${route}"></noscript>
</head><body><a href="${route}">${page.label}</a></body></html>
`);
  }
}
}
output.set('/sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${builtRoutes.map(route => `<url><loc>${new URL(route, origin).href}</loc></url>`).join('')}</urlset>\n`);
output.set('/robots.txt', `User-agent: *\nAllow: /\nDisallow: /admin/\nDisallow: /api/\n\nSitemap: ${origin}sitemap.xml\n`);
for(const [oldRoute,newRoute] of [['/moments/','/gallery/'],['/en/moments/','/en/gallery/'],['/moments.html','/gallery/']]) output.set(oldRoute.endsWith('/')?`${oldRoute}index.html`:oldRoute, `<!doctype html><html lang="ru"><head><meta charset="utf-8"><title>Галерея</title><meta name="robots" content="noindex"><link rel="canonical" href="${origin.slice(0,-1)}${newRoute}"><script>location.replace(${JSON.stringify(newRoute)}+location.search+location.hash)</script><noscript><meta http-equiv="refresh" content="0;url=${newRoute}"></noscript></head><body><a href="${newRoute}">Галерея</a></body></html>`);
return output;
}
if(process.argv[1] && path.resolve(process.argv[1])===fileURLToPath(import.meta.url)) {
  const output=await renderSite();
  for(const [file,html] of output){const target=path.join('dist',file);await mkdir(path.dirname(target),{recursive:true});await writeFile(target,html);}
  console.log(`Built ${output.size} documents.`);
}
