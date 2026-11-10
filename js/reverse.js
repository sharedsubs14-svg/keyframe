/* REVERSE SLATE: drop in any frame, get the five decisions behind it, then open them on the board. */
(function () {
  function start() {
    const A = window.SLATE_APP, O = window.SLATE_OPTIONS;
    if (!A || !document.getElementById('reverse')) return;
    const $ = (s, el) => (el || document).querySelector(s);
    const URL_ = A.CFG.REVERSE_URL || '/.netlify/functions/reverse';
    const ROWS = [['S', 'Subject', []], ['L', 'Light', ['l', 'env']], ['A', 'Camera', ['a', 'lens']], ['T', 'Hour', ['t']], ['E', 'Emotion', ['em', 'e']]];
    let read = null, busy = false;
    const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

    function paint() {
      const host = $('#rRows'); host.innerHTML = '';
      ROWS.forEach(([L, word, keys], n) => {
        let val = '', why = '', unsure = false;
        if (read) {
          if (L === 'S') val = read.subject || '';
          else { const got = keys.map(k => read[k] ? [A.LISTS[k][read[k].i].name, read[k]] : null).filter(Boolean); val = got.map(g => g[0]).join(' · '); why = got.map(g => g[1].why).filter(Boolean).join(' '); unsure = got.some(g => !g[1].sure); }
        }
        host.insertAdjacentHTML('beforeend', `<li class="rrow${read ? ' on' : ''}" style="--i:${n}"><b>${L}</b><div><span class="rk">${word}${unsure ? ' <em>probably</em>' : ''}</span><p class="rv">${val ? esc(val) : '<i>waiting for a frame</i>'}</p>${why ? `<p class="rw">${esc(why)}</p>` : ''}</div></li>`);
      });
      $('#rOpen').disabled = !read;
    }
    const sheetOf = (r) => { const st = { own: { s: r.subject || '', l: '', a: '', t: '', e: '' }, source: {} }; ['l', 'env', 'a', 'lens', 't', 'em', 'e'].forEach(k => { if (r[k]) { st[k] = r[k].i; st.source[k] = 'auto'; } }); return st; };

    // Preview stand-in: a rough read from the pixels, so the flow can be tried before the backend exists.
    function roughRead(cv) {
      const x = cv.getContext('2d'), d = x.getImageData(0, 0, cv.width, cv.height).data; let R = 0, G = 0, B = 0, top = 0, n = 0, tn = 0;
      for (let i = 0; i < d.length; i += 16) { const y = (i / 4 / cv.width) | 0, lum = d[i] * 0.3 + d[i + 1] * 0.59 + d[i + 2] * 0.11; R += d[i]; G += d[i + 1]; B += d[i + 2]; n++; if (y < cv.height * 0.35) { top += lum; tn++; } }
      R /= n; G /= n; B /= n; const lum = R * 0.3 + G * 0.59 + B * 0.11, warm = R - B, ar = cv.width / cv.height, sky = top / Math.max(1, tn);
      const t = lum < 55 ? 5 : lum < 95 ? (warm > 12 ? 1 : 4) : warm > 28 ? 1 : Math.abs(warm) < 10 && sky > 150 ? 3 : 2;
      const l = lum < 55 ? 5 : lum < 95 ? (warm > 12 ? 3 : 7) : lum > 170 ? 6 : 4;
      return { subject: 'One figure, mid-frame, holding still', l: { i: l, sure: false, why: lum < 95 ? 'Most of the frame sits in shadow.' : 'Light is broad and even across the frame.' }, env: { i: lum < 95 ? 0 : 3, sure: false, why: '' },
        a: { i: 0, sure: false, why: 'Horizon sits near the middle of the frame.' }, lens: { i: ar > 2.1 ? 5 : 2, sure: false, why: ar > 2.1 ? 'The frame is scope-wide.' : '' },
        t: { i: t, sure: lum < 55 || warm > 28, why: lum < 55 ? 'Very little ambient light.' : warm > 12 ? 'Warm light, low in the frame.' : 'Cool, even ambient light.' }, em: { i: lum < 95 ? 3 : 6, sure: false, why: '' }, e: { i: lum < 55 ? 0 : warm > 28 ? 4 : 5, sure: false, why: '' } };
    }
    async function take(f) {
      const msg = $('#rMsg'); msg.textContent = '';
      if (!f || busy) return;
      if (!/^image\//.test(f.type)) { msg.textContent = 'That file is not an image.'; return; }
      if (f.size > 25e6) { msg.textContent = 'That image is over 25 MB. Export a smaller copy.'; return; }
      let session = null;
      if (!A.DEMO && A.supa) { session = await A.currentSession(); if (!session) { A.openAuth('reverse'); return; } }
      busy = true; const drop = $('#rDrop'); drop.classList.add('busy');
      try {
        const src = window.createImageBitmap ? await createImageBitmap(f, { imageOrientation: 'from-image' }) : await new Promise((res, rej) => { const im = new Image(); im.onload = () => res(im); im.onerror = rej; im.src = URL.createObjectURL(f); });
        const s = Math.min(1, 1024 / Math.max(src.width, src.height)), cv = document.createElement('canvas'); cv.width = Math.round(src.width * s); cv.height = Math.round(src.height * s); cv.getContext('2d').drawImage(src, 0, 0, cv.width, cv.height);
        $('#rPrev').src = cv.toDataURL('image/jpeg', 0.85); drop.classList.add('has');
        if (session) {
          const r = await fetch(URL_, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + session.access_token }, body: JSON.stringify({ image: $('#rPrev').src.split(',')[1] }) });
          const data = await r.json().catch(() => ({})); if (!r.ok) throw new Error(data.error || 'That did not go through. Try again in a minute.');
          read = data.read;
        } else { await new Promise(r => setTimeout(r, 1100)); read = roughRead(cv); A.toast('PREVIEW READ · THE LIVE SITE READS IT WITH CLAUDE'); }
        paint();
      } catch (e) { msg.textContent = e.message || 'That image could not be opened. Try a JPG or PNG.'; }
      finally { busy = false; drop.classList.remove('busy'); }
    }
    $('#rPick').addEventListener('click', () => $('#rFile').click());
    $('#rFile').addEventListener('change', e => { take(e.target.files[0]); e.target.value = ''; });
    const drop = $('#rDrop');
    ['dragenter', 'dragover'].forEach(ev => drop.addEventListener(ev, e => { e.preventDefault(); drop.classList.add('over'); }));
    ['dragleave', 'drop'].forEach(ev => drop.addEventListener(ev, e => { e.preventDefault(); drop.classList.remove('over'); }));
    drop.addEventListener('drop', e => take(e.dataTransfer.files[0]));
    $('#rOpen').addEventListener('click', () => { if (read) A.openSheet(sheetOf(read)); });
    paint();
  }
  if (window.SLATE_APP) start(); else document.addEventListener('slate:ready', start, { once: true });
})();
