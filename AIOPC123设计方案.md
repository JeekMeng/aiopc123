# AIOPC123 动态功能设计方案

## 概述

AIOPC123 导航网站基于 Hugo + WebStack-Hugo 主题构建，现需新增用户登录、个人收藏、评论等动态功能。方案采用 Cloudflare Workers + D1 + KV 作为后端 API 层，在保持 Hugo 静态站点不变的前提下，通过 `/api/*` 路径提供 REST API，实现动态交互。

## 架构

```
Cloudflare Workers（单一部署）
├── 静态资源 → Hugo 构建输出 (public/)
│   ├── /              → 首页（导航分类展示）
│   ├── /site/200387/  → 站点详情页
│   └── ...
└── API 路由 → Worker 动态处理
    ├── /api/auth/*       → 注册/登录/登出
    ├── /api/bookmarks/*  → 个人收藏 CRUD
    └── /api/comments/*   → 评论 CRUD
```

## 技术栈

| 层 | 技术 |
|---|---|
| 运行时 | Cloudflare Workers |
| API 框架 | Hono |
| 数据库 | D1（用户、收藏、评论） |
| 会话存储 | KV（session token） |
| 密码哈希 | bcryptjs（兼容 nodejs_compat） |
| 前端 | Hugo 静态页面 + Vanilla JS |

## 数据模型 (D1)

```sql
-- 用户
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  nickname TEXT NOT NULL,
  avatar TEXT DEFAULT '',
  role TEXT NOT NULL DEFAULT 'user',
  last_login_ip TEXT DEFAULT '',
  created_at TEXT DEFAULT (datetime('now'))
);

-- 个人收藏（可收藏站内或外部链接）
CREATE TABLE bookmarks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  site_id INTEGER,
  title TEXT NOT NULL,
  url TEXT NOT NULL,
  description TEXT DEFAULT '',
  logo TEXT DEFAULT '',
  is_public INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 评论（关联 Hugo 站点路径）
CREATE TABLE comments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  site_id TEXT NOT NULL,
  parent_id INTEGER DEFAULT NULL,
  content TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (parent_id) REFERENCES comments(id) ON DELETE CASCADE
);

-- 入驻申请
CREATE TABLE submissions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  logo TEXT DEFAULT '',
  city TEXT NOT NULL,
  categories TEXT NOT NULL DEFAULT '[]',
  summary TEXT NOT NULL,
  detail TEXT DEFAULT '',
  tags TEXT DEFAULT '[]',
  website TEXT NOT NULL,
  wechat TEXT DEFAULT '',
  contact_name TEXT NOT NULL,
  contact_phone TEXT NOT NULL,
  notes TEXT DEFAULT '',
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TEXT DEFAULT (datetime('now'))
);
```

## API 设计

### 认证

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/auth/register` | 注册 `{ email, password, nickname }`，自动记录注册 IP |
| POST | `/api/auth/login` | 登录 `{ email, password }`，更新登录 IP |
| POST | `/api/auth/logout` | 登出 |
| GET | `/api/auth/me` | 获取当前用户信息 |
| POST | `/api/auth/change-password` | 修改密码 `{ currentPassword, newPassword }`（需登录） |

### 收藏管理（需登录）

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/bookmarks` | 获取我的收藏列表 |
| POST | `/api/bookmarks` | 添加收藏 |
| PUT | `/api/bookmarks/:id` | 修改收藏 |
| DELETE | `/api/bookmarks/:id` | 删除收藏 |

### 评论

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/comments?site=:site_id` | 获取站点评论列表 |
| POST | `/api/comments` | 发表评论（需登录） |
| DELETE | `/api/comments/:id` | 删除自己的评论（需登录） |

### 入驻申请

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/submissions` | 提交入驻申请 |

### 管理后台（需 admin 角色）

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/admin/setup` | 设置管理员（密钥保护） |
| GET | `/api/admin/users` | 用户列表（含登录 IP） |
| PATCH | `/api/admin/users/:id/role` | 切换用户角色 |
| DELETE | `/api/admin/users/:id` | 删除用户（级联删除收藏/评论） |
| GET | `/api/admin/comments` | 全部评论列表 |
| DELETE | `/api/admin/comments/:id` | 删除评论 |
| GET | `/api/admin/submissions` | 入驻申请列表 |
| PATCH | `/api/admin/submissions/:id/status` | 审核通过/拒绝 |
| DELETE | `/api/admin/submissions/:id` | 删除入驻申请 |

## 前端修改点

```
themes/WebStack-Hugo/layouts/partials/
├── header.html         ← 添加用户登录状态栏
├── top_nav.html        ← 添加登录/注册/用户菜单
├── footer.html         ← 添加 dynamic.js + 侧栏锚点滚动修复
├── sidebar.html        ← 侧栏分类导航
├── content_main.html   ← 首页主体
├── content_search.html ← 搜索框区域
└── content_footer.html ← 底部信息

layouts/site/
└── single.html         ← 添加收藏按钮 + 评论区

layouts/_default/
├── profile.html        ← 个人中心模板
├── admin.html          ← 管理后台模板
└── upload.html         ← 入驻申请模板

content/
├── profile.md          ← 个人中心页面（含修改密码表单）
├── admin.md            ← 管理后台页面（4 tab：用户/评论/入驻审核/修改密码）
└── upload.md           ← 入驻申请页面

static/assets/
├── js/dynamic.js       ← API 交互核心 JS（~950 行）
├── css/dynamic.css     ← 自定义样式（~370 行）
└── (主题 JS 已修改 app-anim.js / app-mini.js / tooltip-extend.js)
```

## 已实现功能

| 功能 | 说明 | 后端 | 前端 |
|------|------|------|------|
| 用户注册 | 邮箱+密码+昵称，客户端确认密码验证，自动记录注册 IP | `auth.ts:register` | 登录模态框注册 tab |
| 用户登录 | 邮箱+密码校验，记录登录 IP，session 管理 | `auth.ts:login` | 登录模态框登录 tab |
| 用户登出 | 清除 session | `auth.ts:logout` | 顶部用户菜单退出按钮 |
| 获取当前用户 | 自动恢复登录态（页面加载时调用） | `auth.ts:getMe` | `dynamic.js:initAuth` |
| 修改密码 | 需当前密码验证，新密码至少 6 位 | `auth.ts:changePassword` | 个人中心 + 管理后台 password tab |
| 收藏 CRUD | 收藏站内/外部链接，列表/添加/编辑/删除 | `bookmarks.ts` | 网站卡片收藏按钮 + 个人中心收藏管理 |
| 评论系统 | 发表/查看/删除评论 | `comments.ts` | 站点详情评论区域 |
| 入驻申请 | 选分类（最多3个）、填写网站信息、联系方式 | `submissions.ts` | 独立入驻表单页面 |
| 管理后台 | 4 tab：用户管理/评论管理/入驻审核/修改密码 | `admin.ts` + `admin-middleware.ts` | `admin.html` + `admin.md` |
| 用户管理（后台） | 列表展示（含 IP）、切换管理员角色、删除用户 | `admin.ts:listUsers/updateRole/deleteUser` | admin 用户管理 tab |
| 入驻审核（后台） | 通过/拒绝/删除入驻申请 | `admin.ts:submissions API` | admin 入驻审核 tab |
| 登录 IP 记录 | 注册和登录时记录 `last_login_ip`，后台列表展示 | `auth.ts` + `admin.ts` | admin 用户列表 IP 列 |
| 侧栏性能修复 | `/#ANCHOR` 链接崩溃修复、loading 条件修复、空函数 handler 移除、瞬时滚动 | `footer.html` / `app-anim.js` / `app-mini.js` / `tooltip-extend.js` / `dynamic.js` | 侧栏点击无延迟 |
| UI 优化 | 搜索框白字、首页 H1/H2 标题、渐变登录框、顶部菜单布局、渐变提示卡片、表单美化 | - | `dynamic.css` + 各模板 |

## 本地开发

需要同时启动两个服务：

```bash
# 终端 1：Hugo 前端 dev server（自动热重载）
cd /home/source/hugo/aiopc123_upload && hugo server -D --bind 0.0.0.0 --port 1313 --baseURL http://localhost:1313

# 终端 2：Worker 后端 dev server（修改后端代码后需重启）
cd /home/source/aiopc-worker/aiopc-worker && npx wrangler dev
```

Hugo 运行在 `http://localhost:1313`，API 在 `http://localhost:8787`。`dynamic.js` 根据 `window.location.port` 自动切换 API 地址：
- 端口 `1313`（本地 Hugo）→ API 指向 `http://localhost:8787/api`
- 其他端口（生产环境）→ API 指向 `/api`（同域）

> CSS/JS 修改后需硬刷新（Ctrl+F5）才能看到效果。

## 部署流程

整体架构为**独立部署**：Hugo 静态站点部署到 Cloudflare Pages，Worker API 后端部署到 Cloudflare Workers，两者通过 Pages Function 代理 `/api/*` 实现同域通信。

```
浏览器 → Cloudflare Pages（Hugo 静态站点）
          ├── /           → 静态页面
          ├── /api/*      → Pages Function 代理 → Cloudflare Workers（API 后端）
          └── /assets/*   → 静态资源
```

### 前置条件

- Node.js >= 18
- npm 全局安装 wrangler：`npm install -g wrangler`
- Hugo 扩展版（静态站点构建）
- 登录 Cloudflare：`wrangler login`

---

### Worker 端（只需部署一次）

#### 第一步：创建 D1 数据库

```bash
npx wrangler d1 create aiopc-db
# 将返回的 database_id 填入 wrangler.jsonc 的 d1_databases[0].database_id
```

#### 第二步：创建 KV 命名空间

```bash
npx wrangler kv namespace create SESSIONS
# 将返回的 id 填入 wrangler.jsonc 的 kv_namespaces[0].id
```

#### 第三步：初始化远程数据库表

```bash
cd /home/source/aiopc-worker/aiopc-worker
npx wrangler d1 execute aiopc-db --remote --file src/migrations/001_create_tables.sql
npx wrangler d1 execute aiopc-db --remote --file src/migrations/002_add_login_ip.sql
```

#### 第四步：部署 Worker

```bash
cd /home/source/aiopc-worker/aiopc-worker
npx wrangler deploy
```

查看 CORS 配置（`src/index.ts`），确保 `origin` 列表包含所有前端域名：

```ts
origin: ['https://www.aiopc123.com', 'https://aiopc123.pages.dev', 'http://localhost:1313', 'http://localhost:8787'],
```

---

### Hugo 端（每次更新内容时执行）

#### 第一步：构建静态站点（不要用 `hugo server`）

```bash
cd /home/source/hugo/aiopc123_upload

# 使用 config.toml 中的 baseURL（https://www.aiopc123.com/）构建
# 注意：不能使用 hugo server，它的 --baseURL 参数会导致错误
hugo
```

生成的静态文件在 `public/` 目录。

#### 第二步：部署到 Cloudflare Pages

```bash
cd /home/source/hugo/aiopc123_upload
npx wrangler pages deploy public --project-name aiopc123
```

> Pages Function 代理文件位于 `functions/api/[[path]].ts`，自动随站点部署，无需单独操作。
> 它会将 `/api/*` 请求转发到 Worker 后端，实现同域访问，无需 CORS。

#### 完整更新脚本

```bash
cd /home/source/hugo/aiopc123_upload
hugo && npx wrangler pages deploy public --project-name aiopc123
```

---

### 首次部署后设置管理员

```bash
curl -X POST https://aiopc-worker.3994983718.workers.dev/api/admin/setup \
  -H 'Content-Type: application/json' \
  -d '{"email":"你的邮箱","secret":"aiopc-admin-setup-2026"}'
```

**生产环境务必修改 `src/admin.ts` 中的 `SETUP_SECRET` 密钥。**

---

### 部署注意事项

- **`hugo` 构建必须用 `hugo` 命令，不能用 `hugo server`**。`hugo server` 生成的页面包含 `localhost` 地址，部署后会导致静态资源（字体/图片等）引用错误
- Worker 和 Pages 独立部署，互不依赖，可以各自单独更新
- 修改 `wrangler.jsonc` 中的绑定（D1 / KV）后需重新部署 Worker
- CORS 的 `origin` 列表必须包含所有前端访问域名，否则浏览器会拦截 API 请求
