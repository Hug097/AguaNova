/* Aqua · pantalla de calidad del agua */
(function () {
  'use strict';

  const A = window.Aqua, U = A.UI, $ = U.$, F = A.fmt, CFG = A.CFG;

  U.montarNav('calidad');
  let sel = 'ph';
  let rango = 72;

  const COLOR = { ok: '#34d399', warn: '#fbbf24', mal: '#f87171' };
  const TXT = { ok: 'Bien', warn: 'Atención', mal: 'Fuera de rango' };

  $('#metricas').addEventListener('click', ev => {
    const c = ev.target.closest('.metrica');
    if (!c) return;
    sel = c.dataset.id;
    pintar(A.estado());
  });

  $('#chipsRango').addEventListener('click', ev => {
    const b = ev.target.closest('.chip');
    if (!b) return;
    rango = +b.dataset.n;
    U.$$('.chip', $('#chipsRango')).forEach(c => c.classList.toggle('on', c === b));
    pintar(A.estado());
  });

  function pintar(e) {
    const d = A.derivados(e);

    $('#anillo').innerHTML = U.anillo(d.score, { color: COLOR[d.scoreClase], texto: d.score, sub: d.scoreTxt, etiqueta: 'Calificación del agua' });
    $('#uso').textContent = d.uso;
    const p = $('#scorePill'); p.className = 'pill ' + d.scoreClase; p.textContent = d.scoreTxt;

    $('#metricas').innerHTML = d.items.map(it => {
      const izq = (it.ideal[0] - it.min) / (it.max - it.min) * 100;
      const ancho = (it.ideal[1] - it.ideal[0]) / (it.max - it.min) * 100;
      const pos = Math.min(100, Math.max(0, (it.valor - it.min) / (it.max - it.min) * 100));
      return '<button class="metrica' + (it.id === sel ? ' sel' : '') + '" data-id="' + it.id + '">' +
        '<div class="cab"><img class="sticker" src="' + U.sticker(it.sticker) + '" alt=""><span class="n">' + it.nombre + '</span></div>' +
        '<div class="val">' + F.num(it.valor, it.dec) + '<small>' + it.unidad + '</small></div>' +
        '<span class="pill ' + it.estado + '">' + TXT[it.estado] + '</span>' +
        '<div class="escala"><i class="zona" style="left:' + izq + '%;width:' + ancho + '%"></i><b class="marca" style="left:' + pos + '%"></b></div>' +
        '</button>';
    }).join('');

    const it = d.items.find(i => i.id === sel);
    $('#grafTitulo').textContent = it.nombre + (it.unidad ? ' (' + it.unidad + ')' : '');
    let desc = it.desc;
    if (it.id === 'turbidez' && e.ciclos >= 5) desc += ' Ahora los filtros llevan ' + e.ciclos + ' ciclos, por eso sube.';
    $('#descM').textContent = desc;
    U.grafica($('#grafica'), e.hist.slice(-rango).map(x => ({ t: x.t, v: x[sel] })), {
      min: it.min, max: it.max, dec: it.dec, unidad: it.unidad, zona: it.ideal,
      color: COLOR[it.estado], etiqueta: 'Historial de ' + it.nombre
    });
  }

  A.suscribir(pintar);
  U.relojUltima($('#ultima'), 'Datos simulados · actualizado ');
  A.iniciar();
})();
