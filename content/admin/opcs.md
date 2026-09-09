---
title: "OPC管理"
layout: app-page
description: "管理所有用户的一人公司"
---

<div id="adminPage" data-section="opcs">
    <div class="app-card">
        <div class="app-card-header">
            <h2 class="app-card-title">OPC 管理</h2>
            <span id="adminOpcCount" style="font-size:13px;color:var(--text-secondary);">0 条</span>
        </div>
        <div class="admin-toolbar">
            <input type="text" class="app-input" id="adminOpcSearch" placeholder="搜索公司名称或用户...">
            <button class="app-btn app-btn-secondary app-btn-sm" id="adminOpcSearchBtn"><i class="fas fa-search"></i> 搜索</button>
            <button class="app-btn app-btn-primary app-btn-sm" id="syncSitesBtn" style="margin-left:auto;"><i class="fas fa-sync-alt"></i> 同步导航数据</button>
        </div>
        <div id="adminOpcList"></div>
    </div>
</div>

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

    function loadOpcs(search){
        var list=document.getElementById('adminOpcList');
        if(!list)return;
        list.innerHTML='<div class="text-muted text-center py-3">加载中...</div>';
        api('/admin/opcs').then(function(data){
            var opcs=data.opcs||[];
            var ce=document.getElementById('adminOpcCount');
            if(ce)ce.textContent=opcs.length+' 条';
            if(search){
                var q=search.toLowerCase();
                opcs=opcs.filter(function(o){
                    return (o.name&&o.name.toLowerCase().indexOf(q)!==-1)||(o.description&&o.description.toLowerCase().indexOf(q)!==-1)||(o.nickname&&o.nickname.toLowerCase().indexOf(q)!==-1)||(o.email&&o.email.toLowerCase().indexOf(q)!==-1);
                });
            }
            if(!opcs.length){list.innerHTML='<div class="text-muted text-center py-3">'+esc(search?'未找到匹配的记录':'暂无一人公司')+'</div>';return;}
            var h='';
            opcs.forEach(function(o){
                var un=o.nickname||o.email||'未知用户';
                h+='<div class="bookmark-item d-flex justify-content-between align-items-center p-3 mb-2" style="background:var(--bg-card);border-radius:8px;border:1px solid var(--border-light)">'
                  +'  <div style="min-width:0">'
                  +'    <div class="font-weight-bold" style="color:var(--text-primary)">'+esc(o.name)+'</div>'
                  +'    <div style="font-size:13px;color:var(--text-secondary)">'
                  +'      <span style="color:var(--accent-blue)">'+esc(un)+'</span>'
                  +(o.address?' · <i class="fas fa-map-marker-alt mr-1"></i>'+esc(o.address):'')
                  +(o.website?' · <a href="'+o.website+'" target="_blank" style="color:var(--accent-blue)"><i class="fas fa-link mr-1"></i>官网</a>':'')
                  +'    </div></div>'
                  +'  <button class="app-btn app-btn-sm app-btn-danger flex-shrink-0 ml-2" data-del="'+o.id+'"><i class="fas fa-trash-alt"></i> 删除</button>'
                  +'</div>';
            });
            list.innerHTML=h;
            list.querySelectorAll('[data-del]').forEach(function(btn){
                btn.addEventListener('click',function(){
                    if(!confirm('确定删除此一人公司？'))return;
                    api('/admin/opcs/'+this.dataset.del,{method:'DELETE'}).then(function(){
                        loadOpcs(document.getElementById('adminOpcSearch').value);
                    }).catch(function(e){alert(e.message);});
                });
            });
        }).catch(function(e){list.innerHTML='<div class="text-danger text-center py-3">加载失败: '+esc(e.message)+'</div>';});
    }

    document.addEventListener('DOMContentLoaded',function(){
        var si=document.getElementById('adminOpcSearch');
        if(si) si.addEventListener('keyup',function(e){if(e.key==='Enter')loadOpcs(this.value);});
        document.getElementById('adminOpcSearchBtn').addEventListener('click',function(){loadOpcs(si?si.value:'');});
        document.getElementById('syncSitesBtn').addEventListener('click',function(){
            var btn=this;
            if(btn.disabled)return;
            btn.disabled=true; btn.innerHTML='<i class="fas fa-spinner fa-spin"></i> 同步中...';
            fetch('/sites.json').then(function(r){return r.json();})
            .then(function(data){
                return api('/admin/sync-sites',{method:'POST',body:data,headers:{'Content-Type':'application/json'}});
            }).then(function(d){
                alert('同步成功！共 '+d.count+' 条');
            }).catch(function(e){alert('同步失败: '+e.message);})
            .finally(function(){btn.disabled=false;btn.innerHTML='<i class="fas fa-sync-alt"></i> 同步导航数据';});
        });
        loadOpcs();
    });
})();
</script>
