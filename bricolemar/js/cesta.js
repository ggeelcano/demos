/* Cesta, tramitación del pedido y favoritos */
(async () => {
  const { $, $$, esc, eur, url, tarjeta, catalogo, cesta, totales, barraEnvio, lineaHTML, ICO } = BM;
  const pagina = document.body.dataset.pagina;

  if (pagina === 'cesta') {
    const raiz = $('#cesta');
    const pintar = () => {
      const c = cesta(), t = totales(c);
      if (!c.length) { raiz.innerHTML = `<div class="vacio"><h2>Tu cesta está vacía</h2><p>Busca lo que necesitas entre más de 4.000 productos de ferretería y bricolaje.</p><a class="btn" href="${url('categoria.html')}">Ir a la tienda</a></div>`; return; }
      raiz.innerHTML = `<div class="pagina-cesta"><div>${barraEnvio(t)}${c.map(lineaHTML).join('')}</div>
        <aside class="resumen" aria-label="Resumen del pedido"><h2 style="font-size:20px;margin:0">Resumen</h2>
          <div class="totales"><div><span>Productos (${t.uds})</span><b>${eur(t.sub)}</b></div><div><span>Envío a domicilio</span><span>${t.envio ? eur(t.envio) : 'Gratis'}</span></div><div class="total"><span>Total <small>IVA incl.</small></span><span>${eur(t.total)}</span></div></div>
          <p style="margin:0;font-size:13px;color:var(--gris)">Envíos solo a península. La recogida en Valverde del Majano (Segovia) es gratis.</p>
          <a class="btn" href="${url('pedido.html')}">Tramitar pedido</a><a class="btn btn-sec" href="${url('categoria.html')}">Seguir comprando</a>
          <img src="${BM.RAIZ}img/pago-seguro.webp" alt="Formas de pago: Visa, Mastercard, American Express, Maestro, Bizum" loading="lazy" width="520" height="164"></aside></div>`;
    };
    document.addEventListener('cesta', pintar); pintar();
  }

  if (pagina === 'favoritos') {
    const raiz = $('#favoritos');
    const pintar = async () => {
      const { porId } = await catalogo();
      const l = BM.favs().map(id => porId[id]).filter(Boolean);
      raiz.innerHTML = l.length ? `<p class="total" style="color:var(--gris)">${l.length} ${l.length === 1 ? 'producto guardado' : 'productos guardados'}</p><div class="rejilla">${l.map(tarjeta).join('')}</div>` : `<div class="vacio"><h2>Todavía no has guardado nada</h2><p>Pulsa el corazón de cualquier producto para tenerlo a mano.</p><a class="btn" href="${url('categoria.html')}">Ir a la tienda</a></div>`;
    };
    document.addEventListener('click', e => { if (e.target.closest('[data-fav]')) setTimeout(pintar, 50); });
    pintar();
  }

  if (pagina === 'pedido') {
    const raiz = $('#pedido');
    const datos = BM.leer('bm-datos', {});
    let paso = 1;
    const recogida = () => datos.envio === 'recogida';
    const resumen = () => {
      const c = cesta(), t = totales(c, recogida());
      return `<aside class="resumen" aria-label="Tu pedido"><h2 style="font-size:20px;margin:0">Tu pedido</h2>
        <div style="max-height:320px;overflow:auto">${c.map(l => `<div style="display:flex;gap:10px;padding:8px 0;border-bottom:1px solid var(--borde);font-size:14px"><img src="${BM.fotoP(l, 128)}" alt="" width="48" height="48" style="width:48px;height:48px;object-fit:contain;border:1px solid var(--borde);border-radius:4px"><span style="flex:1">${l.n} × ${esc(l.nombre)}</span><b style="white-space:nowrap">${eur(l.precio * l.n)}</b></div>`).join('')}</div>
        <div class="totales"><div><span>Productos</span><b>${eur(t.sub)}</b></div><div><span>${recogida() ? 'Recogida en almacén' : 'Envío'}</span><span>${t.envio ? eur(t.envio) : 'Gratis'}</span></div><div class="total"><span>Total <small>IVA incl.</small></span><span>${eur(t.total)}</span></div></div>
        <a class="enlace" href="${url('cesta.html')}" style="font-size:14px">Modificar la cesta</a></aside>`;
    };
    const pasos = () => `<ol class="pasos"><li ${paso === 1 ? 'aria-current="step"' : ''}><b>1</b>Datos y envío</li><li ${paso === 2 ? 'aria-current="step"' : ''}><b>2</b>Pago</li><li ${paso === 3 ? 'aria-current="step"' : ''}><b>3</b>Confirmación</li></ol>`;
    const campo = (id, et, tipo = 'text', extra = '') => `<div class="campo"><label for="${id}">${et}</label><input id="${id}" name="${id}" type="${tipo}" value="${esc(datos[id] || '')}" ${extra}></div>`;
    const pintar = () => {
      const c = cesta();
      if (!c.length && paso < 3) { raiz.innerHTML = `<div class="vacio"><h2>No hay productos en la cesta</h2><a class="btn" href="${url('categoria.html')}">Ir a la tienda</a></div>`; return; }
      const t = totales(c, recogida());
      if (paso === 1) {
        raiz.innerHTML = pasos() + `<div class="pagina-cesta"><form class="form" id="f1" novalidate>
          <h2 style="font-size:20px;margin:0">Tus datos</h2>
          <div class="doble">${campo('nombre', 'Nombre y apellidos *', 'text', 'required autocomplete="name"')}${campo('nif', 'NIF/CIF (si quieres factura)', 'text', 'autocomplete="off"')}</div>
          <div class="doble">${campo('email', 'Correo electrónico *', 'email', 'required autocomplete="email"')}${campo('tel', 'Teléfono *', 'tel', 'required autocomplete="tel"')}</div>
          <h2 style="font-size:20px;margin:10px 0 0">¿Cómo lo quieres recibir?</h2>
          <label class="opcion"><input type="radio" name="envio" value="domicilio" ${!recogida() ? 'checked' : ''}><span><b>Envío a domicilio en 24/48 h</b><small>Solo península. De lunes a viernes; los pedidos hechos antes de las 13:30 salen ese mismo día.</small></span><span class="derecha">${totales(c).sub >= 100 ? 'Gratis' : eur(BM.ENVIO)}</span></label>
          <label class="opcion"><input type="radio" name="envio" value="recogida" ${recogida() ? 'checked' : ''}><span><b>Recogida en nuestro almacén</b><small>Ctra. Segovia-Arévalo km 7, 40140 Valverde del Majano (Segovia). Compra online y ven a buscarlo.</small></span><span class="derecha">Gratis</span></label>
          <div id="dir" class="form" ${recogida() ? 'hidden' : ''}>
            ${campo('direccion', 'Dirección *', 'text', 'autocomplete="street-address"')}
            <div class="doble">${campo('cp', 'Código postal *', 'text', 'inputmode="numeric" autocomplete="postal-code" maxlength="5"')}${campo('ciudad', 'Localidad *', 'text', 'autocomplete="address-level2"')}</div>
            ${campo('provincia', 'Provincia *', 'text', 'autocomplete="address-level1"')}
          </div>
          <div class="campo"><label for="notas">Notas para el pedido</label><textarea id="notas" name="notas">${esc(datos.notas || '')}</textarea></div>
          <p id="err1" role="alert" style="color:var(--rojo);font-weight:600;margin:0"></p>
          <button class="btn">Continuar al pago</button></form>${resumen()}</div>`;
        const f = $('#f1');
        $$('[name=envio]', f).forEach(r => r.onchange = () => { datos.envio = r.value; $('#dir').hidden = recogida(); $('.resumen').outerHTML = resumen(); });
        f.onsubmit = e => {
          e.preventDefault();
          const fd = Object.fromEntries(new FormData(f)); Object.assign(datos, fd); BM.guardar('bm-datos', datos);
          const req = ['nombre', 'email', 'tel'].concat(recogida() ? [] : ['direccion', 'cp', 'ciudad', 'provincia']);
          const falta = req.filter(k => !String(fd[k] || '').trim());
          $$('input', f).forEach(i => i.removeAttribute('aria-invalid'));
          if (falta.length) { falta.forEach(k => $('#' + k).setAttribute('aria-invalid', 'true')); $('#err1').textContent = 'Rellena los campos marcados con *.'; $('#' + falta[0]).focus(); return; }
          if (!/^\S+@\S+\.\S+$/.test(fd.email)) { $('#email').setAttribute('aria-invalid', 'true'); $('#err1').textContent = 'Revisa el correo electrónico.'; $('#email').focus(); return; }
          if (!recogida() && /^(07|35|38|51|52)/.test(fd.cp)) { $('#cp').setAttribute('aria-invalid', 'true'); $('#err1').textContent = 'Ahora mismo solo enviamos a península. Para Baleares, Canarias, Ceuta o Melilla escríbenos por WhatsApp.'; $('#cp').focus(); return; }
          paso = 2; pintar(); scrollTo({ top: 0 });
        };
      } else if (paso === 2) {
        raiz.innerHTML = pasos() + `<div class="pagina-cesta"><form class="form" id="f2"><h2 style="font-size:20px;margin:0">Forma de pago</h2>
          <label class="opcion"><input type="radio" name="pago" value="tarjeta" checked><span><b>Tarjeta de crédito o débito</b><small>Visa, Mastercard, American Express, Maestro. Pago seguro con tu banco.</small></span></label>
          <label class="opcion"><input type="radio" name="pago" value="bizum"><span><b>Bizum</b><small>Paga desde el móvil al momento.</small></span></label>
          <label class="opcion"><input type="radio" name="pago" value="paypal"><span><b>PayPal</b><small>Con tu cuenta PayPal.</small></span></label>
          <label style="display:flex;gap:10px;font-size:14px;align-items:flex-start"><input type="checkbox" required style="width:18px;height:18px;accent-color:var(--rojo);margin-top:2px"> <span>He leído y acepto las <a class="enlace" href="${url('condiciones.html')}" target="_blank">condiciones de venta</a> y la <a class="enlace" href="${url('privacidad.html')}" target="_blank">política de privacidad</a>.</span></label>
          <div style="display:flex;gap:10px;flex-wrap:wrap"><button type="button" class="btn btn-sec" id="atras">Volver</button><button class="btn" style="flex:1">Pagar ${eur(t.total)}</button></div>
          <p style="font-size:13px;color:var(--gris);margin:0">Esto es una demostración: no se cobra nada ni se envía ningún pedido.</p></form>${resumen()}</div>`;
        $('#atras').onclick = () => { paso = 1; pintar(); };
        $('#f2').onsubmit = e => { e.preventDefault(); datos.pago = new FormData(e.target).get('pago'); datos.total = t.total; datos.num = 'BM' + String(Date.now()).slice(-7); BM.guardar('bm-datos', datos); BM.guardar('bm-cesta', []); paso = 3; pintar(); scrollTo({ top: 0 }); };
      } else {
        raiz.innerHTML = pasos() + `<div class="vacio" style="max-width:640px;margin:0 auto;text-align:center"><div style="width:72px;height:72px;border-radius:50%;background:#e5f3e8;color:var(--verde);display:grid;place-items:center;margin:0 auto 14px">${ICO('ok')}</div>
          <h2>¡Gracias, ${esc((datos.nombre || '').split(' ')[0])}! Pedido ${esc(datos.num)} recibido</h2>
          <p>${recogida() ? 'Te avisaremos cuando puedas pasar a recogerlo por Valverde del Majano.' : 'Lo preparamos para que salga en 24/48 h.'} La confirmación llegará a <b>${esc(datos.email)}</b>.</p>
          <p style="font-size:14px">Esto es una demostración: no se ha cobrado nada ni se ha enviado ningún correo. En la tienda real aquí se cobrarían ${eur(datos.total || 0)} con ${({ tarjeta: 'tarjeta', bizum: 'Bizum', paypal: 'PayPal' })[datos.pago] || 'tarjeta'}.</p>
          <a class="btn" href="${url('index.html')}">Volver a la tienda</a></div>`;
        document.dispatchEvent(new CustomEvent('cesta'));
      }
    };
    pintar();
  }
})();
