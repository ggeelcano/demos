/* Garaje Centro Bilbao · web de coches de ocasión (SPA estática con rutas hash) */
(function () {
  'use strict';

  const D = window.GC_DATA;
  const COCHES = D.coches;
  const TEL = '696 611 379';
  const TEL_HREF = 'tel:+34696611379';
  const WA = '34696611379';
  const TIN = 8.99; // orientativo: confirmar con la financiera del cliente
  const PLAZO_TARJETA = 84;
  const main = document.getElementById('main');

  /* ---------- utilidades ---------- */
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
  const miles = n => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  const euro = n => miles(n) + ' €';
  const norm = s => String(s).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  const nombre = c => `${c.marca} ${c.modelo}`;
  const waLink = txt => `https://wa.me/${WA}?text=${encodeURIComponent(txt)}`;
  const cuota = (capital, meses, tin = TIN) => {
    if (capital <= 0) return 0;
    const r = tin / 100 / 12;
    return capital * r / (1 - Math.pow(1 + r, -meses));
  };
  const combGrupo = c => c.combustible.startsWith('Híbrido') ? 'Híbrido' : c.combustible;
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const CARROCERIAS = {
    suv: { label: 'SUV y 4x4', foto: 'mazda-cx5-22-de-4wd-luxury' },
    monovolumen: { label: 'Monovolumen', foto: 'volkswagen-touran-sport-sound-20-tdi' },
    familiar: { label: 'Familiar', foto: 'volvo-v60-20-b4-d-momentum-auto' },
    berlina: { label: 'Berlina', foto: 'bmw-serie-4-418d-gran-coupe' },
    deportivo: { label: 'Deportivo', foto: 'porsche-911-carrera-coupe' },
    compacto: { label: 'Compacto', foto: 'ford-focus-15-ecoblue-trend' },
    comercial: { label: 'Combi y comercial', foto: 'ford-tourneo-connect-10-ecoboost-titanium' },
  };
  const byId = id => COCHES.find(c => c.id === id);
  const contar = fn => COCHES.filter(fn).length;
  const marcas = [...new Set(COCHES.map(c => c.marca))].map(m => ({ m, n: contar(c => c.marca === m) })).sort((a, b) => b.n - a.n || a.m.localeCompare(b.m));

  /* ---------- favoritos (solo en este navegador) ---------- */
  const FAV_KEY = 'gc-favoritos';
  let favs = [];
  try { favs = JSON.parse(localStorage.getItem(FAV_KEY) || '[]').filter(byId); } catch (e) { favs = []; }
  const guardarFavs = () => { try { localStorage.setItem(FAV_KEY, JSON.stringify(favs)); } catch (e) { /* sin almacenamiento */ } pintarFavCount(); };
  const esFav = id => favs.includes(id);
  function pintarFavCount() {
    const el = document.getElementById('favCount');
    el.textContent = favs.length;
    el.hidden = favs.length === 0;
  }
  document.addEventListener('click', e => {
    const b = e.target.closest('[data-fav]');
    if (!b) return;
    e.preventDefault();
    const id = b.dataset.fav;
    favs = esFav(id) ? favs.filter(x => x !== id) : [...favs, id];
    guardarFavs();
    document.querySelectorAll(`[data-fav="${id}"]`).forEach(x => x.setAttribute('aria-pressed', esFav(id)));
  });

  /* ---------- iconos ---------- */
  const I = {
    heart: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20.5s-7.5-4.6-9.3-9.2C1.4 8 3.6 4.5 7.1 4.5c2 0 3.4 1.1 4.9 2.9 1.5-1.8 2.9-2.9 4.9-2.9 3.5 0 5.7 3.5 4.4 6.8-1.8 4.6-9.3 9.2-9.3 9.2z"/></svg>',
    search: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5"/><path d="M15.5 15.5L21 21"/></svg>',
    left: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5l-7 7 7 7"/></svg>',
    right: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 5l7 7-7 7"/></svg>',
    tick: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>',
    phone: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6.6 3.5h3l1.5 4-2 1.3a11 11 0 0 0 6.1 6.1l1.3-2 4 1.5v3a2 2 0 0 1-2.2 2A17 17 0 0 1 4.6 5.7a2 2 0 0 1 2-2.2z"/></svg>',
    wa: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3.2a8.8 8.8 0 0 0-7.6 13.2L3.2 20.8l4.5-1.2A8.8 8.8 0 1 0 12 3.2z"/><path d="M9.2 7.9c.3 0 .5 0 .7.5l.8 1.8c.1.3 0 .5-.1.7l-.6.7c.6 1.2 1.6 2.2 2.9 2.9l.7-.6c.2-.2.4-.2.7-.1l1.8.8c.4.2.5.4.5.7 0 1.2-1 2-2.1 2-3.4 0-6.9-3.5-6.9-6.9 0-1.1.8-2.1 1.9-2.1z" fill="currentColor" stroke="none"/></svg>',
    shield: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3l7.5 3v5.5c0 4.6-3.2 8.3-7.5 9.5-4.3-1.2-7.5-4.9-7.5-9.5V6z"/><path d="M8.5 12l2.5 2.5 4.5-4.5"/></svg>',
    wrench: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14.7 6.3a4 4 0 0 0-5.3 5.3L3.5 17.5a1.8 1.8 0 0 0 2.5 2.5l5.9-5.9a4 4 0 0 0 5.3-5.3l-2.6 2.6-2.3-.4-.4-2.3z"/></svg>',
    swap: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 8h13l-3.5-3.5M20 16H7l3.5 3.5"/></svg>',
    truck: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M2.5 6.5h11v9h-11zM13.5 9.5h4l3 3.2v2.8h-7"/><circle cx="6.5" cy="17" r="1.8"/><circle cx="17" cy="17" r="1.8"/></svg>',
    cal: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3.5" y="5" width="17" height="15.5" rx="2"/><path d="M3.5 10h17M8 3v4M16 3v4"/></svg>',
    gauge: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4.2 17.5a8.5 8.5 0 1 1 15.6 0"/><path d="M12 13.5l4-4"/><circle cx="12" cy="14" r="1.3"/></svg>',
    fuel: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4.5 20.5V5a1.5 1.5 0 0 1 1.5-1.5h6A1.5 1.5 0 0 1 13.5 5v15.5M3 20.5h12M4.5 10h9M13.5 8.5l3 0 2.5 2.5v6.5a1.5 1.5 0 0 1-3 0v-3h-2.5"/></svg>',
    gear: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="5.5" cy="5.5" r="1.8"/><circle cx="12" cy="5.5" r="1.8"/><circle cx="18.5" cy="5.5" r="1.8"/><circle cx="5.5" cy="18.5" r="1.8"/><circle cx="12" cy="18.5" r="1.8"/><path d="M5.5 7.3v9.4M12 7.3v9.4M18.5 7.3V12H5.5"/></svg>',
    bolt: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M13 2.5L5 13.5h6l-1 8 8-11h-6z"/></svg>',
    seat: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="9" cy="7" r="3"/><path d="M3.5 20c0-3.3 2.5-6 5.5-6s5.5 2.7 5.5 6M16 4.5a3 3 0 0 1 0 5.6M18 14.3c1.5.9 2.5 3 2.5 5.7"/></svg>',
    color: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3.5a8.5 8.5 0 1 0 0 17c1.2 0 1.8-.8 1.8-1.7 0-1.3-1-1.6-1-2.6 0-.9.7-1.5 1.7-1.5h2.2a3.8 3.8 0 0 0 3.8-3.9c0-4.2-3.8-7.3-8.5-7.3z"/><circle cx="7.5" cy="11" r="1.2"/><circle cx="10.5" cy="7.5" r="1.2"/><circle cx="15" cy="7.8" r="1.2"/></svg>',
    leaf: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 19C5 10 10 5 20 4c0 10-5 15-13 15H5zM5 19l7-7"/></svg>',
    pin: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/></svg>',
    mail: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="5.5" width="18" height="13" rx="2"/><path d="M3.5 6.5l8.5 6.5 8.5-6.5"/></svg>',
    clock: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/></svg>',
    eye: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z"/><circle cx="12" cy="12" r="3"/></svg>',
    key: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="7.5" cy="14.5" r="4"/><path d="M10.5 11.5l9-9M16 6l2.5 2.5M13.5 8.5l2 2"/></svg>',
    ball: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8.5"/><path d="M12 7.5l3.5 2.5-1.3 4h-4.4l-1.3-4zM12 3.5v4M15.5 10l4.5-1.5M14.2 14l2.6 4.5M9.8 14l-2.6 4.5M8.5 10L4 8.5"/></svg>',
    drop: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3.5s6 6.4 6 10.5a6 6 0 0 1-12 0c0-4.1 6-10.5 6-10.5z"/></svg>',
    height: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3v18M8.5 6.5L12 3l3.5 3.5M8.5 17.5L12 21l3.5-3.5M4 3h3M4 21h3"/></svg>',
    zoom: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/></svg>',
    euro: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M17.5 6.5a6.5 6.5 0 1 0 0 11M4 10.5h9M4 13.5h9"/></svg>',
  };

  /* ---------- piezas comunes ---------- */
  function etiqueta(c) {
    const t = c.etiqueta;
    return `<span class="label-dgt label-dgt--${t}" role="img" aria-label="Etiqueta ${t === 'ECO' ? 'ECO' : t} de la DGT">${t}</span>`;
  }
  function badgesCoche(c, max = 3) {
    const b = [];
    if (c.precioAnterior) b.push('<span class="chip chip--red">Bajada de precio</span>');
    if (c.plazas === 7) b.push('<span class="chip">7 plazas</span>');
    if (/4WD/.test(c.version)) b.push('<span class="chip">4x4</span>');
    if (c.ivaDeducible) b.push('<span class="chip">IVA deducible</span>');
    return b.slice(0, max).join('');
  }
  function tarjeta(c, { eager = false } = {}) {
    const alt = `${nombre(c)} ${c.version} de ${c.ano}, color ${c.color.toLowerCase()}, en Garaje Centro Bilbao`;
    return `<article class="car">
      <div class="car__media">
        <img src="${c.mini}" alt="${esc(alt)}" width="500" height="375" ${eager ? '' : 'loading="lazy"'} decoding="async">
        <div class="car__badges">${badgesCoche(c)}</div>
        ${c.reservado ? '<div class="car__res">RESERVADO</div>' : ''}
      </div>
      <button class="fav" type="button" data-fav="${c.id}" aria-pressed="${esFav(c.id)}" aria-label="Guardar ${esc(nombre(c))} en favoritos">${I.heart}</button>
      <div class="car__body">
        <div style="min-width:0">
          <h3 class="car__title"><a href="#/coche/${c.id}">${esc(nombre(c))}</a></h3>
          <p class="car__ver">${esc(c.version)}</p>
        </div>
        <p class="car__price">
          ${c.precioAnterior ? `<s class="car__old"><span class="sr">Antes </span>${euro(c.precioAnterior)}</s>` : ''}
          <span class="car__now${c.precioAnterior ? ' car__now--down' : ''}">${c.precioAnterior ? '<span class="sr">Ahora </span>' : ''}${euro(c.precio)}</span>
        </p>
        <p class="car__meta">${c.ano} | ${miles(c.km)} km | ${c.cv} CV | ${esc(c.cambio)}</p>
        <div class="car__foot">
          <span class="car__fuel">${etiqueta(c)} ${esc(c.combustible)}</span>
          <span class="car__fee">Desde <b>${euro(cuota(c.precio, PLAZO_TARJETA))}</b>/mes</span>
        </div>
      </div>
    </article>`;
  }
  const promoTasar = () => `<div class="promo-card">
      <h3><em>Máxima tasación</em><br>por tu coche</h3>
      <p>Te lo pagamos al contado o lo dejas como parte del pago.</p>
      <a class="btn btn--red" href="#/vender">Tasar mi coche ${I.right}</a>
    </div>`;
  const ordenDefecto = (a, b) => (a.reservado - b.reservado) || b.alta.localeCompare(a.alta);

  function buscador(id, placeholder = 'Busca por marca o modelo') {
    return `<form class="search" role="search" data-search action="#/coches">
      <label class="sr" for="${id}">Buscar coche por marca o modelo</label>
      ${I.search}
      <input id="${id}" type="search" name="q" placeholder="${placeholder}" autocomplete="off" role="combobox" aria-autocomplete="list" aria-expanded="false" aria-controls="${id}-list">
      <ul class="search__list" id="${id}-list" role="listbox" hidden></ul>
    </form>`;
  }
  function activarBuscador(form, onEnter) {
    const input = form.querySelector('input');
    const list = form.querySelector('.search__list');
    let activo = -1;
    const cerrar = () => { list.hidden = true; input.setAttribute('aria-expanded', 'false'); activo = -1; input.removeAttribute('aria-activedescendant'); };
    const coincide = q => { const t = norm(q).trim(); if (!t) return []; return COCHES.filter(c => t.split(/\s+/).every(p => norm(`${c.marca} ${c.modelo} ${c.version} ${CARROCERIAS[c.carroceria].label} ${c.combustible}`).includes(p))); };
    input.addEventListener('input', () => {
      const q = input.value;
      const r = coincide(q).sort(ordenDefecto).slice(0, 6);
      if (!q.trim()) return cerrar();
      list.innerHTML = r.map((c, i) => `<li role="option" id="${input.id}-o${i}"><a href="#/coche/${c.id}" tabindex="-1"><img src="${c.mini}" alt="" width="64" height="48"><span><b>${esc(nombre(c))}</b><small>${esc(c.version)} · ${c.ano} · ${euro(c.precio)}</small></span></a></li>`).join('')
        + `<li role="option" id="${input.id}-o${r.length}"><a class="search__all" href="#/coches?q=${encodeURIComponent(q.trim())}" tabindex="-1">${r.length ? `Ver ${coincide(q).length === 1 ? 'el resultado' : `los ${coincide(q).length} resultados`}` : 'No hay coincidencias. Ver todos los coches'}</a></li>`;
      list.hidden = false; input.setAttribute('aria-expanded', 'true'); activo = -1;
    });
    input.addEventListener('keydown', e => {
      const opts = [...list.querySelectorAll('a')];
      if (list.hidden || !opts.length) return;
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        activo = (activo + (e.key === 'ArrowDown' ? 1 : -1) + opts.length) % opts.length;
        opts.forEach((o, i) => o.classList.toggle('is-active', i === activo));
        input.setAttribute('aria-activedescendant', `${input.id}-o${activo}`);
      } else if (e.key === 'Escape') { cerrar(); }
      else if (e.key === 'Enter' && activo >= 0) { e.preventDefault(); location.hash = opts[activo].getAttribute('href'); cerrar(); }
    });
    input.addEventListener('blur', () => setTimeout(cerrar, 180));
    form.addEventListener('submit', e => {
      e.preventDefault();
      const q = input.value.trim();
      if (onEnter) onEnter(q); else location.hash = '#/coches' + (q ? `?q=${encodeURIComponent(q)}` : '');
      cerrar();
    });
  }

  function migas(items) {
    return `<nav class="crumbs" aria-label="Estás en"><div class="wrap"><ol>${items.map((it, i) => i === items.length - 1
      ? `<li><span aria-current="page">${esc(it[0])}</span></li>`
      : `<li><a href="${it[1]}">${esc(it[0])}</a></li>`).join('')}</ol></div></nav>`;
  }

  /* ---------- PORTADA ---------- */
  const HERO_IDS = ['honda-hrv-15-ivtec-turbo-sport-cvt', 'volvo-v60-20-b4-d-momentum-auto', 'volkswagen-sharan-advance-14-tsi-dsg', 'toyota-chr-18-125h-advance'];
  let heroTimer = null;

  function home() {
    const disp = COCHES.filter(c => !c.reservado);
    const nuevos = [...COCHES].sort(ordenDefecto).slice(0, 6);
    const hero = HERO_IDS.map(byId).filter(Boolean);
    const cats = Object.entries(CARROCERIAS).map(([k, v]) => ({ k, ...v, n: contar(c => c.carroceria === k) })).filter(x => x.n);
    const quick = [
      ['7 plazas', 'plazas=7', contar(c => c.plazas === 7)],
      ['Automáticos', 'cambio=Automático', contar(c => c.cambio === 'Automático')],
      ['Bajada de precio', 'rebaja=1', contar(c => c.precioAnterior)],
      ['IVA deducible', 'iva=1', contar(c => c.ivaDeducible)],
      ['Menos de 15.000 €', 'pmax=15000', contar(c => c.precio <= 15000)],
      ['Etiqueta ECO', 'etiqueta=ECO', contar(c => c.etiqueta === 'ECO')],
    ].filter(q => q[2]);

    main.innerHTML = `
    <section class="hero" aria-labelledby="hero-h">
      <div class="wrap hero__in">
        <div>
          ${buscador('q-hero')}
          <h1 id="hero-h">Coches de ocasión con <em>12 meses de garantía</em> en el centro de Bilbao</h1>
          <p class="hero__sub">${COCHES.length} coches multimarca revisados en nuestro taller de Zancoeta. Recogemos tu coche como parte del pago y nos ocupamos de la transferencia.</p>
          <div class="hero__ctas">
            <a class="btn btn--outline-w" href="#/vender">Vender</a>
            <a class="btn btn--red" href="#/coches">Comprar</a>
          </div>
        </div>
        <div class="hero__media" aria-roledescription="carrusel" aria-label="Coches destacados">
          ${hero.map((c, i) => `<a class="hero__slide${i === 0 ? ' is-on' : ''}" href="#/coche/${c.id}" ${i ? 'aria-hidden="true" tabindex="-1"' : ''}>
            <img src="${c.fotos[0]}" alt="${esc(`${nombre(c)} ${c.version} en la puerta de Garaje Centro`)}" width="960" height="720" ${i ? 'loading="lazy"' : 'fetchpriority="high"'}>
            <span class="hero__tag"><b>${esc(nombre(c))}</b><span>${c.ano} · ${miles(c.km)} km · <strong>${euro(c.precio)}</strong></span></span>
          </a>`).join('')}
          <div class="hero__dots">${hero.map((c, i) => `<button type="button" data-slide="${i}" aria-label="Ver ${esc(nombre(c))}" aria-current="${i === 0}"></button>`).join('')}</div>
        </div>
      </div>
    </section>

    <div class="trust"><div class="wrap"><ul class="trust__grid" role="list" style="list-style:none;margin:0;padding:0">
      <li class="trust__item"><span class="trust__ico">${I.shield}</span><span><b>12 meses de garantía</b><span>En todos nuestros coches</span></span></li>
      <li class="trust__item"><span class="trust__ico">${I.wrench}</span><span><b>Revisado en nuestro taller</b><span>Se entrega con el último mantenimiento hecho</span></span></li>
      <li class="trust__item"><span class="trust__ico">${I.swap}</span><span><b>Tu coche como parte del pago</b><span>Máxima tasación y pago al contado</span></span></li>
      <li class="trust__item"><span class="trust__ico">${I.truck}</span><span><b>Te lo llevamos a casa</b><span>Y hacemos la transferencia a tu nombre</span></span></li>
    </ul></div></div>

    <section class="section" aria-labelledby="cat-h">
      <div class="wrap">
        <div class="section__head">
          <h2 id="cat-h">El coche de ocasión que buscas te espera en Zancoeta</h2>
          <p>Elige el tipo de coche y mira lo que tenemos ahora mismo en la exposición.</p>
        </div>
        <div class="cats">
          ${cats.map(x => { const f = byId(x.foto); return `<a class="cat" href="#/coches?carroceria=${x.k}"><div class="cat__img"><img src="${f.mini}" alt="" width="500" height="375" loading="lazy"></div><b>${x.label}</b><span>${x.n} ${x.n === 1 ? 'coche' : 'coches'}</span></a>`; }).join('')}
          <a class="cat" href="#/coches"><div class="cat__img"><img src="${byId('volkswagen-touran-advance-14-tsi-sport').mini}" alt="" width="500" height="375" loading="lazy"></div><b>Ver todos</b><span>${COCHES.length} coches</span></a>
        </div>
        <div class="quick">${quick.map(q => `<a href="#/coches?${q[1]}">${q[0]} <span>(${q[2]})</span></a>`).join('')}</div>
      </div>
    </section>

    <section class="section section--soft" aria-labelledby="new-h">
      <div class="wrap">
        <div class="row-head">
          <div><h2 id="new-h">Recién llegados</h2><p>Los últimos coches que han entrado en Garaje Centro.</p></div>
          <a class="btn btn--outline btn--sm" href="#/coches">Ver los ${COCHES.length} coches</a>
        </div>
        <div class="grid">${nuevos.map(c => tarjeta(c)).join('')}</div>
        <div class="center mt-24"><a class="btn btn--red" href="#/coches">Ver más coches</a></div>
      </div>
    </section>

    <section class="section" aria-labelledby="brand-h">
      <div class="wrap">
        <div class="section__head">
          <h2 id="brand-h">Stock multimarca</h2>
          <p>De utilitarios para trabajar a monovolúmenes de 7 plazas y algún deportivo de los que ya no se ven.</p>
        </div>
        <div class="brands">${marcas.map(x => `<a class="brand" href="#/coches?marca=${encodeURIComponent(x.m)}"><b>${esc(x.m)}</b><span>${x.n} ${x.n === 1 ? 'coche' : 'coches'}</span></a>`).join('')}</div>
      </div>
    </section>

    <section class="section section--soft" aria-labelledby="why-h">
      <div class="wrap">
        <div class="stats">
          <div class="stat"><b>1981</b><span>vendiendo coches en Bilbao</span></div>
          <div class="stat"><b>${miles(D.totalVendidos)}</b><span>coches vendidos</span></div>
          <div class="stat"><b>12 meses</b><span>de garantía</span></div>
          <div class="stat"><b>+1.000 m²</b><span>junto a San Mamés</span></div>
        </div>
        <div class="feature">
          <div class="feature__img"><img src="img/web/entrada-parking.jpg" alt="Entrada de Garaje Centro en la calle Zancoeta 5 de Bilbao" width="900" height="715" loading="lazy"></div>
          <div>
            <h2 id="why-h">Una casa de coches de las de siempre, a tres minutos de San Mamés</h2>
            <p>Garaje Centro es una empresa familiar que lleva en el motor desde 1981. Cada coche pasa por nuestro taller antes de ponerse a la venta y lo fotografiamos aquí mismo, en la puerta de Zancoeta 5, para que veas exactamente lo que te llevas.</p>
            <ul class="ticks">
              <li>${I.tick}<span><b>Último mantenimiento hecho</b> en nuestro taller antes de la entrega.</span></li>
              <li>${I.tick}<span><b>Garantía de 12 meses</b> y nos encargamos de la transferencia a tu nombre.</span></li>
              <li>${I.tick}<span><b>Financiación a tu medida</b>, con la cuota que encaje en tu mes.</span></li>
              <li>${I.tick}<span><b>Recogemos tu coche</b> como parte del pago del siguiente.</span></li>
            </ul>
            <div class="btn-row"><a class="btn btn--outline" href="#/contacto">Ven a vernos</a></div>
          </div>
        </div>
      </div>
    </section>

    <section class="section" aria-label="Otros servicios">
      <div class="wrap duo">
        <a class="duo__card" href="#/vender">
          <img src="${D.vendidos[0].foto}" alt="" loading="lazy">
          <div class="duo__txt"><small>Vende tu coche</small><h3>Te lo pagamos al contado</h3><p>Máxima tasación y transferencia a nuestro nombre en el momento.</p><span class="btn btn--white btn--sm">Tasar mi coche</span></div>
        </a>
        <a class="duo__card" href="#/parking">
          <img src="img/web/entrada-parking.jpg" alt="" loading="lazy">
          <div class="duo__txt"><small>Parking low cost</small><h3>Aparca en el centro por 20 € al día</h3><p>Vigilado las 24 horas, con aparcacoches y libre de la Zona de Bajas Emisiones.</p><span class="btn btn--white btn--sm">Ver tarifas</span></div>
        </a>
      </div>
    </section>

    <section class="section section--soft" aria-labelledby="sold-h">
      <div class="wrap">
        <div class="row-head">
          <div><h2 id="sold-h">Ya tienen nuevo dueño</h2><p>${miles(D.totalVendidos)} coches vendidos. Estos son los últimos que han salido de Zancoeta.</p></div>
          <div class="row-head__nav"><button class="round" type="button" data-sold="-1" aria-label="Anteriores">${I.left}</button><button class="round" type="button" data-sold="1" aria-label="Siguientes">${I.right}</button></div>
        </div>
        <div class="sold" id="sold" tabindex="0" aria-label="Coches vendidos recientemente">
          ${D.vendidos.map(v => `<figure><div class="sold__img"><img src="${v.foto}" alt="${esc(v.titulo)}" width="750" height="563" loading="lazy"><span class="chip chip--navy">Vendido</span></div><figcaption>${esc(titulo(v.titulo))}<small>${v.ano} · ${miles(v.km)} km</small></figcaption></figure>`).join('')}
        </div>
      </div>
    </section>`;

    activarBuscador(main.querySelector('[data-search]'));
    iniciarHero();
    main.querySelectorAll('[data-sold]').forEach(b => b.addEventListener('click', () => {
      const s = document.getElementById('sold');
      s.scrollBy({ left: Number(b.dataset.sold) * s.clientWidth * .8, behavior: reducedMotion ? 'auto' : 'smooth' });
    }));
    return 'Garaje Centro Bilbao | Coches de ocasión revisados y con garantía';
  }
  function titulo(t) {
    // "VOLKSWAGEN Passat 2.0 TDI" -> "Volkswagen Passat 2.0 TDI"
    return t.replace(/^([A-Z-]+)/, m => m.split('-').map(p => p[0] + p.slice(1).toLowerCase()).join('-')).replace(/^Bmw/, 'BMW');
  }
  function iniciarHero() {
    const slides = [...main.querySelectorAll('.hero__slide')];
    const dots = [...main.querySelectorAll('[data-slide]')];
    if (!slides.length) return;
    let i = 0;
    const ir = n => {
      i = (n + slides.length) % slides.length;
      slides.forEach((s, k) => { s.classList.toggle('is-on', k === i); k === i ? s.removeAttribute('aria-hidden') : s.setAttribute('aria-hidden', 'true'); s.tabIndex = k === i ? 0 : -1; });
      dots.forEach((d, k) => d.setAttribute('aria-current', k === i));
    };
    dots.forEach(d => d.addEventListener('click', () => { ir(Number(d.dataset.slide)); parar(); }));
    const media = main.querySelector('.hero__media');
    const arrancar = () => { if (!reducedMotion && !heroTimer) heroTimer = setInterval(() => ir(i + 1), 5000); };
    const parar = () => { clearInterval(heroTimer); heroTimer = null; };
    media.addEventListener('mouseenter', parar);
    media.addEventListener('mouseleave', arrancar);
    media.addEventListener('focusin', parar);
    arrancar();
  }

  /* ---------- LISTADO ---------- */
  const FILTROS = [
    { k: 'marca', label: 'Marca', ops: () => marcas.map(x => [x.m, `${x.m} (${x.n})`]) },
    { k: 'carroceria', label: 'Carrocería', ops: () => Object.entries(CARROCERIAS).map(([k, v]) => [k, `${v.label} (${contar(c => c.carroceria === k)})`]) },
    { k: 'combustible', label: 'Combustible', ops: () => ['Diésel', 'Gasolina', 'Híbrido'].map(f => [f, `${f} (${contar(c => combGrupo(c) === f)})`]) },
    { k: 'cambio', label: 'Cambio', ops: () => ['Manual', 'Automático'].map(f => [f, `${f} (${contar(c => c.cambio === f)})`]) },
    { k: 'pmax', label: 'Precio hasta', ops: () => [5000, 10000, 15000, 20000, 25000, 50000].map(v => [String(v), `Hasta ${euro(v)}`]) },
    { k: 'kmax', label: 'Km hasta', ops: () => [50000, 100000, 150000, 200000].map(v => [String(v), `Hasta ${miles(v)} km`]) },
    { k: 'desde', label: 'Año desde', ops: () => [2010, 2015, 2017, 2019, 2021].map(v => [String(v), `Desde ${v}`]) },
    { k: 'plazas', label: 'Plazas', ops: () => [['5', '5 plazas o menos'], ['7', '7 plazas']] },
  ];
  const ORDEN = {
    destacados: ['Recién llegados', ordenDefecto],
    'precio-asc': ['Precio más bajo', (a, b) => a.precio - b.precio],
    'precio-desc': ['Precio más alto', (a, b) => b.precio - a.precio],
    'km-asc': ['Menos kilómetros', (a, b) => a.km - b.km],
    'ano-desc': ['Más nuevos', (a, b) => b.ano - a.ano || a.km - b.km],
  };
  function filtrar(p) {
    const q = norm(p.get('q') || '').trim();
    return COCHES.filter(c =>
      (!p.get('marca') || c.marca === p.get('marca')) &&
      (!p.get('carroceria') || c.carroceria === p.get('carroceria')) &&
      (!p.get('combustible') || combGrupo(c) === p.get('combustible')) &&
      (!p.get('cambio') || c.cambio === p.get('cambio')) &&
      (!p.get('pmax') || c.precio <= Number(p.get('pmax'))) &&
      (!p.get('kmax') || c.km <= Number(p.get('kmax'))) &&
      (!p.get('desde') || c.ano >= Number(p.get('desde'))) &&
      (!p.get('plazas') || (p.get('plazas') === '7' ? c.plazas >= 7 : c.plazas <= 5)) &&
      (!p.get('etiqueta') || c.etiqueta === p.get('etiqueta')) &&
      (!p.get('iva') || c.ivaDeducible) &&
      (!p.get('rebaja') || c.precioAnterior) &&
      (!p.get('disp') || !c.reservado) &&
      (!p.get('fav') || esFav(c.id)) &&
      (!q || q.split(/\s+/).every(t => norm(`${c.marca} ${c.modelo} ${c.version} ${CARROCERIAS[c.carroceria].label} ${c.combustible}`).includes(t)))
    ).sort((ORDEN[p.get('orden')] || ORDEN.destacados)[1]);
  }
  function tituloListado(p) {
    if (p.get('fav')) return 'Tus coches favoritos';
    if (p.get('marca')) return `${p.get('marca')} de segunda mano en Bilbao`;
    if (p.get('carroceria') && CARROCERIAS[p.get('carroceria')]) return `${CARROCERIAS[p.get('carroceria')].label} de segunda mano en Bilbao`;
    return 'Coches de segunda mano en Bilbao';
  }

  function listado(params) {
    const p = new URLSearchParams(params);
    main.innerHTML = `
    ${migas([['Inicio', '#/'], ['Coches de segunda mano', '#/coches']])}
    <div class="list-top"><div class="wrap">
      <h1 id="list-h">${esc(tituloListado(p))}</h1>
      ${buscador('q-list', 'Buscar por marca, modelo…')}
    </div></div>
    <div class="filters"><div class="wrap filters__in">
      <button type="button" class="btn btn--outline btn--sm filters__toggle" aria-expanded="false" aria-controls="fpanel">Filtros</button>
      <div class="filters__panel" id="fpanel">
        ${FILTROS.map(f => `<div class="fsel"><label class="sr" for="f-${f.k}">${f.label}</label><select id="f-${f.k}" data-f="${f.k}"><option value="">${f.label}</option>${f.ops().map(o => `<option value="${esc(o[0])}">${esc(o[1])}</option>`).join('')}</select></div>`).join('')}
      </div>
      <button type="button" class="filters__clear" data-clear hidden>Borrar filtros</button>
    </div></div>
    <div class="wrap">
      <div class="results-bar">
        <p id="res-count" aria-live="polite"></p>
        <div class="results-bar__right">
          <label class="switch"><input type="checkbox" data-t="rebaja"> Bajada de precio</label>
          <label class="switch"><input type="checkbox" data-t="disp"> Ocultar reservados</label>
          <div class="sort"><label class="sr" for="orden">Ordenar por</label><select id="orden" data-f="orden">${Object.entries(ORDEN).map(([k, v]) => `<option value="${k}">${v[0]}</option>`).join('')}</select></div>
        </div>
      </div>
      <div id="results"></div>
      <div class="find-banner">
        <p>¿No encuentras el coche que quieres? ¡Te lo buscamos!</p>
        <a class="btn btn--wa" href="${waLink('Hola, estoy buscando un coche de segunda mano y no lo veo en vuestra web. Busco: ')}" target="_blank" rel="noopener">${I.wa} Cuéntanos qué buscas</a>
      </div>
      <div class="seo-text">
        <h2>Coches de segunda mano y ocasión en Bilbao</h2>
        <p>En Garaje Centro vendemos coches de ocasión multimarca desde 1981. Todos están revisados en nuestro taller, salen con el último mantenimiento hecho y llevan 12 meses de garantía. Nos encargamos de la transferencia a tu nombre y, si lo prefieres, te llevamos el coche a casa.</p>
        <h2>Tu coche actual, como parte del pago</h2>
        <p>Si tienes un coche para entregar, lo tasamos y descontamos su valor del precio del que te llevas. También te lo compramos al contado aunque no te quedes con ninguno de los nuestros.</p>
      </div>
    </div>`;

    const pintar = () => {
      const lista = filtrar(p);
      const conFiltros = [...p.keys()].some(k => k !== 'orden');
      document.getElementById('res-count').innerHTML = `<b>${lista.length}</b> ${lista.length === 1 ? 'coche de segunda mano' : 'coches de segunda mano'} ${conFiltros ? 'con estos filtros' : 'y ocasión al mejor precio'}`;
      const cont = document.getElementById('results');
      if (!lista.length) {
        cont.innerHTML = `<div class="empty"><h2>${p.get('fav') ? 'Aún no has guardado ningún coche' : 'No hay coches con estos filtros'}</h2><p>${p.get('fav') ? 'Pulsa el corazón de cualquier coche para tenerlo a mano aquí.' : 'Prueba a quitar algún filtro o pregúntanos: entran coches nuevos cada semana.'}</p><a class="btn btn--red" href="#/coches">Ver todos los coches</a></div>`;
      } else {
        const html = lista.map((c, i) => tarjeta(c, { eager: i < 3 }));
        if (!conFiltros && html.length > 2) html.splice(1, 0, promoTasar());
        cont.innerHTML = `<div class="grid">${html.join('')}</div>`;
      }
      main.querySelectorAll('[data-f]').forEach(s => { s.value = p.get(s.dataset.f) || (s.dataset.f === 'orden' ? 'destacados' : ''); s.closest('.fsel')?.classList.toggle('is-set', !!p.get(s.dataset.f)); });
      main.querySelectorAll('[data-t]').forEach(t => { t.checked = !!p.get(t.dataset.t); });
      main.querySelector('[data-clear]').hidden = !conFiltros;
      main.querySelector('#q-list').value = p.get('q') || '';
      document.getElementById('list-h').textContent = tituloListado(p);
      const qs = p.toString();
      history.replaceState(null, '', '#/coches' + (qs ? '?' + qs : ''));
    };
    main.querySelectorAll('[data-f]').forEach(s => s.addEventListener('change', () => { s.value ? p.set(s.dataset.f, s.value) : p.delete(s.dataset.f); if (s.dataset.f === 'orden' && s.value === 'destacados') p.delete('orden'); pintar(); }));
    main.querySelectorAll('[data-t]').forEach(t => t.addEventListener('change', () => { t.checked ? p.set(t.dataset.t, '1') : p.delete(t.dataset.t); pintar(); }));
    main.querySelector('[data-clear]').addEventListener('click', () => { [...p.keys()].filter(k => k !== 'orden').forEach(k => p.delete(k)); pintar(); });
    const tog = main.querySelector('.filters__toggle');
    tog.addEventListener('click', () => { const o = tog.getAttribute('aria-expanded') !== 'true'; tog.setAttribute('aria-expanded', o); document.getElementById('fpanel').classList.toggle('is-open', o); });
    activarBuscador(main.querySelector('[data-search]'), q => { q ? p.set('q', q) : p.delete('q'); pintar(); });
    pintar();
    return `${tituloListado(p)} | Garaje Centro`;
  }

  /* ---------- FICHA ---------- */
  function separarEquipamiento(parrafos) {
    let idx = -1, max = 3;
    parrafos.forEach((t, i) => { const n = (t.match(/,/g) || []).length; if (n > max) { max = n; idx = i; } });
    if (idx < 0) return { texto: parrafos, equipo: [] };
    let t = parrafos[idx];
    let antes = '';
    const corte = Math.max(t.lastIndexOf(': '), t.lastIndexOf('. ', t.indexOf(',')));
    if (corte > 0) { antes = t.slice(0, corte + 1).trim(); t = t.slice(corte + 1); }
    const equipo = t.replace(/\.{3}|…/g, '').split(/,\s*/).map(x => x.trim().replace(/\.$/, '')).filter(x => x && x.length < 60)
      // "asientos de piel, eléctricos y calefactables" es un solo elemento
      .reduce((acc, x) => { if (acc.length && /^(eléctric|calefact)/i.test(x)) acc[acc.length - 1] += ', ' + x; else acc.push(x); return acc; }, [])
      .map(x => x[0].toUpperCase() + x.slice(1));
    const texto = parrafos.slice();
    if (antes && !/:$/.test(antes)) texto[idx] = antes; else texto.splice(idx, 1);
    return { texto, equipo };
  }
  function ficha(id) {
    const c = byId(id);
    if (!c) { location.replace('#/coches'); return null; }
    const { texto, equipo } = separarEquipamiento(c.descripcion);
    const parecidos = COCHES.filter(x => x.id !== c.id).map(x => ({ x, s: (x.carroceria === c.carroceria ? 0 : 1) * 1e6 + Math.abs(x.precio - c.precio) + (x.reservado ? 5e5 : 0) })).sort((a, b) => a.s - b.s).slice(0, 3).map(o => o.x);
    const fotos = c.fotos;
    const msgReserva = `Hola, me interesa el ${nombre(c)} ${c.version} (${c.ano}, ${miles(c.km)} km) que tenéis a ${euro(c.precio)}. ¿Podría reservarlo?`;
    const msgInfo = `Hola, tengo una pregunta sobre el ${nombre(c)} ${c.version} de ${c.ano} (${euro(c.precio)}).`;
    const msgFotos = `Hola, ¿me podéis mandar el reportaje completo de fotos y los vídeos del ${nombre(c)} ${c.version} (${c.ano})?`;
    const specs = [
      [I.cal, 'Año', c.ano], [I.gauge, 'Kilómetros', `${miles(c.km)} km`], [I.fuel, 'Combustible', c.combustible], [I.gear, 'Cambio', c.cambio],
      [I.bolt, 'Potencia', `${c.cv} CV`], [I.seat, 'Plazas y puertas', `${c.plazas} plazas · ${c.puertas} p.`], [I.color, 'Color', c.color], [I.leaf, 'Etiqueta DGT', c.etiqueta === 'ECO' ? 'ECO' : `${c.etiqueta}`],
    ];

    main.innerHTML = `
    ${migas([['Inicio', '#/'], ['Coches de segunda mano', '#/coches'], [c.marca, `#/coches?marca=${encodeURIComponent(c.marca)}`], `${c.modelo} ${c.version}`].map(x => Array.isArray(x) ? x : [x]))}
    <div class="wrap detail">
      <div class="detail__gal">
        <div class="gal">
          <div class="gal__main">
            <img id="galImg" src="${fotos[0]}" alt="${esc(`${nombre(c)} ${c.version}, foto 1 de ${fotos.length}`)}" width="960" height="720" fetchpriority="high">
            <button class="gal__arrow gal__arrow--prev" type="button" data-g="-1" aria-label="Foto anterior">${I.left}</button>
            <button class="gal__arrow gal__arrow--next" type="button" data-g="1" aria-label="Foto siguiente">${I.right}</button>
            <button class="gal__zoom" type="button" data-zoom>${I.zoom} Pantalla completa</button>
            <span class="gal__count" id="galCount">1 / ${fotos.length}</span>
          </div>
          <div class="gal__thumbs" role="list" aria-label="Miniaturas">
            ${fotos.map((f, i) => `<button type="button" role="listitem" data-thumb="${i}" aria-label="Ver foto ${i + 1}" aria-current="${i === 0}"><img src="${f}" alt="" width="96" height="72" loading="lazy"></button>`).join('')}
          </div>
          ${c.totalFotos > fotos.length ? `<p class="gal__more">Tenemos un reportaje de ${c.totalFotos} fotos y vídeos de este coche. <a class="link" href="${waLink(msgFotos)}" target="_blank" rel="noopener">Pídelo por WhatsApp</a></p>` : ''}
        </div>
      </div>

      <aside class="buy" aria-label="Precio y reserva">
        <div class="buy__badges">${c.reservado ? '<span class="chip chip--navy">Reservado</span>' : ''}${badgesCoche(c, 4)}</div>
        <h1>${esc(nombre(c))}</h1>
        <p class="buy__ver">${esc(c.version)}</p>
        <p class="buy__meta">${c.ano} · ${miles(c.km)} km · ${c.cv} CV · ${esc(c.cambio)} · ${esc(c.combustible)}</p>
        <div class="buy__price">
          <b class="${c.precioAnterior ? 'down' : ''}">${c.precioAnterior ? '<span class="sr">Ahora </span>' : ''}${euro(c.precio)}</b>
          ${c.precioAnterior ? `<s><span class="sr">Antes </span>${euro(c.precioAnterior)}</s>` : ''}
        </div>
        <p class="buy__iva">${c.ivaDeducible ? 'IVA deducible para empresas y autónomos' : 'IVA incluido. Nos encargamos de la transferencia.'}</p>
        <div class="buy__fee"><span>Desde <b>${euro(cuota(c.precio, PLAZO_TARJETA))}/mes</b></span><a href="#" data-goto="calc">Calcular</a></div>
        <div class="buy__ctas">
          ${c.reservado
            ? `<p><b>Este coche está reservado.</b> Si la reserva se cae, te avisamos los primeros.</p>
               <a class="btn btn--red" href="${waLink(`Hola, avisadme si se libera el ${nombre(c)} ${c.version} (${c.ano}).`)}" target="_blank" rel="noopener">Avísame si se libera</a>
               <a class="btn btn--outline" href="#" data-goto="similares">Ver coches parecidos</a>`
            : `<a class="btn btn--red" href="${waLink(msgReserva)}" target="_blank" rel="noopener">Reservar este coche</a>
               <a class="btn btn--outline" href="${TEL_HREF}">${I.phone} Llamar al ${TEL}</a>
               <a class="btn btn--wa" href="${waLink(msgInfo)}" target="_blank" rel="noopener">${I.wa} Preguntar por WhatsApp</a>`}
        </div>
        <ul class="buy__list">
          <li>${I.tick} Garantía de ${esc(c.garantia)}</li>
          <li>${I.tick} Revisado en nuestro taller antes de la entrega</li>
          <li>${I.tick} Nos encargamos de la transferencia</li>
          <li>${I.tick} Te lo llevamos a casa</li>
        </ul>
      </aside>

      <div class="detail__rest">

        <section class="block" aria-labelledby="spec-h">
          <h2 id="spec-h">Características</h2>
          <div class="specs">${specs.map(s => `<div class="spec">${s[0]}<span><small>${s[1]}</small><b>${esc(s[2])}</b></span></div>`).join('')}</div>
        </section>

        <section class="block desc" aria-labelledby="desc-h">
          <h2 id="desc-h">Así es este ${esc(nombre(c))}</h2>
          ${texto.map(t => `<p>${esc(t)}</p>`).join('')}
          ${equipo.length ? `<h3 class="sr">Equipamiento destacado</h3><ul class="equip">${equipo.map(e => `<li>${esc(e)}</li>`).join('')}</ul>` : ''}
        </section>

        <section class="block" aria-labelledby="calc-h" id="calc">
          <h2 id="calc-h">Calcula tu cuota</h2>
          <div class="calc">
            <div>
              <div class="calc__ctl">
                <label for="cEntrada">Entrada <output id="oEntrada" for="cEntrada">0 €</output></label>
                <input type="range" id="cEntrada" min="0" max="${Math.floor(c.precio * 0.6 / 500) * 500}" step="500" value="0">
              </div>
              <div class="calc__ctl">
                <label for="cPlazo">Plazo <output id="oPlazo" for="cPlazo">${PLAZO_TARJETA} meses</output></label>
                <input type="range" id="cPlazo" min="12" max="96" step="12" value="${PLAZO_TARJETA}">
              </div>
            </div>
            <div class="calc__out" aria-live="polite">
              <span>Tu cuota</span>
              <b id="oCuota">${euro(cuota(c.precio, PLAZO_TARJETA))}/mes</b>
              <small>Cálculo orientativo con un TIN del ${String(TIN).replace('.', ',')} %. La cuota final depende de la aprobación de la entidad financiera.</small>
              <a class="btn btn--outline btn--sm mt-24" id="calcWa" target="_blank" rel="noopener" href="#">Pedir esta financiación</a>
            </div>
          </div>
        </section>

        <section class="block">
          <div class="tradein">
            <div><h2>¿Tienes un coche para entregar?</h2><p>Te lo tasamos y lo descontamos del precio de este ${esc(nombre(c))}.</p></div>
            <a class="btn btn--white" href="#/vender?para=${c.id}">Tasar mi coche</a>
          </div>
        </section>
      </div>

    </div>

    <section class="section section--soft" aria-labelledby="sim-h" id="similares">
      <div class="wrap">
        <div class="row-head"><div><h2 id="sim-h">Coches parecidos</h2><p>Otras opciones que te pueden encajar.</p></div><a class="btn btn--outline btn--sm" href="#/coches">Ver todos</a></div>
        <div class="grid">${parecidos.map(x => tarjeta(x)).join('')}</div>
      </div>
    </section>`;

    // galería
    let gi = 0;
    const img = document.getElementById('galImg');
    const cnt = document.getElementById('galCount');
    const thumbs = [...main.querySelectorAll('[data-thumb]')];
    const ir = n => {
      gi = (n + fotos.length) % fotos.length;
      img.src = fotos[gi];
      img.alt = `${nombre(c)} ${c.version}, foto ${gi + 1} de ${fotos.length}`;
      cnt.textContent = `${gi + 1} / ${fotos.length}`;
      thumbs.forEach((t, k) => t.setAttribute('aria-current', k === gi));
      thumbs[gi].scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: reducedMotion ? 'auto' : 'smooth' });
      new Image().src = fotos[(gi + 1) % fotos.length];
    };
    main.querySelectorAll('[data-g]').forEach(b => b.addEventListener('click', () => ir(gi + Number(b.dataset.g))));
    thumbs.forEach(t => t.addEventListener('click', () => ir(Number(t.dataset.thumb))));
    let x0 = null;
    const gm = main.querySelector('.gal__main');
    gm.addEventListener('touchstart', e => { x0 = e.touches[0].clientX; }, { passive: true });
    gm.addEventListener('touchend', e => { if (x0 === null) return; const dx = e.changedTouches[0].clientX - x0; if (Math.abs(dx) > 40) ir(gi + (dx < 0 ? 1 : -1)); x0 = null; });
    const abrir = () => lightbox.abrir(fotos, gi, nombre(c), n => ir(n));
    img.addEventListener('click', abrir);
    main.querySelector('[data-zoom]').addEventListener('click', abrir);

    // calculadora
    const ent = document.getElementById('cEntrada'), pl = document.getElementById('cPlazo');
    const calc = () => {
      const e = Number(ent.value), m = Number(pl.value), q = cuota(c.precio - e, m);
      document.getElementById('oEntrada').textContent = euro(e);
      document.getElementById('oPlazo').textContent = `${m} meses`;
      document.getElementById('oCuota').textContent = `${euro(q)}/mes`;
      document.getElementById('calcWa').href = waLink(`Hola, me interesa financiar el ${nombre(c)} ${c.version} (${euro(c.precio)}) con ${euro(e)} de entrada a ${m} meses. ¿Me dais la cuota exacta?`);
    };
    ent.addEventListener('input', calc); pl.addEventListener('input', calc); calc();
    main.querySelectorAll('[data-goto]').forEach(a => a.addEventListener('click', e => { e.preventDefault(); const t = document.getElementById(a.dataset.goto); t.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth' }); t.querySelector('h2')?.setAttribute('tabindex', '-1'); t.querySelector('h2')?.focus({ preventScroll: true }); }));
    return `${nombre(c)} ${c.version} de segunda mano (${c.ano}) | Garaje Centro Bilbao`;
  }

  /* ---------- lightbox ---------- */
  const lightbox = (() => {
    const dlg = document.getElementById('lightbox');
    const im = document.getElementById('lbImg');
    const ct = document.getElementById('lbCount');
    let lista = [], i = 0, nom = '', alCerrar = null;
    const pinta = () => { im.src = lista[i]; im.alt = `${nom}, foto ${i + 1} de ${lista.length}`; ct.textContent = `${i + 1} / ${lista.length}`; };
    const mover = d => { i = (i + d + lista.length) % lista.length; pinta(); };
    document.getElementById('lbPrev').addEventListener('click', () => mover(-1));
    document.getElementById('lbNext').addEventListener('click', () => mover(1));
    document.getElementById('lbClose').addEventListener('click', () => dlg.close());
    dlg.addEventListener('keydown', e => { if (e.key === 'ArrowLeft') mover(-1); if (e.key === 'ArrowRight') mover(1); });
    dlg.addEventListener('click', e => { if (e.target === dlg) dlg.close(); });
    dlg.addEventListener('close', () => { if (alCerrar) alCerrar(i); });
    let x0 = null;
    dlg.addEventListener('touchstart', e => { x0 = e.touches[0].clientX; }, { passive: true });
    dlg.addEventListener('touchend', e => { if (x0 === null) return; const dx = e.changedTouches[0].clientX - x0; if (Math.abs(dx) > 40) mover(dx < 0 ? 1 : -1); x0 = null; });
    return { abrir(l, n, nombreCoche, cb) { lista = l; i = n; nom = nombreCoche; alCerrar = cb; pinta(); dlg.showModal(); } };
  })();

  /* ---------- VENDER / TASAR ---------- */
  function vender(params) {
    const p = new URLSearchParams(params);
    const destino = byId(p.get('para'));
    const anos = Array.from({ length: 2026 - 1995 + 1 }, (_, i) => 2026 - i);
    main.innerHTML = `
    <section class="page-hero"><div class="wrap">
      <small>Vende tu coche</small>
      <h1>Te pagamos tu coche al contado</h1>
      <p>Máxima tasación y transferencia a nuestro nombre en el momento de la compra. Si quieres, lo dejamos como parte del pago de uno de nuestros coches.</p>
    </div></section>
    <div class="section"><div class="wrap sell">
      <div class="form-card">
        ${destino ? `<p class="chip" style="margin-bottom:16px;font-size:14px;padding:8px 12px">Lo entregas como parte del pago del ${esc(nombre(destino))} ${esc(destino.version)}</p>` : ''}
        <ol class="steps" aria-label="Pasos">
          <li data-step-i="0">1. Tu coche</li><li data-step-i="1">2. Detalles</li><li data-step-i="2">3. Tus datos</li>
        </ol>
        <form id="tasar" novalidate>
          <fieldset data-step="0" style="border:0;padding:0;margin:0">
            <legend class="sr">Tu coche</legend>
            <div class="fields">
              <div class="field full"><label for="t-modelo">Marca y modelo *</label><input id="t-modelo" name="modelo" list="t-marcas" required placeholder="Ej.: Seat León 1.6 TDI"><datalist id="t-marcas">${['Audi', 'BMW', 'Citroën', 'Dacia', 'Fiat', 'Ford', 'Honda', 'Hyundai', 'Kia', 'Mazda', 'Mercedes-Benz', 'Nissan', 'Opel', 'Peugeot', 'Renault', 'Seat', 'Skoda', 'Toyota', 'Volkswagen', 'Volvo'].map(m => `<option value="${m}">`).join('')}</datalist></div>
              <div class="field"><label for="t-ano">Año *</label><select id="t-ano" name="ano" required><option value="">Elige el año</option>${anos.map(a => `<option>${a}</option>`).join('')}<option value="anterior a 1995">Anterior a 1995</option></select></div>
              <div class="field"><label for="t-km">Kilómetros *</label><input id="t-km" name="km" inputmode="numeric" required placeholder="Ej.: 120000"></div>
              <div class="field"><label for="t-comb">Combustible *</label><select id="t-comb" name="combustible" required><option value="">Elige</option><option>Diésel</option><option>Gasolina</option><option>Híbrido</option><option>Híbrido enchufable</option><option>Eléctrico</option><option>GLP / GNC</option></select></div>
              <div class="field"><label for="t-cambio">Cambio</label><select id="t-cambio" name="cambio"><option value="">Elige</option><option>Manual</option><option>Automático</option></select></div>
            </div>
          </fieldset>
          <fieldset data-step="1" hidden style="border:0;padding:0;margin:0">
            <legend class="sr">Detalles</legend>
            <div class="fields">
              <div class="field"><label for="t-color">Color</label><input id="t-color" name="color"></div>
              <div class="field"><label for="t-cv">Potencia (CV)</label><input id="t-cv" name="cv" inputmode="numeric"></div>
              <div class="field"><label for="t-puertas">Puertas</label><select id="t-puertas" name="puertas"><option value="">Elige</option><option>2</option><option>3</option><option>4</option><option>5</option></select></div>
              <div class="field"><label for="t-plazas">Plazas</label><select id="t-plazas" name="plazas"><option value="">Elige</option><option>2</option><option>4</option><option>5</option><option>7</option><option>8 o más</option></select></div>
              <div class="field full"><label for="t-com">Comentarios</label><textarea id="t-com" name="comentarios" placeholder="Estado, extras, último mantenimiento, ITV, número de propietarios…"></textarea></div>
            </div>
          </fieldset>
          <fieldset data-step="2" hidden style="border:0;padding:0;margin:0">
            <legend class="sr">Tus datos</legend>
            <div class="fields">
              <div class="field"><label for="t-nombre">Nombre *</label><input id="t-nombre" name="nombre" autocomplete="name" required></div>
              <div class="field"><label for="t-tel">Teléfono *</label><input id="t-tel" name="telefono" type="tel" autocomplete="tel" inputmode="tel" required pattern="[0-9 +]{9,15}"></div>
              <div class="field full"><label class="check"><input type="checkbox" id="t-priv" name="privacidad" required> <span>He leído y acepto la <a class="link" href="https://www.garajecentrobilbao.com/politicaprivacidad" target="_blank" rel="noopener">política de privacidad</a>. *</span></label></div>
            </div>
          </fieldset>
          <div class="form-nav">
            <button type="button" class="btn btn--outline" data-back hidden>Atrás</button>
            <button type="submit" class="btn btn--red" data-next>Continuar</button>
          </div>
          <p class="table-note">* Campos obligatorios. Al terminar se abrirá WhatsApp con los datos y podrás adjuntar las fotos del coche.</p>
        </form>
        <div class="done" id="tasarOk" hidden tabindex="-1">
          ${I.tick}
          <h2>Tasación preparada</h2>
          <p>Se ha abierto WhatsApp con los datos de tu coche. Adjunta unas fotos en el chat y te llamamos con una oferta.</p>
          <div class="btn-row" style="justify-content:center"><a class="btn btn--wa" id="tasarWa" target="_blank" rel="noopener" href="#">${I.wa} Abrir WhatsApp otra vez</a><a class="btn btn--outline" href="${TEL_HREF}">Llamar al ${TEL}</a></div>
        </div>
      </div>
      <aside>
        <div class="aside-card">
          <h2>Cómo funciona</h2>
          <ul class="ticks">
            <li>${I.tick}<span><b>Nos mandas los datos</b> del coche y unas fotos.</span></li>
            <li>${I.tick}<span><b>Te llamamos con una oferta</b> sin compromiso.</span></li>
            <li>${I.tick}<span><b>Lo vemos en Zancoeta 5</b> y cerramos el precio.</span></li>
            <li>${I.tick}<span><b>Cobras en el momento</b> y hacemos la transferencia a nuestro nombre.</span></li>
          </ul>
        </div>
        <div class="aside-card mt-24">
          <h2>¿Lo prefieres por WhatsApp?</h2>
          <p style="margin:8px 0 16px">Mándanos las fotos y los datos del coche directamente.</p>
          <a class="btn btn--wa btn--block" href="${waLink('Hola, quiero tasar mi coche. Os mando los datos y unas fotos:')}" target="_blank" rel="noopener">${I.wa} ${TEL}</a>
        </div>
      </aside>
    </div></div>`;

    const form = document.getElementById('tasar');
    const pasos = [...form.querySelectorAll('[data-step]')];
    const indicadores = [...main.querySelectorAll('[data-step-i]')];
    const back = form.querySelector('[data-back]'), next = form.querySelector('[data-next]');
    let paso = 0;
    const ver = n => {
      paso = n;
      pasos.forEach((f, i) => { f.hidden = i !== n; });
      indicadores.forEach((m, i) => { m.classList.toggle('is-done', i < n); i === n ? m.setAttribute('aria-current', 'step') : m.removeAttribute('aria-current'); });
      back.hidden = n === 0;
      next.innerHTML = n === pasos.length - 1 ? `${I.wa} Enviar por WhatsApp` : 'Continuar';
      next.className = n === pasos.length - 1 ? 'btn btn--wa' : 'btn btn--red';
    };
    const validar = f => {
      let primero = null;
      f.querySelectorAll('[required]').forEach(el => {
        const ok = el.type === 'checkbox' ? el.checked : el.value.trim() !== '' && (!el.pattern || new RegExp(`^${el.pattern}$`).test(el.value.trim()));
        el.setAttribute('aria-invalid', !ok);
        const box = el.closest('.field');
        let err = box.querySelector('.err');
        if (!ok) {
          if (!err) { err = document.createElement('p'); err.className = 'err'; err.id = el.id + '-err'; box.appendChild(err); }
          err.textContent = el.type === 'checkbox' ? 'Tienes que aceptar la política de privacidad.' : el.name === 'telefono' && el.value.trim() ? 'Revisa el teléfono.' : 'Este campo es obligatorio.';
          el.setAttribute('aria-describedby', err.id);
          primero = primero || el;
        } else if (err) { err.remove(); el.removeAttribute('aria-describedby'); }
      });
      if (primero) primero.focus();
      return !primero;
    };
    back.addEventListener('click', () => ver(paso - 1));
    form.addEventListener('submit', e => {
      e.preventDefault();
      if (!validar(pasos[paso])) return;
      if (paso < pasos.length - 1) { ver(paso + 1); pasos[paso].querySelector('input,select,textarea').focus(); return; }
      const v = Object.fromEntries(new FormData(form));
      const lineas = [
        'Hola, quiero tasar mi coche:',
        `• ${v.modelo} (${v.ano}), ${v.km} km, ${v.combustible}${v.cambio ? ', ' + v.cambio : ''}`,
        [v.color && `Color ${v.color}`, v.cv && `${v.cv} CV`, v.puertas && `${v.puertas} puertas`, v.plazas && `${v.plazas} plazas`].filter(Boolean).join(', '),
        v.comentarios && `Comentarios: ${v.comentarios}`,
        destino && `Lo entregaría como parte del pago del ${nombre(destino)} ${destino.version}.`,
        `Me llamo ${v.nombre}, mi teléfono es ${v.telefono}. Ahora os mando las fotos.`,
      ].filter(Boolean).join('\n');
      const url = waLink(lineas);
      document.getElementById('tasarWa').href = url;
      window.open(url, '_blank', 'noopener');
      form.hidden = true; main.querySelector('.steps').hidden = true;
      const ok = document.getElementById('tasarOk'); ok.hidden = false; ok.focus();
    });
    ver(0);
    return 'Vende tu coche: tasación y pago al contado | Garaje Centro Bilbao';
  }

  /* ---------- PARKING ---------- */
  function parking() {
    main.innerHTML = `
    <section class="page-hero"><div class="wrap">
      <small>Parking low cost</small>
      <h1>Parking en el centro de Bilbao, junto a San Mamés</h1>
      <p>Más de 1.000 m² vigilados las 24 horas en Zancoeta 5, al lado del hotel Ibis Budget y a tres minutos de Termibus.</p>
    </div></section>
    <section class="section" aria-labelledby="tar-h">
      <div class="wrap">
        <div class="section__head"><h2 id="tar-h">Tarifas</h2><p>Turismos y furgonetas. IVA incluido.</p></div>
        <div class="prices">
          <div class="price"><small>Por horas</small><b>3 €</b><span>la hora</span></div>
          <div class="price price--hl"><small>Por días</small><b>20 €</b><span>el día</span></div>
          <div class="price"><small>Mensual de lunes a viernes</small><b>110 €</b><span>al mes</span></div>
          <div class="price"><small>Mensual con fin de semana</small><b>135 €</b><span>al mes</span></div>
        </div>
        <div class="btn-row" style="justify-content:center">
          <a class="btn btn--wa" href="${waLink('Hola, quiero reservar plaza en el parking de Zancoeta. Fecha y horas: ')}" target="_blank" rel="noopener">${I.wa} Reservar plaza</a>
          <a class="btn btn--outline" href="${TEL_HREF}">${I.phone} ${TEL}</a>
        </div>
      </div>
    </section>
    <section class="section section--soft" aria-labelledby="pk-h">
      <div class="wrap">
        <div class="section__head"><h2 id="pk-h">Por qué aparcar con nosotros</h2></div>
        <div class="feats">
          <div class="feat">${I.eye}<h3>Vigilado las 24 horas</h3><p>Tu coche siempre a la vista de alguien de casa.</p></div>
          <div class="feat">${I.key}<h3>Con aparcacoches</h3><p>Nosotros aparcamos el coche y te lo entregamos a la salida cuando lo necesites.</p></div>
          <div class="feat">${I.leaf}<h3>Libre de la Zona de Bajas Emisiones</h3><p>Estamos junto a la ZBE: entran todos los vehículos, tengan la etiqueta que tengan.</p></div>
          <div class="feat">${I.ball}<h3>Abierto en los partidos del Athletic</h3><p>Abrimos todos los días de partido, a un paso de San Mamés.</p></div>
          <div class="feat">${I.drop}<h3>Lavado y mecánica básica</h3><p>Mientras está aparcado, te lo dejamos limpio y a punto.</p></div>
          <div class="feat">${I.height}<h3>Altura máxima 2,20 m</h3><p>Caben turismos, monovolúmenes y la mayoría de furgonetas.</p></div>
        </div>
      </div>
    </section>
    <section class="section" aria-labelledby="pkh-h">
      <div class="wrap two">
        <div class="feature__img"><img src="img/web/entrada-parking.jpg" alt="Entrada del parking Garaje Centro en Zancoeta 5" width="900" height="715" loading="lazy"></div>
        <div>
          <h2 id="pkh-h" style="font-size:28px">Horario del parking</h2>
          <dl class="hours"><dt>Lunes a jueves</dt><dd>7:00 a 22:30</dd><dt>Viernes</dt><dd>7:00 a 21:00</dd><dt>Sábados</dt><dd>8:00 a 14:00</dd></dl>
          <p style="margin-top:10px">Sábados por la tarde, domingos y festivos, consúltanos.</p>
          <div class="map-img mt-24"><img src="img/web/mapa-zona.jpg" alt="Plano: Garaje Centro en Zancoeta 5, entre el estadio San Mamés, Termibus y la Zona de Bajas Emisiones" width="912" height="633" loading="lazy"></div>
          <div class="btn-row"><a class="btn btn--red" href="https://www.google.com/maps/place/Parking+Low+Cost+Garaje+Centro+Bilbao/@43.2585241,-2.9472149,17z" target="_blank" rel="noopener">${I.pin} Cómo llegar</a></div>
        </div>
      </div>
    </section>`;
    return 'Parking low cost en el centro de Bilbao, junto a San Mamés | Garaje Centro';
  }

  /* ---------- TALLER ---------- */
  function taller() {
    const t = [['Hora de mano de obra', '35 €'], ['Cambio de aceite', 'desde 45 €'], ['Cambio de aceite y filtros', 'desde 55 €'], ['Pinchazo', '18 €'], ['Carga de batería', '15 €'], ['Cambio de batería y colocación', 'desde 60 €'], ['Discos, pastillas, kit de distribución y correas auxiliares', 'Consúltanos']];
    main.innerHTML = `
    <section class="page-hero"><div class="wrap">
      <small>Taller</small>
      <h1>Mecánica básica y carrocería a precio de barrio</h1>
      <p>Es el mismo taller donde preparamos nuestros coches de ocasión: equipamiento al día y mecánicos con muchos años de oficio.</p>
    </div></section>
    <section class="section" aria-labelledby="tt-h">
      <div class="wrap two">
        <div>
          <h2 id="tt-h" style="font-size:28px;margin-bottom:16px">Nuestras tarifas</h2>
          <table class="table"><caption class="sr">Tarifas del taller, IVA no incluido</caption><tbody>${t.map(r => `<tr><th scope="row">${r[0]}</th><td>${r[1]}</td></tr>`).join('')}</tbody></table>
          <p class="table-note">IVA no incluido.</p>
        </div>
        <div class="aside-card">
          <h2>Pide cita</h2>
          <p style="margin-top:8px">Dinos qué le pasa al coche y te damos hora. Si lo tienes en nuestro parking, lo revisamos mientras está aparcado.</p>
          <div class="btn-row">
            <a class="btn btn--wa" href="${waLink('Hola, quiero pedir cita en el taller. Coche y lo que necesita: ')}" target="_blank" rel="noopener">${I.wa} Pedir cita</a>
            <a class="btn btn--outline" href="${TEL_HREF}">${I.phone} ${TEL}</a>
          </div>
          <dl class="hours"><dt>Lunes a jueves</dt><dd>7:00 a 22:30</dd><dt>Viernes</dt><dd>7:00 a 21:00</dd><dt>Sábados</dt><dd>8:00 a 14:00</dd></dl>
        </div>
      </div>
    </section>`;
    return 'Taller de mecánica básica en Bilbao: tarifas | Garaje Centro';
  }

  /* ---------- CONTACTO ---------- */
  function contacto() {
    main.innerHTML = `
    <section class="page-hero"><div class="wrap">
      <small>Dónde estamos</small>
      <h1>Zancoeta 5, en el centro de Bilbao</h1>
      <p>Junto al hotel Ibis Budget, a tres minutos de Termibus y del estadio San Mamés. Ven a ver los coches cuando quieras dentro del horario.</p>
    </div></section>
    <section class="section">
      <div class="wrap two">
        <div>
          <h2 style="font-size:28px">Contacto</h2>
          <ul class="contact-list">
            <li>${I.pin}<span>Zancoeta, 5<br>Bilbao (Bizkaia)</span></li>
            <li>${I.phone}<span><a href="${TEL_HREF}">${TEL}</a><br>También por WhatsApp</span></li>
            <li>${I.mail}<span><a href="mailto:info@garajecentrobilbao.com">info@garajecentrobilbao.com</a></span></li>
            <li>${I.clock}<span><dl class="hours" style="margin:0"><dt>Lunes a jueves</dt><dd>7:00 a 22:30</dd><dt>Viernes</dt><dd>7:00 a 21:00</dd><dt>Sábados</dt><dd>8:00 a 14:00</dd></dl><small style="display:block;margin-top:6px;color:var(--muted)">Sábados por la tarde, domingos y festivos, consúltanos.</small></span></li>
          </ul>
          <div class="btn-row">
            <a class="btn btn--red" href="https://www.google.com/maps/place/Garaje+Centro/@43.2584302,-2.9472105,17z" target="_blank" rel="noopener">${I.pin} Cómo llegar</a>
            <a class="btn btn--wa" href="${waLink('Hola, ')}" target="_blank" rel="noopener">${I.wa} WhatsApp</a>
          </div>
        </div>
        <div>
          <div class="map-img"><img src="img/web/mapa-zona.jpg" alt="Plano: Garaje Centro en Zancoeta 5, entre el estadio San Mamés, Termibus y la Zona de Bajas Emisiones" width="912" height="633" loading="lazy"></div>
          <div class="feature__img mt-24"><img src="img/web/entrada-parking.jpg" alt="Fachada de Garaje Centro en Zancoeta 5" width="900" height="715" loading="lazy"></div>
        </div>
      </div>
    </section>`;
    return 'Dónde estamos: Zancoeta 5, Bilbao | Garaje Centro';
  }

  /* ---------- pie con enlaces de búsqueda ---------- */
  function pie() {
    const l = (titulo, items) => `<div><h2>${titulo}</h2><ul>${items.map(i => `<li><a href="${i[1]}">${esc(i[0])}</a></li>`).join('')}</ul></div>`;
    document.getElementById('footerSeo').innerHTML =
      l('Coches de segunda mano por marca', marcas.map(x => [`${x.m} de ocasión`, `#/coches?marca=${encodeURIComponent(x.m)}`])) +
      l('Por tipo de carrocería', Object.entries(CARROCERIAS).map(([k, v]) => [v.label, `#/coches?carroceria=${k}`])) +
      l('Otros coches de ocasión', [['Diésel', '#/coches?combustible=Diésel'], ['Gasolina', '#/coches?combustible=Gasolina'], ['Híbridos', '#/coches?combustible=Híbrido'], ['Automáticos', '#/coches?cambio=Automático'], ['7 plazas', '#/coches?plazas=7'], ['IVA deducible', '#/coches?iva=1'], ['Bajada de precio', '#/coches?rebaja=1']]);
  }

  /* ---------- menú móvil ---------- */
  const burger = document.getElementById('burger');
  const nav = document.getElementById('nav');
  const cerrarMenu = () => { nav.classList.remove('is-open'); burger.setAttribute('aria-expanded', 'false'); burger.setAttribute('aria-label', 'Abrir menú'); };
  burger.addEventListener('click', () => {
    const o = !nav.classList.contains('is-open');
    nav.classList.toggle('is-open', o);
    burger.setAttribute('aria-expanded', o);
    burger.setAttribute('aria-label', o ? 'Cerrar menú' : 'Abrir menú');
  });
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && nav.classList.contains('is-open')) { cerrarMenu(); burger.focus(); } });

  /* ---------- rutas ---------- */
  let primera = true;
  function router() {
    clearInterval(heroTimer); heroTimer = null;
    const h = location.hash.replace(/^#\/?/, '');
    const [ruta, qs = ''] = h.split('?');
    const [seccion, arg] = ruta.split('/');
    let t;
    switch (seccion) {
      case '': t = home(); break;
      case 'coches': t = listado(qs); break;
      case 'coche': t = ficha(decodeURIComponent(arg || '')); break;
      case 'vender': t = vender(qs); break;
      case 'parking': t = parking(); break;
      case 'taller': t = taller(); break;
      case 'contacto': t = contacto(); break;
      default: location.replace('#/'); return;
    }
    if (!t) return;
    document.title = t;
    const activo = seccion === 'coche' ? 'coches' : seccion;
    document.querySelectorAll('[data-nav]').forEach(a => a.dataset.nav === activo ? a.setAttribute('aria-current', 'page') : a.removeAttribute('aria-current'));
    cerrarMenu();
    window.scrollTo(0, 0);
    if (!primera) main.focus({ preventScroll: true });
    primera = false;
  }
  window.addEventListener('hashchange', router);
  pie();
  pintarFavCount();
  router();
})();
