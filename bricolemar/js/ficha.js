/* Ficha de producto */
(async () => {
  const { $, $$, esc, eur, url, img, imgMarca, tarjeta, catalogo, categorias, precioHTML, estrellas, ICO, ODOO } = BM;
  const raiz = $('#ficha');
  const id = +new URLSearchParams(location.search).get('id');
  const [{ porId, prods }, k] = await Promise.all([catalogo(), categorias()]);
  const p = porId[id];
  if (!p) { raiz.innerHTML = `<div class="vacio"><h1>Producto no encontrado</h1><p>Puede que ya no esté a la venta.</p><a class="btn" href="${url('categoria.html')}">Ir a la tienda</a></div>`; return; }
  let d = {};
  try { d = (await fetch(BM.RAIZ + 'data/f/' + (id % 100) + '.json').then(r => r.json()))[id] || {}; } catch (e) {}
  document.title = `${p.nombre} | Bricolemar`;
  const mejor = [...p.cats].map(c => k.ruta(c)).filter(r => r.length).sort((a, b) => b.length - a.length)[0] || [];
  let lista = d.fotos && d.fotos.length ? d.fotos : ['/web/image/product.template/' + id];
  if (p.foto) lista = lista.filter(f => f.includes('product.image'));
  const fotos = lista.map(f => ODOO + f);
  const grande = f => f + '/image_1024', peq = f => f + '/image_128';
  const entrega = d.entrega && p.entrega !== 3 && p.entrega ? d.entrega.replace(/Recíbe /, 'Recíbelo ').replace(/dias/g, 'días') : 'Envío a domicilio en <strong>24/48 h</strong> (península).';
  const specs = (d.specs || []).filter(s => s[1]);
  const fav = BM.esFav(id);

  raiz.innerHTML = `
  <nav aria-label="Ruta"><ol class="miga"><li><a href="${url('index.html')}">Inicio</a></li>${mejor.map(r => `<li><a href="${url('categoria.html', '?c=' + r.id)}">${esc(r.n)}</a></li>`).join('')}<li aria-current="page">${esc(p.nombre)}</li></ol></nav>
  <div class="ficha">
    <div class="galeria ${fotos.length < 2 ? 'una' : ''}">
      <div class="miniaturas" role="group" aria-label="Fotos del producto">${fotos.map((f, i) => `<button type="button" data-foto="${i}" aria-current="${i === 0}" aria-label="Ver foto ${i + 1}"><img src="${peq(f)}" alt="" loading="lazy"></button>`).join('')}</div>
      <button type="button" class="foto-principal" aria-label="Ampliar foto"><img id="foto-grande" src="${grande(fotos[0])}" alt="${esc(p.nombre)}" width="1024" height="1024"></button>
    </div>
    <div class="ficha-info">
      <h1>${esc(p.nombre)}</h1>
      <div class="ficha-ref">${p.ref ? `<span>Ref. ${esc(p.ref)}</span>` : ''}${p.resenas ? `<a href="#pest-op" data-ir-op style="color:inherit">${estrellas(p)}</a>` : ''}</div>
      ${p.marcaId ? `<a class="ficha-marca" href="${url('categoria.html', '?marca=' + p.marcaId)}"><img src="${imgMarca(p.marcaId)}" alt="" loading="lazy">Ver más de ${esc(p.marca)}</a>` : ''}
      ${d.corta ? `<div class="ficha-corta">${d.corta}</div>` : ''}
      <div class="caja-compra">
        ${precioHTML(p)}
        <ul class="disp">
          <li class="${BM.esLento(p) ? 'lento' : 'ok'}"><span>${entrega}</span></li>
          ${p.stock ? '<li class="ok"><span><b>Disponible en almacén.</b> Recogida gratis en Valverde del Majano (Segovia).</span></li>' : '<li><span>Recogida en almacén: <a class="enlace" href="https://wa.me/34694279935?text=' + encodeURIComponent('Hola, ¿tenéis en almacén ' + p.nombre + (p.ref ? ' (ref. ' + p.ref + ')' : '') + '?') + '" target="_blank" rel="noopener">pregúntanos por WhatsApp</a></span></li>'}
          <li class="ok"><span>Envío gratis en pedidos de más de 100 € (península)</span></li>
        </ul>
        <div class="comprar">
          <div class="cantidad"><button type="button" id="menos" aria-label="Quitar una unidad">−</button><label class="sr" for="cant">Cantidad</label><input id="cant" type="number" min="1" max="999" value="1"><button type="button" id="mas" aria-label="Añadir una unidad">+</button></div>
          <button type="button" class="btn-anadir" id="anadir">${ICO('cesta')} Añadir a la cesta</button>
          <a class="btn btn-oscuro" id="comprar-ya" href="${url('pedido.html')}">Comprar ahora</a>
        </div>
        <div class="ficha-acciones">
          <button type="button" id="fav" aria-pressed="${fav}">${ICO('corazon')} <span>${fav ? 'Guardado en favoritos' : 'Añadir a favoritos'}</span></button>
          <button type="button" id="compartir">${ICO('compartir')} Compartir</button>
          <a class="enlace" style="padding:6px 0;font-size:14px" href="https://wa.me/34694279935?text=${encodeURIComponent('Hola, tengo una duda sobre ' + p.nombre + (p.ref ? ' (ref. ' + p.ref + ')' : ''))}" target="_blank" rel="noopener">¿Dudas? Pregúntanos por WhatsApp</a>
        </div>
      </div>
      <div class="ventajas">
        <div class="ventaja">${ICO('camion')}<div><b>Envío 24/48 h</b>4,95 € · gratis desde 100 €</div></div>
        <div class="ventaja">${ICO('devolucion')}<div><b>Devoluciones 30 días</b>Sin complicaciones</div></div>
        <div class="ventaja">${ICO('candado')}<div><b>Pago seguro</b>Tarjeta, Bizum o PayPal</div></div>
        <div class="ventaja">${ICO('almacen')}<div><b>Recogida gratis</b>Valverde del Majano (Segovia)</div></div>
      </div>
      <img class="pagos-ficha" src="${BM.RAIZ}img/pago-seguro.webp" alt="Formas de pago: Visa, Mastercard, American Express, Maestro, Bizum" loading="lazy" width="520" height="164">
    </div>
  </div>
  <div class="pestanas">
    <div role="tablist" aria-label="Información del producto">
      <button role="tab" id="t-desc" aria-controls="pest-desc" aria-selected="true">Descripción</button>
      ${specs.length ? '<button role="tab" id="t-esp" aria-controls="pest-esp" aria-selected="false" tabindex="-1">Especificaciones</button>' : ''}
      <button role="tab" id="t-op" aria-controls="pest-op" aria-selected="false" tabindex="-1">Opiniones${p.resenas ? ` (${p.resenas})` : ''}</button>
    </div>
    <div role="tabpanel" id="pest-desc" aria-labelledby="t-desc"><div class="descripcion">${d.desc || d.corta || '<p>Este producto no tiene descripción ampliada. Si necesitas más información, escríbenos por WhatsApp al +34 694 279 935.</p>'}</div>
      ${p.marcaId && d.marcaTxt ? `<div class="marca-info"><img src="${imgMarca(p.marcaId)}" alt="${esc(p.marca)}" loading="lazy"><div><b>${esc(p.marca)}</b><p>${esc(d.marcaTxt)}</p><a class="enlace" href="${url('categoria.html', '?marca=' + p.marcaId)}">Ver todos los productos ${esc(p.marca)}</a></div></div>` : ''}
    </div>
    ${specs.length ? `<div role="tabpanel" id="pest-esp" aria-labelledby="t-esp" hidden><table class="tabla"><tbody>${(p.ref ? [['Referencia', p.ref]] : []).concat(specs).map(s => `<tr><th scope="row">${esc(s[0])}</th><td>${esc(s[1])}</td></tr>`).join('')}</tbody></table></div>` : ''}
    <div role="tabpanel" id="pest-op" aria-labelledby="t-op" hidden>${p.resenas ? `<div class="resumen-opiniones"><span class="nota">${p.nota.toLocaleString('es-ES', { maximumFractionDigits: 1 })}</span><div>${estrellas(p, false)}<div>${p.resenas} ${p.resenas === 1 ? 'opinión' : 'opiniones'} de clientes</div></div></div>` : '<p>Todavía no hay opiniones de este producto.</p>'}</div>
  </div>
  <section class="seccion" id="relacionados" hidden></section>
  <div class="visor" id="visor" hidden role="dialog" aria-modal="true" aria-label="Foto ampliada"><button type="button" class="cerrar" aria-label="Cerrar">${ICO('cerrar')}</button>${fotos.length > 1 ? `<button type="button" class="ant" aria-label="Foto anterior">${ICO('izq')}</button><button type="button" class="sig" aria-label="Foto siguiente">${ICO('dcha')}</button>` : ''}<img alt="${esc(p.nombre)}"></div>`;

  // galería
  let actual = 0;
  const verFoto = i => { actual = (i + fotos.length) % fotos.length; $('#foto-grande').src = grande(fotos[actual]); $$('[data-foto]').forEach(b => b.setAttribute('aria-current', +b.dataset.foto === actual)); $('#visor img').src = grande(fotos[actual]); };
  $$('[data-foto]').forEach(b => b.onclick = () => verFoto(+b.dataset.foto));
  const visor = $('#visor');
  $('.foto-principal').onclick = () => { $('#visor img').src = grande(fotos[actual]); visor.hidden = false; $('.cerrar', visor).focus(); };
  $('.cerrar', visor).onclick = () => visor.hidden = true;
  visor.onclick = e => { if (e.target === visor) visor.hidden = true; };
  if (fotos.length > 1) { $('.ant', visor).onclick = () => verFoto(actual - 1); $('.sig', visor).onclick = () => verFoto(actual + 1); }
  document.addEventListener('keydown', e => { if (visor.hidden) return; if (e.key === 'Escape') visor.hidden = true; if (e.key === 'ArrowLeft' && fotos.length > 1) verFoto(actual - 1); if (e.key === 'ArrowRight' && fotos.length > 1) verFoto(actual + 1); });
  // cantidad y compra
  const cant = $('#cant'), n = () => Math.max(1, Math.min(999, parseInt(cant.value) || 1));
  $('#menos').onclick = () => cant.value = Math.max(1, n() - 1);
  $('#mas').onclick = () => cant.value = Math.min(999, n() + 1);
  $('#anadir').onclick = () => { BM.anadir(p, n()); BM.abrirCesta(); };
  $('#comprar-ya').onclick = () => BM.anadir(p, n());
  $('#fav').onclick = e => { const on = BM.alternarFav(id); const b = e.currentTarget; b.setAttribute('aria-pressed', on); $('span', b).textContent = on ? 'Guardado en favoritos' : 'Añadir a favoritos'; };
  $('#compartir').onclick = async () => { const u = location.href; if (navigator.share) { try { await navigator.share({ title: p.nombre, url: u }); } catch (e) {} } else { try { await navigator.clipboard.writeText(u); BM.aviso('Enlace copiado'); } catch (e) { prompt('Copia el enlace:', u); } } };
  // pestañas
  const tabs = $$('[role=tab]');
  const elegir = t => { tabs.forEach(x => { const on = x === t; x.setAttribute('aria-selected', on); x.tabIndex = on ? 0 : -1; $('#' + x.getAttribute('aria-controls')).hidden = !on; }); };
  tabs.forEach((t, i) => { t.onclick = () => elegir(t); t.onkeydown = e => { if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') { const s = tabs[(i + (e.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length]; elegir(s); s.focus(); } }; });
  $$('[data-ir-op]').forEach(a => a.onclick = e => { e.preventDefault(); elegir($('#t-op')); $('.pestanas').scrollIntoView({ behavior: 'smooth' }); });
  // relacionados: los que ha elegido la tienda y, si faltan, de la misma categoría
  let rel = [...(d.acc || []), ...(d.rel || [])].map(x => porId[x]).filter(x => x && x.id !== id);
  rel = [...new Map(rel.map(x => [x.id, x])).values()];
  if (rel.length < 8 && mejor.length) { const c = mejor[mejor.length - 1].id; rel = rel.concat(prods.filter(x => x.id !== id && x.todas.has(c) && !rel.includes(x)).sort((a, b) => b.stock - a.stock || b.resenas - a.resenas).slice(0, 12 - rel.length)); }
  if (rel.length) {
    const s = $('#relacionados'); s.hidden = false;
    s.innerHTML = `<div class="seccion-cab"><div><h2>También te puede interesar</h2></div><div class="carrusel-flechas"><button type="button" aria-label="Anteriores">${ICO('izq')}</button><button type="button" aria-label="Siguientes">${ICO('dcha')}</button></div></div><div class="carrusel"><div class="carrusel-pista">${rel.slice(0, 12).map(tarjeta).join('')}</div></div>`;
    BM.carrusel($('.carrusel', s));
  }
})();
