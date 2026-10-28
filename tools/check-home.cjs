'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const read=file=>fs.readFileSync(path.join(root,'public',file),'utf8');
const home=read('index.html');
const baseline=JSON.parse(fs.readFileSync(path.join(__dirname,'published-html-routes.json'),'utf8'));
for(const route of baseline.paths)assert(fs.existsSync(path.join(root,'public',route)),`Existing HTML route: ${route}`);
assert(home.includes('<p class="hero-name">Linsist</p>'));
assert(!home.includes('肖健霖')&&!home.includes('我是霖'));
assert(!home.includes('<%'));
const published=JSON.parse(fs.readFileSync(path.join(root,'source/_data/published_dates.json'),'utf8')).posts;
const search=JSON.parse(read('linsist/search.json')).posts;
assert.equal(search.length,Object.keys(published).length);
for(const post of Object.values(published)){
  assert(fs.existsSync(path.join(root,'public',post.path)),post.path);
  assert(search.some(item=>decodeURI(item.path).replace(/\/?$/,'/index.html')===post.path),`Search path: ${post.path}`);
  assert(read(post.path).includes('post-content'),`Article body: ${post.path}`);
}
for(const file of ['linsist/style.css','linsist/app.js','linsist/assets/hero-desktop.mp4','linsist/assets/hero-mobile.mp4','linsist/assets/hero-poster.jpg','archives/index.html','page/2/index.html'])assert(fs.existsSync(path.join(root,'public',file)),file);
console.log(`Homepage identity, template rendering, ${search.length} article routes and search entries, ${baseline.paths.length} existing HTML routes, assets and pagination: PASS`);
