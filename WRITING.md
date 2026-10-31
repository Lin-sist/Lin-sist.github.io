# 写博客

日常只需要写 Markdown、选择要公开的文章和图片、提交并推送源码。

## 新建一篇草稿

```powershell
npm run new -- "今天想记录的一件事"
```

打开 `source/_drafts/今天想记录的一件事.md` 开始写。标题和带 +08:00 时区的日期已自动填写；标签、摘要都可不填。几句话也可以发布，不必写完整教程。

图片建议放在 `source/img/posts/`，使用标准 Markdown，例如 `![排查结果](/img/posts/debug.png)`。Obsidian 中将链接格式设为 Markdown；避免仅能在本地笔记库识别的 `![[图片]]`。

可选本地预览：

```powershell
npm run dev
```

默认地址是 http://localhost:4000 。这个本地预览包含草稿；正式构建不包含草稿。仓库为公开仓库，`_drafts` 只能保证不生成公开网页，私密笔记请保存在仓库外。

## 准备公开

```powershell
npm run publish -- "今天想记录的一件事"
```

这会将草稿移到 `_posts`，保留标题、正文和日期，不会覆盖同名文章，也不会自动提交。之后在编辑器的 Git 面板中，只选择本篇文章和使用的图片，填写提交说明并提交。其他未完成笔记可以留在本地。

```powershell
npm run ship
```

命令只推送已经提交的内容到 `hexo`，不会运行 `git add .` 或自动提交。也可以直接点击编辑器的推送按钮。GitHub Actions 自动安装固定 Node、检查站点并发布。查看结果：

https://github.com/Lin-sist/Lin-sist.github.io/actions

成功后打开 https://lin-sist.github.io/ 。文章会自动进入最近更新、时间线和搜索，无需编辑首页或历史日期 JSON。每篇不需要额外维护 editorial 配置。

`npm run deploy` 也会调用上述源码推送入口。旧的 Git 静态文件部署插件已移除，统一由 Actions 发布。

## 环境与检查

- Node：`.nvmrc` 中固定的 Node 24；本地和 CI 共用。
- Hexo：8.1.2；依赖以 `package-lock.json` 为准，首次准备运行 `npm ci`。
- `npm run verify`：在 `.build/site` 中全新构建并检查，独立于原来的 `public` 与 `db.json`。
- `npm test`：验证草稿创建、时区、拒绝空正文和不覆盖已有文章。
- 老文章继续由 `published_dates.json` 恢复原日期、更新时间和链接。修改旧文章的标题与正文时，也不会改变已有地址。
- 新文章的日期自动写入，不要清空。需要显式更新“修改时间”时可填写带时区的 `updated`。
- 当前保留旧文章的 `updated` 时间；没有明确 `updated` 的新文章使用 `date`，避免云端检出时间被误显示为文章修改时间。

`_config.yml` 的 ignore 列出了本次迁移前未进入线上索引的 10 篇笔记及 1 篇根目录笔记，它们没有被移动或改写。准备公开其中一篇时，先完善标题、日期、正文，再删除对应 ignore 条目并提交。以后用 `npm run new` 创建的文章不需要调整该清单。

## 发布失败

构建和检查失败时不会运行部署，线上保留上一个成功版本。修正报错后重新提交即可；网络或平台暂时错误可在 Actions 中重新运行该次工作流。

首次迁移保留原 `main` 静态分支。需要回退整套发布方式时，在仓库 Settings → Pages 将 Source 恢复为 Deploy from a branch，选择 main / root。之后文章级回退优先使用 Git 的“还原提交”，再推送触发新构建。

维护时运行 `npm ci`，避免每次写文章顺便升级依赖。Dependabot 改为每月集中提出兼容更新，升级后仍需构建通过。
