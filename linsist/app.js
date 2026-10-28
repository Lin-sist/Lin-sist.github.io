const $ = (s) => document.querySelector(s);
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
const narrowScreen = matchMedia('(max-width: 700px)');
const storage = {get(key){try{return localStorage.getItem(key)}catch{return null}},set(key,value){try{localStorage.setItem(key,value)}catch{}}};

// Background video: an explicit user pause always wins over observer callbacks.
const video = $('#hero-video');
const assetBase = document.documentElement.dataset.assetBase || 'assets/';
const videoToggle = $('#video-toggle');
let userPaused = storage.get('lin-video-paused') === 'true';
let explicitPlay = false;
let heroVisible = true;
let playBlocked = false;
let videoFailed = false;
const videoAllowed = () => !userPaused && (!(reducedMotion.matches || narrowScreen.matches) || explicitPlay);
function reflectVideo() {
  const playing = !video.paused && !video.ended;
  videoToggle.querySelector('.play-symbol').textContent = playing ? 'Ⅱ' : '▷';
  videoToggle.querySelector('.video-label').textContent = playing ? '暂停' : '播放';
  videoToggle.setAttribute('aria-label', playing ? '暂停背景视频' : '播放背景视频');
  $('#video-status').textContent = videoFailed ? '视频暂不可用 · 静态画面' : playBlocked ? '点击播放动态画面' : playing ? '天台与流星' : '静态画面';
}
async function startVideo() {
  if (!videoAllowed() || !heroVisible || document.hidden || videoFailed) return;
  if (!video.getAttribute('src')) {
    video.src = assetBase + (narrowScreen.matches ? 'hero-mobile.mp4' : 'hero-desktop.mp4');
    video.load();
  }
  try { await video.play(); playBlocked = false; } catch (error) {
    if (error.name !== 'AbortError') playBlocked = true;
  }
  reflectVideo();
}
function reconcileVideo(){
  if (!videoAllowed() || !heroVisible || document.hidden) video.pause();
  else if (!playBlocked) startVideo();
  reflectVideo();
}
video.addEventListener('playing',()=>{video.classList.add('is-ready'); reflectVideo()});
video.addEventListener('pause',reflectVideo);
video.addEventListener('error',()=>{videoFailed=true;video.classList.remove('is-ready');reflectVideo()});
videoToggle.addEventListener('click',()=>{
  if (!video.paused) {userPaused=true;storage.set('lin-video-paused','true');video.pause();}
  else {if(videoFailed){video.removeAttribute('src');video.load()}userPaused=false;explicitPlay=true;playBlocked=false;videoFailed=false;storage.set('lin-video-paused','false');startVideo();}
  reflectVideo();
});
document.addEventListener('visibilitychange',reconcileVideo);
reducedMotion.addEventListener('change',()=>{explicitPlay=false;reconcileVideo()});
narrowScreen.addEventListener('change',()=>{explicitPlay=false;reconcileVideo();if(!narrowScreen.matches)closeMenu()});
new IntersectionObserver(([entry])=>{heroVisible=entry.isIntersecting;reconcileVideo()},{threshold:0}).observe($('.hero'));
reflectVideo();

// Native anchor navigation and a compact header leave browser history intact.
const menuButton=$('.menu-toggle');
const mobileNav=$('#mobile-nav');
function closeMenu(){mobileNav.hidden=true;menuButton.setAttribute('aria-expanded','false');menuButton.setAttribute('aria-label','打开导航菜单')}
menuButton.addEventListener('click',()=>{
  const opening=mobileNav.hidden;
  mobileNav.hidden=!opening;
  menuButton.setAttribute('aria-expanded',String(opening));
  menuButton.setAttribute('aria-label',opening?'关闭导航菜单':'打开导航菜单');
});
mobileNav.querySelectorAll('a').forEach(a=>a.addEventListener('click',closeMenu));
document.addEventListener('keydown',e=>{if(e.key==='Escape'){closeMenu();if($('#search-dialog').open){e.preventDefault();$('#search-dialog').close()}}});
new IntersectionObserver(([entry])=>$('.site-header').classList.toggle('is-scrolled',!entry.isIntersecting),{rootMargin:'-90px 0px 0px 0px'}).observe($('.hero'));
const navLinks=[...document.querySelectorAll('.desktop-nav a')];
const sectionObserver=new IntersectionObserver(entries=>{for(const entry of entries){if(entry.isIntersecting)navLinks.forEach(a=>{if(a.hash==='#'+entry.target.id)a.setAttribute('aria-current','location');else a.removeAttribute('aria-current')})}},{rootMargin:'-20% 0px -50% 0px'});
['home','about','work','writing'].forEach(id=>sectionObserver.observe(document.getElementById(id)));

function reflectTheme(){const light=document.documentElement.dataset.theme==='light';$('.theme-toggle').setAttribute('aria-label',light?'切换为深色主题':'切换为浅色主题');document.querySelector('meta[name="theme-color"]').content=light?'#f4f3ef':'#0b1420'}
$('.theme-toggle').addEventListener('click',()=>{const next=document.documentElement.dataset.theme==='dark'?'light':'dark';document.documentElement.dataset.theme=next;storage.set('lin-theme',next);reflectTheme()});
reflectTheme();

// In-page article filters and local title / description search.
const articles=[...document.querySelectorAll('.article-row')];
document.querySelectorAll('[data-filter]').forEach(button=>button.addEventListener('click',()=>{
  document.querySelectorAll('[data-filter]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));
  let count=0;
  articles.forEach(row=>{row.hidden=button.dataset.filter!=='all'&&row.dataset.category!==button.dataset.filter;if(!row.hidden)count++});
  $('#filter-status').textContent=`显示 ${count} 篇文章`;
}));
const searchDialog=$('#search-dialog');
let searchRecords=null;
let searchLoading=null;
async function loadSearchIndex(){
  const indexUrl=document.documentElement.dataset.searchIndex;
  if(!indexUrl||searchRecords||searchLoading)return searchLoading;
  searchLoading=(async()=>{
    try{
      const response=await fetch(indexUrl);
      if(!response.ok)throw Error('Search index unavailable');
      const data=await response.json();
      if(!Array.isArray(data.posts))throw Error('Invalid search index');
      searchRecords=data.posts.filter(post=>typeof post.title==='string'&&typeof post.path==='string'&&!post.path.startsWith('/')&&!/^[a-z]+:/i.test(post.path));
      renderSearch();
    }catch{
      $('.search-hint').textContent='全文章索引暂不可用，当前搜索精选文章。也可浏览文章归档。';
    }finally{searchLoading=null}
  })();
  return searchLoading;
}
function renderSearch(){
  const q=$('#search-input').value.trim().toLocaleLowerCase();
  if(searchRecords){
    const matches=searchRecords.filter(post=>[post.title,...(post.aliases||[]),...(post.tags||[]),...(post.categories||[])].join(' ').toLocaleLowerCase().includes(q));
    const root=$('#search-results');root.replaceChildren();
    if(!matches.length){const empty=document.createElement('p');empty.className='search-empty';empty.textContent='没有找到相关文章，换个关键词试试。';root.append(empty);return}
    const base=new URL(document.documentElement.dataset.siteRoot||'/',location.origin);
    matches.forEach(post=>{
      const link=document.createElement('a');link.href=new URL(post.path,base).href;
      const title=document.createElement('h3');title.textContent=post.title;
      const meta=document.createElement('p');meta.textContent=[post.date,...(post.tags||[])].filter(Boolean).join(' · ');
      link.append(title,meta);root.append(link);
    });
    return;
  }
  const matches=articles.filter(row=>(row.dataset.search+' '+row.innerText).toLocaleLowerCase().includes(q));
  const root=$('#search-results');root.replaceChildren();
  if(!matches.length){const empty=document.createElement('p');empty.className='search-empty';empty.textContent='没有找到相关文章，换个关键词试试。';root.append(empty);return}
  matches.forEach(row=>{
    const link=row.querySelector('a').cloneNode(true);root.append(link);
  });
}
function openSearch(){if(!searchDialog.open){closeMenu();searchDialog.showModal();renderSearch();loadSearchIndex();$('#search-input').focus()}}
$('.search-trigger').addEventListener('click',openSearch);
$('#search-close').addEventListener('click',()=>searchDialog.close());
$('#search-input').addEventListener('input',renderSearch);
searchDialog.addEventListener('click',e=>{if(e.target===searchDialog){const r=searchDialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)searchDialog.close()}});
document.addEventListener('keydown',e=>{if(e.key==='/'&&!e.ctrlKey&&!e.metaKey&&!e.altKey&&!['INPUT','TEXTAREA','SELECT'].includes(e.target.tagName)&&!e.target.isContentEditable){e.preventDefault();openSearch()}});

if(!reducedMotion.matches){
  const revealObserver=new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add('is-visible');revealObserver.unobserve(entry.target)}}),{threshold:.05});
  document.querySelectorAll('.reveal').forEach(el=>revealObserver.observe(el));
  document.documentElement.classList.add('has-motion');
}
