// MS Diseño Textil · interacción de la portada
(() => {
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const quieto = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Barra superior: mensajes que rotan
  const msgs = $$('.topbar-msg span');
  let im = 0;
  if (!quieto && msgs.length > 1) setInterval(() => {
    msgs[im].classList.remove('on');
    im = (im + 1) % msgs.length;
    msgs[im].classList.add('on');
  }, 4000);

  // Portada: carrusel con pestañas
  const hero = $('.hero');
  const slides = $$('.slide', hero), tabs = $$('.hero-nav button', hero);
  let is = 0, timer;
  const ir = n => {
    slides[is].classList.remove('on'); tabs[is].classList.remove('on'); tabs[is].setAttribute('aria-selected', 'false');
    is = (n + slides.length) % slides.length;
    slides[is].classList.add('on'); tabs[is].classList.add('on'); tabs[is].setAttribute('aria-selected', 'true');
    const img = $('img', slides[(is + 1) % slides.length]); img.loading = 'eager';
    programar();
  };
  const programar = () => { clearTimeout(timer); if (!quieto && !hero.classList.contains('pausa')) timer = setTimeout(() => ir(is + 1), 6500); };
  tabs.forEach((t, i) => t.addEventListener('click', () => ir(i)));
  hero.addEventListener('mouseenter', () => { hero.classList.add('pausa'); clearTimeout(timer); });
  hero.addEventListener('mouseleave', () => { hero.classList.remove('pausa'); programar(); });
  hero.addEventListener('focusin', () => { hero.classList.add('pausa'); clearTimeout(timer); });
  hero.addEventListener('focusout', () => { hero.classList.remove('pausa'); programar(); });
  programar();

  // Menú móvil
  const menu = $('#menu'), velo = $('#velo'), abrir = $('#abrirMenu');
  const cerrarMenu = () => { menu.classList.remove('open'); velo.hidden = true; abrir.setAttribute('aria-expanded', 'false'); document.body.style.overflow = ''; };
  abrir.addEventListener('click', () => { menu.classList.add('open'); velo.hidden = false; abrir.setAttribute('aria-expanded', 'true'); document.body.style.overflow = 'hidden'; $('#cerrarMenu').focus(); });
  $('#cerrarMenu').addEventListener('click', () => { cerrarMenu(); abrir.focus(); });
  velo.addEventListener('click', cerrarMenu);
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && menu.classList.contains('open')) { cerrarMenu(); abrir.focus(); } });
  $$('a', menu).forEach(a => a.addEventListener('click', cerrarMenu));

  // Tienda: pestañas de categoría
  const rail = $('#rail'), cards = $$('.card', rail), ttabs = $$('.tabs button'), info = $('#searchInfo'), q = $('#q');
  const filtrar = tab => {
    ttabs.forEach(b => { const on = b.dataset.tab === tab; b.classList.toggle('on', on); b.setAttribute('aria-selected', on); });
    cards.forEach(c => c.hidden = !c.dataset.tabs.split(' ').includes(tab));
    info.hidden = true; q.value = '';
    rail.scrollLeft = 0;
  };
  ttabs.forEach(b => b.addEventListener('click', () => filtrar(b.dataset.tab)));
  filtrar('top');
  $$('[data-go]').forEach(a => a.addEventListener('click', () => filtrar(a.dataset.go)));

  // Buscador: filtra la tienda por nombre
  const norm = s => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const buscar = () => {
    const t = norm(q.value.trim());
    if (!t) return filtrar('top');
    let n = 0;
    cards.forEach(c => { const ok = norm(c.dataset.name).includes(t) || norm(c.dataset.tabs).includes(t); c.hidden = !ok; if (ok) n++; });
    ttabs.forEach(b => { b.classList.remove('on'); b.setAttribute('aria-selected', 'false'); });
    info.hidden = false;
    info.textContent = n ? `${n} ${n === 1 ? 'prenda' : 'prendas'} para «${q.value.trim()}»` : `No tenemos «${q.value.trim()}» en la tienda, pero pregúntanos por WhatsApp: personalizamos casi cualquier textil.`;
    rail.scrollLeft = 0;
  };
  $('#buscador').addEventListener('submit', e => { e.preventDefault(); buscar(); $('#tienda').scrollIntoView({ behavior: quieto ? 'auto' : 'smooth' }); });
  q.addEventListener('input', () => { if (q.value.trim().length > 1 || !q.value) buscar(); });

  // Flechas de los raíles
  $$('.arrow').forEach(b => b.addEventListener('click', () => {
    const r = b.dataset.rail ? document.getElementById(b.dataset.rail) : rail;
    r.scrollBy({ left: r.clientWidth * 0.8 * +b.dataset.dir, behavior: quieto ? 'auto' : 'smooth' });
  }));

  // Formulario de oferta → WhatsApp
  $('#formOferta').addEventListener('submit', e => {
    e.preventDefault();
    const f = e.target, v = n => f.elements[n].value.trim();
    const err = $('#fErr');
    if (!v('nombre')) { err.hidden = false; f.elements.nombre.focus(); return; }
    err.hidden = true;
    const txt = [`Hola, soy ${v('nombre')}${v('empresa') ? ` (${v('empresa')})` : ''}.`, `Quiero oferta de: ${v('prenda')}${v('cantidad') ? `, unas ${v('cantidad')} unidades` : ''}.`, v('idea') ? `Idea: ${v('idea')}` : ''].filter(Boolean).join('\n');
    window.open(`https://wa.me/${window.MS_WA}?text=${encodeURIComponent(txt)}`, '_blank', 'noopener');
  });
})();
