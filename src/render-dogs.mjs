import {escapeHtml as e} from './render-litters.mjs';
import {renderPedigree} from '../dist/pedigree.js';
import {visiblePedigree} from '../dist/pedigree-data.js';

export const dogRoute=dog=>`/dogs/${dog.id}/`;
const lines=value=>e(value||'').replaceAll('\n','<br>');
const sex=dog=>dog.sex==='male'?'Кобель':'Сука';
const date=value=>new Intl.DateTimeFormat('ru-RU',{day:'numeric',month:'long',year:'numeric',timeZone:'UTC'}).format(new Date(value+'T12:00:00Z'));
// Preserve the approved crops of the original show photographs only.
const photoClass=src=>({'vanessa-show.jpg':' dog-photo--vanessa','mars-show.jpg':' dog-photo--mars','aria-show.jpg':' dog-photo--aria'}[src]||'');
export const dogFacts=dog=>[['Порода','Лабрадор-ретривер'],['Пол',sex(dog)],['Дата рождения',dog.birthDate?date(dog.birthDate):''],['Окрас',dog.color],['Владелец',dog.owner],['Заводчик',dog.breeder],['Питомник',dog.kennel]].filter(([,value])=>value);
export function renderDogCatalog(dogs){
  return dogs.length?`<div class="dog-grid">${dogs.map(dog=>{const photo=dog.photos[0];return `<article class="dog-card" data-reveal data-dog-record="${e(dog.id)}"><a class="dog-photo${photoClass(photo.src)}" href="${dogRoute(dog)}" aria-label="${e(dog.name)}"><img src="/assets/${e(photo.src)}" alt="${e(photo.alt||dog.name)}" width="${photo.width}" height="${photo.height}" loading="lazy"></a><div class="dog-meta"><span>Лабрадор-ретривер · <span>${sex(dog)}</span></span><span>${e(dog.color)}</span></div><h2><i>${e(dog.name)}</i></h2>${dog.summary?`<p>${lines(dog.summary)}</p>`:''}<a class="text-button" href="${dogRoute(dog)}">Подробнее</a></article>`;}).join('')}</div>`:'<p>Скоро здесь появятся наши собаки.</p>';
}
export function renderDogPage(dog){
  const first=dog.photos[0],tree=visiblePedigree(dog.pedigreeTree||[]);
  return `<div class="breadcrumbs"><a href="/">Главная</a><span aria-hidden="true">/</span><a href="/dogs/">Наши собаки</a><span aria-hidden="true">/</span><span>${e(dog.name)}</span></div>
  <article class="dog-profile section page-primary">
    <div class="dog-profile-intro"><div class="dog-profile-cover${first.src==='aria-show.jpg'?' dog-profile-cover--aria':''}"><button type="button" data-gallery="0" aria-label="Смотреть фото"><img src="/assets/${e(first.src)}" alt="${e(first.alt||dog.name)}" width="${first.width}" height="${first.height}"></button></div><div class="dog-profile-copy"><h1>${e(dog.name)}</h1>${dog.description?`<p class="dog-profile-description">${lines(dog.description)}</p>`:''}<dl class="profile-facts">${dogFacts(dog).map(([label,value])=>`<div><dt>${label}</dt><dd>${e(value)}</dd></div>`).join('')}</dl><a class="button button-dark" href="#contacts">Связаться с питомником</a></div></div>
    ${dog.photos.length>1?`<section class="dog-profile-section" aria-labelledby="dog-photos-title"><h2 id="dog-photos-title">Фотографии</h2><div class="dog-profile-photos">${dog.photos.slice(1).map((photo,i)=>`<button type="button" data-gallery="${i+1}" aria-label="Смотреть фото"><img src="/assets/${e(photo.src)}" alt="${e(photo.alt||dog.name)}" width="${photo.width}" height="${photo.height}" loading="lazy"></button>`).join('')}</div></section>`:''}
    ${dog.titles?.length?`<section class="dog-profile-section" aria-labelledby="dog-titles-title"><h2 id="dog-titles-title">Достижения</h2><div class="dog-title-list">${dog.titles.map(row=>`<div><h3>${e(row.title)}</h3>${row.description?`<p>${lines(row.description)}</p>`:''}</div>`).join('')}</div></section>`:''}
    ${dog.health?.length?`<section class="dog-profile-section" aria-labelledby="dog-health-title"><h2 id="dog-health-title">Тесты здоровья</h2><dl class="profile-facts">${dog.health.map(row=>`<div><dt>${e(row.title)}</dt><dd>${e(row.value)}</dd></div>`).join('')}</dl></section>`:''}
    ${tree.length||dog.pedigree?`<section class="dog-profile-section" aria-labelledby="dog-pedigree-title"><h2 id="dog-pedigree-title">Родословная</h2><div class="pedigree">${renderPedigree(tree,dog.name)}</div>${dog.pedigree?`<p>${lines(dog.pedigree)}</p>`:''}</section>`:''}
    <a class="dog-profile-back text-button" href="/dogs/">Наши собаки</a>
  </article>`;
}
