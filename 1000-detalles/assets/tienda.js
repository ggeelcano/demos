/* 1000 Detalles: menú, cesta, listados, ficha de producto y pedido (sin dependencias) */
(() => {
  'use strict';
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const euros = n => (Math.round(n * 100) / 100).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €';
  const norm = s => (s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const REMOTO = 'https://www.1000detalles.com';
  const ENVIO = 5.5, GRATIS = 110, WA = '34611375373';
  const ICO = {
    wa: '<svg class="ico" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8s-.4-.1-.6.1-.7.8-.8 1-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.3-.4.3-.4.7-1.3a.5.5 0 0 0 0-.5l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.7 11.8 11.8 0 0 0 4.5 4c1.7.7 2.3.8 3.2.6a2.7 2.7 0 0 0 1.8-1.2 2.2 2.2 0 0 0 .1-1.3c0-.1-.2-.2-.4-.3z"/></svg>',
    camion: '<svg class="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M2 6h11v9H2zM13 9h4l3 3v3h-7"/><circle cx="6" cy="17" r="2"/><circle cx="17" cy="17" r="2"/></svg>',
    tarjeta: '<svg class="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><rect x="2.5" y="5" width="19" height="14" rx="2"/><path d="M2.5 10h19M6 15h4"/></svg>',
    reloj: '<svg class="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>',
  };

  /* ---------------- paneles laterales ---------------- */
  const velo = $('.velo');
  let ultimoFoco = null;
  function abrir(panel) {
    cerrarTodo();
    ultimoFoco = document.activeElement;
    panel.classList.add('abierto'); velo.classList.add('abierto');
    panel.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    setTimeout(() => ($('.cerrar', panel) || panel).focus(), 60);
  }
  function cerrarTodo() {
    $$('.lateral.abierto').forEach(p => { p.classList.remove('abierto'); p.setAttribute('aria-hidden', 'true'); });
    velo && velo.classList.remove('abierto');
    document.body.style.overflow = '';
  }
  function cerrar() { cerrarTodo(); if (ultimoFoco) ultimoFoco.focus(); }
  velo && velo.addEventListener('click', cerrar);
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && $('.lateral.abierto')) cerrar(); });
  $$('[data-abre]').forEach(b => b.addEventListener('click', () => abrir(document.getElementById(b.dataset.abre))));
  $$('.lateral .cerrar').forEach(b => b.addEventListener('click', cerrar));
  // atrapar el foco dentro del panel abierto
  document.addEventListener('keydown', e => {
    const p = $('.lateral.abierto'); if (!p || e.key !== 'Tab') return;
    const f = $$('a[href],button:not([disabled]),input,select,textarea', p).filter(x => x.offsetParent !== null);
    if (!f.length) return;
    if (e.shiftKey && document.activeElement === f[0]) { e.preventDefault(); f[f.length - 1].focus(); }
    else if (!e.shiftKey && document.activeElement === f[f.length - 1]) { e.preventDefault(); f[0].focus(); }
  });
  const cab = $('.cab');
  const sombra = () => cab && cab.classList.toggle('con-sombra', scrollY > 10);
  addEventListener('scroll', sombra, { passive: true }); sombra();

  /* ---------------- cesta ---------------- */
  const CLAVE = 'mil-detalles-cesta-v1';
  let cesta = [];
  try { cesta = JSON.parse(localStorage.getItem(CLAVE)) || []; } catch (e) { cesta = []; }
  const guardar = () => { try { localStorage.setItem(CLAVE, JSON.stringify(cesta)); } catch (e) {} pintarCesta(); };
  const subtotal = () => cesta.reduce((s, i) => s + i.u * i.q, 0);
  const portes = s => (s === 0 || s >= GRATIS) ? 0 : ENVIO;
  window.anadirCesta = item => {
    const k = [item.id, ...(item.ops || []), item.txt || '', item.fecha || '', item.foto || ''].join('|');
    const ya = cesta.find(i => i.k === k);
    if (ya) ya.q += item.q; else cesta.push({ ...item, k });
    guardar();
    abrir($('#cesta'));
  };
  function lineaHTML(i) {
    const det = [...(i.ops || []), i.txt ? 'Texto: «' + i.txt.replace(/\n/g, ' / ') + '»' : '', i.fecha ? 'Evento: ' + new Date(i.fecha + 'T12:00').toLocaleDateString('es-ES') : '', i.foto ? 'Foto: ' + i.foto : ''].filter(Boolean);
    return `<div class="linea-cesta" data-k="${esc(i.k)}">
      <img src="${esc(i.img)}" alt="" width="72" height="72">
      <div><h3><a href="producto.html?id=${esc(i.id)}">${esc(i.n)}</a></h3>
        ${det.length ? `<ul>${det.map(d => `<li>${esc(d)}</li>`).join('')}</ul>` : ''}
        <div class="cantidad"><button type="button" data-menos aria-label="Quitar una unidad">−</button><input type="number" min="1" value="${i.q}" aria-label="Cantidad de ${esc(i.n)}"><button type="button" data-mas aria-label="Añadir una unidad">+</button></div>
      </div>
      <div class="linea-cesta__precio">${euros(i.u * i.q)}<button type="button" class="quitar">Quitar</button></div>
    </div>`;
  }
  function pintarCesta() {
    const s = subtotal(), n = cesta.reduce((a, i) => a + i.q, 0);
    $$('.cesta-btn__total').forEach(e => e.textContent = euros(s));
    $$('.cesta-btn__num').forEach(e => { e.textContent = n; e.hidden = n === 0; });
    $$('.cesta-btn').forEach(b => b.setAttribute('aria-label', `Cesta: ${n} ${n === 1 ? 'artículo' : 'artículos'}, ${euros(s)}`));
    const cuerpo = $('#cesta-lineas'), pie = $('#cesta-pie');
    if (!cuerpo) return;
    if (!cesta.length) {
      cuerpo.innerHTML = '<div class="cesta-vacia"><p>Tu cesta está vacía.</p><a class="btn" href="productos.html">Ver detalles</a></div>';
      pie.hidden = true; return;
    }
    pie.hidden = false;
    cuerpo.innerHTML = cesta.map(lineaHTML).join('');
    const falta = GRATIS - s;
    $('#cesta-envio').innerHTML = falta > 0
      ? `<p class="msg-envio">Te faltan <b>${euros(falta)}</b> para el envío gratis.</p><div class="barra-envio" aria-hidden="true"><span style="width:${Math.min(100, s / GRATIS * 100)}%"></span></div>`
      : '<p class="msg-envio"><b>Tienes el envío gratis.</b></p><div class="barra-envio" aria-hidden="true"><span style="width:100%"></span></div>';
    $('#cesta-totales').innerHTML = `<p><span>Subtotal</span><span>${euros(s)}</span></p><p><span>Envío península</span><span>${portes(s) ? euros(portes(s)) : 'Gratis'}</span></p><p class="total"><span>Total (IVA incluido)</span><span>${euros(s + portes(s))}</span></p>`;
  }
  const lineas = $('#cesta-lineas');
  lineas && lineas.addEventListener('click', e => {
    const l = e.target.closest('.linea-cesta'); if (!l) return;
    const it = cesta.find(i => i.k === l.dataset.k); if (!it) return;
    if (e.target.closest('[data-mas]')) it.q++;
    else if (e.target.closest('[data-menos]')) it.q = Math.max(1, it.q - 1);
    else if (e.target.closest('.quitar')) cesta = cesta.filter(i => i !== it);
    else return;
    guardar();
    const foco = $(`.linea-cesta[data-k="${CSS.escape(l.dataset.k)}"] ${e.target.closest('[data-mas]') ? '[data-mas]' : '[data-menos]'}`);
    foco && foco.focus();
  });
  lineas && lineas.addEventListener('change', e => {
    const l = e.target.closest('.linea-cesta'); const it = l && cesta.find(i => i.k === l.dataset.k);
    if (it) { it.q = Math.max(1, parseInt(e.target.value, 10) || 1); guardar(); }
  });
  pintarCesta();
  addEventListener('storage', e => { if (e.key === CLAVE) { try { cesta = JSON.parse(e.newValue) || []; } catch (er) { cesta = []; } pintarCesta(); } });

  /* ---------------- tarjetas: segunda foto al pasar ---------------- */
  document.addEventListener('mouseover', e => {
    const t = e.target.closest('.tarjeta'); if (!t) return;
    const alt = $('img.alt[data-src]', t); if (!alt) return;
    alt.src = alt.dataset.src; alt.removeAttribute('data-src');
    alt.addEventListener('load', () => alt.classList.add('cargada'), { once: true });
  });

  /* ---------------- listados ---------------- */
  const lista = $('[data-lista]');
  if (lista) {
    const tarjetas = $$('.tarjeta', lista);
    const POR = 24;
    let visibles = POR, filtro = '', consulta = '', orden = 'destacados';
    const params = new URLSearchParams(location.search);
    if (params.get('tipo')) filtro = params.get('tipo');
    if (params.get('q')) consulta = params.get('q').trim();
    const chips = $$('[data-filtro]');
    const selOrden = $('[data-orden]');
    const cuenta = $('[data-cuenta]');
    const btnMas = $('[data-mas-productos]');
    const tituloBusq = $('[data-titulo-busqueda]');
    if (consulta) {
      $$('input[name="q"]').forEach(i => i.value = consulta);
      if (tituloBusq) tituloBusq.textContent = `Resultados para «${consulta}»`;
    }
    function aplicar() {
      const palabras = norm(consulta).split(/\s+/).filter(Boolean);
      let ok = tarjetas.filter(t => (!filtro || t.dataset.tipo.split(' ').includes(filtro)) && palabras.every(p => t.dataset.nombre.includes(p)));
      const cmp = {
        destacados: (a, b) => a.dataset.i - b.dataset.i,
        'precio-asc': (a, b) => a.dataset.precio - b.dataset.precio,
        'precio-desc': (a, b) => b.dataset.precio - a.dataset.precio,
        nombre: (a, b) => a.dataset.nombre.localeCompare(b.dataset.nombre, 'es'),
        nuevos: (a, b) => (b.dataset.nuevo - a.dataset.nuevo) || (a.dataset.i - b.dataset.i),
      }[orden];
      ok.sort(cmp);
      tarjetas.forEach(t => t.hidden = true);
      ok.forEach((t, n) => { lista.appendChild(t); t.hidden = n >= visibles; });
      const n = ok.length;
      if (cuenta) cuenta.textContent = n ? `Mostrando 1–${Math.min(n, visibles)} de ${n} ${n === 1 ? 'detalle' : 'detalles'}` : '';
      if (btnMas) btnMas.hidden = n <= visibles;
      let vacio = $('.vacio', lista.parentNode);
      if (!n) {
        if (!vacio) { vacio = document.createElement('p'); vacio.className = 'vacio'; lista.after(vacio); }
        vacio.innerHTML = consulta ? `No hemos encontrado detalles con «${esc(consulta)}». Prueba con otra palabra o <a href="https://wa.me/${WA}?text=${encodeURIComponent('Hola, estoy buscando ' + consulta)}">pregúntanos por WhatsApp</a>.` : 'No hay detalles en esta sección.';
      } else if (vacio) vacio.remove();
      chips.forEach(c => c.setAttribute('aria-pressed', String(c.dataset.filtro === filtro)));
    }
    chips.forEach(c => c.addEventListener('click', () => {
      filtro = c.dataset.filtro; visibles = POR; aplicar();
      const u = new URL(location.href); filtro ? u.searchParams.set('tipo', filtro) : u.searchParams.delete('tipo'); history.replaceState(null, '', u);
    }));
    selOrden && selOrden.addEventListener('change', () => { orden = selOrden.value; visibles = POR; aplicar(); });
    btnMas && btnMas.addEventListener('click', () => {
      const antes = visibles; visibles += POR; aplicar();
      const sig = $$('.tarjeta:not([hidden])', lista)[antes]; sig && $('a', sig).focus();
    });
    aplicar();
  }

  /* ---------------- carrusel del pie ---------------- */
  $$('.carrusel').forEach(car => {
    const pista = $('.carrusel__pista', car), n = pista.children.length;
    const puntos = $('.puntos', car); let i = 0, t;
    puntos.innerHTML = [...Array(n)].map((_, k) => `<button type="button" aria-label="Foto ${k + 1} de ${n}"></button>`).join('');
    const ir = k => {
      i = (k + n) % n; pista.style.transform = `translateX(-${i * 100}%)`;
      $$('button', puntos).forEach((b, j) => b.setAttribute('aria-current', String(j === i)));
      [...pista.children].forEach((im, j) => im.setAttribute('aria-hidden', String(j !== i)));
    };
    $('.carrusel__flecha--ant', car).addEventListener('click', () => { ir(i - 1); parar(); });
    $('.carrusel__flecha--sig', car).addEventListener('click', () => { ir(i + 1); parar(); });
    $$('button', puntos).forEach((b, j) => b.addEventListener('click', () => { ir(j); parar(); }));
    const parar = () => clearInterval(t);
    if (!matchMedia('(prefers-reduced-motion: reduce)').matches) t = setInterval(() => ir(i + 1), 4500);
    car.addEventListener('focusin', parar);
    ir(0);
  });

  /* ---------------- formulario de contacto ---------------- */
  $$('form[data-contacto]').forEach(f => f.addEventListener('submit', e => {
    e.preventDefault();
    f.innerHTML = '<p class="ok-form" role="status"><b>¡Mensaje enviado!</b> Te contestaremos en breve. Si es urgente, escríbenos por WhatsApp al 611 37 53 73.</p>';
  }));

  /* ---------------- ficha de producto ---------------- */
  const fichaBox = $('#ficha');
  if (fichaBox) {
    const id = new URLSearchParams(location.search).get('id');
    fetch('assets/datos.json').then(r => r.json()).then(D => pintarFicha(D, id)).catch(() => {
      fichaBox.innerHTML = '<p class="vacio">No se ha podido cargar el detalle. <a href="productos.html">Volver a la tienda</a></p>';
    });
  }
  function grande(ruta) { return REMOTO + ruta.replace(/\.jpg$/, '_xxl.webp'); }
  function mini(ruta) { return REMOTO + ruta.replace(/\.jpg$/, '_xl.webp'); }
  function pintarFicha(D, id) {
    const p0 = D.p[id];
    const p = p0 && { ...p0, ops: p0.ops.map(i => D.g[i]), gal: p0.gal.map(g => D.pref + g) };
    if (!p) { fichaBox.innerHTML = '<p class="vacio">Este detalle ya no está disponible. <a href="productos.html">Ver todos los detalles</a></p>'; return; }
    document.title = `${p.n} | 1000 Detalles`;
    const occ = D.occ[p.occ] || null;
    const migas = $('#migas-ficha');
    if (migas) migas.innerHTML = `<li><a href="index.html">Inicio</a></li>${occ ? `<li><a href="${occ.url}">${esc(occ.n)}</a></li>` : ''}${occ && p.tipo ? `<li><a href="${occ.url}?tipo=${p.tipo}">${esc(D.tipos[p.tipo] || '')}</a></li>` : ''}<li aria-current="page">${esc(p.n)}</li>`;
    const minimo = (p.c + ' ' + (p.nota || '')).match(/m[ií]nimo (?:son )?(\d+)/i);
    const qMin = minimo ? +minimo[1] : 1;
    const agotado = p.st === 'OutOfStock' || /^agotado\b/i.test((p.nota || '').trim());
    const gal = p.gal.length ? p.gal : [];
    const grupos = p.ops.map((g, gi) => {
      const nombre = `op${gi}`;
      const sel = Math.max(0, g.o.findIndex(o => o[2]));
      const ver = g.h ? `<button type="button" class="opcion__ver" data-ayuda="${esc(REMOTO + g.h)}" data-titulo="${esc(g.l)}">Ver ejemplos</button>` : '';
      if (g.o.length <= 10) {
        return `<fieldset class="opcion" data-grupo="${gi}"><legend>${esc(g.l)} ${ver}</legend><div class="pastillas">${g.o.map((o, oi) => `<label class="pastilla"><input type="radio" name="${nombre}" value="${oi}" ${oi === sel ? 'checked' : ''}><span>${esc(o[0])}${o[1] ? ` <small>+${euros(o[1])}</small>` : ''}</span></label>`).join('')}</div></fieldset>`;
      }
      return `<div class="campo opcion" data-grupo="${gi}"><label for="${nombre}">${esc(g.l)}</label> ${ver}<select id="${nombre}" name="${nombre}">${g.o.map((o, oi) => `<option value="${oi}" ${oi === sel ? 'selected' : ''}>${esc(o[0])}${o[1] ? ` (+${euros(o[1])})` : ''}</option>`).join('')}</select></div>`;
    }).join('');
    const hayGrabado = p.ops.some(g => /grab|personaliz|nombre|texto|frase/i.test(g.l)) || /personaliz|grabad|con nombre|con su nombre/i.test(p.n);
    const hayFoto = p.ops.some(g => /foto/i.test(g.l)) || /con foto/i.test(p.n);
    const desde = p.alto && p.alto > p.pr + 0.001 && !p.ops.some(g => g.o.some(o => o[1] > 0));
    fichaBox.innerHTML = `
      <div class="ficha">
        <div class="galeria">
          <div class="galeria__principal"><img id="foto-grande" src="${esc(p.img)}" alt="${esc(p.n)}" width="600" height="600"></div>
          ${gal.length > 1 ? `<div class="galeria__minis" role="group" aria-label="Fotos del producto">${gal.slice(0, 10).map((g, i) => `<button type="button" data-foto="${i}" aria-label="Ver foto ${i + 1}" ${i === 0 ? 'aria-current="true"' : ''}><img src="${i === 0 ? esc(p.img) : esc(mini(g))}" alt="" loading="lazy" width="100" height="100"></button>`).join('')}</div>` : ''}
        </div>
        <div class="ficha__info">
          <h1>${esc(p.n)}</h1>
          ${p.c && !/^(novedad\.?|oferta\.?)$/i.test(p.c) ? `<p class="ficha__corta">${esc(p.c)}</p>` : ''}
          <p class="ficha__precio">${p.a ? `<del>${euros(p.a)}</del>` : ''}<span id="precio-unidad">${desde ? 'Desde ' : ''}${euros(p.pr)}</span> <small>IVA incluido · por unidad</small></p>
          <p class="ficha__plazos">Sin personalizar llega en 2-7 días; con grabado, en 7-15 días.</p>
          ${agotado ? '<p class="aviso">Ahora mismo está agotado. Escríbenos y te avisamos cuando vuelva.</p>' : ''}
          <form id="form-ficha" novalidate>
            ${grupos}
            ${hayGrabado ? `<div class="campo" id="campo-texto"><label for="texto-grabado">Texto para personalizar</label><textarea id="texto-grabado" rows="2" maxlength="300" placeholder="Por ejemplo: Lucía y Marcos · 12-06-2027"></textarea><small id="ayuda-texto">Escríbelo tal y como quieres que salga.</small></div>` : ''}
            ${hayFoto ? `<div class="campo" id="campo-foto"><label for="foto-cliente">Tu foto</label><input type="file" id="foto-cliente" accept="image/*"><small>JPG o PNG. Cuanto más grande, mejor sale.</small><div class="foto-previa" id="foto-previa" hidden></div></div>` : ''}
            <div class="campo"><label for="fecha-evento">Fecha del evento <span style="font-weight:400">(opcional)</span></label><input type="date" id="fecha-evento"><small>Con la fecha nos organizamos para que lo tengas antes.</small></div>
            <div class="comprar">
              <div class="cantidad"><button type="button" id="q-menos" aria-label="Quitar una unidad">−</button><input id="q" type="number" min="${qMin}" value="${qMin}" inputmode="numeric" aria-label="Cantidad"><button type="button" id="q-mas" aria-label="Añadir una unidad">+</button></div>
              <button class="btn btn--rosa" type="submit" ${agotado ? 'disabled' : ''}>${agotado ? 'Agotado' : 'Añadir a la cesta'}</button>
              <p class="comprar__total" id="total-linea" aria-live="polite"></p>
            </div>
          </form>
          <div class="ficha__extra">
            ${qMin > 1 ? `<p>${ICO.reloj}<span>Pedido mínimo: ${qMin} unidades.</span></p>` : ''}
            <p>${ICO.camion}<span>Envío a península 5,50 €. <b>Gratis a partir de 110 €.</b></span></p>
            <p>${ICO.tarjeta}<span>Tarjeta, Bizum, PayPal o en 3, 6 o 12 meses con seQura.</span></p>
            <p>${ICO.wa}<span><a href="https://wa.me/${WA}?text=${encodeURIComponent('Hola, tengo una duda sobre «' + p.n + '»')}">¿Dudas con este detalle? Escríbenos por WhatsApp</a></span></p>
          </div>
        </div>
      </div>
      ${p.d.length ? `<section class="info-adicional"><h2>Información adicional</h2>${p.d.map(t => `<p>${esc(t)}</p>`).join('')}</section>` : ''}
      <section class="relacionados" id="relacionados"></section>
      <dialog class="modal" id="modal-ayuda"><div class="modal__cab"><h2 id="modal-titulo"></h2><button type="button" class="cerrar" aria-label="Cerrar"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg></button></div><div class="modal__cuerpo"><img id="modal-img" alt=""></div></dialog>`;

    // galería: foto grande desde su servidor
    const fg = $('#foto-grande');
    const ponerFoto = i => {
      const url = grande(gal[i]);
      const im = new Image(); im.onload = () => { fg.src = url; }; im.src = url;
      if (i !== 0) fg.src = mini(gal[i]);
      $$('[data-foto]').forEach(b => b.setAttribute('aria-current', String(+b.dataset.foto === i)));
    };
    if (gal.length) ponerFoto(0);
    $$('[data-foto]').forEach(b => b.addEventListener('click', () => ponerFoto(+b.dataset.foto)));

    const form = $('#form-ficha'), q = $('#q');
    const elegido = gi => { const g = $(`[data-grupo="${gi}"]`); const v = g.querySelector('input:checked, select'); return v ? +v.value : 0; };
    function recalcular() {
      let u = p.pr;
      p.ops.forEach((g, gi) => { u += g.o[elegido(gi)][1] || 0; });
      const extra = u - p.pr;
      $('#precio-unidad').textContent = (desde && !extra ? 'Desde ' : '') + euros(u);
      const n = Math.max(qMin, parseInt(q.value, 10) || qMin);
      $('#total-linea').innerHTML = `${n} ${n === 1 ? 'unidad' : 'unidades'} × ${euros(u)} = <b>${euros(u * n)}</b>`;
      const ct = $('#campo-texto');
      if (ct) {
        const g = p.ops.findIndex(g => /grab|personaliz/i.test(g.l));
        const txt = g >= 0 ? p.ops[g].o[elegido(g)][0] : '';
        ct.hidden = g >= 0 && /^(sin|no)\b/i.test(txt);
        $('#ayuda-texto').textContent = /cada uno/i.test(txt) ? 'Escribe un nombre por línea, uno por cada unidad.' : 'Escríbelo tal y como quieres que salga.';
      }
      const cf = $('#campo-foto');
      if (cf) {
        const g = p.ops.findIndex(g => /foto/i.test(g.l));
        cf.hidden = g >= 0 && /^(sin|no)\b/i.test(p.ops[g].o[elegido(g)][0]);
      }
      return u;
    }
    form.addEventListener('change', recalcular);
    q.addEventListener('input', recalcular);
    $('#q-menos').addEventListener('click', () => { q.value = Math.max(qMin, (parseInt(q.value, 10) || qMin) - 1); recalcular(); });
    $('#q-mas').addEventListener('click', () => { q.value = (parseInt(q.value, 10) || qMin) + 1; recalcular(); });
    const fc = $('#foto-cliente');
    fc && fc.addEventListener('change', () => {
      const f = fc.files[0], pv = $('#foto-previa');
      if (!f) { pv.hidden = true; return; }
      pv.hidden = false; pv.innerHTML = `<img src="${URL.createObjectURL(f)}" alt="Vista previa de tu foto"><span>${esc(f.name)}</span>`;
    });
    form.addEventListener('submit', e => {
      e.preventDefault();
      const u = recalcular();
      const n = Math.max(qMin, parseInt(q.value, 10) || qMin);
      const ops = p.ops.map((g, gi) => [g, g.o[elegido(gi)]]).filter(([g, o]) => !/^(sin|no)\b/i.test(o[0]))
        .map(([g, o]) => /embols|lazo/i.test(g.l) ? `Embolsado: ${o[0]}` : /pegatina/i.test(g.l) ? `Pegatina: ${o[0].replace(/^pegatina\s*/i, '')}` : `${g.l.replace(/[?¿:]/g, '').trim()}: ${o[0]}`);
      const ct = $('#campo-texto'), cf = $('#campo-foto');
      anadirCesta({ id, n: p.n, img: p.img, u, q: n, ops, txt: ct && !ct.hidden ? $('#texto-grabado').value.trim() : '', fecha: $('#fecha-evento').value, foto: cf && !cf.hidden && fc.files[0] ? fc.files[0].name : '' });
    });
    recalcular();

    // ejemplos (embolsados, pegatinas...) en una ventana
    const modal = $('#modal-ayuda');
    $$('[data-ayuda]').forEach(b => b.addEventListener('click', () => {
      $('#modal-titulo').textContent = b.dataset.titulo; const im = $('#modal-img'); im.src = b.dataset.ayuda; im.alt = 'Ejemplos: ' + b.dataset.titulo;
      modal.showModal();
    }));
    $('.cerrar', modal).addEventListener('click', () => modal.close());
    modal.addEventListener('click', e => { if (e.target === modal) modal.close(); });

    // relacionados: misma sección
    const rel = Object.entries(D.p).filter(([k, x]) => k !== id && x.tipo === p.tipo && x.occ === p.occ).slice(0, 4);
    if (rel.length) $('#relacionados').innerHTML = `<h2>Productos relacionados</h2><div class="rejilla">${rel.map(([k, x]) => tarjetaHTML(k, x)).join('')}</div>`;
  }
  function tarjetaHTML(k, x) {
    return `<article class="tarjeta"><a class="tarjeta__img" href="producto.html?id=${k}" tabindex="-1" aria-hidden="true"><img src="${esc(x.img)}" alt="" loading="lazy" width="300" height="300">${x.i2 ? `<img class="alt" data-src="${esc(REMOTO + x.i2)}" alt="" width="300" height="300">` : ''}</a>
      <h3 class="tarjeta__nombre"><a href="producto.html?id=${k}">${esc(x.n)}</a></h3>
      <p class="tarjeta__precio">${x.a ? `<del>${euros(x.a)}</del>` : ''}${euros(x.pr)} <span class="tarjeta__iva">IVA incl.</span></p></article>`;
  }

  /* ---------------- pedido ---------------- */
  const ped = $('#pedido');
  if (ped) {
    const res = $('#resumen-lineas');
    const pintar = () => {
      if (!cesta.length) { ped.innerHTML = '<div class="cesta-vacia"><p>Tu cesta está vacía.</p><a class="btn" href="productos.html">Ver detalles</a></div>'; return false; }
      const s = subtotal();
      res.innerHTML = cesta.map(i => `<p><span>${i.q} × ${esc(i.n)}</span><span>${euros(i.u * i.q)}</span></p>`).join('') +
        `<p style="margin-top:12px"><span>Subtotal</span><span>${euros(s)}</span></p><p><span>Envío península</span><span>${portes(s) ? euros(portes(s)) : 'Gratis'}</span></p><p class="total"><span>Total (IVA incluido)</span><span>${euros(s + portes(s))}</span></p>`;
      return true;
    };
    if (pintar()) {
      const f = $('#form-pedido');
      f.addEventListener('submit', e => {
        e.preventDefault();
        if (!f.checkValidity()) { f.reportValidity(); return; }
        const nombre = $('#p-nombre').value.trim(), email = $('#p-email').value.trim();
        const num = '1000-' + String(Date.now()).slice(-5);
        const pago = $('input[name="pago"]:checked').value;
        cesta = []; guardar();
        ped.innerHTML = `<div class="confirmacion" role="status"><div class="circulo"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M5 12l5 5 9-10"/></svg></div>
          <h1 class="titulo" style="margin-top:18px">¡Gracias, ${esc(nombre)}!</h1>
          <p>Hemos recibido tu pedido <b>${num}</b>. Te mandamos el justificante a <b>${esc(email)}</b>${pago === 'transferencia' ? ' con el número de cuenta para la transferencia' : ''}.</p>
          <p>Si has dejado la fecha del evento, la tenemos en cuenta para que te llegue antes.</p>
          <p style="font-size:14px;color:var(--texto-2)">Pedido de prueba: en esta versión no se cobra nada.</p>
          <a class="btn" href="index.html">Volver al inicio</a></div>`;
        scrollTo(0, 0);
      });
    }
  }
})();
