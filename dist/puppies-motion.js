const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
const finePointer = matchMedia('(hover: hover) and (pointer: fine)');
const cards = [...document.querySelectorAll('.litter-card,.puppy-grid')];

// The album opens once. The unenhanced page already shows all its content.
const observer = new IntersectionObserver(entries => {
  for (const {target, isIntersecting} of entries) {
    if (!isIntersecting) continue;
    if (!reducedMotion.matches) target.classList.add('is-presented');
    observer.unobserve(target);
  }
}, {threshold: .15});
cards.forEach(card => observer.observe(card));

// Release the entrance transform so hover can straighten the photograph.
document.querySelectorAll('.puppy-portrait').forEach(photo => {
  photo.addEventListener('animationend', event => {
    if (event.animationName === 'album-settle') photo.style.animation = 'none';
  });
});

// Move only the photo within its frame; links and text stay under the pointer.
const covers = [...document.querySelectorAll('.litter-card-cover,.parent-photo,.puppy-portrait')];
const reset = cover => {
  cover.style.removeProperty('--photo-x');
  cover.style.removeProperty('--photo-y');
};
for (const cover of covers) {
  let bounds;
  cover.addEventListener('pointerenter', () => { bounds = cover.getBoundingClientRect(); });
  cover.addEventListener('pointermove', event => {
    if (!bounds || !finePointer.matches || reducedMotion.matches || event.pointerType !== 'mouse') return;
    const x = Math.max(-1, Math.min(1, (event.clientX - bounds.left) / bounds.width * 2 - 1));
    const y = Math.max(-1, Math.min(1, (event.clientY - bounds.top) / bounds.height * 2 - 1));
    const travel = cover.matches('.litter-card-cover') ? 5 : 3;
    cover.style.setProperty('--photo-x', `${x * travel}px`);
    cover.style.setProperty('--photo-y', `${y * travel}px`);
  }, {passive:true});
  cover.addEventListener('pointerleave', () => { bounds = null; reset(cover); });
  cover.addEventListener('pointercancel', () => { bounds = null; reset(cover); });
}
const resetPhotos = () => covers.forEach(reset);
reducedMotion.addEventListener('change', resetPhotos);
finePointer.addEventListener('change', resetPhotos);
document.addEventListener('visibilitychange', () => { if (document.hidden) resetPhotos(); });
