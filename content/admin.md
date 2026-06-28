---
title: "管理后台 | AI一人公司导航网"
date: 2026-06-21
draft: false
layout: admin
---

<div id="admin-page" class="admin-page">
  <div class="admin-header" style="background:linear-gradient(135deg,#1a1a2e,#16213e);color:#fff;padding:2rem;border-radius:12px;margin-bottom:2rem">
    <h3 class="mb-1"><i class="fas fa-shield-alt mr-2"></i>管理后台</h3>
    <p class="mb-0 small opacity-75">用户管理 / 评论管理 / 政策管理</p>
  </div>

  <ul class="nav nav-tabs mb-4" id="adminTabs">
    <li class="nav-item"><a class="nav-link active" data-tab="users" href="#">用户管理</a></li>
    <li class="nav-item"><a class="nav-link" data-tab="comments" href="#">评论管理</a></li>
    <li class="nav-item"><a class="nav-link" data-tab="submissions" href="#">入驻审核</a></li>
    <li class="nav-item"><a class="nav-link" data-tab="policies" href="#"><i class="fas fa-gavel mr-1"></i>政策管理</a></li>
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

  <div id="admin-policies-panel" style="display:none">
    <h5 class="mb-3"><i class="fas fa-gavel mr-2"></i>政策管理</h5>
    <div class="mb-3 d-flex gap-2 flex-wrap">
      <input type="text" id="policySearch" class="form-control" style="width:260px;display:inline-block" placeholder="搜索名称/城市/发布机构...">
      <button class="btn btn-outline-primary" id="policySearchBtn"><i class="fas fa-search"></i> 搜索</button>
      <button class="btn btn-outline-success" id="policyImportBtn"><i class="fas fa-upload"></i> 导入 JSON</button>
      <button class="btn btn-outline-info" id="policyExportBtn"><i class="fas fa-download"></i> 导出</button>
      <input type="file" id="policyFileInput" accept=".json" style="display:none">
    </div>
    <div class="admin-policies-table table-responsive"></div>
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

<!-- 政策编辑弹窗 -->
<div class="modal fade" id="policyModal" tabindex="-1" role="dialog">
  <div class="modal-dialog modal-lg" role="document">
    <div class="modal-content">
      <div class="modal-header">
        <h5 class="modal-title">编辑政策</h5>
        <button type="button" class="close" data-dismiss="modal"><span>&times;</span></button>
      </div>
      <div class="modal-body">
        <form id="policyForm">
          <input type="hidden" id="pf_id">
          <div class="form-row">
            <div class="form-group col-md-6">
              <label>名称</label>
              <input type="text" class="form-control" id="pf_name" required>
            </div>
            <div class="form-group col-md-3">
              <label>城市</label>
              <input type="text" class="form-control" id="pf_city" required>
            </div>
            <div class="form-group col-md-3">
              <label>省份</label>
              <input type="text" class="form-control" id="pf_province">
            </div>
          </div>
          <div class="form-row">
            <div class="form-group col-md-4">
              <label>发布机构</label>
              <input type="text" class="form-control" id="pf_issuer">
            </div>
            <div class="form-group col-md-3">
              <label>发布日期</label>
              <input type="date" class="form-control" id="pf_publish_date">
            </div>
            <div class="form-group col-md-3">
              <label>级别</label>
              <select class="form-control" id="pf_level">
                <option value="province">省级</option>
                <option value="city" selected>市级</option>
                <option value="district">区级</option>
              </select>
            </div>
            <div class="form-group col-md-2">
              <label>状态</label>
              <select class="form-control" id="pf_status">
                <option value="active">进行中</option>
                <option value="upcoming">即将实施</option>
                <option value="ended">已结束</option>
              </select>
            </div>
          </div>
          <div class="form-group">
            <label>摘要</label>
            <textarea class="form-control" id="pf_summary" rows="2"></textarea>
          </div>
          <div class="form-group">
            <label>权益明细 <small class="text-muted">(item · amount · type)</small></label>
            <div id="benefits-container">
              <div class="benefit-row d-flex gap-2 mb-1">
                <input type="text" class="form-control form-control-sm" placeholder="项目名" style="width:30%">
                <input type="text" class="form-control form-control-sm" placeholder="金额/说明" style="width:40%">
                <select class="form-control form-control-sm" style="width:20%">
                  <option value="voucher">券</option><option value="cash">现金</option><option value="loan">贷款</option><option value="other">其他</option>
                </select>
                <button type="button" class="btn btn-sm btn-outline-danger benefit-remove">×</button>
              </div>
            </div>
            <button type="button" class="btn btn-sm btn-outline-success mt-1" id="benefitAddBtn"><i class="fas fa-plus"></i> 添加权益</button>
          </div>
          <div class="form-row">
            <div class="form-group col-md-6">
              <label>官方链接</label>
              <input type="url" class="form-control" id="pf_official_url" placeholder="https://...">
            </div>
            <div class="form-group col-md-6">
              <label>新闻报道链接</label>
              <input type="url" class="form-control" id="pf_news_url" placeholder="https://...">
            </div>
          </div>
        </form>
      </div>
      <div class="modal-footer">
        <button type="button" class="btn btn-secondary" data-dismiss="modal">取消</button>
        <button type="button" class="btn btn-primary" id="policySaveBtn">保存</button>
      </div>
    </div>
  </div>
</div>
