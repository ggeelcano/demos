// Asistente de WhatsApp de AL Margen: motor por reglas (sin IA de pago ni servidor) que contesta las dudas habituales,
// recoge personas, día, hora, nombre y peticiones con los mismos turnos que su motor de CoverManager, y deja la reserva
// lista para validar. Contesta en español o en inglés según escriba el cliente. Lo usan index.html y panel.html.
(function (global) {
  "use strict";
  const D = global.MARGEN_DATOS;
  const DIRECCION = "Muelle de Urazurrutia, 2, Bilbao";
  const TELEFONO = "944 064 006";
  const MAPS = "https://www.google.com/maps/search/?api=1&query=Restaurante+AL+Margen+Muelle+de+Urazurrutia+2+Bilbao";
  const BONOS = "https://restaurantealmargen.com/regala-al-margen/";
  // Turnos que ofrecía su motor de CoverManager el 1-oct-2026 para cada día de la semana (0 = domingo), en minutos
  // desde las 00:00 y de cuarto en cuarto de hora. Online admite hasta 6 personas (a partir de 7 es solicitud de
  // grupo) y fechas hasta el 30 de diciembre, unos tres meses.
  const rango = (a, b) => { const l = []; for (let m = a; m <= b; m += 15) l.push(m); return l; };
  const SERVICIOS = {
    0: { comida: rango(840, 900) },
    1: null,
    2: { comida: rango(825, 900) },
    3: { comida: rango(825, 900) },
    4: { comida: rango(825, 900), cena: rango(1230, 1275) },
    5: { comida: rango(840, 900), cena: rango(1230, 1290) },
    6: { comida: rango(840, 900), cena: rango(1230, 1305) },
  };
  const TODOS = [...new Set(Object.values(SERVICIOS).flatMap(s => s ? [...s.comida, ...(s.cena || [])] : []))].sort((a, b) => a - b);
  const TARDE = 1020; // a partir de las 17:00 un turno es de cena
  const MAX_DIAS = 90, MAX_PERSONAS = 6;
  const APERTURA = "¡Hola! 👋 Soy el asistente de AL Margen.\n\nTe reservo mesa en un momento y te resuelvo dudas de la carta, del menú degustación o del horario. ¿Qué necesitas?\n\nYou can also write to me in English 🇬🇧";
  const OPCIONES_INICIO = ["Reservar mesa", "Ver la carta", "Horario y dirección"];

  const norm = s => (s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
  const cap = s => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);
  const limpiar = s => (s || "").replace(/\s+/g, " ").replace(/^[\s,.;:!¡-]+|[\s,.;:!-]+$/g, "").trim();
  const eur = v => (Math.round(v * 100) / 100).toFixed(2).replace(".", ",").replace(/,00$/, "") + " €";
  const lista = (arr, y) => arr.length <= 1 ? arr.join("") : arr.slice(0, -1).join(", ") + " " + (y || "y") + " " + arr[arr.length - 1];
  let reloj = null; // solo para pruebas y ejemplos: fija «ahora»
  const ahora = () => (reloj ? new Date(reloj) : new Date());
  const dia = d => { const x = new Date(d); x.setHours(12, 0, 0, 0); return x; };
  const hoy = () => dia(ahora());
  const mas = (d, k) => { const x = new Date(d); x.setDate(x.getDate() + k); return x; };
  const iso = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  const deIso = s => { const [y, m, dd] = s.split("-").map(Number); return new Date(y, m - 1, dd, 12); };
  const diasHasta = d => Math.round((dia(d) - hoy()) / 864e5);
  const hhmm = m => `${String(Math.floor(m / 60) % 24).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
  const DIAS = { es: ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"], en: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"] };
  const MESES = { es: ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"], en: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"] };
  const fechaBonita = (d, lang) => lang === "en" ? `${DIAS.en[d.getDay()]} ${d.getDate()} ${MESES.en[d.getMonth()]}` : `${DIAS.es[d.getDay()]} ${d.getDate()} de ${MESES.es[d.getMonth()]}`;
  const personasTxt = (p, lang) => lang === "en" ? `${p} ${p === 1 ? "person" : "people"}` : `${p} ${p === 1 ? "persona" : "personas"}`;
  const plural = (nd, lang) => lang === "en" ? nd + "s" : /[oa]$/.test(nd) ? nd + "s" : nd;

  // Turnos que se pueden pedir un día concreto (si es hoy, solo los que quedan por delante). `serv`: "comida" o "cena".
  function turnos(d, serv) {
    const s = SERVICIOS[d.getDay()]; if (!s) return [];
    let l = [...(serv !== "cena" ? s.comida : []), ...(serv !== "comida" && s.cena ? s.cena : [])];
    if (iso(d) === iso(hoy())) { const a = ahora(), m = a.getHours() * 60 + a.getMinutes(); l = l.filter(x => x > m + 15); }
    return l;
  }
  function proximosDias(k, serv) {
    const l = []; let d = hoy();
    for (let i = 0; i < 14 && l.length < k; i++, d = mas(d, 1)) if (turnos(d, serv).length) l.push(d);
    return l;
  }
  function etiquetaDia(d, lang) {
    const k = diasHasta(d);
    if (k === 0) return lang === "en" ? "Today" : "Hoy";
    if (k === 1) return lang === "en" ? "Tomorrow" : "Mañana";
    return `${cap(DIAS[lang === "en" ? "en" : "es"][d.getDay()])} ${d.getDate()}`;
  }
  // «para comer de 13:45 a 15:00 y para cenar de 20:30 a 21:15»
  function fraseTurnos(l, lang) {
    const en = lang === "en", com = l.filter(z => z < TARDE), cen = l.filter(z => z >= TARDE), p = [];
    const tramo = x => x.length === 1 ? (en ? "at " : "a las ") + hhmm(x[0]) : (en ? "from " : "de ") + hhmm(x[0]) + (en ? " to " : " a ") + hhmm(x[x.length - 1]);
    if (com.length) p.push((en ? "for lunch " : "para comer ") + tramo(com));
    if (cen.length) p.push((en ? "for dinner " : "para cenar ") + tramo(cen));
    return p.join(en ? " and " : " y ");
  }

  // ---------- idioma ----------
  const RE_EN = /\b(table|book|booking|reservation|reserve|people|guests?|tonight|tomorrow|today|please|hello|hi|hey|thanks|thank you|open|opening|where|what|when|how|we are|we're|kids|children|yes|yeah|nothing|none|allergy|allergic|birthday|cancel|change|name|english|do you|can i|can we|i'd|would like|monday|tuesday|wednesday|thursday|friday|saturday|sunday|two|three|four|five|six|lunch|dinner|tasting|the|for)\b/g;
  const RE_ES = /\b(mesa|reserv\w*|personas?|hola|buenas|gracias|quiero|quisiera|queria|somos|manana|hoy|noche|carta|donde|cuanto|cuando|que|para|el|la|los|las|si|nada|alergia|cumple\w*|cancelar|cambiar|nombre|teneis|hay|lunes|martes|miercoles|jueves|viernes|sabado|domingo|dos|tres|cuatro|cinco|seis|comer|cenar|comida|cena|degustacion|una?|de)\b/g;
  function idioma(g, n) {
    const en = (n.match(RE_EN) || []).length, es = (n.match(RE_ES) || []).length;
    if (!g.lang) g.lang = en > es ? "en" : "es";
    else if (g.lang === "es" && en >= 2 && es === 0) g.lang = "en";
    else if (g.lang === "en" && es >= 2 && en === 0) g.lang = "es";
  }

  // ---------- parsers (reciben el texto ya en minúsculas y sin tildes) ----------
  const PAL = { dos: 2, tres: 3, cuatro: 4, cinco: 5, seis: 6, siete: 7, ocho: 8, nueve: 9, diez: 10, once: 11, doce: 12, trece: 13, catorce: 14, quince: 15, dieciseis: 16, veinte: 20, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10, eleven: 11, twelve: 12, fifteen: 15, twenty: 20 };
  const UNO = { un: 1, una: 1, uno: 1, a: 1, one: 1 };
  const NUM = "(\\d{1,3}|" + Object.keys(PAL).join("|") + ")";
  const NUMH = "(\\d{1,2}|una|one|" + Object.keys(PAL).join("|") + ")";
  const num = s => (/^\d+$/.test(s) ? +s : PAL[s] || UNO[s]);

  // Dan comidas y cenas y ningún turno es de mañana, así que «a las 2» son las 14:00 y «a las 9» las 21:00
  const RE_H_RELOJ = /\b(\d{1,2})(?:[:.]|\s?h\s?)(\d{2})\b/;
  const RE_H_LAS = new RegExp("\\b(?:a|sobre|hacia|para|de|desde) las? " + NUMH + "(?: y (media|cuarto)| (menos cuarto))?\\b");
  const RE_H_SUFIJO = /\b(\d{1,2})\s?(?:pm|p\.m\.?|h|hrs|horas)\b/;
  const RE_H_AT = new RegExp("\\bat (?:around |about )?" + NUMH + "(?:\\s?(?:pm|o'?clock))?(?: (thirty|fifteen))?\\b");
  const RE_H_HALF = new RegExp("\\bhalf past " + NUMH + "\\b");
  const RE_H_SOLA = new RegExp("^" + NUMH + "(?: y (media|cuarto)| (menos cuarto)| (thirty|fifteen))?$");
  function parseHora(n, paso) {
    let m, h, min = 0;
    const frac = s => /media|thirty|half/.test(s || "") ? 30 : /menos cuarto/.test(s || "") ? -15 : /cuarto|fifteen/.test(s || "") ? 15 : 0;
    if ((m = n.match(RE_H_RELOJ))) { h = +m[1]; min = +m[2]; }
    else if ((m = n.match(RE_H_LAS))) { h = num(m[1]); min = frac(m[2] || m[3]); }
    else if ((m = n.match(RE_H_SUFIJO))) h = +m[1];
    else if ((m = n.match(RE_H_HALF))) { h = num(m[1]); min = 30; }
    else if ((m = n.match(RE_H_AT))) { h = num(m[1]); min = frac(m[2]); }
    else if (paso === "hora" && (m = n.trim().match(RE_H_SOLA))) { h = num(m[1]); min = frac(m[2] || m[3] || m[4]); }
    else return null;
    if (h == null || h > 24 || min > 59) return null;
    if (min < 0) { h -= 1; min += 60; }
    if (h >= 1 && h <= 11) h += 12; else if (h === 0) h = 24;
    return { min: h * 60 + min, resto: n.replace(m[0], " ") };
  }

  const SEMANA = { domingo: 0, lunes: 1, martes: 2, miercoles: 3, jueves: 4, viernes: 5, sabado: 6, sunday: 0, sun: 0, monday: 1, mon: 1, tuesday: 2, tue: 2, tues: 2, wednesday: 3, wed: 3, thursday: 4, thu: 4, thur: 4, thurs: 4, friday: 5, fri: 5, saturday: 6, sat: 6 };
  const MES_N = {}; MESES.es.forEach((m, i) => { MES_N[norm(m)] = i; }); MESES.en.forEach((m, i) => { MES_N[m.toLowerCase()] = i; }); MES_N.setiembre = 8;
  const MES_RE = Object.keys(MES_N).join("|");
  const RE_F_SEMANA = new RegExp("\\b(" + Object.keys(SEMANA).join("|") + ")\\b");
  const RE_F_DMES = new RegExp("\\b(\\d{1,2})(?:st|nd|rd|th)? (?:de |of )?(" + MES_RE + ")\\b");
  const RE_F_MESD = new RegExp("\\b(" + MES_RE + ") (?:the )?(\\d{1,2})(?:st|nd|rd|th)?\\b");
  const RE_F_BARRA = /\b(\d{1,2})\s?\/\s?(\d{1,2})\b/;
  const RE_F_EL = /\b(?:el dia|el|dia|on the|the) (\d{1,2})(?:st|nd|rd|th)?\b(?! ?(?:personas|comensales|pax|people|adultos|adults|ninos|ninas|kids|children|of us|de la|h\b|:))/;
  function parseFecha(n, paso) {
    const base = hoy(); let m;
    const sal = (d, m0) => ({ d, resto: n.replace(m0, " ") });
    const conMes = (dd, mm, m0) => { let d = new Date(base.getFullYear(), mm, dd, 12); if (d.getMonth() !== mm) return null; if (d < base) d = new Date(base.getFullYear() + 1, mm, dd, 12); return sal(d, m0); };
    const delMes = (dd, m0) => { let d = new Date(base.getFullYear(), base.getMonth(), dd, 12); if (d.getDate() !== dd || d < base) d = new Date(base.getFullYear(), base.getMonth() + 1, dd, 12); return d.getDate() === dd ? sal(d, m0) : null; };
    if ((m = n.match(/\bpasado manana\b|\bday after tomorrow\b/))) return sal(mas(base, 2), m[0]);
    if ((m = n.match(/\b(hoy|esta noche|esta tarde|este mediodia|tonight|today|this evening)\b/))) return sal(base, m[0]);
    const sinManana = n.replace(/\b(por|de) la manana\b/g, " ");
    if ((m = sinManana.match(/\bmanana\b|\btomorrow\b/))) return { d: mas(base, 1), resto: sinManana.replace(m[0], " ") };
    if ((m = n.match(RE_F_DMES))) { const r = conMes(+m[1], MES_N[m[2]], m[0]); if (r) return r; }
    if ((m = n.match(RE_F_MESD))) { const r = conMes(+m[2], MES_N[m[1]], m[0]); if (r) return r; }
    if ((m = n.match(RE_F_BARRA)) && +m[2] >= 1 && +m[2] <= 12) { const r = conMes(+m[1], +m[2] - 1, m[0]); if (r) return r; }
    if ((m = n.match(RE_F_SEMANA))) {
      let k = (SEMANA[m[1]] - base.getDay() + 7) % 7;
      if (k === 0 && SERVICIOS[base.getDay()] && !turnos(base).length) k = 7;
      return sal(mas(base, k), m[0]);
    }
    if ((m = n.match(/\b(este |el |this )?(finde|fin de semana|weekend)\b/))) return { finde: true, resto: n.replace(m[0], " ") };
    if ((m = n.match(RE_F_EL)) && +m[1] >= 1 && +m[1] <= 31) { const r = delMes(+m[1], m[0]); if (r) return r; }
    if (paso === "fecha" && (m = n.trim().match(/^(\d{1,2})$/)) && +m[1] >= 1 && +m[1] <= 31) return delMes(+m[1], m[0]);
    return null;
  }

  const PEQUES = "(?:ninos?|ninas?|peques?|pequenos?|crios?|bebes?|kids?|children|child|bab(?:y|ies)|toddlers?|little ones?)";
  const RE_NINOS = new RegExp("\\b(\\d{1,2}|un|una|a|one|" + Object.keys(PAL).join("|") + ") " + PEQUES + "\\b");
  const RE_ADULTOS = new RegExp("\\b" + NUM + " (?:adultos?|adults?|mayores)\\b");
  const NO_SIGUE = "(?! ?(?:de (?:" + MES_RE + ")|anos|years|euros|€|min|h\\b|" + PEQUES + "))";
  const RE_PARA = new RegExp("\\b(?:para|somos|seremos|seriamos|vamos|iremos|vendremos|venimos|mesa de|grupo de|table for|party of|group of|for|we are|we're|we'll be|we will be|there are|there will be|there's) (?:a ser |ser |unos |unas |como |about |around |a |solo |just )?" + NUM + "\\b" + NO_SIGUE);
  const RE_PERS = new RegExp("\\b" + NUM + " ?(?:personas?|comensales|pax|people|persons?|guests|of us|adultos?|adults?)\\b");
  const RE_SOLO_NUM = new RegExp("^(?:unos |unas |about )?" + NUM + "$");
  function parsePersonas(n, paso, estricto) {
    let total = null, ninos = 0, m;
    const k = n.match(RE_NINOS); if (k) ninos = num(k[1]) || 0;
    const a = n.match(RE_ADULTOS);
    if (a && k) total = num(a[1]) + ninos;
    else if ((m = n.match(RE_PERS))) total = num(m[1]);
    else if (!estricto && (m = n.match(RE_PARA))) total = num(m[1]);
    else if (/\b(pareja|los dos|las dos|a couple|the two of us|just two)\b/.test(n)) total = 2;
    else if (/\b(una persona|solo yo|yo sol[oa]|one person|just me|myself)\b/.test(n)) total = 1;
    else if ((paso === "personas" || paso === "personasMas") && (m = n.trim().match(RE_SOLO_NUM))) total = num(m[1]);
    if (total == null && !ninos) return null;
    return { total, ninos };
  }

  const RE_NOMBRE = /(?:a nombre de|al nombre de|me llamo|mi nombre es|\bsoy|under the name of|under the name|\bunder|my name is|name is|\bi am|\bi'm|nombre:|name:)\s+([A-Za-zÀ-ÿ'’ -]{2,40})/i;
  const NO_NOMBRE = /^(celiac|coeliac|al[eé]rgic|allergic|intolerant|vegan|vegetarian|yo\b|el\b|la\b|un\b|una\b|de\b|a\b|from\b|cliente|nosotros|the\b|not\b|sorry|looking|interested)/i;
  const RE_CORTE = /\s+(?:y|e|para|el|la|a las|somos|con|and|for|at|on|please|por favor|gracias|thanks)\b|[,.;:!?¿¡\d]/i;
  const titulo = s => s.split(/\s+/).filter(Boolean).map((w, i) => (i && /^(de|del|la|las|los|y|van|von|da|di)$/i.test(w)) ? w.toLowerCase() : (w === w.toLowerCase() || w === w.toUpperCase()) ? w.charAt(0).toUpperCase() + w.slice(1).toLowerCase() : w).join(" ");
  function parseNombre(t, paso) {
    const m = t.match(RE_NOMBRE);
    if (m) { const s = limpiar(m[1].split(RE_CORTE)[0]); if (s.length >= 2 && !NO_NOMBRE.test(s)) return { nombre: titulo(s) }; }
    if (paso === "nombre") {
      const s = limpiar(t.replace(/^(pon(?:la|lo|me)? a nombre de|a nombre de|al nombre de|nombre|name|it's|es|soy|me llamo|i am|i'm|my name is|under)\s+/i, "").replace(/[,.]?\s*(muchas gracias|gracias|por favor|thanks|thank you|please)\s*$/i, ""));
      if (s && s.length <= 40 && !/\d/.test(s) && s.split(/\s+/).length <= 5 && !/[?¿]/.test(t) && !/^(s[ií]|no|vale|ok|okay|hola|gracias|nada|yes|sure|thanks|perfecto|claro|eso|cancelar)$/i.test(s)) return { nombre: titulo(s), debil: true };
    }
    return null;
  }

  const RE_COMIDA = /\bcomer\b|\bcomida\b|mediodia|almorzar|almuerzo|\blunch\b|\bmidday\b|\bnoon\b/;
  const RE_CENA = /\bcenar\b|\bcena\b|esta noche|por la noche|de noche|\bdinner\b|\btonight\b|\bevening\b/;
  const RE_MENU = /degustacion|bib gourmand|tasting menu|\btasting\b|menu largo/;
  const RE_BEBE = /\btronas?\b|high ?chairs?|carrito|cochecito|carro de bebe|silla de bebe|sillita|stroller|\bpram\b|buggy|pushchair/;
  const ALERGENOS = [["gluten", /gluten|celiac|coeliac|trigo|wheat/], ["lactosa", /lactos|lacteos|dairy|leche\b|\bmilk/], ["frutos secos", /frutos secos|nuez|nueces|almendra|avellana|\bnuts?\b|hazelnut/], ["cacahuete", /cacahuete|\bmani\b|peanut/], ["marisco", /marisco|crustaceo|shellfish|gambas?\b|langostino|prawn/], ["pescado", /pescado|\bfish\b/], ["huevo", /huevo|\beggs?\b/], ["soja", /\bsoja\b|\bsoy\b/], ["sésamo", /sesamo|sesame/], ["mostaza", /mostaza|mustard/]];
  const ALERGENO_EN = { gluten: "gluten", lactosa: "lactose", "frutos secos": "nuts", cacahuete: "peanut", marisco: "shellfish", pescado: "fish", huevo: "egg", soja: "soy", "sésamo": "sesame", mostaza: "mustard" };
  function parsePeticiones(n, t, paso) {
    const l = [];
    if (paso === "alergia" || /alergi|allerg|intoleran|celiac|coeliac|sin gluten|gluten.?free|sin lactosa|lactose.?free|no puede comer|can'?t eat/.test(n)) {
      const a = ALERGENOS.filter(([, re]) => re.test(n)).map(([k]) => k);
      if (a.length) l.push({ id: "alergia", alergenos: a, es: "Alergia o intolerancia: " + lista(a), en: "Allergy or intolerance: " + lista(a.map(x => ALERGENO_EN[x]), "and") });
      else if (paso === "alergia") l.push({ id: "alergia", alergenos: [], es: "Alergia: " + t, en: "Allergy: " + t });
      else l.push({ id: "alergia", alergenos: [], pendiente: true });
    }
    if (/vegan/.test(n)) l.push({ id: "vegetal", vegano: true, es: "Vegano en la mesa (avisado de que cocina no puede atenderlo)", en: "Vegan guest (told the kitchen can't cater for it)" });
    else if (/vegetarian/.test(n)) l.push({ id: "vegetal", es: "Vegetariano en la mesa", en: "Vegetarian guest" });
    if (RE_BEBE.test(n)) l.push({ id: "bebe", es: "Preguntan por carro o silla de bebé (avisado de que no se admiten)", en: "Asked about a pushchair or high chair (told they can't be accommodated)" });
    // el menú degustación solo se anota si lo piden; si preguntan por él, contesta la parte de dudas
    if (RE_MENU.test(n) && !/[?¿]/.test(t) && (paso === "peticiones" || /\b(quer\w+|quisi\w+|tomar\w*|pedir\w*|coger\w*|haremos|vamos a|iremos|con (el )?menu|we'?d like|we want|we'?ll (have|take|go)|going for|with the tasting)\b/.test(n))) l.push({ id: "menu", es: "Quieren el menú degustación", en: "They'd like the tasting menu" });
    const tarta = /\btartas?\b|\bcake\b/.test(n) && !/bizcocho|banana/.test(n);
    if (/cumple|birthday/.test(n)) l.push({ id: "celebracion", es: "Celebran un cumpleaños" + (tarta ? " (traen tarta)" : ""), en: "Birthday celebration" + (tarta ? " (bringing a cake)" : "") });
    else if (/aniversario|anniversary/.test(n)) l.push({ id: "celebracion", es: "Celebran un aniversario", en: "Anniversary" });
    else if (tarta || /celebra|despedida|sorpresa|surprise/.test(n)) l.push({ id: "celebracion", es: "Celebración" + (tarta ? " (traen tarta)" : ""), en: "Celebration" + (tarta ? " (bringing a cake)" : "") });
    if (/terraza|terrace|outside|outdoors?|mesa fuera|sentar\w* fuera|al aire libre/.test(n)) l.push({ id: "zona", es: "Piden terraza (confirmar)", en: "Asked for the terrace (to be confirmed)" });
    if (/silla de ruedas|wheelchair|movilidad reducida/.test(n)) l.push({ id: "accesible", es: "Silla de ruedas (confirmar acceso)", en: "Wheelchair (access to be confirmed)" });
    if (/\bperr[oa]s?\b|\bperrit[oa]s?\b|\bdogs?\b|mascota/.test(n)) l.push({ id: "perro", es: "Vienen con perro (confirmar si puede estar)", en: "Coming with a dog (to be confirmed)" });
    return l;
  }

  // ---------- preguntas frecuentes ----------
  const RE_HORARIO = /horario|abris|abrir|abierto|cerrais|cerrado|a que hora (abr|cerr|empez)|hasta que hora|que dias|dais (cenas|comidas)|hay (cenas|comidas)|se puede (cenar|comer)|opening (hours|times)|what time do you|are you open|when do you (open|close)|do you (open|serve)|\bopen (on|today|tonight|for)\b|closing time/;
  const RE_DONDE = /donde estais|donde esta|donde os|direccion|como llegar|como se llega|como llego|ubicacion|\bmapa\b|google maps|where are you|where is|address|location|directions|how (do i|do we|to) get/;
  const RE_CARTA = /\bcarta\b|\bmenu\b|que teneis|que hay (de|para) (comer|cenar|picar)|what do you (have|serve)|\bfood\b|que se come|platos/;
  const RE_RESERVA = /reserv|\bmesa\b|\bbook|\btable\b|\bcenar\b|\bcomer\b|\bdinner\b|\blunch\b|\bhueco\b|\bsitio\b/;
  const PLATOS = D.CARTA.flat();
  const lineaPlato = (it, lang) => `• ${it.n[lang]} · ${eur(it.p)}`;
  const POLITICA = {
    bebe: { es: "Por las características del local no podemos admitir carros ni sillas de bebé, y la propuesta está pensada para adultos.", en: "Because of the size of the room we can't take pushchairs or high chairs, and the menu is designed for adults." },
    vegano: { es: "Lo siento: cocina adapta la propuesta a dietas vegetarianas, celíacas o sin lactosa, pero no puede atender dietas veganas.", en: "I'm sorry: the kitchen adapts the menu for vegetarian, coeliac or lactose-free diets, but it can't cater for vegan diets." },
  };
  function cartaGeneral(g) {
    const en = g.lang === "en", lang = en ? "en" : "es", M = D.MENU;
    const cuerpo = D.CARTA.map(gr => gr.map(it => lineaPlato(it, lang)).join("\n")).join("\n\n");
    return {
      texto: (en ? "This is the seasonal menu:\n\n" : "Esta es la carta de temporada:\n\n") + cuerpo + (en
        ? `\n\nTasting menu: ${M.snacks} snacks and ${M.pasos} courses, ${eur(M.precio)}, drinks not included.\nArtisan bread: ${eur(D.PAN)} per person.`
        : `\n\nMenú degustación: ${M.snacks} snacks y ${M.pasos} pasos, ${eur(M.precio)}, bebidas aparte.\nPan artesano: ${eur(D.PAN)} por persona.`),
      opciones: en ? ["Book a table", "Tasting menu"] : ["Reservar mesa", "Menú degustación"],
    };
  }
  function faqMenu(g) {
    const en = g.lang === "en", M = D.MENU;
    return { texto: en
      ? `The tasting menu is ${M.snacks} snacks and ${M.pasos} courses for ${eur(M.precio)}, drinks not included. It changes with the season and is served to the whole table.\n\nIf you'd like it, tell me and I'll note it on the booking.`
      : `El menú degustación son ${M.snacks} snacks y ${M.pasos} pasos por ${eur(M.precio)}, con las bebidas aparte. Va cambiando con la temporada y se sirve a mesa completa.\n\nSi lo queréis, dímelo y lo anoto en la reserva.` };
  }
  function faqHorario(g, n) {
    const en = g.lang === "en", lang = en ? "en" : "es"; let m, texto;
    const f = parseFecha(n, null);
    const d = f && f.d ? f.d : (m = n.match(RE_F_SEMANA)) ? mas(hoy(), (SEMANA[m[1]] - hoy().getDay() + 7) % 7) : null;
    if (d) {
      const s = SERVICIOS[d.getDay()], nd = plural(DIAS[lang][d.getDay()], lang);
      if (!s) texto = en ? `We're closed on ${nd}.` : `Los ${nd} cerramos.`;
      else if (!s.cena) texto = en ? `On ${nd} we only serve lunch: tables from ${hhmm(s.comida[0])} to ${hhmm(s.comida[s.comida.length - 1])}.` : `Los ${nd} damos solo comidas: mesas de ${hhmm(s.comida[0])} a ${hhmm(s.comida[s.comida.length - 1])}.`;
      else texto = en ? `On ${nd} there are tables ${fraseTurnos([...s.comida, ...s.cena], "en")}.` : `Los ${nd} hay mesa ${fraseTurnos([...s.comida, ...s.cena], "es")}.`;
    } else texto = en
      ? "We serve lunch from Tuesday to Sunday and dinner on Thursday, Friday and Saturday. We're closed on Mondays.\n\n• Lunch: tables from 13:45 to 15:00 (from 14:00 on Friday, Saturday and Sunday)\n• Dinner: tables from 20:30; the last one at 21:15 on Thursday, 21:30 on Friday and 21:45 on Saturday"
      : "Damos comidas de martes a domingo y cenas los jueves, viernes y sábados. Los lunes cerramos.\n\n• Comidas: mesas de 13:45 a 15:00 (viernes, sábado y domingo, desde las 14:00)\n• Cenas: mesas desde las 20:30; la última a las 21:15 el jueves, a las 21:30 el viernes y a las 21:45 el sábado";
    return { texto };
  }
  const faqDonde = g => ({ texto: g.lang === "en" ? `We're at ${DIRECCION}.\nDirections: ${MAPS}` : `Estamos en ${DIRECCION}.\nCómo llegar: ${MAPS}` });
  // Lo que no está publicado en su web no se inventa: se apunta para que conteste el equipo
  function noLoSe(g, t) {
    if (!g.preguntas.includes(t)) g.preguntas.push(t);
    return { texto: g.lang === "en" ? "I'm not sure about that and I'd rather not guess. I've passed your question to the team and they'll answer you here." : "Eso no lo sé seguro y prefiero no inventármelo. Le dejo la pregunta apuntada al equipo y te contestan por aquí.", pendiente: true };
  }
  function faq(g, n, t) {
    const en = g.lang === "en", lang = en ? "en" : "es", M = D.MENU;
    const horario = RE_HORARIO.test(n), donde = RE_DONDE.test(n);
    if (horario && donde) return { texto: faqHorario(g, "").texto + "\n\n" + faqDonde(g).texto };
    if (horario) return faqHorario(g, n);
    if (donde) return faqDonde(g);
    if (/aparca|parking|\bpark\b/.test(n)) return noLoSe(g, t);
    if (RE_MENU.test(n)) return faqMenu(g);
    if (/vegan/.test(n)) return { texto: POLITICA.vegano[lang] };
    if (/vegetarian/.test(n)) return { texto: en ? "Yes, the kitchen adapts the menu for vegetarians. Tell me when you book and I'll note it." : "Sí, cocina adapta la propuesta a dieta vegetariana. Dímelo al reservar y lo dejo anotado." };
    if (/alergen|allergen|alergi|allerg|intoleran|gluten|celiac|coeliac|lactos/.test(n)) return { texto: en ? "The kitchen adapts the menu for coeliacs and for lactose intolerance. For any other allergy, tell me which one and I'll note it on the booking so the kitchen has it in advance." : "Cocina adapta la propuesta a celíacos y a intolerantes a la lactosa. Si es otra alergia, dime cuál y la anoto en la reserva para que cocina la tenga antes de que lleguéis." };
    if (/\bninos?\b|\bninas?\b|\bbebes?\b|\bpeques?\b|\bcarros?\b|\bkids?\b|children|\bbab(y|ies)\b/.test(n) || RE_BEBE.test(n)) return { texto: POLITICA.bebe[lang] };
    // platos concretos antes que la carta entera
    const platos = PLATOS.filter(it => it.re.test(n));
    if (platos.length && platos.length <= 4) return { texto: (en ? "Yes, it's on the menu:\n" : "Sí, está en la carta:\n") + platos.map(it => lineaPlato(it, lang)).join("\n") };
    const grupo = /postres?\b|desserts?|\bdulces?\b/.test(n) ? ["postre", en ? "Desserts" : "Postres"] : /pescados?\b|\bfish\b/.test(n) ? ["pescado", en ? "Fish" : "Pescados"] : /\bcarnes?\b|\bmeat\b/.test(n) ? ["carne", en ? "Meat" : "Carnes"] : null;
    if (grupo) return { texto: grupo[1] + (en ? " on the menu right now:\n" : " que hay ahora en carta:\n") + PLATOS.filter(it => it[grupo[0]]).map(it => lineaPlato(it, lang)).join("\n") };
    if (/\bpan\b|\bbread\b/.test(n)) return { texto: en ? `Artisan bread is ${eur(D.PAN)} per person.` : `El servicio de pan artesano son ${eur(D.PAN)} por persona.` };
    if (/\bvinos?\b|\bwines?\b|bodega|maridaje|pairing|bebidas?|\bdrinks?\b|cerveza|\bbeers?\b|coctel|cocktail/.test(n)) return { texto: en ? "There's a wine list with less common labels at accessible prices. I don't have it here with prices; the team will show it to you at the table. Drinks are not included in the tasting menu." : "Hay una carta de vinos con referencias poco comerciales y precios asequibles. No la tengo aquí con precios; os la enseñan en sala. En el menú degustación las bebidas van aparte." };
    if (/\bbonos?\b|regal|\bgift|voucher/.test(n)) return { texto: en ? `Yes, there are gift vouchers for a lunch or dinner. You can buy and personalise them here: ${BONOS}` : `Sí, hay bonos regalo personalizables para una comida o una cena. Se compran aquí: ${BONOS}` };
    if (/grupos?\b|cumple|celebra|evento|despedida|empresa|privad|\bgroups?\b|\bparty\b|birthday|company/.test(n)) return { texto: en ? `Up to ${MAX_PERSONAS} people I can take the booking right here. From 7 it's a group request that the team arranges directly: I take your details and pass them on. If it's a celebration, tell me and I'll note it.` : `Hasta ${MAX_PERSONAS} personas te dejo yo la reserva. A partir de 7 es una solicitud de grupo que organiza directamente el equipo: te tomo los datos y se lo paso. Si es una celebración, dímelo y lo anoto.` };
    if (/telefono|llamar|\bnumero\b|\bphone\b|\bcall\b/.test(n)) return { texto: en ? `The phone number is ${TELEFONO}. They take calls from Tuesday to Sunday, 10:30 to 13:30, and also from 20:00 to 21:00 on Thursday, Friday and Saturday.` : `El teléfono es el ${TELEFONO}. Lo atienden de martes a domingo de 10:30 a 13:30, y los jueves, viernes y sábados también de 20:00 a 21:00.` };
    if (/cuanto (cuesta|sale|vale|es)|precio medio|por persona|por cabeza|how much|price range|\bprecios?\b|\bcaro\b|\bbarato\b|expensive/.test(n)) { const ps = PLATOS.filter(it => !it.postre).map(it => it.p); return { texto: en ? `À la carte, dishes go from ${eur(Math.min(...ps))} to ${eur(Math.max(...ps))} and desserts are ${eur(8)}. The tasting menu is ${eur(M.precio)}, drinks not included.` : `A la carta los platos van de ${eur(Math.min(...ps))} a ${eur(Math.max(...ps))} y los postres cuestan ${eur(8)}. El menú degustación son ${eur(M.precio)}, bebidas aparte.` }; }
    if (/\bchefs?\b|cociner|quien(es)? (sois|lleva|cocina)|duen[oa]s?\b|\bowners?\b|who (is|are|runs)/.test(n)) return { texto: en ? "AL Margen is run by chefs Adrián Leonelli and Pablo Valdearcos. Both come from fine dining: Adrián worked at Martín Berasategui and Mugaritz and led Nerua for three years, and Pablo trained at Nerua and the Basque Culinary Center." : "AL Margen lo llevan los chefs Adrián Leonelli y Pablo Valdearcos. Los dos vienen de la alta cocina: Adrián pasó por Martín Berasategui y Mugaritz y dirigió Nerua tres años, y Pablo se formó en Nerua y en el Basque Culinary Center." };
    if (/para llevar|a domicilio|recoger|take ?away|take ?out|delivery|glovo|just ?eat|uber/.test(n)) return noLoSe(g, t);
    if (/tarjeta|bizum|efectivo|\bpagar\b|\bcard\b|\bcash\b|\bpay\b/.test(n)) return noLoSe(g, t);
    if (/\bperr|mascota|\bdogs?\b|\bpets?\b/.test(n)) return noLoSe(g, t);
    if (/terraza|terrace|outside|outdoor/.test(n)) return noLoSe(g, t);
    if (/medias? racion|half portion|\bwifi\b|silla de ruedas|wheelchair|accesib/.test(n)) return noLoSe(g, t);
    if (RE_CARTA.test(n)) return cartaGeneral(g);
    const gracias = /^ ?(vale |ok |perfecto |genial |great |perfect )?((muchas |mil )?gracias|thanks?( you)?( very much| a lot| so much)?|cheers)\b/.test(n);
    const vale = /^ ?(ok|okay|vale|perfecto|genial|great|perfect|estupendo|de acuerdo) ?$/.test(n);
    if (gracias || (vale && (g.cerrado || !g.iniciada))) return { texto: g.cerrado ? (en ? "Thank you! See you soon." : "¡A vosotros! Nos vemos pronto.") : (en ? "You're welcome!" : "¡A ti!"), cortesia: true };
    return null;
  }

  // ---------- conversación ----------
  function nuevoEstado() {
    return { lang: null, paso: null, iniciada: false, finde: false, ofrecerDias: null, personas: null, ninos: 0, fecha: null, hora: null, horaPedida: null, servicio: null, nombre: null, peticiones: [], peticionesVistas: false, notas: [], preguntas: [], avisos: {}, fallos: {}, mapa: null, cerrado: false, cancelada: false, recordado: false, asistencia: false, espera: null, atencion: false };
  }
  function siguiente(g) {
    if (!g.personas) return g.paso === "personasMas" ? "personasMas" : "personas";
    if (!g.fecha) return "fecha";
    if (g.hora == null) return "hora";
    if (!g.nombre) return "nombre";
    if (!g.peticionesVistas) return g.peticiones.some(p => p.pendiente) ? "alergia" : "peticiones";
    return "confirmar";
  }
  const petTxt = (g, lang) => [...g.peticiones.filter(p => !p.pendiente).map(p => p[lang]), ...g.notas];
  function resumen(g) {
    const en = g.lang === "en", lang = en ? "en" : "es";
    const l = [`📅 ${cap(fechaBonita(g.fecha.d, lang))}`, `🕘 ${hhmm(g.hora)}`, `👥 ${personasTxt(g.personas, lang)}` + (g.ninos ? (en ? ` (${g.ninos} ${g.ninos === 1 ? "child" : "children"})` : ` (${g.ninos} ${g.ninos === 1 ? "niño" : "niños"})`) : ""), `🙋 ${g.nombre}`];
    const p = petTxt(g, lang); if (p.length) l.push(`📝 ${p.join(" · ")}`);
    return l.join("\n");
  }
  const fraseReserva = (g, lang) => lang === "en" ? `table for ${g.personas} on ${fechaBonita(g.fecha.d, "en")} at ${hhmm(g.hora)}` : `mesa para ${g.personas} el ${fechaBonita(g.fecha.d, "es")} a las ${hhmm(g.hora)}`;

  function pregunta(g) {
    const en = g.lang === "en", lang = en ? "en" : "es", rep = (g.fallos[g.paso] || 0) > 0;
    switch (g.paso) {
      case "personas":
        g.mapa = { "Somos más": "#mas", "More than 6": "#mas" };
        return { texto: rep ? (en ? "Sorry, I didn't get that. How many of you will be coming? Just the number is fine." : "No te he entendido bien. ¿Cuántos vais a ser? Me vale con el número.") : (en ? "How many of you will be coming?" : "¿Cuántos vais a ser?"), opciones: ["2", "3", "4", "5", "6", en ? "More than 6" : "Somos más"] };
      case "personasMas":
        return { texto: en ? "How many exactly? From 7 people the team arranges the booking directly; I'll take your details and pass them on." : "¿Cuántos exactamente? A partir de 7 la reserva la organiza directamente el equipo; yo te tomo los datos y se lo paso." };
      case "fecha": {
        const dias = g.ofrecerDias || proximosDias(4, g.servicio); g.ofrecerDias = null;
        g.mapa = {}; const ops = dias.map(d => { const e = etiquetaDia(d, lang); g.mapa[e] = "#fecha:" + iso(d); return e; });
        const finde = g.finde; g.finde = false;
        return { texto: finde ? (g.servicio === "cena" ? (en ? "Friday or Saturday?" : "¿Viernes o sábado?") : (en ? "Friday, Saturday or Sunday?" : "¿Viernes, sábado o domingo?")) : rep ? (en ? "I didn't catch the day. You can say “tomorrow”, “Saturday” or “12 October”." : "No he pillado el día. Puedes decirme «mañana», «el sábado» o «el 12 de octubre».") : (en ? "Which day suits you?" : "¿Qué día os viene bien?"), opciones: ops };
      }
      case "hora": {
        const d = g.fecha.d, k = diasHasta(d), nd = DIAS[lang][d.getDay()];
        let l = turnos(d, g.servicio); if (!l.length) l = turnos(d);
        const dos = l[0] < TARDE && l[l.length - 1] >= TARDE;
        let texto;
        if (rep) texto = en ? "What time would you like? You can type “14:30” or tap one of the slots." : "¿A qué hora os viene bien? Puedes escribir «14:30» o pulsar un turno.";
        else if (dos) texto = en ? `What time? ${k === 0 ? "Today" : "On " + nd} there are tables ${fraseTurnos(l, "en")}.` : `¿A qué hora? ${k === 0 ? "Hoy" : "El " + nd} hay mesa ${fraseTurnos(l, "es")}.`;
        else texto = en ? `What time? These are the ${l[0] < TARDE ? "lunch" : "dinner"} slots ${k === 0 ? "today" : "on " + nd}:` : `¿A qué hora? Estos son los turnos de ${l[0] < TARDE ? "comida" : "cena"} ${k === 0 ? "de hoy" : "del " + nd}:`;
        return { texto, opciones: l.map(hhmm) };
      }
      case "nombre":
        return { texto: rep ? (en ? "I just need a name for the booking." : "Solo me falta un nombre para la reserva.") : (en ? "What name shall I put the booking under?" : "¿A nombre de quién la dejo?") };
      case "peticiones":
        g.mapa = { "Nada, gracias": "#nada", "Nothing, thanks": "#nada" };
        return { texto: en ? "Anything the team should know? Allergies, a celebration, whether you'd like the tasting menu…" : "¿Algo que deba saber el equipo? Alergias, una celebración, si queréis el menú degustación…", opciones: en ? ["Nothing, thanks", "We'd like the tasting menu", "There's an allergy", "It's a birthday", "One of us is vegetarian"] : ["Nada, gracias", "Queremos el menú degustación", "Hay una alergia", "Es un cumpleaños", "Uno es vegetariano"] };
      case "alergia":
        return { texto: en ? "Which food is the allergy to? I'll note it for the kitchen." : "¿A qué alimento es la alergia? Lo anoto para cocina." };
      default:
        g.mapa = { "Sí, envíala": "#si", "Yes, send it": "#si", "Cambiar la hora": "#hora", "Change the time": "#hora", "Cambiar el día": "#dia", "Change the day": "#dia", "Añadir una nota": "#nota", "Add a note": "#nota" };
        return { texto: (en ? "Here's the summary:\n\n" : "Te lo resumo:\n\n") + resumen(g) + (en ? "\n\nShall I send it to the team like this?" : "\n\n¿La envío así al equipo?"), opciones: en ? ["Yes, send it", "Change the time", "Change the day", "Add a note"] : ["Sí, envíala", "Cambiar la hora", "Cambiar el día", "Añadir una nota"] };
    }
  }

  function extraer(g, t, n, atajo) {
    const x = { peticiones: [] };
    if (atajo) { if (atajo.startsWith("#fecha:")) x.fecha = { d: deIso(atajo.slice(7)) }; return x; }
    let r = n;
    // en el paso del nombre, «Domingo Pérez» es un nombre y no un día
    const soloNombre = g.paso === "nombre" && !/\d/.test(n) && !/cambi|mejor|change|better|\ba las\b/.test(n);
    if (!soloNombre) {
      const h = parseHora(r, g.paso); if (h) { x.hora = h.min; x.horaLiteral = RE_H_RELOJ.test(r); r = h.resto; }
      const f = parseFecha(r, g.paso); if (f) { x.fecha = f; r = f.resto || r; }
      const p = parsePersonas(r, g.paso, g.paso === "peticiones" || g.paso === "alergia"); if (p) x.personas = p;
      // el servicio se deduce de la hora solo si es un turno que existe algún día: «a las 17:00» no dice nada
      if (x.hora != null) { if (TODOS.includes(x.hora)) x.servicio = x.hora >= TARDE ? "cena" : "comida"; }
      else if (RE_CENA.test(n)) x.servicio = "cena";
      else if (RE_COMIDA.test(n) && !/alergi|allerg|no puede comer/.test(n)) x.servicio = "comida";
    }
    const nom = parseNombre(t, g.paso); if (nom) { x.nombre = nom.nombre; x.nombreDebil = !!nom.debil; }
    x.peticiones = parsePeticiones(n, t, g.paso);
    return x;
  }

  // Por qué una hora pedida no se puede anotar, mirando los turnos de ese día (o todos, si aún no hay día)
  function sinTurno(g, m, l, lang) {
    const en = lang === "en", com = l.filter(z => z < TARDE), cen = l.filter(z => z >= TARDE), ult = l[l.length - 1];
    const ese = !g.fecha ? "" : diasHasta(g.fecha.d) === 0 ? (en ? " today" : " hoy") : (en ? " that day" : " ese día");
    if (m < l[0]) return en ? `The first table I can book${ese} is at ${hhmm(l[0])}.` : `La primera mesa que puedo anotar${ese} es a las ${hhmm(l[0])}.`;
    if (m > ult) return en ? `The last booking${ese} is at ${hhmm(ult)}.` : `La última reserva${ese} es a las ${hhmm(ult)}.`;
    if (com.length && cen.length && m > com[com.length - 1] && m < cen[0]) return en ? `There's no service at ${hhmm(m)}. The last lunch table is at ${hhmm(com[com.length - 1])} and the first dinner table at ${hhmm(cen[0])}.` : `A las ${hhmm(m)} no hay servicio. Para comer, la última mesa es a las ${hhmm(com[com.length - 1])}, y para cenar, la primera a las ${hhmm(cen[0])}.`;
    return en ? `Tables go every quarter of an hour, so there's no slot at ${hhmm(m)}.` : `Las mesas van de cuarto en cuarto de hora y a las ${hhmm(m)} no hay turno.`;
  }

  // Aplica lo entendido al estado y devuelve las frases que hay que decirle al cliente antes de seguir
  function aplicar(g, x) {
    const en = g.lang === "en", lang = en ? "en" : "es", pre = [], hecho = [];
    if (x.servicio) g.servicio = x.servicio;
    if (x.personas) {
      const p = x.personas.total;
      if (p != null && p > 0) {
        g.personas = p; hecho.push("personas");
        if (p > MAX_PERSONAS) { g.avisos.grupo = `Solicitud de grupo (${p} personas): el motor online llega hasta ${MAX_PERSONAS}`; pre.push(en ? `For ${p} people it's a group request, and the team arranges those directly. I'll take your details and pass them on.` : `Para ${p} personas es una solicitud de grupo y la organiza directamente el equipo. Te tomo los datos y se lo paso.`); }
        else delete g.avisos.grupo;
      }
      if (x.personas.ninos) { g.ninos = x.personas.ninos; g.avisos.ninos = "Vienen niños: avisado de que no se admiten carros ni sillas de bebé"; pre.push(POLITICA.bebe[lang]); }
    }
    if (x.fecha) {
      if (x.fecha.finde) { g.fecha = null; g.finde = true; g.ofrecerDias = proximosDias(9, g.servicio).filter(d => [5, 6, 0].includes(d.getDay())).slice(0, 3); }
      else {
        const d = x.fecha.d;
        if (!SERVICIOS[d.getDay()]) { g.fecha = null; g.ofrecerDias = [mas(d, -1), mas(d, 1)].filter(z => diasHasta(z) >= 0 && turnos(z, g.servicio).length); pre.push(en ? "We're closed on Mondays." : "Los lunes cerramos."); }
        else if (diasHasta(d) === 0 && !turnos(d).length) { g.fecha = null; pre.push(en ? "It's too late for me to book a table for today." : "Para hoy ya no me queda ningún turno."); }
        else {
          g.fecha = { iso: iso(d), d }; hecho.push("fecha");
          if (diasHasta(d) > MAX_DIAS) { g.avisos.plazo = "Fuera del plazo de reserva online (unos tres meses)"; pre.push(en ? "Bookings normally open about three months ahead. I'll note it anyway and the team will tell you if they can hold it." : "Las reservas se abren con unos tres meses de antelación. Te la dejo anotada igualmente y el equipo te dice si ya puede bloquearla."); } else delete g.avisos.plazo;
          if (g.hora != null && x.hora == null) { g.horaPedida = g.hora; g.hora = null; }
        }
      }
    }
    if (x.hora != null) { g.horaPedida = x.hora; g.hora = null; }
    // día que no da cenas, o servicio de hoy que ya ha pasado
    if (g.fecha && g.servicio === "cena" && !SERVICIOS[g.fecha.d.getDay()].cena) {
      const nd = plural(DIAS[lang][g.fecha.d.getDay()], lang);
      pre.push(en ? `On ${nd} we only serve lunch. Dinner is on Thursday, Friday and Saturday.` : `Los ${nd} solo damos comidas. Cenas hay jueves, viernes y sábado.`);
      g.fecha = null; g.hora = null; g.ofrecerDias = proximosDias(3, "cena");
      const i = hecho.indexOf("fecha"); if (i >= 0) hecho.splice(i, 1);
    } else if (g.fecha && g.servicio && !turnos(g.fecha.d, g.servicio).length && turnos(g.fecha.d).length) {
      if (x.hora == null) pre.push(g.servicio === "comida" ? (en ? "It's too late for lunch today, but there are still dinner tables." : "Para comer hoy ya no llego, pero para cenar sí quedan turnos.") : (en ? "There are no dinner tables left for today." : "Para cenar hoy ya no queda turno."));
      g.servicio = null;
    }
    if (g.horaPedida != null) {
      const m = g.horaPedida, l = g.fecha ? turnos(g.fecha.d) : TODOS;
      if (l.includes(m)) { if (g.fecha) { g.hora = m; g.horaPedida = null; if (x.hora != null) hecho.push("hora"); } }
      else if (l.length) { g.horaPedida = null; g.hora = null; pre.push(sinTurno(g, m, l, lang)); }
    }
    if (x.nombre) { g.nombre = x.nombre; hecho.push("nombre"); }
    for (const p of x.peticiones) {
      const i = g.peticiones.findIndex(q => q.id === p.id);
      if (i >= 0) { if (p.id === "alergia" && !p.pendiente && !g.peticiones[i].pendiente && g.peticiones[i].alergenos.length) { const a = [...new Set([...g.peticiones[i].alergenos, ...p.alergenos])]; p.alergenos = a; p.es = "Alergia o intolerancia: " + lista(a); p.en = "Allergy or intolerance: " + lista(a.map(z => ALERGENO_EN[z]), "and"); } if (!(p.pendiente && !g.peticiones[i].pendiente)) g.peticiones[i] = p; }
      else g.peticiones.push(p);
      if (p.pendiente) continue;
      hecho.push("peticion");
      if (p.id === "alergia") {
        g.avisos.alergia = p.es;
        const adaptable = p.alergenos.length > 0 && p.alergenos.every(a => a === "gluten" || a === "lactosa");
        pre.push((adaptable ? (en ? "Noted for the kitchen: they can adapt the menu for that." : "Anotado para cocina, que adapta la propuesta sin problema.") : (en ? "Noted for the kitchen. Please remind the staff as well when you arrive." : "Anotado para cocina. Recordádselo también al equipo de sala al llegar."))
          + (p.alergenos.includes("frutos secos") ? (en ? " Careful with the leek with hollandaise: it has hazelnut." : " Ojo con el puerro con holandesa, que lleva avellana.") : ""));
      }
      else if (p.id === "vegetal" && p.vegano) { g.avisos.vegano = "Vegano en la mesa: avisado de que cocina no puede atenderlo"; pre.push(POLITICA.vegano[lang] + (en ? " I'll note it so the team knows." : " Lo dejo anotado para que el equipo lo sepa.")); }
      else if (p.id === "vegetal") pre.push(en ? "Noted: the kitchen adapts the menu for vegetarians." : "Anotado: cocina adapta la propuesta a dieta vegetariana.");
      else if (p.id === "bebe") pre.push(POLITICA.bebe[lang]);
      else if (p.id === "menu") pre.push(en ? "Noted. The tasting menu is served to the whole table." : "Anotado. El menú degustación se sirve a mesa completa.");
      else if (p.id === "perro" || p.id === "zona" || p.id === "accesible") pre.push(en ? "Noted. The team will confirm it." : "Anotado. El equipo os lo confirma.");
      else pre.push(en ? "Noted." : "Anotado.");
    }
    if (x.peticiones.length && !g.peticiones.some(p => p.pendiente)) g.peticionesVistas = true;
    // acuse de lo entendido: solo si venían varios datos juntos o si la hora se ha interpretado («a las 2» → 14:00)
    const partes = []; let acuse = "";
    if (hecho.includes("personas") && g.personas <= MAX_PERSONAS) partes.push(en ? `table for ${g.personas}` : `mesa para ${g.personas}`);
    if (hecho.includes("fecha")) partes.push((en ? "on " : "el ") + fechaBonita(g.fecha.d, lang));
    if (hecho.includes("hora")) partes.push((en ? "at " : "a las ") + hhmm(g.hora));
    if (partes.length >= 2 || (hecho.includes("hora") && !x.horaLiteral)) acuse = (en ? "Got it: " : "Anotado: ") + partes.join(" ") + ".";
    else if (hecho.includes("nombre") && !partes.length) acuse = en ? `Thanks, ${g.nombre.split(" ")[0]}.` : `Gracias, ${g.nombre.split(" ")[0]}.`;
    return { pre: [...new Set(pre)], hecho, acuse };
  }

  function cerrar(g, pre) {
    const en = g.lang === "en", n1 = g.nombre.split(" ")[0];
    g.cerrado = true; g.paso = null;
    g.mapa = { "Ver el recordatorio": "#recordatorio", "See the reminder": "#recordatorio" };
    const cuerpo = en
      ? `All set, ${n1}! I've passed your booking to the AL Margen team ✅\n\nAs soon as they validate it you'll get the confirmation right here. The day before I'll write to you to confirm you're still coming.`
      : `¡Listo, ${n1}! He pasado tu reserva al equipo de AL Margen ✅\n\nEn cuanto la validen te llega aquí mismo la confirmación. El día antes te escribo para confirmar que seguís viniendo.`;
    return { texto: (pre.length ? pre.join(" ") + "\n\n" : "") + cuerpo, ficha: ficha(g), opciones: en ? ["See the reminder", "See the menu", "How to get there"] : ["Ver el recordatorio", "Ver la carta", "Cómo llegar"] };
  }
  function recordatorio(g) {
    const en = g.lang === "en", n1 = g.nombre.split(" ")[0], mismoDia = diasHasta(g.fecha.d) <= 0;
    g.espera = "asistencia"; g.recordado = true;
    return {
      sistema: mismoDia ? (en ? "Simulation · a few hours before the booking" : "Simulación · unas horas antes de la reserva") : (en ? "Simulation · the day before the booking" : "Simulación · el día antes de la reserva"),
      texto: en ? `Hi ${n1} 👋 This is AL Margen, just confirming your table for ${mismoDia ? "today" : "tomorrow"}: ${personasTxt(g.personas, "en")} at ${hhmm(g.hora)}. Are you still coming?` : `Hola, ${n1} 👋 Te escribo de AL Margen para confirmar la mesa de ${mismoDia ? "hoy" : "mañana"}: ${personasTxt(g.personas, "es")} a las ${hhmm(g.hora)}. ¿Seguís viniendo?`,
      opciones: en ? ["Yes, we'll be there", "Change the time", "I need to cancel"] : ["Sí, allí estaremos", "Cambiar la hora", "Tengo que cancelar"], ficha: ficha(g),
    };
  }
  function cancelar(g) {
    const en = g.lang === "en";
    g.cancelada = true; g.espera = null; g.paso = null;
    return { texto: en ? "Cancelled. Thanks for letting us know in time: the table is now free for someone else. See you next time!" : "Cancelada. Gracias por avisar con tiempo: la mesa queda libre para otra gente. ¡Hasta la próxima!", ficha: ficha(g), opciones: en ? ["Book another table"] : ["Reservar otra mesa"] };
  }

  const RE_SI = /^ ?(si+|vale|ok|okay|perfecto|correcto|todo bien|todo correcto|eso es|adelante|confirm\w*|enviala|envia\w*|claro|genial|de acuerdo|yes|yep|yeah|sure|great|perfect|correct|that'?s (right|fine|correct|it)|send it|go ahead|looks good|all good)\b/;
  const RE_HUMANO = /hablar con (una |alguna |un )?(persona|humano|alguien|encargad|responsable|camarer)|con una persona|un humano|que me llamen|llamadme|llamame|speak (to|with)|talk to|a real person|\bhuman\b|call me/;
  const RE_CANCELAR = /\bcancel|\banula|ya no (podemos|vamos|puedo|podre)|no vamos a poder|no podemos ir|no podremos ir|can'?t make it/;

  function responder(g, entrada) {
    const t = limpiar(entrada);
    const n = " " + norm(t).replace(/[¿?¡!,;()«»"]/g, " ").replace(/\s+/g, " ").trim() + " ";
    const atajo = (g.mapa && g.mapa[t]) || null; g.mapa = null;
    if (!atajo) idioma(g, n); else if (!g.lang) g.lang = "es";
    const en = g.lang === "en";
    const esPregunta = /[?¿]/.test(t);

    // una reserva ya cancelada no se reabre: si quiere otra, se empieza de cero
    let reinicio = false;
    if (g.cancelada) { const lang = g.lang; Object.assign(g, nuevoEstado(), { lang }); reinicio = true; }
    const fin = r => { if (reinicio) r.reinicio = true; return r; };
    const conPaso = r => { // tras contestar una duda, retoma la pregunta que estaba pendiente
      if (g.cerrado || !g.iniciada) { if (!r.opciones && !g.cerrado && !r.cortesia) r.opciones = en ? ["Book a table", "See the menu"] : ["Reservar mesa", "Ver la carta"]; if (g.cerrado) delete r.opciones; if (g.cerrado && r.pendiente) r.ficha = ficha(g); return fin(r); }
      g.paso = siguiente(g); const q = pregunta(g);
      return fin({ texto: r.texto + "\n\n" + q.texto, opciones: q.opciones });
    };

    // mensaje del día antes para confirmar la asistencia (simulado)
    if (g.cerrado && (atajo === "#recordatorio" || /recordatorio|reminder/.test(n))) return recordatorio(g);
    if (g.espera === "asistencia") {
      if (RE_CANCELAR.test(n)) return cancelar(g);
      if (RE_SI.test(n) || /alli estaremos|iremos|we'?ll be there|still coming|por supuesto|of course/.test(n)) {
        g.asistencia = true; g.espera = null;
        return { texto: en ? `Perfect! We'll be waiting for you at ${hhmm(g.hora)} at ${DIRECCION}. If anything comes up, just write to me here.` : `¡Perfecto! Os esperamos a las ${hhmm(g.hora)} en ${DIRECCION}. Si surge algo, escríbeme por aquí.`, ficha: ficha(g) };
      }
    }
    if (RE_HUMANO.test(n)) {
      g.atencion = true;
      const r = { texto: en ? `Of course. I'll let the team know so someone writes to you here. If it's urgent, the phone is ${TELEFONO} (Tuesday to Sunday, 10:30 to 13:30).` : `Claro. Aviso al equipo para que te escriba alguien por aquí. Si corre prisa, el teléfono es el ${TELEFONO} (de martes a domingo, de 10:30 a 13:30).` };
      if (g.cerrado) { r.ficha = ficha(g); return r; }
      if (!g.iniciada) return fin(r);
      g.paso = siguiente(g); const q = pregunta(g);
      return { texto: r.texto + (en ? "\n\nMeanwhile, I can carry on with the booking. " : "\n\nMientras tanto, si quieres sigo con la reserva. ") + q.texto, opciones: q.opciones };
    }
    if (RE_CANCELAR.test(n) && !esPregunta) {
      if (g.cerrado) return cancelar(g);
      if (g.iniciada) { const lang = g.lang; Object.assign(g, nuevoEstado(), { lang }); return { texto: en ? "No problem, I'll leave it there. If you want a table another day, just tell me." : "Sin problema, lo dejo sin hacer. Si otro día queréis mesa, me dices.", opciones: en ? ["Book a table", "See the menu"] : OPCIONES_INICIO.slice(0, 2) }; }
    }

    // cambios pedidos con botón o con frase («cambiar la hora»)
    const cambio = atajo === "#hora" || /cambi\w* (la |de )?hora|otra hora|mas tarde|mas pronto|change the time|another time|different time|\blater\b|\bearlier\b|we'?ll be late/.test(n) ? "hora"
      : atajo === "#dia" || /cambi\w* (el |de )?dia|otro dia|change the (day|date)|another day|different day/.test(n) ? "fecha"
      : /cambi\w* (las |de |el numero de )?personas|change the (number|party)/.test(n) ? "personas"
      : atajo === "#nota" || /anadir (una )?nota|add a note/.test(n) ? "nota" : null;

    const x = RE_HORARIO.test(n) && !RE_RESERVA.test(n.replace(/se puede (cenar|comer)/, " ")) ? { peticiones: [] } : extraer(g, t, n, atajo);
    const fuerte = x.hora != null || x.fecha || x.personas || (x.nombre && !x.nombreDebil) || x.peticiones.length > 0;
    const quiereReserva = RE_RESERVA.test(n);

    // dudas: carta, horario, dirección… (sin perder el hilo de la reserva)
    if (!atajo && !cambio && (!fuerte || (esPregunta && !quiereReserva && !x.personas && x.hora == null && !(x.nombre && !x.nombreDebil)))) {
      const yaContestando = g.paso === "peticiones" || g.paso === "alergia";
      const f = yaContestando && !esPregunta ? null : faq(g, n, t);
      if (f) return conPaso(f);
    }
    if (!g.iniciada && !g.cerrado) {
      if (!fuerte && !quiereReserva && !atajo) {
        if (/^ ?(hola|buenas|buenos dias|buenas tardes|buenas noches|hey|hi|hello|good (evening|afternoon|morning)|ey|kaixo)\b/.test(n)) return fin({ texto: en ? "Hi! I can book you a table or tell you about the menu and opening hours. What do you need?" : "¡Hola! Te reservo mesa o te cuento la carta y el horario. ¿Qué necesitas?", opciones: en ? ["Book a table", "See the menu", "Opening hours and address"] : OPCIONES_INICIO });
        return fin({ texto: en ? "I can help you with a booking, the menu or the opening hours. What do you need?" : "Te ayudo con una reserva, con la carta o con el horario. ¿Qué necesitas?", opciones: en ? ["Book a table", "See the menu", "Opening hours and address"] : OPCIONES_INICIO });
      }
      g.iniciada = true;
    }

    const pasoAntes = g.paso;
    // respuestas propias de cada paso
    if (atajo === "#mas" || (pasoAntes === "personas" && !x.personas && /\bmas\b|more/.test(n))) { g.paso = "personasMas"; return fin(pregunta(g)); }
    if (cambio === "hora" && x.hora == null) { g.hora = null; g.horaPedida = null; g.espera = null; if (!x.servicio) g.servicio = null; }
    if (cambio === "fecha" && !x.fecha) { g.horaPedida = g.hora; g.hora = null; g.fecha = null; }
    if (cambio === "personas" && !x.personas) g.personas = null;
    if (cambio === "nota" && !x.peticiones.length) { g.peticionesVistas = false; g.paso = "peticiones"; return { texto: en ? "Sure, tell me what to add." : "Claro, dime qué añado." }; }

    const { pre, hecho, acuse } = aplicar(g, x);
    let entendido = hecho.length > 0 || !!cambio || pre.length > 0 || !!x.fecha || x.hora != null || !!x.servicio;

    if (pasoAntes === "peticiones" || pasoAntes === "alergia") {
      const nada = atajo === "#nada" || /^ ?(no|nada|ninguna?|nothing|none|nope|no thanks|no gracias|todo bien|asi esta bien|nada mas)\b/.test(n);
      if (nada && !x.peticiones.length) { g.peticiones = g.peticiones.filter(p => !p.pendiente); g.peticionesVistas = true; entendido = true; }
      else if (!x.peticiones.length && !hecho.length && !cambio) { g.notas.push(t); g.peticionesVistas = true; pre.push(en ? "Noted, I'll pass it on as you wrote it." : "Anotado, se lo paso tal cual."); entendido = true; }
    }
    if (g.cerrado && pasoAntes == null && !hecho.length && !cambio) {
      // mensaje suelto tras la reserva: no se pierde, va al equipo
      if (quiereReserva && /otra|another|nueva|new/.test(n)) { const lang = g.lang; Object.assign(g, nuevoEstado(), { lang, iniciada: true }); reinicio = true; g.paso = "personas"; return fin(pregunta(g)); }
      g.notas.push(t);
      return { texto: en ? "I'll pass that on to the team just as you wrote it." : "Se lo paso al equipo tal cual para que lo tengan en cuenta.", ficha: ficha(g) };
    }

    const paso = siguiente(g);
    if (paso === "confirmar") {
      if (g.cerrado) {
        g.paso = null;
        return { texto: (pre.length ? pre.join(" ") + "\n\n" : "") + (en ? `Change noted ✅ It now stands as: ${fraseReserva(g, "en")}, under ${g.nombre}. I've passed it on to the team.` : `Cambio anotado ✅ Queda así: ${fraseReserva(g, "es")}, a nombre de ${g.nombre}. Se lo paso al equipo.`), ficha: ficha(g) };
      }
      if (pasoAntes === "confirmar" && !hecho.length && !cambio) {
        if (atajo === "#si" || RE_SI.test(n) || /esta bien|todo bien|asi\b/.test(n)) return fin(cerrar(g, []));
        if (/^ ?(no|nop|not)\b/.test(n)) { g.mapa = { "Cambiar la hora": "#hora", "Change the time": "#hora", "Cambiar el día": "#dia", "Change the day": "#dia", "Añadir una nota": "#nota", "Add a note": "#nota" }; return { texto: en ? "No problem. What shall I change?" : "Sin problema. ¿Qué cambio?", opciones: en ? ["Change the time", "Change the day", "Add a note"] : ["Cambiar la hora", "Cambiar el día", "Añadir una nota"] }; }
        g.fallos.confirmar = (g.fallos.confirmar || 0) + 1;
      }
    } else if (paso === pasoAntes && !entendido) g.fallos[paso] = (g.fallos[paso] || 0) + 1;
    g.paso = paso;
    const q = pregunta(g);
    const antes = [acuse, ...pre].filter(Boolean);
    let texto = (antes.length ? antes.join(" ") + "\n\n" : "") + q.texto;
    if (paso === "confirmar" && pasoAntes === "confirmar" && (g.fallos.confirmar || 0) > 0 && !antes.length) texto = (en ? "Shall I send it like this or change something?\n\n" : "¿La envío así o cambio algo?\n\n") + resumen(g);
    if (!antes.length && pasoAntes == null && paso === "personas" && !atajo) texto = (en ? "Sure! " : "¡Claro! ") + q.texto;
    let opciones = q.opciones;
    if ((g.fallos[paso] || 0) >= 2 && opciones) opciones = [...opciones, en ? "Talk to a person" : "Hablar con una persona"];
    return fin({ texto, opciones });
  }

  // ---------- ficha de la reserva (lo que recibe el restaurante, siempre en español) ----------
  function clasificar(g) {
    const avisos = Object.values(g.avisos);
    const k = g.fecha ? diasHasta(g.fecha.d) : 99;
    let prioridad = "Normal", orden = 2;
    if (k <= 0) { prioridad = "Hoy"; orden = 0; }
    else if (avisos.length || g.atencion || g.preguntas.length) { prioridad = "Alta"; orden = 1; }
    return { prioridad, orden, atencion: g.atencion };
  }
  function ficha(g) {
    const avisos = Object.values(g.avisos);
    if (g.atencion) avisos.push("Pide hablar con una persona");
    const pets = petTxt(g, "es");
    const estado = g.cancelada ? "Cancelada por el cliente: mesa libre" : g.asistencia ? "El cliente confirma que viene" : "Pendiente de validar por AL Margen";
    const campos = [];
    if (g.fecha) campos.push(["Día", cap(fechaBonita(g.fecha.d, "es"))]);
    if (g.hora != null) campos.push(["Hora", hhmm(g.hora) + (g.hora < TARDE ? " (comida)" : " (cena)")]);
    if (g.personas) campos.push(["Personas", String(g.personas) + (g.ninos ? ` (${g.ninos} ${g.ninos === 1 ? "niño" : "niños"})` : "")]);
    campos.push(["A nombre de", g.nombre || "Sin dato"], ["Teléfono", "El del WhatsApp del cliente"]);
    if (pets.length) campos.push(["Peticiones", pets.join("\n")]);
    if (g.preguntas.length) campos.push(["Preguntas sin contestar", g.preguntas.join("\n")]);
    if (g.lang === "en") campos.push(["Idioma", "Inglés"]);
    campos.push(["Estado", estado]);
    if (avisos.length) campos.push(["Avisos", avisos.join(" · ")]);
    return { campos, clasificacion: clasificar(g), datos: { fecha: g.fecha ? g.fecha.iso : null, fechaTexto: g.fecha ? cap(fechaBonita(g.fecha.d, "es")) : "", hora: g.hora != null ? hhmm(g.hora) : "", minutos: g.hora, servicio: g.hora == null ? "" : g.hora < TARDE ? "comida" : "cena", personas: g.personas, ninos: g.ninos, nombre: g.nombre, peticiones: pets, preguntas: g.preguntas.slice(), avisos, lang: g.lang || "es", cancelada: g.cancelada, asistencia: g.asistencia, recordado: g.recordado } };
  }
  // Mensaje que le llegaría al cliente por WhatsApp cuando el restaurante cambia el estado en el panel
  function mensajeCliente(s) {
    const d = s.ficha.datos, en = d.lang === "en"; if (!d.fecha) return "";
    const f = fechaBonita(deIso(d.fecha), en ? "en" : "es"), n1 = (d.nombre || "").split(" ")[0];
    if (s.estado === "confirmada") return en ? `✅ Booking confirmed, ${n1}: ${f} at ${d.hora}, ${personasTxt(d.personas, "en")}. See you at ${DIRECCION}!` : `✅ Reserva confirmada, ${n1}: ${f} a las ${d.hora}, ${personasTxt(d.personas, "es")}. ¡Os esperamos en ${DIRECCION}!`;
    if (s.estado === "sinhueco") {
      const sv = SERVICIOS[deIso(d.fecha).getDay()] || {}, l = (d.minutos < TARDE ? sv.comida : sv.cena || sv.comida || []).filter(z => z !== d.minutos);
      if (!l.length) return "";
      const alt = l.find(z => z > d.minutos) || l[l.length - 1];
      return en ? `Sorry, ${n1}, we have no table left at ${d.hora}. Would ${hhmm(alt)} work for you?` : `Lo sentimos, ${n1}: a las ${d.hora} ya no nos queda mesa. ¿Os iría bien a las ${hhmm(alt)}?`;
    }
    if (s.estado === "cancelada" && !d.cancelada) return en ? `Your booking for ${f} at ${d.hora} has been cancelled. Sorry for the trouble.` : `Tu reserva del ${f} a las ${d.hora} queda cancelada. Disculpa las molestias.`;
    return "";
  }
  // Cuando una mesa queda libre, mensaje que saldría a quien pidió ese turno y se quedó sin sitio
  function mensajeEspera(s) {
    const d = s.ficha.datos; if (!d.fecha || !d.hora || (s.estado !== "cancelada" && !d.cancelada)) return "";
    return `Hola 👋 Te escribo de AL Margen: ha quedado libre una mesa para ${d.personas} el ${fechaBonita(deIso(d.fecha), "es")} a las ${d.hora}. ¿La quieres? Contéstame «sí» y te la dejo reservada.`;
  }

  // ---------- almacenamiento en el dispositivo ----------
  const KEY = "almargen.reservas";
  const ESTADOS = [["nuevo", "Pendiente de validar"], ["confirmada", "Confirmada"], ["sinhueco", "Sin hueco: proponer otra hora"], ["cancelada", "Cancelada"], ["noshow", "No se presentó"]];
  function cargar() { try { return JSON.parse(localStorage.getItem(KEY) || "[]"); } catch (e) { return []; } }
  function guardar(l) { try { localStorage.setItem(KEY, JSON.stringify(l)); return true; } catch (e) { return false; } }
  function anadir(s) { const l = cargar(); l.unshift(s); guardar(l); return s; }
  function actualizar(id, fn) { const l = cargar(); const i = l.findIndex(x => x.id === id); if (i < 0) return null; fn(l[i]); guardar(l); return l[i]; }
  function borrar(filtro) { guardar(cargar().filter(s => !filtro(s))); }
  const nuevoId = () => "r" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

  function simular(mensajes, recibida, estado) {
    const g = nuevoEstado();
    const conversacion = [{ quien: "asistente", texto: APERTURA }];
    let f = null;
    for (const m of mensajes) { conversacion.push({ quien: "cliente", texto: m }); const r = responder(g, m); if (r.sistema) conversacion.push({ quien: "sistema", texto: r.sistema }); conversacion.push({ quien: "asistente", texto: r.texto }); if (r.ficha) f = r.ficha; }
    return { id: nuevoId(), fecha: recibida.toISOString(), estado: estado || "nuevo", ejemplo: true, ficha: f || ficha(g), conversacion };
  }
  function ejemplos() {
    const real = new Date(), H = 3600e3, h = ms => new Date(real.getTime() - ms);
    // los ejemplos se generan como si fueran las 10:00, para que siempre haya reservas «para hoy» si hoy se abre
    reloj = new Date(real.getFullYear(), real.getMonth(), real.getDate(), 10, 0, 0).getTime();
    let l = [];
    try {
      const [d0, d1, d2] = proximosDias(3);
      const es = d => `${d.getDate()} de ${MESES.es[d.getMonth()]}`, enf = d => `${MESES.en[d.getMonth()]} ${d.getDate()}`;
      // a cenar solo los días que dan cenas; el resto de ejemplos van a mediodía, que hay todos los días que abren
      const cena = d => !!SERVICIOS[d.getDay()].cena;
      l = [
        simular([`Hola, quería una mesa para 4 el ${es(d0)} a las 14:30`, "Laura Gómez", "Queremos el menú degustación", "Sí, envíala"], h(1.5 * H), "confirmada"),
        simular([`Hi, could I book a table for 2 on ${enf(d0)} at ${cena(d0) ? "9pm" : "2pm"} please?`, "Emma Clarke", "Nothing, thanks", "Yes, send it", "See the reminder", "Yes, we'll be there"], h(3 * H), "confirmada"),
        simular([`Buenas! somos 9 de una comida de empresa el ${es(d1)} sobre las 14:30`, "a nombre de Jorge Navarro", "Nada, gracias", "Sí, envíala"], h(0.4 * H)),
        simular(["Reservar mesa", "3", etiquetaDia(d1, "es"), "14:15", "Ane Etxebarria", "Hay una alergia", "uno es celíaco", "Sí, envíala"], h(5 * H)),
        simular([`mesa para 2 el ${es(d1)} a las ${cena(d1) ? "21:00" : "15:00"}, soy Iker`, "nada", "sí", "Ver el recordatorio", "Tengo que cancelar"], h(9 * H), "cancelada"),
        simular([`¿Tenéis mesa para 5 el ${es(d2)} a las 15:00? Vamos con un bebé`, "Marta Ibáñez", "¿se puede aparcar cerca?", "Nada, gracias", "Sí, envíala"], h(20 * H)),
      ];
    } finally { reloj = null; }
    return l;
  }
  // Los ejemplos se regeneran cada día para que sus fechas sigan siendo «hoy» y «mañana»
  function sembrar() {
    let l = cargar();
    const marca = iso(new Date());
    let previa = null; try { previa = localStorage.getItem("almargen.sembrado"); } catch (e) {}
    if (previa === marca) return l;
    if (previa && !l.some(s => s.ejemplo)) { try { localStorage.setItem("almargen.sembrado", marca); } catch (e) {} return l; }
    l = [...l.filter(s => !s.ejemplo), ...ejemplos()];
    guardar(l);
    try { localStorage.setItem("almargen.sembrado", marca); } catch (e) {}
    return l;
  }
  function restaurarEjemplos() { const l = cargar().filter(s => !s.ejemplo); guardar([...l, ...ejemplos()]); }

  global.Margen = { APERTURA, OPCIONES_INICIO, ESTADOS, DIRECCION, TELEFONO, SERVICIOS, nuevoEstado, responder, ficha, clasificar, mensajeCliente, mensajeEspera, turnos, proximosDias, etiquetaDia, fechaBonita, personasTxt, hhmm, iso, deIso, hoy, cargar, guardar, anadir, actualizar, borrar, nuevoId, sembrar, restaurarEjemplos, ejemplos, _reloj: v => { reloj = v; } };
})(typeof window !== "undefined" ? window : globalThis);
