---
title: "用户管理"
layout: app-page
description: "管理用户、角色分配"
---

<div id="adminPage" data-section="users">
    <div class="app-card">
        <div class="app-card-header">
            <h2 class="app-card-title">用户管理</h2>
        </div>
        <div class="admin-toolbar">
            <input type="text" class="app-input" id="userSearchInput" placeholder="搜索邮箱或昵称...">
            <button class="app-btn app-btn-secondary app-btn-sm" id="userSearchBtn"><i class="fas fa-search"></i> 搜索</button>
        </div>
        <div class="app-table-wrap">
            <table class="app-table">
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>邮箱</th>
                        <th>昵称</th>
                        <th>角色</th>
                        <th>会员等级</th>
                        <th>用户类型</th>
                        <th>操作</th>
                    </tr>
                </thead>
                <tbody id="adminUsersBody"></tbody>
            </table>
        </div>
    </div>
</div>
