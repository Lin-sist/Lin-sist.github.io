'use strict';
(() => {
  const preference = matchMedia('(prefers-reduced-motion: reduce)');
  const easing = 'cubic-bezier(.22,1,.36,1)';
  const running = new Map();
  const seen = new WeakSet();
  let observer;
  let trailSource;
  const inView = element => {
    const rect = element.getBoundingClientRect();
    return rect.width > 0 && rect.height > 0 && rect.bottom > 0 && rect.top < innerHeight;
  };
  function play(element, frames, duration = 520, delay = 0) {
    running.get(element)?.cancel();
    if (preference.matches || typeof element.animate !== 'function' || document.hidden) return;
    const animation = element.animate(frames, { duration, delay, easing, fill: 'backwards' });
    running.set(element, animation);
    animation.finished.catch(() => {}).finally(() => {
      if (running.get(element) === animation) running.delete(element);
    });
  }
  function updateList(elements, update) {
    const before = new Map(elements.filter(element => !element.hidden).map(element => [element, element.getBoundingClientRect()]));
    elements.forEach(element => { running.get(element)?.cancel(); running.delete(element); });
    update();
    elements.filter(element => !element.hidden).forEach((element, index) => {
      seen.add(element); observer?.unobserve(element);
      if (!inView(element)) return;
      const previous = before.get(element);
      const current = element.getBoundingClientRect();
      const dx = previous ? previous.left - current.left : 0;
      const dy = previous ? previous.top - current.top : 10;
      if (!previous || Math.abs(dx) + Math.abs(dy) > 1) {
        play(element, [{ transform: `translate(${dx}px,${dy}px)`, opacity: previous ? 1 : .35 }, { transform: 'none', opacity: 1 }], 320, Math.min(index * 35, 70));
      }
    });
  }
  window.LinsistMotion = Object.freeze({ updateList, isReduced: () => preference.matches });
  preference.addEventListener('change', () => {
    if (preference.matches) {
      running.forEach(animation => animation.cancel()); running.clear();
    }
  });

  // Native document navigation: no fetch router, delayed clicks or cloned pages.
  const casePath = path => /\/work\/(rag|flashback)\/$/.test(path);
  function sharedCover(from, to) {
    if (!from || !to || from.origin !== to.origin || casePath(from.pathname) === casePath(to.pathname)) return null;
    const path = casePath(from.pathname) ? from.pathname : to.pathname;
    const container = casePath(location.pathname) ? document.querySelector('.case-figure .project-stage')
      : [...document.querySelectorAll('a.project-image, a.cover-link')].find(link => new URL(link.href).pathname === path);
    const asset = path.includes('/flashback/') ? 'flashback-home.webp' : 'rag-login.webp';
    return [...(container?.querySelectorAll('img') || [])].find(image => new URL(image.src).pathname.endsWith('/' + asset));
  }
  function nameCover(transition, from, to, incoming) {
    if (!transition) return;
    if (preference.matches) { transition.skipTransition(); return; }
    document.documentElement.dataset.motionNavigation = 'page';
    const end = () => { delete document.documentElement.dataset.motionNavigation; };
    transition.finished.then(end, end);
    if (/\/archives\/$/.test(to?.pathname || '') && from?.pathname !== to.pathname) {
      let selected;
      try { selected = JSON.parse(sessionStorage.getItem('lin-trail-entry') || 'null'); } catch {}
      const fresh = selected && Date.now() - selected.time < 10000;
      const light = incoming ? document.querySelector('.trail-guide') : trailSource;
      // pagereveal may precede the deferred renderer: expose its landing point
      // before the browser captures the new document's shared-element snapshot.
      if (fresh && incoming && light) light.style.display = 'block';
      if (fresh && light && inView(light)) {
        light.style.viewTransitionName = 'trail-light';
        document.documentElement.dataset.motionNavigation = 'trail';
        const cleanup = () => {
          light.style.removeProperty('view-transition-name');
          if (incoming) {
            light.style.removeProperty('display');
            try { sessionStorage.removeItem('lin-trail-entry'); } catch {}
          }
        };
        (incoming ? transition.ready : transition.finished).then(cleanup, cleanup);
      }
      return;
    }
    const cover = sharedCover(from, to);
    if (!cover || !inView(cover)) return;
    cover.style.viewTransitionName = 'project-cover';
    document.documentElement.dataset.motionNavigation = 'cover';
    const cleanup = () => {
      cover.style.removeProperty('view-transition-name');
    };
    (incoming ? transition.ready : transition.finished).then(cleanup, cleanup);
  }
  addEventListener('pageswap', event => {
    const activation = event.activation;
    if (!activation?.entry || !event.viewTransition) return;
    nameCover(event.viewTransition, new URL(location.href), new URL(activation.entry.url), false);
  });
  addEventListener('pagereveal', event => {
    const activation = window.navigation?.activation;
    if (!activation?.from || !event.viewTransition) return;
    nameCover(event.viewTransition, new URL(activation.from.url), new URL(location.href), true);
  });

  document.addEventListener('click', event => {
    if (event.defaultPrevented || event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
    const link = event.target.closest('a[data-trail-entry]');
    if (!link || link.target || preference.matches) return;
    const light = link.querySelector('.trail-origin');
    if (!light) return;
    trailSource = light;
    try { sessionStorage.setItem('lin-trail-entry', JSON.stringify({ href: link.href, top: light.getBoundingClientRect().top, time: Date.now() })); } catch {}
  }, { capture: true });

  function init() {
    // Content is visible by default. Missing JS/WAAPI/IntersectionObserver remains readable.
    if ('IntersectionObserver' in window) {
      observer = new IntersectionObserver(entries => {
        const entering = entries.filter(entry => entry.isIntersecting && !seen.has(entry.target))
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        entering.forEach((entry, index) => {
          seen.add(entry.target); observer.unobserve(entry.target);
          if (document.documentElement.dataset.motionNavigation) return;
          play(entry.target, [{ opacity: .35, transform: 'translateY(12px)' }, { opacity: 1, transform: 'none' }], 520, Math.min(index * 55, 165));
        });
      }, { threshold: .04 });
      document.querySelectorAll('.reveal,.work-intro,.work-entry,.case-intro,.case-figure,.case-overview,.case-principles>div,.product-quote,.case-gallery>header,.screen-feature,.case-flow,.case-decisions,.case-evidence,.case-writing,.next-work').forEach(element => observer.observe(element));
    }

    // Animate only intentional anchor clicks, leaving restoration and normal scrolling native.
    document.addEventListener('click', event => {
      if (event.defaultPrevented || event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
      const link = event.target.closest('a[href]');
      if (!link || link.target || link.hasAttribute('download') || link.classList.contains('skip-link')) return;
      const url = new URL(link.href);
      if (url.origin !== location.origin || url.pathname !== location.pathname || url.search !== location.search || !url.hash) return;
      let target;
      try { target = document.getElementById(decodeURIComponent(url.hash.slice(1))); } catch { return; }
      if (!target) return;
      event.preventDefault();
      if (url.href !== location.href) history.pushState(history.state, '', url.href);
      target.scrollIntoView({ behavior: preference.matches ? 'instant' : 'smooth', block: 'start' });
    });

    // A single indicator travels along the outline instead of blinking between items.
    const nav = document.querySelector('.toc-body nav');
    if (nav) {
      const marker = document.createElement('span');
      marker.className = 'toc-current-marker'; marker.setAttribute('aria-hidden', 'true');
      nav.append(marker); nav.classList.add('has-toc-marker');
      let scheduled = false;
      const update = () => {
        scheduled = false;
        const active = nav.querySelector('a[aria-current="location"]');
        marker.classList.toggle('is-active', Boolean(active));
        if (!active) return;
        const rect = active.getBoundingClientRect();
        const height = Math.min(22, rect.height - 8);
        marker.style.height = `${height}px`;
        marker.style.transform = `translateY(${rect.top - nav.getBoundingClientRect().top + nav.scrollTop + (rect.height - height) / 2}px)`;
      };
      const schedule = () => { if (!scheduled) { scheduled = true; requestAnimationFrame(update); } };
      new MutationObserver(schedule).observe(nav, { subtree: true, attributes: true, attributeFilter: ['aria-current'] });
      if ('ResizeObserver' in window) { const resize = new ResizeObserver(schedule); resize.observe(nav); if (nav.querySelector('ol')) resize.observe(nav.querySelector('ol')); }
      document.querySelector('.reading-toc')?.addEventListener('toggle', schedule);
      addEventListener('resize', schedule); schedule();
    }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
  else init();
})();
