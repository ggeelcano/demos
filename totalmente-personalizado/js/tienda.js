// Tienda (listado con categorías, búsqueda y orden) y ficha de producto
(function () {
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var eur = function (n) { return n.toFixed(2).replace('.', ',') + ' €'; };
  var esc = function (t) { return String(t).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
  var params = new URLSearchParams(location.search);
  var WA = 'https://wa.me/34636017030';

  fetch('datos.json').then(function (r) { return r.json(); }).then(function (D) {
    var cats = D.cats.filter(function (c) { return c.s !== 'sin-categorizar'; });
    var porId = {}; cats.forEach(function (c) { porId[c.id] = c; });
    function hijos(id) { return cats.filter(function (c) { return c.p === id; }).reduce(function (a, c) { return a.concat([c.id], hijos(c.id)); }, []); }
    function deCat(c) { var ids = [c.id].concat(hijos(c.id)); return D.prods.filter(function (p) { return p.c.some(function (x) { return ids.indexOf(x) >= 0; }); }); }
    function nomCat(p) { var c = porId[p.c[0]]; return c ? c.n : ''; }
    function precio(p) {
      if (!p.pr) return '<span style="font-size:15px">Precio a consultar</span>';
      if (p.range && p.range.min !== p.range.max) return 'Desde ' + eur(p.range.min);
      return p.sale ? '<del>' + eur(p.rp) + '</del><ins>' + eur(p.pr) + '</ins>' : eur(p.pr);
    }
    function card(p) {
      var im = p.img[0] ? (p.img[0].t || p.img[0].b) : 'img/logo_tp_h_oscuro.svg';
      return '<a class="pcard" href="producto.html?p=' + p.s + '">' + (p.sale ? '<span class="badge">Oferta</span>' : (!p.st ? '<span class="badge out">Agotado</span>' : '')) +
        '<div class="im"><img src="' + encodeURI(im) + '" alt="' + esc(p.n) + '" loading="lazy" width="300" height="300"></div><div class="bd"><div class="cat">' + esc(nomCat(p)) + '</div><h3>' + esc(p.n) + '</h3><div class="price">' + precio(p) + '</div></div></a>';
    }

    /* ---------- listado ---------- */
    if ($('#grid')) {
      var actual = params.get('c') || '', q = params.get('q') || '', orden = '', visibles = 24;
      var raiz = cats.filter(function (c) { return c.p === 0; });
      var orderTop = ['sellos-personalizados', 'dtf-uv', 'filamentos', 'sprays-acabados', 'repuestos', 'impresoras-3d', 'anycubic', 'materiales', 'accesorios', 'likidacion'];
      raiz.sort(function (a, b) { return orderTop.indexOf(a.s) - orderTop.indexOf(b.s); });
      var nombres = { 'repuestos': 'Repuestos Artillery', 'dtf-uv': 'Pegatinas DTF-UV', 'likidacion': 'Liquidación' };
      var nombre = function (c) { return nombres[c.s] || c.n; };
      function li(c) {
        var sub = cats.filter(function (x) { return x.p === c.id; });
        return '<li><button type="button" data-c="' + c.s + '"><span>' + esc(nombre(c)) + '</span><span class="k">' + deCat(c).length + '</span></button>' + (sub.length ? '<ul>' + sub.map(li).join('') + '</ul>' : '') + '</li>';
      }
      $('#cats').innerHTML = '<li><button type="button" data-c=""><span>Todos los productos</span><span class="k">' + D.prods.length + '</span></button></li>' + raiz.map(li).join('');
      $('#q').value = q;

      function lista() {
        var c = cats.find(function (x) { return x.s === actual; });
        var l = c ? deCat(c) : D.prods.slice();
        if (q) {
          var t = q.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
          l = l.filter(function (p) { return (p.n + ' ' + p.sku + ' ' + nomCat(p)).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').indexOf(t) >= 0; });
        }
        if (!orden) {
          var rango = function (p) { var t = porId[p.c[0]]; while (t && t.p) t = porId[t.p]; var i = t ? orderTop.indexOf(t.s) : -1; return (i < 0 ? 99 : i) + (p.st && p.pr ? 0 : 100); };
          l.sort(function (a, b) { return rango(a) - rango(b) || a.pr - b.pr; });
        }
        if (orden === 'asc') l.sort(function (a, b) { return a.pr - b.pr; });
        if (orden === 'desc') l.sort(function (a, b) { return b.pr - a.pr; });
        if (orden === 'az') l.sort(function (a, b) { return a.n.localeCompare(b.n, 'es'); });
        return { c: c, l: l };
      }
      function pinta() {
        var r = lista();
        $('#tit').textContent = r.c ? nombre(r.c) : 'Todos los productos';
        $('#res').textContent = r.l.length + (r.l.length === 1 ? ' producto' : ' productos') + (q ? ' para «' + q + '»' : '');
        $('#grid').innerHTML = r.l.length ? r.l.slice(0, visibles).map(card).join('') : '<div class="vacio" style="grid-column:1/-1">No hay productos con esa búsqueda. <a href="' + WA + '" target="_blank" rel="noopener">Pregúntanos por WhatsApp</a>.</div>';
        $('#mas').hidden = r.l.length <= visibles;
        $$('#cats button').forEach(function (b) { b.setAttribute('aria-current', b.getAttribute('data-c') === actual ? 'true' : 'false'); });
        var u = new URL(location.href); u.searchParams.delete('c'); u.searchParams.delete('q');
        if (actual) u.searchParams.set('c', actual); if (q) u.searchParams.set('q', q);
        history.replaceState(null, '', u);
        document.title = (r.c ? nombre(r.c) + ' · ' : '') + 'Tienda | Totalmente Personalizado';
      }
      $('#cats').addEventListener('click', function (e) {
        var b = e.target.closest('button'); if (!b) return;
        actual = b.getAttribute('data-c'); visibles = 24; pinta();
        if (window.innerWidth < 980) { $('#side').classList.remove('on'); $('#catbtn').setAttribute('aria-expanded', 'false'); $('#tit').scrollIntoView({ block: 'start' }); }
      });
      var tq; $('#q').addEventListener('input', function (e) { clearTimeout(tq); tq = setTimeout(function () { q = e.target.value.trim(); visibles = 24; pinta(); }, 180); });
      $('#orden').addEventListener('change', function (e) { orden = e.target.value; pinta(); });
      $('#mas').addEventListener('click', function () { visibles += 24; pinta(); });
      $('#catbtn').addEventListener('click', function () { var on = $('#side').classList.toggle('on'); this.setAttribute('aria-expanded', on ? 'true' : 'false'); });
      pinta();
    }

    /* ---------- ficha ---------- */
    if ($('#ficha')) {
      var p = D.prods.find(function (x) { return x.s === params.get('p'); });
      if (!p) { $('#ficha').innerHTML = '<h1>Producto no encontrado</h1><p><a href="tienda.html">Volver a la tienda</a></p>'; return; }
      document.title = p.n + ' | Totalmente Personalizado';
      var c0 = porId[p.c[0]], top = c0; while (top && top.p) top = porId[top.p];
      var esSello = p.c.some(function (x) { return [769, 770, 771, 772].indexOf(x) >= 0; }) && /^Sello/.test(p.n);
      var plano = (p.d + ' ' + p.sd).replace(/<[^>]+>/g, '');
      var lineas = (plano.match(/Hasta (\d+) líneas/i) || [])[1];
      var variables = p.at.filter(function (a) { return a.v; });
      var fijos = p.at.filter(function (a) { return !a.v; });

      var opciones = '';
      if (esSello) {
        opciones += '<div class="opt"><label for="o-txt">Texto del sello *</label><textarea id="o-txt" class="o" rows="5" style="width:100%;font:inherit;padding:11px 13px;border:1px solid #d0d5dd;border-radius:8px" placeholder="Nombre o razón social&#10;NIF&#10;Dirección&#10;CP y población&#10;Teléfono o web"></textarea><p class="nota" style="margin:6px 0 0">' + (lineas ? 'Máximo recomendado: <b>' + lineas + ' líneas</b>. ' : '') + 'Si necesitas más, escríbenos primero.</p></div>';
        opciones += '<div class="opt"><span class="lab" id="l-tinta">Color de almohadilla *</span><div class="sw" role="radiogroup" aria-labelledby="l-tinta">' + ['Negro', 'Azul', 'Rojo', 'Verde', 'Violeta'].map(function (t, i) { return '<label><input type="radio" name="tinta" value="' + t + '"' + (i ? '' : ' checked') + '><span>' + t + '</span></label>'; }).join('') + '</div></div>';
        opciones += '<div class="opt extra-l"><span class="lab">Servicios adicionales</span>' + [['Color de tinta especial (naranja, marrón, granate, azul claro, amarillo, rosa)', 3], ['Diseño profesional del logo (vectorización o creación desde cero)', 30], ['Carcasa decorativa con logo a color visible en la tapa', 5], ['Envío express 24-48 h', 12], ['Empaquetado en caja regalo', 6]].map(function (x) { return '<label><input type="checkbox" class="ex" data-pz="' + x[1] + '" value="' + esc(x[0]) + '"><span>' + x[0] + '</span><em>+' + eur(x[1]) + '</em></label>'; }).join('') + '</div>';
        opciones += '<div class="opt"><label for="o-notas">Notas adicionales (opcional)</label><input id="o-notas" type="text" style="width:100%;font:inherit;padding:11px 13px;border:1px solid #d0d5dd;border-radius:8px"></div>';
        opciones += '<div class="opt"><label for="o-logo">¿Tienes logo? Adjúntalo aquí</label><input id="o-logo" type="file" accept=".png,.jpg,.jpeg,.pdf,.svg,.ai,.eps,.cdr"><p class="nota" style="margin:6px 0 0">PNG, JPG, PDF, SVG, AI, EPS, CDR. Máx. 10 MB. Si no lo subes ahora, envíalo después con el número de pedido a <a href="mailto:tienda@totalmentepersonalizado.com">tienda@totalmentepersonalizado.com</a>.</p></div>';
        opciones += '<label class="chk" style="display:flex;gap:10px;font-size:14px;color:var(--muted);margin-bottom:8px"><input type="checkbox" id="o-acepto" style="width:18px;height:18px;accent-color:var(--brand)"> <span>Acepto que es un producto a medida. Una vez aprobada la vista previa, no se admiten devoluciones por errores en el texto que yo facilite. *</span></label>';
      }
      variables.forEach(function (a, k) {
        if (a.t.length > 10) opciones += '<div class="opt"><label for="v' + k + '">' + esc(a.n) + '</label><select id="v' + k + '" class="var" data-n="' + esc(a.n) + '" style="width:100%;font:inherit;padding:11px 13px;border:1px solid #d0d5dd;border-radius:8px;background:#fff">' + a.t.map(function (t) { return '<option>' + esc(t) + '</option>'; }).join('') + '</select></div>';
        else opciones += '<div class="opt"><span class="lab" id="lv' + k + '">' + esc(a.n) + '</span><div class="sw" role="radiogroup" aria-labelledby="lv' + k + '">' + a.t.map(function (t, i) { return '<label><input type="radio" class="var" data-n="' + esc(a.n) + '" name="v' + k + '" value="' + esc(t) + '"' + (i ? '' : ' checked') + '><span>' + esc(t) + '</span></label>'; }).join('') + '</div></div>';
      });

      var g = p.img.length ? p.img : [{ b: 'img/logo_tp_h_oscuro.svg', alt: p.n }];
      $('#ficha').innerHTML =
        '<nav class="crumbs" aria-label="Migas"><a href="index.html">Inicio</a> › <a href="tienda.html">Tienda</a>' + (top ? ' › <a href="tienda.html?c=' + top.s + '">' + esc(top.n) + '</a>' : '') + (c0 && c0 !== top ? ' › <a href="tienda.html?c=' + c0.s + '">' + esc(c0.n) + '</a>' : '') + '</nav>' +
        '<div class="ficha"><div class="galp"><div class="main"><img id="gmain" src="' + encodeURI(g[0].b) + '" alt="' + esc(g[0].alt || p.n) + '"></div>' +
        (g.length > 1 ? '<div class="th">' + g.map(function (im, i) { return '<button type="button" aria-pressed="' + (i === 0) + '" data-i="' + i + '" aria-label="Ver foto ' + (i + 1) + '"><img src="' + encodeURI(im.b) + '" alt=""></button>'; }).join('') + '</div>' : '') + '</div>' +
        '<div><div class="kicker">' + esc(nomCat(p)) + '</div><h1>' + esc(p.n) + '</h1><div class="price">' + precio(p) + '</div>' +
        '<div class="stock' + (p.st ? '' : ' no') + '">' + (p.st ? '● Disponible' : '● Agotado · pregúntanos') + '</div>' +
        '<div class="sd">' + p.sd + '</div>' + opciones +
        '<div class="buy"><div class="qty"' + (p.pr ? '' : ' hidden') + '><button type="button" id="menos" aria-label="Quitar uno">−</button><input id="cant" type="number" min="1" value="1" aria-label="Cantidad"><button type="button" id="mas1" aria-label="Añadir uno">+</button></div>' +
        (p.pr ? '<button class="btn btn-p" type="button" id="add"' + (p.st ? '' : ' disabled') + '>Añadir al carrito</button>' : '<a class="btn btn-p" href="sharebot.html#contacto">Pedir presupuesto</a>') + '</div>' +
        (esSello ? '<p class="total-l">Total con extras: <b id="tot">' + eur(p.pr) + '</b></p>' : '') +
        '<div class="meta">' + (p.sku ? '<div>Ref.: ' + esc(p.sku) + '</div>' : '') + '<div>Categoría: ' + p.c.map(function (x) { var c = porId[x]; return c ? '<a href="tienda.html?c=' + c.s + '">' + esc(c.n) + '</a>' : ''; }).join(', ') + '</div><div>¿Dudas? <a href="' + WA + '?text=' + encodeURIComponent('Hola, tengo una duda sobre: ' + p.n) + '" target="_blank" rel="noopener">Pregúntanos por WhatsApp</a></div></div></div></div>' +
        '<div class="tabs"><div class="tl" role="tablist">' + [['t-d', 'Descripción'], ['t-i', 'Información adicional'], ['t-e', 'Envío y entrega']].map(function (t, i) { return '<button type="button" role="tab" id="b' + t[0] + '" aria-controls="' + t[0] + '" aria-selected="' + (i === 0) + '">' + t[1] + '</button>'; }).join('') + '</div>' +
        '<div class="tp" role="tabpanel" id="t-d" aria-labelledby="bt-d">' + (p.d || p.sd) + '</div>' +
        '<div class="tp" role="tabpanel" id="t-i" aria-labelledby="bt-i" hidden><div class="tbl-w"><table style="min-width:0">' + (p.sku ? '<tr><th>Referencia</th><td>' + esc(p.sku) + '</td></tr>' : '') + p.at.map(function (a) { return '<tr><th>' + esc(a.n) + '</th><td>' + a.t.map(esc).join(', ') + '</td></tr>'; }).join('') + '</table></div></div>' +
        '<div class="tp" role="tabpanel" id="t-e" aria-labelledby="bt-e" hidden><p>Trabajamos con stock mixto y bajo pedido. En filamentos Smart, el plazo habitual es de 48-72 horas laborables salvo rotura puntual de proveedor.</p><ul><li>Preparación del pedido: 24-48 h según carga.</li><li>Entrega estimada: 24-72 h (Península) una vez expedido.</li><li>Si un color o material requiere más plazo, te avisamos antes de confirmar.</li><li>Para pedidos técnicos o de empresa, podemos planificar entregas por lote.</li><li>Recogida en el taller de Burgos (Pablo Casals 19) con cita previa.</li></ul></div></div>';

      $$('.galp .th button').forEach(function (b) {
        b.addEventListener('click', function () {
          var im = g[+b.getAttribute('data-i')]; $('#gmain').src = encodeURI(im.b); $('#gmain').alt = im.alt || p.n;
          $$('.galp .th button').forEach(function (x) { x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); });
        });
      });
      $$('.tabs [role=tab]').forEach(function (b) {
        b.addEventListener('click', function () {
          $$('.tabs [role=tab]').forEach(function (x) { x.setAttribute('aria-selected', x === b ? 'true' : 'false'); $('#' + x.getAttribute('aria-controls')).hidden = x !== b; });
        });
      });
      function unidad() { var x = p.pr; $$('.ex:checked').forEach(function (e) { x += +e.getAttribute('data-pz'); }); return x; }
      function total() { if ($('#tot')) $('#tot').textContent = eur(unidad() * Math.max(1, +$('#cant').value || 1)); }
      $$('.ex').forEach(function (e) { e.addEventListener('change', total); });
      $('#cant').addEventListener('input', total);
      $('#menos').addEventListener('click', function () { $('#cant').value = Math.max(1, (+$('#cant').value || 1) - 1); total(); });
      $('#mas1').addEventListener('click', function () { $('#cant').value = (+$('#cant').value || 1) + 1; total(); });
      if ($('#add')) $('#add').addEventListener('click', function () {
        var op = [];
        if (esSello) {
          var txt = $('#o-txt').value.trim();
          if (!txt) { $('#o-txt').setAttribute('aria-invalid', 'true'); $('#o-txt').focus(); TP.aviso('Escribe el texto del sello'); return; }
          if (!$('#o-acepto').checked) { $('#o-acepto').focus(); TP.aviso('Acepta las condiciones del producto a medida'); return; }
          op.push('Tinta ' + $('input[name=tinta]:checked').value);
          $$('.ex:checked').forEach(function (e) { op.push(e.value.split(' (')[0]); });
          op.push('Texto: ' + txt.replace(/\n/g, ' / '));
        }
        $$('select.var, input.var:checked').forEach(function (v) { op.push(v.getAttribute('data-n') + ': ' + v.value); });
        TP.add({ s: p.s, n: p.n, pr: esSello ? unidad() : (p.range ? p.range.min : p.pr), q: Math.max(1, +$('#cant').value || 1), op: op.join(' · '), img: p.img[0] ? (p.img[0].t || p.img[0].b) : '' });
        TP.abrirCarrito();
      });

      var rel = D.prods.filter(function (x) { return x !== p && x.c.some(function (k) { return p.c.indexOf(k) >= 0; }); }).slice(0, 4);
      if (rel.length < 4 && top) rel = rel.concat(deCat(top).filter(function (x) { return x !== p && rel.indexOf(x) < 0; }).slice(0, 4 - rel.length));
      $('#rel').innerHTML = rel.map(card).join('');
    }
  });
})();
