export function initLivingPuppies(motion) {
  const group = document.querySelector('.living-cta');
  if (!group) return;
  const videos = [...group.querySelectorAll('video')];
  let visible = false;
  const shouldPlay = () => visible && !document.hidden && !motion.matches;
  const sync = () => videos.forEach(video => {
    if (!shouldPlay()) {
      video.pause();
      if (motion.matches) video.closest('.living-pup').classList.remove('is-playing');
      return;
    }
    if (!video.canPlayType('video/webm; codecs="vp9"')) return;
    if (!video.getAttribute('src')) {
      video.muted = true;
      video.src = video.dataset.videoSrc;
      video.load();
    }
    video.play().catch(() => video.closest('.living-pup').classList.remove('is-playing'));
  });
  videos.forEach(video => {
    video.addEventListener('playing', () => {
      if (shouldPlay()) video.closest('.living-pup').classList.add('is-playing');
      else video.pause();
    });
    video.addEventListener('error', () => video.closest('.living-pup').classList.remove('is-playing'));
  });
  new IntersectionObserver(([entry]) => {visible=entry.isIntersecting;sync();},{threshold:.1}).observe(group);
  document.addEventListener('visibilitychange',sync);
  motion.addEventListener('change',sync);
}
