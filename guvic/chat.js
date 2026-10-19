// Asistente de taller GUVIC: chat con IA (worker guvic-ia), fotos, tarjetas de servicio y parte de taller → WhatsApp
(() => {
  const API = 'https://guvic-ia.josugarciandia.workers.dev/api/chat';
  const N = window.NEGOCIO, { esc, ico, servId, precioServ } = window.GUVIC;
  const $ = (s, r = document) => r.querySelector(s);
  const CLAVE = 'guvic-chat-v1';
  const INICIO = ['Me chirrían los frenos', 'El cambio salta', 'Tengo un pinchazo', 'Quiero una revisión', 'Recogida a domicilio', 'Mi patinete no frena'];
  const ETIQ = { vehiculo: 'Vehículo', problema: 'Avería', fotos: 'Fotos', entrega: 'Entrega', nombre: 'Nombre', telefono: 'Teléfono', direccion: 'Dirección', cuando: 'Cuándo' };

  let st = { msgs: [], parte: {}, vistas: [] };
  try { st = JSON.parse(sessionStorage.getItem(CLAVE)) || st; } catch (e) {}
  // las fotos no se guardan en la sesión (pesan): se quedan solo en pantalla
  const guardar = () => { try { sessionStorage.setItem(CLAVE, JSON.stringify({ ...st, msgs: st.msgs.map(({ fotos, ...x }) => x) })); } catch (e) {} };
  let pendientes = [], ocupado = false;

  // ---------- DOM ----------
  const chat = document.createElement('div');
  chat.className = 'chat'; chat.setAttribute('role', 'region'); chat.setAttribute('aria-label', 'Asistente de taller GUVIC');
  chat.innerHTML = `
    <div class="chat-cab"><span class="avatar"><img src="img/logo-gv-blanco.png" alt=""></span><div><b>Asistente del taller GUVIC</b><small>Responde al momento · también con fotos</small></div>
      <button class="cerrar" type="button" aria-label="Cerrar el asistente">${ico('x')}</button></div>
    <div class="chat-cuerpo" aria-live="polite"></div>
    <div class="chips" aria-label="Respuestas rápidas"></div>
    <div class="previas"></div>
    <form class="chat-pie">
      <input type="file" accept="image/*" multiple hidden>
      <button class="ico-btn adjuntar" type="button" aria-label="Adjuntar foto de la bici">${ico('camara')}</button>
      <label class="solo-lector" for="chat-txt">Escribe tu mensaje</label>
      <textarea id="chat-txt" rows="1" placeholder="Escribe qué le pasa…"></textarea>
      <button class="ico-btn enviar" type="submit" aria-label="Enviar">${ico('enviar')}</button>
    </form>
    <div class="chat-nota">Precio orientativo con la tarifa del taller · el mecánico lo confirma</div>`;
  const cuerpo = $('.chat-cuerpo', chat), chipsEl = $('.chips', chat), previas = $('.previas', chat);
  const txt = $('textarea', chat), form = $('form', chat), file = $('input[type=file]', chat), btnEnv = $('.enviar', chat);

  const huecoSec = $('#hueco-chat-sec');
  document.body.insertAdjacentHTML('beforeend', `
    <button class="lanzador" type="button" aria-label="Abrir el asistente de taller"><span class="bola">${ico('chat')}</span>¿Qué le pasa a tu bici?</button>
    <div class="capa-chat flotante" role="dialog" aria-modal="true" aria-label="Asistente de taller"><div class="fondo"></div><div class="hueco"></div></div>`);
  const lanz = $('.lanzador'), capa = $('.capa-chat'), hueco = $('.hueco', capa);
  if (huecoSec) huecoSec.appendChild(chat); else hueco.appendChild(chat);

  function abrirFlotante() {
    hueco.appendChild(chat); capa.classList.add('abierto'); document.body.style.overflow = 'hidden'; lanz.hidden = true;
    setTimeout(() => { bajar(); if (matchMedia('(pointer:fine)').matches) txt.focus(); }, 30);
  }
  function cerrarFlotante() {
    capa.classList.remove('abierto'); document.body.style.overflow = '';
    if (huecoSec) huecoSec.appendChild(chat);
    lanz.hidden = enVista; lanz.focus();
  }
  $('.cerrar', chat).addEventListener('click', cerrarFlotante);
  $('.fondo', capa).addEventListener('click', cerrarFlotante);
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && capa.classList.contains('abierto')) cerrarFlotante(); });
  lanz.addEventListener('click', abrirFlotante);
  // En la portada el botón flotante se esconde mientras se ve la sección del asistente
  // (y también mientras se ve el hero, que ya tiene su propio botón)
  let enVista = false; const vistos = new Map();
  const mirar = el => el && new IntersectionObserver(es => { vistos.set(el, es[0].isIntersecting); enVista = [...vistos.values()].some(Boolean); if (!capa.classList.contains('abierto')) lanz.hidden = enVista; }, { threshold: .25 }).observe(el);
  if (huecoSec) { mirar(huecoSec); mirar(document.querySelector('.heroe')); }

  document.addEventListener('click', e => {
    const b = e.target.closest('[data-abrir-chat]'); if (!b) return;
    e.preventDefault();
    if (huecoSec && innerWidth > 960) { document.getElementById('asistente').scrollIntoView({ behavior: 'smooth' }); setTimeout(() => txt.focus({ preventScroll: true }), 500); }
    else abrirFlotante();
    if (b.dataset.msg) setTimeout(() => enviar(b.dataset.msg), 350);
  });

  // ---------- Pintar ----------
  const bajar = () => { cuerpo.scrollTop = cuerpo.scrollHeight; };
  const html = t => esc(t).replace(/\n/g, '<br>');
  function burbuja(m) {
    const d = document.createElement('div');
    d.className = 'msg ' + (m.role === 'user' ? 'yo' : 'bot');
    d.innerHTML = (m.fotos?.length ? `<div class="fotos-msg">${m.fotos.map(f => `<img src="${f}" alt="Foto enviada">`).join('')}</div>` : '') + html(m.content);
    cuerpo.appendChild(d);
    if (m.servicios?.length) {
      const t = document.createElement('div'); t.className = 'tarjetas-serv';
      t.innerHTML = m.servicios.map(id => servId[id]).filter(Boolean).map(s => `<div class="t-serv"><b>${esc(s.n)}</b><small>${s.dep === 'bici' ? 'Bici' : 'Patinete'} · ${esc(s.cat)}${s.min ? ' · ~' + s.min + ' min' : ''}</small><span class="precio">${precioServ(s)}</span></div>`).join('');
      cuerpo.appendChild(t);
    }
  }
  function textoParte() {
    const p = st.parte, serv = (st.ultServ || []).map(id => servId[id]).filter(Boolean);
    return `Hola GUVIC, os paso un parte desde el asistente de la web:\n` +
      `• Vehículo: ${p.vehiculo || '-'}\n• Avería: ${p.problema || '-'}${p.urgente ? ' (URGENTE)' : ''}\n` +
      (serv.length ? `• Orientativo: ${serv.map(s => `${s.n} ${precioServ(s)}`).join(', ')} + piezas\n` : '') +
      (p.fotos ? `• Fotos: ${p.fotos} (os las adjunto aquí)\n` : '') +
      `• ${p.entrega === 'recogida' ? 'Recogida en: ' + (p.direccion || '-') : 'La llevo al taller'}${p.cuando ? ' · ' + p.cuando : ''}\n` +
      `• ${p.nombre || ''} ${p.telefono ? '· ' + p.telefono : ''}`;
  }
  function pintarParte(listo) {
    cuerpo.querySelector('.parte')?.remove();
    const p = st.parte; if (!p || !p.problema) return;
    const filas = Object.keys(ETIQ).filter(k => p[k]).map(k => `<dt>${ETIQ[k]}</dt><dd>${esc(k === 'entrega' ? (p[k] === 'recogida' ? 'Recogida a domicilio' : 'La trae al taller') : p[k])}</dd>`).join('');
    const faltan = ['vehiculo', 'entrega', 'nombre', 'telefono'].filter(k => !p[k]).map(k => ETIQ[k].toLowerCase());
    const d = document.createElement('div'); d.className = 'parte';
    d.innerHTML = `<h5><span>Parte de taller</span><span>${listo ? 'Listo para enviar' : 'En curso'}</span></h5><dl>${filas}</dl>` +
      (listo ? `<a class="btn btn-cian" target="_blank" rel="noopener" href="https://wa.me/${N.wa}?text=${encodeURIComponent(textoParte())}">${ico('wa')}Enviar al taller</a>` : faltan.length ? `<p style="margin:10px 0 0;font-size:12.5px;color:#9aa3ad">Falta: ${faltan.join(', ')}</p>` : '');
    cuerpo.appendChild(d);
  }
  function pintarChips(lista) {
    chipsEl.innerHTML = (lista || []).map(c => `<button class="chip" type="button">${esc(c)}</button>`).join('');
    chipsEl.hidden = !(lista || []).length;
  }
  function pintarTodo() {
    cuerpo.innerHTML = '';
    burbuja({ role: 'assistant', content: 'Hola, soy el asistente del taller GUVIC. Cuéntame qué le pasa a tu bici o patinete y te digo qué necesita y cuánto cuesta.' });
    burbuja({ role: 'assistant', content: 'Si quieres, mándame una foto con el botón de la cámara. Luego la traes al taller de Puçol o pasamos a recogerla.' });
    st.msgs.forEach(burbuja);
    pintarParte(st.listo);
    pintarChips(st.msgs.length ? st.chips : INICIO);
    bajar();
  }
  chipsEl.addEventListener('click', e => { const c = e.target.closest('.chip'); if (c) enviar(c.textContent); });

  // ---------- Fotos: se reducen a 1024 px en el navegador ----------
  const reducir = f => new Promise((ok, no) => {
    const url = URL.createObjectURL(f), img = new Image();
    img.onload = () => { const k = Math.min(1, 1024 / Math.max(img.width, img.height)); const c = document.createElement('canvas'); c.width = Math.round(img.width * k); c.height = Math.round(img.height * k); c.getContext('2d').drawImage(img, 0, 0, c.width, c.height); URL.revokeObjectURL(url); ok(c.toDataURL('image/jpeg', .8)); };
    img.onerror = no; img.src = url;
  });
  const pintarPrevias = () => { previas.innerHTML = pendientes.map((f, i) => `<span class="previa"><img src="${f}" alt="Foto ${i + 1} lista para enviar"><button type="button" data-quitar="${i}" aria-label="Quitar foto ${i + 1}">×</button></span>`).join(''); };
  $('.adjuntar', chat).addEventListener('click', () => file.click());
  file.addEventListener('change', async () => {
    for (const f of [...file.files].slice(0, 3 - pendientes.length)) { try { pendientes.push(await reducir(f)); } catch (e) {} }
    file.value = ''; pintarPrevias(); txt.focus();
  });
  previas.addEventListener('click', e => { const b = e.target.closest('[data-quitar]'); if (b) { pendientes.splice(+b.dataset.quitar, 1); pintarPrevias(); } });

  // ---------- Plan B sin IA (si el servicio no responde) ----------
  const REGLAS = [
    [/fren|pastill|zapat|chirr/i, ['s51', 's49', 's55'], 'Por lo que cuentas, toca revisar los frenos: el ajuste son 10 € y el cambio de pastillas 9 € más las pastillas si hacen falta.'],
    [/cambio|salta|marcha|desviador|patilla/i, ['s22', 's27'], 'Suena a cambio desajustado o patilla tocada: el ajuste son 10 € y la patilla 13 €.'],
    [/pinch|c[áa]mara|cubierta|rueda/i, ['s33', 's36'], 'Un pinchazo lo dejamos listo por 9 € (cámara o cubierta aparte si hay que cambiarla).'],
    [/revis|mantenim|puesta a punto/i, ['s5', 's6'], 'Tenemos el Mantenimiento Básico por 30 € y el Mantenimiento GUVIC completo por 80 €.'],
    [/cadena/i, ['s26'], 'El cambio de cadena son 13 € de mano de obra, más la cadena.'],
    [/patin/i, ['s65', 's68'], 'Para patinetes, el ajuste de frenos son 14 € y la puesta a punto 25 €.'],
  ];
  function planB(t) {
    const r = REGLAS.find(([re]) => re.test(t));
    return { reply: (r ? r[2] + ' ' : 'Te lo miramos en el diagnóstico gratis del taller. ') + `Ahora mismo el asistente va lento: si quieres, escríbenos por WhatsApp al ${N.tel} y te contestamos enseguida.`, servicios: r ? r[1] : ['s1'], chips: ['La llevo al taller', 'Recogida a domicilio'], parte: st.parte, listo: false };
  }

  // ---------- Enviar ----------
  async function enviar(texto) {
    texto = (texto || '').trim();
    if (ocupado || (!texto && !pendientes.length)) return;
    if (!texto) texto = pendientes.length > 1 ? 'Te mando unas fotos' : 'Te mando una foto';
    const fotos = pendientes; pendientes = []; pintarPrevias();
    const m = { role: 'user', content: texto, fotos };
    st.msgs.push(m); burbuja(m); pintarChips([]); txt.value = ''; ajustar();
    cuerpo.querySelector('.parte') && cuerpo.appendChild(cuerpo.querySelector('.parte'));
    const esc_ = document.createElement('div'); esc_.className = 'msg bot escribiendo'; esc_.setAttribute('aria-label', 'Escribiendo'); esc_.innerHTML = '<i></i><i></i><i></i>';
    cuerpo.appendChild(esc_); bajar();
    ocupado = true; btnEnv.disabled = true;
    let r;
    try {
      const res = await fetch(API, { method: 'POST', headers: { 'content-type': 'application/json' }, signal: AbortSignal.timeout(30000),
        body: JSON.stringify({ messages: st.msgs.map(x => ({ role: x.role, content: x.content })), parte: st.parte, fotos }) });
      r = await res.json();
      if (!r.reply || r.engine === 'fallback') throw new Error(r.error || 'sin respuesta');
    } catch (e) { r = planB(texto); }
    esc_.remove(); ocupado = false; btnEnv.disabled = false;
    const b = { role: 'assistant', content: r.reply, servicios: r.servicios || [] };
    st.msgs.push(b); if (b.servicios.length) st.ultServ = b.servicios;
    st.parte = r.parte || st.parte; st.chips = r.chips || []; st.listo = !!r.listo;
    guardar();
    burbuja(b); pintarParte(st.listo); pintarChips(st.chips); bajar();
  }
  form.addEventListener('submit', e => { e.preventDefault(); enviar(txt.value); });
  const ajustar = () => { txt.style.height = 'auto'; txt.style.height = Math.min(txt.scrollHeight, 110) + 'px'; };
  txt.addEventListener('input', ajustar);
  txt.addEventListener('keydown', e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); enviar(txt.value); } });

  pintarTodo();
  window.GUVIC.chat = { enviar, reiniciar: () => { st = { msgs: [], parte: {} }; sessionStorage.removeItem(CLAVE); pintarTodo(); } };
})();
