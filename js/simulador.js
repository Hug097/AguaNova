/* Aqua · simulador: cambia y actualiza los datos de prueba */
(function () {
  'use strict';

  const A = window.Aqua, U = A.UI, $ = U.$, F = A.fmt, CFG = A.CFG;

  U.montarNav('inicio');   // el simulador cuelga del inicio

  const rnd = (a, b) => a + Math.random() * (b - a);

  /* deslizadores: [id del input, clave del estado, decimales, sufijo] */
  const DESL = [
    ['rNivel', 'nivel', 0, ' %', 'oNivel'],
    ['rPh', 'ph', 1, '', 'oPh'],
    ['rTurbidez', 'turbidez', 1, '', 'oTurbidez'],
    ['rTemp', 'temp', 1, '', 'oTemp'],
    ['rTds', 'tds', 0, '', 'oTds']
  ];

  DESL.forEach(d => {
    const el = $('#' + d[0]);
    el.addEventListener('pointerdown', () => { el._arrastre = true; });
    ['pointerup', 'pointercancel', 'blur', 'change'].forEach(t => el.addEventListener(t, () => { el._arrastre = false; }));
    el.addEventListener('input', () => {
      el._arrastre = true;
      const c = {}; c[d[1]] = +el.value;
      $('#' + d[4]).textContent = F.num(+el.value, d[2]) + d[3];
      A.ajustar(c);
    });
  });

  $('#swAuto').addEventListener('change', ev => A.ajustar({ auto: ev.target.checked }));
  $('#swClima').addEventListener('change', ev => A.ajustar({ climaAuto: ev.target.checked }));
  $('#swLluvia').addEventListener('change', ev => A.ajustar({ lluvia: ev.target.checked }));
  $('#selVel').addEventListener('change', ev => A.ajustar({ velocidad: +ev.target.value }));

  $('#btnAct').addEventListener('click', () => {
    A.actualizar();
    U.aviso('Datos simulados actualizados');
  });

  $('#btnNuevos').addEventListener('click', () => {
    A.ajustar({
      nivel: Math.round(rnd(10, 95)), ph: +rnd(6.2, 8.2).toFixed(1), turbidez: +rnd(0.5, 4).toFixed(1),
      temp: +rnd(14, 26).toFixed(1), tds: Math.round(rnd(80, 260))
    });
    U.aviso('Datos nuevos generados');
  });

  $('#btnReset').addEventListener('click', () => {
    if (!window.confirm('¿Reiniciar toda la simulación? Se borrarán el historial y los eventos.')) return;
    A.reiniciar();
    U.aviso('Simulación reiniciada');
  });

  $('#aLlenar').addEventListener('click', () => { A.ajustar({ nivel: 100 }); U.aviso('Cisterna al 100 %'); });
  $('#aVaciar').addEventListener('click', () => { A.ajustar({ nivel: 5 }); U.aviso('Cisterna al 5 %'); });
  $('#aCiclo').addEventListener('click', () => {
    A.ajustar({ nivel: 20 });     // baja del rearme...
    A.ajustar({ nivel: 96 });     // ...y vuelve a llenarse
    U.aviso('Ciclo de llenado completado');
  });
  $('#aCiclos9').addEventListener('click', () => { A.ajustar({ ciclos: 9 }); U.aviso('Ciclos en 9'); });
  $('#aCiclos10').addEventListener('click', () => { A.ajustar({ ciclos: 10 }); U.aviso('Ciclos en 10: aviso de filtros activado'); });

  function pintar(e) {
    const d = A.derivados(e);

    $('#vNivel').textContent = F.num(e.nivel, 0) + ' %';
    $('#vTexto').textContent = F.num(d.litros, 0) + ' L · ' + (e.lluvia ? 'lloviendo' : 'sin lluvia') + ' · ' + e.ciclos + '/' + CFG.limiteCiclos + ' ciclos';
    const p = $('#vEstado'); p.className = 'pill ' + d.estadoClase; p.textContent = d.estadoTxt;
    const src = U.sticker(U.mascota(e, d));
    if ($('#mascota').getAttribute('src') !== src) $('#mascota').setAttribute('src', src);

    /* los controles siguen a la simulación, salvo el que se está moviendo */
    DESL.forEach(x => {
      const el = $('#' + x[0]);
      if (!el._arrastre) el.value = e[x[1]];
      if (!el._arrastre) $('#' + x[4]).textContent = F.num(e[x[1]], x[2]) + x[3];
    });
    $('#swAuto').checked = !!e.auto;
    $('#swClima').checked = !!e.climaAuto;
    $('#swLluvia').checked = !!e.lluvia;
    $('#selVel').value = String(e.velocidad || 1);
  }

  A.suscribir(pintar);
  U.relojUltima($('#ultima'), 'Cada actualización avanza 5 min simulados · última ');
  A.iniciar();
})();
