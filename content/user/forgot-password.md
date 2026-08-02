---
title: "忘记密码"
layout: auth-page
description: "重置密码"
---

<div class="auth-page">
    <div class="auth-title">忘记密码</div>
    <div class="auth-sub">输入邮箱，我们将发送重置链接</div>
    <div class="app-card">
        <div class="auth-input-wrap">
            <i class="fas fa-envelope auth-input-icon"></i>
            <input type="email" class="app-input" id="forgotEmail" placeholder="邮箱">
        </div>
        <div class="auth-error" id="forgotError"></div>
        <div class="auth-success" id="forgotSuccess">重置链接已发送，请查看邮箱</div>
        <button class="app-btn app-btn-primary" id="forgotBtn" onclick="pageForgotPassword()">发送重置链接</button>
        <div class="auth-switch">
            <a href="/user/login/">返回登录</a>
        </div>
    </div>
</div>

<script>
function pageForgotPassword() {
    var email = document.getElementById('forgotEmail').value.trim();
    if (!email) { showForgotError('请输入邮箱'); return; }
    var btn = document.getElementById('forgotBtn');
    btn.disabled = true; btn.textContent = '发送中...';
    var apiBase = (function(){var p=window.location.port;return(p==='1313'||p==='1317')?'http://localhost:8787/api':'/api';})();
    fetch(apiBase + '/auth/forgot-password', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email })
    })
    .then(function(r) { return r.json().then(function(d) { if (!r.ok) throw new Error(d.error || '操作失败'); return d; }); })
    .then(function(data) {
        document.getElementById('forgotSuccess').style.display = 'block';
        document.getElementById('forgotError').style.display = 'none';
        btn.style.display = 'none';
        if (data.token) {
            var link = window.location.origin + '/user/reset-password/?token=' + data.token;
            document.getElementById('forgotSuccess').innerHTML = '<a href="' + link + '">点击此处重置密码</a>';
        }
    })
    .catch(function(err) {
        showForgotError(err.message);
        btn.disabled = false; btn.textContent = '发送重置链接';
    });
}
function showForgotError(msg) {
    var el = document.getElementById('forgotError');
    el.textContent = msg; el.style.display = 'block';
    setTimeout(function() { el.style.display = 'none'; }, 3000);
}
</script>
