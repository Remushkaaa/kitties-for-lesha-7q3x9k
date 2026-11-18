'use strict';
const $ = s => document.querySelector(s);
const rnd = a => a[Math.floor(Math.random() * a.length)];
const store = {
  get(k, d) { try { const v = localStorage.getItem('lesha_' + k); return v === null ? d : JSON.parse(v); } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem('lesha_' + k, JSON.stringify(v)); return true; } catch (e) { return false; } }
};
const calm = matchMedia('(prefers-reduced-motion: reduce)').matches;
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

/* ---------- нарисованные котики (SVG -> картинка) ---------- */
function catSVG(o) {
  const f = o.fur, ink = '#4a2236';
  const eyes = {
    happy: `<path d="M33 49q5-8 11 0M56 49q5-8 11 0" stroke="${ink}" stroke-width="3.4" fill="none" stroke-linecap="round"/>`,
    open: `<ellipse cx="39" cy="49" rx="4.2" ry="5.2" fill="${ink}"/><ellipse cx="61" cy="49" rx="4.2" ry="5.2" fill="${ink}"/><circle cx="40.6" cy="47" r="1.6" fill="#fff"/><circle cx="62.6" cy="47" r="1.6" fill="#fff"/>`,
    sad: `<path d="M32 44l10 5-10 5M68 44l-10 5 10 5" stroke="${ink}" stroke-width="3.2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`,
    wink: `<ellipse cx="39" cy="49" rx="4.2" ry="5.2" fill="${ink}"/><circle cx="40.6" cy="47" r="1.6" fill="#fff"/><path d="M56 49q5-8 11 0" stroke="${ink}" stroke-width="3.4" fill="none" stroke-linecap="round"/>`,
    love: `<g fill="#ff3d81"><path transform="translate(39 49) scale(.85)" d="M0-3C-6-9-12 0 0 9 12 0 6-9 0-3Z"/><path transform="translate(61 49) scale(.85)" d="M0-3C-6-9-12 0 0 9 12 0 6-9 0-3Z"/></g>`
  }[o.mood];
  const mouth = o.mood === 'sad' ? `<path d="M44 65q6-6 12 0" stroke="${ink}" stroke-width="2.6" fill="none" stroke-linecap="round"/>`
    : o.mood === 'love' ? `<path d="M44 60q6 9 12 0z" fill="#ff6f9d"/>`
    : `<path d="M44 60q3 5 6 0q3 5 6 0" stroke="${ink}" stroke-width="2.6" fill="none" stroke-linecap="round"/>`;
  const acc = o.acc === 'bow'
    ? `<g transform="translate(27 20) rotate(-22)"><path d="M0 0l-13-8v16zM0 0l13-8v16z" fill="#ff4f8f"/><circle r="4" fill="#ff93bb"/></g>`
    : `<path d="M28 76q22 14 44 0l-2 9q-20 11 -40 0z" fill="#9b7bdc"/><path d="M60 84l6 14 7-3-4-13z" fill="#8767c9"/>`;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
<path d="M72 88q24-2 18-30" stroke="${f}" stroke-width="10" fill="none" stroke-linecap="round"/>
<ellipse cx="50" cy="86" rx="27" ry="17" fill="${f}"/>
<ellipse cx="38" cy="98" rx="9" ry="5" fill="${o.paw}"/><ellipse cx="62" cy="98" rx="9" ry="5" fill="${o.paw}"/>
<path d="M21 36L27 5 47 22zM79 36L73 5 53 22z" fill="${f}"/>
<path d="M27 30L30 12 41 22zM73 30L70 12 59 22z" fill="#ffb5cf"/>
<circle cx="50" cy="50" r="31" fill="${f}"/>
<ellipse cx="50" cy="62" rx="14" ry="9" fill="${o.paw}" opacity=".85"/>
${eyes}
<path d="M47.5 56h5L50 59.5z" fill="#ff7aa5"/>${mouth}
<ellipse cx="28" cy="58" rx="6" ry="3.6" fill="#ff8fb4" opacity=".7"/><ellipse cx="72" cy="58" rx="6" ry="3.6" fill="#ff8fb4" opacity=".7"/>
<path d="M14 54l12 2M14 62l12-2M86 54l-12 2M86 62l-12-2" stroke="${ink}" stroke-width="1.4" opacity=".5" stroke-linecap="round"/>
${acc}</svg>`;
  return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
}
const REMI = { fur: '#ffc2d6', paw: '#fff0f5', acc: 'bow' }, LESHA = { fur: '#b9b3d6', paw: '#eceaf7', acc: 'scarf' };
const cat = (who, mood) => catSVG(Object.assign({ mood }, who));
const IMG = {};
[['remi', REMI], ['lesha', LESHA]].forEach(([n, w]) => ['happy', 'open', 'sad', 'wink', 'love'].forEach(m => { const i = new Image(); i.src = cat(w, m); IMG[n + m] = i; }));

$('#heroCats').innerHTML = `<img src="${cat(REMI, 'love')}" alt=""><span class="heart-mid">💗</span><img src="${cat(LESHA, 'love')}" alt="">`;
$('#oracleBtn').innerHTML = `<img src="${cat(LESHA, 'open')}" alt="">`;

/* ---------- звук и музыка ---------- */
const AU = { ctx: null, sfx: store.get('sfx', true), mus: store.get('mus', true), timer: null, step: 0, started: false };
function ac() {
  if (!AU.ctx) { try { AU.ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) {} }
  if (AU.ctx && AU.ctx.state === 'suspended') AU.ctx.resume();
  return AU.ctx;
}
function tone(f, d = .12, type = 'sine', v = .07, when = 0, slide = 0, music = false) {
  if (music ? !AU.mus : !AU.sfx) return;
  const c = ac(); if (!c) return;
  const t0 = c.currentTime + when, o = c.createOscillator(), g = c.createGain();
  o.type = type; o.frequency.setValueAtTime(f, t0);
  if (slide) o.frequency.exponentialRampToValueAtTime(slide, t0 + d);
  g.gain.setValueAtTime(v, t0); g.gain.exponentialRampToValueAtTime(.0001, t0 + d);
  o.connect(g); g.connect(c.destination); o.start(t0); o.stop(t0 + d + .03);
}
const SND = {
  good: () => tone(740 + Math.random() * 120, .13, 'sine', .08, 0, 1100),
  fish: () => { tone(880, .1, 'triangle', .08); tone(1320, .16, 'triangle', .08, .08); },
  bad: () => tone(220, .3, 'sawtooth', .07, 0, 70),
  power: () => [523, 659, 784, 1047].forEach((f, i) => tone(f, .14, 'triangle', .08, i * .07)),
  kiss: () => [523, 659, 784, 1047, 1319].forEach((f, i) => tone(f, .5, 'sine', .07, i * .09)),
  over: () => [440, 370, 311, 262].forEach((f, i) => tone(f, .25, 'triangle', .07, i * .15)),
  flip: () => tone(600, .06, 'square', .03),
  match: () => { tone(784, .12, 'sine', .08); tone(1175, .2, 'sine', .08, .1); },
  click: () => tone(1000, .05, 'sine', .05)
};
const MEL = [0, 2, 4, 2, 3, 1, 2, 0, 0, 2, 4, 5, 4, 2, 3, 1], SC = [523.25, 587.33, 659.25, 783.99, 880, 1046.5];
function musicTick() {
  const s = AU.step++, n = MEL[s % 16];
  tone(SC[n], 1.1, 'sine', .035, 0, 0, true);
  if (s % 4 === 0) tone([261.6, 196, 220, 174.6][(s / 4) % 4 | 0], 1.8, 'triangle', .03, 0, 0, true);
}
function musicSync() {
  clearInterval(AU.timer); AU.timer = null;
  if (AU.mus && AU.started) AU.timer = setInterval(musicTick, 480);
  $('#musBtn').classList.toggle('off', !AU.mus); $('#sndBtn').classList.toggle('off', !AU.sfx);
}
$('#sndBtn').addEventListener('click', () => { AU.sfx = !AU.sfx; store.set('sfx', AU.sfx); musicSync(); SND.click(); });
$('#musBtn').addEventListener('click', () => { AU.mus = !AU.mus; AU.started = true; store.set('mus', AU.mus); ac(); musicSync(); });
musicSync();

/* ---------- ночной режим ---------- */
function night(on) { document.body.classList.toggle('night', on); store.set('night', on); $('#nightBtn').textContent = on ? '☀️' : '🌙'; }
night(store.get('night', false));
$('#nightBtn').addEventListener('click', () => night(!document.body.classList.contains('night')));

/* ---------- эффекты ---------- */
const bg = $('#bg');
if (!calm) {
  setInterval(() => {
    if (document.hidden) return;
    const h = document.createElement('span');
    h.className = 'fh'; h.textContent = rnd(['💗', '💖', '💕', '🌸', '🐾', '✨', '💞']);
    h.style.left = Math.random() * 100 + '%'; h.style.fontSize = 14 + Math.random() * 26 + 'px';
    h.style.animationDuration = 7 + Math.random() * 7 + 's';
    bg.appendChild(h); h.addEventListener('animationend', () => h.remove());
  }, 700);
}
function pop(x, y, ch) {
  const p = document.createElement('span');
  p.className = 'pop'; p.textContent = ch || rnd(['💗', '💖', '💕', '😻', '🐾']);
  p.style.left = x + 'px'; p.style.top = y + 'px';
  document.body.appendChild(p); setTimeout(() => p.remove(), 1000);
}
document.addEventListener('pointerdown', e => { if (!e.target.closest('#gameCanvas, #intro, .mc')) pop(e.clientX, e.clientY); });
let lastSpark = 0;
document.addEventListener('pointermove', e => {
  if (calm || e.pointerType !== 'mouse' || e.target.closest('#gameCanvas')) return;
  const n = performance.now(); if (n - lastSpark < 60) return; lastSpark = n;
  const s = document.createElement('i'); s.className = 'spark';
  s.style.left = e.clientX + 'px'; s.style.top = e.clientY + 'px';
  s.style.setProperty('--dx', (Math.random() - .5) * 40 + 'px'); s.style.setProperty('--dy', 10 + Math.random() * 30 + 'px');
  s.style.background = rnd(['#ff6fa5', '#ffb3d0', '#ffd1e3', '#c9a7ff']);
  document.body.appendChild(s); setTimeout(() => s.remove(), 700);
}, { passive: true });

function confetti(n = 140) {
  if (calm) return;
  const c = document.createElement('canvas'); c.id = 'confetti'; c.width = innerWidth; c.height = innerHeight; document.body.appendChild(c);
  const x = c.getContext('2d'), cols = ['#ff6fa5', '#ffb3d0', '#fff', '#c9a7ff', '#ffd166', '#ff9ec4'];
  const P = Array.from({ length: n }, () => ({ x: c.width / 2 + (Math.random() - .5) * 200, y: c.height * .55, vx: (Math.random() - .5) * 16, vy: -8 - Math.random() * 12,
    r: 4 + Math.random() * 6, c: rnd(cols), a: Math.random() * 6, h: Math.random() < .25 }));
  let t = 0;
  (function f() {
    x.clearRect(0, 0, c.width, c.height); t++;
    P.forEach(p => { p.vy += .35; p.x += p.vx; p.y += p.vy; p.a += .2; x.fillStyle = p.c; x.globalAlpha = Math.max(0, 1 - t / 130);
      if (p.h) { x.font = p.r * 3 + 'px serif'; x.fillText('💗', p.x, p.y); } else { x.save(); x.translate(p.x, p.y); x.rotate(p.a); x.fillRect(-p.r, -p.r / 2, p.r * 2, p.r); x.restore(); } });
    if (t < 130) requestAnimationFrame(f); else c.remove();
  })();
}

const io = 'IntersectionObserver' in window ? new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); if (e.target.id === 'letter') typeLetter(); } }), { threshold: .12 }) : null;
document.querySelectorAll('.reveal').forEach(el => io ? io.observe(el) : el.classList.add('in'));

/* ---------- вход ---------- */
function openIntro() {
  AU.started = true; ac(); musicSync(); SND.power(); confetti(); $('#intro').classList.add('gone');
  setTimeout(() => $('#intro').remove(), 900);
}
$('#intro').addEventListener('click', openIntro);
$('#intro').addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') openIntro(); });

/* ---------- обнимашки и мурчание ---------- */
let hugs = store.get('hugs', 0);
$('#hugCount').textContent = hugs;
$('#hugBtn').addEventListener('click', e => {
  hugs++; store.set('hugs', hugs); $('#hugCount').textContent = hugs; SND.good();
  if (navigator.vibrate) navigator.vibrate(30);
  for (let i = 0; i < 8; i++) setTimeout(() => pop(e.clientX + (Math.random() - .5) * 120, e.clientY - Math.random() * 60, '🤗'), i * 60);
});
let purring = false;
function synthPurr(c) {
  const o = c.createOscillator(), lp = c.createBiquadFilter(), g = c.createGain(), lfo = c.createOscillator(), lg = c.createGain();
  o.type = 'sawtooth'; o.frequency.value = 62; lp.type = 'lowpass'; lp.frequency.value = 380; g.gain.value = .07;
  lfo.frequency.value = 24; lg.gain.value = .06; lfo.connect(lg); lg.connect(g.gain);
  o.connect(lp); lp.connect(g); g.connect(c.destination); o.start(); lfo.start(); o.stop(c.currentTime + 4); lfo.stop(c.currentTime + 4);
}
$('#purrBtn').addEventListener('click', e => {
  const pa = $('#purrAudio'), btn = $('#purrBtn');
  if (purring) { purring = false; pa.pause(); btn.textContent = 'Помурчать 😽'; return; }
  purring = true; btn.textContent = 'Хватит мурчать 🙀';
  const stop = () => { if (!purring) return; purring = false; pa.pause(); btn.textContent = 'Помурчать 😽'; };
  pa.currentTime = 0; pa.volume = .85;
  pa.play().catch(() => { const c = ac(); if (c) synthPurr(c); });       // нет файла и интернета — запасной синтезированный звук
  if (navigator.vibrate) navigator.vibrate(Array(30).fill(90));
  const iv = setInterval(() => { if (!purring) clearInterval(iv); else pop(e.clientX + (Math.random() - .5) * 140, e.clientY - 20, rnd(['😽', '🐾', '💗'])); }, 280);
  setTimeout(stop, 9000);
});

/* ---------- письмо ---------- */
const LETTER = `Лешенька, привет, мой котик! 🐱

Если ты это читаешь — значит, сюрприз удался, а я где-то рядом хихикаю и жду твою реакцию. Я сделала тебе целый сайт с котиками: один из них я, а второй — ты, конечно.

С 11 августа у меня режим «хочу обниматься». Ты — самый тёплый человек в моей жизни: с тобой даже серые дни становятся классными. Ты смешишь меня до икоты, греешь лучше любого пледа, и я просто обожаю, как мы лежим рядом и молчим (или болтаем часами про всякую ерунду).

Спасибо, что ты есть, что возишься со мной и принимаешь всю мою любовь. А её у меня много, ты в курсе. Так что готовься: буду тискать, целовать в щёчки и носик и дальше.

Играй, смейся, тыкай во все кнопки — там много всего. А потом приходи, я заберу свою порцию обнимашек.

Люблю тебя, мой котик.
Твоя Реми 💗`;
let letterTyped = false;
const getLetter = () => store.get('letter', LETTER);
function typeLetter() {
  if (letterTyped) return; letterTyped = true;
  const p = $('#paper'), txt = getLetter();
  if (calm) { p.textContent = txt; return; }
  p.classList.add('typing'); let i = 0;
  (function s() { p.textContent = txt.slice(0, i); i += 2; if (i <= txt.length + 1) setTimeout(s, 32); else { p.textContent = txt; p.classList.remove('typing'); } })();
}
if (!io) typeLetter();
$('#editLetter').addEventListener('click', () => { $('#letterText').value = getLetter(); $('#letterEdit').classList.toggle('hide'); });
$('#saveLetter').addEventListener('click', () => { store.set('letter', $('#letterText').value); letterTyped = true; $('#paper').classList.remove('typing'); $('#paper').textContent = $('#letterText').value; $('#letterEdit').classList.add('hide'); SND.match(); });
$('#resetLetter').addEventListener('click', () => { localStorage.removeItem('lesha_letter'); letterTyped = true; $('#paper').classList.remove('typing'); $('#letterText').value = LETTER; $('#paper').textContent = LETTER; });

/* ---------- счётчик дней ---------- */
const dateEl = $('#startDate');
function renderDays() {
  const out = $('#daysOut'), v = store.get('start', '2026-08-11');
  if (!v) { out.innerHTML = '<p>Выбери дату — и я посчитаю, сколько мы мурчим вместе 💗</p>'; return; }
  const ms = Date.now() - new Date(v + 'T00:00:00').getTime();
  if (ms < 0) { out.innerHTML = '<p>Это ещё впереди — ждём 💞</p>'; return; }
  const d = Math.floor(ms / 864e5), h = Math.floor(ms / 36e5) % 24, m = Math.floor(ms / 6e4) % 60;
  out.innerHTML = `<div><b>${d}</b><span>дней</span></div><div><b>${h}</b><span>часов</span></div><div><b>${m}</b><span>минут</span></div><div><b>${d * 24 + h}</b><span>часов всего</span></div>`;
}
dateEl.value = store.get('start', '2026-08-11');
dateEl.addEventListener('change', () => { store.set('start', dateEl.value); renderDays(); });
renderDays(); setInterval(renderDays, 30000);

/* ---------- игра ---------- */
(function () {
  const cv = $('#gameCanvas'), ctx = cv.getContext('2d'), W = cv.width, H = cv.height, ov = $('#gameOverlay');
  let run = false, score, lives, items, catX, tgtX, partX, t, last, spawn, hurt, kissed, parts, combo, magnet, slow, squash, flash, kissT, shield, gold, dizzy, meter, lvl, banner;
  let best = store.get('best', 0);
  const goal = 20, PER = 15;
  const SKY = [['#ffeaf3', '#ffc9de'], ['#ffe2cf', '#ffb7c9'], ['#f0d4ff', '#c79bea'], ['#3a2160', '#9a4a96'], ['#120a2e', '#4a2a7a']];
  const KINDS = [
    { e: '💗', p: 1, w: 6 }, { e: '🍓', p: 1, w: 2 }, { e: '🐟', p: 3, w: 1 }, { e: '🥒', bad: true, w: 3 },
    { e: '💘', pw: 'magnet', w: .5, min: 5 }, { e: '🧶', pw: 'slow', w: .5, min: 5 },
    { e: '⭐', pw: 'gold', w: .5, min: 8 }, { e: '🛡️', pw: 'shield', w: .45, min: 8 },
    { e: '🌶️', bad: true, chili: true, w: 1.4, min: 2 }
  ];
  const lvlOf = s => 1 + Math.floor(s / PER);
  function pick() {
    const ks = KINDS.filter(k => !k.min || lvl >= 1 && score >= k.min).map(k => k.bad && !k.chili ? Object.assign({}, k, { w: k.w + Math.min(3, lvl * .5) }) : k);
    const tot = ks.reduce((s, k) => s + k.w, 0); let r = Math.random() * tot;
    for (const k of ks) { if ((r -= k.w) < 0) return k; } return ks[0];
  }
  const mult = () => Math.min(4, 1 + Math.floor(combo / 5)) * (gold > 0 ? 2 : 1);
  function mk(k, x, y) {
    return { k, x: Math.max(30, Math.min(W - 30, x)), y, vy: 170 + score * 3.8 + Math.random() * 45, rot: Math.random() * 6, ph: Math.random() * 6, sway: k.bad && lvl >= 2 && Math.random() < .5 };
  }
  function reset() {
    score = 0; lives = 3; items = []; parts = []; catX = tgtX = W / 2; partX = W / 2; t = 0; spawn = .5; hurt = 0; kissed = false; combo = 0; magnet = 0; slow = 0; squash = 0; flash = 0; kissT = 0; shield = false; gold = 0; dizzy = 0; meter = 0; lvl = 1; banner = 0;
    hud();
  }
  function hud() {
    $('#score').textContent = score; $('#lives').textContent = '❤️'.repeat(lives) + '🖤'.repeat(3 - lives); $('#best').textContent = best;
    $('#combo').textContent = combo >= 5 ? `комбо x${mult()}` : '';
    $('#lvl').textContent = 'Уровень ' + lvl; $('#meterFill').style.width = Math.min(100, meter) + '%';
    const kb = $('#kissBtn'); kb.disabled = !(run && meter >= 100); kb.classList.toggle('ready', run && meter >= 100);
  }
  function start() { reset(); ov.classList.add('hide'); run = true; last = performance.now(); ac(); hud(); requestAnimationFrame(loop); }
  function end() {
    run = false; SND.over(); hud();
    const rec = score > best; if (rec) { best = score; store.set('best', best); hud(); }
    $('#ovTitle').textContent = score >= goal ? 'Ура, котики счастливы! 😽' : 'Огурец победил 🥒';
    $('#ovText').textContent = `Поймано: ${score}. Уровень ${lvl}. Рекорд: ${best}${rec && score > 0 ? ' — новый!' : ''}. ${score >= goal ? 'Любви хватит на двоих.' : 'Попробуем ещё? Огурцы не вечны.'}`;
    $('#startBtn').textContent = 'Ещё раз'; ov.classList.remove('hide');
    if (rec && score >= goal) confetti(100);
  }
  const clampX = x => Math.max(44, Math.min(W - 44, x));
  const flip = x => dizzy > 0 ? W - x : x;
  function moveTo(cx) { const r = cv.getBoundingClientRect(); tgtX = clampX(flip((cx - r.left) / r.width * W)); }
  cv.addEventListener('pointermove', e => moveTo(e.clientX));
  cv.addEventListener('pointerdown', e => moveTo(e.clientX));
  const keys = {};
  addEventListener('keydown', e => {
    if (!run) return;
    if (['ArrowLeft', 'ArrowRight', 'a', 'd'].includes(e.key)) { keys[e.key] = 1; e.preventDefault(); }
    if (e.key === ' ') { e.preventDefault(); superKiss(); }
  });
  addEventListener('keyup', e => { delete keys[e.key]; });
  $('#startBtn').addEventListener('click', start);
  $('#kissBtn').addEventListener('click', superKiss);

  function puff(x, y, ch, n = 6) { for (let i = 0; i < n; i++) parts.push({ x, y, vx: (Math.random() - .5) * 180, vy: -60 - Math.random() * 130, life: .7, ch }); }
  function label(x, y, text, col) { parts.push({ x, y, vx: 0, vy: -70, life: 1, text, col }); }

  function superKiss() {
    if (!run || meter < 100) return;
    meter = 0; kissT = 1.2; SND.kiss(); flash = .6;
    let n = 0; items = items.filter(it => { if (it.k.bad) { puff(it.x, it.y, '💥', 3); n++; return false; } return true; });
    const g = 5 + n * 2; score += g; label(catX, H - 150, `💋 +${g}`, '#e0227a'); puff(catX, H - 100, '💋', 10); hud(); checkLevel();
  }
  function checkLevel() {
    const nl = lvlOf(score);
    if (nl > lvl) { lvl = nl; banner = 2; SND.power(); label(W / 2, H / 2, `Уровень ${lvl}!`, '#a24bd6'); if (lives < 3 && lvl % 2 === 0) { lives++; label(W / 2, H / 2 + 34, '+❤️', '#e0227a'); } hud(); }
    if (!kissed && score >= goal) { kissed = true; kiss(); }
  }
  function wave() {
    const r = Math.random();
    if (lvl >= 3 && r < .17) {            // дождик: линия предметов с одним безопасным проходом
      const gap = Math.floor(Math.random() * 6);
      for (let i = 0; i < 6; i++) { const k = i === gap ? KINDS[0] : (Math.random() < .35 ? KINDS[3] : KINDS[Math.random() < .7 ? 0 : 1]); items.push(mk(k, 40 + i * (W - 80) / 5, 70 - Math.random() * 20)); }
      label(W / 2, 110, 'дождик!', '#7a2c4e'); return 2.2;
    }
    if (lvl >= 2 && r < .38) {            // веер из трёх
      [-70, 0, 70].forEach(dx => items.push(mk(pick(), partX + dx, 74)));
      return Math.max(.7, 1.4 - lvl * .08);
    }
    items.push(mk(pick(), partX + (Math.random() - .5) * 30, 74));
    return Math.max(.38, 1.05 - score * .012);
  }

  function loop(now) {
    if (!run) return;
    const dt = Math.min(.05, (now - last) / 1000); last = now; t += dt;
    const sp = slow > 0 ? .55 : 1;
    const dir = dizzy > 0 ? -1 : 1;
    if (keys.ArrowLeft || keys.a) tgtX = clampX(tgtX - dir * 430 * dt);
    if (keys.ArrowRight || keys.d) tgtX = clampX(tgtX + dir * 430 * dt);
    catX += (tgtX - catX) * Math.min(1, dt * 14);
    partX = W / 2 + Math.sin(t * (.9 + lvl * .08)) * (W / 2 - 64) * Math.cos(t * .31);
    magnet = Math.max(0, magnet - dt); slow = Math.max(0, slow - dt); gold = Math.max(0, gold - dt); dizzy = Math.max(0, dizzy - dt);
    squash = Math.max(0, squash - dt * 4); hurt = Math.max(0, hurt - dt); flash = Math.max(0, flash - dt * 3); kissT = Math.max(0, kissT - dt); banner = Math.max(0, banner - dt);
    spawn -= dt * sp;
    if (spawn <= 0 && kissT <= 0) spawn = wave();
    for (const it of items) {
      it.y += it.vy * dt * sp; it.rot += dt;
      if (it.sway) it.x = Math.max(30, Math.min(W - 30, it.x + Math.sin(t * 4 + it.ph) * 70 * dt));
      if (magnet > 0 && !it.k.bad && it.y > 150) it.x += Math.sign(catX - it.x) * Math.min(Math.abs(catX - it.x), 260 * dt);
    }
    for (let i = items.length - 1; i >= 0; i--) {
      const it = items[i];
      if (it.y > H - 112 && it.y < H - 34 && Math.abs(it.x - catX) < 52) {
        items.splice(i, 1);
        if (it.k.bad) {
          if (shield) { shield = false; puff(it.x, it.y, '🫧', 6); label(it.x, it.y - 20, 'щит спас!', '#2a9d8f'); SND.power(); }
          else if (it.k.chili) { dizzy = 4; combo = 0; puff(it.x, it.y, '💫', 6); label(it.x, it.y - 20, 'кружится голова!', '#d6336c'); SND.bad(); }
          else { lives--; hurt = .6; flash = 1; combo = 0; puff(it.x, it.y, '💢'); SND.bad(); if (navigator.vibrate) navigator.vibrate(120); }
        } else if (it.k.pw) {
          const m = it.k.pw; if (m === 'magnet') magnet = 6; else if (m === 'slow') slow = 5; else if (m === 'gold') gold = 8; else shield = true;
          SND.power(); puff(it.x, it.y, '✨', 8); squash = 1;
          label(it.x, it.y - 20, { magnet: 'магнит!', slow: 'замедление!', gold: 'очки x2!', shield: 'щит!' }[m], '#a24bd6');
        } else {
          combo++; const g = it.k.p * mult(); score += g; meter = Math.min(100, meter + 7); squash = 1; puff(it.x, it.y, '💖', 5); label(it.x, it.y - 20, '+' + g, '#e0227a');
          it.k.p === 3 ? SND.fish() : SND.good(); checkLevel();
        }
        hud();
        if (lives <= 0) { draw(); return end(); }
      } else if (it.y > H + 30) { if (!it.k.bad && !it.k.pw && combo) { combo = 0; hud(); } items.splice(i, 1); }
    }
    parts.forEach(p => { p.x += p.vx * dt; p.y += p.vy * dt; p.life -= dt; });
    parts = parts.filter(p => p.life > 0);
    draw(); requestAnimationFrame(loop);
  }
  function kiss() {
    kissT = 2.6; SND.kiss(); const k = $('#kiss'); k.classList.add('show'); setTimeout(() => k.classList.remove('show'), 2600);
    for (let i = 0; i < 24; i++) parts.push({ x: W / 2, y: H / 2, vx: (Math.random() - .5) * 420, vy: (Math.random() - .8) * 320, life: 1.8, ch: rnd(['💋', '💗', '✨']) });
    confetti(90);
  }
  function emoji(ch, x, y, size, rot) {
    ctx.save(); ctx.translate(x, y); if (rot) ctx.rotate(rot); ctx.font = size + 'px "Segoe UI Emoji","Apple Color Emoji",serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(ch, 0, 0); ctx.restore();
  }
  function sprite(img, x, y, s, rot, sx, sy) {
    if (!img.complete) return;
    ctx.save(); ctx.translate(x, y); if (rot) ctx.rotate(rot); ctx.scale(sx || 1, sy || 1); ctx.drawImage(img, -s / 2, -s / 2, s, s); ctx.restore();
  }
  function draw() {
    const nightOn = document.body.classList.contains('night'), pal = nightOn ? SKY[3] : SKY[Math.min(SKY.length - 1, (lvl || 1) - 1)];
    const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, pal[0]); g.addColorStop(1, pal[1]); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    const dark = nightOn || lvl >= 4;
    if (dark) { ctx.fillStyle = '#fff'; for (let i = 0; i < 32; i++) { ctx.globalAlpha = .35 + .5 * Math.abs(Math.sin(t * 1.5 + i)); ctx.fillRect((i * 97) % W, (i * 61) % (H - 60), 2, 2); } ctx.globalAlpha = 1; }
    ctx.fillStyle = dark ? 'rgba(255,255,255,.1)' : 'rgba(255,255,255,.55)';
    for (let i = 0; i < 4; i++) { const cx = ((t * 12 + i * 170) % (W + 120)) - 60; ctx.beginPath(); ctx.ellipse(cx, 130 + i * 115, 52, 18, 0, 0, 7); ctx.fill(); }
    if (slow > 0) { ctx.fillStyle = 'rgba(180,130,255,.14)'; ctx.fillRect(0, 0, W, H); }
    sprite(IMG['lesha' + (kissT > 0 ? 'love' : 'wink')], partX, 42, 82 + Math.sin(t * 8) * 2, Math.sin(t * 3) * .06, partX > catX ? -1 : 1, 1);
    items.forEach(it => {
      if (magnet > 0 && !it.k.bad && !it.k.pw) { ctx.globalAlpha = .35; emoji('✨', it.x, it.y, 56); ctx.globalAlpha = 1; }
      emoji(it.k.e, it.x, it.y, 40, it.k.bad ? Math.sin(it.rot * 5) * .3 : 0);
    });
    const vx = tgtX - catX, sh = hurt > 0 ? Math.sin(t * 60) * 6 : 0, sq = Math.sin(squash * Math.PI) * .12;
    if (magnet > 0) { ctx.strokeStyle = 'rgba(255,60,140,' + (.3 + Math.sin(t * 10) * .15) + ')'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(catX, H - 70, 68 + Math.sin(t * 8) * 4, 0, 7); ctx.stroke(); }
    if (gold > 0) { ctx.fillStyle = 'rgba(255,209,102,' + (.18 + Math.sin(t * 9) * .08) + ')'; ctx.beginPath(); ctx.arc(catX, H - 70, 64, 0, 7); ctx.fill(); }
    const mood = hurt > 0 || dizzy > 0 ? 'sad' : (kissT > 0 ? 'love' : (squash > 0 ? 'happy' : 'open'));
    sprite(IMG['remi' + mood], catX + sh, H - 68, 104, Math.max(-.25, Math.min(.25, vx * .004)) + (dizzy > 0 ? Math.sin(t * 12) * .15 : 0), 1 - sq, 1 + sq);
    if (shield) { ctx.strokeStyle = 'rgba(80,200,220,.9)'; ctx.lineWidth = 4; ctx.fillStyle = 'rgba(120,220,240,.2)'; ctx.beginPath(); ctx.arc(catX, H - 68, 62 + Math.sin(t * 6) * 2, 0, 7); ctx.fill(); ctx.stroke(); }
    if (dizzy > 0) emoji('💫', catX, H - 125, 28, Math.sin(t * 10));
    parts.forEach(p => { ctx.globalAlpha = Math.min(1, p.life * 1.4);
      if (p.text) { ctx.fillStyle = p.col; ctx.font = '800 24px Nunito,sans-serif'; ctx.textAlign = 'center'; ctx.strokeStyle = 'rgba(255,255,255,.8)'; ctx.lineWidth = 4; ctx.strokeText(p.text, p.x, p.y); ctx.fillText(p.text, p.x, p.y); } else emoji(p.ch, p.x, p.y, 24);
      ctx.globalAlpha = 1; });
    ctx.fillStyle = dark ? '#a24b8f' : '#ffb3d0'; ctx.fillRect(0, H - 14, W, 14);
    if (flash > 0) { ctx.fillStyle = 'rgba(255,120,120,' + flash * .25 + ')'; ctx.fillRect(0, 0, W, H); }
  }
  reset(); draw(); setTimeout(draw, 400);
})();

/* ---------- мемори ---------- */
(function () {
  const E = ['🐱', '🐈', '💗', '🍓', '🐟', '🧶', '🎀', '🌸'], grid = $('#memGrid');
  let first = null, lock = false, moves = 0, found = 0, best = store.get('memBest', 0);
  const showBest = () => $('#memBest').textContent = best || '—';
  function deal() {
    const d = [...E, ...E].sort(() => Math.random() - .5); first = null; lock = false; moves = 0; found = 0; $('#moves').textContent = 0; showBest();
    grid.innerHTML = d.map((e, i) => `<button class="mc" data-e="${e}" aria-label="карточка ${i + 1}"><span>🐾</span><span class="f">${e}</span></button>`).join('');
    grid.querySelectorAll('.mc').forEach(b => b.addEventListener('click', () => flip(b)));
  }
  function flip(b) {
    if (lock || b.classList.contains('open') || b.classList.contains('done')) return;
    b.classList.add('open'); SND.flip();
    if (!first) { first = b; return; }
    moves++; $('#moves').textContent = moves; const a = first; first = null;
    if (a.dataset.e === b.dataset.e) {
      a.classList.add('done'); b.classList.add('done'); SND.match(); found++;
      if (found === E.length) { if (!best || moves < best) { best = moves; store.set('memBest', best); showBest(); } confetti(); SND.kiss(); }
    } else { lock = true; setTimeout(() => { a.classList.remove('open'); b.classList.remove('open'); lock = false; }, 800); }
  }
  $('#memReset').addEventListener('click', deal); deal();
})();

/* ---------- мур-слова (угадай слово) ---------- */
(function () {
  const WORDS = ['котик', 'кошка', 'мурка', 'лапки', 'усики', 'хвост', 'мышка', 'рыбка', 'ласка', 'нежно', 'мечта', 'пушок', 'весна', 'цветы', 'песня',
    'пицца', 'тепло', 'месяц', 'мурчу', 'мягко', 'зайка', 'любит', 'любви', 'рядом', 'ночка', 'малыш', 'какао', 'булка', 'вафля', 'арбуз', 'лимон', 'шарфы',
    'сладко'.slice(0, 5), 'кофта', 'носик', 'ушки', 'пледы', 'свеча', 'танцы', 'фильм', 'закат', 'море', 'пляж', 'лето', 'зима', 'осень', 'радио', 'шутка',
    'смех', 'пирог', 'чайки', 'ромашки'].filter(w => w.length === 5);
  const ROWS = ['йцукенгшщзхъ', 'фывапролджэ', 'ячсмитьбю'];
  const grid = $('#wGrid'), keysEl = $('#wKeys'), msg = $('#wMsg');
  let word, row, cur, over, state;
  function build() {
    word = rnd(WORDS); row = 0; cur = ''; over = false; state = {}; msg.innerHTML = '&nbsp;';
    grid.innerHTML = Array.from({ length: 6 }, () => `<div class="wrow">${'<div class="wc"></div>'.repeat(5)}</div>`).join('');
    keysEl.innerHTML = ROWS.map((r, i) => `<div>${i === 2 ? '<button class="wk wide" data-k="Enter">ввод</button>' : ''}${[...r].map(c => `<button class="wk" data-k="${c}">${c}</button>`).join('')}${i === 2 ? '<button class="wk wide" data-k="Backspace">⌫</button>' : ''}</div>`).join('');
    keysEl.querySelectorAll('.wk').forEach(b => b.addEventListener('click', () => press(b.dataset.k)));
  }
  const cells = () => grid.children[row].children;
  function press(k) {
    if (over) return;
    if (k === 'Backspace') { cur = cur.slice(0, -1); }
    else if (k === 'Enter') { submit(); return; }
    else if (/^[а-яё]$/i.test(k) && cur.length < 5) { cur += k.toLowerCase().replace('ё', 'е'); SND.click(); }
    [...cells()].forEach((c, i) => { c.textContent = cur[i] || ''; });
  }
  function submit() {
    if (cur.length < 5) { msg.textContent = 'Нужно 5 букв 🐾'; return; }
    const res = Array(5).fill('n'), left = {};
    for (let i = 0; i < 5; i++) { if (cur[i] === word[i]) res[i] = 'g'; else left[word[i]] = (left[word[i]] || 0) + 1; }
    for (let i = 0; i < 5; i++) { if (res[i] !== 'g' && left[cur[i]]) { res[i] = 'y'; left[cur[i]]--; } }
    const rank = { n: 0, y: 1, g: 2 };
    [...cells()].forEach((c, i) => { setTimeout(() => { c.classList.add(res[i]); SND.flip(); }, i * 120); });
    [...cur].forEach((ch, i) => { if (!state[ch] || rank[res[i]] > rank[state[ch]]) state[ch] = res[i]; });
    setTimeout(() => keysEl.querySelectorAll('.wk').forEach(b => { const s = state[b.dataset.k]; if (s) { b.classList.remove('g', 'y', 'n'); b.classList.add(s); } }), 650);
    if (cur === word) { over = true; msg.textContent = 'Угадано! 😻 Умница!'; setTimeout(() => { confetti(); SND.kiss(); }, 650); return; }
    row++; cur = '';
    if (row >= 6) { over = true; msg.textContent = `Слово было: «${word}» 🙈 Попробуем новое?`; SND.over(); }
    else msg.innerHTML = '&nbsp;';
  }
  addEventListener('keydown', e => {
    if (e.ctrlKey || e.metaKey || e.altKey || /INPUT|TEXTAREA/.test((document.activeElement || {}).tagName || '')) return;
    const r = $('#words').getBoundingClientRect(); if (r.bottom < 0 || r.top > innerHeight) return;
    if (e.key === 'Backspace' || e.key === 'Enter' || /^[а-яёА-ЯЁ]$/.test(e.key)) { e.preventDefault(); press(e.key); }
  });
  $('#wNew').addEventListener('click', build); build();
})();

/* ---------- «мешок»: случайные штуки без повторов, пока не кончатся ---------- */
function bag(arr) {
  let pool = [], lastOne = null;
  return () => {
    if (!pool.length) { pool = arr.slice().sort(() => Math.random() - .5); if (pool[pool.length - 1] === lastOne && pool.length > 1) pool.unshift(pool.pop()); }
    lastOne = pool.pop(); return lastOne;
  };
}
const shuffle = a => a.slice().sort(() => Math.random() - .5);

/* ---------- викторины ---------- */
(function () {
  // типы пар: 0 плед · 1 хаос · 2 телепатия · 3 сладкоежки-романтики
  const PAIR = [
    ['Пятница, 23:47. Что делаем?', ['Давно спим в обнимку 😴', 'Ещё одна серия (их уже девять) 📺', 'Внезапно переставляем всю мебель 🪑', 'Ищем, чем бы сладким перекусить 🍰']],
    ['Кто первым пишет «ну что ты там?» через 3 минуты молчания?', ['Тот, кто соскучился сильнее 🥺', 'Мы одновременно, с одним и тем же смайлом 📱', 'Никто, мы чувствуем друг друга без слов 🔮', 'Тот, кто нашёл смешной мем 😂']],
    ['Выбираем еду. Как проходит?', ['«Мне всё равно» — и обиделись, если не угадали 🍕', 'Заказываем всё меню, потом едим два дня 🍣', 'Хотим одно и то же, не договариваясь 👯', 'Сразу берём десерт, а основное — потом 🧁']],
    ['Если бы мы были котиками, то…', ['Спали бы в одной коробке, хоть она мала 📦', 'Скинули бы со стола всё, включая друг друга 🥂', 'Мурчали бы синхронно на весь район 🎶', 'Носили бы друг другу подарки-«мышки» 🐭']],
    ['Идеальное свидание?', ['Плед, чай, ничего не делать 🫖', 'Приключение: потерялись, нашли кафе ☕', 'Молча сидеть рядом и всё понимать 🌙', 'Ужин со свечами и тортиком 🕯️']],
    ['Как мирится наша пара после мини-ссоры?', ['Обнимашки, и всё забыли 🤗', 'Смешной мем в личку 🖼️', 'Один взгляд — и уже всё ясно 👀', 'Мириться печеньем и запиской 🍪']],
    ['Главная суперсила дуэта?', ['Греть своим теплом 🔥', 'Придумывать глупости и хохотать 🤪', 'Находить друг друга в любой толпе 🧭', 'Устраивать друг другу сюрпризы 🎁']],
    ['Что случится, если один из нас скажет «я на минутку»?', ['Вернётся через час с печеньками 🍪', 'Через минуту: «а где ты?» 📞', 'Окажется, что оба уже в одном месте 🧿', 'Вернётся с цветочком «просто так» 🌷']],
    ['Наш общий гимн?', ['Что-то тихое и тёплое 🎻', 'Что-нибудь громкое и не вовремя 🎸', 'Мы сочиняем на ходу 🎤', 'Медляк, под который хочется обниматься 💃']],
    ['Главный враг пары?', ['Будильник по утрам ⏰', 'Незапланированный огурец 🥒', 'Когда один знает, о чём думает другой, и молчит 🙊', 'Закончившиеся сладости 🍫']],
    ['Выходной без планов. Что получится?', ['Диван, плед и «ещё пять минуточек» 🛋️', 'Мы окажемся в другом городе 🚆', 'День пройдёт в приятной тишине 🍃', 'Мы испечём что-то и съедим сырое тесто 🥣']],
    ['Какое слово лучше всего про вас?', ['Уют 🏡', 'Взрыв 💥', 'Связь 🔗', 'Нежность 🌸']],
    ['Как вы выбираете сериал?', ['Выбираем час, потом засыпаем на титрах 😴', 'Спорим, потом смотрим что-то третье 🙃', 'Одновременно говорим одно и то же название 🎬', 'Главное — чтобы там были красивые пары 💞']],
    ['Что вы возьмёте в путешествие первым делом?', ['Свой плед и подушку 🧣', 'Билет в одну сторону и рюкзак 🎒', 'Друг друга, больше ничего не надо 💑', 'Фотоаппарат и список кафешек 📸']],
    ['Как вы желаете спокойной ночи?', ['Обнимаемся и сразу засыпаем 🌙', 'Шутим ещё полчаса 😹', 'Говорим одно и то же одновременно 🪄', 'Целуем и желаем сладких снов 😘']],
    ['Что вы подарите друг другу «просто так»?', ['Тёплые носки 🧦', 'Билеты на что-нибудь странное 🎟️', 'Письмо от руки ✉️', 'Коробку любимых сладостей 🍬']]
  ];
  const RES = [
    { who: [REMI, 'love'], t: 'Пушистый плед', d: 'Вы — уют в чистом виде. Рядом с вами другие сразу хотят чаю и спать.', skill: 'Превращать любую комнату в «домик»', motto: '«Никуда не пойдём, нам и тут хорошо»', tip: 'Раз в месяц выбирайтесь куда-нибудь вместе — хоть на соседнюю улицу.' },
    { who: [LESHA, 'wink'], t: 'Хаос-котики', d: 'Рядом с вами никогда не скучно: то мем, то приключение, то «мы случайно купили надувного динозавра».', skill: 'Превращать любую ерунду в историю', motto: '«Что может пойти не так? Давай проверим»', tip: 'Записывайте самые безумные случаи — потом будете перечитывать и хохотать.' },
    { who: [REMI, 'happy'], t: 'Телепатические мурчалки', d: 'Вы понимаете друг друга без слов, взглядом и подмигиванием. Заканчиваете друг за другом фразы.', skill: 'Знать, что нужно другому, раньше самого другого', motto: '«Тссс, я знаю, о чём ты думаешь»', tip: 'Иногда всё же говорите вслух — приятно слышать то, что и так знаешь.' },
    { who: [LESHA, 'love'], t: 'Сладкие романтики', d: 'Вы — пара-десерт: сюрпризы, записки, цветочки и тортик в любое время суток.', skill: 'Делать обычный вторник днём влюблённых', motto: '«А давай устроим праздник! Просто так!»', tip: 'Не забывайте и про «обычные» дни: ваш главный сюрприз — когда вы рядом.' }
  ];
  const TR = [
    ['Сколько часов в сутки спит взрослая кошка?', ['4–6', '8', '12–16', '20–22'], 2, 'Двенадцать–шестнадцать! Работа мечты, и к ней ещё прилагается мурчание.'],
    ['Сколько пальцев на задних лапах у кошки?', ['3', '4', '5', '6'], 1, 'На передних — по 5, на задних — по 4. Всего 18 пальчиков-бусинок.'],
    ['Что значит, если кошка медленно моргает, глядя на вас?', ['Хочет спать', 'Показывает доверие и симпатию', 'Устала от вас', 'Готовится к прыжку'], 1, 'Это «кошачий поцелуй»: попробуйте моргнуть в ответ.'],
    ['Какой вкус кошки не чувствуют?', ['Соленый', 'Кислый', 'Сладкий', 'Горький'], 2, 'Сладкого они не ощущают. Печенье — только для людей!'],
    ['Хвост трубой вверх у кошки — это…', ['Угроза', 'Приветствие и радость', 'Голод', 'Страх'], 1, 'Дружеское «привет, рада тебя видеть!»'],
    ['Кошка мурчит только когда ей хорошо?', ['Да, всегда', 'Нет, иногда и чтобы успокоиться', 'Только если ест', 'Только котята'], 1, 'Мурчание бывает и когда стрессно, и когда нужно подлечиться — это кошачье «самоуспокоение».'],
    ['Какой гормон называют «гормоном объятий»?', ['Адреналин', 'Окситоцин', 'Мелатонин', 'Инсулин'], 1, 'Окситоцин. Обнимайтесь чаще — это почти лекарство.'],
    ['Сколько раз за сутки бьётся сердце человека?', ['≈ 10 тысяч', '≈ 100 тысяч', '≈ 1 миллион', '≈ 10 миллионов'], 1, 'Около ста тысяч. И каждый удар можно отдавать любимому человеку.'],
    ['Как называются кошачьи усы?', ['Вибриссы', 'Антенны', 'Ворсинки', 'Стрелки'], 0, 'Вибриссы — настоящие датчики: ловят воздух и помогают ориентироваться в темноте.'],
    ['Какая из пород — самая крупная среди домашних?', ['Сфинкс', 'Мейн-кун', 'Сиамская', 'Британская'], 1, 'Мейн-кун: бывают размером почти с небольшую собаку.'],
    ['Почему кошки обычно приземляются на лапы?', ['У них нет костей', 'Рефлекс переворота в воздухе', 'Они очень лёгкие', 'Это магия'], 1, 'Гибкий позвоночник и особый рефлекс. Но проверять дома не стоит!'],
    ['Что значит, когда кошка «месит» вас лапками?', ['Точит когти', 'Выражает комфорт и доверие', 'Злится', 'Ищет мышку'], 1, 'Так котята массируют маму, чтобы было больше молока. Для взрослой кошки — высшая нежность.'],
    ['Что из этого кошкам нельзя?', ['Варёная курица', 'Шоколад', 'Вода', 'Кошачья травка'], 1, 'Шоколад вреден: в нём теобромин. Делимся только любовью.'],
    ['Как называется страх котиков перед огурцами из интернета?', ['Огурцефобия', 'Реакция на неожиданный предмет за спиной', 'Аллергия', 'Проклятие'], 1, 'Это скорее испуг от неожиданного предмета рядом. Не пугайте кошек, это не смешно!'],
    ['Какие звуки издаёт кошка, чтобы «разговаривать» именно с человеком?', ['Мяу', 'Шипение', 'Фырканье', 'Рычание'], 0, 'Взрослые кошки почти не мяукают друг на друга — «мяу» придумано для нас.']
  ];
  const TITLES = [[0, 'Котёнок-стажёр 🍼', 'Ничего, мурчать вы умеете лучше всех.'], [3, 'Пушистый студент 📚', 'Уже неплохо — осталось подтянуть хвост.'], [5, 'Кото-профессор 🎓', 'Вы разбираетесь в кошках на отлично!'], [7, 'Академик мурчания 🏆', 'Ваши познания в кошках — легенда.']];

  const box = $('#quizBox'); let mode = 'pair', i, sc, qs, pts;
  document.querySelectorAll('.tab').forEach(b => b.addEventListener('click', () => {
    document.querySelectorAll('.tab').forEach(x => x.classList.toggle('on', x === b)); mode = b.dataset.q; start();
  }));
  function start() {
    i = 0;
    if (mode === 'pair') { sc = [0, 0, 0, 0]; qs = shuffle(PAIR).slice(0, 10).map(q => ({ q: q[0], a: shuffle(q[1].map((t, n) => ({ t, n }))) })); }
    else { pts = 0; qs = shuffle(TR).slice(0, 8).map(q => ({ q: q[0], a: shuffle(q[1].map((t, n) => ({ t, n }))), ok: q[2], f: q[3] })); }
    step();
  }
  function head() { return `<div class="progress"><i style="width:${i / qs.length * 100}%"></i></div><p class="hint">вопрос ${i + 1} из ${qs.length}</p><div class="q">${qs[i].q}</div>`; }
  function step() {
    if (i >= qs.length) return mode === 'pair' ? finishPair() : finishTrivia();
    const q = qs[i];
    box.innerHTML = head() + q.a.map(a => `<button class="opt" data-n="${a.n}">${a.t}</button>`).join('');
    box.querySelectorAll('.opt').forEach(b => b.addEventListener('click', () => answer(b)));
  }
  function answer(b) {
    SND.click();
    if (mode === 'pair') { sc[+b.dataset.n]++; i++; step(); return; }
    const q = qs[i], good = +b.dataset.n === q.ok; if (good) pts++;
    box.querySelectorAll('.opt').forEach(o => { o.disabled = true; o.style.pointerEvents = 'none'; if (+o.dataset.n === q.ok) o.classList.add('right'); });
    if (!good) b.classList.add('wrong'); good ? SND.match() : SND.bad();
    box.insertAdjacentHTML('beforeend', `<div class="fact">${good ? '✅ Верно! ' : '❌ Почти! '}${q.f}</div><button class="btn" id="nx">${i + 1 === qs.length ? 'Результат' : 'Дальше'}</button>`);
    $('#nx').addEventListener('click', () => { i++; step(); });
  }
  function finishPair() {
    const m = Math.max(...sc), k = sc.indexOf(m), r = RES[k], tot = qs.length;
    box.innerHTML = `<div class="result"><img src="${cat(r.who[0], r.who[1])}" alt=""><p class="hint">ваш результат</p><h3>${r.t}</h3><p>${r.d}</p>
      <p><b>Суперсила:</b> ${r.skill}<br><b>Девиз:</b> ${r.motto}<br><b>Совет:</b> ${r.tip}</p>
      <div class="bars">${RES.map((x, n) => `<div><i style="width:${Math.max(6, sc[n] / tot * 160)}px"></i>${x.t} · ${Math.round(sc[n] / tot * 100)}%</div>`).join('')}</div>
      <button class="btn" id="qAgain">Пройти ещё раз</button> <button class="btn ghost" id="qCopy">Скопировать результат</button></div>`;
    $('#qAgain').addEventListener('click', start);
    $('#qCopy').addEventListener('click', e => { const s = `Мы с тобой — «${r.t}» 🐱💗 ${r.d} Девиз: ${r.motto}`; (navigator.clipboard ? navigator.clipboard.writeText(s) : Promise.reject()).then(() => e.target.textContent = 'Скопировано ✓', () => e.target.textContent = 'Не вышло 🙈'); });
    confetti(); SND.kiss();
  }
  function finishTrivia() {
    const t = [...TITLES].reverse().find(x => pts >= x[0]);
    box.innerHTML = `<div class="result"><img src="${cat(pts >= 5 ? REMI : LESHA, pts >= 5 ? 'love' : 'happy')}" alt=""><p class="hint">ваш результат: ${pts} из ${qs.length}</p><h3>${t[1]}</h3><p>${t[2]}</p>
      <button class="btn" id="qAgain">Ещё раз (вопросы другие!)</button></div>`;
    $('#qAgain').addEventListener('click', start); if (pts >= 5) { confetti(); SND.kiss(); }
  }
  start();
})();

/* ---------- кото-шар ---------- */
(function () {
  const A = ['Мяу, да! 😻', 'Конечно, без вариантов 💗', 'Спроси после обнимашек 🤗', 'Лапка говорит: нет 🐾', 'Звёзды мурчат «да» ✨', 'Сначала печеньки, потом решим 🍪',
    'Даже не сомневайся 😸', 'Хмм, мяу-может быть 🤔', 'Это судьба, котик 💞', 'Сегодня — самое время 🌙', 'Лучше поцелуй и посмотрим 💋', 'Ответ: мррр 🐱',
    'Огурец сказал «нет» 🥒', 'Да, но сначала поспим 😴', 'Вселенная одобряет, а кот — тем более 🌌', 'Спроси ещё раз, я отвлёкся на бабочку 🦋', 'Сто процентов мурчания 💯',
    'Пока непонятно. Налей чаю и подумай ☕', 'Мой хвост показывает вправо: делай! ➡️', 'Только если возьмёшь меня на ручки 🥺', 'Даааа! (громко и с подпрыгиванием) 🎉',
    'Подожди до завтра, утро мудренее 🌅', 'Нет, но ты всё равно прекрасный котик 💗', 'Это слишком важный вопрос, нужна печенька 🍪', 'Точно да, я проверил по звёздам и по миске 🥣',
    'Сердце подсказывает «да» ❤️', 'Лучше не надо, но очень хочется 😼', 'Ответ спрятан в обнимашках 🤍', 'Сначала погладь, потом спрашивай 🐾', 'Да, и возьми с собой плед 🧣',
    'Вероятность — как у кошки приземлиться на лапы: высокая 🐈', 'Могу поспорить на рыбку, что да 🐟', 'Нет, это ловушка с огурцом 🥒', 'Конечно! Кто тут милый? ТЫ милый 😽',
    'Задай вопрос потише, я сплю 😴', 'Подбрось монетку. Нет, не надо — просто да 🪙', 'Всё будет мур-мур-мурчательно 🎶', 'Хм, я бы подумал… а потом сделал по-своему 😏',
    'Мои усики дрожат — это знак «да» ✨', 'Загадай ещё раз, но желание — побольше 🌠', 'Да-да-да, три раза мяу 🐱🐱🐱', 'Скорее нет, чем да, но обнимашки не помешают 🤗',
    'Без шансов? Ну ладно, чуть-чуть шансов есть 🤭', 'Ответ есть в твоём сердечке 💓', 'Подожди, я ещё домурчиваю 🔮', 'Это знак! Видишь облако в форме кота? ☁️',
    'Лучший день для этого — сегодня 📆', 'Не спеши, но и не тормози 🐌', 'Мяу-тематически: да ➕', 'Хвостом клянусь — да! 🐾', 'Спроси у своего котика, он знает 💞', 'Да, но с вишенкой сверху 🍒'];
  const next = bag(A), b = $('#oracleBtn'), o = $('#oracleOut');
  b.addEventListener('click', () => {
    b.classList.remove('shake'); void b.offsetWidth; b.classList.add('shake'); o.textContent = '…'; SND.flip();
    setTimeout(() => { o.textContent = next(); SND.match(); }, 600);
  });
})();

/* ---------- кубик свиданий (без повторов, пока все не выпадут) ---------- */
(function () {
  const D = [
    // дома
    'Подушечная крепость и кино с попкорном 🏰', 'Пикник на полу, даже если на улице дождь 🧺', 'Готовим пиццу и делаем из теста сердечки 🍕', 'Вечер настольных игр, проигравший делает массаж 🎲',
    'Рисуем друг друга и показываем только в конце 🎨', 'День без телефонов — только мы 🌿', 'Сериал-марафон и заказ любой еды 📺', 'Строим список «100 дел вдвоём» ✍️', 'Танцы на кухне под самую глупую песню 💃',
    'Тёплая ванна со свечами и пеной 🛁', 'Готовим друг другу завтрак-сюрприз 🥞', 'Спа-вечер: маски, чай и разговоры обо всём 🧖', 'Печём печенье, украшаем его как попало 🍪',
    'Читаем друг другу вслух любимую книгу 📖', 'Устраиваем домашний кинотеатр с афишей и билетиками 🎟️', 'Строим из одеял палатку и рассказываем страшилки (смешные) ⛺', 'Фонарик, одеяло и разговор до рассвета 🔦',
    'Караоке дома: поём всё, даже то, что не знаем 🎤', 'Делаем коктейли без алкоголя и придумываем им названия 🍹', 'Лепим что-нибудь из пластилина и устраиваем выставку 🏺',
    'Ужин «наоборот»: сначала десерт 🍰', 'Собираем пазл на тысячу деталей 🧩', 'Пишем друг другу письма и обмениваемся ими ✉️', 'Смотрим старые фото и вспоминаем всё-всё 📸',
    'Вечер «как в детстве»: мультики, хлопья, одеяло 🥣', 'Учимся вместе какому-нибудь танцу по видео 🕺', 'Делаем гирлянду из фото и вешаем на стену 🖼️', 'Играем в «правду или действие» (с котиками) 😼',
    'Готовим что-то из другой страны и «путешествуем» за столом 🌍', 'Устраиваем день рождения котиков без повода 🎂', 'Выбираем друг другу образ на вечер и фотографируемся 👗',
    // на улице
    'Ночная прогулка с горячим какао ☕', 'Идём наугад и заходим в первое попавшееся кафе 🧭', 'Смотрим на звёзды и придумываем созвездие «Котик» 🌌', 'Катаемся на каруселях как в детстве 🎠',
    'Закат на крыше или на холме 🌇', 'Бросаем монетку на каждом перекрёстке: орёл — налево, решка — направо 🪙', 'Фотоохота: найти и снять 10 смешных вещей в городе 📷', 'Лежим на траве и ищем облака-зверей ☁️',
    'Ходим по магазинам и примеряем самые странные шляпы 🎩', 'Кормим уточек (хлебом не надо — лучше зерном) 🦆', 'Катаемся на велосипедах или самокатах до усталости 🚲', 'Идём в зоопарк и выбираем «своё» животное 🦒',
    'Гуляем по старому району и придумываем истории о домах 🏘️', 'Берём термос и идём в парк слушать осень 🍂', 'Строим снеговика-котика (если зима) или песочного (если лето) ⛄', 'Пикник на закате с видом на город 🌆',
    'Ночное кафе: заказываем что-то незнакомое 🌃', 'Идём на рынок и выбираем самые яркие овощи для ужина 🥕', 'Едем на последнюю остановку маршрутки и смотрим, что там 🚌', 'Ходим по улице и здороваемся со всеми кошками 😺',
    // еда
    'Ужин из блюд на одну букву 🔤', 'Дегустируем сладости и ставим оценки 🍫', 'Готовим суши (или пытаемся) 🍣', 'Устраиваем «ресторан»: меню, официант, чаевые поцелуями 🍽️', 'Печём пиццу-сердце и едим вместе одну половинку 💗',
    'Едим мороженое на улице в любую погоду 🍦', 'Пробуем фрукты, которых раньше не ели 🥭', 'Готовим вместе завтрак на троих — себе, любимому и коту (в мыслях) 🍳', 'Фондю: сыр или шоколад, как выберем 🧀',
    // творчество и приключения
    'Снимаем смешное видео-историю про наших котиков 🎬', 'Придумываем свою песню и записываем на телефон 🎶', 'Рисуем карту наших любимых мест 🗺️', 'Сочиняем сказку про двух котиков по строчке по очереди 📚',
    'Делаем «капсулу времени»: письма друг другу на год вперёд ⏳', 'Придумываем свой тайный язык жестов 🤫', 'Выбираем город на карте закрытыми глазами — и планируем туда поездку ✈️', 'Устраиваем квест друг для друга по квартире 🔎',
    'Делаем открытки и отправляем себе по почте 💌', 'Учим друг друга своему любимому слову или фразе на другом языке 🗣️', 'Шьём (или клеим) друг другу маленькие талисманы 🧿', 'Строим дом из карточек, пока не рухнет 🃏',
    'Заводим «список побед» дня и хвалим друг друга 🏅', 'Загадываем желания на следующий год и прячем в баночку 🫙', 'Устраиваем «день наоборот»: говорим комплименты каждые полчаса 💬', 'Делаем «котопарад» с шарфиками и хвостиками 🐾',
    // уют и нежность
    'Массаж ног под любимый плейлист 🦶', 'Час нежностей без экранов 🤍', 'Читаем по очереди комплименты из этого сайта вслух 💞', 'Засыпаем под фильм, который никто не досмотрит 🛌', 'Вечер «слушаем друг друга»: по 5 минут без перебиваний 👂',
    'Обнимаемся ровно 20 секунд (там начинается магия окситоцина) 🤗', 'Танцуем медленный танец в носках на кухне 🧦', 'Ужин при свечах без повода 🕯️', 'Готовим друг другу тёплое питьё по-особому ☕', 'Дарим друг другу по маленькому «ничему», но с бантиком 🎀',
    'Гадаем на печеньях с предсказаниями (написанными самими) 🥠', 'Завтрак в постели с кучей подушек 🥐', 'Придумываем друг другу прозвища на неделю 🏷️', 'Слушаем дождь с чаем и пледом 🌧️'
  ];
  const out = $('#diceOut'), next = bag(D);
  $('#diceBtn').addEventListener('click', () => {
    out.classList.remove('rolling'); void out.offsetWidth; out.classList.add('rolling'); out.textContent = '🎲'; SND.flip();
    setTimeout(() => { out.textContent = next(); SND.match(); }, 450);
  });
})();

/* ---------- причины ---------- */
(function () {
  const R = [
    'С тобой даже вторник — праздник 🎉', 'Ты греешь лучше любого пледа 🧣', 'Ты смешишь меня в самые неподходящие моменты 😂', 'С тобой можно молчать и всё равно хорошо 🌙', 'Рядом с тобой я самая мурчащая 🐱',
    'Твои обнимашки лечат всё, кроме огурцов 🥒', 'Ты — мой любимый «давай ещё одну серию» 📺', 'Ты делаешь обычные дни особенными ✨', 'Потому что ты — это ты 💗', 'Ты умеешь поддержать, когда я пушу хвост 🐈',
    'С тобой не страшно быть глупенькой 🎀', 'Ты — мой уютный дом 🏡', 'Мне хочется делиться с тобой последней печенькой 🍪', 'Рядом с тобой я становлюсь лучше (и мягче) 🌸',
    'С тобой любая дорога — приключение 🛤️', 'У тебя самый тёплый голос на свете 🎧', 'Ты замечаешь мелочи, которые другие пропускают 🔍', 'Ты умеешь слушать так, что хочется рассказать всё 👂',
    'С тобой я смеюсь так, что болит живот 🤣', 'Ты — мой самый любимый человек для глупых шуток 🎭', 'Твоё «я рядом» работает лучше любого лекарства 💊', 'Ты придаёшь мне храбрости, когда хочется спрятаться под плед 🦸',
    'Ты — моё «безопасное место» 🛟', 'Ты пахнешь домом и чем-то очень родным 🏠', 'С тобой я чувствую себя настоящей 🪞', 'Ты не боишься моих странностей, а любишь их 🌈',
    'Ты умеешь утешить без лишних слов 🤍', 'С тобой даже дождь — романтика ☔', 'Ты делаешь мой мир ярче, чем любые розовые очки 🕶️', 'Ты удивляешь меня даже после стольких дней 🎁',
    'С тобой можно быть и серьёзной, и дурашливой 🎪', 'Ты веришь в меня, даже когда я сама сомневаюсь 🌟', 'Ты — мой лучший друг и моя любовь одновременно 💞', 'Рядом с тобой время летит и останавливается одновременно ⏳',
    'Твоя улыбка — мой любимый вид 🌅', 'Ты умеешь превращать «плохой день» в «ну ладно, терпимо, у нас же есть чай» 🫖', 'С тобой мы устраиваем маленькие чудеса из ничего 🪄', 'Ты вдохновляешь меня на глупости (и они лучшие) 🎈',
    'Ты — единственный, с кем я готова делить последний кусочек пиццы 🍕', 'Твои сообщения — мой любимый звук уведомления 📱', 'Рядом с тобой я не боюсь быть собой 🦋', 'Ты помнишь мои любимые мелочи 📝',
    'С тобой хочется строить планы на «потом» 🗓️', 'Ты терпеливо относишься к моему «ещё пять минуточек» ⏰', 'У нас с тобой свой тайный язык 🤫', 'Ты — мой любимый человек для «давай просто так сходим» 🚶',
    'Твои объятия — мой любимый способ перезагрузки 🔌', 'Ты умеешь быть рядом именно тогда, когда нужно 🕰️', 'Ты — доказательство, что чудеса бывают 🌠', 'С тобой я учусь любить по-новому 📚',
    'Мне нравится, как мы вместе молчим в метро 🚇', 'С тобой даже ожидание — приятное 🛋️', 'Ты согреваешь меня даже на расстоянии ☁️', 'Ты заставляешь сердце делать «тук-тук» без причины 🥰',
    'Ты — моя самая красивая случайность 🍀', 'Мне нравится быть твоей мурчалкой 🐾', 'Ты делаешь мои дни слаще любых конфет 🍭', 'Ты — моё любимое «навсегда» ♾️',
    'С тобой я могу не быть сильной — и это нормально 🕊️', 'Ты — мой любимый «а давай»! 🚀', 'Рядом с тобой обычная кухня — лучший ресторан 🍝', 'Ты слушаешь мои бесконечные истории с тем же интересом 🎙️',
    'С тобой не надо ничего доказывать 🧘', 'Ты — человек, с которым хочется встретить рассвет 🌄', 'Ты — моё «мне повезло» каждый день 🍀', 'Ты умеешь делать паузу, когда мне нужно подышать 🌬️',
    'С тобой я верю, что всё получится 🌻', 'Ты — мой личный кусочек счастья, который не надо делить 🧁', 'Ты — самое лучшее «просто так» в моей жизни 💝'
  ];
  const out = $('#reasonOut'), next = bag(R);
  $('#reasonBtn').addEventListener('click', e => {
    out.style.animation = 'none'; void out.offsetWidth; out.style.animation = ''; out.textContent = next(); pop(e.clientX, e.clientY, '💞'); SND.good();
  });
})();

/* ---------- фото + авто-подписи ---------- */
// Подпись придумывается прямо в браузере по самому снимку: свет, цвета, лица (если браузер умеет), сезон по дате файла.
// Ничего никуда не отправляется.
const CAPS = {
  dark: ['Ночные котики 🌙', 'Вечер на двоих при свете звёзд ✨', 'Тихие посиделки в темноте 🕯️', 'Когда мир засыпает, а мы мурчим 🌃'],
  bright: ['Солнечные мурчалки ☀️', 'Яркий кадр — яркий день 🌞', 'Мы светимся сильнее лампочки 💡', 'Свет, радость и мы 🌤️'],
  pink: ['Всё в розовом, как мы 💗', 'Розовое настроение 🌸', 'Мур-мур в розовых тонах 🎀', 'Сладкий кадр, как зефир 🍬'],
  green: ['Котики на природе 🌿', 'Травка, воздух и обнимашки 🍃', 'Прогулка, после которой хочется ещё 🌳', 'Зелёный свет для любви 💚'],
  blue: ['Небо, море и мы 🌊', 'Голубой кадр, тёплые чувства 🩵', 'Простор и двое котиков 🌤️', 'Как будто мы в облаках ☁️'],
  warm: ['Тёплые тона, тёплые мы 🧡', 'Уютный кадр, как плед 🧣', 'Золотой час для двоих 🌇', 'Вкусно, тепло и любимо 🍂'],
  gray: ['Кадр с настроением 🖤', 'Спокойно и красиво 🤍', 'Мы даже в чёрно-белом хороши 🎞️', 'Тихая нежность 🕊️'],
  faces2: ['Двое — это уже команда 🐾', 'Вот они, наши мордочки 😻', 'Мы — сила (и мурчание) 💪', 'Два котика в одном кадре 🐱🐱'],
  faces1: ['Красота в кадре 😻', 'Тот самый котик 💗', 'Эта улыбка — моя слабость 🥰'],
  generic: ['Мой любимый кадр 💞', 'Вот так мы выглядим, когда счастливы 😽', 'Момент, который хочется оставить ✨', 'Мур, как же здесь хорошо 🐾', 'Мы тут очень милые 🎀'],
  season: { 0: 'Зимние обнимашки ❄️', 1: 'Весенние нежности 🌷', 2: 'Летнее мурчание 🌞', 3: 'Осенний плед 🍁' }
};
const MONTHS = ['январь', 'февраль', 'март', 'апрель', 'май', 'июнь', 'июль', 'август', 'сентябрь', 'октябрь', 'ноябрь', 'декабрь'];
async function makeCaption(canvas, when) {
  const s = document.createElement('canvas'); s.width = s.height = 24; const x = s.getContext('2d'); x.drawImage(canvas, 0, 0, 24, 24);
  const d = x.getImageData(0, 0, 24, 24).data; let R = 0, G = 0, B = 0, n = 0, topB = 0, topN = 0;
  for (let i = 0; i < d.length; i += 4) { R += d[i]; G += d[i + 1]; B += d[i + 2]; n++; if (i < d.length / 3) { topB += d[i + 2] - d[i]; topN++; } }
  R /= n; G /= n; B /= n; const L = (R + G + B) / 3 / 255, mx = Math.max(R, G, B), mn = Math.min(R, G, B), sat = mx ? (mx - mn) / mx : 0;
  let faces = 0;
  try { if ('FaceDetector' in window) faces = (await new FaceDetector({ fastMode: true }).detect(canvas)).length; } catch (e) {}
  let pool;
  if (faces >= 2) pool = CAPS.faces2; else if (faces === 1 && Math.random() < .6) pool = CAPS.faces1;
  else if (L < .25) pool = CAPS.dark; else if (L > .78 && sat < .25) pool = CAPS.bright;
  else if (sat < .12) pool = CAPS.gray;
  else if (R > G + 14 && R > B && B > G - 10 && sat > .12) pool = CAPS.pink;
  else if (G > R + 8 && G > B + 8) pool = CAPS.green;
  else if (B > R + 14 && topB / topN > 8) pool = CAPS.blue;
  else if (R > B + 25) pool = CAPS.warm;
  else pool = Math.random() < .5 ? CAPS.bright : CAPS.generic;
  let cap = rnd(pool);
  if (when && Math.random() < .5) { const m = new Date(when).getMonth(); cap = CAPS.season[[0, 0, 1, 1, 1, 2, 2, 2, 3, 3, 3, 0][m]]; }
  if (when && Math.random() < .5) cap += ' · ' + MONTHS[new Date(when).getMonth()];
  return cap;
}
(function () {
  const wrap = $('#polaroids'); let ph = store.get('photos', []);
  const save = () => { if (!store.set('photos', ph)) { alert('Память браузера заполнена — удали пару фото 🙈'); return false; } return true; };
  function render() {
    const fixed = (window.PHOTOS || []).map((p, i) => `<figure class="pol" style="transform:rotate(${((i * 5) % 9) - 4}deg);margin:0"><img src="${esc(p.src)}" alt=""><div class="cap" style="cursor:default">${esc(p.cap)}</div></figure>`).join('');
    wrap.innerHTML = fixed + (ph.length ? ph.map((p, i) => `<figure class="pol" style="transform:rotate(${((i * 7) % 9) - 4}deg);margin:0"><button class="x" data-d="${i}" aria-label="Удалить">×</button><button class="re" data-r="${i}" aria-label="Новая подпись" title="Придумать другую подпись">🎲</button><img src="${p.src}" alt=""><div class="cap" data-c="${i}">${esc(p.cap || 'подпись…')}</div></figure>`).join('') : (fixed ? '' : '<p class="empty">Пока пусто — добавь первое фото 💗</p>'));
    wrap.querySelectorAll('.x').forEach(b => b.addEventListener('click', () => { if (confirm('Убрать это фото?')) { ph.splice(+b.dataset.d, 1); save(); render(); } }));
    wrap.querySelectorAll('.cap[data-c]').forEach(c => c.addEventListener('click', () => { const v = prompt('Подпись', ph[+c.dataset.c].cap || ''); if (v !== null) { ph[+c.dataset.c].cap = v.slice(0, 60); save(); render(); } }));
    wrap.querySelectorAll('.re').forEach(b => b.addEventListener('click', async () => {
      const p = ph[+b.dataset.r], im = new Image(); im.onload = async () => {
        const c = document.createElement('canvas'); c.width = im.width; c.height = im.height; c.getContext('2d').drawImage(im, 0, 0);
        p.cap = await makeCaption(c, p.when); save(); render(); SND.match();
      }; im.src = p.src;
    }));
  }
  $('#photoInput').addEventListener('change', e => {
    [...e.target.files].slice(0, 12 - ph.length).forEach(f => {
      const r = new FileReader();
      r.onload = () => { const im = new Image(); im.onload = async () => {
        const s = Math.min(1, 520 / Math.max(im.width, im.height)), c = document.createElement('canvas'); c.width = im.width * s; c.height = im.height * s;
        c.getContext('2d').drawImage(im, 0, 0, c.width, c.height);
        const cap = await makeCaption(c, f.lastModified);
        ph.push({ src: c.toDataURL('image/jpeg', .72), cap, when: f.lastModified }); if (save()) { render(); SND.match(); } else ph.pop(); }; im.src = r.result; };
      r.readAsDataURL(f);
    });
    e.target.value = '';
  });
  render();
})();

/* ---------- мечты ---------- */
(function () {
  let W = store.get('wishes', [{ t: 'Поехать вместе на море 🌊' }, { t: 'Построить подушечную крепость 🏰' }, { t: 'Съесть вместе огромную пиццу 🍕' }, { t: 'Научиться готовить что-то необычное 🍜' }]);
  const ul = $('#wishList');
  function render() {
    ul.innerHTML = W.map((w, i) => `<li class="${w.d ? 'done' : ''}" data-i="${i}"><span>${w.d ? '✅' : '⭕'} ${esc(w.t)}</span><button data-x="${i}" aria-label="Удалить">🗑️</button></li>`).join('');
    ul.querySelectorAll('li').forEach(li => li.addEventListener('click', e => {
      const i = +li.dataset.i;
      if (e.target.dataset.x !== undefined) W.splice(i, 1); else { W[i].d = !W[i].d; if (W[i].d) { confetti(50); SND.match(); } }
      store.set('wishes', W); render();
    }));
  }
  $('#wishForm').addEventListener('submit', e => { e.preventDefault(); const v = $('#wishInput').value.trim(); if (!v) return; W.push({ t: v }); store.set('wishes', W); $('#wishInput').value = ''; render(); SND.good(); });
  render();
})();

/* ---------- купоны ---------- */
(function () {
  const C = [['🤗', 'Обнимашки без срока годности'], ['🎬', 'Ты выбираешь кино (и без нытья)'], ['☕', 'Чай или кофе в постель'], ['💆', 'Массаж лапок 10 минут'],
    ['😽', 'Поцелуй в носик по требованию'], ['🍰', 'Право на последний кусочек'], ['🛌', 'Лишние 10 минут поспать'], ['🎁', 'Один маленький сюрприз'],
    ['🍕', 'Заказ любой еды без обсуждений'], ['🎵', 'Твоя песня играет весь вечер'], ['🧦', 'Тёплые носки, поданные лично'], ['📞', 'Звонок «просто послушать твой голос»'],
    ['🙊', 'Один день без споров'], ['🥞', 'Завтрак, приготовленный любимым человеком'], ['💌', 'Письмо от руки'], ['🌹', 'Цветочек «просто так»'],
    ['🚿', 'Пропуск на мытьё посуды (один раз)'], ['🛁', 'Тёплая ванна и никаких забот'], ['🎮', 'Выбор игры на вечер'], ['💬', '10 комплиментов подряд'],
    ['🚶', 'Прогулка там, где захочешь'], ['🛋️', 'Вечер на диване — без дел и планов'], ['🐱', 'Одно «мурчание» на ушко'], ['👑', 'День, когда ты — главный котик']];
  const grid = $('#couponGrid'); let used = store.get('used', []);
  function render() {
    grid.innerHTML = C.map((c, i) => `<button class="coupon ${used.includes(i) ? 'used' : ''}" data-i="${i}"><span class="e">${c[0]}</span>${c[1]}</button>`).join('');
    grid.querySelectorAll('.coupon').forEach(b => b.addEventListener('click', e => {
      const i = +b.dataset.i; if (used.includes(i)) return;
      used.push(i); store.set('used', used); pop(e.clientX, e.clientY, '🎟️'); SND.match(); render();
    }));
  }
  $('#couponReset').addEventListener('click', () => { used = []; store.set('used', used); render(); });
  render();
})();
