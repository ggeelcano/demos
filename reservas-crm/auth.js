/**
 * CRM Reservas G&G Elcano — sistema de autenticación
 *
 * Cada cliente tiene usuario y contraseña propios y SOLO puede ver su perfil.
 * El admin (Josu) ve todos los restaurantes desde el home.
 *
 * Para añadir un cliente nuevo: añade una entrada a USERS.
 *   - role: 'admin' (ve todo) | 'rest' (ve un solo restaurante)
 *   - slug: identificador del restaurante (debe coincidir con la carpeta)
 *
 * IMPORTANTE: Esto es validación en cliente, suficiente para una demo / MVP.
 * Para producción real, mueve la validación al worker de Cloudflare.
 */

const USERS = {
  'admin': {
    pwd: 'GGElcano2026!',
    role: 'admin',
    nombre: 'Josu · G&G Elcano'
  },
  'motabarri': {
    pwd: 'Motabarri2026!',
    role: 'rest',
    slug: 'motabarri-erandio',
    nombre: 'Eguzkiñe · Asador Motabarri'
  }
};

const SESSION_KEY = 'crm_session_v1';

function authLogin(user, pwd) {
  const u = USERS[user.toLowerCase().trim()];
  if (!u || u.pwd !== pwd) return null;
  const session = {
    user: user.toLowerCase().trim(),
    role: u.role,
    slug: u.slug || null,
    nombre: u.nombre,
    started: Date.now()
  };
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
  return session;
}

function authSession() {
  try { return JSON.parse(sessionStorage.getItem(SESSION_KEY) || 'null'); }
  catch (e) { return null; }
}

function authLogout() {
  sessionStorage.removeItem(SESSION_KEY);
  // Subir N niveles según ruta
  const path = location.pathname;
  const depth = (path.split('/').filter(Boolean).indexOf('reservas-crm'));
  const back = depth >= 0 ? path.split('/').slice(0, depth + 2).join('/') : '/demos/reservas-crm';
  location.href = back + '/login.html';
}

/**
 * Llamar al inicio de cada página para obligar login.
 * @param {object} opts
 *   - allowedRoles: array de roles permitidos (default ['admin','rest'])
 *   - requiredSlug: si es 'rest', debe coincidir con este slug
 *   - loginUrl: ruta relativa al login.html
 */
function authRequire(opts) {
  opts = opts || {};
  const session = authSession();
  const loginUrl = opts.loginUrl || 'login.html';
  if (!session) { location.replace(loginUrl); return null; }
  const allowed = opts.allowedRoles || ['admin', 'rest'];
  if (!allowed.includes(session.role)) { location.replace(loginUrl); return null; }
  if (session.role === 'rest' && opts.requiredSlug && session.slug !== opts.requiredSlug) {
    location.replace(loginUrl);
    return null;
  }
  return session;
}
