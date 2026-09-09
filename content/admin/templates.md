---
title: "模板管理"
layout: app-page
description: "管理OPC公司创建模板"
---

<div id="adminPage" data-section="templates">
    <div class="app-card">
        <div class="app-card-header">
            <h2 class="app-card-title">模板管理</h2>
            <span id="tplCount" style="font-size:13px;color:var(--text-secondary);">0 条</span>
        </div>
        <div class="admin-toolbar">
            <input type="text" class="app-input" id="tplSearch" placeholder="搜索模板名称...">
            <button class="app-btn app-btn-secondary app-btn-sm" id="tplSearchBtn"><i class="fas fa-search"></i></button>
            <button class="app-btn app-btn-primary app-btn-sm" id="tplAddBtn"><i class="fas fa-plus"></i> 创建模板</button>
        </div>
        <div id="tplList"></div>
    </div>
</div>

<!-- 模板编辑弹窗 -->
<div class="modal fade" id="tplModal" tabindex="-1" role="dialog">
    <div class="modal-dialog modal-lg" role="document">
        <div class="modal-content" style="background:var(--bg-card);border-radius:var(--radius-lg);border:1px solid var(--border-light);">
            <div class="modal-header" style="border-bottom:1px solid var(--border-light);">
                <h5 class="modal-title" id="tplModalTitle">创建模板</h5>
                <button type="button" class="close" data-dismiss="modal"><span>&times;</span></button>
            </div>
            <div class="modal-body" style="max-height:70vh;overflow-y:auto;">
                <input type="hidden" id="tplEditId">
                <div class="app-form-group">
                    <label class="app-form-label">模板名称 *</label>
                    <input type="text" class="app-input" id="tplName" placeholder="例：科技自媒体模板">
                </div>
                <div class="app-form-group">
                    <label class="app-form-label">行业类型 *</label>
                    <select class="app-input" id="tplIndustry">
                        <option value="">请选择行业</option>
                        <option value="自媒体">自媒体</option>
                        <option value="独立站(境内)">独立站(境内)</option>
                        <option value="独立站(境外)">独立站(境外)</option>
                        <option value="AI产品">AI产品</option>
                    </select>
                </div>
                <div class="app-form-group">
                    <label class="app-form-label">模板描述</label>
                    <textarea class="app-input" id="tplDesc" rows="2" placeholder="简要描述该模板的适用场景"></textarea>
                </div>
                <div class="app-form-group">
                    <label class="app-form-label">模板截图</label>
                    <div style="display:flex;gap:10px;align-items:center;">
                        <input type="text" class="app-input" id="tplScreenshot" placeholder="图片URL 或点击上传" style="flex:1;">
                        <label class="app-btn app-btn-secondary app-btn-sm" style="cursor:pointer;white-space:nowrap;margin-bottom:0;">
                            <i class="fas fa-upload"></i> 上传
                            <input type="file" accept="image/jpeg,image/png,image/gif,image/webp" style="display:none" onchange="uploadTplScreenshot(this)">
                        </label>
                    </div>
                    <div id="tplScreenshotPreview" style="margin-top:8px;"></div>
                </div>
                <div class="app-form-group">
                    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;">
                        <label class="app-form-label" style="margin-bottom:0;">内置部门</label>
                        <button type="button" class="app-btn app-btn-secondary app-btn-sm" onclick="showAddDeptModal()"><i class="fas fa-plus"></i> 添加部门</button>
                    </div>
                    <div id="tplDeptEditor" style="border:1px solid var(--border-light);border-radius:8px;overflow:hidden;"></div>
                </div>
                <div class="app-form-group">
                    <label class="app-form-label">路线图预填数据（JSON）</label>
                    <textarea class="app-input" id="tplStepData" rows="8" style="font-family:monospace;font-size:12px;" placeholder='{"_industry":"自媒体","_subCategory":"tech-media","_address":"杭州市"}'></textarea>
                    <div style="font-size:11px;color:var(--text-tertiary);margin-top:4px;">key为字段名，值为该步预填内容。留空或{}表示不预填。</div>
                </div>
                <div style="display:flex;gap:12px;">
                    <div class="app-form-group" style="flex:1;">
                        <label class="app-form-label">排序权重</label>
                        <input type="number" class="app-input" id="tplSort" value="0">
                    </div>
                    <div class="app-form-group" style="flex:1;">
                        <label class="app-form-label">状态</label>
                        <select class="app-input" id="tplActive">
                            <option value="1">启用</option>
                            <option value="0">禁用</option>
                        </select>
                    </div>
                </div>
            </div>
            <div class="modal-footer" style="border-top:1px solid var(--border-light);">
                <button type="button" class="app-btn app-btn-secondary" data-dismiss="modal">取消</button>
                <button type="button" class="app-btn app-btn-primary" id="tplSaveBtn">保存</button>
            </div>
        </div>
    </div>
</div>

<!-- 添加部门预设弹窗 -->
<div class="modal fade" id="addDeptModal" tabindex="-1" role="dialog">
    <div class="modal-dialog modal-sm" role="document">
        <div class="modal-content" style="background:var(--bg-card);border-radius:var(--radius-lg);border:1px solid var(--border-light);">
            <div class="modal-header" style="border-bottom:1px solid var(--border-light);">
                <h5 class="modal-title">选择部门</h5>
                <button type="button" class="close" data-dismiss="modal"><span>&times;</span></button>
            </div>
            <div class="modal-body" id="deptPresetList" style="max-height:400px;overflow-y:auto;"></div>
        </div>
    </div>
</div>

<!-- 工具选择弹窗 -->
<div class="modal fade" id="tplToolPickerModal" tabindex="-1" role="dialog">
    <div class="modal-dialog" role="document">
        <div class="modal-content" style="background:var(--bg-card);border-radius:var(--radius-lg);border:1px solid var(--border-light);max-width:500px;">
            <div class="modal-header" style="border-bottom:1px solid var(--border-light);">
                <h5 class="modal-title">添加工具</h5>
                <button type="button" class="close" data-dismiss="modal"><span>&times;</span></button>
            </div>
            <div class="modal-body">
                <input type="text" class="app-input" id="tplToolSearch" placeholder="搜索工具名称、URL..." style="margin-bottom:12px;">
                <div id="tplToolResults" style="max-height:300px;overflow-y:auto;"></div>
            </div>
        </div>
    </div>
</div>

<style>
.tpl-dept-item{border-bottom:1px solid var(--border-light);padding:12px;}
.tpl-dept-item:last-child{border-bottom:none;}
.tpl-dept-header{display:flex;align-items:center;gap:8px;margin-bottom:8px;}
.tpl-dept-icon{width:28px;height:28px;border-radius:6px;display:flex;align-items:center;justify-content:center;color:#fff;font-size:12px;flex-shrink:0;}
.tpl-dept-name{font-weight:600;font-size:14px;color:var(--text-primary);flex:1;}
.tpl-dept-del{cursor:pointer;color:var(--text-tertiary);font-size:14px;padding:2px 6px;border-radius:4px;}
.tpl-dept-del:hover{color:var(--accent-red);background:rgba(255,59,48,.1);}
.tpl-tool-tag{display:inline-flex;align-items:center;gap:4px;padding:3px 8px;border-radius:6px;background:rgba(0,122,255,.08);font-size:12px;color:var(--text-primary);margin:2px;}
.tpl-tool-tag-del{cursor:pointer;color:var(--text-tertiary);font-size:11px;}
.tpl-tool-tag-del:hover{color:var(--accent-red);}
.tpl-add-tool-btn{display:inline-flex;align-items:center;gap:4px;padding:3px 10px;border-radius:6px;border:1px dashed var(--border-light);font-size:12px;color:var(--text-secondary);cursor:pointer;margin:2px;}
.tpl-add-tool-btn:hover{border-color:var(--accent-blue);color:var(--accent-blue);}
.tpl-dept-preset-item{display:flex;align-items:center;gap:10px;padding:10px 12px;border-radius:8px;cursor:pointer;transition:background .15s;}
.tpl-dept-preset-item:hover{background:rgba(0,122,255,.08);}
.tpl-preset-icon{width:32px;height:32px;border-radius:8px;display:flex;align-items:center;justify-content:center;color:#fff;font-size:14px;flex-shrink:0;}
.tpl-preset-info{flex:1;}
.tpl-preset-name{font-weight:600;font-size:14px;color:var(--text-primary);}
.tpl-preset-desc{font-size:12px;color:var(--text-secondary);}
</style>

<script>
(function(){
    var API = (location.port==='1313'||location.port==='1317') ? 'http://localhost:8787/api' : '/api';

    function api(path, opts) {
        opts = opts || {}; opts.credentials='include';
        var u = null;
        try { u = JSON.parse(localStorage.getItem('auth_user')); } catch(e){}
        if (u && u.id) { opts.headers = opts.headers||{}; opts.headers['X-Auth-User-Id']=u.id; }
        if (opts.body && typeof opts.body==='object') {
            opts.body=JSON.stringify(opts.body);
            opts.headers=opts.headers||{}; opts.headers['Content-Type']='application/json';
        }
        return fetch(API+path, opts).then(function(r){
            return r.json().then(function(d){ if(!r.ok) throw new Error(d.error||'请求失败'); return d; });
        });
    }
    function esc(s){var d=document.createElement('div');d.appendChild(document.createTextNode(s));return d.innerHTML;}

    // ── 部门预设 ──
    var DEPT_PRESETS = [
        { name:'CEO', icon:'fa-crown', bg:'linear-gradient(135deg,#FF6B6B,#EE5A24)', tools:[] },
        { name:'技术部', icon:'fa-code', bg:'linear-gradient(135deg,#007AFF,#5856D6)', tools:[] },
        { name:'产品部', icon:'fa-lightbulb', bg:'linear-gradient(135deg,#FF9500,#FF6B00)', tools:[] },
        { name:'运营部', icon:'fa-chart-line', bg:'linear-gradient(135deg,#34C759,#30D158)', tools:[] },
        { name:'市场部', icon:'fa-bullhorn', bg:'linear-gradient(135deg,#5856D6,#AF52DE)', tools:[] },
        { name:'剪辑部', icon:'fa-film', bg:'linear-gradient(135deg,#FD79A8,#E84393)', tools:[] },
        { name:'行政部', icon:'fa-building', bg:'linear-gradient(135deg,#5856D6,#007AFF)', tools:[] },
        { name:'内容部', icon:'fa-pen-fancy', bg:'linear-gradient(135deg,#FF9500,#FF2D55)', tools:[] },
        { name:'客服部', icon:'fa-headset', bg:'linear-gradient(135deg,#34C759,#007AFF)', tools:[] },
        { name:'财务部', icon:'fa-calculator', bg:'linear-gradient(135deg,#AF52DE,#5856D6)', tools:[] }
    ];

    // ── 模板编辑器状态 ──
    var tplDepts = [];
    var _toolPickerDeptIdx = -1;

    function renderTplDepts() {
        var el = document.getElementById('tplDeptEditor');
        if (!tplDepts.length) {
            el.innerHTML = '<div style="padding:20px;text-align:center;color:var(--text-tertiary);font-size:13px;">暂无部门，点击"添加部门"开始配置</div>';
            return;
        }
        var h = '';
        tplDepts.forEach(function(dept, di) {
            h += '<div class="tpl-dept-item">';
            h += '<div class="tpl-dept-header">';
            h += '<div class="tpl-dept-icon" style="background:'+esc(dept.bg)+';"><i class="fas '+esc(dept.icon)+'"></i></div>';
            h += '<div class="tpl-dept-name">'+esc(dept.name)+'</div>';
            h += '<div class="tpl-dept-del" onclick="removeTplDept('+di+')" title="删除部门"><i class="fas fa-trash-alt"></i></div>';
            h += '</div>';
            h += '<div style="display:flex;flex-wrap:wrap;align-items:center;gap:4px;">';
            (dept.tools||[]).forEach(function(t, ti) {
                h += '<span class="tpl-tool-tag">';
                if (t.logo) { h += '<img src="/assets/images/logos/'+esc(t.logo)+'" style="width:14px;height:14px;border-radius:3px;object-fit:cover;">'; }
                else { h += '<i class="fas '+esc(t.icon||'fas fa-link')+'" style="font-size:10px;"></i>'; }
                h += esc(t.name);
                h += '<span class="tpl-tool-tag-del" onclick="removeTplTool('+di+','+ti+')">&times;</span>';
                h += '</span>';
            });
            h += '<span class="tpl-add-tool-btn" onclick="openTplToolPicker('+di+')"><i class="fas fa-plus"></i> 添加</span>';
            h += '</div></div>';
        });
        el.innerHTML = h;
    }

    window.removeTplDept = function(idx) {
        tplDepts.splice(idx, 1);
        renderTplDepts();
    };

    window.removeTplTool = function(di, ti) {
        tplDepts[di].tools.splice(ti, 1);
        renderTplDepts();
    };

    window.showAddDeptModal = function() {
        var el = document.getElementById('deptPresetList');
        var h = '';
        DEPT_PRESETS.forEach(function(p, i) {
            h += '<div class="tpl-dept-preset-item" onclick="addTplDept('+i+')">';
            h += '<div class="tpl-preset-icon" style="background:'+p.bg+';"><i class="fas '+p.icon+'"></i></div>';
            h += '<div class="tpl-preset-info"><div class="tpl-preset-name">'+esc(p.name)+'</div></div>';
            h += '</div>';
        });
        h += '<div class="tpl-dept-preset-item" onclick="addCustomDept()">';
        h += '<div class="tpl-preset-icon" style="background:linear-gradient(135deg,#667eea,#764ba2);"><i class="fas fa-plus"></i></div>';
        h += '<div class="tpl-preset-info"><div class="tpl-preset-name">自定义部门</div><div class="tpl-preset-desc">手动输入名称和样式</div></div>';
        h += '</div>';
        el.innerHTML = h;
        jQuery('#addDeptModal').modal('show');
    };

    window.addTplDept = function(presetIdx) {
        var p = DEPT_PRESETS[presetIdx];
        tplDepts.push({ name:p.name, icon:p.icon, bg:p.bg, tools:[] });
        renderTplDepts();
        jQuery('#addDeptModal').modal('hide');
    };

    window.addCustomDept = function() {
        var name = prompt('请输入部门名称：');
        if (!name || !name.trim()) return;
        tplDepts.push({ name:name.trim(), icon:'fa-folder', bg:'linear-gradient(135deg,#667eea,#764ba2)', tools:[] });
        renderTplDepts();
        jQuery('#addDeptModal').modal('hide');
    };

    window.openTplToolPicker = function(deptIdx) {
        _toolPickerDeptIdx = deptIdx;
        document.getElementById('tplToolSearch').value = '';
        document.getElementById('tplToolResults').innerHTML = '<div style="text-align:center;color:var(--text-tertiary);padding:16px;">输入关键词搜索</div>';
        jQuery('#tplToolPickerModal').modal('show');
        setTimeout(function(){ document.getElementById('tplToolSearch').focus(); }, 300);
    };

    window.searchTplTools = function(q) {
        var el = document.getElementById('tplToolResults');
        if (!q) { el.innerHTML = '<div style="text-align:center;color:var(--text-tertiary);padding:16px;">输入关键词搜索</div>'; return; }
        el.innerHTML = '<div style="text-align:center;color:var(--text-tertiary);padding:16px;">搜索中...</div>';
        fetch(API+'/nav-sites?q='+encodeURIComponent(q)).then(function(r){return r.json();}).then(function(d){
            var items = d.items || [];
            if (!items.length) { el.innerHTML = '<div style="text-align:center;color:var(--text-tertiary);padding:16px;">未找到</div>'; return; }
            var h = '';
            items.forEach(function(s) {
                var logoHtml = s.logo
                    ? '<img src="/assets/images/logos/'+esc(s.logo)+'" style="width:24px;height:24px;border-radius:4px;object-fit:cover;">'
                    : '<div style="width:24px;height:24px;border-radius:4px;background:linear-gradient(135deg,#007AFF,#5856D6);display:flex;align-items:center;justify-content:center;color:#fff;font-size:11px;">'+esc(s.name.charAt(0))+'</div>';
                h += '<div style="display:flex;align-items:center;gap:8px;padding:8px;border-radius:6px;cursor:pointer;transition:background .15s;" onmouseover="this.style.background=\'rgba(0,122,255,.06)\'" onmouseout="this.style.background=\'\'">';
                h += logoHtml;
                h += '<div style="flex:1;min-width:0;">';
                h += '<div style="font-size:13px;font-weight:600;color:var(--text-primary);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">'+esc(s.name)+'</div>';
                h += '<div style="font-size:11px;color:var(--text-secondary);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">'+esc((s.description||'').substring(0,40))+'</div>';
                h += '</div>';
                h += '<button class="app-btn app-btn-sm app-btn-primary" style="padding:4px 12px;font-size:11px;" onclick="addTplTool('+JSON.stringify({name:s.name,url:s.url,logo:s.logo||'',icon:'fas fa-link',bg:'#007AFF'}).replace(/"/g,'&quot;')+')">添加</button>';
                h += '</div>';
            });
            el.innerHTML = h;
        }).catch(function(e){ el.innerHTML='<div style="text-align:center;color:var(--text-tertiary);padding:16px;">搜索失败</div>'; });
    };

    window.addTplTool = function(tool) {
        if (_toolPickerDeptIdx >= 0 && _toolPickerDeptIdx < tplDepts.length) {
            tplDepts[_toolPickerDeptIdx].tools.push(tool);
            renderTplDepts();
        }
        jQuery('#tplToolPickerModal').modal('hide');
    };

    // ── 模板列表 ──
    function loadTemplates(search) {
        var list = document.getElementById('tplList');
        if (!list) return;
        list.innerHTML = '<div class="text-muted text-center py-3">加载中...</div>';
        api('/admin/templates').then(function(data) {
            var tpls = data.templates || [];
            var ce = document.getElementById('tplCount');
            if (ce) ce.textContent = tpls.length + ' 条';
            if (search) {
                var q = search.toLowerCase();
                tpls = tpls.filter(function(t) { return t.name && t.name.toLowerCase().indexOf(q) !== -1; });
            }
            if (!tpls.length) { list.innerHTML = '<div class="text-muted text-center py-3">' + esc(search ? '未找到匹配的记录' : '暂无模板') + '</div>'; return; }
            var h = '';
            tpls.forEach(function(t) {
                var thumb = t.screenshot ? '<img src="' + esc(t.screenshot) + '" style="width:48px;height:36px;border-radius:4px;object-fit:cover;flex-shrink:0;margin-right:10px;">' : '';
                var deptCount = Array.isArray(t.departments) ? t.departments.length : 0;
                h += '<div class="bookmark-item p-3 mb-2" style="background:var(--bg-card);border-radius:8px;border:1px solid var(--border-light);display:flex;align-items:flex-start;gap:12px;">'
                  + '  ' + thumb
                  + '  <div style="flex:1;min-width:0;">'
                  + '    <div style="display:flex;align-items:center;justify-content:space-between;">'
                  + '      <div class="font-weight-bold" style="color:var(--text-primary)">' + esc(t.name) + '</div>'
                  + '      <div style="flex-shrink:0;display:flex;gap:6px;">'
                  + '        <button class="app-btn app-btn-sm app-btn-secondary" onclick="window.open(\'/workspace/?tpl_id=' + t.id + '\',\'_blank\')" title="在工作台预览"><i class="fas fa-eye"></i></button>'
                  + '        <button class="app-btn app-btn-sm app-btn-secondary" data-edit="' + t.id + '"><i class="fas fa-edit"></i></button>'
                  + '        <button class="app-btn app-btn-sm app-btn-danger" data-del="' + t.id + '"><i class="fas fa-trash-alt"></i></button>'
                  + '      </div>'
                  + '    </div>'
                  + '    <div style="font-size:13px;color:var(--text-secondary);margin-top:4px;display:flex;flex-wrap:wrap;align-items:center;gap:6px;">'
                  + '      <span style="display:inline-block;padding:1px 8px;border-radius:4px;background:rgba(0,122,255,.1);color:var(--accent-blue);font-size:12px;">' + esc(t.industry) + '</span>'
                  + '      <span style="font-size:12px;color:var(--text-tertiary);">部门: ' + deptCount + '</span>'
                  + '      <span style="font-size:12px;color:var(--text-tertiary);">排序: ' + t.sort_order + '</span>'
                  + '      <span style="font-size:12px;color:' + (t.is_active ? 'var(--accent-green)' : 'var(--text-tertiary)') + ';">' + (t.is_active ? '● 启用' : '● 禁用') + '</span>'
                  + '    </div>'
                  + (t.description ? '    <div style="font-size:12px;color:var(--text-tertiary);margin-top:2px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">' + esc(t.description) + '</div>' : '')
                  + '  </div></div>';
            });
            list.innerHTML = h;
            list.querySelectorAll('[data-edit]').forEach(function(btn) {
                btn.addEventListener('click', function() { editTemplate(parseInt(this.dataset.edit), tpls); });
            });
            list.querySelectorAll('[data-del]').forEach(function(btn) {
                btn.addEventListener('click', function() {
                    if (!confirm('确定删除此模板？')) return;
                    api('/admin/templates/' + this.dataset.del, { method: 'DELETE' }).then(function() {
                        loadTemplates(document.getElementById('tplSearch').value);
                    }).catch(function(e) { alert(e.message); });
                });
            });
        }).catch(function(e) { list.innerHTML = '<div class="text-danger text-center py-3">加载失败: ' + esc(e.message) + '</div>'; });
    }

    function showModal(tpl) {
        document.getElementById('tplEditId').value = tpl ? tpl.id : '';
        document.getElementById('tplName').value = tpl ? tpl.name : '';
        document.getElementById('tplIndustry').value = tpl ? tpl.industry : '';
        document.getElementById('tplDesc').value = tpl ? (tpl.description || '') : '';
        document.getElementById('tplScreenshot').value = tpl ? (tpl.screenshot || '') : '';
        document.getElementById('tplStepData').value = tpl ? (tpl.step_data || '{}') : '{}';
        document.getElementById('tplSort').value = tpl ? tpl.sort_order : 0;
        document.getElementById('tplActive').value = tpl ? tpl.is_active : 1;
        var preview = document.getElementById('tplScreenshotPreview');
        if (tpl && tpl.screenshot) { preview.innerHTML = '<img src="' + esc(tpl.screenshot) + '" style="max-width:200px;max-height:120px;border-radius:6px;">'; }
        else { preview.innerHTML = ''; }
        // 加载部门数据
        tplDepts = [];
        if (tpl && tpl.departments && Array.isArray(tpl.departments)) {
            tplDepts = tpl.departments.map(function(d) {
                return { name:d.name, icon:d.icon, bg:d.bg, tools:(d.tools||[]).slice() };
            });
        }
        renderTplDepts();
        document.getElementById('tplModalTitle').textContent = tpl ? '编辑模板' : '创建模板';
        jQuery('#tplModal').modal('show');
    }

    function editTemplate(id, tpls) {
        var tpl = null;
        for (var i = 0; i < tpls.length; i++) { if (tpls[i].id === id) { tpl = tpls[i]; break; } }
        if (tpl) showModal(tpl);
    }

    function saveTemplate() {
        var id = document.getElementById('tplEditId').value;
        var name = document.getElementById('tplName').value.trim();
        var industry = document.getElementById('tplIndustry').value;
        if (!name) { alert('模板名称不能为空'); return; }
        if (!industry) { alert('请选择行业类型'); return; }
        var stepData = document.getElementById('tplStepData').value.trim() || '{}';
        try { JSON.parse(stepData); } catch(e) { alert('路线图数据JSON格式错误: ' + e.message); return; }
        var body = {
            name: name, industry: industry,
            description: document.getElementById('tplDesc').value.trim(),
            screenshot: document.getElementById('tplScreenshot').value.trim(),
            step_data: stepData,
            departments: JSON.stringify(tplDepts),
            sort_order: parseInt(document.getElementById('tplSort').value) || 0,
            is_active: parseInt(document.getElementById('tplActive').value)
        };
        var p = id ? api('/admin/templates/' + id, { method: 'PUT', body: body }) : api('/admin/templates', { method: 'POST', body: body });
        p.then(function() { jQuery('#tplModal').modal('hide'); loadTemplates(document.getElementById('tplSearch').value); })
         .catch(function(e) { alert(e.message); });
    }

    window.uploadTplScreenshot = function(input) {
        var file = input.files[0];
        if (!file) return;
        if (file.size > 2 * 1024 * 1024) { alert('文件不能超过2MB'); return; }
        if (!/^image\/(jpeg|png|gif|webp)/.test(file.type)) { alert('仅支持JPG/PNG/GIF/WebP'); return; }
        var userId = '';
        try { userId = JSON.parse(localStorage.getItem('auth_user')).id; } catch(e) {}
        var fd = new FormData();
        fd.append('file', file);
        var xhr = new XMLHttpRequest();
        xhr.open('POST', API + '/upload/logo', true);
        xhr.setRequestHeader('X-Auth-User-Id', String(userId));
        xhr.withCredentials = true;
        xhr.onreadystatechange = function() {
            if (xhr.readyState === 4) {
                if (xhr.status === 200) {
                    var d = JSON.parse(xhr.responseText);
                    if (d.url) {
                        document.getElementById('tplScreenshot').value = d.url;
                        document.getElementById('tplScreenshotPreview').innerHTML = '<img src="' + d.url + '" style="max-width:200px;max-height:120px;border-radius:6px;">';
                    } else { alert(d.error || '上传失败'); }
                } else { alert('上传失败: HTTP ' + xhr.status); }
            }
        };
        xhr.send(fd);
    };

    document.addEventListener('DOMContentLoaded', function() {
        document.getElementById('tplAddBtn').addEventListener('click', function() { showModal(); });
        document.getElementById('tplSaveBtn').addEventListener('click', function() { saveTemplate(); });
        var si = document.getElementById('tplSearch');
        if (si) si.addEventListener('keyup', function(e) { if (e.key === 'Enter') loadTemplates(this.value); });
        document.getElementById('tplSearchBtn').addEventListener('click', function() { loadTemplates(si ? si.value : ''); });
        // 工具搜索防抖
        var toolSearch = document.getElementById('tplToolSearch');
        if (toolSearch) {
            var _timer = null;
            toolSearch.addEventListener('input', function() {
                clearTimeout(_timer);
                var q = this.value;
                _timer = setTimeout(function() { searchTplTools(q); }, 300);
            });
        }
        loadTemplates();
    });
})();
</script>
