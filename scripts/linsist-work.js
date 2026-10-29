'use strict';
const data = require('../source/_data/works.json');
hexo.extend.generator.register('linsist-work', function (locals) {
  const posts = locals.posts.toArray();
  const projects = data.projects.map(project => ({ ...project, path: `work/${project.slug}/`,
    articles: project.articles.map(source => posts.find(post => post.source === source)).filter(Boolean)
      .map(post => ({ title: post.title, path: post.path }))
  }));
  return [{ path: 'work/index.html', layout: 'linsist-work', data: { projects, project: null } },
    ...projects.map(project => ({ path: project.path + 'index.html', layout: 'linsist-work', data: { projects, project } }))];
});
