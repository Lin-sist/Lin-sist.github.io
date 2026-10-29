# 作品页与动效

首页精选作品、作品总览与两个案例共用项目数据。RAG 展示本地应用界面，Flashback 展示 HTML 体验原型，并分别说明已有实现与待验证方向。

## 页面

- 首页作品入口：`/#work`
- 作品总览：`/work/`
- RAG 案例：`/work/rag/`
- 时光回序案例：`/work/flashback/`

## 素材与介绍

RAG 包含登录、新问答、知识库详情和已有问答的引用界面。截图不构成回答质量或生产可用性结论。

时光回序使用首页、书写、保存、时间轴与回看五张 demo 截图，去除展示用设备外框。回看采用完整长图，保留底部操作。介绍围绕保存当下、第一人称表达、用户主动邀请 AI 与时间解释权展开；长期方向不冒充当前实现。

## 维护

- 项目数据：`source/_data/works.json`
- 页面：`themes/butterfly/layout/linsist-work.ejs`
- 封面组合：`themes/butterfly/layout/_partial/linsist-work-cover.ejs`
- 作品样式：`source/linsist/work.css`
- 首页入口样式：`source/linsist/home-projects.css`
- 图片：`source/linsist/assets/work/`
- 动效：`source/linsist/motion.css` 与 `motion.js`，详细说明见 `MOTION_DESIGN.md`

## 验证

```sh
node node_modules/hexo/bin/hexo generate
node tools/check-home.cjs
node tools/check-work.cjs
node tools/check-reading.cjs
node tools/check-editorial.cjs
```

本地浏览器已检查手机 / 桌面布局、筛选、搜索、截图放大、键盘关闭与焦点恢复、原生跨页图片过渡、浏览器返回、减少动态效果与无脚本回退。真实设备、跨浏览器、屏幕阅读器和整体性能仍需单独验证。
