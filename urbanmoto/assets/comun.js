/* Urbanmoto · lógica común: catálogo, cesta, buscador, Mi moto, menú y carruseles */
(() => {
  'use strict';
  const D = window.UM_DATOS;
  const WA = '34653478952';
  const ENVIO = 4.9, GRATIS = 50;

  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const norm = s => String(s).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  const ico = (n, cls = '') => `<svg class="ico ${cls}" aria-hidden="true" focusable="false"><use href="#i-${n}"/></svg>`;
  const euros = n => n.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €';
  const lee = (k, def) => { try { const v = JSON.parse(localStorage.getItem(k)); return v == null ? def : v; } catch (e) { return def; } };
  const guarda = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* modo privado */ } };
  const waLink = txt => `https://wa.me/${WA}?text=${encodeURIComponent(txt)}`;
  const reducido = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ---------- Índices del catálogo ----------
  const porId = new Map(D.prods.map(p => [p.id, p]));
  const cats = new Map(), padre = new Map(), nivel = new Map();
  (function rec(l, par, nv) { for (const c of l) { cats.set(c.id, c); nivel.set(c.id, nv); if (par) padre.set(c.id, par.id); if (c.sub) rec(c.sub, c, nv + 1); } })(D.cats, null, 0);
  const ruta = id => { const r = []; let c = +id; while (cats.has(c)) { r.unshift(cats.get(c)); c = padre.get(c); } return r; };
  const catProfunda = p => { let m = null; for (const c of p.c) if (cats.has(c) && (m === null || nivel.get(c) > nivel.get(m))) m = c; return m === null ? null : cats.get(m); };
  const enCat = (p, id) => p.c.includes(+id);

  const motoInfo = new Map();
  for (const m of D.motos) for (const x of m.modelos) {
    let full, corto;
    if (/^Tod[ao]s l[ao]s /.test(x.n)) { corto = x.n.replace(/^Tod[ao]s l[ao]s /, ''); full = corto; corto = corto[0].toUpperCase() + corto.slice(1); full = corto; }
    else if (m.marca === 'Pit bike' || m.marca === 'Minimoto') { full = x.n; corto = m.marca; }
    else if (m.marca === 'Patinete eléctrico') { full = 'Patinete ' + x.n; corto = 'Xiaomi'; }
    else { full = m.marca + ' ' + x.n; corto = x.n.split(' / ')[0]; }
    motoInfo.set(x.k, { k: x.k, marca: m.marca, n: x.n, full, corto, c: x.c });
  }
  for (const x of D.motores) motoInfo.set(x.k, { k: x.k, marca: 'Motor', n: x.n, full: 'motor ' + x.n, corto: x.n.replace('Minarelli ', 'Min. '), c: x.c });

  for (const p of D.prods) {
    const c = catProfunda(p);
    p._n = norm(p.n);
    p._k = norm(p.n + ' ' + (c ? ruta(c.id).map(x => x.n).join(' ') : '') + ' ' + p.m.map(k => motoInfo.get(k)?.full || '').join(' '));
  }
  function buscar(q) {
    const ws = norm(q).split(/[^a-z0-9.,/]+/).filter(w => w.length > 0);
    if (!ws.length) return [];
    const res = [];
    for (const p of D.prods) {
      let pts = 0, ok = true;
      for (const w of ws) {
        if (p._n.includes(w)) pts += 3 + (p._n.startsWith(w) ? 2 : 0);
        else if (p._k.includes(w)) pts += 1;
        else { ok = false; break; }
      }
      if (ok) res.push([pts + (p.s > 0 ? 1 : 0), p]);
    }
    return res.sort((a, b) => b[0] - a[0] || a[1].n.localeCompare(b[1].n)).map(x => x[1]);
  }

  // ---------- Mi moto ----------
  const miMoto = () => { const k = lee('um-moto', null); return k && motoInfo.has(k) ? motoInfo.get(k) : null; };
  function ponMoto(k) {
    if (k) guarda('um-moto', k); else { try { localStorage.removeItem('um-moto'); } catch (e) {} }
    pintaMoto();
    document.dispatchEvent(new CustomEvent('um:moto'));
  }
  function pintaMoto() {
    const m = miMoto(), b = $('#btn-mimoto');
    if (!b) return;
    $('.etq-moto', b).textContent = m ? m.corto : 'Mi moto';
    b.toggleAttribute('data-con-moto', !!m);
    b.setAttribute('aria-label', m ? `Mi moto: ${m.full}. Cambiar` : 'Mi moto: seleccionar');
  }

  // ---------- Cesta ----------
  const CLAVE = 'um-cesta';
  const cesta = {
    items() { return lee(CLAVE, []).filter(i => porId.has(i.id) && porId.get(i.id).s > 0).map(i => ({ id: i.id, q: Math.min(i.q, porId.get(i.id).s) })); },
    set(items) { guarda(CLAVE, items); pintaContador(true); document.dispatchEvent(new CustomEvent('um:cesta')); },
    add(id, q = 1) {
      const p = porId.get(+id); if (!p || p.s <= 0) return 0;
      const it = this.items(); const e = it.find(i => i.id === p.id); const antes = e ? e.q : 0;
      const nuevo = Math.min(p.s, antes + q);
      if (e) e.q = nuevo; else it.push({ id: p.id, q: nuevo });
      this.set(it); return nuevo - antes;
    },
    put(id, q) { const p = porId.get(+id); const it = this.items(); const e = it.find(i => i.id === +id); if (!e) return; e.q = Math.max(1, Math.min(p.s, q)); this.set(it); },
    del(id) { this.set(this.items().filter(i => i.id !== +id)); },
    cantidad(id) { const e = this.items().find(i => i.id === +id); return e ? e.q : 0; },
    unidades() { return this.items().reduce((a, i) => a + i.q, 0); },
    subtotal() { return this.items().reduce((a, i) => a + i.q * porId.get(i.id).p, 0); },
    envio(sub) { return sub === 0 || sub >= GRATIS ? 0 : ENVIO; },
    vaciar() { this.set([]); },
  };
  function pintaContador(animar) {
    const n = cesta.unidades(), c = $('#contador'), b = $('#btn-cesta');
    if (!c) return;
    c.textContent = n;
    b.setAttribute('aria-label', `Cesta, ${n} ${n === 1 ? 'producto' : 'productos'}`);
    if (animar && !reducido) { c.classList.remove('pulso'); void c.offsetWidth; c.classList.add('pulso'); }
  }
  function bloqueEnvio(sub) {
    if (sub >= GRATIS) return `<div class="envio-gratis conseguido">${ico('check')} ¡Tienes el envío gratis!</div>`;
    const falta = GRATIS - sub;
    return `<div class="envio-gratis">Te faltan <strong>${euros(falta)}</strong> para el <strong>envío gratis</strong><div class="barra" role="progressbar" aria-valuemin="0" aria-valuemax="${GRATIS}" aria-valuenow="${sub.toFixed(2)}" aria-label="Progreso hacia el envío gratis"><span style="width:${Math.min(100, sub / GRATIS * 100)}%"></span></div></div>`;
  }

  // ---------- Tarjeta de producto ----------
  function etiqueta(p) {
    if (p.s <= 0) return '<span class="prod-etiqueta agotado">Agotado</span>';
    if (p.nu) return '<span class="prod-etiqueta nuevo">Novedad</span>';
    if (p.s <= 2) return '<span class="prod-etiqueta ultimas">Últimas unidades</span>';
    return '<span class="prod-etiqueta vacia" aria-hidden="true">·</span>';
  }
  function lineaStock(p) {
    if (p.s <= 0) return `<p class="prod-stock sin">Sin stock ahora mismo</p>`;
    if (p.s <= 2) return `<p class="prod-stock pocas">¡Solo ${p.s === 1 ? 'queda 1' : 'quedan ' + p.s}!</p>`;
    return `<p class="prod-stock ok">${ico('check')}En stock</p>`;
  }
  function tarjeta(p) {
    const c = catProfunda(p), m = miMoto();
    const compat = m && p.m.includes(m.k) ? `<p class="prod-compat">${ico('check')} Indicado para tu ${esc(m.corto)}</p>` : '';
    const alt = p.i > 1 ? `<img class="alt" src="img/p/${p.id}-2.webp" alt="" loading="lazy" width="640" height="640">` : '';
    const boton = p.s > 0
      ? `<button class="btn btn-naranja prod-anadir" type="button" data-anadir="${p.id}" aria-label="Añadir a mi cesta: ${esc(p.n)}">Añadir a mi cesta ${ico('flecha-der')}</button>`
      : `<a class="btn btn-borde prod-anadir" href="${waLink('Hola, ¿os volverá a entrar «' + p.n + '»?')}" target="_blank" rel="noopener">Avísame por WhatsApp</a>`;
    return `<article class="prod">
      <a class="prod-foto" href="producto.html?id=${p.id}" tabindex="-1" aria-hidden="true"><img src="img/p/${p.id}-1-s.webp" srcset="img/p/${p.id}-1-s.webp 320w, img/p/${p.id}-1.webp 640w" sizes="(max-width: 640px) 46vw, 240px" alt="${esc(p.n)}" loading="lazy" width="320" height="320">${alt}</a>
      ${etiqueta(p)}
      <p class="prod-cat">${esc(c ? c.n : '')}</p>
      <h3 class="prod-nombre"><a href="producto.html?id=${p.id}">${esc(p.n)}</a></h3>
      ${compat}
      <p class="prod-precio">${euros(p.p)} <small>IVA incluido</small></p>
      ${boton}
      ${lineaStock(p)}
    </article>`;
  }

  // ---------- Paneles (menú, cesta, Mi moto) ----------
  let abierto = null, origen = null;
  const enfocables = el => $$('a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea, [tabindex]:not([tabindex="-1"])', el).filter(e => e.getClientRects().length > 0);
  function abrir(panel, quien) {
    if (abierto && abierto !== panel) cerrar(abierto, true);
    origen = quien || document.activeElement;
    const velo = $('#velo');
    panel.hidden = false; velo.hidden = false;
    requestAnimationFrame(() => { panel.classList.add('abierto'); velo.classList.add('abierto'); });
    document.documentElement.style.overflow = 'hidden';
    abierto = panel;
    if (quien && quien.hasAttribute('aria-expanded')) quien.setAttribute('aria-expanded', 'true');
    setTimeout(() => { const f = panel.querySelector('[data-foco]') || enfocables(panel)[0]; f && f.focus(); }, 60);
  }
  function cerrar(panel = abierto, sinFoco) {
    if (!panel) return;
    panel.classList.remove('abierto');
    const velo = $('#velo'); velo.classList.remove('abierto');
    const fin = () => { if (!panel.classList.contains('abierto')) { if (!panel.hasAttribute('data-siempre')) panel.hidden = true; if (!abierto) velo.hidden = true; } };
    reducido ? fin() : setTimeout(fin, 260);
    document.documentElement.style.overflow = '';
    if (origen && origen.hasAttribute && origen.hasAttribute('aria-expanded')) origen.setAttribute('aria-expanded', 'false');
    abierto = null;
    panel.dispatchEvent(new CustomEvent('um:cerrado'));
    if (!sinFoco && origen && origen.focus) origen.focus();
  }
  document.addEventListener('keydown', e => {
    if (!abierto) return;
    if (e.key === 'Escape') { e.preventDefault(); cerrar(); return; }
    if (e.key === 'Tab') {
      const f = enfocables(abierto); if (!f.length) return;
      const i = f.indexOf(document.activeElement);
      if (e.shiftKey && (i <= 0)) { e.preventDefault(); f[f.length - 1].focus(); }
      else if (!e.shiftKey && i === f.length - 1) { e.preventDefault(); f[0].focus(); }
    }
  });
  document.addEventListener('click', e => {
    if (e.target.id === 'velo') cerrar();
    const c = e.target.closest('[data-cerrar]'); if (c) cerrar();
  });

  // Menú lateral
  const ICONO_FAMILIA = { 19: 'c-motor', 29: 'c-frenos', 30: 'c-electrico', 31: 'c-taller', 65: 'c-equipamiento', 76: 'c-pitbike', 77: 'c-minimoto', 78: 'c-patinete' };
  function pintaMenu() {
    const cuerpo = $('#menu-cuerpo'); if (!cuerpo) return;
    let h = '<ul class="menu-lista">';
    for (const f of D.cats) {
      const sub = (f.sub || []);
      h += `<li><button class="menu-familia" type="button" aria-expanded="false" aria-controls="menu-${f.id}"><span class="menu-icono">${ico(ICONO_FAMILIA[f.id] || 'c-motor')}</span>${esc(f.n)}${ico('flecha-der', 'flecha')}</button>
        <ul class="menu-sub" id="menu-${f.id}" hidden><li><a class="ver-todo" href="tienda.html?c=${f.id}">Ver todo ${esc(f.n.toLowerCase())} <span>${f.count}</span></a></li>
        ${sub.map(s => `<li><a href="tienda.html?c=${s.id}">${esc(s.n)} <span>${s.count}</span></a></li>`).join('')}</ul></li>`;
    }
    h += `</ul><div class="menu-extra">
      <a href="tienda.html?orden=nov">${ico('estrella')}Novedades</a>
      <a href="#" data-abrir-moto>${ico('moto')}Buscar por mi moto</a>
      <a href="ayuda.html#envios">${ico('camion')}Envíos y devoluciones</a>
      <a href="${waLink('Hola, tengo una duda sobre un recambio')}" target="_blank" rel="noopener">${ico('whatsapp')}Pregúntanos por WhatsApp</a>
    </div>`;
    cuerpo.innerHTML = h;
    cuerpo.addEventListener('click', e => {
      const b = e.target.closest('.menu-familia'); if (!b) return;
      const abre = b.getAttribute('aria-expanded') !== 'true';
      b.setAttribute('aria-expanded', abre); $('#' + b.getAttribute('aria-controls')).hidden = !abre;
    });
  }

  // Cesta lateral
  let ultimoAnadido = null;
  function pintaCestaLateral() {
    const cuerpo = $('#cesta-cuerpo'), pie = $('#cesta-pie'); if (!cuerpo) return;
    const it = cesta.items();
    if (!it.length) {
      cuerpo.innerHTML = `<div class="cesta-vacia">${ico('cesta')}<p>Tu cesta está vacía.</p></div>`;
      pie.innerHTML = `<a class="btn btn-naranja btn-ancho" href="tienda.html">Ver recambios ${ico('flecha-der')}</a>`;
      return;
    }
    cuerpo.innerHTML = it.map(i => {
      const p = porId.get(i.id);
      return `<div class="linea-cesta${i.id === ultimoAnadido ? ' destacada' : ''}">
        <img src="img/p/${p.id}-1-s.webp" alt="" width="76" height="76">
        <div><h3><a href="producto.html?id=${p.id}">${esc(p.n)}</a></h3>
          <div class="lc-acciones">${selectorCantidad(p, i.q)}<button class="btn-quitar" type="button" data-quitar="${p.id}">Quitar<span class="solo-lector"> ${esc(p.n)}</span></button></div></div>
        <p class="lc-precio">${euros(p.p * i.q)}</p></div>`;
    }).join('');
    const sub = cesta.subtotal(), env = cesta.envio(sub);
    pie.innerHTML = `${bloqueEnvio(sub)}<div class="totales"><div><span>Subtotal (${cesta.unidades()} uds.)</span><span>${euros(sub)}</span></div><div><span>Envío 24/48 h</span><span>${env ? euros(env) : 'Gratis'}</span></div><div class="total"><span>Total</span><span>${euros(sub + env)}</span></div></div>
      <a class="btn btn-naranja btn-ancho" href="cesta.html">Tramitar pedido ${ico('flecha-der')}</a>
      <button class="btn btn-borde btn-ancho" type="button" data-cerrar>Seguir comprando</button>`;
    ultimoAnadido = null;
  }
  function selectorCantidad(p, q, grande) {
    return `<div class="cantidad${grande ? ' cantidad-grande' : ''}" role="group" aria-label="Cantidad de ${esc(p.n)}">
      <button type="button" data-menos="${p.id}" aria-label="Quitar una unidad" ${q <= 1 ? 'disabled' : ''}>${ico('menos')}</button>
      <output aria-live="polite">${q}</output>
      <button type="button" data-mas="${p.id}" aria-label="Añadir una unidad" ${q >= p.s ? 'disabled' : ''}>${ico('mas')}</button></div>`;
  }
  document.addEventListener('click', e => {
    const a = e.target.closest('[data-anadir]');
    if (a) {
      const id = +a.dataset.anadir, q = +(a.dataset.cantidad || 1);
      const n = cesta.add(id, q);
      ultimoAnadido = id;
      pintaCestaLateral();
      if (!n) aviso('Ya tienes en la cesta todas las unidades que quedan de este recambio.');
      abrir($('#cesta'), a);
      return;
    }
    // + / − / quitar dentro de la cesta lateral (la página de la cesta gestiona los suyos: data-local)
    const b = e.target.closest('[data-mas], [data-menos], [data-quitar]');
    if (!b || b.closest('[data-local]')) return;
    const id = +(b.dataset.mas || b.dataset.menos || b.dataset.quitar);
    if (b.dataset.quitar) cesta.del(id);
    else cesta.put(id, cesta.cantidad(id) + (b.dataset.mas ? 1 : -1));
    refrescaCesta(b);
  });
  function refrescaCesta(boton) {
    if (!boton.closest('#cesta')) return;
    pintaCestaLateral();
    const id = boton.dataset.mas || boton.dataset.menos;
    const tipo = boton.dataset.mas ? 'mas' : 'menos';
    const destino = id ? ($(`#cesta [data-${tipo}="${id}"]:not(:disabled)`) || $(`#cesta [data-quitar="${id}"]`)) : null;
    (destino || $('#cesta-cuerpo button') || $('#cesta-pie a'))?.focus();
  }
  function aviso(txt) {
    let t = $('#aviso-flotante');
    if (!t) { t = document.createElement('p'); t.id = 'aviso-flotante'; t.setAttribute('role', 'status'); t.style.cssText = 'margin:0;padding:12px 20px;background:#fff4ea;border-bottom:1px solid #f3c08f;font-size:13.5px;font-weight:600'; }
    t.textContent = txt; $('#cesta-cuerpo').prepend(t);
  }

  // Ventana Mi moto
  function pintaVentanaMoto() {
    const cuerpo = $('#mimoto-cuerpo'); if (!cuerpo) return;
    const m = miMoto();
    cuerpo.innerHTML = `${m ? `<div class="moto-actual"><span>Tu moto: <strong>${esc(m.full)}</strong></span><button type="button" id="vm-quitar">Quitar</button></div>` : ''}
      <p>Elige tu moto y marcaremos las piezas que indican en su ficha que le valen. Si dudas, pregúntanos antes de comprar.</p>
      <form id="vm-form">
        <div class="campo"><label for="vm-marca">Marca</label><select id="vm-marca" data-foco><option value="">Elige la marca</option>${D.motos.map((x, i) => `<option value="${i}">${esc(x.marca)}</option>`).join('')}</select></div>
        <div class="campo"><label for="vm-modelo">Modelo</label><select id="vm-modelo" disabled><option value="">Primero elige la marca</option></select></div>
        <p class="etiqueta" style="margin:4px 0 8px">O elige el motor:</p>
        <div class="fichas">${D.motores.map(x => `<button class="ficha" type="button" data-motor="${x.k}" aria-pressed="${m && m.k === x.k}">${esc(x.n)} <span>(${x.c})</span></button>`).join('')}</div>
        <p class="error" id="vm-error" role="alert" style="color:var(--precio);font-weight:700;font-size:13.5px;margin-top:10px" hidden>Elige una marca y un modelo, o un motor.</p>
        <div class="ventana-botones"><button class="btn btn-naranja" type="submit">Guardar y ver sus recambios ${ico('flecha-der')}</button></div>
      </form>`;
    const marca = $('#vm-marca', cuerpo), modelo = $('#vm-modelo', cuerpo);
    let elegido = m ? m.k : null;
    if (m && m.marca !== 'Motor') {
      const i = D.motos.findIndex(x => x.marca === m.marca); marca.value = i; llenaModelos(); modelo.value = m.k;
    }
    function llenaModelos() {
      const x = D.motos[marca.value];
      modelo.innerHTML = x ? `<option value="">Elige el modelo</option>` + x.modelos.map(o => `<option value="${o.k}">${esc(o.n)} (${o.c} ${o.c === 1 ? 'pieza' : 'piezas'})</option>`).join('') : '<option value="">Primero elige la marca</option>';
      modelo.disabled = !x;
      if (x && x.modelos.length === 1) modelo.value = x.modelos[0].k;
    }
    marca.addEventListener('change', () => { llenaModelos(); elegido = modelo.value || null; $$('[data-motor]', cuerpo).forEach(b => b.setAttribute('aria-pressed', 'false')); });
    modelo.addEventListener('change', () => { elegido = modelo.value || null; $$('[data-motor]', cuerpo).forEach(b => b.setAttribute('aria-pressed', 'false')); });
    $$('[data-motor]', cuerpo).forEach(b => b.addEventListener('click', () => {
      $$('[data-motor]', cuerpo).forEach(o => o.setAttribute('aria-pressed', String(o === b)));
      elegido = b.dataset.motor; marca.value = ''; llenaModelos();
    }));
    $('#vm-form', cuerpo).addEventListener('submit', e => {
      e.preventDefault();
      if (!elegido) { $('#vm-error').hidden = false; marca.focus(); return; }
      ponMoto(elegido); cerrar(undefined, true);
      location.href = 'tienda.html?moto=' + encodeURIComponent(elegido);
    });
    const q = $('#vm-quitar', cuerpo);
    q && q.addEventListener('click', () => { ponMoto(null); pintaVentanaMoto(); $('#vm-marca').focus(); });
  }
  document.addEventListener('click', e => {
    const b = e.target.closest('[data-abrir-moto]'); if (!b) return;
    e.preventDefault(); pintaVentanaMoto(); abrir($('#mimoto'), b.closest('#menu') ? $('#btn-mimoto') : b);
  });

  // ---------- Buscador con sugerencias ----------
  function iniciaBuscador() {
    const form = $('#buscador'); if (!form) return;
    const input = $('#q', form), caja = $('#sugerencias', form);
    const params = new URLSearchParams(location.search);
    if (params.get('q') && location.pathname.endsWith('tienda.html')) input.value = params.get('q');
    if (matchMedia('(max-width: 600px)').matches) input.placeholder = 'Buscar recambios';
    let sel = -1, lista = [];
    const cierra = () => { caja.hidden = true; input.setAttribute('aria-expanded', 'false'); input.removeAttribute('aria-activedescendant'); sel = -1; };
    input.addEventListener('input', () => {
      const v = input.value.trim();
      if (v.length < 2) return cierra();
      lista = buscar(v).slice(0, 6);
      caja.innerHTML = lista.length
        ? lista.map((p, i) => `<a id="sug-${i}" role="option" aria-selected="false" href="producto.html?id=${p.id}"><img src="img/p/${p.id}-1-s.webp" alt="" width="52" height="52"><span>${esc(p.n)}</span><span class="sug-precio">${euros(p.p)}</span></a>`).join('') + `<a class="sug-todo" role="option" aria-selected="false" id="sug-${lista.length}" href="tienda.html?q=${encodeURIComponent(v)}">Ver todos los resultados</a>`
        : `<p class="sug-nada">No encontramos «${esc(v)}». Prueba con otra palabra o <a class="enlace" href="${waLink('Hola, busco: ' + v)}" target="_blank" rel="noopener">pregúntanos por WhatsApp</a>.</p>`;
      caja.hidden = false; input.setAttribute('aria-expanded', 'true'); sel = -1;
    });
    input.addEventListener('keydown', e => {
      const ops = $$('[role="option"]', caja);
      if (caja.hidden || !ops.length) return;
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        sel = e.key === 'ArrowDown' ? (sel + 1) % ops.length : (sel <= 0 ? ops.length - 1 : sel - 1);
        ops.forEach((o, i) => o.setAttribute('aria-selected', String(i === sel)));
        input.setAttribute('aria-activedescendant', ops[sel].id);
        ops[sel].scrollIntoView({ block: 'nearest' });
      } else if (e.key === 'Enter' && sel >= 0) { e.preventDefault(); location.href = ops[sel].href; }
      else if (e.key === 'Escape') cierra();
    });
    document.addEventListener('click', e => { if (!form.contains(e.target)) cierra(); });
    form.addEventListener('submit', e => { if (!input.value.trim()) { e.preventDefault(); input.focus(); } });
  }

  // ---------- Aviso rotatorio ----------
  function iniciaAviso() {
    const p = $('#aviso-texto'); if (!p) return;
    const textos = [
      'Envío en 24/48 h: sale al día siguiente del pago',
      `¿Dudas de compatibilidad? <a href="${waLink('Hola, tengo una duda de compatibilidad')}" target="_blank" rel="noopener">Escríbenos por WhatsApp</a>`,
      '4,9/5 en Wallapop con 2.274 valoraciones de clientes',
      `Envío gratis en pedidos desde ${GRATIS} €`,
    ];
    let i = 0, t = null;
    const pon = n => { i = (n + textos.length) % textos.length; p.innerHTML = textos[i]; };
    $('#aviso-ant').addEventListener('click', () => { pon(i - 1); para(); });
    $('#aviso-sig').addEventListener('click', () => { pon(i + 1); para(); });
    const para = () => { clearInterval(t); t = null; };
    if (!reducido) {
      t = setInterval(() => pon(i + 1), 6000);
      const caja = p.closest('.aviso');
      caja.addEventListener('mouseenter', para); caja.addEventListener('focusin', para);
    }
  }

  // ---------- Carruseles ----------
  function carruseles(raiz = document) {
    for (const c of $$('[data-carrusel]', raiz)) {
      if (c.dataset.listo) continue; c.dataset.listo = 1;
      const pista = $('.car-pista', c), ant = $('.car-flecha.ant', c), sig = $('.car-flecha.sig', c);
      const estado = () => {
        if (!ant) return;
        ant.disabled = pista.scrollLeft < 8;
        sig.disabled = pista.scrollLeft + pista.clientWidth >= pista.scrollWidth - 8;
      };
      ant && ant.addEventListener('click', () => pista.scrollBy({ left: -pista.clientWidth * .9, behavior: reducido ? 'auto' : 'smooth' }));
      sig && sig.addEventListener('click', () => pista.scrollBy({ left: pista.clientWidth * .9, behavior: reducido ? 'auto' : 'smooth' }));
      pista.addEventListener('scroll', () => requestAnimationFrame(estado), { passive: true });
      addEventListener('resize', estado);
      estado(); setTimeout(estado, 400);
    }
  }

  // ---------- Arranque ----------
  pintaContador(); pintaMoto(); pintaMenu(); iniciaBuscador(); iniciaAviso();
  $('#btn-menu')?.addEventListener('click', e => abrir($('#menu'), e.currentTarget));
  $('#btn-cesta')?.addEventListener('click', e => { pintaCestaLateral(); abrir($('#cesta'), e.currentTarget); });
  document.addEventListener('um:cesta', () => { if (abierto === $('#cesta')) return; pintaCestaLateral(); });
  addEventListener('storage', e => { if (e.key === CLAVE) { pintaContador(); document.dispatchEvent(new CustomEvent('um:cesta')); } if (e.key === 'um-moto') pintaMoto(); });

  window.UM = { D, $, $$, esc, norm, ico, euros, lee, guarda, waLink, porId, cats, ruta, catProfunda, enCat, motoInfo, miMoto, ponMoto,
    buscar, cesta, tarjeta, etiqueta, lineaStock, selectorCantidad, bloqueEnvio, abrir, cerrar, carruseles, ENVIO, GRATIS, reducido };
})();
