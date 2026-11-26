(function () {
  'use strict';
  var P = window.PRODUCTOS || [];
  var WA = 'https://wa.me/34628148337?text=';
  var POR_ID = {};
  P.forEach(function (p) { POR_ID[p.id] = p; });

  var CATS = {
    piston: { n: 'Compresores de pistón', img: '75-500-.jpg', sub: 'Monofásicos y trifásicos, de 6 a 500 litros. Para bricolaje, taller e industria.' },
    tornillo: { n: 'Compresores de tornillo', img: 'ECB-75-600x849-1.jpg', sub: 'Para trabajo continuo en taller e industria. Precio con instalación y legalización.' },
    impacto: { n: 'Llaves de impacto', img: 'DP3450-1.jpg', sub: 'Paoli, HNS e Ingersoll Rand, de 1/2" a 1".' },
    filtros: { n: 'Filtros y separadores', icon: 'filtro', sub: 'Filtros de aire, de aceite y separadores para compresores de tornillo. Busca por referencia.' },
    racordaje: { n: 'Racordaje', img: 'STRAIGHT-MALE-WITH-INTERNAL-HEX-SWIFTFIT-fullWidthDesktop.jpg', sub: 'Racores Aignep para redes de aire comprimido.' },
    gatos: { n: 'Gatos oleoneumáticos', img: 'yak-135-2.jpg', sub: 'Gatos Cattini para taller de vehículo pesado.' },
    tratamiento: { n: 'Tratamiento de aire', img: 'WhatsApp-Image-2026-06-30-at-07.48.56.jpeg', sub: 'Secadores, separadores de agua y purgas automáticas.' },
    mangueras: { n: 'Mangueras y espirales', img: '1Espirales2.jpg', sub: 'Mangueras industriales, espirales y tubo de poliuretano.' },
    soplar: { n: 'Pistolas y kits de aire', img: 'kit-llaves-neumaticas.jpg', sub: 'Pistolas de soplar y kits de herramientas neumáticas.' },
    enchufes: { n: 'Enchufes rápidos', img: '2Enchufe-rapido-1.jpg', sub: 'Enchufes y boquillas ISO 6150B.' },
    recambios: { n: 'Válvulas y presostatos', icon: 'manometro', sub: 'Válvulas antirretorno, válvulas de arranque y presostatos.' }
  };
  var ORDEN_CAT = ['piston', 'tornillo', 'impacto', 'gatos', 'tratamiento', 'mangueras', 'soplar', 'enchufes', 'racordaje', 'recambios', 'filtros'];
  var ICON = {
    carro: '<circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/>',
    chat: '<path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/>',
    filtro: '<path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z"/>',
    manometro: '<path d="m12 14 4-4"/><path d="M3.34 19a10 10 0 1 1 17.32 0"/>',
    caja: '<path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/>',
    check: '<path d="M20 6 9 17l-5-5"/>',
    llave: '<path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>',
    doc: '<path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><path d="M14 2v6h6"/><path d="m9 15 2 2 4-4"/>',
    tel: '<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>',
    calendario: '<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>'
  };
  function ico(n, cls) { return '<svg class="' + (cls || 'icono') + '" viewBox="0 0 24 24" aria-hidden="true" focusable="false">' + ICON[n] + '</svg>'; }
  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function eur(n) {
    var s = n.toFixed(2).split('.');
    s[0] = s[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    return s[0] + ',' + s[1] + ' €';
  }
  function src(f) { return 'img/p/' + encodeURIComponent(f); }
  function norm(s) { return String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, ''); }
  function $(s, c) { return (c || document).querySelector(s); }
  function $$(s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); }
  function num(n) { return String(n).replace('.', ','); }

  function chips(p) {
    if (!p.s) return '';
    var c = [];
    if (p.s.hp) c.push(num(p.s.hp) + ' HP');
    if (p.s.l) c.push(p.s.l + ' L');
    if (p.s.bar) c.push(p.s.bar + ' bar');
    if (p.s.fase) c.push(/Trif/.test(p.s.fase) ? 'Trifásico' : 'Monofásico');
    return '<div class="chips">' + c.map(function (x) { return '<span class="chip">' + x + '</span>'; }).join('') + '</div>';
  }
  function imgHTML(p, cls) {
    if (p.i && p.i.length) return '<img loading="lazy" src="' + src(p.i[0]) + '" alt="' + esc(p.n) + '"' + (cls ? ' class="' + cls + '"' : '') + '>';
    var c = CATS[p.c] || {};
    return ico(c.icon || 'caja');
  }
  function tarjeta(p) {
    var url = 'producto.html?id=' + p.id;
    var oferta = p.o ? '<span class="etiqueta-oferta">-' + Math.round((1 - p.p / p.o) * 100) + '%</span>' : '';
    var precio, boton;
    if (p.p) {
      precio = '<div class="precio">' + (p.o ? '<del>' + eur(p.o) + '</del>' : '') + eur(p.p) + '<small>IVA incluido</small></div>';
      boton = '<button class="prod__add" type="button" data-add="' + p.id + '" aria-label="Añadir ' + esc(p.n) + ' al carrito">' + ico('carro') + '</button>';
    } else {
      precio = '<div class="precio precio--consulta">Consultar precio<small>Con instalación</small></div>';
      boton = '<a class="prod__add" href="' + WA + encodeURIComponent('Hola, quiero precio del ' + p.n + '.') + '" aria-label="Pedir precio de ' + esc(p.n) + ' por WhatsApp">' + ico('chat') + '</a>';
    }
    return '<article class="prod">' +
      '<a class="prod__img" href="' + url + '" tabindex="-1" aria-hidden="true">' + oferta + imgHTML(p) + '</a>' +
      '<div class="prod__cuerpo"><span class="prod__marca">' + esc(p.b || (CATS[p.c] || {}).n || '') + '</span>' +
      '<a class="prod__nombre" href="' + url + '">' + esc(p.n) + '</a>' + chips(p) +
      '<div class="prod__pie">' + precio + boton + '</div></div></article>';
  }

  /* ---------- Menú móvil ---------- */
  var menuBtn = $('.menu-btn'), nav = $('#nav');
  if (menuBtn) menuBtn.addEventListener('click', function () {
    var abierto = nav.getAttribute('data-abierto') === 'true';
    nav.setAttribute('data-abierto', String(!abierto));
    menuBtn.setAttribute('aria-expanded', String(!abierto));
    menuBtn.setAttribute('aria-label', abierto ? 'Abrir menú' : 'Cerrar menú');
  });
  $$('#nav a').forEach(function (a) { a.addEventListener('click', function () { nav.setAttribute('data-abierto', 'false'); if (menuBtn) menuBtn.setAttribute('aria-expanded', 'false'); }); });

  /* ---------- Carrito ---------- */
  var CLAVE = 'alfaro_carrito';
  function leer() { try { return JSON.parse(localStorage.getItem(CLAVE)) || {}; } catch (e) { return {}; } }
  var carrito = leer();
  function guardar() { try { localStorage.setItem(CLAVE, JSON.stringify(carrito)); } catch (e) { } pintarCarrito(); }
  var panel = $('#carrito'), velo = $('[data-velo]'), ultimoFoco = null;
  function pintarCarrito() {
    var ids = Object.keys(carrito).filter(function (id) { return POR_ID[id] && carrito[id] > 0; });
    var unidades = 0, total = 0;
    ids.forEach(function (id) { unidades += carrito[id]; total += carrito[id] * POR_ID[id].p; });
    $$('[data-contador]').forEach(function (c) { c.textContent = unidades; c.hidden = unidades === 0; });
    var lista = $('[data-lista-carrito]');
    if (!lista) return;
    lista.innerHTML = ids.length ? ids.map(function (id) {
      var p = POR_ID[id];
      return '<li class="linea">' + (p.i ? '<img src="' + src(p.i[0]) + '" alt="">' : '<span></span>') +
        '<div><div class="linea__n">' + esc(p.n) + '</div><div class="linea__c"><button type="button" data-menos="' + id + '" aria-label="Quitar una unidad">−</button><span aria-label="Cantidad">' + carrito[id] + '</span><button type="button" data-mas-uno="' + id + '" aria-label="Añadir una unidad">+</button></div></div>' +
        '<div class="linea__p">' + eur(p.p * carrito[id]) + '</div></li>';
    }).join('') : '<li style="padding:30px 0;text-align:center;color:var(--gris-6)">Tu carrito está vacío.</li>';
    $('[data-total]').textContent = eur(total);
    var texto = 'Hola, quiero hacer este pedido:\n' + ids.map(function (id) { return '- ' + carrito[id] + ' x ' + POR_ID[id].n + ' (' + eur(POR_ID[id].p) + ')'; }).join('\n') + '\nTotal: ' + eur(total);
    var ped = $('[data-pedido]');
    ped.href = ids.length ? WA + encodeURIComponent(texto) : 'tienda.html';
    ped.textContent = ids.length ? 'Tramitar pedido' : 'Ir a la tienda';
  }
  function abrirCarrito() {
    ultimoFoco = document.activeElement;
    panel.setAttribute('data-abierto', 'true'); panel.setAttribute('aria-hidden', 'false'); velo.hidden = false;
    $('[data-cerrar-carrito]').focus();
  }
  function cerrarCarrito() {
    panel.setAttribute('data-abierto', 'false'); panel.setAttribute('aria-hidden', 'true'); velo.hidden = true;
    if (ultimoFoco) ultimoFoco.focus();
  }
  var avisoT;
  function aviso(t) {
    var a = $('[data-aviso]'); a.textContent = t; a.hidden = false;
    clearTimeout(avisoT); avisoT = setTimeout(function () { a.hidden = true; }, 2600);
  }
  function anadir(id, n) {
    carrito[id] = (carrito[id] || 0) + (n || 1); guardar();
    aviso('Añadido al carrito: ' + POR_ID[id].n);
  }
  document.addEventListener('click', function (e) {
    var t = e.target.closest('[data-add],[data-abrir-carrito],[data-cerrar-carrito],[data-velo],[data-menos],[data-mas-uno]');
    if (!t) return;
    if (t.hasAttribute('data-add')) anadir(t.getAttribute('data-add'));
    else if (t.hasAttribute('data-abrir-carrito')) abrirCarrito();
    else if (t.hasAttribute('data-cerrar-carrito') || t.hasAttribute('data-velo')) cerrarCarrito();
    else if (t.hasAttribute('data-menos')) { var a = t.getAttribute('data-menos'); carrito[a] = Math.max(0, carrito[a] - 1); if (!carrito[a]) delete carrito[a]; guardar(); }
    else if (t.hasAttribute('data-mas-uno')) { var b = t.getAttribute('data-mas-uno'); carrito[b] += 1; guardar(); }
  });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && panel && panel.getAttribute('data-abierto') === 'true') cerrarCarrito(); });
  pintarCarrito();

  /* ---------- Formularios a WhatsApp ---------- */
  $$('[data-form-wa]').forEach(function (f) {
    f.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!f.reportValidity()) return;
      var d = new FormData(f);
      var txt = 'Hola, soy ' + d.get('nombre') + ' (tel. ' + d.get('telefono') + ').\n' + d.get('tipo') + ' en ' + d.get('provincia') + '.' + (d.get('mensaje') ? '\n' + d.get('mensaje') : '');
      window.open(WA + encodeURIComponent(txt), '_blank', 'noopener');
    });
  });

  /* ---------- Inicio: categorías y destacados ---------- */
  var cont = {};
  P.forEach(function (p) { cont[p.c] = (cont[p.c] || 0) + 1; });
  var gridCat = $('[data-categorias]');
  if (gridCat) {
    gridCat.innerHTML = ['piston', 'tornillo', 'impacto', 'filtros', 'racordaje', 'gatos', 'tratamiento', 'mangueras'].map(function (k) {
      var c = CATS[k];
      return '<a class="cat" href="tienda.html?cat=' + k + '"><span class="cat__img">' + (c.img ? '<img loading="lazy" src="' + src(c.img) + '" alt="">' : ico(c.icon)) + '</span>' +
        '<span class="cat__txt"><strong>' + c.n + '</strong><span>' + (k === 'tornillo' ? '3 series' : cont[k] + ' productos') + '</span></span></a>';
    }).join('');
  }
  $$('[data-destacados]').forEach(function (g) {
    g.innerHTML = g.getAttribute('data-destacados').split(',').map(function (id) { return POR_ID[id] ? tarjeta(POR_ID[id]) : ''; }).join('');
  });

  /* ---------- Tienda ---------- */
  var rejilla = $('[data-rejilla-tienda]');
  if (rejilla) {
    var qs = new URLSearchParams(location.search);
    var st = { cat: CATS[qs.get('cat')] ? qs.get('cat') : '', q: qs.get('q') || '', fase: [], litros: [], orden: 'rel', limite: 24 };
    var inputQ = $('#q-tienda'); inputQ.value = st.q;
    var listaCat = $('[data-lista-cat]');
    function pintarCats() {
      var items = [['', 'Todo el catálogo', P.length]].concat(ORDEN_CAT.map(function (k) { return [k, CATS[k].n, cont[k] || 0]; }));
      listaCat.innerHTML = items.map(function (it) {
        return '<li><button type="button" data-cat="' + it[0] + '" aria-pressed="' + (st.cat === it[0]) + '">' + it[1] + ' <span>' + it[2] + '</span></button></li>';
      }).join('');
      $$('[data-solo-piston]').forEach(function (b) { b.hidden = st.cat !== 'piston'; });
    }
    function filtrar() {
      var q = norm(st.q);
      var r = P.filter(function (p) {
        if (st.cat && p.c !== st.cat) return false;
        if (q && norm(p.n + ' ' + p.b + ' ' + (CATS[p.c] || {}).n).indexOf(q) < 0) return false;
        if (st.cat === 'piston') {
          if (st.fase.length && st.fase.indexOf(p.f) < 0) return false;
          if (st.litros.length && !st.litros.some(function (rg) { var a = rg.split('-'); return p.s && p.s.l >= +a[0] && p.s.l <= +a[1]; })) return false;
        }
        return true;
      });
      if (st.orden === 'asc') r.sort(function (a, b) { return (a.p || 1e9) - (b.p || 1e9); });
      else if (st.orden === 'desc') r.sort(function (a, b) { return b.p - a.p; });
      else if (st.orden === 'az') r.sort(function (a, b) { return a.n.localeCompare(b.n, 'es'); });
      else r.sort(function (a, b) { return ORDEN_CAT.indexOf(a.c) - ORDEN_CAT.indexOf(b.c) || (b.p - a.p); });
      return r;
    }
    function pintar() {
      var r = filtrar();
      var vis = r.slice(0, st.limite);
      rejilla.innerHTML = vis.length ? vis.map(tarjeta).join('') :
        '<div class="vacio"><h2 style="font-size:28px">No encontramos «' + esc(st.q) + '»</h2><p>Puede que lo tengamos aunque no esté en la web. Pregúntanos por la referencia.</p><a class="boton boton--prim" href="' + WA + encodeURIComponent('Hola, ¿tenéis ' + st.q + '?') + '">' + ico('chat') + ' Preguntar por WhatsApp</a></div>';
      $('[data-resultado]').textContent = r.length ? 'Mostrando ' + vis.length + ' de ' + r.length + ' productos' : '';
      $('[data-mas]').hidden = r.length <= st.limite;
      var c = CATS[st.cat];
      $('[data-titulo-tienda]').textContent = st.q ? 'Resultados para «' + st.q + '»' : (c ? c.n : 'Tienda de aire comprimido');
      $('[data-sub-tienda]').textContent = c ? c.sub : 'Compresores, herramientas neumáticas, racordaje y recambios. Precios con IVA incluido.';
      document.title = (c ? c.n : 'Tienda de compresores, herramientas neumáticas y recambios') + ' | Compresores Alfaro';
      var u = new URLSearchParams(); if (st.cat) u.set('cat', st.cat); if (st.q) u.set('q', st.q);
      history.replaceState(null, '', location.pathname + (u.toString() ? '?' + u : ''));
    }
    listaCat.addEventListener('click', function (e) {
      var b = e.target.closest('[data-cat]'); if (!b) return;
      st.cat = b.getAttribute('data-cat'); st.fase = []; st.litros = []; st.limite = 24;
      $$('.opcion').forEach(function (o) { o.setAttribute('aria-pressed', 'false'); });
      pintarCats(); pintar();
    });
    $$('[data-filtro]').forEach(function (g) {
      g.addEventListener('click', function (e) {
        var b = e.target.closest('.opcion'); if (!b) return;
        var on = b.getAttribute('aria-pressed') !== 'true'; b.setAttribute('aria-pressed', String(on));
        var arr = st[g.getAttribute('data-filtro')], v = b.getAttribute('data-v');
        if (on) arr.push(v); else arr.splice(arr.indexOf(v), 1);
        pintar();
      });
    });
    $('[data-buscador-tienda]').addEventListener('submit', function (e) { e.preventDefault(); st.q = inputQ.value.trim(); st.limite = 24; pintar(); });
    inputQ.addEventListener('input', function () { st.q = inputQ.value.trim(); st.limite = 24; pintar(); });
    $('[data-orden]').addEventListener('change', function (e) { st.orden = e.target.value; pintar(); });
    $('[data-mas]').addEventListener('click', function () { st.limite += 24; pintar(); });
    var bf = $('.btn-filtros'), fl = $('#filtros');
    bf.addEventListener('click', function () { var a = fl.getAttribute('data-abierto') === 'true'; fl.setAttribute('data-abierto', String(!a)); bf.setAttribute('aria-expanded', String(!a)); });
    pintarCats(); pintar();
  }

  /* ---------- Ficha de producto ---------- */
  var ficha = $('[data-ficha]');
  if (ficha) {
    var id = new URLSearchParams(location.search).get('id') || '4886';
    var p = POR_ID[id] || POR_ID[4886];
    var cat = CATS[p.c];
    document.title = p.n + ' | Compresores Alfaro';
    $('[data-migas]').insertAdjacentHTML('beforeend', '<li><a href="tienda.html?cat=' + p.c + '">' + cat.n + '</a></li><li aria-current="page">' + esc(p.n) + '</li>');
    var fotos = p.i || [];
    var galeria = '<div class="galeria"><div class="galeria__principal">' + (fotos.length ? '<img data-foto src="' + src(fotos[0]) + '" alt="' + esc(p.n) + '">' : ico(cat.icon || 'caja')) + '</div>' +
      (fotos.length > 1 ? '<div class="galeria__miniaturas">' + fotos.map(function (f, i) { return '<button type="button" data-mini="' + f + '" aria-label="Ver foto ' + (i + 1) + '" aria-current="' + (i === 0) + '"><img src="' + src(f) + '" alt=""></button>'; }).join('') + '</div>' : '') + '</div>';
    var precio = p.p ?
      '<div class="ficha__precio"><span class="precio">' + eur(p.p) + '</span>' + (p.o ? '<del>' + eur(p.o) + '</del><span class="etiqueta-oferta" style="position:static">-' + Math.round((1 - p.p / p.o) * 100) + '%</span>' : '') + '</div>' +
      '<p class="ficha__iva">IVA incluido · ' + eur(p.p / 1.21) + ' sin IVA</p>' +
      '<div class="comprar"><div class="cantidad"><button type="button" data-cant="-1" aria-label="Menos">−</button><input type="number" min="1" value="1" aria-label="Cantidad" data-cantidad><button type="button" data-cant="1" aria-label="Más">+</button></div>' +
      '<button class="boton boton--prim" type="button" data-add-ficha>' + ico('carro') + ' Añadir al carrito</button></div>' +
      '<a class="boton boton--sec boton--ancho" href="' + WA + encodeURIComponent('Hola, tengo una duda sobre el ' + p.n + '.') + '">' + ico('chat') + ' Preguntar por WhatsApp</a>'
      : '<div class="ficha__precio"><span class="precio precio--consulta" style="font-size:34px">Consultar precio</span></div><p class="ficha__iva">Te damos precio con instalación y, si hace falta, legalización.</p>' +
      '<a class="boton boton--prim boton--ancho" href="' + WA + encodeURIComponent('Hola, quiero precio del ' + p.n + '.') + '">' + ico('chat') + ' Pedir precio por WhatsApp</a>';
    var ventajas = p.c === 'piston' || p.c === 'tornillo' ?
      ['<strong>Te lo instalamos</strong> y, si tu equipo lo necesita, tramitamos la legalización ante Industria.', '<strong>Servicio técnico propio</strong> para el mantenimiento y las reparaciones.', '<strong>¿No sabes qué potencia necesitas?</strong> Llámanos al <a href="tel:+34628148337">628 14 83 37</a> y te asesoramos.'] :
      ['<strong>¿No encuentras la medida?</strong> Pregúntanos, tenemos más referencias en almacén.', '<strong>Servicio técnico propio</strong> en Albacete para revisiones y reparaciones.', '<strong>Asesoramiento por teléfono</strong> en el <a href="tel:+34628148337">628 14 83 37</a>.'];
    ficha.innerHTML = galeria + '<div><span class="prod__marca">' + esc(p.b || cat.n) + '</span><h1>' + esc(p.n) + '</h1>' + chips(p) +
      (p.d ? '<p style="color:var(--gris-7);margin-top:12px">' + esc(p.d) + '</p>' : '') + precio +
      '<ul class="ventajas">' + ventajas.map(function (v, i) { return '<li>' + ico(['llave', 'doc', 'tel'][i]) + '<span>' + v + '</span></li>'; }).join('') + '</ul></div>';
    $$('[data-mini]').forEach(function (b) {
      b.addEventListener('click', function () {
        $('[data-foto]').src = src(b.getAttribute('data-mini'));
        $$('[data-mini]').forEach(function (x) { x.setAttribute('aria-current', String(x === b)); });
      });
    });
    var cantidad = $('[data-cantidad]');
    $$('[data-cant]').forEach(function (b) { b.addEventListener('click', function () { cantidad.value = Math.max(1, (+cantidad.value || 1) + +b.getAttribute('data-cant')); }); });
    var addF = $('[data-add-ficha]');
    if (addF) addF.addEventListener('click', function () { anadir(String(p.id), Math.max(1, +cantidad.value || 1)); });

    var filas = [];
    if (p.b) filas.push(['Marca', p.b]);
    if (p.s) {
      if (p.s.hp) filas.push(['Potencia', num(p.s.hp) + ' HP' + (p.s.kw ? ' (' + p.s.kw + ' kW)' : '')]);
      if (p.s.fase) filas.push(['Alimentación', p.s.fase]);
      if (p.s.l) filas.push(['Calderín', p.s.l + ' litros']);
      if (p.s.bar) filas.push(['Presión máxima', p.s.bar + ' bar']);
      if (p.s.lmin) filas.push(['Aire aspirado', p.s.lmin + ' l/min']);
      if (p.s.peso) filas.push(['Peso', p.s.peso]);
      if (p.s.medidas) filas.push(['Medidas', p.s.medidas]);
      if (p.s.uso) filas.push(['Uso recomendado', p.s.uso]);
      if (p.s.extra) filas.push(['Características', p.s.extra]);
    }
    filas.push(['Categoría', cat.n]);
    var tabla = '<table class="tabla-specs"><caption class="visually-hidden">Características técnicas</caption><tbody>' + filas.map(function (f) { return '<tr><th scope="row">' + f[0] + '</th><td>' + esc(f[1]) + '</td></tr>'; }).join('') + '</tbody></table>';
    var guia = p.c === 'piston' ?
      '<div class="guia"><h3>¿Qué compresor necesito?</h3><dl><dt>Hasta 50 litros</dt><dd>Bricolaje, inflado, soplado y una herramienta a la vez.</dd><dt>100 litros</dt><dd>Taller pequeño, pintura y herramientas de uso intermitente.</dd><dt>200 a 270 litros</dt><dd>Taller profesional con varias herramientas.</dd><dt>500 litros trifásico</dt><dd>Uso continuo e industria.</dd></dl><p style="font-size:14.5px;color:var(--gris-6);margin:0">Orientativo. Si nos dices qué herramientas usas, te decimos el modelo exacto.</p></div>'
      : '<div class="guia"><h3>¿Necesitas ayuda?</h3><p>Dinos qué equipo tienes y te confirmamos que esta pieza le vale antes de comprarla.</p><a class="boton boton--prim" href="' + WA + encodeURIComponent('Hola, ¿me vale el ' + p.n + ' para mi equipo?') + '">' + ico('chat') + ' Preguntar por WhatsApp</a></div>';
    $('[data-bloques]').innerHTML = '<section aria-labelledby="h-specs"><h2 id="h-specs" style="font-size:32px">Características</h2>' + tabla + '</section>' + guia;
    var rel = P.filter(function (x) { return x.c === p.c && x.id !== p.id; }).sort(function (a, b) { return Math.abs(a.p - p.p) - Math.abs(b.p - p.p); }).slice(0, 4);
    $('[data-relacionados]').innerHTML = rel.map(tarjeta).join('');
  }
})();
