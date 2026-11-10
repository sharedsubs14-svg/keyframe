/* Phone and touch layer for The Sunday Shoot.
   1. Under 860px wide, the before/after drag slider becomes a row of
      swipeable pairs, each showing prompted above directed.
   2. On touch screens (and narrow screens) the hover orb gallery becomes a
      swipeable 3D film strip. Tapping the centre frame opens the lightbox. */
(function () {
  'use strict';

  var PAIRS = [
    ['assets/pairs/p3-before.webp', 'assets/pairs/p3-after.webp'],
    ['assets/pairs/p4-before.webp', 'assets/pairs/p4-after.webp'],
    ['assets/pairs/p5-before.webp', 'assets/pairs/p5-after.webp'],
    ['assets/pairs/p1-before.jpg', 'assets/pairs/p1-after.jpg'],
    ['assets/pairs/p2-before.jpg', 'assets/pairs/p2-after.jpg']
  ];

  var root = document.documentElement;
  var narrow = window.matchMedia('(max-width: 859px)');
  var touch = window.matchMedia('(hover: none), (pointer: coarse)');
  var calm = window.matchMedia('(prefers-reduced-motion: reduce)');

  function modes() {
    root.classList.toggle('kfx-m', narrow.matches);
    root.classList.toggle('kfx-t', narrow.matches || touch.matches);
  }
  modes();
  [narrow, touch].forEach(function (m) {
    if (m.addEventListener) m.addEventListener('change', modes); else if (m.addListener) m.addListener(modes);
  });

  var clamp = function (v, a, b) { return v < a ? a : v > b ? b : v; };
  var ease = function (t) { return t * t * (3 - 2 * t); };
  var lerp = function (a, b, t) { return a + (b - a) * t; };
  function el(tag, cls, html) { var e = document.createElement(tag); if (cls) e.className = cls; if (html) e.innerHTML = html; return e; }

  /* ---------------- before / after: swipeable stacked pairs ----------------
     Under 860px wide the drag slider is swapped for plain frames: each pair
     shows prompted on top and directed underneath, and the five pairs sit in
     a row you swipe through sideways. */

  var ba = null;

  function buildBA() {
    var prev = document.querySelector('button[aria-label="Previous frame"]');
    if (!prev) return false;
    var reel = prev.parentElement && prev.parentElement.parentElement;
    var section = reel && reel.closest('section');
    if (!section) return false;
    reel.classList.add('kfx-ba-hide');

    var wrap = el('div', 'kfx-ba');
    wrap.setAttribute('aria-label', 'Prompted and directed frames');
    var track = el('div', 'kfx-ba-track');
    var slides = PAIRS.map(function (p, i) {
      var slide = el('figure', 'kfx-ba-slide');
      [[p[0], 'Prompted', 'kfx-ba-pro'], [p[1], 'Directed', 'kfx-ba-dir']].forEach(function (x) {
        var box = el('div', 'kfx-ba-shot ' + x[2]);
        var img = new Image(); img.alt = x[1] + ' frame ' + (i + 1); img.decoding = 'async';
        img.loading = i < 2 ? 'eager' : 'lazy'; img.src = x[0];
        img.onerror = function () { img.style.visibility = 'hidden'; };
        box.appendChild(img);
        box.appendChild(el('span', 'kfx-ba-tag', '<i></i>' + x[1]));
        slide.appendChild(box);
      });
      track.appendChild(slide);
      return slide;
    });
    var meta = el('div', 'kfx-ba-meta', '<span class="kfx-ba-n">01 / ' + String(PAIRS.length).padStart(2, '0') + '</span><span class="kfx-ba-dots">' + PAIRS.map(function () { return '<b></b>'; }).join('') + '</span><span>swipe</span>');
    wrap.appendChild(track); wrap.appendChild(meta);
    section.appendChild(wrap);

    ba = { wrap: wrap, track: track, slides: slides, n: meta.querySelector('.kfx-ba-n'), dots: meta.querySelectorAll('.kfx-ba-dots b'), dirty: true, sig: '' };
    track.addEventListener('scroll', function () { ba && (ba.dirty = true); }, { passive: true });
    return true;
  }

  function drawBA() {
    if (!ba || !ba.dirty || !root.classList.contains('kfx-m')) return;
    ba.dirty = false;
    var t = ba.track, mid = t.scrollLeft + t.clientWidth / 2, best = 0, bestD = 1e9;
    ba.slides.forEach(function (s, i) {
      var d = Math.abs(s.offsetLeft + s.offsetWidth / 2 - mid);
      if (d < bestD) { bestD = d; best = i; }
    });
    var n = String(best + 1).padStart(2, '0') + ' / ' + String(PAIRS.length).padStart(2, '0');
    if (ba.n.textContent !== n) ba.n.textContent = n;
    Array.prototype.forEach.call(ba.dots, function (d, i) { d.classList.toggle('on', i === best); });
  }

  /* ---------------- touch gallery ---------------- */

  var fl = null;

  function buildFlow() {
    var orb = document.querySelector('[data-orb-stage]');
    if (!orb) return false;
    var tiles = Array.prototype.slice.call(orb.querySelectorAll('[data-orb]'));
    var srcs = tiles.map(function (t) { var i = t.querySelector('img'); return i && i.getAttribute('src'); });
    if (!tiles.length || srcs.some(function (s) { return !s; })) return false;
    var section = orb.closest('section');
    orb.classList.add('kfx-orb-hide');

    var wrap = el('div', 'kfx-flow');
    var track = el('div', 'kfx-flow-track');
    track.appendChild(el('div', 'kfx-flow-pad'));
    var cards = srcs.map(function (src, i) {
      var c = el('button', 'kfx-card');
      c.type = 'button';
      c.setAttribute('aria-label', 'Open frame ' + (i + 1));
      var img = new Image(); img.alt = tiles[i].getAttribute('title') || ''; img.loading = i < 6 ? 'eager' : 'lazy'; img.decoding = 'async'; img.src = src;
      c.appendChild(img);
      c.addEventListener('click', function () {
        if (fl && fl.cur === i) tiles[i].click();
        else centre(i, true);
      });
      track.appendChild(c);
      return c;
    });
    track.appendChild(el('div', 'kfx-flow-pad'));
    var meta = el('div', 'kfx-flow-meta', '<span class="kfx-flow-n">01 / ' + String(cards.length).padStart(2, '0') + '</span><span class="kfx-flow-bar"><i></i></span><span>swipe · tap to open</span>');
    wrap.appendChild(track); wrap.appendChild(meta);
    section.appendChild(wrap);

    fl = { wrap: wrap, track: track, cards: cards, n: meta.querySelector('.kfx-flow-n'), bar: meta.querySelector('.kfx-flow-bar i'), cur: 0, pads: track.querySelectorAll('.kfx-flow-pad') };
    track.addEventListener('scroll', function () { fl.dirty = true; }, { passive: true });
    layout();
    return true;
  }

  function centre(i, smooth) {
    var c = fl.cards[i]; if (!c) return;
    var left = c.offsetLeft + c.offsetWidth / 2 - fl.track.clientWidth / 2;
    fl.track.scrollTo({ left: left, behavior: smooth ? 'smooth' : 'auto' });
  }

  function layout() {
    if (!fl) return;
    var tw = fl.track.clientWidth || window.innerWidth, vh = window.innerHeight;
    // uniform tall cards, cropped to fill; the lightbox shows each frame uncropped.
    // neighbours always peek in from both sides so the tilt reads.
    var w = Math.min(tw * (tw < 600 ? 0.68 : 0.36), 460), h = Math.min(w * 1.38, vh * 0.62);
    fl.cards.forEach(function (c) { c.style.width = w.toFixed(1) + 'px'; c.style.height = h.toFixed(1) + 'px'; });
    var first = fl.cards[0], last = fl.cards[fl.cards.length - 1];
    fl.pads[0].style.width = Math.max(0, (tw - first.offsetWidth) / 2 - 14) + 'px';
    fl.pads[1].style.width = Math.max(0, (tw - last.offsetWidth) / 2 - 14) + 'px';
    fl.dirty = true;
  }

  function drawFlow() {
    if (!fl || !fl.dirty || !root.classList.contains('kfx-t')) return;
    fl.dirty = false;
    var tr = fl.track.getBoundingClientRect(), mid = tr.left + tr.width / 2;
    var best = 0, bestD = 1e9;
    fl.cards.forEach(function (c, i) {
      var r = c.getBoundingClientRect();
      var cx = r.left + r.width / 2, d = (cx - mid) / (tr.width * 0.55);
      var ad = Math.abs(d);
      if (ad < bestD) { bestD = ad; best = i; }
      if (ad > 2.2) { c.style.transform = 'none'; c.style.opacity = 0.3; return; }
      var rot = clamp(-d * 42, -55, 55);
      var z = -Math.min(1.4, ad) * 140;
      var sc = 1 - Math.min(1, ad) * 0.12;
      c.style.transform = 'translateZ(' + z.toFixed(1) + 'px) rotateY(' + rot.toFixed(2) + 'deg) scale(' + sc.toFixed(3) + ')';
      c.style.opacity = (1 - Math.min(1, ad) * 0.45).toFixed(3);
      c.style.filter = ad > 0.08 ? 'brightness(' + (1 - Math.min(1, ad) * 0.35).toFixed(2) + ')' : 'none';
      c.style.zIndex = 100 - Math.round(ad * 20);
      c.style.setProperty('--shine', (Math.max(0, 1 - ad * 3)).toFixed(2));
    });
    fl.cur = best;
    var n = String(best + 1).padStart(2, '0') + ' / ' + String(fl.cards.length).padStart(2, '0');
    if (fl.n.textContent !== n) fl.n.textContent = n;
    fl.bar.style.width = ((best + 1) / fl.cards.length * 100).toFixed(1) + '%';
  }

  /* ---------------- boot ---------------- */

  /* ---------------- glass: theme flag, big-card tagging, scroll sheen ---------------- */

  var lastSheen = '';
  function glass() {
    var sy = window.scrollY || document.documentElement.scrollTop || 0;
    // the sheen slides across a card once per screen of scrolling
    var v = ((((sy / (window.innerHeight || 800)) % 1) + 1) % 1) * 120 - 60;
    var str = v.toFixed(1);
    if (str !== lastSheen) { lastSheen = str; root.style.setProperty('--kfx-sheen', str); }
  }
  function tagGlass() {
    var bg = getComputedStyle(document.body).backgroundColor;
    root.classList.toggle('kfx-light', bg === 'rgb(245, 241, 234)');
    var vw = window.innerWidth;
    document.querySelectorAll('[style*="backdrop-filter"][style*="border-radius"]').forEach(function (e) {
      if (e.hasAttribute('data-rise') || e.classList.contains('kfx-glass')) return;
      if (e.offsetWidth > vw * 0.6 && e.offsetHeight > 180 && getComputedStyle(e).position === 'static') e.classList.add('kfx-glass');
    });
  }
  setInterval(tagGlass, 500);

  function loop() {
    try { drawBA(); drawFlow(); glass(); } catch (e) {}
    requestAnimationFrame(loop);
  }

  // the page renders more than once while it boots, so rebuild anything that got swapped out
  setInterval(function () {
    var prev = document.querySelector('button[aria-label="Previous frame"]');
    if (ba && (!ba.wrap.isConnected || (prev && !prev.parentElement.parentElement.classList.contains('kfx-ba-hide')))) {
      if (ba.wrap.parentNode) ba.wrap.parentNode.removeChild(ba.wrap);
      ba = null; try { buildBA(); } catch (e) {}
    }
    if (fl && (!fl.wrap.isConnected || !document.querySelector('[data-orb-stage].kfx-orb-hide'))) {
      if (fl.wrap.parentNode) fl.wrap.parentNode.removeChild(fl.wrap);
      fl = null; try { buildFlow(); } catch (e) {}
    }
  }, 400);

  var tries = 0;
  (function boot() {
    var okA = ba, okB = fl;
    try { okA = okA || buildBA(); } catch (e) { if (window.console) console.error('[kfx] before/after', e); }
    try { okB = okB || buildFlow(); } catch (e) { if (window.console) console.error('[kfx] gallery', e); }
    if ((!okA || !okB) && ++tries < 150) setTimeout(boot, 200);
  })();
  requestAnimationFrame(loop);

  window.addEventListener('resize', function () { if (ba) ba.dirty = true; layout(); }, { passive: true });
})();
