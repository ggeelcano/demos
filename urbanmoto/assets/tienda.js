/* Urbanmoto · listado de productos (categoría, búsqueda, Mi moto) */
(() => {
  'use strict';
  const { D, $, $$, esc, ico, tarjeta, cats, ruta, enCat, buscar, motoInfo, miMoto, ponMoto, abrir, waLink, lee, guarda } = window.UM;
  const POR_PAGINA = 24;
  const DESCS = {
    19: 'Cilindros, pistones, juntas, culatas, bombas de agua y todo lo que hace falta para que el motor de tu scooter, pit bike o minimoto vuelva a tirar.',
    28: 'Carburadores PWK, PHBG, PHVA, SHA, PZ, Dellorto y Keihin, con sus chicles, filtros de aire, toberas y cajas de láminas.',
    29: 'Bombas de freno, latiguillos metálicos, cerraduras, radiadores, mandos de gas y tornillería para el día a día de tu moto.',
    30: 'Baterías de 12 V, CDI, bobinas, encendidos, pilotos, intermitentes y bocinas.',
    31: 'Herramientas para el taller.',
    65: 'Puños, paramanos, estriberas, protectores de manillar, retrovisores y fundas de asiento.',
    76: 'Plásticos CRF50 y CRF70, asientos, depósitos, CDI, carburadores PZ, discos y neumáticos para pit bike.',
    77: 'Arrancadores, embragues, campanas, cadenas, neumáticos y carburadores para minimoto y minicross.',
    78: 'Baterías para patinete Xiaomi M365, 1S, Essential y Mi3.',
  };
  const PRECIOS = [['10', 'Hasta 10 €', 0, 10], ['20', 'De 10 a 20 €', 10, 20], ['40', 'De 20 a 40 €', 20, 40], ['mas', 'Más de 40 €', 40, Infinity]];
  const enRango = (p, k) => { const r = PRECIOS.find(x => x[0] === k); return r && p.p > r[2] - (r[2] === 0 ? 1 : 0) && p.p <= r[3]; };

  const P = new URLSearchParams(location.search);
  const st = {
    c: cats.has(+P.get('c')) ? +P.get('c') : null,
    q: (P.get('q') || '').trim(),
    moto: motoInfo.has(P.get('moto')) ? P.get('moto') : null,
    orden: P.get('orden') || 'rel',
    stock: P.get('stock') === '1',
    precio: (P.get('precio') || '').split(',').filter(k => PRECIOS.some(x => x[0] === k)),
    nov: P.get('nov') === '1',
    uni: P.get('uni') === '1',
    n: POR_PAGINA,
  };
  const escritorio = matchMedia('(min-width: 900px)');
  let vista = lee('um-vista', 'lista');

  // ---------- Conjunto base (categoría / búsqueda / moto) ----------
  let base = D.prods;
  if (st.q) base = buscar(st.q);
  if (st.c) base = base.filter(p => enCat(p, st.c));
  if (st.moto) base = base.filter(p => p.m.includes(st.moto));

  const pasa = (p, sin) => (sin === 'stock' || !st.stock || p.s > 0)
    && (sin === 'precio' || !st.precio.length || st.precio.some(k => enRango(p, k)))
    && (sin === 'nov' || !st.nov || p.nu)
    && (sin === 'uni' || !st.uni || p.u);

  function ordena(l) {
    const r = l.slice();
    if (st.orden === 'nov') r.sort((a, b) => b.f.localeCompare(a.f) || b.id - a.id);
    else if (st.orden === 'pre-asc') r.sort((a, b) => a.p - b.p);
    else if (st.orden === 'pre-desc') r.sort((a, b) => b.p - a.p);
    else if (!st.q) {
      // "relevantes" sin búsqueda: con stock primero y alternando subcategorías para que no salgan 15 filtros seguidos
      const grupos = new Map();
      for (const p of r.sort((a, b) => b.f.localeCompare(a.f) || b.id - a.id)) {
        const k = (p.s > 0 ? 'a' : 'b') + (window.UM.catProfunda(p)?.id || 0);
        if (!grupos.has(k)) grupos.set(k, []);
        grupos.get(k).push(p);
      }
      const salida = [];
      for (const pref of ['a', 'b']) {
        const gs = [...grupos].filter(([k]) => k[0] === pref).map(([, v]) => v).sort((x, y) => y.length - x.length);
        for (let i = 0; gs.some(g => g[i]); i++) for (const g of gs) if (g[i]) salida.push(g[i]);
      }
      return salida;
    }
    else r.sort((a, b) => (b.s > 0) - (a.s > 0));
    return r;
  }

  // ---------- Cabecera de la página ----------
  function conBrocha(txt) { const i = txt.lastIndexOf(' '); return i < 0 ? `<span class="brocha">${esc(txt)}</span>` : `${esc(txt.slice(0, i))} <span class="brocha">${esc(txt.slice(i + 1))}</span>`; }
  function pintaCabecera() {
    let titulo = 'Todos los recambios', desc = '', migas = [['index.html', 'Inicio']];
    if (st.c) {
      const r = ruta(st.c);
      r.forEach((c, i) => migas.push([i < r.length - 1 ? `tienda.html?c=${c.id}` : null, c.n]));
      // en Pit bike y Minimoto las subcategorías se llaman igual que las generales: "Carburación de pit bike"
      titulo = r[r.length - 1].n + (r.length > 1 && (r[0].id === 76 || r[0].id === 77) ? ' de ' + r[0].n.toLowerCase() : '');
      desc = DESCS[st.c] || DESCS[r[0].id] || '';
    }
    if (st.moto) { const m = motoInfo.get(st.moto); titulo = `Recambios para ${m.full}`; migas.push([null, m.full]); desc = 'Piezas que en su ficha indican que valen para ' + m.full + '. Si te queda la duda, pregúntanos por WhatsApp antes de comprar.'; }
    if (st.q) { titulo = `Resultados para «${st.q}»`; migas.push([null, 'Búsqueda']); desc = ''; }
    if (!st.c && !st.q && !st.moto && st.orden === 'nov') { titulo = 'Novedades'; migas.push([null, 'Novedades']); desc = 'Lo último que ha entrado en el almacén.'; }
    if (!st.c && !st.q && !st.moto && st.orden !== 'nov') migas.push([null, 'Tienda']);
    $('#titulo').innerHTML = conBrocha(titulo);
    $('#desc').textContent = desc;
    $('#desc').hidden = !desc;
    $('#migas').innerHTML = migas.map(([h, t], i) => h ? `<li><a href="${h}">${esc(t)}</a></li>` : `<li${i === migas.length - 1 ? ' aria-current="page"' : ''}>${esc(t)}</li>`).join('');
    document.title = `${titulo} · Urbanmoto`;
  }

  // ---------- Filtros ----------
  const enlace = cambios => {
    const n = new URLSearchParams();
    const v = { c: st.c, q: st.q, moto: st.moto, orden: st.orden !== 'rel' ? st.orden : '', stock: st.stock ? '1' : '', precio: st.precio.join(','), nov: st.nov ? '1' : '', uni: st.uni ? '1' : '', ...cambios };
    for (const [k, x] of Object.entries(v)) if (x !== null && x !== '' && x !== undefined) n.set(k, x);
    const s = n.toString(); return 'tienda.html' + (s ? '?' + s : '');
  };
  function pintaFiltros() {
    // Mi moto
    const m = miMoto(), caja = $('#caja-mimoto');
    if (st.moto) {
      const f = motoInfo.get(st.moto);
      caja.innerHTML = `<h2>Filtrando por tu moto</h2><p class="tu-moto">${esc(f.full)}</p><a class="btn btn-negro" href="${enlace({ moto: null })}">Quitar este filtro</a><p style="margin:10px 0 0"><button class="btn btn-borde" type="button" data-abrir-moto style="border-radius:30px;width:100%;min-height:40px">Cambiar de moto</button></p>`;
    } else if (m) {
      caja.innerHTML = `<h2>Tu moto</h2><p class="tu-moto">${esc(m.full)}</p><a class="btn btn-negro" href="${enlace({ moto: m.k })}">${ico('moto')} Solo para mi moto</a><p style="margin:10px 0 0"><button class="btn btn-borde" type="button" data-abrir-moto style="border-radius:30px;width:100%;min-height:40px">Cambiar de moto</button></p>`;
    } else {
      caja.innerHTML = `<h2>Comprueba la compatibilidad con tu moto</h2><p>No has elegido ninguna moto. Dinos cuál tienes y marcamos las piezas que le valen.</p><button class="btn btn-negro" type="button" data-abrir-moto>${ico('moto')} Seleccionar mi moto</button>`;
    }
    // Categorías: hijas de la actual o familias
    let opciones, volver = '';
    if (st.c) {
      const c = cats.get(st.c), r = ruta(st.c);
      opciones = c.sub || [];
      const anterior = r.length > 1 ? r[r.length - 2] : null;
      volver = `<li><a class="interruptor" href="${enlace({ c: anterior ? anterior.id : null })}" style="font-weight:700">${ico('flecha-izq')} ${anterior ? 'Volver a ' + esc(anterior.n) : 'Todas las categorías'}</a></li>`;
    } else opciones = D.cats;
    const conteo = id => base.filter(p => enCat(p, id) && pasa(p)).length;
    const items = opciones.map(c => [c, conteo(c.id)]).filter(x => x[1] > 0);
    $('#f-cats').innerHTML = volver + items.map(([c, n]) => `<li><a class="interruptor" href="${enlace({ c: c.id })}"><span class="pista" aria-hidden="true"></span><span>${esc(c.n)} <span class="n">(${n})</span></span></a></li>`).join('');
    $('#f-cats').closest('.grupo-filtro').hidden = !items.length && !volver;
    // Precio
    $('#f-precio').innerHTML = PRECIOS.map(([k, t]) => {
      const n = base.filter(p => enRango(p, k) && pasa(p, 'precio')).length;
      return `<li><label class="interruptor"><input type="checkbox" value="${k}" ${st.precio.includes(k) ? 'checked' : ''} ${n || st.precio.includes(k) ? '' : 'disabled'}><span class="pista"></span><span>${t} <span class="n">(${n})</span></span></label></li>`;
    }).join('');
    $('#f-stock').checked = st.stock; $('#n-stock').textContent = `(${base.filter(p => p.s > 0 && pasa(p, 'stock')).length})`;
    $('#f-nov').checked = st.nov; $('#n-nov').textContent = `(${base.filter(p => p.nu && pasa(p, 'nov')).length})`;
    $('#f-uni').checked = st.uni; $('#n-uni').textContent = `(${base.filter(p => p.u && pasa(p, 'uni')).length})`;
    const activos = (st.stock ? 1 : 0) + st.precio.length + (st.nov ? 1 : 0) + (st.uni ? 1 : 0);
    $('#n-filtros').textContent = activos ? `(${activos})` : '';
  }

  // ---------- Resultados ----------
  let lista = [];
  function pintaResultados(enfocarDesde) {
    lista = ordena(base.filter(p => pasa(p)));
    const caja = $('#resultados');
    $('#n-res').textContent = lista.length; $('#n-res-m').textContent = lista.length;
    $('#estado-res').textContent = `${lista.length} ${lista.length === 1 ? 'producto' : 'productos'}`;
    caja.classList.toggle('en-lista', vista === 'lista');
    if (!lista.length) {
      caja.innerHTML = `<div class="vacio"><h2>No hay recambios con estos filtros</h2><p>${st.q ? 'Prueba con otra palabra: carburador, cilindro, CDI, puños, chicles…' : 'Quita algún filtro o dinos qué buscas y te lo miramos.'}</p><p><a class="btn btn-naranja" href="${waLink('Hola, busco ' + (st.q || 'un recambio') + (st.moto ? ' para ' + motoInfo.get(st.moto).full : ''))}" target="_blank" rel="noopener">${ico('whatsapp')} Pregúntanos por WhatsApp</a></p></div>`;
      caja.classList.remove('en-lista');
      $('#mas').innerHTML = '';
      return;
    }
    caja.innerHTML = lista.slice(0, st.n).map(tarjeta).join('');
    const quedan = lista.length - Math.min(st.n, lista.length);
    $('#mas').innerHTML = quedan > 0 ? `<p>Has visto ${Math.min(st.n, lista.length)} de ${lista.length} productos</p><button class="btn btn-borde" type="button" id="btn-mas">Ver ${Math.min(POR_PAGINA, quedan)} productos más ${ico('mas')}</button>` : '';
    if (enfocarDesde != null) { const a = $$('.prod-nombre a', caja)[enfocarDesde]; a && a.focus(); }
  }
  function pintaAvisoMoto() {
    const caja = $('#aviso-moto');
    if (!st.moto) { caja.innerHTML = ''; return; }
    const f = motoInfo.get(st.moto), uni = D.prods.filter(p => p.u).length;
    caja.innerHTML = `<div class="aviso-moto"><span>Mostramos las piezas que en su ficha indican <strong>${esc(f.full)}</strong>. También tienes <a class="enlace" href="tienda.html?uni=1">${uni} piezas universales</a>.</span><a class="enlace" href="${enlace({ moto: null })}">Quitar filtro</a></div>`;
  }
  function todo(enfocar) { pintaCabecera(); pintaFiltros(); pintaAvisoMoto(); pintaResultados(enfocar); history.replaceState(null, '', enlace({})); }

  // ---------- Eventos ----------
  $('#orden').value = ['rel', 'nov', 'pre-asc', 'pre-desc'].includes(st.orden) ? st.orden : 'rel';
  $('#orden').addEventListener('change', e => { st.orden = e.target.value; st.n = POR_PAGINA; todo(); });
  $('#f-stock').addEventListener('change', e => { st.stock = e.target.checked; st.n = POR_PAGINA; todo(); });
  $('#f-nov').addEventListener('change', e => { st.nov = e.target.checked; st.n = POR_PAGINA; todo(); });
  $('#f-uni').addEventListener('change', e => { st.uni = e.target.checked; st.n = POR_PAGINA; todo(); });
  $('#f-precio').addEventListener('change', e => {
    const k = e.target.value; st.precio = e.target.checked ? [...st.precio, k] : st.precio.filter(x => x !== k); st.n = POR_PAGINA; todo();
    const v = $(`#f-precio input[value="${k}"]`); v && v.focus();
  });
  $('#mas').addEventListener('click', e => { if (!e.target.closest('#btn-mas')) return; const antes = st.n; st.n += POR_PAGINA; pintaResultados(antes); });
  // vista lista / mosaico
  const btnVista = $('#btn-vista');
  const pintaVista = () => { const enLista = vista === 'lista'; btnVista.setAttribute('aria-pressed', String(!enLista)); $('span', btnVista).textContent = enLista ? 'Mosaico' : 'Lista'; $('use', btnVista).setAttribute('href', enLista ? '#i-mosaico' : '#i-lista'); btnVista.setAttribute('aria-label', enLista ? 'Ver en mosaico' : 'Ver en lista'); };
  btnVista.addEventListener('click', () => { vista = vista === 'lista' ? 'mosaico' : 'lista'; guarda('um-vista', vista); pintaVista(); pintaResultados(); });
  // ocultar filtros (escritorio)
  $('#btn-ocultar').addEventListener('click', e => {
    const b = e.currentTarget, oculto = $('#listado').classList.toggle('sin-filtros');
    b.setAttribute('aria-expanded', String(!oculto)); $('span', b).textContent = oculto ? 'Mostrar filtros' : 'Ocultar filtros';
  });
  // filtros en móvil (cajón)
  const panel = $('#filtros');
  $('#btn-filtros').addEventListener('click', e => { panel.setAttribute('role', 'dialog'); panel.setAttribute('aria-modal', 'true'); abrir(panel, e.currentTarget); });
  panel.addEventListener('um:cerrado', () => { panel.removeAttribute('role'); panel.removeAttribute('aria-modal'); });
  escritorio.addEventListener('change', () => { if (escritorio.matches && panel.classList.contains('abierto')) window.UM.cerrar(panel, true); });
  document.addEventListener('um:moto', () => { pintaFiltros(); pintaResultados(); });
  document.addEventListener('um:cesta', () => {});

  pintaVista();
  todo();
})();
