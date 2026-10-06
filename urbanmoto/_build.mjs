// Genera los datos de la demo a partir de lo bajado de urbanmoto.es (_src/fichas.json, _src/cats.json, menú de la portada).
//   node _build.mjs   -> assets/catalogo.js + datos/p/<id>.json
import fs from 'fs';

const fichas = JSON.parse(fs.readFileSync('_src/fichas.json', 'utf8'));
const catsMembers = JSON.parse(fs.readFileSync('_src/cats.json', 'utf8'));
const home = fs.readFileSync('_src/urbanmoto_es_.html', 'utf8');

const sinTildes = s => s.normalize('NFD').replace(/[̀-ͯ]/g, '');
const ent = s => s.replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#0?39;/g, "'")
  .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&ntilde;/g, 'ñ').replace(/&aacute;/g, 'á').replace(/&eacute;/g, 'é')
  .replace(/&iacute;/g, 'í').replace(/&oacute;/g, 'ó').replace(/&uacute;/g, 'ú').replace(/&ordm;/g, 'º').replace(/&deg;/g, 'º');

// ---------- Limpieza de textos (marcas, tildes, unidades) ----------
const PALABRAS = {
  minarelli: 'Minarelli', yamaha: 'Yamaha', aerox: 'Aerox', arox: 'Aerox', jog: 'Jog', rr: 'RR', piaggio: 'Piaggio', gilera: 'Gilera',
  derbi: 'Derbi', senda: 'Senda', aprilia: 'Aprilia', peugeot: 'Peugeot', honda: 'Honda', kymco: 'Kymco', suzuki: 'Suzuki',
  katana: 'Katana', mbk: 'MBK', bws: 'BWS', booster: 'Booster', nitro: 'Nitro', neos: 'Neos', sonic: 'Sonic', slider: 'Slider',
  rieju: 'Rieju', crf: 'CRF', crf50: 'CRF50', crf70: 'CRF70', crf80: 'CRF80', am5: 'AM5', am6: 'AM6', lc: 'LC', pwk: 'PWK',
  oko: 'OKO', keihin: 'Keihin', dellorto: 'Dellorto', mikuni: 'Mikuni', polini: 'Polini', phbg: 'PHBG', phva: 'PHVA', phbn: 'PHBN',
  sha: 'SHA', pz: 'PZ', cdi: 'CDI', ngk: 'NGK', atv: 'ATV', usa: 'USA', protaper: 'ProTaper', renthal: 'Renthal', acerbis: 'Acerbis',
  fox: 'Fox', ufo: 'UFO', ktm: 'KTM', husqvarna: 'Husqvarna', xiaomi: 'Xiaomi', brembo: 'Brembo', vforce: 'VForce',
  vforce3: 'VForce3', zip: 'Zip', dio: 'Dio', ludix: 'Ludix', speedfight: 'Speedfight', ag27: 'AG27', t8f: 'T8F', kxd: 'KXD',
  hpl: 'HPL', mx: 'MX', drd: 'DRD', tnt: 'TNT', cpi: 'CPI', bmw: 'BMW', geico: 'Geico', uni: 'UNI', mrt: 'MRT', mrx: 'MRX',
  smx: 'SMX', quad: 'quad', lifan: 'Lifan', apollo: 'Apollo', roan: 'Roan', vivacity: 'Vivacity', elyseo: 'Elyseo',
  piston: 'pistón', cigueñal: 'cigüeñal', ciguenal: 'cigüeñal', neumatico: 'neumático', neumaticos: 'neumáticos',
  bateria: 'batería', electrico: 'eléctrico', plasticos: 'plásticos', plastico: 'plástico', deposito: 'depósito',
  camara: 'cámara', metalico: 'metálico', metalicas: 'metálicas', rapido: 'rápido', boton: 'botón', tapon: 'tapón',
  admision: 'admisión', reparacion: 'reparación', transmision: 'transmisión', proctector: 'protector', esparragos: 'espárragos',
  diametro: 'diámetro', magnetico: 'magnético', competicion: 'competición', laminas: 'láminas', automatico: 'automático',
  kilometros: 'kilómetros', reenvio: 'reenvío', portamatriculas: 'portamatrículas', encedido: 'encendido',
  carburacion: 'carburación', valvula: 'válvula', bujia: 'bujía', bujias: 'bujías', regulable: 'regulable',
};
function limpiaNombre(s) {
  s = ent(s).replace(/\s+/g, ' ').trim();
  s = s.replace(/[A-Za-zÁÉÍÓÚáéíóúÑñÜü0-9]+/g, w => {
    const k = w.toLowerCase();
    if (!(k in PALABRAS)) return w;
    const r = PALABRAS[k];
    // si la palabra original empezaba en mayúscula y la sustitución es una palabra común, conservar la mayúscula
    return /^[A-ZÁÉÍÓÚÑ]/.test(w) && r === r.toLowerCase() ? r[0].toUpperCase() + r.slice(1) : r;
  });
  s = s.replace(/(\d)\s?MM\b/g, '$1mm').replace(/(\d)\s?CC\b/g, '$1cc').replace(/(\d)\s?AH\b/g, '$1Ah')
    .replace(/M5X16mm/gi, 'M5x16mm').replace(/\s+\//g, ' /').replace(/\/(?=\S)/g, '/').replace(/\s{2,}/g, ' ');
  s = s.replace(/^(\d+)\s/, '$1 ');
  return s[0].toUpperCase() + s.slice(1);
}
function lineas(html) {
  if (!html) return [];
  const t = ent(html.replace(/<br\s*\/?>/gi, '\n').replace(/<\/(p|div|h\d|li|tr)>/gi, '\n').replace(/<li[^>]*>/gi, '\n• ').replace(/<[^>]+>/g, ''));
  const out = [];
  for (let l of t.split('\n')) {
    l = l.replace(/\s+/g, ' ').replace(/^•\s*/, '').trim();
    if (!l || out.includes(l)) continue;
    out.push(l);
  }
  return out;
}

// ---------- Árbol de categorías (del menú lateral de su web) ----------
const NOMBRES_CAT = {
  Carburacion: 'Carburación', Transmision: 'Transmisión', Piston: 'Pistones', Bujias: 'Bujías', Cigueñales: 'Cigüeñales',
  'Tobera de admision': 'Toberas de admisión', 'Caja de laminas y laminas': 'Cajas de láminas', 'Parte ciclos': 'Parte ciclo',
  'Bombas,latiguillos y pinzas': 'Bombas, latiguillos y pinzas', Electrico: 'Eléctrico', 'Encendido,bobina,CDI': 'Encendido, bobina y CDI',
  Encedido: 'Encendido', Neumaticos: 'Neumáticos', 'Plasticos': 'Plásticos', 'Tubos escape': 'Escape', Depositos: 'Depósitos',
  'Carter,tapas': 'Cárter y tapas', 'Neumaticos y camaras': 'Neumáticos y cámaras', 'Llanta,Neumaticos y Camaras': 'Llantas, neumáticos y cámaras',
  Neumatico: 'Neumáticos', Camaras: 'Cámaras', 'Campana de Embrague': 'Campanas de embrague', 'Patin electrico': 'Patinete eléctrico',
  Baterias: 'Baterías', 'Puños manillar': 'Puños de manillar', 'Puño de gas': 'Puño de gas', 'Partes ciclo': 'Parte ciclo',
  'Mando gas': 'Mando de gas', 'Grifo de gasolina': 'Grifos de gasolina', 'Caja de laminas': 'Cajas de láminas',
  'Recambio de carburador': 'Recambios de carburador', 'Chicles carburador': 'Chicles', 'Cable y fundas': 'Cables y fundas',
  'Cables y fundas': 'Cables y fundas', 'Bombas,Latiguillos y Pinza': 'Bombas, latiguillos y pinzas', 'Equipamiento de moto': 'Equipamiento',
  'Puños de moto': 'Puños', 'Porta matriculas': 'Portamatrículas', 'Manetas de motos': 'Manetas', 'Marcadores': 'Marcadores',
  'Cable cuenta km': 'Cable cuentakilómetros', 'Reenvio': 'Reenvíos', 'Intermitentes conmutadores': 'Intermitentes y conmutadores',
  'Encendido,cdi ,rotor': 'Encendido, CDI y rotor', 'Adhesivos y vinilos': 'Adhesivos y vinilos', 'Mandos de gas': 'Mandos de gas',
  'Caballetes moto': 'Caballetes', 'Tornilleria': 'Tornillería', 'Radiadores': 'Radiadores', 'Pastillas de freno': 'Pastillas de freno',
  'Pinza de freno': 'Pinzas de freno', 'Bomba de freno': 'Bombas de freno', 'Discos de frenos': 'Discos de freno',
  'Motor de arranque': 'Motor de arranque', 'Faros y pilotos': 'Faros y pilotos', 'Arrancadores': 'Arrancadores',
  'Rodamientos y retenes': 'Rodamientos y retenes', 'Cilindros completos': 'Cilindros completos', 'Bomba de agua': 'Bomba de agua',
  'Ruedas completas': 'Ruedas completas', 'Embrague': 'Embrague', 'Llantas': 'Llantas', 'Pastillas': 'Pastillas', 'Pinzas': 'Pinzas',
  'Bobinas': 'Bobinas', 'Equipamiento': 'Equipamiento', 'Varios': 'Varios', 'Accesorios': 'Accesorios', 'Herramientas': 'Herramientas',
  'Pit bike': 'Pit bike', 'Minimoto': 'Minimoto', 'Motor': 'Motor', 'Taller': 'Taller', 'Cilindro': 'Cilindros', 'Juntas': 'Juntas',
  'Motores completos': 'Motores completos', 'Cigueñal': 'Cigüeñal', 'Frenos': 'Frenos', 'Asientos': 'Asientos', 'Soportes': 'Soportes',
  'Cadenas': 'Cadenas', 'Amortiguadores': 'Amortiguadores', 'Carburador': 'Carburación', 'Filtro de aire': 'Filtros de aire',
  'Grifos de gasolina': 'Grifos de gasolina', 'Recambios de carburador': 'Recambios de carburador', 'Correas': 'Correas',
  'Poleas': 'Poleas', 'Variadores': 'Variadores', 'Culatas': 'Culatas', 'Tubos de escape': 'Escapes', 'Cerraduras': 'Cerraduras',
  'Carenados': 'Carenados', 'Intermitentes': 'Intermitentes', 'Conmutadores': 'Conmutadores', 'Faros': 'Faros', 'Pilotos': 'Pilotos',
  'CDI': 'CDI', 'Bobina': 'Bobinas', 'Pedales': 'Pedales', 'Paramanos': 'Paramanos', 'Protectores manillar': 'Protectores de manillar',
  'Pegatinas': 'Pegatinas', 'Retrovisores': 'Retrovisores', 'Estriberas': 'Estriberas', 'Tobera de admisión': 'Toberas de admisión',
  'Carburadores': 'Carburadores', 'Reparacion carburador': 'Reparación de carburador', 'Arrancador': 'Arrancadores',
  'Campana de embrague': 'Campanas de embrague', 'Electrico': 'Eléctrico', 'Neumaticos y camaras': 'Neumáticos y cámaras',
};
const tree = [];
{
  const ini = home.indexOf('<ul class="tree dhtml">');
  const s = home.slice(ini, home.indexOf('</div>', home.indexOf('block_content', ini) + 20) + 0);
  const tok = /<li id="cat_id_(\d+)"><a href="https:\/\/urbanmoto\.es\/([^"]+)"\s*>([^<]+)<\/a>|<ul>|<\/ul>/g;
  const pila = [tree]; let ultimo = null; let m; let primero = true;
  while ((m = tok.exec(s))) {
    if (m[0] === '<ul>') { if (primero) { primero = false; continue; } if (ultimo) { ultimo.sub = []; pila.push(ultimo.sub); } continue; }
    if (m[0] === '</ul>') { pila.pop(); if (!pila.length) break; continue; }
    primero = false;
    const nombre = ent(m[3]).trim();
    ultimo = { id: +m[1], slug: m[2], n: NOMBRES_CAT[nombre] || nombre };
    pila[pila.length - 1].push(ultimo);
  }
}
// Productos sin categoría en su tienda (colgaban de "Inicio"): los coloco donde los buscaría un cliente
const EXTRA = {
  72: ['19-Motor', '115-varios'], 158: ['30-Electrico', '175-accesorios-'], 160: ['19-Motor', '111-culatas'],
  163: ['19-Motor', '67-tubos-de-escape'], 245: ['30-Electrico', '124-encendido-y-bobinas', '158-cdi'],
};
for (const p of Object.values(fichas)) {
  const dentro = Object.entries(catsMembers).some(([slug, ids]) => slug !== '2-inicio' && ids.includes(p.id));
  if (!dentro && !EXTRA[p.id] && /filtro/i.test(p.name)) EXTRA[p.id] = ['19-Motor', '28-Carburador', '119-Filtro-de-aire'];
}
for (const [id, slugs] of Object.entries(EXTRA)) for (const s of slugs) if (!catsMembers[s].includes(+id)) catsMembers[s].push(+id);

const slugToId = {};
(function rec(l) { for (const c of l) { slugToId[c.slug] = c.id; c.count = (catsMembers[c.slug] || []).length; if (c.sub) rec(c.sub); } })(tree);
// podar categorías vacías
(function poda(l) { for (let i = l.length - 1; i >= 0; i--) { const c = l[i]; if (c.sub) { poda(c.sub); if (!c.sub.length) delete c.sub; } if (!c.count) l.splice(i, 1); } })(tree);
// el cliente no necesita "Taller" con 1 producto como familia propia: se queda, es real; se ordenan las familias como en su menú

// ---------- "Mi moto": modelos que aparecen en sus fichas ----------
const MOTOS = [
  ['Yamaha', [['Aerox', /\baerox\b/], ['Jog / Jog RR', /\bjog\b/], ['BWS', /\bbws\b/], ['Neos', /\bneos\b/], ['Slider', /\bslider\b/], ['TZR 50', /\btzr\b/], ['DT 50', /\bdt ?50\b/]]],
  ['MBK', [['Nitro', /\bnitro\b/], ['Booster', /\bbooster\b/], ['Ovetto', /\bovetto\b/]]],
  ['Aprilia', [['SR 50', /\bsr ?50\b/], ['RS 50', /\brs ?50\b/], ['Rally', /\brally\b/]]],
  ['Piaggio', [['Zip', /\bzip\b/], ['Typhoon', /\btyphoon\b/], ['NRG', /\bnrg\b/], ['Todos los Piaggio', /\bpiaggio\b/]]],
  ['Gilera', [['Runner', /\brunner\b/], ['Todos los Gilera', /\bgilera\b/]]],
  ['Derbi', [['Senda', /\bsenda\b/], ['Todos los Derbi', /\bderbi\b/]]],
  ['Peugeot', [['Speedfight', /speedfight/], ['Ludix', /\bludix\b/], ['Vivacity', /vivacity/], ['Todos los Peugeot', /\bpeugeot\b/]]],
  ['Rieju', [['MRT / MRX / SMX', /\b(mrt|mrx|smx)\b/], ['Todos los Rieju', /\brieju\b/]]],
  ['Malaguti', [['F12 / F15', /\bf ?1[25]\b/]]],
  ['Suzuki', [['Katana', /\bkatana\b/]]],
  ['Honda', [['CRF 50 / 70 / 80', /\bcrf ?(50|70|80)\b/], ['Dio', /\bdio\b/]]],
  ['Kymco', [['Todos los Kymco', /\bkymco\b/]]],
  ['Pit bike', [['Todas las pit bike', /pit ?bike/]]],
  ['Minimoto', [['Minimoto y minicross', /minimoto|minicross|mini ?gp/]]],
  ['Patinete eléctrico', [['Xiaomi M365 / 1S / Essential / Mi3', /xiaomi|m365/]]],
];
const MOTORES = [
  ['Minarelli horizontal', /minarelli horizontal|minarelli lc\b/], ['Minarelli vertical', /minarelli vertical/],
  ['Minarelli AM5 / AM6', /\bam ?[56]\b/], ['Piaggio / Gilera', /\b(piaggio|gilera)\b/], ['Derbi Euro 1 a 4', /derbi.{0,20}euro|senda/],
];

// ---------- Productos ----------
const prods = [], motosCuenta = {};
const recientes = '2026-08-15';
for (const p of Object.values(fichas)) {
  const nombre = limpiaNombre(p.name);
  const desc = lineas(p.desc);
  const texto = sinTildes((p.name + ' ' + desc.join(' ')).toLowerCase());
  const motos = [];
  MOTOS.forEach(([marca, modelos], i) => modelos.forEach(([mod, re], j) => { if (re.test(texto)) { motos.push(i + '.' + j); motosCuenta[i + '.' + j] = (motosCuenta[i + '.' + j] || 0) + 1; } }));
  MOTORES.forEach(([n, re], i) => { if (re.test(texto)) { motos.push('m' + i); motosCuenta['m' + i] = (motosCuenta['m' + i] || 0) + 1; } });
  const cats = Object.entries(catsMembers).filter(([slug, ids]) => slug !== '2-inicio' && ids.includes(p.id) && slugToId[slug]).map(([slug]) => slugToId[slug]);
  const nImg = Math.min(4, p.imgs.length);
  prods.push({
    id: p.id, n: nombre, p: p.price, s: Math.max(0, p.qty), c: cats, i: nImg,
    nu: p.date >= recientes ? 1 : 0, u: /\buniversal\b/i.test(p.name + ' ' + desc.slice(0, 6).join(' ')) ? 1 : 0,
    m: motos, f: p.date.slice(0, 10),
  });
  fs.mkdirSync('datos/p', { recursive: true });
  fs.writeFileSync(`datos/p/${p.id}.json`, JSON.stringify({ d: desc.slice(0, 120), mas: Math.max(0, desc.length - 120) }));
}
// fuera los que no tienen precio (en su tienda salen a 0 €)
const vendibles = prods.filter(p => p.p > 0);
const motosOut = MOTOS.map(([marca, modelos], i) => ({ marca, modelos: modelos.map(([n], j) => ({ k: i + '.' + j, n, c: motosCuenta[i + '.' + j] || 0 })).filter(m => m.c >= 2) })).filter(x => x.modelos.length);
const motoresOut = MOTORES.map(([n], i) => ({ k: 'm' + i, n, c: motosCuenta['m' + i] || 0 })).filter(m => m.c >= 2);

const salida = { generado: new Date().toISOString().slice(0, 10), cats: tree, prods: vendibles, motos: motosOut, motores: motoresOut,
  destacados: [72, 99, 158, 160, 163, 259, 504].filter(id => vendibles.some(p => p.id === id)) };
fs.writeFileSync('assets/catalogo.js', '/* Catálogo de urbanmoto.es (' + vendibles.length + ' productos) */\nwindow.UM_DATOS=' + JSON.stringify(salida) + ';\n');
console.log('productos', vendibles.length, 'de', prods.length, '| novedades', vendibles.filter(p => p.nu).length, '| universales', vendibles.filter(p => p.u).length);
console.log('categorías raíz', tree.map(c => c.n + ' ' + c.count).join(', '));
console.log('motos', motosOut.map(m => m.marca + ': ' + m.modelos.map(x => x.n + ' ' + x.c).join(', ')).join(' | '));
console.log('motores', motoresOut.map(m => m.n + ' ' + m.c).join(', '));
console.log('tamaño catalogo.js', fs.statSync('assets/catalogo.js').size);
console.log('sin categoría', vendibles.filter(p => !p.c.length).map(p => p.id + ' ' + p.n).join(' | ') || 'ninguno');
console.log('ejemplos nombres:', vendibles.slice(0, 400).filter((_, i) => i % 23 === 0).map(p => p.n).join(' | '));
