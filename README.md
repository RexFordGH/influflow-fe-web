# InfluFlow Web（Frontend）—— AI 内容创作与分发平台 Web 客户端

面向 KOL/创作者的智能写作与分发工具。基于 Next.js App Router + Supabase + React Query + Tailwind/HeroUI 构建，提供从话题洞察、草案确认、流式生成、编辑优化到发布管理的一站式体验。

> 风格对齐后端 readme-be.md：本 Readme 以“高层概览 + 快速落地 + 架构与规范”为核心，覆盖功能说明、技术栈、环境变量、开发与部署、目录结构与扩展指南。

---

## ✨ 核心功能

- 🤖 生成编排：Generation Orchestrator 统一调度“草案确认 ➜ 内容生成”两阶段流程（支持不同 Mode）
- 🧭 趋势洞察：话题趋势与推荐（搜索/选择热门推文增强上下文）
- 🧠 思维导图编辑：可视化结构编辑，驱动重新生成（Mindmap）
- ✍️ 智能润色：段落级 AI 编辑（基于 TipTap/ProseMirror 的富文本体验）
- 🖼️ 配图生成/上传：本地上传（Supabase Storage）或 AI 生成
- 🔁 流式会话：基于 SSE 的 Agent Chat（稳定重连与完成态处理）
- 👤 用户体系：Supabase Auth（Twitter/X OAuth、Email Dev 模式）
- 💳 订阅与积分：积分校验弹窗、套餐/额度映射与同步
- 📦 BFF 代理：Next API Route 统一代理后端 API（含长耗时与 SSE 场景）
- 📱 响应式 UI：Tailwind CSS + HeroUI + Framer Motion 动效

---

## 🧱 技术栈与关键依赖

- 应用框架：Next.js 15（App Router, React 19, Turbopack Dev）
- 组件与样式：Tailwind CSS 3 + HeroUI（@heroui/react）
- 状态与数据：@tanstack/react-query, Zustand
- 富文本/渲染：TipTap/ProseMirror, Markdown（unified/remark）
- 流式通信：@microsoft/fetch-event-source（SSE），Next API 代理转发
- 鉴权与数据：Supabase（SSR/Browser Client，Storage 上传）
- 动效与交互：framer-motion, lottie-react, driver.js 引导
- 其他：ESLint 9 + Prettier + Husky/Lint-Staged；TypeScript 5

---

## 🚀 快速开始

### 1) 环境准备

- Node.js ≥ 18（推荐 20）
- PNPM（项目已声明 `packageManager: pnpm@9`）

### 2) 安装依赖

```bash
pnpm install
```

### 3) 配置环境变量（必需）

在项目根目录创建 `.env.local`，示例：

```bash
# 运行环境（控制 API 代理逻辑）
NEXT_PUBLIC_ENV=local # local | test | production

# 后端 API（非 local 环境下直连）
NEXT_PUBLIC_API_BASE_URL=https://influflow-api.up.railway.app

# Supabase（浏览器/服务端）
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# 可选：仅在服务端 Route 使用（切勿泄露到浏览器）
SUPABASE_SERVICE_KEY=your_supabase_service_key

# 站点与登录
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_EMAIL_AUTH_ENABLED=false
```

说明：
- 本地开发时若 `NEXT_PUBLIC_ENV=local`，前端会走 `/api/proxy` 由 Next 路由转发到后端，以便支持长耗时与自定义超时；否则直连 `NEXT_PUBLIC_API_BASE_URL`。
- `SUPABASE_SERVICE_KEY` 仅在 `app/api/upload/image` 服务端上传图片时使用，必须安全注入（如 Vercel/平台 Secrets），严禁暴露到客户端。

### 4) 本地运行

```bash
pnpm dev
```

打开 http://localhost:3000 即可预览。

---

## 🧪 开发脚本

- `pnpm dev`：启动开发（Turbopack）
- `pnpm build`：生产构建
- `pnpm start`：启动生产服务
- `pnpm format`：Prettier + ESLint + TypeCheck（组合）
- `pnpm lint`：ESLint 校验并修复
- `pnpm tsc`：TypeScript 类型检查

提交前（husky + lint-staged）会自动格式化并校验 `*.ts, *.tsx`。

---

## 🔧 环境变量清单

必需：
- `NEXT_PUBLIC_SUPABASE_URL`：Supabase 项目 URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`：Supabase 匿名 Key
- `NEXT_PUBLIC_ENV`：`local | test | production`
- `NEXT_PUBLIC_API_BASE_URL`：后端 API 基地址（非 local 下使用）

可选：
- `SUPABASE_SERVICE_KEY`：服务端使用的 Supabase Service Key（仅 API Route 使用）
- `NEXT_PUBLIC_SITE_URL`：站点地址（OAuth 回跳用）
- `NEXT_PUBLIC_EMAIL_AUTH_ENABLED`：开发环境下是否显示 Email 登录

---

## 🗂️ 目录结构

```
app/                      # Next.js App Router（页面 & API 路由）
  api/                    # BFF 与服务端功能（SSE/代理/上传/回调等）
  article-tutorial/       # 指南页（驱动 Onboarding）
  profile/                # 个人资料页
  referral/[code]/        # 邀请码登录落地页
  subscription/           # 订阅/套餐页
components/               # UI 组件与业务组件
  generation/             # 生成编排（新架构入口）
  Renderer/               # 内容渲染器（TipTap/Markdown/Mindmap 等）
  layout/                 # 布局/Sidebar/Topbar/Providers
  trending/               # 趋势与话题相关组件
  draft/                  # 草案确认与对话
lib/
  api/                    # REST 客户端封装、SSE、异步任务轮询
  supabase/               # Supabase SSR/Browser 客户端
  markdown/               # Markdown 解析工具
constants/                # 环境变量等
public/                   # 静态资源（图标/字体/图片/Lottie）
styles/                   # 全局样式（Tailwind）
```

---

## 🧭 架构与关键设计

### 前端运行时
- Next.js App Router（React 19）
- Providers：HeroUI + React Query + Toaster + AuthProvider + SubscriptionSync
- 动态导入与禁 SSR：部分编辑/渲染组件使用 `next/dynamic({ ssr:false })`

### BFF/API 代理
- `/app/api/proxy/[...slug]`：统一代理到 `API_BASE_URL`，解决 Next rewrites 无法配置超时的问题（AI 接口 10~30s）
- `/app/api/agent/chat/stream`：SSE 代理与稳定连接（nodejs runtime, force-dynamic）
- `/app/api/upload/image`：服务端使用 `createAdminClient()` 直传 Supabase Storage（类型/大小校验）
- `/app/api/auth/callback`：Supabase OAuth 回调（自动创建用户 profile + 调用后端 sign-up 初始化）

### 数据与状态
- React Query 统一管理异步请求/缓存；Zustand 管理认证与订阅状态
- Token 刷新：401 时通过 `supabase.auth.refreshSession()` 自动更新并重试
- Credits：后端返回 `code=42000` 时触发弹窗提醒

### 生成编排（新架构）
- `components/generation/GenerationOrchestrator` 编排“草案确认 ➜ 生成”两阶段
- `useGenerateThread / useAsyncThreadGeneration` 支持同步/异步模式、长任务轮询与持久化读取

### 富文本与可视化
- TipTap/ProseMirror 作为编辑内核；Markdown 渲染与 GFM 支持
- Mindmap 可视化结构编辑（React Flow + dagre/elkjs 布局）

---

## 🔌 与后端的交互

- 基础 REST：`/api/twitter/*`（生成、修改、图片生成、趋势、Job 状态等）
- SSE：`/api/agent/chat/stream?chat_thread_id=...`（流式事件，多段消息，`chat.done` 结束）
- 认证：Supabase OAuth（Twitter/X）；开发模式可开启 Email 登录

> 开发提示：本地（`NEXT_PUBLIC_ENV=local`）优先走 `/api/proxy`，生产/测试直连 `NEXT_PUBLIC_API_BASE_URL`。

---

## 🛡️ 安全与合规

- `SUPABASE_SERVICE_KEY` 仅在服务端路由中使用，严禁暴露到客户端
- API Proxy 会剥离 `Content-Encoding/Length` 等潜在问题 Header，避免中间层兼容风险
- SSE 稳定性：心跳/空事件过滤；完成态后主动关闭；限制最大重连次数
- OAuth 回调：失败时统一 `/?error=...` 参数回传并展示登录弹窗

---

## 🚢 部署指南

- 目标平台：Vercel 或任意 Node.js 平台
- Node Runtime：SSE 路由显式设置 `export const runtime = 'nodejs'`
- 环境变量：通过平台 Secret 注入（尤其是 `SUPABASE_SERVICE_KEY`）
- 构建启动：`pnpm build && pnpm start`

---

## 🧰 调试与排障

- 代理/超时：长耗时接口使用 `/app/api/proxy`，避免 Next rewrites 超时限制
- Token 过期：401 自动刷新；若刷新失败将登出并提示重新登录
- 图片上传：仅允许 `image/*`，最大 10MB；上传成功会返回公开 URL
- 趋势搜索：若频繁调用，请关注后端限流策略

---

## 🤝 贡献与规范

1. 分支：feature/*、fix/*、chore/*
2. 提交：建议遵循 Conventional Commits
3. 代码：通过 `pnpm format` 与 `pnpm tsc` 保持风格与类型稳定
4. PR：附上功能截图/录屏与测试说明

---

## 📝 License

本仓库为 InfluFlow 前端子项目，遵循与主项目一致的授权策略（如无特别声明，默认 MIT）。
