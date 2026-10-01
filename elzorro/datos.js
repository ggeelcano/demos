// Carta de El Zorro Gastro Bar tal y como está publicada en elzorrogroup.es (ES y EN) el 1-oct-2026.
// `re` son las palabras con las que un cliente suele preguntar por esa sección o plato (texto ya sin tildes).
window.ZORRO_DATOS = {
  CARTA: [
    {
      id: "alitas", icono: "🍗", n: { es: "Alitas de pollo", en: "Chicken wings" }, re: /alitas?|\bwings?\b/,
      nota: { es: "8 uds. 11 € · 12 uds. 15 €", en: "8 pcs €11 · 12 pcs €15" },
      items: [
        { n: { es: "Buffalo", en: "Buffalo" }, d: { es: "glaseadas con salsa Buffalo ligeramente picante", en: "glazed with mildly spicy Buffalo sauce" }, re: /buffalo|bufalo/ },
        { n: { es: "Justin Beaber", en: "Justin Beaber" }, d: { es: "con salsa de mantequilla de maní salada y miel", en: "with salted peanut butter and honey sauce" }, re: /justin|beaber|bieber|mani\b|cacahuete|peanut/ },
        { n: { es: "Gangnam Style", en: "Gangnam Style" }, d: { es: "con salsa teriyaki y miel", en: "with teriyaki and honey sauce" }, re: /gangnam|teriyaki/ },
        { n: { es: "Ladyboy", en: "Ladyboy" }, d: { es: "con salsa agridulce", en: "with sweet and sour sauce" }, re: /ladyboy|agridulce|sweet and sour/ },
      ],
    },
    {
      id: "picar", icono: "🍤", n: { es: "Para picar", en: "To share" }, re: /para picar|picar|picoteo|tapas?\b|entrantes|raciones|starters|to share|small plates/,
      items: [
        { n: { es: "Boquerones del Cantábrico en vinagre (6 uds.) con papas", en: "Cantabrian anchovies in vinegar (6 pcs) with crisps" }, p: 8.5, re: /boqueron|anchov/ },
        { n: { es: "Gyozas con cerdo (6 uds.)", en: "Pork gyozas (6 pcs)" }, p: 6, re: /gyoza|giosa|guioza|empanadillas japonesas|dumpling/ },
        { n: { es: "Gyozas con pollo (6 uds.)", en: "Chicken gyozas (6 pcs)" }, p: 6, re: /gyoza|giosa|guioza|dumpling/ },
        { n: { es: "Gyozas con langostinos (6 uds.)", en: "Prawn gyozas (6 pcs)" }, p: 8.5, re: /gyoza|giosa|guioza|dumpling|langostino/ },
        { n: { es: "Gambas torpedo (6 uds.)", en: "Torpedo prawns (6 pcs)" }, p: 12, re: /gambas?\b|torpedo|prawns?/ },
        { n: { es: "Croquetas con jamón (6 uds.)", en: "Ham croquettes (6 pcs)" }, p: 6.5, re: /croquet/ },
        { n: { es: "Croquetas con boletus y trufa (6 uds.)", en: "Boletus & truffle croquettes (6 pcs)" }, p: 7, re: /croquet|boletus/ },
        { n: { es: "Jalapeños rellenos de queso crema (6 uds.)", en: "Cream cheese stuffed jalapeños (6 pcs)" }, p: 7, re: /jalapen/ },
        { n: { es: "Calamares a la romana (8 uds.)", en: "Roman-style calamari (8 pcs)" }, p: 10, re: /calamar|squid/ },
        { n: { es: "Nachos cargados (para 2 personas)", en: "Loaded nachos (for 2)" }, p: 12, re: /nachos?/ },
      ],
    },
    {
      id: "patatas", icono: "🍟", n: { es: "Patatas completas", en: "Loaded fries" }, re: /patatas|papas|fries|chips/,
      items: [
        { n: { es: "Patatas fritas", en: "French fries" }, p: 4, re: /patatas fritas|french fries/ },
        { n: { es: "Patatas bravas", en: "Patatas bravas" }, p: 7.5, re: /bravas/ },
        { n: { es: "Patatas con salsa de trufa y queso curado", en: "Fries with truffle sauce and cured cheese" }, p: 8, re: /trufa|truffle/ },
        { n: { es: "Patatas con queso y bacon", en: "Fries with cheese and bacon" }, p: 8, re: /bacon|beicon/ },
        { n: { es: "Patatas con queso y chorizo", en: "Fries with cheese and chorizo" }, p: 8, re: /chorizo/ },
        { n: { es: "Patatas con mango curry y pepinillos", en: "Fries with mango curry and pickles" }, p: 8, re: /curry|mango/ },
        { n: { es: "Patatas de Resaca", en: "Hangover fries" }, p: 12, re: /patatas de resaca|hangover fries/ },
      ],
    },
    {
      id: "bocadillos", icono: "🥖", n: { es: "Bocadillos", en: "Sandwiches" }, re: /bocadillos?|bocatas?|sandwich/,
      items: [
        { n: { es: "Bocadillo de pollo Buffalo", en: "Buffalo chicken sandwich" }, p: 9, d: { es: "pollo estilo Buffalo, mozzarella fundida, pepinillos y cebolla morada", en: "Buffalo-style chicken, melted mozzarella, pickles and red onion" }, re: /bocadillo de pollo|chicken sandwich/ },
        { n: { es: "Bocadillo de Resaca", en: "Hangover sandwich" }, p: 8.5, d: { es: "pulled pork BBQ, pepinillos y lechuga fresca", en: "BBQ pulled pork, pickles and fresh lettuce" }, re: /bocadillo de resaca|pulled pork|hangover sandwich/ },
        { n: { es: "Bocadillo de atún", en: "Tuna sandwich" }, p: 8, d: { es: "atún, tomate, aceitunas y cebolla morada", en: "tuna, tomato, olives and red onion" }, re: /\batun\b|\btuna\b/ },
      ],
    },
    {
      id: "infantil", icono: "🧒", n: { es: "Menú infantil", en: "Kids' menu" }, re: /infantil|menu (de |para )?(ninos|peques)|kids'? menu|children'?s menu|nuggets/,
      items: [
        { n: { es: "Nuggets de pollo (6 uds.) con patatas fritas", en: "Chicken nuggets (6 pcs) & fries" }, p: 8.5, re: /nuggets?/ },
        { n: { es: "Palitos de mozzarella (6 uds.)", en: "Mozzarella sticks (6 pcs)" }, p: 7, re: /palitos|mozzarella sticks/ },
        { n: { es: "Gambitas rebozadas", en: "Battered prawns" }, p: 6, re: /gambitas|battered prawns/ },
        { n: { es: "Bolsa de patatas fritas", en: "Bag of crisps" }, p: 2, re: /bolsa de patatas/ },
        { n: { es: "Helado", en: "Ice cream" }, pt: { es: "pregunta en la barra", en: "ask at the bar" }, re: /helado|ice ?cream|postre|dessert/ },
      ],
    },
  ],
};
