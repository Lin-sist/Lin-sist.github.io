'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..', process.argv[2] || 'public');
const routes = ['work/index.html', 'work/rag/index.html', 'work/flashback/index.html'];
let links = 0;
for (const route of routes) {
  const html = fs.readFileSync(path.join(root, route), 'utf8');
  assert(!html.includes('<%'), `Unrendered EJS: ${route}`);
  assert.equal((html.match(/<h1\b/g) || []).length, 1, route);
  for (const match of html.matchAll(/\b(?:src|href)="(\/[^"#]*)(?:#[^"]*)?"/g)) {
    const pathname = decodeURIComponent(match[1].split('?')[0]);
    const target = path.join(root, pathname);
    assert(fs.existsSync(target) || fs.existsSync(path.join(target, 'index.html')), `Broken internal resource: ${route} ${pathname}`);
    links++;
  }
}
console.log(`Work index and 2 cases: rendered HTML, heading structure, ${links} internal links/assets — PASS`);
