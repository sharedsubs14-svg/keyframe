/* Small helpers for the top of the page.
   On phones: the start boxes get a shorter question, and a "Start directing" button stays pinned at the bottom
   while you are between the slop storm and the Playground (the end of the walk-through has its own box). */
(function () {
  const $ = (id) => document.getElementById(id);

  // a shorter question fits a phone's box
  if (matchMedia('(max-width: 640px)').matches) document.querySelectorAll('form[data-start] input').forEach(i => { i.placeholder = 'What\'s your idea?'; });

  // ---- phones: the pinned "Start directing" button ----
  const cta = $('mcta'), storm = $('storm'), play = $('play'), opEnd = $('opEnd');
  if (!cta || !storm || !play) return;
  let on = false, queued = false;
  const check = () => {
    queued = false;
    const past = storm.getBoundingClientRect().bottom < 60;
    const before = play.getBoundingClientRect().top > innerHeight * 0.35;
    const storyAsks = opEnd && opEnd.classList.contains('live');
    const want = past && before && !storyAsks;
    if (want !== on) { on = want; cta.classList.toggle('show', on); cta.setAttribute('aria-hidden', on ? 'false' : 'true'); cta.tabIndex = on ? 0 : -1; }
  };
  addEventListener('scroll', () => { if (!queued) { queued = true; requestAnimationFrame(check); } }, { passive: true });
  addEventListener('resize', check);
  check();
})();
