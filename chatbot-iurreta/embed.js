/*!
 * Asistente ciudadano municipal · G&G Elcano — widget embebible
 * Integración en una sola línea, sin tocar los sistemas del ayuntamiento:
 *   <script src="https://ggeelcano.github.io/demos/chatbot-iurreta/embed.js" data-town="azpeitia" data-lang="eu"></script>
 *
 * Atributos opcionales del <script>:
 *   data-town   slug del municipio (por defecto: iurreta)
 *   data-lang   "eu" | "es" (por defecto: el idioma configurado para el municipio)
 *   data-color  color del botón (por defecto: el color corporativo del municipio)
 *   data-label  texto del botón
 *   data-pos    "right" | "left" (por defecto: right)
 *
 * No usa cookies, no carga librerías externas y no accede al DOM de la web anfitriona
 * más allá del propio botón. El chat vive dentro de un <iframe> aislado.
 */
(function () {
  "use strict";
  if (window.__ggAsistente) return;           // idempotente: una sola instancia
  window.__ggAsistente = true;

  var me = document.currentScript || (function () {
    var s = document.getElementsByTagName("script");
    for (var i = s.length - 1; i >= 0; i--) if (/embed\.js/.test(s[i].src)) return s[i];
    return null;
  })();
  if (!me) return;

  var d = me.dataset || {};
  var BASE = me.src.replace(/embed\.js.*$/, "");
  var TOWN = (d.town || "iurreta").toLowerCase().trim();
  var LANG = (d.lang || "").toLowerCase().trim();
  var POS = d.pos === "left" ? "left" : "right";
  var COLOR = d.color || "#155E63";
  var LABEL = d.label || (LANG === "eu" ? "Lagundu diezazuket?" : LANG === "es" ? "¿Te ayudo?" : "Lagundu? · ¿Te ayudo?");
  var TITLE = LANG === "eu" ? "Herritarrentzako laguntzailea" : "Asistente ciudadano";

  var url = BASE + "?town=" + encodeURIComponent(TOWN) + "&embed=1" + (LANG ? "&lang=" + LANG : "");

  var css = [
    ".gg-fab{position:fixed;bottom:22px;" + POS + ":22px;z-index:2147483000;display:inline-flex;align-items:center;gap:9px;",
    "background:" + COLOR + ";color:#fff;border:0;border-radius:999px;padding:13px 20px 13px 16px;cursor:pointer;",
    "font:600 15px/1.1 system-ui,-apple-system,'Segoe UI',Roboto,sans-serif;box-shadow:0 10px 30px rgba(0,0,0,.25);",
    "transition:transform .18s ease,box-shadow .18s ease}",
    ".gg-fab:hover{transform:translateY(-2px);box-shadow:0 14px 36px rgba(0,0,0,.3)}",
    ".gg-fab:focus-visible{outline:3px solid #fff;outline-offset:2px}",
    ".gg-fab svg{width:21px;height:21px;flex:0 0 auto}",
    ".gg-fab .gg-dot{position:absolute;top:-3px;" + POS + ":-1px;width:11px;height:11px;border-radius:50%;background:#22D3EE;border:2px solid #fff}",
    ".gg-panel{position:fixed;bottom:22px;" + POS + ":22px;z-index:2147483001;width:400px;max-width:calc(100vw - 32px);",
    "height:626px;max-height:calc(100vh - 44px);border:0;border-radius:20px;overflow:hidden;background:#fff;",
    "box-shadow:0 24px 70px rgba(0,0,0,.32);opacity:0;transform:translateY(14px) scale(.97);",
    "transition:opacity .22s ease,transform .22s ease;pointer-events:none}",
    ".gg-panel.gg-on{opacity:1;transform:none;pointer-events:auto}",
    "@media(max-width:520px){.gg-panel{inset:0;width:100vw;max-width:100vw;height:100dvh;max-height:100dvh;border-radius:0}",
    ".gg-fab{bottom:16px;" + POS + ":16px;padding:12px 17px}}",
    "@media(prefers-reduced-motion:reduce){.gg-fab,.gg-panel{transition:none}}"
  ].join("");

  var st = document.createElement("style");
  st.textContent = css;
  document.head.appendChild(st);

  var fab = document.createElement("button");
  fab.className = "gg-fab";
  fab.type = "button";
  fab.setAttribute("aria-label", TITLE);
  fab.setAttribute("aria-expanded", "false");
  fab.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
    '<path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>' +
    '<span>' + LABEL + '</span><span class="gg-dot"></span>';

  var frame = null, open = false;

  function build() {
    frame = document.createElement("iframe");
    frame.className = "gg-panel";
    frame.src = url;
    frame.title = TITLE;
    frame.setAttribute("allow", "clipboard-write");
    frame.setAttribute("loading", "lazy");
    document.body.appendChild(frame);
    return frame;
  }

  function show() {
    if (!frame) build();
    open = true;
    fab.style.display = "none";
    fab.setAttribute("aria-expanded", "true");
    requestAnimationFrame(function () { frame.classList.add("gg-on"); });
  }

  function hide() {
    open = false;
    if (frame) frame.classList.remove("gg-on");
    fab.style.display = "inline-flex";
    fab.setAttribute("aria-expanded", "false");
    try { fab.focus(); } catch (e) {}
  }

  fab.addEventListener("click", function () { open ? hide() : show(); });

  window.addEventListener("message", function (e) {
    if (!frame || e.source !== frame.contentWindow) return;   // solo del propio iframe
    if (e.data && e.data.gg === "close") hide();
  });

  document.addEventListener("keydown", function (e) { if (e.key === "Escape" && open) hide(); });

  function mount() { document.body.appendChild(fab); }
  if (document.body) mount();
  else document.addEventListener("DOMContentLoaded", mount);

  /* API mínima para el ayuntamiento: window.ggAsistente.abrir() / .cerrar() */
  window.ggAsistente = { abrir: show, cerrar: hide, municipio: TOWN };
})();
