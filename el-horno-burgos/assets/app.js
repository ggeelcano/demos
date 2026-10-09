// El Horno · comportamiento de la web (sin dependencias salvo Leaflet en la página de tiendas)
(() => {
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];

  /* Menú móvil */
  const hamb = $('.hamburguesa');
  const cajon = $('#cajon');
  if (hamb && cajon) {
    const poner = abrir => {
      cajon.classList.toggle('abierto', abrir);
      hamb.setAttribute('aria-expanded', String(abrir));
      hamb.setAttribute('aria-label', abrir ? 'Cerrar menú' : 'Abrir menú');
    };
    hamb.addEventListener('click', () => poner(!cajon.classList.contains('abierto')));
    cajon.addEventListener('click', e => { if (e.target.closest('a')) poner(false); });
    document.addEventListener('keydown', e => { if (e.key === 'Escape' && cajon.classList.contains('abierto')) { poner(false); hamb.focus(); } });
  }

  /* Desplegable "Clientes" */
  $$('.desplegable').forEach(d => {
    const b = $('button', d), m = $('.submenu', d);
    const poner = abrir => { m.classList.toggle('abierto', abrir); b.setAttribute('aria-expanded', String(abrir)); };
    b.addEventListener('click', () => poner(!m.classList.contains('abierto')));
    document.addEventListener('click', e => { if (!d.contains(e.target)) poner(false); });
    d.addEventListener('keydown', e => { if (e.key === 'Escape') { poner(false); b.focus(); } });
    d.addEventListener('focusout', e => { if (!d.contains(e.relatedTarget)) poner(false); });
  });

  /* Carruseles de producto */
  $$('[data-carrusel]').forEach(c => {
    const pista = $('.pista', c), ant = $('.ant', c), sig = $('.sig', c), cont = $('.contador', c);
    if (!pista) return;
    const paso = () => (pista.firstElementChild?.getBoundingClientRect().width || 300) + 14;
    const actualizar = () => {
      const max = pista.scrollWidth - pista.clientWidth - 4;
      if (ant) ant.disabled = pista.scrollLeft <= 4;
      if (sig) sig.disabled = pista.scrollLeft >= max;
      if (cont) {
        const total = pista.children.length;
        const vis = Math.max(1, Math.round(pista.clientWidth / paso()));
        const i = Math.min(total, Math.round(pista.scrollLeft / paso()) + vis);
        cont.textContent = `${i} / ${total}`;
      }
    };
    ant?.addEventListener('click', () => pista.scrollBy({ left: -paso(), behavior: 'smooth' }));
    sig?.addEventListener('click', () => pista.scrollBy({ left: paso(), behavior: 'smooth' }));
    pista.addEventListener('scroll', () => requestAnimationFrame(actualizar), { passive: true });
    addEventListener('resize', actualizar);
    actualizar();
  });

  /* Citas */
  $$('[data-citas]').forEach(c => {
    const d = $$('.diapo', c); let i = 0;
    const ir = n => { d[i].hidden = true; i = (n + d.length) % d.length; d[i].hidden = false; };
    $('.ant', c)?.addEventListener('click', () => ir(i - 1));
    $('.sig', c)?.addEventListener('click', () => ir(i + 1));
  });

  /* Formularios (demo: validan y muestran confirmación, no envían datos) */
  const hoy = new Date();
  const iso = d => new Date(d.getTime() - d.getTimezoneOffset() * 6e4).toISOString().slice(0, 10);
  $$('form[data-form]').forEach(form => {
    const ok = document.getElementById(form.dataset.form);
    const error = $('.error', form);
    const fecha = $('input[type=date]', form);
    if (fecha) { const m = new Date(hoy.getTime() + 864e5); fecha.min = iso(m); fecha.value = iso(m); }
    // Preseleccionar tienda si viene en la URL (?tienda=...)
    const sel = $('select[name=tienda]', form);
    const q = new URLSearchParams(location.search).get('tienda');
    if (sel && q) { const o = [...sel.options].find(o => o.value === q); if (o) sel.value = q; }

    form.addEventListener('submit', e => {
      e.preventDefault();
      $$('[aria-invalid]', form).forEach(el => el.removeAttribute('aria-invalid'));
      const faltas = [];
      const grupo = $('fieldset[data-requerido]', form);
      if (grupo && !$$('input:checked', grupo).length && !(form.detalle && form.detalle.value.trim()))
        faltas.push([$('input', grupo), grupo.dataset.requerido]);
      $$('[required]', form).forEach(el => {
        const vacio = el.type === 'checkbox' ? !el.checked : !el.value.trim();
        const malo = !vacio && ((el.type === 'email' && !/^\S+@\S+\.\S+$/.test(el.value)) || (el.type === 'tel' && el.value.replace(/\D/g, '').length < 9) || (el.type === 'date' && el.value < el.min));
        if (vacio || malo) faltas.push([el, el.dataset.error || 'Revisa este campo.']);
      });
      if (faltas.length) {
        error.textContent = faltas[0][1];
        faltas.forEach(([el]) => el.setAttribute('aria-invalid', 'true'));
        faltas[0][0].focus();
        return;
      }
      error.textContent = '';
      const resumen = ok && $('dl', ok);
      if (resumen) {
        const filas = [];
        if (grupo) {
          const marcados = $$('input:checked', grupo).map(i => i.value);
          const det = form.detalle?.value.trim();
          filas.push(['Encargo', [marcados.join(', '), det].filter(Boolean).join('. ')]);
        }
        $$('[data-etiqueta]', form).forEach(el => {
          let v = el.value.trim();
          if (!v) return;
          if (el.type === 'date') v = new Date(v + 'T12:00').toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });
          filas.push([el.dataset.etiqueta, v]);
        });
        resumen.replaceChildren(...filas.flatMap(([k, v]) => {
          const dt = document.createElement('dt'); dt.textContent = k;
          const dd = document.createElement('dd'); dd.textContent = v;
          return [dt, dd];
        }));
      }
      form.hidden = true;
      if (ok) { ok.hidden = false; ok.focus(); }
    });
    ok && $('.otro', ok)?.addEventListener('click', () => {
      form.reset();
      if (fecha) fecha.value = fecha.min;
      ok.hidden = true; form.hidden = false;
      $('input, select, textarea', form)?.focus();
    });
  });

  /* Suscripción del pie */
  $$('form.suscripcion').forEach(f => f.addEventListener('submit', e => {
    e.preventDefault();
    const em = $('input', f);
    const msg = f.nextElementSibling;
    if (!/^\S+@\S+\.\S+$/.test(em.value)) { msg.textContent = 'Escribe un correo válido.'; em.focus(); return; }
    msg.textContent = '¡Gracias! Te enviaremos nuestras noticias.';
    f.reset();
  }));

  /* Filtro de noticias por año */
  const filtros = $('.filtros[data-noticias]');
  if (filtros) {
    const tarjetas = $$('.noticia[data-anio]');
    filtros.addEventListener('click', e => {
      const b = e.target.closest('.chip'); if (!b) return;
      $$('.chip', filtros).forEach(c => c.setAttribute('aria-pressed', String(c === b)));
      tarjetas.forEach(t => { t.hidden = b.dataset.anio !== 'todas' && t.dataset.anio !== b.dataset.anio; });
    });
  }

  /* Calendario: marca el mes actual */
  const meses = $$('.mes[data-mes]');
  if (meses.length) {
    const m = meses.find(x => x.dataset.mes.split(",").map(Number).includes(hoy.getMonth()));
    if (m) {
      m.classList.add('actual');
      m.insertAdjacentHTML('afterbegin', `<span class="pegatina peq" aria-hidden="true">${$('#pegatina-plantilla')?.innerHTML || ''}<span>Este mes</span></span>`);
      m.setAttribute('aria-current', 'date');
    }
  }

  /* Tiendas: buscador, mapa y cercanía */
  const lista = $('#lista-tiendas');
  if (lista && window.TIENDAS) {
    const items = $$('.tienda', lista);
    const buscar = $('#buscar-tienda');
    const vacio = $('#sin-tiendas');
    const norm = s => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
    buscar?.addEventListener('input', () => {
      const q = norm(buscar.value.trim());
      let n = 0;
      items.forEach(li => { const v = !q || norm(li.dataset.busca).includes(q); li.hidden = !v; if (v) n++; });
      vacio.hidden = n > 0;
    });

    let mapa = null; const marcas = {};
    const iniciarMapa = () => {
      if (!window.L || mapa) return;
      mapa = L.map('mapa', { scrollWheelZoom: false }).setView([42.3456, -3.6950], 13);
      L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '&copy; OpenStreetMap' }).addTo(mapa);
      const icono = L.divIcon({ className: '', html: '<div class="pin"></div>', iconSize: [26, 26], iconAnchor: [13, 26], popupAnchor: [0, -24] });
      const grupo = [];
      window.TIENDAS.forEach((t, i) => {
        if (t.lat == null) return;
        const m = L.marker([t.lat, t.lng], { icon: icono, title: t.titulo, alt: t.titulo })
          .bindPopup(`<b>${t.titulo}</b><br>${t.cp} Burgos<br><a href="tel:${t.tel}">${t.telTexto}</a>`)
          .addTo(mapa);
        marcas[i] = m; grupo.push([t.lat, t.lng]);
      });
      if (grupo.length) mapa.fitBounds(grupo, { padding: [30, 30] });
    };
    if (window.L) iniciarMapa(); else addEventListener('load', iniciarMapa);

    lista.addEventListener('click', e => {
      const b = e.target.closest('[data-ver]'); if (!b || !mapa) return;
      const m = marcas[b.dataset.ver]; if (!m) return;
      $('#mapa').scrollIntoView({ behavior: 'smooth', block: 'center' });
      mapa.flyTo(m.getLatLng(), 16, { duration: .6 });
      setTimeout(() => m.openPopup(), 650);
    });

    const cerca = $('#cerca');
    const estado = $('#estado-cerca');
    cerca?.addEventListener('click', () => {
      if (!navigator.geolocation) { estado.textContent = 'Tu navegador no permite localizarte.'; return; }
      estado.textContent = 'Buscando tu ubicación…';
      navigator.geolocation.getCurrentPosition(pos => {
        const { latitude: la, longitude: lo } = pos.coords;
        const dist = (a, b) => { const r = Math.PI / 180, x = (b.lng - lo) * r * Math.cos((a + la) / 2 * r), y = (a - la) * r; return Math.sqrt(x * x + y * y) * 6371e3; };
        const orden = items.map(li => { const t = window.TIENDAS[li.dataset.i]; return [li, t.lat == null ? Infinity : dist(t.lat, t)]; }).sort((a, b) => a[1] - b[1]);
        orden.forEach(([li, d]) => {
          $('.dist', li).textContent = d === Infinity ? '' : d < 1000 ? `A ${Math.round(d / 10) * 10} m` : `A ${(d / 1000).toFixed(1).replace('.', ',')} km`;
          lista.appendChild(li);
        });
        estado.textContent = 'Tiendas ordenadas de más cerca a más lejos.';
        if (mapa) { const p = L.circleMarker([la, lo], { radius: 8, color: '#4a2410', fillColor: '#f3d59a', fillOpacity: 1 }).addTo(mapa).bindPopup('Estás aquí'); mapa.setView([la, lo], 14); }
      }, () => { estado.textContent = 'No hemos podido saber dónde estás. Busca tu calle en el buscador.'; }, { timeout: 10000 });
    });
  }

  /* Juego de parejas */
  const tablero = $('#tablero');
  if (tablero && window.CARTAS) {
    const movs = $('#movimientos'), pares = $('#parejas'), crono = $('#tiempo'), fin = $('#juego-fin'), aviso = $('#aviso-juego');
    let abiertas = [], hechas = 0, n = 0, t0 = 0, reloj = null, bloqueo = false;
    const barajar = a => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
    const dorso = $('#dorso-plantilla').innerHTML;
    const empezar = () => {
      clearInterval(reloj); reloj = null; abiertas = []; hechas = 0; n = 0; t0 = 0; bloqueo = false;
      movs.textContent = '0'; pares.textContent = `0 / ${window.CARTAS.length}`; crono.textContent = '0:00'; fin.hidden = true;
      const mazo = barajar([...window.CARTAS, ...window.CARTAS].map((c, i) => ({ ...c, k: i })));
      tablero.replaceChildren(...mazo.map((c, i) => {
        const b = document.createElement('button');
        b.type = 'button'; b.className = 'carta'; b.dataset.id = c.id;
        b.setAttribute('aria-label', `Carta ${i + 1}, boca abajo`);
        b.innerHTML = `<span class="dorso" aria-hidden="true">${dorso}</span><span class="cara" aria-hidden="true"><img src="${c.img}" alt=""></span>`;
        b.addEventListener('click', () => voltear(b, c, i));
        return b;
      }));
    };
    const voltear = (b, c, i) => {
      if (bloqueo || b.classList.contains('vuelta')) return;
      if (!reloj) { t0 = Date.now(); reloj = setInterval(() => { const s = Math.floor((Date.now() - t0) / 1000); crono.textContent = `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`; }, 500); }
      b.classList.add('vuelta'); b.setAttribute('aria-label', `Carta ${i + 1}: ${c.nombre}`);
      abiertas.push(b);
      if (abiertas.length < 2) { aviso.textContent = c.nombre; return; }
      n++; movs.textContent = String(n);
      const [a, z] = abiertas;
      if (a.dataset.id === z.dataset.id) {
        a.classList.add('hecha'); z.classList.add('hecha'); a.disabled = z.disabled = true;
        abiertas = []; hechas++; pares.textContent = `${hechas} / ${window.CARTAS.length}`;
        aviso.textContent = `¡Pareja! ${c.nombre}`;
        if (hechas === window.CARTAS.length) {
          clearInterval(reloj);
          $('#resultado').textContent = `Lo has conseguido en ${n} movimientos y ${crono.textContent} minutos.`;
          fin.hidden = false; $('#otra-vez').focus();
        }
      } else {
        bloqueo = true; aviso.textContent = `${c.nombre}. No es pareja.`;
        setTimeout(() => {
          abiertas.forEach(x => { x.classList.remove('vuelta'); x.setAttribute('aria-label', x.getAttribute('aria-label').replace(/:.*$/, ', boca abajo')); });
          abiertas = []; bloqueo = false;
        }, 900);
      }
    };
    $('#otra-vez')?.addEventListener('click', empezar);
    $('#reiniciar')?.addEventListener('click', empezar);
    empezar();
  }
})();
