/* Service Worker der Rechnungs-App: macht sie installierbar und startet auch ohne Netz.
   Alle Web-Apps auf jundt100.github.io teilen sich denselben Browser-Speicher. Darum:
   - eigener Cache-Name mit Präfix «jundt-rechnung-», nur eigene alte Caches werden gelöscht
     (nie die Caches von Budget, Ferien, Wunschliste usw.)
   - gesucht wird nur im eigenen Cache und nur innerhalb des eigenen Bereichs (/Rechnung/)
   Immer zuerst aus dem Netz laden (neue Version sofort nach Upload); fremde Domains (Firebase/Google) nie abfangen.
   Bei Änderungen die Versionsnummer erhöhen. */
const P = 'jundt-rechnung-', C = P + 'v2', OLD = ['jundt-app-v1'];
const SCOPE = self.registration.scope;
const SHELL = ['./', './index.html', './manifest.webmanifest', './icon-192.png', './icon-512.png', './icon-maskable-512.png', './icon-180.png', './favicon-32.png'];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(C).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(k => Promise.all(k.filter(x => (x.startsWith(P) && x !== C) || OLD.includes(x)).map(x => caches.delete(x)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const r = e.request;
  if (r.method !== 'GET' || !r.url.startsWith(SCOPE)) return;
  e.respondWith(
    fetch(r).then(res => {
      if (res.ok) { const cp = res.clone(); caches.open(C).then(c => c.put(r, cp)); }
      return res;
    }).catch(() => caches.open(C).then(c => c.match(r, { ignoreSearch: true }).then(m => m || (r.mode === 'navigate' ? c.match('./index.html') : Response.error()))))
  );
});
