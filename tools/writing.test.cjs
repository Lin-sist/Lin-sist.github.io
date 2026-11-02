'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { filename, timestamp, newDraft, publish } = require('./writing.cjs');
const { pushCommittedSource } = require('./shipping.cjs');
test('empty push is rejected after refreshing the remote; uncommitted posts are never pushed', () => {
  const calls = [];
  const git = (...args) => { calls.push(args); return ''; };
  assert.throws(() => pushCommittedSource(git, () => {}), /没有新的 Git 提交/);
  assert.deepEqual(calls.map(args => args[0]), ['fetch', 'log']);
});
test('push sends existing commits without staging files and reports deployment as pending', () => {
  const calls = [], messages = [];
  const git = (...args) => {
    calls.push(args);
    return args[0] === 'log' ? 'abc123 publish one article' : args[0] === 'status' ? '?? source/_posts/other.md' : '';
  };
  pushCommittedSource(git, message => messages.push(message));
  assert.deepEqual(calls.map(args => args[0]), ['fetch', 'log', 'status', 'push']);
  assert(messages.join('\n').includes('未提交'));
  assert(messages.at(-1).includes('云端构建和部署成功后'));
});
test('push failures do not produce a success message', () => {
  const messages = [];
  const git = (...args) => {
    if (args[0] === 'push') throw new Error('network failed');
    return args[0] === 'log' ? 'abc123 publish one article' : '';
  };
  assert.throws(() => pushCommittedSource(git, message => messages.push(message)), /network failed/);
  assert(!messages.some(message => message.includes('已推送')));
});
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
