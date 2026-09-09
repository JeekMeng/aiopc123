---
title: "个人设置"
layout: app-page
description: "个人资料与通知偏好"
---
<div id="userPage" data-section="profile">
<div class="app-card">
<div class="profile-card">
<div class="profile-avatar" id="profileAvatar">U</div>
<div>
<div class="profile-name" id="profile-nickname">加载中...</div>
<div class="profile-email" id="profile-email"></div>
</div>
</div>
</div>

<div class="app-card" style="margin-bottom:16px;">
<div class="app-card-header">
<h2 class="app-card-title"><i class="fas fa-user" style="color:#007AFF;margin-right:8px;"></i>个人资料</h2>
</div>
<div style="max-width:560px;">
<div class="app-form-group">
<label class="app-form-label">昵称</label>
<input type="text" class="app-input" id="pf-nickname" placeholder="输入昵称">
</div>
<div class="app-form-group">
<label class="app-form-label">个人简介</label>
<input type="text" class="app-input" id="pf-bio" placeholder="一句话介绍自己">
</div>
<div style="display:flex;gap:12px;">
<div class="app-form-group" style="flex:1;">
<label class="app-form-label">所在省份</label>
<select class="app-input" id="pf-province" onchange="updateCities()">
<option value="">请选择</option>
<option value="北京">北京</option><option value="上海">上海</option><option value="广东">广东</option>
<option value="江苏">江苏</option><option value="浙江">浙江</option><option value="四川">四川</option>
<option value="湖北">湖北</option><option value="湖南">湖南</option><option value="安徽">安徽</option>
<option value="其他">其他</option>
</select>
</div>
<div class="app-form-group" style="flex:1;">
<label class="app-form-label">所在城市</label>
<select class="app-input" id="pf-city">
<option value="">请先选择省份</option>
</select>
</div>
</div>
<div class="app-form-group">
<label class="app-form-label">公司类型</label>
<select class="app-input" id="pf-company-type" style="max-width:200px;">
<option value="">请选择</option>
<option value="personal">个人/自由职业</option>
<option value="enterprise">企业/团队</option>
</select>
</div>
<button class="app-btn app-btn-primary app-btn-sm" onclick="saveProfile()" style="margin-top:8px;"><i class="fas fa-save"></i> 保存资料</button>
<div style="color:var(--accent-green);font-size:13px;margin-top:8px;display:none;" id="pfSaveOk">保存成功</div>
</div>
</div>

<div class="app-card" style="margin-bottom:16px;">
<div class="app-card-header">
<h2 class="app-card-title"><i class="fas fa-industry" style="color:#FF9500;margin-right:8px;"></i>关注行业</h2>
</div>
<div id="pf-industries" style="display:flex;flex-wrap:wrap;gap:8px;"></div>
</div>

<div class="app-card" style="margin-bottom:16px;">
<div class="app-card-header">
<h2 class="app-card-title"><i class="fas fa-heart" style="color:#FF3B30;margin-right:8px;"></i>关注内容</h2>
</div>
<div id="pf-interests" style="display:flex;flex-wrap:wrap;gap:8px;"></div>
</div>

<div class="app-card" style="margin-bottom:16px;">
<div class="app-card-header">
<h2 class="app-card-title"><i class="fas fa-bell" style="color:#AF52DE;margin-right:8px;"></i>通知偏好</h2>
</div>
<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;max-width:400px;">
<label style="display:flex;align-items:center;gap:8px;font-size:14px;cursor:pointer;">
<input type="checkbox" id="pf-notify-policy" checked> 政策推送
</label>
<label style="display:flex;align-items:center;gap:8px;font-size:14px;cursor:pointer;">
<input type="checkbox" id="pf-notify-tool" checked> 工具推送
</label>
<label style="display:flex;align-items:center;gap:8px;font-size:14px;cursor:pointer;">
<input type="checkbox" id="pf-notify-news" checked> 新闻推送
</label>
<label style="display:flex;align-items:center;gap:8px;font-size:14px;cursor:pointer;">
<input type="checkbox" id="pf-notify-book" checked> 资料推送
</label>
</div>
<button class="app-btn app-btn-primary app-btn-sm" onclick="saveNotifPrefs()" style="margin-top:12px;"><i class="fas fa-save"></i> 保存通知偏好</button>
<div style="color:var(--accent-green);font-size:13px;margin-top:8px;display:none;" id="pfNotifOk">保存成功</div>
</div>

<div class="app-card">
<div class="app-card-header">
<h2 class="app-card-title"><i class="fas fa-lock" style="color:#8E8E93;margin-right:8px;"></i>修改密码</h2>
</div>
<form id="changePwdForm" style="max-width:400px;">
<div class="app-form-group">
<label class="app-form-label">当前密码</label>
<input type="password" class="app-input" id="curPwd" placeholder="当前密码" required>
</div>
<div class="app-form-group">
<label class="app-form-label">新密码（至少6位）</label>
<input type="password" class="app-input" id="newPwd" placeholder="新密码" required>
</div>
<div class="app-form-group">
<label class="app-form-label">确认新密码</label>
<input type="password" class="app-input" id="confirmPwd" placeholder="确认新密码" required>
</div>
<div class="auth-error" id="changePwdError"></div>
<div style="color:var(--accent-green);font-size:13px;margin-top:8px;display:none;" id="changePwdSuccess">密码修改成功</div>
<button type="submit" class="app-btn app-btn-primary" style="margin-top:4px;">修改密码</button>
</form>
</div>
</div>

<script>
var _apiBase=(window.location.port==='1313'||window.location.port==='1317')?'http://localhost:8787/api':'/api';
function uid(){try{return JSON.parse(localStorage.getItem('auth_user')||'{}').id||'';}catch(e){return'';}}
function escH(s){var d=document.createElement('div');d.appendChild(document.createTextNode(s||''));return d.innerHTML;}

var PROVINCES={
  '北京':['北京'],'上海':['上海'],'广东':['广州','深圳','东莞','佛山','珠海','中山'],
  '江苏':['南京','苏州','无锡','常州','合肥'],'浙江':['杭州','宁波','温州','嘉兴','湖州'],
  '四川':['成都','绵阳'],'湖北':['武汉','宜昌','襄阳'],'湖南':['长沙','株洲','湘潭'],
  '安徽':['合肥','芜湖','蚌埠'],'其他':['其他']
};
var ALL_INDUSTRIES=['AI工具','AI智能体','AIGC','AI硬件','AI出海','智能语音','数字文创','机器人','医疗AI','金融AI','教育AI'];
var ALL_INTERESTS=['政策补贴','工具收录','学习资料','投融资','产业园区','热点新闻'];
var _profile={};

function updateCities(){
  var prov=document.getElementById('pf-province').value;
  var sel=document.getElementById('pf-city');
  var cities=PROVINCES[prov]||[];
  sel.innerHTML=cities.length?'<option value="">请选择</option>'+cities.map(function(c){return '<option value="'+c+'">'+c+'</option>';}).join(''):'<option value="">请先选择省份</option>';
}

function renderTags(containerId, allItems, selected, key){
  var el=document.getElementById(containerId);
  el.innerHTML=allItems.map(function(item){
    var checked=selected.indexOf(item)>=0?'checked':'';
    return '<label style="display:inline-flex;align-items:center;gap:6px;padding:6px 12px;border-radius:8px;border:1px solid var(--border-light);font-size:13px;cursor:pointer;background:'+(checked?'var(--accent-blue)10;border-color:var(--accent-blue);':'')+'"><input type="checkbox" value="'+item+'" '+checked+' style="display:none;" onchange="toggleTag(this,\''+key+'\')">'+item+'</label>';
  }).join('');
}

function toggleTag(el, key){
  var list=JSON.parse(_profile[key]||'[]');
  var val=el.value;
  var idx=list.indexOf(val);
  if(idx>=0)list.splice(idx,1); else list.push(val);
  _profile[key]=JSON.stringify(list);
  el.parentElement.style.background=idx>=0?'':'var(--accent-blue)10;';
  el.parentElement.style.borderColor=idx>=0?'var(--border-light)':'var(--accent-blue)';
}

function loadProfile(){
  fetch(_apiBase+'/auth/profile',{headers:{'X-Auth-User-Id':String(uid()),'Content-Type':'application/json'},credentials:'include'})
  .then(function(r){return r.json();}).then(function(d){
    _profile=d.user||{};
    document.getElementById('pf-nickname').value=_profile.nickname||'';
    document.getElementById('pf-bio').value=_profile.bio||'';
    document.getElementById('pf-company-type').value=_profile.company_type||'';
    if(_profile.province){document.getElementById('pf-province').value=_profile.province;updateCities();}
    if(_profile.city)setTimeout(function(){document.getElementById('pf-city').value=_profile.city;},50);
    var inds=JSON.parse(_profile.industries||'[]');
    var ints=JSON.parse(_profile.interests||'[]');
    renderTags('pf-industries',ALL_INDUSTRIES,inds,'industries');
    renderTags('pf-interests',ALL_INTERESTS,ints,'interests');
    var prefs=JSON.parse(_profile.notify_prefs||'{}');
    document.getElementById('pf-notify-policy').checked=prefs.policy_push!==false;
    document.getElementById('pf-notify-tool').checked=prefs.tool_push!==false;
    document.getElementById('pf-notify-news').checked=prefs.news_push!==false;
    document.getElementById('pf-notify-book').checked=prefs.book_push!==false;
  }).catch(function(){});
}

function saveProfile(){
  var body={
    nickname:document.getElementById('pf-nickname').value.trim(),
    bio:document.getElementById('pf-bio').value.trim(),
    province:document.getElementById('pf-province').value,
    city:document.getElementById('pf-city').value,
    company_type:document.getElementById('pf-company-type').value,
    industries:_profile.industries||'[]',
    interests:_profile.interests||'[]'
  };
  fetch(_apiBase+'/auth/profile',{method:'PATCH',headers:{'X-Auth-User-Id':String(uid()),'Content-Type':'application/json'},credentials:'include',body:JSON.stringify(body)})
  .then(function(r){return r.json();}).then(function(d){
    if(d.user){var ok=document.getElementById('pfSaveOk');ok.style.display='block';setTimeout(function(){ok.style.display='none';},2000);}
  }).catch(function(e){alert(e.message);});
}

function saveNotifPrefs(){
  var prefs={
    policy_push:document.getElementById('pf-notify-policy').checked,
    tool_push:document.getElementById('pf-notify-tool').checked,
    news_push:document.getElementById('pf-notify-news').checked,
    book_push:document.getElementById('pf-notify-book').checked
  };
  fetch(_apiBase+'/auth/profile',{method:'PATCH',headers:{'X-Auth-User-Id':String(uid()),'Content-Type':'application/json'},credentials:'include',body:JSON.stringify({notify_prefs:JSON.stringify(prefs)})})
  .then(function(r){return r.json();}).then(function(d){
    if(d.user){var ok=document.getElementById('pfNotifOk');ok.style.display='block';setTimeout(function(){ok.style.display='none';},2000);}
  }).catch(function(e){alert(e.message);});
}

document.getElementById('changePwdForm').onsubmit=function(e){
  e.preventDefault();
  var cur=document.getElementById('curPwd').value,newP=document.getElementById('newPwd').value,cf=document.getElementById('confirmPwd').value;
  var err=document.getElementById('changePwdError'),ok=document.getElementById('changePwdSuccess');
  err.textContent='';ok.style.display='none';
  if(newP.length<6){err.textContent='新密码至少6位';return;}
  if(newP!==cf){err.textContent='两次密码不一致';return;}
  fetch(_apiBase+'/auth/change-password',{method:'POST',headers:{'X-Auth-User-Id':String(uid()),'Content-Type':'application/json'},credentials:'include',body:JSON.stringify({current_password:cur,password:newP})})
  .then(function(r){return r.json();}).then(function(d){
    if(d.message){ok.style.display='block';document.getElementById('curPwd').value='';document.getElementById('newPwd').value='';document.getElementById('confirmPwd').value='';}
    else{err.textContent=d.error||'修改失败';}
  }).catch(function(e){err.textContent=e.message;});
};

loadProfile();
</script>
