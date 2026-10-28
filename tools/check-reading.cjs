'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { unescapeHTML, stripHTML } = require('hexo-util');
const root = path.resolve(__dirname, '..');
const output = path.join(root, process.argv[2] || 'public');
const published = require('../source/_data/published_dates.json').posts;
const original = process.argv[3];
const bodyText = html => unescapeHTML(stripHTML(html.match(/<article\b[^>]*id="article-container"[^>]*>([\s\S]*?)<\/article>/)[1])).replace(/\s+/g, ' ').trim();
let headings = 0;
for (const post of Object.values(published)) {
  const html = fs.readFileSync(path.join(output, post.path), 'utf8');
  assert(html.includes('class="reading-page"'), `Reader missing: ${post.path}`);
  assert.equal((html.match(/<h1\b/g) || []).length, 1, `One H1: ${post.path}`);
  assert(!html.includes('<%'), `Unrendered template: ${post.path}`);
  const ids = new Set([...html.matchAll(/\bid="([^"]+)"/g)].map(match => unescapeHTML(match[1])));
  const toc = html.match(/<nav aria-label="文章目录">([\s\S]*?)<\/nav>/)[1];
  for (const match of toc.matchAll(/href="#([^"]+)"/g)) {
    assert(ids.has(decodeURIComponent(unescapeHTML(match[1]))), `Broken directory target: ${post.path} ${match[1]}`);
    headings++;
  }
  if (original) assert.equal(bodyText(html), bodyText(fs.readFileSync(path.join(original, post.path), 'utf8')), `Published text changed: ${post.path}`);
}
console.log(`Reading layouts: ${Object.keys(published).length}; valid directory headings: ${headings}; original text comparison: ${Boolean(original)} — PASS`);
