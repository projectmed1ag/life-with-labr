import {escapeHtml as e} from './render-litters.mjs';
export function renderGallery(collections) {
  const photos=collections.flatMap(collection=>collection.photos);
  return photos.length ? `<div class="gallery-collection"><div class="moments-grid">${photos.map((photo,index)=>`<button class="gallery-item${photo.height>photo.width?' tall':''}" data-gallery="${index}" aria-label="Открыть фотографию: ${e(photo.alt||'Life with Labr')}"><img src="/assets/${e(photo.src)}" alt="${e(photo.alt||'Life with Labr')}" loading="lazy" width="${photo.width}" height="${photo.height}"><span class="image-expand" aria-hidden="true">+</span></button>`).join('')}</div></div>` : '<p>Скоро здесь появятся новые фотографии.</p>';
}
