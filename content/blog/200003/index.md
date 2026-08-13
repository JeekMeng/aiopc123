---
title: "编写你的第一个 OpenClaw Skill"
date: 2026-07-29
draft: false
tags: ["AI工具", "一人公司", "教程"]
categories: ["技术教程"]
description: " 编写你的第一个 OpenClaw Skill， Skill 是什么？简单来说，它是给 AI 助手的\"插件\"——通过编写 Skill，你可以扩展 OpenClaw 的能力，让它掌握特定领域的专业知识、工作流程和工具使用方法。"
toc: true
schema_type: "Article"
keywords: ["OpenClaw", "智能体", "SKILL", "编写你的第一个", "Skill", "技术教程"]
---

> Skill 是什么？简单来说，它是给 AI 助手的"插件"——通过编写 Skill，你可以扩展 OpenClaw 的能力，让它掌握特定领域的专业知识、工作流程和工具使用方法。

## 为什么需要 Skill？

想象一下：你希望 OpenClaw 帮你处理公司特定的业务、使用某个复杂的 API、或者按照你的风格生成文档。通用模型虽然聪明，但它不知道你公司的业务规则、不知道你喜欢的文档风格、也不知道某个冷门 API 的具体用法。

**Skill 就像是一本"操作手册"**，告诉 OpenClaw 在特定场景下该怎么做、用什么工具、遵循什么流程。

---

## Skill 的结构

每个 Skill 都是一个独立的文件夹，结构如下：

```
skill-name/
├── SKILL.md          (必需) - 核心说明文件
├── scripts/          (可选) - 可执行脚本
├── references/       (可选) - 参考文档
└── assets/           (可选) - 资源文件（模板、图片等）
```

### 1. SKILL.md (必需)

这是 Skill 的核心，分为两部分：

#### YAML 前置元数据

```yaml
---
name: my-skill
description: 这个 Skill 做什么，以及什么时候应该使用它
---
```

- `name`: Skill 的名称（小写字母、数字、连字符）
- `description`: 这是最重要的部分！OpenClaw 会根据这个描述来决定何时触发你的 Skill。要写清楚：
    - 这个 Skill 能做什么
    - 在什么场景下应该使用它
    - 有哪些触发关键词

**示例：**

```yaml
---
name: docx-editor
description: 处理 Word 文档（.docx）的创建、编辑和分析。支持修订模式、评论、格式保留和文本提取。当需要： (1) 创建新文档，(2) 编辑内容，(3) 处理修订，(4) 添加评论时使用
---
```

#### Markdown 主体

这里是具体的操作指南，告诉 OpenClaw 如何使用这个 Skill。

**重要规则：**

- 使用祈使句/动词原形（比如"使用这个命令"，而不是"你应该使用这个命令"）
- 保持简洁，只写 OpenClaw 不知道的信息
- 不要重复通用知识

### 2. scripts/ (可选)

存放可执行脚本（Python、Bash 等）。

**什么时候需要？**

- 同样的代码被反复重写
- 需要确定性的执行结果

**示例：**

```bash
scripts/
└── rotate_pdf.py  # 旋转 PDF 的脚本
```

### 3. references/ (可选)

存放参考文档，供 OpenClaw 在工作中查阅。

**什么时候需要？**

- 需要参考的 API 文档
- 公司的业务规则
- 数据库 schema
- 详细的流程说明

**示例：**

```bash
references/
├── api-docs.md      # API 参考文档
├── database-schema.md  # 数据库结构
└── policies.md      # 公司政策
```

### 4. assets/ (可选)

存放不加载到上下文中，但需要在输出中使用的文件。

**什么时候需要？**

- 模板文件（PPT、HTML、React 等）
- 品牌资源（logo、图标）
- 字体文件
- 示例代码

**示例：**

```bash
assets/
├── logo.png
├── report-template.pptx
└── frontend-template/
```

---

## 编写 Skill 的核心原则

### 1. 简洁至上

上下文窗口是公共资源。Skill 会占用对话的上下文空间，所以：

**默认假设：OpenClaw 已经很聪明了。** 只添加它不知道的信息。

- **不要解释**基本的编程概念（OpenClaw 知道什么是 for 循环）
- **不要重复**通用的操作步骤
- **用例子**代替冗长的说明

### 2. 适度自由度

根据任务的脆弱性和可变性匹配自由度：

| 自由度   | 类型             | 适用场景                           |
| -------- | ---------------- | ---------------------------------- |
| 高自由度 | 文本说明         | 多种方法都可行，需要根据上下文决策 |
| 中自由度 | 伪代码/脚本+参数 | 有推荐模式，但允许变化             |
| 低自由度 | 固定脚本，少参数 | 操作容易出错，必须严格遵循         |

想象一下：

- 在开阔的草原上 → 高自由度，很多路径都可以
- 在狭窄的悬崖桥上 → 低自由度，必须有明确的护栏

### 3. 渐进式揭示

使用三级加载系统管理上下文：

1. **元数据**（name + description）→ 始终在上下文中（约 100 词）
2. **SKILL.md 主体** → Skill 触发时加载（< 5k 词）
3. **打包资源** → 按需加载（不占用上下文）

**技巧：**

- 保持 SKILL.md 主体简洁（< 500 行）
- 详细信息放到 references/ 中
- 在 SKILL.md 中明确说明何时读取哪些参考文件

---

## Skill 创建流程

### 步骤 1：理解需求（用具体例子）

先搞清楚这个 Skill 要解决什么问题。**一定要用具体的例子。**

**错误提问：**

- "这个 Skill 应该做什么？"

**正确提问：**

- "用户可能会说'帮我旋转这个 PDF'，还有其他使用场景吗？"
- "你能给我一些这个 Skill 如何被使用的例子吗？"

### 步骤 2：规划可复用内容

分析每个例子，思考：

1. 从头执行需要什么？
2. 什么资源可以复用？

**例子：** 用户说"帮我旋转这个 PDF"
→ 分析：每次旋转都要写同样的代码
→ 规划：创建 `scripts/rotate_pdf.py`

**例子：** 用户说"帮我生成一份月度报告"
→ 分析：每次都需要同样的模板和格式
→ 规划：创建 `assets/report-template.pptx`

### 步骤 3：初始化 Skill

使用 `init_skill.py` 脚本创建 Skill 模板：

```bash
scripts/init_skill.py my-skill --path skills/public
```

选项：

- `--resources scripts,references,assets` - 创建资源目录
- `--examples` - 添加示例文件

### 步骤 4：编辑 Skill

#### A. 实现可复用资源

先实现 `scripts/`、`references/`、`assets/` 中的文件。

**测试脚本：**

```bash
python scripts/your_script.py  # 确保能正常运行
```

#### B. 更新 SKILL.md

**编写前置元数据：**

```yaml
---
name: your-skill
description: 一句话描述这个 Skill 做什么，以及在什么场景下应该使用它
---
```

**编写主体内容：**

- 使用祈使句/动词原形
- 只写核心流程和必要细节
- 详细信息放到 references/ 中引用

**示例结构：**

```markdown
# Your Skill

## 快速开始

使用这个命令：`your-command`

## 工作流程

1. 步骤一
2. 步骤二

## 高级功能

详细的配置选项，见 [ADVANCED.md](references/ADVANCED.md)
```

### 步骤 5：打包 Skill

开发完成后，打包成 `.skill` 文件：

```bash
scripts/package_skill.py path/to/skill-folder
```

这个脚本会：

1. **自动验证**：检查 YAML 格式、命名规范、文件组织等
2. **打包**：创建 `.skill` 文件（本质是 zip 文件）

如果验证失败，会报告错误，修复后重新运行。

### 步骤 6：迭代改进

在实际使用中发现问题，持续改进：

1. 用 Skill 完成真实任务
2. 注意遇到的困难或低效之处
3. 更新 SKILL.md 或资源文件
4. 再次测试

---

## 实用技巧

### 技巧 1：如何命名 Skill

- 使用小写字母、数字、连字符
- 简短、动词引导的短语
- 必要时按工具命名（如 `gh-pr-comment`）

### 技巧 2：何时拆分内容

当 SKILL.md 接近 500 行时，考虑拆分：

- 核心流程留在 SKILL.md
- 详细信息移到 references/
- 多个变体按类别拆分（如 `aws.md`, `gcp.md`, `azure.md`）

### 技巧 3：避免的信息冗余

**不要在 Skill 中包含：**

- README.md
- 安装指南
- 更新日志
- 用户文档

**只需要：**

- AI 需要知道的执行信息
- 必要的流程和工具说明

### 技巧 4：编写描述的技巧

好的描述要回答：

- **什么**：这个 Skill 做什么
- **何时**：在什么场景下使用
- **为什么**：为什么需要这个 Skill（相比通用能力）

**示例：**

```yaml
---
name: image-editor
description: 处理图像编辑任务，包括裁剪、旋转、滤镜应用、格式转换等。当用户需要： (1) 编辑图片，(2) 调整图像尺寸，(3) 应用滤镜，(4) 转换图像格式时使用
---
```

---

## 常见问题

**Q: SKILL.md 和 references/ 中的文件内容可以重复吗？**
A: 不可以。信息应该只存在一个地方。SKILL.md 保持精简，详细信息放 references/。

**Q: 脚本会被加载到上下文吗？**
A: 不一定。脚本可以直接执行，只有在需要修改时才读取内容。这样节省上下文空间。

**Q: Skill 文件夹中可以有 README.md 吗？**
A: 不需要。Skill 是给 AI 看的，不是给人看的。只需要 SKILL.md 和必要的资源文件。

**Q: 如何确保 Skill 会被正确触发？**
A: 关键在 `description` 字段。要写清楚触发场景和关键词。

---

## 下一步

现在你已经了解了如何编写 Skill，可以：

1. **分析你的需求**：你希望 OpenClaw 帮你做什么重复性的工作？
2. **收集例子**：找出几个典型的使用场景
3. **开始创建**：使用 `init_skill.py` 初始化你的第一个 Skill
4. **迭代改进**：在实际使用中不断优化

祝你好运！开始创建你的第一个 Skill 吧！🚀

<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Article",
  "headline": "编写你的第一个 OpenClaw Skill",
  "description": "编写你的第一个 OpenClaw Skill",
  "datePublished": "2026-07-29",
  "author": {
    "@type": "Person",
    "name": "AI 一人公司导航"
  },
  "mainEntityOfPage": {
    "@type": "WebPage",
    "@id": "/blog/200003"
  }
}
</script>