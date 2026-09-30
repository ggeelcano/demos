'use strict';
// Demo de tienda para La Gusta Vieja. Catálogo real (catalog.json) sacado de lagustavieja.com.
// No cobra nada: la cesta se envía por WhatsApp y cada ficha enlaza con la tienda oficial.
const $ = s => document.querySelector(s);
const WA = '34622123420';
const ENVIO_GRATIS = 100;
const POR_PAGINA = 24;
const BASE = 'https://lagustavieja.com/';
const money = n => new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(n);
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const norm = s => String(s).normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();
const waLink = texto => `https://wa.me/${WA}?text=${encodeURIComponent(texto)}`;
const WA_SVG = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Z"/><path d="M9 8.5c.2-.5.4-.5.7-.5h.5c.2 0 .4.1.5.4l.7 1.7c.1.2 0 .4-.1.6l-.5.6c-.1.1-.2.3 0 .5a7 7 0 0 0 3.3 3c.2.1.4.1.5-.1l.7-.8c.2-.2.4-.2.6-.1l1.7.8c.3.1.4.3.4.5 0 .6-.3 1.4-.8 1.7-.6.4-1.3.5-2 .3A9.4 9.4 0 0 1 8.6 11c-.2-.9-.1-1.8.4-2.5Z"/></svg>';

let productos = [], orden = [], tiles = [], cesta = [];
const estado = { cat: 'Todos', sub: null, sub2: null, q: '', soloDisponibles: true, orden: 'rec', limite: POR_PAGINA };
let toastTimer;

function aviso(msg) {
  $('#toast').textContent = msg; $('#toast').classList.add('show');
  clearTimeout(toastTimer); toastTimer = setTimeout(() => $('#toast').classList.remove('show'), 2600);
}
const porId = id => productos.find(p => p.id === +id);
const imagen = (p, grande) => p.img ? `${BASE}${p.img.split('/')[0]}-${grande ? 'large' : 'home'}_default/${p.img.split('/')[1]}.jpg` : '';
const rutaPrincipal = p => p.rutas.slice().sort((a, b) => b.length - a.length)[0];
const textoAgotado = p => `Hola, La Gusta Vieja. ¿Cuándo volveréis a tener «${p.nombre}»? Me gustaría reservarlo. Gracias.`;

// ---------- filtros ----------
function enCategoria(p) {
  if (estado.cat === 'Todos') return true;
  return p.rutas.some(r => r[0] === estado.cat && (!estado.sub || r[1] === estado.sub) && (!estado.sub2 || r[2] === estado.sub2));
}
function coincide(p) {
  if (!estado.q) return true;
  return p.texto.includes(estado.q);
}
function listaFiltrada(ignorarDisponibles) {
  return productos.filter(p => enCategoria(p) && coincide(p) && (ignorarDisponibles || !estado.soloDisponibles || !p.agotado));
}
function ordenar(lista) {
  const l = lista.slice();
  if (estado.orden === 'low') l.sort((a, b) => a.precio - b.precio);
  else if (estado.orden === 'high') l.sort((a, b) => b.precio - a.precio);
  else if (estado.orden === 'az') l.sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
  else l.sort((a, b) => (a.agotado - b.agotado) || (a.orden - b.orden));
  return l;
}
function elegirCategoria(cat, sub = null, sub2 = null, desplazar = false) {
  estado.cat = cat; estado.sub = sub; estado.sub2 = sub2; estado.limite = POR_PAGINA;
  pintar();
  if (desplazar) $('#catalogo').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// ---------- pintado ----------
function pintarChips() {
  const cuenta = c => productos.filter(p => p.rutas.some(r => r[0] === c) && (!estado.soloDisponibles || !p.agotado)).length;
  $('#cats').innerHTML = ['Todos', ...orden].map(c => `<button data-cat="${esc(c)}" aria-pressed="${estado.cat === c}">${esc(c)}${c === 'Todos' ? '' : `<small>${cuenta(c)}</small>`}</button>`).join('');
  const subs = new Map();
  if (estado.cat !== 'Todos') for (const p of productos) for (const r of p.rutas) if (r[0] === estado.cat && r[1] && (!estado.soloDisponibles || !p.agotado)) subs.set(r[1], (subs.get(r[1]) || 0) + 1);
  const listaSubs = [...subs.entries()].sort((a, b) => b[1] - a[1]);
  $('#subs').hidden = !listaSubs.length;
  $('#subs').innerHTML = listaSubs.length ? `<button data-sub="" aria-pressed="${!estado.sub}">Todo en ${esc(estado.cat)}</button>` + listaSubs.map(([s, n]) => `<button data-sub="${esc(s)}" aria-pressed="${estado.sub === s}">${esc(s)}<small>${n}</small></button>`).join('') : '';
  const subs2 = new Map();
  if (estado.sub) for (const p of productos) for (const r of p.rutas) if (r[0] === estado.cat && r[1] === estado.sub && r[2] && (!estado.soloDisponibles || !p.agotado)) subs2.set(r[2], (subs2.get(r[2]) || 0) + 1);
  const listaSubs2 = [...subs2.entries()].sort((a, b) => b[1] - a[1]);
  $('#subs2').hidden = listaSubs2.length < 2;
  $('#subs2').innerHTML = listaSubs2.length >= 2 ? `<button data-sub2="" aria-pressed="${!estado.sub2}">Todos</button>` + listaSubs2.map(([s, n]) => `<button data-sub2="${esc(s)}" aria-pressed="${estado.sub2 === s}">${esc(s)} (${n})</button>`).join('') : '';
  const activo = document.querySelector('#cats [aria-pressed=true]');
  activo && activo.scrollIntoView({ block: 'nearest', inline: 'center' });
}
function tarjeta(p) {
  const ruta = rutaPrincipal(p);
  const src = imagen(p);
  return `<article class="card${p.agotado ? ' out' : ''}" data-id="${p.id}">
    <button class="card-img" data-detail="${p.id}" aria-label="Ver ${esc(p.nombre)}">
      ${src ? `<img src="${src}" alt="" loading="lazy" width="236" height="305" onerror="this.replaceWith(Object.assign(document.createElement('span'),{className:'noimg',textContent:'${esc(p.nombre[0])}'}))">` : `<span class="noimg">${esc(p.nombre[0])}</span>`}
      ${p.agotado ? '<span class="tag">Agotado</span>' : ''}
    </button>
    <p class="card-cat">${esc(ruta[ruta.length - 1] === ruta[0] ? ruta[0] : ruta.slice(1).join(' · '))}</p>
    <button class="card-title" data-detail="${p.id}">${esc(p.nombre)}</button>
    <div class="card-bottom">
      <span class="price">${money(p.precio)}</span>
      ${p.agotado
        ? `<a class="mini wa" href="${waLink(textoAgotado(p))}" target="_blank" rel="noopener" aria-label="Avisarme por WhatsApp cuando vuelva ${esc(p.nombre)}">${WA_SVG}Avísame</a>`
        : `<button class="mini add" data-add="${p.id}" aria-label="Añadir ${esc(p.nombre)} a la cesta">+</button>`}
    </div>
  </article>`;
}
function pintar() {
  pintarChips();
  const lista = ordenar(listaFiltrada(false));
  const ocultos = estado.soloDisponibles ? listaFiltrada(true).length - lista.length : 0;
  const donde = estado.cat === 'Todos' ? '' : ' en ' + [estado.cat, estado.sub, estado.sub2].filter(Boolean).join(' › ');
  $('#resultCount').innerHTML = `${lista.length} ${lista.length === 1 ? 'producto' : 'productos'}${estado.q ? ' para «' + esc(estado.q) + '»' : ''}${esc(donde)}`
    + (ocultos ? ` · <button data-ver-agotados>${ocultos} agotados ocultos</button>` : '')
    + (estado.q && estado.cat !== 'Todos' ? ` · <button data-buscar-todo>buscar en toda la tienda</button>` : '');
  $('#products').innerHTML = lista.length ? lista.slice(0, estado.limite).map(tarjeta).join('')
    : `<div class="empty"><h3>${estado.q ? 'No encontramos ese producto.' : 'Nada por aquí ahora mismo.'}</h3><p>${estado.q ? 'Prueba con otro nombre o pregúntanos por WhatsApp: si no está en la web, lo buscamos.' : 'Esta categoría no tiene productos disponibles.'}</p>${estado.q ? `<a class="btn wa" href="${waLink('Hola, La Gusta Vieja. Estoy buscando: ' + estado.q)}" target="_blank" rel="noopener">Preguntar por WhatsApp</a>` : ''}<button class="btn secondary" data-reset>Ver toda la tienda</button></div>`;
  $('#loadMore').hidden = lista.length <= estado.limite;
  $('#loadMore').textContent = `Ver más productos (${Math.max(0, lista.length - estado.limite)} más)`;
}
function pintarTiles() {
  $('#tiles').innerHTML = tiles.map(t => `<button class="tile" data-tile="${esc(t.cat)}"><img src="${esc(t.img)}" alt="" loading="lazy" width="300" height="330"><span>${esc(t.cat)}</span></button>`).join('');
}

// ---------- ficha ----------
function abrirFicha(id) {
  const p = porId(id); if (!p) return;
  const ruta = rutaPrincipal(p);
  const src = imagen(p, true);
  $('#productDetail').innerHTML = `<div class="detail">
    <div class="detail-photo">${src ? `<img src="${src}" alt="${esc(p.nombre)}" width="381" height="492">` : `<span class="noimg">${esc(p.nombre[0])}</span>`}</div>
    <div class="detail-copy">
      <p class="crumbs">${ruta.map(esc).join('<span aria-hidden="true">›</span>')}</p>
      <h2 id="detailTitle">${esc(p.nombre)}</h2>
      <p class="price">${money(p.precio)}</p>
      <p class="availability ${p.agotado ? 'out' : 'ok'}">${p.agotado ? 'Agotado temporalmente' : 'Disponible · envío en 48 h'}</p>
      ${p.desc ? `<p class="detail-desc">${esc(p.desc)}</p>` : ''}
      ${/^Vinos$/.test(ruta[0]) || p.rutas.some(r => r[1] === 'Vinos') ? '<p class="detail-desc">Venta de bebidas alcohólicas solo a mayores de 18 años.</p>' : ''}
      <div class="detail-actions">
        ${p.agotado
          ? `<a class="btn wa" href="${waLink(textoAgotado(p))}" target="_blank" rel="noopener">${WA_SVG}Avísame por WhatsApp</a>`
          : `<div class="qty"><button id="qtyMinus" aria-label="Una unidad menos">−</button><input id="qty" type="number" min="1" max="99" value="1" aria-label="Cantidad"><button id="qtyPlus" aria-label="Una unidad más">+</button></div><button class="btn navy" id="detailAdd">Añadir a la cesta</button>`}
      </div>
      <a class="detail-link" href="${esc(BASE + p.url)}" target="_blank" rel="noopener">Ver esta ficha en lagustavieja.com ↗</a>
    </div></div>`;
  if (!p.agotado) {
    $('#qtyMinus').onclick = () => { $('#qty').value = Math.max(1, (+$('#qty').value || 1) - 1); };
    $('#qtyPlus').onclick = () => { $('#qty').value = Math.min(99, (+$('#qty').value || 1) + 1); };
    $('#detailAdd').onclick = () => { anadir(p.id, +$('#qty').value || 1); $('#productDialog').close(); };
  }
  $('#productDialog').showModal();
  $('#productDialog .close').focus();
}

// ---------- cesta ----------
function guardarCesta() { try { sessionStorage.setItem('gustavieja-cesta', JSON.stringify(cesta)); } catch (e) {} pintarCesta(); }
function anadir(id, cantidad = 1) {
  const p = porId(id);
  if (!p || p.agotado) { aviso('Ese producto está agotado: pídelo por WhatsApp'); return; }
  cantidad = Math.min(99, Math.max(1, Math.round(cantidad)));
  const linea = cesta.find(l => l.id === p.id);
  if (linea) linea.cantidad = Math.min(99, linea.cantidad + cantidad); else cesta.push({ id: p.id, cantidad });
  guardarCesta();
  aviso(`Añadido: ${p.nombre}`);
}
function cambiarCantidad(id, delta) {
  const linea = cesta.find(l => l.id === +id); if (!linea) return;
  linea.cantidad = Math.min(99, linea.cantidad + delta);
  cesta = cesta.filter(l => l.cantidad > 0);
  guardarCesta();
}
function pintarCesta() {
  const unidades = cesta.reduce((n, l) => n + l.cantidad, 0);
  $('#cartCount').textContent = unidades;
  $('#cartOpen').setAttribute('aria-label', `Abrir cesta, ${unidades} ${unidades === 1 ? 'producto' : 'productos'}`);
  if (!unidades) {
    $('#cartContent').innerHTML = `<div class="cart-empty"><h3>Tu cesta está vacía</h3><p>Añade lo que te apetezca y te lo preparamos.</p><button class="btn navy" data-close="cartDialog">Ver la tienda</button></div>`;
    return;
  }
  let total = 0;
  const filas = cesta.map(l => {
    const p = porId(l.id); const sub = p.precio * l.cantidad; total += sub;
    return `<div class="cart-item">${imagen(p) ? `<img src="${imagen(p)}" alt="">` : '<span class="noimg"></span>'}<div><h3>${esc(p.nombre)}</h3><div class="cart-item-meta"><div class="qty"><button data-menos="${p.id}" aria-label="Quitar una unidad de ${esc(p.nombre)}">−</button><span>${l.cantidad}</span><button data-mas="${p.id}" aria-label="Añadir una unidad de ${esc(p.nombre)}">+</button></div><span class="price">${money(sub)}</span></div><button class="remove" data-quitar="${p.id}">Quitar</button></div></div>`;
  }).join('');
  const falta = ENVIO_GRATIS - total;
  const pedido = ['Hola, La Gusta Vieja. Quiero hacer este pedido:', ...cesta.map(l => { const p = porId(l.id); return `• ${l.cantidad} × ${p.nombre} (${money(p.precio)})`; }), `Subtotal: ${money(total)}`, falta > 0 ? 'Envío: a calcular' : 'Envío: gratis (península)', '', 'Nombre y dirección de entrega:', ''].join('\n');
  $('#cartContent').innerHTML = filas + `
    <div class="shipping">${falta > 0 ? `Te faltan <strong>${money(falta)}</strong> para el envío gratis en península.` : '<strong>Envío gratis</strong> en península: has superado los 100 €.'}<div class="shipping-bar"><div style="width:${Math.min(100, total / ENVIO_GRATIS * 100)}%"></div></div></div>
    <div class="total-line"><span>Subtotal</span><strong>${money(total)}</strong></div>
    <div class="cart-actions">
      <a class="btn wa" href="${waLink(pedido)}" target="_blank" rel="noopener">${WA_SVG}Enviar el pedido por WhatsApp</a>
      <button class="btn secondary" data-close="cartDialog">Seguir comprando</button>
      <button class="remove" data-vaciar>Vaciar la cesta</button>
    </div>
    <p class="cart-note">En la tienda definitiva este paso lleva al pago con tarjeta, Bizum o PayPal. Aquí no se cobra nada: el pedido sale como mensaje de WhatsApp para que lo confirméis.</p>`;
}

// ---------- eventos ----------
document.addEventListener('click', e => {
  const b = e.target.closest('button,a'); if (!b) return;
  const d = b.dataset;
  if (d.close) { $('#' + d.close).close(); return; }
  if (d.detail) abrirFicha(d.detail);
  else if (d.add) anadir(d.add);
  else if (d.cat) elegirCategoria(d.cat);
  else if ('sub' in d) elegirCategoria(estado.cat, d.sub || null);
  else if ('sub2' in d) elegirCategoria(estado.cat, estado.sub, d.sub2 || null);
  else if (d.tile) elegirCategoria(d.tile, null, null, true);
  else if ('reset' in d) { $('#search').value = ''; estado.q = ''; $('#searchClear').hidden = true; elegirCategoria('Todos'); }
  else if ('verAgotados' in d) { $('#onlyAvailable').checked = false; estado.soloDisponibles = false; pintar(); }
  else if ('buscarTodo' in d) elegirCategoria('Todos');
  else if (d.mas) cambiarCantidad(d.mas, 1);
  else if (d.menos) cambiarCantidad(d.menos, -1);
  else if (d.quitar) { cesta = cesta.filter(l => l.id !== +d.quitar); guardarCesta(); }
  else if ('vaciar' in d) { cesta = []; guardarCesta(); }
});
let temporizador;
$('#search').addEventListener('input', () => {
  clearTimeout(temporizador);
  temporizador = setTimeout(() => {
    estado.q = norm($('#search').value.trim()); estado.limite = POR_PAGINA;
    $('#searchClear').hidden = !estado.q;
    // el buscador de la cabecera busca en toda la tienda; las categorías se pueden volver a acotar después
    if (estado.q) { estado.cat = 'Todos'; estado.sub = null; estado.sub2 = null; }
    pintar();
    if (estado.q && window.scrollY > $('#catalogo').offsetTop) $('#catalogo').scrollIntoView({ block: 'start' });
  }, 180);
});
$('#search').addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); $('#catalogo').scrollIntoView({ behavior: 'smooth', block: 'start' }); } });
$('#searchClear').onclick = () => { $('#search').value = ''; $('#search').dispatchEvent(new Event('input')); $('#search').focus(); };
$('#onlyAvailable').addEventListener('change', () => { estado.soloDisponibles = $('#onlyAvailable').checked; estado.limite = POR_PAGINA; pintar(); });
$('#sort').addEventListener('change', () => { estado.orden = $('#sort').value; estado.limite = POR_PAGINA; pintar(); });
$('#loadMore').onclick = () => { estado.limite += POR_PAGINA; pintar(); };
$('#cartOpen').onclick = () => { pintarCesta(); $('#cartDialog').showModal(); $('#cartDialog .close').focus(); };
document.querySelectorAll('dialog').forEach(d => d.addEventListener('click', e => {
  if (e.target !== d) return;
  const r = d.getBoundingClientRect();
  if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) d.close();
}));

// ---------- arranque ----------
async function iniciar() {
  try {
    const r = await fetch('catalog.json?v=' + (document.documentElement.dataset.v || ''));
    if (!r.ok) throw new Error('catalog');
    const datos = await r.json();
    productos = datos.p.map((x, i) => ({ id: x[0], nombre: x[1], precio: x[2], agotado: !!x[3], desc: x[4], url: x[5], img: x[6], rutas: x[7], orden: i, texto: norm(x[1] + ' ' + x[4] + ' ' + x[7].flat().join(' ')) }));
    orden = datos.orden.filter(c => productos.some(p => p.rutas.some(r => r[0] === c)));
    tiles = datos.tiles;
    try {
      const guardada = JSON.parse(sessionStorage.getItem('gustavieja-cesta') || '[]');
      if (Array.isArray(guardada)) cesta = guardada.filter(l => l && Number.isInteger(l.cantidad) && l.cantidad > 0 && porId(l.id) && !porId(l.id).agotado);
    } catch (e) {}
    pintarTiles(); pintar(); pintarCesta();
  } catch (e) {
    $('#resultCount').textContent = 'No se ha podido cargar el catálogo.';
    $('#products').innerHTML = '<div class="empty"><h3>Vuelve a intentarlo</h3><p>No hemos podido cargar los productos.</p><button class="btn secondary" id="retry">Recargar</button></div>';
    $('#retry').onclick = iniciar;
  }
}
iniciar();
