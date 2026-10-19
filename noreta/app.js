// Catálogo real de noretatienda.com (precios y plazos de preparación de cada ficha, octubre 2026).
const TIENDA = "https://www.noretatienda.com/producto/";

// slug: [nombre, precio, etiqueta, plazo, modelo del personalizador]
const P = {
  "cirio-de-bautizo-angelo": ["Cirio de bautizo Angelo", 42, "Más vendido", "4-8 días", "angelo"],
  "vela-bautizo-peces": ["Vela bautizo Peces", 42, "Más vendido", "4-8 días"],
  "vela-bautizo-angela": ["Vela bautizo Angela", 42, "-20 % con recordatorio", "4-8 días", "angela"],
  "vela-bautizo-nube": ["Vela bautizo Nube", 42, "", "4-8 días", "nube"],
  "vela-bautizo-petalos": ["Vela bautizo personalizada Pétalos", 42, "", "4-8 días", "petalos"],
  "vela-bautismo-ocean": ["Vela bautismo Ocean", 42, "", "4-8 días"],
  "vela-bautizo-cruz": ["Vela bautizo Cruz", 42, "", "4-8 días"],
  "cirio-de-bautizo-jordan": ["Cirio de bautizo personalizado Jordán", 42, "", "4-8 días"],
  "vela-bautizo-shema": ["Vela bautizo personalizada Shemá", 42, "", "4-8 días"],
  "recordatorio-de-bautizo-angelo": ["Recordatorio de bautizo Angelo", 8, "", "7-10 días", "", true],
  "recordatorio-de-bautizo-angela": ["Recordatorio de bautizo Angela", 8, "", "7-10 días", "", true],
  "recordatorio-de-bautizo-peces": ["Recordatorio de bautizo Peces", 8, "", "7-10 días", "", true],
  "portavelas-de-madera": ["Portavelas de madera", 3.95, "", "1-2 días"],
  "cuadro-nacimiento-patucos": ["Lámina natalicia personalizada Patucos", 24.95, "Más vendido", "2-3 días"],
  "vela-de-nacimiento-personalizada-baby": ["Vela de nacimiento personalizada Baby", 42, "Nuevo", "4-8 días"],
  "vela-personalizada-con-tu-dibujo-o-foto": ["Vela personalizada como tú quieras", 52, "", "5-10 días"],
  "body-de-bebe-personalizado-bordado": ["Body de bebé bordado con su nombre", 21.95, "Nuevo", "9-11 días", "", false, "body-de-bebé-personalizado-bordado"],
  "velas-ceremonia-de-la-luz-modelo-olivo": ["Velas Ceremonia de la Luz Olivo (set de 3 y portavelas)", 70, "Más vendido", "4-8 días"],
  "velas-ceremonia-de-la-luz-modelo-fiore-set-3-velas-y-portavelas": ["Velas Ceremonia de la Luz Fiore (set de 3 y portavelas)", 70, "", "4-8 días"],
  "velas-ceremonia-de-la-luz-modelo-cuarzo-set-3-velas-y-portavelas": ["Velas Ceremonia de la Luz Cuarzo (set de 3 y portavelas)", 70, "", "4-8 días"],
  "vela-comunion-espigas": ["Vela de comunión personalizada Espigas", 42, "", "4-8 días"],
  "vela-comunion-crux": ["Vela de comunión personalizada Crux", 42, "", "4-8 días"],
  "vela-de-comunion-letter": ["Vela de comunión Letter", 42, "Nuevo", "4-8 días"],
  "vela-perfumada-en-vaso-para-regalo": ["Vela en vaso de cristal y bambú Vanila", 4.9, "", "9-12 días", "", true],
};

const LISTAS = {
  favoritos: ["cirio-de-bautizo-angelo", "vela-bautizo-peces", "recordatorio-de-bautizo-angelo", "cuadro-nacimiento-patucos",
    "velas-ceremonia-de-la-luz-modelo-olivo", "vela-de-nacimiento-personalizada-baby", "vela-personalizada-con-tu-dibujo-o-foto", "body-de-bebe-personalizado-bordado"],
  bautizo: ["vela-bautizo-angela", "vela-bautizo-nube", "vela-bautizo-petalos", "vela-bautismo-ocean", "vela-bautizo-cruz",
    "cirio-de-bautizo-jordan", "vela-bautizo-shema", "recordatorio-de-bautizo-angela", "recordatorio-de-bautizo-peces", "portavelas-de-madera"],
  boda: ["velas-ceremonia-de-la-luz-modelo-fiore-set-3-velas-y-portavelas", "velas-ceremonia-de-la-luz-modelo-cuarzo-set-3-velas-y-portavelas",
    "velas-ceremonia-de-la-luz-modelo-olivo", "vela-comunion-espigas", "vela-comunion-crux", "vela-de-comunion-letter", "vela-perfumada-en-vaso-para-regalo"],
};

const OCASIONES = [
  ["Nacimiento", "img/p/cuadro-nacimiento-patucos.webp", "https://www.noretatienda.com/nacimiento", "Lámina natalicia de Valeria con unos patucos"],
  ["Bautizo", "img/p/vela-bautizo-nube.webp", "#bautizo", "Vela de bautizo Nube con el nombre Marina"],
  ["Comunión", "img/p/vela-comunion-espigas.webp", "https://www.noretatienda.com/cirios-y-velas-de-comunion", "Vela de comunión con espigas y el nombre Santiago"],
  ["Boda", "img/p/velas-ceremonia-de-la-luz-modelo-fiore-set-3-velas-y-portavelas.webp", "#boda", "Set de tres velas para la ceremonia de la luz"],
  ["Regalos", "img/regalos.webp", "https://www.noretatienda.com/detalles", "Vela con el nombre Carla en su caja de regalo"],
  ["Crea tu vela", "img/p/vela-personalizada-con-tu-dibujo-o-foto.webp", "https://www.noretatienda.com/producto/vela-personalizada-con-tu-dibujo-o-foto", "Vela personalizada para el aniversario de unos abuelos"],
  ["Cristopolis®", "img/cristopolis-familia.webp", "https://www.noretatienda.com/cristopolis", "Familia jugando a Cristopolis en el salón"],
];

const euros = n => n.toLocaleString("es-ES", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " €";
const check = '<svg viewBox="0 0 16 16" width="13" height="13" aria-hidden="true"><path d="M2.5 8.5l3.5 3.5 7.5-8" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>';

function tarjeta(slug) {
  const [nombre, precio, etq, plazo, modelo, desde, urlReal] = P[slug];
  const href = modelo ? `personaliza/?modelo=${modelo}` : TIENDA + (urlReal || slug);
  return `<a class="prod" href="${href}">
    <div class="prod-img">
      <img src="img/p/${slug}.webp" alt="${nombre}" width="640" height="800" loading="lazy">
      ${etq ? `<span class="etq">${etq}</span>` : ""}
    </div>
    <h3>${nombre}</h3>
    <p class="plazo">${check}<span>Preparación: ${plazo}</span></p>
    <p class="precio">${desde ? "Desde " : ""}${euros(precio)}</p>
    ${modelo ? '<span class="prueba">Escribe su nombre y mírala antes de comprar</span>' : ""}
  </a>`;
}

function ocasion([nombre, img, href, alt]) {
  return `<a class="col" href="${href}">
    <div class="col-img"><img src="${img}" alt="${alt}" width="640" height="640" loading="lazy"></div>
    <span>${nombre}</span>
  </a>`;
}

const flechaSvg = d => `<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="${d}" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

document.querySelectorAll(".carril").forEach(carril => {
  const lista = carril.dataset.lista;
  const html = lista === "ocasiones" ? OCASIONES.map(ocasion).join("") : LISTAS[lista].map(tarjeta).join("");
  carril.innerHTML = `<div class="carril-wrap">
    <div class="carril-pista" tabindex="0" role="region" aria-label="Desliza para ver más">${html}</div>
    <button class="flecha flecha-izq" type="button" aria-label="Anteriores" hidden>${flechaSvg("M15 5l-7 7 7 7")}</button>
    <button class="flecha flecha-der" type="button" aria-label="Siguientes">${flechaSvg("M9 5l7 7-7 7")}</button>
  </div>`;
  const pista = carril.querySelector(".carril-pista");
  const izq = carril.querySelector(".flecha-izq");
  const der = carril.querySelector(".flecha-der");
  const paso = () => pista.clientWidth * 0.8;
  const actualizar = () => {
    const img = pista.querySelector("img");
    if (img) carril.style.setProperty("--alto-img", img.getBoundingClientRect().height + "px");
    izq.hidden = pista.scrollLeft < 8;
    der.hidden = pista.scrollLeft + pista.clientWidth >= pista.scrollWidth - 8;
  };
  izq.addEventListener("click", () => pista.scrollBy({ left: -paso(), behavior: "smooth" }));
  der.addEventListener("click", () => pista.scrollBy({ left: paso(), behavior: "smooth" }));
  pista.addEventListener("scroll", actualizar, { passive: true });
  addEventListener("resize", actualizar);
  addEventListener("load", actualizar);
  actualizar();
});

// La cinta se duplica para que el desplazamiento sea continuo.
const pistaCinta = document.querySelector(".cinta-pista");
[...pistaCinta.children].forEach(li => {
  const copia = li.cloneNode(true);
  copia.setAttribute("aria-hidden", "true");
  pistaCinta.appendChild(copia);
});

// Menú en móvil y tablet
const hamb = document.getElementById("hamb");
const menu = document.getElementById("menu");
hamb.addEventListener("click", () => {
  const abierto = menu.classList.toggle("abierto");
  hamb.setAttribute("aria-expanded", abierto);
  hamb.setAttribute("aria-label", abierto ? "Cerrar el menú" : "Abrir el menú");
});
menu.addEventListener("click", e => {
  if (e.target.closest("a")) { menu.classList.remove("abierto"); hamb.setAttribute("aria-expanded", "false"); }
});
addEventListener("keydown", e => {
  if (e.key === "Escape" && menu.classList.contains("abierto")) { menu.classList.remove("abierto"); hamb.setAttribute("aria-expanded", "false"); hamb.focus(); }
});

// Boletín (en la tienda real lo recogería Wix)
document.getElementById("bolForm").addEventListener("submit", e => {
  e.preventDefault();
  const mail = document.getElementById("bolMail");
  const ok = document.getElementById("bolOk");
  if (!mail.checkValidity() || !mail.value) {
    ok.textContent = "Revisa el correo, parece que falta algo.";
    mail.focus();
    return;
  }
  ok.textContent = "¡Gracias! Te avisaremos cuando haya novedades en el taller.";
  mail.value = "";
});
