/* Finca Los Castaños — mejoras sept 2026 (G&G Elcano) */
(function () {
  // 1) Humo de café subiendo del grano flotante (efecto especial pedido)
  function addSteam(el) {
    if (!el || el.querySelector('.gg-steam-wrap')) return;
    var wrap = document.createElement('span');
    wrap.className = 'gg-steam-wrap';
    wrap.setAttribute('aria-hidden', 'true');
    for (var i = 0; i < 3; i++) {
      var s = document.createElement('span');
      s.className = 'gg-steam';
      wrap.appendChild(s);
    }
    el.style.overflow = 'visible';
    el.style.position = el.style.position || 'relative';
    el.appendChild(wrap);
  }
  function initSteam() {
    document.querySelectorAll('.social-fab-toggle').forEach(addSteam);
    // La taza de los titulares va SIN humo (peticion 8-sep).
  }

  // 2) Noticias editables: se cargan desde noticias.json (el cliente edita solo ese archivo)
  function initNews() {
    var box = document.getElementById('gg-news');
    if (!box) return;
    var lang = box.getAttribute('data-lang') || 'es';
    var src = box.getAttribute('data-src') || 'noticias.json';
    fetch(src).then(function (r) { return r.json(); }).then(function (data) {
      var items = (data && data.items) || [];
      var frag = document.createDocumentFragment();
      items.forEach(function (item) {
        var loc = item[lang] || item.es || {};
        var card = document.createElement('article');
        card.className = 'gg-news-card';
        var img = '';
        if (item.imagen) {
          img = '<img src="' + box.getAttribute('data-root') + item.imagen + '" alt="" loading="lazy">';
        }
        card.innerHTML = img +
          '<div class="gg-news-body">' +
          '<span class="gg-news-date">' + (loc.fecha || '') + '</span>' +
          '<h3>' + (loc.titulo || '') + '</h3>' +
          '<p>' + (loc.texto || '') + '</p>' +
          '</div>';
        frag.appendChild(card);
      });
      box.innerHTML = '';
      box.appendChild(frag);
    }).catch(function () {
      box.innerHTML = '<p style="text-align:center">—</p>';
    });
  }

  // 3) Respaldo para navegadores sin :has() — marcar la seccion de la
  //    ilustracion para poder pintarla de arena desde el CSS.
  function initIlustracion() {
    var img = document.querySelector('img[src*="hero-illustration"]');
    if (!img) return;
    var sec = img.closest('section');
    if (sec) sec.classList.add('gg-ilustracion');
  }

  // 4) Fundido por scroll entre la montana del hero y los granos: al bajar,
  //    los granos aparecen sobre la montana casi invisibles y van ganando
  //    opacidad y color hasta quedar a maxima intensidad.
  function initBeansFade() {
    var band = document.querySelector('.gg-beans-band');
    if (!band) return;
    var hero = band.previousElementSibling;
    if (!hero || hero.tagName !== 'SECTION') return;
    var fotoHero = hero.querySelector('img[src*="hero."]');
    var fondo = fotoHero && fotoHero.parentElement;
    var granos = band.querySelector('img');
    if (!fondo || !granos) return;

    // El degradado a negro del final del hero marcaba el corte de secciones
    var negro = fondo.querySelector('.bottom-0.bg-gradient-to-b');
    if (negro) negro.classList.add('gg-hero-fade-out');

    var capa = fondo.querySelector('.gg-granos-fade');
    if (!capa) {
      capa = document.createElement('div');
      capa.className = 'gg-granos-fade';
      capa.setAttribute('aria-hidden', 'true');
      var copia = document.createElement('img');
      copia.src = granos.getAttribute('src');
      if (granos.getAttribute('srcset')) copia.srcset = granos.getAttribute('srcset');
      copia.sizes = granos.getAttribute('sizes') || '100vw';
      copia.alt = '';
      copia.decoding = 'async';
      capa.appendChild(copia);
      fondo.appendChild(capa);
    }

    var raiz = document.documentElement;   // las variables las leen capa Y banda
    function set(op, sat, con) {
      raiz.style.setProperty('--gg-beans-op', op);
      raiz.style.setProperty('--gg-beans-sat', sat);
      raiz.style.setProperty('--gg-beans-con', con);
    }
    // Misma altura que la banda => los granos salen del mismo tamano
    function medir() { capa.style.height = band.getBoundingClientRect().height + 'px'; }

    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      medir();
      return set(1, 1, 1);
    }

    var pedido = false;
    function pintar() {
      pedido = false;
      var vh = window.innerHeight || document.documentElement.clientHeight;
      var caja = band.getBoundingClientRect();
      // 0 cuando la banda asoma por abajo; 1 cuando la pantalla es ya solo granos
      var p = (vh - caja.top) / Math.max(1, vh - caja.height);
      p = p < 0 ? 0 : (p > 1 ? 1 : p);
      var e = p * p * (3 - 2 * p);                          // arranque y final suaves
      set((0.04 + 0.96 * e).toFixed(3),
          (0.15 + 0.95 * e).toFixed(3),
          (0.85 + 0.25 * e).toFixed(3));
    }
    function alScroll() {
      if (!pedido) { pedido = true; requestAnimationFrame(pintar); }
    }
    window.addEventListener('scroll', alScroll, { passive: true });
    window.addEventListener('resize', function () { medir(); alScroll(); });
    medir();
    pintar();
  }

  // 5) Pagina Experiencia: la columna tenia una sola foto y dos huecos
  //    enormes. Se anaden dos fotos mas siguiendo el orden del texto:
  //    la planta (cultivo) -> el secado -> la cafetera (degustacion).
  function initFotosExperiencia() {
    var img = document.querySelector('img[src*="plantation-tour"]');
    if (!img) return;
    var marco = img.parentElement;
    var col = marco && marco.parentElement;
    if (!col || col.querySelector('.gg-foto-extra')) return;

    var src = img.getAttribute('src');
    if (src.indexOf('_astro/') < 0) return;
    var base = src.split('_astro/')[0];          // '../' o '../../'
    var lang = (document.documentElement.lang || 'en').slice(0, 2);
    var textos = {
      es: ['Cerezas de café madurando en la planta', 'Cafetera y tazas para la degustación'],
      de: ['Kaffeekirschen reifen an der Pflanze', 'Kaffeekanne und Tassen für die Verkostung'],
      en: ['Coffee cherries ripening on the plant', 'Coffee pot and cups for the tasting']
    };
    var alt = textos[lang] || textos.en;

    col.classList.add('gg-col-fotos');
    function nuevoMarco(nombre, texto) {
      var caja = document.createElement('div');
      caja.className = marco.className + ' gg-foto-extra';
      var foto = document.createElement('img');
      foto.src = base + 'custom/' + nombre + '-900.webp';
      foto.srcset = base + 'custom/' + nombre + '-600.webp 600w, ' +
                    base + 'custom/' + nombre + '-900.webp 900w';
      foto.sizes = img.getAttribute('sizes') || '(max-width: 768px) 80vw, 28vw';
      foto.alt = texto;
      foto.loading = 'lazy';
      foto.decoding = 'async';
      foto.className = img.className;
      caja.appendChild(foto);
      return caja;
    }
    col.insertBefore(nuevoMarco('exp-rama', alt[0]), marco);
    col.appendChild(nuevoMarco('exp-cata', alt[1]));
  }

  // 6) Historia del cafe: el texto es larguisimo y la columna de la foto,
  //    ademas de sticky, tenia una sola imagen. Se reparten cuatro fotos mas
  //    siguiendo lo que cuenta el texto (el valle, los platanos que
  //    sustituyeron al cafe, las parcelas familiares y las notas de cata).
  function initFotosHistoria() {
    var img = document.querySelector('img[src*="plantation-view"]');
    if (!img) return;
    var marco = img.parentElement;
    var col = marco && marco.parentElement;
    if (!col || col.querySelector('.gg-foto-extra')) return;

    var src = img.getAttribute('src');
    if (src.indexOf('_astro/') < 0) return;
    var base = src.split('_astro/')[0];
    var lang = (document.documentElement.lang || 'en').slice(0, 2);
    var textos = {
      es: ['Cultivos del Valle de Agaete', 'Plataneras en el valle',
           'Cerezas de café recién recogidas', 'Gajos de mandarina'],
      de: ['Anbau im Valle de Agaete', 'Bananenstauden im Tal',
           'Frisch geerntete Kaffeekirschen', 'Mandarinenspalten'],
      en: ['Crops in the Valle de Agaete', 'Banana plants in the valley',
           'Freshly picked coffee cherries', 'Mandarin segments']
    };
    var alt = textos[lang] || textos.en;

    col.classList.add('gg-col-historia');
    function nuevoMarco(nombre, texto) {
      var caja = document.createElement('div');
      caja.className = marco.className + ' gg-foto-extra';
      var foto = document.createElement('img');
      foto.src = base + 'custom/' + nombre + '-900.webp';
      foto.srcset = base + 'custom/' + nombre + '-600.webp 600w, ' +
                    base + 'custom/' + nombre + '-900.webp 900w';
      foto.sizes = img.getAttribute('sizes') || '(max-width: 768px) 100vw, 50vw';
      foto.alt = texto;
      foto.loading = 'lazy';
      foto.decoding = 'async';
      foto.className = img.className;
      caja.appendChild(foto);
      return caja;
    }
    ['exp-valle', 'exp-platanos', 'exp-mano', 'exp-mandarina']
      .forEach(function (nombre, i) { col.appendChild(nuevoMarco(nombre, alt[i])); });
  }

  function init() { initSteam(); initNews(); initIlustracion(); initBeansFade(); initFotosExperiencia(); initFotosHistoria(); }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else { init(); }
  document.addEventListener('astro:page-load', init);
})();
