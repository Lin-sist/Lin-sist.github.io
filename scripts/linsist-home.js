'use strict';

const published = require('../source/_data/published_dates.json').posts;
const homeConfig = require('../source/_data/linsist.json');
const editorial = require('../source/_data/editorial.json');
const workProjects = require('../source/_data/works.json').projects;
// Hexo 7 / Warehouse also reconstruct Moment values in the process timezone.
// Align that timezone before source processing, including UTC CI environments.
process.env.TZ = hexo.config.timezone || 'Asia/Shanghai';
let wrapped = false;

// Published dates are stable identifiers because the existing permalinks contain
// them. Restore the deployed timestamps across checkout machines and timezones.
hexo.extend.filter.register('before_generate', async function () {
  const model = this.model('Post');
  await Promise.all(model.find({}).toArray().map(post => {
    const previous = published[post.source];
    if (!previous) return;
    const fields = { date: new Date(previous.date) };
    if (previous.updated) fields.updated = new Date(previous.updated);
    return model.updateById(post._id, fields).then(() => {
      const restored = model.findById(post._id);
      // Warehouse's Moment update path does not reapply the schema timezone.
      // Set it on the live values before generators format dates/permalinks.
      restored.date.tz(this.config.timezone);
      if (restored.updated) restored.updated.tz(this.config.timezone);
    });
  }));
  this.locals.invalidate();
}, 1);

hexo.extend.filter.register('before_generate', function () {
  if (wrapped || homeConfig.enabled === false) return;
  const original = this.extend.generator.get('index');
  if (!original) throw new Error('Linsist home requires the existing index generator');
  this.extend.generator.register('index', async function (locals) {
    const routes = await original.call(this, locals);
    const posts = locals.posts.sort('-date').toArray();
    const selected = homeConfig.featured_sources.map(item => {
      const post = posts.find(post => post.source === item.source);
      if (!post) throw new Error(`Featured post missing: ${item.source}`);
      return { title: post.title, path: post.path, date: post.date.format('YYYY-MM-DD'),
        shortDate: post.date.format('MM.DD'), year: post.date.format('YYYY'),
        summary: editorial[item.source]?.subtitle || item.summary, group: item.group, groupLabel: item.group_label };
    });
    const recent = posts.slice(0, 6).map(post => {
      const featured = selected.find(item => item.path === post.path);
      const project = post.tags.toArray().some(tag => /rag|flashback|苍穹|黑马/i.test(tag.name));
      return { title: post.title, path: post.path, date: post.date.format('YYYY-MM-DD'),
        shortDate: post.date.format('MM.DD'), year: post.date.format('YYYY'),
        summary: editorial[post.source]?.subtitle || post.description ||
          require('hexo-util').stripHTML(post.excerpt || post.content || '').replace(/\s+/g, ' ').slice(0, 100),
        group: featured?.group || (project ? 'project' : 'engineering'),
        groupLabel: featured?.groupLabel || (project ? '项目实践' : '工程笔记'),
        recent: true, featured: Boolean(featured) };
    });
    const articles = [...recent, ...selected.filter(post => !recent.some(item => item.path === post.path))
      .map(post => ({ ...post, recent: false, featured: true }))];
    const root = routes.find(route => route.path === '' || route.path === 'index.html');
    if (!root) throw new Error('Expected root index.html route was not generated');
    root.layout = ['linsist-home'];
    root.data = { ...root.data, linsist: { ...homeConfig, posts: articles,
      projects: workProjects.map(project => ({ ...project, path: `work/${project.slug}/` })) } };
    return routes;
  });
  wrapped = true;
}, 50);

// Search content is regenerated from the same published post models as the blog.
hexo.extend.generator.register('linsist-search', function (locals) {
  const posts = locals.posts.sort('-date').toArray().map(post => ({
    title: post.title, path: post.path, date: post.date.format('YYYY-MM-DD'),
    aliases: editorial[post.source]?.aliases || [post.source.replace(/^_posts\//, '').replace(/\.md$/, '')],
    tags: post.tags.map(tag => tag.name), categories: post.categories.map(category => category.name)
  }));
  return { path: 'linsist/search.json', data: JSON.stringify({ posts }) };
});

// The published output is already rendered by Hexo; Pages serves it directly.
hexo.extend.generator.register('linsist-nojekyll', () => ({ path: '.nojekyll', data: '' }));
