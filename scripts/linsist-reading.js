'use strict';

const { stripHTML, unescapeHTML } = require('hexo-util');
const settings = require('../source/_data/reading.json');
const home = require('../source/_data/linsist.json');
let wrapped = false;
const plain = html => unescapeHTML(stripHTML(String(html || ''))).replace(/\s+/g, ' ').trim();

hexo.extend.filter.register('before_generate', function () {
  if (wrapped || !settings.enabled) return;
  const original = this.extend.generator.get('post');
  if (!original) throw new Error('Linsist reading requires the Hexo post generator');
  this.extend.generator.register('post', async function (locals) {
    const routes = await original.call(this, locals);
    const posts = locals.posts.sort('-date').toArray();
    for (const route of routes) {
      const post = route.data;
      if (!post || !route.layout || (settings.scope !== 'all' && !(settings.sources || []).includes(post.source))) continue;
      // Adjust the rendered outline only. Source Markdown and heading IDs stay intact.
      const shift = /<h1\b/i.test(post.content) ? 1 : 0;
      const content = post.content.replace(/<(\/?)h([1-6])\b/gi,
        (_, slash, level) => `<${slash}h${Math.min(6, Number(level) + shift)}`);
      const headings = [];
      const pattern = /<h([2-4])\b[^>]*\bid="([^"]+)"[^>]*>([\s\S]*?)<\/h\1>/gi;
      for (const match of content.matchAll(pattern)) {
        headings.push({ level: Number(match[1]), id: unescapeHTML(match[2]), title: plain(match[3]) });
      }
      const text = plain(post.content);
      const cjk = (text.match(/[\u3400-\u9fff]/g) || []).length;
      const words = (text.replace(/[\u3400-\u9fff]/g, ' ').match(/[\p{L}\p{N}]+/gu) || []).length;
      const featured = home.featured_sources.find(item => item.source === post.source);
      const tags = post.tags.map(tag => tag.name);
      const candidates = posts.filter(item => item.source !== post.source);
      candidates.sort((a, b) => {
        const score = item => item.tags.filter(tag => tags.includes(tag.name)).length;
        return score(b) - score(a) || b.date.valueOf() - a.date.valueOf();
      });
      post.linsistReading = {
        content, headings, minutes: Math.max(1, Math.ceil(cjk / 400 + words / 200)),
        summary: Array.from(plain(post.description || featured?.summary || post.excerpt)).slice(0, 180).join(''),
        category: featured?.group_label || post.categories.toArray()[0]?.name || '工程笔记',
        related: candidates.slice(0, 3).map(item => ({
          title: item.title, path: item.path, date: item.date.format('YYYY.MM.DD'),
          summary: home.featured_sources.find(record => record.source === item.source)?.summary || ''
        })),
        project: tags.some(tag => /rag/i.test(tag)) ? {
          name: 'RAG · 知识库问答', url: 'https://github.com/Lin-sist/RAG',
          description: '从文档上传、检索到流式回答，继续查看项目源码。'
        } : null
      };
      route.layout = ['linsist-reading'];
    }
    return routes;
  });
  wrapped = true;
}, 60);
