'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { unescapeHTML } = require('hexo-util');
const output = path.resolve(__dirname, '..', process.argv[2] || '.build/site');
const published = require('../source/_data/published_dates.json').posts;
const editorial = require('../source/_data/editorial.json');
const html = fs.readFileSync(path.join(output, 'archives/index.html'), 'utf8');
assert(html.includes('class="trail-page"'), 'Custom archive route rendered');
assert(!html.includes('<%'), 'EJS fully rendered');
assert.equal((html.match(/<h1\b/g) || []).length, 1);
const items = [...html.matchAll(/<li class="trail-entry"[\s\S]*?<\/li>/g)].map(match => match[0]);
const search = JSON.parse(fs.readFileSync(path.join(output, 'linsist/search.json'), 'utf8')).posts;
assert.equal(items.length, search.length, 'Every published post appears in the timeline');
for (const post of search) {
  const href = '/' + post.path;
  assert(html.includes(`href="${encodeURI(href)}"`) || html.includes(`href="${href}"`), `Timeline entry: ${post.path}`);
}
const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(match => match[1]);
assert.equal(ids.length, new Set(ids).size, 'Unique IDs');
for (const match of html.matchAll(/href="#([^"]+)"/g)) assert(ids.includes(match[1]), `Anchor ${match[1]}`);
const timeline = items.join('');
for (const [source, post] of Object.entries(published)) {
  const permalink = '/' + post.path.replace(/index\.html$/, '');
  assert(timeline.includes(`href="${encodeURI(permalink)}"`) || timeline.includes(`href="${permalink}"`), `Published permalink ${post.path}`);
  assert(timeline.includes(editorial[source]?.title || source), `Title ${source}`);
}
let links = 0;
for (const match of html.matchAll(/(?:href|src)="(\/[^"#]*)(?:#[^"]*)?"/g)) {
  const file = path.join(output, decodeURIComponent(unescapeHTML(match[1]).split('?')[0]));
  assert(fs.existsSync(file) || fs.existsSync(path.join(file, 'index.html')), `Internal resource ${match[1]}`);
  links++;
}
for (const file of ['index.html', 'work/index.html', Object.values(published)[0].path]) {
  assert(fs.readFileSync(path.join(output, file), 'utf8').includes('data-trail-entry'), `Navigation entry ${file}`);
}
for (const legacy of ['archives/page/2/index.html', 'archives/2026/index.html', 'archives/2026/02/index.html']) {
  assert(fs.existsSync(path.join(output, legacy)), `Legacy archive ${legacy}`);
}
console.log(`Trail: ${items.length} published entries, month targets, stable links, ${links} internal resources, shared navigation, legacy archives — PASS`);
