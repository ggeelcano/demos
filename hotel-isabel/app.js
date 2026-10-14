// Hotel Isabel: habitaciones con tarifas reales 2026-2027, carruseles, menú y solicitud de reserva.
(() => {
  const $ = s => document.querySelector(s);
  const $$ = s => [...document.querySelectorAll(s)];
  const EMAIL = 'reservas@hotel-isabel.es';

  // Precio por noche según temporada: m media, f fin de semana, s Semana Santa, a alta, n Navidad (IVA incluido)
  const HABS = [
    { id: 'individual', nombre: 'Individual', cap: 1, camas: '1 cama', img: 'img/hab-individual.webp', alt: 'Habitación individual con cama y escritorio', p: { m: 55, f: 60, s: 62, a: 62, n: 62 } },
    { id: 'doble-1', nombre: 'Doble 1 cama', cap: 2, camas: '1 cama grande', img: 'img/hab-doble.webp', alt: 'Habitación doble con cama grande y sillón verde', p: { m: 65, f: 70, s: 85, a: 85, n: 85 } },
    { id: 'doble-2', nombre: 'Doble 2 camas', cap: 2, camas: '2 camas', img: 'img/hab-doble-2.webp', alt: 'Habitación doble con dos camas', p: { m: 65, f: 70, s: 85, a: 85, n: 85 } },
    { id: 'triple', nombre: 'Triple', cap: 3, camas: '2 camas', img: 'img/hab-triple.webp', alt: 'Habitación triple abuhardillada con ventana al techo', p: { m: 85, f: 85, s: 95, a: 95, n: 95 } },
    { id: 'cuadruple', nombre: 'Cuádruple', cap: 4, camas: '2 camas', img: 'img/hab-cuadruple.webp', alt: 'Habitación cuádruple con dos camas grandes', p: { m: 95, f: 95, s: 105, a: 105, n: 105 } },
  ];
  const NOMBRE_TEMP = { m: 'Media', f: 'Fin de semana', s: 'Semana Santa', a: 'Temporada alta', n: 'Navidad' };

  const iso = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const deIso = s => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
  const eur = n => n.toLocaleString('es-ES', { minimumFractionDigits: 0, maximumFractionDigits: 2 }) + ' €';
  const fCorta = d => d.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' });

  function temporada(d) {
    const md = (d.getMonth() + 1) * 100 + d.getDate(), y = d.getFullYear();
    if (md >= 1222 || md <= 107) return 'n';
    if (y === 2026 && md >= 401 && md <= 405) return 's';
    if (md >= 701 && md <= (y === 2026 ? 830 : 831)) return 'a';
    if (d.getDay() === 6 || d.getDay() === 0) return 'f';
    return 'm';
  }
  const conTarifa = d => d.getFullYear() >= 2026 && d.getFullYear() <= 2027;

  function estancia(h, ent, sal) {
    const noches = [];
    for (let d = new Date(ent); d < sal; d.setDate(d.getDate() + 1)) {
      const t = temporada(d);
      noches.push({ fecha: new Date(d), t, precio: conTarifa(d) ? h.p[t] : null });
    }
    const sinTarifa = noches.some(n => n.precio == null);
    return { noches, total: sinTarifa ? null : noches.reduce((a, n) => a + n.precio, 0) };
  }

  // Estado de la búsqueda
  const fEnt = $('#f-entrada'), fSal = $('#f-salida'), fHue = $('#f-huespedes');
  const hoy = new Date(); hoy.setHours(0, 0, 0, 0);
  fEnt.min = iso(hoy);
  fSal.min = iso(new Date(hoy.getTime() + 864e5));
  let busqueda = null;

  fEnt.addEventListener('change', () => {
    if (!fEnt.value) return;
    const e = deIso(fEnt.value), m = new Date(e); m.setDate(m.getDate() + 1);
    fSal.min = iso(m);
    if (!fSal.value || deIso(fSal.value) <= e) fSal.value = iso(m);
  });

  // Tarjetas de habitación
  const pista = $('#pista-habs');
  pista.innerHTML = HABS.map(h => `
    <article class="hab" data-cap="${h.cap}" data-id="${h.id}">
      <div class="hab-foto"><img src="${h.img}" alt="${h.alt}" width="1000" height="750" loading="lazy"></div>
      <h3>${h.nombre}</h3>
      <p class="hab-cap"><svg aria-hidden="true"><use href="#i-user"/></svg>${h.cap} ${h.cap > 1 ? 'personas' : 'persona'} · ${h.camas}</p>
      <p class="hab-precio" aria-live="polite">desde <strong>${eur(h.p.m)}</strong> / noche</p>
      <button class="btn btn-osc" data-reservar="${h.id}">Reservar</button>
    </article>`).join('');

  function pintarPrecios() {
    HABS.forEach(h => {
      const el = pista.querySelector(`[data-id="${h.id}"] .hab-precio`);
      if (!busqueda) { el.innerHTML = `desde <strong>${eur(h.p.m)}</strong> / noche`; return; }
      const { noches, total } = estancia(h, busqueda.ent, busqueda.sal);
      el.innerHTML = total == null
        ? 'Para estas fechas, <strong>consúltanos</strong>'
        : `<strong>${eur(total)}</strong> por ${noches.length} ${noches.length > 1 ? 'noches' : 'noche'}`;
    });
  }

  function filtrar(cap) {
    $$('.chip').forEach(c => { const on = +c.dataset.cap === cap; c.classList.toggle('on', on); c.setAttribute('aria-pressed', on); });
    $$('.hab').forEach(el => { el.hidden = cap > 0 && +el.dataset.cap !== cap; });
    pista.scrollTo({ left: 0 });
  }
  $$('.chip').forEach(c => c.addEventListener('click', () => filtrar(+c.dataset.cap)));

  $('#reserva').addEventListener('submit', e => {
    e.preventDefault();
    if (!fEnt.value || !fSal.value) return;
    const ent = deIso(fEnt.value), sal = deIso(fSal.value);
    if (sal <= ent) { fSal.focus(); return; }
    busqueda = { ent, sal, pax: +fHue.value };
    const n = Math.round((sal - ent) / 864e5);
    const aviso = $('#habs-aviso');
    aviso.textContent = `${fCorta(ent)} → ${fCorta(sal)} · ${n} ${n > 1 ? 'noches' : 'noche'} · ${busqueda.pax} ${busqueda.pax > 1 ? 'adultos' : 'adulto'}. Precio total con IVA:`;
    aviso.classList.add('ok');
    pintarPrecios();
    filtrar(busqueda.pax);
    $('#habitaciones').scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
  });

  // Modal de reserva
  const modal = $('#modal');
  let actual = null;
  function totalModal() {
    if (!actual) return;
    const { h, est } = actual, n = est.noches.length;
    let t = est.total;
    if ($('#x-desayuno').checked) t += 6 * busqueda.pax * n;
    if ($('#x-parking').checked) t += 3 * n;
    if ($('#x-mascota').checked) t += 6;
    $('#m-total').textContent = (est.total == null ? 'A consultar' : eur(t)) + ($('#x-mascota').checked && est.total != null ? '*' : '');
  }
  ['#x-desayuno', '#x-parking', '#x-mascota'].forEach(s => $(s).addEventListener('change', totalModal));

  pista.addEventListener('click', e => {
    const b = e.target.closest('[data-reservar]'); if (!b) return;
    const h = HABS.find(x => x.id === b.dataset.reservar);
    if (!busqueda) {
      $('#reserva').scrollIntoView({ behavior: 'smooth', block: 'center' });
      setTimeout(() => fEnt.focus(), 450);
      const aviso = $('#habs-aviso'); aviso.textContent = 'Primero elige las fechas de entrada y salida.'; aviso.classList.add('ok');
      return;
    }
    const est = estancia(h, busqueda.ent, busqueda.sal);
    actual = { h, est };
    $('#m-img').src = h.img; $('#m-img').alt = h.alt;
    $('#m-tit').textContent = h.nombre;
    const n = est.noches.length;
    $('#m-fechas').textContent = `${fCorta(busqueda.ent)} → ${fCorta(busqueda.sal)} · ${n} ${n > 1 ? 'noches' : 'noche'} · ${busqueda.pax} ${busqueda.pax > 1 ? 'adultos' : 'adulto'}`;
    $('#m-noches').innerHTML = est.noches.map(x => `<li><span>${fCorta(x.fecha)} · ${NOMBRE_TEMP[x.t]}</span><span>${x.precio == null ? 'consultar' : eur(x.precio)}</span></li>`).join('');
    ['#x-desayuno', '#x-parking', '#x-mascota'].forEach(s => { $(s).checked = false; });
    totalModal();
    $('#m-form').hidden = false;
    modal.showModal();
  });

  $('#m-form').addEventListener('submit', e => {
    e.preventDefault();
    const f = new FormData(e.target), { h, est } = actual;
    const extras = [$('#x-desayuno').checked && 'Desayuno especial', $('#x-parking').checked && 'Parking', $('#x-mascota').checked && 'Viajo con mascota'].filter(Boolean);
    const cuerpo = [
      `Hola, quiero reservar en el Hotel Isabel:`, ``,
      `Habitación: ${h.nombre}`,
      `Entrada: ${busqueda.ent.toLocaleDateString('es-ES')}`,
      `Salida: ${busqueda.sal.toLocaleDateString('es-ES')} (${est.noches.length} noches)`,
      `Huéspedes: ${busqueda.pax}`,
      `Extras: ${extras.length ? extras.join(', ') : 'ninguno'}`,
      `Total según la web: ${$('#m-total').textContent}`, ``,
      `Nombre: ${f.get('nombre')}`, `Teléfono: ${f.get('tel')}`, `Email: ${f.get('email')}`,
    ].join('\n');
    location.href = `mailto:${EMAIL}?subject=${encodeURIComponent(`Reserva ${h.nombre} · ${busqueda.ent.toLocaleDateString('es-ES')}`)}&body=${encodeURIComponent(cuerpo)}`;
  });
  modal.addEventListener('click', e => { if (e.target === modal) modal.close(); });

  // Carruseles
  $$('[data-pasar]').forEach(b => b.addEventListener('click', () => {
    const p = document.getElementById(b.dataset.pasar);
    const paso = p.id === 'hero' ? p.clientWidth : (p.firstElementChild?.getBoundingClientRect().width || 300) + 20;
    const fin = p.scrollLeft + p.clientWidth >= p.scrollWidth - 4;
    if (+b.dataset.dir > 0 && fin && p.id === 'hero') p.scrollTo({ left: 0, behavior: 'smooth' });
    else if (+b.dataset.dir < 0 && p.scrollLeft < 4 && p.id === 'hero') p.scrollTo({ left: p.scrollWidth, behavior: 'smooth' });
    else p.scrollBy({ left: paso * +b.dataset.dir, behavior: 'smooth' });
  }));
  const hero = $('#hero'), puntos = $('#hero-puntos');
  puntos.innerHTML = [...hero.children].map(() => '<span></span>').join('');
  const marcar = () => { const i = Math.round(hero.scrollLeft / hero.clientWidth); [...puntos.children].forEach((s, k) => s.classList.toggle('on', k === i)); };
  hero.addEventListener('scroll', () => requestAnimationFrame(marcar), { passive: true });
  marcar();

  // Menú lateral
  const menu = $('#menu'), abrir = $('#abrir-menu');
  const cerrarMenu = () => { menu.hidden = true; abrir.setAttribute('aria-expanded', 'false'); abrir.focus(); };
  abrir.addEventListener('click', () => { menu.hidden = false; abrir.setAttribute('aria-expanded', 'true'); $('#cerrar-menu').focus(); });
  $('#cerrar-menu').addEventListener('click', cerrarMenu);
  menu.addEventListener('click', e => { if (e.target === menu || e.target.closest('nav a')) cerrarMenu(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && !menu.hidden) cerrarMenu(); });

  // Cabecera con línea al bajar
  const cab = $('.cab');
  addEventListener('scroll', () => cab.classList.toggle('con-sombra', scrollY > 10), { passive: true });

  // Mapa al pulsar (no carga Google hasta que se pide)
  $('#ver-mapa').addEventListener('click', () => {
    $('#mapa').innerHTML = '<iframe title="Mapa: Hotel Isabel en Briviesca" loading="lazy" referrerpolicy="no-referrer-when-downgrade" src="https://maps.google.com/maps?q=Hotel%20Isabel%2C%20Calle%20Santa%20Mar%C3%ADa%20Encimera%2021%2C%2009240%20Briviesca&z=16&output=embed"></iframe>';
  });
})();
