// Demo GUVIC: portada, tarifa y presupuesto, buscador, cesta y tienda (sin dependencias)
(() => {
  const N = window.NEGOCIO, S = window.SERVICIOS, C = window.CATEGORIAS, P = window.PRODUCTOS;
  const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const eur = n => (Math.round(n * 100) / 100).toLocaleString('es-ES', { minimumFractionDigits: n % 1 ? 2 : 0, maximumFractionDigits: 2 }) + ' €';
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const ico = (id, cls = '') => `<svg class="${cls}" aria-hidden="true"><use href="#i-${id}"/></svg>`;
  const norm = s => String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  const guardar = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} };
  const leer = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch (e) { return d; } };
  const porId = Object.fromEntries(P.map(p => [p.id, p]));
  const servId = Object.fromEntries(S.map(s => [s.id, s]));
  const precioServ = s => s.p === 0 ? 'Gratis' : s.pMax ? `${s.p}-${s.pMax} €` : eur(s.p);
  window.GUVIC = { eur, esc, ico, servId, precioServ };

  // ---------- Tostada ----------
  const tost = document.createElement('div'); tost.className = 'tostada'; tost.setAttribute('role', 'status'); document.body.appendChild(tost);
  let tT; const tostada = t => { tost.textContent = t; tost.classList.add('ver'); clearTimeout(tT); tT = setTimeout(() => tost.classList.remove('ver'), 2400); };

  // ---------- Menú móvil ----------
  const ham = $('.hamburguesa'), menu = $('#menu');
  ham?.addEventListener('click', () => { const a = menu.classList.toggle('abierto'); ham.setAttribute('aria-expanded', a); });
  menu?.addEventListener('click', e => { if (e.target.closest('a')) { menu.classList.remove('abierto'); ham?.setAttribute('aria-expanded', 'false'); } });

  // ---------- Modales (se crean una vez) ----------
  document.body.insertAdjacentHTML('beforeend', `
  <div class="modal" id="m-prod" role="dialog" aria-modal="true" aria-labelledby="m-prod-t"><div class="fondo" data-cerrar></div><div class="caja ancha"><button class="x" type="button" data-cerrar aria-label="Cerrar">${ico('x')}</button><div id="m-prod-c"></div></div></div>
  <div class="modal" id="m-reserva" role="dialog" aria-modal="true" aria-labelledby="m-res-t"><div class="fondo" data-cerrar></div><div class="caja">
    <button class="x" type="button" data-cerrar aria-label="Cerrar">${ico('x')}</button>
    <h2 id="m-res-t">Reserva tu taller</h2><p class="bajada">Te confirmamos por WhatsApp el día y el precio final.</p>
    <div class="resumen-f" id="res-resumen"></div>
    <form id="f-reserva" novalidate>
      <div class="dos"><div class="campo"><label for="r-nombre">Nombre</label><input id="r-nombre" name="nombre" autocomplete="name" required></div>
      <div class="campo"><label for="r-tel">Teléfono</label><input id="r-tel" name="tel" type="tel" autocomplete="tel" inputmode="tel" required></div></div>
      <div class="campo"><fieldset><legend>¿Cómo nos la das?</legend>
        <label class="opcion"><input type="radio" name="entrega" value="taller" checked> La llevo yo al taller</label>
        <label class="opcion"><input type="radio" name="entrega" value="recogida"> Recogida a domicilio</label></fieldset></div>
      <div class="campo" id="r-dir-c" hidden><label for="r-dir">Dirección de recogida</label><input id="r-dir" name="dir" autocomplete="street-address" placeholder="Calle, número y pueblo"></div>
      <div class="dos"><div class="campo"><label for="r-dia">Día</label><input id="r-dia" name="dia" type="date"></div>
      <div class="campo"><label for="r-franja">Franja</label><select id="r-franja" name="franja"><option>Mañana</option><option>Mediodía</option><option>Tarde</option></select></div></div>
      <div class="campo"><label for="r-bici">Bici o patinete (opcional)</label><input id="r-bici" name="bici" placeholder="Ej.: Orbea Orca de carretera"></div>
      <button class="btn btn-cian" type="submit" style="width:100%">${ico('wa')}Enviar al taller por WhatsApp</button>
    </form></div></div>
  <div class="cajon" id="cesta" role="dialog" aria-modal="true" aria-labelledby="cesta-t"><div class="fondo" data-cerrar></div><div class="panel">
    <div class="cab"><h2 id="cesta-t">Tu cesta</h2><button type="button" data-cerrar aria-label="Cerrar la cesta">${ico('x')}</button></div>
    <div class="lineas" id="cesta-lineas"></div>
    <div class="pie-c" id="cesta-pie"></div></div></div>`);

  let ultimoFoco = null;
  const abrir = el => { ultimoFoco = document.activeElement; el.classList.add('abierto'); document.body.style.overflow = 'hidden'; setTimeout(() => (el.querySelector('input,button.x,[data-cerrar]:not(.fondo)') || el).focus(), 30); };
  const cerrar = el => { el.classList.remove('abierto'); if (!$('.modal.abierto, .cajon.abierto, .capa-chat.abierto')) document.body.style.overflow = ''; ultimoFoco?.focus?.(); };
  $$('.modal, .cajon').forEach(m => m.addEventListener('click', e => { if (e.target.closest('[data-cerrar]')) cerrar(m); }));
  document.addEventListener('keydown', e => { if (e.key === 'Escape') { const m = $('.modal.abierto') || $('.cajon.abierto'); if (m) cerrar(m); } });
  window.GUVIC.abrir = abrir; window.GUVIC.cerrar = cerrar;

  // ---------- Cesta ----------
  let cesta = leer('guvic-cesta', {});
  const contar = () => Object.values(cesta).reduce((a, b) => a + b, 0);
  function pintarCesta() {
    for (const k of Object.keys(cesta)) if (!porId[k] || cesta[k] <= 0) delete cesta[k];
    guardar('guvic-cesta', cesta);
    $$('.contador').forEach(c => { const n = contar(); c.textContent = n; c.hidden = !n; });
    const ids = Object.keys(cesta);
    const total = ids.reduce((a, id) => a + porId[id].p * cesta[id], 0);
    $('#cesta-lineas').innerHTML = ids.length ? ids.map(id => { const p = porId[id]; return `<div class="linea"><img src="img/p/${p.id}.jpg" alt=""><div><b>${esc(p.n)}</b><div class="cant"><button type="button" data-cant="${p.id}" data-d="-1" aria-label="Quitar uno">−</button><span>${cesta[id]}</span><button type="button" data-cant="${p.id}" data-d="1" aria-label="Añadir uno">+</button></div></div><span class="p">${eur(p.p * cesta[id])}</span></div>`; }).join('')
      : `<div class="vacia">${ico('cesta')}<p>Tu cesta está vacía.</p><a class="btn btn-negro" href="tienda.html">Ir a la tienda</a></div>`;
    $('#cesta-pie').innerHTML = ids.length ? `<div class="total"><span>Total</span><b>${eur(total)}</b></div><p>Recogida gratis en el taller de Puçol o envío a toda España. ¿Te lo montamos? Dínoslo al pedir.</p><button class="btn btn-cian" type="button" id="cesta-pedir">${ico('wa')}Hacer el pedido por WhatsApp</button>` : '';
    $('#cesta .vacia svg')?.setAttribute('style', 'width:48px;height:48px;margin:0 auto 8px;display:block');
  }
  const anadir = (id, n = 1) => { cesta[id] = (cesta[id] || 0) + n; pintarCesta(); tostada('Añadido a la cesta'); };
  document.addEventListener('click', e => {
    const a = e.target.closest('[data-anadir]'); if (a) { anadir(a.dataset.anadir); return; }
    const c = e.target.closest('[data-cant]'); if (c) { cesta[c.dataset.cant] = (cesta[c.dataset.cant] || 0) + +c.dataset.d; pintarCesta(); return; }
    if (e.target.closest('[data-abrir-cesta]')) { pintarCesta(); abrir($('#cesta')); return; }
    const f = e.target.closest('[data-ficha]'); if (f) { ficha(f.dataset.ficha); return; }
    if (e.target.closest('#cesta-pedir')) {
      const ids = Object.keys(cesta);
      const txt = `Hola GUVIC, quiero hacer este pedido desde la web:\n${ids.map(id => `• ${cesta[id]} × ${porId[id].n} (${eur(porId[id].p * cesta[id])})`).join('\n')}\nTotal: ${eur(ids.reduce((a, id) => a + porId[id].p * cesta[id], 0))}\n¿Lo recojo en el taller o me lo enviáis?`;
      window.open(`https://wa.me/${N.wa}?text=${encodeURIComponent(txt)}`, '_blank', 'noopener');
    }
  });
  pintarCesta();

  // ---------- Tarjeta y ficha de producto ----------
  const tarjeta = p => `<article class="prod">
    <button class="foto" type="button" data-ficha="${p.id}" aria-label="Ver ${esc(p.n)}"><img src="img/p/${p.id}.jpg" alt="${esc(p.n)}" loading="lazy" width="480" height="480"><span class="sello ${p.stock ? 'si' : ''}">${p.stock ? 'En taller' : 'Bajo pedido'}</span></button>
    <div class="info">${p.marca ? `<span class="marca-p">${esc(p.marca)}</span>` : ''}<h3><button type="button" data-ficha="${p.id}">${esc(p.n)}</button></h3>
    <div class="pie-p"><span class="precio">${eur(p.p)}</span><button class="mas" type="button" data-anadir="${p.id}" aria-label="Añadir ${esc(p.n)} a la cesta">${ico('mas')}</button></div></div></article>`;
  window.GUVIC.tarjeta = tarjeta;
  function ficha(id) {
    const p = porId[id]; if (!p) return;
    const cat = (C.find(c => c.id === p.cat) || {}).n || '';
    $('#m-prod-c').innerHTML = `<div class="ficha"><img src="img/p/${p.id}.jpg" alt="${esc(p.n)}"><div>
      ${p.marca ? `<span class="marca-p" style="font-size:12px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:var(--gris-4)">${esc(p.marca)}</span>` : ''}
      <h2 id="m-prod-t" style="font-size:30px;margin-top:6px">${esc(p.n)}</h2>
      <div class="precio">${eur(p.p)}</div>
      <span class="estado ${p.stock ? 'si' : ''}"><i></i>${p.stock ? 'Disponible en el taller' : 'Bajo pedido: te avisamos del plazo'}</span>
      <ul><li>Sección: ${esc(cat)}${p.sub ? ' · ' + esc(p.sub) : ''}</li><li>Referencia: ${esc(p.ref || '')}</li><li>Recogida gratis en Puçol o envío a toda España</li><li>¿No sabes si es compatible? Pregúntanos antes de comprar</li></ul>
      <button class="btn btn-cian" type="button" data-anadir="${p.id}">${ico('cesta')}Añadir a la cesta</button>
      <a class="btn btn-borde-osc" href="https://wa.me/${N.wa}?text=${encodeURIComponent('Hola GUVIC, ¿me valdría este producto para mi bici? ' + p.n + ' (' + (p.ref || '') + ')')}" target="_blank" rel="noopener">${ico('wa')}¿Es compatible con mi bici?</a>
    </div></div>`;
    abrir($('#m-prod'));
  }

  // ---------- Buscador con sugerencias ----------
  const q = $('#q'), sug = $('#sug');
  if (q) {
    let sel = -1;
    const buscarP = t => { const w = norm(t).split(/\s+/).filter(Boolean); return P.filter(p => { const h = norm(p.n + ' ' + p.marca + ' ' + p.sub + ' ' + p.cat); return w.every(x => h.includes(x)); }); };
    // primero los servicios cuyo nombre lleva lo buscado, luego los de esa sección y al final los que solo lo citan en la descripción
    const buscarS = t => {
      const w = norm(t).split(/\s+/).filter(Boolean);
      const peso = s => w.filter(x => norm(s.n).includes(x)).length * 2 + w.filter(x => norm(s.cat).includes(x)).length;
      return S.filter(s => s.id !== 's2' && w.every(x => norm(s.n + ' ' + s.cat + ' ' + s.d + ' ' + s.dep).includes(x))).sort((a, b) => peso(b) - peso(a));
    };
    window.GUVIC.buscarP = buscarP;
    const pintar = () => {
      const t = q.value.trim(); sel = -1;
      if (t.length < 2) { sug.classList.remove('abierto'); q.setAttribute('aria-expanded', 'false'); return; }
      const sv = buscarS(t).slice(0, 3), pr = buscarP(t).slice(0, 6);
      sug.innerHTML = (sv.length ? `<h4>Reparaciones</h4>` + sv.map(s => `<a class="sug" role="option" href="index.html#taller" data-serv="${s.id}"><span class="ico-serv">${ico('llave')}</span><span><b>${esc(s.n)}</b><small>${s.dep === 'bici' ? 'Bici' : 'Patinete'} · ${esc(s.cat)} · ${precioServ(s)}</small></span></a>`).join('') : '')
        + (pr.length ? `<h4>Productos</h4>` + pr.map(p => `<button class="sug" role="option" type="button" data-ficha="${p.id}"><img src="img/p/${p.id}.jpg" alt=""><span><b>${esc(p.n)}</b><small>${eur(p.p)}${p.marca ? ' · ' + esc(p.marca) : ''}</small></span></button>`).join('') + `<a class="sug" href="tienda.html?q=${encodeURIComponent(t)}"><span><b>Ver todos los resultados de «${esc(t)}»</b></span></a>` : '')
        || `<div class="sug-vacio">No encontramos «${esc(t)}». <button class="chip" type="button" data-abrir-chat data-msg="${esc(t)}">Pregúntale al asistente</button></div>`;
      sug.classList.add('abierto'); q.setAttribute('aria-expanded', 'true');
    };
    q.addEventListener('input', pintar);
    q.addEventListener('focus', pintar);
    q.addEventListener('keydown', e => {
      const ops = $$('.sug', sug);
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); sel = (sel + (e.key === 'ArrowDown' ? 1 : -1) + ops.length) % ops.length; ops.forEach((o, i) => o.classList.toggle('activo', i === sel)); ops[sel]?.scrollIntoView({ block: 'nearest' }); }
      else if (e.key === 'Enter') { e.preventDefault(); if (sel >= 0 && ops[sel]) ops[sel].click(); else location.href = 'tienda.html?q=' + encodeURIComponent(q.value.trim()); }
      else if (e.key === 'Escape') { sug.classList.remove('abierto'); }
    });
    document.addEventListener('click', e => { if (!e.target.closest('.buscador')) sug.classList.remove('abierto'); else if (e.target.closest('.sug,[data-abrir-chat]')) setTimeout(() => sug.classList.remove('abierto'), 0); });
    sug.addEventListener('click', e => {
      const a = e.target.closest('[data-serv]'); if (!a || !$('#lista-serv')) return;
      e.preventDefault(); const s = servId[a.dataset.serv];
      verDep(s.dep, s.cat); document.getElementById('taller').scrollIntoView();
      setTimeout(() => { const el = $(`[data-serv-fila="${s.id}"]`); el?.scrollIntoView({ block: 'center' }); el?.animate?.([{ boxShadow: '0 0 0 4px #00d4ff' }, { boxShadow: '0 0 0 0 transparent' }], { duration: 1600 }); }, 400);
    });
  }

  // ---------- Horario: abierto / cerrado ----------
  const DIAS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
  if ($('#horario')) {
    const ahora = new Date(new Date().toLocaleString('en-US', { timeZone: 'Europe/Madrid' }));
    const hoy = ahora.getDay(), min = ahora.getHours() * 60 + ahora.getMinutes();
    const fr = d => N.horario[d].length ? N.horario[d].map(([a, b, c, e]) => `${a}:${String(b).padStart(2, '0')} - ${c}:${String(e).padStart(2, '0')}`).join(' · ') : 'Cerrado';
    $('#horario tbody').innerHTML = [1, 2, 3, 4, 5, 6, 0].map(d => `<tr class="${d === hoy ? 'hoy' : ''}"><td>${DIAS[d]}${d === hoy ? ' (hoy)' : ''}</td><td>${fr(d)}</td></tr>`).join('');
    const abierto = N.horario[hoy].some(([a, b, c, e]) => min >= a * 60 + b && min < c * 60 + e);
    let prox = ''; for (let k = 0; k < 8 && !abierto; k++) { const d = (hoy + k) % 7; const t = N.horario[d].find(([a, b]) => k > 0 || a * 60 + b > min); if (t) { prox = `${k === 0 ? 'hoy' : k === 1 ? 'mañana' : 'el ' + DIAS[d].toLowerCase()} a las ${t[0]}:${String(t[1]).padStart(2, '0')}`; break; } }
    const fin = abierto ? N.horario[hoy].find(([a, b, c, e]) => min < c * 60 + e) : null;
    $('#estado').className = 'estado ' + (abierto ? 'si' : 'no');
    $('#estado span').textContent = abierto ? `Abierto ahora · hasta las ${fin[2]}:${String(fin[3]).padStart(2, '0')}` : `Cerrado ahora · abrimos ${prox}`;
  }

  // ---------- Portada: packs, tarifa y presupuesto ----------
  let elegidos = leer('guvic-presu', []).filter(id => servId[id]);
  let dep = 'bici', cat = 'General';
  function verDep(d, c = 'General') {
    dep = d; cat = c;
    $$('.pestanas [role=tab]').forEach(b => b.setAttribute('aria-selected', b.dataset.dep === d));
    pintarTarifa();
  }
  function pintarTarifa() {
    const cats = [...new Set(S.filter(s => s.dep === dep).map(s => s.cat)), 'Todas'];
    $('#filtro-cats').innerHTML = cats.map(c => `<button type="button" aria-pressed="${c === cat}" data-cat="${esc(c)}">${esc(c)}</button>`).join('');
    const lista = S.filter(s => s.id !== 's2' && s.dep === dep && (cat === 'Todas' || s.cat === cat));
    $('#lista-serv').innerHTML = lista.map(s => `<div class="serv" data-serv-fila="${s.id}">
      <h3>${esc(s.n)}</h3>
      <div class="meta"><span>${esc(s.cat)}</span>${s.min ? `<span>${ico('reloj', '').replace('<svg', '<svg width="14" height="14" style="vertical-align:-2px;margin-right:3px"')}~${s.min} min</span>` : ''}</div>
      <span class="precio ${s.p === 0 ? 'gratis' : ''}">${precioServ(s)}</span>
      <button class="anadir" type="button" data-elegir="${s.id}" aria-pressed="${elegidos.includes(s.id)}" aria-label="${elegidos.includes(s.id) ? 'Quitar' : 'Añadir'} ${esc(s.n)} ${elegidos.includes(s.id) ? 'del' : 'al'} presupuesto">${ico(elegidos.includes(s.id) ? 'ok' : 'mas')}</button>
      ${s.d ? `<p class="desc${s.d.length > 110 ? ' larga' : ''}">${esc(s.d)}</p>` : ''}</div>`).join('');
  }
  function pintarPresu() {
    guardar('guvic-presu', elegidos);
    const ul = $('#presu-lista'); if (!ul) return;
    const exp = $('#express').checked;
    ul.innerHTML = elegidos.length ? elegidos.map(id => { const s = servId[id]; return `<li><span>${esc(s.n)}</span><span style="display:flex;align-items:center;gap:6px;white-space:nowrap">${precioServ(s)}<button type="button" data-elegir="${id}" aria-label="Quitar ${esc(s.n)}">${ico('x').replace('<svg', '<svg width="16" height="16"')}</button></span></li>`; }).join('') : `<li class="vacio" style="display:block;border-bottom:1px dashed var(--linea)">Pulsa + en los servicios que necesites</li>`;
    const total = elegidos.reduce((a, id) => a + servId[id].p, 0) + (exp && elegidos.length ? 5 : 0);
    const maxT = elegidos.some(id => servId[id].pMax) ? elegidos.reduce((a, id) => a + (servId[id].pMax || servId[id].p), 0) + (exp ? 5 : 0) : 0;
    const mins = elegidos.reduce((a, id) => a + (servId[id].min || 0), 0);
    $('#presu-total').textContent = maxT ? `${eur(total)} - ${eur(maxT)}` : eur(total);
    $('#presu-tiempo').textContent = elegidos.length ? `Tiempo de taller aproximado: ${mins >= 60 ? Math.floor(mins / 60) + ' h ' + (mins % 60 ? mins % 60 + ' min' : '') : mins + ' min'}. Piezas aparte.` : 'Añade servicios de la lista';
    $('#presu-reservar').disabled = !elegidos.length;
    const barra = $('.barra-presu');
    if (barra) { barra.classList.toggle('visible', elegidos.length > 0 && !barraOculta); barra.querySelector('b').textContent = $('#presu-total').textContent; barra.querySelector('small').textContent = `${elegidos.length} servicio${elegidos.length > 1 ? 's' : ''} en tu presupuesto`; }
  }
  let barraOculta = false;
  if ($('#lista-serv')) {
    $('#n-serv').textContent = S.length; $('#n-prod').textContent = P.length;
    const PACKS = [['s5', 'Puesta a punto', false, 'Ajuste de frenos, cambios, manetas y dirección, con apriete a par de toda la tornillería.'], ['s6', 'El más completo', true, 'Limpieza GUVIC, desmontaje y engrase de bielas y dirección, y regulación final de toda la bici.'], ['s4', 'Que brille', false, 'Limpieza completa con desengrasado y lubricación de todos los componentes exteriores.'], ['s31', 'Transmisión nueva', false, 'Cadena, cassette, cables, manetas y desviadores, con ajuste, cambio de bielas y engrase.']];
    $('#packs').innerHTML = PACKS.map(([id, tipo, dest, txt]) => { const s = servId[id]; if (!s) return ''; return `<article class="pack ${dest ? 'destacado' : ''}"><span class="tipo">${tipo}</span><h3>${esc(s.n)}</h3><p>${esc(txt)}</p><div class="precio">${eur(s.p)}<small>~${s.min} min</small></div><button class="btn ${dest ? 'btn-cian' : 'btn-negro'}" type="button" data-elegir="${id}" data-solo-anadir>Añadir al presupuesto</button></article>`; }).join('');
    $$('.pestanas [role=tab]').forEach(b => b.addEventListener('click', () => verDep(b.dataset.dep)));
    $('#filtro-cats').addEventListener('click', e => { const b = e.target.closest('[data-cat]'); if (b) { cat = b.dataset.cat; pintarTarifa(); } });
    document.addEventListener('click', e => {
      const b = e.target.closest('[data-elegir]'); if (!b) return;
      const id = b.dataset.elegir;
      if (elegidos.includes(id)) { if (b.hasAttribute('data-solo-anadir')) { tostada('Ya está en tu presupuesto'); return; } elegidos = elegidos.filter(x => x !== id); }
      else { elegidos.push(id); tostada(`${servId[id].n}: añadido al presupuesto`); }
      pintarTarifa(); pintarPresu();
    });
    $('#express').addEventListener('change', pintarPresu);
    document.body.insertAdjacentHTML('beforeend', `<div class="barra-presu" role="region" aria-label="Resumen del presupuesto"><div><b>0 €</b><small></small></div><a class="btn btn-cian" href="#presu">Ver presupuesto</a></div>`);
    // la barra se esconde cuando el presupuesto completo ya se ve en pantalla
    new IntersectionObserver(es => { barraOculta = es[0].isIntersecting; pintarPresu(); }).observe($('#presu'));
    $('#presu-reservar').addEventListener('click', () => reservar());
    pintarTarifa(); pintarPresu();

    $('#cats').innerHTML = C.map(c => `<a class="cat" href="tienda.html?cat=${c.id}"><img src="img/p/${c.foto}.jpg" alt="" loading="lazy" width="480" height="360"><div><b>${esc(c.n)}</b><span>${c.num} producto${c.num > 1 ? 's' : ''}</span></div></a>`).join('');
    $('#novedades').innerHTML = P.slice(0, 8).map(tarjeta).join('');
  }

  // ---------- Reserva (presupuesto → WhatsApp) ----------
  function reservar() {
    const exp = $('#express')?.checked;
    const total = $('#presu-total')?.textContent || '';
    $('#res-resumen').innerHTML = `<b>Servicios:</b> ${elegidos.map(id => esc(servId[id].n)).join(', ')}${exp ? ', Express (+5 €)' : ''}<br><b>Total orientativo:</b> ${esc(total)} (mano de obra)`;
    const hoy = new Date(); $('#r-dia').min = hoy.toISOString().slice(0, 10);
    abrir($('#m-reserva'));
  }
  $('#f-reserva').addEventListener('change', e => { if (e.target.name === 'entrega') $('#r-dir-c').hidden = e.target.value !== 'recogida'; });
  $('#f-reserva').addEventListener('submit', e => {
    e.preventDefault();
    const f = e.target, d = Object.fromEntries(new FormData(f));
    const malos = [];
    if (!d.nombre.trim()) malos.push(f.nombre);
    if (!/^[+\d][\d\s]{8,}$/.test(d.tel.trim())) malos.push(f.tel);
    if (d.entrega === 'recogida' && !d.dir.trim()) malos.push(f.dir);
    $$('input', f).forEach(i => i.removeAttribute('aria-invalid'));
    if (malos.length) { malos.forEach(i => i.setAttribute('aria-invalid', 'true')); malos[0].focus(); tostada('Revisa los campos marcados'); return; }
    const exp = $('#express')?.checked;
    const fecha = d.dia ? new Date(d.dia + 'T12:00').toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' }) : 'cuando me digáis';
    const txt = `Hola GUVIC, soy ${d.nombre.trim()}. Quiero reservar taller desde la web:\n${elegidos.map(id => `• ${servId[id].n} (${precioServ(servId[id])})`).join('\n')}${exp ? '\n• Servicio Express (+5 €)' : ''}\nTotal orientativo: ${$('#presu-total').textContent} + piezas si hacen falta\n${d.bici ? 'Bici: ' + d.bici + '\n' : ''}${d.entrega === 'recogida' ? `Recogida en: ${d.dir.trim()}` : 'La llevo yo al taller'} · ${fecha}, ${d.franja.toLowerCase()}\nTeléfono: ${d.tel.trim()}`;
    window.open(`https://wa.me/${N.wa}?text=${encodeURIComponent(txt)}`, '_blank', 'noopener');
    cerrar($('#m-reserva'));
    tostada('Abriendo WhatsApp con tu reserva');
  });

  // ---------- Página de tienda ----------
  const T = $('#tienda-pagina');
  if (T) {
    const par = new URLSearchParams(location.search);
    const st = { cat: par.get('cat') || '', marca: '', q: par.get('q') || '', orden: 'nuevo', stock: false };
    if (st.q && q) q.value = st.q;
    const marcas = [...new Set(P.map(p => p.marca).filter(Boolean))].sort();
    $('#f-marca').innerHTML = `<option value="">Todas las marcas</option>` + marcas.map(m => `<option>${esc(m)}</option>`).join('');
    function pintarT() {
      $('#f-cats').innerHTML = [{ id: '', n: 'Todos los productos', num: P.length }, ...C].map(c => `<button type="button" aria-pressed="${st.cat === c.id}" data-fcat="${c.id}">${esc(c.n)} <span>${c.num}</span></button>`).join('');
      let l = st.q ? window.GUVIC.buscarP(st.q) : P.slice();
      if (st.cat) l = l.filter(p => p.cat === st.cat);
      if (st.marca) l = l.filter(p => p.marca === st.marca);
      if (st.stock) l = l.filter(p => p.stock);
      if (st.orden === 'barato') l.sort((a, b) => a.p - b.p); else if (st.orden === 'caro') l.sort((a, b) => b.p - a.p);
      const cn = (C.find(c => c.id === st.cat) || {}).n;
      $('#t-titulo').textContent = st.q ? `Resultados de «${st.q}»` : cn || 'Tienda';
      $('#t-miga').textContent = cn || (st.q ? 'Búsqueda' : 'Todos los productos');
      $('#t-cuantos').textContent = `${l.length} producto${l.length === 1 ? '' : 's'}`;
      $('#t-rejilla').innerHTML = l.length ? l.map(tarjeta).join('') : `<div class="sin-res" style="grid-column:1/-1"><p>No hay productos con estos filtros.</p><button class="btn btn-negro" type="button" id="t-limpiar">Quitar filtros</button></div>`;
    }
    T.addEventListener('click', e => {
      const b = e.target.closest('[data-fcat]'); if (b) { st.cat = b.dataset.fcat; pintarT(); history.replaceState(null, '', st.cat ? '?cat=' + st.cat : 'tienda.html'); if (innerWidth < 960) $('.filtros').classList.remove('abierto'); $('#t-cuantos').scrollIntoView({ block: 'center' }); }
      if (e.target.closest('#t-limpiar')) { Object.assign(st, { cat: '', marca: '', q: '', stock: false }); $('#f-marca').value = ''; $('#f-stock').checked = false; if (q) q.value = ''; pintarT(); }
      if (e.target.closest('.btn-filtros')) { const f = $('.filtros'); const a = f.classList.toggle('abierto'); e.target.closest('.btn-filtros').setAttribute('aria-expanded', a); }
    });
    $('#f-marca').addEventListener('change', e => { st.marca = e.target.value; pintarT(); });
    $('#f-stock').addEventListener('change', e => { st.stock = e.target.checked; pintarT(); });
    $('#t-orden').addEventListener('change', e => { st.orden = e.target.value; pintarT(); });
    pintarT();
  }
})();
// descripciones largas de la tarifa: plegadas a 2 líneas, se abren al tocar
document.addEventListener('click', e => { const d = e.target.closest('.serv .desc.larga'); if (d) d.classList.toggle('abierta'); });
