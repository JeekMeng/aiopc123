---
title: "OpenClaw 完全使用手册（新手版）"
date: 2026-07-29
draft: false
tags: ["AI工具", "一人公司", "教程"]
categories: ["技术教程"]
description: "OpenClaw 是一款**本地部署、全平台打通**的 AI 助手网关，能让大模型（Claude/GPT/本地模型）直接操控你的电脑、处理文件、对接聊天软件、执行自动化任务，新手也能快速上手。"
featuredImage: "/static/images/posts/cover.png"
toc: true
schema_type: "Article"
keywords: ["OpenClaw", "智能体", "使用手册", "完全使用手册", "新手版", "技术教程"]
---

OpenClaw 是一款**本地部署、全平台打通**的 AI 助手网关，能让大模型（Claude/GPT/本地模型）直接操控你的电脑、处理文件、对接聊天软件、执行自动化任务，新手也能快速上手。

---

## 一、安装完成后：新手快速启动（3步）

### 1. 启动引导配置（必做）

```bash
# 运行新手引导，配置模型、网关、聊天渠道
openclaw onboard
```

引导会依次完成：

- 选择 AI 模型（Claude/GPT/本地模型），填入 API Key
- 启动 Gateway 网关（默认端口 18789）
- 绑定聊天渠道（Telegram/WhatsApp/飞书/钉钉等）
- 开启沙盒安全模式（新手强烈建议开启）

### 2. 启动网关服务（后台运行）

```bash
# 启动网关（默认端口 18789）
openclaw gateway start

# 查看网关状态
openclaw gateway status

# 打开 Web 控制面板（浏览器操作）
openclaw dashboard
# 访问地址：http://127.0.0.1:18789
```

### 3. 首次交互测试

```bash
# 终端直接和 AI 对话
openclaw chat

# 发送测试消息（绑定 Telegram 后）
openclaw message send --channel telegram --target @你的用户名 --message "你好，OpenClaw"
```

---

## 二、OpenClaw 能做什么？（新手核心场景）

### 1. 本地文件自动化（办公神器）

- 批量整理文件、重命名、分类
- 读取/编辑 Word/Excel/PDF/TXT，提取内容、生成总结
- 批量转换格式、合并/拆分文档
- 自动备份重要文件夹到云端/本地

### 2. 聊天渠道打通（多端交互）

- 在 Telegram/WhatsApp/飞书/钉钉 远程发指令
- 接收电脑状态、文件处理结果、定时提醒
- 远程控制电脑执行任务（无需在电脑前）

### 3. 定时任务与自动化（解放双手）

- 定时生成报表、发送邮件/群消息
- 定时抓取网页数据、监控网站状态
- 定时备份文件、清理系统垃圾

### 4. 开发者辅助（效率提升）

- 生成/调试代码、排查 Bug
- 自动生成接口文档、注释
- 批量处理代码文件、格式化代码

### 5. 系统与设备管理

- 监控系统状态、进程、端口占用
- 远程重启/关机、管理服务
- 配对手机/平板，实现跨设备控制

---

## 三、新手必学核心命令（高频使用）

### 1. 网关与基础命令

```bash
# 查看版本
openclaw --version

# 查看帮助
openclaw --help
openclaw gateway --help

# 启动/停止/重启网关
openclaw gateway start
openclaw gateway stop
openclaw gateway restart

# 查看日志（排查问题）
openclaw logs --follow
```

### 2. 聊天与消息命令

```bash
# 终端直接对话
openclaw chat

# 发送消息（Telegram 示例）
openclaw message send --channel telegram --target @username --message "内容"

# 查看消息历史
openclaw message list
```

### 3. 文件处理命令

```bash
# 让 AI 整理桌面文件
openclaw chat
> 帮我整理桌面所有文件，按图片、文档、安装包分类到对应文件夹

# 批量提取 PDF 内容并总结
openclaw chat
> 读取 ~/Documents/ 下所有 PDF，总结核心内容，保存为 summary.md
```

### 4. 定时任务（cron）

```bash
# 添加每日 9 点发送工作提醒
openclaw cron add --every "1d" --at "09:00" --message "今日工作重点：1. 完成周报 2. 开会"

# 查看定时任务
openclaw cron list

# 测试任务
openclaw cron test 任务ID
```

### 5. 模型管理

```bash
# 查看可用模型
openclaw models list

# 切换模型（如 Claude 3.5）
openclaw models set anthropic/claude-3-5-sonnet-20240620
```

---

## 四、新手实战案例：每日自动办公助手（完整流程）

### 目标

每天早上 9:00，自动：

1. 整理桌面文件
2. 读取昨日工作文档，生成总结
3. 发送总结到 Telegram，并提醒今日任务

### 步骤1：配置 Telegram 渠道

```bash
# 登录 Telegram 渠道
openclaw channels login telegram
# 按提示输入 Bot Token（从 @BotFather 获取）
# 绑定你的 Telegram 账号
```

### 步骤2：编写自动化指令（保存为脚本）

创建文件 `daily_task.sh`：

```bash
#!/bin/bash
# 1. 整理桌面文件
openclaw agent --message "整理桌面所有文件，按图片、文档、安装包分类到 ~/Desktop/分类文件夹/"

# 2. 生成昨日工作总结
openclaw agent --message "读取 ~/Documents/昨日工作/ 下所有文档，总结核心内容，保存为 ~/Documents/每日总结/$(date +%Y-%m-%d)-总结.md"

# 3. 发送总结到 Telegram，并提醒今日任务
openclaw message send --channel telegram --target @你的用户名 \
--message "📅 今日（$(date +%Y-%m-%d)）工作提醒：
1. 完成周报
2. 14:00 项目会议
3. 整理客户资料

昨日工作总结已生成：~/Documents/每日总结/$(date +%Y-%m-%d)-总结.md"
```

### 步骤3：添加定时任务

```bash
# 给脚本执行权限
chmod +x daily_task.sh

# 添加每日 9:00 执行任务
openclaw cron add --every "1d" --at "09:00" --command "./daily_task.sh"

# 查看任务
openclaw cron list
```

### 步骤4：测试与验证

```bash
# 手动测试任务
openclaw cron test 任务ID

# 查看日志，确认执行成功
openclaw logs --follow
```

### 效果

每天 9:00，你会在 Telegram 收到工作提醒，电脑自动完成文件整理和文档总结，无需手动操作。

---

## 五、新手常见问题与排查

### 1. 网关启动失败

```bash
# 查看端口占用（默认 18789）
lsof -i :18789

# 强制停止占用进程
pkill -f "openclaw gateway"

# 换端口启动
openclaw gateway --port 18790
```

### 2. 模型调用报错（如 Unknown model）

```bash
# 查看支持的模型列表
openclaw models list

# 正确设置模型（示例：Claude 3.5）
openclaw models set anthropic/claude-3-5-sonnet-20240620

# 检查 API Key 是否正确
openclaw config get model.api_key
```

### 3. 聊天渠道无法发送消息

```bash
# 查看渠道状态
openclaw channels status

# 重新登录渠道
openclaw channels login telegram
```

### 4. 命令找不到（openclaw: command not found）

```bash
# 重新安装 CLI
npm install -g openclaw

# 检查环境变量
echo $PATH | grep npm
```

---

## 六、进阶：安全与扩展（新手可选）

### 1. 安全设置（必开）

```bash
# 开启沙盒模式（限制 AI 操作权限）
openclaw config set sandbox.enabled true

# 开启执行审批（AI 执行危险操作前需确认）
openclaw approvals enable
```

### 2. 安装插件（扩展功能）

```bash
# 安装文件处理插件
openclaw plugins install file-utils

# 安装网页抓取插件
openclaw plugins install web-scraper

# 查看已安装插件
openclaw plugins list
```

---

## 七、总结

OpenClaw 新手使用核心逻辑：**安装 → 配置模型/渠道 → 启动网关 → 发指令/设定时 → 自动执行**。
从文件整理、定时提醒到远程控制，它能帮你大幅提升办公与开发效率，且所有数据本地部署，安全可控。

<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Article",
  "headline": "OpenClaw 完全使用手册（新手版）",
  "description": "OpenClaw 最新版 使用手册",
  "datePublished": "2026-07-29",
  "author": {
    "@type": "Person",
    "name": "AI 一人公司导航"
  },
  "mainEntityOfPage": {
    "@type": "WebPage",
    "@id": "/blog/200001"
  }
}
</script>