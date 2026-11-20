/* Aqua · pantalla de mantenimiento de filtros */
(function () {
  'use strict';

  const A = window.Aqua, U = A.UI, $ = U.$, F = A.fmt, CFG = A.CFG;

  U.montarNav('filtros');

  const PASOS = [
    'Cierra la entrada de agua y espera a que deje de llover',
    'Retira la malla de hojas y enjuágala con agua limpia',
    'Cepilla suavemente el filtro para quitar el lodo',
    'Revisa que no haya sedimento ni basura en la entrada',
    'Vuelve a colocar todo y revisa que quede bien sujeto'
  ];
  const CLAVE = 'aqua_pasos_v1';
  let hechos = PASOS.map(() => false);
  try { const g = JSON.parse(localStorage.getItem(CLAVE)); if (Array.isArray(g) && g.length === PASOS.length) hechos = g; } catch (_) { /* sin guardado */ }
  const guardar = () => { try { localStorage.setItem(CLAVE, JSON.stringify(hechos)); } catch (_) { /* ignorar */ } };

  $('#listaPasos').addEventListener('click', ev => {
    const b = ev.target.closest('.paso');
    if (!b) return;
    const i = +b.dataset.i;
    hechos[i] = !hechos[i];
    guardar();
    pintarPasos();
  });

  $('#btnLimpie').addEventListener('click', () => {
    if (!window.confirm('¿Ya limpiaste los filtros? El contador volverá a 0.')) return;
    A.limpiarFiltros();
    hechos = PASOS.map(() => false);
    guardar();
    pintarPasos();
    U.aviso('¡Listo! Contador en 0');
  });

  function pintarPasos() {
    $('#listaPasos').innerHTML = PASOS.map((t, i) =>
      '<li><button class="paso' + (hechos[i] ? ' ok' : '') + '" data-i="' + i + '"><span class="cj">' + U.ico('check') + '</span>' + t + '</button></li>').join('');
    $('#progPasos').textContent = hechos.filter(Boolean).length + '/' + PASOS.length;
  }

  function pintar(e) {
    const lim = CFG.limiteCiclos, c = e.ciclos, listo = c >= lim;
    const d = A.derivados(e);

    $('#alerta').classList.toggle('on', listo);
    $('#alertaT').textContent = ' Se cumplieron ' + c + ' ciclos de llenado.';

    $('#anillo').innerHTML = U.anillo(Math.min(100, c * 100 / lim), {
      color: listo ? '#fbbf24' : '#4cb8ff', texto: Math.min(c, lim) + '/' + lim, sub: 'ciclos', etiqueta: 'Ciclos de llenado'
    });
    const src = U.sticker(U.mascota(e, d));
    if ($('#mascota').getAttribute('src') !== src) $('#mascota').setAttribute('src', src);
    $('#titulo').textContent = listo ? 'Es hora de limpiar los filtros' : 'Filtros en buen estado';
    $('#texto').textContent = listo
      ? 'Ya se cumplieron ' + c + ' ciclos de llenado. Un filtro sucio hace que el agua se vea turbia.'
      : 'Faltan ' + (lim - c) + (lim - c === 1 ? ' ciclo' : ' ciclos') + ' para la próxima limpieza. Un ciclo es cuando la cisterna baja del ' + CFG.pctRearme + ' % y vuelve a llenarse.';

    $('#limpiezas').innerHTML = e.limpiezas.length
      ? e.limpiezas.map(l =>
        '<li><span class="pto c-filtros">' + U.ico('check') + '</span><span class="tx">Filtros limpiados<br><small style="color:var(--muted);font-weight:400">tras ' + l.ciclos + ' ciclos</small></span>' +
        '<span class="hr">' + F.fecha(l.t) + '<br>' + F.hora(l.t) + '</span></li>').join('')
      : '<li><p class="vacio" style="width:100%">Todavía no has registrado limpiezas.</p></li>';
  }

  pintarPasos();
  A.suscribir(pintar);
  U.relojUltima($('#ultima'), 'Datos simulados · actualizado ');
  A.iniciar();
})();
