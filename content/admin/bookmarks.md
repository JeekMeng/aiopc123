---
title: "收藏管理"
layout: app-page
description: "管理所有用户的收藏记录"
---

<div id="adminPage" data-section="bookmarks">
    <div class="app-card">
        <div class="app-card-header">
            <h2 class="app-card-title">收藏管理</h2>
            <span id="adminBookmarkCount" style="font-size:13px;color:var(--text-secondary);">0 条</span>
        </div>
        <div class="admin-toolbar">
            <input type="text" class="app-input" id="adminBookmarkSearch" placeholder="搜索标题、描述或用户...">
            <button class="app-btn app-btn-secondary app-btn-sm" onclick="adminPageLoadBookmarks(document.getElementById('adminBookmarkSearch').value)"><i class="fas fa-search"></i> 搜索</button>
        </div>
        <div class="admin-bookmarks-list" id="adminBookmarksList"></div>
    </div>
</div>
