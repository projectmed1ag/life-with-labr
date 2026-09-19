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

let framePending = false;
const updateScroll = () => {
  const maxScroll = document.documentElement.scrollHeight - innerHeight;
  document.querySelector('.reading-progress').style.transform = `scaleX(${maxScroll > 0 ? scrollY / maxScroll : 0})`;
  if (!motion.matches && innerWidth > 700 && scrollY < innerHeight) {
    document.querySelector('.hero-image img').style.transform = `translateY(${scrollY * .16}px) scale(1.025)`;
  }
  framePending = false;
};
addEventListener('scroll', () => { if (!framePending) { requestAnimationFrame(updateScroll); framePending = true; } }, { passive: true });
motion.addEventListener('change', () => {
  if (motion.matches) { document.querySelector('.hero-image img').style.transform = ''; document.querySelectorAll('.reveal-ready').forEach(el => el.classList.add('is-visible')); }
});

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

const pedigreeBranch = (label, parent, title, grandparents) => `<section class="pedigree-branch"><p class="eyebrow">${label}</p><div class="ancestor root-ancestor"><h4>${parent}</h4><p>${title}</p></div><div class="ancestor-grid">${grandparents.map(p => `<div class="ancestor"><h4>${p.name}</h4><p>${p.title}</p>${p.parents ? `<div class="great-grandparents">${p.parents.map(n => `<span>${n}</span>`).join('')}</div>` : ''}</div>`).join('')}</div></section>`;

const dogs = {
  edel: {
    name: 'Время Мечты Эдель', image: 'edel.jpg', label: 'НАША ЭДЕЛЬ',
    intro: 'Гармоничная, женственная и ласковая. Заботливая мама щенков Life with Labr.',
    facts: [['Дата рождения', '4 марта 2024'], ['Окрас', 'Палевый'], ['Владелец', 'Евгения Скобликова'], ['Заводчик', 'Илона Монахова'], ['Питомник', 'Время Мечты']],
    titles: [
      ['Грандчемпион', 'России, НКП, Армении, Грузии, Беларуси'],
      ['Чемпион', 'России, НКП, Армении, Грузии, Беларуси · 3 × Чемпион РКФ'],
      ['Победитель Дерби Шоу', 'На Национальной выставке'],
      ['Юный Грандчемпион', 'России, НКП'],
      ['Юный Чемпион', 'России, НКП, Армении · 8 × Юный Чемпион РКФ'],
      ['Кандидат', 'В Шоу Чемпионы, Интерчемпионы и Чемпионы Золотого Кольца']
    ],
    pedigree: pedigreeBranch('ОТЕЦ', 'Никсон Лаб Бонапарт', 'Грандчемпион России · Чемпион России, НКП, РКФ', [
      {name: 'Кристофер Строллер Сан', title: 'Интерчемпион · Грандчемпион', parents: ['Rocheby Step Ahead', 'Юффо Лондон Блю Топаз']},
      {name: 'Kelly for Nikson Dvaruva', title: 'Чемпион России · Литва', parents: ['Big Bang Magic Power', 'Rocheby Pastelshades']}
    ]) + pedigreeBranch('МАТЬ', 'Время Мечты Вера', 'Чемпион России, РКФ', [
      {name: 'Жерминаль Мисти Шоу Мэйкер', title: 'Интерчемпион · Грандчемпион', parents: ['Rocheby Step Ahead', 'Жерминаль Мисти Чарминг Чанс']},
      {name: 'Флэми Стар Тестаросса', title: 'Чемпион России · Чемпион-производитель', parents: ['Jentleman Jim Down the Hill', 'Флэми Стар Нирвана']}
    ])
  },
  enot: {
    name: 'Русмайрас Енот', image: 'enot.jpg', label: 'ОТЕЦ ЩЕНКОВ',
    intro: 'Крепкий, красивый кобель, отлично проявивший себя в ринге и зарекомендовавший себя как производитель.',
    facts: [['Порода', 'Лабрадор-ретривер'], ['Пол', 'Кобель'], ['Окрас', 'Палевый']],
    titles: [['Чемпион России', 'Взрослый титул'], ['Юный Грандчемпион России', 'Юниорский титул'], ['Юный Чемпион', 'России, НКП, РКФ']],
    health: [['Суставы', 'HD/ED — A/0'], ['Генетические тесты', 'PRA, HNPK, EIC, CNM — clear'], ['Длинношёрстность', 'Не несёт аллель длинношёрстности']],
    pedigree: pedigreeBranch('ОТЕЦ', 'Русмайрас Пьер', 'Чемпион России · Юный Чемпион России, НКП, РКФ, Эстонии, Украины, Словении', []) + pedigreeBranch('МАТЬ', 'Русмайрас Смайли', 'Чемпион Литвы, Венгрии', [])
  }
};
const dogDialog = document.querySelector('#dog-dialog');
document.querySelectorAll('[data-dog]').forEach(button => button.addEventListener('click', () => {
  const dog = dogs[button.dataset.dog];
  document.querySelector('#dog-dialog-content').innerHTML = `<div class="profile-cover"><img src="./assets/${dog.image}" alt="${dog.name}"></div><div class="profile-body"><p class="eyebrow">${dog.label}</p><h2 id="dog-dialog-title">${dog.name}</h2><p class="profile-intro">${dog.intro}</p><dl class="profile-facts">${dog.facts.map(([key, value]) => `<div><dt>${key}</dt><dd>${value}</dd></div>`).join('')}</dl><details open><summary>Достижения <span aria-hidden="true">+</span></summary><div class="title-list">${dog.titles.map(([title, description]) => `<div><h4>${title}</h4><p>${description}</p></div>`).join('')}</div></details>${dog.health ? `<details><summary>Тесты здоровья <span aria-hidden="true">+</span></summary><dl class="health-list">${dog.health.map(([title, value]) => `<div><dt>${title}</dt><dd>${value}</dd></div>`).join('')}</dl></details>` : ''}<details><summary>${button.dataset.dog === 'edel' ? 'Родословная · 3 поколения' : 'Происхождение'} <span aria-hidden="true">+</span></summary><div class="pedigree">${dog.pedigree}</div></details><a class="button button-dark" href="https://wa.me/79251448648" target="_blank" rel="noopener noreferrer">Узнать о щенках <span aria-hidden="true">↗</span></a></div>`;
  dogDialog.showModal();
  dogDialog.scrollTop = 0;
}));

const gallery = [
  ['puppy-garden.jpg', 'Первые прогулки'], ['puppy-profile-1.jpg', 'Маленькая модель'],
  ['puppy-portrait-2.jpg', 'Тот самый взгляд'], ['puppy-rest.jpg', 'Минутка отдыха'],
  ['puppy-portrait-1.jpg', 'Знакомимся с миром'], ['puppy-profile-2.jpg', 'Первый выход'],
  ['edel-together.jpg', 'Вместе с Эдель']
];
let galleryIndex = 0;
const lightbox = document.querySelector('#lightbox');
const showPhoto = index => {
  galleryIndex = (index + gallery.length) % gallery.length;
  const [src, title] = gallery[galleryIndex];
  document.querySelector('#lightbox-image').src = `./assets/${src}`;
  document.querySelector('#lightbox-image').alt = title;
  document.querySelector('#lightbox-title').textContent = title;
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
const track = document.querySelector('#gallery-track');
const previous = document.querySelector('#gallery-prev');
const next = document.querySelector('#gallery-next');
const updateGalleryButtons = () => { previous.disabled = track.scrollLeft < 5; next.disabled = track.scrollLeft + track.clientWidth >= track.scrollWidth - 5; };
previous.addEventListener('click', () => track.scrollBy({left:-track.clientWidth*.75, behavior:motion.matches?'instant':'smooth'}));
next.addEventListener('click', () => track.scrollBy({left:track.clientWidth*.75, behavior:motion.matches?'instant':'smooth'}));
track.addEventListener('scroll', updateGalleryButtons, {passive:true});
addEventListener('resize', updateGalleryButtons);
updateGalleryButtons();
