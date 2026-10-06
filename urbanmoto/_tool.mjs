// Herramienta de la demo Urbanmoto: servidor local + Chrome por CDP (sin dependencias).
//   node _tool.mjs sheet                      -> _out/sheet.png con todas las fotos de images/orig
//   node _tool.mjs fotos <json>               -> redimensiona/comprime con canvas: [{src,out,w,q}]
//   node _tool.mjs shot <ruta> <ancho> <png> [full]
//   node _tool.mjs check                      -> mide desbordes a 320/360/390/430 y 1366
import http from 'http';
import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';

const DIR = path.dirname(new URL(import.meta.url).pathname.replace(/^\/(\w:)/, '$1'));
const OUT = path.join(DIR, '_out');
fs.mkdirSync(OUT, { recursive: true });
const PORT = 8494, CDP = 9353;
const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const sleep = ms => new Promise(r => setTimeout(r, ms));
const TIPOS = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.mjs': 'text/javascript',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.json': 'application/json' };

let pagSheet = '';
const server = http.createServer((req, res) => {
  const u = decodeURIComponent(req.url.split('?')[0]);
  if (u === '/__sheet') { res.writeHead(200, { 'Content-Type': 'text/html' }); return res.end(pagSheet); }
  if (req.method === 'POST' && u === '/__save') {
    const chunks = []; req.on('data', c => chunks.push(c));
    return req.on('end', () => {
      const { out, data } = JSON.parse(Buffer.concat(chunks).toString());
      fs.mkdirSync(path.dirname(path.join(DIR, out)), { recursive: true });
      fs.writeFileSync(path.join(DIR, out), Buffer.from(data.split(',')[1], 'base64'));
      res.end('ok');
    });
  }
  let f = path.join(DIR, u);
  if (fs.existsSync(f) && fs.statSync(f).isDirectory()) f = path.join(f, 'index.html');
  if (!fs.existsSync(f)) { res.writeHead(404); return res.end('404'); }
  res.writeHead(200, { 'Content-Type': TIPOS[path.extname(f).toLowerCase()] || 'application/octet-stream' });
  fs.createReadStream(f).pipe(res);
});

async function chrome() {
  const p = spawn(CHROME, ['--headless=new', '--disable-gpu', '--no-sandbox', '--mute-audio', '--no-first-run',
    '--disable-extensions', `--remote-debugging-port=${CDP}`, `--user-data-dir=${path.join(OUT, 'perfil')}`,
    '--window-size=1366,800', 'about:blank'], { stdio: 'ignore' });
  let info;
  for (let i = 0; i < 80 && !info; i++) {
    await sleep(250);
    try { info = (await (await fetch(`http://127.0.0.1:${CDP}/json/list`)).json()).find(t => t.type === 'page'); } catch (e) {}
  }
  if (!info) throw new Error('Chrome no arrancó');
  const ws = new WebSocket(info.webSocketDebuggerUrl);
  await new Promise((r, j) => { ws.onopen = r; ws.onerror = j; });
  let id = 0; const pend = new Map(); const errores = [];
  ws.onmessage = e => {
    const m = JSON.parse(e.data);
    if (m.id && pend.has(m.id)) { pend.get(m.id)(m); pend.delete(m.id); }
    if (m.method === 'Runtime.exceptionThrown') errores.push(m.params.exceptionDetails.exception?.description || m.params.exceptionDetails.text);
    if (m.method === 'Network.loadingFailed' && !m.params.canceled) errores.push('RED: ' + m.params.errorText);
    if (m.method === 'Network.responseReceived' && m.params.response.status >= 400) errores.push('HTTP ' + m.params.response.status + ' ' + m.params.response.url);
  };
  const send = (method, params = {}) => new Promise((r, j) => {
    const i = ++id; pend.set(i, m => m.error ? j(new Error(method + ': ' + JSON.stringify(m.error))) : r(m.result));
    ws.send(JSON.stringify({ id: i, method, params }));
  });
  await send('Page.enable'); await send('Runtime.enable'); await send('Network.enable');
  return { send, errores, cerrar: () => { try { ws.close(); } catch (e) {} p.kill(); } };
}
async function ev(c, expr) {
  const r = await c.send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true });
  if (r.exceptionDetails) throw new Error('JS: ' + (r.exceptionDetails.exception?.description || r.exceptionDetails.text));
  return r.result.value;
}
async function vista(c, ancho, alto = 844) {
  const movil = ancho < 800;
  await c.send('Emulation.setDeviceMetricsOverride', { width: ancho, height: movil ? alto : 800, deviceScaleFactor: movil ? +(process.env.DPR || 2) : 1, mobile: movil });
  await c.send('Emulation.setTouchEmulationEnabled', movil ? { enabled: true, maxTouchPoints: 5 } : { enabled: false });
}
async function ir(c, url, espera = 1800) { await c.send('Page.navigate', { url }); await sleep(espera); }
async function captura(c, archivo, full) {
  const p = { format: 'png' };
  if (full) {
    const h = await ev(c, 'document.documentElement.scrollHeight');
    const w = await ev(c, 'document.documentElement.clientWidth');
    p.clip = { x: 0, y: 0, width: w, height: Math.min(h, 12000), scale: 1 }; p.captureBeyondViewport = true;
  }
  const r = await c.send('Page.captureScreenshot', p);
  fs.writeFileSync(path.join(OUT, archivo), Buffer.from(r.data, 'base64'));
  console.log('captura', archivo);
}

const MEDIR = `(() => {
  document.documentElement.style.scrollBehavior = 'auto';
  const de = document.documentElement, cw = de.clientWidth, fuera = [];
  for (const el of document.querySelectorAll('body *')) {
    const r = el.getBoundingClientRect();
    if (r.width && (r.right > cw + 0.5 || r.left < -0.5)) {
      let p = el.parentElement, oculto = false;
      while (p) { const s = getComputedStyle(p); if (s.overflowX !== 'visible' && p !== de && p !== document.body) { const pr = p.getBoundingClientRect(); if (pr.right <= cw + 0.5) { oculto = true; break; } } p = p.parentElement; }
      if (!oculto) fuera.push(el.tagName.toLowerCase() + (el.className && typeof el.className === 'string' ? '.' + el.className.split(' ')[0] : '') + ' ' + Math.round(r.left) + '→' + Math.round(r.right));
    }
  }
  const imgsRotas = [...document.images].filter(i => i.complete && !i.naturalWidth).map(i => i.getAttribute('src'));
  return { cw, sw: de.scrollWidth, fuera: fuera.slice(0, 12), imgsRotas };
})()`;

const [cmd, ...args] = process.argv.slice(2);
await new Promise(r => server.listen(PORT, r));
const c = await chrome();
try {
  if (cmd === 'sheet') {
    const dir = args[0] || 'images/orig';
    const fotos = fs.readdirSync(path.join(DIR, dir)).filter(f => /\.(jpe?g|png|webp)$/i.test(f));
    pagSheet = `<body style="margin:0;font:13px sans-serif;background:#ddd"><div style="display:grid;grid-template-columns:repeat(5,1fr);gap:6px;padding:6px">` +
      fotos.map(f => `<figure style="margin:0;background:#fff"><img src="/${dir}/${f}" style="width:100%;height:190px;object-fit:contain;background:#999;display:block"><figcaption style="padding:2px 4px">${f} <b class=d></b></figcaption></figure>`).join('') + `</div>
      <script>onload=()=>document.querySelectorAll('figure').forEach(f=>{const i=f.querySelector('img');f.querySelector('.d').textContent=i.naturalWidth+'×'+i.naturalHeight})</script>`;
    await vista(c, 1500);
    await ir(c, `http://127.0.0.1:${PORT}/__sheet`, 3000);
    await captura(c, args[1] || 'sheet.png', true);
  } else if (cmd === 'fotos') {
    const lista = JSON.parse(fs.readFileSync(path.join(DIR, args[0]), 'utf8'));
    pagSheet = '<body></body>';
    await ir(c, `http://127.0.0.1:${PORT}/__sheet`, 500);
    for (const t of lista) {
      const r = await ev(c, `(async () => {
        const img = new Image(); img.src = ${JSON.stringify('/' + t.src)}; await img.decode();
        const cr = ${JSON.stringify(t.crop || null)};
        const sx = cr ? cr[0] * img.naturalWidth : 0, sy = cr ? cr[1] * img.naturalHeight : 0;
        const sw = cr ? cr[2] * img.naturalWidth : img.naturalWidth, sh = cr ? cr[3] * img.naturalHeight : img.naturalHeight;
        const w = Math.min(${t.w || 1600}, sw), h = Math.round(sh * w / sw);
        const cv = document.createElement('canvas'); cv.width = w; cv.height = h;
        const x = cv.getContext('2d'); x.imageSmoothingQuality = 'high';
        if (!/\.(png|webp)$/.test(${JSON.stringify(t.out)})) { x.fillStyle = '#fff'; x.fillRect(0, 0, w, h); }
        x.drawImage(img, sx, sy, sw, sh, 0, 0, w, h);
        const data = cv.toDataURL(${JSON.stringify(t.out.endsWith('.png') ? 'image/png' : t.out.endsWith('.webp') ? 'image/webp' : 'image/jpeg')}, ${t.q || 0.8});
        await fetch('/__save', { method: 'POST', body: JSON.stringify({ out: ${JSON.stringify(t.out)}, data }) });
        return w + 'x' + h + ' ' + Math.round(data.length * 0.75 / 1024) + 'KB';
      })()`);
      console.log(t.out, r);
    }
  } else if (cmd === 'recorte') {
    // Quita el fondo blanco de fotos de producto (relleno desde los bordes) -> WebP con transparencia
    const lista = JSON.parse(fs.readFileSync(path.join(DIR, args[0]), 'utf8'));
    pagSheet = '<body></body>';
    await ir(c, `http://127.0.0.1:${PORT}/__sheet`, 500);
    for (const t of lista) {
      const r = await ev(c, `(async () => {
        const img = new Image(); img.src = ${JSON.stringify('/' + t.src)}; await img.decode();
        const W = img.naturalWidth, H = img.naturalHeight;
        const cv = document.createElement('canvas'); cv.width = W; cv.height = H;
        const x = cv.getContext('2d', { willReadFrequently: true }); x.drawImage(img, 0, 0);
        const d = x.getImageData(0, 0, W, H), p = d.data;
        const U = ${t.umbral || 226}, INTERIOR = ${!!t.interior};
        const blanco = i => { const r = p[i], g = p[i+1], b = p[i+2]; const mn = Math.min(r,g,b), mx = Math.max(r,g,b); return mn >= U && mx - mn <= 22; };
        const fuera = new Uint8Array(W * H), cola = [];
        const mete = (X, Y) => { const k = Y * W + X; if (!fuera[k] && blanco(k * 4)) { fuera[k] = 1; cola.push(k); } };
        // INTERIOR: también los huecos blancos encerrados (agujeros de discos, campanas...)
        if (INTERIOR) for (let k = 0; k < W * H; k++) if (blanco(k * 4)) fuera[k] = 1;
        for (let X = 0; X < W; X++) { mete(X, 0); mete(X, H - 1); }
        for (let Y = 0; Y < H; Y++) { mete(0, Y); mete(W - 1, Y); }
        while (cola.length) { const k = cola.pop(), X = k % W, Y = (k / W) | 0;
          if (X > 0) mete(X - 1, Y); if (X < W - 1) mete(X + 1, Y); if (Y > 0) mete(X, Y - 1); if (Y < H - 1) mete(X, Y + 1); }
        // zonas a borrar a mano (marcas de agua): [x0,y0,x1,y1] en fracción
        for (const z of ${JSON.stringify(t.borrar || [])}) for (let Y = Math.floor(z[1]*H); Y < z[3]*H; Y++) for (let X = Math.floor(z[0]*W); X < z[2]*W; X++) fuera[Y*W+X] = 1;
        let x0 = W, y0 = H, x1 = 0, y1 = 0;
        for (let Y = 0; Y < H; Y++) for (let X = 0; X < W; X++) {
          const k = Y * W + X, i = k * 4;
          if (fuera[k]) { p[i+3] = 0; continue; }
          // borde suave: píxel claro pegado al fondo
          const vecino = (X > 0 && fuera[k-1]) || (X < W-1 && fuera[k+1]) || (Y > 0 && fuera[k-W]) || (Y < H-1 && fuera[k+W]);
          if (vecino) { const mn = Math.min(p[i], p[i+1], p[i+2]); if (mn > 170) p[i+3] = Math.max(0, Math.min(255, (255 - mn) * 255 / 85)); }
          if (p[i+3] > 20) { if (X < x0) x0 = X; if (X > x1) x1 = X; if (Y < y0) y0 = Y; if (Y > y1) y1 = Y; }
        }
        x.putImageData(d, 0, 0);
        const pad = Math.round(Math.max(x1 - x0, y1 - y0) * 0.03);
        x0 = Math.max(0, x0 - pad); y0 = Math.max(0, y0 - pad); x1 = Math.min(W - 1, x1 + pad); y1 = Math.min(H - 1, y1 + pad);
        const sw = x1 - x0 + 1, sh = y1 - y0 + 1, w = Math.min(${t.w || 560}, sw), h = Math.round(sh * w / sw);
        const o = document.createElement('canvas'); o.width = w; o.height = h;
        const ox = o.getContext('2d'); ox.imageSmoothingQuality = 'high'; ox.drawImage(cv, x0, y0, sw, sh, 0, 0, w, h);
        const data = o.toDataURL('image/webp', ${t.q || 0.82});
        await fetch('/__save', { method: 'POST', body: JSON.stringify({ out: ${JSON.stringify(t.out)}, data }) });
        return w + 'x' + h + ' ' + Math.round(data.length * 0.75 / 1024) + 'KB';
      })()`);
      console.log(t.out, r);
    }
  } else if (cmd === 'evalm') {
    await vista(c, +(process.env.ANCHO || 390));
    await ir(c, `http://127.0.0.1:${PORT}/${args[0]}`, 1800);
    for (const x of args.slice(1)) { console.log(JSON.stringify(await ev(c, x))); await sleep(700); }
  } else if (cmd === 'eval') {
    // node _tool.mjs eval <ruta> "<expresión>"
    await vista(c, 1366);
    await ir(c, /^https?:/.test(args[0]) ? args[0] : `http://127.0.0.1:${PORT}/${args[0]}`, 1500);
    console.log(JSON.stringify(await ev(c, args[1]), null, 1));
  } else if (cmd === 'shot') {
    const [ruta, ancho, png, full] = args;
    await vista(c, +ancho);
    await ir(c, /^https?:/.test(ruta) ? ruta : `http://127.0.0.1:${PORT}/${ruta}`, /^https?:/.test(ruta) ? 7000 : 2500);
    if (args[4]) { await ev(c, args[4]); await sleep(900); }
    if (full === 'full') {
      // recorrer la página para que carguen las imágenes diferidas (loading="lazy")
      await ev(c, `(async () => { document.documentElement.style.scrollBehavior = 'auto'; const h = document.documentElement.scrollHeight; for (let y = 0; y < h; y += 500) { scrollTo(0, y); await new Promise(r => setTimeout(r, 90)); } scrollTo(0, 0); })()`);
      await sleep(1200);
    }
    await captura(c, png, full === 'full');
  } else if (cmd === 'check') {
    for (const pag of (args.length ? args : ['index.html'])) for (const w of [320, 360, 390, 430, 1366]) {
      c.errores.length = 0;
      await vista(c, w);
      await ir(c, `http://127.0.0.1:${PORT}/${pag}`, 2000);
      const m = await ev(c, MEDIR);
      console.log(pag, w, JSON.stringify(m), c.errores.length ? 'ERRORES: ' + c.errores.join(' | ') : 'sin errores');
    }
  } else if (cmd === 'columnas') {
    // Página larga partida en columnas lado a lado, para revisarla en una sola imagen
    const [png, alto = '1500', cols = '6', origen = 'index.html'] = args;
    const h = await ev(c, `fetch('/_out/${png}').then(r=>r.blob()).then(b=>createImageBitmap(b)).then(i=>[i.width,i.height])`).catch(() => null);
    pagSheet = `<body style="margin:0;background:#888"><div id=g style="display:flex;gap:12px;padding:12px;align-items:flex-start"></div><script>
      const im=new Image();im.src='/_out/${png}';im.onload=()=>{const D0=${+(process.env.DESDE||0)};const W=im.width,H=im.height,A=${alto};const n=Math.ceil((H-D0)/A);
      for(let k=0;k<n;k++){const d=document.createElement('div');d.style.cssText='width:'+W+'px;height:'+Math.min(A,H-D0-k*A)+'px;overflow:hidden;flex:none;background:#fff';
      const i=new Image();i.src=im.src;i.style.cssText='display:block;margin-top:'+(-(D0+k*A))+'px';d.appendChild(i);g.appendChild(d)}document.title='ok'}<\/script>`;
    await vista(c, +(process.env.W || 2600));
    await ir(c, `http://127.0.0.1:${PORT}/__sheet`, 1500);
    await captura(c, args[4] || png.replace('.png', '-col.png'), true);
  } else if (cmd === 'probar') {
    // Flujos reales de la tienda en móvil (390) con clics de verdad
    const W0 = +(args[0] || 390);
    await vista(c, W0);
    const B = `http://127.0.0.1:${PORT}/`;
    const ok = (txt, cond, extra = '') => console.log((cond ? 'OK   ' : 'FALLO') + ' ' + txt + (extra ? ' → ' + extra : ''));
    const clic = async sel => {
      const r = await ev(c, `(() => { const e = document.querySelector(${JSON.stringify(sel)}); if (!e) return null; e.scrollIntoView({block:'center'}); const b = e.getBoundingClientRect(); return [b.x + b.width/2, b.y + b.height/2]; })()`);
      if (!r) throw new Error('No existe ' + sel);
      for (const type of ['mousePressed', 'mouseReleased']) await c.send('Input.dispatchMouseEvent', { type, x: r[0], y: r[1], button: 'left', clickCount: 1 });
      await sleep(450);
    };
    const tecla = async (key, code = key, keyCode = 0) => { for (const type of ['keyDown', 'keyUp']) await c.send('Input.dispatchKeyEvent', { type, key, code, windowsVirtualKeyCode: keyCode, ...(key === 'Enter' && type === 'keyDown' ? { text: String.fromCharCode(13), unmodifiedText: String.fromCharCode(13) } : {}) }); await sleep(250); };
    const escribe = async (sel, txt) => { await ev(c, `document.querySelector(${JSON.stringify(sel)}).focus()`); await c.send('Input.insertText', { text: txt }); await sleep(400); };
    await ir(c, B + 'index.html', 1500);
    await ev(c, `localStorage.clear(); document.documentElement.style.scrollBehavior='auto'`);
    await ir(c, B + 'index.html', 1500);
    // 1. Añadir desde la portada
    await clic('#car-novedades [data-anadir]');
    const c1 = await ev(c, `({abierto: document.getElementById('cesta').classList.contains('abierto'), lineas: document.querySelectorAll('#cesta-cuerpo .linea-cesta').length, contador: document.getElementById('contador').textContent, foco: document.activeElement.closest('#cesta') ? 'dentro' : 'fuera'})`);
    ok('Añadir desde portada abre la cesta con 1 línea', c1.abierto && c1.lineas === 1 && c1.contador === '1', JSON.stringify(c1));
    await captura(c, 'pr-1-cesta.png');
    // 2. + dentro de la cesta lateral
    const habia = await ev(c, `document.querySelector('#cesta [data-mas]').disabled`);
    if (!habia) { await clic('#cesta [data-mas]'); ok('Botón + suma una unidad', (await ev(c, `document.getElementById('contador').textContent`)) === '2'); }
    else ok('Producto con 1 sola unidad: el + está desactivado', true);
    await tecla('Escape', 'Escape', 27);
    ok('Escape cierra la cesta', !(await ev(c, `document.getElementById('cesta').classList.contains('abierto')`)));
    // 3. Menú
    await ev(c, 'scrollTo(0,0)');
    await clic('#btn-menu');
    ok('Menú abierto y aria-expanded', await ev(c, `document.getElementById('menu').classList.contains('abierto') && document.getElementById('btn-menu').getAttribute('aria-expanded') === 'true'`));
    await clic('#menu .menu-familia');
    ok('Familia del menú se despliega', await ev(c, `!document.querySelector('#menu .menu-sub').hidden`));
    await captura(c, 'pr-2-menu.png');
    await tecla('Escape', 'Escape', 27);
    ok('Escape cierra el menú y devuelve el foco', await ev(c, `!document.getElementById('menu').classList.contains('abierto') && document.activeElement.id === 'btn-menu'`));
    // 4. Buscador con sugerencias
    await escribe('#q', 'carburador pwk 28');
    const sug = await ev(c, `[...document.querySelectorAll('#sugerencias [role=option]')].map(a => a.textContent.trim().slice(0, 60))`);
    ok('Sugerencias del buscador', sug.length > 1, sug.slice(0, 3).join(' | '));
    await captura(c, 'pr-3-buscador.png');
    await tecla('Enter', 'Enter', 13);
    await sleep(1500);
    ok('Enter va a resultados', await ev(c, `location.pathname.endsWith('tienda.html') && new URLSearchParams(location.search).get('q') === 'carburador pwk 28'`), await ev(c, `document.getElementById('titulo').textContent + ' · ' + document.getElementById('n-res').textContent + ' productos'`));
    // 5. Mi moto
    await ir(c, B + 'index.html', 1500);
    await ev(c, 'scrollTo(0,0)');
    await clic('#btn-mimoto');
    ok('Ventana Mi moto abierta', await ev(c, `document.getElementById('mimoto').classList.contains('abierto')`));
    await ev(c, `(() => { const s = document.getElementById('vm-marca'); s.value = '0'; s.dispatchEvent(new Event('change')); const m = document.getElementById('vm-modelo'); m.value = '0.0'; m.dispatchEvent(new Event('change')); })()`);
    await captura(c, 'pr-4-mimoto.png');
    await clic('#vm-form button[type=submit]');
    await sleep(1500);
    const moto = await ev(c, `({url: location.search, titulo: document.getElementById('titulo').textContent, n: document.getElementById('n-res').textContent, etiqueta: document.querySelector('#btn-mimoto .etq-moto').textContent, compat: document.querySelectorAll('.prod-compat').length})`);
    ok('Mi moto filtra la tienda', moto.url.includes('moto=0.0') && +moto.n > 5 && moto.etiqueta === 'Aerox' && moto.compat > 0, JSON.stringify(moto));
    await captura(c, 'pr-5-aerox.png');
    // 6. Ficha de producto: barra fija y añadir 2 unidades
    await ir(c, B + 'producto.html?id=160', 1800);
    await ev(c, 'scrollTo(0,0)'); await sleep(400);
    const bf0 = await ev(c, `document.getElementById('barra-fija').classList.contains('visible')`);
    await ev(c, 'scrollTo(0, 1800)'); await sleep(600);
    const bf1 = await ev(c, `document.getElementById('barra-fija').classList.contains('visible')`);
    await ev(c, 'scrollTo(0,0)'); await sleep(600);
    const bf2 = await ev(c, `document.getElementById('barra-fija').classList.contains('visible')`);
    ok('Barra fija: oculta arriba, visible al bajar, oculta al volver', !bf0 && bf1 && !bf2, [bf0, bf1, bf2].join(','));
    ok('Compatibilidad con Aerox en la ficha', await ev(c, `document.querySelector('.caja-compat').className.includes('si')`), await ev(c, `document.querySelector('.caja-compat strong').textContent`));
    await clic('#c-mas');
    await clic('#btn-anadir');
    const c6 = await ev(c, `document.getElementById('contador').textContent`);
    ok('Añadir 2 unidades desde la ficha', +c6 >= 3, 'contador ' + c6);
    await tecla('Escape', 'Escape', 27);
    // 7. Pedido completo
    await ir(c, B + 'cesta.html', 1500);
    ok('Cesta con líneas', await ev(c, `document.querySelectorAll('#tabla-cesta .linea-cesta').length`) >= 2);
    await captura(c, 'pr-6-cestapag.png');
    await clic('#a-datos');
    ok('Paso 2 visible', await ev(c, `!document.getElementById('paso-datos').hidden && location.hash === '#datos'`));
    await clic('#form-datos button[type=submit]');
    const errs = await ev(c, `({caja: document.getElementById('error-datos').textContent, foco: document.activeElement.id, invalidos: document.querySelectorAll('#form-datos [aria-invalid=true]').length})`);
    ok('Formulario vacío marca errores y enfoca el primero', errs.invalidos === 7 && errs.foco === 'd-nombre', JSON.stringify(errs));
    await captura(c, 'pr-7-errores.png');
    await escribe('#d-nombre', 'Prueba Demo Urbanmoto');
    await escribe('#d-email', 'prueba@ejemplo.com');
    await escribe('#d-tel', '600000000');
    await escribe('#d-dir', 'Calle Sevilla 12, 1º');
    await escribe('#d-cp', '41640');
    await ev(c, `document.getElementById('d-cp').dispatchEvent(new Event('input'))`);
    await escribe('#d-pob', 'Osuna');
    ok('El código postal rellena la provincia', (await ev(c, `document.getElementById('d-prov').value`)) === 'Sevilla');
    await clic('#form-datos button[type=submit]');
    ok('Paso 3 (pago)', await ev(c, `!document.getElementById('paso-pago').hidden`), await ev(c, `document.getElementById('btn-pagar').textContent.trim()`));
    await clic('#btn-pagar');
    ok('Sin aceptar condiciones avisa', (await ev(c, `document.getElementById('error-pago').textContent`)).length > 5);
    await clic('#acepto');
    await captura(c, 'pr-8-pago.png');
    await clic('#btn-pagar');
    const fin = await ev(c, `({ok: !document.getElementById('paso-ok').hidden, num: document.getElementById('ok-num').textContent, contador: document.getElementById('contador').textContent})`);
    ok('Pedido confirmado y cesta vaciada', fin.ok && fin.contador === '0', JSON.stringify(fin));
    await captura(c, 'pr-9-ok.png');
    // 8. Atrás del navegador desde el paso 2
    console.log('errores consola:', c.errores.filter(e => !e.includes('favicon')).join(' | ') || 'ninguno');
  } else if (cmd === 'serve') {
    console.log(`http://localhost:${PORT}/`); await new Promise(() => {});
  }
} finally { if (cmd !== 'serve') { c.cerrar(); server.close(); } }
