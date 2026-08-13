---
title: "OpenClaw Ubuntu 安装手册（2026 最新版-2026.3.13）"
date: 2026-07-29
draft: false
tags: ["AI工具", "一人公司", "教程"]
categories: ["技术教程"]
description: "OpenClaw 是基于 Node.js 的 AI 自动化与任务编排框架，支持本地/云端模型接入、Web 管理与命令行调度。本手册覆盖 Ubuntu 20.04/22.04/24.04 环境的完整安装、配置、验证与排障流程。"
toc: true
schema_type: "Article"
keywords: ["OpenClaw", "智能体", "AI", "Ubuntu", "安装手册", "2026", "最新版", "13", "技术教程"]
---

OpenClaw 是基于 Node.js 的 AI 自动化与任务编排框架，支持本地/云端模型接入、Web 管理与命令行调度。本手册覆盖 Ubuntu 20.04/22.04/24.04 环境的完整安装、配置、验证与排障流程。

---

## 一、准备工作与限制条件

### 1.1 系统与硬件要求

- **操作系统**：Ubuntu 20.04 LTS / 22.04 LTS / 24.04 LTS（推荐 22.04+）
- **架构**：x86_64（amd64），暂不支持 ARM
- **内存**：≥ 2GB（推荐 4GB+，大任务/多模型需 8GB+）
- **磁盘**：≥ 10GB 可用空间（含依赖、模型缓存、临时文件）
- **权限**：需 `sudo` 权限（安装系统依赖、全局 npm 包）
- **网络**：可访问 GitHub、npm 源（国内建议配置镜像）

### 1.2 核心依赖（必须提前安装）

#### 1.2.1 系统基础依赖

```bash
# 更新系统包列表并升级
sudo apt update && sudo apt upgrade -y

# 安装编译、网络、工具链依赖
sudo apt install -y \
  curl wget git build-essential libssl-dev \
  python3 python3-pip ca-certificates ufw
```

#### 1.2.2 Node.js（强制 ≥ v22.0.0）

OpenClaw 依赖 Node.js 22+，**不支持 Ubuntu 官方源低版本**，推荐用 NodeSource 安装：

```bash
# 导入 NodeSource 22.x 源
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -

# 安装 Node.js + npm
sudo apt install -y nodejs

# 验证版本（必须 ≥ v22.0.0）
node --version  # 输出 v22.x.x
npm --version   # 输出 10.x.x+
```

#### 1.2.3 国内环境优化（可选，强烈推荐）

解决 npm 下载慢/超时：

```bash
# 配置 npm 国内镜像（阿里云）
npm config set registry https://registry.npmmirror.com

# 验证镜像
npm config get registry  # 应返回 https://registry.npmmirror.com
```

### 1.3 限制条件

- 暂不支持 ARM 架构（如 Raspberry Pi）
- 浏览器自动化功能需额外安装 Chrome/Chromium
- 多任务并行时内存占用较高，建议单节点任务数 ≤ 5
- 生产环境建议使用 PM2 守护进程，避免终端退出后服务停止

---

## 二、安装步骤（3 种方式，推荐 npm 全局安装）

### 方式一：官网脚本安装（纯新手首选）

```bash
# 一行命令执行
curl -fsSL https://openclaw.ai/install.sh | bash
# 根据提示进行配置
*** 新手一定要注意，先准备好大模型的appkey，在安装的时候要填写好,否则后面配置比较麻烦！！***
# 验证安装成功（输出版本号即成功）
openclaw --version
```

### 方式二：npm 全局安装（会科学上网的新手/生产首选）

```bash
# 全局安装最新版 OpenClaw
npm install -g openclaw@latest
# 验证安装成功（输出版本号即成功）
openclaw --version
```

### 方式三：pnpm 安装（多版本管理/开发推荐）

```bash
# 先安装 pnpm
sudo npm install -g pnpm

# 全局安装 OpenClaw
pnpm add -g openclaw@latest

# 验证
openclaw --version
```

### 方式四：源码安装（开发/定制修改）

```bash
# 克隆官方仓库
git clone https://github.com/openclaw/openclaw.git
cd openclaw

# 安装依赖（推荐 pnpm）
pnpm install

# 构建项目
pnpm run build

# 全局链接（使 openclaw 命令可用）
pnpm link --global

# 验证
openclaw --version
```

---

## 三、初始化配置（首次必做）

### 3.1 交互式初始化向导

```bash
# 启动配置向导（含守护进程安装）
openclaw onboard --install-daemon
```

按提示完成：

1. 选择 AI 模型提供商（OpenAI / Claude / 阿里云百炼 / Ollama 等）
2. 输入 API Key / 本地模型地址
3. 设置 Web UI 端口（默认 18789）
4. 生成登录令牌（自动保存到配置文件）

### 3.2 配置文件路径

- 主配置：`~/.openclaw/openclaw.json`
- 日志目录：`/tmp/openclaw/`
- 技能目录：`~/.openclaw/skills/`

### 3.3 防火墙配置（外部访问需开放端口）

```bash
# 开放默认端口 18789（仅需外部访问时执行）
sudo ufw allow 18789/tcp
sudo ufw enable
sudo ufw status  # 验证规则
```

---

## 四、启动与验证

### 4.1 启动服务

#### 前台启动（调试/测试）

```bash
openclaw gateway --port 18789 --verbose
```

#### 后台查看服务

```bash
# 查看后台服务
systemctl status openclaw.service
```

### 4.2 验证服务状态

```bash
# 检查网关运行状态
openclaw gateway status

# 查看 PM2 日志（实时）
pm2 logs openclaw
```

### 4.3 Web UI 访问

1. 获取登录令牌：

    ```bash
    grep -A1 '"token"' ~/.openclaw/openclaw.json
    ```

2. 浏览器访问：

    - 本地：`http://127.0.0.1:18789`
    - 远程：`http://服务器IP:18789`

3. 输入令牌登录，进入管理面板。

---

## 五、初步使用命令（常用 CLI）

### 5.1 基础命令

```bash
# 查看版本
openclaw --version

# 查看帮助
openclaw --help
openclaw gateway --help

# 启动/停止网关
openclaw gateway start
openclaw gateway stop

# 查看状态/日志
openclaw gateway status
openclaw gateway logs
```

### 5.2 任务与技能管理

```bash
# 列出已安装技能
openclaw skill list

# 安装官方技能（示例：网页抓取）
openclaw skill install web-crawler

# 运行任务（示例：抓取指定 URL）
openclaw run web-crawler --url https://example.com

# 查看任务状态
openclaw task list
openclaw task status <任务ID>
```

### 5.3 配置管理

```bash
# 编辑配置
openclaw config edit

# 查看当前配置
openclaw config show
```

---

## 六、FAQ（常见问题与解决方案）

### 6.1 安装阶段问题

#### Q1：npm install 卡住/超时

**原因**：网络慢、官方源访问受限
**解决**：

```bash
# 切换国内镜像后重试
npm config set registry https://registry.npmmirror.com
npm install -g openclaw@latest
```

#### Q2：权限错误（EACCES）

**原因**：npm 全局目录无写入权限
**解决**：

```bash
# 方案1：使用 sudo（临时）
sudo npm install -g openclaw@latest

# 方案2：配置用户级全局目录（推荐）
mkdir -p ~/.npm-global
npm config set prefix '~/.npm-global'
echo 'export PATH=~/.npm-global/bin:$PATH' >> ~/.bashrc
source ~/.bashrc
npm install -g openclaw@latest
```

#### Q3：Node.js 版本过低（提示 ≥22）

**解决**：

```bash
# 用 nvm 安装 22 版本
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
source ~/.bashrc
nvm install 22
nvm use 22
node --version  # 验证
```

### 6.2 运行阶段问题

#### Q4：Gateway 无法启动（端口占用）

**解决**：

```bash
# 检查端口占用
sudo lsof -i :18789

# 杀死占用进程
sudo kill -9 <PID>

# 或指定新端口启动
openclaw gateway --port 18790
```

#### Q5：服务频繁重启/崩溃

**解决**：

```bash
# 1. 查看详细日志
pm2 logs openclaw --lines 100

# 2. 前台启动排查（直接显示错误）
openclaw gateway --port 18789 --verbose

# 3. 常见原因：配置错误/模型密钥无效，修正 ~/.openclaw/openclaw.json
```

#### Q6：浏览器自动化失败（Chrome 启动错误）

**原因**：Ubuntu Snap 版 Chromium 兼容性问题
**解决**：

```bash
# 安装 Google Chrome
wget https://dl.google.com/linux/direct/google-chrome-stable_current_amd64.deb
sudo dpkg -i google-chrome-stable_current_amd64.deb

# 在配置中指定 Chrome 路径
# 编辑 ~/.openclaw/openclaw.json，添加：
# "browser": {"executablePath": "/usr/bin/google-chrome-stable"}
```

#### Q7：Web UI 无法访问

**解决**：

1. 确认服务运行：`openclaw gateway status`
2. 检查防火墙：`sudo ufw status`（开放 18789）
3. 验证令牌：`grep '"token"' ~/.openclaw/openclaw.json`
4. 本地访问用 `127.0.0.1`，远程用服务器公网 IP


#### Q8：Web UI 修改默认端口防止攻击

**解决**：

1. 打开~/.openclaw/openclaw.json 
2. 修改配置:

```json
"gateway": {
  "port": 18789,  // 关键：替换为新端口
  "mode": "local",
  "bind": "loopback",  // 若需外网访问，可改为 "0.0.0.0"
  "auth": {
    "mode": "token",
    "token": "3a4b08183b5e860d8f22f3c1134865abdb26257e8e783515"  //登陆的token
  }
}
```

3. 重启openclaw服务:

```shell
本地运行：openclaw restart 或 杀进程后重新启动；
Docker 部署：docker restart [容器ID/名称]；
系统服务：systemctl restart openclaw.service。
```

4. 验证是否修改成功:

```shell
# 本地测试（替换8080为你的新端口）
curl http://127.0.0.1:8080
# 若返回API相关响应，说明端口修改成功
```

#### Q9：模型未配置成功，重新在后台修改配置

**解决**：

1. 打开~/.openclaw/openclaw.json
2. 增加主模型,并添加模型名词、模型URL、模型的KEY,以豆包为例子

```json
"agents": {
    "defaults": {
      "model": {
        "primary": "doubao/[豆包模型官方名称]"  // 第一步：修改主模型名称
      },
      "models": {
        "doubao/[豆包模型官方名称]": {          // 第二步：新增豆包模型配置，添加API Key
          "apiKey": "你的豆包API Key",          // 核心：填写豆包的API密钥
          "baseUrl": "https://api.doubao.com/v1" // 可选：豆包API的基础地址（需确认官方地址）
        }
        // 可保留原minimax模型（注释/删除均可）：
        // "minimax-cn/MiniMax-M2.5": {}
      },
```

4. 重启服务

```shell
   本地运行：openclaw restart 或 杀进程后重新启动；
   Docker 部署：docker restart [容器ID/名称]；
   系统服务：systemctl restart openclaw.service。
```

---

## 七、卸载与清理

```bash
# 卸载 OpenClaw
npm uninstall -g openclaw

# 清理配置与缓存
rm -rf ~/.openclaw
rm -rf /tmp/openclaw
```

<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Article",
  "headline": "OpenClaw Ubuntu 安装手册（2026 最新版-2026.3.13）",
  "description": "OpenClaw 最新版 安装手册",
  "datePublished": "2026-07-29",
  "author": {
    "@type": "Person",
    "name": "AI 一人公司导航"
  },
  "mainEntityOfPage": {
    "@type": "WebPage",
    "@id": "/blog/200000"
  }
}
</script>