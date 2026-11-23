// Family Island: keeps the (encrypted) page on this phone so it opens without a signal.
// The page is fetched from the network first, so an update is never held back; the saved copy is used only offline.
// Nothing readable is stored here: the page is encrypted and still needs the family password or a personal link.
const CACHE = 'family-island-v1';
const CORE = ['./', 'index.html', 'manifest.webmanifest', 'icon-192.png', 'icon-512.png'];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(CORE)).then(() => self.skipWaiting()).catch(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const r = e.request, u = new URL(r.url);
  if (r.method !== 'GET' || u.origin !== self.location.origin) return;
  const page = r.mode === 'navigate';
  const core = CORE.some(p => u.pathname.endsWith(p === './' ? '/' : '/' + p));
  if (!page && !core) return;
  e.respondWith(fetch(r).then(res => {
    if (res && res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(page ? 'index.html' : r, copy)).catch(() => {}); }
    return res;
  }).catch(() => caches.match(page ? 'index.html' : r).then(m => m || caches.match('./'))));
});
