/* Portada: carrusel de promociones y estado de favoritos en las tarjetas */
(() => {
  const { $, $$ } = BM;
  const pista = $('#hero-pista'); if (!pista) return;
  const slides = $$('a', pista), puntos = $$('.hero-puntos button');
  const quieto = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let i = 0, t;
  const ir = n => {
    i = (n + slides.length) % slides.length;
    pista.style.transform = `translateX(${-100 * i}%)`;
    slides.forEach((s, k) => { s.tabIndex = k === i ? 0 : -1; s.setAttribute('aria-hidden', k !== i); });
    puntos.forEach((p, k) => p.setAttribute('aria-current', k === i));
  };
  const auto = () => { clearInterval(t); if (!quieto) t = setInterval(() => ir(i + 1), 6000); };
  $('.hero-flecha.izq').onclick = () => { ir(i - 1); auto(); };
  $('.hero-flecha.dcha').onclick = () => { ir(i + 1); auto(); };
  puntos.forEach((p, k) => p.onclick = () => { ir(k); auto(); });
  const marco = $('.hero-marco');
  marco.addEventListener('mouseenter', () => clearInterval(t));
  marco.addEventListener('mouseleave', auto);
  marco.addEventListener('focusin', () => clearInterval(t));
  let x0 = null;
  marco.addEventListener('touchstart', e => { x0 = e.touches[0].clientX; clearInterval(t); }, { passive: true });
  marco.addEventListener('touchend', e => { if (x0 == null) return; const dx = e.changedTouches[0].clientX - x0; if (Math.abs(dx) > 40) ir(i + (dx < 0 ? 1 : -1)); x0 = null; auto(); });
  ir(0); auto();
  // favoritos guardados
  const f = BM.favs();
  $$('[data-fav]').forEach(b => b.setAttribute('aria-pressed', f.includes(+b.dataset.fav)));
})();
