/* Aqua · utilidades compartidas: navegación, tanque animado, gráfica interactiva, anillos */
(function () {
  'use strict';

  const A = window.Aqua;
  const BASE = document.body.dataset.base || '';
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

  /* ---------- iconos de línea ---------- */
  const ICONOS = {
    inicio: 'M3 11l9-8 9 8M5 10v10h14V10',
    gota: 'M12 3s6 6.5 6 11a6 6 0 0 1-12 0c0-4.5 6-11 6-11z',
    matraz: 'M9 3h6M10 3v6l-5 9a2 2 0 0 0 2 3h10a2 2 0 0 0 2-3l-5-9V3',
    reloj: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM12 7v5l3 2',
    filtro: 'M3 5h18l-7 8v6l-4 2v-8z',
    sliders: 'M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 16h6',
    refresh: 'M23 4v6h-6M1 20v-6h6M3.5 9a9 9 0 0 1 15-3.4L23 10M1 14l4.5 4.4A9 9 0 0 0 20.5 15',
    nube: 'M18 10h-1.3A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z',
    tapa: 'M4 11h16v9H4zM3 7h18v4H3z',
    check: 'M5 12l5 5 9-10',
    atras: 'M15 18l-6-6 6-6',
    descargar: 'M12 3v12M7 10l5 5 5-5M5 21h14',
    alerta: 'M10.3 3.9L1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0zM12 9v4M12 17h.01',
    derecha: 'M9 18l6-6-6-6',
    lavabo: 'M6 11V6a3 3 0 0 1 6 0M12 6h4v4M3 14h18l-2 6H5zM16 12v1',
    sanitario: 'M7 3h10v5H7zM5 11h14c0 5-2 8-7 8s-7-3-7-8zM9 21h6',
    limpieza: 'M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5L18 18M18 6l-2.5 2.5M8.5 15.5L6 18',
    riego: 'M12 21v-8M12 13c-4 0-6-3-6-7 4 0 6 2 6 7zM12 15c0-4 2-6 6-6 0 4-2 6-6 6z'
  };

  function ico(nombre) {
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="' + (ICONOS[nombre] || '') + '"/></svg>';
  }

  $$('[data-ico]').forEach(el => { el.innerHTML = ico(el.dataset.ico); });

  /* ---------- navegación inferior ---------- */
  function montarNav(activa) {
    const items = [
      ['inicio', 'Inicio', 'index.html', 'inicio'],
      ['llenado', 'Llenado', 'pantallas/llenado.html', 'gota'],
      ['calidad', 'Calidad', 'pantallas/calidad.html', 'matraz'],
      ['historial', 'Historial', 'pantallas/historial.html', 'reloj'],
      ['filtros', 'Filtros', 'pantallas/filtros.html', 'filtro']
    ];
    const nav = document.createElement('nav');
    nav.className = 'nav';
    nav.setAttribute('aria-label', 'Navegación');
    nav.innerHTML = '<div class="nav-in"><a class="nav-marca" href="' + BASE + 'index.html"><img src="' + BASE + 'assets/logo.svg" width="34" height="34" alt=""><b>Aqua</b></a>' + items.map(it =>
      '<a href="' + BASE + it[2] + '" class="' + (activa === it[0] ? 'on' : '') + '">' + ico(it[3]) + '<span>' + it[1] + '</span></a>'
    ).join('') + '<button class="nav-instalar" data-instalar hidden>' + ico('descargar') + '<span>Instalar app</span></button></div>';
    document.body.appendChild(nav);
  }

  /* ---------- aviso flotante ---------- */
  function aviso(texto) {
    let t = $('.toast');
    if (!t) { t = document.createElement('div'); t.className = 'toast'; t.setAttribute('role', 'status'); document.body.appendChild(t); }
    t.textContent = texto;
    t.classList.add('on');
    clearTimeout(t._t);
    t._t = setTimeout(() => t.classList.remove('on'), 2200);
  }

  /* ---------- "actualizado hace…" ---------- */
  function hace(ts) {
    const s = Math.max(0, Math.round((Date.now() - ts) / 1000));
    if (s < 5) return 'ahora';
    if (s < 60) return 'hace ' + s + ' s';
    return 'hace ' + Math.floor(s / 60) + ' min';
  }

  function relojUltima(el, prefijo) {
    const pintar = () => { el.textContent = (prefijo || 'Actualizado ') + hace(A.estado().ultima); };
    pintar();
    setInterval(pintar, 1000);
  }

  /* ---------- mascota según el estado ---------- */
  function mascota(e, d) {
    if (e.ciclos >= A.CFG.limiteCiclos) return 'gotita-alerta.svg';
    if (d.estado === 'vacia') return 'gotita-triste.svg';
    return 'gotita-feliz.svg';
  }

  /* ---------- tanque animado ---------- */
  function tanque(cont) {
    const id = 'tq' + Math.random().toString(36).slice(2, 7);
    const marcas = [[55, 75], [100, 50], [145, 25]].map(m =>
      '<line x1="130" y1="' + m[0] + '" x2="137" y2="' + m[0] + '"/><text x="141" y="' + (m[0] + 3) + '" stroke="none">' + m[1] + '</text>').join('');
    cont.innerHTML =
      '<svg viewBox="0 0 160 200" role="img" aria-label="Nivel de la cisterna">' +
      '<defs>' +
      '<linearGradient id="' + id + 'a" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#47b9ff"/><stop offset="1" stop-color="#1b6fc0"/></linearGradient>' +
      '<linearGradient id="' + id + 'b" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8fd6ff"/><stop offset="1" stop-color="#2a8be0"/></linearGradient>' +
      '<clipPath id="' + id + 'c"><rect x="10" y="10" width="120" height="180" rx="20"/></clipPath>' +
      '</defs>' +
      '<rect x="10" y="10" width="120" height="180" rx="20" fill="rgba(255,255,255,.04)"/>' +
      '<g clip-path="url(#' + id + 'c)"><g class="agua" style="transform:translateY(190px)">' +
      '<g class="ola2" opacity=".55"><path fill="url(#' + id + 'b)" d="M0 8 Q17.5 14 35 8 T70 8 T105 8 T140 8 T175 8 T210 8 T245 8 T280 8 V200 H0 Z"/></g>' +
      '<g class="ola1"><path fill="url(#' + id + 'a)" d="M0 6 Q17.5 0 35 6 T70 6 T105 6 T140 6 T175 6 T210 6 T245 6 T280 6 V200 H0 Z"/></g>' +
      '<circle class="burb b1" cx="38" cy="70" r="3"/><circle class="burb b2" cx="70" cy="95" r="2.2"/><circle class="burb b3" cx="100" cy="60" r="3.4"/>' +
      '</g></g>' +
      '<rect x="10" y="10" width="120" height="180" rx="20" fill="none" stroke="#3a5f82" stroke-width="3"/>' +
      '<rect x="18" y="26" width="5" height="70" rx="2.5" fill="#fff" opacity=".08"/>' +
      '<g stroke="#8fa8bf" stroke-width="1.5" stroke-linecap="round" fill="#8fa8bf" font-size="9">' + marcas + '</g>' +
      '</svg>';
    const agua = $('.agua', cont);
    return {
      set: function (pct) { agua.style.transform = 'translateY(' + (10 + 180 * (1 - clamp(pct, 0, 100) / 100)) + 'px)'; }
    };
  }

  /* ---------- anillo de progreso ---------- */
  function anillo(pct, op) {
    op = op || {};
    const c = 2 * Math.PI * 48;
    const val = clamp(pct, 0, 100) / 100 * c;
    return '<svg viewBox="0 0 120 120" role="img" aria-label="' + (op.etiqueta || 'Progreso') + '">' +
      '<circle cx="60" cy="60" r="48" fill="none" stroke="rgba(143,168,191,.2)" stroke-width="11"/>' +
      '<circle cx="60" cy="60" r="48" fill="none" stroke="' + (op.color || '#4cb8ff') + '" stroke-width="11" stroke-linecap="round" ' +
      'stroke-dasharray="' + val.toFixed(1) + ' ' + c.toFixed(1) + '" transform="rotate(-90 60 60)" style="transition:stroke-dasharray .6s"/>' +
      '<text class="an-n" x="60" y="62" text-anchor="middle">' + (op.texto != null ? op.texto : Math.round(pct)) + '</text>' +
      '<text class="an-s" x="60" y="80" text-anchor="middle">' + (op.sub || '') + '</text></svg>';
  }

  /* ---------- gráfica interactiva (toca o desliza para ver cada punto) ---------- */
  function grafica(cont, serie, op) {
    op = op || {};
    if (cont._activo) return;                       // si el usuario la está tocando, no se redibuja
    const W = 320, H = 150, ml = 34, mr = 10, mt = 10, mb = 22;
    const min = op.min != null ? op.min : 0, max = op.max != null ? op.max : 100;
    const dec = op.dec || 0, u = op.unidad || '', color = op.color || '#4cb8ff';
    const n = serie.length;
    if (n < 2) { cont.innerHTML = '<p class="vacio">Reuniendo datos…</p>'; return; }
    const uid = cont._uid || (cont._uid = 'g' + Math.random().toString(36).slice(2, 7));
    const X = i => ml + (W - ml - mr) * i / (n - 1);
    const Y = v => mt + (H - mt - mb) * (1 - (clamp(v, min, max) - min) / (max - min));
    const pts = serie.map((p, i) => X(i).toFixed(1) + ',' + Y(p.v).toFixed(1));
    const eje = v => ((max - min) <= 20 ? v.toFixed(1).replace('.0', '') : Math.round(v));

    let s = '<svg viewBox="0 0 ' + W + ' ' + H + '" class="grafica-svg" role="img" aria-label="' + (op.etiqueta || 'Gráfica') + '">' +
      '<defs><linearGradient id="' + uid + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="' + color + '" stop-opacity=".35"/><stop offset="1" stop-color="' + color + '" stop-opacity="0"/></linearGradient></defs>';
    if (op.zona) {
      s += '<rect class="g-zona" x="' + ml + '" y="' + Y(op.zona[1]).toFixed(1) + '" width="' + (W - ml - mr) + '" height="' + Math.max(0, Y(op.zona[0]) - Y(op.zona[1])).toFixed(1) + '"/>';
    }
    for (let k = 0; k <= 4; k++) {
      const v = min + (max - min) * k / 4, y = Y(v);
      s += '<line class="g-grid" x1="' + ml + '" x2="' + (W - mr) + '" y1="' + y.toFixed(1) + '" y2="' + y.toFixed(1) + '"/>' +
        '<text class="g-eje" x="' + (ml - 6) + '" y="' + (y + 3).toFixed(1) + '" text-anchor="end">' + eje(v) + '</text>';
    }
    (op.lineas || []).forEach(l => {
      const y = Y(l.v).toFixed(1);
      s += '<line class="g-meta" x1="' + ml + '" x2="' + (W - mr) + '" y1="' + y + '" y2="' + y + '"/>' +
        '<text class="g-eje g-txt" x="' + (W - mr - 2) + '" y="' + (y - 3) + '" text-anchor="end">' + l.txt + '</text>';
    });
    s += '<polygon fill="url(#' + uid + ')" points="' + pts.join(' ') + ' ' + X(n - 1).toFixed(1) + ',' + (H - mb) + ' ' + X(0).toFixed(1) + ',' + (H - mb) + '"/>' +
      '<polyline fill="none" stroke="' + color + '" stroke-width="2.2" stroke-linejoin="round" stroke-linecap="round" points="' + pts.join(' ') + '"/>';
    [[0, 'start'], [Math.floor((n - 1) / 2), 'middle'], [n - 1, 'end']].forEach(a => {
      s += '<text class="g-eje" x="' + X(a[0]).toFixed(1) + '" y="' + (H - 6) + '" text-anchor="' + a[1] + '">' + A.fmt.hora(serie[a[0]].t) + '</text>';
    });
    s += '<g class="g-marca" style="display:none"><line y1="' + mt + '" y2="' + (H - mb) + '"/><circle r="4.5" fill="' + color + '"/></g></svg><div class="g-tip" hidden></div>';
    cont.innerHTML = s;
    cont._d = { serie: serie, X: X, Y: Y, W: W, ml: ml, mr: mr, u: u, dec: dec };

    if (!cont._ligado) {
      cont._ligado = true;
      const ocultar = () => {
        cont._activo = false;
        const m = $('.g-marca', cont), t = $('.g-tip', cont);
        if (m) m.style.display = 'none';
        if (t) t.hidden = true;
      };
      const mover = ev => {
        const d = cont._d, svg = $('svg', cont);
        if (!d || !svg) return;
        const r = svg.getBoundingClientRect();
        const vx = (ev.clientX - r.left) / r.width * d.W;
        const i = clamp(Math.round((vx - d.ml) / (d.W - d.ml - d.mr) * (d.serie.length - 1)), 0, d.serie.length - 1);
        const p = d.serie[i], x = d.X(i), y = d.Y(p.v);
        const m = $('.g-marca', cont), t = $('.g-tip', cont);
        m.style.display = '';
        $('line', m).setAttribute('x1', x); $('line', m).setAttribute('x2', x);
        $('circle', m).setAttribute('cx', x); $('circle', m).setAttribute('cy', y);
        t.hidden = false;
        t.innerHTML = '<b>' + A.fmt.num(p.v, d.dec) + (d.u ? ' ' + d.u : '') + '</b><span>' + A.fmt.hora(p.t) + '</span>';
        const px = clamp(x / d.W * r.width, 42, r.width - 42);
        t.style.left = px + 'px';
      };
      cont.addEventListener('pointerdown', ev => { cont._activo = true; mover(ev); });
      cont.addEventListener('pointermove', ev => {
        if (ev.pointerType === 'mouse') cont._activo = true;
        if (cont._activo) mover(ev);
      });
      cont.addEventListener('pointerup', ev => { if (ev.pointerType !== 'mouse') setTimeout(ocultar, 1500); });
      cont.addEventListener('pointerleave', ocultar);
      cont.addEventListener('pointercancel', ocultar);
    }
  }

  /* ---------- ¿a dónde se fue el agua? (lavabos, sanitarios, limpieza…) ---------- */
  function destinosInit(root) {
    const st = { modo: 'ciclo', unidad: '%' }, lista = $('.d-lista', root), nota = $('.d-nota', root);
    function pintar(e) {
      const total = st.modo === 'total';
      const src = total ? e.destinos : (e.destinosUltimo || e.destinosCiclo) || {};
      const tot = A.DESTINOS.reduce((s, d) => s + (src[d.id] || 0), 0);
      nota.textContent = total ? 'Agua usada desde que empezó el registro.'
        : e.destinosUltimo ? 'Agua usada entre los dos últimos llenados de la cisterna.'
        : 'Agua usada desde que la cisterna se llenó por última vez.';
      if (tot < 1) { lista.innerHTML = '<p class="vacio">Aún no hay consumo registrado.</p>'; return; }
      lista.innerHTML = '<div class="apil">' + A.DESTINOS.map(d => '<i style="flex:' + (src[d.id] || 0).toFixed(2) + ';background:' + d.color + '"></i>').join('') + '</div>' +
        A.DESTINOS.map(d => {
          const l = src[d.id] || 0, p = l / tot * 100;
          return '<div class="dest"><span class="d-ico" style="color:' + d.color + ';background:' + d.color + '24">' + ico(d.ico) + '</span>' +
            '<div class="d-c"><div class="d-t"><b>' + d.nombre + '</b><span>' + (st.unidad === '%' ? A.fmt.num(p, 0) + ' %' : A.fmt.num(l, 0) + ' L') + '</span></div>' +
            '<div class="bar"><i style="width:' + p.toFixed(1) + '%;background:' + d.color + '"></i></div></div></div>';
        }).join('') + '<p class="nota d-total">Total: <b>' + A.fmt.num(tot, 0) + ' L</b> de agua usada</p>';
    }
    root.addEventListener('click', ev => {
      const b = ev.target.closest('.chip'), g = b && b.parentElement.dataset.g;
      if (!g) return;
      st[g] = b.dataset.v;
      $$('.chip', b.parentElement).forEach(c => c.classList.toggle('on', c === b));
      pintar(A.estado());
    });
    return pintar;
  }

  A.UI = {
    destinosInit: destinosInit,
    $: $, $$: $$, base: BASE, ico: ico, montarNav: montarNav, aviso: aviso, hace: hace, relojUltima: relojUltima,
    mascota: mascota, tanque: tanque, anillo: anillo, grafica: grafica,
    sticker: nombre => BASE + 'assets/stickers/' + nombre
  };
})();
