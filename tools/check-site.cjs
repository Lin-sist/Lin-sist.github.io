'use strict';
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const { unescapeHTML } = require('hexo-util');
const exceptions = new Set(require('./legacy-link-exceptions.json').links.map(([file, href]) => `${file}: ${href}`));
const root = path.resolve(__dirname, '..');
const output = path.resolve(root, process.argv[2] || '.build/site');
for (const script of ['check-editorial.cjs', 'check-reading.cjs', 'check-work.cjs', 'check-trail.cjs']) {
  const result = spawnSync(process.execPath, [path.join(__dirname, script), path.relative(root, output)], { cwd: root, stdio: 'inherit' });
  if (result.error) throw result.error;
  assert.equal(result.status, 0, script);
}
const posts = JSON.parse(fs.readFileSync(path.join(output, 'linsist/search.json'), 'utf8')).posts;
const home = fs.readFileSync(path.join(output, 'index.html'), 'utf8');
assert(posts.length > 0);
for (const post of posts) assert(fs.existsSync(path.join(output, decodeURI(post.path), 'index.html')), `Missing article: ${post.path}`);
for (const post of posts.slice(0, 6)) assert(home.includes(unescapeHTML(post.title).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')) || home.includes(post.title), `Latest article missing: ${post.title}`);
const walk = dir => fs.readdirSync(dir, { withFileTypes: true }).flatMap(entry => entry.isDirectory() ? walk(path.join(dir, entry.name)) : [path.join(dir, entry.name)]);
let links = 0;
const failures = [];
let existingReferences = 0;
for (const file of walk(output)) {
  assert(!file.includes(`${path.sep}.obsidian${path.sep}`), 'Editor state leaked');
  if (!file.endsWith('.html')) continue;
  const html = fs.readFileSync(file, 'utf8');
  assert(!html.includes('<%'), `Unrendered template: ${file}`);
  for (const match of html.matchAll(/\b(?:href|src)="([^"<>]+)"/g)) {
    const href = unescapeHTML(match[1]);
    if (/^(?:[a-z][a-z0-9+.-]*:|\/\/|#)/i.test(href)) continue;
    const raw = href.split(/[?#]/)[0];
    if (!raw) continue;
    let target;
    try { target = decodeURIComponent(raw); } catch { failures.push(`${file}: invalid URL ${raw}`); continue; }
    const destination = target.startsWith('/') ? path.resolve(output, '.' + target) : path.resolve(path.dirname(file), target);
    if (!destination.startsWith(output + path.sep) && destination !== output) failures.push(`${file}: path escapes site ${href}`);
    else if (!fs.existsSync(destination) && !fs.existsSync(path.join(destination, 'index.html'))) {
      const reference = `${path.relative(output, file).split(path.sep).join('/')}: ${href}`;
      if (exceptions.has(reference)) existingReferences++;
      else failures.push(reference);
    }
    links++;
  }
}
assert.equal(failures.length, 0, `Missing local links/assets:\n${failures.slice(0, 25).join('\n')}`);
console.log(`Site: ${posts.length} searchable articles, latest entries, ${links} local references — PASS`);
if (existingReferences) console.log(`Known legacy source-code references: ${existingReferences} (see tools/legacy-link-exceptions.json)`);
