/* Aqua · pantalla de historial de eventos */
(function () {
  'use strict';

  const A = window.Aqua, U = A.UI, $ = U.$, F = A.fmt;

  U.montarNav('historial');
  let cat = 'todos';

  const ICONO = {
    lluvia_inicio: 'nube', lluvia_fin: 'nube', tapa_abierta: 'tapa', tapa_cerrada: 'tapa',
    ciclo: 'refresh', alerta: 'alerta', limpieza: 'check', llena: 'gota', vacia: 'gota', sim: 'sliders'
  };

  $('#filtros').addEventListener('click', ev => {
    const b = ev.target.closest('.chip');
    if (!b) return;
    cat = b.dataset.cat;
    U.$$('.chip', $('#filtros')).forEach(c => c.classList.toggle('on', c === b));
    pintar(A.estado());
  });

  $('#btnCsv').addEventListener('click', () => {
    const e = A.estado();
    const filas = ['hora_simulada,nivel_pct,litros,ph,turbidez_ntu,temp_c,tds_ppm,lluvia'];
    e.hist.forEach(p => {
      filas.push([new Date(p.t).toISOString(), p.nivel, (p.nivel / 100 * A.CFG.capacidad).toFixed(0), p.ph, p.turbidez, p.temp, p.tds, p.lluvia].join(','));
    });
    const blob = new Blob([filas.join('\n')], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'aqua_datos_simulados.csv';
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    U.aviso('Descargando datos simulados');
  });

  function pintar(e) {
    $('#resumen').innerHTML = [
      ['Ciclos de llenado', e.ciclos + '/' + A.CFG.limiteCiclos, 'desde la última limpieza'],
      ['Agua captada', F.num(e.captado, 0) + ' L', 'en total'],
      ['Lluvias', e.lluviaEventos || 0, F.dur(e.lluviaMin || 0) + ' de lluvia'],
      ['Limpiezas', e.limpiezas.length, e.limpiezas.length ? 'última: ' + F.fecha(e.limpiezas[0].t) : 'ninguna todavía']
    ].map(x => '<div class="card"><div class="label">' + x[0] + '</div><div class="v">' + x[1] + '</div><div class="sub">' + x[2] + '</div></div>').join('');

    const lista = e.eventos.filter(ev => cat === 'todos' || ev.cat === cat);
    $('#linea').innerHTML = lista.length
      ? lista.map(ev =>
        '<li><span class="pto c-' + ev.cat + '">' + U.ico(ICONO[ev.tipo] || 'reloj') + '</span>' +
        '<span class="tx">' + ev.texto + '</span><span class="hr">' + F.fecha(ev.t) + '<br>' + F.hora(ev.t) + '</span></li>').join('')
      : '<li><p class="vacio" style="width:100%">Aún no hay eventos de este tipo.</p></li>';
  }

  A.suscribir(pintar);
  U.relojUltima($('#ultima'), 'Datos simulados · actualizado ');
  A.iniciar();
})();
