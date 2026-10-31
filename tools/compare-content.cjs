'use strict';
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const { stripHTML, unescapeHTML } = require('hexo-util');
const published = require('../source/_data/published_dates.json').posts;
const output = process.argv[2];
const baseline = process.argv[3];
if (!output || !baseline) throw new Error('Usage: node tools/compare-content.cjs output baseline');
// Hexo 8 fixes double escaping in code blocks. Normalize numeric entities for
// semantic comparison, while checking the original heading anchors separately.
function text(html) {
  let value = stripHTML(html.match(/<article\b[^>]*id="article-container"[^>]*>([\s\S]*?)<\/article>/)[1]);
  for (let i = 0; i < 4; i++) value = unescapeHTML(value)
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)));
  return value.replace(/\s+/g, ' ').trim();
}
let count = 0;
for (const post of Object.values(published)) {
  const current = fs.readFileSync(path.join(output, post.path), 'utf8');
  const previous = fs.readFileSync(path.join(baseline, post.path), 'utf8');
  assert.equal(text(current), text(previous), `Body/code changed: ${post.path}`);
  const ids = html => [...html.matchAll(/<h[1-6]\b[^>]*id="([^"]+)"/g)].map(match => match[1]);
  assert.deepEqual(ids(current), ids(previous), `Chapter links changed: ${post.path}`);
  count++;
}
console.log(`${count} articles: body/code (normalized HTML entities), chapter IDs and original URL paths — PASS`);
