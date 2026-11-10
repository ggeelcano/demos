/* La Juguetería de La Rambla · tienda online (catálogo real de lajugueteriadelarambla.com) */
(() => {
  'use strict';

  // ---------- Utilidades ----------
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const norm = s => String(s).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  const eur = v => v.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €';
  const icon = (id, cls = '') => `<svg class="icon ${cls}" aria-hidden="true" focusable="false"><use href="#i-${id}"/></svg>`;
  const WA = '34635891813';
  const waLink = t => `https://wa.me/${WA}?text=${encodeURIComponent(t)}`;
  const SHIP = 4.95;
  const PER_PAGE = 24;
  const SHOP = 'La Juguetería de La Rambla';
  const ADDR = 'C/ Barrios 46, 14540 La Rambla (Córdoba)';
  const MAPS = 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent('C/ Barrios 46, 14540 La Rambla, Córdoba');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const view = $('#view');

  const AGES = [
    { k: 'bebes', n: '0-2', u: 'años', name: 'Bebés de 0 a 2 años', short: '0-2 años', col: '#d6176f' },
    { k: '3-5', n: '3-5', u: 'años', name: 'De 3 a 5 años', short: '3-5 años', col: '#b8401c' },
    { k: '6-8', n: '6-8', u: 'años', name: 'De 6 a 8 años', short: '6-8 años', col: '#17804a' },
    { k: '9+', n: '+9', u: 'años', name: 'De 9 años en adelante', short: '+9 años', col: '#6a3fc0' },
    { k: 'coleccion', n: '★', u: 'colección', name: 'Para coleccionistas', short: 'Coleccionistas', col: '#0d1b3d' }
  ];
  const AGE = Object.fromEntries(AGES.map(a => [a.k, a]));
  const CATIMG = { '3': 108, '9': 2660, '5': 672, '8': 2330, '11': 3462, '7': 1734, '12': 4078, '6': 1092, '15': 11739, '185': 4785, '14': 4521, '4': 395, '19': 5893, '31': 11687, '10': 3303, '301': 11768, '304': 11655, '382': 11768, '383': 11540, '384': 11538, '385': 11549, '302': 11553, '305': 11554, '306': 11555, '308': 11551 };
  const CIRCLES = ['9', '5', '8', '11', '7', '15', '14', '4', '6', '3', '31', '19', '12', '10'];
  const BRAND_STYLE = {
    'LEGO': ['#e3000b', '#fff'], 'Playmobil': ['#0a64ad', '#fff'], 'Barbie': ['#d81b85', '#fff'], 'Hot Wheels': ['#ff7a1a', '#1b2430'], 'Bburago': ['#b5121b', '#fff'],
    'Disney Princess': ['#5b37b0', '#fff'], 'Clementoni': ['#0072bc', '#fff'], 'Injusa': ['#ffd23f', '#1b2430'], 'VTech': ['#0b3c7d', '#fff'], 'Barriguitas': ['#ffe9a8', '#6b4a00'],
    'Pinypon': ['#ff8cc0', '#1b2430'], 'Martinelia': ['#ffd6e8', '#8a0f47'], 'Topps': ['#1b1b1b', '#fff'], 'Panini': ['#f5b400', '#1b2430'], 'Tachan': ['#3fb8e8', '#1b2430']
  };
  const SYN = {
    muneca: ['muneca', 'barbie', 'nancy', 'barriguitas', 'princess'], munecas: ['muneca', 'barbie', 'nancy', 'barriguitas', 'princess'], coche: ['coche', 'vehiculo', 'burago'], coches: ['coche', 'vehiculo', 'burago'],
    cromos: ['cromo', 'cartas', 'card'], cromo: ['cromo', 'card'], cartas: ['carta', 'card', 'cromo'], patinete: ['patinete', 'scooter'], patinetes: ['patinete', 'scooter'], scooter: ['scooter', 'patinete'],
    bici: ['bicicleta', 'balance bike'], bicicleta: ['bicicleta'], puzle: ['puzzle'], puzles: ['puzzle'], puzzles: ['puzzle'], peluches: ['peluche'], juegos: ['juego'], moto: ['moto', 'correpasillo'],
    correpasillos: ['correpasillo'], bebe: ['bebe', 'baby', 'sonajero'], bebes: ['bebe', 'baby', 'sonajero'], futbol: ['futbol', 'balon'], maquillaje: ['maquillaje', 'martinelia', 'esmalte'],
    figuras: ['figura'], dinosaurio: ['dinosaurio', 'triceratops'], cocina: ['cocina'], pista: ['pista', 'scalextric'], legos: ['lego'], barbies: ['barbie']
  };

  let CATS = [], CAT = {}, CATSLUG = {}, P = [], PID = {}, DESC = null, descLoading = null, BRANDS = [];
  let carTimer = null;
  const state = { filtersOpen: false, focusId: null, lastPath: null, justAdded: null };

  // ---------- Cesta y carta ----------
  const KEY = 'jdlr_cesta_v1', KEYW = 'jdlr_carta_v1';
  let cart = [], wish = [];
  try { cart = JSON.parse(localStorage.getItem(KEY) || '[]').filter(i => i && i.id && i.q > 0); } catch (e) { cart = []; }
  try { wish = JSON.parse(localStorage.getItem(KEYW) || '[]').filter(Number.isFinite); } catch (e) { wish = []; }
  const saveCart = () => { try { localStorage.setItem(KEY, JSON.stringify(cart)); } catch (e) { } };
  const saveWish = () => { try { localStorage.setItem(KEYW, JSON.stringify(wish)); } catch (e) { } };
  const cartItems = () => cart.map(i => ({ ...i, p: PID[i.id] })).filter(i => i.p);
  const cartCount = () => cartItems().reduce((a, i) => a + i.q, 0);
  const cartSub = () => cartItems().reduce((a, i) => a + i.q * i.p.p, 0);
  const unique = p => ['382', '383', '384', '385'].some(c => p.cs.includes(c));
  const maxQ = p => unique(p) ? 1 : 10;

  function addToCart(id, q = 1, silent) {
    const p = PID[id]; if (!p) return;
    const it = cart.find(i => i.id === id);
    if (it) it.q = Math.min(it.q + q, maxQ(p)); else cart.push({ id, q: Math.min(q, maxQ(p)) });
    saveCart(); state.justAdded = id; updateCartUI();
    if (!silent) { openCart(); announce(`Añadido a la cesta: ${p.n}`); }
  }
  function setQty(id, q) {
    const p = PID[id]; const it = cart.find(i => i.id === id); if (!it || !p) return;
    it.q = Math.max(1, Math.min(q, maxQ(p)));
    saveCart(); updateCartUI();
  }
  function removeItem(id) { cart = cart.filter(i => i.id !== id); saveCart(); updateCartUI(); }

  function toggleWish(id) {
    const p = PID[id]; if (!p) return;
    const on = !wish.includes(id);
    wish = on ? [...wish, id] : wish.filter(x => x !== id);
    saveWish(); updateWishUI();
    toast(on ? 'Añadido a tu carta a los Reyes' : 'Quitado de tu carta');
    if (parseHash().path === '/carta') { const y = scrollY; render(true); scrollTo(0, y); }
  }
  function updateWishUI() {
    const n = wish.length, b = $('#wishCount'); b.textContent = n; b.dataset.n = n;
    $('#btnWish').setAttribute('aria-label', n ? `Mi carta a los Reyes: ${n} ${n === 1 ? 'juguete' : 'juguetes'}` : 'Mi carta a los Reyes, vacía');
    $$('[data-wish]').forEach(el => { const on = wish.includes(+el.dataset.wish); el.setAttribute('aria-pressed', String(on)); });
  }

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
    const mq = maxQ(i.p);
    return `<div class="qty" role="group" aria-label="Cantidad de ${esc(i.p.n)}">
      <button type="button" data-qd="${i.id}" data-d="-1" aria-label="Quitar una unidad" ${i.q <= 1 ? 'disabled' : ''}>${icon('minus')}</button>
      <input type="number" inputmode="numeric" min="1" max="${mq}" value="${i.q}" data-qin="${i.id}" id="q${small ? 'd' : 'c'}${i.id}" aria-label="Unidades">
      <button type="button" data-qd="${i.id}" data-d="1" aria-label="Añadir una unidad" ${i.q >= mq ? 'disabled' : ''}>${icon('plus')}</button></div>`;
  }

  function renderCartDrawer() {
    const items = cartItems(), body = $('#cartDrawerBody'), foot = $('#cartDrawerFoot');
    if (!items.length) {
      body.innerHTML = `<div class="empty" style="border:0"><h2>Tu cesta está vacía</h2><p>Hay más de 350 juguetes esperándote.</p><button class="btn btn-primary" type="button" data-close>Seguir mirando</button></div>`;
      foot.innerHTML = ''; foot.hidden = true; return;
    }
    foot.hidden = false;
    const added = state.justAdded && PID[state.justAdded];
    body.innerHTML = (added ? `<div class="added">${icon('check')}¡Juguete añadido a tu cesta!</div>` : '') + items.map(i => `
      <div class="ci-mini"><img src="img/p/${i.id}.jpg" alt="${esc(i.p.n)}" width="70" height="70" loading="lazy">
        <div><a class="n" href="${purl(i.p)}">${esc(i.p.n)}</a>
          <div class="row">${qtyCtrl(i, true)}<b>${eur(i.q * i.p.p)}</b></div>
          <button class="del" type="button" data-del="${i.id}">${icon('trash')}Eliminar<span class="sr-only"> ${esc(i.p.n)}</span></button>
        </div></div>`).join('');
    foot.innerHTML = `<div class="sum-row total" style="margin:0;border:0;padding:0"><span>Subtotal</span><span>${eur(cartSub())}</span></div>
      <p class="sum-note" style="margin:0">Recogida gratis en la tienda de La Rambla o envío en 24-72 h laborables.</p>
      <a class="btn btn-primary btn-lg btn-block" href="#/pedido">Tramitar pedido</a>
      <a class="btn btn-outline btn-block" href="#/cesta">Ver la cesta</a>`;
  }

  // ---------- Cajones ----------
  let lastTrigger = null;
  function openDrawer(id, trigger) {
    closeDrawers(true); closeMegas();
    const d = document.getElementById(id); if (!d) return;
    lastTrigger = trigger || document.activeElement;
    d.hidden = false; $('#backdrop').hidden = false;
    document.body.style.overflow = 'hidden';
    ['header', 'main', 'footer', '.promo-strip', '.assure'].forEach(s => { const el = $(s); if (el) el.inert = true; });
    $$('[aria-controls="' + id + '"]').forEach(b => b.setAttribute('aria-expanded', 'true'));
    const f = d.querySelector('[data-close]'); if (f) f.focus();
  }
  function closeDrawers(silent) {
    let was = false;
    $$('.drawer').forEach(d => { if (!d.hidden) { was = true; d.hidden = true; $$('[aria-controls="' + d.id + '"]').forEach(b => b.setAttribute('aria-expanded', 'false')); } });
    const fl = $('#filters'); if (fl && fl.classList.contains('open')) { fl.classList.remove('open'); was = true; state.filtersOpen = false; }
    $('#backdrop').hidden = true; document.body.style.overflow = '';
    ['header', 'main', 'footer', '.promo-strip', '.assure'].forEach(s => { const el = $(s); if (el) el.inert = false; });
    if (was && !silent && lastTrigger && document.contains(lastTrigger)) lastTrigger.focus();
    state.justAdded = null;
  }
  const openCart = () => { renderCartDrawer(); openDrawer('cartDrawer', $('#btnCart')); };

  const catIco = k => { const pid = CATIMG[k] || (P.find(p => p.cs.includes(k)) || {}).id; const bg = ['bg1', 'bg2', 'bg3', 'bg4', 'bg5', 'bg6', 'bg7'][(+k || 3) % 7]; return `<span class="dico ${bg}">${pid ? `<img src="img/p/${pid}.jpg" alt="" width="34" height="34" loading="lazy">` : icon('star')}</span>`; };
  function renderCatDrawer(key) {
    const b = $('#catDrawerBody');
    if (!key) {
      b.innerHTML = `<ul class="dlist">
          <li><a href="#/novedades"><span class="dico bg3">${icon('star')}</span>Novedades</a></li>
          <li><button type="button" data-drill="juguetes">${catIco('9')}Juguetes${icon('right', 'chev')}</button></li>
          <li><button type="button" data-drill="301">${catIco('301')}Coleccionismo${icon('right', 'chev')}</button></li>
          <li><button type="button" data-drill="edades"><span class="dico bg4">${icon('cake')}</span>Por edades${icon('right', 'chev')}</button></li>
          <li><button type="button" data-drill="marcas"><span class="dico bg2">${icon('star')}</span>Marcas${icon('right', 'chev')}</button></li>
          <li><a href="#/ofertas"><span class="dico bg1">${icon('gift')}</span>Ofertas</a></li>
          <li><a href="#/regalos"><span class="dico bg5">${icon('search')}</span>Buscador de regalos</a></li>
          <li><a href="#/carta"><span class="dico bg1">${icon('heart')}</span>Mi carta a los Reyes</a></li>
        </ul>
        <div class="drawer-extra"><ul class="dlist">
          <li><a href="#/tienda">${icon('pin')}Nuestra tienda en La Rambla</a></li>
          <li><a href="#/ayuda">${icon('truck')}Envíos y devoluciones</a></li>
          <li><a href="https://wa.me/${WA}" target="_blank" rel="noopener">${icon('wa')}WhatsApp 635 891 813</a></li>
          <li><a href="tel:+34635891813">${icon('phone')}Llamar a la tienda</a></li>
        </ul></div>`;
      $('#catDrawerTitle').textContent = 'Menú';
      return;
    }
    const back = to => `<button class="dback" type="button" data-drill="${to}">${icon('left')}${to && CAT[to] ? esc(CAT[to].name) : 'Menú'}</button>`;
    if (key === 'edades') {
      b.innerHTML = `${back('')}<div class="dsub-title">Por edades</div><ul class="dlist">${AGES.map(a => `<li><a href="#/edad/${a.k}"><span class="dico" style="background:${a.col};color:#fff;font-weight:900;font-size:12px">${esc(a.n)}</span>${esc(a.name)}<small>${countAge(a.k)}</small></a></li>`).join('')}</ul>`;
      $('#catDrawerTitle').textContent = 'Edades'; return;
    }
    if (key === 'marcas') {
      b.innerHTML = `${back('')}<div class="dsub-title">Marcas</div><ul class="dlist">${BRANDS.map(([n, c]) => `<li><a href="#/marca/${encodeURIComponent(n)}">${esc(n)}<small>${c}</small></a></li>`).join('')}</ul>`;
      $('#catDrawerTitle').textContent = 'Marcas'; return;
    }
    const c = CAT[key];
    b.innerHTML = `${back(c.parent || '')}
      <div class="dsub-title">${esc(c.name)}</div>
      <ul class="dlist"><li><a href="${curl(c)}"><b>Ver todo ${esc(c.name.toLowerCase())}</b><small>${c.count}</small></a></li>${c.children.map(k => { const s = CAT[k]; return `<li>${s.children.length
        ? `<button type="button" data-drill="${k}">${catIco(k)}${esc(s.name)}<small>${s.count}</small>${icon('right', 'chev')}</button>`
        : `<a href="${curl(s)}">${catIco(k)}${esc(s.name)}<small>${s.count}</small></a>`}</li>`; }).join('')}</ul>`;
    $('#catDrawerTitle').textContent = c.name;
  }

  // ---------- Menú desplegable de escritorio ----------
  function closeMegas(except) {
    $$('.nav-list [aria-controls^="mega-"]').forEach(b => { if (b === except) return; b.setAttribute('aria-expanded', 'false'); const m = document.getElementById(b.getAttribute('aria-controls')); if (m) m.hidden = true; });
  }
  function megaHtml(kind) {
    if (kind === 'juguetes' || kind === '301') {
      const c = CAT[kind];
      const feat = kind === 'juguetes'
        ? `<a class="mega-feat" href="#/novedades" style="background:#0b54b8"><img src="img/p/2313.jpg" alt="" width="170" height="170" loading="lazy"><span>Novedades</span><b>Lo último que ha llegado a la tienda</b></a>`
        : `<a class="mega-feat" href="${curl(CAT['382'] || c)}"><img src="img/p/11768.jpg" alt="" width="170" height="170" loading="lazy"><span>Slabs gradeados</span><b>Cartas PSA, SGC y MGC</b></a>`;
      return `<div class="mega-in"><div><h3><a href="${curl(c)}" style="color:inherit">${esc(c.name)}</a></h3><ul class="mega-cols">${c.children.map(k => { const s = CAT[k]; return `<li><a href="${curl(s)}">${esc(s.name)}<small>${s.count}</small></a>${s.children.length ? `<ul class="mega-sub">${s.children.map(x => `<li><a href="${curl(CAT[x])}">${esc(CAT[x].name)}<small>${CAT[x].count}</small></a></li>`).join('')}</ul>` : ''}</li>`; }).join('')}</ul></div>${feat}</div>`;
    }
    if (kind === 'edades') return `<div class="mega-in" style="grid-template-columns:1fr"><div><h3>¿Para qué edad buscas?</h3><div class="mega-ages">${AGES.map(ageCircle).join('')}</div></div></div>`;
    if (kind === 'marcas') return `<div class="mega-in" style="grid-template-columns:1fr"><div><h3>Marcas</h3><ul class="mega-brands">${BRANDS.map(([n, c]) => `<li class="mega-cols" style="columns:1"><a href="#/marca/${encodeURIComponent(n)}">${esc(n)}<small>${c}</small></a></li>`).join('')}</ul></div></div>`;
    return '';
  }
  function setupNav() {
    const item = (label, kind) => `<li><button type="button" aria-expanded="false" aria-controls="mega-${kind}">${label}${icon('down')}</button><div class="mega" id="mega-${kind}" hidden>${megaHtml(kind)}</div></li>`;
    $('#navList').innerHTML = `<li><a href="#/novedades">Novedades</a></li>${item('Juguetes', 'juguetes')}${item('Coleccionismo', '301')}${item('Edades', 'edades')}${item('Marcas', 'marcas')}<li><a href="#/ofertas">Ofertas</a></li><li><a href="#/regalos">Buscador de regalos</a></li><li class="nav-pill"><a href="#/carta">${icon('heart')}Mi carta a los Reyes</a></li>`;
    $('#quickList').innerHTML = [['#/novedades', 'Novedades'], ['#/c/juguetes', 'Juguetes'], ['#/c/coleccionismo', 'Coleccionismo'], ['#/regalos', 'Por edad'], ['#/ofertas', 'Ofertas'], ['#/carta', 'Mi carta', 'hot'], ['#/tienda', 'Tienda']].map(([h, t, c]) => `<li><a href="${h}"${c ? ` class="${c}"` : ''}>${t}</a></li>`).join('');
    const nav = $('#navList');
    let hoverT = null;
    const fine = matchMedia('(hover: hover) and (pointer: fine)');
    const open = b => { closeMegas(b); b.setAttribute('aria-expanded', 'true'); document.getElementById(b.getAttribute('aria-controls')).hidden = false; };
    nav.addEventListener('click', e => {
      const b = e.target.closest('button[aria-controls^="mega-"]');
      if (b) { b.getAttribute('aria-expanded') === 'true' ? closeMegas() : open(b); return; }
      if (e.target.closest('.mega a')) closeMegas();
    });
    $$('#navList > li').forEach(li => {
      const b = li.querySelector('button[aria-controls]');
      li.addEventListener('mouseenter', () => { if (!fine.matches) return; clearTimeout(hoverT); hoverT = setTimeout(() => { if (b) open(b); else closeMegas(); }, 140); });
      li.addEventListener('mouseleave', () => { if (!fine.matches) return; clearTimeout(hoverT); hoverT = setTimeout(() => closeMegas(), 220); });
    });
    nav.addEventListener('keydown', e => { if (e.key === 'Escape') { const b = $('#navList button[aria-expanded="true"]'); if (b) { e.preventDefault(); closeMegas(); b.focus(); } } });
    nav.addEventListener('focusout', () => setTimeout(() => { if (!nav.contains(document.activeElement)) closeMegas(); }, 50));
    document.addEventListener('click', e => { if (!e.target.closest('#navList')) closeMegas(); });
  }

  // ---------- Avisos ----------
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
  function go(path, params) { const qs = params ? params.toString() : ''; location.hash = '#' + path + (qs ? '?' + qs : ''); }
  const inCat = (p, id) => p.cs.includes(id);
  const trail = id => { const out = []; let c = CAT[id]; while (c) { out.unshift(c); c = c.parent ? CAT[c.parent] : null; } return out; };
  const countAge = k => P.filter(p => p.ag === k).length;
  const ageText = m => m === null || m === undefined ? '' : m < 24 ? (m === 0 ? 'Desde el nacimiento' : `Desde ${m} meses`) : `Desde ${Math.round(m / 12)} años`;

  // ---------- Piezas de interfaz ----------
  const priceHtml = v => `<span class="price">${eur(v)}</span>`;
  function card(p, dark) {
    const tags = [p.nw ? '<span class="tag tag-new">Novedad</span>' : '', p.of ? '<span class="tag tag-of">Oferta</span>' : ''].join('');
    return `<article class="card${dark ? ' dark' : ''}">
      <a class="card-img" href="${purl(p)}" tabindex="-1" aria-hidden="true"><img src="img/p/${p.id}.jpg" alt="" loading="lazy" decoding="async" width="400" height="400">${tags ? `<span class="tags">${tags}</span>` : ''}</a>
      <button class="heart" type="button" data-wish="${p.id}" aria-pressed="${wish.includes(p.id)}" aria-label="Añadir a mi carta a los Reyes: ${esc(p.n)}">${icon('heart')}</button>
      <div class="card-body">
        <span class="card-brand">${p.b ? esc(p.b) : (p.a !== null ? esc(ageText(p.a)) : '&nbsp;')}</span>
        <h3 class="card-title"><a href="${purl(p)}">${esc(p.n)}</a></h3>
        <div class="card-foot">${priceHtml(p.p)}<button class="add" type="button" data-add="${p.id}" aria-label="Añadir a la cesta: ${esc(p.n)}">${icon('bag')}<span class="plus" aria-hidden="true">+</span></button></div>
      </div></article>`;
  }
  function rowscroll(id, inner, label) {
    return `<div class="rowscroll"><button class="rs-nav prev" type="button" data-rs="${id}" data-dir="-1" aria-label="Ver anteriores${label ? ': ' + label : ''}">${icon('left')}</button>
      <div class="rs-track" id="${id}">${inner}</div>
      <button class="rs-nav next" type="button" data-rs="${id}" data-dir="1" aria-label="Ver siguientes${label ? ': ' + label : ''}">${icon('right')}</button></div>`;
  }
  function crumbs(list) {
    return `<nav aria-label="Estás en"><ol class="crumbs" style="list-style:none;padding:0"><li><a href="#/">Inicio</a></li>${list.map((c, i) => `<li>${i === list.length - 1 ? `<span aria-current="page">${esc(c.name)}</span>` : `<a href="${c.href}">${esc(c.name)}</a>`}</li>`).join('')}</ol></nav>`;
  }
  const payChips = () => `<div class="pay-chips" aria-label="Formas de pago"><span class="pay visa">VISA</span><span class="pay mc"><i></i><i></i>Mastercard</span><span class="pay bizum">bizum</span><span class="pay paypal">Pay<em>Pal</em></span><span class="pay apple">Apple Pay</span><span class="pay gpay">Google Pay</span></div>`;
  function ageCircle(a) {
    return `<a class="circ" href="#/edad/${a.k}"><span class="c age" style="background:${a.col}" aria-hidden="true">${esc(a.n)}<small>${esc(a.u)}</small></span><span>${esc(a.name)}</span></a>`;
  }
  function catCircle(k, i) {
    const c = CAT[k]; if (!c) return '';
    const pid = CATIMG[k] || (P.find(p => inCat(p, k)) || {}).id;
    return `<a class="circ" href="${curl(c)}"><span class="c bg${(i % 7) + 1}" aria-hidden="true"><img src="img/p/${pid}.jpg" alt="" width="110" height="110" loading="lazy"></span><span>${esc(c.name)}</span></a>`;
  }
  function brandTile([n, c]) {
    const [bg, fg] = BRAND_STYLE[n] || ['#e8f0fc', '#0b54b8'];
    return `<a class="brand-tile" href="#/marca/${encodeURIComponent(n)}" style="background:${bg};color:${fg}">${esc(n)}<small>${c} ${c === 1 ? 'producto' : 'productos'}</small></a>`;
  }

  // ---------- Buscador ----------
  function search(q) {
    const toks = norm(q).replace(/[^a-z0-9ñ\-\/\.\s+:]/g, ' ').split(/\s+/).filter(Boolean);
    if (!toks.length) return [];
    const alts = toks.map(t => {
      const a = new Set([t, ...(SYN[t] || [])]);
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
      if (p.nn.startsWith(' ' + toks[0])) score += 2;
      if (p.nw) score += 1;
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
      const brands = BRANDS.filter(([b]) => norm(b).includes(nq)).slice(0, 2);
      let h = '', n = 0;
      if (cats.length || brands.length) h += `<div class="sugg-h">Categorías y marcas</div>` + cats.map(c => `<a class="sugg-opt" role="option" id="sg${n++}" href="${curl(c)}" aria-selected="false"><span class="t">${highlight(c.name, q)}${c.parent ? ` <small style="color:var(--texto-3)">en ${esc(CAT[c.parent].name)}</small>` : ''}</span></a>`).join('') + brands.map(([b, c]) => `<a class="sugg-opt" role="option" id="sg${n++}" href="#/marca/${encodeURIComponent(b)}" aria-selected="false"><span class="t">${highlight(b, q)} <small style="color:var(--texto-3)">marca · ${c}</small></span></a>`).join('');
      if (res.length) h += `<div class="sugg-h">Juguetes</div>` + res.slice(0, 6).map(p => `<a class="sugg-opt" role="option" id="sg${n++}" href="${purl(p)}" aria-selected="false"><img src="img/p/${p.id}.jpg" alt="" width="46" height="46"><span class="t">${highlight(p.n, q)}</span><span class="p">${eur(p.p)}</span></a>`).join('');
      if (!cats.length && !brands.length && !res.length) h = `<div class="sugg-empty">No encontramos «${esc(q)}». Prueba con otra palabra o <a href="${waLink(`Hola, busco: ${q}`)}" target="_blank" rel="noopener">pregúntanos por WhatsApp</a>: si no lo tenemos, lo buscamos.</div>`;
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
    form.addEventListener('submit', e => { e.preventDefault(); const q = input.value.trim(); if (!q) return; close(); input.blur(); go('/buscar/' + encodeURIComponent(q)); });
    box.addEventListener('click', e => { if (e.target.closest('a')) { close(); input.blur(); } });
    document.addEventListener('click', e => { if (!form.contains(e.target)) close(); });
    form.addEventListener('focusout', () => setTimeout(() => { if (!form.contains(document.activeElement)) close(); }, 120));
  }

  // ---------- Portada ----------
  function sticker(id, cls, style, tag) {
    const p = PID[id]; if (!p) return '';
    return `<a class="sticker ${cls}" href="${purl(p)}" style="${style}" tabindex="-1" aria-hidden="true"><img src="img/p/${cls.includes('card') ? p.id + '_0' : p.id}.jpg" alt="" width="400" height="400"></a>${tag ? `<span class="price-tag" style="${tag}"><small>por</small>${eur(p.p)}</span>` : ''}`;
  }
  function home() {
    const nonC = P.filter(p => !inCat(p, '301'));
    const news = nonC.filter(p => p.nw).sort((a, b) => b.id - a.id).slice(0, 16);
    const offers = P.filter(p => p.of).sort((a, b) => b.id - a.id);
    const colec = P.filter(p => inCat(p, '301')).sort((a, b) => (inCat(b, '382') - inCat(a, '382')) || b.id - a.id).slice(0, 16);
    const small = (() => { const seen = {}, out = []; const newIds = new Set(news.map(x => x.id)); for (const p of [...nonC].filter(x => !newIds.has(x.id)).sort((a, b) => b.id - a.id)) { if (p.p <= 15 && (seen[p.c] || 0) < 2) { seen[p.c] = (seen[p.c] || 0) + 1; out.push(p); } if (out.length >= 16) break; } return out; })();
    const figs = P.filter(p => /figura 20cm/i.test(p.n));
    const aire = P.filter(p => inCat(p, '4'));
    const minOf = l => l.length ? Math.min(...l.map(p => p.p)) : null;
    const cheapC = minOf(P.filter(p => inCat(p, '301'))), topC = Math.max(...P.filter(p => inCat(p, '301')).map(p => p.p));
    const brandsShown = ['LEGO', 'Playmobil', 'Barbie', 'Hot Wheels', 'Bburago', 'Disney Princess', 'Clementoni', 'Injusa', 'VTech', 'Barriguitas', 'Pinypon', 'Martinelia', 'Topps', 'Panini'].map(b => BRANDS.find(x => x[0] === b)).filter(Boolean);
    const slides = [
      { cls: 's-navidad', k: 'Navidad 2026', h: 'Los juguetes de la carta, ya en La Rambla', p: 'LEGO, Playmobil, Barbie, correpasillos y juegos de mesa. Te lo enviamos en 24-72 h o lo recoges gratis en la tienda.', cta: [['#/c/juguetes', 'Ver juguetes', 'btn-yellow'], ['#/carta', 'Hacer mi carta', 'btn-outline']],
        art: sticker(2660, 'arch', 'left:2%;top:4%;width:46%;height:92%', '') + sticker(2313, 'round', 'right:4%;top:0;width:44%;aspect-ratio:1', 'right:2%;top:38%') + sticker(376, 'round', 'right:20%;bottom:-4%;width:34%;aspect-ratio:1', 'left:40%;bottom:6%') },
      { cls: 's-cracks', k: 'Recién llegadas', h: 'Las figuras de tus cracks', p: 'Lamine Yamal, Pedri, Raphinha, Mbappé, Bellingham, Messi, Cristiano y Haaland. Figuras articuladas de 20 cm.', desde: minOf(figs), cta: [['#/buscar/' + encodeURIComponent('figura articulada'), 'Ver las figuras', 'btn-yellow']],
        art: sticker(11692, 'round', 'left:0;top:10%;width:36%;aspect-ratio:1') + sticker(11694, 'round', 'left:32%;top:0;width:38%;aspect-ratio:1') + sticker(11699, 'round', 'right:0;top:22%;width:36%;aspect-ratio:1') + sticker(11702, 'round', 'left:24%;bottom:-2%;width:30%;aspect-ratio:1') },
      { cls: 's-colec', k: 'Coleccionismo', h: 'Cartas gradeadas, numeradas y <b>autógrafos originales</b>', p: `Slabs PSA, SGC y MGC, parches de camiseta y cromos de La Liga 25-26. Desde ${eur(cheapC)} hasta ${eur(topC)}.`, cta: [['#/c/coleccionismo', 'Entrar al rincón del coleccionista', 'btn-yellow']],
        art: sticker(11766, 'card', 'left:2%;top:8%;width:34%;aspect-ratio:1;transform:rotate(-8deg)') + sticker(11768, 'card', 'left:32%;top:0;width:38%;aspect-ratio:1;z-index:1') + sticker(11671, 'card', 'right:0;top:12%;width:34%;aspect-ratio:1;transform:rotate(7deg)', 'left:38%;bottom:4%') },
      { cls: 's-ruedas', k: 'Aire libre', h: 'Correpasillos, patinetes y bicis', p: 'Injusa, Smoby y Mondo para estrenar en el parque, con tus personajes favoritos.', desde: minOf(aire), cta: [['#/c/aire-libre', 'Ver aire libre', 'btn-primary']],
        art: sticker(395, 'round', 'left:0;top:6%;width:44%;aspect-ratio:1', 'left:4%;bottom:8%') + sticker(11722, 'round', 'right:2%;top:0;width:40%;aspect-ratio:1') + sticker(453, 'arch', 'left:42%;bottom:-2%;width:24%;height:62%') }
    ];
    const pb = (cls, k, b, href, go, ids) => `<a class="pbanner ${cls}" href="${href}"><div class="tx"><span class="k">${k}</span><b>${b}</b><span class="go">${go}${icon('right')}</span></div><div class="art" aria-hidden="true">${ids.map((id, i) => `<img src="img/p/${id}.jpg" alt="" width="150" height="150" loading="lazy" style="${i ? 'right:4%;bottom:0' : 'left:0;top:0'}">`).join('')}</div></a>`;

    view.innerHTML = `
      <h1 class="sr-only">La Juguetería de La Rambla: juguetes y coleccionismo en La Rambla (Córdoba)</h1>
      <section class="hero" aria-roledescription="carrusel" aria-label="Destacados">
        <div class="slides">${slides.map((s, i) => `<div class="slide ${s.cls}${i === 0 ? ' on' : ''}" role="group" aria-roledescription="diapositiva" aria-label="${i + 1} de ${slides.length}"${i ? ' aria-hidden="true"' : ''}>
          <div class="slide-in"><div><span class="kicker">${s.k}</span><h2>${s.h}</h2><p>${s.p}</p>${s.desde ? `<p class="desde">Desde <b>${eur(s.desde)}</b></p>` : ''}<div class="btn-row">${s.cta.map(([h, t, c]) => `<a class="btn btn-lg ${c}" href="${h}"${i ? ' tabindex="-1"' : ''}>${t}</a>`).join('')}</div></div>
          <div class="slide-art">${s.art}</div></div></div>`).join('')}</div>
        <button class="car-arrow prev" type="button" data-car="prev" aria-label="Diapositiva anterior">${icon('left')}</button><button class="car-arrow next" type="button" data-car="next" aria-label="Diapositiva siguiente">${icon('right')}</button>
        <div class="car-ui">${slides.map((s, i) => `<button class="car-dot" type="button" data-car="${i}" aria-label="Ver diapositiva ${i + 1}: ${esc(s.h.replace(/<[^>]+>/g, ''))}" aria-current="${i === 0}"></button>`).join('')}<button class="car-btn" type="button" data-car="toggle"></button></div>
      </section>

      <div class="wrap">
        <section class="sec promo2" aria-label="Promociones">
          ${pb('pb-rosa', 'Muñecas', 'Barbie, Princesas Disney, Barriguitas y Nancy', curl(CAT['9']), 'Ver muñecas', [2809, 2696])}
          ${pb('pb-azul', 'Coches de metal', 'Bburago y Maisto a escala 1:18 y 1:24', curl(CAT['14']), 'Ver la colección', [4521, 11720])}
        </section>

        <section class="sec" aria-labelledby="h-marcas"><h2 class="sec-title" id="h-marcas"><span>Las marcas más buscadas</span></h2>
          ${rowscroll('rs-marcas', brandsShown.map(brandTile).join(''), 'marcas')}</section>
      </div>

      <div class="band"><div class="wrap"><section class="sec" aria-labelledby="h-nov"><h2 class="sec-title" id="h-nov"><span>Novedades en la juguetería</span></h2>
        ${rowscroll('rs-nov', news.map(p => card(p)).join(''), 'novedades')}
        <div class="sec-cta"><a class="btn btn-primary btn-lg" href="#/novedades">Ver todas las novedades</a></div></section></div></div>

      <div class="wrap">
        <section class="sec" aria-labelledby="h-cats"><h2 class="sec-title" id="h-cats"><span>Juguetes para cada aventura</span></h2>
          ${rowscroll('rs-cats', CIRCLES.map(catCircle).join(''), 'categorías')}</section>
      </div>

      ${offers.length ? `<div class="band"><div class="wrap"><section class="sec" aria-labelledby="h-of"><h2 class="sec-title" id="h-of"><span>Ofertas de la tienda</span></h2>
        ${rowscroll('rs-of', offers.map(p => card(p)).join(''), 'ofertas')}
        <div class="sec-cta"><a class="btn btn-pink btn-lg" href="#/ofertas">Ver todas las ofertas</a></div></section></div></div>` : ''}

      <div class="wrap">
        <section class="sec" aria-labelledby="h-age"><h2 class="sec-title" id="h-age"><span>¿Para qué edad buscas?</span></h2>
          ${rowscroll('rs-age', AGES.map(ageCircle).join(''), 'edades')}
          <div class="sec-cta"><a class="btn btn-pink btn-lg" href="#/regalos">${icon('gift')}Buscador de regalos</a></div></section>
      </div>

      <section class="colec" aria-labelledby="h-col"><div class="wrap">
        <div class="colec-head"><div><h2 id="h-col">El rincón del <b>coleccionista</b></h2>
          <p>Cartas gradeadas por PSA, SGC o MGC, numeradas, con autógrafo original o con trozo de camiseta. Y sobres y cromos sueltos de la temporada.</p>
          <nav class="chips" aria-label="Coleccionismo">${['382', '383', '384', '385', '302', '305', '306'].filter(k => CAT[k]).map(k => `<a href="${curl(CAT[k])}">${esc(CAT[k].name)}</a>`).join('')}</nav></div>
          <a class="btn btn-yellow btn-lg" href="#/c/coleccionismo">Ver todo el coleccionismo</a></div>
        ${rowscroll('rs-col', colec.map(p => card(p, true)).join(''), 'coleccionismo')}
      </div></section>

      <div class="wrap">
        <section class="sec promo2" aria-label="Más promociones">
          ${pb('pb-amar', 'LEGO', 'Speed Champions F1, City, Creator y Pokémon', curl(CAT['8']), 'Ver LEGO', [2532, 2330])}
          ${pb('pb-verde', 'Juegos de mesa', 'Para jugar en familia estas fiestas', curl(CAT['7']), 'Ver juegos', [1725, 11727])}
        </section>
      </div>

      <div class="band"><div class="wrap"><section class="sec" aria-labelledby="h-small"><h2 class="sec-title" id="h-small"><span>Detalles por menos de 15 €</span></h2>
        ${rowscroll('rs-small', small.map(p => card(p)).join(''), 'detalles por menos de 15 euros')}
        <div class="sec-cta"><a class="btn btn-primary btn-lg" href="#/c/juguetes?max=15">Ver más detalles</a></div></section></div></div>

      <div class="wrap">
        <section class="sec tiles4" aria-label="Accesos">
          <a class="tile t-rosa" href="#/ofertas">Ofertas<small>${offers.length} juguetes con precio especial</small>${icon('gift')}</a>
          <a class="tile t-azul" href="#/c/coleccionismo">Coleccionismo<small>Slabs, numeradas y autógrafos</small>${icon('cards')}</a>
          <a class="tile t-naranja" href="#/carta">Carta a los Reyes<small>Hazla y compártela por WhatsApp</small>${icon('heart')}</a>
          <a class="tile t-verde" href="#/regalos">Buscador de regalos<small>Por edad y presupuesto</small>${icon('search')}</a>
        </section>

        <section class="sec" aria-label="Ventajas de comprar en la tienda"><ul class="services">
          <li><span class="ic">${icon('store')}</span><b>Recogida gratis</b><span>Compra online y recógelo en la tienda de C/ Barrios 46.</span></li>
          <li><span class="ic">${icon('truck')}</span><b>Envío en 24-72 h</b><span>En días laborables, a toda la península.</span></li>
          <li><span class="ic">${icon('return')}</span><b>Devolución sencilla</b><span>En los 14 días siguientes, en tienda o desde casa.</span></li>
          <li><span class="ic">${icon('wa')}</span><b>Atención cercana</b><span>Te ayudamos por teléfono, WhatsApp o correo.</span></li>
        </ul></section>

        <section class="sec" aria-labelledby="h-visit">${visitBlock('h-visit')}</section>
      </div>`;
    setupCarousel();
    document.title = `${SHOP} · Tienda de juguetes y coleccionismo en La Rambla (Córdoba)`;
  }
  function visitBlock(hid) {
    return `<div class="visit"><div class="visit-tx"><h2 id="${hid}">Ven a conocernos</h2>
        <ul><li>${icon('pin')}<span>${ADDR}</span></li>
          <li>${icon('phone')}<a href="tel:+34635891813">635 891 813</a></li>
          <li>${icon('mail')}<a href="mailto:lajugueteriadelarambla@hotmail.com" style="overflow-wrap:anywhere">lajugueteriadelarambla@hotmail.com</a></li>
          <li>${icon('insta')}<a href="https://www.instagram.com/lajugueteria.delarambla" target="_blank" rel="noopener">@lajugueteria.delarambla</a></li></ul>
        <div class="btn-row" style="position:relative;z-index:1;margin-top:6px"><a class="btn btn-primary" href="${MAPS}" target="_blank" rel="noopener">${icon('pin')}Cómo llegar</a><a class="btn btn-wa" href="https://wa.me/${WA}" target="_blank" rel="noopener">${icon('wa')}WhatsApp</a></div>
        <img class="duende" src="img/duende.png" alt="" width="200" height="236" loading="lazy"></div>
      <div class="map"><iframe title="Mapa: ${esc(ADDR)}" src="https://maps.google.com/maps?q=${encodeURIComponent('Calle Barrios 46, 14540 La Rambla, Córdoba')}&z=16&output=embed" loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe></div></div>`;
  }

  function setupCarousel() {
    clearInterval(carTimer); carTimer = null;
    const car = $('.hero'); if (!car) return;
    const slides = $$('.slide', car), dots = $$('.car-dot', car), tog = $('[data-car=toggle]', car);
    let i = 0, playing = !reduced, hover = false;
    const show = n => {
      i = (n + slides.length) % slides.length;
      slides.forEach((s, k) => { const on = k === i; s.classList.toggle('on', on); on ? s.removeAttribute('aria-hidden') : s.setAttribute('aria-hidden', 'true'); $$('a.btn', s).forEach(a => on ? a.removeAttribute('tabindex') : a.setAttribute('tabindex', '-1')); });
      dots.forEach((d, k) => d.setAttribute('aria-current', k === i ? 'true' : 'false'));
    };
    const setPlay = v => { playing = v; tog.innerHTML = icon(v ? 'pause' : 'play'); tog.setAttribute('aria-label', v ? 'Pausar el carrusel' : 'Reanudar el carrusel'); };
    setPlay(playing);
    carTimer = setInterval(() => { if (playing && !hover && document.contains(car)) show(i + 1); }, 6500);
    car.addEventListener('mouseenter', () => hover = true); car.addEventListener('mouseleave', () => hover = false);
    car.addEventListener('focusin', () => hover = true); car.addEventListener('focusout', () => hover = false);
    car.addEventListener('click', e => {
      const b = e.target.closest('[data-car]'); if (!b) return;
      const v = b.dataset.car;
      if (v === 'toggle') setPlay(!playing); else if (v === 'prev') show(i - 1); else if (v === 'next') show(i + 1); else show(+v);
    });
    let sx = null;
    car.addEventListener('touchstart', e => { sx = e.touches[0].clientX; }, { passive: true });
    car.addEventListener('touchend', e => { if (sx === null) return; const dx = e.changedTouches[0].clientX - sx; if (Math.abs(dx) > 50) { show(i + (dx < 0 ? 1 : -1)); setPlay(false); } sx = null; });
  }

  // ---------- Listados ----------
  function listing(o) {
    const q = o.q, path = o.path;
    const marcas = (q.get('marca') || '').split(',').filter(Boolean);
    const edad = q.get('edad') || '';
    const min = q.get('min') !== null && q.get('min') !== '' ? parseFloat(q.get('min')) : null;
    const max = q.get('max') !== null && q.get('max') !== '' ? parseFloat(q.get('max')) : null;
    const orden = q.get('orden') || 'rel';
    let pag = Math.max(1, parseInt(q.get('pag') || '1', 10) || 1);

    let items = o.base.filter(p => (min === null || p.p >= min) && (max === null || p.p <= max));
    const ac = {}; items.forEach(p => { if (p.ag) ac[p.ag] = (ac[p.ag] || 0) + 1; });
    if (edad && !o.fixedAge) items = items.filter(p => p.ag === edad);
    const bc = {}; items.forEach(p => { if (p.b) bc[p.b] = (bc[p.b] || 0) + 1; });
    if (marcas.length) items = items.filter(p => marcas.includes(p.b));
    const sorters = {
      rel: o.relSort || ((a, b) => b.nw - a.nw || b.id - a.id),
      'precio-asc': (a, b) => a.p - b.p, 'precio-desc': (a, b) => b.p - a.p,
      nuevos: (a, b) => b.id - a.id, nombre: (a, b) => a.n.localeCompare(b.n, 'es')
    };
    items = o.relSort && orden === 'rel' ? items : [...items].sort(sorters[orden] || sorters.rel);
    const pages = Math.max(1, Math.ceil(items.length / PER_PAGE)); pag = Math.min(pag, pages);
    const pageItems = items.slice((pag - 1) * PER_PAGE, pag * PER_PAGE);
    const link = upd => { const n = new URLSearchParams(q); for (const [k, v] of Object.entries(upd)) { if (v === null || v === '' || v === false) n.delete(k); else n.set(k, v); } if (!('pag' in upd)) n.delete('pag'); const s = n.toString(); return '#' + path + (s ? '?' + s : ''); };

    let chips = '';
    if (o.cat) {
      const c = o.cat;
      const list = c.children.length ? c.children : (c.parent ? CAT[c.parent].children : []);
      if (list.length) chips = `<nav class="subchips" aria-label="Subcategorías">${!c.children.length && c.parent ? `<a class="chip" href="${curl(CAT[c.parent])}">Todo ${esc(CAT[c.parent].name.toLowerCase())}</a>` : ''}${list.map(k => `<a class="chip${k === c.id ? ' on' : ''}" href="${curl(CAT[k])}"${k === c.id ? ' aria-current="page"' : ''}>${esc(CAT[k].name)} <small>${CAT[k].count}</small></a>`).join('')}</nav>`;
    }
    let catBlock = '';
    if (!o.cat) {
      const cc = {}; o.base.forEach(p => { const t = p.c; cc[t] = (cc[t] || 0) + 1; });
      const top = Object.entries(cc).sort((a, b) => b[1] - a[1]).slice(0, 8);
      if (top.length > 1) catBlock = `<div class="fblock"><h2>Categorías</h2><ul>${top.map(([k, n]) => `<li><a href="${curl(CAT[k])}">${esc(CAT[k].name)}<small>${n}</small></a></li>`).join('')}</ul></div>`;
    }
    const brandList = Object.entries(bc).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
    const ranges = [['Hasta 10 €', null, 10], ['10 a 25 €', 10, 25], ['25 a 50 €', 25, 50], ['50 a 100 €', 50, 100], ['Más de 100 €', 100, null]];
    const ageList = AGES.filter(a => ac[a.k]);

    const filters = `
      <aside class="filters${state.filtersOpen ? ' open' : ''}" id="filters" aria-label="Filtros">
        <div class="filters-head drawer-h"><h2>Filtrar</h2><button class="icon-btn" type="button" data-close-filters aria-label="Cerrar filtros">${icon('close')}</button></div>
        ${catBlock}
        ${!o.fixedAge && !o.hideAge && ageList.length > 1 ? `<div class="fblock"><h2>Edad</h2><ul>${ageList.map(a => { const on = edad === a.k; return `<li><a href="${link({ edad: on ? null : a.k })}" class="${on ? 'on' : ''}"${on ? ' aria-current="true"' : ''}>${esc(a.short)}<small>${ac[a.k]}</small></a></li>`; }).join('')}</ul></div>` : ''}
        <div class="fblock"><h2>Precio</h2>
          <ul style="margin-bottom:10px">${ranges.map(([l, a, b]) => { const on = min === a && max === b; return `<li><a href="${link({ min: on ? null : a, max: on ? null : b })}" class="${on ? 'on' : ''}"${on ? ' aria-current="true"' : ''}>${l}</a></li>`; }).join('')}</ul>
          <form class="price-range" data-price><label>Mínimo (€)<input type="number" inputmode="decimal" min="0" step="1" name="min" id="f-min" value="${min ?? ''}"></label><label>Máximo (€)<input type="number" inputmode="decimal" min="0" step="1" name="max" id="f-max" value="${max ?? ''}"></label><button class="btn btn-outline btn-block" style="grid-column:1/-1" type="submit">Aplicar precio</button></form></div>
        ${brandList.length > 1 || marcas.length ? `<div class="fblock"><h2>Marca</h2>
          <div>${brandList.map(([b, n], i) => `<label class="check"${i >= 8 && !marcas.includes(b) ? ' data-more hidden' : ''}><input type="checkbox" id="f-b-${i}" data-brand="${esc(b)}" ${marcas.includes(b) ? 'checked' : ''}>${esc(b)}<small>${n}</small></label>`).join('')}</div>
          ${brandList.length > 8 ? `<button class="link-btn" type="button" data-more-brands aria-expanded="false">Ver todas las marcas (${brandList.length})</button>` : ''}</div>` : ''}
        <div class="fblock filters-foot"><button class="btn btn-primary btn-block" type="button" data-close-filters>Ver ${items.length} ${items.length === 1 ? 'juguete' : 'juguetes'}</button></div>
      </aside>`;

    const active = [];
    if (edad && !o.fixedAge && AGE[edad]) active.push([AGE[edad].short, link({ edad: null })]);
    if (min !== null || max !== null) active.push([min !== null && max !== null ? `${min} a ${max} €` : min !== null ? `Desde ${min} €` : `Hasta ${max} €`, link({ min: null, max: null })]);
    marcas.forEach(m => active.push([m, link({ marca: marcas.filter(x => x !== m).join(',') || null })]));

    const pager = pages > 1 ? `<nav class="pager" aria-label="Páginas">${pag > 1 ? `<a href="${link({ pag: pag - 1 })}" aria-label="Página anterior">${icon('left')}</a>` : ''}${Array.from({ length: pages }, (_, k) => k + 1).filter(n => n === 1 || n === pages || Math.abs(n - pag) <= 1).reduce((acc, n, i, arr) => { if (i && n - arr[i - 1] > 1) acc.push('…'); acc.push(n); return acc; }, []).map(n => n === '…' ? '<span aria-hidden="true">…</span>' : n === pag ? `<span aria-current="page">${n}</span>` : `<a href="${link({ pag: n })}" aria-label="Página ${n}">${n}</a>`).join('')}${pag < pages ? `<a href="${link({ pag: pag + 1 })}" aria-label="Página siguiente">${icon('right')}</a>` : ''}</nav>` : '';
    const dark = o.dark;

    view.innerHTML = `<div class="wrap">${crumbs(o.crumbs)}
      <div class="list-head"><h1 tabindex="-1">${esc(o.title)}</h1><span>${o.base.length} ${o.base.length === 1 ? 'producto' : 'productos'}</span></div>
      ${o.intro || ''}${chips}
      <div class="listing">${filters}
        <div>
          <div class="toolbar" id="toolbar"><button class="btn btn-outline filter-btn" type="button" data-open-filters aria-controls="filters">${icon('filter')}Filtrar${active.length ? ` (${active.length})` : ''}</button>
            <span class="count" aria-live="polite">${items.length} ${items.length === 1 ? 'resultado' : 'resultados'}${pages > 1 ? ` · página ${pag} de ${pages}` : ''}</span>
            <label>Ordenar por <select id="f-orden" data-orden>${[['rel', o.relSort ? 'Más relevantes' : 'Destacados'], ['precio-asc', 'Precio: de menor a mayor'], ['precio-desc', 'Precio: de mayor a menor'], ['nuevos', 'Lo más nuevo'], ['nombre', 'Nombre (A-Z)']].map(([v, l]) => `<option value="${v}"${orden === v ? ' selected' : ''}>${l}</option>`).join('')}</select></label></div>
          ${active.length ? `<div class="active-filters">${active.map(([l, h]) => `<a class="chip" href="${h}">${esc(l)} ${icon('close')}<span class="sr-only">(quitar filtro)</span></a>`).join('')}${active.length > 1 ? `<a class="chip" href="#${path}">Quitar todos</a>` : ''}</div>` : ''}
          ${pageItems.length ? `<div class="grid">${pageItems.map(p => card(p, dark)).join('')}</div>` : `<div class="empty"><h2>No hay juguetes con esos filtros</h2><p>Quita algún filtro o pregúntanos: si no lo tenemos, lo buscamos.</p><div class="btn-row"><a class="btn btn-outline" href="#${path}">Quitar filtros</a><a class="btn btn-wa" href="${waLink('Hola, estoy buscando un regalo y no lo encuentro en la web.')}" target="_blank" rel="noopener">${icon('wa')}Preguntar</a></div></div>`}
          ${pager}
        </div></div></div>`;

    const setQ = (upd, focusId) => { state.focusId = focusId || null; location.hash = link(upd); };
    $$('[data-brand]').forEach(el => el.addEventListener('change', () => { const b = el.dataset.brand; const set = new Set(marcas); el.checked ? set.add(b) : set.delete(b); setQ({ marca: [...set].join(',') || null }, el.id); }));
    const pf = $('[data-price]'); pf && pf.addEventListener('submit', e => { e.preventDefault(); const a = pf.min.value, b = pf.max.value; setQ({ min: a === '' ? null : Math.max(0, +a), max: b === '' ? null : Math.max(0, +b) }, 'f-min'); });
    const so = $('[data-orden]'); so && so.addEventListener('change', () => setQ({ orden: so.value === 'rel' ? null : so.value }, 'f-orden'));
    const mb = $('[data-more-brands]'); mb && mb.addEventListener('click', () => { const hid = $$('[data-more]'); const show = hid.some(h => h.hidden); hid.forEach(h => h.hidden = !show); mb.setAttribute('aria-expanded', String(show)); mb.textContent = show ? 'Ver menos marcas' : `Ver todas las marcas (${brandList.length})`; });
    document.title = `${o.title} · ${SHOP}`;
  }

  function category(slug, q) {
    const c = CATSLUG[slug]; if (!c) return notFound();
    const base = P.filter(p => inCat(p, c.id));
    const isC = c.id === '301' || c.parent && trail(c.id)[0].id === '301';
    const intro = isC ? `<div class="list-hero" style="background:var(--noche);color:#fff"><p>Cartas gradeadas, numeradas, autógrafos y cromos de la temporada. ¿Buscas una carta concreta? <a style="color:var(--amarillo)" href="${waLink('Hola, busco una carta de colección: ')}" target="_blank" rel="noopener">Pregúntanos por WhatsApp</a>.</p></div>` : '';
    listing({ path: '/c/' + slug, q, base, cat: c, title: c.name, intro, dark: isC, crumbs: trail(c.id).map(x => ({ name: x.name, href: curl(x) })) });
  }
  function searchPage(term, q) {
    const res = search(term);
    $('#q').value = term;
    if (!res.length) {
      view.innerHTML = `<div class="wrap">${crumbs([{ name: 'Búsqueda' }])}<div class="empty" style="margin-top:12px"><h1 style="font-family:var(--f-tit);font-weight:600;font-size:24px;margin-bottom:8px" tabindex="-1">No encontramos «${esc(term)}»</h1><p>Revisa cómo está escrito o prueba con algo más general. Si no lo tenemos en la web, seguramente podamos conseguirlo.</p><div class="btn-row"><a class="btn btn-wa" href="${waLink(`Hola, busco: ${term}`)}" target="_blank" rel="noopener">${icon('wa')}Preguntar por WhatsApp</a><a class="btn btn-outline" href="#/regalos">Buscador de regalos</a></div></div></div>`;
      document.title = `Sin resultados para «${term}» · ${SHOP}`;
      return;
    }
    listing({ path: '/buscar/' + encodeURIComponent(term), q, base: res, relSort: true, title: `Resultados para «${term}»`, crumbs: [{ name: 'Búsqueda' }] });
  }
  function regalos(q) {
    const edad = q.get('edad') || '', min = q.get('min'), max = q.get('max');
    const pres = [['Hasta 15 €', null, 15], ['15 a 30 €', 15, 30], ['30 a 60 €', 30, 60], ['Más de 60 €', 60, null]];
    const lk = upd => { const n = new URLSearchParams(q); for (const [k, v] of Object.entries(upd)) { if (v === null) n.delete(k); else n.set(k, v); } n.delete('pag'); const s = n.toString(); return '#/regalos' + (s ? '?' + s : ''); };
    const intro = `<div class="finder">
      <fieldset><legend>¿Para quién es?</legend><div class="opts">${AGES.map(a => { const on = edad === a.k; return `<a href="${lk({ edad: on ? null : a.k })}"${on ? ' aria-current="true"' : ''}>${esc(a.short)}</a>`; }).join('')}</div></fieldset>
      <fieldset style="margin:0"><legend>¿Cuánto quieres gastar?</legend><div class="opts">${pres.map(([l, a, b]) => { const on = String(a ?? '') === String(min ?? '') && String(b ?? '') === String(max ?? ''); return `<a href="${lk({ min: on ? null : a, max: on ? null : b })}"${on ? ' aria-current="true"' : ''}>${l}</a>`; }).join('')}</div></fieldset></div>`;
    const base = P.filter(p => edad === 'coleccion' || !inCat(p, '301'));
    listing({ path: "/regalos", q, base, hideAge: true, title: "Buscador de regalos", intro, crumbs: [{ name: 'Buscador de regalos' }] });
  }

  // ---------- Ficha de producto ----------
  function product(id) {
    const p = PID[id]; if (!p) return notFound();
    const tr = trail(p.c);
    const related = (() => { const same = P.filter(x => x.id !== p.id && x.c === p.c).sort((a, b) => b.nw - a.nw || b.id - a.id); const top = P.filter(x => x.id !== p.id && x.c !== p.c && inCat(x, tr[0].id) && (p.ag ? x.ag === p.ag : true)).sort((a, b) => b.id - a.id); return [...same, ...top].slice(0, 14); })();
    const waQ = waLink(`Hola, tengo una pregunta sobre «${p.n}» (código ${p.id}).`);
    const isC = inCat(p, '301');
    const imgs = Array.from({ length: p.g }, (_, i) => `img/p/${p.id}_${i}.jpg`);
    const mq = maxQ(p);
    view.innerHTML = `<div class="wrap">${crumbs([...tr.map(x => ({ name: x.name, href: curl(x) })), { name: p.n }])}
      <div class="pdp">
        <div class="gallery${imgs.length < 2 ? ' one' : ''}">
          ${imgs.length > 1 ? `<div class="thumbs" role="group" aria-label="Fotos del producto">${imgs.map((s, i) => `<button type="button" data-thumb="${i}" aria-pressed="${i === 0}" aria-label="Ver foto ${i + 1} de ${imgs.length}"><img src="${s}" alt="" width="76" height="76" loading="lazy"></button>`).join('')}</div>` : ''}
          <div class="zoom"><img src="${imgs[0]}" alt="${esc(p.n)}" width="600" height="600" id="pimg"></div>
          ${p.nw || p.of ? `<span class="tags">${p.nw ? '<span class="tag tag-new">Novedad</span>' : ''}${p.of ? '<span class="tag tag-of">Oferta</span>' : ''}</span>` : ''}
        </div>
        <div>
          <div class="pinfo">
            ${p.b ? `<a class="brand" href="#/marca/${encodeURIComponent(p.b)}">${esc(p.b)}</a>` : ''}
            <h1 tabindex="-1">${esc(p.n)}</h1>
            <div class="pmeta">${p.a !== null ? `<a class="pill age" href="#/edad/${p.ag}">${icon('cake')}${esc(ageText(p.a))}</a>` : ''}${p.nw ? `<span class="pill new">${icon('star')}Novedad</span>` : ''}${p.of ? `<span class="pill of">${icon('gift')}Oferta</span>` : ''}<span class="pill">Código ${p.id}${p.r ? ` · Ref. ${esc(p.r)}` : ''}</span></div>
          </div>
          <div class="buy">
            ${priceHtml(p.p)}<span class="iva">IVA incluido</span>
            <div class="buy-row">
              ${mq > 1 ? `<div class="qty" role="group" aria-label="Cantidad"><button type="button" data-pq="-1" aria-label="Quitar una unidad">${icon('minus')}</button><input type="number" id="pq" inputmode="numeric" min="1" max="${mq}" value="1" aria-label="Unidades"><button type="button" data-pq="1" aria-label="Añadir una unidad">${icon('plus')}</button></div>` : '<input type="hidden" id="pq" value="1">'}
              <button class="btn btn-primary btn-lg" type="button" data-addq="${p.id}">${icon('bag')}Añadir a la cesta</button>
              <button class="wish-btn" type="button" data-wish="${p.id}" aria-pressed="${wish.includes(p.id)}" aria-label="Añadir a mi carta a los Reyes">${icon('heart')}</button>
            </div>
            <a class="btn btn-outline btn-block" href="${waQ}" target="_blank" rel="noopener">${icon("wa")}Pregúntanos por WhatsApp</a>
            <ul class="deliv">
              <li>${icon('store')}<div><b>Recógelo gratis en la tienda</b><span>C/ Barrios 46, La Rambla. Te avisamos cuando esté listo.</span></div></li>
              <li>${icon('truck')}<div><b>Envío a domicilio en 24-72 h</b><span>En días laborables, a toda la península.</span></div></li>
              <li>${icon('return')}<div><b>Devolución en 14 días</b><span>En su embalaje original, en la tienda o desde casa.</span></div></li>
            </ul>
            ${payChips()}
          </div>
        </div>
      </div>
      <section class="desc" aria-labelledby="desc-h"><h2 id="desc-h">Descripción</h2><div class="desc-text" id="ptext"><p>Cargando la descripción…</p></div></section>
      ${related.length ? `<section class="sec" aria-labelledby="h-rel"><div class="sec-h"><h2 id="h-rel">También te puede gustar</h2><a href="${curl(tr[tr.length - 1])}">Ver ${esc(tr[tr.length - 1].name.toLowerCase())}</a></div>${rowscroll('rs-rel', related.map(x => card(x, isC)).join(''), 'productos relacionados')}</section>` : ''}
    </div>`;

    const z = $('.zoom'), im = $('#pimg');
    if (z && matchMedia('(hover: hover)').matches && !reduced) {
      z.addEventListener('mousemove', e => { const r = z.getBoundingClientRect(); im.style.transformOrigin = `${(e.clientX - r.left) / r.width * 100}% ${(e.clientY - r.top) / r.height * 100}%`; im.style.transform = 'scale(1.8)'; });
      z.addEventListener('mouseleave', () => { im.style.transform = ''; });
    }
    loadDesc().then(() => {
      const el = $('#ptext'); if (!el || parseHash().path.split('/')[2] != p.id) return;
      const t = DESC[p.id];
      el.innerHTML = t ? formatDesc(t) : `<p>${esc(p.n)}.</p><p>¿Quieres más detalles? <a href="${waQ}" target="_blank" rel="noopener">Pregúntanos por WhatsApp</a> y te respondemos enseguida.</p>`;
      if (el.scrollHeight > 420) {
        el.classList.add('clamp');
        el.insertAdjacentHTML('afterend', `<button class="btn btn-outline desc-more" type="button" aria-expanded="false" aria-controls="ptext">Leer la descripción completa</button>`);
        const b = el.nextElementSibling; b.addEventListener('click', () => { const open = el.classList.toggle('clamp'); b.setAttribute('aria-expanded', String(!open)); b.textContent = open ? 'Leer la descripción completa' : 'Leer menos'; });
      }
    });
    document.title = `${p.n} · ${SHOP}`;
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

  // ---------- Carta a los Reyes ----------
  function cartaPage() {
    const items = wish.map(id => PID[id]).filter(Boolean);
    const total = items.reduce((a, p) => a + p.p, 0);
    const shareTxt = `Mi carta a los Reyes (${SHOP}):\n` + items.map(p => `• ${p.n} · ${eur(p.p)}\n  ${location.href.split('#')[0]}#/p/${p.id}`).join('\n');
    view.innerHTML = `<div class="wrap">
      <div class="wish-hero"><div><h1 tabindex="-1">Mi carta a los Reyes</h1><p>${items.length ? `${items.length} ${items.length === 1 ? 'juguete' : 'juguetes'} en tu carta, ${eur(total)} en total. Compártela con la familia por WhatsApp o pásala a la cesta cuando quieras.` : 'Pulsa el corazón de cualquier juguete para apuntarlo aquí. Luego puedes enviar la carta por WhatsApp a quien tú quieras.'}</p></div><img src="img/duende.png" alt="" width="200" height="236"></div>
      ${items.length ? `<div class="wish-actions">
          <a class="btn btn-wa btn-lg" href="https://wa.me/?text=${encodeURIComponent(shareTxt)}" target="_blank" rel="noopener">${icon('share')}Enviar la carta por WhatsApp</a>
          <button class="btn btn-primary btn-lg" type="button" data-wish-all>${icon('bag')}Añadir todo a la cesta</button>
          <button class="btn btn-outline" type="button" data-print>Imprimir</button>
          <button class="btn btn-outline" type="button" data-wish-clear>Vaciar la carta</button></div>
        <div class="grid">${items.map(p => card(p, inCat(p, '301'))).join('')}</div>`
        : `<div class="empty"><h2>Tu carta está vacía</h2><p>Empieza por las novedades o usa el buscador de regalos por edad.</p><div class="btn-row"><a class="btn btn-primary" href="#/novedades">Ver novedades</a><a class="btn btn-outline" href="#/regalos">Buscador de regalos</a></div></div>`}
    </div>`;
    document.title = `Mi carta a los Reyes · ${SHOP}`;
  }

  // ---------- Cesta (página) ----------
  function cartPage() {
    const items = cartItems();
    document.title = `Tu cesta · ${SHOP}`;
    if (!items.length) { view.innerHTML = `<div class="wrap"><h1 class="page-title" tabindex="-1">Tu cesta</h1><div class="empty"><h2>Tu cesta está vacía</h2><p>Hay más de 350 juguetes y piezas de colección esperándote.</p><div class="btn-row"><a class="btn btn-primary" href="#/">Ir a la tienda</a></div></div></div>`; return; }
    view.innerHTML = `<div class="wrap"><h1 class="page-title" tabindex="-1">Tu cesta <span style="font-family:var(--f);font-weight:700;color:var(--texto-2);font-size:18px">(${cartCount()} ${cartCount() === 1 ? 'producto' : 'productos'})</span></h1>
      <div class="cart-layout">
        <div class="cart-list">${items.map(i => `
          <div class="citem"><img src="img/p/${i.id}.jpg" alt="${esc(i.p.n)}" width="96" height="96" loading="lazy">
            <div><a class="n" href="${purl(i.p)}">${esc(i.p.n)}</a>
              <div class="meta">${qtyCtrl(i)}<button class="del" type="button" data-del="${i.id}">${icon('trash')}Eliminar<span class="sr-only"> ${esc(i.p.n)}</span></button></div></div>
            <div class="lp">${eur(i.q * i.p.p)}<span class="unit">${i.q > 1 ? eur(i.p.p) + ' / ud.' : ''}</span></div></div>`).join('')}
        </div>
        <aside class="summary" aria-labelledby="sum-h"><h2 id="sum-h">Resumen</h2>
          <div class="sum-row"><span>Productos</span><span>${eur(cartSub())}</span></div>
          <div class="sum-row"><span>Recogida en tienda</span><span style="color:var(--verde);font-weight:800">Gratis</span></div>
          <div class="sum-row"><span>Envío a domicilio</span><span>${eur(SHIP)}</span></div>
          <div class="sum-row total"><span>Total</span><span>${eur(cartSub())}</span></div>
          <p class="sum-note">Precios con IVA incluido. La entrega la eliges en el siguiente paso.</p>
          <a class="btn btn-primary btn-lg btn-block" href="#/pedido">Tramitar pedido</a>
          <a class="btn btn-outline btn-block" style="margin-top:10px" href="#/">Seguir comprando</a>
          ${payChips()}
        </aside>
      </div></div>`;
  }

  // ---------- Pedido ----------
  const ck = { nombre: '', apellidos: '', email: '', tel: '', envio: 'tienda', direccion: '', cp: '', poblacion: '', provincia: '', pago: 'tarjeta', acepto: false };
  function checkout() {
    const items = cartItems();
    document.title = `Finalizar pedido · ${SHOP}`;
    if (!items.length) { cartPage(); return; }
    const ship = ck.envio === 'domicilio' ? SHIP : 0;
    if (ck.envio !== 'tienda' && ck.pago === 'tienda') ck.pago = 'tarjeta';
    const f = (id, label, type, extra = '', full) => `<div class="field${full ? ' full' : ''}"><label for="ck-${id}">${label}</label><input id="ck-${id}" name="${id}" type="${type}" value="${esc(ck[id])}" ${extra} aria-describedby="e-${id}"><span class="err" id="e-${id}"></span></div>`;
    const pays = [
      ['tarjeta', 'Tarjeta de crédito o débito', 'Pago seguro con la pasarela del banco.', '<span class="pay visa">VISA</span><span class="pay mc"><i></i><i></i>Mastercard</span>'],
      ['bizum', 'Bizum', 'Paga desde la app de tu banco con el móvil.', '<span class="pay bizum">bizum</span>'],
      ['paypal', 'PayPal', 'Con tu cuenta PayPal, sin dar los datos de tu tarjeta.', '<span class="pay paypal">Pay<em>Pal</em></span>'],
      ['wallet', 'Apple Pay o Google Pay', 'Paga con el móvil en un toque.', '<span class="pay apple">Apple Pay</span><span class="pay gpay">Google Pay</span>'],
      ['tienda', 'Pago en la tienda al recoger', 'En efectivo o con tarjeta en el mostrador.', '']
    ];
    view.innerHTML = `<div class="wrap">${crumbs([{ name: 'Cesta', href: '#/cesta' }, { name: 'Finalizar pedido' }])}
      <h1 class="page-title" style="margin-top:4px" tabindex="-1">Finalizar pedido</h1>
      <form id="ckForm" novalidate class="cart-layout">
        <div class="steps">
          <section class="step" aria-labelledby="st1"><h2 id="st1"><span class="n">1</span>Tus datos</h2>
            <div class="fields">${f('nombre', 'Nombre', 'text', 'autocomplete="given-name" required')}${f('apellidos', 'Apellidos', 'text', 'autocomplete="family-name" required')}${f('email', 'Correo electrónico', 'email', 'autocomplete="email" required')}${f('tel', 'Teléfono móvil', 'tel', 'autocomplete="tel" inputmode="tel" required')}</div></section>
          <section class="step" aria-labelledby="st2"><h2 id="st2"><span class="n">2</span>Entrega</h2>
            <fieldset style="border:0;padding:0;margin:0"><legend class="sr-only">Forma de entrega</legend><div class="options">
              <label class="opt"><input type="radio" name="envio" value="tienda" ${ck.envio === 'tienda' ? 'checked' : ''}><div><b>Recoger en la tienda</b><span class="d">C/ Barrios 46, La Rambla. Te avisamos por WhatsApp cuando esté preparado.</span></div><span class="r" style="color:var(--verde)">Gratis</span></label>
              <label class="opt"><input type="radio" name="envio" value="domicilio" ${ck.envio === 'domicilio' ? 'checked' : ''}><div><b>Envío a domicilio</b><span class="d">Península, en 24-72 h laborables desde el pago.</span></div><span class="r">${eur(SHIP)}</span></label>
            </div></fieldset>
            ${ck.envio === 'domicilio' ? `<div class="fields" style="margin-top:14px">${f('direccion', 'Dirección', 'text', 'autocomplete="street-address" required', true)}${f('cp', 'Código postal', 'text', 'autocomplete="postal-code" inputmode="numeric" maxlength="5" required')}${f('poblacion', 'Población', 'text', 'autocomplete="address-level2" required')}${f('provincia', 'Provincia', 'text', 'autocomplete="address-level1" required', true)}</div>` : ''}
          </section>
          <section class="step" aria-labelledby="st3"><h2 id="st3"><span class="n">3</span>Pago</h2>
            <fieldset style="border:0;padding:0;margin:0"><legend class="sr-only">Forma de pago</legend><div class="options">
              ${pays.map(([v, t, d, chips]) => { const dis = v === 'tienda' && ck.envio !== 'tienda'; return `<label class="opt${dis ? ' disabled' : ''}"><input type="radio" name="pago" value="${v}" ${ck.pago === v ? 'checked' : ''} ${dis ? 'disabled' : ''}><div><b>${t}</b><span class="d">${dis ? 'Solo si recoges el pedido en la tienda.' : d}</span>${chips ? `<div class="pay-chips">${chips}</div>` : ''}</div></label>`; }).join('')}
            </div></fieldset>
            <label class="check" style="margin-top:16px;align-items:flex-start"><input type="checkbox" id="ck-acepto" name="acepto" ${ck.acepto ? 'checked' : ''} aria-describedby="e-acepto" style="margin-top:2px"><span>He leído y acepto las <a href="#/ayuda" target="_blank">condiciones de venta</a> y la política de privacidad.</span></label>
            <span class="err" id="e-acepto"></span>
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
      </form></div>`;

    const form = $('#ckForm');
    form.addEventListener('input', e => {
      const t = e.target; if (!t.name || t.type === 'radio' || t.type === 'checkbox') return;
      ck[t.name] = t.value;
      if (t.getAttribute('aria-invalid') === 'true') { t.setAttribute('aria-invalid', 'false'); const sp = $('#e-' + t.name); if (sp) sp.textContent = ''; }
    });
    form.addEventListener('change', e => {
      const t = e.target;
      if (t.type === 'checkbox') { ck[t.name] = t.checked; if (t.checked) { const sp = $('#e-' + t.name); if (sp) sp.textContent = ''; } }
      if (t.type === 'radio') { ck[t.name] = t.value; if (t.name === 'envio') { const y = scrollY; checkout(); scrollTo(0, y); const r = $(`input[name=envio][value=${t.value}]`); r && r.focus(); } }
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
        if (k === 'cp' && /^(07|35|38|51|52)/.test(v)) return err(k, 'Enviamos a la península. Para Baleares, Canarias, Ceuta o Melilla, pregúntanos antes.');
        err(k, '');
      });
      if (!ck.acepto) err('acepto', 'Tienes que aceptar las condiciones para continuar.'); else err('acepto', '');
      if (first) { first.focus(); return; }
      done();
    });
  }
  function done() {
    const items = cartItems(), ship = ck.envio === 'domicilio' ? SHIP : 0, total = cartSub() + ship;
    const no = 'JR-' + String(Math.floor(10000 + Math.random() * 89999));
    const payTxt = { tarjeta: 'tarjeta', bizum: 'Bizum', paypal: 'PayPal', wallet: 'Apple Pay o Google Pay', tienda: 'pago en la tienda' }[ck.pago];
    view.innerHTML = `<div class="wrap"><div class="done"><div class="ok" aria-hidden="true">${icon('check')}</div>
      <h1 tabindex="-1">¡Gracias, ${esc(ck.nombre.trim())}! Pedido recibido</h1>
      <div class="order-no">Pedido ${no}</div>
      <p>${items.length} ${items.length === 1 ? 'producto' : 'productos'} · Total ${eur(total)} · Pago con ${payTxt}</p>
      <p>${ck.envio === 'tienda' ? 'Te avisaremos por WhatsApp cuando esté listo para recoger en C/ Barrios 46, La Rambla.' : `Lo recibirás en 24-72 h laborables en ${esc(ck.direccion)}, ${esc(ck.cp)} ${esc(ck.poblacion)}.`} Te enviamos la confirmación a ${esc(ck.email)}.</p>
      <div class="btn-row" style="justify-content:center;margin-top:18px"><a class="btn btn-primary" href="#/">Volver a la tienda</a><a class="btn btn-wa" href="${waLink(`Hola, tengo una duda sobre mi pedido ${no}`)}" target="_blank" rel="noopener">${icon('wa')}Dudas por WhatsApp</a></div>
      <p class="note">Esto es una demostración de la tienda: no se ha cobrado nada ni se ha enviado ningún dato.</p></div></div>`;
    cart = []; saveCart();
    $('#cartCount').textContent = 0; $('#cartCount').dataset.n = 0; $('#cartTotal').textContent = eur(0); $('#btnCart').setAttribute('aria-label', 'Cesta vacía'); renderCartDrawer();
    scrollTo(0, 0); $('h1', view).focus();
    document.title = `Pedido recibido · ${SHOP}`;
  }

  // ---------- Páginas de información ----------
  function contactList() {
    return `<ul class="contact-list"><li>${icon('pin')}<span>${ADDR}</span></li><li>${icon('phone')}<a href="tel:+34635891813">635 891 813</a></li><li>${icon('mail')}<a href="mailto:lajugueteriadelarambla@hotmail.com" style="overflow-wrap:anywhere">lajugueteriadelarambla@hotmail.com</a></li></ul>`;
  }
  function tiendaPage() {
    view.innerHTML = `<div class="wrap">${crumbs([{ name: 'Nuestra tienda' }])}
      <div class="info-hero"><h1 tabindex="-1">Nuestra tienda en La Rambla</h1><p>Estamos en la calle Barrios, en el centro del pueblo. Ven a ver los juguetes en persona, recoge tu pedido online sin gastos o pregúntanos lo que necesites.</p></div>
      ${visitBlock('h-v2')}
      <div class="sec tiles4" style="margin-top:26px">
        <a class="tile t-azul" href="#/c/juguetes">Juguetes<small>${CAT.juguetes.count} productos</small>${icon('gift')}</a>
        <a class="tile t-rosa" href="#/c/coleccionismo">Coleccionismo<small>${CAT['301'] ? CAT['301'].count : 0} piezas</small>${icon('cards')}</a>
        <a class="tile t-naranja" href="#/carta">Carta a los Reyes<small>Hazla y compártela</small>${icon('heart')}</a>
        <a class="tile t-verde" href="#/ayuda">Envíos y devoluciones<small>Todo lo que debes saber</small>${icon('truck')}</a>
      </div></div>`;
    document.title = `Nuestra tienda en La Rambla · ${SHOP}`;
  }
  function helpPage() {
    view.innerHTML = `<div class="wrap">${crumbs([{ name: 'Envíos y devoluciones' }])}
      <div class="info-hero"><h1 tabindex="-1">Envíos, pagos y devoluciones</h1><p>Lo que necesitas saber antes de comprar. Si te queda alguna duda, llámanos o escríbenos al 635 891 813.</p></div>
      <div class="info-grid">
        <div class="prose">
          <h2>Envíos</h2>
          <p>Enviamos a toda la península en 24-72 horas, en días laborables. El envío a domicilio cuesta ${eur(SHIP)}.</p>
          <h2>Recogida en tienda</h2>
          <p>Puedes recoger tu pedido gratis en nuestra tienda de C/ Barrios 46, en La Rambla. Te avisamos cuando esté preparado.</p>
          <h2>Formas de pago</h2>
          <p>Tarjeta de crédito o débito, Bizum, PayPal, Apple Pay y Google Pay. Si recoges en la tienda, también puedes pagar allí.</p>
          <h2>Cambios y devoluciones</h2>
          <ul>
            <li>Tienes 14 días naturales desde que recibes el pedido para desistir de la compra, sin tener que dar explicaciones.</li>
            <li>Puedes devolverlo en la tienda física presentando el albarán o la factura (en el móvil o impresa). Si no puedes ir, puede hacerlo otra persona por ti.</li>
            <li>Desde casa, pide la devolución por correo a lajugueteriadelarambla@hotmail.com y te indicamos cómo hacerlo; si lo prefieres, organizamos la recogida.</li>
            <li>El artículo debe estar en perfecto estado, con su embalaje original, accesorios y documentación.</li>
            <li>Te devolvemos el dinero, incluidos los gastos de envío estándar, por el mismo método de pago y en un máximo de 14 días.</li>
          </ul>
          <h2>Pedidos erróneos o productos dañados</h2>
          <p>Si recibes un pedido que no es el tuyo o un producto llega dañado o defectuoso, avísanos en un plazo de 3 días desde que lo recibes. Lo sustituimos o te devolvemos el importe, y nos hacemos cargo de los gastos de transporte cuando proceda.</p>
        </div>
        <aside class="panel"><h2 style="font-family:var(--f-tit);font-weight:600;font-size:22px;margin-bottom:14px">Contacto</h2>${contactList()}<a class="btn btn-wa btn-block" href="https://wa.me/${WA}" target="_blank" rel="noopener">${icon('wa')}Escríbenos por WhatsApp</a></aside>
      </div></div>`;
    document.title = `Envíos, pagos y devoluciones · ${SHOP}`;
  }
  function notFound() {
    view.innerHTML = `<div class="wrap"><div class="empty" style="margin-top:24px"><h1 style="font-family:var(--f-tit);font-weight:600;font-size:24px;margin-bottom:8px" tabindex="-1">No encontramos esta página</h1><p>Puede que el juguete ya no esté disponible.</p><div class="btn-row"><a class="btn btn-primary" href="#/">Volver a la tienda</a></div></div></div>`;
    document.title = `Página no encontrada · ${SHOP}`;
  }

  // ---------- Router ----------
  function render(keepScroll) {
    const { path, q } = parseHash();
    const samePath = state.lastPath === path;
    clearInterval(carTimer); closeMegas();
    if (!keepScroll) { $$('.drawer').forEach(d => { if (!d.hidden) closeDrawers(true); }); }
    let m;
    if (path === '/' || path === '') home();
    else if ((m = path.match(/^\/c\/(.+)$/))) category(m[1], q);
    else if ((m = path.match(/^\/p\/(\d+)/))) product(+m[1]);
    else if ((m = path.match(/^\/buscar\/(.*)$/))) searchPage(dec(m[1]), q);
    else if (path === '/novedades') listing({ path, q, base: P.filter(p => p.nw), title: 'Novedades', crumbs: [{ name: 'Novedades' }], intro: '<div class="list-hero" style="background:var(--azul-claro)"><p>Lo último que ha llegado a la tienda: figuras de fútbol, LEGO, Bburago, juegos de mesa y cartas de la temporada 25-26.</p></div>' });
    else if (path === '/ofertas') listing({ path, q, base: P.filter(p => p.of), title: 'Ofertas', crumbs: [{ name: 'Ofertas' }], intro: '<div class="list-hero" style="background:var(--rosa-claro)"><p>Juguetes con precio especial mientras queden unidades.</p></div>' });
    else if ((m = path.match(/^\/edad\/(.+)$/))) { const a = AGE[dec(m[1])]; a ? listing({ path, q, base: P.filter(p => p.ag === a.k), fixedAge: true, dark: a.k === 'coleccion', title: a.name, crumbs: [{ name: 'Edades', href: '#/regalos' }, { name: a.short }] }) : notFound(); }
    else if ((m = path.match(/^\/marca\/(.+)$/))) { const b = dec(m[1]); const base = P.filter(p => p.b === b); base.length ? listing({ path, q, base, title: b, crumbs: [{ name: 'Marcas' }, { name: b }] }) : notFound(); }
    else if (path === '/regalos') regalos(q);
    else if (path === '/carta') cartaPage();
    else if (path === '/cesta') cartPage();
    else if (path === '/pedido') checkout();
    else if (path === '/tienda') tiendaPage();
    else if (path === '/ayuda') helpPage();
    else notFound();
    if (!path.startsWith('/buscar/')) $('#q').value = '';

    $$('#navList > li > a, #quickList a').forEach(a => { const h = a.getAttribute('href').slice(1); const on = path === h || (h !== '/' && path.startsWith(h + '/')); on ? a.setAttribute('aria-current', 'page') : a.removeAttribute('aria-current'); });

    if (keepScroll) { state.lastPath = path; return; }
    if (samePath && state.lastPath !== null) {
      if (state.focusId && document.getElementById(state.focusId)) document.getElementById(state.focusId).focus({ preventScroll: true });
      else { const tb = $('#toolbar'); if (tb) { const y = tb.getBoundingClientRect().top + scrollY - 170; if (scrollY > y) scrollTo(0, Math.max(0, y)); } }
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
      if ((b = t.closest('[data-wish]'))) { toggleWish(+b.dataset.wish); return; }
      if ((b = t.closest('[data-pq]'))) { const i = $('#pq'); const p = PID[+parseHash().path.split('/')[2]]; i.value = Math.max(1, Math.min((parseInt(i.value, 10) || 1) + +b.dataset.pq, p ? maxQ(p) : 10)); return; }
      if ((b = t.closest('[data-thumb]'))) { const k = +b.dataset.thumb; const id = parseHash().path.split('/')[2]; $('#pimg').src = `img/p/${id}_${k}.jpg`; $$('[data-thumb]').forEach(x => x.setAttribute('aria-pressed', String(x === b))); return; }
      if ((b = t.closest('[data-qd]'))) {
        const id = +b.dataset.qd, d = b.dataset.d, it = cart.find(x => x.id === id); if (!it) return;
        const where = b.closest('#cartDrawer') ? '#cartDrawer' : '#view';
        setQty(id, it.q + +d);
        const target = $(`${where} [data-qd="${id}"][data-d="${d}"]`);
        if (target && !target.disabled) target.focus(); else if (target) { const inp = target.parentElement.querySelector('input'); inp && inp.focus(); }
        return;
      }
      if ((b = t.closest('[data-del]'))) { const id = +b.dataset.del; const p = PID[id]; removeItem(id); toast(`Eliminado: ${p ? p.n : 'producto'}`); const f = $('#cartDrawer:not([hidden]) [data-close]'); if (f) f.focus(); return; }
      if ((b = t.closest('[data-wish-all]'))) { wish.forEach(id => addToCart(id, 1, true)); toast('Toda la carta está en tu cesta'); openCart(); return; }
      if ((b = t.closest('[data-wish-clear]'))) { wish = []; saveWish(); updateWishUI(); render(true); toast('Carta vaciada'); $('h1', view).focus(); return; }
      if ((b = t.closest('[data-print]'))) { window.print(); return; }
      if ((b = t.closest('[data-close]'))) { closeDrawers(); return; }
      if ((b = t.closest('[data-drill]'))) { renderCatDrawer(b.dataset.drill || null); const f = $('#catDrawerBody button, #catDrawerBody a'); f && f.focus(); return; }
      if ((b = t.closest('[data-rs]'))) { const tr = document.getElementById(b.dataset.rs); tr && tr.scrollBy({ left: +b.dataset.dir * tr.clientWidth * 0.85, behavior: reduced ? 'auto' : 'smooth' }); return; }
      if ((b = t.closest('[data-open-filters]'))) { const fl = $('#filters'); fl.classList.add('open'); state.filtersOpen = true; $('#backdrop').hidden = false; lastTrigger = b; const c = fl.querySelector('[data-close-filters]'); c && c.focus(); return; }
      if ((b = t.closest('[data-close-filters]'))) { const fl = $('#filters'); fl.classList.remove('open'); state.filtersOpen = false; $('#backdrop').hidden = true; const fb = $('[data-open-filters]'); fb && fb.focus(); return; }
      if (t.closest('#backdrop')) { closeDrawers(); return; }
      if (t.closest('#cartDrawer a[href^="#"], #catDrawer a[href^="#"]')) { closeDrawers(true); }
    });
    document.addEventListener('change', e => { const t = e.target; if (t.matches('[data-qin]')) setQty(+t.dataset.qin, parseInt(t.value, 10) || 1); });
    document.addEventListener('keydown', e => { if (e.key === 'Escape') { const open = $$('.drawer').some(d => !d.hidden) || ($('#filters') && $('#filters').classList.contains('open')); if (open) { e.preventDefault(); closeDrawers(); } } });
    $('#btnMenu').addEventListener('click', e => { renderCatDrawer(null); openDrawer('catDrawer', e.currentTarget); });
    $('#btnCart').addEventListener('click', () => { state.justAdded = null; openCart(); });
    window.addEventListener('hashchange', () => render());
  }

  // ---------- Arranque ----------
  function init(data) {
    CATS = data.cats; CATS.forEach(c => { CAT[c.id] = c; CATSLUG[c.slug] = c; });
    P = data.products;
    for (const p of P) {
      p.ag = p.e === '9-12' || p.e === 'mayores' ? '9+' : p.e;
      const names = p.cs.map(k => CAT[k] ? CAT[k].name : '').join(' ');
      const base = norm([p.n, p.b, p.r, names].join(' '));
      p.h = base; p.nn = ' ' + norm(p.n);
      PID[p.id] = p;
    }
    const bc = {}; P.forEach(p => { if (p.b) bc[p.b] = (bc[p.b] || 0) + 1; });
    BRANDS = Object.entries(bc).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
    $('#footCats').innerHTML = ['9', '8', '11', '7', '15', '4', '301'].filter(k => CAT[k]).map(k => `<li><a href="${curl(CAT[k])}">${esc(CAT[k].name)}</a></li>`).join('');
    const mqS = matchMedia('(max-width: 960px)');
    const setPh = () => { $('#q').placeholder = mqS.matches ? 'Busca algo divertido…' : 'Busca LEGO, Barbie, cromos, patinetes…'; };
    setPh(); mqS.addEventListener('change', setPh);
    setupNav(); bind(); setupSearch(); updateCartUI(); updateWishUI(); render();
  }
  fetch('data/catalogo.json').then(r => r.json()).then(init).catch(err => {
    console.error(err);
    view.innerHTML = '<div class="wrap"><div class="empty" style="margin-top:24px"><h1 style="font-size:22px">No hemos podido cargar el catálogo</h1><p>Recarga la página en unos segundos.</p></div></div>';
  });
})();
