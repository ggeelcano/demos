// Convierte _src/* a img/<id>.webp (lado largo máx. 1100 px) con canvas de Chrome por CDP,
// y genera _src/hoja.html para revisar todas de un vistazo.
const { spawn } = require('child_process');
const http = require('http'), fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..'), SRC = path.join(ROOT, '_src'), OUT = path.join(ROOT, 'img');
const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const PORT = 9345, HPORT = 8491, MAX = +(process.env.MAX || 1100), PRE = process.env.PRE || '', IDS = (process.env.IDS || '').split(',').filter(Boolean);
const sleep = ms => new Promise(r => setTimeout(r, ms));
fs.mkdirSync(OUT, { recursive: true });
const meta = JSON.parse(fs.readFileSync(path.join(SRC, 'meta.json'), 'utf8'));

const srv = http.createServer((q, s) => {
  const f = path.join(ROOT, decodeURIComponent(q.url.split('?')[0]));
  if (!fs.existsSync(f) || fs.statSync(f).isDirectory()) { s.writeHead(200); return s.end('<html></html>'); } if (!fs.existsSync(f)) { s.writeHead(404); return s.end(); }
  s.writeHead(200); s.end(fs.readFileSync(f));
}).listen(HPORT);

(async () => {
  const chrome = spawn(CHROME, ['--headless=new', '--disable-gpu', '--no-first-run', `--remote-debugging-port=${PORT}`, `--user-data-dir=${path.join(ROOT, '_tools', '_prof')}`, 'about:blank'], { stdio: 'ignore' });
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
  for (const m of meta.filter(x => !IDS.length || IDS.includes(x.id))) {
    const dest = path.join(OUT, PRE + m.id + '.webp');
    if (fs.existsSync(dest)) continue;
    const r = await ev(`new Promise(res=>{const i=new Image();i.onload=()=>{const k=Math.min(1,${MAX}/Math.max(i.naturalWidth,i.naturalHeight));const c=document.createElement('canvas');c.width=Math.round(i.naturalWidth*k);c.height=Math.round(i.naturalHeight*k);c.getContext('2d').drawImage(i,0,0,c.width,c.height);res({d:c.toDataURL('image/webp',0.8),w:c.width,h:c.height})};i.onerror=()=>res(null);i.src='/_src/${m.file}'})`);
    if (!r) { console.log('ERROR', m.file); continue; }
    fs.writeFileSync(dest, Buffer.from(r.d.split(',')[1], 'base64'));
    if (!PRE) { m.w = r.w; m.h = r.h; }
  }
  fs.writeFileSync(path.join(SRC, 'meta.json'), JSON.stringify(meta, null, 1));
  const cards = meta.map(m => `<figure><img src="../img/${m.id}.webp"><figcaption><b>${m.id}</b> ${m.alt}</figcaption></figure>`).join('');
  fs.writeFileSync(path.join(SRC, 'hoja.html'), `<!doctype html><meta charset=utf-8><style>body{margin:0;font:11px sans-serif;display:grid;grid-template-columns:repeat(10,1fr);gap:4px;background:#ddd}figure{margin:0;background:#fff}img{width:100%;height:170px;object-fit:contain;background:#eee}figcaption{padding:2px;height:42px;overflow:hidden}</style>${cards}`);
  ws.close(); chrome.kill(); srv.close();
  console.log('ok', meta.length);
})();
