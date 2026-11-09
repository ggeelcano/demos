/* Informática PC-RAM · tienda online (catálogo real de informaticapcram.com) */
(() => {
  'use strict';

  // ---------- Utilidades ----------
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const norm = s => String(s).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  const eur = v => v.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €';
  const icon = (id, cls = '') => `<svg class="icon ${cls}" aria-hidden="true" focusable="false"><use href="#i-${id}"/></svg>`;
  const WA = '34622277878';
  const waLink = t => `https://wa.me/${WA}?text=${encodeURIComponent(t)}`;
  const SHIP = 5.95;
  const PER_PAGE = 24;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const view = $('#view');

  const ORDER = ['23', '26', '136', '25', '24', '57', '66', '113', '27', '31', '34', '39', '168', '40', '44', '80', '35', '74', '104', '37', '118', '120', '71', '138', '181', '182', '119'];
  const SHORT = { '23': 'Portátiles', '26': 'Tablets', '136': 'Telefonía', '25': 'Monitores', '27': 'Ratones', '31': 'Teclados', '40': 'Sonido', '44': 'Almacenamiento', '80': 'Tintas y tóner', '35': 'Impresoras', '74': 'Redes y wifi', '104': 'Cables', '57': 'Componentes', '66': 'Refrigeración', '113': 'Alimentación', '168': 'Hubs USB' };
  const NAV = ['23', '26', '80', '27', '31', '40', '44', '74', '104', '57', '136'];
  const SYN = {
    raton: ['mouse'], mouse: ['raton'], ratones: ['raton', 'mouse'], pendrive: ['pen drive', 'memoria usb', 'lapiz de memoria'], pen: ['pen', 'memoria usb'],
    cascos: ['auricular'], auriculares: ['auricular'], tinta: ['cartucho', 'tinta'], cartucho: ['tinta', 'cartucho'], cartuchos: ['cartucho', 'tinta'],
    cargador: ['alimentador', 'cargador'], portatil: ['notebook', 'netbook', 'portatil'], portatiles: ['portatil', 'notebook'], wifi: ['wireless', 'inalambric', 'wifi'],
    movil: ['smartphone', 'telefono', 'movil'], ssd: ['solido', 'ssd'], impresora: ['multifuncion', 'impresora'], altavoz: ['altavoces'], teclados: ['teclado'],
    pantalla: ['monitor', 'pantalla'], monitor: ['pantalla', 'monitor'], funda: ['funda', 'carcasa'], toner: ['toner'], hdmi: ['hdmi'], usbc: ['usb-c', 'tipo c', 'type-c'], 'usb-c': ['tipo c', 'type-c', 'usbc']
  };

  let CATS = [], CAT = {}, CATSLUG = {}, P = [], PID = {}, NEW = new Set(), DESC = null, descLoading = null;
  let carTimer = null;
  const state = { inkBrand: '', inkQ: '', filtersOpen: false, focusId: null, lastPath: null, justAdded: null };

  // ---------- Cesta ----------
  const KEY = 'pcram_cesta_v1';
  let cart = [];
  try { cart = JSON.parse(localStorage.getItem(KEY) || '[]').filter(i => i && i.id && i.q > 0); } catch (e) { cart = []; }
  const saveCart = () => { try { localStorage.setItem(KEY, JSON.stringify(cart)); } catch (e) { } };
  const cartItems = () => cart.map(i => ({ ...i, p: PID[i.id] })).filter(i => i.p);
  const cartCount = () => cartItems().reduce((a, i) => a + i.q, 0);
  const cartSub = () => cartItems().reduce((a, i) => a + i.q * i.p.p, 0);
  const maxQ = p => Math.max(1, Math.min(p.s, 99));

  function addToCart(id, q = 1) {
    const p = PID[id]; if (!p || p.s <= 0) return;
    const it = cart.find(i => i.id === id);
    if (it) it.q = Math.min(it.q + q, maxQ(p)); else cart.push({ id, q: Math.min(q, maxQ(p)) });
    saveCart(); state.justAdded = id; updateCartUI(); openCart();
    announce(`Añadido a la cesta: ${p.n}`);
  }
  function setQty(id, q) {
    const p = PID[id]; const it = cart.find(i => i.id === id); if (!it || !p) return;
    it.q = Math.max(1, Math.min(q, maxQ(p)));
    saveCart(); updateCartUI();
  }
  function removeItem(id) { cart = cart.filter(i => i.id !== id); saveCart(); updateCartUI(); }

  function updateCartUI() {
    const n = cartCount(), sub = cartSub();
    const b = $('#cartCount'); b.textContent = n; b.dataset.n = n;
    $('#cartTotal').textContent = eur(sub);
    $('#btnCart').setAttribute('aria-label', n ? `Cesta: ${n} ${n === 1 ? 'producto' : 'productos'}, ${eur(sub)}` : 'Cesta vacía');
    renderCartDrawer();
    const r = parseHash();
    if (r.path === '/cesta' || r.path === '/pedido') { const keep = document.activeElement && document.activeElement.id; render(true); if (keep) { const el = document.getElementById(keep); if (el) el.focus(); } }
  }

  function qtyCtrl(i, small) {
    return `<div class="qty" role="group" aria-label="Cantidad de ${esc(i.p.n)}">
      <button type="button" data-qd="${i.id}" data-d="-1" aria-label="Quitar una unidad" ${i.q <= 1 ? 'disabled' : ''}>${icon('minus')}</button>
      <input type="number" inputmode="numeric" min="1" max="${maxQ(i.p)}" value="${i.q}" data-qin="${i.id}" id="q${small ? 'd' : 'c'}${i.id}" aria-label="Unidades">
      <button type="button" data-qd="${i.id}" data-d="1" aria-label="Añadir una unidad" ${i.q >= maxQ(i.p) ? 'disabled' : ''}>${icon('plus')}</button></div>`;
  }

  function renderCartDrawer() {
    const items = cartItems(), body = $('#cartDrawerBody'), foot = $('#cartDrawerFoot');
    if (!items.length) {
      body.innerHTML = `<div class="empty" style="box-shadow:none"><h2>Tu cesta está vacía</h2><p>Busca lo que necesitas entre más de 1.000 productos.</p><button class="btn btn-primary" type="button" data-close>Seguir comprando</button></div>`;
      foot.innerHTML = ''; foot.hidden = true; return;
    }
    foot.hidden = false;
    const added = state.justAdded && PID[state.justAdded];
    body.innerHTML = (added ? `<div class="added">${icon('check')}Producto añadido a tu cesta</div>` : '') + items.map(i => `
      <div class="ci-mini"><img src="img/p/${i.id}.jpg" alt="${esc(i.p.n)}" width="64" height="64" loading="lazy">
        <div><a class="n" href="${purl(i.p)}">${esc(i.p.n)}</a>
          <div class="row">${qtyCtrl(i, true)}<b>${eur(i.q * i.p.p)}</b></div>
          <button class="del" type="button" data-del="${i.id}">${icon('trash')}Eliminar<span class="sr-only"> ${esc(i.p.n)}</span></button>
        </div></div>`).join('');
    foot.innerHTML = `<div class="sum-row total" style="margin:0;border:0;padding:0"><span>Subtotal</span><span>${eur(cartSub())}</span></div>
      <p class="sum-note" style="margin:0">Recogida gratis en tienda o envío a península en 3-5 días.</p>
      <a class="btn btn-primary btn-lg btn-block" href="#/pedido">Tramitar pedido</a>
      <a class="btn btn-outline btn-block" href="#/cesta">Ver la cesta</a>`;
  }

  // ---------- Cajones (categorías y cesta) ----------
  let lastTrigger = null;
  function openDrawer(id, trigger) {
    closeDrawers(true);
    const d = document.getElementById(id); if (!d) return;
    lastTrigger = trigger || document.activeElement;
    d.hidden = false; $('#backdrop').hidden = false;
    document.body.style.overflow = 'hidden';
    ['header', 'main', 'footer'].forEach(s => { const el = $(s); if (el) el.inert = true; });
    $$('[aria-controls="' + id + '"]').forEach(b => b.setAttribute('aria-expanded', 'true'));
    const f = d.querySelector('[data-close]'); if (f) f.focus();
  }
  function closeDrawers(silent) {
    let was = false;
    $$('.drawer').forEach(d => { if (!d.hidden) { was = true; d.hidden = true; $$('[aria-controls="' + d.id + '"]').forEach(b => b.setAttribute('aria-expanded', 'false')); } });
    const fl = $('#filters'); if (fl && fl.classList.contains('open')) { fl.classList.remove('open'); was = true; state.filtersOpen = false; }
    $('#backdrop').hidden = true; document.body.style.overflow = '';
    ['header', 'main', 'footer'].forEach(s => { const el = $(s); if (el) el.inert = false; });
    if (was && !silent && lastTrigger && document.contains(lastTrigger)) lastTrigger.focus();
    state.justAdded = null;
  }
  const openCart = () => { renderCartDrawer(); openDrawer('cartDrawer', $('#btnCart')); };

  function renderCatDrawer(path) {
    const b = $('#catDrawerBody');
    if (!path) {
      b.innerHTML = `<ul class="dlist">${ORDER.filter(k => CAT[k]).map(k => { const c = CAT[k]; return `<li>${c.children.length
        ? `<button type="button" data-drill="${k}">${icon(c.icon || 'box')}${esc(c.name)}${icon('right', 'chev')}</button>`
        : `<a href="${curl(c)}">${icon(c.icon || 'box')}${esc(c.name)}<small>${c.count}</small></a>`}</li>`; }).join('')}</ul>
        <div class="drawer-extra"><ul class="dlist">
          <li><a href="#/novedades">${icon('bolt')}Novedades</a></li>
          <li><a href="#/servicios">${icon('wrench')}Servicio técnico</a></li>
          <li><a href="#/ayuda">${icon('truck')}Envíos y devoluciones</a></li>
          <li><a href="https://wa.me/${WA}" target="_blank" rel="noopener">${icon('wa')}WhatsApp 622 27 78 78</a></li>
        </ul></div>`;
      $('#catDrawerTitle').textContent = 'Categorías';
    } else {
      const c = CAT[path];
      b.innerHTML = `<button class="dback" type="button" data-drill="${c.parent || ''}">${icon('left')}${c.parent ? esc(CAT[c.parent].name) : 'Todas las categorías'}</button>
        <div class="dsub-title">${esc(c.name)}</div>
        <ul class="dlist"><li><a class="all" href="${curl(c)}">Ver todo <small>${c.count}</small></a></li>${c.children.map(k => { const s = CAT[k]; return `<li>${s.children.length
          ? `<button type="button" data-drill="${k}">${esc(s.name)}<small>${s.count}</small>${icon('right', 'chev')}</button>`
          : `<a href="${curl(s)}">${esc(s.name)}<small>${s.count}</small></a>`}</li>`; }).join('')}</ul>`;
      $('#catDrawerTitle').textContent = c.name;
    }
  }

  // ---------- Toast ----------
  let toastT = null;
  function announce(msg) { const l = $('#live'); l.textContent = ''; setTimeout(() => { l.textContent = msg; }, 50); }
  function toast(msg) { const t = $('#toast'); t.textContent = msg; t.classList.add('show'); clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('show'), 2600); }

  // ---------- URLs ----------
  const purl = p => `#/p/${p.id}/${p.k}`;
  const curl = c => `#/c/${c.slug}`;
  const dec = s => { try { return decodeURIComponent(s); } catch (e) { return s; } };
  function parseHash() {
    const h = location.hash.slice(1) || '/';
    const i = h.indexOf('?');
    return { path: i < 0 ? h : h.slice(0, i), q: new URLSearchParams(i < 0 ? '' : h.slice(i + 1)) };
  }
  function go(path, params) {
    const qs = params ? params.toString() : '';
    location.hash = '#' + path + (qs ? '?' + qs : '');
  }
  const inCat = (p, path) => p.c === path || p.c.startsWith(path + '_');
  const trail = path => { const out = []; let c = CAT[path]; while (c) { out.unshift(c); c = c.parent ? CAT[c.parent] : null; } return out; };

  // ---------- Piezas de interfaz ----------
  function priceHtml(v) {
    const [e, c] = v.toFixed(2).split('.');
    return `<div class="price"><span class="sr-only">${eur(v)}</span><span class="e" aria-hidden="true">${(+e).toLocaleString('es-ES')}</span><span class="c" aria-hidden="true">,${c} €</span></div>`;
  }
  function stockHtml(p, long) {
    if (p.s >= 2) return `<span class="stock ok">${long ? `En stock: ${p.s} unidades en tienda` : 'En stock'}</span>`;
    if (p.s === 1) return `<span class="stock low">${long ? 'Última unidad en tienda' : 'Última unidad'}</span>`;
    return `<span class="stock no">${long ? 'Sin stock ahora mismo: pregúntanos el plazo' : 'Sin stock ahora'}</span>`;
  }
  function card(p) {
    return `<article class="card">
      <div class="card-img"><img src="img/p/${p.id}.jpg" alt="${esc(p.n)}" loading="lazy" decoding="async" width="400" height="400">${NEW.has(p.id) ? '<span class="tag tag-new">Novedad</span>' : ''}</div>
      <div class="card-body">
        ${p.b ? `<span class="card-brand">${esc(p.b)}</span>` : '<span class="card-brand" aria-hidden="true">&nbsp;</span>'}
        <h3 class="card-title"><a href="${purl(p)}">${esc(p.n)}</a></h3>
        ${priceHtml(p.p)}${stockHtml(p)}
        ${p.s > 0
        ? `<button class="btn btn-primary" type="button" data-add="${p.id}">${icon('cart')}Añadir<span class="sr-only"> a la cesta: ${esc(p.n)}</span></button>`
        : `<a class="btn btn-outline" href="${waLink(`Hola, ¿cuándo tendréis «${p.n}» (código ${p.id})?`)}" target="_blank" rel="noopener">Consultar<span class="sr-only"> disponibilidad de ${esc(p.n)} por WhatsApp</span></a>`}
      </div></article>`;
  }
  function rail(id, title, items, more, moreText) {
    if (!items.length) return '';
    return `<section class="sec rail" aria-labelledby="${id}-h">
      <div class="sec-h"><h2 id="${id}-h">${title}</h2><div style="display:flex;gap:14px;align-items:center">${more ? `<a href="${more}">${moreText || 'Ver todo'}</a>` : ''}
        <div class="rail-nav"><button type="button" data-rail="${id}" data-dir="-1" aria-label="Ver anteriores">${icon('left')}</button><button type="button" data-rail="${id}" data-dir="1" aria-label="Ver siguientes">${icon('right')}</button></div></div></div>
      <div class="rail-track" id="${id}">${items.map(card).join('')}</div></section>`;
  }
  function crumbs(list) {
    return `<nav aria-label="Estás en"><ol class="crumbs"><li><a href="#/">Inicio</a></li>${list.map((c, i) => `<li>${i === list.length - 1 ? `<span aria-current="page">${esc(c.name)}</span>` : `<a href="${c.href}">${esc(c.name)}</a>`}</li>`).join('')}</ol></nav>`;
  }
  const payChips = () => `<div class="pay-chips" aria-label="Formas de pago"><span class="pay visa">VISA</span><span class="pay mc"><i></i><i></i>Mastercard</span><span class="pay bizum">bizum</span><span class="pay paypal">Pay<em>Pal</em></span><span class="pay apple">Apple Pay</span><span class="pay gpay">Google Pay</span></div>`;

  // ---------- Buscador ----------
  function search(q) {
    const toks = norm(q).replace(/[^a-z0-9ñ\-\/\.\s+]/g, ' ').split(/\s+/).filter(Boolean);
    if (!toks.length) return [];
    const alts = toks.map(t => {
      const a = new Set([t, ...(SYN[t] || [])]);
      const c = t.replace(/[-\/\.]/g, ''); if (c && c !== t) a.add(c);
      if (t.length > 4 && t.endsWith('es')) a.add(t.slice(0, -2));
      if (t.length > 3 && t.endsWith('s')) a.add(t.slice(0, -1));
      return [...a];
    });
    const out = [];
    for (const p of P) {
      let score = 0, ok = true;
      for (const al of alts) {
        let best = 0;
        for (const a of al) {
          if (p.nn.includes(' ' + a)) best = Math.max(best, 3);
          else if (p.nn.includes(a)) best = Math.max(best, 2);
          else if (p.h.includes(a)) best = Math.max(best, 1);
        }
        if (!best) { ok = false; break; }
        score += best;
      }
      if (!ok) continue;
      if (p.s > 0) score += 2;
      if (p.nn.startsWith(' ' + toks[0])) score += 2;
      out.push([score, p]);
    }
    out.sort((a, b) => b[0] - a[0] || b[1].id - a[1].id);
    return out.map(x => x[1]);
  }
  function highlight(name, q) {
    const nn = norm(name); const toks = norm(q).split(/\s+/).filter(t => t.length > 1);
    const marks = new Array(name.length).fill(false);
    if (nn.length === name.length) for (const t of toks) { let i = nn.indexOf(t); while (i >= 0) { for (let k = i; k < i + t.length; k++) marks[k] = true; i = nn.indexOf(t, i + 1); } }
    let out = '', open = false;
    for (let i = 0; i < name.length; i++) { if (marks[i] && !open) { out += '<mark>'; open = true; } if (!marks[i] && open) { out += '</mark>'; open = false; } out += esc(name[i]); }
    return out + (open ? '</mark>' : '');
  }

  function setupSearch() {
    const form = $('#searchForm'), input = $('#q'), box = $('#sugg');
    let active = -1, timer = null;
    const opts = () => $$('[role=option]', box);
    const close = () => { box.hidden = true; input.setAttribute('aria-expanded', 'false'); input.removeAttribute('aria-activedescendant'); active = -1; };
    const setActive = i => {
      const o = opts(); if (!o.length) return;
      active = (i + o.length) % o.length;
      o.forEach((el, k) => el.setAttribute('aria-selected', k === active ? 'true' : 'false'));
      input.setAttribute('aria-activedescendant', o[active].id); o[active].scrollIntoView({ block: 'nearest' });
    };
    const show = () => {
      const q = input.value.trim();
      if (q.length < 2) { close(); return; }
      const res = search(q), nq = norm(q);
      const cats = CATS.filter(c => norm(c.name).includes(nq)).slice(0, 3);
      let h = '', n = 0;
      if (cats.length) h += `<div class="sugg-h">Categorías</div>` + cats.map(c => `<a class="sugg-opt" role="option" id="sg${n++}" href="${curl(c)}" aria-selected="false"><span class="t sugg-cat">${icon(CAT[c.path.split('_')[0]].icon || 'box')}${highlight(c.name, q)}${c.parent ? ` <small style="color:var(--texto-3)">en ${esc(CAT[c.parent].name)}</small>` : ''}</span></a>`).join('');
      if (res.length) h += `<div class="sugg-h">Productos</div>` + res.slice(0, 6).map(p => `<a class="sugg-opt" role="option" id="sg${n++}" href="${purl(p)}" aria-selected="false"><img src="img/p/${p.id}.jpg" alt="" width="48" height="48"><span class="t">${highlight(p.n, q)}</span><span class="p">${eur(p.p)}</span></a>`).join('');
      if (!cats.length && !res.length) h = `<div class="sugg-empty">No encontramos «${esc(q)}». Prueba con otra palabra o <a href="${waLink(`Hola, busco: ${q}`)}" target="_blank" rel="noopener">pregúntanos por WhatsApp</a>.</div>`;
      else if (res.length) h += `<a class="sugg-all" href="#/buscar/${encodeURIComponent(q)}">Ver los ${res.length} resultados de «${esc(q)}»</a>`;
      box.innerHTML = h; box.hidden = false; input.setAttribute('aria-expanded', 'true'); active = -1;
    };
    input.addEventListener('input', () => { clearTimeout(timer); timer = setTimeout(show, 90); });
    input.addEventListener('focus', () => { if (input.value.trim().length >= 2) show(); });
    input.addEventListener('keydown', e => {
      if (e.key === 'ArrowDown') { e.preventDefault(); if (box.hidden) show(); setActive(active + 1); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); setActive(active - 1); }
      else if (e.key === 'Escape') { if (!box.hidden) { e.preventDefault(); close(); } }
      else if (e.key === 'Enter' && active >= 0) { e.preventDefault(); const o = opts()[active]; close(); location.hash = o.getAttribute('href'); input.blur(); }
    });
    form.addEventListener('submit', e => {
      e.preventDefault(); const q = input.value.trim(); if (!q) return;
      close(); input.blur(); go('/buscar/' + encodeURIComponent(q));
    });
    box.addEventListener('click', e => { if (e.target.closest('a')) { close(); input.blur(); } });
    document.addEventListener('click', e => { if (!form.contains(e.target)) close(); });
    form.addEventListener('focusout', () => setTimeout(() => { if (!form.contains(document.activeElement)) close(); }, 120));
  }

  // ---------- Portada ----------
  function home() {
    const stockP = P.filter(p => p.s > 0);
    const byNew = [...stockP].sort((a, b) => b.id - a.id);
    const firstIn = path => byNew.find(p => inCat(p, path));
    const gaming = byNew.filter(p => /gaming/i.test(p.n));
    const gamingMin = Math.min(...gaming.filter(p => ['27', '31', '40'].includes(p.c.split('_')[0])).map(p => p.p));
    const tabs = [3607, 3601, 3427].map(i => PID[i]).filter(Boolean);
    const inkImgs = [firstIn('80_81_84'), firstIn('80_81_85'), firstIn('80_81_83')].filter(Boolean);
    const slides = [
      { cls: 's-tablets', kicker: 'Recién llegadas', h: 'Tablets para estudiar, trabajar y ver series', p: 'TCL, Samsung y Xiaomi con pantalla de 11" y 128 GB. Recógela en tienda o te la enviamos a casa.', desde: tabs.length ? Math.min(...tabs.map(p => p.p)) : null, cta: 'Ver tablets', href: CAT['26_146'] ? curl(CAT['26_146']) : curl(CAT['26']), imgs: tabs },
      { cls: 's-tinta', kicker: 'Tintas y tóner', h: '¿Se te ha acabado la tinta? La tenemos', p: `Más de ${Math.floor(CAT['80'].count / 10) * 10} cartuchos y tóner de HP, Epson, Brother, Canon y Lexmark, originales y compatibles.`, cta: 'Buscar mi cartucho', action: 'ink', imgs: inkImgs },
      { cls: 's-gaming', kicker: 'Zona gaming', h: 'Ratones, teclados y auriculares con RGB', p: 'Mars Gaming, Phoenix, Krom, Hiditec y más, con stock en nuestra tienda.', desde: isFinite(gamingMin) ? gamingMin : null, cta: 'Ver zona gaming', href: '#/buscar/gaming', imgs: [3593, 3578, 3606].map(i => PID[i]).filter(Boolean) }
    ];
    const mon = PID[3602];
    const port = firstIn('23_124'), cable = PID[3389] || firstIn('104_183');
    const under10 = (() => { const seen = new Set(), out = []; for (const p of byNew) { if (p.p < 10 && !seen.has(p.c)) { seen.add(p.c); out.push(p); } if (out.length >= 16) break; } return out; })();
    const brandCount = {}; P.forEach(p => { if (p.b) brandCount[p.b] = (brandCount[p.b] || 0) + 1; });
    const topBrands = Object.entries(brandCount).sort((a, b) => b[1] - a[1]).slice(0, 20).map(e => e[0]);
    const tiles = ['23', '26', '136', '25', '27', '31', '40', '44', '80', '35', '74', '104', '57', '66', '113', '168'].filter(k => CAT[k]);

    view.innerHTML = `
      <h1 class="sr-only">Informática PC-RAM, tienda de informática en Salobreña</h1>
      <div class="hero">
        <section class="carousel" aria-roledescription="carrusel" aria-label="Destacados">
          <div class="slides">${slides.map((s, i) => `
            <div class="slide ${s.cls}${i === 0 ? ' on' : ''}" role="group" aria-roledescription="diapositiva" aria-label="${i + 1} de ${slides.length}"${i ? ' aria-hidden="true"' : ''}>
              <div>
                <span class="kicker">${s.kicker}</span>
                <h2>${esc(s.h)}</h2>
                <p>${esc(s.p)}</p>
                ${s.desde ? `<div class="desde">Desde <b>${eur(s.desde)}</b></div>` : ''}
                ${s.action ? `<button class="btn btn-light btn-lg" type="button" data-go-ink>${s.cta}${icon('right')}</button>` : `<a class="btn btn-light btn-lg" href="${s.href}">${s.cta}${icon('right')}</a>`}
              </div>
              <div class="slide-imgs" aria-hidden="true">${s.imgs.map(p => `<img src="img/p/${p.id}.jpg" alt="" width="400" height="400"${i ? ' loading="lazy"' : ''}>`).join('')}</div>
            </div>`).join('')}
          </div>
          <div class="car-ctrl">
            <button class="car-btn" type="button" data-car="toggle" aria-label="Pausar el carrusel">${icon('pause')}</button>
            ${slides.map((s, i) => `<button class="car-dot" type="button" data-car="${i}" aria-label="Ver diapositiva ${i + 1}: ${esc(s.kicker)}" aria-current="${i === 0}"></button>`).join('')}
          </div>
        </section>
        <div class="hero-side">
          ${mon ? `<a class="tile" href="${purl(mon)}"><div><span class="kicker">Monitores</span><h3>MSI Pro MP251 de 24,5" a 144 Hz</h3><p>Full HD, panel IPS y altavoces integrados.</p><div class="tile-price">${eur(mon.p)}</div></div><img src="img/p/${mon.id}.jpg" alt="${esc(mon.n)}" width="400" height="400"></a>` : ''}
          <a class="tile tile-st" href="#/servicios"><div><span class="kicker">Servicio técnico</span><h3>Reparamos tu ordenador o portátil</h3><p>Lo revisamos en nuestra tienda de Salobreña. Pide presupuesto por WhatsApp.</p><span class="fake-link">Pedir presupuesto${icon('right')}</span></div><span class="tile-ico" aria-hidden="true">${icon('wrench')}</span></a>
        </div>
      </div>

      <section class="perks" aria-label="Ventajas de comprar en PC-RAM">
        <div class="perk"><span class="ico">${icon('store')}</span><div><b>Recogida gratis en tienda</b><span>Av. Mediterráneo 16, Salobreña</span></div></div>
        <div class="perk"><span class="ico">${icon('truck')}</span><div><b>Envío a península</b><span>En 3-5 días desde el pago</span></div></div>
        <div class="perk"><span class="ico">${icon('card')}</span><div><b>Pago seguro</b><span>Tarjeta, Bizum, PayPal, Apple Pay y Google Pay</span></div></div>
        <div class="perk"><span class="ico">${icon('wa')}</span><div><b>Te asesoramos</b><span>Por WhatsApp en el 622 27 78 78</span></div></div>
      </section>

      <section class="sec" aria-labelledby="cats-h">
        <div class="sec-h"><h2 id="cats-h">Compra por categoría</h2><button class="link-btn" type="button" data-open-cats>Ver todas</button></div>
        <div class="cat-grid">${tiles.map(k => { const c = CAT[k]; return `<a class="cat-tile" href="${curl(c)}"><span class="ico">${icon(c.icon || 'box')}</span>${esc(SHORT[k] || c.name)}<small>${c.count} productos</small></a>`; }).join('')}</div>
      </section>

      ${rail('r-new', 'Novedades', byNew.slice(0, 16), '#/novedades', 'Ver todas')}

      <section class="sec panel inkfinder" id="inkfinder" aria-labelledby="ink-h">
        <div class="ink-side">
          <h2 id="ink-h">Encuentra el cartucho de tu impresora</h2>
          <p>Elige la marca y escribe el modelo de tu impresora o del cartucho que se te ha acabado.</p>
          <div class="ink-brands" role="group" aria-label="Marca">${['', 'HP', 'Epson', 'Brother', 'Canon', 'Lexmark'].map(b => `<button class="chip" type="button" data-ink="${b}" aria-pressed="${state.inkBrand === b}">${b || 'Todas'}</button>`).join('')}</div>
          <label for="inkq">Modelo de impresora o cartucho</label>
          <input id="inkq" type="search" placeholder="Ej.: 304, T0715, LC985, PG-560" value="${esc(state.inkQ)}" autocomplete="off">
        </div>
        <div class="ink-main"><div class="grid" id="inkres"></div>
          <div class="ink-foot"><span class="ink-count" id="inkcount" aria-live="polite"></span><a class="btn btn-outline" id="inkall" href="${curl(CAT['80'])}">Ver todas las tintas y tóner</a></div></div>
      </section>

      ${rail('r-gaming', 'Zona gaming', gaming.slice(0, 16), '#/buscar/gaming', 'Ver todo gaming')}

      <section class="sec duo" aria-label="Destacamos">
        ${port ? `<a class="banner b-port" href="${curl(CAT['23'])}"><div><h3>Todo para tu portátil</h3><p>Cargadores, fundas, maletines, mochilas y bases refrigeradoras.</p><span class="fake-link">Ver accesorios${icon('right')}</span></div><img src="img/p/${port.id}.jpg" alt="${esc(port.n)}" width="400" height="400" loading="lazy"></a>` : ''}
        ${cable ? `<a class="banner b-cable" href="${curl(CAT['104'])}"><div><h3>El cable que buscas, lo tenemos</h3><p>Más de ${Math.floor(CAT['104'].count / 10) * 10} cables y adaptadores: HDMI, USB-C, red, VGA, audio…</p><span class="fake-link">Ver cables${icon('right')}</span></div><img src="img/p/${cable.id}.jpg" alt="${esc(cable.n)}" width="400" height="400" loading="lazy"></a>` : ''}
      </section>

      ${rail('r-10', 'Por menos de 10 €', under10, '#/menos-de-10', 'Ver todo')}

      <section class="sec" aria-labelledby="serv-h">
        <div class="sec-h"><h2 id="serv-h">Mucho más que una tienda</h2><a href="#/servicios">Todos los servicios</a></div>
        <div class="services">${services()}</div>
      </section>

      <section class="sec" aria-labelledby="brands-h">
        <div class="sec-h"><h2 id="brands-h">Marcas que trabajamos</h2></div>
        <div class="brands">${topBrands.map(b => `<a class="chip" href="#/marca/${encodeURIComponent(b)}">${esc(b)}</a>`).join('')}</div>
      </section>

      <section class="sec panel visit" aria-labelledby="visit-h">
        <div class="visit-info">
          <h2 id="visit-h">Ven a vernos a Salobreña</h2>
          <p>Compra online y recoge en tienda sin gastos de envío, o pásate y te asesoramos en persona.</p>
          ${contactList()}
          <div class="btn-row"><a class="btn btn-primary" href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent('Av. Mediterráneo 16, 18680 Salobreña, Granada')}" target="_blank" rel="noopener">${icon('pin')}Cómo llegar</a><a class="btn btn-wa" href="https://wa.me/${WA}" target="_blank" rel="noopener">${icon('wa')}Escríbenos</a></div>
        </div>
        <div class="visit-map" aria-hidden="true">${mapSvg()}<div class="pin"><span>Informática PC-RAM</span>${icon('pin')}</div></div>
      </section>`;

    setupCarousel();
    renderInk();
    document.title = 'Informática PC-RAM · Tienda de informática en Salobreña (Granada)';
  }

  function services() {
    return [
      ['wrench', 'Servicio técnico', 'Reparamos y ponemos a punto ordenadores y portátiles. Ampliamos memoria y discos con piezas de la propia tienda.', '#/servicios', 'Pedir presupuesto'],
      ['digi', 'Distribuidor oficial DIGI', 'Contrata fibra y móvil DIGI en nuestra tienda, con atención en persona.', waLink('Hola, quiero información sobre fibra y móvil DIGI'), 'Pedir información'],
      ['recharge', 'Recargas de móvil', 'Recarga tu tarjeta prepago en el momento, en el mostrador.', '', ''],
      ['copy', 'Fotocopias e impresión', 'Envía lo que quieras imprimir a correoimprimelo@gmail.com y pásate a recogerlo.', 'mailto:correoimprimelo@gmail.com', 'Enviar para imprimir'],
      ['globe', 'Cyber', 'Ordenadores con internet para consultar, imprimir o hacer tus gestiones.', '', ''],
      ['case', 'Ordenadores a medida', 'Te montamos el equipo que necesitas, para casa, oficina o gaming.', waLink('Hola, quiero presupuesto para un ordenador a medida'), 'Pedir presupuesto']
    ].map(([ic, t, d, href, l]) => `<div class="service${ic === 'digi' ? ' digi' : ''}"><span class="ico" aria-hidden="true">${ic === 'digi' ? 'DIGI' : icon(ic)}</span><div><h3>${t}</h3><p>${d}</p>${href ? `<a href="${href}"${href.startsWith('http') ? ' target="_blank" rel="noopener"' : ''}>${l}</a>` : ''}</div></div>`).join('');
  }
  function contactList() {
    return `<ul class="contact-list">
      <li>${icon('pin')}<div><b>Dirección</b><span>Av. Mediterráneo, 16, bajo B · 18680 Salobreña (Granada)</span></div></li>
      <li>${icon('phone')}<div><b>Teléfono</b><a href="tel:+34958611768">958 61 17 68</a></div></li>
      <li>${icon('wa')}<div><b>WhatsApp</b><a href="https://wa.me/${WA}" target="_blank" rel="noopener">622 27 78 78</a></div></li>
      <li>${icon('mail')}<div><b>Correo</b><a href="mailto:infopcram@gmail.com">infopcram@gmail.com</a></div></li>
    </ul>`;
  }
  function mapSvg() {
    return `<svg class="mapa" viewBox="0 0 400 300" preserveAspectRatio="xMidYMid slice"><rect width="400" height="300" fill="#e9eef3"/>
      <path d="M0 238 C80 222 150 246 220 232 S340 214 400 226 V300 H0z" fill="#9fd3f0"/>
      <path d="M0 250 C90 236 160 258 230 246 S350 228 400 240" stroke="#c4e5f7" stroke-width="3" fill="none"/>
      <g stroke="#fff" stroke-linecap="round" fill="none"><path d="M-10 150 C90 140 170 160 410 128" stroke-width="12"/><path d="M200 -10 C196 70 206 150 214 235" stroke-width="10"/><path d="M60 -10 L120 230" stroke-width="7"/><path d="M330 -10 L300 225" stroke-width="7"/><path d="M-10 70 L410 92" stroke-width="6"/><path d="M-10 200 L410 186" stroke-width="6"/></g>
      <g fill="#d6e8d4"><rect x="230" y="20" width="70" height="50" rx="6"/><rect x="20" y="88" width="34" height="44" rx="6"/></g>
      <text x="214" y="122" font-family="Inter,Arial" font-size="11" fill="#5b6b7d" transform="rotate(-6 214 122)">Av. Mediterráneo</text></svg>`;
  }

  function setupCarousel() {
    clearInterval(carTimer); carTimer = null;
    const car = $('.carousel'); if (!car) return;
    const slides = $$('.slide', car), dots = $$('.car-dot', car), tog = $('[data-car=toggle]', car);
    let i = 0, playing = !reduced, hover = false;
    const show = n => {
      i = (n + slides.length) % slides.length;
      slides.forEach((s, k) => { s.classList.toggle('on', k === i); if (k === i) s.removeAttribute('aria-hidden'); else s.setAttribute('aria-hidden', 'true'); });
      dots.forEach((d, k) => d.setAttribute('aria-current', k === i ? 'true' : 'false'));
    };
    const setPlay = v => { playing = v; tog.innerHTML = icon(v ? 'pause' : 'play'); tog.setAttribute('aria-label', v ? 'Pausar el carrusel' : 'Reanudar el carrusel'); };
    setPlay(playing);
    carTimer = setInterval(() => { if (playing && !hover && document.contains(car)) show(i + 1); }, 6500);
    car.addEventListener('mouseenter', () => hover = true); car.addEventListener('mouseleave', () => hover = false);
    car.addEventListener('focusin', () => hover = true); car.addEventListener('focusout', () => hover = false);
    car.addEventListener('click', e => {
      const b = e.target.closest('[data-car]'); if (!b) return;
      if (b.dataset.car === 'toggle') setPlay(!playing); else { show(+b.dataset.car); }
    });
  }

  function renderInk() {
    const res = $('#inkres'); if (!res) return;
    let items = P.filter(p => inCat(p, '80'));
    if (state.inkBrand) items = items.filter(p => p.b === state.inkBrand);
    const q = state.inkQ.trim();
    if (q) { const ids = new Set(search(q).map(p => p.id)); items = items.filter(p => ids.has(p.id)); }
    items.sort((a, b) => (b.s > 0) - (a.s > 0) || b.id - a.id);
    const lim = matchMedia('(max-width: 600px)').matches ? 4 : 8;
    res.innerHTML = items.length ? items.slice(0, lim).map(card).join('') : `<div class="empty" style="grid-column:1/-1;box-shadow:none"><h2>No lo vemos en la web</h2><p>Puede que lo tengamos en tienda o lo pidamos para ti.</p><a class="btn btn-wa" href="${waLink(`Hola, busco cartucho ${state.inkBrand} ${q}`.replace(/\s+/g, ' '))}" target="_blank" rel="noopener">${icon('wa')}Pregúntanos por WhatsApp</a></div>`;
    $('#inkcount').textContent = `${items.length} ${items.length === 1 ? 'resultado' : 'resultados'}${items.length > lim ? ` (mostrando ${lim})` : ''}`;
    const all = $('#inkall');
    if (q) { all.href = '#/buscar/' + encodeURIComponent(((state.inkBrand ? state.inkBrand + ' ' : '') + q).trim()); all.textContent = 'Ver todos los resultados'; }
    else if (state.inkBrand) { all.href = curl(CAT['80']) + '?marca=' + encodeURIComponent(state.inkBrand); all.textContent = `Ver todo ${state.inkBrand}`; }
    else { all.href = curl(CAT['80']); all.textContent = 'Ver todas las tintas y tóner'; }
  }

  // ---------- Listados ----------
  function listing(o) {
    const q = o.q, path = o.path;
    const marcas = (q.get('marca') || '').split(',').filter(Boolean);
    const min = q.get('min') !== null && q.get('min') !== '' ? parseFloat(q.get('min')) : null;
    const max = q.get('max') !== null && q.get('max') !== '' ? parseFloat(q.get('max')) : null;
    const soloStock = q.get('stock') === '1';
    const orden = q.get('orden') || 'rel';
    let pag = Math.max(1, parseInt(q.get('pag') || '1', 10) || 1);

    let items = o.base.filter(p => (!soloStock || p.s > 0) && (min === null || p.p >= min) && (max === null || p.p <= max));
    const bc = {}; items.forEach(p => { if (p.b) bc[p.b] = (bc[p.b] || 0) + 1; });
    if (marcas.length) items = items.filter(p => marcas.includes(p.b));
    const sorters = {
      rel: o.relSort || ((a, b) => (b.s > 0) - (a.s > 0) || b.id - a.id),
      'precio-asc': (a, b) => a.p - b.p, 'precio-desc': (a, b) => b.p - a.p,
      nuevos: (a, b) => b.id - a.id, nombre: (a, b) => a.n.localeCompare(b.n, 'es')
    };
    items = o.relSort && orden === 'rel' ? items : [...items].sort(sorters[orden] || sorters.rel);
    const pages = Math.max(1, Math.ceil(items.length / PER_PAGE)); pag = Math.min(pag, pages);
    const pageItems = items.slice((pag - 1) * PER_PAGE, pag * PER_PAGE);

    const link = (upd) => { const n = new URLSearchParams(q); for (const [k, v] of Object.entries(upd)) { if (v === null || v === '' || v === false) n.delete(k); else n.set(k, v); } if (!('pag' in upd)) n.delete('pag'); const s = n.toString(); return '#' + path + (s ? '?' + s : ''); };

    // Subcategorías
    let chips = '';
    if (o.cat) {
      const c = o.cat;
      const list = c.children.length ? c.children : (c.parent ? CAT[c.parent].children : []);
      if (list.length) chips = `<nav class="subchips" aria-label="Subcategorías">${!c.children.length && c.parent ? `<a class="chip" href="${curl(CAT[c.parent])}">Todo ${esc(CAT[c.parent].name)}</a>` : ''}${list.map(k => `<a class="chip${k === c.path ? ' on' : ''}" href="${curl(CAT[k])}"${k === c.path ? ' aria-current="page"' : ''}>${esc(CAT[k].name)} <small>${CAT[k].count}</small></a>`).join('')}</nav>`;
    }

    // Bloque de categorías dentro de los filtros (búsquedas y colecciones)
    let catBlock = '';
    if (!o.cat) {
      const cc = {}; o.base.forEach(p => { const t = p.c.split('_')[0]; cc[t] = (cc[t] || 0) + 1; });
      const top = Object.entries(cc).sort((a, b) => b[1] - a[1]).slice(0, 8);
      if (top.length > 1) catBlock = `<div class="fblock"><h2>Categorías</h2><ul>${top.map(([k, n]) => `<li><a href="${curl(CAT[k])}">${esc(CAT[k].name)}<small>${n}</small></a></li>`).join('')}</ul></div>`;
    }
    const brandList = Object.entries(bc).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
    const ranges = [['Hasta 10 €', null, 10], ['10 a 25 €', 10, 25], ['25 a 50 €', 25, 50], ['50 a 150 €', 50, 150], ['Más de 150 €', 150, null]];

    const filters = `
      <aside class="filters${state.filtersOpen ? ' open' : ''}" id="filters" aria-label="Filtros">
        <div class="filters-head drawer-h"><h2>Filtrar</h2><button class="icon-btn" type="button" data-close-filters aria-label="Cerrar filtros">${icon('close')}</button></div>
        ${catBlock}
        <div class="fblock"><h2>Disponibilidad</h2>
          <label class="check"><input type="checkbox" id="f-stock" ${soloStock ? 'checked' : ''} data-flt="stock">Solo con stock en tienda</label></div>
        <div class="fblock"><h2>Precio</h2>
          <ul style="margin-bottom:10px">${ranges.map(([l, a, b]) => { const on = min === a && max === b; return `<li><a href="${link({ min: on ? null : a, max: on ? null : b })}" class="${on ? 'on' : ''}"${on ? ' aria-current="true"' : ''}>${l}</a></li>`; }).join('')}</ul>
          <form class="price-range" data-price><label>Mínimo (€)<input type="number" inputmode="decimal" min="0" step="1" name="min" id="f-min" value="${min ?? ''}"></label><label>Máximo (€)<input type="number" inputmode="decimal" min="0" step="1" name="max" id="f-max" value="${max ?? ''}"></label><button class="btn btn-outline btn-block" style="grid-column:1/-1" type="submit">Aplicar precio</button></form></div>
        ${brandList.length > 1 || marcas.length ? `<div class="fblock"><h2>Marca</h2>
          <div>${brandList.map(([b, n], i) => `<label class="check"${i >= 8 && !marcas.includes(b) ? ' data-more hidden' : ''}><input type="checkbox" id="f-b-${i}" data-brand="${esc(b)}" ${marcas.includes(b) ? 'checked' : ''}>${esc(b)}<small>${n}</small></label>`).join('')}</div>
          ${brandList.length > 8 ? `<button class="link-btn more-brands" type="button" data-more-brands aria-expanded="false">Ver todas las marcas (${brandList.length})</button>` : ''}</div>` : ''}
        <div class="fblock filters-foot" style="position:sticky;bottom:0;background:#fff"><button class="btn btn-primary btn-block" type="button" data-close-filters>Ver ${items.length} ${items.length === 1 ? 'producto' : 'productos'}</button></div>
      </aside>`;

    const active = [];
    if (soloStock) active.push(['Con stock', link({ stock: null })]);
    if (min !== null || max !== null) active.push([min !== null && max !== null ? `${min} a ${max} €` : min !== null ? `Desde ${min} €` : `Hasta ${max} €`, link({ min: null, max: null })]);
    marcas.forEach(m => active.push([m, link({ marca: marcas.filter(x => x !== m).join(',') || null })]));

    const pager = pages > 1 ? `<nav class="pager" aria-label="Páginas">${pag > 1 ? `<a href="${link({ pag: pag - 1 })}" aria-label="Página anterior">${icon('left')}</a>` : ''}${Array.from({ length: pages }, (_, k) => k + 1).filter(n => n === 1 || n === pages || Math.abs(n - pag) <= 1).reduce((acc, n, i, arr) => { if (i && n - arr[i - 1] > 1) acc.push('…'); acc.push(n); return acc; }, []).map(n => n === '…' ? '<span aria-hidden="true">…</span>' : n === pag ? `<span aria-current="page">${n}</span>` : `<a href="${link({ pag: n })}" aria-label="Página ${n}">${n}</a>`).join('')}${pag < pages ? `<a href="${link({ pag: pag + 1 })}" aria-label="Página siguiente">${icon('right')}</a>` : ''}</nav>` : '';

    view.innerHTML = `${crumbs(o.crumbs)}
      <div class="list-head"><h1 tabindex="-1">${esc(o.title)}</h1><span>${o.base.length} ${o.base.length === 1 ? 'producto' : 'productos'}</span></div>
      ${o.intro || ''}${chips}
      <div class="listing">${filters}
        <div>
          <div class="toolbar" id="toolbar"><button class="btn btn-outline filter-btn" type="button" data-open-filters aria-controls="filters">${icon('filter')}Filtrar${active.length ? ` (${active.length})` : ''}</button>
            <span class="count" aria-live="polite">${items.length} ${items.length === 1 ? 'resultado' : 'resultados'}${pages > 1 ? ` · página ${pag} de ${pages}` : ''}</span>
            <label>Ordenar por <select id="f-orden" data-orden>${[['rel', o.relSort ? 'Más relevantes' : 'Destacados'], ['precio-asc', 'Precio: de menor a mayor'], ['precio-desc', 'Precio: de mayor a menor'], ['nuevos', 'Novedades'], ['nombre', 'Nombre (A-Z)']].map(([v, l]) => `<option value="${v}"${orden === v ? ' selected' : ''}>${l}</option>`).join('')}</select></label></div>
          ${active.length ? `<div class="active-filters">${active.map(([l, h]) => `<a class="chip" href="${h}">${esc(l)} ${icon('close')}<span class="sr-only">(quitar filtro)</span></a>`).join('')}${active.length > 1 ? `<a class="chip" href="#${path}">Quitar todos</a>` : ''}</div>` : ''}
          ${pageItems.length ? `<div class="grid">${pageItems.map(card).join('')}</div>` : `<div class="empty"><h2>No hay productos con esos filtros</h2><p>Quita algún filtro o pregúntanos: si no lo tenemos, lo pedimos.</p><a class="btn btn-outline" href="#${path}">Quitar filtros</a></div>`}
          ${pager}
        </div></div>`;

    // Eventos de filtros
    const setQ = (upd, focusId) => { state.focusId = focusId || null; location.hash = link(upd); };
    $$('[data-flt=stock]').forEach(el => el.addEventListener('change', () => setQ({ stock: el.checked ? '1' : null }, el.id)));
    $$('[data-brand]').forEach(el => el.addEventListener('change', () => {
      const b = el.dataset.brand; const set = new Set(marcas); el.checked ? set.add(b) : set.delete(b);
      setQ({ marca: [...set].join(',') || null }, el.id);
    }));
    const pf = $('[data-price]'); pf && pf.addEventListener('submit', e => { e.preventDefault(); const a = pf.min.value, b = pf.max.value; setQ({ min: a === '' ? null : Math.max(0, +a), max: b === '' ? null : Math.max(0, +b) }, 'f-min'); });
    const so = $('[data-orden]'); so && so.addEventListener('change', () => setQ({ orden: so.value === 'rel' ? null : so.value }, 'f-orden'));
    const mb = $('[data-more-brands]'); mb && mb.addEventListener('click', () => { const hid = $$('[data-more]'); const show = hid.some(h => h.hidden); hid.forEach(h => h.hidden = !show); mb.setAttribute('aria-expanded', String(show)); mb.textContent = show ? 'Ver menos marcas' : `Ver todas las marcas (${brandList.length})`; });
    document.title = `${o.title} · Informática PC-RAM`;
  }

  function category(slug, q) {
    const c = CATSLUG[slug];
    if (!c) return notFound();
    const base = P.filter(p => inCat(p, c.path));
    listing({ path: '/c/' + slug, q, base, cat: c, title: c.name, crumbs: trail(c.path).map(x => ({ name: x.name, href: curl(x) })) });
  }
  function searchPage(term, q) {
    const res = search(term);
    $('#q').value = term;
    if (!res.length) {
      view.innerHTML = `${crumbs([{ name: 'Búsqueda' }])}<div class="empty" style="margin-top:12px"><h1 style="font-size:22px;margin-bottom:8px" tabindex="-1">No encontramos «${esc(term)}»</h1><p>Revisa cómo está escrito o prueba con algo más general. Si no lo tenemos en la web, seguramente podamos pedirlo.</p><div class="btn-row" style="justify-content:center"><a class="btn btn-wa" href="${waLink(`Hola, busco: ${term}`)}" target="_blank" rel="noopener">${icon('wa')}Preguntar por WhatsApp</a><button class="btn btn-outline" type="button" data-open-cats>Ver categorías</button></div></div>`;
      document.title = `Sin resultados para «${term}» · Informática PC-RAM`;
      return;
    }
    listing({ path: '/buscar/' + encodeURIComponent(term), q, base: res, relSort: true, title: `Resultados para «${term}»`, crumbs: [{ name: 'Búsqueda' }] });
  }

  // ---------- Ficha de producto ----------
  function product(id) {
    const p = PID[id]; if (!p) return notFound();
    const tr = trail(p.c);
    const related = (() => { const same = P.filter(x => x.id !== p.id && x.c === p.c).sort((a, b) => (b.s > 0) - (a.s > 0) || b.id - a.id); const top = P.filter(x => x.id !== p.id && x.c !== p.c && inCat(x, p.c.split('_')[0]) && x.s > 0).sort((a, b) => b.id - a.id); return [...same, ...top].slice(0, 12); })();
    const waQ = waLink(`Hola, tengo una pregunta sobre «${p.n}» (código ${p.id}).`);
    view.innerHTML = `${crumbs([...tr.map(x => ({ name: x.name, href: curl(x) })), { name: p.n }])}
      <div class="pdp">
        <div class="gallery">${NEW.has(p.id) ? '<span class="tag tag-new">Novedad</span>' : ''}<div class="zoom"><img src="img/p/${p.id}.jpg" alt="${esc(p.n)}" width="400" height="400" id="pimg"></div></div>
        <div class="pinfo">
          ${p.b ? `<a class="brand" href="#/marca/${encodeURIComponent(p.b)}">${esc(p.b)}</a>` : ''}
          <h1 tabindex="-1">${esc(p.n)}</h1>
          <div class="refs">${p.m ? `<span>Ref. fabricante: <b>${esc(p.m)}</b></span>` : ''}<span>Código: <b>${p.id}</b></span><span>Categoría: <a href="${curl(tr[tr.length - 1])}">${esc(tr[tr.length - 1].name)}</a></span></div>
          <ul class="highlights" id="phl"></ul>
        </div>
        <div class="buybox">
          ${priceHtml(p.p)}<span class="iva">IVA incluido</span>
          <div>${stockHtml(p, true)}</div>
          ${p.s > 0 ? `<div class="qty-row"><div class="qty" role="group" aria-label="Cantidad"><button type="button" data-pq="-1" aria-label="Quitar una unidad">${icon('minus')}</button><input type="number" id="pq" inputmode="numeric" min="1" max="${maxQ(p)}" value="1" aria-label="Unidades"><button type="button" data-pq="1" aria-label="Añadir una unidad">${icon('plus')}</button></div>
            <button class="btn btn-primary btn-lg" type="button" data-addq="${p.id}">${icon('cart')}Añadir<span class="long"> a la cesta</span></button></div>
            <a class="btn btn-wa btn-block" href="${waQ}" target="_blank" rel="noopener">${icon('wa')}Preguntar por WhatsApp</a>`
        : `<a class="btn btn-wa btn-lg btn-block" href="${waLink(`Hola, ¿cuándo tendréis «${p.n}» (código ${p.id})?`)}" target="_blank" rel="noopener">${icon('wa')}Consultar disponibilidad</a>`}
          <ul class="deliv">
            <li>${icon('store')}<div><b>Recógelo gratis en tienda</b><span>Av. Mediterráneo 16, Salobreña. Te avisamos cuando esté listo.</span></div></li>
            <li>${icon('truck')}<div><b>Envío a península</b><span>En 3-5 días desde el pago. Canarias, consúltanos.</span></div></li>
            <li>${icon('return')}<div><b>Devolución en 15 días</b><span>En su embalaje original y en perfecto estado.</span></div></li>
          </ul>
          ${payChips()}
        </div>
      </div>
      <section class="desc" aria-labelledby="desc-h"><div class="desc-body"><h2 id="desc-h">Descripción</h2><div class="desc-text" id="ptext"><p>Cargando la descripción…</p></div></div></section>
      ${rail('r-rel', 'También te puede interesar', related, curl(tr[tr.length - 1]), 'Ver la categoría')}`;

    // zoom
    const z = $('.zoom'), im = $('#pimg');
    if (z && matchMedia('(hover: hover)').matches && !reduced) {
      z.addEventListener('mousemove', e => { const r = z.getBoundingClientRect(); im.style.transformOrigin = `${(e.clientX - r.left) / r.width * 100}% ${(e.clientY - r.top) / r.height * 100}%`; im.style.transform = 'scale(1.8)'; });
      z.addEventListener('mouseleave', () => { im.style.transform = ''; });
    }
    loadDesc().then(() => {
      const el = $('#ptext'); if (!el || PID[id] !== p) return;
      const t = DESC[p.id];
      if (!t) { el.innerHTML = `<p>${esc(p.n)}.</p><p>¿Necesitas más detalles? <a href="${waQ}" target="_blank" rel="noopener">Pregúntanos por WhatsApp</a> y te respondemos enseguida.</p>`; $('#phl').remove(); return; }
      el.innerHTML = formatDesc(t);
      const nameWords = new Set(norm(p.n).split(/[^a-z0-9]+/).filter(w => w.length > 2));
      const looksLikeName = s => { const w = norm(s).split(/[^a-z0-9]+/).filter(x => x.length > 2); return w.length && w.filter(x => nameWords.has(x)).length / w.length > 0.5; };
      const hl = t.split('\n').map(s => s.replace(/^[-•*]\s*/, '').trim())
        .filter(s => s.length >= 8 && s.length <= 70 && !/[:]$/.test(s) && !/^\(/.test(s) && !/^(caracter[ií]sticas|especificaci|descripci|contenido|otras|ficha|detalles?\b|informaci|datos t)/i.test(s) && !looksLikeName(s) && (s.split(/\s+/).filter(w => /[a-záéíóúñ]{2}/i.test(w)).length >= 3 || /\d/.test(s)) && !(s === s.toUpperCase() && /[A-ZÁÉÍÓÚÑ]{4}/.test(s)))
        .slice(0, 4);
      const ul = $('#phl'); if (hl.length >= 2) ul.innerHTML = hl.map(s => `<li>${icon('check')}<span>${esc(s)}</span></li>`).join(''); else ul.remove();
      if (el.scrollHeight > 420) {
        el.classList.add('clamp');
        el.insertAdjacentHTML('afterend', `<button class="btn btn-outline desc-more" type="button" aria-expanded="false" aria-controls="ptext">Ver la descripción completa</button>`);
        const b = el.nextElementSibling; b.addEventListener('click', () => { const open = el.classList.toggle('clamp'); b.setAttribute('aria-expanded', String(!open)); b.textContent = open ? 'Ver la descripción completa' : 'Ver menos'; });
      }
    });
    document.title = `${p.n} · Informática PC-RAM`;
  }
  function formatDesc(t) {
    const lines = t.split('\n').map(s => s.trim());
    let html = '', list = [];
    const flush = () => { if (list.length) { html += `<ul>${list.map(l => `<li>${esc(l)}</li>`).join('')}</ul>`; list = []; } };
    for (const l of lines) {
      if (!l) { flush(); continue; }
      if (/^[-•*]/.test(l)) { list.push(l.replace(/^[-•*]\s*/, '')); continue; }
      flush();
      if (l.length < 60 && /:$/.test(l)) html += `<h3>${esc(l.replace(/:$/, ''))}</h3>`;
      else html += `<p>${esc(l)}</p>`;
    }
    flush();
    return html;
  }
  function loadDesc() {
    if (DESC) return Promise.resolve();
    if (!descLoading) descLoading = fetch('data/descripciones.json').then(r => r.json()).then(d => { DESC = d; }).catch(() => { DESC = {}; });
    return descLoading;
  }

  // ---------- Cesta (página) ----------
  function cartPage() {
    const items = cartItems();
    document.title = 'Tu cesta · Informática PC-RAM';
    if (!items.length) { view.innerHTML = `<h1 class="page-title" tabindex="-1">Tu cesta</h1><div class="empty"><h2>Tu cesta está vacía</h2><p>Busca lo que necesitas entre más de 1.000 productos con stock en Salobreña.</p><a class="btn btn-primary" href="#/">Ir a la tienda</a></div>`; return; }
    view.innerHTML = `<h1 class="page-title" tabindex="-1">Tu cesta <span style="font-weight:500;color:var(--texto-2);font-size:18px">(${cartCount()} ${cartCount() === 1 ? 'producto' : 'productos'})</span></h1>
      <div class="cart-layout">
        <div class="cart-list">${items.map(i => `
          <div class="citem"><img src="img/p/${i.id}.jpg" alt="${esc(i.p.n)}" width="88" height="88" loading="lazy">
            <div><a class="n" href="${purl(i.p)}">${esc(i.p.n)}</a>
              <div class="meta">${qtyCtrl(i)}${stockHtml(i.p)}<button class="del" type="button" data-del="${i.id}">${icon('trash')}Eliminar<span class="sr-only"> ${esc(i.p.n)}</span></button></div></div>
            <div class="lp">${eur(i.q * i.p.p)}<span class="unit">${i.q > 1 ? eur(i.p.p) + ' / ud.' : ''}</span></div></div>`).join('')}
        </div>
        <aside class="summary" aria-labelledby="sum-h"><h2 id="sum-h">Resumen</h2>
          <div class="sum-row"><span>Productos</span><span>${eur(cartSub())}</span></div>
          <div class="sum-row"><span>Recogida en tienda</span><span style="color:var(--verde);font-weight:700">Gratis</span></div>
          <div class="sum-row"><span>Envío a domicilio</span><span>${eur(SHIP)}</span></div>
          <div class="sum-row total"><span>Total</span><span>${eur(cartSub())}</span></div>
          <p class="sum-note">Precios con IVA incluido. Eliges la entrega en el siguiente paso.</p>
          <a class="btn btn-primary btn-lg btn-block" href="#/pedido">Tramitar pedido</a>
          <a class="btn btn-outline btn-block" style="margin-top:10px" href="#/">Seguir comprando</a>
          ${payChips()}
        </aside>
      </div>`;
  }

  // ---------- Pedido ----------
  const ck = { nombre: '', apellidos: '', email: '', tel: '', envio: 'tienda', direccion: '', cp: '', poblacion: '', provincia: '', pago: 'tarjeta', acepto: false };
  function checkout() {
    const items = cartItems();
    document.title = 'Finalizar pedido · Informática PC-RAM';
    if (!items.length) { cartPage(); return; }
    const ship = ck.envio === 'domicilio' ? SHIP : 0;
    if (ck.envio !== 'tienda' && ck.pago === 'tienda') ck.pago = 'tarjeta';
    const f = (id, label, type, extra = '', full) => `<div class="field${full ? ' full' : ''}"><label for="ck-${id}">${label}</label><input id="ck-${id}" name="${id}" type="${type}" value="${esc(ck[id])}" ${extra} aria-describedby="e-${id}"><span class="err" id="e-${id}"></span></div>`;
    const pays = [
      ['tarjeta', 'Tarjeta de crédito o débito', 'Pago seguro con la pasarela del banco.', '<span class="pay visa">VISA</span><span class="pay mc"><i></i><i></i>Mastercard</span>'],
      ['bizum', 'Bizum', 'Paga desde la app de tu banco con tu móvil.', '<span class="pay bizum">bizum</span>'],
      ['paypal', 'PayPal', 'Con tu cuenta PayPal, sin compartir los datos de tu tarjeta.', '<span class="pay paypal">Pay<em>Pal</em></span>'],
      ['wallet', 'Apple Pay o Google Pay', 'Paga con el móvil en un toque.', '<span class="pay apple">Apple Pay</span><span class="pay gpay">Google Pay</span>'],
      ['transferencia', 'Transferencia bancaria', 'Preparamos el pedido al recibir el pago.', ''],
      ['tienda', 'Pago en tienda al recoger', 'En efectivo o con tarjeta en el mostrador.', '']
    ];
    view.innerHTML = `${crumbs([{ name: 'Cesta', href: '#/cesta' }, { name: 'Finalizar pedido' }])}
      <h1 class="page-title" style="margin-top:4px" tabindex="-1">Finalizar pedido</h1>
      <form id="ckForm" novalidate class="cart-layout">
        <div class="steps">
          <section class="step" aria-labelledby="st1"><h2 id="st1"><span class="n">1</span>Tus datos</h2>
            <div class="fields">${f('nombre', 'Nombre', 'text', 'autocomplete="given-name" required')}${f('apellidos', 'Apellidos', 'text', 'autocomplete="family-name" required')}${f('email', 'Correo electrónico', 'email', 'autocomplete="email" required')}${f('tel', 'Teléfono móvil', 'tel', 'autocomplete="tel" inputmode="tel" required')}</div></section>
          <section class="step" aria-labelledby="st2"><h2 id="st2"><span class="n">2</span>Entrega</h2>
            <fieldset style="border:0;padding:0;margin:0"><legend class="sr-only">Forma de entrega</legend><div class="options">
              <label class="opt"><input type="radio" name="envio" value="tienda" ${ck.envio === 'tienda' ? 'checked' : ''}><div><b>Recoger en tienda</b><span class="d">Av. Mediterráneo 16, bajo B, Salobreña. Te avisamos por WhatsApp cuando esté listo.</span></div><span class="r" style="color:var(--verde)">Gratis</span></label>
              <label class="opt"><input type="radio" name="envio" value="domicilio" ${ck.envio === 'domicilio' ? 'checked' : ''}><div><b>Envío a domicilio</b><span class="d">Península, en 3-5 días desde el pago. Para Canarias, consúltanos antes.</span></div><span class="r">${eur(SHIP)}</span></label>
            </div></fieldset>
            ${ck.envio === 'domicilio' ? `<div class="fields" style="margin-top:14px">${f('direccion', 'Dirección', 'text', 'autocomplete="street-address" required', true)}${f('cp', 'Código postal', 'text', 'autocomplete="postal-code" inputmode="numeric" maxlength="5" required')}${f('poblacion', 'Población', 'text', 'autocomplete="address-level2" required')}${f('provincia', 'Provincia', 'text', 'autocomplete="address-level1" required', true)}</div>` : ''}
          </section>
          <section class="step" aria-labelledby="st3"><h2 id="st3"><span class="n">3</span>Pago</h2>
            <fieldset style="border:0;padding:0;margin:0"><legend class="sr-only">Forma de pago</legend><div class="options">
              ${pays.map(([v, t, d, chips]) => { const dis = v === 'tienda' && ck.envio !== 'tienda'; return `<label class="opt${dis ? ' disabled' : ''}"><input type="radio" name="pago" value="${v}" ${ck.pago === v ? 'checked' : ''} ${dis ? 'disabled' : ''}><div><b>${t}</b><span class="d">${dis ? 'Solo si recoges el pedido en tienda.' : d}</span>${chips ? `<div class="pay-chips">${chips}</div>` : ''}</div></label>`; }).join('')}
            </div></fieldset>
            <label class="check" style="margin-top:16px;align-items:flex-start"><input type="checkbox" id="ck-acepto" name="acepto" ${ck.acepto ? 'checked' : ''} aria-describedby="e-acepto" style="margin-top:2px"><span>He leído y acepto las <a href="#/ayuda" target="_blank">condiciones de venta</a> y la política de privacidad.</span></label>
            <span class="err" id="e-acepto" style="color:var(--rojo);font-size:13px;font-weight:600"></span>
          </section>
        </div>
        <aside class="summary" aria-labelledby="sum2"><h2 id="sum2">Tu pedido</h2>
          <ul class="sum-items">${items.map(i => `<li><img src="img/p/${i.id}.jpg" alt="" width="44" height="44"><span>${i.q} × ${esc(i.p.n)}</span><b>${eur(i.q * i.p.p)}</b></li>`).join('')}</ul>
          <div class="sum-row"><span>Productos</span><span>${eur(cartSub())}</span></div>
          <div class="sum-row"><span>${ck.envio === 'tienda' ? 'Recogida en tienda' : 'Envío a domicilio'}</span><span>${ship ? eur(ship) : 'Gratis'}</span></div>
          <div class="sum-row total"><span>Total</span><span>${eur(cartSub() + ship)}</span></div>
          <p class="sum-note">IVA incluido.</p>
          <button class="btn btn-primary btn-lg btn-block" type="submit">${icon('shield')}Confirmar pedido</button>
        </aside>
      </form>`;

    const form = $('#ckForm');
    form.addEventListener('input', e => {
      const t = e.target; if (!t.name || t.type === 'radio' || t.type === 'checkbox') return;
      ck[t.name] = t.value;
      if (t.getAttribute('aria-invalid') === 'true') { t.setAttribute('aria-invalid', 'false'); const sp = $('#e-' + t.name); if (sp) sp.textContent = ''; }
    });
    form.addEventListener('change', e => {
      const t = e.target;
      if (t.type === 'checkbox') { ck[t.name] = t.checked; if (t.checked) { const sp = $('#e-' + t.name); if (sp) sp.textContent = ''; } }
      if (t.type === 'radio') { ck[t.name] = t.value; if (t.name === 'envio') { const y = scrollY; checkout(); scrollTo(0, y); const r = form.isConnected ? null : $(`input[name=envio][value=${t.value}]`); r && r.focus(); } }
    });
    form.addEventListener('submit', e => {
      e.preventDefault();
      const req = ['nombre', 'apellidos', 'email', 'tel', ...(ck.envio === 'domicilio' ? ['direccion', 'cp', 'poblacion', 'provincia'] : [])];
      let first = null;
      const err = (k, msg) => { const el = $('#ck-' + k), sp = $('#e-' + k); if (sp) sp.textContent = msg || ''; if (el) el.setAttribute('aria-invalid', msg ? 'true' : 'false'); if (msg && !first) first = el; };
      req.forEach(k => {
        const v = (ck[k] || '').trim();
        if (!v) return err(k, 'Este campo es obligatorio.');
        if (k === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return err(k, 'Escribe un correo válido, por ejemplo nombre@gmail.com.');
        if (k === 'tel' && v.replace(/\D/g, '').length < 9) return err(k, 'Escribe un teléfono de 9 cifras.');
        if (k === 'cp' && !/^\d{5}$/.test(v)) return err(k, 'El código postal tiene 5 cifras.');
        if (k === 'cp' && /^(35|38|51|52)/.test(v)) return err(k, 'Enviamos solo a península. Para Canarias, Ceuta o Melilla, consúltanos.');
        err(k, '');
      });
      if (!ck.acepto) err('acepto', 'Tienes que aceptar las condiciones para continuar.'); else err('acepto', '');
      if (first) { first.focus(); return; }
      done();
    });
  }
  function done() {
    const items = cartItems(), ship = ck.envio === 'domicilio' ? SHIP : 0, total = cartSub() + ship;
    const no = 'PCR-' + String(Math.floor(10000 + Math.random() * 89999));
    const payTxt = { tarjeta: 'tarjeta', bizum: 'Bizum', paypal: 'PayPal', wallet: 'Apple Pay o Google Pay', transferencia: 'transferencia bancaria', tienda: 'pago en tienda' }[ck.pago];
    view.innerHTML = `<div class="done"><div class="ok" aria-hidden="true">${icon('check')}</div>
      <h1 tabindex="-1">¡Gracias, ${esc(ck.nombre.trim())}! Pedido recibido</h1>
      <div class="order-no">Pedido ${no}</div>
      <p>${items.length} ${items.length === 1 ? 'producto' : 'productos'} · Total ${eur(total)} · Pago con ${payTxt}</p>
      <p>${ck.envio === 'tienda' ? 'Te avisaremos por WhatsApp cuando esté listo para recoger en Av. Mediterráneo 16, Salobreña.' : `Lo recibirás en 3-5 días en ${esc(ck.direccion)}, ${esc(ck.cp)} ${esc(ck.poblacion)}.`} Te enviamos la confirmación a ${esc(ck.email)}.</p>
      <div class="btn-row" style="justify-content:center;margin-top:18px"><a class="btn btn-primary" href="#/">Volver a la tienda</a><a class="btn btn-wa" href="${waLink(`Hola, tengo una duda sobre mi pedido ${no}`)}" target="_blank" rel="noopener">${icon('wa')}Dudas por WhatsApp</a></div>
      <p class="note">Esto es una demostración de la tienda: no se ha cobrado nada ni se ha enviado ningún dato.</p></div>`;
    cart = []; saveCart();
    const n = 0; $('#cartCount').textContent = n; $('#cartCount').dataset.n = n; $('#cartTotal').textContent = eur(0); $('#btnCart').setAttribute('aria-label', 'Cesta vacía'); renderCartDrawer();
    scrollTo(0, 0); $('h1', view).focus();
    document.title = 'Pedido recibido · Informática PC-RAM';
  }

  // ---------- Páginas de información ----------
  function servicesPage() {
    view.innerHTML = `${crumbs([{ name: 'Servicio técnico y servicios' }])}
      <div class="info-hero"><h1 tabindex="-1">Servicio técnico y mucho más, en Salobreña</h1><p>Venta de ordenadores, servicio técnico, telefonía, consumibles y hardware. También recargas móviles, cyber y fotocopias. Y somos distribuidor oficial DIGI.</p></div>
      <div class="info-grid sec">
        <div class="services" style="grid-template-columns:repeat(auto-fit,minmax(260px,1fr))">${services()}</div>
        <aside class="panel" style="padding:22px" aria-labelledby="rep-h">
          <h2 id="rep-h" style="font-size:20px;font-weight:800">Pide presupuesto de reparación</h2>
          <p style="color:var(--texto-2);margin:6px 0 14px">Cuéntanos qué le pasa a tu equipo y te respondemos por WhatsApp.</p>
          <form id="repForm" class="fields" style="grid-template-columns:1fr" novalidate>
            <div class="field"><label for="r-eq">Equipo</label><select id="r-eq"><option>Ordenador de sobremesa</option><option>Portátil</option><option>Tablet</option><option>Impresora</option><option>Otro</option></select></div>
            <div class="field"><label for="r-txt">¿Qué le pasa?</label><textarea id="r-txt" aria-describedby="e-rtxt" placeholder="Ej.: va muy lento y se apaga solo"></textarea><span class="err" id="e-rtxt"></span></div>
            <div class="field"><label for="r-nom">Tu nombre</label><input id="r-nom" autocomplete="given-name"></div>
            <button class="btn btn-wa btn-lg btn-block" type="submit">${icon('wa')}Enviar por WhatsApp</button>
          </form>
          <hr style="border:0;border-top:1px solid var(--borde);margin:20px 0">
          ${contactList()}
        </aside>
      </div>`;
    $('#repForm').addEventListener('submit', e => {
      e.preventDefault();
      const t = $('#r-txt').value.trim();
      if (!t) { $('#e-rtxt').textContent = 'Cuéntanos brevemente qué le pasa.'; $('#r-txt').setAttribute('aria-invalid', 'true'); $('#r-txt').focus(); return; }
      $('#e-rtxt').textContent = ''; $('#r-txt').setAttribute('aria-invalid', 'false');
      const nom = $('#r-nom').value.trim();
      window.open(waLink(`Hola${nom ? ', soy ' + nom : ''}. Quiero presupuesto de reparación.\nEquipo: ${$('#r-eq').value}\nProblema: ${t}`), '_blank', 'noopener');
    });
    document.title = 'Servicio técnico en Salobreña · Informática PC-RAM';
  }
  function helpPage() {
    view.innerHTML = `${crumbs([{ name: 'Ayuda' }])}
      <div class="info-hero"><h1 tabindex="-1">Envíos, devoluciones y garantía</h1><p>Todo lo que necesitas saber antes de comprar. Si te queda alguna duda, escríbenos al 622 27 78 78.</p></div>
      <div class="info-grid sec">
        <div class="prose">
          <h2>Envíos</h2>
          <p>Enviamos a toda la península. Una vez recibido el pago, te entregamos el pedido en un plazo de 3 a 5 días. Para envíos a Canarias, consúltanos antes de hacer el pedido.</p>
          <h2>Recogida en tienda</h2>
          <p>Puedes elegir recoger tu pedido gratis en nuestra tienda de Av. Mediterráneo 16, bajo B, en Salobreña. Te avisamos cuando esté preparado.</p>
          <h2>Formas de pago</h2>
          <p>Tarjeta de crédito o débito, Bizum, PayPal, Apple Pay, Google Pay y transferencia bancaria. Si recoges en tienda, también puedes pagar allí.</p>
          <h2>Devoluciones</h2>
          <ul>
            <li>Tienes 15 días desde la compra para devolver un producto. Los portes de la devolución corren por parte del cliente.</li>
            <li>El producto tiene que venir en su embalaje original y en perfectas condiciones.</li>
            <li>No se admiten devoluciones de productos pedidos expresamente que no sean habituales en nuestro almacén.</li>
            <li>En devoluciones de compras pagadas con tarjeta de crédito se descuenta un 3 % de gastos financieros.</li>
          </ul>
          <h2>Garantía</h2>
          <p>La garantía de nuestros productos es la que marca la ley o la que indica el fabricante, salvo en los productos en los que se especifique una garantía mayor. Las baterías (portátiles, MP3, SAI, etc.) tienen 6 meses de garantía, según indica el fabricante.</p>
          <p>La garantía no cubre averías por instalación incorrecta, uso indebido, agentes atmosféricos, golpes eléctricos o causas ajenas a la fabricación. En portátiles, monitores, impresoras, cámaras y videoconsolas, la garantía la gestiona directamente el fabricante con el usuario final.</p>
          <p>Para una reparación o cambio, envía el producto a portes pagados, en su embalaje original, con copia de la factura o ticket y una nota explicando la avería.</p>
        </div>
        <aside class="panel" style="padding:22px"><h2 style="font-size:20px;font-weight:800;margin-bottom:14px">Contacto</h2>${contactList()}<a class="btn btn-wa btn-block" href="https://wa.me/${WA}" target="_blank" rel="noopener">${icon('wa')}Escríbenos por WhatsApp</a></aside>
      </div>`;
    document.title = 'Envíos, devoluciones y garantía · Informática PC-RAM';
  }
  function notFound() {
    view.innerHTML = `<div class="empty" style="margin-top:24px"><h1 style="font-size:22px;margin-bottom:8px" tabindex="-1">No encontramos esta página</h1><p>Puede que el producto ya no esté disponible.</p><a class="btn btn-primary" href="#/">Volver a la tienda</a></div>`;
    document.title = 'Página no encontrada · Informática PC-RAM';
  }

  // ---------- Router ----------
  function render(keepScroll) {
    const { path, q } = parseHash();
    const samePath = state.lastPath === path;
    clearInterval(carTimer);
    if (!keepScroll) { $$('.drawer').forEach(d => { if (!d.hidden) closeDrawers(true); }); }
    let m;
    if (path === '/' || path === '') home();
    else if ((m = path.match(/^\/c\/(.+)$/))) category(m[1], q);
    else if ((m = path.match(/^\/p\/(\d+)/))) product(+m[1]);
    else if ((m = path.match(/^\/buscar\/(.*)$/))) searchPage(dec(m[1]), q);
    else if (path === '/novedades') listing({ path, q, base: [...P].sort((a, b) => b.id - a.id), relSort: true, title: 'Novedades', crumbs: [{ name: 'Novedades' }] });
    else if (path === '/menos-de-10') listing({ path, q, base: P.filter(p => p.p < 10), title: 'Por menos de 10 €', crumbs: [{ name: 'Por menos de 10 €' }] });
    else if ((m = path.match(/^\/marca\/(.+)$/))) { const b = dec(m[1]); const base = P.filter(p => p.b === b); base.length ? listing({ path, q, base, title: b, crumbs: [{ name: 'Marcas' }, { name: b }] }) : notFound(); }
    else if (path === '/cesta') cartPage();
    else if (path === '/pedido') checkout();
    else if (path === '/servicios') servicesPage();
    else if (path === '/ayuda') helpPage();
    else notFound();
    if (!path.startsWith('/buscar/')) $('#q').value = '';

    // navegación activa
    $$('#navLinks a').forEach(a => { const on = path === a.getAttribute('href').slice(1) || path.startsWith(a.getAttribute('href').slice(1) + '/'); on ? a.setAttribute('aria-current', 'page') : a.removeAttribute('aria-current'); });

    if (keepScroll) { state.lastPath = path; return; }
    if (samePath && state.lastPath !== null) {
      // cambio de filtros/página: mantener posición, devolver el foco
      if (state.focusId && document.getElementById(state.focusId)) document.getElementById(state.focusId).focus({ preventScroll: true });
      else { const tb = $('#toolbar'); if (tb) { const y = tb.getBoundingClientRect().top + scrollY - 150; if (scrollY > y) scrollTo(0, Math.max(0, y)); } }
      if (state.filtersOpen) { const fl = $('#filters'); if (fl) { fl.classList.add('open'); $('#backdrop').hidden = false; } }
    } else {
      scrollTo(0, 0);
      state.filtersOpen = false;
      if (state.lastPath !== null) { const h = $('h1[tabindex]', view) || $('#main'); h.focus({ preventScroll: true }); }
    }
    state.focusId = null;
    state.lastPath = path;
  }

  // ---------- Eventos globales ----------
  function bind() {
    document.addEventListener('click', e => {
      const t = e.target;
      let b;
      if ((b = t.closest('[data-add]'))) { addToCart(+b.dataset.add, 1); return; }
      if ((b = t.closest('[data-addq]'))) { const q = Math.max(1, parseInt($('#pq').value, 10) || 1); addToCart(+b.dataset.addq, q); return; }
      if ((b = t.closest('[data-pq]'))) { const i = $('#pq'); const p = PID[+parseHash().path.split('/')[2]]; i.value = Math.max(1, Math.min((parseInt(i.value, 10) || 1) + +b.dataset.pq, p ? maxQ(p) : 99)); return; }
      if ((b = t.closest('[data-qd]'))) {
        const id = +b.dataset.qd, d = b.dataset.d, it = cart.find(x => x.id === id); if (!it) return;
        const where = b.closest('#cartDrawer') ? '#cartDrawer' : '#view';
        setQty(id, it.q + +d);
        const target = $(`${where} [data-qd="${id}"][data-d="${d}"]`);
        if (target && !target.disabled) target.focus(); else if (target) { const inp = target.parentElement.querySelector('input'); inp && inp.focus(); }
        return;
      }
      if ((b = t.closest('[data-del]'))) { const id = +b.dataset.del; const p = PID[id]; removeItem(id); toast(`Eliminado: ${p ? p.n : 'producto'}`); const f = $('#cartDrawer:not([hidden]) [data-close]'); if (f) f.focus(); return; }
      if ((b = t.closest('[data-close]'))) { closeDrawers(); return; }
      if ((b = t.closest('[data-drill]'))) { renderCatDrawer(b.dataset.drill || null); const f = $('#catDrawerBody button, #catDrawerBody a'); f && f.focus(); return; }
      if ((b = t.closest('[data-open-cats]'))) { renderCatDrawer(null); openDrawer('catDrawer', b); return; }
      if ((b = t.closest('[data-rail]'))) { const tr = document.getElementById(b.dataset.rail); tr && tr.scrollBy({ left: +b.dataset.dir * tr.clientWidth * 0.9, behavior: reduced ? 'auto' : 'smooth' }); return; }
      if ((b = t.closest('[data-ink]'))) { state.inkBrand = b.dataset.ink; $$('[data-ink]').forEach(x => x.setAttribute('aria-pressed', String(x === b))); renderInk(); return; }
      if ((b = t.closest('[data-go-ink]'))) { const s = $('#inkfinder'); s.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' }); setTimeout(() => $('#inkq').focus({ preventScroll: true }), reduced ? 0 : 500); return; }
      if ((b = t.closest('[data-open-filters]'))) { const fl = $('#filters'); fl.classList.add('open'); state.filtersOpen = true; $('#backdrop').hidden = false; lastTrigger = b; const c = fl.querySelector('[data-close-filters]'); c && c.focus(); return; }
      if ((b = t.closest('[data-close-filters]'))) { const fl = $('#filters'); fl.classList.remove('open'); state.filtersOpen = false; $('#backdrop').hidden = true; const fb = $('[data-open-filters]'); fb && fb.focus(); return; }
      if (t.closest('#backdrop')) { closeDrawers(); return; }
      if (t.closest('#cartDrawer a[href^="#"], #catDrawer a[href^="#"]')) { closeDrawers(true); }
    });
    document.addEventListener('change', e => { const t = e.target; if (t.matches('[data-qin]')) { setQty(+t.dataset.qin, parseInt(t.value, 10) || 1); } });
    document.addEventListener('input', e => { if (e.target.id === 'inkq') { state.inkQ = e.target.value; clearTimeout(state.inkT); state.inkT = setTimeout(renderInk, 120); } });
    document.addEventListener('keydown', e => { if (e.key === 'Escape') { const open = $$('.drawer').some(d => !d.hidden) || ($('#filters') && $('#filters').classList.contains('open')); if (open) { e.preventDefault(); closeDrawers(); } } });
    $('#btnMenu').addEventListener('click', e => { renderCatDrawer(null); openDrawer('catDrawer', e.currentTarget); });
    $('#btnCats').addEventListener('click', e => { renderCatDrawer(null); openDrawer('catDrawer', e.currentTarget); });
    $('#btnCart').addEventListener('click', () => { state.justAdded = null; openCart(); });
    window.addEventListener('hashchange', () => render());
  }

  // ---------- Arranque ----------
  function init(data) {
    CATS = data.cats; CATS.forEach(c => { CAT[c.path] = c; CATSLUG[c.slug] = c; });
    P = data.products;
    for (const p of P) {
      const names = trail(p.c).map(c => c.name).join(' ');
      const base = norm([p.n, p.b, p.m, names].join(' '));
      p.h = base + ' ' + base.replace(/[-\/\.]/g, '');
      p.nn = ' ' + norm(p.n);
      PID[p.id] = p;
    }
    P.filter(p => p.s > 0).sort((a, b) => b.id - a.id).slice(0, 24).forEach(p => NEW.add(p.id));
    $('#navLinks').innerHTML = NAV.filter(k => CAT[k]).map(k => `<li><a href="${curl(CAT[k])}">${esc(SHORT[k] || CAT[k].name)}</a></li>`).join('') + `<li><a href="#/novedades">Novedades</a></li><li class="destacado"><a href="#/servicios">Servicio técnico</a></li>`;
    $('#footCats').innerHTML = ['23', '26', '80', '27', '40', '44', '104'].filter(k => CAT[k]).map(k => `<li><a href="${curl(CAT[k])}">${esc(CAT[k].name)}</a></li>`).join('');
    const mqS = matchMedia('(max-width: 760px)');
    const setPh = () => { $('#q').placeholder = mqS.matches ? '¿Qué estás buscando?' : 'Busca tinta, ratón, cable HDMI, portátil…'; };
    setPh(); mqS.addEventListener('change', setPh);
    bind(); setupSearch(); updateCartUI(); render();
  }
  fetch('data/catalogo.json').then(r => r.json()).then(init).catch(() => {
    view.innerHTML = '<div class="empty" style="margin-top:24px"><h1 style="font-size:22px">No hemos podido cargar el catálogo</h1><p>Recarga la página en unos segundos.</p></div>';
  });
})();
