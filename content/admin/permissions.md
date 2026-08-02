---
title: "权限控制"
layout: app-page
description: "配置角色权限"
---

<div id="adminPage" data-section="permissions">
    <div class="app-card">
        <div class="app-card-header">
            <h2 class="app-card-title">权限控制</h2>
            <button class="app-btn app-btn-ghost app-btn-sm" onclick="resetPermissions()" style="color:var(--accent-red);">恢复默认</button>
        </div>
        <p style="font-size:13px;color:var(--text-secondary);margin-bottom:20px;">勾选权限即可为对应角色开启/关闭。更改即时生效。</p>
        <div class="perms-grid" id="adminPermsGrid"></div>
    </div>
</div>
