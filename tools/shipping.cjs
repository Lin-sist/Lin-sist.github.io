'use strict';

function pushCommittedSource(git, log = console.log) {
  // Refresh the comparison: a stale origin/hexo must not look like new work.
  git('fetch', 'origin', 'hexo');
  const commits = git('log', '--oneline', 'origin/hexo..HEAD').trim();
  if (!commits) {
    throw new Error('没有新的 Git 提交，本次未触发发布。\nnpm run publish 只把草稿移到 _posts；请先在 Git 面板选择这篇文章和图片并提交，再运行 npm run ship。');
  }
  const pending = git('status', '--short', '--', 'source/_posts', 'source/img/posts').trim();
  if (pending) {
    const lines = pending.split('\n');
    log(`还有 ${lines.length} 项文章或图片改动未提交，不在本次推送中：\n${lines.slice(0, 8).join('\n')}${lines.length > 8 ? '\n…' : ''}`);
  }
  log('本次待推送提交：\n' + commits);
  git('push', 'origin', 'HEAD:hexo');
  log(`已推送 ${commits.split('\n').length} 个源码提交。云端构建和部署成功后，网站才会更新。\n查看结果：https://github.com/Lin-sist/Lin-sist.github.io/actions`);
}

module.exports = { pushCommittedSource };
