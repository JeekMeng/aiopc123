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

## 效果总结

| 指标 | 优化前 | 优化后 |
|------|--------|--------|
| LCP | 3s+ | < 1.5s |
| Google 富摘要 | 无 | Article / Breadcrumb / Book / Service |
| 博客结构化 | 无 | Article Schema |
| 面包屑结构化 | 无 | BreadcrumbList Schema |
| CSP 外部服务 | 全部拦截 | 正常放行 |
| 统计工具 | 无法工作 | 百度/51.LA 正常 |
| robots.txt | 2 条规则 | 4 条规则 |
| 文章内容深度 | 薄（book 仅 21 行） | 丰富（book 7 板块） |
| OG 分享图 | 可能 404 | 正常兜底 |

## 建议

1. **每次发新文章前**，对照检测清单过一遍
2. **每月一次** 用 Google Search Console 检查收录和索引状态
3. **每周一次** 看 PageSpeed Insights 确认性能稳定
4. **新文章发布后**，立即用 Indexing API 或 Sitemap 提交

> 完整检测清单见同目录下的 `SEO-GEO优化检测清单.md`
