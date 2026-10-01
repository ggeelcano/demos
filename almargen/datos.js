// Carta de AL Margen tal y como está publicada en restaurantealmargen.com el 1-oct-2026 (PDF en castellano e inglés,
// agrupada igual que en el PDF). `re` son las palabras con las que un cliente suele preguntar por el plato (texto sin tildes).
// El menú degustación sale de la página «Comida» de la web (3 snacks + 8 pasos, 60 €); el PDF de la carta todavía
// dice 7 pasos y 50 €. Si el bueno es el del PDF, se cambia aquí y nada más.
window.MARGEN_DATOS = {
  MENU: { pasos: 8, snacks: 3, precio: 60 },
  PAN: 2,
  CARTA: [
    [
      { n: { es: "Brócoli, ajetes, lima", en: "Broccoli, spring onions, lime" }, p: 15, re: /brocoli|broccoli|ajetes/ },
      { n: { es: "Puerro, holandesa, avellana", en: "Leek, hollandaise sauce, hazelnut" }, p: 18, re: /puerro|\bleek|holandesa|hollandaise|avellana|hazelnut/ },
      { n: { es: "Berenjena, burrata, uva", en: "Aubergine, burrata, grape" }, p: 18, re: /berenjena|aubergine|eggplant|burrata/ },
    ],
    [
      { n: { es: "Gamba blanca, nata-kombu", en: "White prawn, kombu cream" }, p: 25, re: /gambas?\b|prawns?|kombu/ },
      { n: { es: "Arroz, pichón, vieira", en: "Rice, pigeon, scallops" }, p: 32, re: /arroz|\brice\b|pichon|pigeon|vieira|scallop/ },
    ],
    [
      { n: { es: "Corvina, trigo sarraceno, salicornia", en: "Sea bream, buckwheat, salicornia" }, p: 29, pescado: true, re: /corvina|sea bream|sarraceno|buckwheat|salicornia/ },
      { n: { es: "Pierna de cordero, pimiento, boniato", en: "Lamb leg, pepper, sweet potato" }, p: 29, carne: true, re: /cordero|\blamb\b|boniato/ },
      { n: { es: "Canelón de vaca, velouté, demi glace", en: "Beef cannelloni, velouté, demi-glace" }, p: 28, carne: true, re: /canelon|cannelloni/ },
    ],
    [
      { n: { es: "Lomo de vaca, patata, cogollo", en: "Beef steak, potato, head lettuce" }, p: 28, carne: true, re: /lomo|\bsteak\b|chuleta|solomillo|entrecot/ },
      { n: { es: "Rodaballo, bilbaína, brotes tiernos", en: "Turbot, bilbaína sauce, sprouts" }, p: 35, pescado: true, re: /rodaballo|turbot|bilbaina/ },
    ],
    [
      { n: { es: "Melocotón, yogur y aceituna negra", en: "Peach, yogurt, black olive" }, p: 8, postre: true, re: /melocoton|peach|yogur/ },
      { n: { es: "Bizcocho, plátano, dulce de leche", en: "Cake, banana, toffee" }, p: 8, postre: true, re: /bizcocho|\bcake\b|platano|banana|dulce de leche|toffee/ },
    ],
  ],
};
