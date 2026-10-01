import {createHmac, randomBytes} from 'node:crypto';

const DAY = 86400000;
export const moscowDay = (now = Date.now()) => new Date(now + 3 * 3600000).toISOString().slice(0, 10);
const shiftDay = (day, amount) => new Date(Date.parse(day + 'T12:00:00Z') + amount * DAY).toISOString().slice(0, 10);

export function openVisitors(db, now = () => Date.now()) {
  db.exec(`CREATE TABLE IF NOT EXISTS visitor_days (
    day TEXT NOT NULL, visitor TEXT NOT NULL, page TEXT NOT NULL,
    views INTEGER NOT NULL DEFAULT 1, last_seen INTEGER NOT NULL,
    PRIMARY KEY(day,visitor,page));`);
  db.prepare('INSERT OR IGNORE INTO meta VALUES(?,?)').run('visitors-started', new Date(now()).toISOString());
  db.prepare('INSERT OR IGNORE INTO meta VALUES(?,?)').run('visitors-secret', randomBytes(32).toString('hex'));
  const secret = db.prepare('SELECT value FROM meta WHERE key=?').get('visitors-secret').value;
  const startedAt = db.prepare('SELECT value FROM meta WHERE key=?').get('visitors-started').value;
  let cleanedDay = '';
  const cleanup = () => {
    const day = moscowDay(now());
    if (cleanedDay === day) return;
    db.prepare('DELETE FROM visitor_days WHERE day < ?').run(shiftDay(day, -89));
    cleanedDay = day;
  };
  cleanup();
  return {
    record(visitor, page) {
      cleanup();
      const hash = createHmac('sha256', secret).update(visitor).digest('hex');
      // Rapid refreshes/retried requests do not inflate page views.
      db.prepare(`INSERT INTO visitor_days VALUES(?,?,?,1,?)
        ON CONFLICT(day,visitor,page) DO UPDATE SET
        views=views+CASE WHEN excluded.last_seen-last_seen>=10000 THEN 1 ELSE 0 END,
        last_seen=excluded.last_seen`).run(moscowDay(now()), hash, page, now());
    },
    report(period = 'today', litters = []) {
      cleanup();
      const today = moscowDay(now());
      const from = period === 'yesterday' ? shiftDay(today, -1) : period === 'week' ? shiftDay(today, -6) : today;
      const to = period === 'yesterday' ? from : today;
      const rows = db.prepare(`SELECT page,COUNT(DISTINCT visitor) AS visitors,SUM(views) AS views
        FROM visitor_days WHERE day BETWEEN ? AND ? GROUP BY page`).all(from, to);
      const distinct = suffix => db.prepare(`SELECT COUNT(DISTINCT visitor) AS count FROM visitor_days
        WHERE day BETWEEN ? AND ? ${suffix}`).get(from, to).count;
      const pages = new Map(rows.map(row => [row.page, row]));
      return {
        period, from, to, startedAt, collecting:to>=moscowDay(Date.parse(startedAt)), updatedAt: new Date(now()).toISOString(),
        site: distinct(''),
        puppies: distinct("AND page='/puppies/'"),
        litters: distinct("AND page LIKE '/puppies/%' AND page!='/puppies/'"),
        byLitter: litters.map(litter => ({id:litter.id, title:litter.title,
          visitors:pages.get(`/puppies/${litter.id}/`)?.visitors || 0})),
      };
    },
  };
}

export function visitorPage(value) {
  if (typeof value !== 'string' || value.length > 200 || !/^\/(?:[a-z0-9-]+\/)*$/.test(value)) return null;
  return value.replace(/^\/en\//, '/');
}

export const validVisitor = value => typeof value === 'string' && /^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i.test(value);
