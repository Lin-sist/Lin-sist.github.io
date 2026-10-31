'use strict';
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const { newDraft, publish } = require('./writing.cjs');
const root = path.resolve(__dirname, '..');
function git(...args) {
  const result = spawnSync('git', ['-c', `safe.directory=${root.replaceAll('\\', '/')}`, ...args], { cwd: root, encoding: 'utf8', shell: false });
  if (result.error) throw result.error;
  if (result.status) throw new Error(result.stderr.trim() || 'Git 执行失败');
  return result.stdout.trim();
}
try {
  const [command, ...args] = process.argv.slice(2);
  if (command === 'new') {
    console.log(`草稿已创建：${newDraft(root, args.join(' '))}\n写完后运行 npm run publish -- "标题"。`);
  } else if (command === 'publish') {
    console.log(`文章已准备：${publish(root, args.join(' '))}\n在编辑器中选择这篇文章和图片，提交后运行 npm run ship。`);
  } else if (command === 'push') {
    if (git('branch', '--show-current') !== 'hexo') throw new Error('请在 hexo 源码分支发布。');
    if (git('remote', 'get-url', 'origin') !== 'git@github.com:Lin-sist/Lin-sist.github.io.git' &&
        git('remote', 'get-url', 'origin') !== 'https://github.com/Lin-sist/Lin-sist.github.io.git') throw new Error('origin 不是博客仓库，请先核对。');
    git('cat-file', '-e', 'HEAD:.github/workflows/pages.yml');
    const pending = git('status', '--short');
    if (pending) console.log('这些未提交改动会留在本地，不包含在本次推送中：\n' + pending);
    console.log('本次待推送提交：\n' + git('log', '--oneline', 'origin/hexo..HEAD'));
    git('push', 'origin', 'HEAD:hexo');
    console.log('源码已推送。请查看发布结果：https://github.com/Lin-sist/Lin-sist.github.io/actions');
  } else {
    throw new Error('用法：npm run new -- "标题" / npm run publish -- "标题" / npm run ship');
  }
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
