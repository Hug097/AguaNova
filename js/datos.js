/* Aqua · motor de datos simulados
   --------------------------------------------------------------
   Todo lo que ves en la app sale de aquí. Es un PROTOTIPO: los
   datos se generan solos y se guardan en localStorage para que
   todas las pantallas compartan el mismo estado.
   1 actualización = 5 minutos simulados.
*/
(function () {
  'use strict';

  const CLAVE = 'aqua_estado_v1';

  const CFG = {
    capacidad: 1000,     // litros de la cisterna
    limiteCiclos: 10,    // ciclos de llenado para limpiar filtros
    pctRearme: 30,       // debe bajar de este % para contar otro ciclo
    pctLlena: 95,
    pctVacia: 5,
    consumo: 1.2,        // L/min de uso promedio
    consumoDiario: 150,  // L/día (para la autonomía)
    pasoMin: 5,          // minutos simulados por actualización
    intervaloMs: 2000,   // cada cuánto se actualiza solo (a 1x)
    maxHist: 144,        // puntos de historial (12 h)
    maxEventos: 80
  };

  // Parámetros de calidad del agua (todo simulado)
  const CALIDAD = [
    { id: 'ph', nombre: 'pH', unidad: '', min: 5, max: 9, ideal: [6.5, 8.5], tol: 0.7, dec: 1, sticker: 'ph.svg',
      desc: 'Qué tan ácida o alcalina es el agua. La lluvia suele ser un poco ácida.' },
    { id: 'turbidez', nombre: 'Turbidez', unidad: 'NTU', min: 0, max: 10, ideal: [0, 2], tol: 3, dec: 1, sticker: 'turbidez.svg',
      desc: 'Qué tan turbia está. Sube cuando los filtros están sucios.' },
    { id: 'temp', nombre: 'Temperatura', unidad: '°C', min: 0, max: 40, ideal: [10, 25], tol: 5, dec: 1, sticker: 'termometro.svg',
      desc: 'Temperatura del agua almacenada. Si está muy tibia crecen bacterias y algas.' },
    { id: 'tds', nombre: 'Sólidos disueltos', unidad: 'ppm', min: 0, max: 600, ideal: [0, 300], tol: 200, dec: 0, sticker: 'tds.svg',
      desc: 'Minerales y sales disueltas. La lluvia trae pocos; el polvo del techo los sube.' }
  ];

  const rnd = (a, b) => a + Math.random() * (b - a);
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const r1 = v => Math.round(v * 10) / 10;
  const estadoDe = p => (p <= CFG.pctVacia ? 'vacia' : p >= CFG.pctLlena ? 'llena' : 'llenando');

  // Destinos del agua que sale de la cisterna (pesos = reparto aproximado del consumo)
  const DESTINOS = [
    { id: 'lavabos',    nombre: 'Lavabos',           peso: 34, color: '#4cb8ff', ico: 'lavabo' },
    { id: 'sanitarios', nombre: 'Sanitarios',        peso: 38, color: '#818cf8', ico: 'sanitario' },
    { id: 'limpieza',   nombre: 'Limpieza del agua', peso: 12, color: '#34d399', ico: 'limpieza' },
    { id: 'riego',      nombre: 'Riego',             peso: 16, color: '#fbbf24', ico: 'riego' }
  ];
  const cero = () => { const o = {}; DESTINOS.forEach(d => { o[d.id] = 0; }); return o; };
  function repartir(e, litros) {
    if (!e.destinos) { e.destinos = cero(); e.destinosCiclo = cero(); }
    const w = DESTINOS.map(d => d.peso * rnd(0.8, 1.2)), s = w.reduce((a, b) => a + b, 0);
    DESTINOS.forEach((d, i) => { const v = litros * w[i] / s; e.destinos[d.id] += v; e.destinosCiclo[d.id] += v; });
  }

  let est = null;
  let timer = null;
  const subs = [];

  /* ---------- formato ---------- */
  const fmt = {
    num: (v, d) => Number(v).toLocaleString('es-MX', { minimumFractionDigits: d || 0, maximumFractionDigits: d || 0 }),
    hora: t => new Date(t).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', hour12: false }),
    fecha: t => new Date(t).toLocaleDateString('es-MX', { day: 'numeric', month: 'short' }),
    dur: m => {
      m = Math.round(m);
      if (m < 60) return m + ' min';
      const h = Math.floor(m / 60), r = m % 60;
      if (h >= 48) return Math.round(h / 24) + ' días';
      return h + ' h' + (r ? ' ' + r + ' min' : '');
    }
  };

  /* ---------- eventos ---------- */
  function evento(e, cat, tipo, texto) {
    e.eventos.unshift({ t: e.reloj, cat: cat, tipo: tipo, texto: texto });
    if (e.eventos.length > CFG.maxEventos) e.eventos.length = CFG.maxEventos;
  }

  function setTapa(e, abierta) {
    if (e.tapa === abierta) return;
    e.tapa = abierta;
    evento(e, 'tapa', abierta ? 'tapa_abierta' : 'tapa_cerrada', abierta ? 'Tapa abierta' : 'Tapa cerrada');
  }

  function setLluvia(e, on) {
    if (e.lluvia === on) return;
    e.lluvia = on;
    evento(e, 'lluvia', on ? 'lluvia_inicio' : 'lluvia_fin', on ? 'Empezó a llover' : 'Dejó de llover');
    if (on) { e.lluviaEventos++; e.caudal = rnd(6, 10); } else { e.caudal = 0; }
    setTapa(e, on);
  }

  /* ---------- lógica de ciclos (igual que el ESP32) ---------- */
  function revisar(e) {
    if (e.nivel <= CFG.pctRearme) e.armado = true;
    if (e.armado && e.nivel >= CFG.pctLlena) {
      e.armado = false;
      e.destinosUltimo = Object.assign({}, e.destinosCiclo);
      e.destinosCiclo = cero();
      e.ciclos++;
      evento(e, 'ciclo', 'ciclo', 'Ciclo de llenado #' + e.ciclos + ' completado');
      if (e.ciclos === CFG.limiteCiclos) evento(e, 'filtros', 'alerta', 'Es hora de limpiar los filtros');
    }
    const s = estadoDe(e.nivel);
    if (s !== e.estado) {
      if (s === 'llena') evento(e, 'nivel', 'llena', 'Cisterna llena');
      else if (s === 'vacia') evento(e, 'nivel', 'vacia', 'Cisterna casi vacía');
      e.estado = s;
    }
  }

  function calidad(e) {
    const sucio = Math.min(e.ciclos, 14) * 0.28;               // filtros sucios -> más turbidez
    const objT = 0.7 + sucio + (e.lluvia ? 1.4 : 0);
    e.turbidez = clamp(e.turbidez + (objT - e.turbidez) * 0.2 + rnd(-0.12, 0.12), 0.2, 12);
    e.ph = clamp(e.ph + ((e.lluvia ? 6.8 : 7.3) - e.ph) * 0.12 + rnd(-0.05, 0.05), 5.5, 9);
    const f = new Date(e.reloj);
    const h = f.getHours() + f.getMinutes() / 60;
    const objTemp = 20 + 4 * Math.sin((h - 9) / 24 * 2 * Math.PI);
    e.temp = clamp(e.temp + (objTemp - e.temp) * 0.25 + rnd(-0.2, 0.2), 5, 40);
    e.tds = clamp(e.tds + ((e.lluvia ? 95 : 140 + e.ciclos * 4) - e.tds) * 0.15 + rnd(-3, 3), 20, 800);
  }

  function punto(e, reemplazar) {
    const p = {
      t: e.reloj, nivel: r1(e.nivel), ph: Math.round(e.ph * 100) / 100, turbidez: r1(e.turbidez),
      temp: r1(e.temp), tds: Math.round(e.tds), lluvia: e.lluvia ? 1 : 0
    };
    if (reemplazar && e.hist.length) e.hist[e.hist.length - 1] = p; else e.hist.push(p);
    if (e.hist.length > CFG.maxHist) e.hist.shift();
  }

  function paso(e) {
    e.reloj += CFG.pasoMin * 60000;
    if (e.climaAuto) {
      if (!e.lluvia && Math.random() < 0.035) setLluvia(e, true);
      else if (e.lluvia && Math.random() < 0.045) setLluvia(e, false);
    }
    if (e.lluvia) {
      e.caudal = clamp((e.caudal || 8) + rnd(-1.2, 1.2), 4, 14);
      e.lluviaMin += CFG.pasoMin;
    } else {
      e.caudal = 0;
    }
    let litros = e.nivel / 100 * CFG.capacidad;
    const entra = e.nivel < 100 ? e.caudal * CFG.pasoMin : 0;
    const sale = CFG.consumo * rnd(0.6, 1.4) * CFG.pasoMin;
    repartir(e, Math.min(sale, litros + entra));
    litros = clamp(litros + entra - sale, 0, CFG.capacidad);
    e.captado += entra;
    e.nivel = litros / CFG.capacidad * 100;
    calidad(e);
    revisar(e);
    punto(e, false);
  }

  /* ---------- estado ---------- */
  function nuevo() {
    const e = {
      version: 1, reloj: Date.now(), nivel: 38, estado: 'llenando', lluvia: false, tapa: false, caudal: 0,
      ciclos: 6, armado: true, auto: true, climaAuto: true, velocidad: 1,
      ph: 7.2, turbidez: 1.6, temp: 21, tds: 135,
      captado: 0, lluviaMin: 0, lluviaEventos: 0, ultima: Date.now(),
      destinos: cero(), destinosCiclo: cero(), destinosUltimo: null,
      hist: [], eventos: [], limpiezas: []
    };
    e.reloj -= CFG.maxHist * CFG.pasoMin * 60000;   // arrancamos en el pasado para tener historial
    for (let i = 0; i < CFG.maxHist; i++) paso(e);
    if (e.ciclos >= CFG.limiteCiclos) e.ciclos = CFG.limiteCiclos - 1;
    e.ultima = Date.now();
    return e;
  }

  function cargar() {
    try {
      const raw = localStorage.getItem(CLAVE);
      if (raw) {
        const e = JSON.parse(raw);
        if (e && e.version === 1 && Array.isArray(e.hist) && Array.isArray(e.eventos)) {
          if (!e.destinos) { e.destinos = cero(); e.destinosCiclo = cero(); e.destinosUltimo = null; }
          return e;
        }
      }
    } catch (_) { /* sin almacenamiento: se usa el estado en memoria */ }
    return nuevo();
  }

  function guardar() {
    try { localStorage.setItem(CLAVE, JSON.stringify(est)); } catch (_) { /* ignorar */ }
  }

  function avisar() {
    subs.forEach(f => { try { f(est); } catch (err) { console.error(err); } });
  }

  /* ---------- API ---------- */
  function suscribir(fn) {
    subs.push(fn);
    fn(est);
    return () => { const i = subs.indexOf(fn); if (i >= 0) subs.splice(i, 1); };
  }

  function actualizar() {
    paso(est);
    est.ultima = Date.now();
    guardar();
    avisar();
  }

  function detener() { if (timer) clearInterval(timer); timer = null; }

  function iniciar() {
    detener();
    if (est.auto) timer = setInterval(actualizar, CFG.intervaloMs / (est.velocidad || 1));
  }

  function ajustar(c) {
    const e = est, antes = e.ciclos;
    if ('nivel' in c) e.nivel = clamp(+c.nivel, 0, 100);
    if ('lluvia' in c) setLluvia(e, !!c.lluvia);
    ['ph', 'turbidez', 'temp', 'tds'].forEach(k => { if (k in c) e[k] = +c[k]; });
    if ('ciclos' in c) {
      e.ciclos = Math.max(0, Math.round(c.ciclos));
      if (antes < CFG.limiteCiclos && e.ciclos >= CFG.limiteCiclos) evento(e, 'filtros', 'alerta', 'Es hora de limpiar los filtros');
    }
    ['auto', 'climaAuto'].forEach(k => { if (k in c) e[k] = !!c[k]; });
    if ('velocidad' in c) e.velocidad = +c.velocidad || 1;
    revisar(e);
    punto(e, true);
    e.ultima = Date.now();
    guardar();
    avisar();
    if ('auto' in c || 'velocidad' in c) iniciar();
  }

  function limpiarFiltros() {
    est.limpiezas.unshift({ t: est.reloj, ciclos: est.ciclos });
    if (est.limpiezas.length > 20) est.limpiezas.length = 20;
    est.ciclos = 0;
    evento(est, 'filtros', 'limpieza', 'Filtros limpiados');
    est.ultima = Date.now();
    guardar();
    avisar();
  }

  function reiniciar() {
    est = nuevo();
    guardar();
    iniciar();
    avisar();
  }

  function derivados(e) {
    const litros = e.nivel / 100 * CFG.capacidad;
    const estado = estadoDe(e.nivel);
    const falta = Math.max(0, CFG.pctLlena / 100 * CFG.capacidad - litros);
    const neto = e.caudal - CFG.consumo;
    const tiempoLlenar = (e.lluvia && neto > 0 && falta > 0) ? falta / neto : null;
    const autonomia = litros / CFG.consumoDiario;

    const items = CALIDAD.map(def => {
      const v = e[def.id];
      const dist = v < def.ideal[0] ? def.ideal[0] - v : (v > def.ideal[1] ? v - def.ideal[1] : 0);
      let estadoItem = 'ok', puntos = 100;
      if (dist > 0 && dist <= def.tol) { estadoItem = 'warn'; puntos = 100 - (dist / def.tol) * 40; }
      else if (dist > def.tol) { estadoItem = 'mal'; puntos = Math.max(0, 60 - ((dist - def.tol) / def.tol) * 60); }
      return Object.assign({}, def, { valor: v, estado: estadoItem, puntos: puntos });
    });
    const score = Math.round(items.reduce((s, i) => s + i.puntos, 0) / items.length);
    const scoreTxt = score >= 85 ? 'Excelente' : score >= 70 ? 'Buena' : score >= 50 ? 'Regular' : 'Mala';
    const uso = score >= 85 ? 'Apta para riego, limpieza y lavado'
      : score >= 70 ? 'Apta para riego y limpieza'
      : score >= 50 ? 'Solo para riego: revisa los filtros'
      : 'No la uses: limpia los filtros';

    return {
      litros: litros, estado: estado, falta: falta, tiempoLlenar: tiempoLlenar, autonomia: autonomia,
      estadoTxt: estado === 'vacia' ? 'Vacía' : estado === 'llena' ? 'Llena' : 'Llenando',
      estadoClase: estado === 'vacia' ? 'empty' : estado === 'llena' ? 'ok' : 'warn',
      items: items, score: score, scoreTxt: scoreTxt, uso: uso,
      scoreClase: score >= 70 ? 'ok' : score >= 50 ? 'warn' : 'mal'
    };
  }

  est = cargar();

  window.Aqua = {
    CFG: CFG, CALIDAD: CALIDAD, fmt: fmt, estadoDe: estadoDe,
    estado: () => est, suscribir: suscribir, actualizar: actualizar,
    iniciar: iniciar, detener: detener, ajustar: ajustar,
    limpiarFiltros: limpiarFiltros, reiniciar: reiniciar, derivados: derivados, DESTINOS: DESTINOS
  };
})();
