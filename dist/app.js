import {translateText, translateMarkup} from './localization.js';
import {renderPedigree} from './pedigree.js?v=tree-2';
import {knownPedigrees, resolvePedigree, visiblePedigree} from './pedigree-data.js';
const language = document.documentElement.lang;
const t = text => translateText(text, language);
const localize = html => translateMarkup(html, language);
const motion = matchMedia('(prefers-reduced-motion: reduce)');
const revealObserver = new IntersectionObserver(entries => entries.forEach(entry => {
  if (entry.isIntersecting) { entry.target.classList.add('is-visible'); revealObserver.unobserve(entry.target); }
}), { threshold: 0.08 });
document.querySelectorAll('[data-reveal]').forEach(el => {
  if (!motion.matches && el.getBoundingClientRect().top > innerHeight) el.classList.add('reveal-ready');
  revealObserver.observe(el);
});
document.documentElement.classList.add('enhanced');
document.querySelector('#year').textContent = new Date().getFullYear();

// Direct contact links are already available at the end of the page.
const floatingContact = document.querySelector('.floating-contact');
const visibleContactSections = new Set();
if (floatingContact) {
  const contactObserver = new IntersectionObserver(entries => {
    entries.forEach(({target, isIntersecting}) => {
      if (isIntersecting) visibleContactSections.add(target);
      else visibleContactSections.delete(target);
    });
    floatingContact.classList.toggle('is-obscured', visibleContactSections.size > 0);
  });
  document.querySelectorAll('#contacts, .site-footer').forEach(section => contactObserver.observe(section));
}

const heroImage = document.querySelector('.hero-image .photo-loop') ? null : document.querySelector('.hero-image img');
let framePending = false;
const updateScroll = () => {
  const maxScroll = document.documentElement.scrollHeight - innerHeight;
  document.querySelector('.reading-progress').style.transform = `scaleX(${maxScroll > 0 ? scrollY / maxScroll : 0})`;
  if (heroImage && !motion.matches && innerWidth > 700 && scrollY < innerHeight) {
    heroImage.style.transform = `translateY(${scrollY * .16}px) scale(1.025)`;
  }
  framePending = false;
};
addEventListener('scroll', () => { if (!framePending) { requestAnimationFrame(updateScroll); framePending = true; } }, { passive: true });
motion.addEventListener('change', () => {
  if (motion.matches) { if (heroImage) heroImage.style.transform = ''; document.querySelectorAll('.reveal-ready').forEach(el => el.classList.add('is-visible')); }
});

// These opaque H.264 portraits need no alpha decoding. The original photograph
// remains visible if autoplay is blocked or the visitor requests less motion.
const photoLoops = [...document.querySelectorAll('.photo-loop')];
const visibleLoops = new Set();
const syncPhotoLoop = video => {
  if (motion.matches || document.hidden || !visibleLoops.has(video)) {
    video.pause();
    return;
  }
  if (!video.getAttribute('src')) video.src = video.dataset.loopSrc;
  video.muted = true;
  video.play().catch(() => video.classList.remove('is-playing'));
};
const photoObserver = new IntersectionObserver(entries => entries.forEach(({target,isIntersecting}) => {
  if (isIntersecting) visibleLoops.add(target); else visibleLoops.delete(target);
  syncPhotoLoop(target);
}), {threshold:0.05});
photoLoops.forEach(video => {
  video.addEventListener('playing', () => video.classList.add('is-playing'));
  video.addEventListener('error', () => video.classList.remove('is-playing'));
  photoObserver.observe(video);
});
motion.addEventListener('change', () => photoLoops.forEach(syncPhotoLoop));
document.addEventListener('visibilitychange', () => photoLoops.forEach(syncPhotoLoop));

const mobileMenu = document.querySelector('#mobile-menu');
const menuToggle = document.querySelector('.menu-toggle');
menuToggle.addEventListener('click', () => { mobileMenu.showModal(); menuToggle.setAttribute('aria-expanded', 'true'); });
mobileMenu.addEventListener('close', () => menuToggle.setAttribute('aria-expanded', 'false'));
mobileMenu.querySelectorAll('nav a').forEach(link => link.addEventListener('click', () => mobileMenu.close()));
document.querySelectorAll('dialog').forEach(dialog => {
  dialog.querySelector('[data-close]').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', event => {
    if (event.target !== dialog) return;
    const box = dialog.getBoundingClientRect();
    if (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom) dialog.close();
  });
});

const dogs = {
  edel: {
    name: 'Эдель', image: 'edel.jpg', label: 'LIFE WITH LABR',
    intro: 'Грандчемпион России, НКП, Армении, Грузии и Беларуси.',
    facts: [['Дата рождения', '4 марта 2024'], ['Окрас', 'Палевый'], ['Владелец', 'Евгения Скобликова'], ['Заводчик', 'Илона Монахова'], ['Питомник', 'Время Мечты']],
    titles: [
      ['Грандчемпион', 'России, НКП, Армении, Грузии, Беларуси'],
      ['Чемпион', 'России, НКП, Армении, Грузии, Беларуси · 3 × Чемпион РКФ'],
      ['Победитель Дерби Шоу', 'На Национальной выставке'],
      ['Юный Грандчемпион', 'России, НКП'],
      ['Юный Чемпион', 'России, НКП, Армении · 8 × Юный Чемпион РКФ'],
      ['Кандидат', 'В Шоу Чемпионы, Интерчемпионы и Чемпионы Золотого Кольца']
    ],
    pedigree: knownPedigrees.edel
  },
  vanessa: {
    name: 'Ванесса', image: 'vanessa-show.jpg', portrait: true, label: 'LIFE WITH LABR',
    intro: 'Победитель выставочных групп и специализированных выставок. Многократный победитель породы.',
    facts: [['Порода', 'Лабрадор-ретривер'], ['Пол', 'Сука'], ['Окрас', 'Палевый']],
    titles: [
      ['12 × Best in Group', 'Победитель группы'],
      ['4 × Reserve Best in Group', 'Резервный победитель группы'],
      ['6 × Best in Group-3', 'Третье место в группе'],
      ['6 × Best in Show Specialty', 'Победитель специализированной выставки'],
      ['Многократный BOB', 'Лучший представитель породы']
    ]
  },
  mars: {
    name: 'Марс', image: 'mars-show.jpg', portrait: true, label: 'LIFE WITH LABR',
    intro: 'Юный грандчемпион России и НКП. Юный победитель клуба года — 2026.',
    facts: [['Порода', 'Лабрадор-ретривер'], ['Пол', 'Кобель'], ['Окрас', 'Палевый']],
    titles: [
      ['Юный грандчемпион', 'России и НКП'],
      ['Юный чемпион', 'России, Армении и клуба'],
      ['3 × Юный чемпион РКФ', 'Три титула'],
      ['Юный чемпион РФЛС и РФСС', 'Титулы федераций'],
      ['Юный победитель клуба года', '2026'],
      ['Кандидат', 'В юные интерчемпионы']
    ]
  },
  aria: {
    name: 'Ария', image: 'aria-show.jpg', portrait: true, label: 'LIFE WITH LABR',
    intro: 'Юный грандчемпион России и НКП. Многократный победитель BIS, JBIS, JBISS, BIS Baby и BIS Puppy.',
    facts: [['Порода', 'Лабрадор-ретривер'], ['Пол', 'Сука'], ['Окрас', 'Палевый']],
    titles: [
      ['Юный грандчемпион', 'России и НКП'],
      ['Юный чемпион', 'России и НКП'],
      ['8 × Юный чемпион РКФ', 'Восемь титулов'],
      ['Победы в бестах', 'Многократный победитель BIS, JBIS, JBISS, BIS Baby и BIS Puppy']
    ],
    pedigreeTitle: 'Родословная · 3 поколения',
    pedigree: knownPedigrees.aria
  },
  enot: {
    name: 'Русмайрас Енот', image: 'enot.jpg', label: 'ОТЕЦ ЩЕНКОВ',
    intro: 'Чемпион России, юный грандчемпион России. Отец щенков от Эдель.',
    facts: [['Порода', 'Лабрадор-ретривер'], ['Пол', 'Кобель'], ['Окрас', 'Палевый'], ['Питомник', 'Русмайрас']],
    titles: [['Чемпион России', 'Взрослый титул'], ['Юный Грандчемпион России', 'Юниорский титул'], ['Юный Чемпион', 'России, НКП, РКФ']],
    health: [['Суставы', 'HD/ED — A/0'], ['Генетические тесты', 'PRA, HNPK, EIC, CNM — clear'], ['Длинношёрстность', 'Не несёт аллель длинношёрстности']],
    pedigree: knownPedigrees.enot
  }
};
const dogDialog = document.querySelector('#dog-dialog');
const escapeContent=value=>String(value||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const litterParents=JSON.parse(document.querySelector('#litter-data')?.textContent||'{}').parents||[];
for(const parent of litterParents){
  const previous=dogs[parent.id];
  dogs[parent.id]={...previous,name:escapeContent(parent.name),image:parent.image,label:escapeContent(parent.role),intro:escapeContent(parent.description),facts:previous?.facts||[['Питомник',escapeContent(parent.kennel)]],titles:previous?.titles||[],pedigree:visiblePedigree(resolvePedigree(parent))};
}

document.querySelectorAll('[data-pedigree-dog]').forEach(container => {
  const dog = dogs[container.dataset.pedigreeDog];
  const parent=litterParents.find(parent=>parent.id===container.dataset.pedigreeDog);
  if(dog?.pedigree?.length || parent?.pedigree) {
    container.innerHTML=localize(renderPedigree(dog?.pedigree || []));
    if(parent?.pedigree){const note=document.createElement('p');note.className='pedigree-text';note.textContent=parent.pedigree;container.append(note);}
  } else container.closest('details')?.remove();
});
document.querySelectorAll('[data-dog]').forEach(button => button.addEventListener('click', () => {
  const dog = dogs[button.dataset.dog];
  if(!dog) return;
  dogDialog.dataset.dog = button.dataset.dog;
  document.querySelector('#dog-dialog-content').innerHTML = localize(`<div class="profile-cover${dog.portrait ? ' profile-cover--portrait' : ''}"><img src="/assets/${dog.image}" alt="${dog.name}"></div><div class="profile-body"><p class="eyebrow">${dog.label}</p><h2 id="dog-dialog-title">${dog.name}</h2><p class="profile-intro">${dog.intro}</p><dl class="profile-facts">${dog.facts.map(([key, value]) => `<div><dt>${key}</dt><dd>${value}</dd></div>`).join('')}</dl><details open><summary>Достижения <span aria-hidden="true">+</span></summary><div class="title-list">${dog.titles.map(([title, description]) => `<div><h4>${title}</h4><p>${description}</p></div>`).join('')}</div></details>${dog.health ? `<details><summary>Тесты здоровья <span aria-hidden="true">+</span></summary><dl class="health-list">${dog.health.map(([title, value]) => `<div><dt>${title}</dt><dd>${value}</dd></div>`).join('')}</dl></details>` : ''}${dog.pedigree?.length ? `<details><summary>${dog.pedigreeTitle || (button.dataset.dog === 'edel' ? 'Родословная · 3 поколения' : 'Происхождение')} <span aria-hidden="true">+</span></summary><div class="pedigree">${renderPedigree(dog.pedigree)}</div></details>` : ''}<a class="button button-dark" href="https://wa.me/79251448648" target="_blank" rel="noopener noreferrer">Узнать о щенках</a></div>`);
  const parent=litterParents.find(parent=>parent.id===button.dataset.dog);
  if(parent?.pedigree){const detail=document.createElement('p');detail.className='pedigree-text';detail.textContent=parent.pedigree;dogDialog.querySelector('.profile-body').append(detail);}
  dogDialog.showModal();
  dogDialog.scrollTop = 0;
}));

const gallery=[...document.querySelectorAll('[data-gallery]')].map(button=>{const img=button.querySelector('img');return [img.getAttribute('src'),img.alt];});
let galleryIndex = 0;
const lightbox = document.querySelector('#lightbox');
const showPhoto = index => {
  if(!gallery.length) return;
  galleryIndex = (index + gallery.length) % gallery.length;
  const [src, title] = gallery[galleryIndex];
  document.querySelector('#lightbox-image').src = src;
  document.querySelector('#lightbox-image').alt = t(title);
  document.querySelector('#lightbox-count').textContent = `${String(galleryIndex + 1).padStart(2, '0')} / ${String(gallery.length).padStart(2, '0')}`;
};
document.querySelectorAll('[data-gallery]').forEach(button => button.addEventListener('click', () => { showPhoto(Number(button.dataset.gallery)); lightbox.showModal(); }));
document.querySelector('.lightbox-prev').addEventListener('click', () => showPhoto(galleryIndex - 1));
document.querySelector('.lightbox-next').addEventListener('click', () => showPhoto(galleryIndex + 1));
lightbox.addEventListener('keydown', event => {
  if (event.key === 'ArrowRight') { event.preventDefault(); showPhoto(galleryIndex + 1); }
  if (event.key === 'ArrowLeft') { event.preventDefault(); showPhoto(galleryIndex - 1); }
});
let touchStart;
lightbox.addEventListener('touchstart', event => { touchStart = event.changedTouches[0].clientX; }, {passive:true});
lightbox.addEventListener('touchend', event => {
  const distance = event.changedTouches[0].clientX - touchStart;
  if (Math.abs(distance) > 65) showPhoto(galleryIndex + (distance < 0 ? 1 : -1));
}, {passive:true});
// Keep links to the former home-page sections working after the move to pages.
if (document.body.dataset.page === 'home') {
  const legacyPages = {about:'/about/',dogs:'/dogs/',puppies:'/puppies/',moments:'/gallery/'};
  const followLegacyLink = () => {
    const target = legacyPages[location.hash.slice(1)];
    if (target) location.replace((language === 'en' ? '/en' : '') + target + location.search);
  };
  followLegacyLink();
  addEventListener('hashchange', followLegacyLink);
}
