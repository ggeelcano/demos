// Monta las páginas de la demo: cabecera + contenido + pie, con las etiquetas comunes.
//   node _paginas.mjs
import fs from 'fs';

const BASE = 'https://ggeelcano.github.io/demos/urbanmoto/';
const V = Date.now().toString(36);
const leer = f => fs.readFileSync('_plantillas/' + f, 'utf8');
const sprite = leer('iconos.svg'), cabecera = leer('cabecera.html'), pie = leer('pie.html');

const PAGINAS = [
  { archivo: 'index.html', plantilla: 'inicio.html', js: 'inicio.js',
    titulo: 'Urbanmoto · Recambios para scooter, pit bike y minimoto',
    desc: 'Recambios para scooter, pit bike y minimoto: carburadores, cilindros, frenos, CDI y más. Envío en 24/48 h desde Osuna (Sevilla). 4,9/5 en Wallapop.' },
  { archivo: 'tienda.html', plantilla: 'tienda.html', js: 'tienda.js',
    titulo: 'Tienda · Urbanmoto',
    desc: 'Todos los recambios de Urbanmoto con stock: motor, carburación, parte ciclo, eléctrico, pit bike y minimoto. Busca por tu moto.' },
  { archivo: 'producto.html', plantilla: 'producto.html', js: 'producto.js',
    titulo: 'Recambio · Urbanmoto',
    desc: 'Recambios para scooter, pit bike y minimoto con envío en 24/48 h.' },
  { archivo: 'cesta.html', plantilla: 'cesta.html', js: 'cesta.js',
    titulo: 'Mi cesta · Urbanmoto',
    desc: 'Tu cesta en Urbanmoto. Envío en 24/48 h y pago seguro con tarjeta, Bizum o PayPal.' },
  { archivo: 'ayuda.html', plantilla: 'ayuda.html', js: null,
    titulo: 'Ayuda, envíos y devoluciones · Urbanmoto',
    desc: 'Envíos en 24/48 h, devoluciones en 15 días, pago seguro y contacto por WhatsApp con Urbanmoto.' },
];

for (const p of PAGINAS) {
  const html = `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${p.titulo}</title>
<meta name="description" content="${p.desc}">
<meta name="robots" content="noindex, nofollow">
<meta name="theme-color" content="#000000">
<link rel="icon" href="favicon.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="apple-touch-icon.png">
<meta property="og:type" content="website">
<meta property="og:site_name" content="Urbanmoto">
<meta property="og:title" content="${p.archivo === 'index.html' ? 'Urbanmoto · Tu tienda de recambios de moto urbana' : p.titulo}">
<meta property="og:description" content="${p.desc}">
<meta property="og:image" content="${BASE}img/og.jpg?v=1">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:url" content="${BASE}${p.archivo === 'index.html' ? '' : p.archivo}">
<meta property="og:locale" content="es_ES">
<meta name="twitter:card" content="summary_large_image">
<link rel="preload" href="assets/fonts/montserrat-normal.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="assets/estilos.css?v=${V}">
</head>
<body>
${sprite}
${cabecera}
<main id="contenido" tabindex="-1">
${leer(p.plantilla)}
</main>
${pie}
<script src="assets/catalogo.js?v=${V}" defer></script>
<script src="assets/comun.js?v=${V}" defer></script>
${p.js ? `<script src="assets/${p.js}?v=${V}" defer></script>\n` : ''}</body>
</html>
`;
  fs.writeFileSync(p.archivo, html);
  console.log(p.archivo, html.length);
}
fs.writeFileSync('favicon.svg', `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="12" fill="#0b0b0b"/><path d="M17 14h9l-4 21c-1 5 1 8 6 8s8-3 9-8l4-21h9l-4 22c-2 10-9 15-19 15S12 46 14 36z" fill="#ee7d1f"/></svg>\n`);
