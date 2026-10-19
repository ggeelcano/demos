// Genera img/og.jpg (1200x630) para la vista previa de WhatsApp a partir de la foto de la prensa DTF
const { spawn } = require('child_process');
const http = require('http'), fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..');
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const PORT = 9349, HPORT = 8493;
const sleep = ms => new Promise(r => setTimeout(r, ms));
const srv = http.createServer((q, s) => {
  const f = path.join(ROOT, decodeURIComponent(q.url.split('?')[0]));
  if (!fs.existsSync(f) || fs.statSync(f).isDirectory()) { s.writeHead(200); return s.end('<html></html>'); }
  s.writeHead(200); s.end(fs.readFileSync(f));
}).listen(HPORT);
(async () => {
  const chrome = spawn(CHROME, ['--headless=new', '--disable-gpu', `--remote-debugging-port=${PORT}`, `--user-data-dir=${path.join(__dirname, '_prof5')}`, 'about:blank'], { stdio: 'ignore' });
  let info; for (let i = 0; i < 60 && !info; i++) { await sleep(250); try { info = (await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json()).find(t => t.type === 'page'); } catch (e) {} }
  const ws = new WebSocket(info.webSocketDebuggerUrl); await new Promise(r => ws.onopen = r);
  let id = 0; const pend = new Map(); ws.onmessage = e => { const m = JSON.parse(e.data); if (m.id && pend.has(m.id)) { pend.get(m.id)(m); pend.delete(m.id); } };
  const send = (method, params = {}) => new Promise(res => { const i = ++id; pend.set(i, m => res(m.result || m)); ws.send(JSON.stringify({ id: i, method, params })); });
  await send('Page.navigate', { url: `http://127.0.0.1:${HPORT}/_tools/` }); await sleep(800);
  const r = await send('Runtime.evaluate', { awaitPromise: true, returnByValue: true, expression: `new Promise(res=>{const i=new Image();i.onload=()=>{const W=1200,H=630,c=document.createElement('canvas');c.width=W;c.height=H;const k=Math.max(W/i.naturalWidth,H/i.naturalHeight),w=i.naturalWidth*k,h=i.naturalHeight*k;c.getContext('2d').drawImage(i,(W-w)/2,(H-h)*0.4,w,h);res(c.toDataURL('image/jpeg',0.85))};i.src='/_src/45b074f8.png'})` });
  fs.writeFileSync(path.join(ROOT, 'img', 'og.jpg'), Buffer.from(r.result.value.split(',')[1], 'base64'));
  ws.close(); chrome.kill(); srv.close(); console.log('og.jpg', fs.statSync(path.join(ROOT, 'img', 'og.jpg')).size);
})();
