/* Datos reales del Colegio Vizcaya (fuente: colegiovizcaya.net y sus PDF del curso 2026-27). */
window.CV = window.CV || {};

/* Recorridos de autobús 2026-27. «t»: parada distinta por la tarde. «m»: municipio cuando es seguro. */
CV.rutas = {
  t1: {
    nombre: { es: "1.er turno", eu: "1. txanda", en: "1st run" },
    quien: { es: "de 5.º de Primaria a Bachillerato", eu: "LHko 5. mailatik Batxilergora", en: "Year 5 of Primary to Bachillerato" },
    lineas: [
      { n: 1, sale: "7:45", p: [["Berango (Moreaga)", "Berango"], ["Berango (S. Otxandategi, 128)", "Berango"], ["Leioa (Ikea)", "Leioa"], ["Sondika (Batzoki)", "Sondika"], ["Sondika (BBK Empresas)", "Sondika"], ["Larrondo (Renault)", "Loiu"]] },
      { n: 2, sale: "7:50", p: [["Artaza (Sanitas)", "Leioa"], ["Las Arenas (BBVA)", "Getxo", "Puente Colgante"], ["Gobelaurre, frente al 45", "Getxo", "La Avanzada, 11"], ["Leioa (Mulligans)", "Leioa"]] },
      { n: 3, sale: "7:50", p: [["Galdakao (J. B. Uriarte, 24)", "Galdakao"], ["Galdakao (Ayuntamiento)", "Galdakao"], ["Galdakao (Zabalgane)", "Galdakao"], ["Lezama (Ayuntamiento)", "Lezama"], ["Lezama (Uzabal, Athletic)", "Lezama"], ["Zamudio (Plaza, frente a la estación)", "Zamudio"]] },
      { n: 4, sale: "7:50", p: [["Santutxu (Santa Clara, 13)", "Bilbao"], ["Santutxu, 48", "Bilbao"], ["Txomin Garat (Farmacia)", "Bilbao"], ["Zabalbide, 61 (solo por la mañana)", "Bilbao"]] },
      { n: 5, sale: "7:45", p: [["Auntxetxeta, 20", ""], ["Gran Vía, 41 (Plaza Elíptica)", "Bilbao", "Gran Vía, 46"]] },
      { n: 6, sale: "7:50", p: [["Alameda Urkijo, 14 (solo por la mañana)", "Bilbao"], ["Alameda Urkijo, 94", "Bilbao"], ["Gran Vía (Moyua)", "Bilbao", "Gran Vía, 46"], ["Begoña (Lorea)", "Bilbao"]] },
      { n: 7, sale: "7:45", p: [["Bentazarra", "Bilbao"], ["Gran Vía (Renault)", "Bilbao"], ["Alameda Rekalde, 11", "Bilbao"]] },
      { n: 8, sale: "7:55", p: [["Museo de Bellas Artes (frente al museo)", "Bilbao", "Museo"], ["Campo Volantín (Zubizuri)", "Bilbao"], ["Panera", "Bilbao"]] },
      { n: 9, sale: "7:50", p: [["La Peña (Abusu / Ibaieder)", "Bilbao"], ["Urazurrutia, 1 (Casa Cuna)", "Bilbao"], ["Puente del Arenal (frente al Arriaga)", "Bilbao"], ["Hurtado de Amezaga (Abando)", "Bilbao"], ["Ayuntamiento (gasolinera)", "Bilbao"]] },
      { n: 10, sale: "7:50", p: [["La Bilbaína (Centro Cívico)", ""], ["Zamudio (Plaza, frente a la estación)", "Zamudio"], ["Derio (Lainomendi, 31, solo por la mañana)", "Derio"], ["Derio (Aldekone, Mungialde Etorbidea 61)", "Derio"], ["Derio (Cruce, Mungialde Etorbidea 1)", "Derio"]] },
      { n: 11, sale: "7:45", p: [["Astrabudua (Ambulatorio)", "Erandio"], ["Erandio (Embarcadero)", "Erandio"], ["San Ignacio (Plaza Levante)", "Bilbao"], ["San Ignacio (BBK)", "Bilbao"], ["Sarriko (Facultad)", "Bilbao"], ["Deusto (frente al Sanatorio Bidarte)", "Bilbao"], ["Deusto (San Pedro)", "Bilbao"]] },
      { n: 12, sale: "7:40", p: [["Arrigorriaga (S. Ochoa, 15)", "Arrigorriaga", "Ambulatorio"], ["Arrigorriaga (Polideportivo)", "Arrigorriaga", "Lonbo"], ["San Antonio, 27 (supermercado)", "Etxebarri"], ["Etxebarri (c/ Fuenlabrada)", "Etxebarri"]] },
      { n: 13, sale: "7:45", p: [["Urban Galindo (Av. Altos Hornos, 28)", "Barakaldo"], ["Barakaldo (Gambrinus)", "Barakaldo"], ["Barakaldo (Landeta, frente a los Juzgados)", "Barakaldo"], ["Cruces (La Paz, 14, ambulatorio)", "Barakaldo"], ["Cruces (Hospital)", "Barakaldo"]] },
      { n: 14, sale: "7:40", p: [["Algorta (Ayuntamiento)", "Getxo"], ["Algorta (Supermercado BM)", "Getxo"], ["Santa María de Getxo (La Venta)", "Getxo"], ["Andra Mari (Probadero)", "Getxo"], ["Sarrikobaso, 39 (cruce Venancios)", "Getxo"], ["Algorta (Getxo I, Los Chopos 93)", "Getxo"], ["Algorta (Jolaseta, Los Chopos 35)", "Getxo"]] },
      { n: 15, sale: "7:45", p: [["Zorroza (Fray Juan, 11)", "Bilbao"], ["Autonomía, 43", "Bilbao", "Autonomía, 50"], ["Autonomía, 15", "Bilbao", "Autonomía, 22"], ["Autonomía, 1", "Bilbao", "Autonomía, 4"]] },
      { n: 16, sale: "7:40", p: [["San Miguel (La Barriada, Gernika 5)", "Basauri"], ["Basauri (Ayuntamiento)", "Basauri"], ["Basauri (Miradores)", "Basauri"], ["Basauri (Ariz, Lehendakari Agirre 73)", "Basauri"], ["Jardines de Gernika, 11", "Bilbao"], ["Jardines de Gernika, 1 (solo por la mañana)", "Bilbao"]] },
      { n: 17, sale: "7:45", p: [["Polideportivo El Fango", "Bilbao"], ["Rekaldeberri (Ciudadela)", "Bilbao"], ["Amezola (frente a la estación)", "Bilbao"], ["Eskurtze, 10", "Bilbao", "Rotonda de Eskurtze (Irala)"], ["Rotonda de Eskurtze (Irala)", "Bilbao"], ["San Adrián (BBK)", "Bilbao", "Av. Askatasuna (BBVA)"], ["J. Zugazagoitia, 13", "Bilbao", "Deluxe"]] }
    ]
  },
  t2: {
    nombre: { es: "2.º turno", eu: "2. txanda", en: "2nd run" },
    quien: { es: "de Infantil a 4.º de Primaria", eu: "Haur Hezkuntzatik LHko 4. mailara", en: "Infant school to Year 4 of Primary" },
    lineas: [
      { n: 1, sale: "9:10", p: [["San Ignacio (Plaza Levante)", "Bilbao"], ["San Ignacio (BBK)", "Bilbao"], ["Sarriko (Facultad)", "Bilbao"], ["Deusto (San Pedro)", "Bilbao"]] },
      { n: 2, sale: "9:00", p: [["Las Arenas (Eduardo Coste, solo por la mañana)", "Getxo"], ["Las Arenas (BBVA)", "Getxo"], ["Leioa (Ikea)", "Leioa"]] },
      { n: 3, sale: "9:05", p: [["Elkano (frente al 9)", "Bilbao"], ["Alameda Urkijo, 66", "Bilbao"], ["Alameda Urkijo, 94", "Bilbao"]] },
      { n: 4, sale: "8:55", p: [["La Bilbaína (Centro Cívico)", ""], ["Derio (Lainomendi, 31)", "Derio"], ["Derio (Aldekone, Mungialde Etorbidea 61)", "Derio"], ["Derio (Cruce, Mungialde Etorbidea 1)", "Derio"], ["Zamudio (Estación)", "Zamudio"]] },
      { n: 5, sale: "9:00", p: [["Urban Galindo (Av. Altos Hornos, 28)", "Barakaldo"], ["Barakaldo (Gambrinus)", "Barakaldo", "Los Hermanos Parkea"], ["Barakaldo (Landeta, Juzgados)", "Barakaldo", "La Florida, 7"], ["Cruces (Hospital)", "Barakaldo", "Hospital, c/ Balejo"], ["Sondika (Batzoki)", "Sondika"]] },
      { n: 6, sale: "8:55", p: [["Cruces (Basatxu, La Dinamita)", "Barakaldo"], ["Zorroza (Fray Juan, 11)", "Bilbao"], ["Autonomía, 43", "Bilbao"], ["Autonomía, 15", "Bilbao"]] },
      { n: 7, sale: "8:55", p: [["Galdakao (Ayuntamiento)", "Galdakao"], ["Miribilla (J. Zugazagoitia)", "Bilbao"], ["Miribilla (J. Gernika, 11)", "Bilbao"], ["Av. Askatasuna (BBVA)", "Bilbao"]] },
      { n: 8, sale: "9:05", p: [["Alameda San Mamés, 8", "Bilbao", "Autonomía, 1"], ["Iparraguirre, 29 (Plaza Elíptica)", "Bilbao", "Gran Vía, 41"], ["Alameda Rekalde, 11", "Bilbao"]] },
      { n: 9, sale: "9:05", p: [["Begoña (Lorea)", "Bilbao"], ["Santutxu (Santa Clara, 13)", "Bilbao"], ["Santutxu, 2", "Bilbao"]] },
      { n: 10, sale: "9:05", p: [["Gran Vía (frente a Renault)", "Bilbao"], ["Gran Vía, 41 (Plaza Elíptica)", "Bilbao"], ["Museo de Bellas Artes (frente al museo)", "Bilbao", "Museo"]] },
      { n: 11, sale: "8:55", p: [["Basauri (Miradores)", "Basauri"], ["Basauri (Ariz, Lehendakari Agirre 73)", "Basauri"], ["Etxebarri (San Antonio, 27, supermercado)", "Etxebarri"], ["Etxebarri (c/ Fuenlabrada)", "Etxebarri"], ["Txomin Garat (Farmacia)", "Bilbao"]] },
      { n: 12, sale: "8:55", p: [["Bentazarra", "Bilbao"], ["Basurto (estación de tren)", "Bilbao", "Hospital"], ["Amezola (Av. del Ferrocarril, estación)", "Bilbao"], ["Hurtado de Amezaga (Abando)", "Bilbao"]] },
      { n: 13, sale: "8:50", p: [["Astrabudua (Ambulatorio)", "Erandio"], ["Erandio (Embarcadero)", "Erandio"], ["Deusto (frente al Sanatorio Bidarte)", "Bilbao"], ["Campo Volantín (Zubizuri)", "Bilbao"]] },
      { n: 14, sale: "8:50", p: [["Algorta (Ayuntamiento)", "Getxo"], ["Algorta (Supermercado BM)", "Getxo"], ["Andra Mari (Probadero)", "Getxo"], ["Berango (Moreaga)", "Berango"], ["Berango (S. Otxandategi, 128)", "Berango"], ["Algorta (Getxo I, Los Chopos 93)", "Getxo"], ["Algorta (Los Chopos, 45)", "Getxo"]] },
      { n: 16, sale: "9:00", p: [["La Peña (Abusu / Ibaieder)", "Bilbao"], ["Urazurrutia, 1 (Casa Cuna)", "Bilbao"], ["Iglesia de San Nicolás", "Bilbao"], ["Ayuntamiento", "Bilbao"], ["Panera", "Bilbao"]] }
    ]
  },
  t3: {
    nombre: { es: "Extraescolares", eu: "Eskolaz kanpokoak", en: "After-school run" },
    quien: { es: "salida del colegio a las 18:05", eu: "ikastetxetik 18:05ean", en: "leaves school at 18:05" },
    lineas: [
      { n: 1, sale: "18:05", p: [["Bolueta (gasolinera)", "Bilbao"], ["Jardines de Gernika (Deluxe)", "Bilbao"], ["Jardines de Gernika, 11", "Bilbao"], ["San Adrián (c/ Askatasuna, BBVA)", "Bilbao"], ["Olano Kalea, 4", ""], ["La Peña (Zamakola, 75)", "Bilbao"]] },
      { n: 2, sale: "18:05", p: [["Larrondo (frente a Renault)", "Loiu"], ["Sondika (BBK Empresas)", "Sondika"], ["Sondika (Batzoki)", "Sondika"], ["Barakaldo (Landeta, Juzgados)", "Barakaldo"], ["Urban Galindo (Av. Altos Hornos, 28)", "Barakaldo"], ["Cruces (Hospital, c/ Horacio Etxeb.)", "Barakaldo"], ["Zorroza (quiosco, Fray Juan 6)", "Bilbao"]] },
      { n: 3, sale: "18:05", p: [["Txomin Garat (Farmacia)", "Bilbao"], ["Txomin Garat, 40", "Bilbao"], ["Etxebarri (Cruce)", "Etxebarri"], ["Basauri (Lehendakari Agirre, 73)", "Basauri"], ["Basauri (Colegio San José)", "Basauri"], ["Arrigorriaga (Estación)", "Arrigorriaga"]] },
      { n: 4, sale: "18:05", p: [["Leioa (Centro Cívico)", "Leioa"], ["Leioa (frente a Mulligans)", "Leioa"], ["Algorta (Fadura, Los Chopos 46)", "Getxo"], ["Algorta (Aldapas, Ollaretxe 8)", "Getxo"], ["Algorta (cruce Venancios)", "Getxo"], ["Algorta (San Martín, 33)", "Getxo"], ["Algorta (Algortako Etorbidea 47, Casino)", "Getxo"], ["Algorta (Iglesia San Ignacio)", "Getxo"], ["Las Arenas (Iglesia de Las Mercedes)", "Getxo"], ["Las Arenas (Puente Colgante)", "Getxo"]] },
      { n: 5, sale: "18:05", p: [["Begoña (Lorea)", "Bilbao"], ["Santutxu (Santa Clara)", "Bilbao"], ["Autonomía, 4", "Bilbao"], ["Autonomía, 24", "Bilbao"], ["Autonomía, 50 (Félix Serrano)", "Bilbao"]] },
      { n: 6, sale: "18:05", p: [["Panera", "Bilbao"], ["Ayuntamiento (entrada principal)", "Bilbao"], ["Campo Volantín (Zubizuri)", "Bilbao"], ["Erandio (Embarcadero)", "Erandio"], ["Astrabudua (Ambulatorio)", "Erandio"]] },
      { n: 7, sale: "18:05", p: [["Derio (Ambulatorio)", "Derio"], ["Derio (Aldekone)", "Derio"], ["Zamudio (estación de tren)", "Zamudio"], ["Lezama (Frontón)", "Lezama"], ["Galdakao (Zabalgane)", "Galdakao"], ["Galdakao (J. B. Uriarte, 37)", "Galdakao"]] },
      { n: 8, sale: "18:05", p: [["Gran Vía (Renault)", "Bilbao"], ["Deusto (San Pedro)", "Bilbao"], ["Deusto (Bidarte)", "Bilbao"], ["Sarriko", "Bilbao"], ["San Ignacio (Plaza Levante)", "Bilbao"]] },
      { n: 9, sale: "18:05", p: [["Alameda Rekalde, 14", "Bilbao"], ["Gran Vía, 46 (Moyua)", "Bilbao"], ["Basurto (Hospital)", "Bilbao"], ["Bentazarra", "Bilbao"]] }
    ]
  }
};

/* Barrios y alias para el buscador: lo que escribe la familia → texto que aparece en las paradas. */
CV.alias = {
  "las arenas": ["las arenas", "puente colgante", "gobelaurre", "eduardo coste"], "areeta": ["las arenas", "puente colgante"],
  "algorta": ["algorta", "sarrikobaso", "andra mari"], "neguri": ["gobelaurre", "jolaseta"], "getxo": ["getxo", "algorta", "las arenas", "andra mari", "sarrikobaso", "gobelaurre", "jolaseta"],
  "indautxu": ["autonomia", "alameda urkijo", "alameda rekalde", "iparraguirre", "san mames"], "abando": ["abando", "hurtado de amezaga", "gran via", "moyua", "elkano", "alameda urkijo"],
  "moyua": ["moyua"], "gran via": ["gran via", "moyua"], "casco viejo": ["arenal", "ayuntamiento", "san nicolas", "panera"], "zazpikaleak": ["arenal", "ayuntamiento", "san nicolas", "panera"],
  "bilbao la vieja": ["urazurrutia"], "deusto": ["deusto", "sarriko", "san ignacio"], "san ignacio": ["san ignacio"], "san inazio": ["san ignacio"],
  "txurdinaga": ["txomin garat"], "otxarkoaga": ["txomin garat"], "santutxu": ["santutxu", "zabalbide"], "begona": ["begona"], "miribilla": ["miribilla", "jardines de gernika"],
  "rekalde": ["rekaldeberri", "eskurtze", "amezola", "el fango"], "rekaldeberri": ["rekaldeberri"], "irala": ["eskurtze", "irala"], "san adrian": ["san adrian"],
  "basurto": ["basurto", "bentazarra"], "zorrotza": ["zorroza"], "zorroza": ["zorroza"], "uribarri": ["campo volantin"], "bolueta": ["bolueta"], "la pena": ["la pena"],
  "lutxana": ["urban galindo"], "cruces": ["cruces"], "gurutzeta": ["cruces"], "barakaldo": ["barakaldo", "cruces", "urban galindo", "gambrinus", "landeta"],
  "basauri": ["basauri", "san miguel", "ariz"], "etxebarri": ["etxebarri", "san antonio"], "galdakao": ["galdakao", "zabalgane"], "galdacano": ["galdakao"],
  "leioa": ["leioa", "artaza"], "lejona": ["leioa"], "erandio": ["erandio", "astrabudua"], "derio": ["derio"], "sondika": ["sondika"], "sondica": ["sondika"],
  "loiu": ["larrondo"], "lezama": ["lezama"], "zamudio": ["zamudio"], "berango": ["berango"], "arrigorriaga": ["arrigorriaga"], "bilbao": ["bilbao"]
};

/* Calendario escolar 2026-27 (calendario_vigente.pdf). Fechas ISO. */
CV.calendario = [
  { d: "2026-09-09", es: "Comienza el curso 2026-27", eu: "2026-27 ikasturtearen hasiera", en: "School year 2026-27 starts" },
  { d: "2026-10-12", es: "Fiesta Nacional (no lectivo)", eu: "Jai nazionala (eskolarik ez)", en: "National holiday (no school)" },
  { d: "2026-10-21", es: "Tarde libre (formación interna)", eu: "Arratsalde librea (barne prestakuntza)", en: "Afternoon off (staff training)" },
  { d: "2026-11-11", es: "Fiesta local de Zamudio (no lectivo)", eu: "Zamudioko jai eguna (eskolarik ez)", en: "Zamudio local holiday (no school)" },
  { d: "2026-12-07", f: "2026-12-08", es: "Puente e Inmaculada (no lectivo)", eu: "Zubia eta Sortzez Garbia (eskolarik ez)", en: "Long weekend and Immaculate Conception (no school)" },
  { d: "2026-12-12", es: "Jornada de puertas abiertas (familias de 1 y 2 años)", eu: "Ate irekien jardunaldia (1 eta 2 urteko familiak)", en: "Open day (families with 1 and 2-year-olds)" },
  { d: "2026-12-21", es: "Festival de Navidad de Primaria", eu: "Lehen Hezkuntzako Gabonetako jaialdia", en: "Primary Christmas show" },
  { d: "2026-12-23", f: "2027-01-06", es: "Vacaciones de Navidad", eu: "Gabonetako oporrak", en: "Christmas holidays" },
  { d: "2027-01-21", es: "Tarde libre (formación interna)", eu: "Arratsalde librea (barne prestakuntza)", en: "Afternoon off (staff training)" },
  { d: "2027-01-29", es: "Santo Tomás de Aquino (no lectivo)", eu: "Santo Tomas Akinokoa (eskolarik ez)", en: "St Thomas Aquinas (no school)" },
  { d: "2027-02-08", f: "2027-02-09", es: "Lunes y martes de Carnaval (no lectivos)", eu: "Inauterietako astelehena eta asteartea (eskolarik ez)", en: "Carnival Monday and Tuesday (no school)" },
  { d: "2027-03-02", es: "Tarde libre (formación interna)", eu: "Arratsalde librea (barne prestakuntza)", en: "Afternoon off (staff training)" },
  { d: "2027-03-22", f: "2027-04-04", es: "Vacaciones de Semana Santa", eu: "Aste Santuko oporrak", en: "Easter holidays" },
  { d: "2027-05-14", es: "Despedida del alumnado de 2.º de Bachillerato y tarde libre", eu: "Batxilergoko 2. mailako ikasleen agurra eta arratsalde librea", en: "Farewell for Year 2 Bachillerato students and afternoon off" },
  { d: "2027-05-28", f: "2027-05-29", es: "Fiestas del Colegio", eu: "Ikastetxeko jaiak", en: "School festival" },
  { d: "2027-06-01", f: "2027-06-03", es: "Prueba de acceso a la universidad (pendiente de confirmación oficial)", eu: "Unibertsitatera sartzeko proba (baieztatzeko)", en: "University entrance exam (to be officially confirmed)" },
  { d: "2027-06-17", es: "Fin de curso: Escuela Infantil, 2.º ciclo de Infantil y 3.º-4.º ESO", eu: "Ikasturte amaiera: Haur Eskola, Haur Hezkuntzako 2. zikloa eta DBHko 3.-4.", en: "Last day: nursery, infant school and Years 3-4 of ESO" },
  { d: "2027-06-18", es: "Fin de curso: Primaria y 1.º-2.º ESO", eu: "Ikasturte amaiera: Lehen Hezkuntza eta DBHko 1.-2.", en: "Last day: Primary and Years 1-2 of ESO" },
  { d: "2027-06-25", es: "Recogida de notas de fin de curso con el tutor o tutora", eu: "Ikasturte amaierako notak tutorearekin jasotzea", en: "End-of-year reports collected with the tutor" }
];

/* Últimas noticias publicadas en colegiovizcaya.net (titulares y fechas reales). */
CV.noticias = [
  { d: "2026-11-12", id: 1067, tipo: "deporte", es: "Horarios deportivos: jornada del 14 y 15 de noviembre", eu: "Kirol ordutegiak: azaroaren 14 eta 15eko jardunaldia", en: "Sports fixtures: 14 and 15 November" },
  { d: "2026-11-12", id: 1066, tipo: "familias", es: "Escuela de familias: las rabietas en la primera infancia", eu: "Familia eskola: haurtzaro goiztiarreko amorrualdiak", en: "Family school: tantrums in early childhood" },
  { d: "2026-11-09", id: 1065, tipo: "deporte", es: "Resultados deportivos: jornada del 7 y 8 de noviembre", eu: "Kirol emaitzak: azaroaren 7 eta 8ko jardunaldia", en: "Sports results: 7 and 8 November" },
  { d: "2026-10-29", id: 1064, tipo: "deporte", es: "Horarios deportivos: jornada del 31 de octubre y 1 de noviembre", eu: "Kirol ordutegiak: urriaren 31 eta azaroaren 1eko jardunaldia", en: "Sports fixtures: 31 October and 1 November" }
];

CV.enlaces = {
  preinscripcion: "https://forms.office.com/e/iyKMvYjchK",
  puertasAbiertas: "https://forms.cloud.microsoft/pages/responsepage.aspx?id=qICjt809rkGFdh7eQJiUBgTQ89Tvp_9ClUhIgeokdS5UMjhXMjBXVjU5TDdFUEpZSDVUWFhSRE9VSy4u&origin=lprLink&route=shorturl",
  canalEtico: "https://forms.office.com/e/hM68WW9QAz",
  areaPrivada: "https://www.colegiovizcaya.net/index.php?go=registro2",
  visita360: "https://tourmkr.com/F1zKZXVgaN",
  calendario: "https://www.colegiovizcaya.net/cms_files/calendario_vigente.pdf",
  fundacion: "https://www.fundacioncolegiovizcaya.net/",
  noticia: id => "https://www.colegiovizcaya.net/index.php?go=noticias&ide=" + id,
  rutasPdf: {
    t1: "https://www.colegiovizcaya.net/cms_files/Recorridos_1er_turno_2026-27.pdf",
    t2: "https://www.colegiovizcaya.net/cms_files/Recorridos_2o_turno_2026-27.pdf",
    t3: "https://www.colegiovizcaya.net/cms_files/Recorridos_extraescolares_2026-27.pdf"
  }
};
