// Menú, desplegables, carrito, formularios y galería
(function () {
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var WA = 'https://wa.me/34636017030';
  var eur = function (n) { return n.toFixed(2).replace('.', ',') + ' €'; };

  // capas (menú móvil y carrito)
  var ultimoFoco = null;
  function abrir(capa, boton) {
    ultimoFoco = boton || document.activeElement;
    capa.classList.add('on');
    if (boton) boton.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden';
    var f = $('button, a, input', capa.lastElementChild);
    if (f) f.focus();
  }
  function cerrar(capa) {
    capa.classList.remove('on');
    document.body.style.overflow = '';
    $$('[aria-controls="' + capa.id + '"]').forEach(function (b) { b.setAttribute('aria-expanded', 'false'); });
    if (ultimoFoco) ultimoFoco.focus();
  }
  $$('.mnav, .cart').forEach(function (capa) {
    $$('[data-close]', capa).forEach(function (b) { b.addEventListener('click', function () { cerrar(capa); }); });
  });
  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;
    $$('.mnav.on, .cart.on').forEach(cerrar);
    $$('.nav li.open').forEach(function (li) { li.classList.remove('open'); $('button', li).setAttribute('aria-expanded', 'false'); });
  });
  var bm = $('[data-mnav]');
  if (bm) bm.addEventListener('click', function () { abrir($('#mnav'), bm); });
  $$('.mnav-p a').forEach(function (a) { a.addEventListener('click', function () { cerrar($('#mnav')); }); });

  // desplegables de escritorio (clic y teclado)
  $$('.nav li > button').forEach(function (b) {
    b.addEventListener('click', function () {
      var li = b.parentNode, on = !li.classList.contains('open');
      $$('.nav li.open').forEach(function (x) { x.classList.remove('open'); $('button', x).setAttribute('aria-expanded', 'false'); });
      li.classList.toggle('open', on);
      b.setAttribute('aria-expanded', on ? 'true' : 'false');
    });
  });
  document.addEventListener('click', function (e) {
    if (!e.target.closest('.nav')) $$('.nav li.open').forEach(function (x) { x.classList.remove('open'); $('button', x).setAttribute('aria-expanded', 'false'); });
  });

  // aviso breve
  var tt;
  function aviso(t) {
    var el = $('#toast'); if (!el) return;
    el.textContent = t; el.classList.add('on');
    clearTimeout(tt); tt = setTimeout(function () { el.classList.remove('on'); }, 2600);
  }

  // carrito en el navegador
  var KEY = 'tp_carrito';
  function leer() { try { return JSON.parse(localStorage.getItem(KEY)) || []; } catch (e) { return []; } }
  function guardar(l) { try { localStorage.setItem(KEY, JSON.stringify(l)); } catch (e) { } pintar(); }
  function pintar() {
    var l = leer(), n = 0, tot = 0;
    l.forEach(function (i) { n += i.q; tot += i.q * i.pr; });
    $$('.cnt').forEach(function (c) { c.textContent = n; c.setAttribute('data-n', n); });
    var b = $('#cart-b'); if (!b) return;
    b.innerHTML = l.length ? l.map(function (i, k) {
      return '<div class="cart-i"><img src="' + encodeURI(i.img || '') + '" alt=""><div><a href="producto.html?p=' + i.s + '">' + i.n + '</a>' + (i.op ? '<small>' + i.op + '</small>' : '') + '<small>' + i.q + ' × ' + eur(i.pr) + '</small><button type="button" data-del="' + k + '">Quitar</button></div><b>' + eur(i.q * i.pr) + '</b></div>';
    }).join('') : '<p class="muted" style="padding:24px 0">Tu carrito está vacío.</p><a class="btn btn-s" href="tienda.html">Ir a la tienda</a>';
    $('#cart-tot').textContent = eur(tot);
    $('#cart-go').disabled = !l.length;
  }
  document.addEventListener('click', function (e) {
    var d = e.target.closest('[data-del]');
    if (d) { var l = leer(); l.splice(+d.getAttribute('data-del'), 1); guardar(l); }
  });
  $$('[data-cart]').forEach(function (b) { b.setAttribute('aria-controls', 'cart'); b.addEventListener('click', function () { abrir($('#cart'), b); }); });
  var go = $('#cart-go');
  if (go) go.addEventListener('click', function () {
    var l = leer(), tot = 0;
    var t = 'Hola, quiero hacer este pedido:\n' + l.map(function (i) { tot += i.q * i.pr; return '· ' + i.q + ' × ' + i.n + (i.op ? ' (' + i.op + ')' : '') + ' = ' + eur(i.q * i.pr); }).join('\n') + '\nTotal: ' + eur(tot);
    window.open(WA + '?text=' + encodeURIComponent(t), '_blank', 'noopener');
  });
  window.TP = {
    add: function (item) {
      var l = leer();
      var ya = l.find(function (i) { return i.s === item.s && i.op === item.op && i.pr === item.pr; });
      if (ya) ya.q += item.q; else l.push(item);
      guardar(l); aviso('Añadido al carrito: ' + item.n);
    },
    aviso: aviso, abrirCarrito: function () { abrir($('#cart')); }, eur: eur
  };
  pintar();

  // formularios de presupuesto (maqueta: valida y confirma)
  $$('form[data-form]').forEach(function (f) {
    f.addEventListener('submit', function (e) {
      e.preventDefault();
      var malos = $$('[required]', f).filter(function (i) { return i.type === 'checkbox' ? !i.checked : !i.value.trim(); });
      $$('[aria-invalid]', f).forEach(function (i) { i.removeAttribute('aria-invalid'); });
      if (malos.length) { malos.forEach(function (i) { i.setAttribute('aria-invalid', 'true'); }); malos[0].focus(); aviso('Revisa los campos obligatorios'); return; }
      $('.ok', f).classList.add('on');
      $$('input:not([type=checkbox]), textarea', f).forEach(function (i) { i.value = ''; });
      $$('input[type=checkbox]', f).forEach(function (i) { i.checked = false; });
    });
  });

  // filtros de la galería de trabajos
  $$('.filtros button').forEach(function (b) {
    b.addEventListener('click', function () {
      var f = b.getAttribute('data-f');
      $$('.filtros button').forEach(function (x) { x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); });
      $$('#gal figure').forEach(function (fig) { fig.hidden = f !== 'all' && fig.getAttribute('data-c') !== f; });
    });
  });
})();
