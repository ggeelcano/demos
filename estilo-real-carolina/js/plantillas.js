/* Datos fijos y plantillas compartidas (navegador y generador estático) */
(function (g) {
  var CDN = 'https://cdn.zyrosite.com/cdn-cgi/image/format=auto,';
  var TIENDA = '/cdn-ecommerce/store_01JK8FKECT84BHXXYKSD43CRF6/assets/';

  var SUB = {
    abrigos: 'Abrigos', chaquetas: 'Chaquetas y bombers', jerseys: 'Jerseys y sudaderas', camisas: 'Camisas',
    camisetas: 'Camisetas y tops', pantalones: 'Pantalones y jeans', faldas: 'Faldas', vestidos: 'Vestidos y monos',
    conjuntos: 'Conjuntos', bolsos: 'Bolsos', calzado: 'Calzado', collares: 'Collares', pendientes: 'Pendientes',
    panuelos: 'Pañuelos y bufandas', cinturones: 'Cinturones', broches: 'Broches', otros: 'Gorros, cuellos y más'
  };
  var GRUPOS = {
    ropa: { n: 'Ropa', subs: ['abrigos', 'chaquetas', 'jerseys', 'camisas', 'camisetas', 'pantalones', 'faldas', 'vestidos', 'conjuntos'],
      d: 'Ropa de mujer de temporada, con muchas prendas multitalla. En cada ficha indicamos hasta qué contorno sienta bien.' },
    bolsos: { n: 'Bolsos', subs: [], d: 'Bolsos de mano, totes y bandoleras para el día a día.' },
    calzado: { n: 'Calzado', subs: [], d: 'Zapatos y botas para acompañar los looks de temporada.' },
    joyeria: { n: 'Joyería', subs: ['collares', 'pendientes'], d: 'Collares y pendientes de bisutería: perlas, acero, resina y piedras.' },
    accesorios: { n: 'Accesorios', subs: ['panuelos', 'cinturones', 'broches', 'otros'], d: 'Pañuelos, cinturones y detalles para completar el look.' }
  };
  var ESPECIALES = {
    novedades: { n: 'Novedades', d: 'Lo último que ha llegado a la tienda.' },
    promo: { n: 'Promociones', d: 'Prendas y complementos a precio especial.' },
    favoritos: { n: 'Tus favoritos', d: 'Las prendas que has guardado con el corazón.' },
    todo: { n: 'Toda la tienda', d: 'Ropa, bolsos, calzado y bisutería.' }
  };
  var GRUPO_DE = {};
  Object.keys(GRUPOS).forEach(function (k) {
    var s = GRUPOS[k].subs.length ? GRUPOS[k].subs : [k];
    s.forEach(function (x) { GRUPO_DE[x] = k; });
  });

  function img(f, w) { return CDN + 'w=' + w + ',h=' + Math.round(w * 4 / 3) + ',fit=crop' + TIENDA + f; }
  function srcset(f) { return [360, 540, 720, 1080].map(function (w) { return img(f, w) + ' ' + w + 'w'; }).join(', '); }
  function euro(n) { return n.toFixed(2).replace('.', ',') + ' €'; }
  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function norm(s) { return String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, ''); }
  var ICONO_CORAZON = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20.3 4.2 12.7a4.7 4.7 0 0 1 6.6-6.7L12 7.2l1.2-1.2a4.7 4.7 0 0 1 6.6 6.7Z"/></svg>';

  function tarjeta(p, sizes, lazy) {
    var dos = p.i[1] ? '<img class="segunda" src="' + img(p.i[1], 540) + '" srcset="' + srcset(p.i[1]) + '" sizes="' + sizes + '" alt="" loading="lazy" decoding="async">' : '';
    var colores = p.v && p.v.length > 1 ? '<p class="colores">' + p.v.length + ' ' + (/estampad|modelo/i.test(p.on || '') ? 'modelos' : 'colores') + '</p>' : '';
    var et = p.r ? '<span class="etiqueta' + (p.r === 'Promo' ? ' promo' : '') + '">' + esc(p.r) + '</span>' : '';
    return '<article class="tarjeta">' +
      '<a href="producto.html?p=' + encodeURIComponent(p.id) + '">' +
      '<div class="tarjeta-img"><img src="' + img(p.i[0], 540) + '" srcset="' + srcset(p.i[0]) + '" sizes="' + sizes + '" alt="' + esc(p.t) + '"' + (lazy === false ? '' : ' loading="lazy"') + ' decoding="async">' + dos + et + '</div>' +
      '<h3>' + esc(p.t) + '</h3><p class="precio">' + euro(p.p) + '</p>' + colores + '</a>' +
      '<button type="button" class="corazon" data-fav="' + esc(p.id) + '" aria-pressed="false" aria-label="Guardar ' + esc(p.t) + ' en favoritos">' + ICONO_CORAZON + '</button>' +
      '</article>';
  }

  g.ER = { SUB: SUB, GRUPOS: GRUPOS, ESPECIALES: ESPECIALES, GRUPO_DE: GRUPO_DE, img: img, srcset: srcset, euro: euro, esc: esc, norm: norm, tarjeta: tarjeta,
    ICONO_CORAZON: ICONO_CORAZON, WHATSAPP: '34658749780', ENVIO_GRATIS: 100 };
})(typeof window !== 'undefined' ? window : globalThis);
