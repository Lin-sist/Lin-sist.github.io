'use strict';

const { stripHTML, unescapeHTML } = require('hexo-util');
const editorial = require('../source/_data/editorial.json');
let wrapped = false;

// Extend the existing generator: its pagination and year/month routes stay intact.
hexo.extend.filter.register('before_generate', function () {
  if (wrapped) return;
  const archive = this.extend.generator.get('archive');
  if (!archive) return;
  this.extend.generator.register('archive', async function (locals) {
    const routes = await archive.call(this, locals);
    if (!routes) return routes;
    const base = `${this.config.archive_dir.replace(/\/$/, '')}/`;
    const route = routes.find(item => item.path === base || item.path === base + 'index.html');
    if (!route) return routes;
    const text = value => unescapeHTML(stripHTML(String(value || ''))).replace(/\s+/g, ' ').trim();
    const records = locals.posts.toArray()
      .sort((a, b) => b.date.valueOf() - a.date.valueOf() || a.source.localeCompare(b.source, 'zh-CN'))
      .map(post => ({
        title: editorial[post.source]?.title || post.title,
        path: post.path,
        date: post.date.format('YYYY-MM-DD'),
        shortDate: post.date.format('MM.DD'),
        year: post.date.format('YYYY'),
        month: post.date.format('YYYY-MM'),
        summary: text(editorial[post.source]?.subtitle || post.description || post.excerpt),
        category: editorial[post.source]?.kind || post.categories.toArray()[0]?.name || '开发记录'
      }));
    const months = [...new Set(records.map(post => post.month))];
    route.layout = ['linsist-trail'];
    route.data = { ...route.data, trail: { records, months } };
    return routes;
  });
  wrapped = true;
}, 65);
