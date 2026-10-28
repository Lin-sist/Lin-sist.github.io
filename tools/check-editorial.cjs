'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { unescapeHTML, stripHTML } = require('hexo-util');
const root = path.resolve(__dirname, '..');
const output = path.join(root, process.argv[2] || 'public');
const edits = require('../source/_data/editorial.json');
const published = require('../source/_data/published_dates.json').posts;
const index = JSON.parse(fs.readFileSync(path.join(output, 'linsist/search.json'), 'utf8')).posts;
const body = html => html.match(/<article\b[^>]*id="article-container"[^>]*>([\s\S]*?)<\/article>/)[1];
const prose = html => unescapeHTML(stripHTML(html.replace(/<h[1-6]\b[^>]*>[\s\S]*?<\/h[1-6]>/gi, ''))).replace(/\s+/g, ' ').trim();
const oldOutput = process.argv[3];
assert.deepEqual(Object.keys(edits).sort(), Object.keys(published).sort(), 'Every published article has editorial metadata');
for (const [source, edit] of Object.entries(edits)) {
  assert(edit.title && edit.subtitle && edit.intro && edit.kind, `Complete editorial metadata: ${source}`);
  assert(edit.related.every(item => item !== source && published[item]), `Valid related articles: ${source}`);
  const post = published[source];
  const html = fs.readFileSync(path.join(output, post.path), 'utf8');
  assert.equal(unescapeHTML(stripHTML(html.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/)[1])), edit.title);
  assert(html.includes(edit.intro));
  const record = index.find(item => item.title === edit.title);
  assert(record && record.aliases.includes(source.replace(/^_posts\//, '').replace(/\.md$/, '')));
  assert(edit.aliases.every(alias => record.aliases.includes(alias)), 'Original title aliases retained');
  assert.equal(decodeURI(record.path).replace(/\/?$/, '/index.html'), post.path, 'Stable permalink');
  const ids = new Set([...html.matchAll(/\bid="([^"]+)"/g)].map(m => unescapeHTML(m[1])));
  const guide = html.match(/<aside class="editorial-guide"[\s\S]*?<\/aside>/)[0];
  for (const m of guide.matchAll(/href="#([^"]+)"/g)) assert(ids.has(decodeURIComponent(unescapeHTML(m[1]))));
  if (oldOutput) {
    const old = fs.readFileSync(path.join(oldOutput, post.path), 'utf8');
    const oldTitle = unescapeHTML(stripHTML(old.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/)[1])).trim();
    assert(record.aliases.includes(oldTitle), `Original published title remains searchable: ${source}`);
    assert.equal(prose(body(html)), prose(body(old)), `Paragraphs or code changed: ${source}`);
    assert.deepEqual([...body(html).matchAll(/<h[1-6]\b[^>]*id="([^"]+)"/g)].map(m => m[1]), [...body(old).matchAll(/<h[1-6]\b[^>]*id="([^"]+)"/g)].map(m => m[1]), 'Stable chapter IDs');
  }
}
console.log(`${Object.keys(edits).length} editorial articles: titles, introductions, old-title aliases, guide links, stable URLs; paragraphs/code and chapter IDs compared when baseline supplied — PASS`);
