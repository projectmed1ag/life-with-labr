import {escapeHtml as e} from './render-litters.mjs';
export function renderGallery(posts) {
  let index=0;
  return posts.length ? posts.map(post=>`<article class="gallery-post">
    <div class="moments-grid">${post.photos.map(photo=>`<button class="gallery-item${photo.height>photo.width?' tall':''}" data-gallery="${index++}" aria-label="Открыть фотографию: ${e(photo.alt||post.title)}"><img src="/assets/${e(photo.src)}" alt="${e(photo.alt||post.title)}" loading="lazy" width="${photo.width}" height="${photo.height}"><span class="image-expand" aria-hidden="true">+</span></button>`).join('')}</div>
    ${post.title?`<h2>${e(post.title)}</h2>`:''}${post.date?`<time datetime="${post.date}">${new Intl.DateTimeFormat('ru-RU',{dateStyle:'long',timeZone:'UTC'}).format(new Date(post.date))}</time>`:''}${post.text?`<p class="gallery-caption">${e(post.text)}</p>`:''}</article>`).join('') : '<p>Скоро здесь появятся новые фотографии.</p>';
}
