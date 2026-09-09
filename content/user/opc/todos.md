---
title: "待办事项"
layout: app-page
description: "任务清单与进度管理"
---
<div id="opcSelectorBar" class="app-card" style="margin-bottom:16px;">
  <div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap;">
    <span style="font-size:13px;color:var(--text-secondary);white-space:nowrap;"><i class="fas fa-building" style="margin-right:4px;"></i>当前公司：</span>
    <select class="app-input" id="opcSelector" onchange="switchOpc(this.value)" style="flex:1;min-width:180px;max-width:300px;padding:6px 12px;font-size:13px;"><option value="">加载中...</option></select>
    <a href="/user/opc/" class="app-btn app-btn-sm app-btn-secondary" id="createOpcBtn" style="display:none;text-decoration:none;"><i class="fas fa-plus"></i> 创建公司</a>
  </div>
</div>
<div id="opcTodosPage">
  <div class="app-card">
    <div class="app-card-header">
      <h2 class="app-card-title"><i class="fas fa-tasks" style="color:#FF3B30;margin-right:8px;"></i>待办事项</h2>
      <div style="display:flex;gap:8px;">
        <select class="app-input" id="todoFilter" onchange="loadTodos()" style="width:auto;padding:4px 10px;font-size:12px;">
          <option value="all">全部</option><option value="pending">未完成</option><option value="done">已完成</option>
        </select>
        <button class="app-btn app-btn-sm app-btn-primary" onclick="showTodoForm()"><i class="fas fa-plus"></i> 添加</button>
      </div>
    </div>
    <div style="display:flex;gap:8px;margin-bottom:16px;flex-wrap:wrap;">
      <input type="date" class="app-input" id="todoQuickDate" style="width:auto;padding:6px 10px;font-size:13px;">
      <input type="text" class="app-input" id="todoText" placeholder="输入待办事项，回车添加" style="flex:1;min-width:200px;" onkeydown="if(event.key==='Enter')addQuickTodo()">
      <button class="app-btn app-btn-primary app-btn-sm" onclick="addQuickTodo()"><i class="fas fa-plus"></i></button>
    </div>
    <div id="todoList" style="display:grid;gap:8px;"></div>
    <div style="margin-top:16px;padding-top:12px;border-top:1px solid var(--border-light);font-size:12px;color:var(--text-tertiary);display:flex;justify-content:space-between;">
      <span id="todoCount">0 项待办</span>
      <button class="app-btn app-btn-ghost app-btn-sm" onclick="clearDoneTodos()" style="font-size:12px;padding:2px 8px;">清除已完成</button>
    </div>
  </div>
  <div id="todoModal" style="display:none;position:fixed;inset:0;background:rgba(0,0,0,.5);z-index:1000;align-items:center;justify-content:center;">
    <div style="background:var(--bg-card);border-radius:12px;padding:24px;width:90%;max-width:480px;box-shadow:0 8px 32px rgba(0,0,0,.2);">
      <h3 style="margin:0 0 16px;font-size:18px;font-weight:600;">编辑待办</h3>
      <input type="hidden" id="todoEditId">
      <div class="app-form-group"><label class="app-form-label">待办内容 *</label><input type="text" class="app-input" id="todoEditText" placeholder="输入待办内容"></div>
      <div class="app-form-group"><label class="app-form-label">日期</label><input type="date" class="app-input" id="todoEditDate"></div>
      <div class="app-form-group"><label class="app-form-label">优先级</label>
        <select class="app-input" id="todoEditPriority"><option value="low">低</option><option value="medium" selected>中</option><option value="high">高</option></select>
      </div>
      <div style="display:flex;gap:8px;margin-top:16px;">
        <button class="app-btn app-btn-primary app-btn-sm" onclick="saveTodoEdit()"><i class="fas fa-save"></i> 保存</button>
        <button class="app-btn app-btn-secondary app-btn-sm" onclick="closeTodoForm()"><i class="fas fa-times"></i> 取消</button>
      </div>
    </div>
  </div>
</div>
<script>
var _opcId=new URLSearchParams(window.location.search).get('opc_id');
var _allTodos=[];
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
  if(!_opcId){document.getElementById('opcTodosPage').innerHTML='<div class="app-card"><div style="text-align:center;padding:40px;"><p style="color:var(--text-tertiary);">请先选择一个公司</p></div></div>';return;}
  loadTodos();
  var params=new URLSearchParams(window.location.search);
  if(params.get('action')==='add')showTodoForm();
})();
function renderTodos(list,filter){
  var el=document.getElementById('todoList');
  var filtered=list;
  if(filter==='pending')filtered=list.filter(function(t){return !t.done;});
  else if(filter==='done')filtered=list.filter(function(t){return t.done;});
  var total=list.length,doneCount=list.filter(function(t){return t.done;}).length;
  document.getElementById('todoCount').textContent=(total-doneCount)+' 项待办 / '+total+' 项总计';
  if(!filtered.length){el.innerHTML='<div style="text-align:center;padding:30px;color:var(--text-tertiary);"><i class="fas fa-clipboard-check" style="font-size:32px;display:block;margin-bottom:8px;"></i><p>'+(filter==='all'?'暂无待办事项':'没有'+(filter==='done'?'已完成':'未完成')+'的事项')+'</p></div>';return;}
  var pi={high:'#FF3B30',medium:'#FF9500',low:'#34C759'};
  var withDate=filtered.filter(function(t){return t.due_date;}).sort(function(a,b){return a.due_date<b.due_date?-1:a.due_date>b.due_date?1:0;});
  var noDate=filtered.filter(function(t){return !t.due_date;});
  var sorted=withDate.concat(noDate);
  var html='';
  sorted.forEach(function(t){
    var dateLabel=t.due_date?'<span style="color:var(--accent-blue);font-weight:500;margin-right:6px;">['+t.due_date+']</span>':'';
    var pc=t.done?'#34C759':(pi[t.priority]||'#FF9500');
    html+='<div class="app-card-sm" style="display:flex;align-items:center;gap:10px;'+(t.done?'opacity:.6;':'')+'">';
    html+='<div onclick="toggleTodo(\''+t.id+'\','+!t.done+')" style="width:18px;height:18px;border-radius:50%;border:2px solid '+pc+';'+(t.done?'background:'+pc+';':'')+'flex-shrink:0;cursor:pointer;display:flex;align-items:center;justify-content:center;">'+(t.done?'<span style="color:#fff;font-size:11px;">✓</span>':'')+'</div>';
    html+='<div style="flex:1;min-width:0;font-size:14px;'+(t.done?'text-decoration:line-through;color:var(--text-tertiary);':'')+'">'+dateLabel+escH(t.text)+'</div>';
    html+='<button class="app-btn app-btn-ghost app-btn-sm" onclick="editTodo(\''+t.id+'\')" style="flex-shrink:0;padding:4px 6px;"><i class="fas fa-edit"></i></button>';
    html+='<button class="app-btn app-btn-ghost app-btn-sm" onclick="deleteTodo(\''+t.id+'\')" style="color:var(--accent-red);flex-shrink:0;padding:4px 6px;"><i class="fas fa-trash"></i></button>';
    html+='</div>';
  });el.innerHTML=html;
}
function loadTodos(){
  var el=document.getElementById('todoList');
  el.innerHTML='<div style="text-align:center;padding:30px;color:var(--text-tertiary);"><i class="fas fa-spinner fa-spin"></i> 加载中...</div>';
  api('GET','/opc/'+_opcId+'/todos').then(function(d){
    _allTodos=d.items||[];
    renderTodos(_allTodos,document.getElementById('todoFilter').value);
  }).catch(function(e){el.innerHTML='<div style="text-align:center;padding:30px;color:var(--accent-red);"><p>'+escH(e.message)+'</p></div>';});
}
function addQuickTodo(){
  var text=document.getElementById('todoText').value.trim();if(!text)return;
  var dueDate=document.getElementById('todoQuickDate').value||'';
  api('POST','/opc/'+_opcId+'/todos',{text:text,priority:'medium',due_date:dueDate}).then(function(d){
    document.getElementById('todoText').value='';document.getElementById('todoQuickDate').value='';loadTodos();
  }).catch(function(e){alert(e.message);});
}
function toggleTodo(id,done){
  api('PUT','/opc/'+_opcId+'/todos/'+id,{done:done}).then(function(){loadTodos();}).catch(function(e){alert(e.message);});
}
function deleteTodo(id){if(!confirm('确定删除？'))return;api('DELETE','/opc/'+_opcId+'/todos/'+id).then(function(){loadTodos();}).catch(function(e){alert(e.message);});}
function clearDoneTodos(){
  var doneIds=_allTodos.filter(function(t){return t.done;}).map(function(t){return t.id;});
  if(!doneIds.length){return;}
  if(!confirm('清除所有已完成的待办？'))return;
  Promise.all(doneIds.map(function(id){return api('DELETE','/opc/'+_opcId+'/todos/'+id);})).then(function(){loadTodos();}).catch(function(e){alert(e.message);});
}
function showTodoForm(){document.getElementById('todoModal').style.display='flex';document.getElementById('todoEditId').value='';document.getElementById('todoEditText').value='';document.getElementById('todoEditDate').value='';document.getElementById('todoEditPriority').value='medium';}
function editTodo(id){
  var t=_allTodos.find(function(x){return x.id===id;});if(!t)return;
  document.getElementById('todoModal').style.display='flex';
  document.getElementById('todoEditId').value=id;
  document.getElementById('todoEditText').value=t.text;
  document.getElementById('todoEditDate').value=t.due_date||'';
  document.getElementById('todoEditPriority').value=t.priority||'medium';
}
function closeTodoForm(){document.getElementById('todoModal').style.display='none';}
function saveTodoEdit(){
  var text=document.getElementById('todoEditText').value.trim();if(!text){alert('请输入待办内容');return;}
  var priority=document.getElementById('todoEditPriority').value;
  var dueDate=document.getElementById('todoEditDate').value||'';
  var editId=document.getElementById('todoEditId').value;
  var body={text:text,priority:priority,due_date:dueDate};
  var p=editId?api('PUT','/opc/'+_opcId+'/todos/'+editId,body):api('POST','/opc/'+_opcId+'/todos',body);
  p.then(function(){closeTodoForm();loadTodos();}).catch(function(e){alert(e.message);});
}
</script>
