/* DAILY FRAME: one brief a day, and a moving wall of what people made for it. No names on the wall. */
(function () {
  function start() {
    const A = window.SLATE_APP, O = window.SLATE_OPTIONS, B = window.SLATE_BRIEFS;
    if (!A || !B || !document.getElementById('daily')) return;
    const $ = (s, el) => (el || document).querySelector(s);
    const $$ = (s, el) => Array.from((el || document).querySelectorAll(s));
    const REDUCED = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const CFG = A.CFG, DEMO = A.DEMO;
    const WALL_URL = CFG.WALL_URL || '/.netlify/functions/wall';
    const IST = 5.5 * 3600e3, DAY = 864e5;
    const dayKey = (ms) => new Date(ms + IST).toISOString().slice(0, 10);
    const today = () => dayKey(Date.now());
    const dayNum = (key) => Math.round((Date.parse(key) - Date.parse(B.start)) / DAY);
    const briefFor = (key) => { const n = dayNum(key), L = B.list.length; return Object.assign({ no: n + 1, key }, B.list[((n % L) + L) % L]); };
    const KEYWORD = { l: 'Light', env: 'World', a: 'Angle', lens: 'Lens', t: 'Hour', em: 'Feeling', e: 'Genre' };
    const ruleOf = (b) => b.k ? `${KEYWORD[b.k]} locked: ${A.LISTS[b.k][b.i].name}${b.n ? ', ' + b.n : ''}` : '';
    const pad3 = (n) => String(Math.max(1, n)).padStart(3, '0');
    const nice = (key) => new Date(key + 'T00:00:00Z').toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC' });
    const MODELS = ['GPT Image 2', 'Nano Banana 2.1', 'Seedream 5 Pro', 'Midjourney', 'Something else'];
    const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    const pub = (p) => `${CFG.SUPABASE_URL}/storage/v1/object/public/wall/${p}`;

    let viewing = today(), entries = [], pending = [], localPosts = {}, open = -1, file = null;

    // ---------- the brief ----------
    function paintBrief() {
      const b = briefFor(viewing), live = viewing === today();
      $('#dBrief').textContent = b.b;
      $('#dTwist').textContent = b.t || ''; $('#dTwist').hidden = !b.t;
      $('#dRule').textContent = ruleOf(b); $('#dRule').hidden = !b.k;
      $('#dPost').hidden = !live; $('#dUse').hidden = !live;
      $('#dClosed').hidden = live;
      if (!live) $('#dClosed').textContent = `This brief has closed. Today's is No. ${pad3(briefFor(today()).no)}.`;
      $('#dClock').parentElement.hidden = !live;
    }
    function tick() {
      const now = Date.now(), next = (Math.floor((now + IST) / DAY) + 1) * DAY - IST, left = Math.max(0, next - now);
      const h = Math.floor(left / 3600e3), m = Math.floor(left / 60e3) % 60, s = Math.floor(left / 1e3) % 60;
      $('#dClock').textContent = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
      if (left < 1000) setTimeout(() => { if (viewing !== today()) { viewing = today(); load(); } }, 1200);
    }
    // ---------- preview frames (stand-ins until the real wall is connected) ----------
    function rng(seed) { let s = seed >>> 0 || 1; return () => { s ^= s << 13; s ^= s >>> 17; s ^= s << 5; return ((s >>> 0) % 1e6) / 1e6; }; }
    let grain = null;
    function grainCanvas() {
      if (grain) return grain; const g = document.createElement('canvas'); g.width = g.height = 160; const x = g.getContext('2d'), im = x.createImageData(160, 160);
      for (let i = 0; i < im.data.length; i += 4) { const v = Math.random() * 255; im.data[i] = im.data[i + 1] = im.data[i + 2] = v; im.data[i + 3] = 40; }
      x.putImageData(im, 0, 0); return (grain = g);
    }
    function figure(x, cx, base, hgt, col) {
      const w = hgt * 0.26; x.fillStyle = col; x.beginPath(); x.arc(cx, base - hgt + w * 0.32, w * 0.3, 0, 7); x.fill();
      x.beginPath(); x.moveTo(cx - w * 0.5, base - hgt + w * 0.78); x.quadraticCurveTo(cx, base - hgt + w * 0.6, cx + w * 0.5, base - hgt + w * 0.78);
      x.lineTo(cx + w * 0.42, base - hgt * 0.42); x.lineTo(cx + w * 0.3, base); x.lineTo(cx - w * 0.3, base); x.lineTo(cx - w * 0.42, base - hgt * 0.42); x.closePath(); x.fill();
    }
    function demoFrame(r) {
      const ARS = [16 / 9, 4 / 5, 1, 9 / 16, 2.39, 3 / 2, 4 / 5, 16 / 9];
      const ar = ARS[Math.floor(r() * ARS.length)], W = 480, H = Math.round(W / ar);
      const c = document.createElement('canvas'); c.width = W; c.height = H; const x = c.getContext('2d');
      const ti = Math.floor(r() * O.times.length), t = O.times[ti], gi = Math.floor(r() * O.genres.length), g = O.genres[gi];
      const sky = x.createLinearGradient(0, 0, 0, H); sky.addColorStop(0, t.top); sky.addColorStop(1, t.bot); x.fillStyle = sky; x.fillRect(0, 0, W, H);
      const hz = H * (0.5 + r() * 0.22), sx = W * (0.15 + r() * 0.7), sy = hz - H * (0.05 + r() * 0.3), sr = Math.max(W, H) * (0.03 + r() * 0.05);
      const glow = x.createRadialGradient(sx, sy, 0, sx, sy, sr * 7); glow.addColorStop(0, t.sc); glow.addColorStop(0.15, t.sc + '88'); glow.addColorStop(1, t.sc + '00'); x.fillStyle = glow; x.fillRect(0, 0, W, H);
      x.fillStyle = t.sc; x.beginPath(); x.arc(sx, sy, sr, 0, 7); x.fill();
      const gr = x.createLinearGradient(0, hz, 0, H); gr.addColorStop(0, 'rgba(12,10,24,.78)'); gr.addColorStop(1, 'rgba(4,3,10,.97)'); x.fillStyle = gr; x.fillRect(0, hz, W, H - hz);
      x.globalAlpha = 0.25; x.fillStyle = t.sc; x.fillRect(sx - sr * 0.6, hz, sr * 1.2, (H - hz) * 0.9); x.globalAlpha = 1;
      const n = r() < 0.3 ? 2 : 1, base = hz + (H - hz) * (0.3 + r() * 0.45), fh = Math.min(H * (0.2 + r() * 0.26), base * 0.8);
      for (let k = 0; k < n; k++) figure(x, W * (0.32 + r() * 0.36) + k * fh * 0.22, base, fh * (1 - k * 0.08), '#06050c');
      if (g.o) { x.globalAlpha = g.o * 1.3; x.fillStyle = g.c; x.fillRect(0, 0, W, H); x.globalAlpha = 1; }
      const v = x.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.3, W / 2, H / 2, Math.max(W, H) * 0.75); v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,0,0,.55)'); x.fillStyle = v; x.fillRect(0, 0, W, H);
      x.globalCompositeOperation = 'overlay'; x.fillStyle = x.createPattern(grainCanvas(), 'repeat'); x.fillRect(0, 0, W, H); x.globalCompositeOperation = 'source-over';
      const pick = (list) => Math.floor(r() * list.length);
      const st = { s: pick(O.subjects), act: pick(O.actions), l: pick(O.lights), env: pick(O.environments), a: pick(O.angles), lens: pick(O.lenses), t: ti, em: pick(O.emotions), e: gi, own: { s: '', l: '', a: '', t: '', e: '' }, adv: {}, source: {} };
      ['s', 'act', 'l', 'env', 'a', 'lens', 't', 'em', 'e'].forEach(k => { const q = r(); if (q < 0.3 && k !== 't') st[k] = null; else st.source[k] = q < 0.42 ? 'auto' : 'user'; });
      return { url: c.toDataURL('image/jpeg', 0.84), w: W, h: H, slate: st };
    }
    const demoCache = {};
    function demoEntries(key) {
      if (demoCache[key]) return demoCache[key];
      const r = rng(dayNum(key) * 7919 + 17), out = [];
      for (let i = 0; i < 18; i++) { const f = demoFrame(r); out.push({ id: `demo-${key}-${i}`, day: key, img: f.url, tile: f.url, w: f.w, h: f.h, model: MODELS[Math.floor(r() * 4)], slop: A.slopScore(f.slate).score, slate: f.slate, lines: A.sheetLines(f.slate), demo: true }); }
      return (demoCache[key] = out);
    }

    // ---------- loading ----------
    // House frames: made by Keyframe per brief (seed/manifest.json), released through the day so the wall fills up.
    let seedMap = null;
    async function seedsFor(key) {
      if (!seedMap) { try { const r = await fetch('seed/manifest.json', { cache: 'no-cache' }); seedMap = r.ok ? await r.json() : {}; } catch (e) { seedMap = {}; } }
      const L = B.list.length, pos = ((dayNum(key) % L) + L) % L + 1, list = seedMap[pos] || [];
      if (!list.length) return [];
      const r = rng(dayNum(key) * 104729 + 7), order = list.map((s, i) => [r(), i]).sort((x, y) => x[0] - y[0]).map(x => x[1]);
      const frac = key === today() ? ((Date.now() + IST) % DAY) / DAY : 1, out = [];
      order.forEach((idx, n) => {
        const at = n < 3 ? 0 : Math.min(0.92, 0.04 + Math.pow((n - 2) / Math.max(1, list.length - 3), 1.15) * 0.86 + (r() - 0.5) * 0.03);
        if (at > frac) return;
        const s = list[idx], st = s.slate ? Object.assign({ s: null, act: null, l: null, env: null, a: null, lens: null, t: null, em: null, e: null, own: { s: '', l: '', a: '', t: '', e: '' }, adv: {}, source: {} }, s.slate) : null;
        if (st) ['s', 'act', 'l', 'env', 'a', 'lens', 't', 'em', 'e'].forEach(k => { if (st[k] != null && !st.source[k]) st.source[k] = 'user'; });
        out.push({ id: `seed-${pos}-${idx}`, day: key, img: `seed/${pos}/${s.f}`, tile: `seed/${pos}/${s.t || s.f}`, w: s.w, h: s.h, model: s.model || '', slop: st ? A.slopScore(st).score : null, slate: st, lines: st ? A.sheetLines(st) : null, demo: true, at });
      });
      return out.sort((x, y) => y.at - x.at);
    }
    async function fetchDay(key) {
      const seeds = await seedsFor(key);
      if (DEMO || !A.supa) return (localPosts[key] || []).concat(seeds.length ? seeds : demoEntries(key));
      const { data, error } = await A.supa.from('wall_public').select('*').eq('day', key).order('created_at', { ascending: false }).limit(240);
      if (error) { console.warn('wall', error.message); return seeds; }
      return data.map(r => Object.assign({}, r, { img: pub(r.img_path), tile: pub(r.tile_path) })).concat(seeds);
    }
    async function load() {
      paintBrief(); $('#wall').classList.add('loading');
      entries = await fetchDay(viewing); pending = [];
      $('#dNew').hidden = true; buildWall(); $('#wall').classList.remove('loading');
    }
    async function poll() {
      if (DEMO || document.hidden || viewing !== today() || !wallVisible) return;
      const fresh = await fetchDay(viewing), seen = new Set(entries.concat(pending).map(e => e.id));
      const add = fresh.filter(e => !seen.has(e.id)); if (!add.length) return;
      pending = add.concat(pending); const n = pending.length;
      $('#dNew').textContent = `${n} new frame${n > 1 ? 's' : ''} · show`; $('#dNew').hidden = false;
    }

    // Frames on the wall are scored on a gentler 0 to 20 scale: anything posted here was already directed.
    const wallSlop = (v) => v == null ? null : Math.max(0, Math.min(20, Math.round(v / 5)));

    // ---------- the wall ----------
    // Every frame shown whole, in justified rows. The frame under the cursor lifts toward you and its neighbours
    // ease out of the way (the lens from the old Keyframe page), and the whole wall leans gently toward the cursor.
    function tileHTML(e, i, clone) {
      const ws = wallSlop(e.slop), label = `Frame ${i + 1}${e.model ? ', made with ' + esc(e.model) : ''}${ws != null ? ', slop ' + ws + ' percent' : ''}`;
      return `<button type="button" class="tile${e.fresh ? ' fresh' : ''}" data-i="${i}" style="--ar:${((e.w || 4) / (e.h || 5)).toFixed(4)};--d:${(-((i * 1.37) % 6)).toFixed(2)}s" ${clone ? 'aria-hidden="true" tabindex="-1"' : `aria-label="${label}"`}>` +
        `<img src="${esc(e.tile)}" alt="" loading="lazy" decoding="async" draggable="false">` +
        (ws != null ? `<span class="tslop${ws <= 10 ? ' low' : ''}">${ws}%</span>` : '') +
        `<span class="tmeta">${esc(e.model || '')}</span></button>`;
    }
    const SHOW = 36; let showAll = false;
    function buildWall() {
      const wall = $('#wall');
      wall.innerHTML = ''; wall.classList.toggle('empty', !entries.length);
      if (!entries.length) {
        wall.innerHTML = `<div class="wall-empty"><p class="eyebrow">the wall is empty</p><p>${viewing === today() ? 'Nobody has shot today’s frame yet. Be the first one up.' : 'Nobody posted for this brief.'}</p></div>`;
        lens.measure(); return;
      }
      const list = showAll ? entries : entries.slice(0, SHOW);
      const grid = document.createElement('div'); grid.className = 'wgrid';
      grid.innerHTML = list.map((e, i) => tileHTML(e, i)).join('');
      wall.appendChild(grid);
      if (entries.length > list.length) { const more = document.createElement('button'); more.type = 'button'; more.className = 'btn line wall-more'; more.textContent = `See all ${entries.length} frames`; more.addEventListener('click', (ev) => { ev.stopPropagation(); showAll = true; buildWall(); }); wall.appendChild(more); }
      requestAnimationFrame(() => { lens.measure(); wall.classList.add('moving'); });
    }
    const lens = (() => {
      const wall = $('#wall'); let tiles = [], pts = [], cur = [], m = null, raf = 0, last = 0, W = 1, H = 1, rx = 0, ry = 0;
      const calm = () => REDUCED || !matchMedia('(pointer: fine)').matches;
      function measure() {
        tiles = [...wall.querySelectorAll('.wgrid .tile')]; W = wall.clientWidth || 1; H = wall.clientHeight || 1;
        pts = tiles.map(t => ({ x: t.offsetLeft + t.offsetWidth / 2, y: t.offsetTop + t.offsetHeight / 2 })); cur = tiles.map(() => 0);
      }
      function frame(now) {
        const dt = Math.min(.05, last ? (now - last) / 1000 : .016); last = now;
        const sig = Math.max(150, W * .12), amp = 1, k = 1 - Math.exp(-dt * 11);
        let busy = false;
        tiles.forEach((t, i) => {
          const p = pts[i]; let v = 0, d = 0, dx = 0, dy = 0;
          if (m) { dx = p.x - m.x; dy = p.y - m.y; d = Math.hypot(dx, dy); v = amp * Math.exp(-(d * d) / (2 * sig * sig)); }
          cur[i] += (v - cur[i]) * k; const c = cur[i];
          if (Math.abs(v - c) > .002 || c > .002) busy = true;
          if (c < .002 && !m) { t.style.transform = ''; t.style.zIndex = ''; t.classList.remove('lit'); return; }
          const push = d > .5 ? c * sig * .22 * Math.min(1, d / (sig * .9)) : 0;
          const ox = d > .5 ? (dx / d) * push : 0, oy = d > .5 ? (dy / d) * push : 0;
          t.style.transform = `translate3d(${ox.toFixed(1)}px,${oy.toFixed(1)}px,${(c * 70).toFixed(1)}px) scale(${(1 + c * .14).toFixed(4)})`;
          t.style.zIndex = String(2 + Math.round(c * 100)); t.classList.toggle('lit', c > .55);
        });
        const g = wall.querySelector('.wgrid');
        if (g) { const tx = m ? (m.x / W - .5) * 5 : 0, ty = m ? (m.y / H - .5) * -4 : 0; rx += (tx - rx) * k; ry += (ty - ry) * k;
          if (Math.abs(tx - rx) > .01 || Math.abs(ty - ry) > .01) busy = true;
          g.style.transform = Math.abs(rx) + Math.abs(ry) > .01 ? `rotateY(${rx.toFixed(3)}deg) rotateX(${ry.toFixed(3)}deg)` : ''; }
        raf = busy || m ? requestAnimationFrame(frame) : 0; if (!raf) last = 0;
      }
      const go = () => { if (!raf) raf = requestAnimationFrame(frame); };
      wall.addEventListener('pointermove', (e) => { if (calm() || e.pointerType !== 'mouse' || !tiles.length) return; const r = wall.getBoundingClientRect(); m = { x: e.clientX - r.left, y: e.clientY - r.top }; go(); });
      wall.addEventListener('pointerleave', () => { m = null; go(); });
      return { measure };
    })();
    let wallVisible = true;

    // ---------- one frame, opened ----------
    function openFrame(i) {
      const e = entries[i]; if (!e) return; open = i;
      const b = briefFor(e.day || viewing);
      $('#fImg').src = e.img; $('#fImg').alt = `Frame made with ${e.model || 'an image model'} for: ${b.b}`;
      $('#fNo').textContent = `No. ${pad3(b.no)} · ${b.b}`;
      $('#fModel').textContent = e.model ? `Made with ${e.model}` : 'Model not given';
      const fs = wallSlop(e.slop); $('#fSlop').textContent = fs != null ? `${fs}%` : '–'; $('#fSlopBox').hidden = fs == null;
      $('#fSlopBox').classList.toggle('low', fs != null && fs <= 10);
      const ls = $('#fLines'); ls.innerHTML = '';
      if (Array.isArray(e.lines) && e.lines.length) e.lines.forEach(([L, v]) => { ls.insertAdjacentHTML('beforeend', `<li><b>${esc(L)}</b><span>${v ? esc(v) : '<i>left to the model</i>'}</span></li>`); });
      else ls.innerHTML = '<li class="none">No sheet attached. They kept their SLATE to themselves.</li>';
      $('#fOpen').hidden = !e.slate; $('#fReport').hidden = !!e.mine;
      $('#fCount').textContent = `${i + 1} / ${entries.length}`;
      $('#frameModal').hidden = false; $('#fClose').focus();
    }
    const closeFrame = () => { $('#frameModal').hidden = true; open = -1; };
    async function report() {
      const e = entries[open]; if (!e) return;
      if (DEMO || e.demo) { A.toast('REPORTED · THANK YOU'); hideEntry(e.id); return; }
      const session = await A.currentSession(); if (!session) { closeFrame(); A.openAuth('upload'); return; }
      try { const r = await fetch(WALL_URL, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + session.access_token }, body: JSON.stringify({ action: 'report', id: e.id }) }); if (!r.ok) throw 0; A.toast('REPORTED · THANK YOU'); hideEntry(e.id); }
      catch (err) { A.toast('COULD NOT REPORT · TRY AGAIN'); }
    }
    function hideEntry(id) { entries = entries.filter(e => e.id !== id); closeFrame(); buildWall(); }

    // ---------- posting ----------
    const fromCanvas = (src, max, q) => { const s = Math.min(1, max / Math.max(src.width, src.height)), w = Math.round(src.width * s), h = Math.round(src.height * s); const c = document.createElement('canvas'); c.width = w; c.height = h; const x = c.getContext('2d'); x.fillStyle = '#000'; x.fillRect(0, 0, w, h); x.drawImage(src, 0, 0, w, h); return new Promise(res => c.toBlob(b => res({ blob: b, w, h, url: URL.createObjectURL(b) }), 'image/jpeg', q)); };
    async function decode(f) {
      if (window.createImageBitmap) { try { return await createImageBitmap(f, { imageOrientation: 'from-image' }); } catch (e) {} }
      return await new Promise((res, rej) => { const im = new Image(); im.onload = () => res(im); im.onerror = () => rej(new Error('That image could not be opened. Try a JPG or PNG.')); im.src = URL.createObjectURL(f); });
    }
    async function takeFile(f) {
      const msg = $('#pMsg'); msg.textContent = '';
      if (!f) return;
      if (!/^image\//.test(f.type)) { msg.textContent = 'That file is not an image.'; return; }
      if (f.size > 25e6) { msg.textContent = 'That image is over 25 MB. Export a smaller copy.'; return; }
      try {
        const src = await decode(f);
        if (Math.min(src.width, src.height) < 300) { msg.textContent = 'That image is too small to show well. Use one at least 300 pixels on the short side.'; return; }
        const full = await fromCanvas(src, 1600, 0.86), tile = await fromCanvas(src, 560, 0.8);
        file = { full, tile };
        $('#pPrev').src = full.url; $('#pDrop').classList.add('has');
      } catch (e) { msg.textContent = e.message || 'That image could not be opened.'; }
      checkReady();
    }
    function checkReady() { $('#pSend').disabled = !(file && $('#pOk').checked); }
    function openPost() {
      if (viewing !== today()) return;
      const b = briefFor(today()), sc = A.slopScore().score, any = A.LETTERS.some(L => A.letterValue(L));
      $('#pNo').textContent = `Daily Frame · No. ${pad3(b.no)}`; $('#pBrief').textContent = b.b;
      $('#pSheet').checked = any; $('#pSheet').disabled = !any;
      $('#pSheetTxt').textContent = any ? `Attach my SLATE sheet (slop ${sc}%) so people can remix it` : 'Attach my SLATE sheet (build one on the board first)';
      $('#pMsg').textContent = ''; $('#postModal').hidden = false; $('#pPick').focus();
    }
    async function beginPost() {
      if (viewing !== today()) return;
      if (A.LOCKED) { A.soon(); return; }
      if (DEMO || !A.supa) { openPost(); return; }
      const session = await A.currentSession();
      if (!session) { A.openAuth('upload'); return; }
      openPost();
    }
    const closePost = () => { $('#postModal').hidden = true; };
    const toB64 = (blob) => new Promise(res => { const fr = new FileReader(); fr.onload = () => res(String(fr.result).split(',')[1]); fr.readAsDataURL(blob); });
    async function send() {
      if (!file || !$('#pOk').checked) return;
      const btn = $('#pSend'), msg = $('#pMsg'); btn.disabled = true; btn.classList.add('busy'); btn.textContent = 'Checking it…'; msg.textContent = '';
      const attach = $('#pSheet').checked, slate = attach ? A.exportState() : null;
      const entry = { day: today(), w: file.full.w, h: file.full.h, model: $('#pModel').value, slop: attach ? A.slopScore().score : null, slate, lines: attach ? A.sheetLines() : null };
      try {
        if (DEMO || !A.supa) {
          await new Promise(r => setTimeout(r, 900));
          Object.assign(entry, { id: 'mine-' + Date.now(), img: file.full.url, tile: file.tile.url, mine: true, fresh: true });
          (localPosts[entry.day] = localPosts[entry.day] || []).unshift(entry);
          A.toast('PREVIEW · ON THE LIVE SITE IT IS CHECKED, THEN POSTED');
        } else {
          const session = await A.currentSession(); if (!session) { closePost(); A.openAuth('upload'); return; }
          const body = Object.assign({ action: 'post', full: await toB64(file.full.blob), tile: await toB64(file.tile.blob) }, entry);
          const r = await fetch(WALL_URL, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + session.access_token }, body: JSON.stringify(body) });
          const data = await r.json().catch(() => ({}));
          if (!r.ok) throw new Error(data.error || 'That did not go through. Try again in a minute.');
          Object.assign(entry, data.entry, { img: pub(data.entry.img_path), tile: pub(data.entry.tile_path), mine: true, fresh: true });
          A.toast(data.left > 0 ? `POSTED · ${data.left} MORE TODAY` : 'POSTED · THAT WAS YOUR LAST ONE TODAY');
        }
        closePost(); resetPost();
        if (viewing !== today()) viewing = today();
        entries = [entry].concat(entries.filter(e => e.id !== entry.id)); buildWall();
        $('#daily').scrollIntoView({ behavior: REDUCED ? 'auto' : 'smooth', block: 'start' });
      } catch (e) { msg.textContent = e.message; }
      finally { btn.classList.remove('busy'); btn.textContent = 'Post to the wall'; checkReady(); }
    }
    function resetPost() { file = null; $('#pFile').value = ''; $('#pPrev').removeAttribute('src'); $('#pDrop').classList.remove('has'); $('#pOk').checked = false; checkReady(); }

    // ---------- wiring ----------
    $('#dUse').addEventListener('click', () => { const b = briefFor(today()); A.applyBrief(b.b + (b.t ? ' ' + b.t : ''), b.k, b.i); });
    $('#dPost').addEventListener('click', beginPost);
    $('#dNew').addEventListener('click', () => { entries = pending.map(e => Object.assign(e, { fresh: true })).concat(entries); pending = []; $('#dNew').hidden = true; buildWall(); });
    $('#wall').addEventListener('click', (e) => { const t = e.target.closest('.tile'); if (t) openFrame(+t.dataset.i); });
    $('#fClose').addEventListener('click', closeFrame);
    $('#fPrev').addEventListener('click', () => openFrame((open - 1 + entries.length) % entries.length));
    $('#fNext').addEventListener('click', () => openFrame((open + 1) % entries.length));
    $('#fOpen').addEventListener('click', () => { const e = entries[open]; closeFrame(); A.openSheet(e.slate); });
    $('#fReport').addEventListener('click', report);
    $('#frameModal').addEventListener('click', e => { if (e.target.id === 'frameModal') closeFrame(); });
    $('#postModal').addEventListener('click', e => { if (e.target.id === 'postModal') closePost(); });
    $('#pCancel').addEventListener('click', closePost);
    $('#pPick').addEventListener('click', () => $('#pFile').click());
    $('#pFile').addEventListener('change', e => takeFile(e.target.files[0]));
    const drop = $('#pDrop');
    ['dragenter', 'dragover'].forEach(ev => drop.addEventListener(ev, e => { e.preventDefault(); drop.classList.add('over'); }));
    ['dragleave', 'drop'].forEach(ev => drop.addEventListener(ev, e => { e.preventDefault(); drop.classList.remove('over'); }));
    drop.addEventListener('drop', e => takeFile(e.dataTransfer.files[0]));
    $('#pOk').addEventListener('change', checkReady);
    $('#pSend').addEventListener('click', send);
    const sel = $('#pModel'); MODELS.forEach(m => { const o = document.createElement('option'); o.textContent = m; sel.appendChild(o); }); sel.value = 'Seedream 5 Pro';
    document.addEventListener('keydown', e => {
      if (!$('#frameModal').hidden) { if (e.key === 'Escape') closeFrame(); if (e.key === 'ArrowRight') $('#fNext').click(); if (e.key === 'ArrowLeft') $('#fPrev').click(); }
      if (!$('#postModal').hidden && e.key === 'Escape') closePost();
    });
    if ('IntersectionObserver' in window) new IntersectionObserver(es => es.forEach(en => { wallVisible = en.isIntersecting; $('#wall').classList.toggle('paused', !en.isIntersecting); }), { rootMargin: '200px' }).observe($('#wall'));
    let rw = 0; addEventListener('resize', () => { clearTimeout(rw); rw = setTimeout(() => lens.measure(), 200); });

    load(); tick(); setInterval(tick, 1000); setInterval(poll, 60e3);
    // Came back from signing in to post?
    let after = null; try { after = localStorage.getItem('slate_after'); localStorage.removeItem('slate_after'); } catch (e) {}
    if (after === 'reverse') setTimeout(() => { const r = document.getElementById('reverse'); if (r) r.scrollIntoView(); }, 400);
    if (after === 'daily') { setTimeout(async () => { $('#daily').scrollIntoView(); if (await A.currentSession()) openPost(); }, 400); }
  }
  if (window.SLATE_APP) start(); else document.addEventListener('slate:ready', start, { once: true });
})();
