'use strict';
(() => {
  const $ = selector => document.querySelector(selector);
  const storage = {
    get(key) { try { return localStorage.getItem(key); } catch { return null; } },
    set(key, value) { try { localStorage.setItem(key, value); } catch {} }
  };
  const status = $('#reading-status');
  const announce = message => { status.textContent = message; };
  const themeButton = $('.theme-toggle');
  function reflectTheme() {
    const light = document.documentElement.dataset.theme === 'light';
    themeButton.setAttribute('aria-label', light ? '切换为深色主题' : '切换为浅色主题');
    $('meta[name="theme-color"]').content = light ? '#f4f3ef' : '#0b1420';
  }
  themeButton.addEventListener('click', () => {
    const next = document.documentElement.dataset.theme === 'light' ? 'dark' : 'light';
    document.documentElement.dataset.theme = next;
    storage.set('lin-theme', next);
    reflectTheme();
  });
  reflectTheme();

  const menu = $('#mobile-nav');
  const menuButton = $('.menu-toggle');
  function closeMenu() {
    menu.hidden = true;
    menuButton.setAttribute('aria-expanded', 'false');
    menuButton.setAttribute('aria-label', '打开导航菜单');
  }
  menuButton.addEventListener('click', () => {
    const open = menu.hidden;
    menu.hidden = !open;
    menuButton.setAttribute('aria-expanded', String(open));
    menuButton.setAttribute('aria-label', open ? '关闭导航菜单' : '打开导航菜单');
  });
  menu.querySelectorAll('a').forEach(link => link.addEventListener('click', closeMenu));

  const body = $('#article-container');
  const toc = $('.reading-toc');
  const mobile = matchMedia('(max-width: 860px)');
  function responsiveTools() { toc.open = !mobile.matches; closeMenu(); }
  responsiveTools();
  mobile.addEventListener('change', responsiveTools);
  const tocLinks = [...document.querySelectorAll('.toc-body li a')];
  const headings = tocLinks.map(link => document.getElementById(decodeURIComponent(link.hash.slice(1))));
  const progress = $('#reading-progress');
  const percentage = $('#reading-percent');
  let scheduled = false;
  let active = -1;
  function updateReading() {
    scheduled = false;
    const start = body.getBoundingClientRect().top + scrollY - 110;
    const distance = Math.max(1, body.offsetHeight - innerHeight + 150);
    const fraction = Math.min(1, Math.max(0, (scrollY - start) / distance));
    progress.style.transform = `scaleX(${fraction})`;
    percentage.textContent = `${Math.round(fraction * 100)}%`;
    let next = -1;
    headings.forEach((heading, index) => { if (heading && heading.getBoundingClientRect().top <= 155) next = index; });
    if (next !== active) {
      tocLinks.forEach((link, index) => {
        if (index === next) link.setAttribute('aria-current', 'location');
        else link.removeAttribute('aria-current');
      });
      active = next;
      if (next >= 0 && !mobile.matches) {
        const nav = $('.toc-body nav');
        const link = tocLinks[next];
        const delta = link.getBoundingClientRect().top - nav.getBoundingClientRect().top;
        if (delta < 0 || delta > nav.clientHeight - link.offsetHeight) nav.scrollTop += delta - nav.clientHeight / 3;
      }
    }
  }
  function scheduleReading() { if (!scheduled) { scheduled = true; requestAnimationFrame(updateReading); } }
  addEventListener('scroll', scheduleReading, { passive: true });
  addEventListener('resize', scheduleReading);
  addEventListener('pageshow', scheduleReading);
  new ResizeObserver(scheduleReading).observe(body);
  const smaller = $('#font-smaller');
  const larger = $('#font-larger');
  let size = Number(storage.get('lin-reading-size')) || 18;
  function reflectSize() {
    size = Math.max(16, Math.min(22, size));
    document.documentElement.style.setProperty('--reading-size', `${size}px`);
    $('#font-size').value = String(size);
    smaller.disabled = size === 16;
    larger.disabled = size === 22;
    scheduleReading();
  }
  function changeSize(delta) { size += delta; reflectSize(); storage.set('lin-reading-size', String(size)); announce(`正文字号已调整为 ${size}`); }
  smaller.addEventListener('click', () => changeSize(-1));
  larger.addEventListener('click', () => changeSize(1));
  $('.reading-tools').hidden = false;
  reflectSize();

  // Tables and code scroll locally; the page itself stays within the viewport.
  body.querySelectorAll('table').forEach(table => {
    if (table.closest('figure.highlight')) return;
    const wrapper = document.createElement('div');
    wrapper.className = 'table-scroll';
    wrapper.tabIndex = 0;
    wrapper.setAttribute('role', 'region');
    wrapper.setAttribute('aria-label', '文章表格，可横向滚动');
    table.before(wrapper); wrapper.append(table);
  });
  body.querySelectorAll('.headerlink').forEach(link => {
    link.setAttribute('aria-label', `跳转到章节：${link.parentElement.textContent.trim()}`);
  });
  async function copy(text, button, original) {
    try {
      await navigator.clipboard.writeText(text);
      button.textContent = '已复制';
      announce('已复制到剪贴板');
    } catch {
      button.textContent = '复制失败';
      announce('复制失败，请手动选中文字复制。');
    }
    setTimeout(() => { button.textContent = original; }, 1800);
  }
  body.querySelectorAll('figure.highlight, pre').forEach(block => {
    if (block.tagName === 'PRE' && block.closest('figure.highlight')) return;
    const holder = block.tagName === 'PRE' ? document.createElement('figure') : block;
    if (holder !== block) { holder.className = 'highlight'; block.before(holder); holder.append(block); }
    const scroll = document.createElement('div');
    scroll.className = 'code-scroll'; scroll.tabIndex = 0;
    scroll.setAttribute('role', 'region'); scroll.setAttribute('aria-label', '代码，可横向滚动');
    while (holder.firstChild) scroll.append(holder.firstChild);
    const toolbar = document.createElement('div'); toolbar.className = 'code-toolbar';
    const label = document.createElement('span');
    const language = [...block.classList].find(name => name !== 'highlight') || block.querySelector('code')?.className.replace(/^language-/, '') || '代码';
    label.textContent = language;
    const button = document.createElement('button'); button.type = 'button'; button.className = 'copy-code'; button.textContent = '复制代码'; button.setAttribute('aria-label', `复制 ${language} 代码`);
    button.addEventListener('click', () => {
      const code = scroll.querySelector('.code pre') || scroll.querySelector('pre') || scroll;
      copy(code.innerText.replace(/\n$/, ''), button, '复制代码');
    });
    toolbar.append(label, button); holder.append(toolbar, scroll);
  });
  const copyArticle = $('#copy-article-link'); copyArticle.hidden = false;
  copyArticle.addEventListener('click', () => copy($('link[rel="canonical"]').href, copyArticle, '复制文章链接 ↗'));

  const dialog = $('#search-dialog');
  const input = $('#search-input');
  const results = $('#search-results');
  const hint = $('.search-hint');
  let records = null;
  let loading = false;
  let trigger = null;
  function renderSearch() {
    if (!records) return;
    const query = input.value.trim().toLocaleLowerCase();
    const matches = records.filter(post => [post.title, ...(post.tags || []), ...(post.categories || [])].join(' ').toLocaleLowerCase().includes(query));
    results.replaceChildren();
    hint.textContent = matches.length ? `找到 ${matches.length} 篇文章${matches.length > 50 ? '，显示前 50 篇' : ''} · 按 Esc 关闭` : '没有找到相关文章，换个关键词试试。';
    const base = new URL(document.documentElement.dataset.siteRoot, location.origin);
    matches.slice(0, 50).forEach(post => {
      const link = document.createElement('a'); link.href = new URL(post.path, base).href;
      const title = document.createElement('h3'); title.textContent = post.title;
      const meta = document.createElement('p'); meta.textContent = [post.date, ...(post.tags || [])].filter(Boolean).join(' · ');
      link.append(title, meta); results.append(link);
    });
  }
  async function openSearch() {
    closeMenu(); trigger = document.activeElement;
    if (!dialog.open) dialog.showModal();
    input.focus();
    if (records) { renderSearch(); return; }
    if (loading) return;
    loading = true; hint.textContent = '正在加载文章索引…';
    try {
      const response = await fetch(document.documentElement.dataset.searchIndex);
      if (!response.ok) throw new Error('Search index unavailable');
      const data = await response.json();
      if (!Array.isArray(data.posts)) throw new Error('Invalid search index');
      records = data.posts.filter(post => typeof post.title === 'string' && typeof post.path === 'string' && !post.path.startsWith('/') && !/^[a-z]+:/i.test(post.path) && !post.path.includes('\\'));
      renderSearch();
    } catch { hint.textContent = '文章索引暂不可用，请使用下方的文章归档，或重新打开搜索重试。'; }
    finally { loading = false; }
  }
  $('.search-trigger').addEventListener('click', openSearch);
  $('#search-close').addEventListener('click', () => dialog.close());
  input.addEventListener('input', renderSearch);
  dialog.addEventListener('close', () => trigger?.focus());
  dialog.addEventListener('click', event => {
    if (event.target !== dialog) return;
    const rect = dialog.getBoundingClientRect();
    if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dialog.close();
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape') {
      closeMenu();
      if (dialog.open) { event.preventDefault(); dialog.close(); }
    }
    if ((event.key === '/' && !event.ctrlKey && !event.metaKey && !event.altKey) && !['INPUT', 'TEXTAREA', 'SELECT'].includes(event.target.tagName) && !event.target.isContentEditable) {
      event.preventDefault(); openSearch();
    }
  });
  scheduleReading();
})();
