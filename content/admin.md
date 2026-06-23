---
title: "管理后台 | AI一人公司导航网"
date: 2026-06-21
draft: false
layout: admin
---

<div id="admin-page" class="admin-page">
  <div class="admin-header" style="background:linear-gradient(135deg,#1a1a2e,#16213e);color:#fff;padding:2rem;border-radius:12px;margin-bottom:2rem">
    <h3 class="mb-1"><i class="fas fa-shield-alt mr-2"></i>管理后台</h3>
    <p class="mb-0 small opacity-75">用户管理 / 评论管理</p>
  </div>

  <ul class="nav nav-tabs mb-4" id="adminTabs">
    <li class="nav-item"><a class="nav-link active" data-tab="users" href="#">用户管理</a></li>
    <li class="nav-item"><a class="nav-link" data-tab="comments" href="#">评论管理</a></li>
    <li class="nav-item"><a class="nav-link" data-tab="submissions" href="#">入驻审核</a></li>
    <li class="nav-item"><a class="nav-link" data-tab="password" href="#"><i class="fas fa-key mr-1"></i>修改密码</a></li>
  </ul>

  <div id="admin-users-panel">
    <h5 class="mb-3"><i class="fas fa-users mr-2"></i>用户列表</h5>
    <div class="admin-users-table table-responsive"></div>
  </div>

  <div id="admin-comments-panel" style="display:none">
    <h5 class="mb-3"><i class="far fa-comment-dots mr-2"></i>全部评论</h5>
    <div class="admin-comments-list"></div>
  </div>

  <div id="admin-submissions-panel" style="display:none">
    <h5 class="mb-3"><i class="fas fa-rocket mr-2"></i>入驻审核</h5>
    <div class="admin-submissions-list"></div>
  </div>

  <div id="admin-password-panel" style="display:none">
    <h5 class="mb-3"><i class="fas fa-key mr-2"></i>修改密码</h5>
    <form id="changePwdForm" class="change-pwd-form">
      <input type="password" class="form-control change-pwd-input" id="curPwd" placeholder="当前密码" required>
      <input type="password" class="form-control change-pwd-input" id="newPwd" placeholder="新密码（至少6位）" required>
      <input type="password" class="form-control change-pwd-input" id="confirmPwd" placeholder="确认新密码" required>
      <button type="submit" class="btn btn-primary change-pwd-btn">修改密码</button>
      <div class="change-pwd-error text-danger small mt-2" style="display:none"></div>
      <div class="change-pwd-success text-success small mt-2" style="display:none"></div>
    </form>
  </div>
</div>
