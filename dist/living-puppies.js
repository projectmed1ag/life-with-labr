export function initLivingPuppies(motion) {
  const group = document.querySelector('.living-cta');
  if (!group) return;
  const videos = [...group.querySelectorAll('video')];
  const pups = [...group.querySelectorAll('.living-pup')];
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
    video.addEventListener('loadedmetadata', () => {
      if (video.dataset.start) video.currentTime = Math.min(Number(video.dataset.start), Math.max(0,video.duration-.1));
    }, {once:true});
    video.addEventListener('playing', () => {
      if (shouldPlay()) video.closest('.living-pup').classList.add('is-playing');
      else video.pause();
    });
    video.addEventListener('error', () => video.closest('.living-pup').classList.remove('is-playing'));
  });
  const seated = group.classList.contains('living-cta--sitting');
  const setPlayful = on => videos.forEach((video,index) => {video.playbackRate=on && !seated ? 1.3+index*.05 : 1;});
  group.addEventListener('pointermove', event => {
    if (event.pointerType==='touch' || motion.matches) return;
    const box=group.getBoundingClientRect();
    const offset=Math.max(-1,Math.min(1,(event.clientX-box.left)/box.width*2-1))*7;
    if (!seated) pups.forEach(pup => pup.style.setProperty('--puppy-x',`${offset.toFixed(1)}px`));
    setPlayful(true);
  });
  group.addEventListener('pointerleave', () => {pups.forEach(pup=>pup.style.removeProperty('--puppy-x'));setPlayful(false);});
  group.addEventListener('focusin', () => {if(!motion.matches)setPlayful(true);});
  group.addEventListener('focusout', () => setPlayful(false));
  new IntersectionObserver(([entry]) => {visible=entry.isIntersecting;sync();},{threshold:.1}).observe(group);
  document.addEventListener('visibilitychange',sync);
  motion.addEventListener('change',sync);
}
