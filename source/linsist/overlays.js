'use strict';
(() => {
  function renderResults(container, posts, base) {
    const fragment = document.createDocumentFragment();
    posts.forEach(post => {
      const link = document.createElement('a');
      link.href = new URL(post.path, base).href;
      link.className = 'search-result';
      const date = document.createElement('time');
      date.className = 'search-date';
      date.dateTime = post.date || '';
      date.textContent = (post.date || '').replaceAll('-', '.');
      const title = document.createElement('h3');
      title.textContent = post.title;
      const topic = document.createElement('p');
      topic.textContent = [...(post.tags || []), ...(post.categories || [])].filter((item, index, all) => all.indexOf(item) === index).join(' · ');
      const arrow = document.createElement('span');
      arrow.className = 'search-result-arrow';
      arrow.setAttribute('aria-hidden', 'true');
      arrow.textContent = '↗';
      link.append(date, title, topic, arrow);
      fragment.append(link);
    });
    container.replaceChildren(fragment);
    container.scrollTop = 0;
  }
  window.LinsistSearch = Object.freeze({ renderResults });

  const dialogs = [...document.querySelectorAll('#search-dialog, #screen-dialog')];
  const update = () => document.documentElement.classList.toggle('overlay-open', dialogs.some(dialog => dialog.open));
  dialogs.forEach(dialog => new MutationObserver(update).observe(dialog, { attributes: true, attributeFilter: ['open'] }));
  const viewport = window.visualViewport;
  if (viewport) {
    const fitViewport = () => {
      dialogs.forEach(dialog => {
        dialog.style.setProperty('--overlay-height', `${viewport.height}px`);
        dialog.style.setProperty('--overlay-top', `${viewport.offsetTop}px`);
      });
    };
    viewport.addEventListener('resize', fitViewport);
    viewport.addEventListener('scroll', fitViewport);
    fitViewport();
  }
})();
