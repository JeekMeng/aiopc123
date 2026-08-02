---
title: "政策管理"
layout: app-page
description: "管理创业扶持政策"
---

<div id="adminPage" data-section="policies">
    <div class="app-card">
        <div class="app-card-header">
            <h2 class="app-card-title">政策管理</h2>
        </div>
        <div class="admin-toolbar">
            <input type="text" class="app-input" id="policySearchInput" placeholder="搜索名称/城市/发布机构..." style="max-width:300px;">
            <button class="app-btn app-btn-secondary app-btn-sm" id="policySearchBtn"><i class="fas fa-search"></i> 搜索</button>
            <button class="app-btn app-btn-secondary app-btn-sm" id="policyImportBtn"><i class="fas fa-upload"></i> 导入</button>
            <button class="app-btn app-btn-secondary app-btn-sm" id="policyExportBtn"><i class="fas fa-download"></i> 导出</button>
            <input type="file" id="policyFileInput" accept=".json" style="display:none">
        </div>
        <div class="app-table-wrap">
            <table class="app-table">
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>名称</th>
                        <th>城市</th>
                        <th>发布机构</th>
                        <th>日期</th>
                        <th>状态</th>
                        <th>操作</th>
                    </tr>
                </thead>
                <tbody id="adminPoliciesBody"></tbody>
            </table>
        </div>
    </div>
</div>

<div class="modal fade" id="policyModal" tabindex="-1" role="dialog">
    <div class="modal-dialog modal-lg" role="document">
        <div class="modal-content" style="border-radius:12px;">
            <div class="modal-header" style="border-bottom:1px solid var(--border-light);">
                <h5 class="modal-title" style="font-family:var(--font-display);font-weight:600;">编辑政策</h5>
                <button type="button" class="close" data-dismiss="modal"><span>&times;</span></button>
            </div>
            <div class="modal-body">
                <form id="policyForm">
                    <input type="hidden" id="pf_id">
                    <div class="form-row">
                        <div class="form-group col-md-6">
                            <label class="app-form-label">名称</label>
                            <input type="text" class="app-input" id="pf_name" required>
                        </div>
                        <div class="form-group col-md-3">
                            <label class="app-form-label">城市</label>
                            <input type="text" class="app-input" id="pf_city" required>
                        </div>
                        <div class="form-group col-md-3">
                            <label class="app-form-label">省份</label>
                            <input type="text" class="app-input" id="pf_province">
                        </div>
                    </div>
                    <div class="form-row">
                        <div class="form-group col-md-4">
                            <label class="app-form-label">发布机构</label>
                            <input type="text" class="app-input" id="pf_issuer">
                        </div>
                        <div class="form-group col-md-3">
                            <label class="app-form-label">发布日期</label>
                            <input type="date" class="app-input" id="pf_publish_date">
                        </div>
                        <div class="form-group col-md-3">
                            <label class="app-form-label">级别</label>
                            <select class="app-select" id="pf_level">
                                <option value="province">省级</option>
                                <option value="city" selected>市级</option>
                                <option value="district">区级</option>
                            </select>
                        </div>
                        <div class="form-group col-md-2">
                            <label class="app-form-label">状态</label>
                            <select class="app-select" id="pf_status">
                                <option value="active">进行中</option>
                                <option value="upcoming">即将实施</option>
                                <option value="ended">已结束</option>
                            </select>
                        </div>
                    </div>
                    <div class="form-group">
                        <label class="app-form-label">摘要</label>
                        <textarea class="app-input" id="pf_summary" rows="2" style="padding:10px 14px;height:auto;"></textarea>
                    </div>
                    <div class="form-group">
                        <label class="app-form-label">权益明细 <small style="color:var(--text-tertiary);font-weight:400;">(item · amount · type)</small></label>
                        <div id="benefits-container">
                            <div class="benefit-row d-flex gap-2 mb-1">
                                <input type="text" class="app-input app-input-sm" placeholder="项目名" style="width:30%;display:inline-block;">
                                <input type="text" class="app-input app-input-sm" placeholder="金额/说明" style="width:40%;display:inline-block;">
                                <select class="app-select" style="width:20%;display:inline-block;height:32px;font-size:13px;">
                                    <option value="voucher">券</option>
                                    <option value="cash">现金</option>
                                    <option value="loan">贷款</option>
                                    <option value="other">其他</option>
                                </select>
                                <button type="button" class="app-btn app-btn-danger app-btn-sm benefit-remove">×</button>
                            </div>
                        </div>
                        <button type="button" class="app-btn app-btn-secondary app-btn-sm mt-1" id="benefitAddBtn"><i class="fas fa-plus"></i> 添加权益</button>
                    </div>
                    <div class="form-row">
                        <div class="form-group col-md-6">
                            <label class="app-form-label">官方链接</label>
                            <input type="url" class="app-input" id="pf_official_url" placeholder="https://...">
                        </div>
                        <div class="form-group col-md-6">
                            <label class="app-form-label">新闻报道链接</label>
                            <input type="url" class="app-input" id="pf_news_url" placeholder="https://...">
                        </div>
                    </div>
                </form>
            </div>
            <div class="modal-footer" style="border-top:1px solid var(--border-light);">
                <button type="button" class="app-btn app-btn-secondary" data-dismiss="modal">取消</button>
                <button type="button" class="app-btn app-btn-primary" id="policySaveBtn">保存</button>
            </div>
        </div>
    </div>
</div>
