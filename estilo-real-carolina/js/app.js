/* Estilo Real by Carolina — comportamiento de la tienda */
(function () {
  var P = window.PRODUCTOS || [];
  var ER = window.ER;
  var POR_ID = {};
  P.forEach(function (p) { POR_ID[p.id] = p; });
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var params = new URLSearchParams(location.search);

  /* ---------- fotos: el CDN a veces tarda la primera vez que redimensiona ---------- */
  function reintentar(img) {
    if (img.dataset.r || !/zyrosite/.test(img.currentSrc || img.src)) return;
    img.dataset.r = '1';
    var u = img.currentSrc || img.src;
    img.removeAttribute('srcset');
    setTimeout(function () { img.src = u + (u.indexOf('?') >= 0 ? '&' : '?') + 'r=1'; }, 1500);
  }
  document.addEventListener('error', function (e) { if (e.target.tagName === 'IMG') reintentar(e.target); }, true);
  $$('img').forEach(function (img) { if (img.complete && !img.naturalWidth && img.getAttribute('loading') !== 'lazy') reintentar(img); });

  /* ---------- almacenamiento ---------- */
  function leer(k, def) { try { var v = localStorage.getItem(k); return v ? JSON.parse(v) : def; } catch (e) { return def; } }
  function guardar(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }

  /* ---------- cabecera ---------- */
  var cab = $('.cabecera');
  function medirCab() { if (cab) document.documentElement.style.setProperty('--cab', cab.offsetHeight + 'px'); }
  medirCab(); addEventListener('resize', medirCab);
  addEventListener('scroll', function () { if (cab) cab.classList.toggle('con-sombra', scrollY > 10); }, { passive: true });

  // desplegables de escritorio
  $$('.menu li.con-sub').forEach(function (li) {
    var b = $('button', li), t;
    function abrir() { clearTimeout(t); $$('.menu li.abierto').forEach(function (o) { if (o !== li) cerrarLi(o); }); li.classList.add('abierto'); b.setAttribute('aria-expanded', 'true'); }
    function cerrar() { t = setTimeout(function () { cerrarLi(li); }, 120); }
    li.addEventListener('mouseenter', abrir);
    li.addEventListener('mouseleave', cerrar);
    b.addEventListener('click', function () { li.classList.contains('abierto') ? cerrarLi(li) : abrir(); });
    li.addEventListener('focusout', function (e) { if (!li.contains(e.relatedTarget)) cerrarLi(li); });
  });
  function cerrarLi(li) { li.classList.remove('abierto'); var b = $('button', li); if (b) b.setAttribute('aria-expanded', 'false'); }
  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;
    var abierto = $('.menu li.abierto'); if (abierto) { cerrarLi(abierto); $('button', abierto).focus(); }
    if ($('.cajon.abierto')) cerrarCajon();
    if ($('.bolsa.abierta')) cerrarBolsa();
  });

  // cajón móvil
  var cajon = $('.cajon'), botonMenu = $('.hamburguesa');
  function abrirCajon() { cajon.classList.add('abierto'); botonMenu.setAttribute('aria-expanded', 'true'); document.body.style.overflow = 'hidden'; $('.cajon .cerrar').focus(); }
  function cerrarCajon() { cajon.classList.remove('abierto'); botonMenu.setAttribute('aria-expanded', 'false'); document.body.style.overflow = ''; botonMenu.focus(); }
  if (cajon) {
    botonMenu.addEventListener('click', abrirCajon);
    $$('.cajon .cerrar, .cajon-fondo').forEach(function (b) { b.addEventListener('click', cerrarCajon); });
    $$('.cajon .acordeon').forEach(function (b) {
      b.addEventListener('click', function () {
        var ul = document.getElementById(b.getAttribute('aria-controls'));
        var ab = b.getAttribute('aria-expanded') === 'true';
        b.setAttribute('aria-expanded', String(!ab)); ul.hidden = ab;
        $('span', b).textContent = ab ? '+' : '−';
      });
    });
  }

  /* ---------- favoritos ---------- */
  var favs = leer('er-favoritos', []);
  function pintarFavs() {
    $$('[data-fav]').forEach(function (b) {
      var on = favs.indexOf(b.getAttribute('data-fav')) >= 0;
      b.setAttribute('aria-pressed', String(on));
      var tx = $('.fav-txt', b); if (tx) tx.textContent = on ? 'Guardado en favoritos' : 'Añadir a favoritos';
    });
    $$('.contador-fav').forEach(function (c) { c.textContent = favs.length; c.setAttribute('data-n', favs.length); });
  }
  document.addEventListener('click', function (e) {
    var b = e.target.closest('[data-fav]'); if (!b) return;
    e.preventDefault();
    var id = b.getAttribute('data-fav'), k = favs.indexOf(id);
    if (k >= 0) favs.splice(k, 1); else favs.push(id);
    guardar('er-favoritos', favs); pintarFavs();
  });

  /* ---------- bolsa ---------- */
  var bolsa = leer('er-bolsa', []).filter(function (l) { return POR_ID[l.id]; });
  var panel = $('.bolsa'), ultimoFoco = null;
  function totalBolsa() { return bolsa.reduce(function (s, l) { return s + POR_ID[l.id].p * l.q; }, 0); }
  function unidades() { return bolsa.reduce(function (s, l) { return s + l.q; }, 0); }
  function imagenLinea(l) {
    var p = POR_ID[l.id], v = (p.v || []).filter(function (x) { return x.n === l.v; })[0];
    return p.i[v && v.i != null ? v.i : 0];
  }
  function mensajeWhatsApp() {
    var base = location.href.replace(/[^/]*$/, '');
    var t = 'Hola Carolina, quiero hacer este pedido desde la web:\n\n';
    bolsa.forEach(function (l) {
      var p = POR_ID[l.id];
      t += '• ' + l.q + ' × ' + p.t + (l.v ? ' (' + l.v + ')' : '') + ' · ' + ER.euro(p.p * l.q) + '\n  ' + base + 'producto.html?p=' + encodeURIComponent(p.id) + '\n';
    });
    t += '\nTotal: ' + ER.euro(totalBolsa()) + '\n\n¿Me confirmas talla y envío? Gracias.';
    return 'https://wa.me/' + ER.WHATSAPP + '?text=' + encodeURIComponent(t);
  }
  function pintarBolsa() {
    $$('.contador-bolsa').forEach(function (c) { c.textContent = unidades(); c.setAttribute('data-n', unidades()); });
    if (!panel) return;
    var lista = $('.bolsa-lista', panel), pie = $('.bolsa-pie', panel);
    if (!bolsa.length) {
      lista.innerHTML = '<div class="bolsa-vacia"><p>Tu bolsa está vacía.</p><a class="boton claro" href="tienda.html?c=novedades">Ver novedades</a></div>';
      pie.hidden = true; return;
    }
    pie.hidden = false;
    lista.innerHTML = bolsa.map(function (l, k) {
      var p = POR_ID[l.id];
      return '<div class="linea-bolsa"><img src="' + ER.img(imagenLinea(l), 240) + '" alt="" loading="lazy"><div>' +
        '<h3><a href="producto.html?p=' + encodeURIComponent(p.id) + '">' + ER.esc(p.t) + '</a></h3>' +
        (l.v ? '<p>' + ER.esc(p.on || 'Color') + ': ' + ER.esc(l.v) + '</p>' : '') +
        '<p>' + ER.euro(p.p) + '</p>' +
        '<div class="fila"><div class="cantidad" role="group" aria-label="Cantidad de ' + ER.esc(p.t) + '">' +
        '<button type="button" data-menos="' + k + '" aria-label="Quitar una unidad">−</button><span aria-live="polite">' + l.q + '</span>' +
        '<button type="button" data-mas="' + k + '" aria-label="Añadir una unidad">+</button></div>' +
        '<button type="button" class="quitar" data-quitar="' + k + '">Eliminar</button></div></div></div>';
    }).join('');
    var tot = totalBolsa(), falta = ER.ENVIO_GRATIS - tot;
    $('.envio-texto', pie).textContent = falta > 0 ? 'Te faltan ' + ER.euro(falta) + ' para el envío gratis (Península).' : 'Tienes envío gratis (Península).';
    $('.envio-barra i', pie).style.width = Math.min(100, tot / ER.ENVIO_GRATIS * 100) + '%';
    $('.total-importe', pie).textContent = ER.euro(tot);
    $('.pedido-wa', pie).href = mensajeWhatsApp();
  }
  function abrirBolsa() { if (!panel) return; ultimoFoco = document.activeElement; panel.classList.add('abierta'); document.body.style.overflow = 'hidden'; $('.cerrar', panel).focus(); }
  function cerrarBolsa() { panel.classList.remove('abierta'); document.body.style.overflow = ''; if (ultimoFoco) ultimoFoco.focus(); }
  if (panel) {
    $$('.abrir-bolsa').forEach(function (b) { b.addEventListener('click', abrirBolsa); });
    $$('.cerrar, .bolsa-fondo', panel).forEach(function (b) { b.addEventListener('click', cerrarBolsa); });
    panel.addEventListener('click', function (e) {
      var t = e.target, k;
      if ((k = t.getAttribute('data-mas')) != null) bolsa[k].q++;
      else if ((k = t.getAttribute('data-menos')) != null) { bolsa[k].q--; if (bolsa[k].q < 1) bolsa.splice(k, 1); }
      else if ((k = t.getAttribute('data-quitar')) != null) bolsa.splice(k, 1);
      else return;
      guardar('er-bolsa', bolsa); pintarBolsa();
      var foco = $('[data-mas="' + k + '"]', panel) || $('.cerrar', panel); foco.focus();
    });
  }
  function anadir(id, v, q) {
    var l = bolsa.filter(function (x) { return x.id === id && x.v === v; })[0];
    if (l) l.q += q; else bolsa.push({ id: id, v: v, q: q });
    guardar('er-bolsa', bolsa); pintarBolsa(); abrirBolsa();
  }

  /* ---------- carruseles y pestañas ---------- */
  function pistaVisible(sec) { return $$('.carrusel', sec).filter(function (x) { return !x.hidden; })[0]; }
  function prepararCarrusel(sec) {
    var prev = $('.ant', sec), sig = $('.sig', sec);
    if (!prev || sec._estado) return;
    function estado() {
      var pista = pistaVisible(sec); if (!pista) return;
      prev.disabled = pista.scrollLeft < 4; sig.disabled = pista.scrollLeft + pista.clientWidth >= pista.scrollWidth - 4;
    }
    prev.addEventListener('click', function () { var t = pistaVisible(sec); t.scrollBy({ left: -t.clientWidth, behavior: 'smooth' }); });
    sig.addEventListener('click', function () { var t = pistaVisible(sec); t.scrollBy({ left: t.clientWidth, behavior: 'smooth' }); });
    $$('.carrusel', sec).forEach(function (t) { t.addEventListener('scroll', estado, { passive: true }); });
    addEventListener('resize', estado); estado();
    sec._estado = estado;
  }
  $$('[data-carrusel]').forEach(prepararCarrusel);
  $$('.pestanas').forEach(function (tl) {
    var sec = tl.closest('[data-carrusel]'), tabs = $$('[role=tab]', tl);
    tabs.forEach(function (t, k) {
      t.addEventListener('click', function () { activar(k, false); });
      t.addEventListener('keydown', function (e) {
        var d = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
        if (d) { e.preventDefault(); activar((k + d + tabs.length) % tabs.length, true); }
      });
    });
    function activar(k, foco) {
      tabs.forEach(function (t, j) {
        t.setAttribute('aria-selected', String(j === k)); t.tabIndex = j === k ? 0 : -1;
        document.getElementById(t.getAttribute('aria-controls')).hidden = j !== k;
      });
      if (foco) tabs[k].focus();
      document.getElementById(tabs[k].getAttribute('aria-controls')).scrollLeft = 0;
      var enlace = $('.ver-todo', sec); if (enlace && tabs[k].dataset.href) { enlace.href = tabs[k].dataset.href; if (tabs[k].dataset.texto) enlace.textContent = tabs[k].dataset.texto; }
      if (sec._estado) sec._estado();
    }
  });

  /* ---------- formularios del boletín ---------- */
  $$('.form-boletin').forEach(function (f) {
    f.addEventListener('submit', function (e) {
      e.preventDefault();
      var g = $('.gracias', f); g.hidden = false; g.textContent = 'Gracias. Te avisaremos de las novedades y de los próximos directos.';
      f.reset();
    });
  });

  /* ---------- vídeo bajo demanda ---------- */
  $$('.video button').forEach(function (b) {
    b.addEventListener('click', function () {
      var ifr = document.createElement('iframe');
      ifr.src = 'https://www.youtube-nocookie.com/embed/' + b.dataset.video + '?autoplay=1&rel=0';
      ifr.title = b.dataset.titulo; ifr.allow = 'autoplay; encrypted-media; picture-in-picture'; ifr.allowFullscreen = true;
      b.replaceWith(ifr);
    });
  });

  /* ---------- listado ---------- */
  var listado = $('#listado');
  if (listado) {
    var c = params.get('c') || 'todo', q = (params.get('q') || '').trim();
    var orden = params.get('orden') || 'recientes';
    var grupo = ER.GRUPOS[c] ? c : ER.GRUPO_DE[c] && ER.SUB[c] && ER.GRUPOS[ER.GRUPO_DE[c]].subs.length ? ER.GRUPO_DE[c] : null;
    var nombre, desc, lista;
    if (q) {
      var nq = ER.norm(q).split(/\s+/).filter(Boolean);
      lista = P.filter(function (p) { var h = ER.norm(p.t + ' ' + ER.SUB[p.c] + ' ' + (p.d || []).join(' ')); return nq.every(function (w) { return h.indexOf(w) >= 0; }); });
      nombre = 'Resultados para «' + q + '»'; desc = '';
      var campo = $('.buscador input'); if (campo) campo.value = q;
    } else if (ER.ESPECIALES[c]) {
      nombre = ER.ESPECIALES[c].n; desc = ER.ESPECIALES[c].d;
      lista = c === 'novedades' ? P.slice(0, 48) : c === 'promo' ? P.filter(function (p) { return p.r === 'Promo'; })
        : c === 'favoritos' ? favs.map(function (id) { return POR_ID[id]; }).filter(Boolean) : P.slice();
    } else if (ER.GRUPOS[c]) {
      nombre = ER.GRUPOS[c].n; desc = ER.GRUPOS[c].d; lista = P.filter(function (p) { return p.g === c; });
    } else if (ER.SUB[c]) {
      nombre = ER.SUB[c]; desc = ER.GRUPOS[ER.GRUPO_DE[c]].d; lista = P.filter(function (p) { return p.c === c; });
    } else { nombre = 'Toda la tienda'; desc = ER.ESPECIALES.todo.d; lista = P.slice(); c = 'todo'; }

    document.title = nombre + ' · Estilo Real by Carolina';
    $('#titulo-listado').textContent = nombre;
    $('#desc-listado').textContent = desc; $('#desc-listado').hidden = !desc;
    var migas = '<a href="index.html">Inicio</a>';
    if (grupo && grupo !== c) migas += ' / <a href="tienda.html?c=' + grupo + '">' + ER.GRUPOS[grupo].n + '</a>';
    $('#migas').innerHTML = migas + ' / <span aria-current="page">' + ER.esc(nombre) + '</span>';
    if (grupo) {
      $('#chips').innerHTML = '<a href="tienda.html?c=' + grupo + '"' + (c === grupo ? ' aria-current="page"' : '') + '>Todo</a>' +
        ER.GRUPOS[grupo].subs.map(function (s) {
          var n = P.filter(function (p) { return p.c === s; }).length;
          return n ? '<a href="tienda.html?c=' + s + '"' + (c === s ? ' aria-current="page"' : '') + '>' + ER.SUB[s] + '</a>' : '';
        }).join('');
    } else $('#chips').hidden = true;

    var sel = $('#orden'); sel.value = orden;
    sel.addEventListener('change', function () { params.set('orden', sel.value); history.replaceState(null, '', '?' + params.toString()); orden = sel.value; mostrados = POR_PAGINA; pintar(); });
    var POR_PAGINA = 24, mostrados = POR_PAGINA;
    var ordenar = function () {
      var l = lista.slice();
      if (orden === 'precio-asc') l.sort(function (a, b) { return a.p - b.p || b.f - a.f; });
      else if (orden === 'precio-desc') l.sort(function (a, b) { return b.p - a.p || b.f - a.f; });
      else if (c !== 'favoritos') l.sort(function (a, b) { return b.f - a.f; });
      return l;
    };
    var sizes = '(max-width: 760px) 46vw, (max-width: 1023px) 31vw, 300px';
    function pintar() {
      var l = ordenar();
      $('#resultados').textContent = l.length === 1 ? '1 producto' : l.length + ' productos';
      if (!l.length) {
        listado.innerHTML = '';
        $('#vacio').hidden = false;
        $('#vacio p').textContent = c === 'favoritos' && !q ? 'Todavía no has guardado nada. Pulsa el corazón de cualquier prenda para tenerla aquí.' : 'No hemos encontrado productos. Prueba con otra palabra o escríbenos por WhatsApp.';
      } else $('#vacio').hidden = true;
      listado.innerHTML = l.slice(0, mostrados).map(function (p) { return ER.tarjeta(p, sizes); }).join('');
      var mas = $('#mas');
      mas.hidden = l.length <= mostrados;
      $('#mas p').textContent = 'Has visto ' + Math.min(mostrados, l.length) + ' de ' + l.length;
      pintarFavs();
    }
    $('#mas button').addEventListener('click', function () {
      var antes = mostrados; mostrados += POR_PAGINA; pintar();
      var nuevo = $$('.tarjeta a', listado)[antes]; if (nuevo) nuevo.focus();
    });
    pintar();
  }

  /* ---------- ficha de producto ---------- */
  var ficha = $('#ficha');
  if (ficha) {
    var p = POR_ID[params.get('p')];
    if (!p) {
      ficha.innerHTML = '<div class="vacio" style="grid-column:1/-1"><h1 class="titulo">Producto no encontrado</h1><p>Puede que ya no esté a la venta.</p><a class="boton" href="tienda.html?c=novedades">Ver novedades</a></div>';
    } else montarFicha(p);
  }
  function montarFicha(p) {
    var grupo = p.g, sub = p.c;
    document.title = p.t + ' · ' + ER.euro(p.p) + ' · Estilo Real by Carolina';
    var md = $('meta[name=description]'); if (md) md.content = p.t + ' por ' + ER.euro(p.p) + '. ' + (p.d || []).join('. ');
    $('#migas').innerHTML = '<a href="index.html">Inicio</a> / <a href="tienda.html?c=' + grupo + '">' + ER.GRUPOS[grupo].n + '</a>' +
      (ER.GRUPOS[grupo].subs.length ? ' / <a href="tienda.html?c=' + sub + '">' + ER.SUB[sub] + '</a>' : '') + ' / <span aria-current="page">' + ER.esc(p.t) + '</span>';
    var varSel = params.get('color');
    var v0 = p.v ? (p.v.filter(function (x) { return x.n === varSel; })[0] || p.v[0]) : null;
    var LIMITE = 8;
    function galeria(primera) {
      var orden = p.i.map(function (f, k) { return k; });
      if (primera != null && primera > 0) { orden.splice(orden.indexOf(primera), 1); orden.unshift(primera); }
      var g = $('#galeria');
      g.innerHTML = orden.map(function (k, j) {
        return '<figure' + (j >= LIMITE ? ' class="oculta" hidden' : '') + '><img src="' + ER.img(p.i[k], 900) + '" srcset="' + [540, 720, 900, 1200].map(function (w) { return ER.img(p.i[k], w) + ' ' + w + 'w'; }).join(', ') +
          '" sizes="(max-width: 1023px) 78vw, 30vw" alt="' + ER.esc(p.t) + ' · foto ' + (j + 1) + ' de ' + p.i.length + '"' + (j > 1 ? ' loading="lazy"' : '') + '></figure>';
      }).join('') + (p.i.length > LIMITE ? '<div class="galeria-mas"><button type="button" class="boton claro">Ver todas las fotos (' + p.i.length + ')</button></div>' : '');
      var bm = $('.galeria-mas button', g);
      if (bm) bm.addEventListener('click', function () { $$('figure.oculta', g).forEach(function (f) { f.hidden = false; }); bm.parentNode.remove(); });
      // en móvil todas las fotos van en el carrusel
      if (matchMedia('(max-width: 1023px)').matches) $$('figure.oculta', g).forEach(function (f) { f.hidden = false; });
      g.scrollLeft = 0; contadorFotos();
    }
    function contadorFotos() {
      var g = $('#galeria'), cf = $('#contador-fotos');
      var w = g.firstElementChild ? g.firstElementChild.getBoundingClientRect().width + 6 : 1;
      cf.textContent = 'Foto ' + (Math.round(g.scrollLeft / w) + 1) + ' de ' + p.i.length;
    }
    $('#galeria').addEventListener('scroll', contadorFotos, { passive: true });
    galeria(v0 && v0.i);

    $('#nombre').textContent = p.t;
    $('#precio').textContent = ER.euro(p.p);
    var fav = $('#fav'); fav.setAttribute('data-fav', p.id);
    if (p.v && p.v.length) {
      var nom = p.on || 'Color';
      $('#opciones').innerHTML = '<fieldset class="opcion"><legend>' + ER.esc(nom) + ': <b id="valor-sel">' + ER.esc(v0.n) + '</b></legend><div class="valores">' +
        p.v.map(function (v, k) { return '<label><input type="radio" name="variante" value="' + ER.esc(v.n) + '"' + (v === v0 ? ' checked' : '') + '><span>' + ER.esc(v.n) + '</span></label>'; }).join('') + '</div></fieldset>';
      $$('#opciones input').forEach(function (r) {
        r.addEventListener('change', function () {
          var v = p.v.filter(function (x) { return x.n === r.value; })[0];
          $('#valor-sel').textContent = v.n;
          if (v.i != null) galeria(v.i);
          params.set('color', v.n); history.replaceState(null, '', '?' + params.toString());
          enlaceWA();
        });
      });
    }
    if (p.d) $('#detalles').innerHTML = p.d.map(function (x) { return '<li>' + ER.esc(x) + '</li>'; }).join('');
    else $('#detalles').hidden = true;
    var cant = 1, out = $('#cant');
    $('#menos').addEventListener('click', function () { cant = Math.max(1, cant - 1); out.textContent = cant; });
    $('#mas-uno').addEventListener('click', function () { cant = Math.min(20, cant + 1); out.textContent = cant; });
    function variante() { var r = $('#opciones input:checked'); return r ? r.value : ''; }
    $('#anadir').addEventListener('click', function () { anadir(p.id, variante(), cant); });
    function enlaceWA() {
      var t = 'Hola Carolina, me interesa esta prenda: ' + p.t + (variante() ? ' (' + variante() + ')' : '') + ', ' + ER.euro(p.p) + '.\n' + location.href.split('?')[0] + '?p=' + encodeURIComponent(p.id);
      $('#pedir-wa').href = 'https://wa.me/' + ER.WHATSAPP + '?text=' + encodeURIComponent(t);
    }
    enlaceWA();
    if (grupo !== 'ropa') $('#acc-tallas').remove();

    // completa tu look / relacionados (orden estable según el producto)
    var semilla = 0; for (var k = 0; k < p.id.length; k++) semilla = (semilla * 31 + p.id.charCodeAt(k)) >>> 0;
    function mezclar(arr) { var a = arr.slice(), s = semilla; for (var i = a.length - 1; i > 0; i--) { s = (s * 1103515245 + 12345) >>> 0; var j = s % (i + 1); var t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
    var look = grupo === 'ropa'
      ? ['bolsos', 'collares', 'panuelos', 'pendientes'].map(function (cat, i) { return mezclar(P.filter(function (x) { return x.c === cat; }).slice(0, 30))[i % 3]; })
      : mezclar(P.filter(function (x) { return x.g === 'ropa'; }).slice(0, 40)).slice(0, 4);
    var sizes = '(max-width: 760px) 46vw, (max-width: 1023px) 31vw, 300px';
    $('#look').innerHTML = look.filter(Boolean).map(function (x) { return ER.tarjeta(x, sizes); }).join('');
    var rel = mezclar(P.filter(function (x) { return x.c === sub && x.id !== p.id; })).slice(0, 12);
    if (rel.length < 4) rel = rel.concat(mezclar(P.filter(function (x) { return x.g === grupo && x.c !== sub; })).slice(0, 8 - rel.length));
    $('#relacionados').innerHTML = rel.map(function (x) { return ER.tarjeta(x, sizes); }).join('');
    $$('[data-carrusel]').forEach(function (s) { prepararCarrusel(s); if (s._estado) s._estado(); });
  }

  pintarFavs(); pintarBolsa();
})();
