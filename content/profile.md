---
title: "个人中心 | AI一人公司导航网"
date: 2026-06-21
draft: false
layout: profile
---

<div id="profile-page" class="profile-page">
  <div class="profile-header" style="background:linear-gradient(135deg,#667eea,#764ba2)">
    <div>
      <h3 class="mb-1" id="profile-nickname"></h3>
      <p class="mb-0 small opacity-75" id="profile-email"></p>
    </div>
  </div>
  <div class="profile-section">
    <h5><i class="fas fa-bookmark mr-2"></i>我的收藏</h5>
    <div class="bookmark-list"></div>
  </div>
  <div class="profile-section">
    <h5><i class="far fa-comment-dots mr-2"></i>我的评论</h5>
    <div class="my-comments-list"></div>
  </div>
  <div class="profile-section">
    <h5><i class="fas fa-key mr-2"></i>修改密码</h5>
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
