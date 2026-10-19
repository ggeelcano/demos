"use strict";
// Personalizador de velas de bautizo (demo para Noreta). Sin dependencias.

const MESES = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
const REC_OPC = [[1, 8], [5, 38], [10, 70], [20, 120], [30, 150], [40, 175]];
const PORTA = 3.95, ENVIO = 3.5, EXPRESS = 9, GRATIS = 49.95;
const EJEMPLO = { nombre: "Lola", fecha: "2026-08-16", parroquia: "Parroquia San Jerónimo", ciudad: "Valencia" };

// Capas de texto en coordenadas de la foto original (escala 1000 px). x = centro de la vela.
const CLASICA = [
  { fijo: "Bautizo", y: 434.5, size: 18, fam: "Montserrat", w: 400, fill: "#ab8a72" },
  { campo: "nombre", y: 473, size: 50, fam: "Fraunces", w: 600, fill: "#b4896a", max: 150 },
  { campo: "fecha", fmt: "larga", y: 511, size: 13, fam: "Montserrat", w: 700, fill: "#2c6aa0", max: 150 },
  { campo: "parroquia", y: 527.5, size: 12, fam: "Montserrat", w: 500, fill: "#4a87bd", max: 156 },
  { campo: "ciudad", y: 542, size: 12, fam: "Montserrat", w: 500, fill: "#4a87bd", max: 156 },
];
const MODELOS = [
  { id: "angela", corto: "Angela", nombre: "Vela bautizo Angela", url: "vela-bautizo-angela", precio: 42, x: 488, capas: CLASICA, zona: 488,
    campos: ["nombre", "fecha", "parroquia", "ciudad"], detras: { fam: "Montserrat", w: 500, fill: "#3a7fb8" }, rec: "Recordatorio de Bautizo Angela" },
  { id: "angelo", corto: "Angelo", nombre: "Cirio de bautizo Angelo", url: "cirio-de-bautizo-angelo", precio: 42, x: 488, capas: CLASICA, zona: 488,
    campos: ["nombre", "fecha", "parroquia", "ciudad"], detras: { fam: "Montserrat", w: 500, fill: "#3a7fb8" }, rec: "Recordatorio de Bautizo Angelo" },
  { id: "nube", corto: "Nube", nombre: "Vela bautizo Nube", url: "vela-bautizo-nube", precio: 42, x: 488, zona: 492,
    campos: ["nombre", "fecha", "parroquia", "ciudad"], detras: { fam: "Fredoka", w: 400, fill: "#e4676b" },
    capas: [
      { campo: "nombre", y: 481, size: 54, fam: "Fredoka", w: 600, fill: "#ec7375", max: 162 },
      { campo: "fecha", fmt: "larga", y: 507, size: 13.5, fam: "Fredoka", w: 500, fill: "#e4676b", max: 150 },
      { campo: "parroquia", y: 521.5, size: 11.5, fam: "Fredoka", w: 400, fill: "#e4676b", max: 156 },
      { campo: "ciudad", y: 536, size: 11.5, fam: "Fredoka", w: 400, fill: "#e4676b", max: 156 },
    ] },
  { id: "petalos", corto: "Pétalos", nombre: "Vela bautizo personalizada Pétalos", url: "vela-bautizo-petalos", precio: 42, x: 488, zona: 246,
    campos: ["nombre", "fecha"], detras: { fam: "Fredoka", w: 400, fill: "#4aa58c" },
    capas: [
      { campo: "nombre", y: 251.5, size: 52, fam: "Montserrat", w: 200, fill: "#3f9c86", max: 132 },
      { campo: "fecha", fmt: "corta", y: 278.5, size: 23, fam: "Montserrat", w: 200, fill: "#6aa996", max: 120, medio: "#a3a86b" },
    ] },
];
const FRASES = [
  "“El Señor te bendiga y te guarde. El Señor haga brillar su rostro sobre ti y te conceda su gracia. El Señor vuelva su rostro hacia ti y te otorgue la paz”\nNm 6, 24-26",
  "Que esta luz te acompañe siempre en tu camino.",
  "Hoy empiezas tu camino en la fe. Te queremos.",
];
const ETIQ = { nombre: "nombre", fecha: "fecha", parroquia: "parroquia", ciudad: "ciudad", frase: "frase de atrás", padrinos: "padrinos", revisado: "marcar que lo has revisado" };

const $ = s => document.querySelector(s);
const eur = n => n.toLocaleString("es-ES", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " €";
const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);

// ---------- estado ----------
const st = {
  modelo: "angela", cara: "frente",
  datos: { nombre: "", fecha: "", parroquia: "", ciudad: "", frase: "" },
  conFrase: false, rec: false, recCant: 1, padrinos: "", porta: false, revisado: false,
  cesta: [], envio: "normal", tocado: {},
};
try {
  const g = JSON.parse(localStorage.getItem("noreta-demo") || "null");
  if (g) Object.assign(st, g, { cara: "frente", revisado: false, tocado: {} });
} catch (e) {}
const q = new URLSearchParams(location.search).get("modelo");
if (MODELOS.some(m => m.id === q)) st.modelo = q;
const guardar = () => { try { localStorage.setItem("noreta-demo", JSON.stringify({ ...st, tocado: undefined })); } catch (e) {} };
const modelo = () => MODELOS.find(m => m.id === st.modelo);

// ---------- fechas y plazos ----------
const fechaDe = v => { const [a, m, d] = (v || "").split("-").map(Number); return a ? new Date(a, m - 1, d) : null; };
function textoFecha(v, fmt) {
  const f = fechaDe(v); if (!f) return "";
  if (fmt === "corta") return [f.getDate(), f.getMonth() + 1, f.getFullYear() % 100].map(n => String(n).padStart(2, "0")).join("/");
  return `${f.getDate()} ${MESES[f.getMonth()]} ${f.getFullYear()}`;
}
function sumaLaborables(desde, n) {
  const f = new Date(desde); f.setHours(0, 0, 0, 0);
  while (n > 0) { f.setDate(f.getDate() + 1); if (f.getDay() % 6) n--; }
  return f;
}
const diaMes = f => `${f.getDate()} de ${MESES[f.getMonth()].toLowerCase()}`;
// 1 día para aprobar el diseño + 4-8 de taller + 3-6 de envío normal (1-2 express)
function plazos(v) {
  const ev = fechaDe(v); if (!ev) return null;
  const hoy = new Date(); hoy.setHours(0, 0, 0, 0);
  const r = { normal: [sumaLaborables(hoy, 8), sumaLaborables(hoy, 15)], express: [sumaLaborables(hoy, 6), sumaLaborables(hoy, 11)] };
  if (ev < hoy) r.estado = "pasada";
  else if ((ev - hoy) / 864e5 > 400) r.estado = "lejos";
  else if (ev > r.normal[1]) r.estado = "ok";
  else if (ev > r.express[1]) r.estado = "express";
  else r.estado = "justo";
  return r;
}

// ---------- vista previa (SVG sobre la foto con el texto de ejemplo borrado) ----------
const medidor = document.createElement("canvas").getContext("2d");
const ancho = (t, c, size) => { medidor.font = `${c.w} ${size}px ${c.fam}`; return medidor.measureText(t).width; };
function partirLineas(texto, c, size, max) {
  const out = [];
  for (const parrafo of texto.split("\n")) {
    let linea = "";
    for (const pal of parrafo.split(/\s+/).filter(Boolean)) {
      const prueba = linea ? linea + " " + pal : pal;
      if (linea && ancho(prueba, c, size) > max) { out.push(linea); linea = pal; } else linea = prueba;
    }
    out.push(linea);
  }
  return out;
}
function svgVela(m, cara, vista) {
  const NS = "http://www.w3.org/2000/svg";
  const svg = document.createElementNS(NS, "svg");
  const x0 = cara === "frente" ? 288 : 312, cx = cara === "frente" ? m.x : 512;
  if (vista === "tira") {
    const cy = cara === "frente" ? m.zona : 345;
    svg.setAttribute("viewBox", `${x0} ${cy - 68} 400 136`);
    svg.setAttribute("preserveAspectRatio", "xMidYMid slice");
  } else svg.setAttribute("viewBox", `${x0} 40 400 600`);
  svg.setAttribute("role", "img");
  const img = document.createElementNS(NS, "image");
  img.setAttribute("href", `img/${m.id}${cara === "frente" ? "" : "-detras"}.webp`);
  for (const [k, v] of Object.entries({ x: x0, y: 40, width: 400, height: 600 })) img.setAttribute(k, v);
  svg.appendChild(img);
  const texto = (t, c, y, size, extra = {}) => {
    const el = document.createElementNS(NS, "text");
    const a = { x: cx, y, "text-anchor": "middle", "font-family": c.fam, "font-weight": c.w, "font-size": size, fill: c.fill, ...extra };
    for (const [k, v] of Object.entries(a)) el.setAttribute(k, v);
    el.style.mixBlendMode = "multiply";
    el.textContent = t;
    svg.appendChild(el);
    return el;
  };
  const d = st.datos;
  let desc = "";
  if (cara === "frente") {
    for (const c of m.capas) {
      let t = c.fijo, fantasma = false;
      if (c.campo) {
        const v = d[c.campo];
        t = c.campo === "fecha" ? textoFecha(v, c.fmt) : v.trim();
        if (!t) { t = c.campo === "fecha" ? textoFecha(EJEMPLO.fecha, c.fmt) : EJEMPLO[c.campo]; fantasma = true; }
      }
      const size = c.max ? Math.min(c.size, c.size * c.max / ancho(t, c, c.size)) : c.size;
      const el = texto(c.medio && !fantasma ? "" : t, c, c.y, size.toFixed(2), fantasma ? { opacity: 0.28 } : {});
      if (c.medio && !fantasma) {
        // fecha corta con el mes en otro color, como la vela original
        const [dd, mm, aa] = t.split("/");
        for (const [parte, color] of [[dd + "/", c.fill], [mm, c.medio], ["/" + aa, c.fill]]) {
          const ts = document.createElementNS(NS, "tspan"); ts.textContent = parte; ts.setAttribute("fill", color); el.appendChild(ts);
        }
      }
      if (!fantasma) desc += t + ". ";
    }
  } else {
    const c = m.detras, vacio = !(st.conFrase && d.frase.trim());
    const t = vacio ? FRASES[0] : d.frase.trim();
    let size = 11.5, lineas = partirLineas(t, c, size, 132);
    while (lineas.length * size * 1.32 > 150 && size > 7) { size -= 0.5; lineas = partirLineas(t, c, size, 132); }
    const alto = size * 1.32, y0 = 345 - (lineas.length - 1) * alto / 2 + size * 0.35;
    lineas.forEach((l, i) => texto(l, c, (y0 + i * alto).toFixed(1), size, vacio ? { opacity: 0.25 } : {}));
    desc = vacio ? "Parte de atrás sin frase." : "Frase de atrás: " + t;
  }
  svg.setAttribute("aria-label", `${m.nombre}, ${cara === "frente" ? "delante" : "detrás"}. ${desc || "Sin datos todavía."}`);
  return svg;
}
function pintarVela() {
  const m = modelo();
  $("#lienzo").replaceChildren(svgVela(m, st.cara, "grande"));
  $("#tiraLienzo").replaceChildren(svgVela(m, st.cara, "tira"));
  document.querySelectorAll("[data-cara]").forEach(b => b.setAttribute("aria-pressed", b.dataset.cara === st.cara));
}
function ponerCara(c) { if (st.cara !== c) { st.cara = c; pintarVela(); } }

// ---------- formulario ----------
const MINUS = new Set(["de", "del", "la", "las", "los", "el", "y", "e"]);
function capitalizar(t) {
  return t.toLowerCase().split(" ").map((p, i) => i && MINUS.has(p) ? p : p.charAt(0).toUpperCase() + p.slice(1)).join(" ");
}
const limpio = t => t.replace(/\s+/g, " ").trim();
function mensaje(campo, tipo, html) {
  const caja = document.querySelector(`[data-campo="${campo}"]`);
  let el = caja.querySelector(".msg");
  if (!html) { el && el.remove(); return; }
  if (!el) { el = document.createElement("p"); el.setAttribute("role", "status"); caja.appendChild(el); }
  el.className = "msg " + tipo; el.innerHTML = html;
}
// Al salir de un campo: espacios sobrantes y mayúsculas, avisando y con opción de deshacer.
function repasar(campo) {
  const inp = $("#" + campo), antes = inp.value, v = limpio(antes);
  let nuevo = v;
  if (v.length > 1 && (v === v.toLowerCase() || (v === v.toUpperCase() && /[A-ZÁÉÍÓÚÑ]{2}/.test(v)))) nuevo = capitalizar(v);
  inp.value = st.datos[campo] = nuevo;
  st.tocado[campo] = true;
  avisos(campo, nuevo !== v ? `Lo hemos dejado así: «${esc(nuevo)}». <button type="button" data-deshacer="${campo}" data-valor="${esc(v)}">Prefiero como lo escribí</button>` : "");
  actualizar();
}
// Avisos de cada campo; "previo" es la nota de corrección de mayúsculas, si la hubo.
function avisos(campo, previo = "") {
  const v = st.datos[campo].trim(), m = modelo();
  let tipo = "av", txt = "";
  if (campo === "nombre") {
    const c = m.capas.find(x => x.campo === "nombre");
    if (/\d/.test(v)) { tipo = "mal"; txt = "El nombre lleva números. ¿Está bien?"; }
    else if (v && ancho(v, c, c.size) > c.max) txt = "Es un nombre largo: se imprimirá algo más pequeño para que quepa. Míralo en la vista previa.";
  }
  if (campo === "parroquia" && v && !/^(parroquia|iglesia|ermita|bas[ií]lica|catedral|santuario|capilla|monasterio|colegiata|convento|templo)\b/i.test(v))
    txt = `Se imprimirá sin «Parroquia» delante. <button type="button" data-prefijo="Parroquia ">Añadir «Parroquia»</button>`;
  mensaje(campo, tipo, [previo, txt].filter(Boolean).join("<br>"));
}
function pintarPlazos() {
  const caja = $("#plazos"), p = plazos(st.datos.fecha);
  $("#fechaImpresa").textContent = textoFecha(st.datos.fecha, modelo().capas.find(c => c.campo === "fecha").fmt) || "—";
  if (!p) { caja.hidden = true; return; }
  caja.hidden = false;
  const [n1, n2] = p.normal.map(diaMes), [e1, e2] = p.express.map(diaMes);
  const txt = {
    pasada: ["mal", "Esa fecha ya ha pasado. Revisa el día y el año."],
    lejos: ["av", `¿Seguro que es en ${fechaDe(st.datos.fecha).getFullYear()}? Revisa el año.`],
    ok: ["ok", `Llega a tiempo. Si lo pides hoy, lo recibes entre el ${n1} y el ${n2} con envío normal.`],
    express: ["av", `Con envío normal va justo (${n1} a ${n2}). Con envío express (9 €) lo recibes entre el ${e1} y el ${e2}.`],
    justo: ["mal", `Es muy justo. Antes de pedir, llámanos o escríbenos al <a href="https://wa.me/34696146342">696 14 63 42</a> y te decimos si llegamos.`],
  }[p.estado];
  caja.className = "plazos " + txt[0];
  caja.innerHTML = txt[1];
}
function faltan() {
  const m = modelo(), d = st.datos, f = m.campos.filter(c => !d[c].trim());
  const p = plazos(d.fecha);
  if (p && p.estado === "pasada" && !f.includes("fecha")) f.push("fecha");
  if (st.conFrase && !d.frase.trim()) f.push("frase");
  if (m.rec && st.rec && !st.padrinos.trim()) f.push("padrinos");
  if (!f.length && !st.revisado) f.push("revisado");
  return f;
}
function precios() {
  const m = modelo(), conSet = !!m.rec;
  const dto = conSet && st.rec ? (st.porta ? 0.5 : 0.2) : 0;
  const vela = m.precio * (1 - dto);
  const rec = conSet && st.rec ? REC_OPC.find(o => o[0] === +st.recCant)[1] : 0;
  const porta = conSet && st.porta ? PORTA : 0;
  return { dto, vela, rec, porta, total: vela + rec + porta };
}
function pintarResumen() {
  const m = modelo(), d = st.datos, filas = [];
  for (const c of m.capas) if (c.campo) filas.push([c.campo === "fecha" ? "Fecha" : ETIQ[c.campo][0].toUpperCase() + ETIQ[c.campo].slice(1), c.campo === "fecha" ? textoFecha(d.fecha, c.fmt) : d[c.campo].trim()]);
  if (st.conFrase) filas.push(["Detrás", d.frase.trim()]);
  if (m.rec && st.rec) filas.push(["Recordatorio", `${st.recCant} ${st.recCant == 1 ? "unidad" : "unidades"} · Padrinos: ${st.padrinos.trim() || "—"}`]);
  if (m.rec && st.porta) filas.push(["Portavelas", "Sí"]);
  $("#resumen").innerHTML = filas.map(([k, v]) => `<div><dt>${k}</dt><dd class="${v ? "" : "vacio"}">${v ? esc(v).replace(/\n/g, "<br>") : "Sin rellenar"}</dd></div>`).join("");
}
function actualizar() {
  const m = modelo(), p = precios(), f = faltan();
  $("#precioVela").innerHTML = p.dto ? `<del>${eur(m.precio)}</del>${eur(p.vela)} <small>(−${p.dto * 100} % con el set)</small>` : eur(m.precio);
  $("#totalTxt").textContent = eur(p.total);
  $("#faltaTxt").textContent = f.length ? "Falta: " + f.map(x => ETIQ[x]).join(", ") : (p.dto ? `Ahorras ${eur(m.precio - p.vela)} con el set` : "Todo listo");
  $("#anadir").setAttribute("aria-disabled", f.length ? "true" : "false");
  $("#portaDto").textContent = st.rec ? "Con el recordatorio, la vela sale a mitad de precio." : "Junto al recordatorio, la vela sale a mitad de precio.";
  for (const c of ["nombre", "fecha", "parroquia", "ciudad"]) {
    document.querySelector(`[data-campo="${c}"]`).classList.toggle("error", !!st.tocado[c] && m.campos.includes(c) && !st.datos[c].trim());
  }
  pintarPlazos(); pintarResumen(); pintarVela(); guardar();
}
function pintarModelo() {
  const m = modelo();
  $("#chips").innerHTML = MODELOS.map(x => `<button type="button" class="chip" role="radio" aria-checked="${x.id === m.id}" data-modelo="${x.id}">
    <img src="img/${x.id}-mini.webp" alt="" width="100" height="150"><b>${x.corto}</b><small>${eur(x.precio)}</small></button>`).join("");
  $("#nombreModelo").textContent = $("#migaModelo").textContent = m.nombre;
  for (const c of ["parroquia", "ciudad"]) document.querySelector(`[data-campo="${c}"]`).hidden = !m.campos.includes(c);
  $("#soloNombre").hidden = m.campos.length > 2;
  $("#setCaja").hidden = !m.rec;
  $("#pasoRevisa").textContent = m.rec ? "4" : "3";
  if (m.rec) {
    $("#recNombre").textContent = m.rec;
    $("#recImg").src = `img/recordatorio-${m.id}.webp`;
  }
  const u = new URL(location.href); u.searchParams.set("modelo", m.id); history.replaceState(null, "", u);
  actualizar();
}

// ---------- cesta ----------
function anadir() {
  const f = faltan();
  if (f.length) {
    f.forEach(c => { if (st.datos[c] !== undefined) st.tocado[c] = true; });
    actualizar();
    const id = { revisado: "revisado", frase: "frase", padrinos: "padrinos" }[f[0]] || f[0];
    const el = $("#" + id);
    el.scrollIntoView({ block: "center" }); el.focus({ preventScroll: true });
    return;
  }
  const m = modelo(), p = precios(), d = st.datos;
  const datos = { nombre: d.nombre.trim(), fecha: textoFecha(d.fecha, "larga"), fechaISO: d.fecha };
  if (m.campos.includes("parroquia")) { datos.parroquia = d.parroquia.trim(); datos.ciudad = d.ciudad.trim(); }
  const lineas = [{ tipo: "vela", nombre: m.nombre, img: `img/${m.id}-mini.webp`, precio: p.vela, antes: p.dto ? m.precio : 0, frase: st.conFrase ? d.frase.trim() : "" }];
  if (m.rec && st.rec) lineas.push({ tipo: "rec", nombre: m.rec, img: `img/recordatorio-${m.id}.webp`, precio: p.rec, cant: +st.recCant, padrinos: st.padrinos.trim() });
  if (m.rec && st.porta) lineas.push({ tipo: "porta", nombre: "Portavelas de madera", img: "img/portavelas.webp", precio: PORTA });
  st.cesta.push({ datos, lineas });
  st.revisado = false; $("#revisado").checked = false;
  actualizar(); pintarCesta();
  $("#cesta").showModal();
}
function pintarCesta() {
  const n = st.cesta.reduce((a, e) => a + e.lineas.length, 0);
  $("#numCesta").textContent = n;
  const cuerpo = $("#cestaCuerpo");
  if (!n) { cuerpo.innerHTML = `<div class="dlg-cuerpo"><p class="vacia">Tu cesta está vacía.</p></div>`; return; }
  const sub = st.cesta.reduce((a, e) => a + e.lineas.reduce((b, l) => b + l.precio, 0), 0);
  const envio = st.envio === "express" ? EXPRESS : (sub >= GRATIS ? 0 : ENVIO);
  const datosTxt = d => [d.nombre, d.fecha, d.parroquia, d.ciudad].filter(Boolean).join(" · ");
  let html = `<div class="dlg-cuerpo">`;
  st.cesta.forEach((e, i) => {
    for (const l of e.lineas) {
      let det = l.tipo === "porta" ? "Sin personalizar" : datosTxt(e.datos);
      if (l.tipo === "rec") det = `${l.cant} ${l.cant === 1 ? "unidad" : "unidades"} · ${det} · Padrinos: ${l.padrinos}`;
      if (l.frase) det += ` · Detrás: «${l.frase.replace(/\n/g, " ")}»`;
      html += `<div class="linea"><img src="${l.img}" alt=""><div><b>${esc(l.nombre)}</b><span class="datos">${esc(det)}</span></div>
        <div class="imp">${l.antes ? `<del>${eur(l.antes)}</del>` : ""}${eur(l.precio)}</div></div>`;
    }
    html += `<p><button type="button" class="quitar" data-quitar="${i}">Quitar ${e.lineas.length > 1 ? "este set" : "esta vela"}</button></p>`;
  });
  const falta = GRATIS - sub;
  html += `<div class="envio-barra">${falta > 0 ? `Te faltan <b>${eur(falta)}</b> para el envío gratis.` : "<b>Tienes envío gratis</b> (envío normal, Península)."}
    <div class="pista"><i style="width:${Math.min(100, sub / GRATIS * 100)}%"></i></div></div>
    <fieldset class="envios"><legend class="sr">Envío</legend>
      <label><input type="radio" name="envio" value="normal" ${st.envio === "normal" ? "checked" : ""}> Normal (Península) 3-6 días · ${sub >= GRATIS ? "Gratis" : eur(ENVIO)}</label>
      <label><input type="radio" name="envio" value="express" ${st.envio === "express" ? "checked" : ""}> Express (Península) 1-2 días · ${eur(EXPRESS)}</label>
    </fieldset>
    <div class="totales"><span>Total</span><span>${eur(sub + envio)}</span></div>
    <button type="button" class="boton" id="tramitar" style="width:100%">Tramitar pedido</button>
    <button type="button" class="boton sec" data-cerrar style="width:100%;margin-top:8px">Seguir personalizando</button></div>`;
  cuerpo.innerHTML = html;
}
function pintarPedido() {
  let html = `<div class="dlg-cuerpo"><p>Así os llega cada vela en el panel de pedidos: cada dato en su campo, sin tener que interpretar una frase escrita de corrido.</p>`;
  for (const e of st.cesta) {
    for (const l of e.lineas) {
      const filas = [["Producto", l.nombre], ["Cantidad", l.tipo === "rec" ? `${l.cant} uds.` : "1"]];
      if (l.tipo !== "porta") {
        filas.push(["Nombre", e.datos.nombre], ["Fecha del bautizo", e.datos.fecha]);
        if (e.datos.parroquia) filas.push(["Parroquia", e.datos.parroquia], ["Ciudad", e.datos.ciudad]);
      }
      if (l.tipo === "rec") filas.push(["Mis padrinos son", l.padrinos]);
      if (l.tipo === "vela") filas.push(["Frase detrás", l.frase || "Sin frase"]);
      if (l.tipo === "vela") {
        const p = plazos(e.datos.fechaISO);
        if (p) filas.push(["Fecha del evento", fechaDe(e.datos.fechaISO).toLocaleDateString("es-ES") + (p.estado === "ok" ? " (llega con envío normal)" : p.estado === "express" ? " (recomendado express)" : p.estado === "justo" ? " (muy justo: contactar)" : "")]);
      }
      html += `<div class="pedido-ficha"><h3>${esc(l.nombre)}</h3><table>${filas.map(([k, v]) => `<tr><td>${k}</td><td>${esc(v).replace(/\n/g, "<br>")}</td></tr>`).join("")}</table></div>`;
    }
  }
  html += `<p class="nota-demo">Esto es una demostración. En vuestra tienda el pago seguiría siendo el de Wix de siempre: el personalizador va dentro de la ficha y rellena los campos del pedido.</p>
    <button type="button" class="boton" data-cerrar style="width:100%;margin-top:12px">Volver a la tienda</button></div>`;
  $("#pedidoCuerpo").innerHTML = html;
}

// ---------- eventos ----------
document.addEventListener("click", e => {
  const t = e.target.closest("button,a");
  if (!t) return;
  if (t.dataset.modelo) { st.modelo = t.dataset.modelo; st.cara = "frente"; pintarModelo(); }
  else if (t.dataset.cara) ponerCara(t.dataset.cara);
  else if (t.dataset.deshacer) { const c = t.dataset.deshacer; $("#" + c).value = st.datos[c] = t.dataset.valor; avisos(c); actualizar(); }
  else if (t.dataset.prefijo) { $("#parroquia").value = st.datos.parroquia = t.dataset.prefijo + st.datos.parroquia.trim(); avisos("parroquia"); actualizar(); }
  else if (t.dataset.frase !== undefined) { const v = FRASES[+t.dataset.frase]; $("#frase").value = st.datos.frase = v; $("#fraseCuenta").textContent = v.length; ponerCara("detras"); actualizar(); }
  else if (t.dataset.quitar !== undefined) { st.cesta.splice(+t.dataset.quitar, 1); pintarCesta(); guardar(); }
  else if (t.dataset.cerrar !== undefined) t.closest("dialog").close();
  else if (t.id === "anadir") anadir();
  else if (t.id === "abrirCesta") { pintarCesta(); $("#cesta").showModal(); }
  else if (t.id === "tramitar") { $("#cesta").close(); pintarPedido(); $("#pedido").showModal(); }
});
for (const c of ["nombre", "parroquia", "ciudad"]) {
  const inp = $("#" + c);
  inp.addEventListener("input", () => { st.datos[c] = inp.value; mensaje(c, "", ""); actualizar(); });
  inp.addEventListener("blur", () => repasar(c));
  inp.addEventListener("focus", () => ponerCara("frente"));
}
$("#fecha").addEventListener("input", e => { st.datos.fecha = e.target.value; st.tocado.fecha = true; actualizar(); });
$("#fecha").addEventListener("focus", () => ponerCara("frente"));
$("#frase").addEventListener("input", e => { st.datos.frase = e.target.value; $("#fraseCuenta").textContent = e.target.value.length; actualizar(); });
$("#frase").addEventListener("focus", () => ponerCara("detras"));
$("#conFrase").addEventListener("change", e => { st.conFrase = e.target.checked; $("#fraseCaja").hidden = !st.conFrase; ponerCara(st.conFrase ? "detras" : "frente"); actualizar(); if (st.conFrase) $("#frase").focus(); });
$("#conRec").addEventListener("change", e => { st.rec = e.target.checked; $("#recOpciones").hidden = !st.rec; actualizar(); });
$("#conPorta").addEventListener("change", e => { st.porta = e.target.checked; actualizar(); });
$("#recCantidad").addEventListener("change", e => { st.recCant = +e.target.value; actualizar(); });
$("#padrinos").addEventListener("input", e => { st.padrinos = e.target.value; actualizar(); });
$("#revisado").addEventListener("change", e => { st.revisado = e.target.checked; actualizar(); });
$("#cestaCuerpo").addEventListener("change", e => { if (e.target.name === "envio") { st.envio = e.target.value; pintarCesta(); guardar(); } });
document.querySelectorAll("dialog").forEach(d => d.addEventListener("click", e => { if (e.target === d) d.close(); }));

// tira fija en móvil con la zona del texto ampliada, cuando la foto grande sale de pantalla
const tira = $("#tira");
let pend = false;
addEventListener("scroll", () => {
  if (pend) return; pend = true;
  requestAnimationFrame(() => {
    pend = false;
    const g = $("#lienzo").getBoundingClientRect(), f = $("#form").getBoundingClientRect();
    tira.classList.toggle("ver", innerWidth < 880 && g.bottom < 40 && f.bottom > 200);
  });
}, { passive: true });

// ---------- arranque ----------
$("#recCantidad").innerHTML = REC_OPC.map(([n, p]) => `<option value="${n}">${n} ${n === 1 ? "unidad" : "unidades"} · ${eur(p)}</option>`).join("");
$("#sugerencias").innerHTML = FRASES.map((f, i) => `<button type="button" data-frase="${i}">${esc(f).replace(/\n/g, " · ")}</button>`).join("");
for (const c of ["nombre", "fecha", "parroquia", "ciudad", "frase"]) $("#" + c).value = st.datos[c];
$("#fraseCuenta").textContent = st.datos.frase.length;
$("#conFrase").checked = st.conFrase; $("#fraseCaja").hidden = !st.conFrase;
$("#conRec").checked = st.rec; $("#recOpciones").hidden = !st.rec; $("#recCantidad").value = st.recCant;
$("#padrinos").value = st.padrinos; $("#conPorta").checked = st.porta;
pintarModelo(); pintarCesta();
// repintar cuando estén las fuentes (las medidas del texto dependen de ellas)
Promise.all(["600 50px Fraunces", "400 18px Montserrat", "700 13px Montserrat", "500 12px Montserrat", "200 50px Montserrat", "600 50px Fredoka", "500 13px Fredoka", "400 12px Fredoka"]
  .map(f => document.fonts.load(f))).then(() => actualizar(), () => {});
