'use strict';
const fs = require('node:fs');
const path = require('node:path');
const Hexo = require('hexo');
const root = path.resolve(__dirname, '..');
const name = process.argv[2] || 'site';
if (!/^[a-z0-9-]+$/.test(name)) throw new Error('Invalid build name');
const output = path.join(root, '.build', name);
const state = path.join(root, '.build', `${name}-state`);
fs.mkdirSync(state, { recursive: true });
// A fresh cache and output prevent old routes from surviving a new deployment.
fs.rmSync(path.join(state, 'db.json'), { force: true });
fs.rmSync(output, { recursive: true, force: true });
const hexo = new Hexo(root, { output: state, silent: true, config: process.argv[3] });
(async () => {
  try {
    await hexo.init();
    hexo.public_dir = output + path.sep;
    hexo.config.public_dir = path.relative(root, output);
    await hexo.call('generate', { bail: true, force: true });
    console.log(`Hexo ${hexo.version} / Node ${process.version}: ${path.relative(root, output)}`);
  } finally {
    await hexo.exit();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
