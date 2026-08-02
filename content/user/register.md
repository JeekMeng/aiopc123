---
title: "注册"
layout: auth-page
description: "注册 AI 一人公司导航网"
---

<div class="auth-page">
    <div class="auth-title">注册</div>
    <div class="auth-sub">加入 AI 一人公司导航</div>
    <div class="app-card">
        <div class="auth-input-wrap">
            <i class="fas fa-user auth-input-icon"></i>
            <input type="text" class="app-input" id="pageRegNickname" placeholder="昵称">
        </div>
        <div class="auth-input-wrap">
            <i class="fas fa-envelope auth-input-icon"></i>
            <input type="email" class="app-input" id="pageRegEmail" placeholder="邮箱">
        </div>
        <div class="auth-input-wrap">
            <i class="fas fa-lock auth-input-icon"></i>
            <input type="password" class="app-input" id="pageRegPassword" placeholder="密码">
        </div>
        <div class="auth-input-wrap">
            <i class="fas fa-check-circle auth-input-icon"></i>
            <input type="password" class="app-input" id="pageRegConfirm" placeholder="确认密码">
        </div>
        <div class="auth-error" id="pageRegError"></div>
        <button class="app-btn app-btn-primary" id="pageRegBtn" onclick="pageRegister()">注 册</button>
        <div class="auth-switch">
            已有账号？<a href="/user/login/">立即登录</a>
        </div>
    </div>
</div>

<script>
function pageRegister() {
    var nickname = document.getElementById('pageRegNickname').value.trim();
    var email = document.getElementById('pageRegEmail').value.trim();
    var password = document.getElementById('pageRegPassword').value.trim();
    var confirm = document.getElementById('pageRegConfirm').value.trim();
    if (!nickname || !email || !password || !confirm) { showPageRegError('请填写所有字段'); return; }
    if (password !== confirm) { showPageRegError('两次密码不一致'); return; }
    var btn = document.getElementById('pageRegBtn');
    btn.disabled = true; btn.textContent = '注册中...';
    var apiBase = (function(){var p=window.location.port;return(p==='1313'||p==='1317')?'http://localhost:8787/api':'/api';})();
    fetch(apiBase + '/auth/register', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email: email, password: password, nickname: nickname })
    })
    .then(function(r) { return r.json().then(function(d) { if (!r.ok) throw new Error(d.error || '注册失败'); return d; }); })
    .then(function(data) {
        var user = data.user || data;
        localStorage.setItem('auth_user', JSON.stringify(user));
        window.location.href = '/user/';
    })
    .catch(function(err) {
        showPageRegError(err.message);
        btn.disabled = false; btn.textContent = '注 册';
    });
}
function showPageRegError(msg) {
    var el = document.getElementById('pageRegError');
    el.textContent = msg; el.style.display = 'block';
    setTimeout(function() { el.style.display = 'none'; }, 3000);
}
</script>
