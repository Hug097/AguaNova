/* Aqua · pantalla de inicio */
(function () {
  'use strict';

  const A = window.Aqua, U = A.UI, $ = U.$, F = A.fmt, CFG = A.CFG;

  U.montarNav('inicio');
  const tq = U.tanque($('#tanque'));
  const pintarDest = U.destinosInit($('#destinos'));

  let unidad = '%';   // el tanque alterna entre % y litros
  let rango = 72;     // puntos de la gráfica (cada punto = 5 min)

  $('#tanqueBtn').addEventListener('click', () => {
    unidad = unidad === '%' ? 'L' : '%';
    pintar(A.estado());
    U.aviso('Mostrando el nivel en ' + (unidad === '%' ? 'porcentaje' : 'litros'));
  });

  $('#chipsRango').addEventListener('click', ev => {
    const b = ev.target.closest('.chip');
    if (!b) return;
    rango = +b.dataset.n;
    U.$$('.chip', $('#chipsRango')).forEach(c => c.classList.toggle('on', c === b));
    pintar(A.estado());
  });

  $('#btnActualizar').addEventListener('click', ev => {
    const b = ev.currentTarget;
    b.classList.remove('gira'); void b.offsetWidth; b.classList.add('gira');
    A.actualizar();
    U.aviso('Datos simulados actualizados');
  });

  function pintar(e) {
    const d = A.derivados(e);
    const filtrosListos = e.ciclos >= CFG.limiteCiclos;

    /* tanque y nivel */
    tq.set(e.nivel);
    $('#pctv').textContent = unidad === '%' ? Math.round(e.nivel) : F.num(d.litros, 0);
    $('#pctu').textContent = unidad;
    const p = $('#estado');
    p.className = 'pill ' + d.estadoClase;
    p.textContent = d.estadoTxt;
    $('#litros').textContent = F.num(d.litros, 0) + ' de ' + F.num(CFG.capacidad, 0) + ' L';
    $('#llenaEn').textContent =
      d.estado === 'llena' ? 'Cisterna llena'
      : e.lluvia ? (d.tiempoLlenar ? 'Llena en ~' + F.dur(d.tiempoLlenar) : 'Entra muy poca agua')
      : 'Esperando lluvia';

    /* saludo con la mascota */
    let t, s;
    if (filtrosListos) { t = 'Toca limpiar los filtros'; s = 'Ya van ' + e.ciclos + ' ciclos de llenado.'; }
    else if (d.estado === 'vacia') { t = 'Cisterna casi vacía'; s = 'Necesitamos que llueva pronto.'; }
    else if (d.estado === 'llena') { t = '¡Cisterna llena!'; s = 'Tienes ' + F.num(d.litros, 0) + ' litros listos.'; }
    else if (e.lluvia) { t = '¡Está lloviendo!'; s = 'Estamos captando ' + F.num(e.caudal, 1) + ' L por minuto.'; }
    else { t = 'Todo en orden'; s = 'El nivel está estable.'; }
    $('#saludoT').textContent = t;
    $('#saludoS').textContent = s;
    const src = U.sticker(U.mascota(e, d));
    if ($('#mascota').getAttribute('src') !== src) $('#mascota').setAttribute('src', src);

    /* aviso de filtros */
    $('#alerta').classList.toggle('on', filtrosListos);
    $('#alertaT').textContent = ' Se cumplieron ' + e.ciclos + ' ciclos de llenado.';

    /* tarjetas */
    $('#tLluvia').classList.toggle('on', e.lluvia);
    $('#vLluvia').textContent = e.lluvia ? 'Lloviendo' : 'Sin lluvia';
    $('#sLluvia').textContent = e.lluvia ? F.num(e.caudal, 1) + ' L/min entrando' : 'Esperando lluvia';
    $('#tTapa').classList.toggle('on', e.tapa);
    $('#vTapa').textContent = e.tapa ? 'Abierta' : 'Cerrada';
    $('#sTapa').textContent = e.tapa ? 'Recibiendo agua' : 'Protegiendo la cisterna';
    $('#vCalidad').textContent = d.score + '/100';
    $('#sCalidad').textContent = d.scoreTxt;
    $('#vAuton').textContent = F.num(d.autonomia, 1) + ' días';

    pintarDest(e);

    /* gráfica */
    U.grafica($('#grafica'), e.hist.slice(-rango).map(x => ({ t: x.t, v: x.nivel })), {
      min: 0, max: 100, unidad: '%', dec: 0, etiqueta: 'Nivel de la cisterna',
      lineas: [{ v: CFG.pctLlena, txt: 'Llena' }, { v: CFG.pctRearme, txt: 'Rearme' }]
    });

    /* filtros */
    const lim = CFG.limiteCiclos, c = e.ciclos;
    $('#fc').textContent = Math.min(c, lim) + '/' + lim;
    $('#barf').style.width = Math.min(100, c * 100 / lim) + '%';
    $('#barf').classList.toggle('full', filtrosListos);
    $('#filtroV').textContent = filtrosListos ? 'Limpieza pendiente'
      : (lim - c) + (lim - c === 1 ? ' ciclo' : ' ciclos') + ' para limpiar';
  }

  A.suscribir(pintar);
  U.relojUltima($('#ultima'), 'Datos: ');
  A.iniciar();
})();
