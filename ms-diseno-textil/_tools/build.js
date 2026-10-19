// Genera index.html (HTML estático) para la demo de MS Diseño Textil, estilo tienda tipo Fútbol Emotion.
// Datos reales sacados de msdisenotextil.es (bundle de Hostinger Horizons, 19-oct-2026).
const fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..');
const BASE_URL = 'https://ggeelcano.github.io/demos/ms-diseno-textil/';
const WA = '34651951990';
const wa = t => `https://wa.me/${WA}?text=${encodeURIComponent(t)}`;
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const meta = JSON.parse(fs.readFileSync(path.join(ROOT, '_src', 'meta.json'), 'utf8'));
const dims = id => { const m = meta.find(x => x.id === id); return m ? `width="${m.w}" height="${m.h}"` : ''; };

// ---------- Catálogo ----------
// tab: lab = ropa laboral, ref = reflectantes, dep = deportiva, per = personalizada, gor = gorras
const P = [
  { id: 'refl-naranja', tab: 'ref', top: 1, name: 'Camiseta laboral reflectante naranja', img: 'cb17972e-00', img2: 'cb17972e-10', price: '14,90 €', tag: 'Más pedida', colors: ['#ff7a00'] },
  { id: 'refl-amarilla', tab: 'ref', top: 1, name: 'Camiseta laboral reflectante amarilla', img: 'd8eedf67-00', img2: 'd8eedf67-10', price: '14,90 €', tag: 'Más pedida', colors: ['#e6f700'] },
  { id: 'camiseta-dtf', tab: 'per', top: 1, name: 'Camiseta personalizable DTF', img: '0826ef9d', price: '14,90 €', tag: 'Desde 1 unidad', colors: ['#111', '#fff'], fit: 'contain' },
  { id: 'polo-naranja', tab: 'lab', top: 1, name: 'Polo laboral naranja', img: '0645b838-00', img2: '0645b838-10', price: 'Desde 18,90 €', tag: 'Empresas', colors: ['#ff7a00'] },
  { id: 'polo-amarillo', tab: 'lab', name: 'Polo laboral amarillo', img: 'c98b570d-00', img2: 'c98b570d-10', price: 'Desde 18,90 €', tag: 'Empresas', colors: ['#e6f700'] },
  { id: 'sudadera-naranja', tab: 'lab', name: 'Sudadera laboral naranja', img: '09c90815-00', img2: '09c90815-20', price: 'Desde 26,90 €', tag: 'Empresas', colors: ['#ff7a00'] },
  { id: 'sudadera-amarilla', tab: 'lab', top: 1, name: 'Sudadera laboral amarilla', img: 'fce49be3-00', img2: 'fce49be3-20', price: 'Desde 26,90 €', tag: 'Empresas', colors: ['#e6f700'] },
  { id: 'chaqueta-naranja', tab: 'lab', top: 1, name: 'Chaqueta laboral naranja', img: '3ad28df0-00', img2: '3ad28df0-30', price: 'Desde 39,90 €', tag: 'Invierno', colors: ['#ff7a00'] },
  { id: 'chaqueta-amarilla', tab: 'lab', name: 'Chaqueta laboral amarilla', img: '2b43ee05-00', img2: '2b43ee05-30', price: 'Desde 39,90 €', tag: 'Invierno', colors: ['#e6f700'] },
  { id: 'tecnica', tab: 'dep', top: 1, name: 'Camiseta técnica deportiva', img: '65ccfcc4', price: 'Precio a consultar', tag: 'Clubes', colors: ['#111'], fit: 'contain' },
  { id: 'tecnica-sm', tab: 'dep', name: 'Camiseta técnica sin mangas', img: 'e8d8c7da', price: 'Precio a consultar', tag: 'Gimnasios', colors: ['#111'], fit: 'contain' },
  { id: 'dep-mc', tab: 'dep', name: 'Camiseta deportiva manga corta', img: 'e132eae9', price: 'Precio a consultar', tag: 'Catálogo 2026', fit: 'contain' },
  { id: 'dep-sm', tab: 'dep', name: 'Camiseta deportiva sin mangas', img: 'c56a4a80', price: 'Precio a consultar', tag: 'Catálogo 2026', fit: 'contain' },
  { id: 'dep-tir', tab: 'dep', name: 'Camiseta deportiva de tirantes', img: '11ab80e5', price: 'Precio a consultar', tag: 'Catálogo 2026', fit: 'contain' },
  { id: 'dep-caida', tab: 'dep', name: 'Camiseta deportiva manga caída', img: '44f02832', price: 'Precio a consultar', tag: 'Catálogo 2026', fit: 'contain' },
  { id: 'sudadera-capucha', tab: 'per', name: 'Sudadera con capucha DTF', img: '0eb67212', price: 'Precio a consultar', tag: 'Grupos', colors: ['#111'], fit: 'contain' },
  { id: 'softshell', tab: 'per', name: 'Chaqueta softshell personalizable', img: 'bbf704d9', price: 'Precio a consultar', tag: 'Empresas', colors: ['#111'], fit: 'contain' },
  { id: 'polo-dtf', tab: 'per', name: 'Polo personalizable DTF', img: '2a327ea3', img2: '0fc9599e', price: 'Precio a consultar', tag: 'Desde 1 unidad', colors: ['#111'], fit: 'contain' },
  { id: 'gorra-leon', tab: 'gor', top: 1, name: 'Gorra personalizada · león', img: '40e72e8f', price: 'Precio a consultar', tag: 'Gorras', colors: ['#111'], fit: 'contain' },
  { id: 'gorra-mono', tab: 'gor', name: 'Gorra personalizada · monograma', img: 'e2770236', price: 'Precio a consultar', tag: 'Gorras', colors: ['#111'], fit: 'contain' },
  { id: 'gorra-calavera', tab: 'gor', name: 'Gorra personalizada · calavera', img: '5b3d3f27', price: 'Precio a consultar', tag: 'Gorras', colors: ['#111'], fit: 'contain' },
];
const TABS = [['top', 'Lo más pedido'], ['lab', 'Ropa laboral'], ['ref', 'Reflectantes'], ['dep', 'Ropa deportiva'], ['per', 'Personalizada'], ['gor', 'Gorras']];

const card = p => {
  const msg = `Hola, me interesa: ${p.name} (${p.price}). ¿Me preparáis una oferta?`;
  return `<li class="card" data-tabs="${p.tab}${p.top ? ' top' : ''}" data-name="${esc(p.name.toLowerCase())}">
  <a href="${esc(wa(msg))}" target="_blank" rel="noopener">
    <div class="card-img${p.fit ? ' contain' : ''}">
      <img src="img/${p.img}.webp" alt="${esc(p.name)}" loading="lazy" ${dims(p.img)}>
      ${p.img2 ? `<img class="alt" src="img/${p.img2}.webp" alt="" loading="lazy" ${dims(p.img2)}>` : ''}
    </div>
    <span class="tag">${esc(p.tag)}</span>
    <h3>${esc(p.name)}</h3>
    ${p.colors ? `<span class="dots" aria-hidden="true">${p.colors.map(c => `<i style="background:${c}"></i>`).join('')}</span>` : ''}
    <p class="price${/consultar/.test(p.price) ? ' soft' : ''}">${esc(p.price)}</p>
  </a>
</li>`;
};

// ---------- Diseños de inspiración (fichas de ejemplo de su tienda) ----------
const DIS = [
  ['6836f0ef', 'ALFA · Born to Rule', 'León dorado sobre negro'],
  ['8405350b', 'Catrina rosas', 'Rojo y oro sobre negro'],
  ['6ce08bd2', 'No soy perfecta', 'Ilustración a color'],
  ['987beed8', 'No sigo, lidero', 'Half face con corona'],
  ['b9806a80', 'Nivel Pro', 'Diseño gaming'],
  ['7ad87dbc', 'Stay Classy', 'Leopardo sobre blanco'],
  ['1e234a61', 'Sin Miedo', 'Calavera streetwear'],
  ['66f2be3e', 'Dueña de mi camino', 'Oso rosa sobre negro'],
  ['559628c5', 'Trust Nobody', 'Calavera y serpiente'],
  ['18944dae', 'Rostro dual', 'Oro y metal'],
];

// ---------- Trabajos reales (galería de su web) ----------
const TRAB = [
  ['23ac7695', 'Regalos', 'Camiseta «Súper abuela» para un regalo familiar', 'Ilustración a todo color sobre camiseta blanca. Encargo de una sola unidad.'],
  ['7ccbc2a4', 'Particulares', 'Diseños artísticos en blanco y negro', 'Calavera floral y retrato con mucho detalle: el DTF mantiene las líneas finas.'],
  ['42a75e7c', 'Otros textiles', 'Manta o bandera personalizada', 'No solo camisetas: también estampamos textiles grandes con varios motivos.'],
  ['ef565595', 'Regalos', 'Camiseta negra con diseño familiar', 'Colores vivos sobre fondo negro, preparada para entregar en mano.'],
];

const CATS = [
  ['4e06fa9c', 'Camisetas', 'per'], ['ecf4e059', 'Polos', 'lab'], ['06308917', 'Sudaderas', 'lab'], ['3c1e7013', 'Chaquetas y softshell', 'lab'],
  ['67c815e6', 'Reflectantes', 'ref'], ['677b66af', 'Equipos y clubes', 'dep'], ['f1adb63f', 'Gorras', 'gor'], ['ee790a54', 'Ropa laboral', 'lab'],
];

const FAQ = [
  ['¿Puedo pedir una sola camiseta?', 'Sí. Puedes pedir desde 1 unidad. En la tienda eliges la prenda y la cantidad; para diseños muy concretos también puedes pedir oferta por WhatsApp.'],
  ['¿Qué productos puedo personalizar?', 'Camisetas, polos, sudaderas, chaquetas, softshell, ropa laboral y reflectante, ropa deportiva, prendas para equipos y clubes, gorras y otros textiles, siempre con impresión DTF.'],
  ['¿Qué es DTF?', 'DTF (Direct To Film) es una técnica de impresión textil que transfiere diseños a todo color a la prenda con mucho detalle. Funciona sobre prendas claras y oscuras.'],
  ['¿Puedo enviar mi propio diseño?', 'Sí. Envíanos tu logotipo, una imagen, un texto o solo la idea y lo adaptamos a la prenda. Necesitas tener derechos sobre el material que nos mandes.'],
  ['¿Hacéis pedidos para empresas y equipos?', 'Sí. Para empresas, clubes o grupos preparamos una oferta según prenda, cantidad y personalización (escudo, nombres, números, patrocinadores…). A mayor cantidad, mejor precio por unidad.'],
  ['¿Qué tallas y colores hay?', 'Dependen de cada prenda. En la ficha o en tu oferta te indicamos las tallas y colores disponibles; si necesitas un tallaje concreto, pregúntanos.'],
  ['¿Cómo funciona el envío?', 'Enviamos a toda España desde Rubí (Barcelona). Tarifa desde 3,90 € y envío gratis en pedidos desde 50 € a península.'],
  ['¿Cómo se paga?', 'Los pedidos personalizados se confirman antes de producirlos: te indicamos importe total, forma de pago y plazo antes de empezar.'],
];

const I = {
  wa: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm0 18.2c-1.5 0-3-.4-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2Zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.3-.4.2-.4.7-1.3.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2c0 1.3.9 2.5 1 2.7.1.2 1.8 2.8 4.5 3.9 1.7.7 2.3.8 3.1.6.5-.1 1.5-.6 1.7-1.2.2-.6.2-1.1.2-1.2l-.4-.3Z"/></svg>',
  search: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7" fill="none" stroke="currentColor" stroke-width="2"/><path d="m20 20-4-4" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
  pin: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="1.8" d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21Z"/><circle cx="12" cy="9.5" r="2.5" fill="none" stroke="currentColor" stroke-width="1.8"/></svg>',
  mail: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="m4 7 8 6 8-6" fill="none" stroke="currentColor" stroke-width="1.8"/></svg>',
  menu: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 6h18M3 12h18M3 18h18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
  close: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 5l14 14M19 5 5 19" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
  prev: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m15 5-7 7 7 7" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  next: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9 5 7 7-7 7" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  ig: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5" fill="none" stroke="currentColor" stroke-width="1.8"/><circle cx="12" cy="12" r="4" fill="none" stroke="currentColor" stroke-width="1.8"/><circle cx="17.5" cy="6.5" r="1.2" fill="currentColor"/></svg>',
  tt: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M16.6 3c.3 2.3 1.7 3.8 4 4v3.1c-1.5.1-2.8-.4-4-1.2v6.3c0 3.4-2.6 5.8-5.8 5.8A5.7 5.7 0 0 1 5 15.2c0-3.6 3.1-6.2 6.7-5.6v3.3c-1.8-.5-3.5.6-3.5 2.4 0 1.4 1.1 2.5 2.6 2.5 1.6 0 2.6-1 2.6-2.9V3h3.2Z"/></svg>',
  truck: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M2 6h11v9H2zM13 9h4l3 3v3h-7z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><circle cx="6" cy="17" r="2" fill="#fff" stroke="currentColor" stroke-width="1.8"/><circle cx="17" cy="17" r="2" fill="#fff" stroke="currentColor" stroke-width="1.8"/></svg>',
  one: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 4h8l4 3-2 4-2-1v10H8V10l-2 1-2-4 4-3Z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/></svg>',
  chat: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 5h16v11H9l-5 4V5Z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><path d="M8 9h8M8 12h5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>',
  print: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 9V3h12v6M6 18H4v-7h16v7h-2M7 14h10v7H7z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/></svg>',
};

const logo = (dark) => `<span class="logo${dark ? ' dark' : ''}"><span class="logo-ms"><b>M</b>S</span><span class="logo-bar"></span><span class="logo-sub">Personalización textil</span></span>`;

const html = `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Ropa personalizada DTF en Rubí (Barcelona) | MS Diseño Textil</title>
<meta name="description" content="Camisetas, polos, sudaderas, ropa laboral y equipaciones personalizadas con impresión DTF en Rubí (Barcelona). Desde 1 unidad, envíos a toda España y presupuesto por WhatsApp.">
<meta name="robots" content="noindex">
<meta name="theme-color" content="#111111">
<meta property="og:type" content="website">
<meta property="og:site_name" content="MS Diseño Textil">
<meta property="og:url" content="${BASE_URL}">
<meta property="og:title" content="MS Diseño Textil · Ropa personalizada DTF">
<meta property="og:description" content="Ropa laboral, deportiva y personalizada con tu logo o tu diseño. Desde 1 unidad.">
<meta property="og:image" content="${BASE_URL}img/og.jpg">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Crect width='64' height='64' rx='12' fill='%23111'/%3E%3Ctext x='32' y='44' font-family='Arial Black,Arial' font-weight='900' font-size='30' text-anchor='middle'%3E%3Ctspan fill='%23e10600'%3EM%3C/tspan%3E%3Ctspan fill='%23fff'%3ES%3C/tspan%3E%3C/text%3E%3C/svg%3E">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@600;700;800&family=Barlow:wght@400;500;600;700&display=swap" rel="stylesheet">
<link rel="preload" as="image" href="img/hero-ee790a54.webp">
<link rel="stylesheet" href="estilo.css">
<script type="application/ld+json">${JSON.stringify({
  '@context': 'https://schema.org', '@type': 'LocalBusiness', name: 'MS Diseño Textil', url: 'https://msdisenotextil.es',
  description: 'Personalización textil mediante impresión DTF para empresas, equipos, clubes, eventos y particulares desde Rubí (Barcelona).',
  telephone: '+34651951990', email: 'info@msdisenotextil.es', image: BASE_URL + 'img/hero-45b074f8.webp',
  address: { '@type': 'PostalAddress', addressLocality: 'Rubí', addressRegion: 'Barcelona', addressCountry: 'ES' },
  sameAs: ['https://www.instagram.com/martasainz.art', 'https://www.tiktok.com/@.ms.marta.sainz'],
})}</script>
<script type="application/ld+json">${JSON.stringify({ '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: FAQ.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })) })}</script>
</head>
<body>
<a class="skip" href="#main">Saltar al contenido</a>

<div class="topbar" role="region" aria-label="Avisos">
  <p class="topbar-msg"><span class="on">Envío gratis desde 50 € a península</span><span>Pedidos desde 1 unidad</span><span>Presupuesto sin compromiso por WhatsApp</span></p>
</div>

<header class="header" id="arriba">
  <div class="header-row wrap">
    <button class="icon-btn only-m" id="abrirMenu" aria-label="Abrir menú" aria-expanded="false" aria-controls="menu">${I.menu}</button>
    <a href="#arriba" class="brand" aria-label="MS Diseño Textil, inicio">${logo()}</a>
    <form class="search" role="search" id="buscador">
      <label for="q" class="sr">Buscar prendas</label>
      ${I.search}
      <input id="q" type="search" placeholder="¿Qué quieres personalizar? Camiseta, polo, gorra…" autocomplete="off">
    </form>
    <nav class="tools" aria-label="Accesos rápidos">
      <a href="#taller">${I.pin}<span>Taller</span></a>
      <a href="mailto:info@msdisenotextil.es">${I.mail}<span>Email</span></a>
      <a href="${esc(wa('Hola, me gustaría pedir un presupuesto.'))}" target="_blank" rel="noopener" class="tool-wa">${I.wa}<span>WhatsApp</span></a>
    </nav>
  </div>
  <nav class="menu" id="menu" aria-label="Categorías">
    <div class="menu-head only-m">${logo()}<button class="icon-btn" id="cerrarMenu" aria-label="Cerrar menú">${I.close}</button></div>
    <ul class="wrap">
      <li><a href="#tienda" data-go="lab">Ropa laboral</a></li>
      <li><a href="#tienda" data-go="ref">Reflectantes</a></li>
      <li><a href="#tienda" data-go="dep">Ropa deportiva</a></li>
      <li><a href="#tienda" data-go="per">Personalizada</a></li>
      <li><a href="#tienda" data-go="gor">Gorras</a></li>
      <li><a href="#inspirate">Diseños</a></li>
      <li><a href="#trabajos">Trabajos</a></li>
      <li><a href="#presupuesto">Empresas y clubes</a></li>
      <li class="menu-hot"><a href="https://msdisenotextil.es/disena-tu-camiseta">Diseña tu camiseta</a></li>
    </ul>
  </nav>
</header>
<div class="velo" id="velo" hidden></div>

<main id="main">

<section class="hero" aria-roledescription="carrusel" aria-label="Destacados">
  <div class="slides">
    <article class="slide on" aria-label="1 de 3">
      <img src="img/hero-ee790a54.webp" alt="Dos trabajadores con chaquetas de empresa personalizadas" width="1216" height="896" fetchpriority="high">
      <div class="slide-txt wrap">
        <p class="kicker">Empresas · Equipos de trabajo</p>
        <h1>Ropa laboral con tu logo</h1>
        <p>Camisetas, polos, sudaderas y chaquetas personalizadas con DTF. Pide una o pide cien.</p>
        <div class="btns"><a class="btn white" href="#tienda" data-go="lab">Ver ropa laboral</a><a class="btn ghost" href="#presupuesto">Pedir presupuesto</a></div>
      </div>
    </article>
    <article class="slide" aria-label="2 de 3">
      <img src="img/hero-677b66af.webp" alt="Equipo de fútbol con equipación roja personalizada" width="1216" height="896" loading="lazy">
      <div class="slide-txt wrap">
        <p class="kicker">Clubes · Gimnasios · Eventos</p>
        <h2 class="h1">Equipa a tu club</h2>
        <p>Escudo, nombres, números y patrocinadores. Te preparamos la oferta para toda la plantilla.</p>
        <div class="btns"><a class="btn white" href="#tienda" data-go="dep">Ropa deportiva</a><a class="btn ghost" href="${esc(wa('Hola, quiero presupuesto para la ropa de un equipo/club.'))}" target="_blank" rel="noopener">Presupuesto para equipos</a></div>
      </div>
    </article>
    <article class="slide" aria-label="3 de 3">
      <img src="img/hero-45b074f8.webp" alt="Prensa térmica estampando un diseño DTF en una camiseta negra" width="1280" height="832" loading="lazy">
      <div class="slide-txt wrap">
        <p class="kicker">Particulares · Desde 1 unidad</p>
        <h2 class="h1">Diseña tu camiseta · 14,90 €</h2>
        <p>Sube tu diseño, elige color, talla y si va delante, detrás o en los dos lados.</p>
        <div class="btns"><a class="btn white" href="https://msdisenotextil.es/disena-tu-camiseta">Diseñar ahora</a><a class="btn ghost" href="#inspirate">Ver ideas</a></div>
      </div>
    </article>
  </div>
  <div class="hero-nav wrap" role="tablist" aria-label="Elegir destacado">
    <button role="tab" aria-selected="true" class="on"><span>Ropa laboral</span><i></i></button>
    <button role="tab" aria-selected="false"><span>Clubes</span><i></i></button>
    <button role="tab" aria-selected="false"><span>Diseña tu camiseta</span><i></i></button>
  </div>
</section>

<section class="sec" id="tienda" aria-labelledby="t-tienda">
  <div class="wrap">
    <div class="sec-head">
      <h2 id="t-tienda">Tienda</h2>
      <div class="arrows only-d"><button class="arrow" data-dir="-1" aria-label="Productos anteriores">${I.prev}</button><button class="arrow" data-dir="1" aria-label="Más productos">${I.next}</button></div>
    </div>
    <div class="tabs" role="tablist" aria-label="Categorías de la tienda">
      ${TABS.map(([k, t], i) => `<button role="tab" data-tab="${k}" aria-selected="${i === 0}"${i === 0 ? ' class="on"' : ''}>${t}</button>`).join('')}
    </div>
    <p class="search-info" id="searchInfo" hidden></p>
    <ul class="rail" id="rail">
${P.map(card).join('\n')}
    </ul>
    <div class="center"><a class="btn outline" href="${esc(wa('Hola, ¿me pasáis el catálogo 2026 completo?'))}" target="_blank" rel="noopener">Pedir el catálogo 2026 completo</a></div>
    <p class="note">Las prendas reflectantes se venden como ropa de trabajo personalizable, no como EPI certificado.</p>
  </div>
</section>

<section class="duo wrap" aria-label="Campañas">
  <a class="promo" href="#tienda" data-go="ref">
    <img src="img/2214f59a.webp" alt="Operario con camiseta reflectante naranja personalizada" loading="lazy" ${dims('2214f59a')}>
    <span class="promo-txt"><strong>Alta visibilidad</strong><span>Camisetas reflectantes con tu logo · 14,90 €</span><span class="btn white sm">Ver reflectantes</span></span>
  </a>
  <a class="promo" href="https://msdisenotextil.es/disena-tu-camiseta">
    <img src="img/e5bca58e.webp" alt="Dos chicas con camisetas personalizadas por delante y por detrás" loading="lazy" ${dims('e5bca58e')}>
    <span class="promo-txt"><strong>Tu idea, en tu camiseta</strong><span>Delante, detrás o en los dos lados</span><span class="btn white sm">Diseñar la mía</span></span>
  </a>
</section>

<section class="sec" id="inspirate" aria-labelledby="t-insp">
  <div class="wrap">
    <div class="sec-head">
      <h2 id="t-insp">Inspírate: diseños DTF</h2>
      <div class="arrows only-d"><button class="arrow" data-rail="railDis" data-dir="-1" aria-label="Diseños anteriores">${I.prev}</button><button class="arrow" data-rail="railDis" data-dir="1" aria-label="Más diseños">${I.next}</button></div>
    </div>
    <p class="sec-sub">Diseños de la casa listos para estampar. Pide el que te guste tal cual o cambiando colores y texto.</p>
    <ul class="rail tall" id="railDis">
${DIS.map(([id, t, s]) => `      <li class="look"><img src="img/${id}.webp" alt="Camiseta con diseño ${esc(t)}" loading="lazy" ${dims(id)}><div class="look-txt"><strong>${esc(t)}</strong><span>${esc(s)}</span><a class="btn white sm" href="${esc(wa(`Hola, me gusta el diseño «${t}». ¿Me decís precio?`))}" target="_blank" rel="noopener">Lo quiero</a></div></li>`).join('\n')}
    </ul>
  </div>
</section>

<section class="guia" aria-labelledby="t-guia">
  <div class="wrap guia-in">
    <div class="guia-txt">
      <h2 id="t-guia">¿No sabes qué elegir?</h2>
      <p>Dinos para quién es y te recomendamos prenda, cantidad y dónde va el estampado. Te contestamos por WhatsApp de lunes a viernes, de 9:00 a 20:00.</p>
    </div>
    <ul class="guia-cards">
      <li><a href="${esc(wa('Hola, soy una empresa y necesito ropa de trabajo con nuestro logo.'))}" target="_blank" rel="noopener"><img src="img/ae031205.webp" alt="" loading="lazy" ${dims('ae031205')}><span>Soy una empresa</span></a></li>
      <li><a href="${esc(wa('Hola, somos un club/equipo y queremos equiparnos.'))}" target="_blank" rel="noopener"><img src="img/aa9f75cc.webp" alt="" loading="lazy" ${dims('aa9f75cc')}><span>Somos un club</span></a></li>
      <li><a href="${esc(wa('Hola, quiero una camiseta personalizada para un regalo.'))}" target="_blank" rel="noopener"><img src="img/23ac7695.webp" alt="" loading="lazy" ${dims('23ac7695')}><span>Es un regalo</span></a></li>
    </ul>
  </div>
</section>

<section class="sec" aria-labelledby="t-cat">
  <div class="wrap">
    <h2 id="t-cat" class="sec-title">Categorías</h2>
    <ul class="cats">
${CATS.map(([id, t, tab]) => `      <li><a href="#tienda" data-go="${tab}"><span class="cat-img"><img src="img/${id}.webp" alt="" loading="lazy" ${dims(id)}></span><span>${esc(t)}</span></a></li>`).join('\n')}
    </ul>
  </div>
</section>

<section class="sec" id="trabajos" aria-labelledby="t-trab">
  <div class="wrap">
    <h2 id="t-trab" class="sec-title big">Lo último del taller <a href="https://www.instagram.com/martasainz.art" target="_blank" rel="noopener">@martasainz.art</a></h2>
    <ul class="posts">
${TRAB.map(([id, tag, t, d]) => `      <li class="post"><div class="post-img"><img src="img/${id}.webp" alt="${esc(t)}" loading="lazy" ${dims(id)}><span class="tag dark">${esc(tag)}</span></div><h3>${esc(t)}</h3><p>${esc(d)}</p></li>`).join('\n')}
    </ul>
  </div>
</section>

<section class="pasos" aria-labelledby="t-pasos">
  <div class="wrap">
    <h2 id="t-pasos" class="sec-title">Así trabajamos</h2>
    <ol>
      <li><b>01</b><strong>Cuéntanos qué necesitas</strong><span>La prenda, la idea y para qué la quieres.</span></li>
      <li><b>02</b><strong>Elegimos prenda y diseño</strong><span>Te proponemos opciones adaptadas a tu pedido.</span></li>
      <li><b>03</b><strong>Confirmas el pedido</strong><span>Precio cerrado antes de estampar nada.</span></li>
      <li><b>04</b><strong>Estampamos y enviamos</strong><span>DTF en nuestro taller de Rubí y envío a toda España.</span></li>
    </ol>
  </div>
</section>

<section class="social wrap" aria-label="Redes sociales">
  <a href="https://www.instagram.com/martasainz.art" target="_blank" rel="noopener">${I.ig}<span>@martasainz.art</span></a>
  <a href="https://www.tiktok.com/@.ms.marta.sainz" target="_blank" rel="noopener">${I.tt}<span>@.ms.marta.sainz</span></a>
  <a href="${esc(wa('Hola, tengo una consulta.'))}" target="_blank" rel="noopener">${I.wa}<span>651 951 990</span></a>
  <a href="mailto:info@msdisenotextil.es">${I.mail}<span>info@msdisenotextil.es</span></a>
</section>

<section class="sec seo" id="taller" aria-labelledby="t-seo">
  <div class="wrap seo-in">
    <div>
      <h2 id="t-seo" class="sec-title big">Personalización textil DTF en Rubí</h2>
      <p>Somos MS Diseño Textil, un taller de personalización textil con impresión DTF en Rubí (Barcelona). Trabajamos para empresas, equipos, clubes, grupos, eventos y particulares, y adaptamos cada pedido a lo que necesita cada cliente.</p>
      <p>Personalizamos camisetas, polos, sudaderas, chaquetas, softshell, ropa laboral, ropa deportiva, gorras y otros textiles. Partimos de tu logotipo, una imagen, un texto o una idea y lo ajustamos a la prenda y a la cantidad. Puedes pedir desde una sola unidad, y enviamos a toda España.</p>
    </div>
    <ul class="ventajas">
      <li>${I.one}<strong>Desde 1 unidad</strong><span>Sin pedido mínimo</span></li>
      <li>${I.truck}<strong>Envío gratis desde 50 €</strong><span>Península. Desde 3,90 €</span></li>
      <li>${I.print}<strong>Solo DTF</strong><span>Color y detalle en claro y oscuro</span></li>
      <li>${I.chat}<strong>Trato directo</strong><span>L-V de 9:00 a 20:00</span></li>
    </ul>
  </div>
</section>

<section class="sec faq" id="ayuda" aria-labelledby="t-faq">
  <div class="wrap faq-in">
    <h2 id="t-faq" class="sec-title big">Preguntas frecuentes</h2>
    <div>
${FAQ.map(([q, a]) => `      <details><summary>${esc(q)}</summary><p>${esc(a)}</p></details>`).join('\n')}
    </div>
  </div>
</section>

<section class="oferta" id="presupuesto" aria-labelledby="t-of">
  <div class="wrap oferta-in">
    <div class="oferta-txt">
      <p class="kicker">Empresas · Equipos · Clubes · Eventos</p>
      <h2 id="t-of">¿Necesitas varias unidades?</h2>
      <p>Dinos la prenda, la cantidad y tu idea. Te mandamos la oferta por WhatsApp, sin compromiso.</p>
    </div>
    <form class="form" id="formOferta" novalidate>
      <div class="f"><label for="f-nombre">Nombre</label><input id="f-nombre" name="nombre" required autocomplete="name"></div>
      <div class="f"><label for="f-empresa">Empresa o club (opcional)</label><input id="f-empresa" name="empresa" autocomplete="organization"></div>
      <div class="f"><label for="f-prenda">Prenda</label><select id="f-prenda" name="prenda"><option>Camisetas</option><option>Polos</option><option>Sudaderas</option><option>Chaquetas / softshell</option><option>Ropa laboral reflectante</option><option>Ropa deportiva / equipos</option><option>Gorras</option><option>Otros</option></select></div>
      <div class="f"><label for="f-cant">Cantidad aproximada</label><input id="f-cant" name="cantidad" inputmode="numeric" placeholder="Ej.: 25"></div>
      <div class="f full"><label for="f-idea">Tu idea o diseño</label><textarea id="f-idea" name="idea" rows="3" placeholder="Logo delante, nombre detrás, colores…"></textarea></div>
      <p class="f-err full" id="fErr" role="alert" hidden>Pon tu nombre para que sepamos a quién contestar.</p>
      <button class="btn red full" type="submit">${I.wa} Enviar por WhatsApp</button>
    </form>
  </div>
</section>

</main>

<footer class="footer">
  <div class="wrap foot-in">
    <div class="foot-brand">
      ${logo(true)}
      <p>Personalización textil con impresión DTF para empresas, equipos, clubes, eventos y particulares.</p>
      <p class="foot-loc">${I.pin} Rubí, Barcelona</p>
    </div>
    <div><h2>Tienda</h2><ul><li><a href="#tienda" data-go="lab">Ropa laboral</a></li><li><a href="#tienda" data-go="ref">Reflectantes</a></li><li><a href="#tienda" data-go="dep">Ropa deportiva</a></li><li><a href="#tienda" data-go="per">Personalizada</a></li><li><a href="#tienda" data-go="gor">Gorras</a></li></ul></div>
    <div><h2>Ayuda</h2><ul><li><a href="#ayuda">Preguntas frecuentes</a></li><li><a href="https://msdisenotextil.es/legal/envios">Envíos</a></li><li><a href="https://msdisenotextil.es/legal/devoluciones">Devoluciones</a></li><li><a href="https://msdisenotextil.es/legal/compra">Condiciones de compra</a></li></ul></div>
    <div><h2>Contacto</h2><ul><li><a href="${esc(wa('Hola, tengo una consulta.'))}" target="_blank" rel="noopener">WhatsApp 651 951 990</a></li><li><a href="mailto:info@msdisenotextil.es">info@msdisenotextil.es</a></li><li><a href="https://www.instagram.com/martasainz.art" target="_blank" rel="noopener">Instagram</a></li><li><a href="https://www.tiktok.com/@.ms.marta.sainz" target="_blank" rel="noopener">TikTok</a></li></ul></div>
  </div>
  <div class="wrap foot-legal">
    <p>© 2026 MS Diseño Textil · Rubí (Barcelona)</p>
    <p><a href="https://msdisenotextil.es/legal/aviso-legal">Aviso legal</a><a href="https://msdisenotextil.es/legal/privacidad">Privacidad</a><a href="https://msdisenotextil.es/legal/cookies">Cookies</a></p>
  </div>
</footer>

<script>window.MS_WA=${JSON.stringify(WA)};</script>
<script src="app.js" defer></script>
</body>
</html>
`;
fs.writeFileSync(path.join(ROOT, 'index.html'), html);
console.log('index.html', (html.length / 1024).toFixed(1), 'KB');
