---
title: "工具中心"
layout: app-page
description: "路线图、素材、数据管理"
---
<div id="opcSelectorBar" class="app-card" style="margin-bottom:16px;">
  <div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap;">
    <span style="font-size:13px;color:var(--text-secondary);white-space:nowrap;"><i class="fas fa-building" style="margin-right:4px;"></i>当前公司：</span>
    <select class="app-input" id="opcSelector" onchange="switchOpc(this.value)" style="flex:1;min-width:180px;max-width:300px;padding:6px 12px;font-size:13px;"><option value="">加载中...</option></select>
    <a href="/user/opc/" class="app-btn app-btn-sm app-btn-secondary" id="createOpcBtn" style="display:none;text-decoration:none;"><i class="fas fa-plus"></i> 创建公司</a>
  </div>
</div>
<div id="opcToolsPage">
  <div class="app-card">
    <div class="app-card-header">
      <h2 class="app-card-title"><i class="fas fa-toolbox" style="color:#5856D6;margin-right:8px;"></i>工具中心</h2>
    </div>
    <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:12px;">
      <a href="/workspace/" id="toolRoadmap" class="app-card-sm" style="text-decoration:none;display:flex;align-items:center;gap:12px;cursor:pointer;">
        <div style="width:40px;height:40px;border-radius:10px;background:linear-gradient(135deg,#FF6B6B,#EE5A24);color:#fff;display:flex;align-items:center;justify-content:center;font-size:16px;flex-shrink:0;"><i class="fas fa-map"></i></div>
        <div><div style="font-weight:600;font-size:14px;">路线图</div><div style="font-size:12px;color:var(--text-tertiary);">8步创建公司</div></div>
      </a>
      <a href="/book/" class="app-card-sm" style="text-decoration:none;display:flex;align-items:center;gap:12px;cursor:pointer;">
        <div style="width:40px;height:40px;border-radius:10px;background:linear-gradient(135deg,#34C759,#30D158);color:#fff;display:flex;align-items:center;justify-content:center;font-size:16px;flex-shrink:0;"><i class="fas fa-image"></i></div>
        <div><div style="font-weight:600;font-size:14px;">素材库</div><div style="font-size:12px;color:var(--text-tertiary);">电子书、模板、教程</div></div>
      </a>
      <a href="/book/" class="app-card-sm" style="text-decoration:none;display:flex;align-items:center;gap:12px;cursor:pointer;">
        <div style="width:40px;height:40px;border-radius:10px;background:linear-gradient(135deg,#5856D6,#007AFF);color:#fff;display:flex;align-items:center;justify-content:center;font-size:16px;flex-shrink:0;"><i class="fas fa-database"></i></div>
        <div><div style="font-weight:600;font-size:14px;">数据中心</div><div style="font-size:12px;color:var(--text-tertiary);">优质数据集</div></div>
      </a>
      <a href="/user/bookmarks/" class="app-card-sm" style="text-decoration:none;display:flex;align-items:center;gap:12px;cursor:pointer;">
        <div style="width:40px;height:40px;border-radius:10px;background:linear-gradient(135deg,#AF52DE,#BF5AF2);color:#fff;display:flex;align-items:center;justify-content:center;font-size:16px;flex-shrink:0;"><i class="fas fa-bookmark"></i></div>
        <div><div style="font-weight:600;font-size:14px;">收藏夹</div><div style="font-size:12px;color:var(--text-tertiary);">我的收藏</div></div>
      </a>
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
  if(_opcId){var rl=document.getElementById('toolRoadmap');if(rl)rl.href='/workspace/?opc_id='+_opcId;}
})();
</script>
