---
title: "重置密码"
layout: auth-page
description: "设置新密码"
---

<div class="auth-page">
    <div class="auth-title">重置密码</div>
    <div class="auth-sub">请设置新密码</div>
    <div class="app-card">
        <div class="auth-input-wrap">
            <i class="fas fa-lock auth-input-icon"></i>
            <input type="password" class="app-input" id="resetPassword" placeholder="新密码（至少6位）">
        </div>
        <div class="auth-input-wrap">
            <i class="fas fa-check-circle auth-input-icon"></i>
            <input type="password" class="app-input" id="resetConfirm" placeholder="确认新密码">
        </div>
        <div class="auth-error" id="resetError"></div>
        <div class="auth-success" id="resetSuccess">密码重置成功！</div>
        <button class="app-btn app-btn-primary" id="resetBtn" onclick="pageResetPassword()">重置密码</button>
        <div class="auth-switch">
            <a href="/user/login/">返回登录</a>
        </div>
    </div>
</div>

<script>
function getToken() {
    var m = window.location.search.match(/[?&]token=([^&]+)/);
    return m ? decodeURIComponent(m[1]) : '';
}

function pageResetPassword() {
    var token = getToken();
    var password = document.getElementById('resetPassword').value.trim();
    var confirm = document.getElementById('resetConfirm').value.trim();
    if (!token) { showResetError('链接已失效，请重新申请'); return; }
    if (!password || !confirm) { showResetError('请填写所有字段'); return; }
    if (password !== confirm) { showResetError('两次密码不一致'); return; }
    if (password.length < 6) { showResetError('密码至少 6 位'); return; }
    var btn = document.getElementById('resetBtn');
    btn.disabled = true; btn.textContent = '重置中...';
    var apiBase = (function(){var p=window.location.port;return(p==='1313'||p==='1317')?'http://localhost:8787/api':'/api';})();
    fetch(apiBase + '/auth/reset-password', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: token, password: password })
    })
    .then(function(r) { return r.json().then(function(d) { if (!r.ok) throw new Error(d.error || '重置失败'); return d; }); })
    .then(function() {
        document.getElementById('resetSuccess').style.display = 'block';
        document.getElementById('resetError').style.display = 'none';
        btn.style.display = 'none';
        setTimeout(function() { window.location.href = '/user/login/'; }, 2000);
    })
    .catch(function(err) {
        showResetError(err.message);
        btn.disabled = false; btn.textContent = '重置密码';
    });
}
function showResetError(msg) {
    var el = document.getElementById('resetError');
    el.textContent = msg; el.style.display = 'block';
    setTimeout(function() { el.style.display = 'none'; }, 3000);
}
</script>
