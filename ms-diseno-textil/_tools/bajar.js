// Baja las imágenes reales de msdisenotextil.es a _src/ (originales)
// Uso: node _tools/bajar.js <lista.txt>   (una URL por línea, puede llevar " | alt | tamaño")
const fs = require('fs'), path = require('path');
const SRC = path.join(__dirname, '..', '_src');
fs.mkdirSync(SRC, { recursive: true });
const lineas = fs.readFileSync(process.argv[2], 'utf8').split('\n').map(l => l.trim()).filter(l => l.startsWith('http'));
const vistos = new Map();
for (const l of lineas) { const [u, alt] = l.split(' | '); if (!vistos.has(u)) vistos.set(u, alt || ''); }
(async () => {
  const meta = [];
  for (const [u, alt] of vistos) {
    const id = path.basename(u).split('.')[0].slice(0, 8);
    const ext = path.extname(u.split('?')[0]) || '.png';
    const f = path.join(SRC, id + ext);
    if (!fs.existsSync(f)) {
      const r = await fetch(u);
      if (!r.ok) { console.log('FALLO', r.status, u); continue; }
      fs.writeFileSync(f, Buffer.from(await r.arrayBuffer()));
    }
    meta.push({ id, file: id + ext, url: u, alt });
  }
  fs.writeFileSync(path.join(SRC, 'meta.json'), JSON.stringify(meta, null, 1));
  console.log(meta.length, 'imágenes');
})();
