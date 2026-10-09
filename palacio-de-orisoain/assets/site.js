/* Palacio de Orísoain — interacción */
(function () {
  var doc = document.documentElement;
  doc.classList.add('js');
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var esEscritorio = window.matchMedia('(min-width: 1101px)');

  /* Cabecera compacta al hacer scroll */
  var hd = document.querySelector('.hd');
  function cabecera() { if (hd) hd.classList.toggle('is-compact', window.scrollY > 60); }
  cabecera();
  window.addEventListener('scroll', cabecera, { passive: true });

  /* Menú móvil */
  var burger = document.querySelector('.hd-burger');
  var mm = document.getElementById('menu-movil');
  if (burger && mm) {
    var cerrar = mm.querySelector('.mm-cerrar');
    var abrir = function () {
      mm.classList.add('is-open'); burger.setAttribute('aria-expanded', 'true');
      document.body.style.overflow = 'hidden'; mm.removeAttribute('inert');
      setTimeout(function () { cerrar.focus(); }, 50);
    };
    var cerrarMenu = function () {
      mm.classList.remove('is-open'); burger.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = ''; mm.setAttribute('inert', ''); burger.focus();
    };
    mm.setAttribute('inert', '');
    burger.addEventListener('click', abrir);
    cerrar.addEventListener('click', cerrarMenu);
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && mm.classList.contains('is-open')) cerrarMenu(); });
  }

  /* Pase de fotos de portada */
  document.querySelectorAll('[data-slides]').forEach(function (cont) {
    var slides = cont.querySelectorAll('.heroe-slide');
    var pag = cont.parentNode.querySelector('.heroe-pag');
    if (slides.length < 2) return;
    var i = 0, t;
    var botones = [];
    if (pag) {
      slides.forEach(function (s, n) {
        var b = document.createElement('button');
        b.type = 'button';
        b.setAttribute('aria-label', 'Foto ' + (n + 1) + ' de ' + slides.length);
        b.addEventListener('click', function () { ir(n); reiniciar(); });
        pag.appendChild(b); botones.push(b);
      });
    }
    function ir(n) {
      slides[i].classList.remove('is-on');
      i = (n + slides.length) % slides.length;
      var img = slides[i].querySelector('img');
      if (img && img.loading === 'lazy') img.loading = 'eager';
      slides[i].classList.add('is-on');
      botones.forEach(function (b, k) { b.setAttribute('aria-current', k === i ? 'true' : 'false'); });
    }
    function reiniciar() { clearInterval(t); if (!reduce) t = setInterval(function () { ir(i + 1); }, 7000); }
    ir(0); reiniciar();
  });

  /* Pestañas de la caja de reserva */
  document.querySelectorAll('.reserva-tabs').forEach(function (tabs) {
    var bs = tabs.querySelectorAll('[role="tab"]');
    function activar(b) {
      bs.forEach(function (x) {
        var on = x === b;
        x.setAttribute('aria-selected', on ? 'true' : 'false');
        x.tabIndex = on ? 0 : -1;
        document.getElementById(x.getAttribute('aria-controls')).hidden = !on;
      });
    }
    bs.forEach(function (b, n) {
      b.addEventListener('click', function () { activar(b); });
      b.addEventListener('keydown', function (e) {
        if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
          var sig = bs[(n + (e.key === 'ArrowRight' ? 1 : -1) + bs.length) % bs.length];
          activar(sig); sig.focus();
        }
      });
    });
  });

  /* Caja de reserva fija abajo en escritorio, al pasar la portada */
  var reserva = document.querySelector('.reserva[data-fija]');
  var heroe = document.querySelector('.heroe-home');
  var pie = document.querySelector('.pie');
  if (reserva && heroe) {
    var fijar = function () {
      if (!esEscritorio.matches) { reserva.classList.remove('is-fija'); return; }
      var pasado = heroe.getBoundingClientRect().bottom < 0;
      var enPie = pie && pie.getBoundingClientRect().top < window.innerHeight;
      reserva.classList.toggle('is-fija', pasado && !enPie);
    };
    window.addEventListener('scroll', fijar, { passive: true });
    window.addEventListener('resize', fijar);
    fijar();
  }

  /* Lista con imagen (entorno) */
  document.querySelectorAll('[data-lista-img]').forEach(function (bloque) {
    var fotos = bloque.querySelectorAll('.lista-img-fotos img');
    var pie = bloque.querySelector('.lista-img-fotos figcaption');
    var items = bloque.querySelectorAll('.lista-dest a');
    function marcar(n) {
      items.forEach(function (a, k) { a.classList.toggle('is-on', k === n); });
      fotos.forEach(function (f, k) { f.classList.toggle('is-on', k === n); });
      if (pie) pie.textContent = fotos[n].alt;
    }
    items.forEach(function (a, n) {
      a.addEventListener('mouseenter', function () { marcar(n); });
      a.addEventListener('focus', function () { marcar(n); });
    });
    marcar(0);
  });

  /* Opiniones */
  document.querySelectorAll('[data-opiniones]').forEach(function (cont) {
    var ops = cont.querySelectorAll('.opinion');
    var cuenta = cont.querySelector('[data-cuenta]');
    var i = 0, t;
    function ir(n) {
      ops[i].classList.remove('is-on');
      i = (n + ops.length) % ops.length;
      ops[i].classList.add('is-on');
      if (cuenta) cuenta.textContent = (i + 1) + ' / ' + ops.length;
    }
    function auto() { clearInterval(t); if (!reduce) t = setInterval(function () { ir(i + 1); }, 8000); }
    var ant = cont.querySelector('[data-ant]'), sig = cont.querySelector('[data-sig]');
    if (ant) ant.addEventListener('click', function () { ir(i - 1); auto(); });
    if (sig) sig.addEventListener('click', function () { ir(i + 1); auto(); });
    cont.addEventListener('mouseenter', function () { clearInterval(t); });
    cont.addEventListener('mouseleave', auto);
    cont.addEventListener('focusin', function () { clearInterval(t); });
    ir(0); auto();
  });

  /* Visor de galería */
  var lb = document.querySelector('.lb');
  document.querySelectorAll('[data-galeria]').forEach(function (gal) {
    if (!lb || typeof lb.showModal !== 'function') return;
    var bs = gal.querySelectorAll('button');
    var img = lb.querySelector('img'), num = lb.querySelector('.lb-num');
    var i = 0, origen;
    function ver(n) {
      i = (n + bs.length) % bs.length;
      img.src = bs[i].dataset.grande;
      img.alt = bs[i].querySelector('img').alt;
      num.textContent = (i + 1) + ' / ' + bs.length;
    }
    bs.forEach(function (b, n) {
      b.addEventListener('click', function () { origen = b; ver(n); lb.showModal(); });
    });
    lb.querySelector('.lb-ant').onclick = function () { ver(i - 1); };
    lb.querySelector('.lb-sig').onclick = function () { ver(i + 1); };
    lb.querySelector('.lb-cerrar').onclick = function () { lb.close(); };
    lb.addEventListener('click', function (e) { if (e.target === lb) lb.close(); });
    lb.addEventListener('close', function () { if (origen) origen.focus(); });
    lb.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowRight') ver(i + 1);
      if (e.key === 'ArrowLeft') ver(i - 1);
    });
  });

  /* Formulario de contacto: prepara el correo */
  var form = document.getElementById('form-contacto');
  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!form.reportValidity()) return;
      var d = new FormData(form);
      var cuerpo = 'Nombre: ' + d.get('nombre') + '\nTeléfono: ' + d.get('telefono') + '\nEmail: ' + d.get('email') + '\n\n' + d.get('mensaje');
      window.location.href = 'mailto:info@palaciodeorisoain.com?subject=' + encodeURIComponent('Consulta desde la web') + '&body=' + encodeURIComponent(cuerpo);
    });
  }

  /* Aparición suave al hacer scroll */
  var rvs = document.querySelectorAll('.rv');
  if ('IntersectionObserver' in window && !reduce) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); } });
    }, { rootMargin: '0px 0px -8% 0px' });
    rvs.forEach(function (el) { io.observe(el); });
  } else {
    rvs.forEach(function (el) { el.classList.add('is-in'); });
  }
})();
