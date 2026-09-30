// Asistente de La Manducateca: motor por reglas (sin IA de pago ni servidor) que prepara una selección de quesos
// según presupuesto, personas y gustos, y deja el pedido listo para confirmar. Lo usan index.html y panel.html.
(function (global) {
  "use strict";
  const D = global.MANDU_DATOS;
  const HORARIO = "de lunes a viernes de 10:30 a 14:00 y de 17:00 a 20:00, y los sábados de 10:30 a 14:00";
  const HORARIO_CORTO = "L-V 10:30-14:00 y 17:00-20:00, S 10:30-14:00";
  const DIRECCION = "General Concha 7, 48008 Bilbao";
  const APERTURA = "Hola 👋 Soy el asistente de La Manducateca, la quesería de General Concha 7, en Bilbao.\n\nTe preparo una selección a tu medida según presupuesto, personas y gustos, y dejo el pedido listo para que Las Chicas de La Mandu te lo confirmen.\n\n¿Qué tienes en mente?";
  const OPCIONES_TIPO = ["Un regalo", "Tabla para una reunión", "Quesos para casa", "Cata o taller", "Raclette para el finde", "Boda o evento"];
  const ENVIO = { bilbao: 6.9, bizkaia: 8.9, resto: 9.9 };

  const norm = s => (s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
  const cap = s => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);
  const limpiar = s => (s || "").replace(/\s+/g, " ").replace(/^[\s,.;:!¡¿?-]+|[\s,.;:!-]+$/g, "").trim();
  const eur = v => (Math.round(v * 100) / 100).toFixed(2).replace(".", ",").replace(/,00$/, "") + " €";
  const hoy = () => new Date();
  const iso = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  const DIAS = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];
  const MESES = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
  const fechaBonita = d => `${DIAS[d.getDay()]} ${d.getDate()} de ${MESES[d.getMonth()]}`;
  const lista = arr => arr.length <= 1 ? arr.join("") : arr.slice(0, -1).join(", ") + " y " + arr[arr.length - 1];
  const disp = arr => arr.filter(x => !x.agotado);

  // ---------- tipo de petición ----------
  const TIPOS = [
    ["raclette", /raclet/],
    ["empresa", /cestas? de (navidad|empresa)|lotes? de navidad|regalos? (de|para) (empresa|clientes|empleados|equipo|plantilla|trabajadores)|detalles? para (clientes|empleados|invitados|el equipo)|\d+\s*(cestas|lotes|packs|cajas|regalos|detalles)\b/],
    ["evento", /\bboda|\bevento|\bempresa\b|team ?building|mesa de quesos|cheese ?corner|\bcorner\b|catering|despedida|comuni[oó]n|bautizo|c[oó]ctel|cocktail|inauguraci|afterwork|para (mi|la) oficina|\b([2-9]\d|\d{3})\s*(personas|invitados|pax)/],
    ["cata", /\bcata|taller|curso|masterche|quesonario|tardeo/],
    ["suscripcion", /suscripci|cada mes|mensual/],
    ["tarjeta", /tarjeta regalo|vale regalo|\bbono\b|cheque regalo/],
    ["regalo", /regal|\bcaja\b|cesta|detalle|cumple|aniversario|amigo invisible|navidad|agradec|sorprender|para mi (madre|padre|pareja|novi[oa]|amig[oa]|herman[oa]|jefe|jefa|cunad|suegr|abuel)|\bmama\b|\bpapa\b|\bama\b|\baita\b/],
    ["tabla", /tabla|picoteo|reuni[oó]n|\bcena\b|comida|celebra|fiesta|invitad|aperitivo|vermut con|amigos|familia|quedada|cuadrilla|somos \d|para \d+ personas|\bpara (dos|tres|cuatro|cinco|seis|ocho|diez)\b/],
    ["casa", /para casa|para m[ií]\b|sueltos|unos quesos|comprar queso|quiero queso|\bcu[nñ]as?\b|surtido|probar|llevarme|\bqueso\b|\bquesos\b/],
  ];
  const CHIP_TIPO = { "Un regalo": "regalo", "Tabla para una reunión": "tabla", "Quesos para casa": "casa", "Cata o taller": "cata", "Raclette para el finde": "raclette", "Boda o evento": "evento" };
  const NOMBRE_TIPO = { regalo: "Regalo", tabla: "Tabla para reunión", casa: "Quesos para casa", cata: "Cata", raclette: "Raclette", evento: "Boda o evento", suscripcion: "Suscripción de quesos", tarjeta: "Tarjeta regalo", empresa: "Regalos de empresa" };
  function detectarTipo(t) {
    if (CHIP_TIPO[t.trim()]) return CHIP_TIPO[t.trim()];
    const n = norm(t);
    for (const [id, re] of TIPOS) if (re.test(n)) return id;
    return null;
  }

  // ---------- parsers ----------
  const NUM = { un: 1, una: 1, uno: 1, dos: 2, tres: 3, cuatro: 4, cinco: 5, seis: 6, siete: 7, ocho: 8, nueve: 9, diez: 10, once: 11, doce: 12, quince: 15, veinte: 20, veinticinco: 25, treinta: 30, cuarenta: 40, cincuenta: 50, sesenta: 60, ochenta: 80, cien: 100 };
  function parsePersonas(t) {
    const n = norm(t);
    if (/pareja|para (dos|2)|los dos|en pareja|mi (novi|chic|mujer|marido)|somos dos/.test(n)) return 2;
    if (/para mi\b|solo yo|yo sol[oa]|una persona|1 persona/.test(n)) return 1;
    const r = n.match(/(\d{1,3})\s*(?:-|a|o|y)\s*(\d{1,3})/); if (r) return Math.max(+r[1], +r[2]);
    const m = n.match(/(\d{1,3})/); if (m && +m[1] > 0 && +m[1] <= 300) return +m[1];
    for (const [w, v] of Object.entries(NUM)) if (new RegExp("\\b" + w + "\\b").test(n)) return v;
    if (/no (lo )?se|ni idea|depende|aun no/.test(n)) return 0;
    return null;
  }
  const OPCIONES_PRESU = { regalo: ["Menos de 30 €", "30-50 €", "50-80 €", "Más de 80 €", "Sorpréndeme"], tabla: ["Alrededor de 30 €", "40-60 €", "60-100 €", "Más de 100 €", "Sorpréndeme"], casa: ["Alrededor de 20 €", "30-50 €", "50-80 €", "Sorpréndeme"] };
  const VALOR_PRESU = { "Menos de 30 €": [15, 30], "30-50 €": [30, 50], "50-80 €": [50, 80], "Más de 80 €": [80, 130], "Alrededor de 30 €": [24, 36], "40-60 €": [40, 60], "60-100 €": [60, 100], "Más de 100 €": [100, 160], "Alrededor de 20 €": [15, 25], "Sorpréndeme": null };
  function parsePresupuesto(t) {
    if (VALOR_PRESU[t.trim()] !== undefined) { const v = VALOR_PRESU[t.trim()]; return v ? { texto: t.trim(), min: v[0], max: v[1] } : { texto: "Sin límite fijado", min: null, max: null }; }
    const n = norm(t).replace(/(\d)[.,](\d{3})\b/g, "$1$2");
    if (/sorprend|lo que (haga falta|sea|me digas|tu veas|veas|creas|quieras|os parezca)|tu veras|a (tu|vuestro) criterio|sin limite|no (tengo|hay) limite|abierto|da igual|lo que veais|no me importa/.test(n)) return { texto: "Sin límite fijado", min: null, max: null };
    if (/no (lo )?se|ni idea|no tengo (claro|ni idea|presupuesto)|prefiero no/.test(n)) return { texto: "Sin definir", min: null, max: null };
    const nums = [...n.matchAll(/(\d+(?:[.,]\d+)?)/g)].map(m => parseFloat(m[1].replace(",", "."))).filter(v => v >= 5 && v <= 5000);
    if (!nums.length) return null;
    if (nums.length >= 2) { const a = Math.min(nums[0], nums[1]), b = Math.max(nums[0], nums[1]); return { texto: `${eur(a).replace(" €", "")}-${eur(b)}`, min: a, max: b }; }
    const v = nums[0];
    if (/menos de|maximo|max\b|como mucho|hasta|no mas de|tope/.test(n)) return { texto: "Hasta " + eur(v), min: v * 0.6, max: v };
    if (/mas de|minimo|a partir|desde|por lo menos/.test(n)) return { texto: "Más de " + eur(v), min: v, max: v * 1.5 };
    if (/por persona|por cabeza|cada uno|p\/p|pp\b/.test(n)) return { texto: eur(v) + " por persona", min: null, max: null, porPersona: v };
    return { texto: "≈ " + eur(v), min: v * 0.85, max: v * 1.05 };
  }
  const OPCIONES_GUSTOS = ["Suaves y cremosos", "Intensos y curados", "De todo un poco", "Sin azules", "Solo pasteurizados"];
  function parseGustos(t) {
    const n = norm(t);
    const g = {};
    let algo = false;
    const negFuerte = /(nada de|\bsin\b|\bno\b( muy| demasiado| quiero| me gustan| nos gustan| le gustan)?|\bpoco\b|ni muy|tampoco)\s*(quesos? )?(fuerte|intens|curad|potente)/.test(n);
    if (/suave|cremos|delicad|dulce|nada fuerte|no muy fuerte|para ninos|tirando a suave|ligero/.test(n) || negFuerte) { g.int = 1; algo = true; }
    if (!negFuerte && /intens|fuerte|curad|potente|caracter|con cuerpo|anejo|viejo|atrevid/.test(n)) { g.int = g.int === 1 ? 2 : 3; algo = true; }
    if (/de todo|variad|mezcla|un poco de todo|surtido|equilibrad|de todo un poco|lo que me digas|sorprend|confio/.test(n)) { g.int = 2; g.variado = true; algo = true; }
    if (/sin azul|no .*azul|azul(es)? no\b|odi\w* (el|los) azul|nada de azul|menos azul/.test(n)) { g.azules = false; algo = true; }
    else if (/azul|roquefort|stilton|gorgonzola|cabrales/.test(n)) { g.azules = true; algo = true; }
    if (/\bcabra\b/.test(n)) { (g.leches = g.leches || []).push("cabra"); algo = true; }
    if (/\boveja\b|idiazabal|manchego/.test(n)) { (g.leches = g.leches || []).push("oveja"); algo = true; }
    if (/\bvaca\b/.test(n)) { (g.leches = g.leches || []).push("vaca"); algo = true; }
    if (/sin lactosa|intoleran|lactosa/.test(n)) { g.sl = true; algo = true; }
    if (/embaraz|pasteuriz|leche cruda no|sin leche cruda|solo pasteurizados/.test(n)) { g.past = true; algo = true; }
    if (/vasc|de aqui|local|euskadi|de la tierra|km ?0|cercan/.test(n)) { g.vasco = true; algo = true; }
    if (/franc/.test(n)) { g.frances = true; algo = true; }
    if (/trufa/.test(n)) { g.nota = "Pide trufa (el Brie trufado está agotado)"; algo = true; }
    if (/vegan/.test(n)) { g.nota = "Pregunta por queso vegano (no hay en catálogo)"; algo = true; }
    if (/sin gluten|celiac/.test(n)) { g.nota = "Sin gluten: quesos sí; sustituir pan y crackers"; algo = true; }
    if (/alergi|alergen|frutos secos|nuez|nueces/.test(n)) { g.nota = "Avisa de alergia: " + limpiar(t); algo = true; }
    if (/que (me )?(recomiendas|recomendais|sugieres)|lo que (querais|veais|creais)|a vuestro gusto|me da igual|me fio/.test(n)) { g.int = g.int || 2; g.variado = true; algo = true; }
    return algo ? g : null;
  }
  function etiquetaGustos(g) {
    if (!g) return "";
    const p = [];
    if (g.int === 1) p.push("suaves"); else if (g.int === 3) p.push("intensos"); else if (g.variado) p.push("variados");
    if (g.azules === false) p.push("sin azules"); else if (g.azules === true) p.push("con azul");
    if (g.leches) p.push("de " + lista(g.leches));
    if (g.sl) p.push("sin lactosa");
    if (g.past) p.push("solo pasteurizados");
    if (g.vasco) p.push("vascos");
    if (g.frances) p.push("franceses");
    if (g.nota) p.push(g.nota);
    return p.length ? cap(p.join(", ")) : "Sin preferencia";
  }
  const OPCIONES_BEBIDA = ["Vino", "Txakoli", "Cerveza artesana", "Vermut", "Sin bebida"];
  function parseBebida(t) {
    const n = norm(t);
    if (/txakoli|chacoli/.test(n)) return "txakoli";
    if (/sin alcohol|0,0|0\.0|no bebe|no toma/.test(n)) return "sin alcohol";
    if (/\bsin\b|\bno\b|nada|solo queso|ninguna|sin bebida|no hace falta/.test(n)) return "sin";
    if (/vermut|vermu\b/.test(n)) return "vermut";
    if (/cervez|birra|\bipa\b|caña/.test(n)) return "cerveza";
    if (/espumos|cava|champ|brindar|burbuj/.test(n)) return "espumoso";
    if (/vino|tinto|blanco|rosado|copa/.test(n)) return "vino";
    if (/sidra/.test(n)) return "sidra";
    if (/lo que (me )?(digas|recomiendes|veais)|recomienda|sorprend|da igual|cualquiera|a vuestro gusto/.test(n)) return "recomendacion";
    return null;
  }
  const NOMBRE_BEBIDA = { vino: "vino", txakoli: "txakoli", cerveza: "cerveza artesana", vermut: "vermut", sin: "sin bebida", "sin alcohol": "bebida sin alcohol", espumoso: "espumoso", sidra: "sidra", recomendacion: "la que recomiende La Mandu" };
  function parseFecha(t) {
    const n = norm(t);
    const h = hoy();
    const conDia = d => ({ texto: cap(fechaBonita(d)), iso: iso(d) });
    if (/\bhoy\b|ahora|esta tarde|esta manana|en un rato/.test(n)) return conDia(h);
    if (/pasado manana/.test(n)) { const d = new Date(h); d.setDate(d.getDate() + 2); return conDia(d); }
    if (/manana/.test(n)) { const d = new Date(h); d.setDate(d.getDate() + 1); return conDia(d); }
    const m = n.match(/\b(\d{1,2})\s*(?:de\s+)?(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|setiembre|octubre|noviembre|diciembre)\b/);
    if (m) { const mes = MESES.indexOf(m[2].replace("setiembre", "septiembre")); const d = new Date(h.getFullYear(), mes, +m[1]); if (d < h) d.setFullYear(d.getFullYear() + 1); return conDia(d); }
    const m2 = n.match(/\b(\d{1,2})[\/-](\d{1,2})(?:[\/-](\d{2,4}))?\b/);
    if (m2) { const d = new Date(m2[3] ? (+m2[3] < 100 ? 2000 + +m2[3] : +m2[3]) : h.getFullYear(), +m2[2] - 1, +m2[1]); if (d < h && !m2[3]) d.setFullYear(d.getFullYear() + 1); return conDia(d); }
    const dia = n.match(/\b(lunes|martes|miercoles|jueves|viernes|sabado|domingo)\b/);
    if (dia) {
      const idx = ["domingo", "lunes", "martes", "miercoles", "jueves", "viernes", "sabado"].indexOf(dia[1]);
      const d = new Date(h); let delta = (idx - h.getDay() + 7) % 7; if (delta === 0 && !/este|hoy/.test(n)) delta = 7; if (/que viene|proximo|siguiente/.test(n) && delta < 7 && h.getDay() >= idx) delta += 0; d.setDate(d.getDate() + delta);
      return conDia(d);
    }
    if (/este finde|fin de semana|el finde|finde/.test(n)) { const d = new Date(h); d.setDate(d.getDate() + ((6 - h.getDay() + 7) % 7 || 7)); return { texto: "Este fin de semana (" + fechaBonita(d) + ")", iso: iso(d) }; }
    const dm = n.match(/\bel (\d{1,2})\b/);
    if (dm) { const d = new Date(h.getFullYear(), h.getMonth(), +dm[1]); if (d < h) d.setMonth(d.getMonth() + 1); return conDia(d); }
    const nav = n.match(/antes de navidad|para navidad|navidad|nochebuena|reyes|nochevieja|fin de ano/);
    if (nav) return { texto: cap(nav[0].replace("navidad", "Navidad").replace("reyes", "Reyes").replace("fin de ano", "fin de año")), iso: `${h.getFullYear()}-12-${/reyes/.test(nav[0]) ? "31" : "20"}` };
    if (/en (una|1) semana|semana que viene|proxima semana/.test(n)) { const d = new Date(h); d.setDate(d.getDate() + 7); return { texto: "La semana que viene", iso: iso(d) }; }
    if (/en (dos|2) semanas/.test(n)) { const d = new Date(h); d.setDate(d.getDate() + 14); return { texto: "En dos semanas", iso: iso(d) }; }
    if (/cuanto antes|lo antes posible|ya\b|urgente/.test(n)) { const d = new Date(h); d.setDate(d.getDate() + 1); return { texto: "Lo antes posible", iso: iso(d) }; }
    if (/sin prisa|cuando podais|sin fecha|no tengo fecha|da igual|indiferente|cuando (os )?venga bien|mas adelante|todavia no (lo )?se/.test(n)) return { texto: "Sin fecha fija", iso: null };
    if (t.trim().length <= 40 && !/\?/.test(t) && /\b(semana|dia|dias|mes|tarde|noche|mediodia|finde|antes de|despues de|proxim|cumple|boda|navidad|fiesta|puente|primeros|finales|mediados|\d)/.test(n) && !parseGustos(t) && !parseBebida(t)) return { texto: cap(limpiar(t)), iso: null };
    return null;
  }
  // Presupuesto dicho de pasada ("unos 60 euros", "presupuesto 100"): solo números pegados a €/euros o a la palabra presupuesto.
  function presupuestoSuelto(t) {
    const n = norm(t).replace(/(\d)[.,](\d{3})\b/g, "$1$2");
    const trozos = [...n.matchAll(/((?:menos de|maximo|max|como mucho|hasta|no mas de|tope|mas de|minimo|desde|unos|alrededor de|sobre|aprox\w*)\s+)?(\d+(?:[.,]\d+)?)\s*(€|euros|eur\b|pavos)|presupuesto\s*(?:de|es|:)?\s*(?:unos\s+)?(\d+)/g)];
    if (!trozos.length) return null;
    const texto = trozos.map(m => (m[1] || "") + (m[2] || m[4]) + " euros").join(" y ");
    return parsePresupuesto(texto);
  }
  const BARRIOS_BILBAO = /bilbao|bilbo|deusto|indautxu|abando|santutxu|begona|zorroza|rekalde|recalde|san ignacio|casco viejo|bolueta|otxarkoaga|txurdinaga|basurto|uribarri|miribilla|zabalburu|ametzola|san adrian|la pena|matiko|castanos|zurbaran|irala|olabeaga|zorrotzaurre|arangoiti|sarriko|ibarrekolanda|elorrieta|atxuri|solokoetxe|iturribide|general concha|gordoniz|autonomia|gran via/;
  const BIZKAIA = /getxo|algorta|las arenas|areeta|neguri|romo|leioa|lejona|barakaldo|baracaldo|basauri|galdakao|galdacano|durango|bermeo|gernika|guernica|portugalete|santurtzi|santurce|sestao|erandio|mungia|munguia|amorebieta|zornotza|sopela|sopelana|berango|zamudio|derio|arrigorriaga|etxebarri|echevarri|ermua|balmaseda|zalla|guenes|gueñes|plentzia|gorliz|lekeitio|lequeitio|ondarroa|markina|elorrio|abadino|abadiño|iurreta|ortuella|trapagaran|valle de trapaga|muskiz|zierbena|abanto|loiu|lujua|larrabetzu|lezama|urduliz|barrika|gatika|mundaka|busturia|orozko|ugao|zeberio|igorre|arratia|karrantza|carranza|sodupe|alonsotegi|bakio|lemoa|lemona|otxandio|elgoibar no|bizkaia|vizcaya|margen (izquierda|derecha)/;
  const PENINSULA = /madrid|barcelona|valencia|sevilla|zaragoza|malaga|murcia|alicante|cordoba|valladolid|vigo|gijon|oviedo|asturias|santander|cantabria|logrono|rioja|pamplona|iruna|navarra|donosti|san sebastian|vitoria|gasteiz|gipuzkoa|guipuzcoa|araba|alava|burgos|leon|salamanca|zamora|palencia|soria|segovia|avila|toledo|cuenca|guadalajara|albacete|ciudad real|badajoz|caceres|huelva|cadiz|granada|jaen|almeria|castellon|tarragona|lleida|girona|huesca|teruel|coruna|lugo|ourense|pontevedra|galicia|catalu|andaluc|extremadura|castilla|aragon|portugal|peninsula|espana/;
  const FUERA = /canarias|tenerife|gran canaria|lanzarote|fuerteventura|baleares|mallorca|menorca|ibiza|ceuta|melilla|francia|paris|londres|alemania|italia|extranjero|europa|reino unido|inglaterra|belgica|holanda|portugal no/;
  // Devuelve el nombre del sitio tal y como lo escribió el cliente (con sus acentos) a partir del trozo normalizado que casó.
  function nombreOriginal(t, casado) {
    const palabras = t.split(/\s+/);
    const k = casado.split(/\s+/).length;
    for (let i = 0; i + k <= palabras.length; i++) { const tramo = palabras.slice(i, i + k).join(" "); const a = norm(tramo).replace(/[^a-z0-9 ]/g, ""), b = casado.replace(/[^a-z0-9 ]/g, ""); if (a === b || (k === 1 && a.startsWith(b))) return tramo.replace(/[,.;:!?¡¿]+$/g, "").split(" ").map(cap).join(" "); }
    return cap(casado);
  }
  function detectarLugar(t) {
    const n = norm(t);
    let m;
    if ((m = FUERA.exec(n))) return { zona: "fuera", lugar: nombreOriginal(t, m[0]) };
    if ((m = BARRIOS_BILBAO.exec(n))) return { zona: "bilbao", lugar: /bilbao|bilbo/.test(m[0]) ? "Bilbao" : "Bilbao (" + nombreOriginal(t, m[0]) + ")" };
    if ((m = BIZKAIA.exec(n))) return { zona: "bizkaia", lugar: /bizkaia|vizcaya|margen/.test(m[0]) ? "Bizkaia" : nombreOriginal(t, m[0]) };
    if ((m = PENINSULA.exec(n))) return { zona: "resto", lugar: nombreOriginal(t, m[0]) };
    return null;
  }
  const OPCIONES_ENTREGA = ["Recojo en tienda", "Envío a domicilio"];
  function parseEntrega(t) {
    const n = norm(t);
    if (/individual|cada (uno|una|cliente|destinatario)|a su destinatario|varias direcciones|distintas direcciones/.test(n)) return { modo: "envio", zona: "varios", lugar: "varias direcciones" };
    if (/recoj|recog|paso por|tienda|yo voy|lo cojo|me acerco|en persona|voy yo|pasar a por/.test(n)) return { modo: "recogida" };
    if (/todas a una|a una direccion|a la oficina|a nuestra oficina|a la empresa/.test(n)) { const l = detectarLugar(t); return { modo: "envio", ...(l || {}) }; }
    const lugar = detectarLugar(t);
    if (/envi|domicilio|mandar|mand[aá]|a casa|me lo (traeis|llevais|traigan)|reparto|transporte|por mensajer/.test(n) || lugar) return { modo: "envio", ...(lugar || {}) };
    return null;
  }
  function parseNombre(t) {
    let n = limpiar(t).replace(/^(hola,?\s*)?(soy|me llamo|mi nombre es|me dicen|pues|ok,?|vale,?|a nombre de|para)\s+/i, "");
    n = n.replace(/[.!¡]+$/g, "").trim();
    if (!n || /\d|\?/.test(n) || n.split(/\s+/).length > 5 || n.length < 2) return null;
    if (/\b(prefiero|quiero|hablar|persona|llamar|llamadme|no se|nose|porque|para que|no quiero|necesito|tengo|gracias|queso|quesos|vino|envio|enviar|envialo|recoj|recog|tabla|sabado|domingo|lunes|martes|miercoles|jueves|viernes|manana|hoy|euros|sin|todo|poco|suave|intens|azul|cerveza|txakoli|vermut|pan|casa|tienda|regalo|cata|boda|personas|nota|si|no|vale|ok)\b/.test(norm(n))) return null;
    return n.split(/\s+/).map(cap).join(" ");
  }
  const OPCIONES_FORMATO = ["Tabla lista para servir", "Quesos enteros, la monto yo"];
  function parseFormato(t) {
    const n = norm(t);
    if (/lista|preparad|cortad|montad|servir|hecha|para poner|ya hecha|comod/.test(n)) return "preparada";
    if (/enter|monto yo|a medida|suelt|cu[nñ]as|piezas|la hago yo|yo la monto|elegir/.test(n)) return "medida";
    return null;
  }
  const OPCIONES_EXTRAS = ["Pan de Gure Ogia", "Una botella", "Algo dulce", "Solo los quesos"];
  function parseExtras(t) {
    const n = norm(t);
    const e = { pan: /\bpan\b|hogaza|gure ogia/.test(n), dulce: /dulce|chocolate|galleta|postre|kaitxo/.test(n), aperitivo: /aceituna|gilda|encurtid|aperitivo|happy|cacahuete|frutos secos/.test(n), mantequilla: /mantequilla/.test(n) };
    const b = parseBebida(t);
    if (b && b !== "sin") e.bebida = b;
    else if (!b && /botella|bebida|algo de beber|para beber/.test(n)) e.bebida = "recomendacion";
    if (/solo (los )?quesos|nada mas|solo queso|no,? gracias|^no\b|nada|sin bebida|sin nada|sin extras|asi esta bien/.test(n) && !e.pan && !e.dulce && !e.bebida) return { nada: true };
    if (/todo|de todo|completo/.test(n)) return { pan: true, dulce: true, aperitivo: true };
    return (e.pan || e.dulce || e.aperitivo || e.bebida || e.mantequilla) ? e : null;
  }
  const esSaludo = t => /^(hola|holi|buenas|buenos dias|buenas tardes|buenas noches|hey|ey|que tal|hello|hi|kaixo|egun on|arratsalde on)[\s!.,]*$/.test(norm(t));
  const esGracias = t => /^(gracias|muchas gracias|vale,? gracias|ok,? gracias|perfecto|genial|estupendo|ok|vale|de acuerdo|muy bien|entendido|eskerrik asko|mila esker)[\s!.,]*$/.test(norm(t));
  const esPregunta = t => /\?|^(cuant|que |donde|como|puedo|se puede|hay |teneis|haceis|vendeis|enviais|dais|cobrais|tardais|sois|incluye|cual|a que hora|abris|cuando)/.test(norm(t).trim());
  const OCASION_RE = /cumple\w*|aniversario|agradecimiento|amigo invisible|jubilaci\w*|boda|navidad|san valent[ií]n|d[ií]a de la madre|d[ií]a del padre|despedida|inauguraci\w*|bienvenida|graduaci\w*|nacimiento|bautizo|comuni[oó]n|reyes|olentzero/i;
  const ocasionDe = t => { const m = t.match(OCASION_RE); if (!m) return null; const o = m[0].toLowerCase(); return /^cumple/.test(o) ? "Cumpleaños" : /^jubila/.test(o) ? "Jubilación" : /^inaugura/.test(o) ? "Inauguración" : /^gradua/.test(o) ? "Graduación" : cap(o); };
  const pideHumano = t => /hablar con (alguien|una persona|las chicas|maria|una de las chicas|un humano)|con una persona|persona real|\bhumano\b|llamadme|llamame|que me llamen|prefiero (llamar|hablar)|no quiero (un )?(bot|robot)|\brobot\b|\bbot\b|eres (un bot|una maquina|un robot)/.test(norm(t));

  // ---------- selección de quesos a medida ----------
  const Q = () => disp(D.QUESOS);
  function candidatos(g) {
    let c = Q();
    const gu = g.gustos || {};
    if (gu.past) c = c.filter(q => q.past === true);
    if (gu.sl) c = c.filter(q => q.sl || (q.tipo === "duro" && q.int >= 2));
    if (gu.azules === false) c = c.filter(q => !q.azul);
    if (gu.int === 1) c = c.filter(q => q.int <= 2);
    if (gu.int === 3) c = c.filter(q => q.int >= 2);
    if (g.excluir && g.excluir.length) c = c.filter(q => !g.excluir.includes(q.id));
    return c;
  }
  // Papeles que dan variedad a una tabla, en orden de prioridad según preferencia.
  const PAPELES = {
    variado: ["cremoso", "oveja", "duro", "azul", "cabra", "especial", "blando", "duro2"],
    suave: ["cremoso", "prensado", "cabra", "oveja", "duro", "blando", "azul", "especial"],
    intenso: ["oveja", "duro", "azul", "cabra", "especial", "blando", "cremoso", "duro2"],
  };
  const PAPEL = {
    cremoso: q => q.tipo === "cremoso", blando: q => q.tipo === "blando", oveja: q => q.leche === "oveja", duro: q => q.tipo === "duro", duro2: q => q.tipo === "duro",
    azul: q => q.azul, cabra: q => q.leche === "cabra" && !q.azul, especial: q => q.estrella || q.tipo === "prensado", prensado: q => q.tipo === "prensado",
  };
  function elegirQuesos(g, n, presuQuesos) {
    const gu = g.gustos || {};
    let cands = candidatos(g);
    const pref = gu.int === 1 ? "suave" : gu.int === 3 ? "intenso" : "variado";
    let papeles = PAPELES[pref].slice();
    if (gu.azules === true && papeles.indexOf("azul") > 1) { papeles.splice(papeles.indexOf("azul"), 1); papeles.splice(1, 0, "azul"); }
    if (gu.leches) for (const l of gu.leches.slice().reverse()) { const p = l === "cabra" ? "cabra" : l === "oveja" ? "oveja" : "duro"; papeles.splice(papeles.indexOf(p), 1); papeles.unshift(p); }
    const porQueso = presuQuesos && n ? presuQuesos / n : 8.5;
    const nivel = porQueso < 7.8 ? 0 : porQueso > 10 ? 2 : 1;
    const elegidos = [];
    const puntuar = q => {
      let s = 0;
      if (gu.vasco && q.vasco) s += 6;
      if (gu.sl && q.sl) s += 8;
      if (gu.frances && /Francia|Normandía|Jura|Ródano|Île/.test(q.origen)) s += 6;
      if (gu.int === 1) s += (2 - q.int) * 2; else if (gu.int === 3) s += (q.int - 1) * 2;
      if (q.estrella) s += nivel === 2 ? 3 : nivel === 1 ? 1 : -1;
      s += nivel === 0 ? (10 - q.p) : nivel === 2 ? (q.p - 6) * 0.6 : -Math.abs(q.p - 8.8);
      if (elegidos.some(e => e.leche === q.leche)) s -= 1.5;
      if (elegidos.some(e => e.tipo === q.tipo)) s -= 2;
      if (elegidos.some(e => e.origen === q.origen)) s -= 1;
      return s;
    };
    for (const papel of papeles) {
      if (elegidos.length >= n) break;
      const pool = cands.filter(q => PAPEL[papel](q) && !elegidos.includes(q));
      if (!pool.length) continue;
      pool.sort((a, b) => puntuar(b) - puntuar(a));
      elegidos.push(pool[0]);
    }
    for (const q of cands.sort((a, b) => puntuar(b) - puntuar(a))) { if (elegidos.length >= n) break; if (!elegidos.includes(q)) elegidos.push(q); }
    return elegidos;
  }
  const buscar = (arr, tipo, opts = {}) => { const l = disp(arr).filter(x => x.tipo === tipo && (opts.filtro ? opts.filtro(x) : true)); if (!l.length) return null; l.sort((a, b) => opts.caro ? b.p - a.p : a.p - b.p); return opts.medio ? l[Math.floor(l.length / 2)] : l[0]; };
  function botella(bebida, nivel) {
    const B = D.BEBIDAS;
    switch (bebida) {
      case "txakoli": return nivel >= 2 ? buscar(B, "txakoli", { caro: true }) : nivel === 1 ? buscar(B, "txakoli", { medio: true }) : buscar(B, "txakoli");
      case "vino": return nivel >= 2 ? buscar(B, "vino", { filtro: b => b.p >= 25 }) : buscar(B, "vino");
      case "vermut": return buscar(B, "vermut");
      case "espumoso": return buscar(B, "espumoso");
      case "cerveza": return buscar(B, "cerveza", { filtro: b => b.pack, caro: nivel >= 2 });
      case "recomendacion": return nivel >= 2 ? buscar(B, "txakoli", { caro: true }) : buscar(B, "txakoli", { medio: true });
      default: return null;
    }
  }
  const sinRestricciones = gu => !gu.leches && gu.azules == null && !gu.sl && !gu.past && gu.int !== 1 && gu.int !== 3 && !gu.medida && !gu.frances;
  const linea = (x, cant = 1, cat) => ({ id: x.id, n: x.n, p: x.p, cant, corto: x.corto, img: x.img, url: x.url, cat: cat || x.tipo || "queso" });
  const total = lineas => lineas.reduce((s, l) => s + l.p * l.cant, 0);

  function armar(g) {
    const gu = g.gustos || {};
    const pr = g.presupuesto || {};
    const n = g.personas || (g.tipo === "regalo" ? 2 : 2);
    let lineas = [], notas = [];
    const max = pr.max || null, min = pr.min || null;
    const nivel = max == null ? 1 : max >= 80 ? 2 : max <= 35 ? 0 : 1;

    if ((g.tipo === "regalo" || g.tipo === "empresa") && gu.past && !gu.medida) {
      const pack = disp(D.PACKS).find(p => p.embarazo), sel = disp(D.SELECCIONES).find(s => s.embarazo);
      if (pack && (max == null || max >= 45)) lineas.push(linea(pack, 1, "pack")); else if (sel && (max == null || max >= sel.p * 0.92)) lineas.push(linea(sel, 1, "seleccion"));
    } else if ((g.tipo === "regalo" || g.tipo === "empresa") && sinRestricciones(gu) && g.bebida !== "sin alcohol") {
      // sin condiciones de gusto: un pack de la casa que encaje con bebida y presupuesto
      const b = g.bebida;
      const tope = max || 60, suelo = min || 0;
      let packs = disp(D.PACKS).filter(p => !p.embarazo && p.p <= tope * 1.08);
      const sels = disp(D.SELECCIONES).filter(s => !s.embarazo && s.p <= tope * 1.08);
      let pool;
      if (b === "sin" || b == null) pool = sels.concat(packs.filter(p => p.bebida === "sin"));
      else if (b === "vino") pool = packs.filter(p => p.bebida === "vino" || p.bebida === "txakoli");
      else if (b === "recomendacion") pool = packs.concat(sels);
      else pool = packs.filter(p => p.bebida === b);
      if (gu.vasco) { const v = pool.filter(p => p.vasco); if (v.length) pool = v; }
      if (gu.frances) { const f = pool.filter(p => p.frances); if (f.length) pool = f; }
      pool = pool.filter(p => p.p >= suelo * 0.55); // si no hay pack con esa bebida y presupuesto, se monta a medida
      if (pool.length) {
        pool.sort((a, c) => Math.abs(tope - a.p) - Math.abs(tope - c.p));
        const elegido = pool[0];
        lineas.push(linea(elegido, 1, elegido.tipo));
        if (elegido.tipo === "seleccion" && b && b !== "sin" && b !== "sin alcohol") { const bt = botella(b, nivel); if (bt && (max == null || total(lineas) + bt.p <= max * 1.1)) lineas.push(linea(bt, 1, "bebida")); }
      }
    }
    if (!lineas.length && g.tipo !== "cata" && g.tipo !== "raclette" && g.tipo !== "evento") {
      // selección a medida
      let nQ = n <= 2 ? 3 : n <= 5 ? 4 : n <= 8 ? 5 : n <= 12 ? 6 : 8;
      if (g.tipo === "regalo" || g.tipo === "empresa") nQ = nivel === 0 ? 2 : nivel === 2 ? 5 : 3;
      if (g.tipo === "casa" && !g.personas) nQ = nivel === 0 ? 2 : 3;
      if (g.tipo === "empresa") nQ = nivel === 0 ? 2 : 3;
      let presuQuesos = max ? max * (g.bebida && g.bebida !== "sin" ? 0.65 : 0.85) : null;
      if (pr.porPersona) presuQuesos = pr.porPersona * n * 0.8;
      let quesos = elegirQuesos(g, nQ, presuQuesos);
      const factor = n >= 8 ? Math.ceil((n * 95) / quesos.reduce((s, q) => s + q.g, 0)) : 1;
      lineas.push(...quesos.map(q => linea(q, Math.max(1, factor), "queso")));
      if (gu.sl && quesos.length) notas.push("Sin lactosa: el Dziugas está certificado; los demás son curados largos con lactosa residual mínima, lo confirman Las Chicas");
      if (gu.sl && !quesos.length) notas.push("Sin lactosa: no hay queso certificado disponible, consultar");
      // extras
      const ex = g.extras || {};
      const quierePan = ex.pan || (g.tipo === "tabla" && (max == null || max >= 40));
      if (quierePan) { const pan = buscar(D.EXTRAS, "pan"); if (pan) lineas.push(linea(pan, Math.max(1, Math.ceil(n / 8)), "pan")); }
      const beb = ex.bebida || g.bebida;
      if (beb && beb !== "sin" && beb !== "sin alcohol") {
        const bt = botella(beb, nivel);
        if (bt) lineas.push(linea(bt, beb === "cerveza" ? Math.max(1, Math.ceil(n / 5)) : Math.max(1, Math.ceil(n / 4)), "bebida"));
        if (beb === "sidra") notas.push("Pide sidra: no está en la tienda online, consultar");
      }
      if (beb === "sin alcohol") notas.push("Bebida sin alcohol: hay vino y cerveza 0,0 en tienda, confirmar referencia");
      if (ex.dulce || ((g.tipo === "regalo" || g.tipo === "empresa") && nivel >= 1)) { const d = buscar(D.EXTRAS, "dulce", { caro: true }); if (d) lineas.push(linea(d, 1, "dulce")); }
      if (ex.aperitivo) { const a = buscar(D.EXTRAS, "aperitivo"); if (a) lineas.push(linea(a, 1, "aperitivo")); }
      if (ex.mantequilla) { const m = buscar(D.EXTRAS, "mantequilla"); if (m) lineas.push(linea(m, 1, "mantequilla")); }
      // ajustar al presupuesto
      if (max) {
        const quitar = ["aperitivo", "dulce", "mantequilla", "pan"];
        while (total(lineas) > max * 1.05 && lineas.some(l => quitar.includes(l.cat) && !(ex[l.cat]))) { const i = lineas.findIndex(l => quitar.includes(l.cat) && !ex[l.cat]); lineas.splice(i, 1); }
        const bl = lineas.find(l => l.cat === "bebida");
        if (bl && total(lineas) > max * 1.05 && bl.cant > 1) bl.cant = Math.max(1, Math.floor((max - total(lineas.filter(l => l !== bl))) / bl.p));
        if (bl && total(lineas) > max * 1.05) { const barata = disp(D.BEBIDAS).filter(b => b.tipo === (D.BEBIDAS.find(x => x.id === bl.id) || {}).tipo && b.p < bl.p).sort((a, b) => a.p - b.p)[0]; if (barata) Object.assign(bl, linea(barata, bl.cant, "bebida")); }
        // cambiar el queso más caro por otro parecido más barato antes de quitar ninguno
        for (let i = 0; i < 4 && total(lineas) > max * 1.05; i++) {
          const qs = lineas.filter(l => l.cat === "queso").sort((a, b) => b.p - a.p); if (!qs.length) break;
          const caro = qs[0], q0 = D.QUESOS.find(q => q.id === caro.id);
          const alt = candidatos(g).filter(q => !lineas.some(l => l.id === q.id) && q.p < q0.p - 1 && (q.tipo === q0.tipo || q.leche === q0.leche)).sort((a, b) => b.p - a.p)[0];
          if (!alt) break;
          Object.assign(caro, linea(alt, caro.cant, "queso"));
        }
        while (total(lineas) > max * 1.05 && lineas.filter(l => l.cat === "queso").length > 2) { const qs = lineas.filter(l => l.cat === "queso"); const caro = qs.sort((a, b) => b.p - a.p)[0]; lineas.splice(lineas.indexOf(caro), 1); }
        if (min && total(lineas) < min * 0.8) { const extra = candidatos(g).filter(q => !lineas.some(l => l.id === q.id)).sort((a, b) => (b.estrella ? 1 : 0) - (a.estrella ? 1 : 0) || b.p - a.p)[0]; if (extra && total(lineas) + extra.p <= max) lineas.splice(lineas.filter(l => l.cat === "queso").length, 0, linea(extra, 1, "queso")); }
        if (min && total(lineas) < min * 0.8) { const d = buscar(D.EXTRAS, "dulce", { caro: true }); if (d && !lineas.some(l => l.id === d.id) && total(lineas) + d.p <= max) lineas.push(linea(d, 1, "dulce")); }
      }
    }
    // tablas preparadas / mastercheese
    if (g.tipo === "tabla" && g.formato === "preparada") {
      lineas = lineas.filter(l => l.cat !== "queso" && l.cat !== "pan" && l.cat !== "bebida");
      const T = disp(D.TABLAS);
      if (n <= 3) lineas.unshift(linea(T[0], 1, "tabla"));
      else if (n <= 7) lineas.unshift(linea(T[1], 1, "tabla"));
      else if (n <= 10) lineas.unshift(linea(T[2], 1, "tabla"));
      else { lineas.unshift(linea(T[2], Math.ceil(n / 10), "tabla")); if (n >= 20) notas.push("Para 20 o más igual encaja mejor una mesa de quesos montada por ellas; lo valoran"); }
      const beb = g.bebida;
      if (beb && beb !== "sin" && beb !== "sin alcohol") {
        const resto = max ? max - total(lineas) : 30;
        const bt = botella(beb, resto >= 40 ? 2 : resto >= 16 ? 1 : 0);
        if (bt && resto >= bt.p * 0.8) lineas.push(linea(bt, Math.max(1, Math.min(beb === "cerveza" ? Math.ceil(n / 5) : Math.ceil(n / 4), Math.floor(resto / bt.p))), "bebida"));
        else if (bt) notas.push(`La bebida no entra en el presupuesto (${bt.n}, ${eur(bt.p)}); se ofrece aparte`);
      }
      if (max && total(lineas) > max * 1.05) notas.push(`La tabla para ${n} sale por ${eur(lineas[0].p * lineas[0].cant)}, algo por encima de lo previsto`);
      notas.push("Tabla preparada: solo recogida en tienda o envío en Bilbao; se prepara el mismo día y conviene pedirla antes de las 20:00 del día anterior");
      if (g.entrega && g.entrega.modo === "envio" && g.entrega.zona && g.entrega.zona !== "bilbao") notas.push("Las tablas preparadas no se envían fuera de Bilbao: proponer quesos enteros o recogida");
    }
    if (g.tipo === "cata" && g.cataLugar === "casa") {
      lineas = [];
      const M = disp(D.MASTERCHEESE).slice().sort((a, b) => a.personas - b.personas);
      let restantes = n || 2;
      const k = M.find(m => m.personas >= restantes) || M[M.length - 1];
      const conVino = g.bebida === "vino" || g.bebida === "txakoli" || g.bebida === "recomendacion";
      const cant = k.personas >= restantes ? 1 : Math.ceil(restantes / k.personas);
      lineas.push({ ...linea(k, cant, "mastercheese"), n: k.n + (conVino ? " (con vino)" : " (sin bebida)"), p: conVino ? k.pVino : k.p });
      notas.push("Mastercheese en casa: 8 quesos cortados en orden de cata, recomendado consumir en el día");
    }
    if (g.tipo === "cata" && g.cataLugar === "tienda" && g.cata) {
      lineas = [];
      if (g.cata === "privada") notas.push("Cata privada: mínimo 15 personas; con menos, se fija fecha y se abren plazas");
      else { const c = D.CATAS.find(x => x.id === g.cata); if (c) lineas.push({ id: c.id, n: c.n, p: c.p, cant: n || 1, corto: `${cap(c.dia)} ${c.fecha.slice(8)} de ${MESES[+c.fecha.slice(5, 7) - 1]} a las ${c.hora}`, img: c.img, url: c.url, cat: "cata" }); }
      notas.push("Las entradas de cata se reservan en la web; el asistente anota la reserva y Las Chicas mandan el enlace");
    }
    if (g.tipo === "suscripcion") { const m = g.meses || 1; lineas = [{ id: D.SUSCRIPCION.id, n: `${D.SUSCRIPCION.n} (${m} ${m === 1 ? "mes" : "meses"})`, p: D.SUSCRIPCION.precios[m], cant: 1, corto: "4-5 quesos (800 g - 1 kg) + crackers cada mes", img: D.SUSCRIPCION.img, url: D.SUSCRIPCION.url, cat: "suscripcion" }]; }
    if (g.tipo === "tarjeta") { const v = (g.presupuesto && (g.presupuesto.max || g.presupuesto.min)) || 50; lineas = [{ id: "tarjeta", n: "Tarjeta regalo", p: Math.round(v), cant: 1, corto: "virtual (llega por correo) o física en tienda", img: "", url: "https://lamanducateca.com/categoria/tarjeta-regalo/", cat: "tarjeta" }]; }
    if (g.tipo === "suscripcion" && g.entrega && g.entrega.modo === "envio") notas.push("Los gastos de envío se aplican a cada caja mensual");
    if (g.tipo === "empresa") {
      const u = g.unidades || 10;
      const unidad = total(lineas);
      lineas = [{ id: "lote-empresa", n: `Lote de empresa (${lineas.map(l => (l.cant > 1 ? l.cant + " × " : "") + l.n).join(" + ")})`, p: unidad, cant: u, corto: `${eur(unidad)} por unidad`, img: lineas[0] ? lineas[0].img : "", url: "", cat: "pack", detalle: lineas }];
      if (g.entrega && g.entrega.zona === "varios") notas.push("Envíos individuales: gastos por cada destino, los calculan Las Chicas");
      if (u >= 10) notas.push("Pedido de empresa: pueden ajustar presentación, tarjeta y factura");
    }
    const envio = g.entrega && g.entrega.modo === "envio" ? (ENVIO[g.entrega.zona] || null) : 0;
    return { lineas, total: total(lineas), envio, notas, sinPrecio: g.tipo === "raclette" || g.tipo === "evento" };
  }

  // ---------- pasos por tipo ----------
  const PASOS = {
    regalo: ["ocasion", "bebida", "presupuesto", "gustos", "fecha", "entrega", "dedicatoria", "nombre"],
    tabla: ["personas", "formato", "fecha", "presupuesto", "gustos", "bebida", "entrega", "nombre"],
    casa: ["personas", "gustos", "presupuesto", "extras", "fecha", "entrega", "nombre"],
    cata: ["cataLugar", "personas", "cata", "nombre"],
    raclette: ["personas", "fecha", "racletteExtras", "nombre"],
    evento: ["evento", "fecha", "personas", "lugar", "gustos", "nombre"],
    suscripcion: ["meses", "entrega", "nombre"],
    tarjeta: ["presupuesto", "nombre"],
    empresa: ["unidades", "presupuesto", "bebida", "gustos", "fecha", "entrega", "nombre"],
  };
  function siguiente(g) {
    if (!g.tipo) return "tipo";
    for (const p of PASOS[g.tipo]) {
      if (p === "cata" && g.cataLugar === "casa") { if (!g.bebidaCasa) return "bebidaCasa"; if (!g.fecha) return "fecha"; if (!g.entrega) return "entrega"; continue; }
      if (p === "lugar" && g.entrega) continue;
      if (p === "gustos") { if (!g.gustos || g.gustos.int == null) return p; continue; }
      if (g[p] == null || g[p] === "" || (p === "personas" && g.personas == null)) return p;
    }
    return "cierre";
  }
  function pregunta(g, paso) {
    const n = g.personas;
    const q = {
      tipo: { texto: "¿Qué tienes en mente?", opciones: OPCIONES_TIPO },
      ocasion: { texto: "¿Para quién es o qué celebráis? Así afino la selección.", opciones: ["Cumpleaños", "Un agradecimiento", "Amigo invisible", "Para una embarazada", "Un detalle sin motivo"] },
      bebida: { texto: g.tipo === "regalo" ? "¿Le va más el vino, el txakoli, la cerveza artesana o el vermut? ¿O solo queso?" : "¿Quieres que añada bebida? Tenemos txakoli, vinos de autor, cerveza artesana y vermut.", opciones: OPCIONES_BEBIDA },
      presupuesto: { texto: g.tipo === "regalo" ? "¿Qué presupuesto tienes en mente? Con eso te propongo algo que encaje." : g.tipo === "tarjeta" ? "¿De qué importe quieres la tarjeta regalo?" : "¿Qué presupuesto manejas, más o menos?", opciones: OPCIONES_PRESU[g.tipo] || OPCIONES_PRESU.casa },
      gustos: { texto: g.tipo === "evento" ? "¿Qué estilo de quesos preferís para la mesa: suaves, intensos o de todo un poco? ¿Alguna alergia o intolerancia?" : g.tipo === "regalo" ? "¿Sabes si prefiere quesos suaves, intensos o de todo un poco? ¿Algo que evitar, como azules o leche cruda?" : "¿Cómo os gustan los quesos: suaves, intensos o de todo un poco? Dime también si hay que evitar algo, como azules o leche cruda.", opciones: OPCIONES_GUSTOS },
      personas: { texto: g.tipo === "cata" ? "¿Cuántas personas seríais?" : g.tipo === "evento" ? "¿Cuántos invitados calculáis?" : g.tipo === "raclette" ? "¿Para cuántos sois? Hay máquina para 2 o para 4." : g.tipo === "casa" ? "¿Para cuántas personas, más o menos?" : "¿Para cuántas personas es?", opciones: g.tipo === "raclette" ? ["Para 2", "Para 4", "Somos más"] : ["Para 2", "4-6 personas", "8-10 personas", "Más de 10"] },
      formato: { texto: "¿La quieres ya cortada y montada, lista para servir, o prefieres los quesos enteros y la montas tú? La tabla lista solo la hacemos para recoger en tienda o enviar dentro de Bilbao.", opciones: OPCIONES_FORMATO },
      fecha: { texto: g.tipo === "raclette" ? "¿Qué fin de semana la quieres? Se presta de viernes a miércoles." : g.tipo === "evento" ? "¿Qué fecha tiene el evento?" : g.tipo === "regalo" ? "¿Para qué día lo necesitas?" : "¿Para qué día lo quieres?", opciones: g.tipo === "raclette" ? ["Este finde", "El siguiente"] : ["Mañana", "Este sábado", "La semana que viene", "Sin fecha fija"] },
      entrega: { texto: "¿Lo recoges en la tienda (General Concha 7) o te lo enviamos a casa? El envío refrigerado son 6,90 € en Bilbao, 8,90 € en Bizkaia y 9,90 € en el resto de la península; la recogida es gratis.", opciones: OPCIONES_ENTREGA },
      lugarEnvio: { texto: "¿A qué localidad lo enviamos?" },
      dedicatoria: { texto: "¿Quieres que metamos una nota con tu mensaje en la caja? Escríbemela, o dime «sin nota».", opciones: ["Sin nota"] },
      nombre: { texto: "Ya casi está. ¿Cuál es tu nombre?" },
      extras: { texto: "¿Añado algo para acompañar? Pan de masa madre de Gure Ogia, una botella, algo dulce…", opciones: OPCIONES_EXTRAS },
      cataLugar: { texto: "¿Prefieres una cata en la tienda, con Las Chicas, o el kit Mastercheese para hacerla en casa?", opciones: ["En la tienda", "En casa"] },
      cata: { texto: catasTexto(), opciones: catasOpciones() },
      bebidaCasa: { texto: "¿El kit con vino (blanco o tinto) o sin bebida?", opciones: ["Con vino blanco", "Con vino tinto", "Sin bebida"] },
      racletteExtras: { texto: "Además de los quesos para fundir, ¿te preparamos el kit completo con embutidos, patatas, encurtidos y pan?", opciones: ["Sí, el kit completo", "Solo los quesos"] },
      evento: { texto: "¿Qué tipo de evento es?", opciones: ["Boda", "Evento de empresa", "Cumpleaños", "Otro"] },
      lugar: { texto: "¿Dónde se celebra? Con la localidad me vale.", opciones: [] },
      meses: { texto: "¿De cuántos meses la quieres? 1 mes son 55 €, 3 meses 158 € y 6 meses 297 €.", opciones: ["1 mes", "3 meses", "6 meses"] },
      unidades: { texto: "¿Cuántas unidades necesitáis?", opciones: ["Menos de 10", "10-25", "25-50", "Más de 50"] },
    }[paso];
    if (paso === "presupuesto" && g.tipo === "empresa") { q.texto = "¿Qué presupuesto tenéis por unidad, más o menos?"; q.opciones = OPCIONES_PRESU.regalo; }
    if (paso === "bebida" && g.tipo === "empresa") q.texto = "¿Con vino, txakoli, cerveza artesana o vermut? ¿O solo queso y despensa?";
    if (paso === "gustos" && g.tipo === "empresa") q.texto = "¿Quesos suaves, intensos o de todo un poco? Si hay alguna intolerancia en el grupo, dímelo.";
    if (paso === "fecha" && g.tipo === "empresa") q.texto = "¿Para qué fecha las necesitáis? En Navidad conviene reservar pronto.";
    if (paso === "entrega" && g.tipo === "empresa") { q.texto = "¿Las recogéis en tienda, os las enviamos todas a una dirección o cada una a su destinatario?"; q.opciones = ["Recogemos en tienda", "Todas a una dirección", "Envíos individuales"]; }
    if (paso === "entrega" && g.tipo === "suscripcion") q.texto = "¿Cada caja la recoges en tienda o te la enviamos? El envío refrigerado son 6,90 € en Bilbao, 8,90 € en Bizkaia y 9,90 € en la península.";
    return q;
  }
  function catasTexto() {
    const h = iso(hoy());
    const prox = D.CATAS.filter(c => c.fecha >= h);
    if (!prox.length) return "Las fechas de las catas salen cada fin de mes por la newsletter. ¿Te apunto para que te avisen, o prefieres una cata privada para tu grupo?";
    const l = prox.map(c => `• ${cap(c.dia)} ${+c.fecha.slice(8)} de ${MESES[+c.fecha.slice(5, 7) - 1]}, ${c.hora}: ${nombreCata(c)}${c.agotado ? " (agotada)" : ""}`).join("\n");
    return `Estas son las próximas catas en la tienda, 32 € por persona y unas dos horas:\n\n${l}\n\n¿Cuál te apetece? También podemos montar una cata privada para tu grupo.`;
  }
  function catasOpciones() { const h = iso(hoy()); return D.CATAS.filter(c => c.fecha >= h && !c.agotado).slice(0, 4).map(c => cataCorta(c)).concat(["Cata privada para mi grupo"]); }
  const DIA3 = { lunes: "lun", martes: "mar", "miércoles": "mié", jueves: "jue", viernes: "vie", "sábado": "sáb", domingo: "dom" };
  const nombreCata = c => /ciegas/i.test(c.n) ? "Cata a ciegas de quesos y vinos" + (/BIS/.test(c.n) ? " (segunda edición)" : "") : /world/i.test(c.n) ? "World Cheese Awards, 8 quesos premiados" : /rosal/i.test(c.n) ? "Confesionario de Rosalía & Sauvignon Blanc" : /terror/i.test(c.n) ? "Quesos Terroríficos (Halloween)" : /suena/i.test(c.n) ? "¿A qué suena este queso? Temazos de los 90" : c.n;
  const cataCorta = c => { const nm = /ciegas/i.test(c.n) ? "Cata a ciegas" : /world/i.test(c.n) ? "World Cheese Awards" : /rosal/i.test(c.n) ? "Rosalía & Sauvignon Blanc" : /terror/i.test(c.n) ? "Quesos Terroríficos" : /suena/i.test(c.n) ? "Temazos de los 90" : c.n.replace(/^Cata /, "").slice(0, 24); return `${nm} · ${DIA3[c.dia] || c.dia} ${+c.fecha.slice(8)} ${MESES[+c.fecha.slice(5, 7) - 1].slice(0, 3)}`; };
  function parseCata(t) {
    const n = norm(t);
    if (/privad|grupo|cuadrilla|despedida|cumple|para nosotros|solo nosotros|empresa/.test(n)) return "privada";
    const h = iso(hoy());
    const prox = D.CATAS.filter(c => c.fecha >= h);
    for (const c of prox) if (norm(cataCorta(c)) === n.trim()) return c.id;
    const claves = [["ciegas", /ciegas|a ciegas/], ["world", /world|awards|mejores del mundo/], ["rosalia", /rosal|sauvignon|confesion/], ["terror", /terror|halloween|miedo/], ["suena", /suena|90|noventa|temazo|musica/]];
    for (const [k, re] of claves) if (re.test(n)) { const c = prox.find(x => !x.agotado && (norm(x.n).includes(k) || re.test(norm(x.n)))) || prox.find(x => norm(x.n).includes(k) || re.test(norm(x.n))); if (c) return c.id; }
    const f = parseFecha(t); if (f && f.iso) { const c = prox.find(x => x.fecha === f.iso); if (c) return c.id; }
    if (/cualquiera|la que sea|la proxima|la primera|me da igual/.test(n)) { const c = prox.find(x => !x.agotado); if (c) return c.id; }
    return null;
  }
  const REINTENTO = {
    tipo: { texto: "Dime qué buscas: un regalo, una tabla para varios, quesos para casa, una cata, la raclette o algo para un evento.", opciones: OPCIONES_TIPO },
    personas: { texto: "¿Para cuántas personas, aproximadamente? Vale con un número.", opciones: ["Para 2", "4-6 personas", "8-10 personas"] },
    presupuesto: { texto: "¿Alguna cifra orientativa? Si prefieres, elige una franja.", opciones: OPCIONES_PRESU.regalo },
    gustos: { texto: "¿Suaves, intensos o de todo un poco? Y si hay algo que evitar (azules, leche cruda, lactosa), dímelo.", opciones: OPCIONES_GUSTOS },
    bebida: { texto: "¿Vino, txakoli, cerveza, vermut o sin bebida?", opciones: OPCIONES_BEBIDA },
    fecha: { texto: "¿Qué día te vendría bien? Vale un «este sábado» o una fecha.", opciones: ["Mañana", "Este sábado", "Sin fecha fija"] },
    entrega: { texto: "¿Recogida en tienda o envío a domicilio?", opciones: OPCIONES_ENTREGA },
    nombre: { texto: "¿Me dices tu nombre, por favor?" },
    formato: { texto: "¿Tabla ya montada o quesos enteros?", opciones: OPCIONES_FORMATO },
    cataLugar: { texto: "¿En la tienda o en casa?", opciones: ["En la tienda", "En casa"] },
    cata: { texto: "¿Con cuál te quedas?", opciones: catasOpciones() },
    evento: { texto: "¿Boda, empresa, cumpleaños u otra cosa?", opciones: ["Boda", "Evento de empresa", "Cumpleaños", "Otro"] },
  };

  // ---------- preguntas frecuentes (datos reales de lamanducateca.com) ----------
  const FAQ = [
    ["horario", /horario|a que hora|cuando (abr|cerr)|abris|cerrais|abierto|estais abiert|domingo|festivo/],
    ["direccion", /donde (estais|esta la tienda|os encuentro)|direccion|como (llego|se llega)|\bcalle\b|ubicaci|\bmetro\b|aparc|parking|zona de/],
    ["envio", /envi[oa]|gastos de envio|a domicilio|mandais|enviais|transporte|refrigerad|cuanto tarda|llega|plazo de entrega|fuera de bilbao|canarias|baleares|extranjero/],
    ["recogida", /recog|recoj|pasar a por|antelacion|cuando lo tengo|cuando puedo/],
    ["pago", /pagar|pago|bizum|tarjeta de credito|efectivo|senal|transferencia|como se paga/],
    ["conservacion", /conserv|cuanto (dura|aguanta)|nevera|caduc|frio|se estropea|fuera de la nevera/],
    ["cantidad", /cuanto queso|gramos|cantidad|por persona|cuantos quesos/],
    ["cata", /catas?\b|taller|curso|masterche|fechas de|proxima cata/],
    ["privada", /cata privada|para mi grupo|cuadrilla|despedida|minimo de personas/],
    ["raclette", /raclet/],
    ["boda", /boda|mesa de quesos|cheese corner|montaje|evento/],
    ["empresa", /empresa|team ?building|regalos? de empresa|clientes|empleados|oficina|factura/],
    ["suscripcion", /suscripci|cada mes|mensual/],
    ["club", /\bclub\b|fidelizaci|puntos|descuento|newsletter|oferta/],
    ["embarazo", /embaraz|pasteuriz|leche cruda|listeri/],
    ["lactosa", /lactosa|intoleran/],
    ["vegano", /vegan/],
    ["gluten", /gluten|celiac/],
    ["tarjeta", /tarjeta regalo|vale regalo|bono regalo|cheque/],
    ["devolucion", /devol|reembols|cancel|cambiar de fecha|no puedo ir/],
    ["quienes", /quienes sois|quien (esta|hay) detras|desde cuando|cuantos anos|historia|maria|lexuri|las chicas/],
    ["pan", /\bpan\b|hogaza|gure ogia|masa madre|crackers/],
    ["vinos", /que vinos|vinos teneis|cervezas teneis|que cervezas|laugar|basqueland|bodega/],
    ["quesos", /que quesos (teneis|hay)|novedades|que hay nuevo|catalogo|carta|lista de quesos|que teneis/],
    ["caja", /envuelt|envolver|papel de regalo|como (viene|va) (presentado|la caja)|presentacion|caja bonita|guia de corte/],
    ["mensaje", /nota|dedicatoria|mensaje|tarjetita/],
    ["navidad", /navidad|cestas? de navidad|lote/],
  ];
  const KB = {
    horario: () => `La tienda abre ${HORARIO}. Los domingos está cerrada. Por aquí puedes dejar el pedido a cualquier hora y Las Chicas te contestan en horario de tienda.`,
    direccion: () => `Estamos en ${DIRECCION}, entre Indautxu y Zabalburu. Teléfono y WhatsApp 640 084 075.`,
    envio: () => "Enviamos en frío a toda la península: 6,90 € en Bilbao (llega en 24 h con agencia local), 8,90 € en el resto de Bizkaia y 9,90 € en el resto de provincias, en 24-48 h con Seur Frío. Los envíos fuera de Bizkaia salen de lunes a miércoles para que el queso no pase el fin de semana de viaje; si pides después del jueves a las 10:00, llega la semana siguiente. La recogida en tienda es gratis. Islas y extranjero, mejor consultarlo con Las Chicas.",
    recogida: () => "La recogida en tienda es gratis. Si haces el pedido antes de las 20:00, lo tienes preparado al día siguiente; también puedes decirme día y hora y te lo dejan listo. Las tablas preparadas se montan el mismo día de la recogida.",
    pago: () => "La forma de pago te la confirman Las Chicas al validar el pedido por aquí. Yo lo dejo preparado y ellas te dicen cómo cerrarlo.",
    conservacion: () => "Los quesos van siempre en frío y se sacan unos 30 minutos antes de comerlos. Una vez recibidos, lo ideal es consumirlos en los siguientes 10 días. Las tablas preparadas y el Mastercheese, mejor en el día.",
    cantidad: () => "Como referencia, entre 80 y 120 g de queso por persona si es para picar o de postre. Las cuñas son de unos 200 g, así que para 4 personas van bien 4 quesos distintos; para 8-10, cinco o seis.",
    cata: () => catasTexto().replace("¿Cuál te apetece? También podemos montar una cata privada para tu grupo.", "Las fechas nuevas salen cada fin de mes por la newsletter y vuelan. Si quieres, te reservo plazas."),
    privada: () => "Para una cata privada, solo para vuestro grupo, el mínimo son 15 personas, unas dos horas y 32 € por persona. Si sois menos, se fija una fecha que os venga bien, se elige la temática y se abren las plazas que sobren a otra gente. Hay catas en inglés y alternativas sin alcohol.",
    raclette: () => "Te prestan la máquina de raclette, para 2 o para 4, durante el fin de semana, y te cortan los quesos perfectos para fundir. También preparan el kit completo con embutidos, patatas, encurtidos y pan. Hay que devolverla como tarde el miércoles siguiente por la mañana; lo de la fianza te lo cuentan al reservar.",
    boda: () => "Montan mesas de quesos para bodas y eventos: se desplazan, montan y decoran la mesa en el sitio, con quesos elegidos según vuestros gustos y acompañamientos (frutos secos, mermeladas, panes). Calculan entre 80 y 120 g por invitado. También hacen detalles para invitados, como mini packs de queso y cerveza. Conviene reservar con toda la antelación posible.",
    empresa: () => "Para empresas hacen regalos y cestas personalizadas (también con envíos individuales), catas y team building en la tienda para hasta 25 personas, con proyector, café de especialidad y catas en inglés si hace falta. Dime qué necesitas y lo dejo apuntado para que te preparen presupuesto.",
    suscripcion: () => "La suscripción mensual trae 4 o 5 quesos distintos (entre 800 g y 1 kg), uno de ellos un clásico de La Mandu, más un paquete de crackers. Cuesta 55 € al mes, 158 € por 3 meses y 297 € por 6. Se puede recoger en tienda o recibir en casa.",
    club: () => "El club «Yo soy de La Mandu» es gratis: 1 punto por cada euro y a los 150 puntos tienes un descuento, más un detalle por tu cumpleaños. Y si te apuntas a la newsletter, un 10 % de descuento en la primera compra online.",
    embarazo: () => "Para embarazadas hay quesos de leche pasteurizada: el pack regalo Embarazada (49 €, 3 quesos aptos, galletitas, vino blanco 0,0 y chocolate) y la selección de 5 quesos pasteurizados (39 €) con nota de seguridad de cada pieza. Si montamos algo a medida, elijo solo pasteurizados.",
    lactosa: () => "El Dziugas (9,30 €) está certificado sin lactosa y es una maravilla, 36 meses de curación. Los quesos muy curados suelen llevar muy poca, pero lo confirman Las Chicas si es una intolerancia seria.",
    vegano: () => "De momento no tienen queso vegano en catálogo. Lo anoto para que te lo confirmen, y siempre puedes tirar de pan de Gure Ogia, conservas y chocolate Kaitxo.",
    gluten: () => "Los quesos no llevan gluten. El pan y los crackers sí; en ese caso los sustituimos por otra cosa y lo dejo anotado.",
    tarjeta: () => "Hay tarjetas regalo virtuales de 30, 60 y 75 € (llegan por correo) y también físicas en la tienda, del importe que quieras. Sirven para producto y para catas.",
    devolucion: () => "Al ser alimentación, no hay devoluciones. En catas y vales, si avisas con al menos 48 horas, te hacen un vale para otra cata o para producto.",
    quienes: () => "La Manducateca la fundaron María, economista y glotona confesa, y su amiga Lexuri en 2015. Hoy están María, Virginia, Elian, Rebeca y Tamara, «Las Chicas de La Mandu», y llevan más de 10 años con catas y eventos en Bilbao.",
    pan: () => "El pan es de Gure Ogia (Mungia), masa madre de cultivo y harinas ecológicas, y llega recién hecho cada mañana: hogazas de 900 g a 4,75-5,75 €. Aguanta varios días en un paño. También hay crackers de la casa.",
    vinos: () => "Vinos de pequeñas producciones: txakolis Gorrondona (13 €), Doniene (16 €) y Nekazari (22 €), «Son tiempos difíciles para soñadores» (17 €), Señora de las Alturas (28 €) o el Canek de Rioja (42 €). En cerveza artesana, Laugar, Basqueland y Mala Gissona: botellines desde 3,20 € y packs de 5 por 19,50-22 €. Y vermut Garate de txakoli, 19 €.",
    quesos: () => { const q = disp(D.QUESOS); return `Ahora mismo en la web hay ${q.length} quesos sueltos, de ${eur(Math.min(...q.map(x => x.p)))} a ${eur(Math.max(...q.map(x => x.p)))} la cuña, como ${lista(q.filter(x => x.estrella || x.vasco).slice(0, 4).map(x => x.n))}. En la tienda física hay muchos más. Dime gustos y presupuesto y te preparo una selección.`; },
    caja: () => "Los packs van en caja de La Mandu con una guía de corte y presentación de los quesos. Si es regalo, se puede añadir una nota con tu mensaje.",
    mensaje: () => "Sí, incluyen una nota con tu mensaje en la caja. Escríbemelo y lo dejo apuntado en el pedido.",
    navidad: () => "Hacen cestas de Navidad a medida, para particulares y empresas, con quesos, vinos, cervezas, dulces y conservas, con envío o recogida. En Navidad conviene reservar pronto. Dime presupuesto y cuántas necesitas.",
  };
  const NOTA_FAQ = { vegano: "Pregunta por queso vegano", gluten: "Sin gluten: sustituir pan y crackers", pago: "Pregunta por forma de pago", empresa: "Interés de empresa" };
  function faq(g, t) {
    if (!esPregunta(t)) return null;
    const n = norm(t);
    // precio de un queso concreto
    const hallados = D.QUESOS.filter(q => q.clave && new RegExp(q.clave.split("|").map(k => norm(k)).join("|")).test(n));
    if (hallados.length === 1) { const q = hallados[0]; return q.agotado ? `El ${q.n} está agotado ahora mismo. Si quieres, elijo uno parecido.` : `Sí, tenemos ${q.n} a ${eur(q.p)} la cuña: ${q.corto}.`; }
    if (hallados.length > 1) return "Sí: " + lista(hallados.map(q => `${q.n} a ${eur(q.p)}`)) + ".";
    for (const [k, re] of FAQ) if (re.test(n)) { if (NOTA_FAQ[k] && !g.notas.includes(NOTA_FAQ[k])) g.notas.push(NOTA_FAQ[k]); return KB[k](g); }
    return null;
  }

  // ---------- estado y motor ----------
  function nuevoEstado() {
    return { tipo: null, ocasion: null, bebida: null, presupuesto: null, gustos: null, personas: null, formato: null, fecha: null, entrega: null, dedicatoria: null, nombre: null, extras: null, cataLugar: null, cata: null, bebidaCasa: null, racletteExtras: null, evento: null, lugar: null, meses: null, unidades: null, pendiente: "tipo", cerrado: false, confirmado: false, atencion: false, notas: [], excluir: [], intentos: 0, pideLugar: false, propuesta: null };
  }
  function capturar(g, paso, t) {
    const n = norm(t);
    switch (paso) {
      case "tipo": { const tp = detectarTipo(t); if (!tp) return false; g.tipo = tp; extras(g, "tipo", t); return true; }
      case "ocasion": {
        if (/embaraz|futura mam|va a ser mam/.test(n)) { g.gustos = Object.assign(g.gustos || {}, { past: true }); }
        if (/amigo invisible/.test(n)) g.presupuesto = g.presupuesto || { texto: "Menos de 30 €", min: 15, max: 30 };
        if (esPregunta(t) || t.trim().length > 120) return false;
        g.ocasion = ocasionDe(t) || cap(limpiar(t).replace(/^(es |pues |para )/i, "")); return true;
      }
      case "bebida": { const b = parseBebida(t); if (!b) return false; g.bebida = b; return true; }
      case "bebidaCasa": { if (/\bsin\b|\bno\b/.test(n)) g.bebidaCasa = "sin"; else if (/blanco/.test(n)) g.bebidaCasa = "blanco"; else if (/tinto|vino|si\b/.test(n)) g.bebidaCasa = "tinto"; else return false; g.bebida = g.bebidaCasa === "sin" ? "sin" : "vino"; return true; }
      case "presupuesto": { const p = parsePresupuesto(t); if (!p) return false; g.presupuesto = p; return true; }
      case "gustos": {
        const gu = parseGustos(t);
        if (gu) { g.gustos = Object.assign(g.gustos || {}, gu); if (g.gustos.int == null) g.gustos.int = 2; return true; }
        if (/^(no|ninguna|nada|sin preferencia|me da igual|no hay|no,? nada)/.test(n) || t.trim().length <= 3) { g.gustos = Object.assign(g.gustos || {}, { int: 2, variado: true }); return true; }
        if (!esPregunta(t) && t.trim().length > 12) { g.gustos = Object.assign(g.gustos || {}, { int: 2, nota: limpiar(t) }); return true; }
        return false;
      }
      case "personas": {
        const p = parsePersonas(t); if (p == null) return false;
        if (g.tipo === "raclette" && /mas|somos mas/.test(n) && p === 0) { g.personas = 6; g.notas.push("Raclette para más de 4: hay máquinas de 2 y 4, consultar"); return true; }
        g.personas = p || 0; if (p === 0) g.notas.push("No sabe cuántos serán"); return true;
      }
      case "formato": { const f = parseFormato(t); if (!f) return false; g.formato = f; return true; }
      case "fecha": { const f = parseFecha(t); if (!f) return false; g.fecha = f; return true; }
      case "entrega": {
        const e = parseEntrega(t); if (!e) return false;
        g.entrega = e; if (e.modo === "envio" && !e.zona) g.pideLugar = true; return true;
      }
      case "lugarEnvio": { const l = detectarLugar(t); if (l) { Object.assign(g.entrega, l); g.pideLugar = false; return true; } if (t.trim().length <= 40 && !esPregunta(t)) { Object.assign(g.entrega, { zona: "resto", lugar: cap(limpiar(t)) }); g.notas.push("Confirmar zona de envío: " + limpiar(t)); g.pideLugar = false; return true; } return false; }
      case "dedicatoria": { if (/^(sin nota|no|nada|sin|no hace falta|no gracias)/.test(n)) { g.dedicatoria = "Sin nota"; return true; } if (t.trim().length > 200) return false; g.dedicatoria = limpiar(t); return true; }
      case "nombre": { const nm = parseNombre(t); if (!nm) return false; g.nombre = nm; return true; }
      case "extras": { const e = parseExtras(t); if (!e) return false; g.extras = e; if (e.bebida) g.bebida = e.bebida; return true; }
      case "cataLugar": { if (/tienda|con las chicas|presencial|alli|ahi|en general concha/.test(n)) g.cataLugar = "tienda"; else if (/casa|kit|master/.test(n)) g.cataLugar = "casa"; else return false; return true; }
      case "cata": { const c = parseCata(t); if (!c) return false; g.cata = c; return true; }
      case "racletteExtras": { if (/^(si|sí|claro|vale|completo|todo|el kit)/.test(n) || /kit completo|con todo/.test(n)) g.racletteExtras = "Kit completo con embutidos, patatas, encurtidos y pan"; else if (/solo|no\b|nada/.test(n)) g.racletteExtras = "Solo los quesos para fundir"; else return false; return true; }
      case "evento": { if (/boda|casamos|casan/.test(n)) g.evento = "Boda"; else if (/empresa|oficina|equipo|clientes|team|afterwork/.test(n)) g.evento = "Evento de empresa"; else if (/cumple/.test(n)) g.evento = "Cumpleaños"; else if (t.trim().length <= 60 && /comuni|bautizo|aniversario|inaugura|fiesta|celebra|despedida|jubila|reunion|evento|cena|comida|coctel|catering|otro|familiar|graduaci|bienvenida/.test(n)) g.evento = cap(limpiar(t)); else return false; return true; }
      case "lugar": { if (esPregunta(t) || t.trim().length > 80) return false; const l = detectarLugar(t); if (!l && !/palacio|hotel|restaurante|casa|sala|txoko|sociedad|finca|caserio|bodega|oficina|calle|plaza|local|jardin|iglesia|ayuntamiento|museo|sede|pabellon|frontón|fronton|polideportivo|club|hipodromo|nave|terraza|azotea|barco|museo|parque/.test(n) && !(t.trim().split(/\s+/).length <= 6 && /^[A-ZÁÉÍÓÚÑ]/.test(t.trim()))) return false; g.lugar = cap(limpiar(t)); if (l && l.zona === "fuera") g.notas.push("Evento fuera de la península"); return true; }
      case "unidades": { const r = n.match(/(\d{1,4})\s*(?:-|a|o)\s*(\d{1,4})/); if (r) { g.unidades = +r[2]; return true; } if (/menos de (\d+)/.test(n)) { g.unidades = Math.max(1, +n.match(/menos de (\d+)/)[1] - 4); return true; } if (/mas de (\d+)/.test(n)) { g.unidades = +n.match(/mas de (\d+)/)[1] + 10; return true; } const p = parsePersonas(t); if (!p) return false; g.unidades = p; return true; }
      case "meses": { const m = n.match(/(\d)|\b(un|uno|tres|seis)\b/); if (!m) return false; g.meses = m[1] ? +m[1] : m[2] === "tres" ? 3 : m[2] === "seis" ? 6 : 1; if (![1, 3, 6].includes(g.meses)) g.meses = g.meses < 3 ? 1 : g.meses < 6 ? 3 : 6; return true; }
    }
    return false;
  }
  // Datos sueltos dichos en cualquier momento ("para 6 personas y unos 60 euros, sin azules").
  function extras(g, paso, t) {
    const n = norm(t);
    if (paso !== "personas" && g.personas == null && /(\d{1,3}|dos|tres|cuatro|cinco|seis|ocho|diez)\s*(personas|comensales|invitados|pax|amigos|somos)|somos\s+(\d|dos|tres|cuatro|cinco|seis)|para\s+(\d{1,2}|dos|tres|cuatro|cinco|seis|ocho|diez)\b|pareja/.test(n)) g.personas = parsePersonas(t);
    if (paso !== "presupuesto" && !g.presupuesto && /\d/.test(t) && /(€|euros|eur\b|presupuesto|gastar|pavos)/.test(n)) g.presupuesto = presupuestoSuelto(t);
    if (paso !== "gustos" && paso !== "ocasion") { const gu = parseGustos(t); if (gu) g.gustos = Object.assign(g.gustos || {}, gu); }
    if (paso !== "bebida" && paso !== "extras" && !g.bebida && /txakoli|vino|cervez|vermut|botella/.test(n) && !/sin (vino|cerveza|bebida)/.test(n)) { const b = parseBebida(t); if (b && b !== "sin") g.bebida = b; }
    if (paso !== "fecha" && !g.fecha && /\b(hoy|manana|sabado|domingo|viernes|jueves|lunes|martes|miercoles|finde|navidad|el \d{1,2}\b|\d{1,2} de (enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre))/.test(n)) g.fecha = parseFecha(t);
    if (paso !== "entrega" && paso !== "lugarEnvio" && !g.entrega && /envi[oa]|a domicilio|recoj|recog/.test(n)) { const e = parseEntrega(t); if (e) { g.entrega = e; if (e.modo === "envio" && !e.zona) g.pideLugar = true; } }
    if (paso !== "formato" && g.tipo === "tabla" && !g.formato) { const f = parseFormato(t); if (f) g.formato = f; }
    if (paso !== "ocasion" && g.tipo === "regalo" && !g.ocasion) { const o = ocasionDe(t); if (o) g.ocasion = o; }
    if (g.tipo === "evento" && !g.evento) { if (/boda|casamos|casan|se casa/.test(n)) g.evento = "Boda"; else if (/empresa|oficina|equipo|clientes|team|afterwork/.test(n)) g.evento = "Evento de empresa"; else if (/cumple/.test(n)) g.evento = "Cumpleaños"; else if (/comunion/.test(n)) g.evento = "Comunión"; else if (/bautizo/.test(n)) g.evento = "Bautizo"; else if (/despedida/.test(n)) g.evento = "Despedida"; }
    if (g.tipo === "empresa" && !g.unidades) { const m2 = n.match(/(\d{1,4})\s*(cestas|lotes|packs|cajas|regalos|detalles|unidades|personas|empleados|clientes|trabajadores)/); if (m2) g.unidades = +m2[1]; }
    if (/embaraz/.test(n)) g.gustos = Object.assign(g.gustos || {}, { past: true });
  }
  function acuse(g, paso) {
    switch (paso) {
      case "tipo": return { regalo: "Un regalo, perfecto. Aquí saben regalar bien.", tabla: "Una tabla, buena idea.", casa: "Perfecto.", cata: "Las catas de La Mandu son un planazo.", raclette: "Plan suizo en pleno Bilbao, me gusta.", evento: "Un cheese corner es el rincón que todos recuerdan.", suscripcion: "La suscripción es queso nuevo cada mes, elegido por ellas.", tarjeta: "Acierto seguro.", empresa: "Regalos de empresa con queso: aquí los hacen a medida y con envíos individuales si hace falta." }[g.tipo] || "Perfecto.";
      case "unidades": return g.unidades >= 25 ? "Buen pedido, lo apunto para que os preparen presupuesto ajustado." : "Anotado.";
      case "ocasion": return g.gustos && g.gustos.past ? "Para una embarazada elijo solo quesos pasteurizados, sin problema." : "Anotado.";
      case "bebida": return g.bebida === "sin" ? "Solo queso, entonces." : g.bebida === "sin alcohol" ? "Sin alcohol, anotado: hay vino y cerveza 0,0." : g.bebida === "txakoli" ? "Txakoli, de casa." : g.bebida === "recomendacion" ? "Te lo elijo yo." : "Anotado.";
      case "presupuesto": return g.presupuesto.max == null ? "Sin límite, entonces me luzco." : "Con eso se puede hacer algo muy bueno.";
      case "gustos": return g.gustos.past ? "Solo pasteurizados, anotado." : g.gustos.sl ? "Sin lactosa, lo tengo en cuenta." : g.gustos.azules === false ? "Sin azules, anotado." : g.gustos.int === 1 ? "Suaves y cremosos, buena elección." : g.gustos.int === 3 ? "Intensos, para valientes." : "De todo un poco, así la tabla tiene recorrido.";
      case "personas": return g.personas === 0 ? "No pasa nada, lo dejo abierto." : g.personas >= 20 && g.tipo === "tabla" ? "Para tanta gente igual encaja mejor una mesa de quesos montada por ellas; lo apunto." : "Anotado.";
      case "formato": return g.formato === "preparada" ? "Lista para servir, con frutos secos, crackers y fruta." : "Quesos enteros, así te duran más días.";
      case "fecha": return g.fecha.iso && g.fecha.iso === iso(hoy()) ? "Para hoy lo revisan en cuanto lo vean; si va justo, te lo dicen." : "Anotado.";
      case "entrega": return g.entrega.modo === "recogida" ? "Recogida en General Concha 7, gratis." : g.entrega.zona ? `Envío refrigerado a ${g.entrega.lugar} (${ENVIO[g.entrega.zona] ? eur(ENVIO[g.entrega.zona]) : "a consultar"}).` : "Envío a domicilio.";
      case "lugarEnvio": return g.entrega.zona === "fuera" ? "Fuera de la península lo tienen que consultar; lo anoto igualmente." : `Envío refrigerado a ${g.entrega.lugar}, ${eur(ENVIO[g.entrega.zona])}.`;
      case "dedicatoria": return g.dedicatoria === "Sin nota" ? "Sin nota." : "Nota anotada, la meten en la caja.";
      case "extras": return g.extras.nada ? "Solo los quesos." : "Anotado.";
      case "cataLugar": return g.cataLugar === "casa" ? "El Mastercheese en casa: 8 quesos cortados y en orden de cata." : "";
      case "cata": return g.cata === "privada" ? "Cata privada: con 15 o más es solo para vosotros; con menos, se busca fecha y se abren plazas." : "Buena elección.";
      case "nombre": return `Encantado, ${g.nombre.split(" ")[0]}.`;
      default: return "";
    }
  }
  function textoLineas(p) {
    const ICO = { queso: "🧀", pan: "🍞", bebida: "🍷", txakoli: "🍷", vino: "🍷", cerveza: "🍺", vermut: "🍸", espumoso: "🥂", dulce: "🍫", aperitivo: "🫒", mantequilla: "🧈", pack: "🎁", seleccion: "🧀", tabla: "🧀", mastercheese: "🧀", cata: "🎟️", suscripcion: "📦", tarjeta: "🎁" };
    const icono = l => { if (l.cat !== "bebida") return ICO[l.cat] || "•"; const b = D.BEBIDAS.find(x => x.id === l.id); return b ? (ICO[b.tipo] || "🍷") : "🍷"; };
    const conDesc = ["queso", "pack", "seleccion", "tabla", "mastercheese", "cata", "suscripcion", "tarjeta"];
    return p.lineas.map(l => `${icono(l)} ${l.cant > 1 ? l.cant + " × " : ""}${l.n} · ${eur(l.p * l.cant)}${conDesc.includes(l.cat) && l.corto ? " · " + l.corto : ""}`).join("\n");
  }
  function cierre(g) {
    const p = armar(g); g.propuesta = p;
    const nombre = g.nombre ? g.nombre.split(" ")[0] : "";
    const saludo = nombre ? `Perfecto, ${nombre}.` : "Perfecto.";
    if (g.tipo === "raclette") return `${saludo} Te dejo reservada la raclette para ${g.personas || 2} (máquina ${g.personas > 2 ? "de 4" : "de 2"}) para ${g.fecha ? g.fecha.texto.toLowerCase() : "este fin de semana"}, con ${g.racletteExtras ? g.racletteExtras.toLowerCase() : "los quesos para fundir"}.\n\nLas Chicas de La Mandu te confirman por aquí disponibilidad, precio de los quesos y lo de la fianza, en horario de tienda (${HORARIO_CORTO}). Recuerda devolverla como tarde el miércoles por la mañana. ¿Algo más que añadir?`;
    if (g.tipo === "evento") { const n = g.personas || 0; const kg = n >= 10 ? ` Con ${n} invitados calculan entre ${(n * 0.08).toFixed(1).replace(".", ",")} y ${(n * 0.12).toFixed(1).replace(".", ",")} kg de queso.` : ""; return `${saludo} Ya tengo lo que necesitan para preparar la propuesta: ${g.evento ? g.evento.toLowerCase() : "evento"}${g.fecha ? " el " + g.fecha.texto.toLowerCase() : ""}${g.lugar ? " en " + g.lugar : ""}${n ? ", " + n + " invitados" : ""}, quesos ${etiquetaGustos(g.gustos).toLowerCase()}.${kg}\n\nLas Chicas de La Mandu se desplazan, montan y decoran la mesa en el sitio. Te escriben por aquí en horario de tienda (${HORARIO_CORTO}) con presupuesto y disponibilidad para la fecha. ¿Quieres añadir algo más?`; }
    if (g.tipo === "cata" && g.cataLugar === "tienda") {
      if (g.cata === "privada") return `${saludo} Anoto la petición de cata privada para ${g.personas || "vuestro grupo"}. Con 15 o más es solo para vosotros; con menos, se busca una fecha que os cuadre y se abren las plazas que sobren.\n\nLas Chicas te escriben por aquí en horario de tienda (${HORARIO_CORTO}) para cerrar fecha y temática. ¿Algo más?`;
      const c = D.CATAS.find(x => x.id === g.cata);
      return `${saludo} Te apunto ${g.personas || 1} ${g.personas > 1 ? "plazas" : "plaza"} para «${c ? nombreCata(c) : "la cata"}»${c ? `, el ${c.dia} ${+c.fecha.slice(8)} de ${MESES[+c.fecha.slice(5, 7) - 1]} a las ${c.hora}` : ""}, ${eur(32 * (g.personas || 1))} en total.\n\nLas entradas se formalizan en la web; Las Chicas te mandan el enlace por aquí en horario de tienda (${HORARIO_CORTO}) y quedan reservadas. Si no puedes ir, avisa con 48 h y te dan un vale. ¿Algo más?`;
    }
    const lineas = textoLineas(p);
    const envioTxt = g.entrega && g.entrega.modo === "envio" ? (p.envio ? ` + ${eur(p.envio)} de envío a ${g.entrega.lugar || "domicilio"}${g.tipo === "suscripcion" ? " por caja" : ""}` : g.entrega.zona === "varios" ? " + envíos individuales (según destinos)" : " + envío (a consultar)") : " (recogida en tienda, sin gastos)";
    const cuando = g.fecha ? `\n📅 ${g.fecha.texto}` : "";
    const nota = g.dedicatoria && g.dedicatoria !== "Sin nota" ? `\n✉️ Nota: «${g.dedicatoria}»` : "";
    const avisos = p.notas.length ? `\n\nℹ️ ${p.notas[0]}.` : "";
    return `${saludo} Este es el pedido que dejo preparado:\n\n${lineas}\n\nTotal aprox. ${eur(p.total)}${envioTxt}.${cuando}${nota}${avisos}\n\nLas Chicas de La Mandu lo revisan, confirman disponibilidad y te dicen cómo pagar por aquí, en horario de tienda (${HORARIO_CORTO}). ¿Lo dejamos así o cambio algo?`;
  }
  const OPCIONES_CIERRE = g => {
    if (["cata", "raclette", "evento", "suscripcion", "tarjeta"].includes(g.tipo)) return ["Así está bien"];
    if (g.propuesta && g.propuesta.lineas.some(l => l.cat === "queso")) return ["Así está bien", "Cambiar un queso", "Añadir pan", "Añadir bebida", "Más barato"];
    if (g.propuesta && g.propuesta.lineas.length) return ["Así está bien", "Prefiero a medida", "Añadir bebida", "Más barato"];
    return ["Así está bien"];
  };
  function avanzar(g, pre, pasoHecho) {
    if (g.pideLugar) { g.pendiente = "lugarEnvio"; const q = pregunta(g, "lugarEnvio"); return { texto: [pre, pasoHecho ? acuse(g, pasoHecho) : "", q.texto].filter(Boolean).join(" ") }; }
    const paso = siguiente(g);
    if (paso === "cierre") { g.cerrado = true; g.pendiente = null; const txt = cierre(g); return { texto: [pre, txt].filter(Boolean).join("\n\n"), ficha: ficha(g), opciones: OPCIONES_CIERRE(g) }; }
    g.pendiente = paso; g.intentos = 0;
    const q = pregunta(g, paso);
    return { texto: [pre, pasoHecho ? acuse(g, pasoHecho) : "", q.texto].filter(Boolean).join(" ").replace(/\s+\n/g, "\n"), opciones: q.opciones };
  }

  // ---------- cambios sobre el pedido ya preparado ----------
  function editar(g, t) {
    const n = norm(t);
    const p = g.propuesta;
    const reh = (pre) => { const txt = cierre(g); return { texto: [pre, txt].filter(Boolean).join("\n\n"), ficha: ficha(g), opciones: OPCIONES_CIERRE(g) }; };
    if (/asi esta bien|perfecto|confirm|adelante|me vale|genial|ok\b|vale\b|de acuerdo|dejalo asi|esta bien|lo quiero|me lo quedo/.test(n) && !/cambi|quita|anad|pon\b/.test(n)) {
      g.confirmado = true;
      return { texto: `¡Genial${g.nombre ? ", " + g.nombre.split(" ")[0] : ""}! Queda anotado como pedido listo para confirmar. Las Chicas de La Mandu te escriben por aquí en horario de tienda (${HORARIO_CORTO}) para cerrarlo. ¡Gracias! 🧀`, ficha: ficha(g), fichaActualizada: true };
    }
    if (/prefiero a medida|a medida|montarlo yo|elegir los quesos|quesos sueltos/.test(n)) { g.gustos = Object.assign(g.gustos || {}, { int: (g.gustos && g.gustos.int) || 2, variado: true, medida: true }); if (g.tipo === "tabla") g.formato = "medida"; return reh("Vale, lo monto a medida con quesos sueltos:"); }
    if (/mas barato|muy caro|se me va|bajar|reducir|menos dinero|algo mas economico|ajustar/.test(n)) {
      const pr = g.presupuesto || { min: null, max: p ? p.total : 40 };
      const nuevoMax = Math.max(15, (pr.max || p.total) * 0.75);
      g.presupuesto = { texto: "Hasta " + eur(nuevoMax), min: nuevoMax * 0.6, max: nuevoMax };
      return reh("Lo ajusto a la baja:");
    }
    if (/cambiar un queso|^cambia|^cambiar|sustitu|otro en vez|en lugar de|cambiame/.test(n) && !p.lineas.some(l => l.cat === "queso" && n.includes(norm(l.n).split(/\s|-/)[0]))) {
      g.pendiente = "cualCambiar";
      return { texto: "¿Cuál quieres cambiar?", opciones: p.lineas.filter(l => l.cat === "queso").map(l => l.n) };
    }
    const quesoNombrado = p.lineas.find(l => (l.cat === "queso") && norm(l.n).split(/\s|-/).some(w => w.length > 3 && n.includes(w)));
    if (quesoNombrado && /quita|sin|fuera|no quiero|cambia|otro|sustitu|en vez/.test(n)) { g.excluir.push(quesoNombrado.id); return reh(`Quito el ${quesoNombrado.n} y pongo otro en su lugar:`); }
    const cat = n.match(/azul|cabra|oveja|vaca|pan|vino|txakoli|cervez|vermut|chocolate|dulce|aceituna|mantequilla/);
    if (/quita|sin\b|fuera|no quiero|no pongas/.test(n) && cat) {
      const k = cat[0];
      if (/azul|cabra|oveja|vaca/.test(k)) { g.gustos = Object.assign(g.gustos || {}, k === "azul" ? { azules: false } : { evitarLeche: k }); const qs = p.lineas.filter(l => l.cat === "queso" && (k === "azul" ? D.QUESOS.find(q => q.id === l.id)?.azul : D.QUESOS.find(q => q.id === l.id)?.leche === k)); qs.forEach(l => g.excluir.push(l.id)); if (k !== "azul") { const lch = k; D.QUESOS.filter(q => q.leche === lch).forEach(q => { if (!g.excluir.includes(q.id)) g.excluir.push(q.id); }); } return reh(`Sin ${k === "azul" ? "azules" : "queso de " + k}:`); }
      g.extras = Object.assign(g.extras || {}, { [/pan/.test(k) ? "pan" : /vino|txakoli|cervez|vermut/.test(k) ? "bebida" : /chocolate|dulce/.test(k) ? "dulce" : /aceituna/.test(k) ? "aperitivo" : "mantequilla"]: false });
      if (/vino|txakoli|cervez|vermut/.test(k)) g.bebida = "sin";
      return reh("Lo quito:");
    }
    if (/anad|añad|pon\b|mete|incluye|suma|con pan|con vino|con txakoli|con cerveza|una botella|algo dulce|mas queso|otro queso|un queso mas/.test(n)) {
      const e = Object.assign({}, g.extras || {});
      if (/pan|hogaza/.test(n)) e.pan = true;
      if (/dulce|chocolate|galleta/.test(n)) e.dulce = true;
      if (/aceituna|aperitivo|gilda|happy/.test(n)) e.aperitivo = true;
      if (/mantequilla/.test(n)) e.mantequilla = true;
      const b = parseBebida(t); if (b && b !== "sin") { e.bebida = b; g.bebida = b; }
      else if (/bebida|botella/.test(n) && (!g.bebida || g.bebida === "sin")) { g.pendiente = "bebidaExtra"; return { texto: "¿Qué bebida añado?", opciones: OPCIONES_BEBIDA.slice(0, 4) }; }
      if (/mas queso|otro queso|un queso mas|uno mas/.test(n)) { g.personas = (g.personas || 2) + 3; }
      g.extras = e;
      if (g.presupuesto && g.presupuesto.max) g.presupuesto = { ...g.presupuesto, max: g.presupuesto.max + 12, texto: g.presupuesto.texto + " (ampliado)" };
      return reh("Lo añado:");
    }
    if (/mas grande|somos mas|para mas gente|mas personas|mas cantidad|doble/.test(n)) { g.personas = (g.personas || 2) * 2; return reh("Lo amplío:"); }
    if (/mas suave|menos fuerte/.test(n)) { g.gustos = Object.assign(g.gustos || {}, { int: 1 }); return reh("Más suave:"); }
    if (/mas fuerte|mas intens|mas curad/.test(n)) { g.gustos = Object.assign(g.gustos || {}, { int: 3 }); return reh("Más intenso:"); }
    if (/mas (caro|premium|especial|top)|tirar la casa|lo mejor/.test(n)) { g.presupuesto = { texto: "Ampliado", min: (p.total || 40) * 1.3, max: (p.total || 40) * 1.6 }; return reh("Subo el nivel:"); }
    const f = parseFecha(t); if (f && /\b(para el|mejor el|cambia la fecha|el dia)\b/.test(n)) { g.fecha = f; return reh("Cambio la fecha:"); }
    const e = parseEntrega(t); if (e && /recog|envi/.test(n)) { g.entrega = e; if (e.modo === "envio" && !e.zona) { g.pideLugar = true; g.pendiente = "lugarEnvio"; return { texto: "¿A qué localidad lo enviamos?" }; } return reh("Cambio la entrega:"); }
    return null;
  }

  function responder(g, entrada) {
    const t = (entrada || "").trim();
    const p = g.pendiente;
    let pre = [];
    if (g.cerrado) {
      if (p === "cualCambiar") { const l = g.propuesta.lineas.find(x => x.cat === "queso" && (x.n === t.trim() || norm(x.n).includes(norm(t).slice(0, 8)))); if (l) { g.excluir.push(l.id); g.pendiente = null; const txt = cierre(g); return { texto: `Cambio el ${l.n}:\n\n${txt}`, ficha: ficha(g), opciones: OPCIONES_CIERRE(g) }; } g.pendiente = null; }
      if (p === "bebidaExtra") { const b = parseBebida(t); if (b) { g.bebida = b; g.extras = Object.assign(g.extras || {}, { bebida: b }); if (g.presupuesto && g.presupuesto.max) g.presupuesto = { ...g.presupuesto, max: g.presupuesto.max + 20 }; g.pendiente = null; const txt = cierre(g); return { texto: `Añado ${NOMBRE_BEBIDA[b]}:\n\n${txt}`, ficha: ficha(g), opciones: OPCIONES_CIERRE(g) }; } g.pendiente = null; }
      if (p === "lugarEnvio") { if (capturar(g, "lugarEnvio", t)) { const txt = cierre(g); return { texto: acuse(g, "lugarEnvio") + "\n\n" + txt, ficha: ficha(g), opciones: OPCIONES_CIERRE(g) }; } return { texto: "¿En qué localidad? Por ejemplo Bilbao, Getxo, Barakaldo o Madrid." }; }
      if (esGracias(t) && !g.confirmado) { g.confirmado = true; return { texto: "Gracias a ti. Queda anotado como listo para confirmar; te escriben por aquí en horario de tienda.", ficha: ficha(g), fichaActualizada: true }; }
      if (esGracias(t)) return { texto: "Gracias a ti. Te escriben por aquí en horario de tienda." };
      if (esSaludo(t)) return { texto: "¡Hola de nuevo! Tu pedido ya está preparado; si quieres cambiar algo, dímelo y lo ajusto.", opciones: OPCIONES_CIERRE(g) };
      if (pideHumano(t)) { g.atencion = true; return { texto: `Claro, aviso a Las Chicas para que te atiendan ellas directamente en horario de tienda (${HORARIO_CORTO}).`, fichaActualizada: true, ficha: ficha(g) }; }
      const ed = editar(g, t); if (ed) return ed;
      const f = faq(g, t); if (f) return { texto: f, fichaActualizada: g.notas.length > 0, ficha: ficha(g), opciones: OPCIONES_CIERRE(g) };
      if (/otro pedido|empezar de nuevo|otra cosa|nuevo pedido/.test(norm(t))) return { texto: "Para otro pedido pulsa ↻ arriba y empezamos de cero.", opciones: OPCIONES_CIERRE(g) };
      g.notas.push(limpiar(t));
      return { texto: "Anotado, lo añado al pedido para que Las Chicas lo tengan en cuenta.", fichaActualizada: true, ficha: ficha(g), opciones: OPCIONES_CIERRE(g) };
    }
    if (pideHumano(t)) {
      g.atencion = true;
      const q = pregunta(g, p || siguiente(g));
      return { texto: `Claro, le paso la conversación a Las Chicas para que te atiendan ellas en horario de tienda (${HORARIO_CORTO}). Mientras, si me contestas un par de cosas, lo tendrán ya preparado. ${q.texto}`, opciones: q.opciones };
    }
    if (esSaludo(t)) { const q = pregunta(g, p || siguiente(g)); return { texto: (g.tipo ? "¡Hola de nuevo! " : "¡Hola! Encantado de ayudarte. ") + q.texto, opciones: q.opciones }; }
    if (esGracias(t)) { const q = pregunta(g, p || siguiente(g)); return { texto: "De nada. " + q.texto, opciones: q.opciones }; }
    const f = faq(g, t);
    if (f) pre.push(f);
    const ok = (f && esPregunta(t)) ? false : capturar(g, p, t);
    if (ok && p !== "tipo") extras(g, p, t);
    if (!ok) {
      if (f || pideHumano(t)) { const q = pregunta(g, p); return { texto: [pre.join(" "), q.texto].filter(Boolean).join(" "), opciones: q.opciones }; }
      // quizá ha respondido a otra cosa: datos sueltos
      const antes = JSON.stringify(g); extras(g, p, t);
      if (JSON.stringify(g) !== antes && siguiente(g) !== p) return avanzar(g, "", null);
      g.intentos++;
      if (g.intentos < 2 || !REINTENTO[p]) { const q = REINTENTO[p] || pregunta(g, p); return { texto: [pre.join(" "), q.texto].filter(Boolean).join(" "), opciones: q.opciones }; }
      // segunda vez sin entender: se guarda tal cual y se sigue, nunca se atasca
      if (p === "tipo") { g.tipo = "casa"; g.notas.push("Petición sin clasificar: " + limpiar(t)); }
      else if (p === "personas") g.personas = 0;
      else if (p === "presupuesto") g.presupuesto = { texto: "Sin definir (" + limpiar(t) + ")", min: null, max: null };
      else if (p === "gustos") g.gustos = Object.assign(g.gustos || {}, { int: 2, nota: limpiar(t) });
      else if (p === "bebida") { g.bebida = "sin"; g.notas.push("Bebida: " + limpiar(t)); }
      else if (p === "fecha") g.fecha = { texto: cap(limpiar(t)), iso: null };
      else if (p === "entrega") { g.entrega = { modo: "recogida" }; g.notas.push("Entrega por confirmar: " + limpiar(t)); }
      else if (p === "nombre") g.nombre = cap(limpiar(t));
      else if (p === "formato") g.formato = "medida";
      else if (p === "cataLugar") g.cataLugar = "tienda";
      else if (p === "cata") { g.cata = "privada"; g.notas.push("Cata: " + limpiar(t)); }
      else if (p === "evento") g.evento = cap(limpiar(t));
      else if (p === "lugar") g.lugar = cap(limpiar(t));
      else if (p === "meses") g.meses = 1;
      else if (p === "unidades") { g.unidades = 10; g.notas.push("Unidades por confirmar: " + limpiar(t)); }
      else if (p === "ocasion") g.ocasion = cap(limpiar(t));
      else if (p === "dedicatoria") g.dedicatoria = limpiar(t);
      else if (p === "extras") g.extras = { nada: true };
      else if (p === "racletteExtras") g.racletteExtras = limpiar(t);
      else if (p === "bebidaCasa") { g.bebidaCasa = "sin"; g.bebida = "sin"; }
      else if (p === "lugarEnvio") { Object.assign(g.entrega, { zona: "resto", lugar: cap(limpiar(t)) }); g.pideLugar = false; }
      if (!["tipo", "personas", "nombre", "formato", "cataLugar", "cata", "evento", "lugar", "meses", "unidades", "ocasion", "dedicatoria", "extras", "racletteExtras", "bebidaCasa", "lugarEnvio"].includes(p)) g.notas.push(`Respuesta sin clasificar en «${p}»: ${limpiar(t)}`);
      return avanzar(g, pre.join(" "), null);
    }
    return avanzar(g, pre.join(" "), p);
  }

  // ---------- ficha del pedido ----------
  function clasificar(g) {
    const p = g.propuesta || armar(g);
    const importe = p.total + (p.envio || 0);
    let prioridad = "Normal", orden = 2;
    const h = iso(hoy());
    if (g.atencion || (g.fecha && g.fecha.iso && g.fecha.iso <= h)) { prioridad = "Hoy"; orden = 0; }
    else if (g.tipo === "evento" || (g.personas && g.personas >= 15) || importe >= 100) { prioridad = "Alta"; orden = 1; }
    else if (g.fecha && g.fecha.texto === "Sin fecha fija") { prioridad = "Baja"; orden = 3; }
    return { prioridad, orden, importe, completa: !!(g.tipo && g.nombre), atencion: g.atencion };
  }
  function ficha(g) {
    const p = g.propuesta || armar(g); g.propuesta = p;
    const c = clasificar(g);
    const avisos = [];
    if (g.atencion) avisos.push("Pide hablar con una persona");
    if (g.entrega && g.entrega.zona === "fuera") avisos.push("Envío fuera de la península");
    avisos.push(...p.notas.filter(n => !/Tabla preparada: solo|Mastercheese en casa|Las entradas de cata/.test(n)), ...g.notas);
    const campos = [["Pedido", NOMBRE_TIPO[g.tipo] || "Sin clasificar"]];
    if (g.ocasion) campos.push(["Ocasión", g.ocasion]);
    if (g.evento) campos.push(["Evento", g.evento + (g.lugar ? " · " + g.lugar : "")]);
    if (g.personas) campos.push([g.tipo === "evento" ? "Invitados" : "Personas", String(g.personas)]);
    if (p.lineas.length) campos.push(["Selección", p.lineas.map(l => `${l.cant > 1 ? l.cant + " × " : ""}${l.n} · ${eur(l.p * l.cant)}`).join("\n")]);
    if (g.tipo === "raclette") campos.push(["Raclette", `Máquina ${g.personas > 2 ? "de 4" : "de 2"} · ${g.racletteExtras || "quesos para fundir"}`]);
    if (p.lineas.length) campos.push(["Total", eur(p.total) + (g.tipo === "cata" && g.cataLugar === "tienda" ? ` (${g.personas || 1} × 32 €)` : g.entrega && g.entrega.modo === "envio" ? (p.envio ? ` + ${eur(p.envio)} envío${g.tipo === "suscripcion" ? " por caja" : ""} = ${eur(p.total + p.envio)}` : " + envío a consultar") : " (recogida)")]);
    if (g.unidades) campos.splice(1, 0, ["Unidades", String(g.unidades)]);
    if (g.presupuesto) campos.push(["Presupuesto", g.presupuesto.texto]);
    if (g.gustos) campos.push(["Gustos", etiquetaGustos(g.gustos)]);
    if (g.bebida && g.tipo !== "cata") campos.push(["Bebida", cap(NOMBRE_BEBIDA[g.bebida] || g.bebida)]);
    if (g.fecha) campos.push([g.tipo === "raclette" ? "Fin de semana" : "Para el día", g.fecha.texto]);
    if (g.entrega) campos.push(["Entrega", g.entrega.modo === "recogida" ? "Recogida en tienda" : `Envío a ${g.entrega.lugar || "domicilio"}${p.envio ? " · " + eur(p.envio) : ""}`]);
    if (g.dedicatoria && g.dedicatoria !== "Sin nota") campos.push(["Nota en la caja", g.dedicatoria]);
    campos.push(["Cliente", g.nombre || "Sin dato"], ["Teléfono", "El del WhatsApp del cliente"], ["Estado", g.confirmado ? "Cliente conforme, pendiente de La Mandu" : "Pendiente de confirmar por La Mandu"]);
    if (avisos.length) campos.push(["Avisos", avisos.join(" · ")]);
    return { campos, clasificacion: c, datos: { tipo: NOMBRE_TIPO[g.tipo] || "Sin clasificar", tipoId: g.tipo, personas: g.personas, ocasion: g.ocasion, lineas: p.lineas, total: p.total, envio: p.envio, entrega: g.entrega, fecha: g.fecha, gustos: etiquetaGustos(g.gustos), bebida: g.bebida, dedicatoria: g.dedicatoria, nombre: g.nombre, avisos, confirmado: g.confirmado } };
  }

  // ---------- almacenamiento en el dispositivo ----------
  const KEY = "mandu.pedidos";
  const ESTADOS = [["nuevo", "Nuevo"], ["confirmado", "Confirmado con el cliente"], ["preparado", "Preparado"], ["entregado", "Entregado"]];
  function cargar() { try { return JSON.parse(localStorage.getItem(KEY) || "[]"); } catch (e) { return []; } }
  function guardar(l) { try { localStorage.setItem(KEY, JSON.stringify(l)); return true; } catch (e) { return false; } }
  function anadir(s) { const l = cargar(); l.unshift(s); guardar(l); return s; }
  function actualizar(id, fn) { const l = cargar(); const i = l.findIndex(x => x.id === id); if (i < 0) return null; fn(l[i]); guardar(l); return l[i]; }
  function borrar(filtro) { guardar(cargar().filter(s => !filtro(s))); }
  const nuevoId = () => "p" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

  function simular(mensajes, fecha) {
    const g = nuevoEstado();
    const conversacion = [{ quien: "asistente", texto: APERTURA }];
    let f = null;
    for (const m of mensajes) { conversacion.push({ quien: "cliente", texto: m }); const r = responder(g, m); conversacion.push({ quien: "asistente", texto: r.texto }); if (r.ficha) f = r.ficha; }
    return { id: nuevoId(), fecha: fecha.toISOString(), estado: "nuevo", ejemplo: true, ficha: f || ficha(g), conversacion };
  }
  function ejemplos() {
    const h = ms => new Date(Date.now() - ms);
    const H = 3600e3;
    return [
      simular(["Hola, quiero un regalo para el cumpleaños de mi hermana", "Vino", "50-80 €", "De todo un poco", "Este sábado", "Envío a Getxo", "Zorionak, Ane! Que cumplas muchos más", "Maite Etxebarria", "Así está bien"], h(2 * H)),
      simular(["Buenas, somos 6 este sábado y queremos una tabla de quesos", "Tabla lista para servir", "40-60 €", "Sin azules", "Txakoli", "Recojo en tienda", "Mikel Uriarte"], h(5 * H)),
      simular(["Quiero unos quesos para casa, intensos, le gusta el vermut", "Para 2", "Alrededor de 30 €", "Pan de Gure Ogia", "Mañana", "Recojo en tienda", "Laura Gómez"], h(23 * H)),
      simular(["Hola, me gustaría apuntarme a una cata", "En la tienda", "2", "Cata a ciegas", "Jon Arrieta"], h(30 * H)),
      simular(["Queremos la raclette para este finde", "Para 4", "Este finde", "Sí, el kit completo", "Nerea Lasa"], h(49 * H)),
      simular(["Nos casamos en junio y queremos una mesa de quesos para el cóctel", "13 de junio", "80 invitados", "Palacio de Urgoiti, Mungia", "De todo un poco, sin azules muy fuertes", "Iñigo Zabala"], h(70 * H)),
    ];
  }
  function sembrar() {
    let l = cargar();
    if (l.some(s => s.ejemplo)) return l;
    try { if (localStorage.getItem("mandu.sembrado")) return l; } catch (e) {}
    l = [...l, ...ejemplos()];
    guardar(l);
    try { localStorage.setItem("mandu.sembrado", "1"); } catch (e) {}
    return l;
  }
  function restaurarEjemplos() { const l = cargar().filter(s => !s.ejemplo); guardar([...l, ...ejemplos()]); }

  global.Mandu = { APERTURA, HORARIO, ESTADOS, OPCIONES_TIPO, ENVIO, nuevoEstado, responder, ficha, clasificar, armar, cargar, guardar, anadir, actualizar, borrar, nuevoId, sembrar, restaurarEjemplos, ejemplos, pregunta, eur, IMG_BASE: D.IMG_BASE };
})(typeof window !== "undefined" ? window : globalThis);
