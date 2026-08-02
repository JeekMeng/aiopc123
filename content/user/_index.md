---
title: "个人中心"
layout: app-page
description: "用户个人中心"
aliases: ["/profile"]
---

<div id="userPage" data-section="home">
    <div class="app-card">
        <div class="profile-card">
            <div class="profile-avatar" id="profileAvatar">U</div>
            <div>
                <div class="profile-name" id="profile-nickname">加载中...</div>
                <div class="profile-email" id="profile-email"></div>
            </div>
        </div>
    </div>
    <div class="admin-stats" style="grid-template-columns:repeat(2,1fr);">
        <a href="/user/bookmarks/" class="stat-card" style="text-decoration:none;cursor:pointer;">
            <div class="stat-number"><i class="fas fa-bookmark" style="color:var(--accent-blue);"></i></div>
            <div class="stat-label">我的收藏</div>
        </a>
        <a href="/user/comments/" class="stat-card" style="text-decoration:none;cursor:pointer;">
            <div class="stat-number"><i class="fas fa-comment-dots" style="color:var(--accent-green);"></i></div>
            <div class="stat-label">我的评论</div>
        </a>
    </div>
    <div class="app-card">
        <div class="app-card-header">
            <h2 class="app-card-title">快捷操作</h2>
        </div>
        <div style="display:flex;flex-wrap:wrap;gap:8px;margin-top:8px;">
            <a href="/user/profile/" class="app-btn app-btn-secondary app-btn-sm"><i class="fas fa-cog"></i> 个人设置</a>
            <a href="/user/bookmarks/" class="app-btn app-btn-secondary app-btn-sm"><i class="fas fa-bookmark"></i> 我的收藏</a>
            <a href="/user/comments/" class="app-btn app-btn-secondary app-btn-sm"><i class="fas fa-comment-dots"></i> 我的评论</a>
            <a href="/workspace/" class="app-btn app-btn-primary app-btn-sm"><i class="fas fa-th-large"></i> 工作台</a>
        </div>
    </div>
</div>