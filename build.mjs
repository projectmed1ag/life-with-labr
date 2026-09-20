import {readFile, writeFile} from 'node:fs/promises';

const origin = 'https://lifewithlabr.ru/';
const pages = [
  {key:'home', file:'index.html', label:'Главная', title:'Life with Labr — маленькое счастье. Большая любовь.', description:'Life with Labr — питомник лабрадоров Евгении Скобликовой в Москве. Наши собаки, щенки и жизнь с лабрадором.'},
  {key:'about', file:'about.html', label:'О питомнике', title:'О питомнике — Life with Labr', description:'Питомник лабрадоров Life with Labr в Москве. Евгения Скобликова, наша философия и забота о щенках и их семьях.'},
  {key:'dogs', file:'dogs.html', label:'Наши собаки', title:'Наши собаки, достижения и родословные — Life with Labr', description:'Время Мечты Эдель и Русмайрас Енот: фотографии, выставочные достижения, родословные и сведения о родителях щенков Life with Labr.'},
  {key:'puppies', file:'puppies.html', label:'Щенки', title:'Щенки лабрадора — Life with Labr', description:'Палевые щенки лабрадора от Эдель и Енота. Знакомство с малышами, общение с заводчиком и поддержка после переезда.'},
  {key:'moments', file:'moments.html', label:'Моменты', title:'Моменты: фотоальбом лабрадоров — Life with Labr', description:'Фотографии лабрадоров Life with Labr: первые прогулки, маленькие открытия и жизнь рядом с любимыми собаками.'}
];
const layout = await readFile('src/layout.html', 'utf8');
const brand = await readFile('src/brand.html', 'utf8');
for (const page of pages) {
  const links = list => list.map(item => `<a href="${item.key === 'home' ? './' : './' + item.file}"${item.key === page.key ? ' aria-current="page"' : ''}>${item.label}</a>`).join('');
  const values = {
    title: page.title, description: page.description, page:page.key, brand,
    canonical: origin + (page.key === 'home' ? '' : page.file),
    nav:links(pages.slice(1)), mobileNav:links(pages),
    content:(await readFile(`src/pages/${page.key}.html`, 'utf8'))
      .replace('{{sittingLabradors}}', page.key === 'about' ? await readFile('src/sitting-labradors.html','utf8') : ''),
    pageAssets:['home','about','puppies'].includes(page.key) ? '<link rel="stylesheet" href="./living-puppies.css?v=photo-motion-7">' : ''
  };
  const html = layout.replace(/\{\{(\w+)\}\}/g, (_, key) => {
    if (!(key in values)) throw new Error(`Unknown layout slot ${key}`);
    return values[key];
  });
  await writeFile(`dist/${page.file}`, html);
  console.log(`Built ${page.file}`);
}
await writeFile('dist/sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${pages.map(page => `<url><loc>${origin}${page.key === 'home' ? '' : page.file}</loc></url>`).join('')}</urlset>\n`);
await writeFile('dist/robots.txt', `User-agent: *\nAllow: /\n\nSitemap: ${origin}sitemap.xml\n`);
