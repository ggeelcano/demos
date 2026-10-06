/* Urbanmoto · ficha de producto */
(() => {
  'use strict';
  const { D, $, $$, esc, ico, euros, porId, ruta, catProfunda, motoInfo, miMoto, tarjeta, etiqueta, carruseles, waLink, cesta, reducido } = window.UM;
  const id = +new URLSearchParams(location.search).get('id');
  const p = porId.get(id);
  const ficha = $('#ficha');

  if (!p) {
    ficha.innerHTML = `<div class="vacio"><h1 style="font-size:22px;margin-bottom:10px">No encontramos este recambio</h1><p>Puede que ya no esté a la venta.</p><p><a class="btn btn-naranja" href="tienda.html">Ver todos los recambios ${ico('flecha-der')}</a></p></div>`;
    return;
  }

  const c = catProfunda(p), r = c ? ruta(c.id) : [];
  document.title = `${p.n} · Urbanmoto`;
  const meta = document.querySelector('meta[name="description"]');
  meta && meta.setAttribute('content', `${p.n} por ${euros(p.p)} con envío en 24/48 h. Recambios para scooter, pit bike y minimoto en Urbanmoto.`);
  $('#migas').innerHTML = `<li><a href="index.html">Inicio</a></li>` + r.map(x => `<li><a href="tienda.html?c=${x.id}">${esc(x.n)}</a></li>`).join('') + `<li aria-current="page">${esc(p.n)}</li>`;

  const fotos = Array.from({ length: p.i }, (_, i) => `img/p/${p.id}-${i + 1}.webp`);
  const textoWa = `Hola, ¿el recambio «${p.n}» (ref. web ${p.id}) le vale a mi moto? Marca: , modelo: , año: `;

  function cajaCompat() {
    const m = miMoto();
    const indicados = p.m.filter(k => !k.startsWith('m')).map(k => motoInfo.get(k)).filter(Boolean);
    const motores = p.m.filter(k => k.startsWith('m')).map(k => motoInfo.get(k)).filter(Boolean);
    const lista = [...motores.map(x => x.full), ...indicados.map(x => x.full)];
    const cambiar = `<button type="button" data-abrir-moto>${m ? 'Cambiar de moto' : 'Seleccionar mi moto'}</button>`;
    const pregunta = `<a class="enlace" href="${waLink(textoWa)}" target="_blank" rel="noopener">Pregúntanos por WhatsApp</a>`;
    if (m && p.m.includes(m.k)) return `<div class="caja-compat si"><strong>${ico('check')} Indicado para tu ${esc(m.full)}</strong><span>Lo indica la ficha del producto. Si quieres, te lo confirmamos antes de enviarlo.</span><div class="acciones">${pregunta}${cambiar}</div></div>`;
    if (m && p.u) return `<div class="caja-compat neutra"><strong>${ico('info')} Pieza universal</strong><span>No es específica de ninguna moto. Revisa las medidas de la descripción o pregúntanos si le vale a tu ${esc(m.full)}.</span><div class="acciones">${pregunta}${cambiar}</div></div>`;
    if (m) return `<div class="caja-compat no"><strong>${ico('info')} En la ficha no aparece tu ${esc(m.full)}</strong><span>No quiere decir que no le valga: mándanos marca, modelo y año y te lo decimos antes de comprar.</span><div class="acciones">${pregunta}${cambiar}</div></div>`;
    if (lista.length) return `<div class="caja-compat neutra"><strong>${ico('moto')} Indicado para: ${esc(lista.slice(0, 6).join(', '))}${lista.length > 6 ? '…' : ''}</strong><span>Elige tu moto y te marcamos si le vale.</span><div class="acciones">${cambiar}${pregunta}</div></div>`;
    if (p.u) return `<div class="caja-compat neutra"><strong>${ico('info')} Pieza universal</strong><span>Revisa las medidas en la descripción. ¿Dudas? ${pregunta}.</span></div>`;
    return `<div class="caja-compat neutra"><strong>${ico('moto')} ¿Le vale a tu moto?</strong><span>Mándanos marca, modelo y año y te lo confirmamos antes de comprar.</span><div class="acciones">${pregunta}</div></div>`;
  }
  const stockTexto = p.s <= 0 ? `<p class="stock-linea sin">Sin stock ahora mismo</p>`
    : p.s <= 2 ? `<p class="stock-linea pocas">${ico('info')} ¡Últimas unidades! ${p.s === 1 ? 'Solo queda 1' : 'Quedan ' + p.s}</p>`
    : `<p class="stock-linea ok">${ico('check')} En stock: ${p.s} unidades. Sale al día siguiente del pago</p>`;
  let cantidad = 1;
  const enCesta = () => cesta.cantidad(p.id);
  const compra = () => {
    if (p.s <= 0) return `<div class="compra-fila"><a class="btn btn-naranja" href="${waLink('Hola, ¿os volverá a entrar «' + p.n + '»?')}" target="_blank" rel="noopener">${ico('whatsapp')} Avísame cuando vuelva</a></div>`;
    const max = Math.max(0, p.s - enCesta());
    if (!max) return `<div class="compra-fila"><a class="btn btn-negro" href="cesta.html">Ya tienes todas las unidades en tu cesta ${ico('flecha-der')}</a></div>`;
    cantidad = Math.min(cantidad, max);
    return `<div class="compra-fila" data-local>
      <div class="cantidad cantidad-grande" role="group" aria-label="Cantidad">
        <button type="button" id="c-menos" aria-label="Una unidad menos" ${cantidad <= 1 ? 'disabled' : ''}>${ico('menos')}</button>
        <output id="c-num" aria-live="polite">${cantidad}</output>
        <button type="button" id="c-mas" aria-label="Una unidad más" ${cantidad >= max ? 'disabled' : ''}>${ico('mas')}</button>
      </div>
      <button class="btn btn-naranja" type="button" id="btn-anadir" data-anadir="${p.id}" data-cantidad="${cantidad}">Añadir a mi cesta ${ico('flecha-der')}</button>
    </div>${enCesta() ? `<p style="font-size:13px;margin-top:8px">Ya tienes ${enCesta()} en tu <a class="enlace" href="cesta.html">cesta</a>.</p>` : ''}`;
  };

  ficha.innerHTML = `<div class="ficha-prod">
    <div class="galeria">
      <div class="galeria-mini" role="group" aria-label="Fotos del producto">${fotos.map((f, i) => `<button type="button" data-foto="${i}" aria-label="Ver foto ${i + 1} de ${fotos.length}" ${i === 0 ? 'aria-current="true"' : ''}><img src="${f}" alt="" width="640" height="640" loading="lazy"></button>`).join('')}</div>
      <div class="galeria-grande">
        ${etiqueta(p).includes('vacia') ? '' : etiqueta(p)}
        <div class="galeria-pista" id="galeria-pista" tabindex="0" aria-label="Fotos de ${esc(p.n)}">${fotos.map((f, i) => `<img src="${f}" alt="${esc(p.n)}, foto ${i + 1} de ${fotos.length}" width="640" height="640" ${i ? 'loading="lazy"' : 'fetchpriority="high"'}>`).join('')}</div>
        <div class="galeria-puntos" aria-hidden="true">${fotos.map((_, i) => `<span${i ? '' : ' class="activo"'}></span>`).join('')}</div>
      </div>
    </div>
    <div class="info-prod">
      ${c ? `<a class="cat-sup" href="tienda.html?c=${c.id}">${esc(c.n)}</a>` : ''}
      <h1>${esc(p.n)}</h1>
      <p class="ref">Ref. web: ${p.id}${p.u ? ' · Pieza universal' : ''}</p>
      <p class="precio-grande">${euros(p.p)} <small>IVA incluido</small></p>
      ${stockTexto}
      <div id="compra">${compra()}</div>
      <div id="compat">${cajaCompat()}</div>
      <ul class="puntos-prod">
        <li>${ico('camion')}<span><strong>Envío en 24/48 h.</strong> ${cesta.subtotal() + p.p >= window.UM.GRATIS ? 'Este pedido ya tiene el envío gratis.' : 'Gratis en pedidos desde ' + window.UM.GRATIS + ' €.'}</span></li>
        <li>${ico('devolucion')}<span><strong>Devolución en 15 días</strong> si no es lo que esperabas.</span></li>
        <li>${ico('candado')}<span><strong>Pago seguro</strong> con tarjeta, Bizum o PayPal.</span></li>
      </ul>
    </div>
  </div>
  <div class="bloque-desc">
    <section aria-labelledby="t-desc"><h2 id="t-desc">Descripción</h2><div class="desc-texto" id="desc-texto"><p>Cargando la descripción…</p></div></section>
    <aside class="caja-duda" aria-labelledby="t-duda"><h2 id="t-duda">¿Dudas con este recambio?</h2><p>Mándanos la marca, el modelo y el año de tu moto y te decimos si le vale antes de que lo compres. Respondemos por WhatsApp.</p><a class="btn btn-naranja" href="${waLink(textoWa)}" target="_blank" rel="noopener">${ico('whatsapp')} Preguntar por WhatsApp</a></aside>
  </div>`;

  // Galería
  const pista = $('#galeria-pista'), minis = $$('[data-foto]'), puntos = $$('.galeria-puntos span');
  const marca = i => { minis.forEach((b, j) => b.setAttribute('aria-current', String(i === j))); puntos.forEach((s, j) => s.classList.toggle('activo', i === j)); };
  minis.forEach(b => b.addEventListener('click', () => { const i = +b.dataset.foto; pista.scrollTo({ left: pista.clientWidth * i, behavior: reducido ? 'auto' : 'smooth' }); marca(i); }));
  pista.addEventListener('scroll', () => { const i = Math.round(pista.scrollLeft / pista.clientWidth); marca(i); }, { passive: true });
  pista.addEventListener('keydown', e => {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
    e.preventDefault(); const i = Math.round(pista.scrollLeft / pista.clientWidth) + (e.key === 'ArrowRight' ? 1 : -1);
    pista.scrollTo({ left: pista.clientWidth * Math.max(0, Math.min(fotos.length - 1, i)), behavior: reducido ? 'auto' : 'smooth' });
  });

  // Cantidad
  function enganchaCompra() {
    const menos = $('#c-menos'), mas = $('#c-mas'), num = $('#c-num'), btn = $('#btn-anadir');
    if (!btn) return;
    const max = Math.max(1, p.s - enCesta());
    const pon = n => { cantidad = Math.max(1, Math.min(max, n)); num.textContent = cantidad; btn.dataset.cantidad = cantidad; menos.disabled = cantidad <= 1; mas.disabled = cantidad >= max; };
    menos.addEventListener('click', () => { pon(cantidad - 1); (menos.disabled ? mas : menos).focus(); });
    mas.addEventListener('click', () => { pon(cantidad + 1); (mas.disabled ? menos : mas).focus(); });
  }
  enganchaCompra();
  document.addEventListener('um:cesta', () => { cantidad = 1; $('#compra').innerHTML = compra(); enganchaCompra(); pintaBarra(); });
  document.addEventListener('um:moto', () => { $('#compat').innerHTML = cajaCompat(); });

  // Descripción (de su ficha en urbanmoto.es)
  fetch(`datos/p/${p.id}.json`).then(r => r.json()).then(d => {
    const caja = $('#desc-texto');
    if (!d.d.length) { caja.innerHTML = '<p>Sin descripción. Pregúntanos cualquier detalle por WhatsApp.</p>'; return; }
    caja.innerHTML = d.d.map(l => `<p>${esc(l)}</p>`).join('');
    if (d.d.length > 12 || d.d.join(' ').length > 900) {
      caja.classList.add('recortada');
      caja.insertAdjacentHTML('afterend', `<button class="btn btn-borde btn-mas-desc" type="button" aria-expanded="false" aria-controls="desc-texto">Ver toda la descripción ${ico('mas')}</button>`);
      const b = caja.nextElementSibling;
      b.addEventListener('click', () => { const abre = caja.classList.toggle('recortada'); b.setAttribute('aria-expanded', String(!abre)); b.firstChild.textContent = abre ? 'Ver toda la descripción ' : 'Ver menos '; });
    }
  }).catch(() => { $('#desc-texto').innerHTML = '<p>No se ha podido cargar la descripción.</p>'; });

  // Relacionados: misma subcategoría y, si faltan, misma familia
  const familia = r[0] ? r[0].id : null;
  const mismos = D.prods.filter(x => x.id !== p.id && x.s > 0 && c && x.c.includes(c.id));
  const fam = D.prods.filter(x => x.id !== p.id && x.s > 0 && familia && x.c.includes(familia) && !mismos.includes(x));
  const rel = [...mismos, ...fam].slice(0, 12);
  if (rel.length) { $('#car-rel').innerHTML = rel.map(tarjeta).join(''); $('#relacionados').hidden = false; carruseles(); }

  // Barra fija de compra en móvil
  const barra = $('#barra-fija');
  function pintaBarra() {
    if (p.s <= 0 || p.s - enCesta() <= 0) { barra.innerHTML = ''; barra.classList.remove('visible'); return; }
    barra.innerHTML = `<span class="bf-precio">${euros(p.p)}</span><button class="btn btn-naranja" type="button" data-anadir="${p.id}" data-cantidad="1">Añadir a mi cesta ${ico('flecha-der')}</button>`;
  }
  pintaBarra();
  // visible solo cuando el botón principal de compra ya ha quedado por encima de la pantalla
  const vigila = $('#compra');
  let pendiente = false;
  const revisa = () => { pendiente = false; barra.classList.toggle('visible', !!barra.innerHTML && vigila.getBoundingClientRect().bottom < 0); };
  addEventListener('scroll', () => { if (!pendiente) { pendiente = true; requestAnimationFrame(revisa); } }, { passive: true });
  document.addEventListener('um:cesta', revisa);
  revisa();
})();
