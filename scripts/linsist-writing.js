'use strict';
const fs = require('node:fs');
const frontMatter = require('hexo-front-matter');
const published = require('../source/_data/published_dates.json').posts;
hexo.extend.filter.register('before_generate', function () {
  const paths = new Set();
  for (const post of this.locals.get('posts').toArray()) {
    if (!published[post.source]) {
      const data = frontMatter.parse(fs.readFileSync(post.full_source, 'utf8').replace(/\r\n/g, '\n'));
      if (!data.title || !data.date || !Number.isFinite(new Date(data.date).valueOf())) {
        throw new Error(`文章需要标题和明确的 date，避免云端检出改变链接：${post.source}`);
      }
    }
    const route = post.path.normalize('NFC').toLocaleLowerCase('en');
    if (paths.has(route)) throw new Error(`文章链接重复：${post.path}`);
    paths.add(route);
  }
}, 20);
