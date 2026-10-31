'use strict';
const fs = require('node:fs');
const path = require('node:path');
const frontMatter = require('hexo-front-matter');

function filename(title) {
  const value = String(title || '').trim();
  if (!value || value.length > 100 || /[<>:"/\\|?*\x00-\x1f]/.test(value) || /[. ]$/.test(value) || /^(con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\.|$)/i.test(value) || value === '..') {
    throw new Error('请使用 1–100 字的标题，避免路径和 Windows 文件名保留字符。');
  }
  return value.replace(/\.md$/i, '') + '.md';
}
function timestamp(now = new Date()) {
  const parts = Object.fromEntries(new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Shanghai',
    year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23' }).formatToParts(now).map(p => [p.type, p.value]));
  return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}:${parts.second}+08:00`;
}
function newDraft(root, title, now) {
  const file = filename(title);
  for (const folder of ['_drafts', '_posts']) {
    if (fs.existsSync(path.join(root, 'source', folder, file))) throw new Error('同名文章已存在，请换一个标题。');
  }
  const destination = path.join(root, 'source', '_drafts', file);
  fs.mkdirSync(path.dirname(destination), { recursive: true });
  const template = fs.readFileSync(path.join(root, 'scaffolds/post.md'), 'utf8')
    .replace('{{ title }}', JSON.stringify(String(title).trim()))
    .replace('{{ date }}', timestamp(now));
  fs.writeFileSync(destination, template, { flag: 'wx' });
  return destination;
}
function publish(root, title) {
  const file = filename(title);
  const source = path.join(root, 'source', '_drafts', file);
  const destination = path.join(root, 'source', '_posts', file);
  const text = fs.readFileSync(source, 'utf8');
  const data = frontMatter.parse(text.replace(/\r\n/g, '\n'));
  if (!data.title || !data._content.trim()) throw new Error('先写一点正文，再发布。');
  if (!data.date || !Number.isFinite(new Date(data.date).valueOf())) throw new Error('文章需要有效的 date。');
  if (data.published === false) throw new Error('请先删除 published: false，再发布。');
  fs.mkdirSync(path.dirname(destination), { recursive: true });
  // Exclusive creation never replaces an existing article. Keep the original date.
  fs.copyFileSync(source, destination, fs.constants.COPYFILE_EXCL);
  fs.unlinkSync(source);
  return destination;
}
module.exports = { filename, timestamp, newDraft, publish };
