/* Bricolemar — código común: datos, cesta, favoritos, buscador, menú */
const BM = (() => {
  const ODOO = 'https://www.bricolemar.com';
  const WHATSAPP = '34694279935';
  const ENVIO = 4.95, GRATIS_DESDE = 100;
  const RAIZ = document.documentElement.dataset.raiz || '';
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const norm = s => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9ñ.,/ -]/g, ' ');
  const eur = n => n.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €';
  const img = (id, t = 512) => `${ODOO}/web/image/product.template/${id}/image_${t}`;
  const fotoP = (p, t = 512) => p.foto ? `${ODOO}${p.foto}/image_${t}` : img(p.id, t);
  const imgCat = (id, t = 256) => `${ODOO}/web/image/product.public.category/${id}/image_${t}`;
  const imgMarca = id => `${ODOO}/web/image/product.attribute.value/${id}/dr_image`;
  const url = (p, q = '') => RAIZ + p + q;
  const guardar = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} };
  const leer = (k, def) => { try { const v = JSON.parse(localStorage.getItem(k)); return v ?? def; } catch (e) { return def; } };
  const ICO = n => `<svg class="ico" aria-hidden="true"><use href="${RAIZ}img/iconos.svg#${n}"/></svg>`;

  /* ---------- datos ---------- */
  let _cat, _cats;
  async function catalogo() {
    if (_cat) return _cat;
    const [c, k] = await Promise.all([fetch(RAIZ + 'data/catalogo.json').then(r => r.json()), categorias()]);
    const marcas = c.m;
    const prods = c.p.map(r => {
      const p = { id: r[0], nombre: r[1], precio: r[2], antes: r[3] || 0, marcaId: r[4] || 0, cats: r[5], nota: r[6] || 0, resenas: r[7] || 0, stock: r[8], ref: r[9] || '', entrega: r[10] || 0, orden: r[11], foto: r[12] || '' };
      p.marca = marcas[p.marcaId] || '';
      const todas = new Set();
      for (const id of p.cats) { let x = k.porId[id]; while (x && !todas.has(x.id)) { todas.add(x.id); x = k.porId[x.padre]; } }
      p.todas = todas;
      p.busca = norm(p.nombre + ' ' + p.marca + ' ' + p.ref);
      return p;
    });
    const porId = Object.fromEntries(prods.map(p => [p.id, p]));
    _cat = { prods, porId, marcas };
    return _cat;
  }
  async function categorias() {
    if (_cats) return _cats;
    const lista = (await fetch(RAIZ + 'data/categorias.json').then(r => r.json())).map(r => ({ id: r[0], n: r[1], padre: r[2], cuenta: r[3] }));
    const porId = Object.fromEntries(lista.map(c => [c.id, c]));
    const hijos = {};
    for (const c of lista) (hijos[c.padre] = hijos[c.padre] || []).push(c);
    const ruta = id => { const r = []; let x = porId[id]; while (x) { r.unshift(x); x = porId[x.padre]; } return r; };
    _cats = { lista, porId, hijos, ruta, familias: hijos[0] || [] };
    return _cats;
  }

  /* ---------- precios y tarjetas ---------- */
  function precioHTML(p, conSinIva = true) {
    const [e, d] = p.precio.toFixed(2).split('.');
    let h = `<div class="precio"><span class="num"><span class="ent">${Number(e).toLocaleString('es-ES')}</span><span class="dec">,${d} €</span></span><span class="iva">IVA<br>incl.</span>`;
    if (p.antes > p.precio) h += `<del>${eur(p.antes)}</del>`;
    h += '</div>';
    if (conSinIva) h += `<div class="siva">${eur(p.precio / 1.21)} sin IVA</div>`;
    return h;
  }
  const textoEntrega = p => ({ 2: 'Recíbelo mañana', 4: 'Envío en 2-3 días', 11: 'Envío en 3-5 días' })[p.entrega] || 'Envío en 24/48 h';
  const esLento = p => p.entrega === 4 || p.entrega === 11;
  function disponibilidad(p) {
    return `<ul class="disp"><li class="${esLento(p) ? 'lento' : 'ok'}">${textoEntrega(p)}</li>` +
      (p.stock ? '<li class="ok">Recogida gratis en almacén</li>' : '<li>Recogida en almacén: consultar</li>') + '</ul>';
  }
  function estrellas(p, conTexto = true) {
    if (!p.resenas) return '<div class="estrellas"></div>';
    return `<div class="estrellas" title="${p.nota.toLocaleString('es-ES')} de 5"><span class="e" style="--p:${p.nota * 20}%"></span>${conTexto ? `<span>(${p.resenas})</span>` : ''}<span class="sr">${p.nota} de 5 estrellas, ${p.resenas} opiniones</span></div>`;
  }
  function tarjeta(p) {
    const fav = esFav(p.id);
    const dto = p.antes > p.precio ? `<span class="etiqueta">-${Math.round((1 - p.precio / p.antes) * 100)}%</span>` : '';
    return `<article class="pc">
      <a class="pc-img" href="${url('producto.html', '?id=' + p.id)}" tabindex="-1" aria-hidden="true"><img src="${fotoP(p)}" alt="" loading="lazy" width="512" height="512"></a>${dto}
      <button class="pc-fav" type="button" data-fav="${p.id}" aria-pressed="${fav}" aria-label="Guardar ${esc(p.nombre)} en favoritos">${ICO('corazon')}</button>
      <div class="pc-marca">${esc(p.marca)}</div>
      <h3 class="pc-tit"><a href="${url('producto.html', '?id=' + p.id)}">${esc(p.nombre)}</a></h3>
      ${estrellas(p)}
      ${disponibilidad(p)}
      ${precioHTML(p)}
      <button class="btn-anadir" type="button" data-anadir="${p.id}">${ICO('cesta')}Añadir<span class="sr"> ${esc(p.nombre)} a la cesta</span></button>
    </article>`;
  }

  /* ---------- cesta ---------- */
  const cesta = () => leer('bm-cesta', []);
  function guardarCesta(c) { guardar('bm-cesta', c); pintarContadores(); document.dispatchEvent(new CustomEvent('cesta')); }
  function anadir(p, n = 1) {
    const c = cesta(); const l = c.find(x => x.id === p.id);
    if (l) l.n = Math.min(999, l.n + n); else c.push({ id: p.id, n, nombre: p.nombre, precio: p.precio, ref: p.ref, marca: p.marca, foto: p.foto });
    guardarCesta(c);
  }
  function cambiar(id, n) { let c = cesta(); const l = c.find(x => x.id === id); if (!l) return; l.n = Math.max(0, Math.min(999, n)); if (!l.n) c = c.filter(x => x.id !== id); guardarCesta(c); }
  function totales(c = cesta(), recogida = false) {
    const sub = c.reduce((s, l) => s + l.precio * l.n, 0);
    const uds = c.reduce((s, l) => s + l.n, 0);
    const envio = !c.length || recogida || sub >= GRATIS_DESDE ? 0 : ENVIO;
    return { sub, uds, envio, total: sub + envio, falta: Math.max(0, GRATIS_DESDE - sub) };
  }
  function barraEnvio(t) {
    const pc = Math.min(100, t.sub / GRATIS_DESDE * 100);
    return `<div class="envio-gratis">${t.falta > 0 ? `Te faltan <b>${eur(t.falta)}</b> para el <b>envío gratis</b> (península).` : '<b>¡Tienes el envío gratis!</b> Tu pedido supera los 100 €.'}<div class="barra" aria-hidden="true"><span style="width:${pc}%"></span></div></div>`;
  }
  function lineaHTML(l) {
    return `<div class="linea"><img src="${fotoP(l, 128)}" alt="" loading="lazy">
      <div><h3><a href="${url('producto.html', '?id=' + l.id)}">${esc(l.nombre)}</a></h3>
        <div style="display:flex;align-items:center;flex-wrap:wrap"><div class="cantidad"><button type="button" data-menos="${l.id}" aria-label="Quitar una unidad">−</button><input type="number" min="0" max="999" value="${l.n}" data-cant="${l.id}" aria-label="Cantidad de ${esc(l.nombre)}"><button type="button" data-mas="${l.id}" aria-label="Añadir una unidad">+</button></div>
        <button type="button" class="quitar" data-quitar="${l.id}">Eliminar</button></div></div>
      <div class="importe">${eur(l.precio * l.n)}${l.n > 1 ? `<br><small style="font-weight:400;color:var(--gris)">${eur(l.precio)}/ud.</small>` : ''}</div></div>`;
  }
  function pintarCajon() {
    const caj = $('#cajon-cesta'); if (!caj) return;
    const c = cesta(), t = totales(c);
    $('.cajon-cuerpo', caj).innerHTML = c.length ? barraEnvio(t) + c.map(lineaHTML).join('') : `<div class="vacio"><p>Tu cesta está vacía.</p><a class="btn" href="${url('categoria.html')}">Ver productos</a></div>`;
    $('.cajon-pie', caj).hidden = !c.length;
    $('.cajon-pie', caj).innerHTML = `<div class="totales"><div><span>Subtotal (${t.uds} ${t.uds === 1 ? 'artículo' : 'artículos'})</span><b>${eur(t.sub)}</b></div><div><span>Envío</span><span>${t.envio ? eur(t.envio) : 'Gratis'}</span></div><div class="total"><span>Total <small>IVA incl.</small></span><span>${eur(t.total)}</span></div></div>
      <a class="btn" href="${url('pedido.html')}">Tramitar pedido</a><a class="btn btn-sec" href="${url('cesta.html')}">Ver cesta</a>`;
  }
  function abrir(el, foco) { $('#capa').hidden = false; el.hidden = false; document.body.style.overflow = 'hidden'; (foco || $('button', el))?.focus(); }
  function cerrar() { $$('.cajon, .panel-cat').forEach(e => e.hidden = true); $('#capa').hidden = true; document.body.style.overflow = ''; const f = $('.filtros.abierto'); if (f) f.classList.remove('abierto'); }
  function abrirCesta() { pintarCajon(); abrir($('#cajon-cesta')); }

  /* ---------- favoritos ---------- */
  const favs = () => leer('bm-favs', []);
  const esFav = id => favs().includes(id);
  function alternarFav(id) { let f = favs(); f = f.includes(id) ? f.filter(x => x !== id) : [id, ...f]; guardar('bm-favs', f); pintarContadores(); return f.includes(id); }

  function pintarContadores() {
    const t = totales();
    $$('[data-cont="cesta"]').forEach(e => { e.textContent = t.uds; e.dataset.n = t.uds; });
    $$('[data-total-cesta]').forEach(e => e.textContent = eur(t.sub));
    const nf = favs().length;
    $$('[data-cont="favs"]').forEach(e => { e.textContent = nf; e.dataset.n = nf; });
  }
  let _t;
  function aviso(txt) { const a = $('#aviso'); a.textContent = txt; a.hidden = false; clearTimeout(_t); _t = setTimeout(() => a.hidden = true, 2600); }

  /* ---------- buscador ---------- */
  function buscar(prods, q) {
    const t = norm(q).split(/\s+/).filter(Boolean);
    if (!t.length) return [];
    const r = [];
    for (const p of prods) {
      if (!t.every(x => p.busca.includes(x))) continue;
      const n = norm(p.nombre);
      let s = 0;
      if (n.startsWith(t[0])) s += 3;
      t.forEach(x => { if ((' ' + n).includes(' ' + x)) s += 2; });
      if (p.ref && norm(p.ref) === norm(q)) s += 10;
      s += Math.min(p.resenas, 5) * .1 + (p.stock ? .3 : 0);
      r.push([s, p]);
    }
    return r.sort((a, b) => b[0] - a[0]).map(x => x[1]);
  }
  function iniciarBuscador() {
    const form = $('#form-buscar'); if (!form) return;
    const inp = $('input', form), caja = $('#sugerencias');
    let sel = -1, ultimo = '';
    const pintar = async () => {
      const q = inp.value.trim();
      if (q.length < 2) { caja.hidden = true; inp.setAttribute('aria-expanded', 'false'); return; }
      ultimo = q;
      const [{ prods }, k] = await Promise.all([catalogo(), categorias()]);
      if (q !== ultimo) return;
      const res = buscar(prods, q).slice(0, 7);
      const tq = norm(q);
      const cats = k.lista.filter(c => c.cuenta && norm(c.n).includes(tq)).sort((a, b) => b.cuenta - a.cuenta).slice(0, 4);
      let h = '';
      if (cats.length) h += '<div class="sug-tit">Categorías</div>' + cats.map(c => `<a class="sug-cat" role="option" href="${url('categoria.html', '?c=' + c.id)}">${esc(c.n)} <small style="color:var(--gris)">(${c.cuenta})</small></a>`).join('');
      if (res.length) h += '<div class="sug-tit">Productos</div>' + res.map(p => `<a class="sug-prod" role="option" href="${url('producto.html', '?id=' + p.id)}"><img src="${fotoP(p, 128)}" alt=""><span>${esc(p.nombre)}</span><b>${eur(p.precio)}</b></a>`).join('');
      h += `<a class="sug-todos" href="${url('categoria.html', '?q=' + encodeURIComponent(q))}">${res.length ? 'Ver todos los resultados' : 'No hay coincidencias exactas. Buscar'} «${esc(q)}» →</a>`;
      caja.innerHTML = h; caja.hidden = false; sel = -1; inp.setAttribute('aria-expanded', 'true');
    };
    let d; inp.addEventListener('input', () => { clearTimeout(d); d = setTimeout(pintar, 120); });
    inp.addEventListener('focus', () => { if (inp.value.trim().length >= 2) pintar(); catalogo(); }, { once: false });
    inp.addEventListener('keydown', e => {
      const ops = $$('a', caja);
      if (caja.hidden || !ops.length) return;
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault(); sel = (sel + (e.key === 'ArrowDown' ? 1 : -1) + ops.length) % ops.length;
        ops.forEach((o, i) => o.classList.toggle('activa', i === sel)); ops[sel].scrollIntoView({ block: 'nearest' });
      } else if (e.key === 'Enter' && sel >= 0) { e.preventDefault(); location.href = ops[sel].href; }
      else if (e.key === 'Escape') { caja.hidden = true; }
    });
    document.addEventListener('click', e => { if (!form.parentElement.contains(e.target)) caja.hidden = true; });
    form.addEventListener('submit', e => { e.preventDefault(); const q = inp.value.trim(); location.href = url('categoria.html', q ? '?q=' + encodeURIComponent(q) : ''); });
    const q0 = new URLSearchParams(location.search).get('q'); if (q0) inp.value = q0;
  }

  /* ---------- panel de categorías ---------- */
  async function iniciarPanel() {
    const panel = $('#panel-cat'); if (!panel) return;
    const k = await categorias();
    const fam = k.familias.filter(c => c.cuenta);
    const principales = fam.filter(c => [6, 12, 2, 5, 7, 8, 3, 4].includes(c.id));
    const otras = fam.filter(c => !principales.includes(c));
    const li = c => `<li data-fam="${c.id}"><button type="button" aria-controls="pc-col2">${c.id ? `<img src="${imgCat(c.id, 128)}" alt="" loading="lazy">` : ''}<span>${esc(c.n)}</span><svg class="ico flecha" aria-hidden="true"><use href="${RAIZ}img/iconos.svg#dcha"/></svg></button></li>`;
    $('.familias', panel).innerHTML = principales.map(li).join('') + (otras.length ? '<li class="sep" role="separator"></li>' + otras.map(c => `<li><a href="${url('categoria.html', '?c=' + c.id)}"><span>${esc(c.n)}</span></a></li>`).join('') : '') +
      `<li class="sep" role="separator"></li><li><a href="${url('marcas.html')}"><span>Todas las marcas</span></a></li><li><a href="${url('categoria.html', '?orden=nuevos')}"><span>Novedades</span></a></li>`;
    const col2 = $('.pc-col2', panel);
    const mostrar = id => {
      const c = k.porId[id];
      $$('.familias li', panel).forEach(l => l.classList.toggle('activa', +l.dataset.fam === id));
      const subs = (k.hijos[id] || []).filter(s => s.cuenta);
      col2.innerHTML = `<button type="button" class="volver-fam">${ICO('izq')} Todas las categorías</button><h2>${esc(c.n)} <a href="${url('categoria.html', '?c=' + id)}">Ver todo (${c.cuenta})</a></h2><div class="subfam">` +
        subs.map(s => `<section><h3><a href="${url('categoria.html', '?c=' + s.id)}">${esc(s.n)}</a></h3><ul>${(k.hijos[s.id] || []).filter(x => x.cuenta).map(x => `<li><a href="${url('categoria.html', '?c=' + x.id)}">${esc(x.n)}</a></li>`).join('')}</ul></section>`).join('') + '</div>';
      $('.volver-fam', col2).onclick = () => { panel.classList.remove('sub'); $('.familias button', panel)?.focus(); };
    };
    $$('.familias [data-fam]', panel).forEach(l => {
      const b = $('button', l), id = +l.dataset.fam;
      b.addEventListener('click', () => { mostrar(id); panel.classList.add('sub'); if (matchMedia('(max-width:960px)').matches) $('.volver-fam', col2).focus(); });
      b.addEventListener('mouseenter', () => { if (matchMedia('(min-width:961px)').matches) mostrar(id); });
    });
    if (principales[0]) mostrar(principales[0].id);
  }

  /* ---------- carruseles ---------- */
  function carrusel(raiz) {
    const pista = $('.carrusel-pista', raiz), [izq, dcha] = $$('.carrusel-flechas button', raiz.closest('.seccion') || raiz);
    if (!pista || !izq) return;
    const paso = () => pista.clientWidth * .9;
    const act = () => { izq.disabled = pista.scrollLeft < 5; dcha.disabled = pista.scrollLeft + pista.clientWidth >= pista.scrollWidth - 5; };
    izq.onclick = () => pista.scrollBy({ left: -paso(), behavior: 'smooth' });
    dcha.onclick = () => pista.scrollBy({ left: paso(), behavior: 'smooth' });
    pista.addEventListener('scroll', act, { passive: true }); addEventListener('resize', act); act();
  }

  /* ---------- eventos globales ---------- */
  function iniciar() {
    pintarContadores();
    document.addEventListener('cesta', pintarContadores);
    iniciarBuscador();
    $('#btn-productos')?.addEventListener('click', () => { iniciarPanel(); abrir($('#panel-cat')); });
    $$('[data-abrir-productos]').forEach(b => b.addEventListener('click', e => { e.preventDefault(); iniciarPanel(); abrir($('#panel-cat')); }));
    $('#btn-cesta')?.addEventListener('click', e => { e.preventDefault(); abrirCesta(); });
    $('#capa')?.addEventListener('click', cerrar);
    $$('[data-cerrar]').forEach(b => b.addEventListener('click', cerrar));
    document.addEventListener('keydown', e => { if (e.key === 'Escape' && !$('#capa').hidden) cerrar(); });
    document.addEventListener('click', async e => {
      const a = e.target.closest('[data-anadir]');
      if (a) {
        const { porId } = await catalogo(); const p = porId[+a.dataset.anadir]; if (!p) return;
        anadir(p, 1); a.classList.add('hecho'); setTimeout(() => a.classList.remove('hecho'), 1200); abrirCesta(); return;
      }
      const f = e.target.closest('[data-fav]');
      if (f) { const on = alternarFav(+f.dataset.fav); f.setAttribute('aria-pressed', on); aviso(on ? 'Guardado en tus favoritos' : 'Quitado de favoritos'); return; }
      const m = e.target.closest('[data-mas],[data-menos],[data-quitar]');
      if (m) {
        const id = +(m.dataset.mas || m.dataset.menos || m.dataset.quitar); const l = cesta().find(x => x.id === id); if (!l) return;
        cambiar(id, m.dataset.quitar ? 0 : l.n + (m.dataset.mas ? 1 : -1)); if (!$('#cajon-cesta').hidden) pintarCajon();
      }
    });
    document.addEventListener('change', e => { const c = e.target.closest('[data-cant]'); if (c) { cambiar(+c.dataset.cant, parseInt(c.value) || 0); if (!$('#cajon-cesta').hidden) pintarCajon(); } });
    $$('.carrusel').forEach(carrusel);
    // boletín
    $$('.form-boletin').forEach(f => f.addEventListener('submit', e => { e.preventDefault(); f.innerHTML = '<p class="ok">¡Gracias! Te avisaremos de las novedades y ofertas.</p>'; }));
    // cookies
    const ck = $('#cookies');
    if (ck && !leer('bm-cookies', null)) { ck.hidden = false; $$('button', ck).forEach(b => b.onclick = () => { guardar('bm-cookies', b.dataset.v); ck.hidden = true; }); }
    // plegables
    $$('[data-plegar]').forEach(b => b.addEventListener('click', () => { const p = document.getElementById(b.dataset.plegar); const ab = p.classList.toggle('abierto'); b.textContent = ab ? 'Leer menos' : 'Leer más'; b.setAttribute('aria-expanded', ab); }));
  }
  document.addEventListener('DOMContentLoaded', iniciar);

  return { fotoP, esLento, ODOO, WHATSAPP, ENVIO, GRATIS_DESDE, RAIZ, $, $$, esc, norm, eur, img, imgCat, imgMarca, url, ICO, catalogo, categorias, tarjeta, precioHTML, disponibilidad, estrellas, textoEntrega, cesta, anadir, cambiar, totales, barraEnvio, lineaHTML, abrirCesta, favs, esFav, alternarFav, aviso, buscar, carrusel, guardar, leer, abrir, cerrar };
})();
