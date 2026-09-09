---
title: "我的一人公司"
layout: app-page
description: "管理我的一人公司"
---

<div id="userPage" data-section="my-opc">
    <div class="app-card">
        <div class="app-card-header">
            <h2 class="app-card-title">我的一人公司</h2>
            <span id="opcCount" style="font-size:13px;color:var(--text-secondary);">0 / 1</span>
        </div>
        <div class="admin-toolbar">
            <button class="app-btn app-btn-primary app-btn-sm" id="addOpcBtn">
                <i class="fas fa-plus"></i> 创建一人公司
            </button>
        </div>
        <div id="myOpcList"></div>
    </div>
</div>

<div class="modal fade" id="opcModal" tabindex="-1" role="dialog">
    <div class="modal-dialog modal-lg" role="document">
        <div class="modal-content" style="background:var(--bg-card);border-radius:var(--radius-lg);border:1px solid var(--border-light);">
            <div class="modal-header" style="border-bottom:1px solid var(--border-light);">
                <h5 class="modal-title" id="opcModalTitle">创建一人公司</h5>
                <button type="button" class="close" data-dismiss="modal"><span>&times;</span></button>
            </div>
            <div class="modal-body">
                <input type="hidden" id="opcEditId">
                <div class="app-form-group">
                    <label class="app-form-label">公司名称 *</label>
                    <input type="text" class="app-input" id="opcName" placeholder="例：杭州XX科技有限公司">
                </div>
                <div class="app-form-group">
                    <label class="app-form-label">公司介绍</label>
                    <textarea class="app-input" id="opcDescription" rows="3" placeholder="简要描述一人公司的业务方向"></textarea>
                </div>
                <div class="app-form-group">
                    <label class="app-form-label">公司LOGO</label>
                    <input type="text" class="app-input" id="opcLogo" placeholder="LOGO图片URL">
                </div>
                <div class="app-form-group">
                    <label class="app-form-label">公司地址</label>
                    <input type="text" class="app-input" id="opcAddress" placeholder="例：杭州市西湖区">
                </div>
                <div class="app-form-group">
                    <label class="app-form-label">公司官网</label>
                    <input type="url" class="app-input" id="opcWebsite" placeholder="https://example.com">
                </div>
            </div>
            <div class="modal-footer" style="border-top:1px solid var(--border-light);">
                <button type="button" class="app-btn app-btn-secondary" data-dismiss="modal">取消</button>
                <button type="button" class="app-btn app-btn-primary" id="saveOpcBtn">保存</button>
            </div>
        </div>
    </div>
</div>

<script>
(function(){
    var API = (location.port==='1313'||location.port==='1317') ? 'http://localhost:8787/api' : '/api';
    var VIP = {'':1,'vip':3,'svip':10,'admin':999};

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

    function loadMyOpcs(){
        var list=document.getElementById('myOpcList');
        if(!list)return;
        list.innerHTML='<div class="text-muted text-center py-3">加载中...</div>';
        api('/opc').then(function(data){
            var opcs=data.opcs||[];
            var u=null;try{u=JSON.parse(localStorage.getItem('auth_user'));}catch(e){}
            var vl=(u&&u.vip_level)||'';
            var lim=VIP[vl]||1;
            var ce=document.getElementById('opcCount');
            if(ce)ce.textContent=opcs.length+' / '+lim;
            if(!opcs.length){list.innerHTML='<div class="text-muted text-center py-3">暂未创建一人公司</div>';return;}
            var h='';
            opcs.forEach(function(o){
                var logo=o.logo||'';
                if(logo&&!/^https?:\/\//i.test(logo))logo='/assets/images/logos/'+logo.replace(/^\//,'');
                var meta=[];
                if(o.industry)meta.push('<span style="display:inline-block;padding:1px 6px;border-radius:4px;background:rgba(0,122,255,.1);color:var(--accent-blue);font-size:11px;">'+esc(o.industry)+'</span>');
                h+='<div class="bookmark-item d-flex justify-content-between align-items-center p-3 mb-2" style="background:var(--bg-card);border-radius:8px;border:1px solid var(--border-light)">'
                  +'  <div class="d-flex align-items-center" style="min-width:0">'
                  +(logo?'    <img src="'+logo+'" alt="" class="mr-3" style="width:40px;height:40px;border-radius:8px;object-fit:contain;flex-shrink:0">':'    <div class="mr-3" style="width:40px;height:40px;border-radius:8px;background:var(--bg-hover);display:flex;align-items:center;justify-content:center;flex-shrink:0"><i class="fas fa-building" style="color:var(--text-tertiary)"></i></div>')
                  +'    <div style="min-width:0">'
                  +'      <div class="font-weight-bold text-truncate" style="color:var(--text-primary)">'+esc(o.name)+'</div>'
                  +(o.description?'      <div class="text-truncate" style="font-size:13px;color:var(--text-secondary);max-width:400px">'+esc(o.description)+'</div>':'')
                  +'      <div style="font-size:12px;color:var(--text-tertiary)">'
                  +(o.address?'<span><i class="fas fa-map-marker-alt mr-1"></i>'+esc(o.address)+'</span> ':'')
                  +(o.website?'<a href="'+o.website+'" target="_blank" style="color:var(--accent-blue);text-decoration:none"><i class="fas fa-link mr-1"></i>官网</a>':'')
                  +'      </div>'
                  +(meta.length?'<div style="margin-top:4px;">'+meta.join(' ')+'</div>':'')
                  +'    </div></div>'
                   +'  <div class="d-flex flex-shrink-0 ml-2 align-items-center">'
                   +(o.is_default?'    <span style="font-size:12px;color:var(--accent-blue);margin-right:8px;"><i class="fas fa-star"></i> 默认</span>':'    <button class="app-btn app-btn-sm app-btn-ghost" data-setdefault="'+o.id+'" style="font-size:12px;color:var(--text-tertiary);margin-right:4px;"><i class="far fa-star"></i> 设为默认</button>')
                   +'    <a href="/workspace/?opc_id='+o.id+'" class="app-btn app-btn-sm app-btn-primary mr-2"><i class="fas fa-sign-in-alt"></i> 工作台</a>'
                   +'    <button class="app-btn app-btn-sm app-btn-secondary mr-2" data-edit="'+o.id+'"><i class="fas fa-edit"></i> 编辑</button>'
                   +'    <button class="app-btn app-btn-sm app-btn-danger" data-del="'+o.id+'"><i class="fas fa-trash-alt"></i></button>'
                   +'</div></div>';
            });
            list.innerHTML=h;
            list.querySelectorAll('[data-edit]').forEach(function(btn){
                btn.addEventListener('click',function(){editOpc(parseInt(this.dataset.edit));});
            });
            list.querySelectorAll('[data-del]').forEach(function(btn){
                btn.addEventListener('click',function(){deleteOpc(parseInt(this.dataset.del));});
            });
            list.querySelectorAll('[data-setdefault]').forEach(function(btn){
                btn.addEventListener('click',function(){setDefaultOpc(parseInt(this.dataset.setdefault));});
            });
        }).catch(function(e){list.innerHTML='<div class="text-danger text-center py-3">加载失败: '+esc(e.message)+'</div>';});
    }

    function showModal(opc){
        document.getElementById('opcEditId').value=opc?opc.id:'';
        document.getElementById('opcName').value=opc?opc.name:'';
        document.getElementById('opcDescription').value=opc?(opc.description||''):'';
        document.getElementById('opcLogo').value=opc?(opc.logo||''):'';
        document.getElementById('opcAddress').value=opc?(opc.address||''):'';
        document.getElementById('opcWebsite').value=opc?(opc.website||''):'';
        document.getElementById('opcModalTitle').textContent=opc?'编辑一人公司':'创建一人公司';
        jQuery('#opcModal').modal('show');
    }
    function editOpc(id){api('/opc/'+id).then(function(d){showModal(d.opc);}).catch(function(e){alert(e.message);});}
    function saveOpc(){
        var id=document.getElementById('opcEditId').value;
        var name=document.getElementById('opcName').value.trim();
        if(!name){alert('公司名称不能为空');return;}
        var body={name:name,description:document.getElementById('opcDescription').value.trim(),
            logo:document.getElementById('opcLogo').value.trim(),
            address:document.getElementById('opcAddress').value.trim(),
            website:document.getElementById('opcWebsite').value.trim()};
        var p=id?api('/opc/'+id,{method:'PUT',body:body}):api('/opc',{method:'POST',body:body});
        p.then(function(){jQuery('#opcModal').modal('hide');loadMyOpcs();}).catch(function(e){alert(e.message);});
    }
    function deleteOpc(id){if(!confirm('确定删除此一人公司？'))return;api('/opc/'+id,{method:'DELETE'}).then(function(){loadMyOpcs();}).catch(function(e){alert(e.message);});}
    function setDefaultOpc(id){api('/opc/'+id+'/default',{method:'PATCH'}).then(function(){loadMyOpcs();}).catch(function(e){alert(e.message);});}

    document.addEventListener('DOMContentLoaded',function(){
        document.getElementById('addOpcBtn').addEventListener('click',function(){showModal();});
        document.getElementById('saveOpcBtn').addEventListener('click',function(){saveOpc();});
        loadMyOpcs();
    });
})();
</script>
