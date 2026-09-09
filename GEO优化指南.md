# schema_type → JSON-LD 字段映射表

## Article（blog / 文章页）

> **适用场景：** 博客文章、教程、行业资讯、经验分享、政策解读等文字内容页。
> **GEO 价值：** AI 搜索引擎在回答"什么是…""如何…"类问题时优先召回 Article 类型。

| schema 字段 | front matter 字段 | 完整 JSON 样例 |
|------------|-----------------|----------------|
| `@type: "Article"` | `schema_type: "Article"` | ```json
{
  "@context": "https://schema.org",
  "@type": "Article",
  "headline": "OpenClaw Ubuntu 安装手册（2026 最新版-2026.3.13）",
  "description": "OpenClaw 最新版 安装手册",
  "datePublished": "2026-03-20T09:00:00+08:00",
  "author": {
    "@type": "Person",
    "name": "AI 一人公司导航"
  },
  "keywords": "OpenClaw, 智能体, AI",
  "mainEntityOfPage": {
    "@type": "WebPage",
    "@id": "https://www.aiopc123.com/blog/200000/"
  }
}
``` |
| `headline` | `.Title` | |
| `description` | `.Params.summary` → `.Description` | |
| `datePublished` | `.Date` | |
| `author.name` | `.Params.author` → `.Site.Params.author` | |
| `keywords` | `.Params.tags` | |
| `mainEntityOfPage.@id` | `.Permalink` | |

### Frontmatter 模板

```yaml
---
title: "文章标题 - 分类 - 描述"  # 中文≤30字 / 英文≤60chars
date: 2026-01-01
draft: false
schema_type: "Article"
summary: "文章摘要（用于 SEO description）"  # 中文≤80字 / 英文≤160chars，纯文本
description: "页面描述（fallback）"          # 同上
tags: ["标签1", "标签2"]
keywords: ["关键词1", "关键词2"]
author: "作者名"            # 可选，默认站点作者
featuredImage: "cover.png"  # 可选
toc: true                   # 可选，是否显示目录
faq:                        # 可选，补充 FAQPage
  - q: "常见问题1"          # 须与页面可见标题完全一致
    a: "答案1"              # 最少50字，建议100-300字；支持<a><b><br><em><i><li><ol><p><strong><ul>
steps:                      # 可选，补充 HowTo
  - name: "步骤1"           # 10-30字，动词开头
    text: "步骤1说明"        # 50-200字，独立可读
---
```

---

## Book（资料专区）

> **适用场景：** PDF 资料、电子书、研究报告、白皮书等可下载文档资源。
> **GEO 价值：** AI 引擎在推荐参考资料时标记为 Book 类型的页面权重更高。

| schema 字段 | front matter 字段 | 完整 JSON 样例 |
|------------|-----------------|----------------|
| `@type: "Book"` | `schema_type: "Book"` | ```json
{
  "@context": "https://schema.org",
  "@type": "Book",
  "name": "一人公司：失业潮中的高新技术工作者",
  "author": {
    "@type": "Person",
    "name": "[美] 卡丽・莱恩（Carrie M. Lane）"
  },
  "description": "裁员时代，技术人如何自救，一人公司帮您解决失业的问题？",
  "inLanguage": "zh-CN"
}
``` |
| `name` | `.Title` | |
| `author.name` | `.Params.author` | |
| `publisher.name` | `.Params.publisher`（可选） | |
| `numberOfPages` | `.Params.pages`（可选） | |
| `isbn` | `.Params.isbn`（可选） | |
| `description` | `.Description` | |
| `inLanguage` | 固定 `"zh-CN"` | |

### Frontmatter 模板

```yaml
---
title: "书名 - 副标题"       # 中文≤30字 / 英文≤60chars
date: 2026-01-01
draft: false
schema_type: "Book"
author: "作者名"             # [美] 卡丽·莱恩（Carrie M. Lane）
description: "书籍简介"      # 中文≤80字 / 英文≤160chars
cover: "page_1.png"         # 封面图片（页面包资源）
download: "https://..."     # 下载链接
tags: ["标签1", "标签2"]
publisher: "出版社"         # 可选
pages: 232                  # 可选，整数
isbn: "978-..."             # 可选，13位数字
---
```

---

## Service（site 中的服务类页面）

> **适用场景：** 由人工或机构提供的非软件类服务，如代理记账、商标注册、法律服务、设计外包、工商财税、咨询顾问。
> **GEO 价值：** 标明"人提供服务"的性质，适合服务类长尾搜索（如"北京代理记账哪家好"）。
> **与 SoftwareApplication 的区别：** 如果是用户直接在线使用的工具/软件 → 用 SoftwareApplication；如果是需要联系人工购买的服务 → 用 Service。

| schema 字段 | front matter 字段 | 完整 JSON 样例 |
|------------|-----------------|----------------|
| `@type: "Service"` | `schema_type: "Service"` | ```json
{
  "@context": "https://schema.org",
  "@type": "Service",
  "name": "好顺佳 - OPC公司经营 - 一站式工商财税服务",
  "description": "好顺佳为中小微企业和创业者提供一站式工商财税服务，涵盖公司注册、代理记账、商标注册、资质办理等，降低创业门槛与运营成本。",
  "serviceType": "工商财税服务",
  "provider": {
    "@type": "Organization",
    "name": "好顺佳"
  },
  "areaServed": "CN",
  "offers": {
    "@type": "AggregateOffer",
    "offerCount": 2,
    "offers": [
      {
        "@type": "Offer",
        "name": "公司注册服务",
        "description": "提供全国范围内的公司核名、工商注册、银行开户等全套设立服务。"
      },
      {
        "@type": "Offer",
        "name": "代理记账报税",
        "description": "专业的财税团队提供记账、报税、税务筹划等日常财税托管服务。"
      }
    ]
  }
}
``` |
| `name` | `.Title` | |
| `description` | `.Description` | |
| `serviceType` | `.Params.service_category` | |
| `provider.name` | `.Params.company` → `.Title` | |
| `areaServed` | 固定 `"CN"` | |
| `offers[].name` | `.Params.offers[].name`（可选） | |
| `offers[].description` | `.Params.offers[].description`（可选） | |

### Frontmatter 模板

```yaml
---
title: "服务名 - 分类 - 描述"  # 中文≤30字 / 英文≤60chars
date: 2026-01-01
draft: false
schema_type: "Service"
service_category: "服务类别"
official_url: "https://..."  # 完整绝对URL，以https://开头
mobile_url: "https://..."    # 同上
company: "公司名"
category: ["分类1", "分类2"]
score: 9.3                   # 0-10，保留1位小数
description: "服务描述"       # 中文≤80字 / 英文≤160chars
tags: ["标签1", "标签2"]
keywords: ["关键词1", "关键词2"]
offers:                      # 可选，列出服务项目
  - name: "服务项1"          # 10-50字
    description: "服务项1说明" # 50-200字
  - name: "服务项2"
    description: "服务项2说明"
---
```

---

## SoftwareApplication（site 中的 AI 工具页面）

> **适用场景：** AI 工具、Web 应用、SaaS 平台、API 服务、在线编辑器、数据分析平台、云服务、建站系统、招聘平台等用户可直接在线使用的软件产品。
> **GEO 价值：** AI 搜索引擎对 SoftwareApplication 类型的召回率和推荐权重最高 —— 带 `applicationCategory` 字段可直接命中 AI 搜索的长尾意图（如"AI图片生成工具推荐"）。
> **与 Service 的区别：** 用户打开浏览器即可直接操作的 → 用 SoftwareApplication；需要联系人工购买/交付的 → 用 Service。当前导航网 99% 条目适用此类型。

| schema 字段 | front matter 字段 | 完整 JSON 样例 |
|------------|-----------------|----------------|
| `@type: "SoftwareApplication"` | `schema_type: "SoftwareApplication"` | ```json
{
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "name": "Trello",
  "description": "Trello 是一个OPC产品管理类别的网址，主要功能包括通过看板、列表和卡片可视化地组织和管理项目。",
  "applicationCategory": "项目管理",
  "operatingSystem": "Web/Cloud",
  "url": "https://trello.com/",
  "author": {
    "@type": "Organization",
    "name": "Atlassian"
  },
  "mainEntityOfPage": {
    "@type": "WebPage",
    "@id": "https://www.aiopc123.com/site/200080/"
  }
}
``` |
| `name` | `(split .Title "-")[0]` trim | |
| `description` | `.Description` | |
| `applicationCategory` | `.Params.category[0]` → 默认 `"WebApplication"` | |
| `operatingSystem` | 固定 `"Web/Cloud"` | |
| `url` | `.Params.official_url` | |
| `author.name` | `.Params.company` | |
| `mainEntityOfPage.@id` | `.Permalink` | |

### Frontmatter 模板

```yaml
---
title: "工具名 - 分类 - 描述"  # 中文≤30字 / 英文≤60chars
date: 2026-01-01
draft: false
schema_type: "SoftwareApplication"
official_url: "https://..."  # 完整绝对URL，以https://开头
mobile_url: "https://..."    # 同上
company: "公司名"
category: ["分类1", "分类2"]  # 首项作为applicationCategory
score: 9.3                   # 0-10，保留1位小数
description: "工具描述"       # 中文≤80字 / 英文≤160chars
tags: ["标签1", "标签2"]
keywords: ["关键词1", "关键词2"]
faq:                         # 可选，补充 FAQPage
  - q: "常见问题1"           # 须与页面可见标题完全一致
    a: "答案1"               # 最少50字，建议100-300字；支持<a><b><br><em><i><li><ol><p><strong><ul>
steps:                       # 可选，补充 HowTo
  - name: "步骤1"            # 10-30字，动词开头
    text: "步骤1说明"         # 50-200字，独立可读
---
```

---

## FAQPage（独立页面）

> **适用场景：** 独立的常见问题页面，集中回答用户高频疑问。
> **GEO 价值：** Google 和 AI 引擎常将 FAQPage 以富媒体摘要（Rich Snippet）形式展示在搜索结果顶部，点击率极高。
> **提示：** 也可以作为补充 schema 附加到 Article / SoftwareApplication / Service / Book 中（见下节），无需单独建页。

可作为独立页面类型使用（如单独的 FAQ 页面），也可作为其他页面类型的补充（见下节）。

| schema 字段 | front matter 字段 |
|------------|-----------------|
| `@type: "FAQPage"` | `schema_type: "FAQPage"` |
| `mainEntity[].name` | `.Params.faq[].q` |
| `mainEntity[].acceptedAnswer.text` | `.Params.faq[].a` |

### Frontmatter 模板

```yaml
---
title: "常见问题 - 分类"       # 中文≤30字 / 英文≤60chars
date: 2026-01-01
draft: false
schema_type: "FAQPage"
description: "FAQ 页面描述"    # 中文≤80字 / 英文≤160chars
faq:                          # 建议5-8条，最少2条
  - q: "问题1"                # 须与页面可见标题完全一致
    a: "答案1"                # 最少50字，建议100-300字；支持<a><b><br><em><i><li><ol><p><strong><ul>
  - q: "问题2"
    a: "答案2"
---
```

---

## FAQPage（辅助型，与主 schema 共存）

| schema 字段 | front matter 字段 | 完整 JSON 样例 |
|------------|-----------------|----------------|
| `@type: "FAQPage"` | `faq:` 数组 | ```json
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "如何注册一人公司？",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "首先进行核名..."
      }
    }
  ]
}
``` |
| `mainEntity[].name` | `.Params.faq[].q` | |
| `mainEntity[].acceptedAnswer.text` | `.Params.faq[].a` | |

### Frontmatter 模板

```yaml
# 在已有主 schema 的 front matter 中追加：
faq:                         # 字段名 faq，值为对象数组；建议5-8条
  - q: "常见问题1"           # 须与页面可见标题完全一致
    a: "答案1"               # 最少50字，建议100-300字；支持<a><b><br><em><i><li><ol><p><strong><ul>
  - q: "常见问题2"
    a: "答案2"
```

---

## HowTo（独立页面）

> **适用场景：** 操作指南、安装教程、配置文档、使用手册等分步骤指导内容。
> **GEO 价值：** 带有步骤结构的 HowTo 类型在 AI 搜索中常被提炼为"操作步骤"直接显示在答案中，大幅提升页面曝光。
> **提示：** 也可以作为补充 schema 附加到 Article / SoftwareApplication / Service / Book 中（见下节），无需单独建页。

可作为独立页面类型使用（如教程、操作指南），也可作为其他页面类型的补充（见下节）。

| schema 字段 | front matter 字段 |
|------------|-----------------|
| `@type: "HowTo"` | `schema_type: "HowTo"` |
| `name` | `.Title` |
| `step[].position` | 自动序号 |
| `step[].name` | `.Params.steps[].name` |
| `step[].text` | `.Params.steps[].text` |

### Frontmatter 模板

```yaml
---
title: "教程标题"               # 中文≤30字 / 英文≤60chars
date: 2026-01-01
draft: false
schema_type: "HowTo"
description: "教程描述"          # 中文≤80字 / 英文≤160chars
steps:                          # 建议3-8步，最少1步
  - name: "步骤1"               # 10-30字，动词开头
    text: "步骤1详细说明"        # 50-200字，独立可读
  - name: "步骤2"
    text: "步骤2详细说明"
---
```

---

## HowTo（辅助型，与主 schema 共存）

| schema 字段 | front matter 字段 | 完整 JSON 样例 |
|------------|-----------------|----------------|
| `@type: "HowTo"` | `steps:` 数组 | ```json
{
  "@context": "https://schema.org",
  "@type": "HowTo",
  "name": "OpenClaw Ubuntu 安装教程",
  "step": [
    {
      "@type": "HowToStep",
      "position": 1,
      "name": "安装 Node.js",
      "text": "使用 NodeSource 安装 Node.js 22+"
    }
  ]
}
``` |
| `name` | `.Title` | |
| `step[].position` | 自动序号 | |
| `step[].name` | `.Params.steps[].name` | |
| `step[].text` | `.Params.steps[].text` | |

### Frontmatter 模板

```yaml
# 在已有主 schema 的 front matter 中追加：
steps:                       # 字段名 steps，值为对象数组；建议3-8步
  - name: "步骤1"            # 10-30字，动词开头
    text: "步骤1详细说明"     # 50-200字，独立可读
  - name: "步骤2"
    text: "步骤2详细说明"
```

---

## 快速参考：每类页面要填什么

| 页面类型 | `schema_type` | 使用场景 | 必填字段 | 可选增强字段 |
|---------|--------------|---------|---------|------------|
| site → 工具 | `SoftwareApplication` | AI 工具、SaaS、Web 应用、云服务等在线可直接使用的软件产品 | `title`, `description`, `category` | `company`, `official_url` |
| site → 服务 | `Service` | 代理记账、财税咨询、法律服务等需人工交付的服务 | `title`, `description`, `service_category`, `company` | `offers[]` |
| blog | `Article` | 博客文章、教程、行业资讯、政策解读 | `title`, `summary` | `tags`, `author` |
| book | `Book` | PDF 资料、电子书、研究报告 | `title`, `description`, `author` | `publisher`, `pages`, `isbn` |
| 独立 FAQ 页 | `FAQPage` | 常见问题集中页 | `faq: [{q, a}]` | — |
| 独立教程页 | `HowTo` | 操作指南、安装教程 | `steps: [{name, text}]` | — |
| 任意页面（补充问答） | —（补充） | 在已有页面后追加 FAQ | — | `faq: [{q, a}]` |
| 任意页面（补充教程） | —（补充） | 在已有页面后追加步骤 | — | `steps: [{name, text}]` |

---

## 字段约束一览表

### 文本长度（SEO + Schema.org）

| 字段 | 中文建议 | 英文建议 | 截断方式 | HTML 支持 |
|------|---------|---------|---------|-----------|
| **title** | 15-30 字 | 50-60 chars | 像素截断 ~600px | 不支持 |
| **description / summary** | 70-80 字 | 150-160 chars | 像素截断 ~920px | 不支持 |
| **faq.题目 q** | 10-50 字 | 20-100 chars | 完整显示 | 不支持 |
| **faq.答案 a** | **最少 50 字**，建议 100-300 字 | min 50 chars, rec 60-150 words | 可展开 | 支持有限标签① |
| **steps.名称 name** | 10-30 字 | 20-60 chars | 完整显示 | 不支持 |
| **steps.说明 text** | 50-200 字 | 60-200 chars | 完整显示 | 支持有限标签① |

> ① 可用的 HTML 标签：`<a>` `<b>` `<br>` `<em>` `<i>` `<li>` `<ol>` `<p>` `<strong>` `<ul>`（共 10 种），其余标签被 Google 静默忽略。

### FAQPage 特殊限制

| 规则 | 说明 |
|------|------|
| **最少问题数** | 2 条（仅 1 条会被标记为不符合规范） |
| **建议问题数** | 5-8 条（超 12 条有降权/屏蔽风险） |
| **题目匹配** | `name` **必须**与页面可见标题完全一致（大小写可容差，文字不能差） |
| **答案长度** | 少于 **50 个字符**的答案 Google 大概率屏蔽 |
| **答案内容** | 须为完整自包含回答，不引用"如上所述"等上下文；每条答案应包含至少一个事实/数据/案例 |
| **页面可见性** | 问题和答案**必须在页面渲染的 HTML 中可见**，不能通过 JS 延迟加载或 display:none 隐藏 |
| **重复标记** | 全站相同的 FAQ 只标记一次，多页重复标记会被降权 |
| **禁用内容** | 色情、暴力、非法活动、仇恨言论 |
| **建议数量** | 每页 1 组 FAQPage（一个 `mainEntity` 数组），不嵌套多个 FAQPage |

### HowTo 特殊限制

| 规则 | 说明 |
|------|------|
| **最少步骤** | 1 步即可 |
| **建议步骤** | 3-8 步 |
| **步骤名称** | 建议动词开头（如"安装 Node.js""配置环境变量"） |
| **步骤说明** | 每步独立可读，不依赖上下文 |
| **页面可见性** | 步骤内容必须在页面渲染的 HTML 中可见 |

### 其他字段格式约束

| 字段 | 类型 | 格式要求 |
|------|------|---------|
| **date** | 日期 | `YYYY-MM-DD`（如 `2026-01-01`）或 ISO 8601 `2026-03-20T09:00:00+08:00` |
| **score** | 浮点数 | 范围 0-10，保留 1 位小数（如 `9.3`） |
| **official_url / mobile_url / download_url** | URL | 必须以 `https://` 开头，完整绝对 URL |
| **category** | 字符串数组 | `["父分类", "子分类"]`，首项作为 `applicationCategory` 输出 |
| **tags** | 字符串数组 | 3-8 个，每项 2-20 字 |
| **keywords** | 字符串数组 | 3-10 个（Google 权重低，百度有效） |
| **offers[].name** | 文本 | 10-50 字 |
| **offers[].description** | 文本 | 50-200 字 |
| **publisher** | 文本 | 出版社全称 |
| **pages** | 整数 | 页数，纯数字 |
| **isbn** | 文本 | 13 位数字（如 `978-7-xxxx-xxxx-x`） |
| **cover** | 路径 | 页面包资源路径（如 `page_1.png`） |

### YAML 语法注意事项

| 问题 | 说明 | 正确写法 |
|------|------|---------|
| **弯引号冲突** | `"` `"`（中文弯引号）在 YAML 双引号字符串中会被解析为字符串结束符 | 用直角引号 `「」`，或单引号 `'...'`，或通过 `|` 块标量 |
| **长文本换行** | 超长文本超过 YAML 单行长度 | 用 `|`（保留换行）或 `>`（折叠换行）块标量 |
| **特殊字符** | 值中含 `:` `#` `!` `%` `[` `{` 等 | 整个值用 `"` 双引号包裹 |
| **JSON-LD 引号** | JSON-LD 中必须使用**直双引号** `"` | 编辑器检查引号类型，禁用智能引号 |
| **路径分隔符** | Windows 和 Linux 路径差异 | 统一使用 `/`（Hugo 跨平台兼容） |
