'use strict';
(() => {
  const buttons = [...document.querySelectorAll('[data-work-filter]')];
  const entries = [...document.querySelectorAll('[data-work-category]')];
  document.querySelector('.work-filters')?.removeAttribute('hidden');
  buttons.forEach(button => button.addEventListener('click', () => {
    const update = () => {
    const selected = button.dataset.workFilter;
    let visible = 0;
    buttons.forEach(item => item.setAttribute('aria-pressed', String(item === button)));
    entries.forEach(entry => {
      entry.hidden = selected !== 'all' && entry.dataset.workCategory !== selected;
      if (!entry.hidden) visible++;
    });
    document.getElementById('work-count').textContent = `${visible} 个项目`;
    };
    if (window.LinsistMotion) window.LinsistMotion.updateList(entries, update); else update();
  }));
  const dialog = document.getElementById('screen-dialog');
  if (!dialog || typeof dialog.showModal !== 'function') return;
  const image = document.getElementById('screen-dialog-image');
  const title = document.getElementById('screen-dialog-title');
  let trigger;
  document.querySelectorAll('a.screen-link').forEach(link => link.addEventListener('click', event => {
    if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey || event.button !== 0) return;
    event.preventDefault();
    trigger = link;
    const source = link.querySelector('img');
    image.src = link.href;
    image.alt = source.alt;
    title.textContent = link.dataset.screenLabel;
    dialog.classList.toggle('is-phone', Number(source.getAttribute('width')) < Number(source.getAttribute('height')));
    dialog.showModal();
    dialog.scrollTop = 0;
    document.body.classList.add('screen-open');
    document.getElementById('screen-close').focus();
  }));
  document.getElementById('screen-close').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', event => {
    if (event.target !== dialog) return;
    const bounds = dialog.getBoundingClientRect();
    if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) dialog.close();
  });
  dialog.addEventListener('close', () => {
    document.body.classList.remove('screen-open');
    trigger?.focus({ preventScroll: true });
    image.removeAttribute('src');
  });
})();
