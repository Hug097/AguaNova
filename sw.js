/* Aqua · service worker: funciona sin conexión */
const VERSION = 'aqua-v2';
const ARCHIVOS = [
 "./",
 "assets/icons/icon-180.png",
 "assets/icons/icon-192.png",
 "assets/icons/icon-512.png",
 "assets/icons/icon-maskable-512.png",
 "assets/logo.svg",
 "assets/stickers/filtro.svg",
 "assets/stickers/gotita-alerta.svg",
 "assets/stickers/gotita-feliz.svg",
 "assets/stickers/gotita-triste.svg",
 "assets/stickers/hoja.svg",
 "assets/stickers/nube-lluvia.svg",
 "assets/stickers/ph.svg",
 "assets/stickers/sol.svg",
 "assets/stickers/tanque.svg",
 "assets/stickers/tds.svg",
 "assets/stickers/termometro.svg",
 "assets/stickers/turbidez.svg",
 "index.html",
 "js/app.js",
 "js/calidad.js",
 "js/comun.js",
 "js/datos.js",
 "js/filtros.js",
 "js/historial.js",
 "js/llenado.js",
 "js/pwa.js",
 "js/simulador.js",
 "manifest.webmanifest",
 "pantallas/calidad.html",
 "pantallas/filtros.html",
 "pantallas/historial.html",
 "pantallas/llenado.html",
 "pantallas/simulador.html",
 "style/pantallas.css",
 "style/style.css"
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(ARCHIVOS)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== VERSION).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(caches.match(e.request, { ignoreSearch: true }).then(hit => {
    const red = fetch(e.request).then(r => {
      if (r && (r.ok || r.type === 'opaque')) { const copia = r.clone(); caches.open(VERSION).then(c => c.put(e.request, copia)); }
      return r;
    }).catch(() => hit || (e.request.mode === 'navigate' ? caches.match('index.html') : undefined));
    return hit || red;
  }));
});
