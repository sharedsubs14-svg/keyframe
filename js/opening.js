/* OPENING: "Walk onto the set". One real photograph, split into layers that stand on a film set.
   Scrolling is the camera move: the layers start pulled apart and seen from the side, each of the five
   decisions switches one of them on, and by the fifth they line up into the finished frame. Then the camera pushes through it.
   Layers: backdrop (the world, its light, its hour), subject (cut out of the photo), gate (the frame line and the bars). */
(function () {
  const scene = document.getElementById('top'), pin = document.getElementById('opPin');
  if (!scene || !pin) return;
  const $ = (id) => document.getElementById(id);
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const ease = (t) => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  const seg = (p, a, b) => clamp((p - a) / (b - a));
  const end = $('opEnd');
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) { end.classList.add('go', 'live'); return; }

  const world = $('opWorld'), lines = Array.from($('opLines').children), hud = Array.from($('opHud').children);
  const bd = $('opBd'), dull = $('opDull'), noon = $('opNoon'), gold = $('opGold'), fin = $('opFinal'), sub = $('opSub'), subImg = $('opSubImg'), gate = $('opGate'), cam = $('opCam');
  const tags = { S: $('opTagS'), L: $('opTagL'), A: $('opTagA'), T: $('opTagT'), E: $('opTagE') };
  const P = 1100;                                   // must match the CSS perspective
  const TZ0 = -250, TZ1 = -60;                      // camera distance at the start and at the end of the orbit
  const Z = { b: -380, s: 0, g: 240 }, CAMZ = 430;  // where each layer stands in depth
  const B0 = 0.05, STEP = 0.135, DUR = 0.1;         // five beats
  const ORBIT_END = 0.72, PUSH_END = 0.85, HOLD_END = 0.89;   // then the push until the photo fills the screen, and a short hold
  const OPEN = window.SLATE_OPENING || { frames: {} }, PW = 688, PH = 387;
  let F = null, LOOK = null, rFull = 940;          // the frame in use, how its cut-out subject is lit at each stage, how far the light has to spread
  const mix = (a, b, t) => a.map((v, i) => lerp(v, b[i], t));
  const S = (z) => (P - (z + TZ1)) / (P - TZ1);     // the size that makes a layer at depth z line up with the subject when seen head-on
  let p = 0, target = 0, shown = -1, mx = 0, my = 0, tmx = 0, tmy = 0, running = false, raf = 0, sc = 1, camX = -260, camY = 122, push_z = 500, lastLook = '', lastZb = null;

  function paint() {
    const orbit = ease(seg(p, 0, ORBIT_END)), push = ease(seg(p, ORBIT_END, PUSH_END)), keep = 1 - push;
    const sway = keep * (1 - 0.85 * ease(seg(p, B0 + 4 * STEP, B0 + 4 * STEP + DUR)));   // the cursor nudges the camera; less once the frame has locked
    const ry = lerp(-34, 0, orbit) + mx * 1.8 * sway, rx = lerp(-12, 0, orbit) - my * 1.2 * sway;
    world.style.transform = `translate3d(0,${lerp(26, 0, orbit)}px,${lerp(TZ0, TZ1, orbit) + push * push_z}px) rotateX(${rx}deg) rotateY(${ry}deg)`;
    const raw = [0, 1, 2, 3, 4].map(i => seg(p, B0 + i * STEP, B0 + i * STEP + DUR)), q = raw.map(ease);

    // while the camera pushes in, the backdrop closes up behind the subject so his feet stay on his shadow
    const zb = lerp(Z.b, -40, push); if (zb !== lastZb) { bd.style.transform = `translateZ(${zb}px) scale(${S(zb)})`; lastZb = zb; }
    // S: the outline is on the sheet, then the real person fills it, unlit
    subImg.style.opacity = q[0]; $('opOutline').style.opacity = .7 * (1 - q[0]);
    // L: the world arrives dark, then the light spreads out from where the sun sits
    const lit = ease(seg(raw[1], .25, 1));
    bd.style.opacity = ease(seg(raw[1], 0, .3));
    noon.style.setProperty('--r', (lit * rFull) + 'px'); noon.classList.toggle('full', lit >= 1);
    // A: the camera finds its mark (the orbit does the moving), the frame line and the camera appear
    gate.style.opacity = q[2] * (1 - seg(push, .15, .7)); cam.style.opacity = q[2] * keep;
    cam.style.transform = `translate3d(${camX}px,${camY}px,${CAMZ}px) rotateY(${-ry}deg) rotateX(${-rx}deg) rotate(-10deg) scale(.333)`;
    // T: midday light drops to golden hour
    gold.style.opacity = q[3];
    // E: the grade, the vignette and the bars
    fin.style.opacity = q[4]; $('opVig').style.opacity = q[4]; gate.style.setProperty('--bar', F.bars ? q[4] : 0); pin.style.setProperty('--pane', 1 - q[4]);
    dull.style.visibility = lit >= 1 ? 'hidden' : 'visible'; noon.style.visibility = q[3] >= 1 ? 'hidden' : 'visible'; gold.style.visibility = q[4] >= 1 ? 'hidden' : 'visible';
    const look = q[4] >= 1 ? 'none' : (() => { const v = mix(mix(mix(LOOK.flat, LOOK.lit, lit), LOOK.hour, q[3]), [1, 1, 1], q[4]); return `saturate(${v[0].toFixed(3)}) brightness(${v[1].toFixed(3)}) contrast(${v[2].toFixed(3)})`; })();
    if (look !== lastLook) { subImg.style.filter = look; lastLook = look; }
    tags.S.style.opacity = q[0] * keep; tags.L.style.opacity = lit * keep; tags.A.style.opacity = q[2] * keep; tags.T.style.opacity = q[3] * keep; tags.E.style.opacity = q[4] * keep;

    const active = p < B0 - 0.01 ? 0 : p > ORBIT_END + 0.02 ? -1 : Math.min(5, 1 + Math.floor((p - B0) / STEP));
    lines.forEach((l, i) => l.classList.toggle('on', i === active));
    hud.forEach((h, i) => h.style.setProperty('--f', q[i]));
    const flash = seg(p, HOLD_END, HOLD_END + 0.04), fade = seg(p, HOLD_END + 0.03, HOLD_END + 0.07);
    $('opFlash').style.opacity = flash; $('opHud').style.opacity = 1 - flash; world.style.visibility = flash >= 1 ? 'hidden' : 'visible';
    end.style.opacity = fade; end.classList.toggle('live', fade > 0.6); if (fade > 0.2) end.classList.add('go');
    if ('inert' in end) end.inert = fade < 0.6;
    $('opCue').style.opacity = p > 0.02 ? 0 : 1;
  }
  // Layers further from the camera are drawn larger and nearer ones smaller, by exactly the amount that makes them line up when seen head-on.
  function fit() {
    sc = Math.max(.5, Math.min(1.5, innerHeight / 650, innerWidth / 420));
    const pw = PW, ph = PH, proj = pw * sc * P / (P - TZ1), fw = clamp((innerWidth - 24) / proj, .5, 1);
    $('opScale').style.setProperty('--sc', sc); pin.style.setProperty('--fw', fw);
    // on a narrow screen the photo is cropped; slide it so the person stays in the middle of what is left
    const room = pw * (1 - fw) / 2, dx = F ? clamp((0.5 - (F.focus == null ? 50 : F.focus) / 100) * pw, -room, room) : 0;
    pin.style.setProperty('--dx', dx + 'px'); sub.style.transform = `translate3d(${dx}px,0,${Z.s}px)`; gate.style.transform = `translateZ(${Z.g}px) scale(${S(Z.g)})`; lastZb = null;
    Object.values(tags).forEach(t => {
      if (!t.dataset.z) return;
      const z = Z[t.dataset.z], s = S(z), lim = pw * fw / 2 - 10, x = clamp(+t.dataset.x + (t === tags.S || t === tags.L ? dx : 0), -lim, lim);
      t.style.transform = `translate3d(${x * s}px,${+t.dataset.y * s}px,${z + 1}px) scale(${s})` + (t.classList.contains('r') ? ' translateX(-100%)' : '');
    });
    camX = -Math.min(290, (innerWidth / 2 - 50) / (sc * P / (P - (CAMZ + TZ1))));
    camY = innerWidth < 700 ? 104 : 122;
    // push in just far enough for the photo to fill the screen (capped, so a tall phone doesn't blow it up too far)
    const need = Math.min(2, 1.03 * Math.max(innerWidth / (pw * sc), innerHeight / (ph * sc)));
    push_z = P * (1 - 1 / need) - TZ1;
    shown = -1;
  }
  // Put one photograph on the set: its two layers, where its light sits, its words and its labels.
  function use(id) {
    F = OPEN.frames[id]; if (!F) return false;
    [dull, noon, gold, fin].forEach(im => { if (im.getAttribute('src') !== F.plate) im.src = F.plate; });
    if (subImg.getAttribute('src') !== F.subject) subImg.src = F.subject;
    subImg.style.cssText += `;left:${F.box[0]}%;top:${F.box[1]}%;width:${F.box[2]}%;height:${F.box[3]}%`;
    $('opOutline').setAttribute('d', F.outline);
    pin.style.setProperty('--lx', F.light[0] + '%'); pin.style.setProperty('--ly', F.light[1] + '%');
    pin.style.setProperty('--f-dull', F.looks.dull); pin.style.setProperty('--f-lit', F.looks.lit); pin.style.setProperty('--f-hour', F.looks.hour);
    LOOK = F.subjectLooks; lastLook = '';
    const lx = F.light[0] / 100 * PW, ly = F.light[1] / 100 * PH;
    rFull = 2 * Math.max(Math.hypot(lx, ly), Math.hypot(PW - lx, ly), Math.hypot(lx, PH - ly), Math.hypot(PW - lx, PH - ly)) + 6;
    F.lines.forEach((l, i) => { const el = lines[i + 1]; el.firstChild.textContent = l[0]; el.lastChild.textContent = l[1]; });
    Object.keys(tags).forEach(k => { const t = tags[k], d = F.tags[k]; t.textContent = d[0]; t.dataset.x = d[1]; t.dataset.y = d[2]; t.dataset.z = d[3]; t.classList.toggle('r', d[4] === 'r'); });
    Array.from($('opReview').children).forEach(b => b.setAttribute && b.setAttribute('aria-pressed', b.dataset.frame === id));
    fit(); return true;
  }
  function frame() {
    const r = scene.getBoundingClientRect();
    target = clamp(-r.top / Math.max(1, r.height - innerHeight));
    p += (target - p) * 0.13; if (Math.abs(target - p) < 0.0004) p = target;
    mx += (tmx - mx) * 0.06; my += (tmy - my) * 0.06;
    const key = p + mx * 7 + my * 13;
    if (key !== shown) { paint(); shown = key; }
    if (running) raf = requestAnimationFrame(frame);
  }
  const start = () => { if (!running) { running = true; raf = requestAnimationFrame(frame); } };
  const stop = () => { running = false; cancelAnimationFrame(raf); };
  if ('IntersectionObserver' in window) new IntersectionObserver(es => es.forEach(en => en.isIntersecting ? start() : stop())).observe(scene); else start();
  if (matchMedia('(hover: hover)').matches) pin.addEventListener('pointermove', e => { tmx = (e.clientX / innerWidth - .5) * 2; tmy = (e.clientY / innerHeight - .5) * 2; });
  addEventListener('resize', fit);
  // Jump the smoothing if the page loads part-way down (refresh, or a link to a section).
  const r0 = scene.getBoundingClientRect(); p = clamp(-r0.top / Math.max(1, r0.height - innerHeight));
  // review only: flip between candidate frames
  const ids = Object.keys(OPEN.frames);
  if (OPEN.review && ids.length > 1) {
    const box = $('opReview'); box.hidden = false; box.appendChild(document.createTextNode('review'));
    ids.forEach(id => { const b = document.createElement('button'); b.type = 'button'; b.dataset.frame = id; b.textContent = OPEN.frames[id].label; b.addEventListener('click', () => { use(id); scrollTo({ top: scene.offsetTop, behavior: 'instant' }); p = 0; paint(); }); box.appendChild(b); });
  }
  if (!use(OPEN.use) && !use(ids[0])) { end.classList.add('go', 'live'); end.style.opacity = 1; return; }
  paint();
})();
