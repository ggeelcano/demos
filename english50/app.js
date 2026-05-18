// ============================================
// English 50 — Lógica de la app
// ============================================

const STORAGE_KEY = 'english50_state_v2';
const XP_PER_LEVEL = 200;

// XP por acción
const XP = {
  flashcard_known: 5,
  flashcard_unknown: 1,
  quiz_correct: 8,
  quiz_wrong: 1,
  write_correct: 12,
  write_wrong: 2,
  listen_correct: 15,
  listen_wrong: 2,
  word_mastered: 25,
  week_completed: 200
};

const ACHIEVEMENTS = [
  { id: 'first_word', icon: '🌱', title: 'Primera palabra', desc: 'Aprende tu primera palabra', check: s => totalLearned() >= 1 },
  { id: 'ten_words', icon: '🌿', title: '10 palabras', desc: 'Aprende 10 palabras', check: s => totalLearned() >= 10 },
  { id: 'fifty_words', icon: '🌳', title: '50 palabras', desc: 'Aprende 50 palabras', check: s => totalLearned() >= 50 },
  { id: 'hundred_words', icon: '💯', title: '100 palabras', desc: 'Aprende 100 palabras', check: s => totalLearned() >= 100 },
  { id: 'two_hundred', icon: '🎯', title: '200 palabras', desc: 'Aprende 200 palabras', check: s => totalLearned() >= 200 },
  { id: 'all_words', icon: '👑', title: 'Maestro', desc: 'Domina todas las palabras', check: s => totalLearned() >= totalWords() },
  { id: 'streak_3', icon: '🔥', title: 'En racha', desc: '3 días seguidos', check: s => s.streak >= 3 },
  { id: 'streak_7', icon: '⚡', title: 'Una semana', desc: '7 días seguidos', check: s => s.streak >= 7 },
  { id: 'streak_30', icon: '💎', title: 'Diamante', desc: '30 días seguidos', check: s => s.streak >= 30 },
  { id: 'week_done', icon: '✨', title: 'Semana completa', desc: 'Completa una semana', check: s => Object.values(s.weekDoneAt || {}).length >= 1 },
  { id: 'write_master', icon: '✍️', title: 'Escritor', desc: '50 escrituras correctas', check: s => (s.writeCorrect || 0) >= 50 },
  { id: 'listen_master', icon: '👂', title: 'Oído fino', desc: '30 listenings correctos', check: s => (s.listenCorrect || 0) >= 30 },
];

function loadState() {
  try {
    const s = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (s) return Object.assign(defaultState(), s);
  } catch(e) {}
  return defaultState();
}

function defaultState() {
  return {
    learned: {},            // {weekId-idx: aciertos}
    weekDoneAt: {},         // {week: ISODate}
    streak: 0,
    lastVisit: null,
    startDate: new Date().toISOString().slice(0,10),
    xp: 0,
    activity: {},           // {ISODate: numAcciones}
    writeCorrect: 0,
    listenCorrect: 0,
    achievements: [],
    autoplay: true,
    accent: 'en-US'
  };
}

let state = loadState();

function saveState() { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }

function today() { return new Date().toISOString().slice(0,10); }

function trackActivity() {
  const t = today();
  state.activity[t] = (state.activity[t] || 0) + 1;
  saveState();
}

function addXp(n) {
  state.xp += n;
  saveState();
  renderXpBar();
}

function level() { return Math.floor(state.xp / XP_PER_LEVEL) + 1; }
function xpInLevel() { return state.xp % XP_PER_LEVEL; }

function updateStreak() {
  const t = today();
  if (state.lastVisit === t) return;
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0,10);
  if (state.lastVisit === yesterday) state.streak++;
  else if (state.lastVisit !== t) state.streak = 1;
  state.lastVisit = t;
  saveState();
}

function currentWeek() {
  const start = new Date(state.startDate);
  const now = new Date();
  const days = Math.floor((now - start) / 86400000);
  return Math.min(10, Math.max(1, Math.floor(days/7) + 1));
}

function wordKey(week, idx) { return `${week}-${idx}`; }

function isLearned(week, idx) {
  return (state.learned[wordKey(week, idx)] || 0) >= 4;
}

function isLearning(week, idx) {
  const n = state.learned[wordKey(week, idx)] || 0;
  return n > 0 && n < 4;
}

function weekStats(week) {
  const words = PALABRAS[week] || [];
  let learned = 0;
  words.forEach((_, i) => { if (isLearned(week, i)) learned++; });
  return { total: words.length, learned, pct: words.length ? Math.round(learned*100/words.length) : 0 };
}

function totalLearned() {
  let n = 0;
  for (let w = 1; w <= 10; w++) {
    const words = PALABRAS[w] || [];
    words.forEach((_, i) => { if (isLearned(w, i)) n++; });
  }
  return n;
}

function totalWords() {
  let n = 0;
  for (let w = 1; w <= 10; w++) n += (PALABRAS[w] || []).length;
  return n;
}

function normalizeText(s) {
  return (s || '').toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function checkAnswer(input, correctOptions) {
  // correctOptions puede ser string o array (acepta varias traducciones)
  const opts = Array.isArray(correctOptions) ? correctOptions : [correctOptions];
  const inputNorm = normalizeText(input);
  for (const opt of opts) {
    // Acepta cualquier traducción (separada por / o ,)
    const variants = String(opt).split(/[\/,]/).map(s => normalizeText(s));
    if (variants.includes(inputNorm)) return true;
  }
  return false;
}

function checkAchievements() {
  const unlocked = [];
  for (const a of ACHIEVEMENTS) {
    if (!state.achievements.includes(a.id) && a.check(state)) {
      state.achievements.push(a.id);
      unlocked.push(a);
    }
  }
  saveState();
  unlocked.forEach((a, i) => setTimeout(() => toast(`🏆 ${a.title}`, '+50 XP'), i * 1500));
  if (unlocked.length) {
    addXp(50 * unlocked.length);
  }
  return unlocked;
}

// ============== TOAST ==============
let toastTimer = null;
function toast(msg, sub) {
  let t = document.getElementById('toast');
  if (!t) {
    t = document.createElement('div');
    t.id = 'toast';
    t.className = 'toast';
    document.body.appendChild(t);
  }
  t.innerHTML = sub ? `<span>${msg}</span><span style="color: var(--muted); font-size: 12px;">${sub}</span>` : msg;
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 2200);
}

// ============== CONFETTI ==============
function confetti() {
  const colors = ['#a855f7', '#06b6d4', '#ec4899', '#f59e0b', '#10b981'];
  for (let i = 0; i < 40; i++) {
    const p = document.createElement('div');
    p.className = 'confetti-piece';
    p.style.left = Math.random() * 100 + '%';
    p.style.background = colors[Math.floor(Math.random() * colors.length)];
    p.style.animationDelay = Math.random() * 0.5 + 's';
    p.style.animationDuration = (2 + Math.random() * 1.5) + 's';
    document.body.appendChild(p);
    setTimeout(() => p.remove(), 3500);
  }
}

// ============== AUDIO ==============
let speechReady = false;
if ('speechSynthesis' in window) {
  speechSynthesis.onvoiceschanged = () => { speechReady = true; };
  speechReady = true;
}

function speak(text, opts = {}) {
  if (!('speechSynthesis' in window)) return;
  const u = new SpeechSynthesisUtterance(text);
  u.lang = state.accent || 'en-US';
  u.rate = opts.rate || 0.9;
  u.pitch = 1;
  // Buscar voz en inglés
  const voices = speechSynthesis.getVoices();
  const enVoice = voices.find(v => v.lang.startsWith('en'));
  if (enVoice) u.voice = enVoice;
  speechSynthesis.cancel();
  speechSynthesis.speak(u);
}

// ============== NAV ==============
function showView(name) {
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  document.getElementById('view-' + name).classList.add('active');
  document.querySelectorAll('nav.bottom .nav-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.view === name);
  });
  if (name === 'dashboard') renderDashboard();
  if (name === 'progress') renderProgress();
  if (name === 'settings') renderSettings();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ============== HEADER XP ==============
function renderXpBar() {
  document.getElementById('xp-level').textContent = level();
  const pct = (xpInLevel() / XP_PER_LEVEL) * 100;
  document.getElementById('xp-bar-fill').style.width = pct + '%';
  document.getElementById('xp-text').textContent = `${xpInLevel()}/${XP_PER_LEVEL} XP`;
}

// ============== DASHBOARD ==============
function renderDashboard() {
  document.getElementById('stat-learned').textContent = totalLearned();
  document.getElementById('stat-week').textContent = currentWeek();
  document.getElementById('stat-streak').textContent = state.streak;
  document.getElementById('stat-xp').textContent = state.xp;

  const list = document.getElementById('weeks-list');
  list.innerHTML = '';
  const cw = currentWeek();
  for (let w = 1; w <= 10; w++) {
    const st = weekStats(w);
    const locked = w > cw;
    const isCurrent = w === cw;
    const done = st.pct === 100;
    const card = document.createElement('div');
    card.className = `week-card${locked ? ' locked' : ''}${isCurrent ? ' current' : ''}${done ? ' done' : ''}`;
    card.innerHTML = `
      <div class="top">
        <div class="week-num ${locked ? 'locked' : ''} ${done ? 'done' : ''}">${locked ? '🔒' : done ? '✓' : w}</div>
        <div class="week-info">
          <div class="week-title">Semana ${w}</div>
          <div class="week-meta">${st.learned}/${st.total} palabras dominadas</div>
        </div>
        <div class="week-badge ${done ? 'done' : ''} ${locked ? 'locked' : ''}">${locked ? 'Bloqueada' : done ? 'Completa' : isCurrent ? 'En curso' : 'Lista'}</div>
      </div>
      <div class="week-progress"><div class="week-progress-fill" style="width: ${st.pct}%"></div></div>
    `;
    if (!locked) card.onclick = () => openWeek(w);
    list.appendChild(card);
  }
}

// ============== ESTADO ESTUDIO ==============
let activeWeek = null;
let activeMode = 'flash';

// Flashcards
let flashOrder = [];
let flashIndex = 0;
let flashStartLearned = 0;

// Quiz
let quizOrder = [];
let quizIndex = 0;
let quizCorrectCount = 0;

// Write
let writeOrder = [];
let writeIndex = 0;
let writeDir = 'en2es';     // o 'es2en'
let writeAnswered = false;
let writeCorrectCount = 0;

// Listen
let listenOrder = [];
let listenIndex = 0;
let listenAnswered = false;
let listenCorrectCount = 0;

function openWeek(w) {
  activeWeek = w;
  document.getElementById('week-title-h').textContent = `Semana ${w}`;
  document.getElementById('week-sub-h').textContent = `50 palabras · ${weekStats(w).learned} dominadas`;
  setMode('flash');
  showView('week');
}

function setMode(m) {
  activeMode = m;
  document.querySelectorAll('#view-week .mode-btn').forEach((b) => {
    b.classList.toggle('active', b.dataset.mode === m);
  });
  ['flash', 'quiz', 'write', 'listen', 'list'].forEach(x => {
    const el = document.getElementById('mode-' + x);
    if (el) el.style.display = x === m ? 'block' : 'none';
  });
  if (m === 'flash') startFlash();
  if (m === 'quiz') startQuiz();
  if (m === 'write') startWrite();
  if (m === 'listen') startListen();
  if (m === 'list') renderList();
}

// ========================
// FLASHCARDS
// ========================
function startFlash() {
  // Restaurar HTML por si quedó "completed"
  document.getElementById('mode-flash').innerHTML = flashHTML();
  flashOrder = PALABRAS[activeWeek].map((_, i) => i)
    .sort((a, b) => {
      const la = isLearned(activeWeek, a) ? 1 : 0;
      const lb = isLearned(activeWeek, b) ? 1 : 0;
      return la - lb;
    });
  flashIndex = 0;
  flashStartLearned = weekStats(activeWeek).learned;
  showFlash();
}

function flashHTML() {
  return `
    <div class="progress-text" id="flash-progress-text">—</div>
    <div class="progress-bar"><div class="progress-fill" id="flash-progress-fill"></div></div>
    <div class="flashcard-wrap">
      <div class="flashcard" id="flashcard" onclick="flipCard()">
        <div class="face front">
          <button class="btn-audio" id="flash-audio-btn" onclick="event.stopPropagation(); audioFlash()">🔊</button>
          <div class="en" id="card-en">—</div>
          <div class="hint">Toca para ver traducción</div>
        </div>
        <div class="face back">
          <div class="es" id="card-es">—</div>
          <div class="ej" id="card-ej"></div>
          <div class="hint">Toca para volver</div>
        </div>
      </div>
    </div>
    <div class="flashcard-actions">
      <button class="btn btn-fail" onclick="markWord(false)">No la sé</button>
      <button class="btn btn-pass" onclick="markWord(true)">La sé</button>
    </div>
  `;
}

function audioFlash() {
  const w = currentFlashWord();
  if (w) speak(w.en);
  const btn = document.getElementById('flash-audio-btn');
  if (btn) {
    btn.classList.add('playing');
    setTimeout(() => btn.classList.remove('playing'), 800);
  }
}

function currentFlashWord() {
  return PALABRAS[activeWeek][flashOrder[flashIndex]];
}

function showFlash() {
  const w = currentFlashWord();
  if (!w) return;
  const card = document.getElementById('flashcard');
  card.classList.remove('flipped');
  document.getElementById('card-en').textContent = w.en;
  document.getElementById('card-es').textContent = w.es;
  document.getElementById('card-ej').textContent = w.ej || '';
  document.getElementById('flash-progress-text').textContent =
    `${flashIndex + 1} / ${flashOrder.length}`;
  document.getElementById('flash-progress-fill').style.width =
    ((flashIndex + 1) / flashOrder.length * 100) + '%';
  if (state.autoplay) setTimeout(() => speak(w.en), 200);
}

function flipCard() {
  document.getElementById('flashcard').classList.toggle('flipped');
}

function markWord(known) {
  const idx = flashOrder[flashIndex];
  const k = wordKey(activeWeek, idx);
  const wasLearned = isLearned(activeWeek, idx);
  if (known) {
    state.learned[k] = (state.learned[k] || 0) + 1;
    addXp(XP.flashcard_known);
  } else {
    state.learned[k] = Math.max(0, (state.learned[k] || 0) - 1);
    addXp(XP.flashcard_unknown);
  }
  if (!wasLearned && isLearned(activeWeek, idx)) {
    addXp(XP.word_mastered);
    toast('Palabra dominada', '+' + XP.word_mastered + ' XP');
  }
  trackActivity();
  saveState();
  checkAchievements();
  flashIndex++;
  if (flashIndex >= flashOrder.length) {
    const remaining = flashOrder.filter(i => !isLearned(activeWeek, i));
    if (remaining.length > 0) {
      flashOrder = remaining;
      flashIndex = 0;
      showFlash();
    } else {
      finishWeek();
      showCompleted('flash');
    }
  } else showFlash();
}

function showCompleted(mode) {
  const learned = weekStats(activeWeek).learned;
  const gained = learned - flashStartLearned;
  document.getElementById('mode-' + mode).innerHTML = `
    <div class="completed-msg">
      <div class="icon">🎉</div>
      <h2>¡Genial!</h2>
      <p>Has completado esta sesión de la Semana ${activeWeek}</p>
      <div class="completed-stats">
        <div class="completed-stat"><div class="v">${learned}</div><div class="l">Dominadas</div></div>
        <div class="completed-stat"><div class="v">+${gained}</div><div class="l">Nuevas</div></div>
        <div class="completed-stat"><div class="v">${weekStats(activeWeek).pct}%</div><div class="l">Progreso</div></div>
      </div>
      <button class="btn btn-primary" onclick="setMode('${mode}')" style="margin-bottom: 10px;">🔁 Repetir</button>
      <button class="btn btn-ghost" onclick="goDashboard()">← Volver al inicio</button>
    </div>
  `;
}

function finishWeek() {
  const st = weekStats(activeWeek);
  if (st.pct === 100 && !state.weekDoneAt[activeWeek]) {
    state.weekDoneAt[activeWeek] = today();
    addXp(XP.week_completed);
    confetti();
    saveState();
    checkAchievements();
  }
}

// ========================
// QUIZ
// ========================
function startQuiz() {
  document.getElementById('mode-quiz').innerHTML = quizHTML();
  quizOrder = PALABRAS[activeWeek].map((_, i) => i).sort(() => Math.random() - 0.5);
  quizIndex = 0;
  quizCorrectCount = 0;
  showQuizQ();
}

function quizHTML() {
  return `
    <div class="progress-text" id="quiz-progress-text">—</div>
    <div class="progress-bar"><div class="progress-fill" id="quiz-progress-fill"></div></div>
    <div class="quiz-subq">¿Qué significa?</div>
    <div class="quiz-q" id="quiz-question">—</div>
    <div class="quiz-options" id="quiz-options"></div>
  `;
}

function showQuizQ() {
  if (quizIndex >= quizOrder.length) {
    document.getElementById('mode-quiz').innerHTML = `
      <div class="completed-msg">
        <div class="icon">✨</div>
        <h2>¡Quiz completado!</h2>
        <p>${quizCorrectCount}/${quizOrder.length} aciertos</p>
        <div class="completed-stats">
          <div class="completed-stat"><div class="v">${quizCorrectCount}</div><div class="l">Aciertos</div></div>
          <div class="completed-stat"><div class="v">${Math.round(quizCorrectCount/quizOrder.length*100)}%</div><div class="l">Precisión</div></div>
          <div class="completed-stat"><div class="v">+${quizCorrectCount * XP.quiz_correct}</div><div class="l">XP ganado</div></div>
        </div>
        <button class="btn btn-primary" onclick="setMode('quiz')" style="margin-bottom: 10px;">🔁 Repetir</button>
        <button class="btn btn-ghost" onclick="goDashboard()">← Volver</button>
      </div>
    `;
    return;
  }
  const idx = quizOrder[quizIndex];
  const w = PALABRAS[activeWeek][idx];

  const all = [];
  for (let wk = 1; wk <= 10; wk++) for (const p of PALABRAS[wk]) if (p.es !== w.es) all.push(p.es);
  const distractors = [];
  while (distractors.length < 3) {
    const cand = all[Math.floor(Math.random() * all.length)];
    if (!distractors.includes(cand)) distractors.push(cand);
  }
  const opts = [...distractors, w.es].sort(() => Math.random() - 0.5);

  document.getElementById('quiz-question').textContent = w.en;
  document.getElementById('quiz-question').classList.toggle('small', w.en.length > 12);
  document.getElementById('quiz-progress-text').textContent = `${quizIndex + 1} / ${quizOrder.length}`;
  document.getElementById('quiz-progress-fill').style.width = ((quizIndex + 1) / quizOrder.length * 100) + '%';

  const cont = document.getElementById('quiz-options');
  cont.innerHTML = '';
  opts.forEach((o, i) => {
    const btn = document.createElement('button');
    btn.className = 'quiz-option';
    btn.innerHTML = `<span class="num">${String.fromCharCode(65 + i)}</span><span>${o}</span>`;
    btn.onclick = () => answerQuiz(btn, o, w.es, idx);
    cont.appendChild(btn);
  });

  if (state.autoplay) setTimeout(() => speak(w.en), 150);
}

function answerQuiz(btn, picked, correct, idx) {
  const btns = document.querySelectorAll('#quiz-options .quiz-option');
  btns.forEach(b => {
    if (b.querySelector('span:last-child').textContent === correct) b.classList.add('correct');
    else if (b === btn) b.classList.add('wrong');
    b.onclick = null;
  });
  const k = wordKey(activeWeek, idx);
  const wasLearned = isLearned(activeWeek, idx);
  if (picked === correct) {
    state.learned[k] = (state.learned[k] || 0) + 1;
    addXp(XP.quiz_correct);
    quizCorrectCount++;
  } else {
    addXp(XP.quiz_wrong);
  }
  if (!wasLearned && isLearned(activeWeek, idx)) {
    addXp(XP.word_mastered);
    toast('Palabra dominada', '+' + XP.word_mastered + ' XP');
  }
  trackActivity();
  saveState();
  checkAchievements();
  setTimeout(() => { quizIndex++; showQuizQ(); }, 850);
}

// ========================
// ESCRIBIR
// ========================
function startWrite() {
  document.getElementById('mode-write').innerHTML = writeHTML();
  writeOrder = PALABRAS[activeWeek].map((_, i) => i).sort(() => Math.random() - 0.5);
  writeIndex = 0;
  writeCorrectCount = 0;
  writeAnswered = false;
  bindWriteDir();
  showWriteQ();
}

function writeHTML() {
  return `
    <div class="progress-text" id="write-progress-text">—</div>
    <div class="progress-bar"><div class="progress-fill" id="write-progress-fill"></div></div>

    <div class="mode-bar" style="margin-bottom: 14px;">
      <button class="mode-btn ${writeDir === 'en2es' ? 'active' : ''}" data-wdir="en2es">
        <div class="mode-ico">🇬🇧</div>
        EN → ES
      </button>
      <button class="mode-btn ${writeDir === 'es2en' ? 'active' : ''}" data-wdir="es2en">
        <div class="mode-ico">🇪🇸</div>
        ES → EN
      </button>
    </div>

    <div class="write-prompt">
      <div class="write-prompt-dir" id="write-dir-label">Traduce al español</div>
      <div class="write-prompt-word" id="write-word">—</div>
      <div class="write-prompt-ej" id="write-ej"></div>
    </div>

    <div class="write-input-wrap">
      <input type="text" class="write-input" id="write-input" placeholder="Escribe la traducción..." autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false">
    </div>

    <div class="write-feedback" id="write-feedback"></div>

    <div class="write-actions">
      <button class="btn btn-ghost" onclick="writeSkip()">Saltar</button>
      <button class="btn btn-primary" id="write-submit-btn" onclick="writeSubmit()">Comprobar</button>
    </div>
  `;
}

function bindWriteDir() {
  document.querySelectorAll('[data-wdir]').forEach(b => {
    b.onclick = () => {
      writeDir = b.dataset.wdir;
      document.querySelectorAll('[data-wdir]').forEach(x => x.classList.toggle('active', x === b));
      showWriteQ();
    };
  });
  const inp = document.getElementById('write-input');
  if (inp) {
    inp.onkeydown = (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        if (writeAnswered) writeNext();
        else writeSubmit();
      }
    };
  }
}

function showWriteQ() {
  if (writeIndex >= writeOrder.length) {
    document.getElementById('mode-write').innerHTML = `
      <div class="completed-msg">
        <div class="icon">✍️</div>
        <h2>¡Escritura completa!</h2>
        <p>${writeCorrectCount}/${writeOrder.length} aciertos</p>
        <div class="completed-stats">
          <div class="completed-stat"><div class="v">${writeCorrectCount}</div><div class="l">Aciertos</div></div>
          <div class="completed-stat"><div class="v">${Math.round(writeCorrectCount/writeOrder.length*100)}%</div><div class="l">Precisión</div></div>
          <div class="completed-stat"><div class="v">+${writeCorrectCount * XP.write_correct}</div><div class="l">XP</div></div>
        </div>
        <button class="btn btn-primary" onclick="setMode('write')" style="margin-bottom: 10px;">🔁 Repetir</button>
        <button class="btn btn-ghost" onclick="goDashboard()">← Volver</button>
      </div>
    `;
    return;
  }
  writeAnswered = false;
  const idx = writeOrder[writeIndex];
  const w = PALABRAS[activeWeek][idx];
  const isEn2Es = writeDir === 'en2es';
  document.getElementById('write-dir-label').textContent = isEn2Es ? 'Traduce al ESPAÑOL' : 'Traduce al INGLÉS';
  document.getElementById('write-word').textContent = isEn2Es ? w.en : w.es;
  document.getElementById('write-ej').textContent = isEn2Es ? '' : (w.ej || '');
  document.getElementById('write-input').value = '';
  document.getElementById('write-input').className = 'write-input';
  document.getElementById('write-feedback').className = 'write-feedback';
  document.getElementById('write-feedback').innerHTML = '';
  document.getElementById('write-submit-btn').textContent = 'Comprobar';
  document.getElementById('write-progress-text').textContent = `${writeIndex + 1} / ${writeOrder.length}`;
  document.getElementById('write-progress-fill').style.width = ((writeIndex + 1) / writeOrder.length * 100) + '%';
  setTimeout(() => document.getElementById('write-input').focus(), 100);
  if (isEn2Es && state.autoplay) setTimeout(() => speak(w.en), 200);
}

function writeSubmit() {
  if (writeAnswered) { writeNext(); return; }
  const inp = document.getElementById('write-input');
  const val = inp.value.trim();
  if (!val) { inp.focus(); return; }

  const idx = writeOrder[writeIndex];
  const w = PALABRAS[activeWeek][idx];
  const correct = writeDir === 'en2es' ? w.es : w.en;
  const isCorrect = checkAnswer(val, correct);

  const k = wordKey(activeWeek, idx);
  const wasLearned = isLearned(activeWeek, idx);
  if (isCorrect) {
    state.learned[k] = (state.learned[k] || 0) + 1;
    state.writeCorrect = (state.writeCorrect || 0) + 1;
    addXp(XP.write_correct);
    writeCorrectCount++;
    inp.classList.add('correct');
    const fb = document.getElementById('write-feedback');
    fb.classList.add('correct');
    fb.innerHTML = `✓ ¡Correcto! +${XP.write_correct} XP`;
    if (writeDir === 'es2en') speak(w.en);
  } else {
    addXp(XP.write_wrong);
    inp.classList.add('wrong');
    const fb = document.getElementById('write-feedback');
    fb.classList.add('wrong');
    fb.innerHTML = `✗ Incorrecto<span class="answer">→ ${correct}</span>`;
    state.learned[k] = Math.max(0, (state.learned[k] || 0) - 1);
  }
  if (!wasLearned && isLearned(activeWeek, idx)) {
    addXp(XP.word_mastered);
    toast('Palabra dominada', '+' + XP.word_mastered + ' XP');
  }
  trackActivity();
  saveState();
  checkAchievements();
  writeAnswered = true;
  document.getElementById('write-submit-btn').textContent = 'Siguiente →';
}

function writeNext() {
  writeIndex++;
  showWriteQ();
}

function writeSkip() {
  if (writeAnswered) { writeNext(); return; }
  writeIndex++;
  showWriteQ();
}

// ========================
// LISTEN
// ========================
function startListen() {
  document.getElementById('mode-listen').innerHTML = listenHTML();
  listenOrder = PALABRAS[activeWeek].map((_, i) => i).sort(() => Math.random() - 0.5);
  listenIndex = 0;
  listenCorrectCount = 0;
  listenAnswered = false;
  bindListenInput();
  showListenQ();
}

function listenHTML() {
  return `
    <div class="progress-text" id="listen-progress-text">—</div>
    <div class="progress-bar"><div class="progress-fill" id="listen-progress-fill"></div></div>

    <div class="listen-play">
      <button class="listen-play-btn" id="listen-btn" onclick="listenPlay()">🔊</button>
      <div class="listen-instr">Escucha y escribe la palabra</div>
      <div class="listen-tip">Toca el botón para repetir</div>
    </div>

    <div class="write-input-wrap">
      <input type="text" class="write-input" id="listen-input" placeholder="¿Qué has oído?" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false">
    </div>

    <div class="write-feedback" id="listen-feedback"></div>

    <div class="write-actions">
      <button class="btn btn-ghost" onclick="listenSkip()">Saltar</button>
      <button class="btn btn-primary" id="listen-submit-btn" onclick="listenSubmit()">Comprobar</button>
    </div>
  `;
}

function bindListenInput() {
  const inp = document.getElementById('listen-input');
  if (inp) {
    inp.onkeydown = (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        if (listenAnswered) { listenIndex++; showListenQ(); }
        else listenSubmit();
      }
    };
  }
}

function showListenQ() {
  if (listenIndex >= listenOrder.length) {
    document.getElementById('mode-listen').innerHTML = `
      <div class="completed-msg">
        <div class="icon">👂</div>
        <h2>¡Listening completo!</h2>
        <p>${listenCorrectCount}/${listenOrder.length} aciertos</p>
        <div class="completed-stats">
          <div class="completed-stat"><div class="v">${listenCorrectCount}</div><div class="l">Aciertos</div></div>
          <div class="completed-stat"><div class="v">${Math.round(listenCorrectCount/listenOrder.length*100)}%</div><div class="l">Precisión</div></div>
          <div class="completed-stat"><div class="v">+${listenCorrectCount * XP.listen_correct}</div><div class="l">XP</div></div>
        </div>
        <button class="btn btn-primary" onclick="setMode('listen')" style="margin-bottom: 10px;">🔁 Repetir</button>
        <button class="btn btn-ghost" onclick="goDashboard()">← Volver</button>
      </div>
    `;
    return;
  }
  listenAnswered = false;
  document.getElementById('listen-input').value = '';
  document.getElementById('listen-input').className = 'write-input';
  document.getElementById('listen-feedback').className = 'write-feedback';
  document.getElementById('listen-feedback').innerHTML = '';
  document.getElementById('listen-submit-btn').textContent = 'Comprobar';
  document.getElementById('listen-progress-text').textContent = `${listenIndex + 1} / ${listenOrder.length}`;
  document.getElementById('listen-progress-fill').style.width = ((listenIndex + 1) / listenOrder.length * 100) + '%';
  setTimeout(() => listenPlay(), 250);
  setTimeout(() => document.getElementById('listen-input').focus(), 200);
}

function listenPlay() {
  const idx = listenOrder[listenIndex];
  const w = PALABRAS[activeWeek][idx];
  if (!w) return;
  speak(w.en, { rate: 0.85 });
  const btn = document.getElementById('listen-btn');
  if (btn) {
    btn.classList.add('playing');
    setTimeout(() => btn.classList.remove('playing'), 1200);
  }
}

function listenSubmit() {
  if (listenAnswered) { listenIndex++; showListenQ(); return; }
  const inp = document.getElementById('listen-input');
  const val = inp.value.trim();
  if (!val) { inp.focus(); return; }
  const idx = listenOrder[listenIndex];
  const w = PALABRAS[activeWeek][idx];
  const isCorrect = checkAnswer(val, w.en);
  const k = wordKey(activeWeek, idx);
  const wasLearned = isLearned(activeWeek, idx);
  if (isCorrect) {
    state.learned[k] = (state.learned[k] || 0) + 1;
    state.listenCorrect = (state.listenCorrect || 0) + 1;
    addXp(XP.listen_correct);
    listenCorrectCount++;
    inp.classList.add('correct');
    const fb = document.getElementById('listen-feedback');
    fb.classList.add('correct');
    fb.innerHTML = `✓ ¡Correcto! "${w.en}" — ${w.es}`;
  } else {
    addXp(XP.listen_wrong);
    inp.classList.add('wrong');
    const fb = document.getElementById('listen-feedback');
    fb.classList.add('wrong');
    fb.innerHTML = `✗ Era "${w.en}"<span class="answer">${w.es}</span>`;
    state.learned[k] = Math.max(0, (state.learned[k] || 0) - 1);
  }
  if (!wasLearned && isLearned(activeWeek, idx)) {
    addXp(XP.word_mastered);
    toast('Palabra dominada', '+' + XP.word_mastered + ' XP');
  }
  trackActivity();
  saveState();
  checkAchievements();
  listenAnswered = true;
  document.getElementById('listen-submit-btn').textContent = 'Siguiente →';
}

function listenSkip() {
  if (listenAnswered) { listenIndex++; showListenQ(); return; }
  listenIndex++;
  showListenQ();
}

// ========================
// LISTA
// ========================
function renderList() {
  const cont = document.getElementById('mode-list');
  cont.innerHTML = '<div class="word-list" id="word-list-cont"></div>';
  const list = document.getElementById('word-list-cont');
  PALABRAS[activeWeek].forEach((w, i) => {
    const div = document.createElement('div');
    div.className = 'word-item';
    const status = isLearned(activeWeek, i) ? 'learned' : isLearning(activeWeek, i) ? 'learning' : '';
    div.innerHTML = `
      <div>
        <div class="en-text">${w.en}</div>
        <div class="es-text">${w.es}</div>
      </div>
      <div class="right">
        <button class="mini-audio">🔊</button>
        <div class="dot ${status}"></div>
      </div>
    `;
    div.querySelector('.mini-audio').onclick = (e) => {
      e.stopPropagation();
      speak(w.en);
    };
    list.appendChild(div);
  });
}

// ========================
// PROGRESO
// ========================
function renderProgress() {
  const total = totalWords();
  const learned = totalLearned();
  document.getElementById('p-total').textContent = total;
  document.getElementById('p-learned').textContent = learned;
  document.getElementById('p-pct').textContent = total ? Math.round(learned*100/total) + '%' : '0%';
  document.getElementById('p-xp').textContent = state.xp;

  // Heatmap últimas 7 semanas (49 días)
  const hm = document.getElementById('heatmap');
  hm.innerHTML = '';
  const days = 49;
  const t = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(t.getTime() - i * 86400000);
    const key = d.toISOString().slice(0,10);
    const v = state.activity[key] || 0;
    const lvl = v === 0 ? 0 : v < 5 ? 1 : v < 15 ? 2 : v < 30 ? 3 : 4;
    const cell = document.createElement('div');
    cell.className = 'heatmap-cell';
    cell.dataset.lvl = lvl;
    if (key === today()) cell.dataset.today = '1';
    cell.title = `${key}: ${v} acciones`;
    hm.appendChild(cell);
  }

  // Resumen semanas
  const list = document.getElementById('progress-list');
  list.innerHTML = '';
  for (let w = 1; w <= 10; w++) {
    const st = weekStats(w);
    const card = document.createElement('div');
    card.className = 'week-card';
    card.innerHTML = `
      <div class="top">
        <div class="week-num">${w}</div>
        <div class="week-info">
          <div class="week-title">Semana ${w}</div>
          <div class="week-meta">${st.learned}/${st.total} · ${st.pct}%</div>
        </div>
        ${st.pct === 100 ? '<div class="week-badge done">✓ Completa</div>' : ''}
      </div>
      <div class="week-progress"><div class="week-progress-fill" style="width: ${st.pct}%"></div></div>
    `;
    list.appendChild(card);
  }

  // Achievements
  const ach = document.getElementById('achievements-grid');
  ach.innerHTML = '';
  for (const a of ACHIEVEMENTS) {
    const unlocked = state.achievements.includes(a.id);
    const div = document.createElement('div');
    div.className = 'achievement' + (unlocked ? ' unlocked' : '');
    div.innerHTML = `
      <div class="achievement-icon">${a.icon}</div>
      <div class="achievement-title">${a.title}</div>
      <div class="achievement-desc">${a.desc}</div>
    `;
    ach.appendChild(div);
  }
}

// ========================
// SETTINGS
// ========================
function renderSettings() {
  const cont = document.getElementById('settings-list');
  cont.innerHTML = '';

  const items = [
    {
      icon: '🔊',
      title: 'Audio automático',
      sub: 'Reproducir audio al mostrar palabra',
      toggle: 'autoplay',
      isToggle: true
    },
    {
      icon: '🇺🇸',
      title: 'Acento',
      sub: state.accent === 'en-US' ? 'Americano (US)' : 'Británico (UK)',
      action: () => {
        state.accent = state.accent === 'en-US' ? 'en-GB' : 'en-US';
        saveState();
        renderSettings();
        speak('Hello, this is your selected accent');
      }
    },
    {
      icon: '⏩',
      title: 'Desbloquear todas las semanas',
      sub: 'Saltar el ritmo semanal',
      action: () => {
        if (confirm('¿Desbloquear todas las semanas ahora?')) {
          state.startDate = new Date(Date.now() - 70 * 86400000).toISOString().slice(0,10);
          saveState();
          toast('Todas las semanas desbloqueadas', '');
          renderSettings();
        }
      }
    },
    {
      icon: '📤',
      title: 'Exportar progreso',
      sub: 'Descargar copia de seguridad',
      action: exportProgress
    },
    {
      icon: '📥',
      title: 'Importar progreso',
      sub: 'Restaurar copia de seguridad',
      action: importProgress
    },
    {
      icon: '🗑️',
      title: 'Reiniciar todo',
      sub: 'Borrar todo el progreso',
      danger: true,
      action: resetConfirm
    }
  ];

  items.forEach(it => {
    const el = document.createElement('div');
    el.className = 'settings-item';
    const toggleHtml = it.isToggle
      ? `<div class="settings-toggle ${state[it.toggle] ? 'on' : ''}"></div>`
      : `<div style="color: var(--muted); font-size: 18px;">›</div>`;
    el.innerHTML = `
      <div class="settings-item-left">
        <div class="settings-icon" ${it.danger ? 'style="background: linear-gradient(135deg, #ef4444, #f59e0b);"' : ''}>${it.icon}</div>
        <div class="settings-info">
          <div class="title">${it.title}</div>
          <div class="sub">${it.sub}</div>
        </div>
      </div>
      ${toggleHtml}
    `;
    el.onclick = () => {
      if (it.isToggle) {
        state[it.toggle] = !state[it.toggle];
        saveState();
        renderSettings();
      } else if (it.action) it.action();
    };
    cont.appendChild(el);
  });
}

function exportProgress() {
  const data = JSON.stringify(state, null, 2);
  const blob = new Blob([data], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `english50-backup-${today()}.json`;
  a.click();
  URL.revokeObjectURL(url);
  toast('Backup descargado', '');
}

function importProgress() {
  const inp = document.createElement('input');
  inp.type = 'file';
  inp.accept = '.json';
  inp.onchange = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const obj = JSON.parse(ev.target.result);
        state = Object.assign(defaultState(), obj);
        saveState();
        toast('Progreso importado', '');
        renderXpBar();
        showView('dashboard');
      } catch (err) {
        toast('Error al importar', '');
      }
    };
    reader.readAsText(f);
  };
  inp.click();
}

function resetConfirm() {
  if (confirm('¿Borrar TODO el progreso? Esta acción no se puede deshacer.')) {
    localStorage.removeItem(STORAGE_KEY);
    state = loadState();
    updateStreak();
    renderXpBar();
    renderDashboard();
    showView('dashboard');
    toast('Progreso reiniciado', '');
  }
}

// ========================
// NAV CONTROL
// ========================
function goDashboard() {
  showView('dashboard');
}

// ========================
// INIT
// ========================
updateStreak();
renderXpBar();
renderDashboard();
