'use strict';
(() => {
  const canvas = document.getElementById('trail-canvas');
  const context = canvas?.getContext('2d');
  if (!context) return; // Server-rendered links remain visible if drawing is unavailable.
  const root = document.documentElement;
  const field = document.querySelector('.trail-field');
  const entries = [...document.querySelectorAll('.trail-entry')];
  const guide = document.querySelector('.trail-guide');
  const mode = document.getElementById('trail-mode');
  const pause = document.getElementById('trail-pause');
  const preference = matchMedia('(prefers-reduced-motion: reduce)');
  const status = document.getElementById('reading-status');
  const store = {
    get(key) { try { return sessionStorage.getItem(key); } catch { return null; } },
    set(key, value) { try { sessionStorage.setItem(key, value); } catch {} }
  };
  const clamp = n => Math.min(1, Math.max(0, n));
  const ease = n => 1 - Math.pow(1 - clamp(n), 3);
  const mix = (a, b, n) => a + (b - a) * n;
  const noise = n => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
  const navigation = performance.getEntriesByType('navigation')[0];
  const restoring = navigation?.type === 'back_forward' || Boolean(location.hash);
  let compact = store.get('lin-trail-view') === 'compact';
  let paused = store.get('lin-trail-paused') === 'true';
  let width = 0;
  let height = 0;
  let fieldTop = 0;
  let fieldHeight = 0;
  let firstY = 268;
  let mobile = false;
  let nodes = [];
  let particles = [];
  let stars;
  let frame = 0;
  let lastFrame = -Infinity;
  let clockStart = performance.now();
  let hiddenAt = null;
  let introDone = restoring || preference.matches || compact;
  let frozenTime = 0;
  const activeAnimations = new Set();
  const seen = new WeakSet();
  const rgb = () => root.dataset.theme === 'light' ? { bg: '#f4f2ec', ink: '96,86,65', gold: '145,100,36', star: '86,78,62' }
    : { bg: '#0c0c0d', ink: '211,204,185', gold: '232,195,125', star: '225,223,214' };

  function xAt(y) {
    if (mobile) return width * .105 + 11 * Math.sin((y - firstY) / 190 + .86);
    return width * .5 + Math.min(width * .172, 330) * Math.sin((y - firstY) / 207 + .9);
  }
  function slopeAt(y) {
    return mobile ? 11 / 190 * Math.cos((y - firstY) / 190 + .86)
      : Math.min(width * .172, 330) / 207 * Math.cos((y - firstY) / 207 + .9);
  }
  function makeStars() {
    stars = document.createElement('canvas');
    stars.width = Math.ceil(width);
    stars.height = Math.ceil(height);
    const sky = stars.getContext('2d');
    const colors = rgb();
    sky.fillStyle = colors.bg;
    sky.fillRect(0, 0, width, height);
    const count = Math.floor(width * height / 920);
    for (let i = 0; i < count; i++) {
      const brightness = noise(i + 7);
      const size = brightness > .975 ? 1.65 : brightness > .75 ? 1 : .6;
      sky.fillStyle = `rgba(${colors.star},${.09 + brightness * brightness * .64})`;
      sky.fillRect(noise(i + 8000) * width, noise(i + 16000) * height, size, size);
    }
  }
  function makeParticles() {
    particles = [];
    // A real character raster, rather than freely scattered point particles.
    // Cells stay on shared scanlines like the reference's small ASCII strokes.
    for (let y = firstY; y < fieldTop + fieldHeight - 45; y += 3) {
      const row = Math.round((y - firstY) / 3);
      const extent = mobile ? 7 : 10;
      for (let j = -extent; j <= extent; j++) {
        const seed = row * 31 + j + 9;
        const sigma = mobile ? 3.1 : 4.5;
        if (noise(seed + 40000) > .9 * Math.exp(-j * j / (2 * sigma * sigma))) continue;
        particles.push({ y, offset: j * 3,
          phase: noise(seed + 67000) * Math.PI * 2, alpha: .7 + noise(seed + 87000) * .3,
          glyph: ['.', '.', '.', '-', '-', '-', '-', ':', '+'][Math.floor(noise(seed + 70000) * 9)] });
      }
    }
  }
  function particleIndex(y) {
    let low = 0, high = particles.length;
    while (low < high) {
      const middle = (low + high) >>> 1;
      if (particles[middle].y < y) low = middle + 1; else high = middle;
    }
    return low;
  }
  function layout() {
    width = document.documentElement.clientWidth;
    height = innerHeight;
    mobile = width <= 700;
    const density = Math.min(devicePixelRatio || 1, 1.75);
    canvas.width = Math.round(width * density);
    canvas.height = Math.round(height * density);
    context.setTransform(density, 0, 0, density, 0, 0);
    firstY = mobile ? Math.max(292, document.querySelector('.trail-heading').getBoundingClientRect().bottom + scrollY + 62) : 268;
    fieldTop = field.getBoundingClientRect().top + scrollY;
    nodes = [];
    if (compact) {
      field.style.removeProperty('height');
    } else {
      const cardWidth = mobile ? Math.max(180, width - 95) : Math.min(350, width * .255);
      root.style.setProperty('--entry-width', `${cardWidth}px`);
      let y = firstY;
      entries.forEach((entry, index) => {
        const x = xAt(y);
        const bodyHeight = entry.offsetHeight;
        let low = x;
        let high = x;
        for (let sample = y; sample <= y + bodyHeight; sample += 8) {
          low = Math.min(low, xAt(sample));
          high = Math.max(high, xAt(sample));
        }
        let side = !mobile && slopeAt(y + bodyHeight / 2) >= 0 ? 'left' : 'right';
        // Keep full text within the viewport at intermediate tablet widths.
        if (!mobile && side === 'left' && x - cardWidth - 24 < 30) side = 'right';
        if (!mobile && side === 'right' && x + cardWidth + 24 > width - 30) side = 'left';
        entry.dataset.side = side;
        // Reserve the whole curve envelope beside a multi-line article, not just
        // the tangent at its date. This matters around the turning points.
        const left = side === 'left' ? low - cardWidth - 24 : high + 24;
        entry.style.top = `${y - fieldTop - 10}px`;
        entry.style.left = `${left}px`;
        const marker = entry.querySelector('.trail-node');
        marker.style.left = `${x - left - 3}px`;
        marker.style.right = 'auto';
        nodes.push({ x, y, index });
        y += Math.max(mobile ? 235 : 230, entry.offsetHeight + (mobile ? 65 : 60));
      });
      fieldHeight = y - fieldTop - (mobile ? 100 : 80);
      field.style.height = `${fieldHeight}px`;
      makeParticles();
    }
    makeStars();
    draw(performance.now());
  }
  function reveal(entry, delay = 0) {
    if (seen.has(entry)) return;
    seen.add(entry);
    if (preference.matches || restoring || !entry.animate || document.hidden) return;
    const animation = entry.querySelector('.trail-entry-body').animate([
      { opacity: 0, filter: 'blur(3px)', transform: 'translateY(7px)' },
      { opacity: 1, filter: 'blur(0)', transform: 'translateY(0)' }
    ], { duration: 620, delay, easing: 'cubic-bezier(.22,1,.36,1)', fill: 'backwards' });
    activeAnimations.add(animation);
    animation.finished.catch(() => {}).finally(() => activeAnimations.delete(animation));
  }

  function draw(now) {
    const colors = rgb();
    context.drawImage(stars, 0, 0, width, height);
    const elapsed = introDone ? 2100 : now - clockStart;
    const time = preference.matches || paused ? frozenTime : now / 1000;
    const dustOpacity = compact ? 0 : introDone ? 1 : ease((elapsed - 1120) / 650);
    if (!compact) {
      const top = scrollY;
      const bottom = top + height;
      context.textAlign = 'center';
      context.textBaseline = 'middle';
      // Binary search limits drawing to the visible span of the long page.
      const start = particleIndex(top - 12);
      const end = particleIndex(bottom + 12);
      context.font = '7px Consolas, monospace';
      for (let i = start; i < end; i++) {
        const p = particles[i];
        const flow = Math.sin(time * .65 + p.phase + p.y * .008) * .8;
        const edge = Math.max(.15, 1 - Math.abs(p.offset) / 55);
        const nearHead = Math.max(0, 1 - (p.y - firstY) / 220);
        const alpha = dustOpacity * p.alpha * edge * (.9 + .1 * Math.sin(time * .8 + p.phase));
        context.fillStyle = `rgba(${nearHead > .85 ? colors.gold : colors.ink},${alpha})`;
        const cellX = Math.round((xAt(p.y) + p.offset + flow) / 3) * 3;
        context.fillText(p.glyph, cellX, Math.round(p.y - top));
      }
      if (elapsed < 1900 && !introDone) {
        const forming = ease((elapsed - 390) / 820);
        const bending = ease((elapsed - 680) / 540);
        const head = { x: mix(width * .5, xAt(firstY), forming), y: mix(height * .52, firstY, bending) };
        const length = (height + 160) * ease((elapsed - 430) / 650);
        const lineAlpha = (1 - ease((elapsed - 1350) / 550)) * .66;
        context.beginPath();
        for (let y = head.y; y < Math.min(head.y + length, fieldTop + fieldHeight); y += 3) {
          const target = xAt(y);
          const straight = head.x - (y - head.y) * .6;
          const x = mix(straight, target, bending);
          if (y === head.y) context.moveTo(x, y - top); else context.lineTo(x, y - top);
        }
        context.lineWidth = .8;
        context.strokeStyle = `rgba(${colors.gold},${lineAlpha})`;
        context.stroke();
        guide.style.left = `${head.x}px`;
        guide.style.top = `${head.y - top}px`;
      } else {
        guide.style.left = `${xAt(firstY)}px`;
        guide.style.top = `${firstY - top}px`;
      }
      const headVisible = firstY - scrollY > -40 && firstY - scrollY < height + 40;
      guide.style.visibility = headVisible ? 'visible' : 'hidden';
      guide.style.opacity = `${preference.matches || paused ? 1 : .88 + .12 * Math.sin(time * 1.8)}`;
    }
    if (!introDone && elapsed >= 1950) {
      introDone = true;
      root.dataset.trailPhase = 'reading';
    }
  }
  function tick(now) {
    frame = 0;
    if (document.hidden) return;
    // Reconcile before drawing too: emulation/platform changes can update the
    // query before its change event is delivered to an existing document.
    if (pause.disabled !== (preference.matches || compact)) {
      if (preference.matches) settle();
      reflectControls();
    }
    if (preference.matches || paused || compact || now - lastFrame >= 32) { draw(now); lastFrame = now; }
    if (!preference.matches && !paused && !compact) frame = requestAnimationFrame(tick);
  }
  function schedule() {
    if (!frame && !document.hidden) frame = requestAnimationFrame(tick);
  }
  function settle() {
    introDone = true;
    root.dataset.trailPhase = 'reading';
    activeAnimations.forEach(animation => animation.cancel());
    activeAnimations.clear();
  }
  function reflectControls() {
    mode.setAttribute('aria-pressed', String(compact));
    mode.textContent = compact ? '曲线时间轴' : '紧凑列表';
    pause.setAttribute('aria-pressed', String(paused));
    pause.textContent = paused ? '继续动效' : '暂停动效';
    pause.disabled = preference.matches || compact;
    pause.hidden = compact;
  }

  root.classList.add('trail-ready');
  root.classList.toggle('trail-compact', compact);
  root.dataset.trailPhase = introDone ? 'reading' : 'forming';
  mode.hidden = false;
  pause.hidden = false;
  reflectControls();
  document.querySelector('meta[name="theme-color"]').content = rgb().bg;
  layout();
  const entryState = store.get('lin-trail-entry');
  // Shared document transition delivers its dot to the center before this curve unfolds.
  if (entryState && !introDone) {
    try { if (Date.now() - JSON.parse(entryState).time < 10000) clockStart += 350; } catch {}
  }
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(changes => {
      changes.filter(change => change.isIntersecting).forEach(change => {
        const index = entries.indexOf(change.target);
        const delay = introDone ? 0 : Math.max(0, clockStart + 1270 + Math.min(index, 3) * 80 - performance.now());
        reveal(change.target, delay);
        observer.unobserve(change.target);
      });
    }, { threshold: .08 });
    entries.forEach(entry => observer.observe(entry));
  }
  mode.addEventListener('click', () => {
    const anchor = entries.find(entry => entry.getBoundingClientRect().bottom > 90);
    settle();
    compact = !compact;
    root.classList.toggle('trail-compact', compact);
    store.set('lin-trail-view', compact ? 'compact' : 'curve');
    reflectControls();
    layout();
    if (scrollY > 200) anchor?.scrollIntoView({ block: 'start', behavior: 'instant' });
    status.textContent = compact ? '已切换为紧凑文章列表' : '已切换为曲线时间轴';
    schedule();
  });
  pause.addEventListener('click', () => {
    settle();
    paused = !paused;
    frozenTime = performance.now() / 1000;
    store.set('lin-trail-paused', String(paused));
    reflectControls();
    if (frame) cancelAnimationFrame(frame);
    frame = 0;
    draw(performance.now());
    schedule();
    status.textContent = paused ? '时间轴动效已暂停' : '时间轴动效已继续';
  });
  document.querySelectorAll('.trail-dates a').forEach(link => link.addEventListener('click', () => {
    settle();
    document.querySelector('.trail-dates').open = false;
    schedule();
  }));
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape') document.querySelector('.trail-dates').open = false;
  });
  addEventListener('scroll', () => { if (scrollY > 80 && !introDone) settle(); schedule(); }, { passive: true });
  let resizing;
  addEventListener('resize', () => {
    clearTimeout(resizing);
    resizing = setTimeout(() => { layout(); schedule(); }, 100);
  });
  // Observe text rather than the positioned field, avoiding resize/layout feedback.
  if ('ResizeObserver' in window) {
    let sizeFrame;
    const observer = new ResizeObserver(() => {
      if (sizeFrame) return;
      sizeFrame = requestAnimationFrame(() => { sizeFrame = 0; layout(); schedule(); });
    });
    entries.forEach(entry => observer.observe(entry.querySelector('.trail-entry-body')));
  }
  document.fonts?.ready.then(() => { layout(); schedule(); });
  new MutationObserver(() => {
    makeStars();
    schedule();
    document.querySelector('meta[name="theme-color"]').content = rgb().bg;
  }).observe(root, { attributes: true, attributeFilter: ['data-theme'] });
  preference.addEventListener('change', () => {
    settle();
    frozenTime = 0;
    reflectControls();
    if (frame) cancelAnimationFrame(frame);
    frame = 0;
    draw(performance.now());
    schedule();
  });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      hiddenAt = performance.now();
      if (frame) cancelAnimationFrame(frame);
      frame = 0;
    } else {
      if (hiddenAt !== null && !introDone) clockStart += performance.now() - hiddenAt;
      hiddenAt = null;
      schedule();
    }
  });
  addEventListener('pagehide', () => { if (frame) cancelAnimationFrame(frame); frame = 0; });
  addEventListener('pageshow', event => { if (event.persisted) { settle(); layout(); } schedule(); });
  schedule();
})();
