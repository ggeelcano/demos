// Verifica la demo a 1440 / 390 / 320 px: desbordes, imágenes rotas, errores JS y capturas.
// Uso: node _tools/verificar.js [URL]   (por defecto la copia local)
const { spawn } = require('child_process');
const fs = require('fs'), path = require('path');
const URL_ = process.argv[2] || 'http://localhost:8486/demos/ms-diseno-textil/';
const OUT = path.join(__dirname, '..', '_capturas');
const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const PORT = 9347;
const sleep = ms => new Promise(r => setTimeout(r, ms));
fs.mkdirSync(OUT, { recursive: true });
(async () => {
  const chrome = spawn(CHROME, ['--headless=new', '--disable-gpu', '--no-first-run', '--hide-scrollbars', `--remote-debugging-port=${PORT}`, `--user-data-dir=${path.join(__dirname, '_prof3')}`, 'about:blank'], { stdio: 'ignore' });
  let info;
  for (let i = 0; i < 60 && !info; i++) { await sleep(250); try { info = (await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json()).find(t => t.type === 'page'); } catch (e) {} }
  const ws = new WebSocket(info.webSocketDebuggerUrl);
  await new Promise(r => ws.onopen = r);
  let id = 0; const pend = new Map(); const errores = [];
  ws.onmessage = e => {
    const m = JSON.parse(e.data);
    if (m.id && pend.has(m.id)) { pend.get(m.id)(m); pend.delete(m.id); }
    if (m.method === 'Runtime.exceptionThrown') errores.push(m.params.exceptionDetails.exception?.description || m.params.exceptionDetails.text);
    if (m.method === 'Log.entryAdded' && m.params.entry.level === 'error') errores.push(m.params.entry.text + ' ' + (m.params.entry.url || ''));
  };
  const send = (method, params = {}) => new Promise(res => { const i = ++id; pend.set(i, m => res(m.result || m)); ws.send(JSON.stringify({ id: i, method, params })); });
  const ev = async e => (await send('Runtime.evaluate', { expression: e, returnByValue: true, awaitPromise: true })).result?.value;
  await send('Page.enable'); await send('Runtime.enable'); await send('Log.enable');
  const anchos = (process.env.ANCHOS || '1440,390,320').split(',').map(Number);
  for (const w of anchos) {
    errores.length = 0;
    await send('Emulation.setDeviceMetricsOverride', { width: w, height: 900, deviceScaleFactor: 1, mobile: w < 900 });
    await send('Page.navigate', { url: URL_ + '?t=' + Date.now() });
    await sleep(2500);
    await ev(`(async()=>{document.documentElement.style.scrollBehavior='auto';for(let y=0;y<document.body.scrollHeight;y+=500){scrollTo(0,y);await new Promise(r=>setTimeout(r,80))}scrollTo(0,0)})()`);
    await sleep(1200);
    const r = await ev(`(()=>{
      const cw=document.documentElement.clientWidth, sw=document.documentElement.scrollWidth;
      const fuera=[];
      for(const el of document.querySelectorAll('body *')){
        if(el.closest('.rail,.tabs,.menu,.slides,.topbar-msg')) continue;
        const r=el.getBoundingClientRect(); if(!r.width) continue;
        if(r.right>cw+1||r.left<-1) fuera.push(el.tagName+'.'+el.className+' '+Math.round(r.left)+'→'+Math.round(r.right));
      }
      const rotas=[...document.images].filter(i=>i.complete&&!i.naturalWidth).map(i=>i.getAttribute('src'));
      const h=document.querySelector('.header').getBoundingClientRect();
      return {cw,sw,fuera:fuera.slice(0,12),rotas,alturaCab:Math.round(h.height),alto:document.documentElement.scrollHeight};
    })()`);
    // cabecera pegajosa
    await ev('scrollTo(0,2500)'); await sleep(300);
    const sticky = await ev(`Math.round(document.querySelector('.header').getBoundingClientRect().top)`);
    await ev('scrollTo(0,0)'); await sleep(400);
    console.log(`\n== ${w}px  scrollWidth ${r.sw} / clientWidth ${r.cw}  cabecera ${r.alturaCab}px  sticky top=${sticky}  alto ${r.alto}`);
    console.log('fuera:', r.fuera.length ? r.fuera : 'ninguno');
    console.log('imágenes rotas:', r.rotas.length ? r.rotas : 'ninguna');
    console.log('errores:', errores.length ? errores : 'ninguno');
    // capturas: primera pantalla y página completa
    let c = await send('Page.captureScreenshot', { format: 'jpeg', quality: 80 });
    fs.writeFileSync(path.join(OUT, `pantalla-${w}.jpg`), Buffer.from(c.data, 'base64'));
    const alto = Math.min(r.alto, 16000);
    await send('Emulation.setDeviceMetricsOverride', { width: w, height: alto, deviceScaleFactor: 1, mobile: w < 900 });
    await sleep(1500);
    c = await send('Page.captureScreenshot', { format: 'jpeg', quality: 70 });
    fs.writeFileSync(path.join(OUT, `completa-${w}.jpg`), Buffer.from(c.data, 'base64'));
  }
  ws.close(); chrome.kill();
})();
