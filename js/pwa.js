/* Aqua · instalar como app (PWA) + modo sin conexión */
(function () {
  'use strict';
  const BASE = document.body.dataset.base || '';
  const $$ = s => Array.from(document.querySelectorAll(s));
  const instalada = () => matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
  let evt = null;

  function mostrar(v) { $$('[data-instalar],[data-instalar-card]').forEach(el => { el.hidden = !v; }); }
  mostrar(!instalada());

  addEventListener('beforeinstallprompt', e => { e.preventDefault(); evt = e; mostrar(!instalada()); });
  addEventListener('appinstalled', () => { evt = null; mostrar(false); });

  document.addEventListener('click', async ev => {
    if (!ev.target.closest('[data-instalar]')) return;
    if (evt) {
      evt.prompt();
      const r = await evt.userChoice;
      evt = null;
      if (r.outcome === 'accepted') mostrar(false);
    } else ayuda();
  });

  function ayuda() {
    const ua = navigator.userAgent;
    const ios = /iphone|ipad|ipod/i.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    const android = /android/i.test(ua);
    const seguro = location.protocol === 'https:' || ['localhost', '127.0.0.1'].includes(location.hostname);
    const pasos = !seguro
      ? ['Abre Aqua desde una dirección <b>https://</b> (por ejemplo GitHub Pages o Netlify) o desde <b>localhost</b>.', 'Las apps instalables no funcionan abriendo el archivo directamente.']
      : ios ? ['Abre esta página en <b>Safari</b>.', 'Toca el botón <b>Compartir</b> (cuadro con flecha).', 'Elige <b>Añadir a pantalla de inicio</b> y confirma.']
      : android ? ['Toca el menú <b>⋮</b> del navegador.', 'Elige <b>Instalar app</b> o <b>Añadir a pantalla de inicio</b>.']
      : ['En Chrome o Edge, busca el icono de <b>instalar</b> en la barra de direcciones.', 'También en el menú <b>⋮</b> → <b>Instalar Aqua</b>.'];
    const d = document.createElement('div');
    d.className = 'dlg';
    d.innerHTML = '<div class="dlg-in" role="dialog" aria-modal="true" aria-label="Instalar Aqua"><h2>Instala Aqua en tu dispositivo</h2><ol>' +
      pasos.map(p => '<li>' + p + '</li>').join('') + '</ol><button class="btn primary">Entendido</button></div>';
    const cerrar = () => { d.remove(); document.removeEventListener('keydown', tecla); };
    const tecla = e => { if (e.key === 'Escape') cerrar(); };
    d.addEventListener('click', e => { if (e.target === d || e.target.closest('.btn')) cerrar(); });
    document.addEventListener('keydown', tecla);
    document.body.appendChild(d);
    d.querySelector('.btn').focus();
  }

  if ('serviceWorker' in navigator && (location.protocol === 'https:' || ['localhost', '127.0.0.1'].includes(location.hostname))) {
    addEventListener('load', () => navigator.serviceWorker.register(BASE + 'sw.js').catch(() => {}));
  }
})();
