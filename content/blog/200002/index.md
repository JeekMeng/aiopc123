---
title: "在 OpenClaw 实现一个帮你干活的 Agent 助理"  # 文章标题
date: 2026-03-20T09:00:00+08:00          # 发布时间（时区+08:00适配中国）
draft: false                             # 是否草稿（false为发布）
tags: ["OpenClaw", "智能体", "Agent助力"]        # 标签
categories: ["技术教程"]                   # 分类
featuredImage: "/static/images/posts/cover.png"  # 封面图（可选，也可放本地静态文件）
summary: "在 OpenClaw 实现一个帮你干活的 Agent 助理"        # 文章摘要
toc: true                                # 是否显示目录（优先级高于全局配置）
---



OpenClaw 不仅仅是一个聊天机器人，它是一个**多 Agent 系统**。你可以创建多个专门的 Agent，每个 Agent 都有自己的 workspace、技能集和个性，负责处理特定的任务。

---

## 一、Agent、Workspace、Skill 的关系

### 核心概念

```
┌─────────────────────────────────────────────────────────┐
│                    OpenClaw 系统                        │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐│
│  │   Agent      │    │  Workspace   │    │    Skill     ││
│  │   (助手)     │◄──►│  (工作空间)   │◄──►│  (技能)      ││
│  │              │    │              │    │              ││
│  │ - 个性/身份   │    │ - 代码/文件   │    │ - 领域知识   ││
│  │ - 行为规则    │    │ - 配置/记忆   │    │ - 工作流程   ││
│  │ - 工具权限    │    │ - 自定义文件  │    │ - 脚本/资源  ││
│  └──────────────┘    └──────────────┘    └──────────────┘│
│         │                  │                  │          │
│         │                  │                  │          │
│         └──────────────────┴──────────────────┘          │
│                        使用                              │
└─────────────────────────────────────────────────────────┘
```

### 关系说明

- **Agent（助手）**：是你的 AI 助理，有自己的"灵魂"和"身份"
- **Workspace（工作空间）**：是 Agent 的"大脑"和"办公室"，存放记忆、配置、自定义文件
- **Skill（技能）**：是 Agent 掌握的"专业能力"，教它如何处理特定任务

**类比：**

- Agent = 员工
- Workspace = 员工的办公室
- Skill = 员工的培训手册

---

## 二、默认的 Main Agent

OpenClaw 默认只有一个 **main Agent**，它的 workspace 在：

```
~/.openclaw/workspace/
```

这个 main Agent 可以做所有事情，但有时候你希望有更专业的分工。

---

## 三、创建专属 Agent

### 是否可以创建专属 Agent？

**可以！** OpenClaw 支持多 Agent 系统，你可以为不同的任务创建专门的 Agent。

### 为什么需要专属 Agent？

- **职责分离**：让每个 Agent 专注于特定领域，效率更高
- **配置隔离**：不同的 Agent 可以有不同的权限、技能、工作流
- **个性化定制**：每个 Agent 可以有完全不同的"个性"

### 示例场景

| Agent 名称       | 职责     | 用途                         |
| ---------------- | -------- | ---------------------------- |
| `main`           | 通用助理 | 日常聊天、文件处理、一般任务 |
| `content-writer` | 内容创作 | 写文章、生成文案、翻译       |
| `developer`      | 开发助手 | 代码编写、调试、技术文档     |
| `data-analyst`   | 数据分析 | 数据处理、图表生成、报告     |
| `social-media`   | 社交媒体 | 微博、公众号、视频脚本创作   |

---

## 四、如何定义一个 Agent

定义一个 Agent 就是创建它的 workspace，并在其中放置特定的配置文件。

### Agent 的核心文件

每个 Agent 的 workspace 都应该包含以下文件（根据需要）：

```
~/.openclaw/<agent-name>/  (或者自定义路径)
├── AGENTS.md        # Agent 的根文件，记录这里是"家"
├── IDENTITY.md      # 你是谁？（名字、身份、个性、emoji）
├── SOUL.md          # 你的核心原则和价值观
├── USER.md          # 你的主人是谁？（如何称呼、偏好、注意事项）
├── HEARTBEAT.md     # 定期任务清单（定期检查的内容）
├── TOOLS.md         # 本地环境的具体配置（API 密钥、服务器地址等）
├── BOOTSTRAP.md     # 首次启动时运行，创建完成后删除
└── skills/          # 专属技能（可选）
    └── <your-skills>/
```

### 各文件说明

#### 1. AGENTS.md（必需）

```markdown
# AGENTS.md - Your Workspace

This folder is home. Treat it that way.
```

这是 workspace 的根文件，告诉 Agent "这里是你的家"。

#### 2. IDENTITY.md（定义身份）

```markdown
# IDENTITY.md - Who Am I?

- **Name:** 小文
- **Creature:** AI 文案助手
- **Vibe:** 创意丰富，幽默风趣
- **Emoji:** ✍️
- **Avatar:** avatars/writer.png
```

#### 3. SOUL.md（核心原则）

```markdown
# SOUL.md - Who You Are

**Be genuinely helpful, not performatively helpful.**

- 跳过客套话，直接帮忙
- 保持简洁，不要废话
- 有观点，可以表达偏好
- 尊重用户隐私
```

#### 4. USER.md（了解主人）

```markdown
# USER.md - About Your Human

- **Name:** 阿明
- **What to call them:** 老大
- **Pronouns:** 他
- **Timezone:** Asia/Shanghai
- **Notes:**
  - 喜欢简洁的文案
  - 讨厌网络用语
  - 工作日白天联系
```

#### 5. HEARTBEAT.md（定期任务）

```markdown
# HEARTBEAT.md

# 定期检查内容：
# - 邮箱：每天上午 9 点检查
# - 日程：提前 2 小时提醒
# - 天气：每天早上提供天气预报
```

#### 6. TOOLS.md（本地配置）

```markdown
# TOOLS.md - Local Notes

### API Keys

- OpenAI API: sk-xxxxx
- WeChat API: wx-xxxxx

### Services

- 微信公众号: my-wechat-account
- 小红书: my-xiaohongshu-account
```

#### 7. BOOTSTRAP.md（首次启动）

```markdown
# BOOTSTRAP.md - Hello, World

你刚刚上线。让我们互相认识一下：

1. 我应该叫你什么？
2. 你希望我做什么？
3. 你喜欢什么样的交流风格？

记录答案后，删除此文件。
```

---

## 五、在 Agent 中自定义 Skill

### Skill 的存放位置

**内置 skill 和自定义 skill 不在同一个地方。**

- **内置技能**：`~/.npm-global/lib/node_modules/openclaw/skills/`
- **自定义技能**（二选一）：
    - `~/.openclaw/skills` → 对所有 agent 共享
    - `<workspace>/skills` → 仅当前 workspace 的 agent 使用

### 优先级

如果同一个 skill 在多个地方都存在，优先级为：

`<workspace>/skills` (最高) → `~/.openclaw/skills` → 内置技能 (最低)

### 如何使用自定义 Skill

**是的，开发完成后直接 copy 到上述任一目录即可使用**，OpenClaw 会自动检测并加载新的技能。

**建议：**

- 如果想让所有 Agent 共享某个 Skill，放到 `~/.openclaw/skills/`
- 如果只给当前 Agent 使用，放到 `<workspace>/skills/`

---

## 六、Skill 开发（简略版）

Skill 的结构：

```
skill-name/
├── SKILL.md          (必需) - 核心说明
├── scripts/          (可选) - 可执行脚本
├── references/       (可选) - 参考文档
└── assets/           (可选) - 资源文件
```

### SKILL.md 的核心

```yaml
---
name: my-skill
description: 这个 Skill 做什么，以及什么时候应该使用它
---

# 具体说明
（如何使用这个 Skill）
```

### 开发流程

1. **理解需求**：用具体例子说明这个 Skill 要解决什么问题
2. **规划资源**：确定需要哪些 scripts、references、assets
3. **创建 Skill**：创建文件夹和 SKILL.md
4. **实现资源**：编写脚本、准备文档和模板
5. **测试使用**：在实际任务中验证
6. **迭代改进**：根据使用反馈优化

> 📖 详细教程请参考《编写你的第一个 Skill.md》

---

## 七、如何使用 Agent 的功能

### 方式一：直接切换到指定 Agent

在配置中指定不同的 workspace：

```json
{
  "agents": {
    "list": [
      {
        "id": "content-writer",
        "workspace": "/home/fh/.openclaw/content-writer"
      },
      {
        "id": "developer",
        "workspace": "/home/fh/.openclaw/developer"
      }
    ]
  }
}
```

### 方式二：通过会话标识

在对话中明确指定要使用哪个 Agent。

### 方式三：使用标签或命令

OpenClaw 支持 Agent 切换命令（具体取决于你的配置）。

---

## 八、实战案例：AI 自媒体作者

假设我是一个 AI 自媒体作者，工作流程是：

**编写主题 → 自动写文档 → 自动发布**

让我们创建一个专门处理这个流程的 Agent。

### 步骤 1：创建 Agent Workspace

```bash
mkdir -p ~/.openclaw/content-creator/skills
```

### 步骤 2：定义 Agent 身份

#### IDENTITY.md

```markdown
# IDENTITY.md - Who Am I?

- **Name:** 创作助手
- **Creature:** AI 内容创作者
- **Vibe:** 创意丰富，懂热点，会写爆款标题
- **Emoji:** 📝
- **Avatar:** avatars/creator.png
```

#### SOUL.md

```markdown
# SOUL.md - 核心原则

**内容创作要接地气，不要像 AI 写的。**

- 避免 AI 常见的"总之"、"综上所述"等套话
- 用口语化表达，像真人一样
- 标题要有吸引力，但不做标题党
- 内容要有价值，不能只是废话
- 了解平台特性（微信、小红书、抖音等）
```

#### USER.md

```markdown
# USER.md - About My Human

- **Name:** 老李
- **What to call them:** 老李
- **Timezone:** Asia/Shanghai
- **Notes:**
  - 主要平台：微信公众号、小红书、知乎
  - 内容领域：科技、AI、互联网
  - 发布频率：每周 3 篇
  - 偏好风格：深度分析 + 实操建议
  - 不喜欢：纯科普、理论堆砌
```

#### TOOLS.md

```markdown
# TOOLS.md - 本地配置

### 公众号

- AppID: wx-xxxxx
- AccessToken: xxxx

### 小红书

- Cookie: xxxx
- UserId: xxxx

### OpenAI API

- API Key: sk-xxxxx
- 模型: gpt-4
```

### 步骤 3：创建专属 Skills

在 `~/.openclaw/content-creator/skills/` 下创建以下 Skills：

#### Skill 1: 主题生成 (topic-generator)

**skills/topic-generator/SKILL.md**

```yaml
---
name: topic-generator
description: 根据领域和时间生成爆款内容主题。用于： (1) 分析热点趋势，(2) 生成标题，(3) 规划内容大纲
---

# 主题生成 Skill

## 工作流程

1. **分析热点**：使用 tools/hot-search.md 中的工具查询当前热点
2. **结合领域**：参考 references/content-domains.md 中的领域知识
3. **生成标题**：使用 scripts/title-generator.py 生成多个标题选项
4. **输出大纲**：生成 3-5 个内容主题，每个包含标题和大纲

## 工具使用

```bash
python scripts/title-generator.py --domain tech --count 5
```

## 示例输出

```
主题 1:
- 标题：ChatGPT 5 也要来了？这 5 个功能可能颠覆你的工作
- 大纲：[具体大纲...]

主题 2:
- 标题：我试用了 10 个 AI 写作工具，这 3 个最好用
- 大纲：[具体大纲...]
```

```
**skills/topic-generator/scripts/title-generator.py**
```python
#!/usr/bin/env python3
"""标题生成器"""

# 实现标题生成逻辑
# ...
```

**skills/topic-generator/references/content-domains.md**

```markdown
# 内容领域

## 科技

- AI 工具使用心得
- 技术趋势分析
- 产品测评

## 互联网

- 商业模式分析
- 行业观察
- 创业故事
```

#### Skill 2: 文档撰写 (content-writer)

**skills/content-writer/SKILL.md**

```yaml
---
name: content-writer
description: 根据主题和大纲撰写高质量原创内容。用于： (1) 写公众号文章，(2) 写小红书笔记，(3) 写知乎回答
---

# 文档撰写 Skill

## 写作原则

1. **口语化**：避免 AI 套话，像真人聊天
2. **有观点**：不要只是信息堆砌，要有自己的看法
3. **有干货**：提供实用建议和经验
4. **讲故事**：用案例和故事让内容更生动

## 模板使用

### 微信公众号模板
使用 `assets/wechat-template.md`

### 小红书模板
使用 `assets/xiaohongshu-template.md`

## 工作流程

1. 阅读主题和大纲
2. 选择合适的平台模板
3. 撰写内容（分段进行，确保连贯）
4. 自动添加配图建议
5. 输出 Markdown 格式文章
```

**skills/content-writer/assets/wechat-template.md**

```markdown
# {标题}

## 导语

（用一句话吸引注意力）

---

## 正文

（内容主体，分段落）

### 小标题 1

内容...

### 小标题 2

内容...

---

## 总结

（1-2 句话总结）

---

**关注我，获取更多 AI 资讯**
```

#### Skill 3: 自动发布 (auto-publish)

**skills/auto-publish/SKILL.md**

```yaml
---
name: auto-publish
description: 自动将写好的内容发布到各个平台。用于： (1) 微信公众号发布，(2) 小红书发布，(3) 其他平台同步
---

# 自动发布 Skill

## 支持的平台

- 微信公众号
- 小红书
- 知乎

## 工作流程

1. **内容转换**：将 Markdown 转换为平台支持的格式
2. **格式调整**：根据平台特性调整排版
3. **图片处理**：上传配图，获取图片 URL
4. **发布**：调用平台 API 发布内容
5. **记录**：在 `references/published-log.md` 中记录发布信息

## 工具使用

```bash
# 发布到公众号
python scripts/publish-wechat.py --file article.md

# 发布到小红书
python scripts/publish-xiaohongshu.py --file note.md
```

## 注意事项

- 发布前预览，确保格式正确
- 发布时间根据平台最佳时机选择
- 发布后检查是否成功

```
**skills/auto-publish/scripts/publish-wechat.py**
```python
#!/usr/bin/env python3
"""微信公众号发布工具"""

import requests

# 使用 TOOLS.md 中的配置
# 实现发布逻辑
# ...
```

### 步骤 4：测试 Agent

1. 启动 Agent，让它认识你（执行 BOOTSTRAP.md）
2. 给它一个任务："帮我生成 3 个科技领域的爆款主题"
3. 选择一个主题："帮我根据这个主题写一篇公众号文章"
4. 发布内容："帮我把这篇文章发布到公众号"

### 步骤 5：自动化流程

可以在 HEARTBEAT.md 中添加定期任务：

```markdown
# HEARTBEAT.md

# 每周一上午 9 点：
# - 生成 3 个本周热点主题
# - 选择最有潜力的主题

# 每周二、四下午 2 点：
# - 提醒是否有待写的内容
# - 检查创作进度

# 每天晚上 8 点：
# - 收集用户反馈和评论
# - 分析数据，优化内容策略
```

---

## 九、总结

### 创建专属 Agent 的完整流程

1. **创建 Workspace**：`mkdir -p ~/.openclaw/<agent-name>`
2. **定义身份**：编写 IDENTITY.md、SOUL.md、USER.md
3. **配置工具**：在 TOOLS.md 中记录 API 密钥等配置
4. **开发 Skills**：创建专属技能，放到 `skills/` 目录
5. **测试使用**：给 Agent 分配任务，验证效果
6. **持续优化**：根据反馈不断改进

### 关键要点

- ✅ 每个 Agent 都有独立的 workspace 和配置
- ✅ 可以通过 workspace 级别的 skills/ 目录添加专属技能
- ✅ 共享技能放在 `~/.openclaw/skills/`
- ✅ 开发完 skill 直接 copy 到对应目录即可使用
- ✅ Agent 之间可以共享技能，也可以完全隔离

### 下一步

现在你已经了解了如何创建专属 Agent，可以尝试：

1. 分析你的工作流程，找出可以自动化的部分
2. 创建第一个专属 Agent
3. 为它编写专属 Skills
4. 逐步完善，让它真正帮你干活

---

**祝你好运！开始创建你的第一个专属 Agent 吧！🚀**
