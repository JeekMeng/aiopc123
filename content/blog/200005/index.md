---
title: "一人公司建站运营干货｜手把手搭建谷歌批量自动收录方案，大幅提升站点流量"  # 文章标题
date: 2026-05-17T09:00:00+08:00          # 发布时间（时区+08:00适配中国）
draft: false                             # 是否草稿（false为发布）
tags: ["一人公司", "网站运营", "谷歌收录"]        # 标签
categories: ["网站运营"]                   # 分类
featuredImage: "/static/images/posts/cover.png"  # 封面图（可选，也可放本地静态文件）
summary: "Google Indexing API 网页搜索索引 API 完整开通配置流程，搭配 curl 命令实现一键批量提交网址收录，大幅缩短页面收录周期，非常适合网站运营、独立站长、一人公司创业者日常高效运维站点"        # 文章摘要
toc: true                                # 是否显示目录（优先级高于全局配置）

---

​	做境外个人站点、搭建一人公司线上项目，最头疼的问题就是谷歌收录缓慢，大量新页面长期处于已发现未索引状态，严重影响网站流量与运营进度。传统手动在谷歌搜索控制台提交页面效率极低，批量更新内容根本来不及操作。今天给大家分享**Google Indexing API 网页搜索索引 API**完整开通配置流程，搭配 curl 命令实现一键批量提交网址收录，大幅缩短页面收录周期，非常适合网站运营、独立站长、一人公司创业者日常高效运维站点。

## 一、工具作用介绍

Google Indexing API 是谷歌官方推出的收录推送接口，区别于手动提交，支持自动化、大批量推送新增页面、更新页面，免费额度足够中小型站点、一人公司站点日常使用，每日可推送 200 条链接，完美适配批量发文、站点批量更新场景，是海外站点运营提速收录的核心利器。

## 二、前期准备工作

1. 拥有正常可访问的独立网站，站点已绑定 Google Search Console 谷歌搜索控制台
2. 登录可用谷歌账号，可正常访问谷歌云控制台
3. 电脑终端支持运行 curl 命令，Windows、Mac、Linux 均可使用

## 三、Google Indexing API 完整开通配置流程

所有操作统一在**Google Cloud Console 谷歌云控制台**内完成，流程统一无多余步骤。

### 1. 新建谷歌云项目

1. 进入谷歌云控制台官网：https://console.cloud.google.com/
2. 点击左上角项目选择栏，点击新建项目，自定义项目名称，完成项目创建并选中项目。

### 2. 启用网页搜索索引 API

1. 在控制台顶部搜索框搜索：Indexing API
2. 找到 **Web Search Indexing API** 网页搜索索引 API，点击进入详情页
3. 直接点击启用按钮，等待 API 开通完成。

### 3. 创建服务账号

1. 左侧菜单栏找到「API 和服务」-「凭据」
2. 点击创建凭据，选择**服务账号**
3. 自定义填写服务账号名称，系统自动生成服务账号邮箱，复制保存该邮箱，后续授权必备
4. 权限选择所有者权限，一路点击确认完成创建。

### 4. 下载 JSON 密钥文件

1. 凭据列表找到刚刚创建的服务账号，点击进入
2. 切换至密钥选项，点击添加密钥，选择创建新密钥
3. 密钥格式选择**JSON**，确认后自动下载密钥文件，妥善保存，请勿泄露。

### 5. 谷歌搜索控制台授权（核心必做）

1. 打开 Google Search Console：https://search.google.com/search-console/
2. 选中需要推送收录的网站，进入站点设置
3. 找到用户和权限管理，点击添加用户 （注意：账号同步有延迟，稍等一会）
4. 粘贴之前复制的服务账号邮箱，权限设置为**站点所有者**，完成添加授权，无授权会出现推送失败、权限报错。

## 四、获取谷歌授权令牌

1. 借助 Python 脚本快速生成授权访问令牌，新建文本粘贴以下代码

```
from google.oauth2 import service_account
from google.auth.transport.requests import Request

# 填写你的JSON密钥文件路径
KEY_PATH = "你的密钥.json"
SCOPE = ["https://www.googleapis.com/auth/indexing"]

credentials = service_account.Credentials.from_service_account_file(KEY_PATH, scopes=SCOPE)
credentials.refresh(Request())
# 输出授权令牌
print(credentials.token)
```

1. 运行脚本，复制输出的一串字符，即为可用访问令牌。

## 五、Google Indexing API 批量推送 CURL 命令

### 1. 单页面收录推送命令

```
curl -X POST https://indexing.googleapis.com/v3/urlNotifications:publish \
-H "Authorization: Bearer 替换为你的授权令牌" \
-H "Content-Type: application/json" \
-d '{
  "url": "https://www.xxx.com/about",
  "type": "URL_UPDATED"
}'
```

参数说明：

- URL_UPDATED：新增页面、更新页面通用提交类型
- URL_DELETED：网站删除页面提交类型

### 2. 多页面批量快捷推送

```
# 推送网站首页
curl -X POST https://indexing.googleapis.com/v3/urlNotifications:publish -H "Authorization: Bearer 你的令牌" -H "Content-Type:application/json" -d '{"url":"https://www.xxx.com/","type":"URL_UPDATED"}'

# 推送关于页面
curl -X POST https://indexing.googleapis.com/v3/urlNotifications:publish -H "Authorization: Bearer 你的令牌" -H "Content-Type:application/json" -d '{"url":"https://www.xxx.com/about","type":"URL_UPDATED"}'
```

只需要替换链接与授权令牌，即可一键批量提交全站所有页面。

## 六、运营实操使用技巧

1. 发文节奏：一人公司站点无需每日零散发文，可每周集中批量更新多篇文章，统一批量推送收录，收录效率更高
2. 搭配使用：谷歌使用 Indexing API 推送，必应、雅虎等搜索引擎搭配 IndexNow 接口推送，双渠道全覆盖加速收录
3. 日常运维：网站页面修改、内容优化完成后，第一时间重新推送链接，快速更新搜索引擎快照
4. 避坑提醒：不要短时间高频重复推送同一链接，遵循官方免费配额匀速提交，避免账号限制

## 七、总结

对于专注网站运营、打造一人公司线上事业的创业者来说，掌握 Google Indexing API 批量收录方法，能够彻底解决谷歌收录慢、收录不全的行业痛点，大幅节省人工运维时间，把更多精力放在内容创作、产品研发、站点变现与流量运营上，低成本高效运营独立站点，快速搭建属于自己的稳定线上创业项目。