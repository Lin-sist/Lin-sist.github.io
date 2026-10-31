# 写作与自动发布验收 · 2026-10-31

实现：Node 24.14.0、Hexo 8.1.2、公共 npm 锁文件、GitHub Actions Pages 发布；默认源码分支 hexo，原 main 静态分支保留。

## 已通过

- 独立检出最新远端源码，全新 npm ci；本地构建与 GitHub Ubuntu / UTC 构建均通过。
- 53 篇历史文章保持原 URL 和日期；1106 个目录锚点有效。
- 5369 个本地引用检查通过，6 条已有本地源码引用显式列于 tools/legacy-link-exceptions.json，未静默忽略其他缺失资源。
- 以升级前当前工作区的 Hexo 7 输出为基线，归一化 HTML 实体后，53 篇正文/代码和章节 ID 一致。Hexo 8 的代码块实体转义与旧版不同。
- 当前源文件与线上对比，52 篇正文一致；DTO/VO/Entity 文章的本地补充按用户明确确认一起发布，原日期不变。
- 隔离写作验收：草稿不公开；发布后自动进入首页、时间线和搜索；+08:00 日期在 UTC 构建下稳定；图片正常输出；缺图、缺日期阻止检查或构建。
- 单元检查覆盖文件名边界、时区、空正文、同名保护及内容/日期保留。
- 浏览器检查最近更新 6 篇、精选 3 篇；320px、桌面、200% 放大和 RTL 镜像未出现横向溢出。320px 与桌面截图保存在本目录，仅本地留存。
- 原工作区文章均未由本次工具改写。原 source 文件的内容校验值只有本次修改的 linsist/app.js 和 style.css 发生变化。

## 云端证据

- PR：https://github.com/Lin-sist/Lin-sist.github.io/pull/1 ，已合并。
- PR 检查：https://github.com/Lin-sist/Lin-sist.github.io/actions/runs/41188493981 ，构建成功，部署按设计跳过。
- 首次正式自动发布：https://github.com/Lin-sist/Lin-sist.github.io/actions/runs/41188609213 ，构建与部署均成功。
- Pages 已切换为 GitHub Actions；github-pages 环境允许 hexo 和原 main 两个明确分支。

## 保留范围

迁移前未在公开索引内的 10 篇 _posts 笔记及 1 篇根目录笔记由 ignore 保留，未移动或修改。原工作区 Obsidian 状态、附件及其他未提交资料保留。

日常步骤见根目录 WRITING.md：新建草稿 → 写作 → 准备公开 → 在编辑器选择文章/图片提交 → 推送。保存笔记不会直接上线。
