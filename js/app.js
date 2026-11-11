/* SLATE playground. Vanilla JS, no build step. */
(function () {
  const O = window.SLATE_OPTIONS;
  const CFG = window.SLATE_CONFIG || {};
  const DEMO = !CFG.SUPABASE_URL || !CFG.SUPABASE_ANON_KEY;
  // Preview mode is for a local copy only. On a real address with no sign-in set up, nothing gated is handed out:
  // the reveal, Reverse SLATE and posting all say sign-in opens shortly instead of faking it.
  const LOCAL = location.protocol === 'file:' || /^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname);
  const LOCKED = DEMO && !LOCAL;
  const soon = () => toast('SIGN-IN OPENS SHORTLY · YOUR SHEET STAYS AS IT IS');
  // What sits under the blur is never the readable draft on a real address, so removing the blur shows nothing.
  const veiled = (t) => LOCAL ? t : t.replace(/[A-Za-z0-9]/g, (c, i) => 'etaoinshrdlu'[(c.charCodeAt(0) + i) % 12]);
  const $ = (s, el) => (el || document).querySelector(s);
  const $$ = (s, el) => Array.from((el || document).querySelectorAll(s));
  const REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ---------- state ----------
  const state = {
    s: null, act: null, l: null, env: null, a: null, lens: null, t: null, em: null, e: null,
    own: { s: '', l: '', a: '', t: '', e: '' },
    adv: {}, model: 'seedream', source: {}, active: 'S',
    revealed: '', revealedSig: '', busy: false
  };
  const LETTERS = ['S', 'L', 'A', 'T', 'E'];
  const GROUPS = { S: [['s', 'Subject'], ['act', 'Action']], L: [['l', 'Light'], ['env', 'World']], A: [['a', 'Angle'], ['lens', 'Lens']], T: [['t', 'Hour']], E: [['em', 'Feeling'], ['e', 'Genre']] };
  const LABELS = { S: 'subject + action', L: 'lighting + environment', A: 'angle + lensing', T: 'time of day', E: 'emotion + genre' };
  const SHORT = { S: 'subject', L: 'light', A: 'camera', T: 'time', E: 'emotion' };
  const LISTS = { s: O.subjects, act: O.actions, l: O.lights, env: O.environments, a: O.angles, lens: O.lenses, t: O.times, em: O.emotions, e: O.genres };
  const OWN_PH = { S: 'or write the subject yourself, any language', L: 'or describe the light yourself', A: 'or describe the camera yourself', T: 'or write the hour yourself', E: 'or name the feeling yourself' };
  const NEXT_NOTE = { L: 'Good. Now the light.', A: 'Now, where does the camera stand?', T: 'What time is it?', E: 'Last one. How should it feel?' };
  const letterOf = (k) => LETTERS.find(L => GROUPS[L].some(g => g[0] === k));

  // ---------- helpers ----------
  function letterStatus(L) {
    const own = state.own[L.toLowerCase()];
    if (own && own.trim()) return 'user';
    const srcs = GROUPS[L].map(g => state.source[g[0]]).filter(Boolean);
    if (srcs.includes('user')) return 'user';
    if (srcs.includes('auto')) return 'auto';
    if (srcs.includes('random')) return 'random';
    return null;
  }
  const pickName = (k) => state[k] == null ? null : LISTS[k][state[k]].name;
  const cap = (s) => s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
  const signature = () => JSON.stringify([state.s, state.act, state.l, state.env, state.a, state.lens, state.t, state.em, state.e, state.own, state.adv, state.model]);
  const isLight = () => document.documentElement.dataset.theme === 'light';
  function toast(msg) { let t = $('.toast'); if (!t) { t = document.createElement('div'); t.className = 'toast'; document.body.appendChild(t); } t.textContent = msg; t.classList.add('show'); clearTimeout(t._h); t._h = setTimeout(() => t.classList.remove('show'), 2400); }
  function note(msg) { const n = $('#note'); n.style.opacity = 0; setTimeout(() => { n.textContent = msg; n.style.opacity = 1; }, 140); }
  function letterValue(L) {
    const own = state.own[L.toLowerCase()];
    if (own && own.trim()) return own.trim();
    return GROUPS[L].map(g => pickName(g[0])).filter(Boolean).join(' · ');
  }

  // ---------- slop score: how much of this frame is still the model's own default ----------
  const SLOP_WORDS = ['cinematic', '8k', '4k', '16k', 'masterpiece', 'hyperrealistic', 'hyper realistic', 'ultra realistic', 'ultra detailed', 'highly detailed', 'insanely detailed', 'stunning', 'epic', 'beautiful', 'breathtaking', 'gorgeous', 'award winning', 'trending on artstation', 'artstation', 'octane render', 'unreal engine', 'photorealistic', 'hdr', 'best quality', 'high quality', 'dramatic lighting', 'professional photography', 'sharp focus', 'vibrant colors', 'vibrant colours', 'perfect lighting', 'amazing', 'majestic'];
  const MODEL_PICK = { l: O.defaults.l, a: O.defaults.a, lens: O.defaults.lens, t: O.defaults.t, e: O.defaults.e };
  const WEIGHT = { s: 10, act: 10, l: 10, env: 10, a: 10, lens: 10, t: 20, em: 10, e: 10 };
  const SLOP_RX = SLOP_WORDS.map(w => [w, new RegExp('(^|[^a-z0-9])' + w.replace(/ /g, '[\\s-]*') + '(?=[^a-z0-9]|$)', 'i')]);
  function slopWordsIn(txt) { return SLOP_RX.filter(([, rx]) => rx.test(txt)).map(([w]) => w); }
  function slopScore(st = state) {
    let dir = 0; const left = [], words = [];
    LETTERS.forEach(L => {
      const own = (st.own[L.toLowerCase()] || '').trim(), ks = GROUPS[L];
      const total = ks.reduce((a, [k]) => a + WEIGHT[k], 0);
      if (own) {
        const bad = slopWordsIn(own);
        if (!bad.length) { dir += total; return; }
        words.push(...bad);
        let rest = own; SLOP_RX.forEach(([, rx]) => { rest = rest.replace(new RegExp(rx.source, 'gi'), ' '); });
        const real = rest.split(/[\s,.;:!]+/).filter(w => w.length > 2).length;
        dir += real >= 2 ? total * 0.5 : 0;
        left.push(SHORT[L]); return;
      }
      ks.forEach(([k, label]) => {
        const v = st[k], src = st.source[k]; let c = 0;
        if (v != null && src === 'user') c = (k in MODEL_PICK && MODEL_PICK[k] === v) ? 0.25 : 1;
        else if (v != null && src === 'auto') c = 0.4;
        dir += WEIGHT[k] * c; if (c < 1) left.push(label.toLowerCase());
      });
    });
    dir += Math.min(10, Object.values(st.adv).filter(Boolean).length * 2.5);
    // A lenient read: the raw share of the frame still left to the model is eased down, so a sheet that is mostly
    // directed reads as mostly directed. Once all five letters carry the director's own call, it always sits under 10.
    const raw = Math.max(0, Math.min(100, 100 - dir));
    const filled = LETTERS.filter(L => { const own = (st.own[L.toLowerCase()] || '').trim(); return own ? true : GROUPS[L].some(([k]) => st[k] != null && st.source[k] === 'user'); }).length;
    const score = filled === LETTERS.length ? Math.min(9, Math.round(raw * 0.18)) : Math.round(100 * Math.pow(raw / 100, 1.3) * (1 - 0.12 * filled));
    return { score, raw: Math.round(raw), filled, left, words: [...new Set(words)] };
  }
  let slopShown = 100, slopRaf = null;
  function renderSlop() {
    const el = $('#slop'); if (!el) return;
    const r = slopScore(), from = slopShown, to = r.score;
    $('#slopBar').style.transform = `scaleX(${to / 100})`;
    el.classList.toggle('low', to <= 20); el.classList.toggle('zero', to === 0); el.classList.toggle('warn', r.words.length > 0);
    if (to === 0 && from !== 0 && !REDUCED) { el.classList.remove('pop'); void el.offsetWidth; el.classList.add('pop'); }
    const lt = $('#slopLeft');
    if (r.words.length) lt.textContent = 'slop words: ' + r.words.slice(0, 3).join(', ');
    else if (to === 0) lt.textContent = 'every call is yours';
    else if (to === 100) lt.textContent = 'all of it is the model’s';
    else lt.textContent = 'model’s: ' + r.left.slice(0, 2).join(' · ') + (r.left.length > 2 ? ` +${r.left.length - 2}` : '');
    el.setAttribute('aria-label', `Slop score ${to} percent`);
    cancelAnimationFrame(slopRaf);
    if (REDUCED || from === to) { $('#slopN').textContent = to; slopShown = to; return; }
    const t0 = performance.now(), D = 520;
    const tick = (now) => { const p = Math.min(1, (now - t0) / D), v = Math.round(from + (to - from) * ease(p)); $('#slopN').textContent = v; slopShown = v; if (p < 1) slopRaf = requestAnimationFrame(tick); };
    slopRaf = requestAnimationFrame(tick);
  }

  // ---------- light colours per theme (fixes light mode) ----------
  function toneColor(tone) {
    const dark = { white: '#F6EFDF', warm: '#F2C14E', neon: '#F472B6', dim: '#B4A6E6' };
    const light = { white: '#C98A12', warm: '#E07B1E', neon: '#DB2777', dim: '#6B5FAE' };
    return (isLight() ? light : dark)[tone] || dark.white;
  }

  // ---------- tween engine: the drawing glides instead of snapping ----------
  let cur = null, anim = null;
  const hex = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
  const toHex = (a) => '#' + a.map(v => Math.round(v).toString(16).padStart(2, '0')).join('');
  function lerp(a, b, t) { if (typeof a === 'number') return a + (b - a) * t; if (typeof a === 'string' && a[0] === '#') { const x = hex(a), y = hex(b); return toHex(x.map((v, i) => v + (y[i] - v) * t)); } return b; }
  const ease = (t) => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  function animateTo(target) {
    if (!cur || REDUCED) { cur = Object.assign({}, target); paint(cur); return; }
    const from = Object.assign({}, cur); const t0 = performance.now(); const D = 620;
    cancelAnimationFrame(anim);
    const step = (now) => { const p = Math.min(1, (now - t0) / D), k = ease(p); for (const key in target) cur[key] = lerp(from[key] ?? target[key], target[key], k); paint(cur); if (p < 1) anim = requestAnimationFrame(step); };
    anim = requestAnimationFrame(step);
  }

  // ---------- the stage ----------
  function stageTarget() {
    const L = O.lights[state.l ?? 6], A = O.angles[state.a ?? 0], LE = O.lenses[state.lens ?? 2], T = O.times[state.t ?? 2], E = O.genres[state.e ?? 5];
    const kind = state.s != null ? O.subjects[state.s].kind : 'person';
    const lightC = toneColor(L.tone);
    return {
      lx: L.x, ly: L.y, lr: L.r, shade: state.l == null ? 0 : L.shade, lightC, rigOp: state.l == null ? 0.28 : 1,
      cx: A.cx, cy: A.cy, tilt: A.tilt, otsOp: A.ots ? 1 : 0, camOp: (state.a == null && state.lens == null) ? 0.4 : 1,
      fw: LE.fw, fh: LE.fh,
      skyTop: T.top, skyBot: T.bot, skyOp: state.t == null ? 0.08 : (isLight() ? 0.2 : 0.42), sunX: T.sx, sunY: T.sy, sunR: T.sr, sunC: T.sc, sunOp: state.t == null ? 0.25 : 1,
      tintC: E.c, tintOp: state.e == null ? 0 : E.o * (isLight() ? 0.6 : 1),
      heroOp: ['person', 'two', 'crowd', 'vendor', 'child'].includes(kind) ? 1 : 0,
      heroTx: kind === 'two' ? -50 : (kind === 'vendor' ? -40 : 0), heroS: kind === 'child' ? 0.72 : 1,
      secondOp: kind === 'two' ? 1 : 0, crowdOp: kind === 'crowd' ? 1 : 0, cartOp: kind === 'vendor' ? 1 : 0,
      productOp: kind === 'product' ? 1 : 0, vehicleOp: kind === 'vehicle' ? 1 : 0, animalOp: kind === 'animal' ? 1 : 0,
      figOp: (state.s == null && !state.own.s.trim()) ? 0.5 : 1,
      _labels: { lamp: L.lab, cam: A.lab + ' · ' + LE.name.split(' ')[0].toUpperCase(), dim: LE.name.split(' ')[0].toUpperCase() + ' · ' + LE.fov, sun: T.lab, act: state.act != null ? O.actions[state.act].name : '' }
    };
  }
  const set = (id, attrs) => { const el = document.getElementById(id); if (!el) return; for (const k in attrs) el.setAttribute(k, attrs[k]); };
  function paint(v) {
    // light rig
    const tx = 400, ty = 268; const dx = tx - v.lx, dy = ty - v.ly; const len = Math.hypot(dx, dy) || 1; const ux = dx / len, uy = dy / len; const px = -uy, py = ux;
    const ang = Math.atan2(dy, dx) * 180 / Math.PI;
    set('lamp', { transform: `translate(${v.lx} ${v.ly}) rotate(${ang})` });
    set('glow', { r: v.lr * 0.75 });
    ['glow1', 'glow2', 'cone1', 'cone2'].forEach(id => set(id, { 'stop-color': v.lightC }));
    set('bulb', { fill: v.lightC });
    const near = 8, far = 28 + v.lr * 0.55; const sx = v.lx + ux * 14, sy = v.ly + uy * 14;
    set('cone', { points: `${sx + px * near},${sy + py * near} ${tx + px * far},${ty + py * far} ${tx - px * far},${ty - py * far} ${sx - px * near},${sy - py * near}` });
    set('coneG', { x1: sx, y1: sy, x2: tx, y2: ty });
    const overhead = Math.abs(v.lx - 400) < 70;
    if (overhead) { set('stand', { x1: v.lx, y1: 0, x2: v.lx, y2: v.ly - 12 }); set('feet', { d: 'M0 0' }); }
    else { set('stand', { x1: v.lx, y1: v.ly + 12, x2: v.lx, y2: 396 }); set('feet', { d: `M${v.lx - 16} 404 L${v.lx} 396 L${v.lx + 16} 404` }); }
    set('rig', { opacity: v.rigOp });
    if (overhead) set('lampLab', { x: v.lx - 30, y: v.ly + 4, fill: v.lightC, 'text-anchor': 'end' }); else set('lampLab', { x: v.lx, y: Math.max(16, v.ly - v.lr * 0.75 - 8), fill: v.lightC, 'text-anchor': 'middle' });
    // shading on the far side of the figure
    const w = v.shade * 40; const fromLeft = v.lx <= 400;
    set('shade', { x: fromLeft ? 432 - w : 368, width: w });
    // subject
    const s = v.heroS; set('hero', { transform: `translate(${400 * (1 - s) + v.heroTx} ${372 * (1 - s)}) scale(${s})`, opacity: v.heroOp * v.figOp });
    set('floorShadow', { cx: 400 + v.heroTx, rx: 60 * s, opacity: Math.max(v.heroOp, v.productOp, v.animalOp) });
    set('second', { opacity: v.secondOp * v.figOp }); set('crowd', { opacity: v.crowdOp * v.figOp }); set('cart', { opacity: v.cartOp * v.figOp });
    set('product', { opacity: v.productOp }); set('vehicle', { opacity: v.vehicleOp }); set('animal', { opacity: v.animalOp });
    // time
    set('skyTop', { 'stop-color': v.skyTop }); set('skyBot', { 'stop-color': v.skyBot }); set('sky', { opacity: v.skyOp });
    set('sun', { cx: v.sunX, cy: v.sunY, r: v.sunR, fill: v.sunC }); set('sunHit', { cx: v.sunX, cy: v.sunY }); set('sunPulse', { cx: v.sunX, cy: v.sunY }); set('sunG', { opacity: v.sunOp });
    set('sunLab', { x: v.sunX, y: v.sunY - v.sunR - 10 });
    // frame, thirds, dimension
    const hw = v.fw / 2, hh = v.fh / 2;
    set('frameG', { transform: `translate(400 280) rotate(${v.tilt})` });
    set('frame', { x: -hw, y: -hh, width: v.fw, height: v.fh });
    set('t1', { x1: -hw / 3, y1: -hh, x2: -hw / 3, y2: hh }); set('t2', { x1: hw / 3, y1: -hh, x2: hw / 3, y2: hh });
    set('t3', { x1: -hw, y1: -hh / 3, x2: hw, y2: -hh / 3 }); set('t4', { x1: -hw, y1: hh / 3, x2: hw, y2: hh / 3 });
    set('dim', { x1: -hw, y1: -hh - 12, x2: hw, y2: -hh - 12 }); set('dimL', { x1: -hw, y1: -hh - 18, x2: -hw, y2: -hh - 6 }); set('dimR', { x1: hw, y1: -hh - 18, x2: hw, y2: -hh - 6 });
    set('dimLab', { x: 0, y: -hh - 20 });
    // camera + frustum
    const cang = Math.atan2(280 - v.cy, 400 - v.cx) * 180 / Math.PI;
    set('camG', { transform: `translate(${v.cx} ${v.cy})`, opacity: v.camOp }); set('camBody', { transform: `rotate(${cang + v.tilt * 0.6})` });
    const lensX = v.cx + Math.cos(cang * Math.PI / 180) * 18, lensY = v.cy + Math.sin(cang * Math.PI / 180) * 18;
    const r = v.tilt * Math.PI / 180, cs = Math.cos(r), sn = Math.sin(r);
    [[-hw, -hh], [hw, -hh], [hw, hh], [-hw, hh]].forEach(([x, y], i) => set('fr' + (i + 1), { x1: lensX, y1: lensY, x2: 400 + x * cs - y * sn, y2: 280 + x * sn + y * cs }));
    set('frust', { opacity: v.camOp });
    const labBelow = v.cy < 200; set('camLab', { x: Math.max(12, v.cx - 30), y: labBelow ? v.cy + 36 : v.cy - 26, opacity: v.camOp });
    set('ots', { opacity: v.otsOp });
    // genre tint
    set('tint', { fill: v.tintC, opacity: v.tintOp });
  }
  function drawStage() {
    const t = stageTarget(); const labels = t._labels; delete t._labels;
    $('#lampLab').textContent = labels.lamp; $('#camLab').textContent = labels.cam; $('#dimLab').textContent = labels.dim; $('#sunLab').textContent = labels.sun; $('#actLab').textContent = labels.act;
    $('#sunLab').style.display = state.t == null ? 'none' : '';
    const n = LETTERS.filter(l => letterStatus(l) === 'user').length;
    $('#caption').textContent = n === 0 ? 'NOTHING SPECIFIED YET' : `${n} / 5 SPECIFIED`;
    const halo = $('#halo'); if (halo) halo.style.setProperty('--halo', state.t != null ? t.skyBot : (state.l != null ? t.lightC : (isLight() ? '#D8CCFF' : '#2A2366')));
    animateTo(t);
  }

  // ---------- strip + drawer ----------
  function buildStrip() {
    const strip = $('#strip');
    [...LETTERS, '+'].forEach(L => {
      const b = document.createElement('button'); b.type = 'button'; b.className = 'cell' + (L === '+' ? ' notes' : ''); b.setAttribute('role', 'tab'); b.dataset.letter = L;
      b.innerHTML = L === '+' ? '<span class="top-row"><span class="L">+</span><span class="lbl">notes</span></span><span class="val empty" data-v>optional extras</span>'
        : `<span class="top-row"><span class="L">${L}</span><span class="lbl">${SHORT[L]}</span><span class="tag" data-tag hidden>auto</span></span><span class="val empty" data-v>choose</span>`;
      b.addEventListener('click', () => openLetter(L));
      strip.appendChild(b);
    });
  }
  function buildPanels() {
    const host = $('#panels');
    LETTERS.forEach(L => {
      const p = document.createElement('div'); p.className = 'panel-l'; p.dataset.panel = L; p.setAttribute('role', 'tabpanel');
      GROUPS[L].forEach(([key, label]) => {
        const g = document.createElement('div'); g.className = 'grp';
        g.innerHTML = `<span class="eyebrow">${label}</span>`;
        const chips = document.createElement('div'); chips.className = 'chips'; chips.dataset.key = key;
        LISTS[key].forEach((o, i) => { const c = document.createElement('button'); c.type = 'button'; c.className = 'chip'; c.textContent = o.name; c.title = o.hint; c.addEventListener('click', () => choose(key, i)); chips.appendChild(c); });
        g.appendChild(chips); p.appendChild(g);
      });
      const own = document.createElement('label'); own.className = 'own-row';
      own.innerHTML = `<span class="eyebrow">Own words</span><input type="text" data-own="${L.toLowerCase()}" placeholder="${OWN_PH[L]}">`;
      p.appendChild(own); host.appendChild(p);
    });
    const adv = document.createElement('div'); adv.className = 'panel-l'; adv.dataset.panel = '+';
    adv.innerHTML = '<p class="small">Optional. Leave any of these and the model decides.</p>';
    const grid = document.createElement('div'); grid.className = 'adv-grid';
    Object.entries(O.advanced).forEach(([k, arr]) => { const lab = document.createElement('label'); lab.textContent = k; const sel = document.createElement('select'); sel.innerHTML = '<option value="">leave to the model</option>' + arr.map(v => `<option>${v}</option>`).join(''); sel.addEventListener('change', () => { state.adv[k] = sel.value; render(); }); lab.appendChild(sel); grid.appendChild(lab); });
    adv.appendChild(grid); host.appendChild(adv);
    $$('[data-own]').forEach(inp => inp.addEventListener('input', () => {
      const L = inp.dataset.own.toUpperCase(); state.own[inp.dataset.own] = inp.value;
      if (inp.value.trim()) GROUPS[L].forEach(([k]) => { state[k] = null; delete state.source[k]; });
      render();
      clearTimeout(inp._sw); inp._sw = setTimeout(() => { const w = slopWordsIn(inp.value); if (w.length) { note(`“${w[0]}” tells the model nothing. Say what the light, lens or hour actually is.`); inp._warned = true; } else if (inp._warned && inp.value.trim()) { note('Better. That is an instruction the model can follow.'); inp._warned = false; } }, 900);
    }));
  }
  function moveIndicator() {
    const cell = $(`.cell[aria-selected="true"]`), ind = $('#stripInd'); if (!cell || !ind) return;
    ind.style.width = cell.offsetWidth + 'px'; ind.style.transform = `translateX(${cell.offsetLeft}px)`;
  }
  function openLetter(L) {
    const drawer = $('.drawer'), h0 = drawer.offsetHeight, changed = state.active !== L;
    state.active = L;
    $$('.cell').forEach(c => c.setAttribute('aria-selected', c.dataset.letter === L ? 'true' : 'false'));
    $$('.panel-l').forEach(p => p.classList.toggle('on', p.dataset.panel === L));
    moveIndicator();
    if (!changed || REDUCED || !h0) return;
    drawer.style.height = 'auto'; const h1 = drawer.offsetHeight;
    drawer.style.height = h0 + 'px'; void drawer.offsetHeight; drawer.style.height = h1 + 'px';
    const done = () => { drawer.style.height = ''; drawer.removeEventListener('transitionend', done); };
    drawer.addEventListener('transitionend', done); setTimeout(done, 600);
  }
  let advanceTimer = null;
  function choose(key, idx) {
    state[key] = idx; state.source[key] = 'user';
    const L = letterOf(key); state.own[L.toLowerCase()] = ''; const inp = $(`[data-own="${L.toLowerCase()}"]`); if (inp) inp.value = '';
    const hint = LISTS[key][idx].hint; note(key in MODEL_PICK && MODEL_PICK[key] === idx ? 'Fair pick. It is also what the model does on its own.' : cap(hint) + '.');
    render();
    clearTimeout(advanceTimer);
    const complete = GROUPS[L].every(([k]) => state.source[k] === 'user');
    if (complete) advanceTimer = setTimeout(() => {
      const next = LETTERS.slice(LETTERS.indexOf(L) + 1).concat(LETTERS).find(x => letterStatus(x) !== 'user');
      if (next) { openLetter(next); note(NEXT_NOTE[next] || 'One more.'); }
      else note('All five. That is a directed frame. Reveal it.');
    }, 700);
  }

  // ---------- prompt draft (shown blurred; used in preview mode) ----------
  function describe() {
    const d = {};
    d.subject = state.own.s.trim() || [pickName('s'), pickName('act')].filter(Boolean).join(', ');
    d.lighting = state.own.l.trim() || [pickName('l') && `${pickName('l')} lighting (${O.lights[state.l].hint})`, pickName('env')].filter(Boolean).join('; ');
    d.camera = state.own.a.trim() || [pickName('a') && `${pickName('a').toLowerCase()} (${O.angles[state.a].hint})`, pickName('lens') && `on a ${pickName('lens')} lens (${O.lenses[state.lens].hint})`].filter(Boolean).join(', ');
    d.time = state.own.t.trim() || (pickName('t') && `${pickName('t')} (${O.times[state.t].hint})`) || '';
    d.emotion = state.own.e.trim() || [pickName('em') && pickName('em').toLowerCase(), pickName('e') && `in the register of ${pickName('e').toLowerCase()} (${O.genres[state.e].hint})`].filter(Boolean).join(', ');
    d.advanced = Object.entries(state.adv).filter(([, v]) => v).map(([k, v]) => `${k}: ${v}`).join('; ');
    d.unspecified = LETTERS.filter(l => !letterStatus(l)).map(l => LABELS[l]);
    return d;
  }
  function localDraft() {
    const d = describe(); const p = [];
    p.push(d.subject ? `${cap(d.subject)}.` : 'A subject.');
    if (d.lighting) p.push(`${cap(d.lighting)}.`);
    if (d.camera) p.push(`Shot from ${d.camera}.`);
    if (d.time) p.push(`${cap(d.time)}.`);
    if (d.emotion) p.push(`The emotion is ${d.emotion}.`);
    if (d.advanced) p.push(`${cap(d.advanced)}.`);
    p.push('Natural skin texture, no text, no watermark.');
    return p.join(' ');
  }

  // ---------- render ----------
  function render() {
    $$('.chips').forEach(ch => { const k = ch.dataset.key; $$('.chip', ch).forEach((b, i) => { b.classList.toggle('on', state[k] === i && state.source[k] === 'user'); b.classList.toggle('auto', state[k] === i && state.source[k] !== 'user'); }); });
    LETTERS.forEach((L, i) => {
      const st = letterStatus(L), cell = $(`.cell[data-letter="${L}"]`), v = $('[data-v]', cell), val = letterValue(L);
      v.textContent = val || 'choose'; v.classList.toggle('empty', !val);
      cell.classList.toggle('done', st === 'user'); $('[data-tag]', cell).hidden = !(st === 'auto' || st === 'random'); $('[data-tag]', cell).textContent = st === 'random' ? 'model' : 'auto';
      $$('#ticks i')[i].className = st === 'user' ? 'on' : (st === 'auto' ? 'auto' : '');
    });
    const advN = Object.values(state.adv).filter(Boolean).length;
    const nv = $('.cell[data-letter="+"] [data-v]'); nv.textContent = advN ? `${advN} added` : 'optional extras'; nv.classList.toggle('empty', !advN);
    const n = LETTERS.filter(l => letterStatus(l) === 'user').length, na = LETTERS.filter(l => letterStatus(l) === 'auto').length;
    $('#count').textContent = `${n} / 5` + (na ? ` · ${na} auto` : '');
    drawStage();
    const sig = signature(), pt = $('#prompttext'), veil = $('#veil'), acts = $('#promptActions');
    if (state.revealed && state.revealedSig === sig) { pt.textContent = state.revealed; pt.classList.remove('blurred'); veil.classList.add('off'); acts.hidden = false; }
    else { pt.textContent = veiled(localDraft()); pt.classList.add('blurred'); veil.classList.remove('off'); acts.hidden = true; }
    $$('#modelTabs .tab').forEach(b => b.classList.toggle('on', b.dataset.id === state.model));
    renderDirector();
    renderSlop();
    $('#authSub').textContent = `${n} of 5 specified · written for ${O.models.find(m => m.id === state.model).name}`;
  }

  // ---------- random / auto ----------
  const setSilent = (k, i, src) => { state[k] = i; state.source[k] = src; };
  function doRandom() {
    const D = O.defaults;
    setSilent('l', D.l, 'random'); setSilent('a', D.a, 'random'); setSilent('lens', D.lens, 'random'); setSilent('t', D.t, 'random'); setSilent('e', D.e, 'random');
    ['env', 'em'].forEach(k => { state[k] = null; delete state.source[k]; });
    if (state.source.s !== 'user' && !state.own.s.trim()) setSilent('s', 0, 'random');
    if (state.source.act !== 'user' && !state.own.s.trim()) setSilent('act', 1, 'random');
    ['l', 'a', 't', 'e'].forEach(k => { state.own[k] = ''; }); $$('[data-own]').forEach(i => { if (i.dataset.own !== 's') i.value = ''; });
    note('That is what the model picks on its own. Flat light, eye level, 50mm, noon, no genre. Slop.');
    render();
  }
  function doAuto() {
    const g = state.e != null ? state.e : 0, C = O.coherent[g];
    const free = (k) => state[k] == null && !(state.own[letterOf(k).toLowerCase()] || '').trim();
    [['l', C.l], ['env', C.env], ['a', C.a], ['lens', C.lens], ['t', C.t], ['em', C.em]].forEach(([k, v]) => { if (free(k) || state.source[k] === 'random') setSilent(k, v, 'auto'); });
    if (free('e') || state.source.e === 'random') setSilent('e', g, 'auto');
    if (free('s')) setSilent('s', 0, 'auto'); if (free('act')) setSilent('act', 0, 'auto');
    note('Filled only your blanks, matched to what you chose. Change any of them.');
    render();
  }

  // ---------- reveal / auth ----------
  let supa = null;
  if (!DEMO && window.supabase) supa = window.supabase.createClient(CFG.SUPABASE_URL, CFG.SUPABASE_ANON_KEY);
  async function currentSession() { if (!supa) return null; const { data } = await supa.auth.getSession(); return data.session; }
  async function reveal() {
    if (state.busy) return;
    if (!LETTERS.some(l => letterStatus(l))) { note('Decide at least one thing first, or press Auto-complete.'); return; }
    if (LOCKED) { soon(); return; }
    if (DEMO) { openAuth(); return; }
    const session = await currentSession();
    if (!session) { openAuth(); return; }
    await generate(session);
  }
  // ---------- the wand writes the Keyframe F while Claude writes the prompt ----------
  // Oval first, a pen lift, then the long stroke from the top ball to the bottom ball. Loops until the prompt lands,
  // then finishes the letter quickly, throws a few sparks and hands over to the text.
  const conjure = (() => {
    const box = $('#conjure');
    if (!box) return { start() {}, stop: () => Promise.resolve() };
    const NS = 'http://www.w3.org/2000/svg';
    const oval = $('#cjOval', box), stem = $('#cjStem', box), ink = $('#cjInk', box), wand = $('#cjWand', box), sheens = $$('.cj-sheen', box), sheenG = $('#cjSheenG', box), sparkG = $('#cjSparks', box);
    const T = { oval: 1.05, lift: 0.26, stem: 0.95, hold: 0.85, fade: 0.38 };
    const tLift = T.oval, tStem = tLift + T.lift, tHold = tStem + T.stem, tFade = tHold + T.hold, CYCLE = tFade + T.fade;
    const REST = { x: 300, y: 470 };
    const ease = (u) => u < 0.5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2;
    const ease2 = (u) => 0.5 - Math.cos(Math.PI * u) / 2;
    const lerp = (a, b, u) => a + (b - a) * u;
    let Lo = 0, Ls = 0, raf = 0, running = false, t = 0, last = 0, speed = 1, finishing = null, sparkClock = 0;
    const sparks = [];
    function measure() { if (!Lo) { Lo = oval.getTotalLength(); Ls = stem.getTotalLength(); } }
    function dash(el, L, p) { el.style.strokeDasharray = `${L} ${L + 20}`; el.style.strokeDashoffset = `${L * (1 - p)}`; el.style.visibility = p > 0.001 ? 'visible' : 'hidden'; }
    function placeWand(x, y, a) { wand.setAttribute('transform', `translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${a.toFixed(1)})`); }
    function spark(x, y, burst) {
      let s = sparks.find(k => !k.live);
      if (!s) { if (sparks.length > 40) return; const el = document.createElementNS(NS, 'path'); el.setAttribute('d', 'M0 -10 2 -2 10 0 2 2 0 10 -2 2 -10 0 -2 -2Z'); sparkG.appendChild(el); s = { el }; sparks.push(s); }
      const ang = Math.random() * Math.PI * 2, v = burst ? 90 + Math.random() * 160 : 18 + Math.random() * 40;
      Object.assign(s, { live: true, x: x + (Math.random() - 0.5) * 18, y: y + (Math.random() - 0.5) * 18, vx: Math.cos(ang) * v, vy: Math.sin(ang) * v + (burst ? 0 : 35), age: 0, life: 0.55 + Math.random() * 0.5, size: 0.5 + Math.random() * 0.9, rot: Math.random() * 90 });
      s.el.setAttribute('fill', ['#fff', '#DDD6FE', '#C4B5FD', '#F2C14E'][Math.random() * 4 | 0]);
    }
    function tickSparks(dt) {
      for (const s of sparks) {
        if (!s.live) continue;
        s.age += dt; if (s.age >= s.life) { s.live = false; s.el.setAttribute('opacity', 0); continue; }
        s.vx *= 0.96; s.vy = s.vy * 0.96 + 30 * dt; s.x += s.vx * dt; s.y += s.vy * dt;
        const k = 1 - s.age / s.life;
        s.el.setAttribute('transform', `translate(${s.x.toFixed(1)} ${s.y.toFixed(1)}) rotate(${(s.rot + s.age * 160).toFixed(0)}) scale(${(s.size * (0.3 + 0.7 * k)).toFixed(2)})`);
        s.el.setAttribute('opacity', (k * k).toFixed(2));
      }
    }
    // draw the whole state for time u inside one cycle
    function frame(u, dt) {
      let po = 0, ps = 0, x, y, writing = false, inkA = 1, sh = -1;
      const wob = Math.sin(t * 3.4) * 6;
      if (u < tLift) { po = ease2(u / T.oval); const p = oval.getPointAtLength(Lo * po); x = p.x; y = p.y; writing = true; }
      else if (u < tStem) {
        po = 1; const k = ease((u - tLift) / T.lift), a = oval.getPointAtLength(Lo), b = stem.getPointAtLength(0);
        x = lerp(a.x, b.x, k); y = lerp(a.y, b.y, k) - Math.sin(Math.PI * k) * 46;
      } else if (u < tHold) { po = 1; ps = ease2((u - tStem) / T.stem); const p = stem.getPointAtLength(Ls * ps); x = p.x; y = p.y; writing = true; }
      else if (u < tFade) {
        po = ps = 1; const k = ease(Math.min(1, (u - tHold) / (T.hold * 0.6))), a = stem.getPointAtLength(Ls);
        x = lerp(a.x, REST.x, k); y = lerp(a.y, REST.y, k); sh = (u - tHold) / T.hold;
      } else {
        po = ps = 1; inkA = 1 - ease((u - tFade) / T.fade);
        const k = ease((u - tFade) / T.fade), b = oval.getPointAtLength(0);
        x = lerp(REST.x, b.x, k); y = lerp(REST.y, b.y, k) - Math.sin(Math.PI * k) * 60;
      }
      dash(oval, Lo, po); dash(stem, Ls, ps);
      ink.setAttribute('opacity', inkA.toFixed(3));
      const shA = sh >= 0 ? (Math.sin(Math.PI * Math.min(1, sh)) * 0.55).toFixed(2) : 0;
      sheens.forEach(el => el.setAttribute('opacity', shA));
      if (sh >= 0) sheenG.setAttribute('gradientTransform', `translate(${(-40 + sh * 600).toFixed(0)} 0) rotate(-18)`);
      placeWand(x, y, -52 + wob + (writing ? 0 : -8));
      if (writing && !REDUCED) { sparkClock += dt; while (sparkClock > 0.045) { sparkClock -= 0.045; spark(x, y, false); } }
    }
    function loop(now) {
      const dt = Math.min(0.05, (now - last) / 1000 || 0.016); last = now;
      const before = t % CYCLE;
      t += dt * speed;
      let u = t % CYCLE;
      if (finishing) {
        // fast-forward to the end of the stem, then stop on the finished letter
        if (u < before || before >= tHold || u >= tHold) {
          u = tHold; t = Math.floor(t / CYCLE) * CYCLE + tHold;
          frame(u, dt); const p = stem.getPointAtLength(Ls); for (let i = 0; i < 16; i++) spark(p.x, p.y, true);
          const done = finishing; finishing = null; running = false;
          // let the burst play out, then hand over
          const tail = (n) => { const d2 = Math.min(0.05, (n - last) / 1000 || 0.016); last = n; tickSparks(d2); if (sparks.some(s => s.live)) requestAnimationFrame(tail); };
          requestAnimationFrame(tail); setTimeout(done, 260); return;
        }
      }
      frame(u, dt); tickSparks(dt);
      if (running) raf = requestAnimationFrame(loop);
    }
    return {
      start() {
        measure(); cancelAnimationFrame(raf); t = 0; speed = 1; finishing = null; sparkClock = 0;
        sparks.forEach(s => { s.live = false; s.el.setAttribute('opacity', 0); });
        if (REDUCED) { dash(oval, Lo, 1); dash(stem, Ls, 1); ink.setAttribute('opacity', 1); placeWand(REST.x, REST.y, -52); return; }
        running = true; last = performance.now(); raf = requestAnimationFrame(loop);
      },
      // ok = the prompt arrived: finish the F, then resolve. Not ok: stop at once.
      stop(ok) {
        if (!running || !ok || REDUCED) { running = false; cancelAnimationFrame(raf); return Promise.resolve(); }
        speed = 2.6; return new Promise(res => { finishing = res; });
      }
    };
  })();

  async function generate(session) {
    const pb = $('#promptbox');
    state.busy = true; $('#revealBtn').classList.add('busy'); pb.classList.add('conjuring'); conjure.start();
    $('#veilNote').textContent = 'Writing it for ' + O.models.find(m => m.id === state.model).name + '…';
    let ok = false;
    try {
      const res = await fetch(CFG.FUNCTION_URL, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + session.access_token }, body: JSON.stringify({ model: state.model, decisions: describe() }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not write the prompt');
      await conjure.stop(true);
      state.revealed = data.prompt; state.revealedSig = signature(); $('#quota').textContent = typeof data.left === 'number' ? `${data.left}% of today’s allowance left` : ''; render(); ok = true;
    } catch (err) { conjure.stop(false); note(err.message); }
    finally {
      state.busy = false; $('#revealBtn').classList.remove('busy');
      // keep the finished F on screen while the veil fades, then reset it for next time
      setTimeout(() => { pb.classList.remove('conjuring'); $('#veilNote').textContent = 'Free. Sign in once. A daily allowance, no card.'; }, ok ? 700 : 0);
    }
  }
  let authReason = 'reveal', AUTH_TXT = null;
  const openAuth = (reason) => {
    authReason = reason || 'reveal';
    if (!AUTH_TXT) AUTH_TXT = { t: $('#authTitle').textContent, s: $('#authModal .small').textContent };
    if (authReason === 'reverse') { $('#authSub').textContent = 'Reverse SLATE'; $('#authTitle').textContent = 'Read any frame.'; $('#authModal .small').textContent = 'Sign in free once, then drop the frame in again. Nothing to pay.'; }
    else if (authReason === 'upload') { $('#authSub').textContent = 'Daily Frame'; $('#authTitle').textContent = 'Post it to the wall.'; $('#authModal .small').textContent = 'Sign in free once. Your name never shows on the wall. Signing in only keeps spam and bots out.'; }
    else { $('#authTitle').textContent = AUTH_TXT.t; $('#authModal .small').textContent = AUTH_TXT.s; }
    $('#authModal').hidden = false; $('#googleBtn').focus();
  };
  const closeAuth = () => { $('#authModal').hidden = true; };
  async function googleSignIn() {
    if (LOCKED) { closeAuth(); soon(); return; }
    if (DEMO) {
      closeAuth();
      state.revealed = localDraft() + '\n\n(Preview. On the live site Claude rewrites this for ' + O.models.find(m => m.id === state.model).name + ' using its own prompting guide.)';
      state.revealedSig = signature(); $('#quota').textContent = 'preview · no limit'; render(); return;
    }
    try { if (authReason === 'upload') localStorage.setItem('slate_after', 'daily'); else if (authReason === 'reverse') localStorage.setItem('slate_after', 'reverse'); else localStorage.setItem('slate_pending', JSON.stringify(exportState())); } catch (e) {}
    await supa.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: window.location.origin + window.location.pathname } });
  }
  function applyBrief(text, k, i) {
    state.own.s = text; const si = $('[data-own="s"]'); if (si) si.value = text; ['s', 'act'].forEach(x => { state[x] = null; delete state.source[x]; });
    if (k && LISTS[k] && LISTS[k][i]) { const L = letterOf(k).toLowerCase(); state.own[L] = ''; const inp = $(`[data-own="${L}"]`); if (inp) inp.value = ''; setSilent(k, i, 'user'); openLetter(letterOf(k) === 'S' ? 'L' : (LETTERS.find(x => x !== letterOf(k) && !letterStatus(x) && x !== 'S') || 'L')); }
    render(); note(k ? `Today's rule is set: ${LISTS[k][i].name}. Everything else is yours.` : 'The brief is on the sheet. Everything else is yours.');
    $('#play').scrollIntoView({ behavior: REDUCED ? 'auto' : 'smooth' });
  }
  function exportState() { const { s, act, l, env, a, lens, t, em, e, own, adv, model, source } = state; return { s, act, l, env, a, lens, t, em, e, own, adv, model, source }; }
  function importState(o) { Object.assign(state, o); $$('[data-own]').forEach(i => i.value = state.own[i.dataset.own] || ''); Object.entries(state.adv).forEach(([k, v]) => { const sel = $$('.adv-grid label').find(l => l.firstChild.textContent === k); if (sel) $('select', sel).value = v; }); }
  // Tell the backend once per browser that this person signed in, so the sign-up is recorded even if they never reveal.
  async function hello(session) {
    try {
      if (localStorage.getItem('slate_hello') === session.user.id) return;
      const r = await fetch(CFG.FUNCTION_URL, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + session.access_token }, body: JSON.stringify({ hello: true }) });
      if (r.ok) localStorage.setItem('slate_hello', session.user.id);
    } catch (e) {}
  }
  async function resumeAfterLogin() {
    if (DEMO) return;
    const session = await currentSession();
    if (session) { $('#authBtn').textContent = 'Sign out'; $('#authBtn').onclick = async () => { await supa.auth.signOut(); location.reload(); }; }
    let pending = null; try { pending = localStorage.getItem('slate_pending'); } catch (e) {}
    if (session && pending) { try { localStorage.removeItem('slate_pending'); importState(JSON.parse(pending)); render(); $('#play').scrollIntoView(); await generate(session); } catch (e) {} }
    else if (session) hello(session);
  }

  // ---------- share card ----------
  const STYLE_PROPS = ['fill', 'stroke', 'stroke-width', 'stroke-opacity', 'fill-opacity', 'stroke-dasharray', 'font-family', 'font-size', 'letter-spacing', 'stroke-linejoin', 'paint-order'];
  function inlineSvg() {
    const orig = $('#stage'), clone = orig.cloneNode(true);
    const a = orig.querySelectorAll('*'), b = clone.querySelectorAll('*');
    a.forEach((el, i) => { if (el.id === 'actLab' || (el.classList && (el.classList.contains('pulse') || el.classList.contains('hit')))) b[i].setAttribute('display', 'none'); const cs = getComputedStyle(el); STYLE_PROPS.forEach(p => { const v = cs.getPropertyValue(p); if (v && v !== 'none' || p === 'fill') b[i].setAttribute(p, v); }); b[i].removeAttribute('class'); });
    clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg'); clone.setAttribute('width', '800'); clone.setAttribute('height', '450');
    return new XMLSerializer().serializeToString(clone);
  }
  function downloadCard() {
    const c = $('#cardCanvas'), x = c.getContext('2d'), W = 1080, H = 1350;
    const cs = getComputedStyle(document.documentElement), v = (n) => cs.getPropertyValue(n).trim();
    const bg = v('--bg'), text = v('--text'), muted = v('--muted'), acc = v('--accent'), ink = v('--ink');
    const img = new Image();
    img.onload = () => {
      x.fillStyle = bg; x.fillRect(0, 0, W, H);
      x.drawImage(img, 60, 60, W - 120, (W - 120) * 450 / 800);
      x.strokeStyle = ink; x.lineWidth = 3; x.strokeRect(60, 60, W - 120, (W - 120) * 450 / 800);
      const y0 = 60 + (W - 120) * 450 / 800 + 70;
      x.fillStyle = muted; x.font = '500 22px "IBM Plex Mono", monospace'; x.fillText('SLATE · KEYFRAME', 60, y0);
      const n = LETTERS.filter(l => letterStatus(l) === 'user').length; x.textAlign = 'right'; x.fillText(`${n} / 5 SPECIFIED`, W - 60, y0); x.textAlign = 'left';
      x.fillStyle = text; x.font = '700 84px "Archivo Narrow", "Arial Narrow", sans-serif'; x.fillText('I DIRECTED THIS.', 60, y0 + 100);
      x.font = '400 24px "IBM Plex Mono", monospace';
      LETTERS.forEach((L, i) => { x.fillStyle = acc; x.fillText(L, 60, y0 + 170 + i * 48); x.fillStyle = text; x.fillText((letterValue(L) || 'left to the model').slice(0, 58), 110, y0 + 170 + i * 48); });
      x.fillStyle = acc; x.font = '500 24px "IBM Plex Mono", monospace'; x.fillText('DIRECT YOURS · SLATE.KEYFRAME24.AI', 60, H - 64);
      const a = document.createElement('a'); a.download = 'slate-card.png'; a.href = c.toDataURL('image/png'); a.click();
    };
    img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(inlineSvg());
  }

  // ---------- direct manipulation: grab the lamp, the camera, the sun ----------
  function svgPoint(evt) { const svg = $('#stage'); const pt = svg.createSVGPoint(); pt.x = evt.clientX; pt.y = evt.clientY; return pt.matrixTransform(svg.getScreenCTM().inverse()); }
  function nearest(list, x, y, fx, fy, allow) { let best = -1, bd = Infinity; list.forEach((o, i) => { if (allow && !allow(o, i)) return; const d = Math.hypot(o[fx] - x, o[fy] - y); if (d < bd) { bd = d; best = i; } }); return best; }
  let drag = null;
  function hideHint() { $('#stageHint').classList.add('gone'); $('#stage').classList.add('used'); }
  function startDrag(kind, e) {
    if (!cur) return;
    e.preventDefault(); cancelAnimationFrame(anim);
    drag = { kind, id: e.pointerId, el: e.currentTarget, pick: null };
    try { e.currentTarget.setPointerCapture(e.pointerId); } catch (err) {}
    document.body.classList.add('dragging'); hideHint();
    if (kind === 'lamp') { cur.rigOp = 1; openLetter('L'); }
    if (kind === 'cam') { cur.camOp = 1; openLetter('A'); }
    if (kind === 'sun') { cur.sunOp = 1; $('#sunLab').style.display = ''; openLetter('T'); }
  }
  function moveDrag(e) {
    if (!drag || e.pointerId !== drag.id) return;
    const p = svgPoint(e); const x = Math.max(20, Math.min(780, p.x));
    if (drag.kind === 'lamp') {
      const y = Math.max(24, Math.min(380, p.y)); cur.lx = x; cur.ly = y; cur.shade = Math.min(1, Math.abs(x - 400) / 290) * (y > 300 ? 1 : 0.85);
      const i = nearest(O.lights, x, y, 'x', 'y'); drag.pick = i; cur.lightC = lerp(cur.lightC, toneColor(O.lights[i].tone), 0.35); cur.lr = lerp(cur.lr, O.lights[i].r, 0.3);
      $('#lampLab').textContent = '→ ' + O.lights[i].name.toUpperCase();
    } else if (drag.kind === 'cam') {
      const y = Math.max(24, Math.min(436, p.y)); cur.cx = x; cur.cy = y; cur.tilt = lerp(cur.tilt, 0, 0.3);
      const i = nearest(O.angles, x, y, 'cx', 'cy', (o) => o.tilt === 0); drag.pick = i;
      $('#camLab').textContent = '→ ' + O.angles[i].name.toUpperCase();
    } else {
      const y = Math.max(30, Math.min(252, p.y)); cur.sunX = x; cur.sunY = y;
      const i = nearest(O.times, x, y, 'sx', 'sy'); drag.pick = i; const T = O.times[i];
      cur.skyTop = lerp(cur.skyTop, T.top, 0.3); cur.skyBot = lerp(cur.skyBot, T.bot, 0.3); cur.sunC = lerp(cur.sunC, T.sc, 0.3); cur.sunR = lerp(cur.sunR, T.sr, 0.3); cur.skyOp = lerp(cur.skyOp, isLight() ? 0.2 : 0.42, 0.3);
      $('#sunLab').textContent = '→ ' + T.name.toUpperCase();
    }
    paint(cur);
  }
  function endDrag(e) {
    if (!drag || e.pointerId !== drag.id) return;
    const d = drag; drag = null; document.body.classList.remove('dragging');
    if (d.pick == null) { drawStage(); return; }
    choose(d.kind === 'lamp' ? 'l' : d.kind === 'cam' ? 'a' : 't', d.pick);
  }
  function stepLens(dir) {
    const i = Math.max(0, Math.min(O.lenses.length - 1, (state.lens ?? 2) + dir));
    if (i === state.lens) return; openLetter('A'); hideHint(); choose('lens', i);
  }
  function bindStage() {
    [['lampHit', 'lamp'], ['camHit', 'cam'], ['sunHit', 'sun']].forEach(([id, kind]) => {
      const el = document.getElementById(id);
      el.addEventListener('pointerdown', (e) => startDrag(kind, e));
      el.addEventListener('pointermove', moveDrag); el.addEventListener('pointerup', endDrag); el.addEventListener('pointercancel', endDrag);
    });
    let lastWheel = 0;
    $('#stage').addEventListener('wheel', (e) => { if (!e.ctrlKey) return; e.preventDefault(); const now = Date.now(); if (now - lastWheel < 220) return; lastWheel = now; stepLens(e.deltaY < 0 ? 1 : -1); }, { passive: false });
    $('#lensMinus').addEventListener('click', () => stepLens(-1));
    $('#lensPlus').addEventListener('click', () => stepLens(1));
    if (window.matchMedia('(pointer: coarse)').matches) $('#stageHint').textContent = 'drag the lamp, the camera or the sun';
  }

  // ---------- director type: what your choices say about you ----------
  const TIME_WORD = ['Dawn', 'Golden Hour', 'Noon', 'Overcast', 'Blue Hour', 'Midnight'];
  const LENS_WORD = ['Wide-Angle', 'Street', 'Honest', 'Portrait', 'Telephoto', 'Scope'];
  const GENRE_NOUN = ['Fatalist', 'Romantic', 'Paranoid', 'Futurist', 'Drifter', 'Witness', 'Haunter', 'Perfectionist'];
  const LIGHT_NOUN = ['Painter', 'Glamourist', 'Dualist', 'Silhouettist', 'Poet', 'Shadow Hunter', 'Optimist', 'Night Crawler', 'Interrogator'];
  const ANGLE_LINE = ['Meets people where they stand.', 'Shoots people the way heroes deserve.', 'Makes the world look bigger than us.', 'Sees the pattern before the people.', 'Never trusts the floor.', 'Always keeps someone between us and the truth.'];
  function directorType() {
    const n = LETTERS.filter(l => letterStatus(l) === 'user').length;
    if (n < 3) return null;
    const adj = state.t != null ? TIME_WORD[state.t] : (state.lens != null ? LENS_WORD[state.lens] : 'Undecided');
    const noun = state.e != null ? GENRE_NOUN[state.e] : (state.l != null ? LIGHT_NOUN[state.l] : 'Director');
    const line = state.a != null ? ANGLE_LINE[state.a] : 'Still deciding where the camera stands.';
    return { adj, noun, name: `The ${adj} ${noun}`, line, n };
  }
  let lastType = '', scrambleRaf = null;
  function scramble(el, d) {
    const final = `THE ${d.adj} ${d.noun}`.toUpperCase(), split = 4 + d.adj.length + 1, chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ#/·';
    cancelAnimationFrame(scrambleRaf);
    if (REDUCED) { el.innerHTML = `The ${d.adj} <em>${d.noun}</em>`; return; }
    const t0 = performance.now(), D = 520;
    const tick = (now) => {
      const p = Math.min(1, (now - t0) / D), k = Math.floor(p * final.length);
      let s = ''; for (let i = 0; i < final.length; i++) s += (i < k || final[i] === ' ') ? final[i] : chars[(Math.random() * chars.length) | 0];
      el.innerHTML = s.slice(0, split) + '<em>' + s.slice(split) + '</em>';
      if (p < 1) scrambleRaf = requestAnimationFrame(tick); else el.innerHTML = `The ${d.adj} <em>${d.noun}</em>`;
    };
    scrambleRaf = requestAnimationFrame(tick);
  }
  function renderDirector() {
    const d = directorType(), nm = $('#dtName');
    ['feedBtn', 'storyBtn', 'shareBtn'].forEach(id => { $('#' + id).disabled = !d; });
    if (!d) { nm.className = 'dt-name empty'; const need = 3 - LETTERS.filter(l => letterStatus(l) === 'user').length; nm.textContent = `Make ${need} more decision${need === 1 ? '' : 's'} to find out.`; $('#dtLine').textContent = ''; lastType = ''; return; }
    $('#dtLine').textContent = d.line; nm.className = 'dt-name';
    if (lastType !== d.name) scramble(nm, d);
    lastType = d.name;
    const lv = $('#lensVal'); if (lv) lv.textContent = state.lens != null ? O.lenses[state.lens].name.split(' ')[0] : 'lens';
  }

  // ---------- share cards: feed 4:5 and story 9:16 ----------
  function setLabelsFrom(t) { const L = t._labels; $('#lampLab').textContent = L.lamp; $('#camLab').textContent = L.cam; $('#dimLab').textContent = L.dim; $('#sunLab').textContent = L.sun; $('#actLab').textContent = L.act; $('#sunLab').style.display = ''; }
  function stageImages() {
    const keep = exportState(), keepCur = Object.assign({}, cur), cap0 = $('#caption').textContent;
    cancelAnimationFrame(anim);
    $('#caption').textContent = ''; const t1 = stageTarget(); setLabelsFrom(t1); delete t1._labels; paint(t1); const mine = inlineSvg();
    const D = O.defaults; Object.assign(state, { l: D.l, a: D.a, lens: D.lens, t: D.t, e: D.e, env: null, em: null });
    const t2 = stageTarget(); setLabelsFrom(t2); delete t2._labels; paint(t2); const theirs = inlineSvg();
    Object.assign(state, keep); cur = keepCur; paint(cur); $('#caption').textContent = cap0; drawStage();
    const load = (svg) => new Promise(res => { const im = new Image(); im.onload = () => res(im); im.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg); });
    return Promise.all([load(mine), load(theirs)]);
  }
  function clip(ctx, text, maxW) { if (ctx.measureText(text).width <= maxW) return text; const words = text.split(' '); let out = ''; for (const w of words) { const t = out ? out + ' ' + w : w; if (ctx.measureText(t + '…').width > maxW) break; out = t; } return (out || text.slice(0, 12)) + '…'; }
  function fitFont(ctx, text, weight, size, family, maxW) { let s = size; do { ctx.font = `${weight} ${s}px ${family}`; s -= 4; } while (ctx.measureText(text).width > maxW && s > 40); return s + 4; }
  async function makeCard(format) {
    const d = directorType(); if (!d) return null;
    try { await document.fonts.ready; } catch (e) {}
    const [mine, theirs] = await stageImages();
    const story = format === 'story', W = 1080, H = story ? 1920 : 1350, pad = story ? 72 : 64;
    const c = document.createElement('canvas'); c.width = W; c.height = H; const x = c.getContext('2d');
    const cs = getComputedStyle(document.documentElement), v = (k) => cs.getPropertyValue(k).trim();
    const bg = v('--bg'), text = v('--text'), muted = v('--muted'), acc = v('--accent'), ink = v('--ink'), sheet = v('--sheet');
    const DISP = '"Archivo Narrow", "Arial Narrow", sans-serif', MONO = '"IBM Plex Mono", monospace', BODY = 'Inter, system-ui, sans-serif';
    x.fillStyle = bg; x.fillRect(0, 0, W, H);
    const g = x.createRadialGradient(W * 0.85, H * 0.08, 0, W * 0.85, H * 0.08, W * 0.9); g.addColorStop(0, sheet); g.addColorStop(1, bg); x.globalAlpha = 0.55; x.fillStyle = g; x.fillRect(0, 0, W, H); x.globalAlpha = 1;
    const n = LETTERS.filter(l => letterStatus(l) === 'user').length;
    x.textBaseline = 'alphabetic';
    if (!story) { x.fillStyle = muted; x.font = `500 22px ${MONO}`; x.fillText('SLATE · KEYFRAME', pad, pad + 20); x.textAlign = 'right'; x.fillText(`${n} / 5 DECIDED BY ME`, W - pad, pad + 20); x.textAlign = 'left'; }
    let y = story ? 250 : 168;
    x.fillStyle = muted; x.font = `500 24px ${MONO}`; x.fillText('I DIRECT LIKE', pad, y);
    const l1 = ('THE ' + d.adj).toUpperCase(), l2 = d.noun.toUpperCase(), big = story ? 132 : 116;
    const fs = Math.min(fitFont(x, l1, 700, big, DISP, W - pad * 2), fitFont(x, l2, 700, big, DISP, W - pad * 2));
    x.font = `700 ${fs}px ${DISP}`; y += fs * 0.98; x.fillStyle = text; x.fillText(l1, pad, y); y += fs * 0.95; x.fillStyle = acc; x.fillText(l2, pad, y);
    y += story ? 64 : 54; x.fillStyle = muted; x.font = `500 ${story ? 34 : 30}px ${BODY}`; x.fillText(clip(x, d.line, W - pad * 2), pad, y);
    const frame = (im, X, Y, w, label, hot) => { const h = w * 450 / 800; x.drawImage(im, X, Y, w, h); x.strokeStyle = hot ? acc : ink; x.lineWidth = hot ? 4 : 2; x.globalAlpha = hot ? 1 : 0.6; x.strokeRect(X, Y, w, h); x.globalAlpha = 1; x.fillStyle = hot ? acc : muted; x.font = `500 20px ${MONO}`; x.fillText(label, X, Y + h + 34); return h; };
    if (story) {
      y += 58; const w = W - pad * 2; const h = frame(mine, pad, y, w, 'WHAT I DIRECTED', true); y += h + 84;
      const tw = 430; const th = frame(theirs, pad, y, tw, 'WHAT THE MODEL PICKS', false);
      let ry = y + 30; const rx = pad + tw + 48;
      LETTERS.forEach(L => { x.fillStyle = acc; x.font = `700 34px ${DISP}`; x.fillText(L, rx, ry); x.fillStyle = text; x.font = `500 24px ${BODY}`; x.fillText(clip(x, letterValue(L) || 'left to the model', W - pad - rx - 40), rx + 40, ry); ry += 50; });
      y += th + 120;
      x.fillStyle = text; x.font = `700 60px ${DISP}`; x.fillText('WHAT DO YOU DIRECT LIKE?', pad, y);
    } else {
      y += 52; const w = (W - pad * 2 - 24) / 2; const h = frame(theirs, pad, y, w, 'WHAT THE MODEL PICKS', false); frame(mine, pad + w + 24, y, w, 'WHAT I DIRECTED', true);
      y += h + 100;
      LETTERS.forEach(L => { x.fillStyle = acc; x.font = `700 34px ${DISP}`; x.fillText(L, pad, y); x.fillStyle = text; x.font = `500 26px ${BODY}`; x.fillText(clip(x, letterValue(L) || 'left to the model', W - pad * 2 - 44), pad + 44, y); y += 50; });
      const sl = slopScore().score, sy = Math.min(y + 110, H - pad - 70); x.strokeStyle = ink; x.globalAlpha = 0.25; x.lineWidth = 2; x.beginPath(); x.moveTo(pad, sy - 100); x.lineTo(W - pad, sy - 100); x.stroke(); x.globalAlpha = 1;
      x.fillStyle = sl <= 20 ? acc : text; x.font = `700 110px ${DISP}`; const sw = x.measureText(sl + '%').width; x.fillText(sl + '%', pad, sy);
      x.fillStyle = muted; x.font = `500 22px ${MONO}`; x.fillText('SLOP SCORE', pad + sw + 28, sy - 46); x.fillStyle = text; x.font = `500 26px ${BODY}`; x.fillText(sl === 0 ? 'Every call in this frame is mine.' : `${100 - sl}% of this frame is my call.`, pad + sw + 28, sy - 8);
    }
    const fy = story ? y + 66 : H - pad; x.fillStyle = acc; x.font = `500 24px ${MONO}`; x.fillText('DIRECT YOURS · SLATE.KEYFRAME24.AI', pad, fy);
    if (story) { x.fillStyle = muted; x.textAlign = 'right'; x.fillText(`SLOP ${slopScore().score}%`, W - pad, fy); x.textAlign = 'left'; }
    return new Promise(res => c.toBlob(b => res(b), 'image/png'));
  }
  const caption = () => { const d = directorType(); return `I direct like ${d.name}. ${d.line} My frame is ${slopScore().score}% slop. What's yours? keyframe24.ai`; };
  function saveBlob(blob, name) { const a = document.createElement('a'); a.download = name; a.href = URL.createObjectURL(blob); a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 4000); }
  async function downloadFormat(format) { const b = await makeCard(format); if (b) { saveBlob(b, `slate-${format}.png`); toast('CARD SAVED'); } }
  async function shareCard() {
    const b = await makeCard('story'); if (!b) return;
    const file = new File([b], 'slate-story.png', { type: 'image/png' });
    if (navigator.canShare && navigator.canShare({ files: [file] })) { try { await navigator.share({ files: [file], text: caption() }); return; } catch (e) { if (e.name === 'AbortError') return; } }
    saveBlob(b, 'slate-story.png'); try { await navigator.clipboard.writeText(caption()); toast('CARD SAVED · CAPTION COPIED'); } catch (e) { toast('CARD SAVED'); }
  }

  // ---------- init ----------
  function buildPeople() {
    const tpl = $('#personTpl');
    $$('[data-person]').forEach(g => { Array.from(tpl.childNodes).forEach(n => { const k = n.cloneNode(true); if (g.dataset.person === 'crowd' && k.classList && k.classList.contains('body')) k.setAttribute('class', 'crowdp'); g.appendChild(k); }); });
  }
  function init() {
    buildPeople();
    const syncTheme = () => { $('#themeLabel').textContent = isLight() ? 'DARK' : 'LIGHT'; $('#themeBtn').setAttribute('aria-label', isLight() ? 'Switch to dark mode' : 'Switch to light mode'); };
    syncTheme();
    const flip = () => { document.documentElement.dataset.theme = isLight() ? 'dark' : 'light'; try { localStorage.setItem('slate_theme', document.documentElement.dataset.theme); } catch (e) {} syncTheme(); render(); };
    $('#themeBtn').addEventListener('click', (ev) => {
      if (!document.startViewTransition || REDUCED) { flip(); return; }
      const r = ev.currentTarget.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height / 2, R = Math.hypot(Math.max(cx, innerWidth - cx), Math.max(cy, innerHeight - cy));
      const vt = document.startViewTransition(flip);
      vt.ready.then(() => document.documentElement.animate({ clipPath: [`circle(0px at ${cx}px ${cy}px)`, `circle(${R}px at ${cx}px ${cy}px)`] }, { duration: 750, easing: 'cubic-bezier(.22,.8,.24,1)', pseudoElement: '::view-transition-new(root)' }));
    });
    // headline: words un-blur one by one
    const h = $('.entry-h'); const caretEl = $('.caret', h); const words = h.firstChild.textContent.trim().split(/\s+/);
    h.firstChild.remove(); words.forEach((w, i) => { const s = document.createElement('span'); s.className = 'w'; s.style.setProperty('--i', i); s.textContent = w; h.insertBefore(s, caretEl); h.insertBefore(document.createTextNode(' '), caretEl); });
    // glass: a soft highlight that follows the pointer
    // the reveal button leans toward the cursor
    if (matchMedia('(pointer: fine)').matches && !REDUCED) { const rb = $('#revealBtn'); rb.addEventListener('pointermove', (e) => { const r = rb.getBoundingClientRect(); rb.style.transform = `translate(${(e.clientX - r.left - r.width / 2) * 0.18}px, ${(e.clientY - r.top - r.height / 2) * 0.3}px)`; }); rb.addEventListener('pointerleave', () => { rb.style.transform = ''; }); }
    // sections rise in as they enter
    if ('IntersectionObserver' in window && !REDUCED) { const io = new IntersectionObserver((es) => es.forEach(en => { if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); } }), { threshold: 0.15 }); $$('.rise').forEach(el => io.observe(el)); } else $$('.rise').forEach(el => el.classList.add('in'));
    addEventListener('resize', () => moveIndicator());

    const eo = $('#entryOpts');
    [[0, 0, 'a lone figure, walking toward us'], [1, 1, 'two people, not looking at each other'], [6, 3, 'a chai seller at six in the morning'], [3, null, 'a bottle on a wet table'], [4, null, 'a car at speed']].forEach(([si, ai, label]) => {
      const b = document.createElement('button'); b.type = 'button'; b.textContent = label;
      b.addEventListener('click', () => { setSilent('s', si, 'user'); if (ai != null) setSilent('act', ai, 'user'); else { state.act = null; delete state.source.act; } state.own.s = ''; openLetter('L'); render(); note(NEXT_NOTE.L); $('#play').scrollIntoView({ behavior: REDUCED ? 'auto' : 'smooth' }); });
      eo.appendChild(b);
    });
    $('#entryForm').addEventListener('submit', e => { e.preventDefault(); const val = $('#entryInput').value.trim(); if (!val) return; state.own.s = val; ['s', 'act'].forEach(k => { state[k] = null; delete state.source[k]; }); $('[data-own="s"]').value = val; openLetter('L'); render(); note(NEXT_NOTE.L); $('#play').scrollIntoView({ behavior: REDUCED ? 'auto' : 'smooth' }); });

    buildStrip(); buildPanels(); openLetter('S');
    $$('[data-go]').forEach(a => a.addEventListener('click', () => openLetter(a.dataset.go)));

    const mt = $('#modelTabs');
    O.models.forEach(m => { const b = document.createElement('button'); b.type = 'button'; b.className = 'tab'; b.setAttribute('role', 'tab'); b.dataset.id = m.id; b.textContent = m.name; b.addEventListener('click', () => { state.model = m.id; render(); }); mt.appendChild(b); });

    $('#randomBtn').addEventListener('click', doRandom);
    $('#autoBtn').addEventListener('click', doAuto);
    $('#revealBtn').addEventListener('click', reveal);
    // the header: the section you are reading is lit, and the highlight slides to it
    (() => {
      const nav = $('#secnav'); if (!nav) return;
      const ind = nav.querySelector('.secnav-ind'), links = [...nav.querySelectorAll('a[data-sec]')];
      const light = (id) => { const a = links.find(l => l.dataset.sec === id); links.forEach(l => l.classList.toggle('on', l === a)); nav.classList.toggle('lit', !!a);
        if (a) { ind.style.width = a.offsetWidth + 'px'; ind.style.transform = `translateX(${a.offsetLeft}px)`; } };
      if (!('IntersectionObserver' in window)) return;
      const seen = new Map();
      const io = new IntersectionObserver((es) => { es.forEach(e => seen.set(e.target.id, e.isIntersecting)); const cur = links.map(l => l.dataset.sec).filter(id => seen.get(id)).pop(); light(cur || null); }, { rootMargin: '-40% 0px -55% 0px' });
      links.forEach(l => { const sec = document.getElementById(l.dataset.sec); if (sec) io.observe(sec); });
      addEventListener('resize', () => { const a = links.find(l => l.classList.contains('on')); if (a) light(a.dataset.sec); });
    })();
    $('#googleBtn').addEventListener('click', googleSignIn);
    $('#closeAuth').addEventListener('click', closeAuth);
    $('#authModal').addEventListener('click', e => { if (e.target.id === 'authModal') closeAuth(); });
    document.addEventListener('keydown', e => { if (e.key === 'Escape') closeAuth(); });
    $('#authBtn').addEventListener('click', () => { if (LOCKED) soon(); else if (DEMO) toast('PREVIEW · SIGN-IN IS WIRED ON THE LIVE SITE'); else googleSignIn(); });
    $('#copyBtn').addEventListener('click', async () => { try { await navigator.clipboard.writeText(state.revealed); toast('COPIED'); } catch (e) { toast('SELECT AND COPY THE TEXT'); } });
    $('#feedBtn').addEventListener('click', () => downloadFormat('feed'));
    $('#storyBtn').addEventListener('click', () => downloadFormat('story'));
    $('#shareBtn').addEventListener('click', shareCard);
    bindStage();

    render();
    resumeAfterLogin();
    window.SLATE_APP = { CFG, DEMO, LOCKED, soon, supa, conjure, LISTS, LETTERS, state, render, note, toast, openAuth, currentSession, exportState, importState, slopScore, letterValue, applyBrief,
      sheetLines: (st) => { const keep = JSON.parse(JSON.stringify(exportState())); if (st) Object.assign(state, st); const out = LETTERS.map(L => [L, letterValue(L) || '']); Object.assign(state, keep); return out; },
      openSheet: (st) => { const base = { s: null, act: null, l: null, env: null, a: null, lens: null, t: null, em: null, e: null, own: { s: '', l: '', a: '', t: '', e: '' }, adv: {}, source: {} }; importState(Object.assign(base, st || {})); render(); $('#play').scrollIntoView({ behavior: REDUCED ? 'auto' : 'smooth' }); note('This is their sheet. Change one letter and make it yours.'); } };
    document.dispatchEvent(new Event('slate:ready'));
  }
  document.addEventListener('DOMContentLoaded', init);
})();
