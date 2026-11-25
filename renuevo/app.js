/* Renuevo Torrelodones · lógica de la tienda (demo estática) */
(() => {
  'use strict';
  const P = window.PIEZAS.slice().sort((a, b) => b.id - a.id); // lo más nuevo primero
  const WA = '34629057155';
  const MAIL = 'renuevotorre@gmail.com';
  const IG = 'https://www.instagram.com/renuevotorre/';
  const ENVIO_GRATIS = 120;
  const SEC = { mujer: 'Mujer', hombre: 'Hombre', bolsos: 'Bolsos', zapatos: 'Zapatos', complementos: 'Complementos', infantil: 'Infantil' };
  const SEC_T = { mujer: 'Ropa de mujer', hombre: 'Hombre', bolsos: 'Bolsos', zapatos: 'Zapatos', complementos: 'Complementos', infantil: 'Infantil' };
  const PLURAL = { Vestido: 'Vestidos', Abrigo: 'Abrigos', Chaqueta: 'Chaquetas', 'Tacón': 'Tacones', Sandalia: 'Sandalias', Bota: 'Botas y botines', Plano: 'Planos y bailarinas', Bolso: 'Bolsos', Clutch: 'Clutches', Jersey: 'Jerséis', Chaleco: 'Chalecos', Falda: 'Faldas', Cazadora: 'Cazadoras', Conjunto: 'Conjuntos', Zapatos: 'Zapatos', Infantil: 'Infantil', Complementos: 'Complementos', Camisa: 'Camisas', 'Pantalón': 'Pantalones' };
  const PRECIOS = [['h100', 'Hasta 100 €', -1, 100], ['100-200', 'De 101 a 200 €', 100, 200], ['200-400', 'De 201 a 400 €', 200, 400], ['m400', 'Más de 400 €', 400, 1e9]];
  const ESTADOS = ['Impecable', 'Muy bueno', 'Bueno'];
  const ORDEN = [['nuevo', 'Lo más nuevo'], ['barato', 'Precio: de menor a mayor'], ['caro', 'Precio: de mayor a menor']];

  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const eur = n => n.toLocaleString('es-ES') + ' €';
  const norm = s => String(s).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  const estado = p => p.det.Estado ? (ESTADOS.find(e => norm(p.det.Estado).startsWith(norm(e))) || p.det.Estado) : '';
  const talla = p => p.det.Talla || (p.completo.match(/EU \d{2}/) || [])[0] || '';
  const porId = id => P.find(p => p.id === id);
  const wa = txt => `https://wa.me/${WA}?text=${encodeURIComponent(txt)}`;
  const URL_BASE = location.href.split('#')[0];
  const MARCAS = (() => { const m = {}; P.forEach(p => { if (p.marca) m[p.marca] = (m[p.marca] || 0) + 1; }); return Object.entries(m).sort((a, b) => a[0].localeCompare(b[0], 'es')); })();

  // --- memoria del navegador (cesta y favoritos)
  const leer = k => { try { return JSON.parse(localStorage.getItem('renuevo-' + k)) || []; } catch { return []; } };
  const guardar = (k, v) => { try { localStorage.setItem('renuevo-' + k, JSON.stringify(v)); } catch { } };
  let cesta = leer('cesta').filter(porId);
  const favs = new Set(leer('favs').filter(porId));

  const ICON = {
    heart: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20s-7.5-4.6-7.5-10A4.3 4.3 0 0 1 12 7.4 4.3 4.3 0 0 1 19.5 10c0 5.4-7.5 10-7.5 10Z"/></svg>',
    wa: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm0 18.2a8.2 8.2 0 0 1-4.2-1.1l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2Zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.2-.4.2-.4.7-1.3.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.7 11.8 11.8 0 0 0 4.5 4c1.7.7 2.3.8 3.2.6.5-.1 1.5-.6 1.7-1.2.2-.6.2-1.1.2-1.2-.1-.1-.3-.2-.5-.3Z"/></svg>',
    ig: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r=".8" fill="currentColor"/></svg>',
    mail: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="1.5"/><path d="m3.5 6 8.5 7 8.5-7"/></svg>',
    unica: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M12 3l2.6 5.6 6 .7-4.5 4.1 1.2 6L12 16.5 6.7 19.4l1.2-6L3.4 9.3l6-.7L12 3Z"/></svg>',
    envio: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M3 6h11v10H3zM14 9h4l3 3v4h-7"/><circle cx="7" cy="17.5" r="1.8"/><circle cx="17" cy="17.5" r="1.8"/></svg>',
    vuelta: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M4 12a8 8 0 1 0 2.4-5.7L4 8.6"/><path d="M4 4v4.6h4.6"/></svg>',
    candado: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><rect x="5" y="10.5" width="14" height="10" rx="1.5"/><path d="M8 10.5V7.5a4 4 0 0 1 8 0v3"/></svg>',
    lupa: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><circle cx="11" cy="11" r="6.5"/><path d="m20 20-4.2-4.2"/></svg>',
    filtro: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M4 6h16M7 12h10M10 18h4"/></svg>'
  };

  // --- piezas
  function tarjeta(p, cargar = 'lazy') {
    const a = p.img[0], b = p.img[1]; const est = estado(p); const fav = favs.has(p.id);
    return `<article class="pieza">
      <a href="#/pieza/${p.slug}">
        <div class="pieza-foto">
          <img src="${a.g || a.m}" alt="${esc(p.completo)}" width="470" height="588" loading="${cargar}" decoding="async">
          ${b ? `<img class="alt" src="${b.g || b.m}" alt="" width="470" height="588" loading="lazy" decoding="async">` : ''}
          ${est ? `<span class="chip">${esc(est)}</span>` : ''}
        </div>
        <span class="pieza-txt"><span class="marca">${esc(p.marca)}</span><span class="nombre">${esc(p.nombre)}</span><span class="precio">${eur(p.precio)}</span></span>
      </a>
      <button class="fav${fav ? ' on' : ''}" type="button" data-fav="${p.id}" aria-pressed="${fav}" aria-label="Guardar en favoritos: ${esc(p.completo)}">${ICON.heart}</button>
    </article>`;
  }
  const rejilla = (lista, cargar) => lista.length ? lista.map((p, i) => tarjeta(p, i < 4 ? cargar : 'lazy')).join('') : '';

  // --- filtros de la tienda
  const FIL = {
    sec: (p, v) => p.seccion === v,
    tipo: (p, v) => p.tipo === v,
    marca: (p, v) => p.marca === v,
    estado: (p, v) => estado(p) === v,
    precio: (p, v) => { const r = PRECIOS.find(x => x[0] === v); return !r || (p.precio > r[2] && p.precio <= r[3]); },
    q: (p, v) => { const h = norm([p.completo, p.tipo, PLURAL[p.tipo] || '', SEC_T[p.seccion], p.det.Color || '', p.det.Material || '', p.det.Modelo || ''].join(' ')); return norm(v).split(/\s+/).filter(Boolean).every(w => h.includes(w)); }
  };
  const aplica = (par, excepto) => P.filter(p => Object.entries(par).every(([k, v]) => k === excepto || !FIL[k] || !v || FIL[k](p, v)));
  function enlace(par, cambios = {}) {
    const n = { ...par, ...cambios };
    if ('sec' in cambios) delete n.tipo;
    const qs = new URLSearchParams(Object.entries(n).filter(([, v]) => v)).toString();
    return '#/tienda' + (qs ? '?' + qs : '');
  }
  function faceta(par, clave, titulo, opciones, larga = false) {
    const base = aplica(par, clave);
    const items = opciones.map(([v, txt]) => [v, txt, base.filter(p => FIL[clave](p, v)).length]).filter(([v, , n]) => n || par[clave] === v);
    if (!items.length) return '';
    return `<div class="faceta"><h2>${titulo}</h2><ul class="${larga ? 'larga' : ''}">${items.map(([v, txt, n]) => {
      const on = par[clave] === v;
      return `<li><a href="${enlace(par, { [clave]: on ? '' : v })}" aria-current="${on}"><span>${esc(txt)}</span> <small>${n}</small></a></li>`;
    }).join('')}</ul></div>`;
  }
  function filtrosHTML(par) {
    const tipos = par.sec ? [...new Set(P.filter(p => p.seccion === par.sec).map(p => p.tipo))].sort().map(t => [t, PLURAL[t] || t]) : [];
    return faceta(par, 'sec', 'Sección', Object.entries(SEC)) +
      (tipos.length > 1 ? faceta(par, 'tipo', 'Tipo', tipos) : '') +
      faceta(par, 'marca', 'Marca', MARCAS.map(([m]) => [m, m]), true) +
      faceta(par, 'estado', 'Estado', ESTADOS.map(e => [e, e])) +
      faceta(par, 'precio', 'Precio', PRECIOS.map(r => [r[0], r[1]]));
  }

  // --- vistas
  const V = {};
  const sel = ids => ids.map(porId).filter(Boolean);

  V.inicio = () => {
    const [h1, h2, h3] = sel([6802, 9060, 7947]);
    const recien = P.slice(0, 8);
    const baratas = P.filter(p => p.precio <= 150).slice(0, 12);
    const destacadas = ['Louis Vuitton', 'Loewe', 'Christian Dior', 'Roger Vivier', 'Celine', 'Christian Louboutin', 'Gucci', 'Valentino Garavani', 'Dolce & Gabbana', 'Versace', 'Moncler', 'Miu Miu', 'John Lobb', 'Salvatore Ferragamo', 'Tod’s', 'Burberry', 'Max Mara Weekend', 'Stella McCartney', 'Jimmy Choo', 'Marc Jacobs', 'Herno', 'Bally'].filter(m => MARCAS.some(([x]) => x === m));
    const cinta = (oculta) => `<ul${oculta ? ' aria-hidden="true"' : ''}>${destacadas.map(m => `<li><a href="${enlace({}, { marca: m })}"${oculta ? ' tabindex="-1"' : ''}>${esc(m)}</a></li>`).join('')}</ul>`;
    const cuenta = s => P.filter(p => p.seccion === s).length;
    const tiles = [['mujer', 8990], ['bolsos', 8693], ['zapatos', 7954], ['hombre', 8674]];
    const etq = p => `<span class="etq"><b>${esc(p.marca)}</b>${eur(p.precio)}</span>`;
    const [v1, v2] = sel([8856, 6797]);
    return {
      titulo: 'Renuevo Torrelodones · Moda de lujo de segunda mano',
      html: `
      <section class="hero"><div class="wrap">
        <div>
          <p class="antetitulo">Segunda mano de firma · Torrelodones</p>
          <h1>Lujo de segunda mano, <em>elegido pieza a pieza</em></h1>
          <p class="entrada">Bolsos, zapatos y ropa de Louis Vuitton, Loewe, Dior o Roger Vivier que revisamos uno a uno en nuestra tienda de Torrelodones. De cada pieza solo hay una: cuando se vende, no vuelve.</p>
          <div class="botones"><a class="btn" href="#/tienda">Ver novedades</a><a class="btn btn-linea" href="#/vende">Vender mis piezas</a></div>
          <div class="cifras">
            <div><b>${P.length}</b><span>piezas a la venta</span></div>
            <div><b>${MARCAS.length}</b><span>firmas distintas</span></div>
            <div><b>50/50</b><span>si vendes con nosotros</span></div>
          </div>
        </div>
        <div class="mosaico">
          <a href="#/pieza/${h1.slug}"><img src="${h1.img[0].m}" alt="${esc(h1.completo)}" width="750" height="938" fetchpriority="high">${etq(h1)}</a>
          <a href="#/pieza/${h2.slug}"><img src="${h2.img[0].g}" alt="${esc(h2.completo)}" width="470" height="588">${etq(h2)}</a>
          <a href="#/pieza/${h3.slug}"><img src="${h3.img[0].g}" alt="${esc(h3.completo)}" width="470" height="588">${etq(h3)}</a>
        </div>
      </div></section>

      <nav class="cinta" aria-label="Marcas destacadas"><div class="cinta-pista">${cinta(false)}${cinta(true)}</div></nav>

      <section class="bloque"><div class="wrap">
        <div class="bloque-cab"><div><h2>Recién llegadas</h2><p>Lo último que ha entrado en la tienda. Como cada pieza es única, lo que ves hoy puede no estar mañana.</p></div><a class="enlace" href="#/tienda">Ver las ${P.length} piezas</a></div>
        <div class="rejilla">${rejilla(recien)}</div>
      </div></section>

      <section class="bloque" style="padding-top:0"><div class="wrap">
        <div class="bloque-cab"><h2>Compra por sección</h2></div>
        <div class="secciones">${tiles.map(([s, id]) => { const p = porId(id); return `<a class="seccion" href="${enlace({}, { sec: s })}"><img src="${p.img[0].g}" alt="" width="470" height="588" loading="lazy"><span><b>${SEC_T[s]}</b><small>${cuenta(s)} piezas</small></span></a>`; }).join('')}</div>
      </div></section>

      <section class="bloque oscuro vende-banda"><div class="wrap">
        <div>
          <p class="antetitulo">Vende con nosotros</p>
          <h2>Lo que ya no usas puede enamorar a otra persona</h2>
          <p style="margin-top:18px">Ese abrigo que no te pones o el bolso que espera en el armario. Nosotros lo fotografiamos, le ponemos precio y lo vendemos; tú solo esperas a cobrar.</p>
          <div class="mitad"><b>50/50</b><span>Trabajamos en depósito. Cuando tu pieza se vende, la mitad es para ti y te la pagamos cada mes.</span></div>
          <ol class="pasos-mini">
            <li><b>1</b>Nos traes tus piezas o nos las envías</li>
            <li><b>2</b>Les ponemos precio según mercado y estado</li>
            <li><b>3</b>Las enseñamos en tienda, web e Instagram</li>
            <li><b>4</b>Cobras en tu cuenta o en tu Renuevo Wallet</li>
          </ol>
          <a class="btn btn-claro" href="#/vende">Calcula lo que cobrarías</a>
        </div>
        <div class="vende-foto"><img src="${v1.img[0].g}" alt="" width="470" height="588" loading="lazy"><img src="${v2.img[0].g}" alt="" width="470" height="588" loading="lazy"></div>
      </div></section>

      <section class="bloque"><div class="wrap">
        <div class="bloque-cab"><div><h2>Caprichos por menos de 150 €</h2><p>Firmas de lujo a precio de segunda mano.</p></div><a class="enlace" href="${enlace({}, { precio: 'h100' })}">Hasta 100 €</a></div>
        <div class="carril">${rejilla(baratas)}</div>
      </div></section>

      <section class="bloque" id="como-trabajamos" style="padding-top:0"><div class="wrap">
        <div class="bloque-cab"><div><p class="antetitulo">Transparencia</p><h2>Cómo trabajamos</h2><p>Cada pieza de Renuevo es única y de segunda mano. Queremos que la veas tal y como es y también cómo queda puesta.</p></div></div>
        <div class="pasos">
          <div class="paso"><b>01</b><h3>Fotografiamos la pieza real</h3><p>En nuestra tienda de Torrelodones, con su color, su tejido y sus detalles tal cual están.</p></div>
          <div class="paso"><b>02</b><h3>Creamos las fotos con modelo con IA</h3><p>A partir de esas fotos reales, para que veas cómo sienta la prenda. La IA no inventa la pieza: copia la original.</p></div>
          <div class="paso"><b>03</b><h3>El vídeo es real, sin retoques</h3><p>Muestra la pieza exactamente como la vas a recibir, con sus posibles marcas de uso.</p></div>
          <div class="paso"><b>04</b><h3>Lo revisamos todo nosotros</h3><p>Escribimos cada descripción y comprobamos que color, material, medidas y detalles coinciden con el original.</p></div>
        </div>
        <p class="nota">Si al recibir tu pedido algo no coincide con lo que viste, escríbenos y lo solucionamos.</p>
      </div></section>

      <section class="hogar"><img src="img/hogar.webp" alt="" width="1024" height="534" loading="lazy"><div class="wrap">
        <p class="antetitulo" style="color:var(--menta)">Hogar y antigüedades</p>
        <h2>Muebles y decoración con historia</h2>
        <p>Muebles vintage y objetos de decoración para casa. Ahora están en la tienda de Torrelodones y muy pronto también aquí.</p>
        <a class="btn btn-claro" href="${wa('Hola, me gustaría saber qué muebles y decoración tenéis ahora en la tienda.')}" target="_blank" rel="noopener">${ICON.wa}Pregunta qué tenemos</a>
      </div></section>

      <section class="bloque"><div class="wrap">
        <div class="bloque-cab"><div><h2>¿Buscas algo concreto?</h2><p>Dinos qué marca o pieza te interesa y te avisamos en cuanto entre en la tienda.</p></div></div>
        <div class="visita">
          <a href="${wa('Hola, estoy buscando ')}" target="_blank" rel="noopener">${ICON.wa}<span><b>WhatsApp</b><span>629 05 71 55</span></span></a>
          <a href="${IG}" target="_blank" rel="noopener">${ICON.ig}<span><b>Instagram</b><span>@renuevotorre</span></span></a>
          <a href="mailto:${MAIL}">${ICON.mail}<span><b>Correo</b><span>${MAIL}</span></span></a>
        </div>
      </div></section>`
    };
  };

  V.tienda = (par) => {
    const lista = aplica(par);
    const orden = par.orden || 'nuevo';
    if (orden === 'barato') lista.sort((a, b) => a.precio - b.precio || b.id - a.id);
    if (orden === 'caro') lista.sort((a, b) => b.precio - a.precio || b.id - a.id);
    let titulo = par.q ? `Resultados para «${par.q}»` : par.marca ? par.marca : par.tipo ? (PLURAL[par.tipo] || par.tipo) : par.sec ? SEC_T[par.sec] : 'Novedades';
    const activos = Object.entries(par).filter(([k, v]) => v && k !== 'orden').map(([k, v]) => {
      const txt = k === 'precio' ? PRECIOS.find(r => r[0] === v)?.[1] : k === 'sec' ? SEC_T[v] : k === 'tipo' ? (PLURAL[v] || v) : k === 'q' ? `«${v}»` : v;
      return `<a href="${enlace(par, { [k]: '' })}" aria-label="Quitar filtro ${esc(txt)}">${esc(txt)} <span aria-hidden="true">×</span></a>`;
    });
    const vacio = `<div class="vacio"><p>No hay piezas con estos filtros ahora mismo.</p><p><a class="btn" href="${wa('Hola, estoy buscando ' + (par.q || par.marca || '') + '. ¿Me avisáis si entra algo?')}" target="_blank" rel="noopener">${ICON.wa}Avísame si entra</a></p><p><a class="enlace" href="#/tienda">Ver toda la tienda</a></p></div>`;
    const filtros = filtrosHTML(par);
    $('#filtros-cuerpo').innerHTML = filtros;
    return {
      titulo: titulo + ' · Renuevo Torrelodones',
      html: `<div class="wrap">
        <p class="migas"><a href="#/">Inicio</a><span aria-hidden="true">/</span>${par.sec && (par.tipo || par.marca) ? `<a href="${enlace({}, { sec: par.sec })}">${SEC_T[par.sec]}</a><span aria-hidden="true">/</span>` : ''}${esc(titulo)}</p>
        <div class="tienda-cab">
          <div><h1>${esc(titulo)}</h1><p>${lista.length} ${lista.length === 1 ? 'pieza' : 'piezas'}</p></div>
          <div class="orden">
            <button class="btn btn-linea boton-filtros" type="button" data-abrir="filtros" aria-controls="filtros">${ICON.filtro}Filtrar</button>
            <label for="orden">Ordenar</label>
            <select id="orden">${ORDEN.map(([v, t]) => `<option value="${v}"${v === orden ? ' selected' : ''}>${t}</option>`).join('')}</select>
          </div>
        </div>
        <div class="tienda">
          <aside class="filtros" aria-label="Filtros">${filtros}</aside>
          <div>
            ${activos.length ? `<div class="activos">${activos.join('')}<a href="#/tienda">Quitar todo</a></div>` : ''}
            <div class="rejilla">${lista.length ? rejilla(lista, 'eager') : vacio}</div>
          </div>
        </div>
      </div>`
    };
  };

  V.pieza = (slug) => {
    const p = P.find(x => x.slug === slug); if (!p) return V.error();
    const enCesta = cesta.includes(p.id);
    const det = Object.entries(p.det).filter(([k]) => k !== 'Marca');
    const t = talla(p); if (t && !p.det.Talla) det.unshift(['Talla', t]);
    const txt = p.txt.length ? p.txt.map(x => `<p>${esc(x)}</p>`).join('') : `<p>${esc(p.completo)}. Pieza única de segunda mano, revisada en nuestra tienda de Torrelodones antes de publicarla.</p>`;
    const rel = [...P.filter(x => x.id !== p.id && x.marca === p.marca), ...P.filter(x => x.id !== p.id && x.marca !== p.marca && x.seccion === p.seccion)].slice(0, 4);
    const pregunta = `Hola, me interesa «${p.completo}» (${eur(p.precio)}) que he visto en la web: ${URL_BASE}#/pieza/${p.slug}`;
    return {
      titulo: `${p.completo} · Renuevo Torrelodones`,
      html: `<div class="wrap">
        <p class="migas"><a href="#/">Inicio</a><span aria-hidden="true">/</span><a href="${enlace({}, { sec: p.seccion })}">${SEC_T[p.seccion]}</a>${(PLURAL[p.tipo] || p.tipo) !== SEC_T[p.seccion] ? `<span aria-hidden="true">/</span><a href="${enlace({}, { sec: p.seccion, tipo: p.tipo })}">${esc(PLURAL[p.tipo] || p.tipo)}</a>` : ""}</p>
        <div class="ficha">
          <div>
            <ul class="galeria" aria-label="Fotos de la pieza">${p.img.map((im, i) => `<li><img src="${im.m}" alt="${esc(p.completo)}, foto ${i + 1} de ${p.img.length}" width="750" height="938" ${i ? 'loading="lazy"' : 'fetchpriority="high"'} decoding="async"></li>`).join('')}</ul>
            <p class="galeria-cont" aria-hidden="true"><span id="gal-n">1</span> / ${p.img.length}</p>
          </div>
          <div class="info">
            <p class="marca"><a href="${enlace({}, { marca: p.marca })}">${esc(p.marca)}</a></p>
            <h1>${esc(p.nombre)}</h1>
            <p class="precio">${eur(p.precio)}</p>
            <div class="unica">${ICON.unica}<span><b>Pieza única.</b> Solo hay una unidad${estado(p) ? ` y su estado es <b>${esc(estado(p).toLowerCase())}</b>` : ''}. Si te gusta, no esperes mucho.</span></div>
            <div class="acciones">
              <button class="btn btn-ancho" type="button" data-add="${p.id}"${enCesta ? ' disabled' : ''}>${enCesta ? 'Ya está en tu cesta' : 'Añadir a la cesta'}</button>
              <a class="btn btn-linea btn-ancho" href="${wa(pregunta)}" target="_blank" rel="noopener">${ICON.wa}Preguntar por WhatsApp</a>
              <button class="btn btn-linea btn-ancho" type="button" data-fav="${p.id}" aria-pressed="${favs.has(p.id)}">${favs.has(p.id) ? 'Guardada en favoritos' : 'Guardar en favoritos'}</button>
            </div>
            ${det.length ? `<table class="datos"><caption class="sr">Detalles</caption><tbody>${det.map(([k, v]) => `<tr><th scope="row">${esc(k)}</th><td>${esc(v)}</td></tr>`).join('')}</tbody></table>` : ''}
            <div class="desc">${txt}</div>
            <p class="ia">Las fotos con modelo se crean con IA a partir de la pieza real para que veas cómo sienta. Si al recibirla algo no coincide, lo solucionamos.</p>
            <ul class="garantias">
              <li>${ICON.envio}<span>Envío gratis a partir de ${ENVIO_GRATIS} €</span></li>
              <li>${ICON.vuelta}<span>Aceptamos devoluciones</span></li>
              <li>${ICON.candado}<span>Pago seguro con tarjeta o Bizum (Redsys)</span></li>
            </ul>
          </div>
        </div>
        ${rel.length ? `<section class="bloque" style="padding-top:0"><div class="bloque-cab"><h2>${rel.filter(x => x.marca === p.marca).length >= 2 ? 'Más de ' + esc(p.marca) : 'También te puede gustar'}</h2></div><div class="rejilla">${rejilla(rel)}</div></section>` : ''}
      </div>`,
      despues: () => {
        const g = $('.galeria'); const n = $('#gal-n'); if (!g || !n) return;
        g.addEventListener('scroll', () => { const li = g.children[0]; const w = li.getBoundingClientRect().width + 8; n.textContent = Math.min(g.children.length, Math.round(g.scrollLeft / w) + 1); }, { passive: true });
      }
    };
  };

  V.marcas = () => {
    const grupos = {}; MARCAS.forEach(([m, n]) => { const l = /^[0-9]/.test(m) ? '#' : norm(m[0]).toUpperCase(); (grupos[l] = grupos[l] || []).push([m, n]); });
    return {
      titulo: 'Marcas · Renuevo Torrelodones',
      html: `<div class="wrap pagina">
        <div class="pagina-cab"><h1>Marcas</h1><p>${MARCAS.length} firmas con piezas a la venta ahora mismo.</p></div>
        <div class="marcas-az">${Object.entries(grupos).map(([l, ms]) => `<section><h2>${l}</h2><ul>${ms.map(([m, n]) => `<li><a href="${enlace({}, { marca: m })}">${esc(m)} <small>${n}</small></a></li>`).join('')}</ul></section>`).join('')}</div>
      </div>`
    };
  };

  V.favoritos = () => {
    const lista = P.filter(p => favs.has(p.id));
    return {
      titulo: 'Favoritos · Renuevo Torrelodones',
      html: `<div class="wrap pagina">
        <div class="pagina-cab"><h1>Tus favoritos</h1><p>${lista.length ? 'Las piezas que has guardado. Recuerda que solo hay una de cada.' : 'Aún no has guardado ninguna pieza. Pulsa el corazón de las que te gusten para tenerlas aquí.'}</p></div>
        <div class="rejilla">${lista.length ? rejilla(lista) : `<div class="vacio"><a class="btn" href="#/tienda">Ver novedades</a></div>`}</div>
      </div>`
    };
  };

  V.vende = () => {
    const marcasBuscadas = 'Burberry, Celine, Christian Dior, Christian Louboutin, Dolce & Gabbana, Fendi, Gucci, Hermès, Jimmy Choo, Loewe, Longchamp, Louis Vuitton, Marc Jacobs, Max Mara, Miu Miu, Moncler, Prada, Roger Vivier, Salvatore Ferragamo, Stella McCartney, Valentino, Versace, Yves Saint Laurent'.split(', ');
    return {
      titulo: 'Vende con nosotros · Renuevo Torrelodones',
      html: `<div class="wrap pagina">
        <p class="migas"><a href="#/">Inicio</a><span aria-hidden="true">/</span>Vende con nosotros</p>
        <div class="pagina-cab"><p class="antetitulo">Vende con Renuevo</p><h1>Lo que ya no usas puede enamorar a otra persona</h1><p>Ese abrigo que adoras pero no te pones, el bolso que espera en el armario o ese mueble que merece otra casa. Tráenoslo: nosotros nos ocupamos de todo y tú solo tienes que esperar a cobrar.</p></div>
        <div class="dos vende-dos">
          <div class="texto">
            <h2>Así de fácil</h2>
            <div class="pasos pasos-2">
              <div class="paso"><b>01</b><h3>Nos traes tus piezas</h3><p>Ven a la tienda de Torrelodones o envíanoslas. Las miramos contigo, una a una.</p></div>
              <div class="paso"><b>02</b><h3>Les ponemos precio</h3><p>Según el mercado, el estado de la pieza y lo que se está buscando ahora.</p></div>
              <div class="paso"><b>03</b><h3>Las lucimos</h3><p>En la tienda, en la web y en Instagram, con vídeo real y fotos con modelo.</p></div>
              <div class="paso"><b>04</b><h3>Cobras cada mes</h3><p>En tu cuenta o en tu Renuevo Wallet para comprar online o en la tienda.</p></div>
            </div>
            <h2>Cuentas claras: 50/50</h2>
            <p>Trabajamos en depósito: no compramos tus piezas, las vendemos por ti. Cuando se venden, la mitad es para ti y la otra mitad para la tienda. Por normativa, el IVA correspondiente se repercute sobre la parte del depositario.</p>
            <h2>Qué buscamos</h2>
            <p><b>Perfecto estado.</b> Limpias, sin manchas ni desperfectos, listas para estrenar dueño.</p>
            <p><b>Piezas con valor.</b> Que por marca, diseño o calidad merezcan estar en tienda. Las firmas que mejor funcionan:</p>
            <div class="chips">${marcasBuscadas.map(m => `<span>${esc(m)}</span>`).join('')}</div>
            <p>¿La tuya no está? Si es especial, enséñanosla y la valoramos contigo.</p>
            <h2>¿No puedes venir a la tienda?</h2>
            <p>Envíanos tus piezas. El envío corre de tu cuenta y, si alguna no encaja con lo que buscamos, la devolución también. Antes de enviar, revisa cada pieza con calma: manchas, cremalleras y botones. Te ahorrarás gastos.</p>
          </div>
          <div style="display:grid;gap:20px">
            <div class="calc">
              <label for="calc-precio" style="font-weight:500">¿Por cuánto crees que se vendería tu pieza?</label>
              <input id="calc-precio" type="range" min="50" max="1500" step="10" value="400" aria-describedby="calc-res">
              <p style="margin:0;color:var(--gris);font-size:14px">Precio de venta: <b id="calc-venta">400 €</b></p>
              <p id="calc-res" style="margin:18px 0 0">Para ti, cuando se venda:<output for="calc-precio" id="calc-tu">200 €</output><span style="color:var(--gris);font-size:14px">El 50 %, pagado a mes vencido en tu cuenta o en tu Renuevo Wallet.</span></p>
            </div>
            <form class="calc" id="form-vende" novalidate>
              <h2 style="font-size:32px;margin-bottom:6px">Cuéntanos qué tienes</h2>
              <p style="color:var(--gris);font-size:15px">Se abre WhatsApp con tus datos ya escritos. Allí puedes añadir 2 o 3 fotos de cada pieza.</p>
              <div class="fila"><div class="campo"><label for="v-nombre">Tu nombre</label><input id="v-nombre" name="nombre" autocomplete="name" required></div>
              <div class="campo"><label for="v-tipo">Qué quieres vender</label><select id="v-tipo" name="tipo"><option>Bolso</option><option>Zapatos</option><option>Ropa de mujer</option><option>Ropa de hombre</option><option>Complementos o joyas</option><option>Mueble o decoración</option><option>Varias cosas</option></select></div></div>
              <div class="fila"><div class="campo"><label for="v-marca">Marca</label><input id="v-marca" name="marca" placeholder="Ej.: Loewe"></div>
              <div class="campo"><label for="v-estado">Estado</label><select id="v-estado" name="estado"><option>Como nuevo</option><option>Muy bueno</option><option>Bueno, con alguna marca de uso</option></select></div></div>
              <fieldset class="opciones"><legend>¿Cómo nos las haces llegar?</legend>
                <label class="opcion"><input type="radio" name="llegar" value="Las llevo a la tienda" checked><span>Las llevo a la tienda<small>En Torrelodones</small></span></label>
                <label class="opcion"><input type="radio" name="llegar" value="Las envío" ><span>Las envío<small>El envío corre de tu cuenta</small></span></label>
              </fieldset>
              <div class="campo"><label for="v-nota">Algo más (opcional)</label><textarea id="v-nota" name="nota" placeholder="Modelo, talla, si tienes la caja o el ticket..."></textarea></div>
              <p class="error" id="v-error" role="alert"></p>
              <button class="btn btn-ancho" type="submit">${ICON.wa}Enviar por WhatsApp</button>
              <p style="text-align:center;margin:14px 0 0;font-size:14px">o escríbenos a <a href="mailto:${MAIL}?subject=Quiero%20vender%20mis%20piezas">${MAIL}</a></p>
            </form>
          </div>
        </div>
      </div>`,
      despues: () => {
        const r = $('#calc-precio');
        const pinta = () => { const v = +r.value; $('#calc-venta').textContent = eur(v); $('#calc-tu').textContent = eur(Math.round(v / 2)); };
        r.addEventListener('input', pinta); pinta();
        $('#form-vende').addEventListener('submit', e => {
          e.preventDefault(); const f = new FormData(e.target);
          if (!String(f.get('nombre')).trim()) { $('#v-error').textContent = 'Escribe tu nombre para que sepamos quién eres.'; $('#v-nombre').focus(); return; }
          $('#v-error').textContent = '';
          const txt = `Hola, soy ${f.get('nombre')} y quiero vender con Renuevo.\n· Qué: ${f.get('tipo')}\n· Marca: ${f.get('marca') || 'por confirmar'}\n· Estado: ${f.get('estado')}\n· ${f.get('llegar')}` + (String(f.get('nota')).trim() ? `\n· ${f.get('nota')}` : '') + '\nOs mando fotos ahora.';
          window.open(wa(txt), '_blank', 'noopener');
        });
      }
    };
  };

  V.nosotros = () => {
    const [a, b] = sel([8853, 7952]);
    return {
      titulo: 'Quiénes somos · Renuevo Torrelodones',
      html: `<div class="wrap pagina">
        <p class="migas"><a href="#/">Inicio</a><span aria-hidden="true">/</span>Quiénes somos</p>
        <div class="pagina-cab"><p class="antetitulo">¡Bienvenidos a nuestra casa!</p><h1>Hola, somos Renuevo</h1><p>Si has llegado hasta aquí, seguramente conoces esa sensación de encontrar un tesoro.</p></div>
        <div class="dos">
          <div class="texto">
            <p>En Renuevo Torrelodones no creemos en las cosas de usar y tirar. Creemos en la calidad que perdura, en la personalidad de una prenda con historia y en la calidez de un mueble que ha sido testigo de mil cenas.</p>
            <h2>PreLoved con alma</h2>
            <p>Nacimos en el corazón de Torrelodones para que lo excepcional vuelva a brillar. Nuestra tienda es un espacio donde la moda y la decoración se encuentran de forma consciente.</p>
            <p><b>Moda PreLoved.</b> Seleccionamos ropa y accesorios que merecen seguir siendo protagonistas. Para nosotros la moda sostenible es elegir estilo sobre tendencia y calidad sobre cantidad.</p>
            <p><b>Muebles y decoración.</b> Buscamos objetos que aporten carácter a tu hogar, desde esa pieza vintage que estabas buscando hasta detalles que transforman un rincón.</p>
            <h2>Un proyecto de familia para tu familia</h2>
            <p>Nos gusta lo cercano. Nos encanta que entres a la tienda, que toques las texturas, que nos preguntes y que te sientas como en casa. Somos tus vecinos, apasionados por el diseño y convencidos de que el lujo está en los detalles.</p>
            <p>Comprar en Renuevo es una forma de cuidar el planeta y apoyar el comercio local, llevándote a casa algo que no encontrarás en ningún otro sitio.</p>
            <h2>¿Por qué elegirnos?</h2>
            <p><b>Curaduría con mimo.</b> No todo lo usado vale. Solo traemos lo que nos enamora.</p>
            <p><b>Sostenibilidad real.</b> Alargamos la vida de los productos y reducimos el impacto ambiental.</p>
            <p><b>Estilo propio.</b> Ayudamos a crear hogares y armarios con identidad, lejos de lo fabricado en serie.</p>
            <p style="margin-top:28px"><a class="btn" href="${wa('Hola, ¿qué horario tenéis en la tienda de Torrelodones?')}" target="_blank" rel="noopener">${ICON.wa}Pregúntanos el horario</a></p>
          </div>
          <div class="vende-foto"><img src="${a.img[0].m}" alt="${esc(a.completo)}" width="750" height="938" loading="lazy"><img src="${b.img[0].m}" alt="${esc(b.completo)}" width="750" height="938" loading="lazy"></div>
        </div>
      </div>`
    };
  };

  V.ayuda = () => ({
    titulo: 'Envíos, devoluciones y pago · Renuevo Torrelodones',
    html: `<div class="wrap pagina">
      <p class="migas"><a href="#/">Inicio</a><span aria-hidden="true">/</span>Ayuda</p>
      <div class="pagina-cab"><h1>Envíos, devoluciones y pago</h1><p>Lo que más nos preguntáis. Si te queda alguna duda, escríbenos por WhatsApp y te contestamos.</p></div>
      <div class="faq" style="max-width:860px">
        <details open><summary>¿Cuánto cuesta el envío?</summary><p>Si tu compra supera los ${ENVIO_GRATIS} €, el envío es gratis.</p></details>
        <details><summary>¿Puedo devolver una pieza?</summary><p>Sí, aceptamos devoluciones. Escríbenos por WhatsApp o a ${MAIL} y te explicamos cómo hacerlo.</p></details>
        <details><summary>¿Cómo se paga?</summary><p>Con tarjeta o Bizum a través de la pasarela segura de Redsys.</p></details>
        <details><summary>¿Cómo sé en qué estado está la pieza?</summary><p>Cada ficha indica el estado (impecable, muy bueno o bueno) y las fotos muestran la pieza real. Las fotos con modelo están hechas con IA a partir de la original para que veas cómo sienta. Si al recibirla algo no coincide con lo que viste, lo solucionamos.</p></details>
        <details><summary>¿Puedo ver la pieza en la tienda antes de comprarla?</summary><p>Claro. Todas las piezas están en nuestra tienda de Torrelodones. Escríbenos antes para confirmar que sigue disponible.</p></details>
        <details><summary>Quiero vender mis piezas, ¿cómo funciona?</summary><p>Trabajamos en depósito y vamos a medias: la mitad del precio de venta es para ti y te lo pagamos cada mes. <a href="#/vende">Te lo contamos aquí</a>.</p></details>
      </div>
    </div>`
  });

  V.pedido = () => {
    const items = cesta.map(porId).filter(Boolean);
    if (!items.length) return { titulo: 'Cesta vacía · Renuevo Torrelodones', html: `<div class="wrap pagina"><div class="pagina-cab"><h1>Tu cesta está vacía</h1><p>Añade alguna pieza para seguir con el pedido.</p></div><a class="btn" href="#/tienda">Ver novedades</a></div>` };
    const sub = items.reduce((s, p) => s + p.precio, 0);
    return {
      titulo: 'Finalizar pedido · Renuevo Torrelodones',
      html: `<div class="wrap pagina">
        <p class="migas"><a href="#/">Inicio</a><span aria-hidden="true">/</span>Finalizar pedido</p>
        <div class="pagina-cab"><h1>Finalizar pedido</h1></div>
        <div class="dos pedido">
          <form id="form-pedido" novalidate>
            <h2 style="font-size:28px;margin-bottom:16px">Tus datos</h2>
            <div class="fila"><div class="campo"><label for="c-nombre">Nombre y apellidos</label><input id="c-nombre" autocomplete="name" required></div>
            <div class="campo"><label for="c-tel">Teléfono</label><input id="c-tel" type="tel" autocomplete="tel" required></div></div>
            <div class="campo"><label for="c-mail">Correo electrónico</label><input id="c-mail" type="email" autocomplete="email" required></div>
            <fieldset class="opciones"><legend>Entrega</legend>
              <label class="opcion"><input type="radio" name="entrega" value="casa" checked><span>Envío a domicilio<small>${sub >= ENVIO_GRATIS ? 'Gratis en tu pedido' : `Gratis a partir de ${ENVIO_GRATIS} €`}</small></span></label>
              <label class="opcion"><input type="radio" name="entrega" value="tienda"><span>Recoger en la tienda de Torrelodones<small>Gratis. Te avisamos cuando esté lista</small></span></label>
            </fieldset>
            <div id="c-dir">
              <div class="campo"><label for="c-calle">Dirección</label><input id="c-calle" autocomplete="street-address" required></div>
              <div class="fila"><div class="campo"><label for="c-cp">Código postal</label><input id="c-cp" inputmode="numeric" autocomplete="postal-code" required></div>
              <div class="campo"><label for="c-ciudad">Población</label><input id="c-ciudad" autocomplete="address-level2" required></div></div>
            </div>
            <fieldset class="opciones"><legend>Pago</legend>
              <label class="opcion"><input type="radio" name="pago" value="tarjeta" checked><span>Tarjeta<small>Pago seguro con Redsys</small></span></label>
              <label class="opcion"><input type="radio" name="pago" value="bizum"><span>Bizum<small>Desde tu móvil</small></span></label>
            </fieldset>
            <p class="error" id="c-error" role="alert"></p>
            <button class="btn btn-ancho" type="submit">${ICON.candado}Pagar ${eur(sub)}</button>
          </form>
          <aside class="resumen" aria-label="Resumen del pedido">
            <h2 style="font-family:var(--sans);font-size:13px;letter-spacing:.16em;text-transform:uppercase;font-weight:500;margin-bottom:6px">Resumen</h2>
            ${items.map(p => `<div class="linea-cesta"><img src="${p.img[0].g || p.img[0].m}" alt="" width="60" height="75"><div><span class="marca">${esc(p.marca)}</span><span class="nombre">${esc(p.nombre)}</span></div><b style="font-weight:500">${eur(p.precio)}</b></div>`).join('')}
            <div class="total" style="margin-top:16px;font-size:15px"><span>Subtotal</span><span>${eur(sub)}</span></div>
            <div class="total" style="font-size:15px"><span>Envío</span><span id="c-envio">${sub >= ENVIO_GRATIS ? 'Gratis' : 'Según destino'}</span></div>
            <div class="total" style="border-top:1px solid var(--linea);padding-top:14px"><b style="font-weight:500">Total</b><b style="font-weight:500">${eur(sub)}</b></div>
          </aside>
        </div>
      </div>`,
      despues: () => {
        const f = $('#form-pedido');
        f.addEventListener('change', () => { const casa = f.entrega.value === 'casa'; $('#c-dir').hidden = !casa; $('#c-envio').textContent = !casa || sub >= ENVIO_GRATIS ? 'Gratis' : 'Según destino'; });
        f.addEventListener('submit', e => {
          e.preventDefault();
          const req = $$('input[required]', f).filter(i => !i.closest('[hidden]'));
          const malo = req.find(i => !i.value.trim() || (i.type === 'email' && !/^\S+@\S+\.\S+$/.test(i.value)));
          if (malo) { $('#c-error').textContent = 'Revisa el campo «' + $(`label[for="${malo.id}"]`).textContent + '».'; malo.focus(); return; }
          cesta = []; guardar('cesta', cesta); contadores(); location.hash = '#/gracias';
        });
      }
    };
  };

  V.gracias = () => ({
    titulo: 'Pedido recibido · Renuevo Torrelodones',
    html: `<div class="wrap pagina"><div class="pagina-cab"><p class="antetitulo">Pedido recibido</p><h1>¡Gracias por tu compra!</h1><p>En la tienda real, en este paso se abriría el pago seguro de Redsys o Bizum y te llegaría un correo con la confirmación. Esto es una demostración, así que no se ha cobrado nada.</p></div><a class="btn" href="#/tienda">Seguir mirando</a></div>`
  });

  V.error = () => ({ titulo: 'Página no encontrada · Renuevo Torrelodones', html: `<div class="wrap pagina"><div class="pagina-cab"><h1>Esta pieza ya no está</h1><p>Puede que se haya vendido o que el enlace no sea correcto.</p></div><a class="btn" href="#/tienda">Ver novedades</a></div>` });

  // --- cesta
  function contadores() {
    $('#n-cesta').textContent = cesta.length || '';
    $('#n-favs').textContent = favs.size || '';
  }
  function pintarCesta() {
    const items = cesta.map(porId).filter(Boolean);
    const sub = items.reduce((s, p) => s + p.precio, 0);
    const falta = ENVIO_GRATIS - sub;
    $('#cesta-cuerpo').innerHTML = items.length
      ? `<div class="barra-envio">${falta > 0 ? `Te faltan <b>${eur(falta)}</b> para el envío gratis` : '<b>Tienes el envío gratis</b>'}<div class="barra"><i style="width:${Math.min(100, sub / ENVIO_GRATIS * 100)}%"></i></div></div>` +
        items.map(p => `<div class="linea-cesta"><a href="#/pieza/${p.slug}"><img src="${p.img[0].g || p.img[0].m}" alt="${esc(p.completo)}" width="84" height="105"></a><div><span class="marca">${esc(p.marca)}</span><span class="nombre">${esc(p.nombre)}</span><button class="quitar" type="button" data-quitar="${p.id}">Quitar<span class="sr"> ${esc(p.completo)}</span></button></div><b style="font-weight:500">${eur(p.precio)}</b></div>`).join('')
      : `<p style="color:var(--gris)">Tu cesta está vacía.</p><p><a class="btn" href="#/tienda">Ver novedades</a></p>`;
    $('#cesta-pie').innerHTML = items.length ? `<div class="total"><span>Subtotal</span><b style="font-weight:500">${eur(sub)}</b></div><a class="btn btn-ancho" href="#/pedido">Finalizar pedido</a><p style="font-size:13px;color:var(--gris);text-align:center;margin:10px 0 0">Pago seguro con tarjeta o Bizum</p>` : '';
    $('#cesta-pie').hidden = !items.length;
  }

  // --- paneles (cesta, menú, filtros, buscador)
  let abierto = null, origen = null;
  function abrir(id, desde) {
    if (abierto) cerrar(false);
    const el = document.getElementById(id); if (!el) return;
    if (id === 'cesta') pintarCesta();
    if (id === 'menu') pintarMenu();
    el.classList.add('on'); if (id !== 'buscador') $('#velo').classList.add('on');
    document.documentElement.style.overflow = 'hidden';
    abierto = el; origen = desde || document.activeElement;
    $$(`[aria-controls="${id}"]`).forEach(b => b.setAttribute('aria-expanded', 'true'));
    setTimeout(() => { const f = id === 'buscador' ? $('#q') : el.querySelector('a[href],button:not([disabled]),input'); f && f.focus(); }, 60);
  }
  function cerrar(devolver = true) {
    if (!abierto) return;
    $$(`[aria-controls="${abierto.id}"]`).forEach(b => b.setAttribute('aria-expanded', 'false'));
    abierto.classList.remove('on'); $('#velo').classList.remove('on');
    document.documentElement.style.overflow = '';
    abierto = null; if (devolver && origen && document.contains(origen)) origen.focus({ preventScroll: true });
  }
  function pintarMenu() {
    const n = s => P.filter(p => p.seccion === s).length;
    $('#menu-cuerpo').innerHTML = `<a href="#/tienda">Novedades <small>${P.length}</small></a>` +
      Object.keys(SEC).filter(n).map(s => `<a href="${enlace({}, { sec: s })}">${SEC_T[s]} <small>${n(s)}</small></a>`).join('') +
      `<a href="#/marcas">Marcas <small>${MARCAS.length}</small></a><a href="#/vende">Vende con nosotros</a>
      <div class="menu-sec"><a href="#/favoritos">Mis favoritos${favs.size ? ' (' + favs.size + ')' : ''}</a><a href="#/nosotros">Quiénes somos</a><a href="#/ayuda">Envíos, devoluciones y pago</a>
      <a href="${wa('Hola, ')}" target="_blank" rel="noopener">WhatsApp 629 05 71 55</a><a href="mailto:${MAIL}">${MAIL}</a><a href="${IG}" target="_blank" rel="noopener">Instagram @renuevotorre</a></div>`;
  }

  // --- buscador
  function buscar(v) {
    const r = $('#resultados');
    if (!v.trim()) {
      const sug = ['Louis Vuitton', 'Loewe', 'Christian Dior', 'Bolso', 'Vestido', 'Botín', 'Abrigo', 'Gucci'];
      r.innerHTML = `<p style="font-size:13px;color:var(--gris);margin:0 0 10px">Búsquedas populares</p><div class="sugerencias">${sug.map(s => `<a href="${enlace({}, { q: s })}">${s}</a>`).join('')}</div>`;
      return;
    }
    const l = P.filter(p => FIL.q(p, v));
    r.innerHTML = l.length
      ? `<p style="font-size:13px;color:var(--gris);margin:0 0 10px">${l.length} ${l.length === 1 ? 'pieza' : 'piezas'}</p><ul>${l.slice(0, 9).map(p => `<li><a href="#/pieza/${p.slug}"><img src="${p.img[0].g || p.img[0].m}" alt="" width="58" height="72" loading="lazy"><span><span class="marca">${esc(p.marca)}</span><span class="nombre">${esc(p.nombre)}</span><span class="precio">${eur(p.precio)}</span></span></a></li>`).join('')}</ul>${l.length > 9 ? `<p style="margin-top:16px"><a class="enlace" href="${enlace({}, { q: v })}">Ver las ${l.length}</a></p>` : ''}`
      : `<p>No tenemos nada con «${esc(v)}» ahora mismo.</p><p><a class="btn btn-linea" href="${wa('Hola, estoy buscando ' + v + '. ¿Me avisáis si entra algo?')}" target="_blank" rel="noopener">${ICON.wa}Avísame si entra</a></p>`;
  }

  // --- aviso
  let tt; function toast(t) { const e = $('#toast'); e.textContent = t; e.classList.add('on'); clearTimeout(tt); tt = setTimeout(() => e.classList.remove('on'), 2600); }

  // --- rutas
  function ruta() {
    const h = location.hash.replace(/^#/, '') || '/';
    const [camino, qs] = h.split('?');
    const par = Object.fromEntries(new URLSearchParams(qs || ''));
    const partes = camino.split('/').filter(Boolean);
    let v;
    if (!partes.length) v = V.inicio();
    else if (partes[0] === 'tienda') v = V.tienda(par);
    else if (partes[0] === 'pieza') v = V.pieza(decodeURIComponent(partes[1] || ''));
    else if (V[partes[0]] && partes[0] !== 'error' && partes[0] !== 'inicio') v = V[partes[0]](par);
    else v = V.error();
    cerrar(false);
    const main = $('#contenido');
    main.innerHTML = v.html; document.title = v.titulo;
    v.despues && v.despues();
    $$('.nav a').forEach(a => { const href = a.getAttribute('href'); a.toggleAttribute('aria-current', href === '#' + h || (href === '#/tienda' && h === '/tienda')); if (a.hasAttribute('aria-current')) a.setAttribute('aria-current', 'page'); });
    window.scrollTo(0, 0);
    if (ruta.yaCargo) main.focus({ preventScroll: true });
    ruta.yaCargo = true;
  }

  // --- eventos
  document.addEventListener('click', e => {
    const a = e.target.closest('a[href^="#"]');
    if (a && abierto && abierto.contains(a) && (a.getAttribute('href') === location.hash || (a.getAttribute('href') === '#/' && location.hash.length < 3))) cerrar(false);
    const t = e.target.closest('[data-fav],[data-add],[data-quitar],[data-abrir],[data-cerrar],#velo');
    if (!t) return;
    if (t.matches('[data-fav]')) {
      const id = +t.dataset.fav; const on = !favs.has(id); on ? favs.add(id) : favs.delete(id); guardar('favs', [...favs]); contadores();
      $$(`[data-fav="${id}"]`).forEach(b => { b.classList.toggle('on', on); b.setAttribute('aria-pressed', on); if (!b.classList.contains('fav')) b.textContent = on ? 'Guardada en favoritos' : 'Guardar en favoritos'; });
      toast(on ? 'Guardada en favoritos' : 'Quitada de favoritos');
    } else if (t.matches('[data-add]')) {
      const id = +t.dataset.add; if (!cesta.includes(id)) { cesta.push(id); guardar('cesta', cesta); contadores(); }
      t.textContent = 'Ya está en tu cesta'; t.disabled = true; abrir('cesta', $('[aria-controls="cesta"]'));
    } else if (t.matches('[data-quitar]')) {
      cesta = cesta.filter(x => x !== +t.dataset.quitar); guardar('cesta', cesta); contadores(); pintarCesta();
      const b = $(`[data-add="${t.dataset.quitar}"]`); if (b) { b.disabled = false; b.textContent = 'Añadir a la cesta'; }
      const f = $('#cesta-cuerpo a, #cesta-cuerpo button'); f && f.focus();
    } else if (t.matches('[data-abrir]')) { abrir(t.dataset.abrir, t); }
    else { cerrar(); }
  });
  document.addEventListener('change', e => { if (e.target.id === 'orden') { const h = location.hash.split('?'); const par = Object.fromEntries(new URLSearchParams(h[1] || '')); location.hash = enlace(par, { orden: e.target.value === 'nuevo' ? '' : e.target.value }); } });
  document.addEventListener('keydown', e => {
    if (!abierto) return;
    if (e.key === 'Escape') { cerrar(); return; }
    if (e.key === 'Tab') {
      const f = $$('a[href],button:not([disabled]),input,select,textarea', abierto).filter(x => x.offsetParent !== null);
      if (!f.length) return; const a = f[0], z = f[f.length - 1];
      if (e.shiftKey && document.activeElement === a) { e.preventDefault(); z.focus(); }
      else if (!e.shiftKey && document.activeElement === z) { e.preventDefault(); a.focus(); }
    }
  });
  $('#q').addEventListener('input', e => buscar(e.target.value));
  $('#form-buscar').addEventListener('submit', e => { e.preventDefault(); const v = $('#q').value.trim(); if (v) location.hash = enlace({}, { q: v }); });
  $('[aria-controls="buscador"]').addEventListener('click', () => buscar($('#q').value));
  window.addEventListener('hashchange', ruta);
  contadores(); ruta();
})();
