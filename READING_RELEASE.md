# 全站阅读页

2026-10-28：用户验收阅读页样板后，授权推广并推送上线。

- 从远端 hexo / 7a55d4a 建立干净发布副本，只推广线上已有53篇文章的阅读模板。
- source/_posts 和原有非文章页面保持不变；未导入日常工作区中未审定的新增/修改稿件。
- source/_data/reading.json 使用 scope: all；设 enabled: false 可恢复 Butterfly 文章布局。
- 逐篇与上一次发布输出比较，53篇正文文字保持一致；1106个目录链接有效；原109个页面地址保留。
- 构建：node node_modules/hexo/bin/hexo generate。
- 校验：node tools/check-home.cjs；node tools/check-reading.cjs。
- 浏览器检查代码密集、早期文章、无章节文章，覆盖390/1280 CSS像素及全站搜索。
- 现有 Mermaid / 数学渲染配置未启用，代码块按原配置显示；未扩展外部服务。
- 真实手机、其他浏览器与系统剪贴板仍待独立验收。

源分支为 hexo，生成产物发布到 main，均采用正常快进提交，不强制推送。
