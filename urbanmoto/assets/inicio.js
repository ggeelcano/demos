/* Urbanmoto · portada */
(() => {
  'use strict';
  const { D, $, $$, esc, ico, tarjeta, carruseles, enCat, reducido } = window.UM;
  const conStock = p => p.s > 0;

  // Carruseles de producto
  const novedades = D.prods.filter(conStock).sort((a, b) => b.f.localeCompare(a.f) || b.id - a.id).slice(0, 16);
  $('#car-novedades').innerHTML = novedades.map(tarjeta).join('');
  const minarelli = D.prods.filter(p => conStock(p) && (p.m.includes('m0') || p.m.includes('m2')))
    .sort((a, b) => (b.m.includes('m0') - a.m.includes('m0')) || b.p - a.p).slice(0, 16);
  $('#car-minarelli').innerHTML = minarelli.map(tarjeta).join('');
  // pit bike y minimoto intercalados, de más caro a más barato para que se vean las piezas gordas primero
  const pit = D.prods.filter(p => conStock(p) && enCat(p, 76)).sort((a, b) => b.p - a.p);
  const mini = D.prods.filter(p => conStock(p) && enCat(p, 77) && !enCat(p, 76)).sort((a, b) => b.p - a.p);
  const mezcla = []; for (let i = 0; mezcla.length < 16 && (i < pit.length || i < mini.length); i++) { if (pit[i]) mezcla.push(pit[i]); if (mini[i]) mezcla.push(mini[i]); }
  $('#car-pit').innerHTML = mezcla.slice(0, 16).map(tarjeta).join('');
  $('#n-stock-total').textContent = D.prods.filter(conStock).length;
  carruseles();
  document.addEventListener('um:moto', () => {
    $('#car-novedades').innerHTML = novedades.map(tarjeta).join('');
    $('#car-minarelli').innerHTML = minarelli.map(tarjeta).join('');
    $('#car-pit').innerHTML = mezcla.slice(0, 16).map(tarjeta).join('');
  });

  // Opiniones reales (Wallapop, 30-sep a 6-oct de 2026)
  const OPINIONES = [
    ['Envío super rápido y super bien empaquetado 10/10', 'Antonio S.', '1 oct 2026', 'kit cilindro 74cc AM6 y carburador 24 Keihin'],
    ['Todo perfecto y envío muy rápido.', 'Jose Luis J.', '2 oct 2026', 'encendido Minarelli AM6'],
    ['Excelente vendedor, muy recomendable', 'Gondemar', '30 sep 2026', 'filtro de aire de espuma corto 50mm PWK'],
    ['Todo perfecto 👌 recomendable.', 'German H.', '30 sep 2026', 'carburador 21mm hembra PHBG'],
    ['Perfecto, todo ok!! Gracias', 'Barba Negra', '30 sep 2026', 'bomba de agua Minarelli horizontal'],
    ['Todo correcto y rapido', 'Jose V.', '6 oct 2026', 'kit 10 chicles de baja Dellorto PHBG'],
  ];
  const estrellas = '<p class="estrellas" role="img" aria-label="5 de 5 estrellas">' + ico('estrella').repeat(5) + '</p>';
  $('#opiniones').innerHTML = OPINIONES.map(([t, quien, cuando, que]) => `<article class="opinion">${estrellas}<blockquote>«${esc(t)}»</blockquote><p class="compra">Compró: ${esc(que)}</p><p class="firma">${esc(quien)} <span>${cuando}</span></p></article>`).join('');

  // Busca por tu moto
  const marca = $('#fm-marca'), modelo = $('#fm-modelo');
  marca.innerHTML += D.motos.map((m, i) => `<option value="${i}">${esc(m.marca)}</option>`).join('');
  marca.addEventListener('change', () => {
    const m = D.motos[marca.value];
    modelo.innerHTML = m ? '<option value="">Elige el modelo</option>' + m.modelos.map(x => `<option value="${x.k}">${esc(x.n)} (${x.c} ${x.c === 1 ? 'pieza' : 'piezas'})</option>`).join('') : '<option value="">Primero elige la marca</option>';
    modelo.disabled = !m;
    if (m && m.modelos.length === 1) modelo.value = m.modelos[0].k;
  });
  $('#form-moto').addEventListener('submit', e => {
    e.preventDefault();
    if (!modelo.value) { $('#fm-error').hidden = false; (marca.value ? modelo : marca).focus(); return; }
    window.UM.ponMoto(modelo.value);
    location.href = 'tienda.html?moto=' + encodeURIComponent(modelo.value);
  });
  $('#fm-motores').innerHTML = D.motores.map(x => `<a class="ficha" href="tienda.html?moto=${x.k}">${esc(x.n)} <span>(${x.c})</span></a>`).join('');

  // Slider de portada
  const slider = $('#slider');
  const slides = $$('.slide', slider), puntos = $$('.slider-puntos button', slider);
  let actual = 0, temporizador = null, parado = false;
  const ir = n => {
    actual = (n + slides.length) % slides.length;
    slides.forEach((s, i) => s.classList.toggle('activo', i === actual));
    puntos.forEach((p, i) => p.setAttribute('aria-current', String(i === actual)));
  };
  const para = () => { clearInterval(temporizador); temporizador = null; };
  const sigue = () => { if (!parado && !reducido && !temporizador) temporizador = setInterval(() => ir(actual + 1), 6500); };
  $('.slider-flecha.ant', slider).addEventListener('click', () => { parado = true; para(); ir(actual - 1); });
  $('.slider-flecha.sig', slider).addEventListener('click', () => { parado = true; para(); ir(actual + 1); });
  puntos.forEach((p, i) => p.addEventListener('click', () => { parado = true; para(); ir(i); }));
  slider.addEventListener('mouseenter', para); slider.addEventListener('mouseleave', sigue);
  slider.addEventListener('focusin', para);
  let x0 = null;
  slider.addEventListener('touchstart', e => { x0 = e.touches[0].clientX; }, { passive: true });
  slider.addEventListener('touchend', e => { if (x0 === null) return; const dx = e.changedTouches[0].clientX - x0; if (Math.abs(dx) > 40) { parado = true; para(); ir(actual + (dx < 0 ? 1 : -1)); } x0 = null; });
  sigue();
})();
