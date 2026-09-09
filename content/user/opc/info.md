---
title: "OPC信息"
layout: app-page
description: "查看和编辑OPC公司信息"
---
<div id="opcSelectorBar" class="app-card" style="margin-bottom:16px;">
  <div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap;">
    <span style="font-size:13px;color:var(--text-secondary);white-space:nowrap;"><i class="fas fa-building" style="margin-right:4px;"></i>当前公司：</span>
    <select class="app-input" id="opcSelector" onchange="switchOpc(this.value)" style="flex:1;min-width:180px;max-width:300px;padding:6px 12px;font-size:13px;"><option value="">加载中...</option></select>
    <a href="/user/opc/" class="app-btn app-btn-sm app-btn-secondary" id="createOpcBtn" style="display:none;text-decoration:none;"><i class="fas fa-plus"></i> 创建公司</a>
  </div>
</div>
<div id="opcInfoPage">
  <div class="app-card">
    <div class="app-card-header">
      <h2 class="app-card-title"><i class="fas fa-info-circle" style="color:var(--accent-blue);margin-right:8px;"></i>公司信息</h2>
      <button class="app-btn app-btn-sm app-btn-secondary" id="editInfoBtn" onclick="toggleEditInfo()"><i class="fas fa-edit"></i> 编辑</button>
    </div>
    <div id="infoView">
      <div class="app-form-group"><label class="app-form-label">公司名称</label><div id="infoName" style="padding:10px 14px;background:var(--bg-secondary);border-radius:8px;font-size:14px;">加载中...</div></div>
      <div class="app-form-group"><label class="app-form-label">公司简介</label><div id="infoDesc" style="padding:10px 14px;background:var(--bg-secondary);border-radius:8px;font-size:14px;min-height:60px;">暂无简介</div></div>
      <div class="app-form-group"><label class="app-form-label">创建时间</label><div id="infoTime" style="padding:10px 14px;background:var(--bg-secondary);border-radius:8px;font-size:14px;">未知</div></div>
    </div>
    <div id="infoEdit" style="display:none;">
      <div class="app-form-group"><label class="app-form-label">公司名称</label><input type="text" class="app-input" id="editName" placeholder="输入公司名称"></div>
      <div class="app-form-group"><label class="app-form-label">公司简介</label><textarea class="app-input" id="editDesc" rows="4" placeholder="输入公司简介" style="resize:vertical;"></textarea></div>
      <div style="display:flex;gap:8px;margin-top:16px;">
        <button class="app-btn app-btn-primary app-btn-sm" onclick="saveInfo()"><i class="fas fa-save"></i> 保存</button>
        <button class="app-btn app-btn-secondary app-btn-sm" onclick="toggleEditInfo()"><i class="fas fa-times"></i> 取消</button>
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
  if(!_opcId)return;
  api('GET','/opc/'+_opcId).then(function(d){
    if(!d.opc)return;var o=d.opc;
    document.getElementById('infoName').textContent=o.name||'';
    document.getElementById('infoDesc').textContent=o.description||'暂无简介';
    document.getElementById('infoTime').textContent=o.created_at||'未知';
    document.getElementById('editName').value=o.name||'';
    document.getElementById('editDesc').value=o.description||'';
  });
})();
function toggleEditInfo(){
  var v=document.getElementById('infoView'),e=document.getElementById('infoEdit'),b=document.getElementById('editInfoBtn');
  if(e.style.display==='none'){v.style.display='none';e.style.display='block';b.innerHTML='<i class="fas fa-times"></i> 取消';}
  else{v.style.display='block';e.style.display='none';b.innerHTML='<i class="fas fa-edit"></i> 编辑';}
}
function saveInfo(){
  var name=document.getElementById('editName').value.trim(),desc=document.getElementById('editDesc').value.trim();
  if(!name){alert('请输入公司名称');return;}
  api('PUT','/opc/'+_opcId,{name:name,description:desc}).then(function(d){
    if(d.opc){document.getElementById('infoName').textContent=d.opc.name;document.getElementById('infoDesc').textContent=d.opc.description||'暂无简介';toggleEditInfo();}
  }).catch(function(e){alert(e.message);});
}
</script>
