'use strict';

const { stripHTML, unescapeHTML, escapeHTML } = require('hexo-util');
const editorial = require('../source/_data/editorial.json');
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
      const edit = editorial[post.source];
      let content = post.content.replace(/<(\/?)h([1-6])\b/gi,
        (_, slash, level) => `<${slash}h${Math.min(6, Number(level) + shift)}`);
      if (edit) content = content.replace(/<h([2-6])\b([^>]*)>([\s\S]*?)<\/h\1>/gi, (full, level, attributes, inner) => {
        const label = plain(inner);
        const rule = edit.headings.find(item => label.startsWith(item.prefix));
        const title = rule?.title || label.replace(/^[\s\p{Extended_Pictographic}\p{Emoji_Presentation}\uFE0F\u200D]+/u, '');
        if (title === label) return full;
        const anchor = inner.match(/<a\b[^>]*class="[^"]*headerlink[^>]*>[\s\S]*?<\/a>/i)?.[0] || '';
        return `<h${level}${attributes}>${anchor}${escapeHTML(title)}</h${level}>`;
      });
      const headings = [];
      const pattern = /<h([2-4])\b[^>]*\bid="([^"]+)"[^>]*>([\s\S]*?)<\/h\1>/gi;
      for (const match of content.matchAll(pattern)) {
        headings.push({ level: Number(match[1]), id: unescapeHTML(match[2]), title: plain(match[3]) });
      }
      const jumps = (edit?.jumps || []).map(jump => {
        const target = headings.find(item => item.title.startsWith(jump.prefix));
        if (!target) throw new Error(`Editorial reading target missing: ${post.source} ${jump.prefix}`);
        return { label: jump.label, id: target.id };
      });
      const text = plain(post.content);
      const cjk = (text.match(/[\u3400-\u9fff]/g) || []).length;
      const words = (text.replace(/[\u3400-\u9fff]/g, ' ').match(/[\p{L}\p{N}]+/gu) || []).length;
      const featured = home.featured_sources.find(item => item.source === post.source);
      const tags = post.tags.map(tag => tag.name);
      const candidates = edit ? edit.related.map(source => posts.find(item => item.source === source)).filter(Boolean) : posts.filter(item => item.source !== post.source);
      if (!edit) {
      candidates.sort((a, b) => {
        const score = item => item.tags.filter(tag => tags.includes(tag.name)).length;
        return score(b) - score(a) || b.date.valueOf() - a.date.valueOf();
      });
      }
      post.linsistReading = {
        content, headings, minutes: Math.max(1, Math.ceil(cjk / 400 + words / 200)),
        summary: edit?.subtitle || Array.from(plain(post.description || featured?.summary || post.excerpt)).slice(0, 180).join(''),
        editorial: edit ? { intro: edit.intro, kind: edit.kind, jumps } : null,
        category: featured?.group_label || post.categories.toArray()[0]?.name || '工程笔记',
        related: candidates.slice(0, 3).map(item => ({
          title: item.title, path: item.path, date: item.date.format('YYYY.MM.DD'),
          summary: editorial[item.source]?.subtitle || home.featured_sources.find(record => record.source === item.source)?.summary || ''
        })),
        project: tags.some(tag => /rag/i.test(tag)) ? {
          name: 'RAG · 知识库问答', url: 'https://github.com/Lin-sist/RAG',
          description: '查看项目源码，结合代码理解文档入库、检索与回答的流程。'
        } : null
      };
      route.layout = ['linsist-reading'];
    }
    return routes;
  });
  wrapped = true;
}, 60);
