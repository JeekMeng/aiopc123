---
title: "登录"
layout: auth-page
description: "登录 AI 一人公司导航网"
---

<div class="auth-page">
    <div class="auth-title">登录</div>
    <div class="auth-sub">欢迎回到 AI 一人公司导航</div>
    <div class="app-card">
        <div class="auth-input-wrap">
            <i class="fas fa-envelope auth-input-icon"></i>
            <input type="email" class="app-input" id="pageLoginEmail" placeholder="邮箱">
        </div>
        <div class="auth-input-wrap">
            <i class="fas fa-lock auth-input-icon"></i>
            <input type="password" class="app-input" id="pageLoginPassword" placeholder="密码">
        </div>
        <div class="auth-forgot-link">
            <a href="/user/forgot-password/">忘记密码？</a>
        </div>
        <div class="auth-error" id="pageLoginError"></div>
        <button class="app-btn app-btn-primary" id="pageLoginBtn" onclick="pageLogin()">登 录</button>
        <div class="auth-switch">
            还没有账号？<a href="/user/register/">立即注册</a>
        </div>
    </div>
</div>

<script>
function pageLogin() {
    var email = document.getElementById('pageLoginEmail').value.trim();
    var password = document.getElementById('pageLoginPassword').value.trim();
    if (!email || !password) { showPageLoginError('请填写邮箱和密码'); return; }
    var btn = document.getElementById('pageLoginBtn');
    btn.disabled = true; btn.textContent = '登录中...';
    var apiBase = (function(){var p=window.location.port;return(p==='1313'||p==='1317')?'http://localhost:8787/api':'/api';})();
    fetch(apiBase + '/auth/login', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email: email, password: password })
    })
    .then(function(r) { return r.json().then(function(d) { if (!r.ok) throw new Error(d.error || '登录失败'); return d; }); })
    .then(function(data) {
        var user = data.user || data;
        localStorage.setItem('auth_user', JSON.stringify(user));
        window.location.href = '/user/';
    })
    .catch(function(err) {
        showPageLoginError(err.message);
        btn.disabled = false; btn.textContent = '登 录';
    });
}
function showPageLoginError(msg) {
    var el = document.getElementById('pageLoginError');
    el.textContent = msg; el.style.display = 'block';
    setTimeout(function() { el.style.display = 'none'; }, 3000);
}
</script>
