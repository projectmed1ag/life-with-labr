import {socials} from './data/socials.mjs';
import {puppyContactUrl} from './puppy-contacts.mjs';

export const escapeHtml = value => String(value).replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
export const litterRoute = litter => `/puppies/${litter.id}/`;
const asset = filename => `/assets/${filename}`;
const puppyKind = litter => litter.puppies.every(puppy=>puppy.color==='Палевый')?'Палевые щенки лабрадора-ретривера':'Щенки лабрадора-ретривера';
const statusText = puppy => ({available:puppy.sex === 'female' ? 'Свободна' : 'Свободен',reserved:puppy.sex === 'female' ? 'Забронирована' : 'Забронирован',home:puppy.sex === 'female'?'Уехала в новую семью':'Уехал в новую семью'}[puppy.status] || '');
const status = puppy => puppy.status ? `<span class="puppy-status puppy-status--${puppy.status}">${puppy.status==='home'?'<svg viewBox="0 0 36 30" width="32" height="28" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M16 11C10 1 2 3 3 11c1 6 8 5 13 2m4-2c6-10 14-8 13 0-1 6-8 5-13 2M15 15 10 27l6-2 3 3 1-13m1 0 5 12 2-5 5 1-10-9"/><rect x="15" y="9" width="6" height="7" rx="2"/></svg>':''}${statusText(puppy)}</span>` : '';
const date = value => new Intl.DateTimeFormat('ru-RU',{day:'numeric',month:'long',year:'numeric',timeZone:'UTC'}).format(new Date(`${value}T12:00:00Z`));
const price = value => value == null ? '' : `${new Intl.NumberFormat('ru-RU').format(value)} ₽`;
const renderContactChoices = puppy => `<details class="puppy-contact" name="puppy-contact" data-puppy-inquiry="${puppy.id}">
  <summary class="button button-dark"><span>Уточнить наличие</span><svg class="puppy-contact-chevron" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg></summary>
  <nav class="puppy-contact-options" aria-label="Выбрать соцсеть">${socials.map(([channel,label]) => `<a href="${escapeHtml(puppyContactUrl(channel,puppy))}" data-puppy-contact="${puppy.id}" data-contact-channel="${channel}" target="_blank" rel="noopener noreferrer"><svg width="22" height="22" aria-hidden="true"><use href="#icon-${channel}"></use></svg><span>${channel === 'instagram' ? 'Instagram' : escapeHtml(label)}</span><svg class="puppy-contact-arrow" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M6 18 18 6M6 6h12v12"/></svg></a>`).join('')}</nav>
</details>`;

export function validateLitters(litters) {
  const litterIds = new Set();
  for (const litter of litters) {
    if (!/^[a-z0-9-]+$/.test(litter.id) || litterIds.has(litter.id)) throw new Error(`Invalid litter id: ${litter.id}`);
    litterIds.add(litter.id);
    if (!litter.title || !litter.parents?.length || !litter.puppies?.length) throw new Error(`Incomplete litter: ${litter.id}`);
    if (litter.birthDate && (!/^\d{4}-\d{2}-\d{2}$/.test(litter.birthDate) || Number.isNaN(Date.parse(litter.birthDate)))) throw new Error(`Invalid birth date: ${litter.id}`);
    const puppyIds = new Set();
    for (const puppy of litter.puppies) {
      if (!/^[a-z0-9-]+$/.test(puppy.id) || puppyIds.has(puppy.id)) throw new Error(`Invalid puppy id: ${puppy.id}`);
      puppyIds.add(puppy.id);
      if (!puppy.name || !['female','male'].includes(puppy.sex) || !puppy.photos?.length) throw new Error(`Incomplete puppy: ${puppy.id}`);
      if (puppy.status != null && !['available','reserved','home'].includes(puppy.status)) throw new Error(`Invalid puppy status: ${puppy.id}`);
      if (puppy.price != null && (!Number.isFinite(puppy.price) || puppy.price <= 0)) throw new Error(`Invalid puppy price: ${puppy.id}`);
      for (const photo of puppy.photos) if (!/^[a-zA-Z0-9_.-]+$/.test(photo.src) || !(photo.width > 0 && photo.height > 0)) throw new Error(`Invalid photo: ${puppy.id}`);
    }
  }
}

export function renderLitterCatalog(litters) {
  return litters.map(litter => {
    const allHome = litter.puppies.every(puppy => puppy.status === 'home');
    const available = litter.puppies.some(puppy => puppy.status === 'available');
    const cover = litter.puppies[0].photos[0];
    return `<article class="litter-card" aria-labelledby="catalog-${litter.id}-title">
      <a class="litter-card-cover" href="${litterRoute(litter)}" aria-label="Смотреть помёт: ${escapeHtml(litter.title)}"><span class="litter-card-photo"><img src="${asset(cover.src)}" alt="${escapeHtml(cover.alt)}" width="${cover.width}" height="${cover.height}" loading="lazy"></span></a>
      <div class="litter-card-copy">
        <p class="litter-card-intro">${puppyKind(litter)} от пары</p>
        <h2 id="catalog-${litter.id}-title"><a href="${litterRoute(litter)}">${escapeHtml(litter.title)}</a></h2>
        ${litter.birthDate ? `<p class="litter-date">Дата рождения: <time datetime="${litter.birthDate}">${date(litter.birthDate)}</time></p>` : ''}
        ${available || allHome ? `<span class="puppy-status${allHome ? ' puppy-status--home' : ''}">${allHome ? 'Все щенки уже дома' : 'Есть свободные щенки'}</span>` : ''}
        <a class="button button-dark litter-card-link" href="${litterRoute(litter)}"><span>Смотреть весь помёт</span><svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.4" aria-hidden="true"><path d="M4 12h15m-6-6 6 6-6 6"/></svg></a>
      </div>
    </article>`;
  }).join('');
}

function renderPuppy(puppy) {
  const photo = puppy.photos[0];
  const canInquire = puppy.status == null || puppy.status === 'available';
  return `<article class="puppy-entry" id="${puppy.id}">
    <div class="puppy-pictures">${status(puppy)}
      <a class="puppy-portrait" href="${asset(photo.src)}" data-puppy-photo="${puppy.id}" data-photo-index="0" aria-label="Смотреть фото: ${escapeHtml(puppy.name)}"><span class="album-photo-window"><img src="${asset(photo.src)}" alt="${escapeHtml(photo.alt)}" width="${photo.width}" height="${photo.height}" loading="lazy"></span><span class="puppy-photo-label">Смотреть фото<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M8 4H4v4m12-4h4v4M4 16v4h4m12-4v4h-4"/></svg></span></a>
      ${puppy.photos.length > 1 ? `<div class="puppy-thumbnails">${puppy.photos.map((item,index)=>`<a href="${asset(item.src)}" data-puppy-photo="${puppy.id}" data-photo-index="${index}" aria-label="Фото ${index+1}: ${escapeHtml(puppy.name)}"><img src="${asset(item.src)}" alt="" width="${item.width}" height="${item.height}" loading="lazy"></a>`).join('')}</div>` : ''}
    </div>
    <div class="puppy-copy"><div class="puppy-name-row"><h3>${escapeHtml(puppy.name)}</h3>${puppy.price != null ? `<p class="puppy-price">${price(puppy.price)}</p>` : ''}</div>
      <dl class="puppy-facts"><div><dt>Пол</dt><dd>${puppy.sex === 'female' ? 'Девочка' : 'Мальчик'}</dd></div><div><dt>Окрас</dt><dd>${escapeHtml(puppy.color)}</dd></div></dl>
      ${puppy.description ? `<p>${escapeHtml(puppy.description)}</p>` : ''}
      ${canInquire ? renderContactChoices(puppy) : `<p class="puppy-inquiry-note">${puppy.status === 'home' ? 'Этот щенок уже нашёл свою семью.' : 'На этого щенка уже оформлена бронь.'}</p>`}
    </div>
  </article>`;
}

export function renderLitterSlots(litter) {
  const girls = litter.puppies.filter(puppy => puppy.sex === 'female');
  const boys = litter.puppies.filter(puppy => puppy.sex === 'male');
  return {
    litterTitle:escapeHtml(litter.title),
    litterSubtitle:puppyKind(litter),
    litterDescription:litter.description?`<p>${escapeHtml(litter.description)}</p>`:'',
    litterDate:litter.birthDate ? `<p class="litter-date">Дата рождения: <time datetime="${litter.birthDate}">${date(litter.birthDate)}</time></p>` : '',
    parents:litter.parents.map(parent => `<article class="litter-parent"><button class="parent-photo" data-dog="${parent.id}" aria-label="Открыть профиль: ${escapeHtml(parent.name)}"><span class="album-photo-window"><img src="${asset(parent.image)}" alt="${escapeHtml(parent.name)}" width="${parent.width}" height="${parent.height}" loading="lazy"></span></button><div class="parent-copy"><h3>${escapeHtml(parent.name)}<span class="parent-role">${escapeHtml(parent.role)}</span></h3>${parent.kennel ? `<p class="parent-kennel"><span>Питомник происхождения</span><strong>${escapeHtml(parent.kennel)}</strong></p>` : ''}<p>${escapeHtml(parent.description)}</p><button class="parent-details" data-dog="${parent.id}"><span>Достижения и родословная</span><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.4" aria-hidden="true"><path d="M4 12h15m-6-6 6 6-6 6"/></svg></button></div></article>`).join(''),
    puppyGroups:[[boys,'Мальчики'],[girls,'Девочки']].filter(([puppies])=>puppies.length).map(([puppies,title])=>`<section class="puppy-group" aria-label="${title}"><h2>${title}</h2><div class="puppy-grid">${puppies.map(renderPuppy).join('')}</div></section>`).join(''),
    litterPedigree:litter.parents.map((parent,index)=>`<details class="litter-pedigree-branch"${index === 0 ? ' open' : ''}><summary><span class="lineage-summary-name">${escapeHtml(parent.role)} — ${escapeHtml(parent.name)}${parent.kennel ? `<small>${escapeHtml(parent.kennel)}</small>` : ''}</span><svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg></summary><div class="pedigree" data-pedigree-dog="${parent.id}"></div></details>`).join(''),
    puppyData:JSON.stringify({title:litter.title,parents:litter.parents,puppies:litter.puppies}).replaceAll('<','\\u003c')
  };
}
