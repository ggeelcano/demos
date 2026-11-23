(() => {
  const WEB = 'https://www.ranking.es';
  const $ = s => document.querySelector(s);
  const eur = new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' });
  const num = p => parseFloat(String(p).replace(/\./g, '').replace(',', '.'));
  const norm = s => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  const esc = s => s.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const limpio = n => n.replace(/\.?\s*Ud\.?$/i, '').replace(/\.$/, '');
  const foto = p => 'img/p-' + p.ref + '.jpg';
  const ENVIO_GRATIS = 100;
  PRODUCTOS.forEach(p => { p.precio = num(p.p); p.url = WEB + p.u; });

  /* ---------- Menú de escritorio con desplegable ---------- */
  const lista = $('#menu-lista'), mega = $('#mega');
  CATEGORIAS.forEach((c, i) => {
    const li = document.createElement('li');
    li.innerHTML = `<button type="button" aria-expanded="false" aria-controls="mega" data-i="${i}">${esc(c.c)}</button>`;
    lista.appendChild(li);
  });
  lista.insertAdjacentHTML('beforeend', `<li><a class="m-nov" href="${WEB}/novedades/">Novedades</a></li>`);

  let abierta = -1, tCierre, tHover = 0;
  function abrirMega(i, porHover) {
    clearTimeout(tCierre);
    if (abierta === i) return;
    if (porHover) tHover = Date.now();
    const c = CATEGORIAS[i];
    mega.innerHTML = `<div class="contenedor mega-in">
        <div><h2>${esc(c.n)}</h2><ul>${c.subs.map(s => `<li><a href="${WEB + s[1]}">${esc(s[0])}</a></li>`).join('')}</ul></div>
        <a class="mega-foto" href="${WEB + c.u}"><img src="img/${c.img}.jpg" alt="" width="600" height="600"><span>Ver todo ${esc(c.c.toLowerCase())} →</span></a>
      </div>`;
    mega.hidden = false;
    lista.querySelectorAll('button').forEach(b => b.setAttribute('aria-expanded', String(+b.dataset.i === i)));
    abierta = i;
  }
  function cerrarMega() {
    mega.hidden = true; abierta = -1;
    lista.querySelectorAll('button').forEach(b => b.setAttribute('aria-expanded', 'false'));
  }
  lista.addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b) return;
    if (+b.dataset.i !== abierta) return abrirMega(+b.dataset.i);
    if (Date.now() - tHover > 600) cerrarMega(); // si se acaba de abrir al pasar el ratón, el clic no lo cierra
  });
  lista.addEventListener('mouseover', e => {
    const b = e.target.closest('button');
    if (b && matchMedia('(hover: hover)').matches) abrirMega(+b.dataset.i, true);
  });
  $('.menu').addEventListener('mouseleave', () => { tCierre = setTimeout(cerrarMega, 180); });
  $('.menu').addEventListener('mouseenter', () => clearTimeout(tCierre));
  document.addEventListener('click', e => { if (!e.target.closest('.menu')) cerrarMega(); });

  /* ---------- Cajón móvil ---------- */
  $('#cajon-lista').innerHTML = CATEGORIAS.map(c => `<details>
      <summary><img src="img/${c.img}.jpg" alt="" width="40" height="40">${esc(c.n)}</summary>
      <ul>${c.subs.map(s => `<li><a href="${WEB + s[1]}">${esc(s[0])}</a></li>`).join('')}
      <li><a class="ver-todo" href="${WEB + c.u}">Ver todo</a></li></ul>
    </details>`).join('') + `<a class="cajon-nov" href="${WEB}/novedades/">Novedades</a>`;

  const velo = $('#velo');
  let ultimoFoco = null;
  function abrirPanel(id, boton) {
    cerrarPaneles();
    ultimoFoco = boton || document.activeElement;
    $('#' + id).hidden = false; velo.hidden = false;
    document.querySelectorAll(`[aria-controls="${id}"]`).forEach(b => b.setAttribute('aria-expanded', 'true'));
    document.body.style.overflow = 'hidden';
    $('#' + id).querySelector('button, a').focus();
  }
  function cerrarPaneles() {
    ['cajon', 'cesta'].forEach(id => {
      const p = $('#' + id); if (p.hidden) return;
      p.hidden = true;
      document.querySelectorAll(`[aria-controls="${id}"]`).forEach(b => b.setAttribute('aria-expanded', 'false'));
    });
    velo.hidden = true; document.body.style.overflow = '';
  }
  $('.hamburguesa').addEventListener('click', e => abrirPanel('cajon', e.currentTarget));
  $('.cesta-btn').addEventListener('click', e => abrirPanel('cesta', e.currentTarget));
  velo.addEventListener('click', () => { cerrarPaneles(); ultimoFoco && ultimoFoco.focus(); });
  document.querySelectorAll('[data-cerrar]').forEach(b => b.addEventListener('click', () => { cerrarPaneles(); ultimoFoco && ultimoFoco.focus(); }));
  document.querySelectorAll('[data-cierra]').forEach(a => a.addEventListener('click', cerrarPaneles));
  document.addEventListener('keydown', e => {
    if (e.key !== 'Escape') return;
    if (!mega.hidden) { const b = lista.querySelector('[aria-expanded="true"]'); cerrarMega(); b && b.focus(); }
    if (!velo.hidden) { cerrarPaneles(); ultimoFoco && ultimoFoco.focus(); }
    cerrarSug();
  });

  /* ---------- Categorías ---------- */
  $('#categorias-lista').innerHTML = CATEGORIAS.map(c => `<li><a href="${WEB + c.u}">
      <img src="img/${c.img}.jpg" alt="" width="600" height="600" loading="lazy">
      <span class="c-txt"><b>${esc(c.n)}</b><small>${c.subs.length} secciones</small></span></a></li>`).join('') +
    `<li><a class="c-nov" href="${WEB}/novedades/"><img src="img/m-novedades.jpg" alt="" width="600" height="600" loading="lazy">
      <span class="c-txt"><b>Novedades</b><small>Lo último que ha entrado</small></span></a></li>`;

  /* ---------- Productos ---------- */
  const icoCesta = '<svg aria-hidden="true" viewBox="0 0 24 24"><path d="M3 4h2l2.4 11h11l2-8H6.2"/><circle cx="9" cy="20" r="1.4"/><circle cx="18" cy="20" r="1.4"/></svg>';
  $('#productos').innerHTML = PRODUCTOS.filter(p => !['K998', '47085'].includes(p.ref)).slice(0, 8).map(p => `<li><article class="prod">
      <span class="chip-nuevo">Novedad</span>
      <a class="prod-foto" href="${p.url}" tabindex="-1" aria-hidden="true"><img src="${foto(p)}" alt="" width="486" height="335" loading="lazy"></a>
      <div class="prod-txt">
        <span class="prod-ref">Ref. ${esc(p.ref)}</span>
        <a class="prod-nombre" href="${p.url}">${esc(limpio(p.n))}</a>
        <p class="prod-precio">desde <b>${eur.format(p.precio)}</b> + IVA</p>
        <button class="prod-anadir" type="button" data-ref="${esc(p.ref)}">${icoCesta}<span>Añadir</span></button>
      </div></article></li>`).join('');
  $('#productos').addEventListener('click', e => {
    const b = e.target.closest('.prod-anadir'); if (!b) return;
    anadir(b.dataset.ref, 1);
    b.classList.add('hecho'); b.querySelector('span').textContent = 'Añadido';
    setTimeout(() => { b.classList.remove('hecho'); b.querySelector('span').textContent = 'Añadir'; }, 1600);
  });

  /* ---------- Cesta ---------- */
  const cesta = new Map();
  const toast = $('#toast'); let tToast;
  function aviso(txt) {
    toast.textContent = txt; toast.classList.add('ver');
    clearTimeout(tToast); tToast = setTimeout(() => toast.classList.remove('ver'), 2400);
  }
  function anadir(ref, uds) {
    const p = PRODUCTOS.find(x => x.ref.toUpperCase() === ref.toUpperCase());
    if (!p) return null;
    cesta.set(p.ref, (cesta.get(p.ref) || 0) + uds);
    pintarCesta();
    const bur = $('#burbuja'); bur.classList.remove('salta'); void bur.offsetWidth; bur.classList.add('salta');
    aviso(`Añadido a la cesta: ${uds} × ${limpio(p.n)}`);
    return p;
  }
  function pintarCesta() {
    let uds = 0, base = 0;
    const filas = [...cesta].map(([ref, n]) => {
      const p = PRODUCTOS.find(x => x.ref === ref); uds += n; base += p.precio * n;
      return `<li><img src="${foto(p)}" alt="" width="72" height="50">
        <div><span class="l-nombre">${esc(limpio(p.n))}</span><span class="l-ref">Ref. ${esc(p.ref)}</span>
          <div class="cant"><button type="button" data-menos="${esc(ref)}" aria-label="Quitar una unidad">−</button><span aria-label="${n} unidades">${n}</span><button type="button" data-mas="${esc(ref)}" aria-label="Añadir una unidad">+</button></div>
          <button type="button" class="quitar" data-quitar="${esc(ref)}">Quitar</button></div>
        <span class="l-precio">${eur.format(p.precio * n)}</span></li>`;
    });
    $('#cesta-lista').innerHTML = filas.length ? filas.join('') : '<li class="cesta-vacia">Tu cesta está vacía.</li>';
    $('#cesta-pie').hidden = !filas.length;
    const bur = $('#burbuja'); bur.textContent = uds; bur.setAttribute('aria-label', uds + (uds === 1 ? ' producto' : ' productos'));
    $('#t-base').textContent = eur.format(base);
    $('#t-iva').textContent = eur.format(base * .21);
    $('#t-total').textContent = eur.format(base * 1.21);
    const falta = ENVIO_GRATIS - base, env = $('#envio');
    env.classList.toggle('gratis', falta <= 0);
    $('#envio-txt').innerHTML = !filas.length ? `<b>Envío gratis</b> desde ${eur.format(ENVIO_GRATIS)} sin IVA en la península.`
      : falta > 0 ? `Te faltan <b>${eur.format(falta)}</b> para el envío gratis.` : '<b>¡Tienes el envío gratis!</b>';
    $('#envio-barra').style.width = Math.min(100, base / ENVIO_GRATIS * 100) + '%';
    $('#cesta-nota').hidden = true;
  }
  $('#cesta-lista').addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b) return;
    const r = b.dataset.mas || b.dataset.menos || b.dataset.quitar;
    if (b.dataset.mas) cesta.set(r, cesta.get(r) + 1);
    if (b.dataset.menos) cesta.get(r) > 1 ? cesta.set(r, cesta.get(r) - 1) : cesta.delete(r);
    if (b.dataset.quitar) cesta.delete(r);
    pintarCesta();
    const sig = $(`#cesta-lista [data-${b.dataset.mas ? 'mas' : 'menos'}="${r}"]`);
    (sig || $('#cesta [data-cerrar]')).focus();
  });
  $('#tramitar').addEventListener('click', () => { $('#cesta-nota').hidden = false; });
  pintarCesta();

  /* ---------- Pedido rápido por referencia ---------- */
  const fr = $('#form-rapido'), msg = $('#rapido-msg');
  fr.addEventListener('submit', e => {
    e.preventDefault();
    const ref = fr.ref.value.trim(), uds = Math.max(1, Math.min(999, parseInt(fr.uds.value, 10) || 1));
    msg.className = 'rapido-msg';
    if (!ref) { msg.textContent = 'Escribe la referencia que viene en el catálogo.'; msg.classList.add('mal'); fr.ref.focus(); return; }
    const p = anadir(ref, uds);
    if (p) {
      msg.textContent = `✓ ${uds} × ${limpio(p.n)} (${eur.format(p.precio)} + IVA/ud.)`; msg.classList.add('ok');
      fr.ref.value = ''; fr.uds.value = 1; fr.ref.focus();
    } else {
      msg.textContent = `No encontramos la referencia «${ref}». Revísala o llámanos al 948 31 60 70.`; msg.classList.add('mal');
      fr.ref.select();
    }
  });
  document.querySelectorAll('.ref-ej').forEach(b => b.addEventListener('click', () => { fr.ref.value = b.textContent; fr.uds.focus(); fr.uds.select(); }));

  /* ---------- Buscador con sugerencias ---------- */
  const q = $('#q'), sug = $('#sugerencias');
  const indice = [];
  CATEGORIAS.forEach(c => {
    indice.push({ t: 'c', n: c.n, meta: c.subs.length + ' secciones', url: WEB + c.u });
    c.subs.forEach(s => indice.push({ t: 'c', n: s[0], meta: c.n, url: WEB + s[1] }));
  });
  const resaltar = (txt, term) => {
    const i = norm(txt).indexOf(term);
    return i < 0 ? esc(txt) : esc(txt.slice(0, i)) + '<mark>' + esc(txt.slice(i, i + term.length)) + '</mark>' + esc(txt.slice(i + term.length));
  };
  function cerrarSug() { sug.hidden = true; q.setAttribute('aria-expanded', 'false'); }
  function buscar() {
    const t = norm(q.value.trim());
    if (t.length < 2) return cerrarSug();
    const prods = PRODUCTOS.filter(p => norm(p.n + ' ' + p.ref).includes(t)).slice(0, 5);
    const vistos = new Set();
    const cats = indice.filter(c => norm(c.n).includes(t) && !vistos.has(c.url) && vistos.add(c.url)).slice(0, 5);
    let html = '';
    if (prods.length) html += '<h3>Productos</h3>' + prods.map(p => `<a href="${p.url}"><img src="${foto(p)}" alt="" width="52" height="36"><span class="s-nombre">${resaltar(limpio(p.n), t)}<span class="s-meta">Ref. ${resaltar(p.ref, t)}</span></span><span class="s-precio">${eur.format(p.precio)}</span></a>`).join('');
    if (cats.length) html += '<h3>Categorías</h3>' + cats.map(c => `<a href="${c.url}"><span class="s-nombre">${resaltar(c.n, t)}<span class="s-meta">${esc(c.meta)}</span></span></a>`).join('');
    if (!html) html = `<p class="vacio">No hay resultados para «${esc(q.value.trim())}». Llámanos al 948 31 60 70 y te lo buscamos.</p>`;
    sug.innerHTML = html; sug.hidden = false; q.setAttribute('aria-expanded', 'true');
  }
  q.addEventListener('input', buscar);
  q.addEventListener('focus', buscar);
  $('#buscador').addEventListener('submit', e => {
    e.preventDefault();
    const primero = sug.querySelector('a');
    if (primero) location.href = primero.href; else buscar();
  });
  q.addEventListener('keydown', e => { if (e.key === 'ArrowDown') { const a = sug.querySelector('a'); if (a) { e.preventDefault(); a.focus(); } } });
  sug.addEventListener('keydown', e => {
    const as = [...sug.querySelectorAll('a')], i = as.indexOf(document.activeElement);
    if (e.key === 'ArrowDown' && i < as.length - 1) { e.preventDefault(); as[i + 1].focus(); }
    if (e.key === 'ArrowUp') { e.preventDefault(); i > 0 ? as[i - 1].focus() : q.focus(); }
  });
  document.addEventListener('click', e => { if (!e.target.closest('.buscador')) cerrarSug(); });
})();
