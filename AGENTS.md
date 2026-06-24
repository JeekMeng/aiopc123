# AGENTS.md — aiopc123.com 项目手册

## 项目概述

Hugo 静态网站，主题基于 WebStack-Hugo 大幅改造，定位为 AI 一人公司导航站（aiopc123.com）。已从原主题布局完全迁移为独立的三栏布局 + macOS 风格 UI。

---

## 技术栈

| 项目 | 内容 |
|------|------|
| 框架 | Hugo（静态站点生成器） |
| 主题 | WebStack-Hugo（大幅改造，接近重写） |
| CSS | 自定义 `content.css` / `content-dark.css` 覆盖原主题，不动 Bootstrap |
| JS | jQuery + 原主题 `app-mini.js`（压缩版 `app-anim.js`） |
| 字体 | SF Pro（macOS 系统字体栈） |
| 图标 | Font Awesome 5 + iconfont |
| 运行 | Hugo server 本地调试，Nginx 生产部署 |

---

## 目录架构

```
aiopc123_upload/
├── config.toml                     # Hugo 配置文件
├── content/                        # 内容源文件（Markdown）
│   ├── _index.md                   # 首页
│   ├── about.md                    # 关于我们
│   ├── contact.md                  # 联系我们
│   ├── upload.md                   # 提交收录
│   ├── blog/                       # 文章（13 篇）
│   ├── book/                       # 资料（13 本）
│   └── site/                       # 工具导航（218 个）
├── data/                           # 结构化数据
│   ├── headers.yml                 # 顶栏菜单
│   ├── sidebar.yaml                # 侧栏菜单
│   ├── webstack.yml                # 首页分类（site 导航）
│   ├── book.yml                    # 资料分类
│   ├── blog.yml                    # 文章分类
│   └── friendlinks.yml             # 友情链接
├── layouts/                        # 自定义模板（覆盖主题）
│   ├── _default/single.html        # 通用详情页（about/contact/upload）
│   ├── site/single.html            # 工具详情页
│   ├── site/list.html              # 工具列表（暂未重写）
│   ├── blog/single.html            # 文章详情页
│   ├── blog/list.html              # 文章列表
│   ├── book/single.html            # 资料详情页
│   ├── book/list.html              # 资料列表
│   ├── workspace/list.html         # 工作区列表
│   └── partials/                   # 可复用组件
│       ├── jsonld.html             # 结构化数据（Schema.org）
│       ├── related.html            # 相关推荐
│       ├── prev_next.html          # 上一篇/下一篇
│       └── content_right_sidebar_unified.html
├── themes/WebStack-Hugo/           # 主题（部分覆盖）
│   └── layouts/partials/
│       ├── header.html             # `<head>`（SEO meta, OG, JSON-LD）
│       ├── footer.html             # JS 底部加载 + 暗黑切换
│       ├── top_nav.html            # 全宽顶栏
│       ├── sidebar.html            # 左侧菜单（带跨页导航）
│       ├── content_header.html     # Breadcrumb JSON-LD
│       ├── content_search.html     # 首页搜索栏
│       └── modal_search.html       # 搜索模态框
└── static/assets/css/
    ├── content.css                 # 主样式（macOS 风格）
    └── content-dark.css            # 暗黑模式适配
```

---

## 内容模型

### 页面类型与 schema_type

| 页面 | section | schema_type | 模板 |
|------|---------|-------------|------|
| 首页 | — | — | `index.html`（主题） |
| 工具详情 | `site/` | `SoftwareApplication` / `Service` | `site/single.html` |
| 文章详情 | `blog/` | `Article` | `blog/single.html` |
| 资料详情 | `book/` | `Book` | `book/single.html` |
| 关于/联系/提交 | 根目录 | `Article` | `_default/single.html` |

### Front Matter 字段（三区结构）

```
# ── 公共部分 ──
title: "工具名 - 分类 - 描述"
date: 2026-03-01
draft: false
description: "..."
tags: ["标签1", "标签2"]

# ── SEO 部分 ──
keywords: ["关键词1", "关键词2"]
schema_type: "SoftwareApplication"

# ── 特殊部分（按类型）──
# site 特有
official_url: "https://..."
mobile_url: "https://..."
company: "公司名"
category: ["分类1", "分类2"]
score: 9.3

# blog 特有
summary: "..."
featuredImage: "cover.png"
toc: true

# book 特有
author: "作者名"
cover: "page_1.png"
download: "https://..."
```

---

## 核心功能模块

### 1. 布局系统
- 三栏布局：`left-sidebar`（220px）+ `content-col`（flex:1）+ `right-sidebar`（300px）
- 响应式：992px 以下堆叠为单列
- Simple 模式：about/contact/upload 隐藏边栏，正文全宽居中（860px）

### 2. 顶栏
- `position: fixed` 固定顶部，毛玻璃效果（`backdrop-filter: blur(12px)`）
- 菜单来自 `data/headers.yml`
- Logo 链接到 `/`

### 3. 左侧菜单
- 来自 `data/webstack.yml`（首页分类）、`data/blog.yml`、`data/book.yml`
- 根据当前页面 section 自动切换数据源
- 锚点链接带段路径：`/#hash` / `/blog/#hash` / `/book/#hash`，可在详情页跨页跳转
- `position: sticky` 粘性定位，内部滚动

### 4. 搜索栏（仅首页）
- 墨绿纯色背景 `#1a4731`，高度缩减约 1/3
- 多搜索引擎切换（百度、必应、谷歌等）
- 首页全宽显示

### 5. 结构化数据（SEO）
- `jsonld.html` partial 输出 Schema.org JSON-LD
- 4 种主类型：Article / Book / Service / SoftwareApplication
- 2 种辅助类型：FAQPage / HowTo（可选）
- `content_header.html` 输出 BreadcrumbList
- `header.html` 输出 OG / Twitter 社交标签

### 6. 暗黑模式
- class: `io-black-mode` / `io-grey-mode`
- 切换由 `footer.html` 中 jQuery `click` 处理
- 样式适配在 `content-dark.css`

### 7. 样式约定
- 所有自定义样式写在 `content.css` / `content-dark.css`
- **不修改** 原主题 CSS 文件（`style-3.03029.1.css` 等）
- **不修改** Bootstrap
- 正文样式类：`content-body`（CSS 也覆盖 `.content` `.book-content`）

---

## UI 风格指南（macOS 极简）

| 元素 | 规范 |
|------|------|
| 字体 | `-apple-system, "SF Pro Text", "Helvetica Neue", "PingFang SC", sans-serif` |
| 标题字体 | `"SF Pro Display", ...`（比正文粗） |
| 圆角 | `border-radius: 10px` / `12px`（卡片） |
| 边框 | `1px solid #e5e5ea`（浅灰） |
| 卡片背景 | `#ffffff` / `#f8f9fa`（浅灰） |
| 主色调蓝 | `#007aff`（macOS 蓝） |
| 主色调绿 | `#34c759`（macOS 绿，用于快速链接） |
| 顶栏毛玻璃 | `background: rgba(255,255,255,.85); backdrop-filter: blur(12px)` |
| 阴影 | `box-shadow: 0 1px 6px rgba(0,0,0,.04)`（微阴影） |
| 间距 | `padding: 24px`（三栏主体）；`padding: 28px 32px`（详情卡片） |

---

## 开发命令

```bash
# 本地调试（热更新）
hugo server -D --bind 0.0.0.0 --port 1317 --baseURL http://localhost:1317

# 生成静态文件
hugo

# 生产预览
hugo -d ../public/ && cd ../public/ && python -m http.server 9000

# 部署流程
hugo
# 将 public/ 目录上传到服务器 /var/www/html/
# Nginx 配置见 install.sh
```

---

## 调试指南

### 问题定位优先级
1. 先 `grep` 搜索关键词定位相关代码（不要从头线性读文件）
2. 先分析前端 JS 逻辑（`static/assets/js/dynamic.js`）再分析后端
3. 不要读类型定义文件（`.d.ts`）、配置文件（`wrangler.jsonc`）、测试文件，除非问题明确相关

### 已知模式
- `window.location.href = X` 在 X 就是当前页面时会导致无意义重载 → 优先考虑就地更新而非跳转
- 登录/注册流程入口在 `dynamic.js` 的 `loginUser` / `registerUser` 函数
- API 路径：`/api/auth/login`、`/api/auth/register`、`/api/auth/me`

### 效率原则
- 每次分析前先问自己：这个问题最少需要读哪些文件就能定位？
- 优先用 grep 缩小范围，不要线性读完整文件
- 不要推理基础设施问题（Cookie/KV/跨域），除非确认代码逻辑没问题

---

## 注意事项

### 开发约定
1. **中文对话**：所有交互、注释、commit message 使用中文
2. **不动原主题**：布局/样式改动在 `content.css` / `content-dark.css` 覆盖，不修改原主题 CSS 和 Bootstrap
3. **H1 规则**：`<h1>` = `(split .Title "|")[0]` trim，取第一段
4. **title 规则**：`<title>` = `{{ .Title }} | AI一人公司导航网`，由 `header.html` 模板统一追加，**不在 front matter 中硬编码后缀**
5. **schema_type** 由 front matter 控制，jsonld.html 根据值输出对应结构化数据

### 已知问题
1. ~~blog 部分文章混入 `company` / `official_url` / `score` 等 site 专有字段，待清理~~（已修复）
2. ~~`-` 分割取 H1 对含连字符的 blog 标题不够精确，已改为 `|` 分割~~（已修复）
3. blog / book 的 `schema_type` 尚未添加（你将在外部工具统一处理）
4. 左侧菜单跨页跳转后无 JS 平滑滚动动画（浏览器默认锚点滚动替代）
5. `#search-bg` 的 JS 背景图设置（`app-mini.js` 中）已被 CSS 覆盖移除

### Docker 运行环境
项目根目录无 Dockerfile。若需 Docker 调试：
```bash
# 使用官方 Hugo 镜像
docker run --rm -it -v $(pwd):/src -p 1317:1317 \
  --entrypoint /bin/sh klakegg/hugo:0.112.7-ext-alpine

# 容器内
cd /src && hugo server -D --bind 0.0.0.0 --port 1317 --baseURL http://localhost:1317
```

### 相关文档
- `字段映射.md` — schema_type 与 front matter 字段完整对应表
- `SEO-GEO优化经验分享.md` — SEO 优化经验
- `SEO-GEO优化检测清单.md` — SEO 检查清单
- `性能优化评估文档.md` — 性能优化评估
