// Recorta viñetas de los collages 4x2 de ropa laboral: img/<id>-<col><fila>.webp
const { spawn } = require('child_process');
const http = require('http'), fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..');
const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const PORT = 9346, HPORT = 8492;
const sleep = ms => new Promise(r => setTimeout(r, ms));
// [id, columnas, filas, viñetas a sacar como "c,f"]
const TRABAJO = [
  ['cb17972e', 4, 2, ['0,0', '1,0']], ['d8eedf67', 4, 2, ['0,0', '1,0']],
  ['0645b838', 4, 2, ['0,0', '1,0']], ['c98b570d', 4, 2, ['0,0', '1,0']],
  ['09c90815', 4, 2, ['0,0', '2,0']], ['fce49be3', 4, 2, ['0,0', '2,0']],
  ['3ad28df0', 4, 2, ['0,0', '3,0']], ['2b43ee05', 4, 2, ['0,0', '3,0']],
];
const meta = JSON.parse(fs.readFileSync(path.join(ROOT, '_src', 'meta.json'), 'utf8'));
const srv = http.createServer((q, s) => {
  const f = path.join(ROOT, decodeURIComponent(q.url.split('?')[0]));
  if (!fs.existsSync(f) || fs.statSync(f).isDirectory()) { s.writeHead(200); return s.end('<html></html>'); }
  s.writeHead(200); s.end(fs.readFileSync(f));
}).listen(HPORT);
(async () => {
  const chrome = spawn(CHROME, ['--headless=new', '--disable-gpu', '--no-first-run', `--remote-debugging-port=${PORT}`, `--user-data-dir=${path.join(__dirname, '_prof2')}`, 'about:blank'], { stdio: 'ignore' });
  let info;
  for (let i = 0; i < 60 && !info; i++) { await sleep(250); try { info = (await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json()).find(t => t.type === 'page'); } catch (e) {} }
  const ws = new WebSocket(info.webSocketDebuggerUrl);
  await new Promise(r => ws.onopen = r);
  let id = 0; const pend = new Map();
  ws.onmessage = e => { const m = JSON.parse(e.data); if (m.id && pend.has(m.id)) { pend.get(m.id)(m); pend.delete(m.id); } };
  const send = (method, params = {}) => new Promise(res => { const i = ++id; pend.set(i, m => res(m.result || m)); ws.send(JSON.stringify({ id: i, method, params })); });
  const ev = async e => (await send('Runtime.evaluate', { expression: e, returnByValue: true, awaitPromise: true })).result?.value;
  await send('Page.navigate', { url: `http://127.0.0.1:${HPORT}/_tools/` });
  await sleep(800);
  for (const [idImg, cols, filas, celdas] of TRABAJO) {
    const file = meta.find(m => m.id === idImg).file;
    for (const c of celdas) {
      const [cx, fy] = c.split(',').map(Number);
      // recorte con 1 % de margen para quitar las líneas blancas entre viñetas
      const r = await ev(`new Promise(res=>{const i=new Image();i.onload=()=>{const tw=i.naturalWidth/${cols},th=i.naturalHeight/${filas},m=tw*0.03;const sx=${cx}*tw+m,sy=${fy}*th+m,sw=tw-2*m,sh=th-2*m;const k=Math.min(1,700/sh);const cv=document.createElement('canvas');cv.width=Math.round(sw*k);cv.height=Math.round(sh*k);cv.getContext('2d').drawImage(i,sx,sy,sw,sh,0,0,cv.width,cv.height);res(cv.toDataURL('image/webp',0.82))};i.src='/_src/${file}'})`);
      fs.writeFileSync(path.join(ROOT, 'img', `${idImg}-${cx}${fy}.webp`), Buffer.from(r.split(',')[1], 'base64'));
    }
  }
  ws.close(); chrome.kill(); srv.close(); console.log('ok');
})();
