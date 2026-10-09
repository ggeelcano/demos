/* Listado de productos: categoría, búsqueda, marca, ofertas, novedades */
(async () => {
  const { $, $$, esc, eur, url, tarjeta, catalogo, categorias, imgCat, buscar, ICO } = BM;
  const POR_PAG = 48;
  const raiz = $('#listado');
  const [{ prods, marcas }, k] = await Promise.all([catalogo(), categorias()]);
  const st = () => Object.fromEntries(new URLSearchParams(location.search));
  const ORDENES = { rel: 'Relevancia', nuevos: 'Novedades', 'precio-asc': 'Precio: de menor a mayor', 'precio-desc': 'Precio: de mayor a menor', valorados: 'Mejor valorados', nombre: 'Nombre A-Z' };

  function base(s) {
    let lista = prods, titulo = 'Todos los productos', sub = '', ruta = [], cat = null;
    if (s.c) { cat = k.porId[+s.c]; if (cat) { lista = lista.filter(p => p.todas.has(cat.id)); titulo = cat.n; ruta = k.ruta(cat.id); } }
    if (s.q) { lista = buscar(lista, s.q); titulo = `Resultados para «${s.q}»`; }
    if (s.marca) { const n = marcas[+s.marca]; lista = lista.filter(p => p.marcaId === +s.marca); titulo = n ? `Productos ${n}` : titulo; sub = n ? `Todo lo que tenemos de ${n} en Bricolemar.` : ''; }
    if (s.ofertas) { lista = lista.filter(p => p.antes > p.precio); titulo = 'Productos rebajados'; }
    return { lista, titulo, sub, ruta, cat };
  }
  function filtrar(lista, s) {
    const ms = (s.m || '').split(',').filter(Boolean).map(Number);
    if (ms.length) lista = lista.filter(p => ms.includes(p.marcaId));
    if (s.min) lista = lista.filter(p => p.precio >= +s.min);
    if (s.max) lista = lista.filter(p => p.precio <= +s.max);
    if (s.stock) lista = lista.filter(p => p.stock);
    if (s.rapido) lista = lista.filter(p => !BM.esLento(p));
    if (s.opin) lista = lista.filter(p => p.resenas > 0);
    return lista;
  }
  function ordenar(lista, o, s) {
    const l = [...lista];
    if (o === 'nuevos') l.sort((a, b) => b.id - a.id);
    else if (o === 'precio-asc') l.sort((a, b) => a.precio - b.precio);
    else if (o === 'precio-desc') l.sort((a, b) => b.precio - a.precio);
    else if (o === 'valorados') l.sort((a, b) => b.nota * Math.min(b.resenas, 10) - a.nota * Math.min(a.resenas, 10) || b.resenas - a.resenas);
    else if (o === 'nombre') l.sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
    else if (!s.q) l.sort((a, b) => a.orden - b.orden);
    return l;
  }
  function enlace(cambios) {
    const s = st(); Object.assign(s, cambios);
    for (const x in s) if (s[x] === '' || s[x] == null) delete s[x];
    if (!('p' in cambios)) delete s.p;
    const q = new URLSearchParams(s).toString();
    return url('categoria.html', q ? '?' + q : '');
  }
  function ir(cambios) { history.pushState(null, '', enlace(cambios)); pintar(); scrollTo({ top: 0 }); }

  function pintar() {
    const s = st();
    const { lista: b, titulo, sub, ruta, cat } = base(s);
    const fl = filtrar(b, s);
    const orden = s.orden || 'rel';
    const l = ordenar(fl, orden, s);
    const pag = Math.max(1, +s.p || 1), npag = Math.max(1, Math.ceil(l.length / POR_PAG));
    const trozo = l.slice((pag - 1) * POR_PAG, pag * POR_PAG);
    document.title = `${titulo} | Bricolemar, ferretería online`;
    // miga y cabecera
    let h = `<nav aria-label="Ruta"><ol class="miga"><li><a href="${url('index.html')}">Inicio</a></li><li><a href="${url('categoria.html')}">Tienda</a></li>${ruta.map((r, i) => i === ruta.length - 1 ? `<li aria-current="page">${esc(r.n)}</li>` : `<li><a href="${url('categoria.html', '?c=' + r.id)}">${esc(r.n)}</a></li>`).join('')}</ol></nav>`;
    h += `<div class="listado-cab"><h1>${esc(titulo)}</h1>${sub ? `<p>${esc(sub)}</p>` : `<p>${b.length.toLocaleString('es-ES')} productos</p>`}</div>`;
    const subcats = cat ? (k.hijos[cat.id] || []).filter(c => c.cuenta) : (!s.q && !s.marca && !s.ofertas ? k.familias.filter(c => c.cuenta && [6, 12, 2, 5, 7, 8, 3, 4].includes(c.id)) : []);
    if (subcats.length) h += `<ul class="subcats">${subcats.map(c => `<li><a href="${url('categoria.html', '?c=' + c.id)}"><img src="${imgCat(c.id, 128)}" alt="" loading="lazy">${esc(c.n)} <small>(${c.cuenta})</small></a></li>`).join('')}</ul>`;
    // filtros
    const cuentaM = {}; for (const p of b) if (p.marcaId) cuentaM[p.marcaId] = (cuentaM[p.marcaId] || 0) + 1;
    const ms = (s.m || '').split(',').filter(Boolean).map(Number);
    const marcasL = Object.entries(cuentaM).map(([id, n]) => ({ id: +id, n, nom: marcas[id] })).sort((a, b) => b.n - a.n);
    let arbol = '';
    if (cat) {
      const padre = k.porId[cat.padre];
      const hermanos = (k.hijos[cat.padre] || []).filter(c => c.cuenta);
      arbol = `<div class="filtro"><h2>Categoría</h2><ul class="arbol">${padre ? `<li><a href="${url('categoria.html', '?c=' + padre.id)}">‹ ${esc(padre.n)}</a></li>` : `<li><a href="${url('categoria.html')}">‹ Todas las categorías</a></li>`}${hermanos.map(c => `<li><a href="${url('categoria.html', '?c=' + c.id)}"${c.id === cat.id ? ' aria-current="true"' : ''}>${esc(c.n)} <small>${c.cuenta}</small></a>${c.id === cat.id && subcats.length ? `<ul>${subcats.map(x => `<li><a href="${url('categoria.html', '?c=' + x.id)}">${esc(x.n)} <small>${x.cuenta}</small></a></li>`).join('')}</ul>` : ''}</li>`).join('')}</ul></div>`;
    } else if (s.q || s.marca) {
      const cc = {}; for (const p of fl) for (const id of p.todas) if (!k.porId[id].padre) cc[id] = (cc[id] || 0) + 1;
      const tops = Object.entries(cc).sort((a, b) => b[1] - a[1]).slice(0, 10);
      if (tops.length) arbol = `<div class="filtro"><h2>Categoría</h2><ul class="arbol">${tops.map(([id, n]) => `<li><a href="${enlace({ c: id })}">${esc(k.porId[id].n)} <small>${n}</small></a></li>`).join('')}</ul></div>`;
    }
    const filtros = `<aside class="filtros" id="filtros" aria-label="Filtros">
      <div class="panel-cab"><span>Filtrar</span><button type="button" data-cerrar-filtros aria-label="Cerrar filtros">${ICO('cerrar')}</button></div>
      ${arbol}
      <div class="filtro"><h2>Disponibilidad</h2>
        <label><input type="checkbox" data-f="stock" ${s.stock ? 'checked' : ''}> Disponible en almacén <small>${b.filter(p => p.stock).length}</small></label>
        <label><input type="checkbox" data-f="rapido" ${s.rapido ? 'checked' : ''}> Envío en 24/48 h <small>${b.filter(p => !BM.esLento(p)).length}</small></label>
        <label><input type="checkbox" data-f="opin" ${s.opin ? 'checked' : ''}> Con opiniones de clientes <small>${b.filter(p => p.resenas).length}</small></label></div>
      <div class="filtro"><h2>Precio</h2><form class="rango" id="f-precio"><label class="sr" for="pmin">Precio mínimo</label><input id="pmin" type="number" min="0" step="1" placeholder="Mín. €" value="${esc(s.min || '')}"><span>–</span><label class="sr" for="pmax">Precio máximo</label><input id="pmax" type="number" min="0" step="1" placeholder="Máx. €" value="${esc(s.max || '')}"><button class="btn btn-sec" style="min-height:40px;padding:0 12px">OK</button></form></div>
      ${marcasL.length > 1 ? `<div class="filtro"><h2>Marca</h2>${marcasL.length > 8 ? '<label class="sr" for="bm">Buscar marca</label><input class="buscar-marca" id="bm" type="search" placeholder="Buscar marca">' : ''}<div class="lista-marcas">${marcasL.map(m => `<label data-nm="${esc(BM.norm(m.nom))}"><input type="checkbox" data-marca="${m.id}" ${ms.includes(m.id) ? 'checked' : ''}> ${esc(m.nom)} <small>${m.n}</small></label>`).join('')}</div></div>` : ''}
      <div class="aplicar"><button type="button" class="btn" style="width:100%" data-cerrar-filtros>Ver ${fl.length.toLocaleString('es-ES')} productos</button></div>
    </aside>`;
    // activos
    const act = [];
    ms.forEach(id => act.push([`Marca: ${marcas[id]}`, { m: ms.filter(x => x !== id).join(',') }]));
    if (s.stock) act.push(['Disponible en almacén', { stock: '' }]);
    if (s.rapido) act.push(['Envío en 24/48 h', { rapido: '' }]);
    if (s.opin) act.push(['Con opiniones', { opin: '' }]);
    if (s.min || s.max) act.push([`Precio ${s.min ? 'desde ' + s.min + ' €' : ''} ${s.max ? 'hasta ' + s.max + ' €' : ''}`, { min: '', max: '' }]);
    const activos = act.length ? `<div class="activos">${act.map(([t, c], i) => `<button type="button" data-quita="${i}">${esc(t)} ✕</button>`).join('')}</div>` : '';
    // paginación
    const pags = [];
    if (npag > 1) {
      const ver = new Set([1, npag, pag - 1, pag, pag + 1].filter(x => x >= 1 && x <= npag));
      let prev = 0;
      if (pag > 1) pags.push(`<a href="${enlace({ p: pag - 1 })}" data-p="${pag - 1}" aria-label="Página anterior">‹</a>`);
      [...ver].sort((a, b) => a - b).forEach(n => { if (n - prev > 1) pags.push('<span aria-hidden="true">…</span>'); pags.push(n === pag ? `<span aria-current="page">${n}</span>` : `<a href="${enlace({ p: n })}" data-p="${n}">${n}</a>`); prev = n; });
      if (pag < npag) pags.push(`<a href="${enlace({ p: pag + 1 })}" data-p="${pag + 1}" aria-label="Página siguiente">›</a>`);
    }
    h += `<div class="listado">${filtros}<div>
      <div class="barra-listado"><button type="button" class="btn btn-sec btn-filtros" data-abrir-filtros aria-controls="filtros">${ICO('filtros')} Filtrar</button><span class="total" aria-live="polite">${fl.length.toLocaleString('es-ES')} ${fl.length === 1 ? 'producto' : 'productos'}</span>
        <label><span class="sr">Ordenar por</span><select id="orden">${Object.entries(ORDENES).filter(([o]) => o !== 'rel' || true).map(([o, t]) => `<option value="${o}" ${o === orden ? 'selected' : ''}>${t}</option>`).join('')}</select></label></div>
      ${activos}
      ${trozo.length ? `<div class="rejilla">${trozo.map(tarjeta).join('')}</div>` : `<div class="vacio"><p><b>No hemos encontrado productos con estos filtros.</b></p><p>Prueba con otras palabras o escríbenos por WhatsApp al +34 694 279 935 y te lo buscamos.</p><a class="btn" href="${url('categoria.html')}">Ver toda la tienda</a></div>`}
      ${pags.length ? `<nav class="paginacion" aria-label="Páginas">${pags.join('')}</nav>` : ''}
    </div></div>`;
    raiz.innerHTML = h;
    // eventos
    $$('[data-f]', raiz).forEach(i => i.onchange = () => ir({ [i.dataset.f]: i.checked ? '1' : '' }));
    $$('[data-marca]', raiz).forEach(i => i.onchange = () => { const sel = $$('[data-marca]:checked', raiz).map(x => x.dataset.marca); ir({ m: sel.join(',') }); });
    $('#f-precio', raiz).onsubmit = e => { e.preventDefault(); ir({ min: $('#pmin').value, max: $('#pmax').value }); };
    $('#orden', raiz).onchange = e => ir({ orden: e.target.value === 'rel' ? '' : e.target.value });
    $$('[data-quita]', raiz).forEach(b => b.onclick = () => ir(act[+b.dataset.quita][1]));
    $$('[data-p]', raiz).forEach(a => a.onclick = e => { e.preventDefault(); ir({ p: a.dataset.p }); });
    const bm = $('#bm', raiz); if (bm) bm.oninput = () => { const t = BM.norm(bm.value); $$('.lista-marcas label', raiz).forEach(l => l.hidden = t && !l.dataset.nm.includes(t)); };
    const fil = $('#filtros', raiz);
    $$('[data-abrir-filtros]', raiz).forEach(b => b.onclick = () => { fil.classList.add('abierto'); $('#capa').hidden = false; $('button', fil).focus(); });
    $$('[data-cerrar-filtros]', raiz).forEach(b => b.onclick = () => { fil.classList.remove('abierto'); $('#capa').hidden = true; });
  }
  addEventListener('popstate', pintar);
  pintar();
})();
