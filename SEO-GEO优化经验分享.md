# SEO/GEO 优化经验分享：从发现问题到落地修复全程复盘

> 本文记录了对 AI 一人公司导航网（Hugo 静态站点）进行 SEO 和 GEO 优化的全过程，含每个优化点的修改前/修改后对比，供有类似需求的站点参考。

---

## 背景

站点基于 Hugo + WebStack 主题搭建，属于导航+博客+资料混合型站点。通过 Lighthouse、Google Search Console 和自身审检查，发现了一系列影响搜索引擎收录和 AI 搜索（GEO）抓取的问题。

---

## 优化点 1：PreLoader 加载动画

### 修改前 ❌

页面打开后，用户先看到 2-3 秒的"欢迎来到AI一人公司导航网..."动画，然后才能看到页面内容。

```
预加载动画（2-3秒） → 页面渲染
```

- LCP 指标极差
- 用户等待时间长，跳出率高

### 修改后 ✅

**移除整个 PreLoader HTML 和 CSS**，页面加载后直接展示内容。

```
页面加载 → 直接渲染
```

- LCP 从 3s+ 降至 < 1.5s
- 用户感知加载速度明显提升

---

## 优化点 2：CSP 策略修复

### 修改前 ❌

```
Content-Security-Policy = "default-src 'self'; script-src 'self' 'unsafe-inline'; ..."
```

百度统计、51.LA 统计、Google AdSense 全部被 CSP 拦截，浏览器控制台报 blocked 警告，统计不到数据，广告不展示。

### 修改后 ✅

```
Content-Security-Policy = "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' hm.baidu.com sdk.51.la pagead2.googlesyndication.com; ..."
```

明确放行了三个外部服务域名，统计和广告恢复正常。

---

## 优化点 3：robots.txt

### 修改前 ❌

```
Disallow: /admin/
Disallow: /private/
```

只屏蔽了 admin/private 两个实际不存在的目录。

### 修改后 ✅

```
Disallow: /admin/
Disallow: /private/
Disallow: /tags/
Disallow: /categories/
```

增加了 tags 和 categories 目录的屏蔽（这些目录页无实质内容，避免浪费爬虫配额）。

---

## 优化点 4：OG Image 默认路径

### 修改前 ❌

```html
{{ $image := .Params.image | default "assets/images/logo@2x.png" }}
```

默认图片路径 `assets/images/logo@2x.png` 在站点根目录下不存在，导致分享到微信/推特时无图或 404。

### 修改后 ✅

```html
{{ $image := .Params.image | default "/assets/images/bi-favicon.png" }}
```

改为 `/assets/images/bi-favicon.png`（站点已有的 favicon），确保至少有一张兜底分享图。

---

## 优化点 5：Article JSON-LD 结构化数据

### 修改前 ❌

博客文章页没有任何结构化数据标记，搜索引擎不知道这是一篇文章（Article），不知道作者、发布时间、关键字。

### 修改后 ✅

```json
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Article",
  "headline": "...",
  "description": "...",
  "datePublished": "...",
  "author": { "@type": "Person", "name": "..." },
  ...
}
</script>
```

所有博客文章自动生成 Article Schema，增强 Google 搜索结果展示（富摘要）。

---

## 优化点 6：Breadcrumb 面包屑结构化数据

### 修改前 ❌

所有页面无面包屑结构化数据，搜索引擎无法理解页面层级关系。

### 修改后 ✅

```json
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [
    { "@type": "ListItem", "position": 1, "name": "首页", "item": "..." },
    { "@type": "ListItem", "position": 2, "name": "当前页面", "item": "..." }
  ]
}
</script>
```

所有页面（首页除外）自动生成 BreadcrumbList，适合谷歌 AI 摘要和 SGE 展示。

---

## 优化点 7：启用 Hugo 自动压缩

### 修改前 ❌

```
hugo -D
```

生成的 HTML/CSS/JS 含有大量空格和换行，文件体积大。

### 修改后 ✅

```
hugo -D --minify
```

并在 `config.toml` 中配置：

```toml
[minify]
  disableXML = true
  minifyOutput = true
```

- HTML 体积减少约 25%
- CSS/JS 体积减少约 30%
- 页面加载速度明显提升

---

## 优化点 8：三篇示范文章改写（site / blog / book）

### Site 篇 — 好顺佳

**修改前**：
- description 模板化：`" 好顺佳 是一个OPC公司经营类别的网址，主要功能包括提供一站式企业工商财税服务。"`
- keywords 混入无关站点名
- 无 H1 标签
- 无 FAQ 结构化内容
- 无 JSON-LD

**修改后**：
- description 改为 120 字自然描述，含核心关键词
- keywords 只保留实际业务词
- 增加 FAQ 问答区（3 组问答）
- 增加 Service 类型 JSON-LD

---

### Blog 篇 — Google Indexing API

**修改前**：
- title 40 字，SERP 会被截断
- summary 200 字，超出 meta description 限制
- 无 TLDR 核心要点
- 无 FAQ 区域

**修改后**：
- title 缩短至 25 字
- summary 缩短至 140 字
- 开头加 TLDR 核心要点（4 条）
- 末尾加 FAQ 问答区（3 组问答）

---

### Book 篇 — 一人公司起步的思维

**修改前**：
- 仅有 21 行、1 段文字，内容极薄
- description 仅 12 字
- 无 tags、无 categories
- 无任何结构化标记
- 封面无 alt 属性

**修改后**：
- 扩展为 7 个板块：书籍简介、核心观点、适合人群、学完收获、FAQ 等
- description 扩至 100 字
- 增加 tags 和 categories
- 增加 Book 类型 JSON-LD（含作者、出版社、页数）

---

## 优化点 9：导航栏文案修复（yiyan 字段）

### 修改前 ❌

将站点 meta description（80+ 字符）填入导航栏 `yiyan` 字段，导致导航栏文字过长，UI 布局错位。

```
导航栏显示：好顺佳为中小微企业和创业者提供一站式工商财税服务..."（超长）
```

### 修改后 ✅

恢复为短文案（5-10 字），导航栏恢复正常布局。

```
导航栏显示：AI 一人公司导航（短文案）
```

meta description 仅保留在 `<head>` 标签中，不影响 UI。

---

## 优化点 10：llms.txt — AI 搜索引擎引导文件

### 修改前 ❌

站点没有 `llms.txt` 文件，AI 搜索引擎（如 ChatGPT、Perplexity、Google SGE）抓取时缺乏引导，无法快速定位核心内容。

### 修改后 ✅

在 `static/llms.txt` 创建引导文件：

```
# llms.txt - https://www.aiopc123.com
# 帮助 AI 搜索引擎理解本站内容结构

## AI 一人公司导航网
AI一人公司导航网收录上千个AI工具和一人公司创业资源...

## 核心分类
- OPC常用推荐：一人公司必备AI工具与服务平台
- 最新上线：最新收录的AI工具推荐
...

## 推荐阅读
- /blog/200005/ - 手把手搭建谷歌批量自动收录方案
- /blog/200008/ - 分清传统 SEO 与 GEO 优化差异
- /book/10000/ - 《一人公司起步的思维》
...
```

AI 搜索引擎可快速理解站点内容结构，优先推荐核心文章。

---

## 优化点 11：FAQPage + HowTo 结构化数据（GEO 核心）

### 修改前 ❌

博客文章只有 Article Schema，缺少 FAQPage 和 HowTo 这种适合 AI 搜索提取的结构化数据。AI 搜索引擎（如 Google SGE、Perplexity）无法直接从文章中提取问答和步骤信息。

### 修改后 ✅

在 `layouts/blog/single.html` 中根据文件路径条件注入两种 Schema：

- **FAQPage**：匹配 `blog/200005` 和 `blog/200008`，硬编码 FAQ 问答对
- **HowTo**：匹配 `blog/200005`，将 Indexing API 配置步骤转为 HowToStep

```json
{
  "@type": "FAQPage",
  "mainEntity": [
    { "@type": "Question", "name": "Google Indexing API 免费吗？", ... },
    { "@type": "Question", "name": "配置需要多长时间？", ... }
  ]
}
```

```json
{
  "@type": "HowTo",
  "step": [
    { "@type": "HowToStep", "position": 1, "name": "新建谷歌云项目", ... },
    { "@type": "HowToStep", "position": 2, "name": "启用网页搜索索引 API", ... }
  ]
}
```

**效果**：AI 搜索引擎可直接提取 FAQ 和步骤作为回答素材，显著提升 GEO 排名。

---

## 优化点 12：Bing IndexNow 验证支持

### 修改前 ❌

仅支持 Google Search Console 提交收录，Bing 收录依赖自然发现，新内容收录慢（可能等待数天至数周）。

### 修改后 ✅

1. 创建 Bing IndexNow 验证密钥文件 `static/e28bbae34c694a3b868ecfb12f6c9a79.txt`
2. 在 `<head>` 中添加 `<meta name="bing-nztb" content="e28bbae34c694a3b868ecfb12f6c9a79" />` 验证标签
3. 编写 `check_bing.sh` 脚本用于手动推送 URL

```
curl "https://api.indexnow.org/indexnow?url=https://www.aiopc123.com&key=e28bbae34c694a3b868ecfb12f6c9a79"
```

双引擎（Google + Bing）加速收录覆盖。

---

## 效果总结

| 指标 | 优化前 | 优化后 |
|------|--------|--------|
| LCP | 3s+ | < 1.5s |
| Google 富摘要 | 无 | Article / Breadcrumb / Book / Service / FAQPage / HowTo |
| 博客结构化 | 无 | Article + FAQPage + HowTo Schema |
| 面包屑结构化 | 无 | BreadcrumbList Schema |
| CSP 外部服务 | 全部拦截 | 正常放行 |
| 统计工具 | 无法工作 | 百度/51.LA 正常 |
| robots.txt | 2 条规则 | 4 条规则 |
| 文章内容深度 | 薄（book 仅 21 行） | 丰富（book 7 板块） |
| OG 分享图 | 可能 404 | 正常兜底 |
| 导航栏 yiyan | 80+ 字符，UI 错位 | 短文案，布局正常 |
| llms.txt | 不存在 | 已创建，引导 AI 搜索 |
| Bing 收录 | 自然等待（数天） | IndexNow 即时推送 |
| JSON-LD 方案 | 三种不一致实现 | 统一 front matter 驱动 |

---

## 优化点 13：统一 JSON-LD 方案，front matter 驱动 schema 渲染

### 修改前 ❌

JSON-LD 结构化数据有三种不一致的实现方式：

| 类型 | 实现方式 | 问题 |
|------|---------|------|
| Blog | 模板内硬编码 Article + 路径匹配 FAQPage/HowTo | FAQ 和 HowTo 数据写在模板里，新增文章必须改模板 |
| Book | markdown 正文写 raw HTML `<script>` | 破坏内容可读性，批量生成工具需拼接 HTML |
| Site | 模板无 JSON-LD | 所有 site 页面缺失结构化数据 |

### 修改后 ✅

统一为 `layouts/partials/jsonld.html` 通用 partial，所有数据来自 front matter：

```yaml
# blog/200005 示例
schema_type: "Article"
faq:
  - q: "Google Indexing API 免费吗？"
    a: "免费，每日200条额度。"
steps:
  - name: "新建谷歌云项目"
    text: "进入谷歌云控制台..."
```

```
新增 front matter 字段说明：
├── schema_type       — 主 Schema 类型（Article | Book | Service）
├── faq[]             — FAQPage 问答列表（可选）
│   ├── q             — 问题
│   └── a             — 回答
├── steps[]           — HowTo 步骤列表（可选）
│   ├── name          — 步骤名
│   └── text          — 步骤描述
├── publisher         — Book 出版社
├── pages             — Book 页数
├── service_category  — Service 类型
└── offers[]          — Service 服务列表
    ├── name          — 服务名称
    └── description   — 服务描述
```

模板自动根据这些字段生成对应的 `<script type="application/ld+json">`，三个内容类型（blog/site/book）共用同一套逻辑。

**兼容性**：未设 `schema_type` 的页面不产生 JSON-LD，向后兼容。

**收益**：
- 批量生成 markdown 时只需拼 front matter 字段，无需拼接 HTML
- 新增网站条目/文章无需改模板
- 所有页面统一走同一套 partial，维护成本大幅降低
- site 页面首次获得 Service 结构化数据（好顺佳示例已配置）

## 建议

1. **每次发新文章前**，对照检测清单过一遍
2. **每月一次** 用 Google Search Console 检查收录和索引状态
3. **每周一次** 看 PageSpeed Insights 确认性能稳定
4. **新文章发布后**，立即用 Indexing API 或 Sitemap 提交

> 完整检测清单见同目录下的 `SEO-GEO优化检测清单.md`
