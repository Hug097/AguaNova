/* Aqua · pantalla de llenado */
(function () {
  'use strict';

  const A = window.Aqua, U = A.UI, $ = U.$, F = A.fmt, CFG = A.CFG;

  U.montarNav('llenado');
  const tq = U.tanque($('#tanque'));
  const pintarDest = U.destinosInit($('#destinos'));
  let rango = 72;
  const abiertos = new Set();   // datos con la explicación desplegada

  $('#chipsRango').addEventListener('click', ev => {
    const b = ev.target.closest('.chip');
    if (!b) return;
    rango = +b.dataset.n;
    U.$$('.chip', $('#chipsRango')).forEach(c => c.classList.toggle('on', c === b));
    pintar(A.estado());
  });

  $('#stats').addEventListener('click', ev => {
    const b = ev.target.closest('.dato');
    if (!b) return;
    const id = b.dataset.id;
    if (abiertos.has(id)) abiertos.delete(id); else abiertos.add(id);
    b.classList.toggle('abierto', abiertos.has(id));
  });

  function pintar(e) {
    const d = A.derivados(e);
    tq.set(e.nivel);

    $('#dNivel').textContent = F.num(e.nivel, 1) + ' %';
    $('#dLitros').textContent = F.num(d.litros, 0) + ' L';
    const p = $('#dEstado'); p.className = 'pill ' + d.estadoClase; p.textContent = d.estadoTxt;
    $('#dLlena').textContent = d.estado === 'llena' ? 'Ya está llena'
      : e.lluvia ? (d.tiempoLlenar ? '~' + F.dur(d.tiempoLlenar) : 'Muy lento') : 'Sin lluvia';

    /* hitos */
    $('#hitos').innerHTML = [25, 50, 75, CFG.pctLlena].map(h =>
      '<div class="hito' + (e.nivel >= h ? ' listo' : '') + '"><b>' + h + '%</b>' + F.num(h / 100 * CFG.capacidad, 0) + ' L</div>'
    ).join('');
    $('#cicloTxt').textContent = e.armado
      ? 'Contando ciclo: cuando llegue a ' + CFG.pctLlena + ' % se sumará el ciclo #' + (e.ciclos + 1) + '.'
      : 'Para contar otro ciclo, primero debe bajar de ' + CFG.pctRearme + ' %. Van ' + e.ciclos + ' de ' + CFG.limiteCiclos + '.';

    pintarDest(e);

    /* gráfica y resumen */
    const serie = e.hist.slice(-rango);
    U.grafica($('#grafica'), serie.map(x => ({ t: x.t, v: x.nivel })), {
      min: 0, max: 100, unidad: '%', etiqueta: 'Nivel de la cisterna',
      lineas: [{ v: CFG.pctLlena, txt: 'Llena' }, { v: CFG.pctRearme, txt: 'Rearme' }]
    });
    const v = serie.map(x => x.nivel);
    $('#rMax').textContent = F.num(Math.max.apply(null, v), 0) + '%';
    $('#rMin').textContent = F.num(Math.min.apply(null, v), 0) + '%';
    $('#rProm').textContent = F.num(v.reduce((a, b) => a + b, 0) / v.length, 0) + '%';

    /* datos extra */
    const datos = [
      ['litros', 'tanque.svg', 'Agua almacenada', F.num(d.litros, 0) + ' L', 'Litros que hay ahora en la cisterna (nivel por capacidad).'],
      ['cap', 'tanque.svg', 'Capacidad', F.num(CFG.capacidad, 0) + ' L', 'Volumen total de la cisterna. Se considera llena al ' + CFG.pctLlena + ' %.'],
      ['falta', 'gotita-feliz.svg', 'Falta para llenar', F.num(d.falta, 0) + ' L', 'Litros que faltan para llegar al ' + CFG.pctLlena + ' %.'],
      ['caudal', 'nube-lluvia.svg', 'Caudal de entrada', F.num(e.caudal, 1) + ' L/min', 'Agua que entra por la tapa mientras llueve. Sin lluvia es 0.'],
      ['consumo', 'hoja.svg', 'Consumo estimado', F.num(CFG.consumo, 1) + ' L/min', 'Agua que se usa en promedio (riego, limpieza, etc.).'],
      ['captado', 'nube-lluvia.svg', 'Agua captada', F.num(e.captado, 0) + ' L', 'Total de litros que han entrado desde que empezó la simulación.'],
      ['auton', 'sol.svg', 'Autonomía', F.num(d.autonomia, 1) + ' días', 'Cuántos días te dura el agua con un uso de ' + CFG.consumoDiario + ' L al día.'],
      ['lluvia', 'nube-lluvia.svg', 'Tiempo de lluvia', F.dur(e.lluviaMin || 0), 'Tiempo total que ha llovido durante la simulación (' + (e.lluviaEventos || 0) + ' lluvias).']
    ];
    $('#stats').innerHTML = datos.map(x =>
      '<button class="dato' + (abiertos.has(x[0]) ? ' abierto' : '') + '" data-id="' + x[0] + '">' +
      '<img class="sticker" src="' + U.sticker(x[1]) + '" alt="">' +
      '<span class="t">' + x[2] + '</span><span class="v">' + x[3] + '</span><span class="i">' + x[4] + '</span></button>'
    ).join('');
  }

  A.suscribir(pintar);
  U.relojUltima($('#ultima'), 'Datos simulados · actualizado ');
  A.iniciar();
})();
