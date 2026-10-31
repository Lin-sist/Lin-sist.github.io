'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { filename, timestamp, newDraft, publish } = require('./writing.cjs');
test('filenames cannot escape the article directory or collide with Windows devices', () => {
  for (const title of ['../secret', 'x/y', '..', 'NUL', 'con.md', 'hello.', 'a:b', '']) assert.throws(() => filename(title));
  assert.equal(filename('一次 RAG 排查'), '一次 RAG 排查.md');
});
test('timestamps remain stable across UTC and local environments', () => {
  assert.equal(timestamp(new Date('2026-10-30T16:30:00Z')), '2026-10-31T00:30:00+08:00');
});
test('draft publication preserves dates and content, rejects empty drafts and never replaces a post', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'blog-writing-'));
  try {
    fs.mkdirSync(path.join(root, 'scaffolds'));
    fs.copyFileSync(path.join(__dirname, '../scaffolds/post.md'), path.join(root, 'scaffolds/post.md'));
    const title = '排查「日期」';
    const draft = newDraft(root, title, new Date('2026-10-30T16:30:00Z'));
    assert.throws(() => publish(root, title), /正文/);
    fs.appendFileSync(draft, '\n只记下一件事。\n');
    const original = fs.readFileSync(draft, 'utf8');
    const destination = publish(root, title);
    assert.equal(fs.readFileSync(destination, 'utf8'), original);
    assert(!fs.existsSync(draft));
    assert.throws(() => newDraft(root, title), /同名/);
    fs.mkdirSync(path.dirname(draft), { recursive: true });
    fs.writeFileSync(draft, original + '\n不要覆盖。');
    assert.throws(() => publish(root, title), /EEXIST/);
    assert.equal(fs.readFileSync(destination, 'utf8'), original);
    assert(fs.existsSync(draft));
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});
