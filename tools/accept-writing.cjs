'use strict';
// Run only inside the isolated release checkout. No fixture reaches the real blog.
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const { newDraft, publish } = require('./writing.cjs');
const root = path.resolve(__dirname, '..');
assert(root.split(path.sep).includes('.build'), 'Acceptance must run inside an isolated .build checkout');
const name = 'QA-写作流程验收';
const draft = path.join(root, 'source/_drafts', name + '.md');
const post = path.join(root, 'source/_posts', name + '.md');
const image = path.join(root, 'source/img/posts/qa-writing.svg');
const expected = '2026/10/31/' + name + '/';
const build = () => {
  const run = spawnSync(process.execPath, [path.join(__dirname, 'build.cjs')], { cwd: root, env: { ...process.env, TZ: 'UTC' }, encoding: 'utf8' });
  if (run.error) throw run.error;
  return run;
};
const index = () => JSON.parse(fs.readFileSync(path.join(root, '.build/site/linsist/search.json'), 'utf8')).posts;
assert(!fs.existsSync(draft) && !fs.existsSync(post) && !fs.existsSync(image), 'Fixture already exists');
try {
  newDraft(root, name, new Date('2026-10-30T16:30:00Z'));
  fs.mkdirSync(path.dirname(image), { recursive: true });
  fs.writeFileSync(image, '<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40"><rect width="40" height="40" fill="teal"/></svg>');
  fs.appendFileSync(draft, '\n只记录一件事。\n\n![验收图片](/img/posts/qa-writing.svg)\n');
  assert.equal(build().status, 0);
  assert(!index().some(item => item.title === name), 'Draft entered search');
  assert(!fs.existsSync(path.join(root, '.build/site', expected)), 'Draft got a public route');
  publish(root, name);
  assert.equal(build().status, 0);
  const record = index().find(item => item.title === name);
  assert.equal(record.path, expected, 'UTC checkout changed publication date');
  for (const file of ['index.html', 'archives/index.html']) assert(fs.readFileSync(path.join(root, '.build/site', file), 'utf8').includes(name));
  assert(fs.existsSync(path.join(root, '.build/site/img/posts/qa-writing.svg')));
  const check = spawnSync(process.execPath, [path.join(__dirname, 'check-site.cjs')], { cwd: root, encoding: 'utf8' });
  assert.equal(check.status, 0, check.stdout + check.stderr);
  fs.unlinkSync(image);
  assert.equal(build().status, 0);
  const brokenImage = spawnSync(process.execPath, [path.join(__dirname, 'check-site.cjs')], { cwd: root, encoding: 'utf8' });
  assert.notEqual(brokenImage.status, 0, 'Missing image passed site checks');
  fs.writeFileSync(post, '---\ntitle: QA\ndate:\n---\n正文\n');
  assert.notEqual(build().status, 0, 'Missing date did not stop build');
  console.log('Draft hidden; publish enters homepage/timeline/search; +08 date stable under UTC; image verified; missing image/date blocked — PASS');
} finally {
  for (const file of [draft, post, image]) fs.rmSync(file, { force: true });
  const final = build();
  assert.equal(final.status, 0, final.stdout + final.stderr);
}
