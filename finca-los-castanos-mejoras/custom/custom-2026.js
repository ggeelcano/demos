/* Finca Los Castaños — mejoras sept 2026 (G&G Elcano) */
(function () {
  // 1) Humo de café subiendo del grano flotante (efecto especial pedido)
  function addSteam(el) {
    if (!el || el.querySelector('.gg-steam-wrap')) return;
    var wrap = document.createElement('span');
    wrap.className = 'gg-steam-wrap';
    wrap.setAttribute('aria-hidden', 'true');
    for (var i = 0; i < 3; i++) {
      var s = document.createElement('span');
      s.className = 'gg-steam';
      wrap.appendChild(s);
    }
    el.style.overflow = 'visible';
    el.style.position = el.style.position || 'relative';
    el.appendChild(wrap);
  }
  function initSteam() {
    document.querySelectorAll('.social-fab-toggle').forEach(addSteam);
    document.querySelectorAll('.gg-cup').forEach(addSteam);
  }

  // 2) Noticias editables: se cargan desde noticias.json (el cliente edita solo ese archivo)
  function initNews() {
    var box = document.getElementById('gg-news');
    if (!box) return;
    var lang = box.getAttribute('data-lang') || 'es';
    var src = box.getAttribute('data-src') || 'noticias.json';
    fetch(src).then(function (r) { return r.json(); }).then(function (data) {
      var items = (data && data.items) || [];
      var frag = document.createDocumentFragment();
      items.forEach(function (item) {
        var loc = item[lang] || item.es || {};
        var card = document.createElement('article');
        card.className = 'gg-news-card';
        var img = '';
        if (item.imagen) {
          img = '<img src="' + box.getAttribute('data-root') + item.imagen + '" alt="" loading="lazy">';
        }
        card.innerHTML = img +
          '<div class="gg-news-body">' +
          '<span class="gg-news-date">' + (loc.fecha || '') + '</span>' +
          '<h3>' + (loc.titulo || '') + '</h3>' +
          '<p>' + (loc.texto || '') + '</p>' +
          '</div>';
        frag.appendChild(card);
      });
      box.innerHTML = '';
      box.appendChild(frag);
    }).catch(function () {
      box.innerHTML = '<p style="text-align:center">—</p>';
    });
  }

  function init() { initSteam(); initNews(); }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else { init(); }
  document.addEventListener('astro:page-load', init);
})();
