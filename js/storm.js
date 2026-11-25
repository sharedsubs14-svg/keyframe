/* THE SLOP STORM: the page opens under a downpour of real AI slop. Every picture is a real result from the lazy prompt
   printed under it. Three depths: small cards rain in the back, mid cards fall and slide in, big ones are hurled at the
   screen and hit hard enough to shake it. It never stops: new slop keeps pouring in. The headline slams in word by word.
   The cursor (or a finger) shoves cards and sends them spinning.
   "Get out of the slop", or the first scroll: the slop sucks inward for a beat, then a flash and a shockwave blast it all
   off the screen and one clean line is left. Once you are out, you stay out.
   While the storm is up the header is hidden (body.storm-on); it comes back the moment you get out. */
(function () {
  const sec = document.getElementById('storm'), pile = document.getElementById('stormPile');
  if (!sec || !pile) { document.body.classList.remove('storm-on'); return; }
  const shakeEl = pile;   // only the slop shakes; the words and the button stay still so they can be read and pressed
  const REDUCED = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const PHONE = matchMedia('(max-width: 640px)').matches;

  const P = {
    w: 'a beautiful woman portrait, ultra realistic, 8k, masterpiece, highly detailed',
    c: 'a cyberpunk city at night, neon lights, ultra detailed, 8k, trending on artstation',
    k: 'an astronaut cat floating in space, cute, highly detailed, 8k',
    l: 'a majestic lion, epic, ultra realistic, 8k, masterpiece',
    f: 'a fantasy castle on a mountain, epic, magical, 8k, highly detailed',
    s: 'a samurai warrior, epic, cinematic, ultra detailed, 8k',
    r: 'a futuristic sports car, glossy, ultra realistic, 8k',
    o: 'a wise old man portrait, ultra realistic, 8k, masterpiece',
    b: 'a cute robot, futuristic, highly detailed, 8k, trending',
    d: 'a dragon, epic fantasy, ultra detailed, 8k, masterpiece',
    h: 'a cozy coffee shop interior, warm, highly detailed, 8k',
    g: 'a girl with headphones, anime style, 8k, masterpiece, trending',
    x: 'a boxer in a ring'
  };
  // [image, prompt key, stamp]
  const IMGS = [['01', 'w', '8K'], ['03', 'c', 'TRENDING'], ['05', 'k', 'CUTE'], ['07', 'l', 'EPIC'], ['b1', 'x', 'AUTO'], ['09', 'f', 'MAGICAL'],
    ['11', 's', 'CINEMATIC'], ['13', 'r', 'GLOSSY'], ['15', 'o', 'MASTERPIECE'], ['17', 'b', ''], ['b2', 'x', ''], ['19', 'd', 'EPIC'], ['20', 'h', ''],
    ['22', 'g', 'TRENDING'], ['02', 'w', ''], ['b3', 'x', 'AUTO'], ['04', 'c', ''], ['08', 'l', ''], ['06', 'k', ''], ['12', 's', '8K'], ['b4', 'x', ''],
    ['14', 'r', ''], ['16', 'o', ''], ['18', 'b', '8K'], ['10', 'f', ''], ['b5', 'x', 'SLOP'], ['21', 'h', ''], ['23', 'g', ''], ['b6', 'x', '']];
  const BITS = [
    ['bubble', 'ultra realistic, 8k, masterpiece, highly detailed', 'Generate'],
    ['bar', 'Generating 4 variations…'],
    ['pill', '+ Enhance prompt'],
    ['bubble', 'make it more cinematic', 'Send'],
    ['autos', 'light: auto · lens: auto · hour: auto · mood: auto'],
    ['pill', 'trending on artstation'],
    ['bubble', 'more epic', 'Regenerate'],
    ['pill', 'Upscale 4x'],
    ['bubble', 'a beautiful woman', 'Generate'],
    ['bar', 'Same prompt, new seed…'],
    ['pill', 'best quality, masterpiece'],
    ['pill', '#aiart'],
    ['bubble', 'hyperrealistic, 8k, octane render', 'Generate'],
    ['pill', 'Make it pop']
  ];
  const STAMPS = ['8K', 'EPIC', 'SLOP', 'AUTO', 'MASTERPIECE', 'TRENDING', 'CINEMATIC'];

  // ---- three depths ----
  const L = {
    far: { el: pile.querySelector('.sp-far'), n: PHONE ? 16 : 34, size: PHONE ? 64 : 104, bits: 0, scale: .72, shake: 0 },
    mid: { el: pile.querySelector('.sp-mid'), n: PHONE ? 16 : 30, size: PHONE ? 96 : 156, bits: PHONE ? 3 : 7, scale: 1, shake: PHONE ? 2 : 3 },
    near: { el: pile.querySelector('.sp-near'), n: PHONE ? 7 : 13, size: PHONE ? 128 : 220, bits: PHONE ? 2 : 4, scale: 1.3, shake: PHONE ? 7 : 11 }
  };
  let seed = 11; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const esc = (t) => t.replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
  const cards = []; let ii = 0, bi = 0;
  for (const name of ['far', 'mid', 'near']) {
    const lay = L[name]; if (!lay.el) continue;
    for (let i = 0; i < lay.n; i++) {
      const isBit = i < lay.bits, c = { layer: name, lay };
      if (isBit) {
        const [kind, t, btn] = BITS[bi++ % BITS.length]; c.el = document.createElement('div'); c.el.className = 'sl sl-' + kind;
        c.el.innerHTML = kind === 'bubble' ? `<span>${esc(t)}</span><i>${btn}</i>` : kind === 'bar' ? `<span>${esc(t)}</span><i><i></i></i>` : `<span>${esc(t)}</span>`;
        c.base = lay.scale;
      } else {
        const [f, k, st] = IMGS[ii++ % IMGS.length], stamp = st || (rnd() < 0.22 ? STAMPS[Math.floor(rnd() * STAMPS.length)] : '');
        c.el = document.createElement('figure'); c.el.className = 'sl sl-img';
        c.el.innerHTML = `<img src="img/slop/${f}.jpg" alt="" width="320" height="320" decoding="async">${name === 'far' ? '' : `<figcaption>${esc(P[k])}</figcaption>`}${stamp && name !== 'far' ? `<b class="sl-stamp">${stamp}</b>` : ''}`;
        c.el.style.width = Math.round(lay.size * (0.82 + rnd() * 0.4)) + 'px'; c.base = 1;
      }
      lay.el.appendChild(c.el); cards.push(c);
    }
  }

  // ---- where a card lands, and where it comes from ----
  let W = 0, H = 0;
  const kindFor = (c) => c.layer === 'near' ? 'throw' : c.layer === 'mid' ? (rnd() < 0.5 ? 'side' : 'fall') : 'fall';
  function aim(c, now, delay) {
    c.rx = (-0.04 + rnd() * 1.08) * W; c.ry = (-0.04 + rnd() * 1.08) * H; c.rot = (rnd() - 0.5) * (c.layer === 'near' ? 36 : 28);
    c.kind = kindFor(c);
    if (c.kind === 'fall') { c.fx = c.rx + (rnd() - 0.5) * W * 0.4; c.fy = -H * (0.25 + rnd() * 0.45); c.frot = c.rot + (rnd() - 0.5) * 200; c.dur = (c.layer === 'far' ? 820 : 680) + rnd() * 260; }
    else if (c.kind === 'side') { const left = rnd() < 0.5; c.fx = left ? -W * 0.25 : W * 1.25; c.fy = c.ry + (rnd() - 0.5) * H * 0.4; c.frot = c.rot + (left ? -1 : 1) * (160 + rnd() * 200); c.dur = 620 + rnd() * 220; }
    else { c.fx = c.rx + (rnd() - 0.5) * W * 0.25; c.fy = c.ry + (rnd() - 0.5) * H * 0.25; c.frot = c.rot + (rnd() - 0.5) * 90; c.dur = 430 + rnd() * 140; }
    c.start = now + delay; c.landed = false;
    const dx = c.rx - W / 2, dy = c.ry - H / 2, d = Math.hypot(dx, dy) || 1;
    c.bx = dx / d; c.by = dy / d; c.bspin = (rnd() - 0.5) * 300; c.bdelay = rnd() * 0.16;
  }
  function layout(now) {
    W = pile.clientWidth; H = pile.clientHeight;
    // the first downpour: the back fills first, the big hits come last
    const wave = { far: [0, 1500], mid: [250, 1850], near: [650, 2150] };
    cards.forEach(c => { const [a, b] = wave[c.layer]; aim(c, now, REDUCED ? -1e5 : a + rnd() * (b - a)); c.px = c.py = c.vx = c.vy = c.pr = c.vr = 0; c.el.style.zIndex = Math.round(rnd() * 30); });
  }

  // ---- shake ----
  let shake = 0;
  const kick = (a) => { if (!REDUCED) shake = Math.min(28, Math.max(shake, a)); };

  // ---- getting out ----
  let out = false, outAt = 0;
  function getOut(instant) {
    if (out) return;
    out = true; outAt = instant || REDUCED ? -1e9 : performance.now();
    document.body.classList.remove('storm-on');
    sec.classList.add('out');
    if (!(instant || REDUCED)) setTimeout(() => { sec.classList.add('blast'); kick(28); }, 220);
    setTimeout(() => { pile.hidden = true; stop(); shakeEl.style.transform = ''; }, instant || REDUCED ? 0 : 1700);
  }

  // ---- the loop ----
  const easeBack = (t) => { const s = 1.6; t -= 1; return t * t * ((s + 1) * t + s) + 1; };
  const easeOut = (t) => 1 - Math.pow(1 - t, 3);
  const easeIn = (t) => t * t * t;
  let mx = -9999, my = -9999, raf = 0, running = false, born = 0, nextDrop = 0;
  function frame(now) {
    if (!born) born = now;
    const R = PHONE ? 130 : 240, far = Math.max(W, H) * 1.2;
    const inhale = out ? easeOut(Math.min(1, (now - outAt) / 220)) : 0;
    const bt = out ? Math.min(1, Math.max(0, (now - outAt - 220) / 900)) : 0;
    // it never stops: after the first downpour, more slop keeps coming
    if (!out && !REDUCED && now - born > 2600 && now > nextDrop) {
      const pool = rnd() < 0.86 ? cards.filter(c => c.layer !== 'near') : cards.filter(c => c.layer === 'near');
      const c = pool[Math.floor(rnd() * pool.length)]; if (c) { aim(c, now, 0); c.el.style.zIndex = Math.round(20 + rnd() * 30); }
      nextDrop = now + (PHONE ? 520 : 300) * (0.6 + rnd() * 0.8);
    }
    for (const c of cards) {
      const t = Math.min(1, Math.max(0, (now - c.start) / c.dur));
      let x, y, rot, sc = c.base, op = 1;
      if (now < c.start) { x = c.fx; y = c.fy; rot = c.frot; op = 0; }   // not thrown yet
      else {
        if (c.kind === 'throw') {   // hurled at the screen: huge and blurred-close, then slapped flat
          const e = easeOut(t); x = c.fx + (c.rx - c.fx) * e; y = c.fy + (c.ry - c.fy) * e; rot = c.frot + (c.rot - c.frot) * e;
          sc = c.base * (1 + 2.1 * (1 - easeBack(Math.min(1, t * 1.05)))); op = Math.min(1, t * 5);
        } else {
          const e = easeBack(t); x = c.fx + (c.rx - c.fx) * e; y = c.fy + (c.ry - c.fy) * e; rot = c.frot + (c.rot - c.frot) * easeOut(Math.min(1, t * 1.2)); op = Math.min(1, t * 6);
        }
        if (t >= 1 && !c.landed) { c.landed = true; kick(c.lay.shake * (now - born < 2600 ? 1 : 0.45)); }   // the first downpour hits hardest
      }
      // the shove: cards near the pointer get pushed away and spun, then spring back
      let tx = 0, ty = 0, tr = 0;
      if (!REDUCED && !out && t >= 1) {
        const dx = c.rx + c.px - mx, dy = c.ry + c.py - my, d = Math.hypot(dx, dy);
        if (d < R) { const k = c.layer === 'far' ? 0.45 : c.layer === 'near' ? 1.2 : 1, f = Math.pow(1 - d / R, 2) * (PHONE ? 90 : 170) * k; tx = dx / (d || 1) * f; ty = dy / (d || 1) * f; tr = (dx >= 0 ? 1 : -1) * f * 0.35; }
      }
      c.vx = (c.vx + (tx - c.px) * 0.09) * 0.74; c.vy = (c.vy + (ty - c.py) * 0.09) * 0.74; c.vr = (c.vr + (tr - c.pr) * 0.07) * 0.78;
      c.px += c.vx; c.py += c.vy; c.pr += c.vr;
      // the way out: a beat of suck toward the middle, then everything is blasted off the screen
      const raw = Math.min(1, Math.max(0, (bt - c.bdelay * 0.5) / (1 - c.bdelay * 0.5))), b = easeOut(raw), push = c.layer === 'near' ? 1.5 : c.layer === 'mid' ? 1.15 : 0.9;
      x += c.px + (W / 2 - x) * inhale * 0.16 * (1 - b) + c.bx * b * far * push;
      y += c.py + (H / 2 - y) * inhale * 0.16 * (1 - b) + c.by * b * far * push;
      rot += c.pr + c.bspin * b; sc *= 1 - inhale * 0.1 * (1 - b) + b * (c.layer === 'near' ? 1.6 : 0.7);
      op *= 1 - Math.pow(raw, 1.6);
      const key = `${x.toFixed(1)},${y.toFixed(1)},${rot.toFixed(1)},${sc.toFixed(3)}`;
      if (key !== c.key) { c.el.style.transform = `translate(${x}px,${y}px) translate(-50%,-50%) rotate(${rot}deg) scale(${sc})`; c.key = key; }
      if (op !== c.op) { c.el.style.opacity = op; c.op = op; }
    }
    if (shake > 0.3) { shakeEl.style.transform = `translate(${((rnd() - 0.5) * 2 * shake).toFixed(1)}px,${((rnd() - 0.5) * 2 * shake).toFixed(1)}px)`; shake *= 0.86; }
    else if (shake) { shake = 0; shakeEl.style.transform = ''; }
    if (running) raf = requestAnimationFrame(frame);
  }
  const start = () => { if (!running && !pile.hidden) { running = true; raf = requestAnimationFrame(frame); } };
  const stop = () => { running = false; cancelAnimationFrame(raf); };

  layout(performance.now());
  addEventListener('resize', () => { if (!out) { W = pile.clientWidth; H = pile.clientHeight; } });
  // the headline slams in word by word (timed in CSS); each word lands with a jolt, the last one hardest
  if (!REDUCED) [0, 1, 2, 3].forEach(d => setTimeout(() => { if (!out) kick(d === 3 ? 16 : 7); }, 1060 + d * 300));
  const pin = sec.querySelector('.storm-pin');
  const move = (e) => { const b = pile.getBoundingClientRect(); mx = e.clientX - b.left; my = e.clientY - b.top; };
  pin.addEventListener('pointermove', move, { passive: true });
  pin.addEventListener('pointerdown', move, { passive: true });
  pin.addEventListener('pointerleave', () => { mx = my = -9999; });
  document.getElementById('stormGo').addEventListener('click', () => getOut(false));
  // the first real scroll counts as getting out too; a page that opens part-way down starts out
  if (scrollY > 40) getOut(true);
  addEventListener('scroll', () => { if (!out && scrollY > 24) getOut(false); }, { passive: true });
  if ('IntersectionObserver' in window) new IntersectionObserver(es => es[0].isIntersecting ? start() : stop()).observe(sec); else start();
  document.addEventListener('visibilitychange', () => { if (document.hidden) stop(); else start(); });
})();
