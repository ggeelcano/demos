/* ──────────────────────────────────────────────────────────────
   GG Elcano · Banner de cookies (AEPD 2023 + LSSICE art. 22.2)
   Requisitos que cumple:
     - Botones "Aceptar todas", "Rechazar todas" y "Configurar" con
       misma jerarquía visual (mismo tamaño y contraste en CSS).
     - Bloqueo real: hasta que el usuario no consienta, no se cargan
       recursos de terceros marcados con data-consent="terceros".
     - Persistencia en localStorage clave "gg_cookie_consent".
     - API global window.GGConsent con métodos has / set / revoke.
   Drop-in, sin dependencias.
   ────────────────────────────────────────────────────────────── */
(function () {
  'use strict';

  var STORAGE_KEY = 'gg_cookie_consent';
  var VERSION = 1;
  // Duración máxima del consentimiento (AEPD: máx 24 meses). 13 meses = patrón habitual.
  var MAX_AGE_MS = 13 * 30 * 24 * 60 * 60 * 1000;

  // ── Estado ────────────────────────────────────────────────────
  function readState() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      var obj = JSON.parse(raw);
      if (!obj || obj.v !== VERSION) return null;
      if (typeof obj.ts !== 'number') return null;
      if (Date.now() - obj.ts > MAX_AGE_MS) return null;
      return obj;
    } catch (_) {
      return null;
    }
  }

  function writeState(state) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (_) { /* storage deshabilitado */ }
  }

  function currentState() {
    return readState() || { v: VERSION, ts: 0, tecnicas: true, analiticas: false, terceros: false, decided: false };
  }

  // ── API pública ───────────────────────────────────────────────
  var listeners = [];

  var API = {
    has: function (category) {
      var s = readState();
      if (!s) return category === 'tecnicas';
      return !!s[category];
    },
    get: function () {
      return readState();
    },
    set: function (partial) {
      var s = currentState();
      var next = {
        v: VERSION,
        ts: Date.now(),
        tecnicas: true,
        analiticas: partial.analiticas === true,
        terceros: partial.terceros === true,
        decided: true
      };
      writeState(next);
      applyConsent(next);
      notify(next);
    },
    acceptAll: function () {
      API.set({ analiticas: true, terceros: true });
    },
    rejectAll: function () {
      API.set({ analiticas: false, terceros: false });
    },
    revoke: function () {
      try { localStorage.removeItem(STORAGE_KEY); } catch (_) {}
      location.reload();
    },
    open: function () { showPanel(); },
    onChange: function (fn) { if (typeof fn === 'function') listeners.push(fn); }
  };

  function notify(state) {
    for (var i = 0; i < listeners.length; i++) {
      try { listeners[i](state); } catch (_) {}
    }
  }

  window.GGConsent = API;

  // ── Activación diferida de recursos con data-consent ─────────
  function applyConsent(state) {
    var nodes = document.querySelectorAll('[data-consent]');
    for (var i = 0; i < nodes.length; i++) {
      var el = nodes[i];
      var cat = el.getAttribute('data-consent');
      if (state[cat]) {
        activateBlock(el);
      }
    }
  }

  function activateBlock(el) {
    if (el.getAttribute('data-consent-active') === '1') return;
    el.setAttribute('data-consent-active', '1');

    // 1) Si hay un <template> dentro, inyecta su contenido.
    var tpl = el.querySelector('template[data-consent-payload]');
    if (tpl && tpl.content) {
      // Limpia placeholder
      var fb = el.querySelector('.ggc-consent-fallback');
      if (fb) fb.remove();
      el.appendChild(tpl.content.cloneNode(true));
      return;
    }

    // 2) Si hay <script type="text/plain" data-consent-src>, cárgalos.
    var scripts = el.querySelectorAll('script[type="text/plain"][data-consent-src]');
    for (var i = 0; i < scripts.length; i++) {
      var s = document.createElement('script');
      s.src = scripts[i].getAttribute('data-consent-src');
      s.async = true;
      document.head.appendChild(s);
    }
  }

  // ── UI ────────────────────────────────────────────────────────
  function h(tag, attrs, children) {
    var el = document.createElement(tag);
    if (attrs) {
      for (var k in attrs) {
        if (k === 'class') el.className = attrs[k];
        else if (k === 'html') el.innerHTML = attrs[k];
        else if (k.indexOf('on') === 0 && typeof attrs[k] === 'function') {
          el.addEventListener(k.substring(2), attrs[k]);
        } else {
          el.setAttribute(k, attrs[k]);
        }
      }
    }
    if (children) {
      for (var i = 0; i < children.length; i++) {
        var c = children[i];
        if (c == null) continue;
        el.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
      }
    }
    return el;
  }

  var root, bannerEl, panelEl;

  function ensureRoot() {
    if (root) return root;
    root = h('div', { class: 'ggc-root', role: 'region', 'aria-label': 'Aviso de cookies' });
    document.body.appendChild(root);
    return root;
  }

  function buildBanner() {
    var base = (location.pathname.indexOf('/legal/') !== -1) ? '' : 'legal/';
    var linkCookies = h('a', { href: base + 'politica-cookies.html' }, ['política de cookies']);
    var linkPriv = h('a', { href: base + 'politica-privacidad.html' }, ['política de privacidad']);

    var text = h('div', null, [
      h('h2', null, ['Utilizamos cookies']),
      (function () {
        var p = h('p', null, [
          'Usamos cookies técnicas propias (necesarias para el funcionamiento) y servicios de Google (mapa y tipografías) que pueden usar cookies de terceros. Consulta nuestra ',
          linkCookies,
          ' y la ',
          linkPriv,
          '.'
        ]);
        return p;
      })()
    ]);

    var btnAccept = h('button', {
      class: 'ggc-btn',
      type: 'button',
      onclick: function () { API.acceptAll(); hideAll(); }
    }, ['Aceptar todas']);

    var btnReject = h('button', {
      class: 'ggc-btn',
      type: 'button',
      onclick: function () { API.rejectAll(); hideAll(); }
    }, ['Rechazar todas']);

    var btnConfig = h('button', {
      class: 'ggc-btn',
      type: 'button',
      onclick: function () { showPanel(); }
    }, ['Configurar']);

    var actions = h('div', { class: 'ggc-actions' }, [btnAccept, btnReject, btnConfig]);

    var inner = h('div', { class: 'ggc-banner-inner' }, [text, actions]);
    return h('div', { class: 'ggc-banner', role: 'dialog', 'aria-labelledby': 'ggc-banner-title' }, [inner]);
  }

  function buildPanel() {
    var s = currentState();

    function row(id, title, desc, checked, disabled) {
      var inputAttrs = { type: 'checkbox', id: id };
      if (checked) inputAttrs.checked = 'checked';
      if (disabled) inputAttrs.disabled = 'disabled';
      var input = h('input', inputAttrs);
      var slider = h('span', { class: 'ggc-toggle-slider', 'aria-hidden': 'true' });
      var toggle = h('label', { class: 'ggc-toggle', for: id }, [input, slider]);
      return h('div', { class: 'ggc-category' }, [
        h('div', null, [
          h('h3', null, [title]),
          h('p', null, [desc])
        ]),
        toggle
      ]);
    }

    var rowTec = row('ggc-tec', 'Cookies técnicas (obligatorias)',
      'Necesarias para el funcionamiento básico de la web. No se pueden desactivar.',
      true, true);

    var rowAna = row('ggc-ana', 'Cookies analíticas',
      'Nos ayudan a entender cómo se usa la web de forma agregada y anónima.',
      !!s.analiticas, false);

    var rowTer = row('ggc-ter', 'Cookies de terceros (Google Maps, fuentes)',
      'Permiten mostrar el mapa de Google y cargar recursos externos. Implican transferencia internacional a EE. UU. bajo cláusulas contractuales tipo.',
      !!s.terceros, false);

    var btnSave = h('button', {
      class: 'ggc-btn',
      type: 'button',
      onclick: function () {
        API.set({
          analiticas: document.getElementById('ggc-ana').checked,
          terceros: document.getElementById('ggc-ter').checked
        });
        hideAll();
      }
    }, ['Guardar preferencias']);

    var btnAccept = h('button', {
      class: 'ggc-btn',
      type: 'button',
      onclick: function () { API.acceptAll(); hideAll(); }
    }, ['Aceptar todas']);

    var btnReject = h('button', {
      class: 'ggc-btn',
      type: 'button',
      onclick: function () { API.rejectAll(); hideAll(); }
    }, ['Rechazar todas']);

    var actions = h('div', { class: 'ggc-panel-actions' }, [btnReject, btnSave, btnAccept]);

    var inner = h('div', { class: 'ggc-panel-inner' }, [
      h('h2', null, ['Configuración de cookies']),
      h('p', { class: 'ggc-intro' }, [
        'Puedes aceptar, rechazar o elegir qué categorías permites. Las cookies técnicas son imprescindibles y siempre están activas.'
      ]),
      rowTec,
      rowAna,
      rowTer,
      actions
    ]);

    return h('div', { class: 'ggc-panel', role: 'dialog', 'aria-modal': 'false', 'aria-labelledby': 'ggc-panel-title' }, [inner]);
  }

  function showBanner() {
    ensureRoot();
    hideAll(true);
    bannerEl = buildBanner();
    root.appendChild(bannerEl);
    root.hidden = false;
  }

  function showPanel() {
    ensureRoot();
    hideAll(true);
    panelEl = buildPanel();
    root.appendChild(panelEl);
    root.hidden = false;
    // foco al primer toggle editable
    var first = panelEl.querySelector('input:not(:disabled)');
    if (first) first.focus();
  }

  function hideAll(keepRoot) {
    if (bannerEl && bannerEl.parentNode) bannerEl.parentNode.removeChild(bannerEl);
    if (panelEl && panelEl.parentNode) panelEl.parentNode.removeChild(panelEl);
    bannerEl = null;
    panelEl = null;
    if (root && !keepRoot) root.hidden = true;
  }

  // ── Fallback UI para bloques bloqueados (iframe Maps, etc.) ──
  function decorateBlockedBlocks() {
    var nodes = document.querySelectorAll('[data-consent]');
    for (var i = 0; i < nodes.length; i++) {
      var el = nodes[i];
      var cat = el.getAttribute('data-consent');
      if (API.has(cat)) continue;
      if (el.querySelector('.ggc-consent-fallback')) continue;

      var fallbackMsg = el.getAttribute('data-fallback') ||
        'Este contenido requiere cookies de terceros. Actívalas para verlo.';

      var btn = h('button', {
        type: 'button',
        onclick: (function (category, element) {
          return function () {
            // Activa SOLO la categoría de este bloque (manteniendo las demás)
            var prev = readState() || { analiticas: false, terceros: false };
            var patch = { analiticas: !!prev.analiticas, terceros: !!prev.terceros };
            patch[category] = true;
            API.set(patch);
          };
        })(cat, el)
      }, ['Aceptar cookies y cargar']);

      var fb = h('div', { class: 'ggc-consent-fallback' }, [
        h('p', null, [fallbackMsg]),
        btn
      ]);
      el.appendChild(fb);
    }
  }

  // ── Arranque ─────────────────────────────────────────────────
  function boot() {
    var s = readState();
    decorateBlockedBlocks();

    if (s && s.decided) {
      applyConsent(s);
      return;
    }
    // Sin consentimiento válido: mostrar banner
    showBanner();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
