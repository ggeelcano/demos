// En Manos de Nara · interacción mínima: menú, órbita de fotos, apariciones, bono regalo, mapa y newsletter
(function () {
  document.documentElement.classList.add('js');
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var TREATWELL = 'https://www.treatwell.es/establecimiento/centro-de-bienestar-holistico-en-manos-de-nara/';

  // Menú móvil
  var cab = $('#cab'), btn = $('#btnMenu'), menu = $('#menuMovil');
  function cerrarMenu() { cab.classList.remove('abierta'); btn.setAttribute('aria-expanded', 'false'); btn.setAttribute('aria-label', 'Abrir menú'); menu.hidden = true; document.body.style.overflow = ''; }
  btn.addEventListener('click', function () {
    var abrir = menu.hidden;
    if (!abrir) return cerrarMenu();
    cab.classList.add('abierta'); btn.setAttribute('aria-expanded', 'true'); btn.setAttribute('aria-label', 'Cerrar menú'); menu.hidden = false; document.body.style.overflow = 'hidden';
  });
  menu.addEventListener('click', function (e) { if (e.target.closest('a')) cerrarMenu(); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !menu.hidden) { cerrarMenu(); btn.focus(); } });

  // Órbita de fotos
  var SLIDES = [
    { img: 'img/rincon.webp', alt: 'Camilla preparada con una toalla en forma de cisne y velas encendidas', tit: 'Tu rincón en Soria', cta: 'Reservar', href: TREATWELL, ext: true },
    { img: 'img/marien-cascada.webp', alt: 'Marién García con las manos juntas en la sala del centro', tit: 'Conoce a Marién', cta: 'Su historia', href: '#nara' },
    { img: 'img/masaje-velas.webp', alt: 'Masaje en el rostro de un cliente con velas al fondo', tit: 'Regala bienestar', cta: 'Regalar', href: '#regala' }
  ];
  var i = 0, img = $('#orbImg'), tit = $('#orbTit'), cta = $('#orbBtn'), izq = $('.orb-izq img'), der = $('.orb-der img'), vivo = $('#orbVivo');
  SLIDES.forEach(function (s) { var p = new Image(); p.src = s.img; });
  function pinta(n) {
    i = (n + SLIDES.length) % SLIDES.length;
    var s = SLIDES[i];
    img.style.opacity = 0;
    setTimeout(function () {
      img.src = s.img; img.alt = s.alt; img.style.opacity = 1;
      tit.textContent = s.tit; cta.textContent = s.cta; cta.href = s.href;
      if (s.ext) { cta.target = '_blank'; cta.rel = 'noopener'; } else { cta.removeAttribute('target'); cta.removeAttribute('rel'); }
      izq.src = SLIDES[(i - 1 + SLIDES.length) % SLIDES.length].img;
      der.src = SLIDES[(i + 1) % SLIDES.length].img;
      vivo.textContent = s.tit + ', ' + (i + 1) + ' de ' + SLIDES.length;
    }, 220);
  }
  $('.orb-prev').addEventListener('click', function () { pinta(i - 1); });
  $('.orb-next').addEventListener('click', function () { pinta(i + 1); });

  // Apariciones al hacer scroll
  var rv = document.querySelectorAll('.tit-naranja, .cat, .naranja-txt, .naranja-frase, .metodo-t, .metodo-grande, .carta-c, .post, .ficha, .postal, .billete');
  rv.forEach(function (el) { el.classList.add('rv'); });
  var puntos = $('#puntos');
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('on'); io.unobserve(e.target); } });
    }, { rootMargin: '0px 0px -8% 0px' });
    rv.forEach(function (el) { io.observe(el); });
    io.observe(puntos);
  } else {
    rv.forEach(function (el) { el.classList.add('on'); }); puntos.classList.add('on');
  }
  puntos.querySelectorAll('circle').forEach(function (c, k) { c.style.transitionDelay = (k * 0.09) + 's'; });

  // Bono regalo
  var serv = $('#billeteServ'), bRegalo = $('#btnRegalo');
  function regalo() {
    var v = $('input[name=regalo]:checked').value;
    var m = v.match(/^(.*) \((.*)\) · (.*)$/);
    serv.innerHTML = '';
    serv.appendChild(document.createTextNode(m ? m[1] : 'El importe que tú elijas'));
    var sm = document.createElement('small'); sm.textContent = m ? m[2] + ' · ' + m[3] : 'para cualquier tratamiento'; serv.appendChild(sm);
    var txt = 'Hola Marién, quiero regalar un bono de ' + v + '. ¿Me lo preparas?';
    bRegalo.href = 'https://wa.me/34659207629?text=' + encodeURIComponent(txt);
  }
  document.querySelectorAll('input[name=regalo]').forEach(function (r) { r.addEventListener('change', regalo); });
  regalo();

  // Mapa: se carga solo cuando lo piden (sin cookies de terceros al entrar)
  $('#verMapa').addEventListener('click', function () {
    var m = $('#mapa'), f = document.createElement('iframe');
    f.title = 'Mapa de En Manos de Nara en Soria';
    f.loading = 'lazy';
    f.referrerPolicy = 'no-referrer-when-downgrade';
    f.src = 'https://maps.google.com/maps?q=' + encodeURIComponent('Calle Antonio Segura Zubizarreta 6, 42004 Soria') + '&z=16&output=embed';
    m.innerHTML = ''; m.appendChild(f); m.classList.add('cargado');
  });

  // Newsletter (demo)
  $('#newsForm').addEventListener('submit', function (e) {
    e.preventDefault();
    var em = $('#newsEmail'), ok = $('#newsOk'), msg = $('#newsMsg');
    if (!em.value || !em.checkValidity()) { msg.textContent = 'Escribe un email válido.'; em.focus(); return; }
    if (!ok.checked) { msg.textContent = 'Falta aceptar la política de privacidad.'; ok.focus(); return; }
    msg.textContent = '¡Gracias! Te llegará la guía de bienestar y tu 10 % de descuento.';
    e.target.reset();
  });

  $('#anio').textContent = new Date().getFullYear();
})();
