// Asistente de reservas de El Zorro Gastro Bar: motor por reglas (sin IA de pago ni servidor) que recoge personas, día,
// hora, nombre y peticiones con las mismas reglas que el formulario de su web, y deja la reserva lista para confirmar.
// Contesta en español o en inglés según escriba el cliente. Lo usan index.html y panel.html.
(function (global) {
  "use strict";
  const D = global.ZORRO_DATOS;
  const DIRECCION = "Carrer de Catalunya, 45, bajo, 46520 Puerto de Sagunto";
  const TELEFONO = "697 423 024";
  const MAPS = "https://maps.app.goo.gl/LcyCddn7hbrGrqQ78";
  // Mismas reglas que el formulario de elzorrogroup.es: horario por día (0 = domingo, en minutos desde las 00:00),
  // turnos cada media hora hasta una hora antes del cierre, 7 días de antelación y 20 comensales como tope.
  const PERIODOS = { 0: null, 1: [1140, 1380], 2: [1140, 1380], 3: [1140, 1440], 4: [1140, 1440], 5: [1140, 1500], 6: [1140, 1500] };
  const TURNOS = [1170, 1200, 1230, 1260, 1290, 1320, 1350];
  const MAX_DIAS = 7, MAX_PERSONAS = 20, GRUPO_GRANDE = 8;
  const APERTURA = "¡Hola! 👋 Soy el asistente de El Zorro Gastro Bar, en el Puerto de Sagunto.\n\nTe reservo mesa en un momento y te resuelvo dudas de la carta o del horario. ¿Qué necesitas?\n\nYou can also write to me in English 🇬🇧";
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

  // Turnos que se pueden pedir un día concreto (si es hoy, solo los que quedan por delante)
  function turnos(d) {
    const p = PERIODOS[d.getDay()]; if (!p) return [];
    let l = TURNOS.filter(s => s >= p[0] && s <= p[1] - 60);
    if (iso(d) === iso(hoy())) { const a = ahora(), m = a.getHours() * 60 + a.getMinutes(); l = l.filter(s => s > m + 15); }
    return l;
  }
  function proximosDias(k) {
    const l = []; let d = hoy();
    for (let i = 0; i < 14 && l.length < k; i++, d = mas(d, 1)) if (turnos(d).length) l.push(d);
    return l;
  }
  function etiquetaDia(d, lang) {
    const k = diasHasta(d);
    if (k === 0) return lang === "en" ? "Today" : "Hoy";
    if (k === 1) return lang === "en" ? "Tomorrow" : "Mañana";
    return `${cap(DIAS[lang === "en" ? "en" : "es"][d.getDay()])} ${d.getDate()}`;
  }

  // ---------- idioma ----------
  const RE_EN = /\b(table|book|booking|reservation|reserve|people|guests?|tonight|tomorrow|today|please|hello|hi|hey|thanks|thank you|open|opening|where|what|when|how|we are|we're|kids|children|yes|yeah|nothing|none|allergy|allergic|birthday|terrace|outside|cancel|change|name|english|do you|can i|can we|i'd|would like|monday|tuesday|wednesday|thursday|friday|saturday|sunday|two|three|four|five|six|wings|fries|the|for)\b/g;
  const RE_ES = /\b(mesa|reserv\w*|personas?|hola|buenas|gracias|quiero|quisiera|queria|somos|manana|hoy|noche|carta|donde|cuanto|cuando|que|para|el|la|los|las|si|nada|alergia|cumple\w*|terraza|cancelar|cambiar|nombre|teneis|hay|lunes|martes|miercoles|jueves|viernes|sabado|domingo|dos|tres|cuatro|cinco|seis|alitas|patatas|una?|de)\b/g;
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
  const num = s => (/^\d+$/.test(s) ? +s : PAL[s] || UNO[s]);

  // Solo abren de noche, así que «a las 9» son las 21:00
  const RE_H_RELOJ = /\b(\d{1,2})(?:[:.]|\s?h\s?)(\d{2})\b/;
  const RE_H_LAS = new RegExp("\\b(?:a|sobre|hacia|para|de|desde) las? " + NUM + "(?: y (media|cuarto)| (menos cuarto))?\\b");
  const RE_H_SUFIJO = /\b(\d{1,2})\s?(?:pm|p\.m\.?|h|hrs|horas)\b/;
  const RE_H_AT = new RegExp("\\bat (?:around |about )?" + NUM + "(?:\\s?(?:pm|o'?clock))?(?: (thirty|fifteen))?\\b");
  const RE_H_HALF = new RegExp("\\bhalf past " + NUM + "\\b");
  const RE_H_SOLA = new RegExp("^" + NUM + "(?: y (media|cuarto)| (menos cuarto)| (thirty|fifteen))?$");
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
    if (h >= 1 && h <= 11) h += 12; else if (h === 0 || h === 12) h = 24;
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
    if ((m = n.match(/\b(hoy|esta noche|esta tarde|tonight|today|this evening)\b/))) return sal(base, m[0]);
    const sinManana = n.replace(/\b(por|de) la manana\b/g, " ");
    if ((m = sinManana.match(/\bmanana\b|\btomorrow\b/))) return { d: mas(base, 1), resto: sinManana.replace(m[0], " ") };
    if ((m = n.match(RE_F_DMES))) { const r = conMes(+m[1], MES_N[m[2]], m[0]); if (r) return r; }
    if ((m = n.match(RE_F_MESD))) { const r = conMes(+m[2], MES_N[m[1]], m[0]); if (r) return r; }
    if ((m = n.match(RE_F_BARRA)) && +m[2] >= 1 && +m[2] <= 12) { const r = conMes(+m[1], +m[2] - 1, m[0]); if (r) return r; }
    if ((m = n.match(RE_F_SEMANA))) {
      let k = (SEMANA[m[1]] - base.getDay() + 7) % 7;
      if (k === 0 && PERIODOS[base.getDay()] && !turnos(base).length) k = 7;
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

  const ALERGENOS = [["gluten", /gluten|celiac|coeliac|trigo|wheat/], ["lactosa", /lactos|lacteos|dairy|leche\b|\bmilk/], ["frutos secos", /frutos secos|nuez|nueces|almendra|avellana|\bnuts?\b/], ["cacahuete", /cacahuete|\bmani\b|peanut/], ["marisco", /marisco|crustaceo|shellfish|gambas?\b|langostino|prawn/], ["pescado", /pescado|\bfish\b/], ["huevo", /huevo|\beggs?\b/], ["soja", /\bsoja\b|\bsoy\b/], ["sésamo", /sesamo|sesame/], ["mostaza", /mostaza|mustard/]];
  const ALERGENO_EN = { gluten: "gluten", lactosa: "lactose", "frutos secos": "nuts", cacahuete: "peanut", marisco: "shellfish", pescado: "fish", huevo: "egg", soja: "soy", "sésamo": "sesame", mostaza: "mustard" };
  function parsePeticiones(n, t, paso) {
    const l = [];
    if (paso === "alergia" || /alergi|allerg|intoleran|celiac|coeliac|sin gluten|gluten.?free|sin lactosa|lactose.?free|no puede comer|can'?t eat/.test(n)) {
      const a = ALERGENOS.filter(([, re]) => re.test(n)).map(([k]) => k);
      if (a.length) l.push({ id: "alergia", alergenos: a, es: "Alergia o intolerancia: " + lista(a), en: "Allergy or intolerance: " + lista(a.map(x => ALERGENO_EN[x]), "and") });
      else if (paso === "alergia") l.push({ id: "alergia", alergenos: [], es: "Alergia: " + t, en: "Allergy: " + t });
      else l.push({ id: "alergia", alergenos: [], pendiente: true });
    }
    if (/vegan/.test(n)) l.push({ id: "vegetal", es: "Vegano en la mesa", en: "Vegan guest" });
    else if (/vegetarian/.test(n)) l.push({ id: "vegetal", es: "Vegetariano en la mesa", en: "Vegetarian guest" });
    if (/\btronas?\b|high ?chairs?/.test(n)) l.push({ id: "trona", es: "Trona", en: "High chair" });
    if (/carrito|cochecito|carro de bebe|stroller|\bpram\b|buggy|pushchair/.test(n)) l.push({ id: "carrito", es: "Vienen con carrito de bebé", en: "Coming with a pushchair" });
    const tarta = /\btartas?\b|\bcake\b/.test(n);
    if (/cumple|birthday/.test(n)) l.push({ id: "celebracion", es: "Celebran un cumpleaños" + (tarta ? " (traen tarta)" : ""), en: "Birthday celebration" + (tarta ? " (bringing a cake)" : "") });
    else if (/aniversario|anniversary/.test(n)) l.push({ id: "celebracion", es: "Celebran un aniversario", en: "Anniversary" });
    else if (tarta || /celebra|despedida|sorpresa|surprise/.test(n)) l.push({ id: "celebracion", es: "Celebración" + (tarta ? " (traen tarta)" : ""), en: "Celebration" + (tarta ? " (bringing a cake)" : "") });
    if (/terraza|terrace|outside|outdoors?|mesa fuera|sentar\w* fuera|al aire libre/.test(n)) l.push({ id: "zona", es: "Prefieren terraza", en: "Terrace preferred" });
    else if (/\bdentro\b|interior|\binside\b|indoors?/.test(n)) l.push({ id: "zona", es: "Prefieren interior", en: "Indoor table preferred" });
    if (/silla de ruedas|wheelchair|movilidad reducida/.test(n)) l.push({ id: "accesible", es: "Silla de ruedas: mesa accesible", en: "Wheelchair: accessible table" });
    if (/\bperr[oa]s?\b|\bperrit[oa]s?\b|\bdogs?\b|mascota/.test(n)) l.push({ id: "perro", es: "Vienen con perro (confirmar si puede estar)", en: "Coming with a dog (to be confirmed)" });
    return l;
  }

  // ---------- preguntas frecuentes ----------
  const RE_HORARIO = /horario|abris|abrir|abierto|cerrais|cerrado|a que hora (abr|cerr|empez)|hasta que hora|opening (hours|times)|what time do you|are you open|when do you (open|close)|do you open|\bopen (on|today|tonight)\b|closing time/;
  const RE_DONDE = /donde estais|donde esta|donde os|direccion|como llegar|como se llega|como llego|ubicacion|\bmapa\b|google maps|where are you|where is|address|location|directions|how (do i|do we|to) get/;
  const RE_CARTA = /\bcarta\b|\bmenu\b|que teneis|que hay (de|para) (comer|cenar|picar)|\bprecios\b|what do you (have|serve)|\bfood\b|que se come|platos/;
  const RE_RESERVA = /reserv|\bmesa\b|\bbook|\btable\b|\bcenar\b|\bdinner\b|\bhueco\b|\bsitio\b/;
  const precio = (it, lang) => it.p != null ? eur(it.p) : it.pt ? it.pt[lang] : "";
  function lineaPlato(sec, it, lang) {
    if (sec.id === "alitas") return `• ${lang === "en" ? "Wings" : "Alitas"} ${it.n[lang]}: ${it.d[lang]}`;
    return `• ${it.n[lang]} · ${precio(it, lang)}` + (it.d ? `\n   ${cap(it.d[lang])}` : "");
  }
  function cartaGeneral(g) {
    const en = g.lang === "en", lang = en ? "en" : "es";
    const desde = s => { const ps = s.items.map(i => i.p).filter(p => p != null); return eur(Math.min(...ps)); };
    const l = D.CARTA.map(s => `${s.icono} ${s.n[lang]} · ${s.nota ? s.nota[lang] : (en ? "from " : "desde ") + desde(s)}`);
    return { texto: (en ? "This is what's on the menu right now:\n\n" : "Esto es lo que hay ahora mismo en la carta:\n\n") + l.join("\n") + (en ? "\n\nWhich one would you like to see?" : "\n\n¿Qué te apetece ver?"), opciones: D.CARTA.map(s => s.n[lang]) };
  }
  function cartaSeccion(g, s) {
    const en = g.lang === "en", lang = en ? "en" : "es";
    const cab = `${s.icono} ${s.n[lang]}` + (s.nota ? ` (${s.nota[lang]})` : "");
    return { texto: cab + "\n\n" + s.items.map(i => lineaPlato(s, i, lang)).join("\n") + (en ? "\n\nIf anyone at the table has an allergy, tell me and I'll add it to the booking." : "\n\nSi hay alguna alergia en la mesa, dímelo y lo anoto en la reserva.") };
  }
  function faqHorario(g, n) {
    const en = g.lang === "en", lang = en ? "en" : "es"; let m, texto;
    const f = parseFecha(n, null);
    const d = f && f.d ? f.d : (m = n.match(RE_F_SEMANA)) ? mas(hoy(), (SEMANA[m[1]] - hoy().getDay() + 7) % 7) : null;
    if (d) {
      const p = PERIODOS[d.getDay()], nd = DIAS[lang][d.getDay()];
      if (!p) texto = en ? "We're closed on Sundays. The rest of the week we open at 19:00." : "Los domingos cerramos. El resto de la semana abrimos a las 19:00.";
      else { const l = TURNOS.filter(s => s <= p[1] - 60); texto = en ? `On ${nd}s we open from ${hhmm(p[0])} to ${hhmm(p[1])}, and I can book tables from ${hhmm(l[0])} to ${hhmm(l[l.length - 1])}.` : `Los ${nd === "sábado" ? "sábados" : nd} abrimos de ${hhmm(p[0])} a ${hhmm(p[1])} y cojo reservas de ${hhmm(l[0])} a ${hhmm(l[l.length - 1])}.`; }
    } else texto = en
      ? "We only open in the evening:\n• Monday and Tuesday: 19:00 to 23:00\n• Wednesday and Thursday: 19:00 to 00:00\n• Friday and Saturday: 19:00 to 01:00\n• Sunday: closed\n\nTables can be booked from 19:30 to 22:30 (until 22:00 on Monday and Tuesday)."
      : "Abrimos solo por la noche:\n• Lunes y martes: 19:00 a 23:00\n• Miércoles y jueves: 19:00 a 00:00\n• Viernes y sábado: 19:00 a 01:00\n• Domingo: cerrado\n\nLas reservas van de 19:30 a 22:30 (lunes y martes, hasta las 22:00).";
    return { texto };
  }
  const faqDonde = g => ({ texto: g.lang === "en" ? `We're at ${DIRECCION}.\nDirections: ${MAPS}` : `Estamos en ${DIRECCION}.\nCómo llegar: ${MAPS}` });
  // Lo que no está publicado en su web no se inventa: se apunta para que conteste el equipo
  function noLoSe(g, t) {
    if (!g.preguntas.includes(t)) g.preguntas.push(t);
    return { texto: g.lang === "en" ? "I'm not sure about that and I'd rather not guess. I've passed your question to the team and they'll answer you here." : "Eso no lo sé seguro y prefiero no inventármelo. Le dejo la pregunta apuntada al equipo y te contestan por aquí.", pendiente: true };
  }
  function faq(g, n, t) {
    const en = g.lang === "en", lang = en ? "en" : "es";
    const horario = RE_HORARIO.test(n), donde = RE_DONDE.test(n);
    if (horario && donde) return { texto: faqHorario(g, "").texto + "\n\n" + faqDonde(g).texto };
    if (horario) return faqHorario(g, n);
    if (donde) return faqDonde(g);
    if (/aparca|parking|\bpark\b/.test(n)) return noLoSe(g, t);
    // platos concretos antes que secciones enteras
    const platos = []; for (const s of D.CARTA) for (const it of s.items) if (it.re.test(n)) platos.push([s, it]);
    const sec = D.CARTA.find(s => s.re.test(n));
    if (platos.length && platos.length <= 4) {
      const l = platos.map(([s, it]) => lineaPlato(s, it, lang));
      const alitas = platos.some(([s]) => s.id === "alitas") ? "\n" + D.CARTA[0].nota[lang] : "";
      return { texto: (en ? "Yes, it's on the menu:\n" : "Sí, está en la carta:\n") + l.join("\n") + alitas };
    }
    if (sec) return cartaSeccion(g, sec);
    if (/coctel|cocktail|\bcopas?\b|bebidas?|cerveza|\bvinos?\b|drinks?|\bbeers?\b|\bwine|gin ?tonic|mojito|spritz|sangria/.test(n)) return { texto: en ? "There are craft cocktails and draught beer. I don't have the drinks list with prices here yet; you'll see it at the bar." : "Hay cócteles artesanales y cerveza de grifo. La carta de bebidas con precios todavía no la tengo aquí; os la enseñan en el local." };
    if (/vegetarian|vegan/.test(n)) return { texto: en ? "On the menu without meat or fish I can see the boletus & truffle croquettes, the stuffed jalapeños and several loaded fries. For a strict diet the kitchen should confirm it, so I'll note it on the booking." : "Sin carne ni pescado veo en la carta las croquetas de boletus y trufa, los jalapeños rellenos y varias patatas. Si es una dieta estricta conviene que lo confirme cocina, así que lo anoto en la reserva." };
    if (/alergen|allergen|gluten|celiac|coeliac|lactos|alergi|allerg/.test(n)) return { texto: en ? "I don't have the allergen sheet for each dish, so I won't tell you something that might not be safe. What I do know: the Justin Beaber wings have peanut butter. Tell me the allergy and I'll add it to the booking for the kitchen." : "No tengo la ficha de alérgenos de cada plato y no te quiero decir algo que no sea seguro. Lo que sí sé: las alitas Justin Beaber llevan mantequilla de cacahuete. Dime la alergia y la anoto en la reserva para que cocina lo tenga en cuenta." };
    if (/terraza|terrace|outside|outdoor/.test(n)) return { texto: en ? "Yes, El Zorro is mostly about its terrace. If you'd like to sit there I'll note it as a preference on the booking." : "Sí, El Zorro es sobre todo terraza. Si queréis sentaros ahí lo anoto como preferencia en la reserva." };
    if (/hamburgues|burger/.test(n)) return noLoSe(g, t);
    if (/para llevar|a domicilio|recoger|take ?away|take ?out|delivery|glovo|just ?eat|uber/.test(n)) return noLoSe(g, t);
    if (/tarjeta|bizum|efectivo|\bpagar\b|\bcard\b|\bcash\b|\bpay\b/.test(n)) return noLoSe(g, t);
    if (/\bperr|mascota|\bdogs?\b|\bpets?\b/.test(n)) return noLoSe(g, t);
    if (/\btronas?\b|high ?chair/.test(n)) return { texto: en ? "I can't tell you how many high chairs they have, so I'll note it on the booking and the team will confirm it." : "No sé decirte cuántas tronas tienen, así que lo anoto en la reserva y el equipo te lo confirma." };
    if (/grupos?\b|cumple|celebra|evento|despedida|\bgroups?\b|\bparty\b|birthday/.test(n)) return { texto: en ? `Up to ${MAX_PERSONAS} people I can take the booking right here. For bigger groups the team arranges it directly, I just pass them your details.` : `Hasta ${MAX_PERSONAS} personas te dejo yo la reserva anotada. Para grupos más grandes lo organiza el equipo directamente y yo les paso tus datos.` };
    if (/telefono|llamar|\bnumero\b|\bphone\b|\bcall\b/.test(n)) return { texto: en ? `The phone number is ${TELEFONO}. They pick up from 19:00, when they open.` : `El teléfono es el ${TELEFONO}. Lo cogen a partir de las 19:00, cuando abren.` };
    if (/\bcomer\b|mediodia|\bcomida\b|almuerzo|brunch|desayun|\blunch\b|breakfast/.test(n)) return { texto: en ? "Right now we only open in the evening, from 19:00." : "Ahora mismo abrimos solo por la noche, a partir de las 19:00." };
    if (RE_CARTA.test(n)) return cartaGeneral(g);
    const gracias = /^ ?(vale |ok |perfecto |genial |great |perfect )?((muchas |mil )?gracias|thanks?( you)?( very much| a lot| so much)?|cheers)\b/.test(n);
    const vale = /^ ?(ok|okay|vale|perfecto|genial|great|perfect|estupendo|de acuerdo) ?$/.test(n);
    if (gracias || (vale && (g.cerrado || !g.iniciada))) return { texto: g.cerrado ? (en ? "Thank you! See you soon 🦊" : "¡A vosotros! Nos vemos pronto 🦊") : (en ? "You're welcome!" : "¡A ti!"), cortesia: true };
    return null;
  }

  // ---------- conversación ----------
  function nuevoEstado() {
    return { lang: null, paso: null, iniciada: false, finde: false, ofrecerDias: null, personas: null, ninos: 0, fecha: null, hora: null, horaPedida: null, nombre: null, peticiones: [], peticionesVistas: false, notas: [], preguntas: [], avisos: {}, fallos: {}, mapa: null, cerrado: false, cancelada: false, recordado: false, asistencia: false, espera: null, atencion: false, dijoInfantil: false };
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
        return { texto: en ? `How many exactly? Up to ${MAX_PERSONAS} I can book it right here.` : `¿Cuántos exactamente? Hasta ${MAX_PERSONAS} te la dejo anotada yo.` };
      case "fecha": {
        const dias = g.ofrecerDias || proximosDias(4); g.ofrecerDias = null;
        g.mapa = {}; const ops = dias.map(d => { const e = etiquetaDia(d, lang); g.mapa[e] = "#fecha:" + iso(d); return e; });
        const finde = g.finde; g.finde = false;
        return { texto: finde ? (en ? "Friday or Saturday?" : "¿Viernes o sábado?") : rep ?(en ? "I didn't catch the day. You can say “tomorrow”, “Saturday” or “12 October”." : "No he pillado el día. Puedes decirme «mañana», «el sábado» o «el 12 de octubre».") : (en ? "Which day suits you?" : "¿Qué día os viene bien?"), opciones: ops };
      }
      case "hora": {
        const l = turnos(g.fecha.d).map(hhmm), cuando = diasHasta(g.fecha.d) === 0 ? (en ? "today" : "hoy") : (en ? "on " : "el ") + DIAS[lang][g.fecha.d.getDay()];
        return { texto: rep ? (en ? "What time would you like? You can type “21:30” or tap one of the slots." : "¿A qué hora os viene bien? Puedes escribir «21:30» o pulsar un turno.") : (en ? `What time? These are the slots ${cuando}:` : `¿A qué hora? Estos son los turnos ${cuando === "hoy" ? "de hoy" : "d" + cuando}:`), opciones: l };
      }
      case "nombre":
        return { texto: rep ? (en ? "I just need a name for the booking." : "Solo me falta un nombre para la reserva.") : (en ? "What name shall I put the booking under?" : "¿A nombre de quién la dejo?") };
      case "peticiones":
        g.mapa = { "Nada, gracias": "#nada", "Nothing, thanks": "#nada" };
        return { texto: en ? "Anything the team should know? Allergies, a high chair, a celebration, a terrace table…" : "¿Algo que deba saber el equipo? Alergias, trona, una celebración, mesa en terraza…", opciones: en ? ["Nothing, thanks", "Terrace table", "We need a high chair", "It's a birthday", "There's an allergy"] : ["Nada, gracias", "Mesa en terraza", "Necesitamos trona", "Es un cumpleaños", "Hay una alergia"] };
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
    }
    const nom = parseNombre(t, g.paso); if (nom) { x.nombre = nom.nombre; x.nombreDebil = !!nom.debil; }
    x.peticiones = parsePeticiones(n, t, g.paso);
    return x;
  }

  // Aplica lo entendido al estado y devuelve las frases que hay que decirle al cliente antes de seguir
  function aplicar(g, x) {
    const en = g.lang === "en", lang = en ? "en" : "es", pre = [], hecho = [];
    if (x.personas) {
      const p = x.personas.total;
      if (p != null && p > 0) {
        g.personas = p; hecho.push("personas");
        if (p > MAX_PERSONAS) { g.avisos.grupo = `Grupo de ${p}: por encima del tope de ${MAX_PERSONAS} del formulario`; pre.push(en ? `For ${p} people the team arranges the booking directly, because tables need to be set up. I'll take your details and pass them on.` : `Para ${p} personas la reserva la organiza directamente el equipo, porque hay que montar mesas. Te tomo los datos y se lo paso.`); }
        else if (p >= GRUPO_GRANDE) g.avisos.grupo = `Grupo grande (${p})`; else delete g.avisos.grupo;
      }
      if (x.personas.ninos) g.ninos = x.personas.ninos;
      if (g.ninos && !g.dijoInfantil) { g.dijoInfantil = true; pre.push(en ? "For the little ones there's a kids' menu (nuggets with fries, mozzarella sticks…)." : "Para los peques hay menú infantil (nuggets con patatas, palitos de mozzarella…)."); }
    }
    if (x.fecha) {
      if (x.fecha.finde) { g.fecha = null; g.finde = true; g.ofrecerDias = proximosDias(8).filter(d => d.getDay() === 5 || d.getDay() === 6).slice(0, 2); }
      else {
        const d = x.fecha.d;
        if (!PERIODOS[d.getDay()]) { g.fecha = null; g.ofrecerDias = [mas(d, -1), mas(d, 1)].filter(z => diasHasta(z) >= 0 && turnos(z).length); pre.push(en ? "We're closed on Sundays." : "Los domingos cerramos."); }
        else if (diasHasta(d) === 0 && !turnos(d).length) { g.fecha = null; pre.push(en ? "It's too late for me to book a table for tonight, bookings close an hour before we shut." : "Para hoy ya no me da tiempo a dejarte mesa, las reservas se cierran una hora antes del cierre."); }
        else {
          g.fecha = { iso: iso(d), d }; hecho.push("fecha");
          if (diasHasta(d) > MAX_DIAS) { g.avisos.plazo = `Fuera del plazo de ${MAX_DIAS} días del formulario`; pre.push(en ? `Bookings normally open ${MAX_DIAS} days ahead. I'll note it anyway and the team will tell you if they can hold it.` : `Las reservas se abren con ${MAX_DIAS} días de antelación. Te la dejo anotada igualmente y el equipo te dice si ya puede bloquearla.`); } else delete g.avisos.plazo;
          if (g.hora != null && x.hora == null) { g.horaPedida = g.hora; g.hora = null; }
        }
      }
    }
    if (x.hora != null) { g.horaPedida = x.hora; g.hora = null; }
    if (g.horaPedida != null) {
      const m = g.horaPedida, l = g.fecha ? turnos(g.fecha.d) : TURNOS;
      if (l.includes(m)) { if (g.fecha) { g.hora = m; g.horaPedida = null; if (x.hora != null) hecho.push("hora"); } }
      else if (l.length) {
        g.horaPedida = null; g.hora = null;
        const ese = !g.fecha ? "" : diasHasta(g.fecha.d) === 0 ? (en ? " today" : " hoy") : (en ? " that day" : " ese día");
        const ult = l[l.length - 1], cierre = g.fecha ? (en ? " (we close at " : " (cerramos a las ") + hhmm(PERIODOS[g.fecha.d.getDay()][1]) + ")" : "";
        if (m < l[0]) pre.push(en ? `The first table I can book${ese} is at ${hhmm(l[0])}.` : `La primera mesa que puedo anotar${ese} es a las ${hhmm(l[0])}.`);
        else if (m > ult) pre.push(en ? `The last booking${ese} is at ${hhmm(ult)}${cierre}.` : `La última reserva${ese} es a las ${hhmm(ult)}${cierre}.`);
        else pre.push(en ? `Tables go every half hour, so there's no slot at ${hhmm(m)}.` : `Las mesas van cada media hora y a las ${hhmm(m)} no hay turno.`);
      }
    }
    if (x.nombre) { g.nombre = x.nombre; hecho.push("nombre"); }
    for (const p of x.peticiones) {
      const i = g.peticiones.findIndex(q => q.id === p.id);
      if (i >= 0) { if (p.id === "alergia" && !p.pendiente && !g.peticiones[i].pendiente && g.peticiones[i].alergenos.length) { const a = [...new Set([...g.peticiones[i].alergenos, ...p.alergenos])]; p.alergenos = a; p.es = "Alergia o intolerancia: " + lista(a); p.en = "Allergy or intolerance: " + lista(a.map(z => ALERGENO_EN[z]), "and"); } if (!(p.pendiente && !g.peticiones[i].pendiente)) g.peticiones[i] = p; }
      else g.peticiones.push(p);
      if (p.pendiente) continue;
      hecho.push("peticion");
      if (p.id === "alergia") { g.avisos.alergia = p.es; pre.push((en ? "Noted for the kitchen. Please remind the staff as well when you order." : "Anotado para cocina. Recordádselo también al equipo al pedir.") + (p.alergenos.some(a => a === "cacahuete" || a === "frutos secos") ? (en ? " Careful with the Justin Beaber wings: they have peanut butter." : " Ojo con las alitas Justin Beaber, que llevan mantequilla de cacahuete.") : "")); }
      else if (p.id === "zona") pre.push(en ? "I'll note the table preference; it depends on what's free that night." : "Anoto la preferencia de mesa; depende de lo que haya libre esa noche.");
      else if (p.id === "perro" || p.id === "trona") pre.push(en ? "Noted. The team will confirm it." : "Anotado. El equipo os lo confirma.");
      else pre.push(en ? "Noted." : "Anotado.");
    }
    if (x.peticiones.length && !g.peticiones.some(p => p.pendiente)) g.peticionesVistas = true;
    // acuse de lo entendido: solo si venían varios datos juntos o si la hora se ha interpretado («a las 9» → 21:00)
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
      ? `All set, ${n1}! I've sent your request to the El Zorro team ✅\n\nAs soon as they check it you'll get the confirmation right here. On the day I'll send you a reminder so it doesn't slip your mind.`
      : `¡Listo, ${n1}! He pasado tu solicitud al equipo de El Zorro ✅\n\nEn cuanto la revisen te llega aquí mismo la confirmación. El mismo día te mando un recordatorio para que no se os pase.`;
    return { texto: (pre.length ? pre.join(" ") + "\n\n" : "") + cuerpo, ficha: ficha(g), opciones: en ? ["See the reminder", "See the menu", "How to get there"] : ["Ver el recordatorio", "Ver la carta", "Cómo llegar"] };
  }
  function recordatorio(g) {
    const en = g.lang === "en", n1 = g.nombre.split(" ")[0];
    g.espera = "asistencia"; g.recordado = true;
    g.mapa = { "Llegaremos más tarde": "#hora", "We'll be late": "#hora" };
    return {
      sistema: en ? "Simulation · the day of the booking, around midday" : "Simulación · el día de la reserva, a mediodía",
      texto: en ? `Hi ${n1} 👋 This is El Zorro, just a reminder of your table tonight: ${personasTxt(g.personas, "en")} at ${hhmm(g.hora)}. Are you still coming?` : `Hola, ${n1} 👋 Te escribo de El Zorro para recordarte la mesa de esta noche: ${personasTxt(g.personas, "es")} a las ${hhmm(g.hora)}. ¿Seguís viniendo?`,
      opciones: en ? ["Yes, we'll be there", "We'll be late", "I need to cancel"] : ["Sí, allí estaremos", "Llegaremos más tarde", "Tengo que cancelar"], ficha: ficha(g),
    };
  }
  function cancelar(g) {
    const en = g.lang === "en";
    g.cancelada = true; g.espera = null; g.paso = null;
    return { texto: en ? "Cancelled. Thanks for letting us know in time, that way the team can give the table to someone else. See you next time!" : "Cancelada. Gracias por avisar con tiempo, así el equipo puede dar la mesa a otra gente. ¡Hasta la próxima!", ficha: ficha(g), opciones: en ? ["Book another table"] : ["Reservar otra mesa"] };
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
      if (g.cerrado || !g.iniciada) { if (!r.opciones && !g.cerrado && !r.cortesia) r.opciones = en ? ["Book a table", "See the menu"] : ["Reservar mesa", "Ver la carta"]; if (g.cerrado && r.pendiente) r.ficha = ficha(g); return fin(r); }
      g.paso = siguiente(g); const q = pregunta(g);
      return fin({ texto: r.texto + "\n\n" + q.texto, opciones: q.opciones });
    };

    // recordatorio del día de la reserva (simulado)
    if (g.cerrado && (atajo === "#recordatorio" || /recordatorio|reminder/.test(n))) return recordatorio(g);
    if (g.espera === "asistencia") {
      if (RE_CANCELAR.test(n)) return cancelar(g);
      if (RE_SI.test(n) || /alli estaremos|iremos|we'?ll be there|still coming|por supuesto|of course/.test(n)) {
        g.asistencia = true; g.espera = null;
        return { texto: en ? `Perfect! We'll be waiting for you at ${hhmm(g.hora)} at Carrer de Catalunya, 45. If anything comes up, just write to me here.` : `¡Perfecto! Os esperamos a las ${hhmm(g.hora)} en Carrer de Catalunya, 45. Si surge algo, escríbeme por aquí.`, ficha: ficha(g) };
      }
    }
    if (RE_HUMANO.test(n)) {
      g.atencion = true;
      const r = { texto: en ? `Of course. I'll let the team know so someone writes to you here. If it's urgent, the phone is ${TELEFONO} (from 19:00).` : `Claro. Aviso al equipo para que te escriba alguien por aquí. Si corre prisa, el teléfono es el ${TELEFONO} (a partir de las 19:00).` };
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

    const x = RE_HORARIO.test(n) && !RE_RESERVA.test(n) ? { peticiones: [] } : extraer(g, t, n, atajo);
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
        if (/^ ?(hola|buenas|buenos dias|buenas tardes|buenas noches|hey|hi|hello|good (evening|afternoon|morning)|ey)\b/.test(n)) return fin({ texto: en ? "Hi! I can book you a table or tell you about the menu and opening hours. What do you need?" : "¡Hola! Te reservo mesa o te cuento la carta y el horario. ¿Qué necesitas?", opciones: en ? ["Book a table", "See the menu", "Opening hours and address"] : OPCIONES_INICIO });
        return fin({ texto: en ? "I can help you with a booking, the menu or the opening hours. What do you need?" : "Te ayudo con una reserva, con la carta o con el horario. ¿Qué necesitas?", opciones: en ? ["Book a table", "See the menu", "Opening hours and address"] : OPCIONES_INICIO });
      }
      g.iniciada = true;
    }

    const pasoAntes = g.paso;
    // respuestas propias de cada paso
    if (atajo === "#mas" || (pasoAntes === "personas" && !x.personas && /\bmas\b|more/.test(n))) { g.paso = "personasMas"; return fin(pregunta(g)); }
    if (cambio === "hora" && x.hora == null) { g.hora = null; g.horaPedida = null; g.espera = null; }
    if (cambio === "fecha" && !x.fecha) { g.horaPedida = g.hora; g.hora = null; g.fecha = null; }
    if (cambio === "personas" && !x.personas) g.personas = null;
    if (cambio === "nota" && !x.peticiones.length) { g.peticionesVistas = false; g.paso = "peticiones"; return { texto: en ? "Sure, tell me what to add." : "Claro, dime qué añado." }; }

    const { pre, hecho, acuse } = aplicar(g, x);
    let entendido = hecho.length > 0 || !!cambio || pre.length > 0 || !!x.fecha || x.hora != null;

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

  // ---------- ficha de la reserva (lo que recibe el bar, siempre en español) ----------
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
    const estado = g.cancelada ? "Cancelada por el cliente" : g.asistencia ? "El cliente confirma que viene (recordatorio)" : "Pendiente de confirmar por El Zorro";
    const campos = [];
    if (g.fecha) campos.push(["Día", cap(fechaBonita(g.fecha.d, "es"))]);
    if (g.hora != null) campos.push(["Hora", hhmm(g.hora)]);
    if (g.personas) campos.push(["Personas", String(g.personas) + (g.ninos ? ` (${g.ninos} ${g.ninos === 1 ? "niño" : "niños"})` : "")]);
    campos.push(["A nombre de", g.nombre || "Sin dato"], ["Teléfono", "El del WhatsApp del cliente"]);
    if (pets.length) campos.push(["Peticiones", pets.join("\n")]);
    if (g.preguntas.length) campos.push(["Preguntas sin contestar", g.preguntas.join("\n")]);
    if (g.lang === "en") campos.push(["Idioma", "Inglés"]);
    campos.push(["Estado", estado]);
    if (avisos.length) campos.push(["Avisos", avisos.join(" · ")]);
    return { campos, clasificacion: clasificar(g), datos: { fecha: g.fecha ? g.fecha.iso : null, fechaTexto: g.fecha ? cap(fechaBonita(g.fecha.d, "es")) : "", hora: g.hora != null ? hhmm(g.hora) : "", minutos: g.hora, personas: g.personas, ninos: g.ninos, nombre: g.nombre, peticiones: pets, preguntas: g.preguntas.slice(), avisos, lang: g.lang || "es", cancelada: g.cancelada, asistencia: g.asistencia, recordado: g.recordado } };
  }
  // Mensaje que le llegaría al cliente por WhatsApp cuando el bar cambia el estado en el panel
  function mensajeCliente(s) {
    const d = s.ficha.datos, en = d.lang === "en"; if (!d.fecha) return "";
    const f = fechaBonita(deIso(d.fecha), en ? "en" : "es"), n1 = (d.nombre || "").split(" ")[0];
    if (s.estado === "confirmada") return en ? `✅ Booking confirmed, ${n1}: ${f} at ${d.hora}, ${personasTxt(d.personas, "en")}. See you at Carrer de Catalunya, 45!` : `✅ Reserva confirmada, ${n1}: ${f} a las ${d.hora}, ${personasTxt(d.personas, "es")}. ¡Os esperamos en Carrer de Catalunya, 45!`;
    if (s.estado === "sinhueco") { const l = TURNOS.filter(z => z !== d.minutos && z <= PERIODOS[deIso(d.fecha).getDay()][1] - 60), alt = l.find(z => z > d.minutos) || l[l.length - 1]; return en ? `Sorry, ${n1}, we have no table left at ${d.hora}. Would ${hhmm(alt)} work for you?` : `Lo sentimos, ${n1}: a las ${d.hora} ya no nos queda mesa. ¿Os iría bien a las ${hhmm(alt)}?`; }
    if (s.estado === "cancelada" && !d.cancelada) return en ? `Your booking for ${f} at ${d.hora} has been cancelled. Sorry for the trouble.` : `Tu reserva del ${f} a las ${d.hora} queda cancelada. Disculpa las molestias.`;
    return "";
  }

  // ---------- almacenamiento en el dispositivo ----------
  const KEY = "zorro.reservas";
  const ESTADOS = [["nuevo", "Pendiente de confirmar"], ["confirmada", "Confirmada"], ["sinhueco", "Sin hueco: proponer otra hora"], ["cancelada", "Cancelada"], ["noshow", "No se presentó"]];
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
      l = [
        simular([`Hola, quería una mesa para 4 el ${es(d0)} a las 21:30`, "Laura Gómez", "Nada, gracias", "Sí, envíala"], h(1.5 * H), "confirmada"),
        simular([`Hi, could I book a table for 2 on ${enf(d0)} at 8pm please?`, "Emma Clarke", "Nothing, thanks", "Yes, send it", "See the reminder", "Yes, we'll be there"], h(3 * H), "confirmada"),
        simular([`Buenas! somos 9 para un cumpleaños el ${es(d0)} sobre las 21, si puede ser en la terraza y traemos tarta`, "Carlos Peris", "Sí, envíala"], h(0.4 * H)),
        simular(["Reservar mesa", "3", etiquetaDia(d1, "es"), "22:00", "Vicent Soler", "Hay una alergia", "uno es celíaco", "Sí, envíala"], h(5 * H)),
        simular([`mesa para 5 el ${es(d1)}, 2 niños`, "20:00", "Marta Ibáñez", "Necesitamos trona", "¿se puede aparcar cerca?", "Sí, envíala"], h(20 * H)),
        simular([`Hola, somos 14 del club de pádel, ¿tenéis sitio el ${es(d2)} a las 21:00?`, "a nombre de Jorge Navarro", "Nada, gracias", "Sí, envíala"], h(26 * H)),
      ];
    } finally { reloj = null; }
    return l;
  }
  // Los ejemplos se regeneran cada día para que sus fechas sigan siendo «hoy» y «mañana»
  function sembrar() {
    let l = cargar();
    const marca = iso(new Date());
    let previa = null; try { previa = localStorage.getItem("zorro.sembrado"); } catch (e) {}
    if (previa === marca) return l;
    if (previa && !l.some(s => s.ejemplo)) { try { localStorage.setItem("zorro.sembrado", marca); } catch (e) {} return l; }
    l = [...l.filter(s => !s.ejemplo), ...ejemplos()];
    guardar(l);
    try { localStorage.setItem("zorro.sembrado", marca); } catch (e) {}
    return l;
  }
  function restaurarEjemplos() { const l = cargar().filter(s => !s.ejemplo); guardar([...l, ...ejemplos()]); }

  global.Zorro = { APERTURA, OPCIONES_INICIO, ESTADOS, DIRECCION, TELEFONO, PERIODOS, nuevoEstado, responder, ficha, clasificar, mensajeCliente, turnos, proximosDias, etiquetaDia, fechaBonita, personasTxt, hhmm, iso, deIso, hoy, cargar, guardar, anadir, actualizar, borrar, nuevoId, sembrar, restaurarEjemplos, ejemplos, _reloj: v => { reloj = v; } };
})(typeof window !== "undefined" ? window : globalThis);
