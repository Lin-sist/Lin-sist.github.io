'use strict';

// This page was moved into _posts in the local workspace. Keep its old address
// as an ordinary static redirect without copying or reverting the user's draft.
hexo.extend.generator.register('linsist-legacy-stage-two', function (locals) {
  const post = locals.posts.toArray().find(item => item.source === '_posts/《苍穹外卖》阶段二.md');
  if (!post) return [{
    path: '《苍穹外卖》阶段二.html',
    data: '<!doctype html><html lang="zh-CN"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>《苍穹外卖》阶段二 · Lin说</title><h1>《苍穹外卖》阶段二</h1><p>这篇旧记录尚未补充正文。</p><p><a href="' + this.config.root + 'archives/">浏览文章轨迹</a></p></html>'
  }];
  const target = this.config.root + post.path;
  const escape = value => value.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
  return {
    path: '《苍穹外卖》阶段二.html',
    data: `<!doctype html><html lang="zh-CN"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta http-equiv="refresh" content="0;url=${escape(target)}"><link rel="canonical" href="${escape(this.config.url + target)}"><title>文章已移动 · Linsist</title><p>文章已移动。<a href="${escape(target)}">继续阅读《苍穹外卖》阶段二</a></p></html>`
  };
});
