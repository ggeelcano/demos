// Prueba la interacción: pestañas, buscador, menú móvil, enlaces data-go y formulario a WhatsApp
const { spawn } = require('child_process'); const path = require('path');
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe', PORT = 9348;
const sleep = ms => new Promise(r => setTimeout(r, ms));
(async () => {
  const chrome = spawn(CHROME, ['--headless=new', '--disable-gpu', `--remote-debugging-port=${PORT}`, `--user-data-dir=${path.join(__dirname, '_prof4')}`, 'about:blank'], { stdio: 'ignore' });
  let info; for (let i = 0; i < 60 && !info; i++) { await sleep(250); try { info = (await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json()).find(t => t.type === 'page'); } catch (e) {} }
  const ws = new WebSocket(info.webSocketDebuggerUrl); await new Promise(r => ws.onopen = r);
  let id = 0; const pend = new Map(); ws.onmessage = e => { const m = JSON.parse(e.data); if (m.id && pend.has(m.id)) { pend.get(m.id)(m); pend.delete(m.id); } };
  const send = (method, params = {}) => new Promise(res => { const i = ++id; pend.set(i, m => res(m.result || m)); ws.send(JSON.stringify({ id: i, method, params })); });
  const ev = async e => { const r = await send('Runtime.evaluate', { expression: e, returnByValue: true, awaitPromise: true }); return r.exceptionDetails ? 'EXC ' + r.exceptionDetails.exception?.description : r.result?.value; };
  await send('Page.enable'); await send('Runtime.enable');
  await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
  await send('Page.navigate', { url: 'http://localhost:8486/demos/ms-diseno-textil/' }); await sleep(2000);
  const vis = `[...document.querySelectorAll('#rail .card')].filter(c=>!c.hidden).length`;
  const r = {};
  r.inicio = await ev(vis);
  r.laboral = await ev(`document.querySelector('[data-tab=lab]').click(),${vis}`);
  r.gorras = await ev(`document.querySelector('[data-tab=gor]').click(),${vis}`);
  r.buscarPolo = await ev(`(()=>{const q=document.querySelector('#q');q.value='polo';q.dispatchEvent(new Event('input'));return ${vis}+' | '+document.querySelector('#searchInfo').textContent})()`);
  r.buscarNada = await ev(`(()=>{const q=document.querySelector('#q');q.value='toalla';q.dispatchEvent(new Event('input'));return ${vis}+' | '+document.querySelector('#searchInfo').textContent})()`);
  r.menu = await ev(`(async()=>{document.querySelector('#abrirMenu').click();await new Promise(r=>setTimeout(r,400));const m=document.querySelector('#menu').getBoundingClientRect();const a=[m.left,m.width,getComputedStyle(document.querySelector('#menu')).visibility];document.querySelector('#menu [data-go=dep]').click();await new Promise(r=>setTimeout(r,400));return a.join(',')+' tras clic: '+document.querySelector('#menu').classList.contains('open')+' pestaña='+document.querySelector('.tabs .on').dataset.tab})()`);
  r.form = await ev(`(()=>{let u;window.open=x=>u=x;const f=document.querySelector('#formOferta');f.requestSubmit();const err=!document.querySelector('#fErr').hidden;f.nombre.value='Ane';f.empresa.value='Club Rubí';f.cantidad.value='30';f.idea.value='Escudo delante';f.requestSubmit();return 'error sin nombre='+err+' | '+decodeURIComponent(u)})()`);
  r.carrusel = await ev(`(async()=>{document.querySelectorAll('.hero-nav button')[2].click();await new Promise(r=>setTimeout(r,900));return [...document.querySelectorAll('.slide')].findIndex(s=>s.classList.contains('on'))})()`);
  r.waCard = await ev(`decodeURIComponent(document.querySelector('#rail .card a').href)`);
  console.log(JSON.stringify(r, null, 1)); ws.close(); chrome.kill();
})();
