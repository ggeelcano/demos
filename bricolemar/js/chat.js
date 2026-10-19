/* Bricolemar — asistente de la tienda (chat flotante). Habla con el worker bricolemar-ia; si no responde, contesta en local. */
(() => {
  const API = 'https://bricolemar-ia.josugarciandia.workers.dev/api/chat';
  const CLAVE = 'bm-chat-v1';
  const { $, esc, eur, url, fotoP, textoEntrega, esLento, catalogo, buscar, anadir, aviso, leer, guardar, WHATSAPP } = BM;
  const movil = () => matchMedia('(max-width: 600px)').matches;

  const SALUDO = [
    'Hola, soy el asistente de Bricolemar. Cuéntame qué necesitas o para qué trabajo es y te busco el material en la tienda.',
    'También te resuelvo dudas de envíos, recogida en Valverde del Majano, pagos y devoluciones.',
  ];
  const CHIPS = ['Busco una escalera para casa', 'Quiero colgar una estantería', 'Silicona para el baño', '¿Cuánto cuesta el envío?', '¿Puedo recogerlo en Valverde?', '¿Cómo devuelvo un producto?'];

  /* ---------- estado (se conserva al cambiar de página) ---------- */
  let estado = { h: [], a: false };
  try { const s = JSON.parse(sessionStorage.getItem(CLAVE)); if (s && Array.isArray(s.h)) estado = s; } catch (e) {}
  const persistir = () => { try { sessionStorage.setItem(CLAVE, JSON.stringify({ h: estado.h.slice(-30), a: estado.a })); } catch (e) {} };

  /* ---------- DOM ---------- */
  const ICO_CHAT = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 12c0 4.1-4 7.5-9 7.5-1.4 0-2.8-.3-4-.8L3 20l1.4-3.6C3.5 15.1 3 13.6 3 12c0-4.1 4-7.5 9-7.5s9 3.4 9 7.5z"/><path d="M8 12h.01M12 12h.01M16 12h.01"/></svg>';
  const ICO_WA = '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M17.5 14.4c-.3-.1-1.8-.9-2-1-.3-.1-.5-.1-.7.1-.2.3-.8 1-.9 1.2-.2.2-.3.2-.6.1-.3-.1-1.3-.5-2.4-1.5-.9-.8-1.5-1.8-1.7-2.1-.2-.3 0-.5.1-.6l.5-.6c.1-.2.2-.3.3-.5.1-.2 0-.4 0-.5-.1-.1-.7-1.6-.9-2.2-.2-.6-.5-.5-.7-.5h-.6c-.2 0-.5.1-.8.4-.3.3-1 1-1 2.5s1.1 2.9 1.2 3.1c.1.2 2.1 3.2 5.1 4.5.7.3 1.3.5 1.7.6.7.2 1.4.2 1.9.1.6-.1 1.8-.7 2-1.4.2-.7.2-1.3.2-1.4-.1-.1-.3-.2-.6-.3M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2m0 18.2c-1.5 0-3-.4-4.3-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2"/></svg>';
  const raiz = document.createElement('div');
  raiz.className = 'asis';
  raiz.innerHTML = `
    <button class="asis-fab" type="button" aria-haspopup="dialog" aria-expanded="false" aria-controls="asis-panel">${ICO_CHAT}<span class="sr">Abrir el asistente de la tienda</span><span class="asis-punto" aria-hidden="true"></span><span class="asis-tip" aria-hidden="true">¿Buscas algo? Pregúntame</span></button>
    <section class="asis-panel" id="asis-panel" role="dialog" aria-labelledby="asis-tit" hidden>
      <header class="asis-cab">
        <span class="asis-avatar" aria-hidden="true"><img src="${url('img/favicon.ico')}" alt="" width="28" height="28"></span>
        <div class="asis-info"><h2 id="asis-tit">Asistente Bricolemar</h2><p>Te contesto al momento</p></div>
        <button type="button" class="asis-boton" data-asis="reiniciar" aria-label="Empezar una conversación nueva"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 12a9 9 0 1 0 3-6.7"/><path d="M3 4v5h5"/></svg></button>
        <button type="button" class="asis-boton" data-asis="cerrar" aria-label="Cerrar el asistente"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg></button>
      </header>
      <div class="asis-cuerpo" role="log" aria-live="polite" aria-label="Conversación con el asistente"></div>
      <div class="asis-chips" role="group" aria-label="Preguntas frecuentes"></div>
      <form class="asis-form">
        <label class="sr" for="asis-in">Escribe tu pregunta</label>
        <textarea id="asis-in" rows="1" maxlength="600" placeholder="Escribe qué necesitas…" autocomplete="off"></textarea>
        <button type="submit" aria-label="Enviar"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 12l16-8-6 16-2-6-8-2z"/></svg></button>
      </form>
      <div class="asis-pie"><a class="asis-persona" href="https://wa.me/${WHATSAPP}" target="_blank" rel="noopener">${ICO_WA}Hablar con una persona</a><span>Asistente automático</span></div>
    </section>`;
  document.body.appendChild(raiz);
  const fab = $('.asis-fab', raiz), panel = $('.asis-panel', raiz), cuerpo = $('.asis-cuerpo', raiz), chips = $('.asis-chips', raiz);
  const form = $('.asis-form', raiz), inp = $('#asis-in', raiz), persona = $('.asis-persona', raiz);
  chips.innerHTML = CHIPS.map(c => `<button type="button" data-q="${esc(c)}">${esc(c)}</button>`).join('');
  if (leer('bm-chat-visto', 0)) fab.classList.add('visto');

  /* ---------- pintar mensajes ---------- */
  function formatear(t) {
    let h = esc(t);
    h = h.replace(/\[([^\]]+)\]\(([^)\s]*)\)/g, (m, n, destino) => {
      const id = (destino.match(/id=(\d+)/) || destino.match(/(\d{3,})/) || [])[1];
      return id ? `<a href="${url('producto.html', '?id=' + id)}" data-asis-prod>${n}</a>` : n;
    });
    h = h.replace(/\b(694\s?279\s?935)\b/g, `<a href="https://wa.me/${WHATSAPP}" target="_blank" rel="noopener">$1</a>`);
    h = h.replace(/\b([\w.+-]+@bricolemar\.com)\b/g, '<a href="mailto:$1">$1</a>');
    h = h.replace(/(\d) (€|%|h\b)/g, '$1&nbsp;$2');
    return h.split(/\n{2,}/).map(p => `<p>${p.replace(/\n/g, '<br>')}</p>`).join('');
  }
  function tarjeta(p) {
    return `<article class="asis-prod">
      <a href="${url('producto.html', '?id=' + p.id)}" class="asis-prod-img" tabindex="-1" aria-hidden="true" data-asis-prod><img src="${fotoP(p, 128)}" alt="" loading="lazy" width="64" height="64"></a>
      <div class="asis-prod-txt">
        <h3><a href="${url('producto.html', '?id=' + p.id)}" data-asis-prod>${esc(p.nombre)}</a></h3>
        <p class="asis-precio"><b>${eur(p.precio)}</b> <small>IVA incl. · ${eur(p.precio / 1.21)} sin IVA</small></p>
        <p class="asis-disp ${esLento(p) ? 'lento' : 'ok'}">${p.stock ? 'En stock · ' : ''}${textoEntrega(p)}${p.stock ? '' : ' · Recogida: consultar'}</p>
      </div>
      <button type="button" class="asis-anadir" data-asis-anadir="${p.id}">Añadir<span class="sr"> ${esc(p.nombre)} a la cesta</span></button>
    </article>`;
  }
  async function pintar(m, animar) {
    const d = document.createElement('div');
    d.className = 'asis-msg ' + (m.r === 'u' ? 'yo' : 'bot') + (animar ? ' nuevo' : '');
    d.innerHTML = m.r === 'u' ? `<p>${esc(m.t)}</p>` : formatear(m.t);
    cuerpo.appendChild(d);
    if (m.p?.length) {
      const { porId } = await catalogo();
      const ps = m.p.map(id => porId[id]).filter(Boolean);
      if (ps.length) { const c = document.createElement('div'); c.className = 'asis-prods'; c.innerHTML = ps.map(tarjeta).join(''); d.after(c); }
    }
    return d;
  }
  async function pintarTodo() {
    cuerpo.innerHTML = '';
    for (const t of SALUDO) await pintar({ r: 'b', t });
    for (const m of estado.h) await pintar(m);
    chips.hidden = estado.h.some(m => m.r === 'u');
    actualizarPersona();
    cuerpo.scrollTop = cuerpo.scrollHeight;
  }
  function verDesde(el) { cuerpo.scrollTop = Math.max(0, el.offsetTop - 12); }

  // «Hablar con una persona»: abre su WhatsApp con la consulta ya escrita
  function actualizarPersona() {
    const mias = estado.h.filter(m => m.r === 'u').slice(-3).map(m => m.t.replace(/\s+/g, ' ').trim());
    const ids = [...new Set(estado.h.flatMap(m => m.p || []))].slice(-3);
    catalogo().then(({ porId }) => {
      const prods = ids.map(id => porId[id]).filter(Boolean);
      let t = 'Hola, vengo del asistente de la web.';
      if (mias.length) t += '\nMi consulta: ' + mias.join(' / ');
      if (prods.length) t += '\nProductos que he visto: ' + prods.map(p => `${p.nombre} (ref. ${p.ref || p.id})`).join('; ');
      persona.href = `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(t)}`;
    });
  }

  /* ---------- respuestas ---------- */
  function escribiendo() {
    const d = document.createElement('div');
    d.className = 'asis-msg bot';
    d.innerHTML = '<span class="asis-escribe" role="status"><i></i><i></i><i></i><span class="sr">El asistente está escribiendo</span></span>';
    cuerpo.appendChild(d); cuerpo.scrollTop = cuerpo.scrollHeight;
    return d;
  }
  // Si el servidor no responde: preguntas frecuentes y el buscador de la propia web.
  async function respuestaLocal(texto) {
    const n = BM.norm(texto);
    if (/envio|envia|llega|tarda|portes|gastos/.test(n)) return { t: 'El envío cuesta 4,95 € y es gratis a partir de 100 €, solo a península. Llega en 24/48 h en días laborables si pides antes de las 13:30; cada ficha indica su plazo.' };
    if (/recog|horario|abre|abiert|direcci|donde esta/.test(n)) return { t: 'Puedes recoger gratis en Carretera Segovia-Arévalo km 7, Valverde del Majano (Segovia). Horario: lunes a viernes de 9:00 a 14:00 y de 16:00 a 19:00, sábados de 9:00 a 14:00.' };
    if (/devol|devuelv|cambi|garant/.test(n)) return { t: 'Tienes 14 días naturales desde que lo recibes para devolverlo, escribiendo a devoluciones@bricolemar.com. Tiene que volver en perfecto estado y con su caja.' };
    if (/pag|bizum|tarjeta|paypal|transfer|plazos/.test(n)) return { t: 'Puedes pagar con tarjeta, Bizum o PayPal, y también por transferencia, contrarreembolso o a plazos con SeQura.' };
    if (/pedido|seguimiento/.test(n)) return { t: 'Para ver cómo va tu pedido escríbenos por WhatsApp al 694 279 935 con el número de pedido.' };
    const { prods } = await catalogo();
    const r = buscar(prods, texto).slice(0, 3);
    return r.length
      ? { t: 'Esto es lo que he encontrado en la tienda:', p: r.map(p => p.id) }
      : { t: 'Ahora mismo no lo encuentro en la tienda online. Escríbenos por WhatsApp al 694 279 935: en almacén tenemos más de 20.000 referencias.' };
  }
  let ocupado = false;
  async function enviar(texto) {
    texto = String(texto || '').trim();
    if (!texto || ocupado) return;
    ocupado = true; form.classList.add('ocupado');
    inp.value = ''; inp.style.height = '';
    chips.hidden = true;
    const yo = { r: 'u', t: texto.slice(0, 600) };
    estado.h.push(yo); persistir();
    await pintar(yo, true); cuerpo.scrollTop = cuerpo.scrollHeight;
    const esp = escribiendo();
    let resp;
    try {
      const ctl = new AbortController(); const to = setTimeout(() => ctl.abort(), 25000);
      const messages = estado.h.slice(-12).map(m => ({ role: m.r === 'u' ? 'user' : 'assistant', content: m.t }));
      const r = await fetch(API, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ messages }), signal: ctl.signal });
      clearTimeout(to);
      const j = await r.json();
      resp = j.engine === 'fallback' || !j.reply ? await respuestaLocal(texto) : { t: j.reply, p: j.productos || [] };
    } catch (e) { resp = await respuestaLocal(texto); }
    esp.remove();
    const bot = { r: 'b', t: resp.t, p: resp.p || [] };
    estado.h.push(bot); persistir();
    const d = await pintar(bot, true);
    verDesde(d);
    actualizarPersona();
    ocupado = false; form.classList.remove('ocupado');
    if (!movil()) inp.focus();
  }

  /* ---------- abrir y cerrar ---------- */
  function abrir(sinFoco) {
    panel.hidden = false; raiz.classList.add('abierto'); fab.setAttribute('aria-expanded', 'true');
    fab.classList.add('visto'); guardar('bm-chat-visto', 1);
    estado.a = true; persistir();
    if (movil()) document.documentElement.classList.add('asis-bloqueo');
    cuerpo.scrollTop = cuerpo.scrollHeight;
    if (!sinFoco) inp.focus();
  }
  function cerrar() {
    panel.hidden = true; raiz.classList.remove('abierto'); fab.setAttribute('aria-expanded', 'false');
    document.documentElement.classList.remove('asis-bloqueo');
    estado.a = false; persistir();
    fab.focus();
  }
  fab.addEventListener('click', () => (panel.hidden ? abrir() : cerrar()));
  panel.addEventListener('click', async e => {
    const b = e.target.closest('[data-asis]');
    if (b?.dataset.asis === 'cerrar') return cerrar();
    if (b?.dataset.asis === 'reiniciar') { estado.h = []; persistir(); await pintarTodo(); inp.focus(); return; }
    const q = e.target.closest('[data-q]');
    if (q) return enviar(q.dataset.q);
    const a = e.target.closest('[data-asis-anadir]');
    if (a) {
      const { porId } = await catalogo(); const p = porId[+a.dataset.asisAnadir]; if (!p) return;
      anadir(p, 1);
      a.classList.add('hecho'); a.innerHTML = `Añadido<span class="sr"> a la cesta</span>`;
      if (!a.nextElementSibling) a.insertAdjacentHTML('afterend', `<a class="asis-vercesta" href="${url('cesta.html')}">Ver cesta</a>`);
      aviso('Añadido a la cesta');
      return;
    }
    // en el móvil el chat tapa la página: al abrir una ficha se cierra para que se vea
    if (e.target.closest('[data-asis-prod]') && movil()) { estado.a = false; persistir(); }
  });
  form.addEventListener('submit', e => { e.preventDefault(); enviar(inp.value); });
  inp.addEventListener('keydown', e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); enviar(inp.value); } });
  inp.addEventListener('input', () => { inp.style.height = 'auto'; inp.style.height = Math.min(inp.scrollHeight, 110) + 'px'; });
  document.addEventListener('keydown', e => {
    if (panel.hidden) return;
    if (e.key === 'Escape' && $('#capa')?.hidden !== false) { e.preventDefault(); cerrar(); }
    // en el móvil el panel ocupa la pantalla: el foco no sale de él
    if (e.key === 'Tab' && movil()) {
      const f = [...panel.querySelectorAll('button:not([disabled]), a[href], textarea')].filter(x => x.offsetParent);
      if (!f.length) return;
      if (e.shiftKey && document.activeElement === f[0]) { e.preventDefault(); f[f.length - 1].focus(); }
      else if (!e.shiftKey && document.activeElement === f[f.length - 1]) { e.preventDefault(); f[0].focus(); }
    }
  });
  // el aviso de cookies va abajo: el botón se sube mientras se ve
  const ck = $('#cookies');
  const subir = () => raiz.style.setProperty('--asis-sube', ck && !ck.hidden ? ck.offsetHeight + 16 + 'px' : '0px');
  if (ck) { new MutationObserver(subir).observe(ck, { attributes: true, attributeFilter: ['hidden'] }); addEventListener('resize', subir); }

  pintarTodo().then(() => { subir(); if (estado.a) abrir(true); });
})();
