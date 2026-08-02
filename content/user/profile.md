---
title: "个人设置"
layout: app-page
description: "修改密码"
---

<div id="userPage" data-section="profile">
    <div class="app-card">
        <div class="profile-card">
            <div class="profile-avatar" id="profileAvatar">U</div>
            <div>
                <div class="profile-name" id="profile-nickname">加载中...</div>
                <div class="profile-email" id="profile-email"></div>
            </div>
        </div>
    </div>
    <div class="app-card">
        <div class="app-card-header">
            <h2 class="app-card-title">修改密码</h2>
        </div>
        <form id="changePwdForm" style="max-width:400px;">
            <div class="app-form-group">
                <label class="app-form-label">当前密码</label>
                <input type="password" class="app-input" id="curPwd" placeholder="当前密码" required>
            </div>
            <div class="app-form-group">
                <label class="app-form-label">新密码（至少6位）</label>
                <input type="password" class="app-input" id="newPwd" placeholder="新密码" required>
            </div>
            <div class="app-form-group">
                <label class="app-form-label">确认新密码</label>
                <input type="password" class="app-input" id="confirmPwd" placeholder="确认新密码" required>
            </div>
            <div class="auth-error" id="changePwdError"></div>
            <div style="color:var(--accent-green);font-size:13px;margin-top:8px;display:none;" id="changePwdSuccess">密码修改成功</div>
            <button type="submit" class="app-btn app-btn-primary" style="margin-top:4px;">修改密码</button>
        </form>
    </div>
</div>