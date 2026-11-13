/* Asistente IA del Colegio Vizcaya: contesta al momento lo que sabe y pregunta a la IA lo demás. */
(function () {
  const $ = (s, c = document) => c.querySelector(s);
  const K = CV.chat;
  const fab = $("#chatFab"), panel = $("#chatPanel"), body = $("#chatBody"), chips = $("#chatChips");
  const form = $("#chatForm"), input = $("#chatInput"), send = $("#chatSend");
  const ia = new URLSearchParams(location.search).get("ia");
  CV.IA_URL = window.CV_IA_URL || (ia === "local" ? "http://localhost:8788/api/chat" : "https://colegio-vizcaya-ia.josugarciandia.workers.dev/api/chat");
  const historia = [];
  let abierto = false, saludado = false, ocupado = false;

  /* ---------- Normalización y detección de idioma ---------- */
  const norm = s => " " + String(s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/ñ/g, "n").replace(/[^a-z0-9]+/g, " ").trim() + " ";
  const EU = ["zer", "nola", "noiz", "non", "zenbat", "zein", "dago", "daude", "dira", "da", "dut", "duzu", "dute", "ditu", "dituzue", "naiz", "zara", "al", "ba", "bai", "ez", "eta", "edo", "kaixo", "eskerrik", "mila", "esker", "egun", "on", "mesedez", "nahi", "behar", "ikastetxe", "ikastetxea", "ikastetxeko", "ordutegia", "geltokia", "autobusik", "haurra", "nire", "semea", "alaba", "seme", "alabak", "zuen", "dauka", "daukat", "ditut", "hemen", "badago", "badu", "gabonetako", "oporrak", "noizko", "zertan", "urterekin", "ikasten", "egiten"];
  const EN = ["what", "when", "where", "how", "which", "who", "is", "are", "there", "the", "my", "son", "daughter", "child", "kids", "school", "do", "does", "can", "you", "your", "time", "hi", "hello", "thanks", "please", "from", "have", "any", "much", "about", "open", "lunch", "start"];
  const ES = ["que", "como", "cuando", "donde", "cuanto", "cuantos", "hay", "el", "la", "los", "las", "de", "del", "para", "por", "es", "son", "tiene", "tienen", "teneis", "mi", "hijo", "hija", "hijos", "colegio", "puedo", "quiero", "hola", "gracias", "a", "en", "con", "un", "una", "y", "o"];
  function idioma(txt) {
    const t = norm(txt).trim().split(" ");
    let eu = 0, en = 0, es = 0;
    t.forEach(w => {
      if (EU.includes(w)) eu++;
      if (EN.includes(w)) en++;
      if (ES.includes(w)) es++;
      if (/(tik|tzat|arekin|etako|ean|ko|ak|ek|ra|ri|an)$/.test(w) && w.length > 4 && !ES.includes(w) && !EN.includes(w)) eu += 0.35;
      if (/tx|tz|ts/.test(w)) eu += 0.25;
    });
    const max = Math.max(eu, en, es);
    if (max < 1) return CV.lang;
    if (eu === max) return "eu";
    if (en === max && en > es) return "en";
    return "es";
  }

  /* ---------- Motor de respuestas al momento ---------- */
  const tiene = (n, k) => n.includes(" " + k + " ") || (k.length >= 6 && n.includes(" " + k));
  function etapaDe(n) {
    for (const e of K.etapas) if (e.k.some(k => tiene(n, k))) {
      if (e.id === "inf" && K.etapas[0].k.some(k => tiene(n, k))) return "ei";
      return e.id;
    }
    return null;
  }
  // topónimos con declinación vasca: Getxotik, Santutxura, Leioako, Derion…
  const SUF = "(?:tik|etik|ra|era|rantz|ko|eko|rako|erako|n|an|ean|en|ri|ari|z)?";
  const tieneLugar = (n, k) => new RegExp(" " + k.replace(/ /g, " ") + SUF + " ").test(n);
  const raiz = w => { const m = w.match(/^(.{4,}?)(?:etik|tik|erako|rako|eko|ko|era|ra|ean|an|en|n)$/); return m ? m[1] : w; };
  const NO_LUGAR = ["autobus", "autobuses", "parada", "paradas", "linea", "lineas", "transporte", "geltoki", "geltokia", "autobusa", "autobusik", "school", "colegio", "where", "donde", "desde", "hasta", "there", "badago", "pasa", "pasar", "ruta", "rutas", "recorrido", "hospital", "estacion", "iglesia", "plaza", "campo", "museo", "ayuntamiento", "centro", "supermercado", "farmacia", "ambulatorio", "polideportivo"];
  function lugarDe(n, estricto) {
    const al = Object.keys(CV.alias).sort((a, b) => b.length - a.length).find(a => tieneLugar(n, a));
    if (al) return al;
    const palabras = n.trim().split(" ");
    if (estricto && palabras.length > 3) return null;
    // nombre que aparece en alguna parada (barrios, calles)
    for (const w0 of palabras.filter(w => w.length >= 5 && !NO_LUGAR.includes(w))) {
      for (const w of [w0, raiz(w0)]) {
        if (w.length < 4 || NO_LUGAR.includes(w)) continue;
        if (CV.buscarParadas(w).lineas.length) return w;
      }
    }
    return null;
  }
  function puntua(n) {
    const lista = [];
    const largo = n.trim().split(" ").length > 4;
    K.intents.forEach(it => {
      if (it.solo && largo) return;
      let s = 0;
      it.k.forEach(k => { if (tiene(n, k)) s += (k.includes(" ") ? 1.6 : 1); });
      if (!s) return;
      lista.push({ it, s: s * (it.p || 2) / 2 });
    });
    lista.sort((a, b) => b.s - a.s);
    let m = lista[0] || null;
    // «¿cuándo…?» con algo que está en el calendario: manda el calendario
    const cal = lista.find(x => x.it.id === "calendario");
    if (cal && m !== cal && / (cuando|noiz|when|que dia|que fecha|zein egun|what date) /.test(n)) m = cal;
    // «¿cuánto cuesta X?»: el verano tiene precios publicados; cualquier otro X lo decide la IA con el conocimiento completo
    if (m && m.it.id === "precio") {
      const otro = lista.find(x => x.it.id !== "precio" && !x.it.solo);
      if (otro) m = otro.it.id === "verano" ? otro : { ia: true };
    }
    return m;
  }
  const fmt = iso => { const [y, m, d] = iso.split("-").map(Number); return { d, m: m - 1, y }; };
  function fechaTxt(iso, lang) {
    const f = fmt(iso), u = CV.ui[lang];
    if (lang === "eu") return u.mesesL[f.m] + "ren " + f.d + "a";
    if (lang === "en") return f.d + " " + u.mesesL[f.m];
    return f.d + " de " + u.mesesL[f.m];
  }
  function rango(e, lang) {
    if (!e.f) return fechaTxt(e.d, lang);
    if (lang === "eu") return fechaTxt(e.d, lang) + "tik " + fechaTxt(e.f, lang).replace(/a$/, "") + "ra";
    if (lang === "en") return fechaTxt(e.d, lang) + " to " + fechaTxt(e.f, lang);
    return "del " + fechaTxt(e.d, lang) + " al " + fechaTxt(e.f, lang);
  }
  function respCalendario(n, lang) {
    const busca = (re) => CV.calendario.filter(e => re.test(e.es + " " + e.en));
    let ev = null;
    if (/ navidad| navidades| gabon| christmas/.test(n)) ev = busca(/Navidad/);
    else if (/ semana santa| pascua| aste santu| easter/.test(n)) ev = busca(/Semana Santa/);
    else if (/ carnaval| inauteri| carnival/.test(n)) ev = busca(/Carnaval/);
    else if (/ (empieza|comienza|inicio|empiezan|hasiera|hasten|start|starts|first day)/.test(n)) ev = busca(/Comienza el curso/);
    else if (/ (fin de curso|acaba|termina|terminan|ultimo dia|amaiera|amaitzen|last day|end of)/.test(n)) ev = busca(/Fin de curso/);
    else if (/ (puertas abiertas|ate ireki|open day)/.test(n)) ev = busca(/puertas abiertas/);
    else if (/ (fiestas del colegio|fiestas de colegio|ikastetxeko jai|school festival|school fair)/.test(n)) ev = busca(/Fiestas del Colegio/);
    else if (/ (festival de navidad|gabonetako jaialdi|christmas show|christmas concert)/.test(n)) ev = busca(/Festival de Navidad/);
    else if (/ (selectividad|eau|pau|acceso a la universidad|unibertsitatera sartzeko|university entrance)/.test(n)) ev = busca(/universidad/);
    else if (/ (notas|boletin|calificaciones|reports?|notak)/.test(n)) ev = busca(/notas/);
    else if (/ (festivo|festivos|no lectivo|no lectivos|puente|puentes|jaiegun|jai egun|days off|bank holiday|eskolarik gabe)/.test(n)) ev = CV.proximas(30).filter(e => /no lectivo|Vacaciones|Puente/.test(e.es)).slice(0, 6);
    else {
      // fecha suelta: «fiesta local de Zamudio», «Santo Tomás», «tardes libres», «Inmaculada»…
      const VACIAS = ["cuando", "fiesta", "fiestas", "vacaciones", "calendario", "curso", "colegio", "dias", "festivo", "festivos", "lectivo", "lectivos", "noiz", "when", "school", "there", "which", "what", "este", "esta", "tiene", "tienen", "holiday", "holidays", "egutegia", "eguna", "jaieguna", "oporrak"];
      const pal = n.trim().split(" ").filter(w => w.length >= 4 && !VACIAS.includes(w));
      const sc = CV.calendario.map(e => { const t = " " + norm(e.es + " " + e.eu + " " + e.en); return { e, s: pal.filter(w => t.includes(" " + w.slice(0, Math.max(4, w.length - 2)))).length }; });
      const max = Math.max(0, ...sc.map(x => x.s));
      if (max > 0) ev = sc.filter(x => x.s === max).map(x => x.e);
    }
    const T = {
      es: { cab: "Según el calendario escolar 2026-27:", prox: "Próximas fechas del calendario 2026-27:" },
      eu: { cab: "2026-27 eskola egutegiaren arabera:", prox: "2026-27 egutegiko hurrengo datak:" },
      en: { cab: "According to the 2026-27 school calendar:", prox: "Coming up in the 2026-27 calendar:" }
    }[lang];
    const lista = arr => "<ul>" + arr.map(e => "<li><strong>" + rango(e, lang) + "</strong>: " + (e[lang] || e.es) + "</li>").join("") + "</ul>";
    if (ev && ev.length) return { html: T.cab + lista(ev), acc: ["calendario"] };
    // queda algo concreto sin encontrar («fiestas del colegio», «reunión de inicio»…): que conteste la IA
    if (n.trim().split(" ").filter(w => w.length >= 4 && !VACIAS.has(w) && !["calendario", "festivo", "festivos", "fiesta", "fiestas", "vacaciones", "lectivo", "lectivos", "egutegia", "oporrak", "holiday", "holidays", "calendar", "dates", "fechas", "proximas", "datak"].includes(w)).length) return null;
    return { html: T.prox + lista(CV.proximas(6)), acc: ["calendario"] };
  }
  function respBus(n, lang) {
    const lugar = lugarDe(n);
    const T = {
      es: { sin: "Hay <strong>tres turnos</strong>: el 1.º (de 5.º de Primaria a Bachillerato, 17 líneas), el 2.º (de Infantil a 4.º de Primaria, 16 líneas) y el de extraescolares (vuelta a las 18:05, 9 líneas). Llegan a Bilbao, Txorierri, Margen Derecha, Barakaldo y Basauri-Galdakao, y el recorrido medio dura 35-40 minutos. ¿Desde qué barrio o municipio vendríais?", hay: (q, k) => "Sí, hay paradas en <strong>" + q + "</strong> (" + k + "):", no: q => "No veo paradas para «" + q + "» en los recorridos 2026-27. Las rutas se ajustan cada curso según las familias: pregunta a Transporte en el " + '<a href="tel:+34944541400">94 454 14 00</a>' + ".", mas: "y más líneas en el buscador." },
      eu: { sin: "<strong>Hiru txanda</strong> daude: 1.a (LHko 5. mailatik Batxilergora, 17 linea), 2.a (Haur Hezkuntzatik LHko 4. mailara, 16 linea) eta eskolaz kanpokoena (itzulera 18:05ean, 9 linea). Bilbora, Txorierrira, Eskuinaldera, Barakaldora eta Basauri-Galdakaora iristen dira, eta batez besteko ibilbideak 35-40 minutu irauten du. Zein auzo edo udalerritatik etorriko zinatekete?", hay: (q, k) => "Bai, badaude geltokiak <strong>" + q + "</strong> aldean (" + k + "):", no: q => "Ez dut geltokirik ikusten «" + q + "» bilaketarako 2026-27 ibilbideetan. Ibilbideak ikasturtero egokitzen dira familien arabera: galdetu Garraioari " + '<a href="tel:+34944541400">94 454 14 00</a>' + " zenbakian.", mas: "eta linea gehiago bilatzailean." },
      en: { sin: "There are <strong>three runs</strong>: the 1st (Year 5 of Primary to Bachillerato, 17 lines), the 2nd (Infant school to Year 4, 16 lines) and the after-school run (home at 18:05, 9 lines). They cover Bilbao, Txorierri, the Right Bank, Barakaldo and Basauri-Galdakao, and the average journey is 35-40 minutes. Which neighbourhood or town would you come from?", hay: (q, k) => "Yes, there are stops in <strong>" + q + "</strong> (" + k + "):", no: q => "I can't see stops for «" + q + "» in the 2026-27 routes. Routes are adjusted every year depending on families: ask the Transport office on " + '<a href="tel:+34944541400">94 454 14 00</a>' + ".", mas: "and more lines in the search tool." }
    }[lang];
    if (!lugar) return { html: T.sin, acc: ["transporte"] };
    const r = CV.buscarParadas(lugar);
    const bonito = lugar.replace(/\b\w/g, c => c.toUpperCase());
    if (!r.lineas.length) return { html: T.no(bonito), acc: ["transporte"] };
    const k = { es: n => n + (n === 1 ? " línea" : " líneas"), eu: n => n + " linea", en: n => n + (n === 1 ? " line" : " lines") }[lang](r.lineas.length);
    const u = CV.ui[lang];
    const items = r.lineas.slice(0, 4).map(x => {
      const T2 = CV.rutas[x.tk];
      const paradas = x.hit.map(i => CV.esc(x.l.p[i][0])).join(" · ");
      return '<div class="bus"><b>' + u.linea + " " + x.l.n + " · " + T2.nombre[lang] + "</b> (" + T2.quien[lang] + (x.tk === "t3" ? "" : ", " + u.sale.toLowerCase() + " " + x.l.sale) + ")<br>" + paradas + "</div>";
    }).join("");
    return { html: T.hay(bonito, k) + items + (r.lineas.length > 4 ? "<p>" + T.mas + "</p>" : ""), acc: [["transporte", lugar]] };
  }
  function respNoticias(lang) {
    const T = { es: "Lo último publicado por el colegio:", eu: "Ikastetxeak argitaratutako azkenak:", en: "Latest from the school:" }[lang];
    return { html: T + "<ul>" + CV.noticias.map(x => '<li><a href="' + CV.enlaces.noticia(x.id) + '" target="_blank" rel="noopener">' + CV.esc(x[lang] || x.es) + "</a></li>").join("") + "</ul>" };
  }
  function respEtapa(tabla, n, lang) {
    const et = etapaDe(n);
    if (et && tabla[et]) return { html: tabla[et][lang], abre: et, acc: ["etapas"] };
    const orden = tabla === K.H ? ["ei", "inf", "pri", "eso", "bach"] : ["ei", "inf", "pri", "bach"];
    return { html: orden.map(e => "<p>" + tabla[e][lang] + "</p>").join(""), acc: ["etapas"] };
  }
  // ¿La ficha cubre de verdad lo que se pregunta? Si quedan palabras con contenido sin cubrir, mejor la IA.
  const VACIAS = new Set("cuando cuanto cuanta cuantos cuantas donde como quien quienes cual cuales tiene tienen teneis tenemos tengo puedo puede pueden podemos quiero queremos quisiera saber necesito necesita necesitan este esta estos estas para sobre desde hasta entre porque pero tambien cosa cosas hacer hace hacen colegio vuestro vuestra vuestros vuestras nuestro nuestra alguna alguno algun mucho muchos todo todos toda todas otro otra mismo sera seria esto aqui favor gracias hola buenas dias informacion info pregunta preguntar duda dudas hijo hija hijos hijas nino nina ninos ninas peque mayor empieza empiezan empezar llevan lleva estudian estudiar admitis admiten zein nola noiz zenbat dago daude dira dute ditu dauka daukate badago badu nire zure gure nahi behar mesedez eskerrik kaixo ikastetxe ikastetxea ikastetxeak ikastetxean ikastetxeko semea alaba haurra seme alabak egiten egin izan daiteke dezaket gehiago baita what when where which does have there your school about would could should like know want need tell much many please thanks hello child children daughter with from this that they them their into also just more teach".split(" "));
  function cubre(n, it) {
    const pal = n.trim().split(" ").filter(w => w.length >= 4 && !VACIAS.has(w));
    if (pal.length <= 1) return true;
    const claves = it.k.concat(...K.etapas.map(e => e.k), Object.keys(CV.alias)).join(" ").split(" ").filter(k => k.length >= 3);
    const ok = pal.filter(w => claves.some(k => w === k || (k.length >= 5 && (w.startsWith(k) || k.startsWith(w)))));
    return ok.length / pal.length >= 0.5;
  }
  function local(txt, lang) {
    const n = norm(txt);
    const m = puntua(n);
    if (m && m.ia) return null;
    const corta = n.trim().split(" ").length <= 4 || / (pasa|pasan|llega|llegan|recoge|recogen|bus|autobus|parada|ruta|linea|geltoki|autobusa|stop|route) /.test(n);
    const lugar = !m ? (corta ? lugarDe(n, true) : null) : m.it.id === "transporte" ? lugarDe(n, false) : null;
    if (lugar && (!m || m.it.id === "transporte" || m.s < 1.5)) return respBus(n, lang);
    if (!m) return null;
    const it = m.it;
    if (m.s < 1) return null;
    if (it.especial === "bus") return respBus(n, lang);
    if (it.especial === "cal") return respCalendario(n, lang);
    if (it.especial === "news") return respNoticias(lang);
    if (!cubre(n, it)) return null;
    if (it.etapa === "H") return respEtapa(K.H, n, lang);
    if (it.etapa === "U") return respEtapa(K.U, n, lang);
    return { html: it.r[lang], acc: it.acc, abre: it.abre };
  }
  CV.respuestaLocal = local; CV.detectaIdioma = idioma;

  /* ---------- Pintar mensajes ---------- */
  // la IA a veces traduce el ancla (#kontaktua, #news…): se lleva a la sección real o se deja como texto
  const SINON = { contacto: ["kontaktua", "harremana", "harremanak", "contact", "kontaktu"], actualidad: ["aktualitatea", "albisteak", "berriak", "news", "noticias"], servicios: ["zerbitzuak", "services"], transporte: ["garraioa", "transport"], admisiones: ["onarpena", "admissions", "matricula", "matrikula"], etapas: ["etapak", "stages"], verano: ["uda", "summer"], deporte: ["kirola", "sport", "sports", "deportes", "extraescolares"], instalaciones: ["instalazioak", "facilities"], idiomas: ["hizkuntzak", "languages"], metodologia: ["methodology", "approach"], colegio: ["ikastetxea", "about"] };
  function ancla(u) {
    const id = decodeURIComponent(u.slice(1)).toLowerCase();
    if (document.getElementById(id)) return "#" + id;
    for (const k in SINON) if (SINON[k].includes(id)) return "#" + k;
    return null;
  }
  function md(t) {
    let h = CV.esc(t);
    h = h.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
    h = h.replace(/\[([^\]]+)\]\(((?:https?:\/\/|#|tel:)[^\s)]+)\)/g, (m, a, u) => {
      if (u[0] === "#") { u = ancla(u); return u ? '<a href="' + u + '">' + a + "</a>" : a; }
      return '<a href="' + u + '" target="_blank" rel="noopener">' + a + "</a>";
    });
    h = h.replace(/(^|[\s(])(https?:\/\/[^\s<)]+)/g, '$1<a href="$2" target="_blank" rel="noopener">$2</a>');
    const lineas = h.split(/\n/);
    let out = "", enLista = false;
    lineas.forEach(l => {
      const li = l.match(/^\s*(?:[-•*]|\d+[.)])\s+(.*)/);
      if (li) { if (!enLista) { out += "<ul>"; enLista = true; } out += "<li>" + li[1] + "</li>"; }
      else { if (enLista) { out += "</ul>"; enLista = false; } if (l.trim()) out += "<p>" + l + "</p>"; }
    });
    if (enLista) out += "</ul>";
    return out;
  }
  const ACC = {
    transporte: "#transporte", admisiones: "#admisiones", etapas: "#etapas", contacto: "#contacto", verano: "#verano", deporte: "#deporte", instal: "#instalaciones",
    tour: CV.enlaces.visita360, pre: CV.enlaces.preinscripcion, oa: CV.enlaces.puertasAbiertas, privada: CV.enlaces.areaPrivada, canal: CV.enlaces.canalEtico, calendario: CV.enlaces.calendario
  };
  function burbuja(quien, html, acciones, lang) {
    const d = document.createElement("div");
    d.className = "chat-msg " + quien;
    d.innerHTML = html;
    (acciones || []).forEach(a => {
      const [id, arg] = Array.isArray(a) ? a : [a];
      const destino = ACC[id]; if (!destino) return;
      const et = K.acc[id] ? K.acc[id][lang || CV.lang] : id;
      const el = document.createElement("a");
      el.className = "acc"; el.href = destino; el.textContent = et;
      el.insertAdjacentHTML("beforeend", '<svg aria-hidden="true"><use href="#i-' + (destino[0] === "#" ? "arrow" : "ext") + '"/></svg>');
      if (destino[0] === "#") el.addEventListener("click", e => {
        if (id === "transporte" && arg) { e.preventDefault(); CV.verParadas(arg); }
        if (matchMedia("(max-width: 640px)").matches) cerrar(false);
      }); else { el.target = "_blank"; el.rel = "noopener"; }
      d.appendChild(document.createElement("br")); d.appendChild(el);
    });
    body.appendChild(d);
    body.scrollTop = body.scrollHeight;
    return d;
  }
  function escribiendo() {
    const d = document.createElement("div");
    d.className = "chat-msg bot chat-typing-msg";
    d.innerHTML = '<span class="chat-typing" aria-label="…"><span></span><span></span><span></span></span>';
    body.appendChild(d); body.scrollTop = body.scrollHeight;
    return d;
  }
  function pintaChips() {
    chips.innerHTML = "";
    (K.chips[CV.lang] || K.chips.es).forEach(q => {
      const b = document.createElement("button");
      b.type = "button"; b.className = "chat-chip"; b.textContent = q;
      b.addEventListener("click", () => preguntar(q));
      chips.appendChild(b);
    });
  }
  const texto = html => { const t = document.createElement("div"); t.innerHTML = html.replace(/<li>/g, "\n- ").replace(/<\/p>/g, "\n"); return t.textContent.replace(/\n{3,}/g, "\n\n").trim(); };

  /* ---------- IA ---------- */
  async function preguntaIA(lang) {
    const ctl = new AbortController();
    const to = setTimeout(() => ctl.abort(), 20000);
    try {
      const r = await fetch(CV.IA_URL, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ messages: historia.slice(-10), lang }), signal: ctl.signal });
      const j = await r.json();
      if (!r.ok || !j.reply) throw new Error(j.error || r.status);
      return j.reply;
    } finally { clearTimeout(to); }
  }

  async function preguntar(q) {
    q = String(q || "").trim();
    if (!q || ocupado) return;
    ocupado = true; send.disabled = true;
    burbuja("user", CV.esc(q));
    historia.push({ role: "user", content: q });
    input.value = ""; ajusta();
    const lang = idioma(q);
    const tipo = escribiendo();
    const t0 = performance.now();
    const loc = local(q, lang);
    try {
      if (loc) {
        await new Promise(r => setTimeout(r, Math.max(0, 550 + Math.random() * 400 - (performance.now() - t0))));
        tipo.remove();
        burbuja("bot", loc.html, loc.acc, lang);
        if (loc.abre && CV.abrirEtapa) { const t = document.getElementById("tab-" + loc.abre); if (t && t.getAttribute("aria-selected") !== "true") t.click(); }
        historia.push({ role: "assistant", content: texto(loc.html) });
      } else {
        let resp;
        try { resp = await preguntaIA(lang); } catch (e) { resp = null; }
        tipo.remove();
        if (resp) { burbuja("bot", md(resp), null, lang); historia.push({ role: "assistant", content: resp }); }
        else { burbuja("bot", K.error[lang], ["contacto"], lang); historia.pop(); }
      }
    } finally { ocupado = false; send.disabled = false; if (abierto && !matchMedia("(pointer: coarse)").matches) input.focus(); }
  }
  CV.preguntarAsistente = preguntar;

  /* ---------- Abrir y cerrar ---------- */
  function abrir() {
    if (abierto) return;
    abierto = true;
    panel.hidden = false;
    requestAnimationFrame(() => panel.classList.add("open"));
    fab.classList.add("hidden"); fab.setAttribute("aria-expanded", "true");
    const notif = $(".notif", fab); if (notif) notif.remove();
    if (!saludado) {
      saludado = true; pintaChips();
      const t = escribiendo();
      setTimeout(() => { t.remove(); burbuja("bot", K.saludo[0][CV.lang]); const t2 = escribiendo(); setTimeout(() => { t2.remove(); burbuja("bot", K.saludo[1][CV.lang]); }, 700); }, 500);
    }
    setTimeout(() => input.focus(), 320);
  }
  function cerrar(foco = true) {
    if (!abierto) return;
    abierto = false;
    panel.classList.remove("open");
    setTimeout(() => { if (!abierto) panel.hidden = true; }, 300);
    fab.classList.remove("hidden"); fab.setAttribute("aria-expanded", "false");
    if (foco) fab.focus();
  }
  fab.addEventListener("click", abrir);
  // enlaces a secciones dentro de las respuestas de la IA: en móvil se cierra el panel para ver la sección
  body.addEventListener("click", e => { const l = e.target.closest("a[href^=\"#\"]"); if (l && !l.classList.contains("acc") && matchMedia("(max-width: 640px)").matches) cerrar(false); });
  $("#chatCerrar").addEventListener("click", () => cerrar());
  document.querySelectorAll("[data-abrir-chat]").forEach(b => b.addEventListener("click", abrir));
  addEventListener("keydown", e => { if (e.key === "Escape" && abierto) cerrar(); });
  form.addEventListener("submit", e => { e.preventDefault(); preguntar(input.value); });
  function ajusta() { input.style.height = "auto"; input.style.height = Math.min(100, input.scrollHeight) + "px"; input.style.overflowY = input.scrollHeight > 100 ? "auto" : "hidden"; }
  input.addEventListener("input", ajusta);
  input.addEventListener("keydown", e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); preguntar(input.value); } });
  document.addEventListener("cv:lang", () => { if (saludado) pintaChips(); });

  // la etiqueta «¿Dudas? Pregúntale a la IA» asoma una vez a los 6 s (solo con ratón)
  if (matchMedia("(hover: hover)").matches) setTimeout(() => { if (!abierto) { fab.classList.add("saluda"); setTimeout(() => fab.classList.remove("saluda"), 4500); } }, 6000);
})();
