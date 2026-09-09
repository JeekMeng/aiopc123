---
title: "OPC部门"
layout: app-page
description: "部门架构与职能管理"
---
<div id="opcSelectorBar" class="app-card" style="margin-bottom:16px;">
  <div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap;">
    <span style="font-size:13px;color:var(--text-secondary);white-space:nowrap;"><i class="fas fa-building" style="margin-right:4px;"></i>当前公司：</span>
    <select class="app-input" id="opcSelector" onchange="switchOpc(this.value)" style="flex:1;min-width:180px;max-width:300px;padding:6px 12px;font-size:13px;"><option value="">加载中...</option></select>
    <a href="/user/opc/" class="app-btn app-btn-sm app-btn-secondary" id="createOpcBtn" style="display:none;text-decoration:none;"><i class="fas fa-plus"></i> 创建公司</a>
  </div>
</div>
<div id="opcDeptsPage">
  <div class="app-card">
    <div class="app-card-header">
      <h2 class="app-card-title"><i class="fas fa-sitemap" style="color:#FF9500;margin-right:8px;"></i>部门管理</h2>
      <button class="app-btn app-btn-sm app-btn-primary" onclick="showDeptForm()"><i class="fas fa-plus"></i> 创建部门</button>
    </div>
    <div id="deptList" style="display:grid;gap:12px;"></div>
  </div>
  <div id="deptModal" style="display:none;position:fixed;inset:0;background:rgba(0,0,0,.5);z-index:1000;align-items:center;justify-content:center;">
    <div style="background:var(--bg-card);border-radius:12px;padding:24px;width:90%;max-width:480px;box-shadow:0 8px 32px rgba(0,0,0,.2);">
      <h3 style="margin:0 0 16px;font-size:18px;font-weight:600;" id="deptModalTitle">创建部门</h3>
      <input type="hidden" id="deptEditId">
      <div class="app-form-group"><label class="app-form-label">部门名称 *</label><input type="text" class="app-input" id="deptName" placeholder="例如：产品部"></div>
      <div class="app-form-group"><label class="app-form-label">部门职能</label><textarea class="app-input" id="deptDesc" rows="3" placeholder="描述部门的主要职能" style="resize:vertical;"></textarea></div>
      <div class="app-form-group"><label class="app-form-label">负责人</label><input type="text" class="app-input" id="deptLeader" placeholder="部门负责人姓名"></div>
      <div style="display:flex;gap:8px;margin-top:16px;">
        <button class="app-btn app-btn-primary app-btn-sm" onclick="saveDept()"><i class="fas fa-save"></i> 保存</button>
        <button class="app-btn app-btn-secondary app-btn-sm" onclick="closeDeptForm()"><i class="fas fa-times"></i> 取消</button>
      </div>
    </div>
  </div>
</div>
<script>
var _opcId=new URLSearchParams(window.location.search).get('opc_id');
function escH(s){var d=document.createElement('div');d.appendChild(document.createTextNode(s||''));return d.innerHTML;}
function uid(){try{return JSON.parse(localStorage.getItem('auth_user')||'{}').id||'';}catch(e){return'';}}
var _apiBase=(window.location.port==='1313'||window.location.port==='1317')?'http://localhost:8787/api':'/api';
function api(method,url,body){
  var fullUrl=url.startsWith('http')?url:_apiBase+url;
  var opts={method:method,credentials:'include',headers:{'Content-Type':'application/json','X-Auth-User-Id':String(uid())}};
  if(body)opts.body=JSON.stringify(body);
  return fetch(fullUrl,opts).then(function(r){return r.json().then(function(d){if(!r.ok)throw new Error(d.error||'请求失败');return d;});});
}
function cacheOpcs(list){try{localStorage.setItem('opc_list',JSON.stringify(list));}catch(e){}}
function getCachedOpcs(){try{return JSON.parse(localStorage.getItem('opc_list')||'[]');}catch(e){return[];}}
function initOpcSelector(currentOpcId){
  api('GET','/opc/').then(function(d){
    var list=d.opcs||[];
    if(list.length)cacheOpcs(list);
    renderSelector(list,currentOpcId);
  }).catch(function(){
    renderSelector(getCachedOpcs(),currentOpcId);
  });
}
function renderSelector(list,currentOpcId){
  var sel=document.getElementById('opcSelector');
  if(!list||!list.length){sel.innerHTML='<option value="">暂无公司</option>';document.getElementById('createOpcBtn').style.display='inline-flex';return;}
  var h='';list.forEach(function(o){h+='<option value="'+o.id+'"'+(o.id==currentOpcId?' selected':'')+'>'+(o.is_default?'⭐ ':'')+escH(o.name)+'</option>';});
  sel.innerHTML=h;
  if(!currentOpcId){
    var def=list.find(function(o){return o.is_default;})||list[0];
    if(def)window.location.href=window.location.pathname+'?opc_id='+def.id;
  }
}
function switchOpc(id){if(id)window.location.href=window.location.pathname+'?opc_id='+id;}
(function(){
  initOpcSelector(_opcId);
  if(!_opcId){document.getElementById('opcDeptsPage').innerHTML='<div class="app-card"><div style="text-align:center;padding:40px;"><p style="color:var(--text-tertiary);">请先选择一个公司</p></div></div>';return;}
  loadDepts();
})();
function loadDepts(){
  var el=document.getElementById('deptList');
  el.innerHTML='<div style="text-align:center;padding:30px;color:var(--text-tertiary);"><i class="fas fa-spinner fa-spin"></i> 加载中...</div>';
  api('GET','/opc/'+_opcId+'/departments').then(function(d){
    var list=d.items||[];
    if(!list.length){el.innerHTML='<div style="text-align:center;padding:40px;color:var(--text-tertiary);"><i class="fas fa-sitemap" style="font-size:36px;display:block;margin-bottom:12px;"></i><p>暂无部门，点击上方按钮创建</p></div>';return;}
    var colors=['#FF9500','#FF6B00','#AF52DE','#5856D6','#007AFF','#34C759'];var html='';
    list.forEach(function(d,i){
      var c=colors[i%colors.length];
      html+='<div class="app-card-sm" style="display:flex;align-items:center;gap:12px;">';
      html+='<div style="width:40px;height:40px;border-radius:10px;background:'+c+';color:#fff;display:flex;align-items:center;justify-content:center;font-size:16px;flex-shrink:0;"><i class="fas fa-sitemap"></i></div>';
      html+='<div style="flex:1;min-width:0;"><div style="font-weight:600;font-size:14px;">'+escH(d.name)+'</div>';
      if(d.description)html+='<div style="font-size:12px;color:var(--text-tertiary);margin-top:2px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">'+escH(d.description)+'</div>';
      if(d.leader)html+='<div style="font-size:11px;color:var(--text-secondary);margin-top:2px;"><i class="fas fa-user" style="margin-right:4px;"></i>'+escH(d.leader)+'</div>';
      html+='</div>';
      html+='<button class="app-btn app-btn-ghost app-btn-sm" onclick="editDept(\''+d.id+'\')" style="flex-shrink:0;"><i class="fas fa-edit"></i></button>';
      html+='<button class="app-btn app-btn-ghost app-btn-sm" onclick="deleteDept(\''+d.id+'\')" style="color:var(--accent-red);flex-shrink:0;"><i class="fas fa-trash"></i></button>';
      html+='</div>';
    });el.innerHTML=html;
  }).catch(function(e){el.innerHTML='<div style="text-align:center;padding:30px;color:var(--accent-red);"><p>'+escH(e.message)+'</p></div>';});
}
function showDeptForm(id){
  document.getElementById('deptModal').style.display='flex';
  if(id){
    document.getElementById('deptModalTitle').textContent='编辑部门';
    document.getElementById('deptEditId').value=id;
    document.getElementById('deptName').value='';
    document.getElementById('deptDesc').value='';
    document.getElementById('deptLeader').value='';
    api('GET','/opc/'+_opcId+'/departments').then(function(d){
      var dept=(d.items||[]).find(function(x){return x.id===id;});
      if(dept){document.getElementById('deptName').value=dept.name||'';document.getElementById('deptDesc').value=dept.description||'';document.getElementById('deptLeader').value=dept.leader||'';}
    });
  }else{
    document.getElementById('deptModalTitle').textContent='创建部门';
    document.getElementById('deptEditId').value='';
    document.getElementById('deptName').value='';
    document.getElementById('deptDesc').value='';
    document.getElementById('deptLeader').value='';
  }
}
function closeDeptForm(){document.getElementById('deptModal').style.display='none';}
function saveDept(){
  var name=document.getElementById('deptName').value.trim();if(!name){alert('请输入部门名称');return;}
  var desc=document.getElementById('deptDesc').value.trim(),leader=document.getElementById('deptLeader').value.trim(),editId=document.getElementById('deptEditId').value;
  var body={name:name,description:desc,leader:leader};
  var p=editId?api('PUT','/opc/'+_opcId+'/departments/'+editId,body):api('POST','/opc/'+_opcId+'/departments',body);
  p.then(function(){closeDeptForm();loadDepts();}).catch(function(e){alert(e.message);});
}
function editDept(id){showDeptForm(id);}
function deleteDept(id){if(!confirm('确定删除此部门？'))return;api('DELETE','/opc/'+_opcId+'/departments/'+id).then(function(){loadDepts();}).catch(function(e){alert(e.message);});}
</script>
