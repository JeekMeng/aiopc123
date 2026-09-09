---
title: "通知中心"
layout: app-page
description: "系统通知与个性化推送"
---
<div id="opcSelectorBar" class="app-card" style="margin-bottom:16px;">
  <div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap;">
    <span style="font-size:13px;color:var(--text-secondary);white-space:nowrap;"><i class="fas fa-building" style="margin-right:4px;"></i>当前公司：</span>
    <select class="app-input" id="opcSelector" onchange="switchOpc(this.value)" style="flex:1;min-width:180px;max-width:300px;padding:6px 12px;font-size:13px;"><option value="">加载中...</option></select>
    <a href="/user/opc/" class="app-btn app-btn-sm app-btn-secondary" id="createOpcBtn" style="display:none;text-decoration:none;"><i class="fas fa-plus"></i> 创建公司</a>
  </div>
</div>
<div id="opcNoticesPage">
  <div class="app-card">
    <div class="app-card-header">
      <h2 class="app-card-title" id="noticeTitle"><i class="fas fa-bell" style="color:#AF52DE;margin-right:8px;"></i>通知中心</h2>
      <div style="display:flex;gap:8px;align-items:center;">
        <select class="app-input" id="noticeTab" onchange="switchTab(this.value)" style="width:auto;padding:4px 10px;font-size:12px;">
          <option value="user">我的通知</option>
          <option value="opc">公司通知</option>
        </select>
        <button class="app-btn app-btn-sm app-btn-secondary" onclick="markAllRead()"><i class="fas fa-check-double"></i> 全部已读</button>
      </div>
    </div>
    <div id="noticeList" style="display:grid;gap:8px;"></div>
  </div>
</div>

<script>
var _opcId=new URLSearchParams(window.location.search).get('opc_id');
var _currentTab='user';
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
function switchTab(tab){
  _currentTab=tab;
  if(tab==='user')loadUserNotices();
  else loadOpcNotices();
}
(function(){
  initOpcSelector(_opcId);
  loadUserNotices();
})();
function fmtTime(t){if(!t)return'';var d=new Date(t);return(d.getMonth()+1)+'/'+d.getDate()+' '+d.getHours()+':'+String(d.getMinutes()).padStart(2,'0');}
var TYPE_ICON={policy:'fas fa-landmark',tool:'fas fa-toolbox',book:'fas fa-book',news:'fas fa-newspaper',system:'fas fa-cog'};
var TYPE_COLOR={policy:'#007AFF',tool:'#34C759',book:'#AF52DE',news:'#FF9500',system:'#8E8E93'};
var TYPE_LABEL={policy:'政策',tool:'工具',book:'资料',news:'新闻',system:'系统'};

function loadUserNotices(){
  var el=document.getElementById('noticeList');
  el.innerHTML='<div style="text-align:center;padding:30px;color:var(--text-tertiary);"><i class="fas fa-spinner fa-spin"></i> 加载中...</div>';
  api('GET','/user/notifications').then(function(d){
    var list=d.items||[];
    document.getElementById('noticeTitle').innerHTML='<i class="fas fa-bell" style="color:#AF52DE;margin-right:8px;"></i>我的通知 <span style="font-size:12px;color:var(--text-tertiary);font-weight:400;">('+list.length+' 条)</span>';
    if(!list.length){el.innerHTML='<div style="text-align:center;padding:40px;color:var(--text-tertiary);"><i class="fas fa-bell-slash" style="font-size:36px;display:block;margin-bottom:12px;"></i><p>暂无个性化通知</p><p style="font-size:12px;margin-top:4px;">设置<a href="/user/profile/" style="color:var(--accent-blue);">关注行业</a>后将自动推送</p></div>';return;}
    var html='';
    list.forEach(function(n){
      var icon=TYPE_ICON[n.type]||'fas fa-bell',color=TYPE_COLOR[n.type]||'#8E8E93',label=TYPE_LABEL[n.type]||n.type;
      var time=fmtTime(n.created_at);
      html+='<div class="app-card-sm" style="display:flex;gap:12px;align-items:flex-start;'+(n.is_read?'opacity:.6;':'')+'">';
      html+='<div style="width:36px;height:36px;border-radius:8px;background:'+color+'20;color:'+color+';display:flex;align-items:center;justify-content:center;flex-shrink:0;font-size:14px;"><i class="'+icon+'"></i></div>';
      html+='<div style="flex:1;min-width:0;">';
      html+='<div style="display:flex;align-items:center;gap:6px;margin-bottom:2px;"><span style="font-size:10px;padding:1px 6px;border-radius:4px;background:'+color+'18;color:'+color+';font-weight:600;">'+label+'</span><span style="font-weight:600;font-size:13px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">'+escH(n.title)+'</span></div>';
      html+='<div style="font-size:12px;color:var(--text-tertiary);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">'+escH(n.content)+'</div>';
      html+='<div style="font-size:11px;color:var(--text-tertiary);margin-top:2px;">'+time+'</div></div>';
      if(!n.is_read)html+='<button class="app-btn app-btn-ghost app-btn-sm" onclick="markUserRead(\''+n.id+'\')" style="flex-shrink:0;padding:4px 8px;font-size:11px;">已读</button>';
      html+='<button class="app-btn app-btn-ghost app-btn-sm" onclick="deleteUserNotice(\''+n.id+'\')" style="color:var(--accent-red);flex-shrink:0;padding:4px 6px;font-size:11px;"><i class="fas fa-trash"></i></button>';
      html+='</div>';
    });el.innerHTML=html;
  }).catch(function(e){el.innerHTML='<div style="text-align:center;padding:30px;color:var(--accent-red);"><p>'+escH(e.message)+'</p></div>';});
}

function loadOpcNotices(){
  if(!_opcId){document.getElementById('noticeList').innerHTML='<div style="text-align:center;padding:30px;color:var(--text-tertiary);">请先选择公司</div>';return;}
  var el=document.getElementById('noticeList');
  el.innerHTML='<div style="text-align:center;padding:30px;color:var(--text-tertiary);"><i class="fas fa-spinner fa-spin"></i> 加载中...</div>';
  api('GET','/opc/'+_opcId+'/notices').then(function(d){
    var list=d.items||[];
    document.getElementById('noticeTitle').innerHTML='<i class="fas fa-building" style="color:#FF9500;margin-right:8px;"></i>公司通知 <span style="font-size:12px;color:var(--text-tertiary);font-weight:400;">('+list.length+' 条)</span>';
    if(!list.length){el.innerHTML='<div style="text-align:center;padding:40px;color:var(--text-tertiary);"><i class="fas fa-bell-slash" style="font-size:36px;display:block;margin-bottom:12px;"></i><p>暂无公司通知</p></div>';return;}
    var ti={system:'fas fa-cog',product:'fas fa-cube',dept:'fas fa-sitemap',todo:'fas fa-tasks'};
    var tc={system:'#AF52DE',product:'#34C759',dept:'#FF9500',todo:'#FF3B30'};
    var html='';
    list.forEach(function(n){
      var icon=ti[n.type]||'fas fa-bell',color=tc[n.type]||'#AF52DE';
      html+='<div class="app-card-sm" style="display:flex;gap:12px;align-items:flex-start;'+(n.is_read?'opacity:.6;':'')+'">';
      html+='<div style="width:36px;height:36px;border-radius:8px;background:'+color+'20;color:'+color+';display:flex;align-items:center;justify-content:center;flex-shrink:0;font-size:14px;"><i class="'+icon+'"></i></div>';
      html+='<div style="flex:1;min-width:0;"><div style="font-weight:600;font-size:13px;">'+escH(n.title)+'</div>';
      html+='<div style="font-size:12px;color:var(--text-tertiary);margin-top:2px;">'+escH(n.content)+'</div>';
      html+='<div style="font-size:11px;color:var(--text-tertiary);margin-top:4px;">'+fmtTime(n.created_at)+'</div></div>';
      if(!n.is_read)html+='<button class="app-btn app-btn-ghost app-btn-sm" onclick="markOpcRead(\''+n.id+'\')" style="flex-shrink:0;padding:4px 8px;font-size:11px;">标为已读</button>';
      html+='<button class="app-btn app-btn-ghost app-btn-sm" onclick="deleteOpcNotice(\''+n.id+'\')" style="color:var(--accent-red);flex-shrink:0;padding:4px 6px;font-size:11px;"><i class="fas fa-trash"></i></button>';
      html+='</div>';
    });el.innerHTML=html;
  }).catch(function(e){el.innerHTML='<div style="text-align:center;padding:30px;color:var(--accent-red);"><p>'+escH(e.message)+'</p></div>';});
}

function markUserRead(id){api('PATCH','/user/notifications/'+id+'/read').then(function(){loadUserNotices();}).catch(function(e){alert(e.message);});}
function deleteUserNotice(id){if(!confirm('确定删除？'))return;api('DELETE','/user/notifications/'+id).then(function(){loadUserNotices();}).catch(function(e){alert(e.message);});}
function markOpcRead(id){api('PATCH','/opc/'+_opcId+'/notices/'+id+'/read').then(function(){loadOpcNotices();}).catch(function(e){alert(e.message);});}
function deleteOpcNotice(id){if(!confirm('确定删除？'))return;api('DELETE','/opc/'+_opcId+'/notices/'+id).then(function(){loadOpcNotices();}).catch(function(e){alert(e.message);});}
function markAllRead(){
  if(_currentTab==='user'){api('PATCH','/user/notifications/read-all').then(function(){loadUserNotices();}).catch(function(e){alert(e.message);});}
  else if(_opcId){api('PATCH','/opc/'+_opcId+'/notices/read-all').then(function(){loadOpcNotices();}).catch(function(e){alert(e.message);});}
}
</script>
