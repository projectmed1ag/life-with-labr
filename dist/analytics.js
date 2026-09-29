// Website counter owned by lifewithlabr@yandex.ru; the Maps counter is separate.
export const METRIKA_COUNTER_ID = 113161968;
const initialized = new WeakSet();

export function messengerClick(href, {pathname = '/', puppyId = '', placement = 'page'} = {}) {
  let url;
  try { url = new URL(href); } catch { return null; }
  if (url.protocol !== 'https:' || url.username || url.password || url.port) return null;
  const channel = url.hostname === 'wa.me' && url.pathname.replace(/\/$/, '') === '/79251448648'
    ? 'whatsapp'
    : url.hostname === 't.me' && url.pathname.replace(/\/$/, '') === '/+79251448648'
      ? 'telegram' : null;
  if (!channel) return null;
  const page = pathname.split(/[?#]/, 1)[0];
  const params = {channel, page, placement};
  const litterId = page.match(/^\/(?:en\/)?puppies\/([a-z0-9-]+)\/$/)?.[1];
  if (litterId) params.litter = litterId;
  if (/^[a-z0-9-]{1,100}$/.test(puppyId)) params.puppy = puppyId;
  return params;
}

export function installAnalytics(win, doc, counterId = METRIKA_COUNTER_ID) {
  if (!Number.isSafeInteger(counterId) || counterId <= 0 || initialized.has(win)) return false;
  if (win.location.protocol !== 'https:' || !['lifewithlabr.ru', 'www.lifewithlabr.ru'].includes(win.location.hostname)) return false;
  if (/^\/(?:admin|api)(?:\/|$)/.test(win.location.pathname)) return false;
  initialized.add(win);
  win.ym = win.ym || function () { (win.ym.a = win.ym.a || []).push(arguments); };
  win.ym.l = win.ym.l || Date.now();
  const source = `https://mc.yandex.ru/metrika/tag.js?id=${counterId}`;
  if (![...doc.scripts].some(script => script.src === source)) {
    const script = doc.createElement('script');
    script.async = true;
    script.src = source;
    doc.head.append(script);
  }
  win.ym(counterId, 'init', {
    ssr: true, webvisor: false, clickmap: false, trackLinks: false,
    accurateTrackBounce: true, trackHash: false,
  });
  const onContactClick = event => {
    if (event.defaultPrevented || (event.type === 'auxclick' ? event.button !== 1 : event.button > 0)) return;
    const link = event.target?.closest?.('a[href]');
    if (!link) return;
    const placement = link.dataset.puppyContact ? 'puppy'
      : link.closest('.floating-contact-widget') ? 'floating'
        : link.closest('#contacts') ? 'contacts'
          : link.closest('.site-footer') ? 'footer' : 'page';
    const params = messengerClick(link.href, {
      pathname: win.location.pathname, puppyId: link.dataset.puppyContact, placement,
    });
    // Opening the contact menu is not a lead; only an actual messenger link counts.
    if (params) {
      try { win.ym(counterId, 'reachGoal', 'messenger_click', params); }
      catch { /* An unavailable counter must never prevent opening the messenger. */ }
    }
  };
  doc.addEventListener('click', onContactClick);
  doc.addEventListener('auxclick', onContactClick);
  return true;
}

if (typeof window !== 'undefined') installAnalytics(window, document);
