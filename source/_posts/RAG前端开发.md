---
title: RAG前端开发
tags: [RAG]
date: 
---

# RAG 前端项目完整架构解读

## 0. 先用一个比喻理解整体结构

想象你开了一家**餐厅**：
- **Vue + Vite** = 餐厅的建筑框架（毛坯房 + 装修工具）
- **Element Plus** = 餐厅里的标准家具（桌椅、餐盘，你不需要自己焊桌子）
- **Pinia** = 餐厅的中央厨房（统一管理所有菜品的状态，前厅服务员都来这里取菜）
- **Vue Router** = 餐厅的导航牌（告诉顾客哪个门进哪个包间）
- **Axios** = 送外卖的骑手（负责和后端厨房通信）

---

## 1. 项目根配置文件（"餐厅的营业执照和设计图纸"）

| 文件 | 类比 | 作用 |
|------|------|------|
| package.json | 餐厅的材料清单 | 列出所有依赖库（vue、element-plus、axios、pinia等）和启动脚本（`npm run dev` 启动开发服务器） |
| vite.config.ts | 装修方案 | 配置了：① `@` 路径别名（写 `@/api/xxx` 等于 `src/api/xxx`）② 开发服务器端口 5173 ③ **代理规则**：访问 `/api` 和 `/auth` 会转发到后端 `localhost:8080`，解决跨域问题 |
| tsconfig.json | TypeScript 的规矩手册 | 告诉 TS 编译器：用 ES2020 标准、严格模式、路径别名映射等 |
| index.html | 餐厅大门 | 整个单页应用的唯一 HTML 入口，里面就一个 `<div id="app">`，Vue 会把所有内容渲染进去 |
| .env.development | 开发环境配置 | 定义 `VITE_API_BASE_URL` 等环境变量 |
| .env.production | 生产环境配置 | 打包上线时用的配置 |

### 重点概念：Vite 代理（Proxy）

> **类比**：你在家（浏览器 `localhost:5173`）想点外卖（请求后端 `localhost:8080`），但外卖平台不允许跨区域送（浏览器跨域限制）。所以你让楼下便利店（Vite 代理）帮你代收，便利店和外卖平台在同一个区——问题解决！

---

## 2. 入口文件（"餐厅开门营业"）

### src/main.ts — 程序启动入口

```
创建 Vue 应用 → 注册 Element Plus 图标 → 安装 Pinia → 安装 Router → 安装 Element Plus → 挂载到 #app
```

**每一行的意义**：
- `createApp(App)` — 创建 Vue 应用实例
- `createPinia()` — 创建全局状态管理器
- `app.use(router)` — 安装路由（告诉 Vue "有哪些页面"）
- `app.use(ElementPlus)` — 安装 UI 组件库
- `app.mount('#app')` — 把整个应用"钉"到 index.html 的 `<div id="app">` 上

### src/App.vue — 根组件

只有一行 `<router-view />`——意思是 "这里根据当前 URL 显示对应的页面"。

---

## 3. 路由系统（"餐厅的导航图"）

### src/router/index.ts

**路由就是 URL 和页面的映射关系**，就像地图的图例：

| URL 路径 | 加载的布局 | 加载的页面 | 说明 |
|----------|-----------|-----------|------|
| `/login` | AuthLayout（登录专用布局） | LoginView | 登录页 |
| `/` | DefaultLayout（主布局） | → 重定向到 `/knowledge-base` | |
| `/knowledge-base` | DefaultLayout | KBListView | 知识库列表 |
| `/knowledge-base/:id` | DefaultLayout | KBDetailView | 知识库详情（`:id` 是动态参数） |
| `/chat` | DefaultLayout | ChatView | 聊天问答页 |
| `/history` | DefaultLayout | HistoryView | 历史记录页 |

**导航守卫**（代码底部的 `router.beforeEach`）：
> **类比**：餐厅门口的保安。每个人进门前都要被检查——没登录的（没有 token）全部拦下来，送到登录页。已经登录的人如果试图去登录页，就直接送到主页。

**懒加载**（`() => import(...)`）：
> 不是一次性把所有页面代码都下载，而是用户访问某个页面时才加载——像是"按需配菜"，不浪费。

---

## 4. 样式系统（"餐厅的装修风格统一指南"）

### src/styles/variables.css — CSS 变量定义

这是整个设计系统的**"调色盘 + 尺码表"**。通过 CSS 变量（`--rag-xxx`），所有组件共享同一套视觉规范：

- **颜色**：主色 `#4F46E5`（靛蓝）、文字色、背景色、边框色
- **圆角**：按钮 8px、卡片 12px、输入框 24px
- **阴影**：分三级（卡片、悬浮、大浮层）
- **间距**：统一 4 的倍数（4/8/12/16/24/32/48px）
- **字体大小**：标题 28px/22px、正文 14px、小字 12px

> **为什么用变量？** 比如你想把主色从蓝色换成绿色，只需要改 `--rag-primary: #10B981` 这一行，全站所有用到主色的地方自动变化。如果到处写死 `#4F46E5`，改起来就要找几百个地方。

### src/styles/global.css — 全局样式

定义了：全局 reset（清除默认边距）、字体、滚动条美化、文字选中色、一些通用类名（`.rag-card`）。

---

## 5. 类型定义（"点菜单的标准格式"）

TypeScript 的 `interface` 就像一份**合同模板**——规定了数据长什么样子。

### src/types/ 目录

| 文件 | 定义了什么 | 类比 |
|------|-----------|------|
| api.ts | `ApiResponse<T>`（通用响应格式）、`PageResult<T>`（分页结果） | 所有外卖包裹的标准包装盒 |
| auth.ts | `LoginRequest`（登录请求）、`AuthResponse`（登录响应，含 token） | 会员卡申请表和会员卡 |
| knowledgeBase.ts | `KnowledgeBaseDTO`（知识库信息）、`CreateKBRequest`、`KnowledgeBaseStatistics` | 书架的信息卡 |
| document.ts | `DocumentInfo`（文档信息）、`DocumentStatus`（状态枚举） | 书架上每本书的信息 |
| qa.ts | `AskRequest`（提问请求）、`QAResponse`（回答）、`Citation`（引用来源）、`RetrievedContext`（检索上下文） | 提问单和答案回执 |
| history.ts | `QAHistoryDTO`（历史记录）、`QAFeedbackDTO`（反馈） | 问答日记本 |
| task.ts | `TaskStatusResponse`（异步任务状态）、`TaskState` | 外卖订单追踪 |

> **为什么需要类型？** 没有类型的 JS，就像没有菜谱的厨师——你不知道 `response.data` 里到底有什么字段。TypeScript 的类型会让编辑器自动补全，写错字段名会直接报红。

---

## 6. API 层（"服务员的标准话术"）

### src/api/request.ts — Axios 封装（核心！）

这是整个前端和后端通信的**总管**。它做了三件关键事：

1. **请求拦截器**：每次发请求前，自动从 localStorage 取出 token 塞到请求头的 `Authorization` 里
2. **Token 自动刷新**：当后端返回 401（token 过期），不是直接踢用户去登录，而是：
   - 用 `refreshToken` 去换新的 `accessToken`
   - 在刷新期间，其他请求排队等待
   - 刷新成功后，排队的请求自动重发
   - 刷新也失败了？那才跳登录页
3. **响应拦截器**：统一处理错误（后端返回的 code 不是 200、HTTP 状态码 403/404 等）

> **Token 刷新类比**：你的门禁卡（accessToken）过期了，保安（拦截器）不是直接赶你走，而是帮你打电话给物业（refresh 接口）换新卡。换新卡期间你和后面的人在门口等着，新卡到了大家一起进门。如果物业说"你这个人已经注销了"（refresh 也失败），那就只能回去重新办卡（登录）。

### 其他 API 文件

| 文件 | 对接后端哪些接口 | 作用 |
|------|---------------|------|
| auth.ts | `/auth/login`、`/auth/logout`、`/auth/refresh` | 登录、登出、刷新 token |
| qa.ts | `/api/qa/ask`（同步）、`/api/qa/ask/stream`（流式通过 SSE 实现） | 向知识库提问 |
| knowledgeBase.ts | `/api/knowledge-bases/...` | 知识库的 CRUD + 文档上传/删除 |
| history.ts | `/api/history/...` | 问答历史查询、删除、反馈 |
| task.ts | `/api/tasks/{taskId}` | 查询异步任务状态（文档处理进度） |

---

## 7. 工具函数（"厨房里的小工具"）

### src/utils/storage.ts
封装了 `localStorage` 的读写，所有 token 前缀都是 `rag_`，防止和其他应用冲突。

### src/utils/format.ts
三个格式化工具：日期格式化、文件大小格式化（bytes → KB/MB）、文本截断。

---

## 8. 全局状态管理 — Pinia Store（"中央厨房"）

### Pinia 是什么？

> **类比**：多个服务员（组件）之间共享信息。比如"用户登录了没"这个信息，登录页要写入、侧边栏要读取、路由守卫要检查——如果每个组件自己存一份，会乱套。Pinia 就是一个**公共黑板**，大家都看同一块板子。

### src/stores/auth.ts — 认证状态

管理：`accessToken`、`refreshToken`、`userInfo`、`isLoggedIn`（计算属性）

### src/stores/chat.ts — 聊天状态（最复杂！）

管理：
- `messages` — 所有聊天消息的数组
- `currentKbId` / `currentKbName` — 当前选中的知识库
- `isStreaming` — 是否正在流式接收 AI 回复
- `topK` — 检索参数

提供的方法：
- `addMessage()` — 添加新消息
- `appendToLastAssistant()` — 流式聊天时，把新收到的文字块追加到最后一条 AI 消息
- `setLastAssistantMeta()` — 设置引用来源和上下文
- `setLastAssistantError()` — 标记错误

### src/stores/knowledgeBase.ts — 知识库状态

管理知识库列表 + 当前选中 + 统计信息。封装了所有 CRUD 操作，操作完自动更新本地列表。

---

## 9. Composables（"可复用的操作手册"）

Vue 3 的 `composable` 就是把**一组相关的逻辑**打包成一个函数，哪个组件需要就拿去用。

### src/composables/useAuth.ts — 认证操作

封装了 `login()`、`logout()`、`refresh()`，内部调用 API + 更新 Store，外部组件只需要调一个函数。

### src/composables/useSSE.ts — 流式接收（核心 RAG 特性！）

> **SSE（Server-Sent Events）类比**：普通请求像写信——你寄出去，等回信。SSE 像打电话——连上后，对方一边想一边说，你实时听到。这就是"AI 打字效果"的实现原理。

工作流程：
1. 用 `fetch` 发送 POST 请求到 `/api/qa/ask/stream`
2. 用 `ReadableStream` 持续读取后端推送的数据
3. 后端每推一个文字块（格式 `data:xxx`），前端就解析出来，通过回调函数实时追加到页面
4. 收到 `[DONE]` 表示结束

### src/composables/useTaskPolling.ts — 任务轮询

> **轮询类比**：你在快递柜取件，快递还没到——你每 2 秒看一次手机有没有取件码。这就是轮询。

上传文档后，后端返回一个 `taskId`。前端每 2 秒查一次这个任务的状态，直到 `COMPLETED` 或 `FAILED`。

---

## 10. 布局组件（"餐厅的房间格局"）

### src/layouts/AuthLayout.vue — 登录页布局

深色背景 + 三个动画光斑 + 毛玻璃卡片（`backdrop-filter: blur(20px)`）。`<router-view />` 里放的是 LoginView。

### src/layouts/DefaultLayout.vue — 主布局

```
┌──────────────────────────────────┐
│ AppSidebar │     AppHeader       │
│  (左侧栏)   │─────────────────────│
│            │    <router-view>    │
│            │    (主内容区)         │
└──────────────────────────────────┘
```

关键点：
- `isCollapse` 控制侧边栏折叠
- `<transition name="fade-slide">` 让页面切换有淡入滑出动画

---

## 11. 公共组件（"餐厅的常驻设施"）

### src/components/common/AppSidebar.vue — 侧边栏

- 深色背景（`#0F172A`）
- Logo + 三个导航项（知识库管理、智能问答、问答历史）
- 当前菜单项有左侧紫色指示条（`border-left: 3px solid var(--rag-primary)`）
- 接收 `collapsed` prop 控制折叠

### src/components/common/AppHeader.vue — 顶部栏

- 左侧：折叠按钮 + 当前页标题
- 右侧：用户头像 + 下拉菜单（退出登录）

### src/components/common/LoadingSpinner.vue — 加载动画

一个旋转图标 + 可选文字提示。

---

## 12. 聊天模块（"核心中的核心"）

### src/views/chat/ChatView.vue — 聊天主页面

布局：
```
┌──────────┬─────────────────────────┐
│ 知识库列表 │     消息列表（滚动区）      │
│          │                         │
│          │     欢迎页/消息          │
│          │                         │
│          │─────────────────────────│
│ 清空对话  │     输入框（底部悬浮）      │
└──────────┴─────────────────────────┘
```

**核心逻辑**：
1. 页面挂载时加载知识库列表
2. 用户点击左侧选择知识库
3. 输入问题 → 添加 user 消息 → 添加空的 assistant 占位 → 根据开关走**流式**或**同步**
4. `scrollToBottom()` 通过 `scrollIntoView` 自动滚到底部

### src/components/chat/ChatMessage.vue — 单条消息

这是 UI 最复杂的组件：

- **头像**：AI 用品牌 SVG 图标，用户用名字首字母
- **Markdown 渲染**：用 `markdown-it` 库把 AI 的 Markdown 文本转成 HTML
- **代码高亮**：用 `highlight.js`，注册了 JS/TS/Python/Java/SQL 等语言
- **代码块复制按钮**：每个代码块上方有"复制"按钮
- **Loading 骨架屏**：AI 思考中展示灰色条纹动画
- **流式光标**：AI 正在输出时，内容末尾有一个闪烁的紫色竖线
- **引用来源**：通过 `CitationList` 子组件展示
- **操作栏**：hover 时显示复制按钮

### src/components/chat/ChatInput.vue — 输入框

- 居中悬浮，最大宽度 768px，大圆角 24px
- 工具条：TopK 设置 + 流式/同步开关
- Enter 发送，Shift+Enter 换行
- 圆形发送按钮（有内容时变紫色可点击）
- 底部免责声明

### src/components/chat/CitationList.vue — 引用来源卡片

可折叠展开的引用列表，显示来源文档名 + 相关片段。这是 **RAG 的核心特色**——让用户知道 AI 的回答来自哪些文档。

---

## 13. 知识库模块

### src/views/knowledge-base/KBListView.vue — 知识库列表页

卡片网格布局，每个知识库是一张 KBCard。支持创建、编辑（弹窗复用）、删除、查看统计。

### src/views/knowledge-base/KBDetailView.vue — 知识库详情页

最复杂的页面之一：
- 基本信息展示（描述、向量集合名、文档数）
- 统计面板（文档/向量/查询次数）
- **文档上传**（DocUploader）+ **处理进度跟踪**（DocProgress）+ **文档列表**（DocList）
- 上传后自动启动轮询追踪任务状态

### 知识库相关组件

| 组件 | 作用 |
|------|------|
| KBCard.vue | 知识库卡片：顶部渐变条 + 圆形图标 + 名称 + 描述 + 文档数 badge + hover 上浮效果 |
| KBCreateDialog.vue | 创建/编辑弹窗（同一个组件，通过 `editData` prop 区分模式） |
| KBStatsPanel.vue | 统计面板：三列数字（文档数、向量数、查询次数） |

---

## 14. 文档管理组件

| 组件 | 作用 |
|------|------|
| DocUploader.vue | 拖拽上传区域，支持 PDF/MD/DOCX/TXT/代码文件，单次最多 5 个。逐个上传，每个成功后触发 `uploaded` 事件 |
| DocList.vue | 文档表格：显示标题、类型、状态（PENDING→PROCESSING→COMPLETED）、分块数、操作 |
| DocProgress.vue | 进度条面板：显示每个上传任务的实时处理进度（带条纹动画） |

---

## 15. 历史记录模块

### src/views/history/HistoryView.vue — 历史列表页

- 支持按知识库筛选
- 分页查询
- 点击打开详情抽屉（Drawer）：完整问答 + Markdown 渲染 + 引用来源 + 元信息（延迟、traceId）
- 支持提交反馈和删除

| 组件 | 作用 |
|------|------|
| HistoryItem.vue | 单条历史记录：问题 + 回答摘要 + 知识库标签 + 延迟 + 时间 + 操作按钮 |
| FeedbackDialog.vue | 反馈弹窗：星级评分 + 文字评论 |

---

## 16. 完整数据流图（以"聊天提问"为例）

```
用户输入问题 → ChatInput.vue 
    ↓ emit('send')
ChatView.vue → chatStore.addMessage(user 消息) 
             → chatStore.addMessage(空 assistant 占位)
    ↓ 
  流式？
    ├─ 是 → useSSE.connect('/api/qa/ask/stream', body)
    │         ↓ 后端逐字推送
    │       onChunk → chatStore.appendToLastAssistant(chunk)
    │         ↓ 完成
    │       chatStore.setLastAssistantLoading(false)
    │
    └─ 否 → askApi(request.post('/api/qa/ask'))
              ↓ request.ts 拦截器自动带 token
            后端返回完整 QAResponse
              ↓
            chatStore.updateLastAssistantMessage(answer)
            chatStore.setLastAssistantMeta(citations, contexts)
```

---

## 17. 你改造前端时最该关注的文件

如果你想动手改界面，按**影响范围**排序：

1. **variables.css** — 改颜色/圆角/间距，全局立刻生效
2. **ChatMessage.vue** — 聊天气泡的外观
3. **ChatInput.vue** — 输入框样式
4. **ChatView.vue** — 聊天页整体布局
5. **AppSidebar.vue** — 侧边栏导航
6. **AuthLayout.vue** — 登录页背景

---

## 🙋 理解测试

现在我问你几个问题来检验你的理解：

1. **如果你想把整个网站的主题色从紫蓝色改成绿色，你需要改哪个文件的哪些变量？**

2. **用户在聊天页面输入问题后，数据经过了哪几个"站"才最终显示在屏幕上？（提示：输入框 → ??? → ??? → 页面渲染）**

3. **request.ts 里的 Token 刷新机制中，`pendingRequests` 队列解决了什么问题？如果没有这个队列，会发生什么？** 

Completed: *整理并输出完整介绍* (4/4)