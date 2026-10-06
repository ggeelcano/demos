/* Urbanmoto · cesta y pedido en tres pasos (demo: no cobra nada) */
(() => {
  'use strict';
  const { $, $$, esc, ico, euros, porId, cesta, catProfunda, selectorCantidad, bloqueEnvio, lee, guarda } = window.UM;
  const PROVINCIAS = ['Álava', 'Albacete', 'Alicante', 'Almería', 'Ávila', 'Badajoz', 'Illes Balears', 'Barcelona', 'Burgos', 'Cáceres', 'Cádiz', 'Castellón', 'Ciudad Real', 'Córdoba', 'A Coruña', 'Cuenca', 'Girona', 'Granada', 'Guadalajara', 'Gipuzkoa', 'Huelva', 'Huesca', 'Jaén', 'León', 'Lleida', 'La Rioja', 'Lugo', 'Madrid', 'Málaga', 'Murcia', 'Navarra', 'Ourense', 'Asturias', 'Palencia', 'Las Palmas', 'Pontevedra', 'Salamanca', 'Santa Cruz de Tenerife', 'Cantabria', 'Segovia', 'Sevilla', 'Soria', 'Tarragona', 'Teruel', 'Toledo', 'Valencia', 'Valladolid', 'Bizkaia', 'Zamora', 'Zaragoza', 'Ceuta', 'Melilla'];
  const pasos = ['cesta', 'datos', 'pago', 'ok'];
  let datos = lee('um-datos', {});

  // ---------- Paso 1 ----------
  function pintaCesta() {
    const it = cesta.items(), tabla = $('#tabla-cesta');
    if (!it.length) {
      tabla.innerHTML = `<div class="cesta-vacia">${ico('cesta')}<p>Tu cesta está vacía.</p><p style="margin-top:16px"><a class="btn btn-naranja" href="tienda.html">Ver recambios ${ico('flecha-der')}</a></p></div>`;
      $('#resumen-cesta').innerHTML = resumenTotales();
      $('#a-datos').disabled = true;
      return;
    }
    $('#a-datos').disabled = false;
    tabla.innerHTML = it.map(i => {
      const p = porId.get(i.id), c = catProfunda(p);
      return `<div class="linea-cesta">
        <a href="producto.html?id=${p.id}" tabindex="-1" aria-hidden="true"><img src="img/p/${p.id}-1-s.webp" alt="" width="96" height="96"></a>
        <div><p class="prod-cat" style="margin:0;text-align:left">${esc(c ? c.n : '')}</p><h3><a href="producto.html?id=${p.id}">${esc(p.n)}</a></h3>
          <p class="lc-unit">${euros(p.p)} / unidad · ${p.s <= 2 ? `quedan ${p.s}` : 'en stock'}</p>
          <div class="lc-acciones">${selectorCantidad(p, i.q, true)}<button class="btn-quitar" type="button" data-quitar="${p.id}">${ico('papelera')}Quitar<span class="solo-lector"> ${esc(p.n)}</span></button></div></div>
        <p class="lc-precio lc-total">${euros(p.p * i.q)}</p></div>`;
    }).join('');
    $('#resumen-cesta').innerHTML = resumenTotales(true);
  }
  function resumenTotales(conBarra) {
    const sub = cesta.subtotal(), env = cesta.envio(sub);
    return `${conBarra ? bloqueEnvio(sub) : ''}<div class="totales"><div><span>Productos (${cesta.unidades()} uds.)</span><span>${euros(sub)}</span></div><div><span>Envío 24/48 h</span><span>${!sub ? '—' : env ? euros(env) : 'Gratis'}</span></div><div class="total"><span>Total <small style="font-weight:600;font-size:12px">IVA incluido</small></span><span>${euros(sub + env)}</span></div></div>`;
  }
  function resumenMini() {
    return `<ul class="mini">${cesta.items().map(i => { const p = porId.get(i.id); return `<li><img src="img/p/${p.id}-1-s.webp" alt="" width="46" height="46"><span>${i.q} × ${esc(p.n)}</span><strong>${euros(p.p * i.q)}</strong></li>`; }).join('')}</ul>${resumenTotales()}`;
  }
  $('#tabla-cesta').addEventListener('click', e => {
    const b = e.target.closest('[data-mas], [data-menos], [data-quitar]'); if (!b) return;
    const id = +(b.dataset.mas || b.dataset.menos || b.dataset.quitar);
    if (b.dataset.quitar) cesta.del(id); else cesta.put(id, cesta.cantidad(id) + (b.dataset.mas ? 1 : -1));
    pintaCesta();
    const tipo = b.dataset.mas ? 'mas' : b.dataset.menos ? 'menos' : null;
    const destino = tipo ? ($(`#tabla-cesta [data-${tipo}="${id}"]:not(:disabled)`) || $(`#tabla-cesta [data-quitar="${id}"]`)) : null;
    (destino || $('#tabla-cesta button') || $('#tabla-cesta a'))?.focus();
  });
  document.addEventListener('um:cesta', () => { if (!$('#paso-cesta').hidden) pintaCesta(); });

  // ---------- Navegación entre pasos ----------
  // modo: 'inicio' (primera carga), 'historial' (botón atrás) o nada (clic del usuario)
  function ir(paso, modo) {
    const sinFoco = modo === 'inicio';
    if (paso !== 'cesta' && paso !== 'ok' && !cesta.items().length) paso = 'cesta';
    pasos.forEach(p => { $('#paso-' + p).hidden = p !== paso; });
    const idx = pasos.indexOf(paso);
    $$('#pasos li').forEach((li, i) => {
      li.classList.toggle('hecho', i < idx);
      if (i === idx) li.setAttribute('aria-current', 'step'); else li.removeAttribute('aria-current');
    });
    $('#pasos').hidden = paso === 'ok';
    if (paso === 'cesta') pintaCesta();
    if (paso === 'datos') { $('#resumen-datos').innerHTML = resumenMini(); rellenaDatos(); }
    if (paso === 'pago') pintaPago();
    scrollTo(0, 0);
    if (!sinFoco) { const h = $(`#paso-${paso} h1`); h && h.focus({ preventScroll: true }); }
    const url = paso === 'cesta' ? 'cesta.html' : '#' + paso;
    if (modo === 'inicio') history.replaceState({ paso }, '', url);
    else if (modo !== 'historial' && location.hash.slice(1) !== paso) history.pushState({ paso }, '', url);
  }
  addEventListener('popstate', () => ir(location.hash.slice(1) || 'cesta', 'historial'));
  $('#a-datos').addEventListener('click', () => ir('datos'));
  $$('[data-volver]').forEach(b => b.addEventListener('click', () => ir(b.dataset.volver)));

  // ---------- Paso 2: datos ----------
  const prov = $('#d-prov');
  prov.innerHTML += PROVINCIAS.map(p => `<option>${esc(p)}</option>`).join('');
  $('#d-cp').addEventListener('input', e => {
    e.target.value = e.target.value.replace(/\D/g, '').slice(0, 5);
    const n = +e.target.value.slice(0, 2);
    if (e.target.value.length >= 2 && n >= 1 && n <= 52) prov.value = PROVINCIAS[n - 1];
  });
  function rellenaDatos() { for (const [k, v] of Object.entries(datos)) { const el = $(`#form-datos [name="${k}"]`); if (el && !el.value) el.value = v; } }
  const REGLAS = {
    nombre: v => v.trim().split(/\s+/).length >= 2 || 'Escribe tu nombre y al menos un apellido.',
    email: v => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()) || 'Revisa el correo: falta la @ o el dominio.',
    tel: v => /^[6789]\d{8}$/.test(v.replace(/[\s.-]/g, '').replace(/^\+?34/, '')) || 'Escribe un teléfono de 9 cifras.',
    dir: v => v.trim().length >= 5 || 'Escribe la calle y el número.',
    cp: v => /^(0[1-9]|[1-4]\d|5[0-2])\d{3}$/.test(v) || 'El código postal tiene 5 cifras.',
    pob: v => v.trim().length >= 2 || 'Escribe la población.',
    prov: v => !!v || 'Elige la provincia.',
  };
  $('#form-datos').addEventListener('submit', e => {
    e.preventDefault();
    const f = e.target; let primero = null, errores = 0;
    for (const [k, regla] of Object.entries(REGLAS)) {
      const el = f.elements[k], r = regla(el.value), err = $('#e-' + k);
      const mal = r !== true;
      el.setAttribute('aria-invalid', String(mal));
      err.hidden = !mal; err.textContent = mal ? r : '';
      const desc = [el.getAttribute('aria-describedby') || ''].join(' ').split(' ').filter(x => x && x !== 'e-' + k);
      if (mal) desc.push('e-' + k);
      desc.length ? el.setAttribute('aria-describedby', desc.join(' ')) : el.removeAttribute('aria-describedby');
      if (mal) { errores++; primero = primero || el; }
    }
    const caja = $('#error-datos');
    if (errores) { caja.hidden = false; caja.textContent = errores === 1 ? 'Hay un dato por revisar.' : `Hay ${errores} datos por revisar.`; primero.focus(); return; }
    caja.hidden = true;
    datos = Object.fromEntries(['nombre', 'email', 'tel', 'dir', 'cp', 'pob', 'prov', 'notas'].map(k => [k, f.elements[k].value.trim()]));
    guarda('um-datos', datos);
    ir('pago');
  });

  // ---------- Paso 3: pago ----------
  function pintaPago() {
    const sub = cesta.subtotal(), env = cesta.envio(sub);
    $('#precio-envio').textContent = env ? euros(env) : 'Gratis';
    $('#det-envio').textContent = 'Sale al día siguiente del pago, con enlace de seguimiento';
    $('#dir-envio').innerHTML = `Se envía a: <strong>${esc(datos.nombre || '')}</strong>, ${esc(datos.dir || '')}, ${esc(datos.cp || '')} ${esc(datos.pob || '')} (${esc(datos.prov || '')}). <button class="btn-quitar" type="button" data-volver2>Cambiar</button>`;
    $('#dir-envio [data-volver2]').addEventListener('click', () => ir('datos'));
    $('#resumen-pago').innerHTML = resumenMini();
    $('#btn-pagar').innerHTML = `Pagar ${euros(sub + env)} ${ico('candado')}`;
  }
  $('#form-pago').addEventListener('submit', e => {
    e.preventDefault();
    const err = $('#error-pago');
    if (!$('#acepto').checked) { err.hidden = false; err.textContent = 'Para terminar, acepta las condiciones de compra.'; $('#acepto').focus(); return; }
    err.hidden = true;
    const it = cesta.items(), sub = cesta.subtotal(), env = cesta.envio(sub);
    const metodo = { tarjeta: 'tarjeta', bizum: 'Bizum', paypal: 'PayPal' }[e.target.elements.pago.value];
    const n = (lee('um-npedido', 1040) + 1); guarda('um-npedido', n);
    const num = `UM-${new Date().getFullYear()}-${String(n).padStart(5, '0')}`;
    $('#ok-num').innerHTML = `Número de pedido: <strong>${num}</strong>`;
    $('#ok-texto').innerHTML = `Gracias, ${esc(datos.nombre.split(' ')[0])}. Te hemos enviado la confirmación a <strong>${esc(datos.email)}</strong>. Pagado con ${metodo}; mañana sale tu paquete hacia ${esc(datos.pob)}.`;
    $('#ok-resumen').innerHTML = `<ul class="mini" style="display:grid;gap:10px;margin-bottom:12px">${it.map(i => { const p = porId.get(i.id); return `<li style="display:grid;grid-template-columns:46px 1fr auto;gap:10px;align-items:center;font-size:13.5px"><img src="img/p/${p.id}-1-s.webp" alt="" width="46" height="46" style="border:1px solid var(--linea)"><span>${i.q} × ${esc(p.n)}</span><strong>${euros(p.p * i.q)}</strong></li>`; }).join('')}</ul><div class="totales"><div><span>Envío</span><span>${env ? euros(env) : 'Gratis'}</span></div><div class="total"><span>Total pagado</span><span>${euros(sub + env)}</span></div></div>`;
    cesta.vaciar();
    ir('ok');
  });

  ir(['datos', 'pago'].includes(location.hash.slice(1)) ? location.hash.slice(1) : 'cesta', 'inicio');
})();
