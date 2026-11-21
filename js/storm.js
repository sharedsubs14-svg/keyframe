/* THE SLOP STORM: the page opens buried in real AI slop. Every picture is a real result from the lazy prompt printed
   under it. The cursor (or a finger) shoves the pile around. "Get out of the slop", or the first scroll, blasts it all
   off the screen and leaves one clean line. Once you are out, you stay out.
   While the storm is up the header is hidden (body.storm-on); it comes back the moment you get out. */
(function () {
  const sec = document.getElementById('storm'), pile = document.getElementById('stormPile');
  if (!sec || !pile) { document.body.classList.remove('storm-on'); return; }
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
    ['pill', 'Upscale 4x'],
    ['bubble', 'a beautiful woman', 'Generate'],
    ['pill', '#aiart'],
    ['bar', 'Same prompt, new seed…']
  ];
  const nImg = PHONE ? 18 : IMGS.length, nBit = PHONE ? 5 : BITS.length;

  // ---- build the cards ----
  const cards = [];
  const esc = (t) => t.replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
  IMGS.slice(0, nImg).forEach(([f, k, stamp]) => {
    const el = document.createElement('figure'); el.className = 'sl sl-img';
    el.innerHTML = `<img src="img/slop/${f}.jpg" alt="" width="320" height="320" decoding="async"><figcaption>${esc(P[k])}</figcaption>${stamp ? `<b class="sl-stamp">${stamp}</b>` : ''}`;
    cards.push({ el, kind: 'img' });
  });
  BITS.slice(0, nBit).forEach(([kind, t, btn]) => {
    const el = document.createElement('div'); el.className = 'sl sl-' + kind;
    el.innerHTML = kind === 'bubble' ? `<span>${esc(t)}</span><i>${btn}</i>` : kind === 'bar' ? `<span>${esc(t)}</span><i><i></i></i>` : `<span>${esc(t)}</span>`;
    cards.push({ el, kind });
  });
  let seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  for (let i = cards.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [cards[i], cards[j]] = [cards[j], cards[i]]; }
  cards.forEach(c => pile.appendChild(c.el));

  // ---- where everything rests: a jittered grid that covers the whole screen ----
  let W = 0, H = 0;
  function layout() {
    W = pile.clientWidth; H = pile.clientHeight;
    const n = cards.length, aspect = W / Math.max(1, H);
    const cols = Math.max(3, Math.round(Math.sqrt(n * aspect))), rows = Math.ceil(n / cols);
    const cw = W / cols, ch = H / rows, order = cards.map((_, i) => i).sort(() => rnd() - 0.5);
    order.forEach((ci, slot) => {
      const c = cards[ci], col = slot % cols, row = Math.floor(slot / cols);
      const base = c.kind === 'img' ? (PHONE ? 104 : 168) : 0;
      if (base) c.el.style.width = Math.round(base * (0.82 + rnd() * 0.42)) + 'px';
      c.rx = (col + 0.5 + (rnd() - 0.5) * 0.7) * cw; c.ry = (row + 0.5 + (rnd() - 0.5) * 0.7) * ch;
      c.rot = (rnd() - 0.5) * 26;
      c.fx = c.rx + (rnd() - 0.5) * W * 0.5; c.fy = -H * (0.35 + rnd() * 0.5); c.frot = c.rot + (rnd() - 0.5) * 140;
      c.delay = slot * (PHONE ? 70 : 52) + rnd() * 90; c.dur = 620 + rnd() * 260;
      const dx = c.rx - W / 2, dy = c.ry - H / 2, d = Math.hypot(dx, dy) || 1;
      c.bx = dx / d; c.by = dy / d; c.bspin = (rnd() - 0.5) * 220; c.bdelay = rnd() * 0.18;
      c.px = c.px || 0; c.py = c.py || 0; c.vx = 0; c.vy = 0;
      c.el.style.zIndex = Math.round(rnd() * 20);
    });
  }

  // ---- getting out ----
  let out = false, outAt = 0;
  function getOut(instant) {
    if (out) return;
    out = true; outAt = instant || REDUCED ? -1e9 : performance.now();
    sec.classList.add('out'); document.body.classList.remove('storm-on');
    setTimeout(() => { pile.hidden = true; stop(); }, instant || REDUCED ? 0 : 1500);
  }

  // ---- the loop ----
  const easeBack = (t) => { const s = 1.5; t -= 1; return t * t * ((s + 1) * t + s) + 1; };
  const easeIn = (t) => t * t * t;
  let t0 = 0, mx = -9999, my = -9999, raf = 0, running = false;
  function frame(now) {
    if (!t0) t0 = now;
    const el = now - t0, R = PHONE ? 110 : 190, far = Math.max(W, H) * 1.15;
    const bt = out ? Math.min(1, (now - outAt) / 1100) : 0;
    for (const c of cards) {
      const t = REDUCED ? 1 : Math.min(1, Math.max(0, (el - c.delay) / c.dur));
      const e = REDUCED ? 1 : easeBack(t);
      let x = c.fx + (c.rx - c.fx) * e, y = c.fy + (c.ry - c.fy) * e, rot = c.frot + (c.rot - c.frot) * Math.min(1, t * 1.15);
      // the shove: cards near the pointer get pushed away, then spring back
      let tx = 0, ty = 0;
      if (!REDUCED && !out && t >= 1) {
        const dx = c.rx + c.px - mx, dy = c.ry + c.py - my, d = Math.hypot(dx, dy);
        if (d < R) { const f = Math.pow(1 - d / R, 2) * (PHONE ? 70 : 120); tx = dx / (d || 1) * f; ty = dy / (d || 1) * f; }
      }
      c.vx = (c.vx + (tx - c.px) * 0.09) * 0.74; c.vy = (c.vy + (ty - c.py) * 0.09) * 0.74;
      c.px += c.vx; c.py += c.vy;
      // the blast: everything flies straight out from the middle, a few at a time
      const b = easeIn(Math.min(1, Math.max(0, (bt - c.bdelay) / (1 - c.bdelay))));
      x += c.px + c.bx * b * far; y += c.py + c.by * b * far; rot += c.bspin * b;
      const sc = 1 + b * 0.6 + Math.min(0.06, Math.hypot(c.px, c.py) / 1600);
      const key = `${x.toFixed(1)},${y.toFixed(1)},${rot.toFixed(1)},${sc.toFixed(3)}`;
      if (key !== c.key) { c.el.style.transform = `translate(${x}px,${y}px) translate(-50%,-50%) rotate(${rot}deg) scale(${sc})`; c.key = key; }
      const op = t <= 0 && !REDUCED ? 0 : 1 - b;
      if (op !== c.op) { c.el.style.opacity = op; c.op = op; }
    }
    if (running) raf = requestAnimationFrame(frame);
  }
  const start = () => { if (!running && !pile.hidden) { running = true; raf = requestAnimationFrame(frame); } };
  const stop = () => { running = false; cancelAnimationFrame(raf); };

  layout();
  addEventListener('resize', () => { if (!out) layout(); });
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
