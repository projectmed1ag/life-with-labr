import {translateText} from './localization.js';
const english = document.documentElement.lang === 'en';
const t = text => translateText(text, english ? 'en' : 'ru');
const litter = JSON.parse(document.querySelector('#litter-data').textContent);
const puppies = new Map(litter.puppies.map(puppy => [puppy.id, puppy]));
const photoDialog = document.querySelector('#puppy-photo-dialog');
const photoImage = document.querySelector('#puppy-photo-image');
const photoTitle = document.querySelector('#puppy-photo-title');
const photoCount = document.querySelector('#puppy-photo-count');
const previousPhoto = photoDialog.querySelector('.puppy-photo-prev');
const nextPhoto = photoDialog.querySelector('.puppy-photo-next');
let galleryPuppy;
let photoIndex = 0;

function showPhoto(index) {
  const photos = galleryPuppy.photos;
  photoIndex = (index + photos.length) % photos.length;
  const photo = photos[photoIndex];
  photoImage.src = `/assets/${photo.src}`;
  photoImage.alt = t(photo.alt);
  photoTitle.textContent = t(galleryPuppy.name);
  photoCount.textContent = photos.length > 1 ? `${photoIndex + 1} / ${photos.length}` : '';
  previousPhoto.hidden = nextPhoto.hidden = photos.length < 2;
}

document.querySelectorAll('[data-puppy-photo]').forEach(link => {
  link.addEventListener('click', event => {
    if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    galleryPuppy = puppies.get(link.dataset.puppyPhoto);
    showPhoto(Number(link.dataset.photoIndex));
    photoDialog.showModal();
  });
});
previousPhoto.addEventListener('click', () => showPhoto(photoIndex - 1));
nextPhoto.addEventListener('click', () => showPhoto(photoIndex + 1));
photoDialog.addEventListener('keydown', event => {
  if (!['ArrowLeft', 'ArrowRight'].includes(event.key)) return;
  event.preventDefault();
  showPhoto(photoIndex + (event.key === 'ArrowLeft' ? -1 : 1));
});
let touchStart;
photoDialog.addEventListener('touchstart', event => {
  touchStart = [event.changedTouches[0].clientX, event.changedTouches[0].clientY];
}, {passive:true});
photoDialog.addEventListener('touchend', event => {
  if (!touchStart || event.touches.length) return;
  const x = event.changedTouches[0].clientX - touchStart[0];
  const y = event.changedTouches[0].clientY - touchStart[1];
  if (Math.abs(x) > 50 && Math.abs(x) > Math.abs(y) * 1.5) showPhoto(photoIndex + (x < 0 ? 1 : -1));
  touchStart = null;
}, {passive:true});
photoDialog.addEventListener('close', () => { touchStart = null; });

const contactChoices = [...document.querySelectorAll('.puppy-contact')];
for (const choice of contactChoices) {
  choice.addEventListener('toggle', () => {
    if (choice.open) contactChoices.forEach(other => { if (other !== choice) other.open = false; });
  });
  choice.addEventListener('keydown', event => {
    if (event.key !== 'Escape' || !choice.open) return;
    event.preventDefault();
    choice.open = false;
    choice.querySelector('summary').focus({preventScroll:true});
  });
}
document.addEventListener('click', event => {
  contactChoices.forEach(choice => { if (choice.open && !choice.contains(event.target)) choice.open = false; });
});
