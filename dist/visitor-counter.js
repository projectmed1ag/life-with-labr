const installed = new WeakSet();

export function installVisitorCounter(win, doc) {
  if (installed.has(win) || win.location.protocol !== 'https:' ||
      !['lifewithlabr.ru', 'www.lifewithlabr.ru'].includes(win.location.hostname) ||
      /^\/(?:admin|api)(?:\/|$)/.test(win.location.pathname) || win.navigator?.webdriver) return false;
  installed.add(win);
  const send = () => {
    if (doc.visibilityState === 'hidden') return;
    doc.removeEventListener('visibilitychange', send);
    try {
      // Only a random first-party browser identifier and the page path are sent.
      // Without storage, skip rather than count every refresh as a new person.
      const key = 'lwl-visitor';
      let visitor = win.localStorage.getItem(key);
      if (!/^[a-f0-9-]{36}$/i.test(visitor || '')) {
        visitor = win.crypto.randomUUID();
        win.localStorage.setItem(key, visitor);
      }
      win.fetch('/visit', {method:'POST', headers:{'Content-Type':'application/json'},
        body:JSON.stringify({visitor, page:win.location.pathname}),
        credentials:'omit', keepalive:true}).catch(() => {});
    } catch { /* Storage or tracking may be blocked; the site still works. */ }
  };
  if (doc.visibilityState === 'hidden') doc.addEventListener('visibilitychange', send);
  else send();
  return true;
}

if (typeof window !== 'undefined') installVisitorCounter(window, document);
