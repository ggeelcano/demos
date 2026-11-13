/* Colegio Vizcaya — interacción de la web */
(function () {
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  CV.esc = esc;
  CV.norm = s => String(s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9ñ]+/g, " ").trim();

  /* ---------- Cabecera ---------- */
  const top = $("#top");
  const hero = $("#inicio");
  function cabecera() {
    const lim = hero ? hero.offsetHeight - 90 : 40;
    top.classList.toggle("solido", window.scrollY > Math.min(lim, 120) || !hero);
  }
  addEventListener("scroll", cabecera, { passive: true });
  cabecera();

  /* ---------- Menú móvil ---------- */
  const hamb = $(".hamb"), menu = $("#menuMovil");
  function menuAbrir(abrir) {
    menu.hidden = !abrir;
    hamb.setAttribute("aria-expanded", String(abrir));
    document.body.classList.toggle("menu-abierto", abrir);
    hamb.innerHTML = '<svg aria-hidden="true"><use href="#i-' + (abrir ? "close" : "menu") + '"/></svg>';
    if (abrir) { const a = $("a", menu); a && a.focus(); } else hamb.focus();
  }
  hamb.addEventListener("click", () => menuAbrir(menu.hidden));
  $$("a", menu).forEach(a => a.addEventListener("click", () => { if (!menu.hidden) menuAbrir(false); }));
  addEventListener("keydown", e => { if (e.key === "Escape" && !menu.hidden) menuAbrir(false); });

  /* ---------- Vídeo de portada (solo escritorio, sin ahorro de datos ni movimiento reducido) ---------- */
  const vid = $(".hero__vid");
  const conexion = navigator.connection || {};
  if (vid && !reduce && !conexion.saveData && matchMedia("(min-width: 900px)").matches) {
    vid.src = vid.dataset.src;
    vid.addEventListener("canplay", () => { vid.classList.add("ok"); vid.play().catch(() => {}); }, { once: true });
    vid.load();
    new IntersectionObserver(([en]) => { if (en.isIntersecting) vid.play().catch(() => {}); else vid.pause(); }).observe(hero);
  }

  /* ---------- Aparición al hacer scroll ---------- */
  if ("IntersectionObserver" in window && !reduce) {
    const io = new IntersectionObserver(ents => ents.forEach(en => { if (en.isIntersecting) { en.target.classList.add("vis"); io.unobserve(en.target); } }), { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });
    $$(".rev").forEach(el => io.observe(el));
  } else $$(".rev").forEach(el => el.classList.add("vis"));

  /* ---------- Cifras animadas ---------- */
  function formatea(n, el) {
    const sinMiles = el.hasAttribute("data-sin-miles");
    const s = sinMiles ? String(n) : n.toLocaleString(CV.lang === "en" ? "en-GB" : "es-ES", { useGrouping: n >= 1000 ? "always" : false });
    return s + (el.dataset.suf || "");
  }
  function pintaCifras(animar) {
    $$(".cifra b[data-n]").forEach(el => {
      const fin = +el.dataset.n;
      if (!animar || reduce) { el.textContent = formatea(fin, el); return; }
      const ini = el.hasAttribute("data-sin-miles") ? 1900 : 0;
      const t0 = performance.now(), dur = 1600;
      (function paso(t) {
        const k = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - k, 3);
        el.textContent = formatea(Math.round(ini + (fin - ini) * e), el);
        if (k < 1) requestAnimationFrame(paso);
      })(t0);
    });
  }
  const cifras = $("#cifras");
  if (cifras && "IntersectionObserver" in window) {
    const ioC = new IntersectionObserver(([en]) => { if (en.isIntersecting) { pintaCifras(true); ioC.disconnect(); } }, { threshold: 0.4 });
    ioC.observe(cifras);
  }

  /* ---------- Pestañas de etapas ---------- */
  const tabs = $$('.regla [role="tab"]');
  function activa(tab, foco) {
    tabs.forEach(t => {
      const on = t === tab;
      t.setAttribute("aria-selected", String(on));
      t.tabIndex = on ? 0 : -1;
      $("#" + t.getAttribute("aria-controls")).hidden = !on;
    });
    if (foco) tab.focus();
    tab.scrollIntoView({ block: "nearest", inline: "nearest", behavior: reduce ? "auto" : "smooth" });
  }
  tabs.forEach((t, i) => {
    t.addEventListener("click", () => activa(t));
    t.addEventListener("keydown", e => {
      let j = null;
      if (e.key === "ArrowRight") j = (i + 1) % tabs.length;
      if (e.key === "ArrowLeft") j = (i - 1 + tabs.length) % tabs.length;
      if (e.key === "Home") j = 0;
      if (e.key === "End") j = tabs.length - 1;
      if (j !== null) { e.preventDefault(); activa(tabs[j], true); }
    });
  });
  CV.abrirEtapa = id => { const t = $("#tab-" + id); if (t) { activa(t); $("#etapas").scrollIntoView({ behavior: reduce ? "auto" : "smooth" }); } };

  /* ---------- Visor de fotos ---------- */
  const caja = $("#caja"); let volverA = null;
  function cajaAbrir(btn) {
    const img = $("img", caja);
    img.src = btn.dataset.full;
    img.alt = $("img", btn).alt;
    $("figcaption", caja).textContent = ($(".tesela__cap", btn) || {}).textContent || "";
    caja.hidden = false; volverA = btn;
    document.body.style.overflow = "hidden";
    $(".caja__x", caja).focus();
  }
  function cajaCerrar() { caja.hidden = true; document.body.style.overflow = ""; volverA && volverA.focus(); }
  $$(".tesela[data-full]").forEach(b => b.addEventListener("click", () => cajaAbrir(b)));
  $(".caja__x", caja).addEventListener("click", cajaCerrar);
  caja.addEventListener("click", e => { if (e.target === caja) cajaCerrar(); });
  addEventListener("keydown", e => { if (e.key === "Escape" && !caja.hidden) cajaCerrar(); });

  /* ---------- Buscador de paradas ---------- */
  const TURNOS = ["t1", "t2", "t3"];
  CV.buscarParadas = function (q) {
    const nq = CV.norm(q);
    if (nq.length < 3) return { q, lineas: [] };
    let terminos = null;
    if (CV.alias[nq]) terminos = CV.alias[nq];
    else {
      // alias contenido en la frase («vivo en las arenas», «desde getxo»)
      const hits = Object.keys(CV.alias).filter(a => (" " + nq + " ").includes(" " + a + " "));
      if (hits.length) terminos = [].concat(...hits.sort((a, b) => b.length - a.length).slice(0, 2).map(a => CV.alias[a]));
    }
    if (!terminos) terminos = [nq];
    terminos = terminos.map(CV.norm).filter(t => t.length >= 3);
    const out = [];
    TURNOS.forEach(tk => CV.rutas[tk].lineas.forEach(l => {
      const hit = [];
      l.p.forEach((p, i) => {
        const txt = " " + CV.norm(p.join(" ")) + " ";
        if (terminos.some(t => txt.includes(" " + t) || (t.length >= 5 && txt.includes(t)))) hit.push(i);
      });
      if (hit.length) out.push({ tk, l, hit });
    }));
    return { q, lineas: out };
  };
  CV.pintaLinea = function (r, compacta) {
    const T = CV.rutas[r.tk], u = CV.u();
    const cab = '<div class="linea-bus__cab"><span class="linea-bus__n" aria-hidden="true">' + r.l.n + '</span><span class="linea-bus__t"><b>' + u.linea + " " + r.l.n + " · " + T.nombre[CV.lang] + "</b><span>" + T.quien[CV.lang] + '</span></span><span class="linea-bus__h">' + (r.tk === "t3" ? "18:05" : u.sale + " " + r.l.sale) + "</span></div>";
    const paradas = r.l.p.map((p, i) => '<li class="' + (r.hit.includes(i) ? "hit" : "") + '">' + esc(p[0]) + (p[2] ? "<small>" + u.tarde + " " + esc(p[2]) + "</small>" : "") + "</li>").join("");
    return '<article class="linea-bus">' + cab + (compacta ? "" : '<ol class="paradas">' + paradas + "</ol>") + "</article>";
  };
  const res = $("#resParada"), inp = $("#qParada");
  function pintaResultados(q) {
    if (!q || CV.norm(q).length < 3) { res.innerHTML = '<div class="resultados__vacio"><svg aria-hidden="true"><use href="#i-bus"/></svg><p>' + CV.t("tr.vacio") + "</p></div>"; return; }
    const r = CV.buscarParadas(q), u = CV.u();
    if (!r.lineas.length) { res.innerHTML = '<p class="res-nada">' + esc(u.nada(q)) + "</p>"; return; }
    res.innerHTML = '<p class="res-cab"><b>' + u.hay(r.lineas.length) + "</b></p>" + r.lineas.map(x => CV.pintaLinea(x)).join("");
  }
  let tBusca;
  inp.addEventListener("input", () => { clearTimeout(tBusca); tBusca = setTimeout(() => pintaResultados(inp.value), 180); $$("#chipsParada button").forEach(b => b.classList.remove("on")); });
  $("#buscaParada").addEventListener("submit", e => { e.preventDefault(); pintaResultados(inp.value); });
  $$("#chipsParada button").forEach(b => b.addEventListener("click", () => { inp.value = b.textContent; $$("#chipsParada button").forEach(x => x.classList.toggle("on", x === b)); pintaResultados(b.textContent); }));
  CV.verParadas = q => { inp.value = q; pintaResultados(q); $("#transporte").scrollIntoView({ behavior: reduce ? "auto" : "smooth" }); };

  /* ---------- Noticias y agenda ---------- */
  const hoy = new Date(); hoy.setHours(0, 0, 0, 0);
  const fecha = iso => { const [y, m, d] = iso.split("-").map(Number); return new Date(y, m - 1, d); };
  function pintaNoticias() {
    const u = CV.u();
    $("#noticias").innerHTML = CV.noticias.map(n => {
      const f = fecha(n.d);
      return '<a class="noticia rev vis" href="' + CV.enlaces.noticia(n.id) + '" target="_blank" rel="noopener"><span class="noticia__tag tag-' + n.tipo + '">' + (n.tipo === "deporte" ? u.tagDeporte : u.tagFamilias) + '</span><time datetime="' + n.d + '">' + u.fecha(f.getDate(), u.mesesL[f.getMonth()], f.getFullYear()) + "</time><h3>" + esc(n[CV.lang] || n.es) + '</h3><span class="enl">' + u.leer + '<svg aria-hidden="true"><use href="#i-ext"/></svg></span></a>';
    }).join("");
  }
  CV.proximas = function (n) {
    return CV.calendario.filter(e => fecha(e.f || e.d) >= hoy).slice(0, n || 5);
  };
  function pintaAgenda() {
    const u = CV.u();
    $("#agenda").innerHTML = CV.proximas(5).map(e => {
      const f = fecha(e.d), fin = e.f ? fecha(e.f) : null;
      return '<li><span class="agenda__f"><b>' + f.getDate() + "</b><span>" + u.meses[f.getMonth()] + "</span></span><p>" + esc(e[CV.lang] || e.es) + (fin ? "<small>" + u.hasta(fin.getDate() + " " + u.meses[fin.getMonth()]) + "</small>" : "") + "</p></li>";
    }).join("");
  }

  /* ---------- Formulario ---------- */
  const form = $("#formContacto"), estado = $("#formEstado");
  form.addEventListener("submit", e => {
    e.preventDefault();
    let ok = true;
    $$("[required]", form).forEach(c => {
      const bien = c.type === "checkbox" ? c.checked : c.value.trim() && (!c.type || c.type !== "email" || /.+@.+\..+/.test(c.value));
      c.setAttribute("aria-invalid", String(!bien));
      if (!bien) ok = false;
    });
    estado.className = "form__estado" + (ok ? "" : " error");
    estado.textContent = ok ? CV.u().ok : CV.u().err;
    if (ok) form.reset();
    else { const pri = $('[aria-invalid="true"]', form); pri && pri.focus(); }
  });

  /* ---------- Idioma ---------- */
  document.addEventListener("cv:lang", () => {
    pintaNoticias(); pintaAgenda(); pintaCifras(false);
    if (inp.value) pintaResultados(inp.value); else pintaResultados("");
    if (!estado.classList.contains("error") && estado.textContent) estado.textContent = CV.u().ok;
  });
  pintaNoticias(); pintaAgenda();
  CV.iniciarIdioma();
})();
