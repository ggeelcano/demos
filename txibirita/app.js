// Txibirita Herbodietética — portada con buscador, catálogo y encargo para recoger en tienda (por WhatsApp)
(() => {
  const { productos, plantas } = window.TX;
  const WHATSAPP = '34688625579';
  const $ = s => document.querySelector(s);
  const eur = n => n.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' });
  const norm = s => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const porId = Object.fromEntries(productos.map(p => [p.id, p]));

  // Categorías del menú: agrupan las de cada producto
  const GRUPOS = [
    { nombre: 'Colágeno y belleza', cats: ['Colágeno y belleza'], icono: 'colageno' },
    { nombre: 'Articulaciones y músculos', cats: ['Articulaciones y huesos'], icono: 'huesos' },
    { nombre: 'Defensas', cats: ['Defensas'], icono: 'defensas' },
    { nombre: 'Estrés y energía', cats: ['Estrés y descanso', 'Energía y longevidad'], icono: 'estres' },
    { nombre: 'Detox', cats: ['Detox'], icono: 'detox' },
  ];
  const ALIAS = { 'Suplementos': ['Colágeno y belleza', 'Articulaciones y huesos', 'Defensas', 'Estrés y descanso', 'Energía y longevidad', 'Detox'] };
  const catsDe = nombre => (GRUPOS.find(g => g.nombre === nombre) || {}).cats || ALIAS[nombre] || [nombre];

  const ICONOS = {
    granel: '<path d="M32 54V26M32 34c-8 0-14-6-14-15 9 0 14 6 14 15Zm0 6c8 0 14-6 14-15-9 0-14 6-14 15ZM20 54h24"/>',
    colageno: '<rect x="20" y="16" width="24" height="38" rx="5"/><path d="M24 10h16v6H24zM26 30h12M26 37h12M26 44h8"/>',
    huesos: '<path d="M22 18a5 5 0 1 1 7 4l13 13a5 5 0 1 1 4 7 5 5 0 1 1-7-4L26 25a5 5 0 1 1-4-7Z"/>',
    defensas: '<path d="M32 10 50 17v13c0 12-8 20-18 24-10-4-18-12-18-24V17Z"/><path d="M24 32l6 6 11-12"/>',
    estres: '<path d="M44 40a16 16 0 0 1-20-24 18 18 0 1 0 20 24Z"/><path d="M42 12l2 5 5 2-5 2-2 5-2-5-5-2 5-2Z"/>',
    detox: '<path d="M20 20h24l-3 34H23Z"/><path d="M18 20h28M30 20l4-10h6"/><path d="M26 34c4-3 8 3 12 0"/>',
    cosmetica: '<rect x="18" y="30" width="28" height="24" rx="6"/><path d="M24 30v-6h16v6M28 24V12h8v12"/>',
    hogar: '<path d="M32 12c6 8 12 14 12 24a12 12 0 0 1-24 0c0-10 6-16 12-24Z"/><path d="M26 54h12"/>',
  };
  const icono = k => `<svg viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONOS[k]}</svg>`;

  // ---------- Menú, iconos, pie ----------
  $('#menu-lista').innerHTML =
    `<li><a href="#granel" class="destacado">Plantas a granel</a></li>` +
    GRUPOS.map(g => `<li><a href="#catalogo" data-filtro="${esc(g.nombre)}">${esc(g.nombre)}</a></li>`).join('') +
    `<li><a href="#catalogo" data-filtro="Ofertas" class="oferta">Ofertas</a></li>`;
  $('#cats-lista').innerHTML =
    `<li><a href="#granel">${icono('granel')}Plantas a granel</a></li>` +
    GRUPOS.map(g => `<li><a href="#catalogo" data-filtro="${esc(g.nombre)}">${icono(g.icono)}${esc(g.nombre)}</a></li>`).join('');
  $('#pie-cats').innerHTML = `<li><a href="#granel">Plantas a granel</a></li>` + GRUPOS.map(g => `<li><a href="#catalogo" data-filtro="${esc(g.nombre)}">${esc(g.nombre)}</a></li>`).join('');

  // ---------- Tarjetas ----------
  const tarjeta = p => `
    <article class="tarjeta">
      <button type="button" class="tarj-img" data-ficha="${p.id}" aria-label="Ver ficha de ${esc(p.nombre)}">
        ${p.etiqueta ? `<span class="etiqueta">${esc(p.etiqueta)}</span>` : ''}
        <img src="${p.img}" alt="${esc(p.nombre)} de ${esc(p.marca)}" width="440" height="440" loading="lazy">
      </button>
      <p class="tarj-marca">${esc(p.marca)}</p>
      <h3 class="tarj-nombre"><button type="button" data-ficha="${p.id}">${esc(p.nombre)}</button></h3>
      <p class="tarj-formato">${esc(p.formato)}</p>
      <p class="tarj-precio">${eur(p.pvp)}</p>
      <div class="tarj-acciones">
        <div class="cantidad"><button type="button" data-c="-1" aria-label="Quitar uno">−</button><input type="number" min="1" max="20" value="1" aria-label="Cantidad de ${esc(p.nombre)}"><button type="button" data-c="1" aria-label="Añadir uno">+</button></div>
        <button type="button" class="anadir" data-anadir="${p.id}" aria-label="Añadir ${esc(p.nombre)} al encargo"><svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M5 8h14l-1.2 11.2a2 2 0 0 1-2 1.8H8.2a2 2 0 0 1-2-1.8Z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><path d="M9 8V6a3 3 0 0 1 6 0v2" fill="none" stroke="currentColor" stroke-width="2"/></svg><span>Añadir</span></button>
      </div>
    </article>`;
  const pintarLista = (sel, lista) => { $(sel).innerHTML = lista.map(p => `<li>${tarjeta(p)}</li>`).join(''); };
  pintarLista('#car-pedidos', productos.filter(p => p.pedido));
  pintarLista('#car-otono', window.TX.otono.map(id => porId[id]).filter(Boolean));

  $('#fav-lista').innerHTML = productos.filter(p => p.fav).map(p =>
    `<li><button type="button" data-ficha="${p.id}" aria-label="${esc(p.nombre)}"><img src="${p.img}" alt="" width="88" height="88" loading="lazy"></button></li>`).join('');

  // Bloques de la introducción
  const fotosDe = ids => ids.map(id => porId[id]).filter(Boolean).map(p => `<img src="${p.img}" alt="" loading="lazy">`).join('');
  const BLOQUES = [
    { img: `<span class="bloque-img prods" style="background:#eef3e3">${fotosDe(window.TX.bloques.suplementos)}</span>`, enlaces: [['Colágeno y belleza', 'f'], ['Articulaciones y músculos', 'f'], ['Estrés y energía', 'f']] },
    { img: `<span class="bloque-img"><img src="img/escaparate-granel.jpg" alt="Bolsas de plantas a granel en el escaparate de Txibirita" loading="lazy"><span class="chip">En nuestro escaparate</span></span>`, enlaces: [['Tila', 'g'], ['Manzanilla', 'g'], ['Cola de caballo', 'g']] },
    { img: `<span class="bloque-img prods" style="background:#f6eedc">${fotosDe(window.TX.bloques.defensas)}</span>`, enlaces: [['Defensas', 'f'], ['Detox', 'f'], ['Ofertas', 'f']] },
    { img: `<span class="bloque-img"><img src="img/escaparate-sal.jpg" alt="Lámparas de sal del Himalaya y selenita en el escaparate de Txibirita" loading="lazy"><span class="chip">En nuestro escaparate</span></span>`, enlaces: [['Lámparas de sal y selenita', 'w'], ['Plantas a granel', 'G'], ['Ven a vernos a Tendería 36', 't']] },
  ];
  $('#bloques').innerHTML = BLOQUES.map(b => `<div class="bloque">${b.img}<ul>${b.enlaces.map(([t, k]) =>
    k === 'f' ? `<li><a href="#catalogo" data-filtro="${esc(t)}">${esc(t)}</a></li>` :
    k === 'g' ? `<li><a href="#granel" data-planta="${esc(t)}">${esc(t)} a granel</a></li>` :
    k === 'w' ? `<li><a href="https://wa.me/${WHATSAPP}?text=${encodeURIComponent('Hola, ¿qué lámparas de sal tenéis ahora?')}" target="_blank" rel="noopener">${esc(t)}</a></li>` :
    k === 't' ? `<li><a href="#tienda">${esc(t)}</a></li>` :
    `<li><a href="#granel">${esc(t)}</a></li>`).join('')}</ul></div>`).join('');

  // Bodegones del carrusel y banners
  document.querySelectorAll('[data-bodegon]').forEach(el => {
    const ids = window.TX.bodegones[el.dataset.bodegon] || [];
    el.innerHTML = ids.map(id => id === 'regalo'
      ? `<span class="bod-prod bod-regalo"><svg viewBox="0 0 24 24" width="44" height="44" aria-hidden="true"><path d="M4 11h16v9H4zM3 7h18v4H3zM12 7v13M12 7c-2-4-6-4-6-1.5S10 7 12 7Zm0 0c2-4 6-4 6-1.5S14 7 12 7Z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/></svg><b>+1</b><small>de regalo</small></span>`
      : porId[id] ? `<span class="bod-prod"><img src="${porId[id].img}" alt="${esc(porId[id].nombre)}"></span>` : '').join('');
  });
  document.querySelectorAll('[data-img]').forEach(el => {
    const v = window.TX.banners[el.dataset.img];
    if (!v) return;
    const src = porId[v] ? porId[v].img : v;
    el.innerHTML = `<img src="${src}" alt="" loading="lazy">`;
  });

  // ---------- Catálogo: filtros y búsqueda ----------
  let filtro = 'Todos', consulta = '';
  const FILTROS = ['Todos', ...GRUPOS.map(g => g.nombre), 'Ofertas'];
  $('#filtros').innerHTML = FILTROS.map(f => `<button type="button" data-f="${esc(f)}" aria-pressed="${f === 'Todos'}">${esc(f)}</button>`).join('');
  const coincide = (p, q) => {
    const t = norm([p.nombre, p.marca, p.cat, p.desc, p.formato, (p.tags || []).join(' ')].join(' '));
    return norm(q).split(/\s+/).filter(Boolean).every(w => t.includes(w));
  };
  function pintarCatalogo() {
    let lista = productos;
    if (filtro === 'Ofertas') lista = lista.filter(p => p.etiqueta);
    else if (filtro !== 'Todos') { const cs = catsDe(filtro); lista = lista.filter(p => cs.includes(p.cat)); }
    if (consulta) lista = lista.filter(p => coincide(p, consulta));
    pintarLista('#rejilla', lista);
    const partes = [];
    if (consulta) partes.push(`para «${esc(consulta)}»`);
    if (filtro !== 'Todos') partes.push(`en ${esc(filtro)}`);
    $('#resultado').innerHTML = `${lista.length} ${lista.length === 1 ? 'producto' : 'productos'} ${partes.join(' ')}` +
      (consulta ? ` · <button type="button" class="btn-mini" id="quitar-busqueda">Quitar búsqueda</button>` : '') +
      (!lista.length ? `<br>¿No lo encuentras? <a href="https://wa.me/${WHATSAPP}?text=${encodeURIComponent('Hola, ¿tenéis ' + consulta + '?')}" target="_blank" rel="noopener">Pregúntanos por WhatsApp</a>, seguro que te lo conseguimos.` : '');
    document.querySelectorAll('#filtros button').forEach(b => b.setAttribute('aria-pressed', b.dataset.f === filtro));
  }
  function aplicarFiltro(f, irA = true) {
    filtro = f;
    pintarCatalogo();
    if (irA) $('#catalogo').scrollIntoView();
  }
  pintarCatalogo();

  // ---------- Buscador con sugerencias ----------
  const q = $('#q'), sug = $('#sugerencias');
  let selSug = -1;
  function sugerir() {
    const v = q.value.trim();
    if (v.length < 2) { sug.hidden = true; q.setAttribute('aria-expanded', 'false'); return; }
    const prods = productos.filter(p => coincide(p, v)).slice(0, 6);
    const pls = plantas.filter(n => norm(n).includes(norm(v))).slice(0, 3);
    sug.innerHTML =
      prods.map(p => `<button type="button" class="sug" role="option" data-ficha="${p.id}"><img src="${p.img}" alt=""><span>${esc(p.nombre)}<small>${esc(p.marca)} · ${esc(p.formato)}</small></span><span class="sug-precio">${eur(p.pvp)}</span></button>`).join('') +
      pls.map(n => `<button type="button" class="sug" role="option" data-planta="${esc(n)}"><span class="hoja" aria-hidden="true"><svg viewBox="0 0 64 64" width="28" height="28" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round">${ICONOS.granel}</svg></span><span>${esc(n)} a granel<small>Te la preparamos al peso</small></span></button>`).join('') ||
      `<p class="sug-vacio">No lo vemos en la web. Pulsa Intro y te decimos cómo pedírnoslo.</p>`;
    sug.hidden = false; selSug = -1; q.setAttribute('aria-expanded', 'true');
  }
  q.addEventListener('input', sugerir);
  q.addEventListener('focus', sugerir);
  q.addEventListener('keydown', e => {
    const ops = [...sug.querySelectorAll('.sug')];
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      if (!ops.length) return;
      e.preventDefault();
      selSug = (selSug + (e.key === 'ArrowDown' ? 1 : -1) + ops.length) % ops.length;
      ops.forEach((o, i) => o.setAttribute('aria-selected', i === selSug));
    } else if (e.key === 'Enter' && selSug >= 0) { e.preventDefault(); ops[selSug].click(); }
    else if (e.key === 'Escape') { sug.hidden = true; }
  });
  $('#buscador').addEventListener('submit', e => {
    e.preventDefault();
    consulta = q.value.trim(); filtro = 'Todos';
    sug.hidden = true; q.blur();
    pintarCatalogo(); $('#catalogo').scrollIntoView();
  });
  document.addEventListener('click', e => { if (!e.target.closest('.buscador')) sug.hidden = true; });

  // ---------- Plantas a granel ----------
  $('#planta').innerHTML = plantas.map(n => `<option>${esc(n)}</option>`).join('');
  $('#granel-chips').innerHTML = plantas.slice(0, 10).map(n => `<li><button type="button" data-planta-add="${esc(n)}">${esc(n)}</button></li>`).join('');
  $('#granel-form').addEventListener('submit', e => {
    e.preventDefault();
    anadirGranel($('#planta').value, $('#gramos').value);
  });

  // ---------- Encargo ----------
  let encargo = [];
  try { encargo = JSON.parse(localStorage.getItem('tx-encargo') || '[]').filter(i => i.granel || porId[i.id]); } catch (e) {}
  const guardar = () => { try { localStorage.setItem('tx-encargo', JSON.stringify(encargo)); } catch (e) {} };
  function anadir(id, cant = 1) {
    const it = encargo.find(i => i.id === id);
    if (it) it.cant = Math.min(20, it.cant + cant); else encargo.push({ id, cant });
    guardar(); pintarEncargo(); aviso(`${porId[id].nombre} añadido a tu encargo`);
  }
  function anadirGranel(nombre, g) {
    const it = encargo.find(i => i.granel === nombre && i.g === g);
    if (it) it.cant = Math.min(10, it.cant + 1); else encargo.push({ granel: nombre, g, cant: 1 });
    guardar(); pintarEncargo(); aviso(`${nombre} a granel (${g}) añadido`);
  }
  function pintarEncargo() {
    const n = encargo.reduce((s, i) => s + i.cant, 0);
    $('#contador').textContent = n;
    $('#contador').classList.toggle('vacio', !n);
    $('#abrir-encargo').setAttribute('aria-label', `Mi encargo, ${n} ${n === 1 ? 'artículo' : 'artículos'}`);
    $('#enc-vacio').hidden = !!encargo.length;
    $('#enc-form').hidden = !encargo.length;
    $('#enc-total').hidden = !encargo.length;
    $('#enc-lista').innerHTML = encargo.map((i, k) => {
      const p = porId[i.id];
      const img = p ? `<img src="${p.img}" alt="">` : `<span class="hoja" aria-hidden="true"><svg viewBox="0 0 64 64" width="30" height="30" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round">${ICONOS.granel}</svg></span>`;
      const txt = p ? `<p>${esc(p.nombre)}<br><small>${esc(p.formato)} · ${eur(p.pvp)}</small></p>` : `<p>${esc(i.granel)} a granel<br><small>${esc(i.g)} · precio al peso</small></p>`;
      return `<li class="enc-item">${img}${txt}<div class="cantidad"><button type="button" data-enc="${k}" data-c="-1" aria-label="Quitar uno">−</button><input type="number" value="${i.cant}" readonly aria-label="Cantidad"><button type="button" data-enc="${k}" data-c="1" aria-label="Añadir uno">+</button></div></li>`;
    }).join('');
    const total = encargo.reduce((s, i) => s + (porId[i.id] ? porId[i.id].pvp * i.cant : 0), 0);
    const hayGranel = encargo.some(i => i.granel);
    $('#enc-total').innerHTML = `<span>Total aproximado<small>Pagas al recoger en la tienda${hayGranel ? ' · plantas a granel al peso' : ''}</small></span><span>${eur(total)}</span>`;
  }
  pintarEncargo();

  // Días y franjas de recogida según el horario de la tienda
  const HORARIO = { 1: [['10:00', '13:30'], ['17:00', '20:00']], 2: [['10:00', '13:30'], ['17:00', '20:00']], 3: [['10:00', '13:30'], ['17:00', '20:00']], 4: [['10:00', '13:30'], ['17:00', '20:00']], 5: [['10:00', '13:30'], ['17:00', '20:00']], 6: [['11:00', '14:00']], 0: [] };
  const DIAS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
  const min = h => { const [a, b] = h.split(':'); return +a * 60 + +b; };
  const ahoraMin = () => { const d = new Date(); return d.getHours() * 60 + d.getMinutes(); };
  function diasRecogida() {
    const out = [], hoy = new Date();
    for (let k = 0; out.length < 6 && k < 14; k++) {
      const d = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() + k);
      const franjas = HORARIO[d.getDay()].filter(([, fin]) => k > 0 || min(fin) - 30 > ahoraMin());
      if (!franjas.length) continue;
      const etiqueta = k === 0 ? 'Hoy' : k === 1 ? 'Mañana' : DIAS[d.getDay()][0].toUpperCase() + DIAS[d.getDay()].slice(1);
      out.push({ valor: d.toISOString().slice(0, 10), texto: `${etiqueta}, ${d.getDate()} de ${d.toLocaleDateString('es-ES', { month: 'long' })}`, franjas });
    }
    return out;
  }
  const opciones = diasRecogida();
  $('#dia').innerHTML = opciones.map((o, i) => `<option value="${i}">${o.texto}</option>`).join('');
  function pintarFranjas() {
    const o = opciones[$('#dia').value] || opciones[0];
    $('#franjas').innerHTML = '<legend>Franja</legend>' + o.franjas.map(([a, b], i) =>
      `<label><input type="radio" name="franja" value="${a}-${b}" ${i === 0 ? 'checked' : ''}> ${min(a) < 15 * 60 ? 'Mañana' : 'Tarde'} (${a} a ${b})</label>`).join('');
  }
  $('#dia').addEventListener('change', pintarFranjas);
  pintarFranjas();

  $('#enc-form').addEventListener('submit', e => {
    e.preventDefault();
    const f = e.target, err = $('#error');
    const nombre = f.nombre.value.trim(), tel = f.telefono.value.trim();
    if (!nombre) { err.textContent = 'Escribe tu nombre para saber de quién es el encargo.'; f.nombre.focus(); return; }
    if (tel.replace(/\D/g, '').length < 9) { err.textContent = 'Escribe un teléfono de contacto (9 cifras).'; f.telefono.focus(); return; }
    if (!f.acepto.checked) { err.textContent = 'Marca la casilla para poder enviarnos el encargo.'; f.acepto.focus(); return; }
    err.textContent = '';
    const o = opciones[f.dia.value];
    const franja = f.franja.value.replace('-', ' a ');
    const lineas = encargo.map(i => porId[i.id]
      ? `• ${i.cant} × ${porId[i.id].nombre} (${porId[i.id].marca}, ${porId[i.id].formato}) — ${eur(porId[i.id].pvp * i.cant)}`
      : `• ${i.cant} × ${i.granel} a granel, ${i.g}`);
    const total = encargo.reduce((s, i) => s + (porId[i.id] ? porId[i.id].pvp * i.cant : 0), 0);
    const texto = `Hola Txibirita, quiero hacer un encargo para recoger en tienda:\n\n${lineas.join('\n')}\n\nTotal aproximado: ${eur(total)}${encargo.some(i => i.granel) ? ' + plantas a granel al peso' : ''}\nRecogida: ${o.texto.toLowerCase()}, de ${franja}\nNombre: ${nombre}\nTeléfono: ${tel}${f.nota.value.trim() ? '\nNota: ' + f.nota.value.trim() : ''}`;
    window.open(`https://wa.me/${WHATSAPP}?text=${encodeURIComponent(texto)}`, '_blank', 'noopener');
  });

  // Panel del encargo
  const panel = $('#encargo'), velo = $('#velo'), menu = $('#menu');
  let volverA = null;
  function abrirEncargo() {
    volverA = document.activeElement;
    cerrarMenu();
    panel.classList.add('abierto'); panel.removeAttribute('inert'); panel.setAttribute('aria-hidden', 'false');
    velo.hidden = false; $('#cerrar-encargo').focus();
  }
  function cerrarEncargo() {
    if (!panel.classList.contains('abierto')) return;
    panel.classList.remove('abierto'); panel.setAttribute('inert', ''); panel.setAttribute('aria-hidden', 'true');
    velo.hidden = true; if (volverA) volverA.focus();
  }
  function abrirMenu() { menu.classList.add('abierto'); document.body.classList.add('menu-abierto'); velo.hidden = false; $('.hamburguesa').setAttribute('aria-expanded', 'true'); $('#cerrar-menu').focus(); }
  function cerrarMenu() { if (!menu.classList.contains('abierto')) return; menu.classList.remove('abierto'); document.body.classList.remove('menu-abierto'); velo.hidden = true; $('.hamburguesa').setAttribute('aria-expanded', 'false'); }
  $('#abrir-encargo').addEventListener('click', abrirEncargo);
  $('#cerrar-encargo').addEventListener('click', cerrarEncargo);
  $('.hamburguesa').addEventListener('click', abrirMenu);
  $('#cerrar-menu').addEventListener('click', () => { cerrarMenu(); $('.hamburguesa').focus(); });
  velo.addEventListener('click', () => { cerrarEncargo(); cerrarMenu(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') { cerrarEncargo(); cerrarMenu(); } });

  // Aviso al añadir
  let tAviso;
  function aviso(txt) {
    $('#toast-txt').textContent = txt; $('#toast').hidden = false;
    clearTimeout(tAviso); tAviso = setTimeout(() => { $('#toast').hidden = true; }, 3500);
  }
  $('#toast-ver').addEventListener('click', () => { $('#toast').hidden = true; abrirEncargo(); });

  // Ficha rápida
  const ficha = $('#ficha');
  let fichaId = null;
  function abrirFicha(id) {
    const p = porId[id]; if (!p) return;
    fichaId = id;
    $('#ficha-img').src = p.img; $('#ficha-img').alt = `${p.nombre} de ${p.marca}`;
    $('#ficha-marca').textContent = p.marca; $('#ficha-nombre').textContent = p.nombre;
    $('#ficha-formato').textContent = p.formato; $('#ficha-desc').textContent = p.desc;
    $('#ficha-precio').textContent = eur(p.pvp); $('#ficha-cant').value = 1;
    sug.hidden = true;
    ficha.showModal();
  }
  $('#cerrar-ficha').addEventListener('click', () => ficha.close());
  ficha.addEventListener('click', e => { if (e.target === ficha) ficha.close(); });
  $('#ficha-anadir').addEventListener('click', () => { anadir(fichaId, Math.max(1, +$('#ficha-cant').value || 1)); ficha.close(); });

  // Delegación de clics
  document.addEventListener('click', e => {
    const t = e.target.closest('button, a');
    if (!t) return;
    if (t.dataset.ficha) { abrirFicha(t.dataset.ficha); return; }
    if (t.dataset.anadir) {
      const inp = t.closest('.tarj-acciones').querySelector('input');
      anadir(t.dataset.anadir, Math.max(1, +inp.value || 1));
      inp.value = 1;
      t.classList.add('ok'); setTimeout(() => t.classList.remove('ok'), 900);
      return;
    }
    if (t.dataset.c) {
      if (t.dataset.enc !== undefined) {
        const it = encargo[+t.dataset.enc];
        it.cant += +t.dataset.c;
        if (it.cant < 1) encargo.splice(+t.dataset.enc, 1);
        guardar(); pintarEncargo(); return;
      }
      const inp = t.parentElement.querySelector('input');
      inp.value = Math.min(20, Math.max(1, (+inp.value || 1) + +t.dataset.c));
      return;
    }
    if (t.dataset.f) { consulta = ''; q.value = ''; aplicarFiltro(t.dataset.f, false); return; }
    if (t.id === 'quitar-busqueda') { consulta = ''; q.value = ''; pintarCatalogo(); return; }
    if (t.dataset.filtro) { e.preventDefault(); consulta = ''; q.value = ''; cerrarMenu(); aplicarFiltro(t.dataset.filtro); return; }
    if (t.dataset.planta) { e.preventDefault(); cerrarMenu(); sug.hidden = true; $('#planta').value = t.dataset.planta; $('#granel').scrollIntoView(); $('#planta').focus({ preventScroll: true }); return; }
    if (t.dataset.plantaAdd) { anadirGranel(t.dataset.plantaAdd, $('#gramos').value); return; }
    if (t.closest('#menu') && t.getAttribute('href') === '#granel') cerrarMenu();
  });

  // ---------- Carruseles de productos ----------
  document.querySelectorAll('[data-carrusel]').forEach(c => {
    const pista = c.querySelector('.car-pista'), prev = c.querySelector('.prev'), next = c.querySelector('.next');
    const estado = () => { prev.disabled = pista.scrollLeft < 5; next.disabled = pista.scrollLeft + pista.clientWidth > pista.scrollWidth - 5; };
    prev.addEventListener('click', () => pista.scrollBy({ left: -pista.clientWidth * .8, behavior: 'smooth' }));
    next.addEventListener('click', () => pista.scrollBy({ left: pista.clientWidth * .8, behavior: 'smooth' }));
    pista.addEventListener('scroll', estado, { passive: true });
    addEventListener('resize', estado); estado();
  });

  // ---------- Carrusel de portada ----------
  const pistaH = $('#hero-pista'), slides = [...pistaH.children], puntos = $('#hero-puntos');
  let actual = 0, temp;
  puntos.innerHTML = slides.map((_, i) => `<button type="button" aria-label="Ir a la diapositiva ${i + 1}"></button>`).join('');
  function ir(i) {
    actual = (i + slides.length) % slides.length;
    pistaH.style.transform = `translateX(-${actual * 100}%)`;
    slides.forEach((s, k) => { s.toggleAttribute('inert', k !== actual); s.setAttribute('aria-hidden', k !== actual); });
    [...puntos.children].forEach((b, k) => b.setAttribute('aria-current', k === actual));
  }
  const reducido = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const auto = () => { clearInterval(temp); if (!reducido) temp = setInterval(() => ir(actual + 1), 7000); };
  $('.hero .prev').addEventListener('click', () => { ir(actual - 1); auto(); });
  $('.hero .next').addEventListener('click', () => { ir(actual + 1); auto(); });
  puntos.addEventListener('click', e => { const b = e.target.closest('button'); if (b) { ir([...puntos.children].indexOf(b)); auto(); } });
  const hero = $('.hero');
  hero.addEventListener('mouseenter', () => clearInterval(temp));
  hero.addEventListener('mouseleave', auto);
  hero.addEventListener('focusin', () => clearInterval(temp));
  let x0 = null;
  hero.addEventListener('touchstart', e => { x0 = e.touches[0].clientX; clearInterval(temp); }, { passive: true });
  hero.addEventListener('touchend', e => { if (x0 === null) return; const dx = e.changedTouches[0].clientX - x0; if (Math.abs(dx) > 40) ir(actual + (dx < 0 ? 1 : -1)); x0 = null; auto(); });
  ir(0); auto();

  // ---------- Horario y estado de la tienda ----------
  const hoyD = new Date().getDay();
  const orden = [1, 2, 3, 4, 5, 6, 0];
  $('#horario').innerHTML = orden.map(d => `<tr class="${d === hoyD ? 'hoy' : ''}"><th scope="row">${DIAS[d][0].toUpperCase() + DIAS[d].slice(1)}${d === hoyD ? ' (hoy)' : ''}</th><td>${HORARIO[d].length ? HORARIO[d].map(([a, b]) => `${a} a ${b}`).join(' y ') : 'Cerrado'}</td></tr>`).join('');
  (function estadoTienda() {
    const m = ahoraMin(), est = $('#estado');
    const abierto = HORARIO[hoyD].find(([a, b]) => m >= min(a) && m < min(b));
    if (abierto) { est.textContent = `Abierto ahora · cierra a las ${abierto[1]}`; est.className = 'estado abierto'; return; }
    const luego = HORARIO[hoyD].find(([a]) => min(a) > m);
    if (luego) { est.textContent = `Cerrado ahora · abre hoy a las ${luego[0]}`; est.className = 'estado cerrado'; return; }
    for (let k = 1; k < 8; k++) { const d = (hoyD + k) % 7; if (HORARIO[d].length) { est.textContent = `Cerrado ahora · abre ${k === 1 ? 'mañana' : 'el ' + DIAS[d]} a las ${HORARIO[d][0][0]}`; est.className = 'estado cerrado'; return; } }
  })();
})();
