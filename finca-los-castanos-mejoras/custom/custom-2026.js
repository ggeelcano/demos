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
  // (21-sep) Ruta del azulejo de granos segun la densidad de pantalla (alto
  // 1150 para moviles retina, 800 para el resto). sufijo: '' entero, '-roto'
  // con el borde de abajo recortado por los granos.
  function ggTile(imgBanda, sufijo) {
    var base = (imgBanda.getAttribute('src') || '').split('custom/')[0];
    var alto = (window.devicePixelRatio || 1) > 1.3 ? 1150 : 800;
    return base + 'custom/granos-2026-tile' + sufijo + '-' + alto + '.webp';
  }

  function initBeansFade() {
    var band = document.querySelector('.gg-beans-band');
    if (!band) return;
    var hero = band.previousElementSibling;
    if (!hero || hero.tagName !== 'SECTION') return;
    var fotoHero = hero.querySelector('img[src*="hero."], img[src*="hero-2026"]');
    var fondo = fotoHero && fotoHero.parentElement;
    var granos = band.querySelector('img');
    if (!fondo || !granos) return;

    // El degradado a negro del final del hero marcaba el corte de secciones
    var negro = fondo.querySelector('.bottom-0.bg-gradient-to-b');
    if (negro) negro.classList.add('gg-hero-fade-out');

    // (21-sep) Elena quiere la banda como su panoramica antigua: granos
    // pequenos y tira muy larga ("pegar tres"). La foto va ahora como AZULEJO
    // (custom/granos-2026-tile-*, la foto + su espejo) que el css repite en
    // horizontal. La banda lleva el azulejo con el borde de abajo roto y esta
    // capa del hero el azulejo entero volteado; mismo alto en las dos, asi el
    // grano sale del mismo tamano y la union es continua.
    if (!band.querySelector('.gg-tile')) {
      var azulejo = document.createElement('div');
      azulejo.className = 'gg-tile coffee-fade-in';
      azulejo.style.backgroundImage = 'url(' + ggTile(granos, '-roto') + ')';
      band.appendChild(azulejo);
      granos.classList.add('gg-oculta');
    }

    // (1-oct) Transicion rehecha. Antes capa y banda cambiaban de OPACIDAD con
    // el scroll, y como detras de una hay foto y detras de la otra un fondo liso,
    // a media transicion se veia una raya en la union. Ahora:
    //  - la banda va siempre opaca;
    //  - la capa del hero va siempre con su borde de abajo opaco (mismo grano
    //    que el borde de arriba de la banda => sin raya) y un degradado de
    //    transparencia larguisimo hacia arriba;
    //  - lo que cambia con el scroll es la ALTURA de la capa: los granos van
    //    "subiendo" por la foto poco a poco, de 0,2 a 1,9 veces el alto de la banda.
    var capa = fondo.querySelector('.gg-granos-fade');
    if (!capa) {
      capa = document.createElement('div');
      capa.className = 'gg-granos-fade';
      capa.setAttribute('aria-hidden', 'true');
      // tile-a: las filas REALES de la foto que van justo encima de la banda
      // (granos-2026-sube-*, 0,4072 veces su alto): continua la banda sin espejo.
      // tile-b: encima, el mismo trozo volteado, que casa con el borde de arriba
      // de tile-a; ya cae en la zona casi transparente del degradado.
      var sube = ggTile(granos, '').replace('granos-2026-tile-', 'granos-2026-sube-');
      ['gg-tile gg-tile-a', 'gg-tile gg-tile-b'].forEach(function (cls) {
        var d = document.createElement('div');
        d.className = cls;
        d.style.backgroundImage = 'url(' + sube + ')';
        capa.appendChild(d);
      });
      fondo.appendChild(capa);
    }

    var altoBanda = 0;
    function medir() {
      altoBanda = band.getBoundingClientRect().height;
      capa.style.setProperty('--gg-band-h', altoBanda + 'px');
    }
    // (1-oct tarde) Arriba del todo NO se ve ningun grano. La altura de la
    // capa depende de cuantos px de banda asoman ya por abajo (v): empieza en
    // 0, al principio crece algo mas rapido que el scroll (asi el borde de la
    // banda nunca entra "a pelo") y se va frenando hasta 0,8 veces la banda.
    function alto(v) {
      var tope = altoBanda * 0.8;
      var L = v <= 0 ? 0 : tope * (1 - Math.exp(-1.7 * v / tope));
      capa.style.height = Math.round(L) + 'px';
    }

    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      medir();
      return alto(altoBanda * 0.5);
    }

    var pedido = false;
    function pintar() {
      pedido = false;
      var vh = window.innerHeight || document.documentElement.clientHeight;
      alto(vh - band.getBoundingClientRect().top);
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
    // (21-sep) Leo salia aqui y en la pagina del Tour: Elena pide otra foto.
    // Van las cerezas en la rama (el cultivo), y debajo sigue el secado.
    var textos = {
      es: ['Cerezas de café madurando en el cafeto'],
      de: ['Reifende Kaffeekirschen am Strauch'],
      en: ['Coffee cherries ripening on the plant']
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
    col.insertBefore(nuevoMarco('exp-cerezas', alt[0]), marco);
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
    // (21-sep) la flor del cafeto, muestra de Elena, abre la columna
    var textos = {
      es: ['Flor del cafeto', 'Cultivos del Valle de Agaete', 'Plataneras en el valle',
           'Cerezas de café recién recogidas'],
      de: ['Kaffeeblüte', 'Anbau im Valle de Agaete', 'Bananenstauden im Tal',
           'Frisch geerntete Kaffeekirschen'],
      en: ['Coffee blossom', 'Crops in the Valle de Agaete', 'Banana plants in the valley',
           'Freshly picked coffee cherries']
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
    ['exp-flor', 'exp-valle', 'exp-platanos', 'exp-mano']
      .forEach(function (nombre, i) { col.appendChild(nuevoMarco(nombre, alt[i])); });
  }

  function idioma() { return (document.documentElement.lang || 'en').slice(0, 2); }

  // 7) Fuera la galeria de la portada: sus 12 fotos ya estan en "Photo
  //    Gallery", que queda como galeria unica.
  function initSinGaleriaHome() {
    if (!document.querySelector('.gg-beans-band')) return;   // solo la portada
    // La galeria es la unica seccion de la portada con una rejilla de 12 fotos.
    // (Antes se buscaba por el alt "Finca Los Casta..." y eso escondia la
    // seccion "Visitas con encanto", cuya foto del equipo lleva ese mismo alt.)
    var sec = [].slice.call(document.querySelectorAll('main section')).filter(function (s) {
      return s.querySelectorAll('.grid img').length >= 8;
    })[0];
    if (sec) sec.classList.add('gg-oculta');
  }

  // 8) Dejar dicho que el idioma de la visita se acuerda al reservar.
  function initNotaIdioma() {
    var textos = {
      es: 'Dinos el idioma que prefieres al hacer la reserva: lo acordamos de antemano para asignarte el guía.',
      de: 'Bitte geben Sie die gewünschte Sprache bei der Buchung an – wir stimmen sie vorab ab.',
      en: 'Please tell us your preferred language when booking – we arrange it in advance.'
    };
    var nota = textos[idioma()] || textos.en;

    // a) en la respuesta de la FAQ sobre idiomas
    var faq = [].slice.call(document.querySelectorAll('details'))
      .filter(function (d) { return /idioma|language|sprache/i.test(d.textContent); })[0];
    if (faq && !faq.querySelector('.gg-nota-idioma')) {
      var cuerpo = faq.querySelector('div');
      if (cuerpo) {
        var s = document.createElement('strong');
        s.className = 'gg-nota-idioma';
        s.textContent = nota;
        cuerpo.appendChild(s);
      }
    }

    // b) junto a la lista de idiomas de la pagina de reserva
    var lista = [].slice.call(document.querySelectorAll('li, p, span'))
      .filter(function (e) {
        return /ES\s*·\s*EN/.test(e.textContent) && e.children.length === 0;
      })[0];
    if (lista) {
      var caja = lista.closest('li') || lista.parentElement;
      if (caja && !caja.parentElement.querySelector('.gg-nota-idioma')) {
        var p = document.createElement('p');
        // esta va sobre la foto del hero: hace falta texto claro con sombra
        p.className = 'gg-nota-idioma gg-nota-idioma--claro';
        p.textContent = nota;
        caja.parentElement.appendChild(p);
      }
    }
  }

  // 9) Contacto: el mapa salia muy alejado y sin forma de acercarlo. Se
  //    centra en la finca con zoom util y se anade un boton "como llegar".
  function initMapa() {
    var marco = document.querySelector('.privacy-map-wrapper') ||
                document.querySelector('[class*="map-wrapper"]');
    if (!marco || marco.querySelector('.gg-como-llegar')) return;

    var destino = 'Finca+Los+Casta%C3%B1os,+Camino+de+Los+Romeros,+35489+Agaete,+Las+Palmas';
    var lang = idioma();
    var textos = { es: 'Cómo llegar', de: 'Anfahrt', en: 'Get directions' };

    // el embed del cliente venia con un zoom fijo demasiado abierto
    function acercar() {
      var f = marco.querySelector('iframe[src*="maps"]');
      if (!f || f.dataset.ggZoom) return;
      f.dataset.ggZoom = '1';
      f.src = 'https://www.google.com/maps?q=' + destino + '&z=15&hl=' + lang + '&output=embed';
      f.setAttribute('allowfullscreen', '');
    }
    acercar();
    // el iframe ya existe y le cambian el src al pulsar "ver mapa": hay que
    // vigilar tambien los atributos, no solo los nodos nuevos
    new MutationObserver(acercar).observe(marco, {
      childList: true, subtree: true, attributes: true, attributeFilter: ['src']
    });

    var a = document.createElement('a');
    a.className = 'gg-como-llegar';
    a.href = 'https://www.google.com/maps/dir/?api=1&destination=' + destino;
    a.target = '_blank';
    a.rel = 'noopener';
    a.textContent = (textos[lang] || textos.en) + ' →';
    marco.parentElement.appendChild(a);
  }

  // 10) Version B "clara" (15-sep): interruptor de tema para que el cliente
  //     compare A (verde) y B (clara) en el mismo enlace. ?tema=claro o
  //     ?tema=verde lo fija; se recuerda en localStorage. La clase gg-claro la
  //     pone ya un script inline en <head> para que no parpadee.
  function initTema() {
    var KEY = 'gg-tema';
    var raiz = document.documentElement;
    var q = new URLSearchParams(location.search).get('tema');
    var tema;
    try { tema = q || localStorage.getItem(KEY) || 'verde'; } catch (e) { tema = q || 'verde'; }
    if (q) { try { localStorage.setItem(KEY, q); } catch (e) {} }
    function aplicar() {
      raiz.classList.toggle('gg-claro', tema === 'claro');
      if (btn) btn.textContent = tema === 'claro' ? etiquetas.verde : etiquetas.claro;
    }
    // la unica cursiva que se conserva en B: el subtitulo del hero de la portada
    var sub = document.querySelector('.gg-beans-band') &&   // solo en la portada
              document.querySelector('main > section:first-of-type p.font-serif');
    if (sub) sub.classList.add('gg-cursiva-ok');

    // el menu movil no marca la pagina actual: se marca aqui comparando rutas
    var aqui = location.pathname.replace(/index\.html$/, '');
    [].forEach.call(document.querySelectorAll('#mobile-menu a.mobile-link'), function (a) {
      var ruta = a.pathname.replace(/index\.html$/, '');
      if (ruta === aqui) a.classList.add('gg-activo');
    });

    var lang = idioma();
    var etiquetas = {
      es: { claro: 'Ver versión clara', verde: 'Ver versión verde' },
      de: { claro: 'Helle Version', verde: 'Grüne Version' },
      en: { claro: 'See light version', verde: 'See green version' }
    }[lang] || { claro: 'See light version', verde: 'See green version' };

    var btn = document.querySelector('.gg-tema-btn');
    if (!btn) {
      btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'gg-tema-btn';
      btn.addEventListener('click', function () {
        tema = tema === 'claro' ? 'verde' : 'claro';
        try { localStorage.setItem(KEY, tema); } catch (e) {}
        aplicar();
      });
      document.body.appendChild(btn);
    }
    aplicar();
  }

  // 11) Final de la portada (17-sep, Elena): cerrar la pagina con una banda de
  //     granos con el borde recortado por el contorno de los granos, como la
  //     de arriba pero SIN degradado. Se usa la misma foto recortada, volteada
  //     para que el borde roto quede arriba. Pendiente: foto de granos TOSTADOS
  //     del cliente; cuando llegue se hace su azulejo (panorama-cascara.mjs).
  function initBeansFoot() {
    var band = document.querySelector('.gg-beans-band');
    var main = document.querySelector('main');
    if (!band || !main || main.querySelector('.gg-beans-foot')) return;
    var sec = document.createElement('section');
    sec.className = 'gg-beans-foot';
    sec.setAttribute('aria-hidden', 'true');
    // (21-sep tarde) azulejo de granos TOSTADOS, hecho con la muestra que
    // mando Elena (custom/tostado-tile-roto-545.webp), repetido y volteado.
    var base = (band.querySelector('img').getAttribute('src') || '').split('custom/')[0];
    var img = document.createElement('div');
    img.className = 'gg-tile';
    img.style.backgroundImage = 'url(' + base + 'custom/tostado-tile-roto-545.webp)';
    sec.appendChild(img);
    main.appendChild(sec);
  }

  // 12) 17-sep, Elena: (a) los rotulos "Tour de cafe" / "Eventos" junto a las
  //     ventanas de foto, como botones verdes; (b) huellas de conejo de fondo
  //     en esa seccion, que quedaba vacia a los lados.
  function initTarjetasYHuellas() {
    var wins = document.querySelectorAll('.gg-card-win');
    if (!wins.length) return;
    var sec = wins[0].closest('section');
    [].forEach.call(wins, function (w) {
      var a = w.closest('a');
      if (a) a.classList.add('gg-card-btn');
    });
    if (sec && !sec.querySelector('.gg-huellas')) {
      sec.classList.add('gg-sec-huellas');
      var base = (wins[0].querySelector('img').getAttribute('src') || '').split('custom/')[0];
      var img = document.createElement('img');
      img.className = 'gg-huellas';
      img.src = base + 'custom/huellas-conejo.svg';
      img.alt = '';
      img.setAttribute('aria-hidden', 'true');
      sec.insertBefore(img, sec.firstChild);
    }
  }

  function init() {
    initTema(); initBeansFoot(); initTarjetasYHuellas();
    initSteam(); initNews(); initIlustracion(); initBeansFade();
    initFotosExperiencia(); initFotosHistoria();
    initSinGaleriaHome(); initNotaIdioma(); initMapa();
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else { init(); }
  document.addEventListener('astro:page-load', init);
})();
