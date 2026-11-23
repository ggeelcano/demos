(function () {
  'use strict';
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };

  // Menú móvil
  var burger = $('.burger'), nav = $('#nav');
  function cerrarMenu() { nav.classList.remove('abierto'); burger.setAttribute('aria-expanded', 'false'); burger.setAttribute('aria-label', 'Abrir menú'); }
  burger.addEventListener('click', function () {
    var abrir = burger.getAttribute('aria-expanded') !== 'true';
    nav.classList.toggle('abierto', abrir);
    burger.setAttribute('aria-expanded', String(abrir));
    burger.setAttribute('aria-label', abrir ? 'Cerrar menú' : 'Abrir menú');
  });

  // Desplegable "Soluciones"
  var dropBtn = $('.nav__btn');
  function cerrarDrop() { dropBtn.setAttribute('aria-expanded', 'false'); }
  dropBtn.addEventListener('click', function (e) {
    e.stopPropagation();
    dropBtn.setAttribute('aria-expanded', String(dropBtn.getAttribute('aria-expanded') !== 'true'));
  });
  document.addEventListener('click', function (e) { if (!e.target.closest('.nav__item--drop')) cerrarDrop(); });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
      if (dropBtn.getAttribute('aria-expanded') === 'true') { cerrarDrop(); dropBtn.focus(); }
      else if (nav.classList.contains('abierto')) { cerrarMenu(); burger.focus(); }
    }
  });
  // Cualquier enlace del menú cierra menú y desplegable
  $$('#nav a').forEach(function (a) { a.addEventListener('click', function () { cerrarDrop(); cerrarMenu(); }); });

  // Enlaces que preseleccionan el tipo de proyecto del formulario
  var tipo = $('#f-tipo');
  $$('[data-tipo]').forEach(function (a) {
    a.addEventListener('click', function () {
      var v = a.getAttribute('data-tipo');
      for (var i = 0; i < tipo.options.length; i++) if (tipo.options[i].text === v) tipo.selectedIndex = i;
    });
  });

  // Ver más salas
  var vermas = $('#vermas');
  vermas.addEventListener('click', function () {
    var abrir = vermas.getAttribute('aria-expanded') !== 'true';
    $$('.proys__mas').forEach(function (li) { li.hidden = !abrir; });
    vermas.setAttribute('aria-expanded', String(abrir));
    vermas.innerHTML = abrir ? 'Ver menos salas' : 'Ver más salas <span aria-hidden="true">→</span>';
    if (abrir) { var b = $('.proys__mas .proy'); if (b) b.focus(); }
  });

  // Visor de fotos
  var lb = $('#lb'), lbImg = $('#lb-img'), lbTxt = $('#lb-txt'), ultimo = null;
  $$('.proy').forEach(function (b) {
    b.addEventListener('click', function () {
      var img = $('img', b);
      ultimo = b;
      lbImg.src = b.getAttribute('data-full');
      lbImg.alt = img.alt;
      lbTxt.textContent = $('.proy__t', b).textContent;
      if (lb.showModal) lb.showModal(); else lb.setAttribute('open', '');
    });
  });
  function cerrarLb() { if (lb.close) lb.close(); else lb.removeAttribute('open'); }
  $('.lb__x').addEventListener('click', cerrarLb);
  lb.addEventListener('click', function (e) { if (e.target === lb) cerrarLb(); });
  lb.addEventListener('close', function () { if (ultimo) ultimo.focus(); });

  // Formulario: valida y abre el correo con el mensaje preparado
  var form = $('#form'), estado = $('#estado');
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var malos = [];
    $$('[required]', form).forEach(function (el) {
      var ok = el.type === 'checkbox' ? el.checked : el.value.trim() !== '' && (el.type !== 'email' || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(el.value.trim()));
      el.setAttribute('aria-invalid', ok ? 'false' : 'true');
      if (!ok) malos.push(el);
    });
    if (malos.length) {
      estado.className = 'form__estado err';
      estado.textContent = 'Revise los campos marcados: faltan datos obligatorios o el correo no es válido.';
      malos[0].focus();
      return;
    }
    var d = new FormData(form);
    var cuerpo = 'Nombre: ' + d.get('nombre') + '\nCentro o empresa: ' + (d.get('centro') || '-') +
      '\nCorreo: ' + d.get('email') + '\nTeléfono: ' + (d.get('tel') || '-') +
      '\nTipo de proyecto: ' + d.get('tipo') + '\nFabricante del equipo: ' + d.get('marca') +
      '\n\n' + d.get('mensaje');
    location.href = 'mailto:proysa@proysa.com?subject=' + encodeURIComponent('Consulta web: ' + d.get('tipo')) + '&body=' + encodeURIComponent(cuerpo);
    estado.className = 'form__estado ok';
    estado.textContent = 'Gracias. Se ha abierto su programa de correo con la consulta preparada; solo tiene que enviarla.';
  });
  $$('[required]', form).forEach(function (el) {
    el.addEventListener('input', function () { if (el.getAttribute('aria-invalid') === 'true') el.setAttribute('aria-invalid', 'false'); });
    el.addEventListener('change', function () { if (el.getAttribute('aria-invalid') === 'true') el.setAttribute('aria-invalid', 'false'); });
  });
})();
