---
title: "OPC产品"
layout: app-page
description: "管理OPC公司产品线"
---
<div id="opcSelectorBar" class="app-card" style="margin-bottom:16px;">
  <div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap;">
    <span style="font-size:13px;color:var(--text-secondary);white-space:nowrap;"><i class="fas fa-building" style="margin-right:4px;"></i>当前公司：</span>
    <select class="app-input" id="opcSelector" onchange="switchOpc(this.value)" style="flex:1;min-width:180px;max-width:300px;padding:6px 12px;font-size:13px;"><option value="">加载中...</option></select>
    <a href="/user/opc/" class="app-btn app-btn-sm app-btn-secondary" id="createOpcBtn" style="display:none;text-decoration:none;"><i class="fas fa-plus"></i> 创建公司</a>
  </div>
</div>
<div id="opcProductsPage">
  <div class="app-card">
    <div class="app-card-header">
      <h2 class="app-card-title"><i class="fas fa-cubes" style="color:#34C759;margin-right:8px;"></i>产品管理</h2>
      <button class="app-btn app-btn-sm app-btn-primary" onclick="showProductForm()"><i class="fas fa-plus"></i> 创建产品</button>
    </div>
    <div id="productList" style="display:grid;gap:12px;"></div>
  </div>
  <div id="productModal" style="display:none;position:fixed;inset:0;background:rgba(0,0,0,.5);z-index:1000;align-items:center;justify-content:center;">
    <div style="background:var(--bg-card);border-radius:12px;padding:24px;width:90%;max-width:480px;box-shadow:0 8px 32px rgba(0,0,0,.2);">
      <h3 style="margin:0 0 16px;font-size:18px;font-weight:600;" id="productModalTitle">创建产品</h3>
      <input type="hidden" id="productEditId">
      <div class="app-form-group"><label class="app-form-label">产品名称 *</label><input type="text" class="app-input" id="productName" placeholder="例如：AI写作助手"></div>
      <div class="app-form-group"><label class="app-form-label">产品描述</label><textarea class="app-input" id="productDesc" rows="3" placeholder="简单描述产品功能" style="resize:vertical;"></textarea></div>
      <div class="app-form-group"><label class="app-form-label">产品链接</label><input type="url" class="app-input" id="productUrl" placeholder="https://..."></div>
      <div style="display:flex;gap:8px;margin-top:16px;">
        <button class="app-btn app-btn-primary app-btn-sm" onclick="saveProduct()"><i class="fas fa-save"></i> 保存</button>
        <button class="app-btn app-btn-secondary app-btn-sm" onclick="closeProductForm()"><i class="fas fa-times"></i> 取消</button>
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
  if(!_opcId){document.getElementById('opcProductsPage').innerHTML='<div class="app-card"><div style="text-align:center;padding:40px;"><p style="color:var(--text-tertiary);">请先选择一个公司</p></div></div>';return;}
  loadProducts();
})();
function loadProducts(){
  var el=document.getElementById('productList');
  el.innerHTML='<div style="text-align:center;padding:20px;color:var(--text-tertiary);"><i class="fas fa-spinner fa-spin"></i> 加载中...</div>';
  api('GET','/opc/'+_opcId+'/products').then(function(d){
    var list=d.items||[];
    if(!list.length){el.innerHTML='<div style="text-align:center;padding:40px;color:var(--text-tertiary);"><i class="fas fa-box-open" style="font-size:36px;display:block;margin-bottom:12px;"></i><p>暂无产品，点击上方按钮创建</p></div>';return;}
    var html='';list.forEach(function(p){
      html+='<div class="app-card-sm" style="display:flex;align-items:center;gap:12px;">';
      html+='<div style="width:40px;height:40px;border-radius:10px;background:linear-gradient(135deg,#34C759,#30D158);color:#fff;display:flex;align-items:center;justify-content:center;font-size:16px;flex-shrink:0;"><i class="fas fa-cube"></i></div>';
      html+='<div style="flex:1;min-width:0;"><div style="font-weight:600;font-size:14px;">'+escH(p.name)+'</div>';
      if(p.description)html+='<div style="font-size:12px;color:var(--text-tertiary);margin-top:2px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">'+escH(p.description)+'</div>';
      if(p.url)html+='<div style="font-size:11px;color:var(--accent-blue);margin-top:2px;"><a href="'+escH(p.url)+'" target="_blank" style="color:var(--accent-blue);text-decoration:none;">'+escH(p.url)+'</a></div>';
      html+='</div>';
      html+='<button class="app-btn app-btn-ghost app-btn-sm" onclick="editProduct(\''+p.id+'\')" style="flex-shrink:0;"><i class="fas fa-edit"></i></button>';
      html+='<button class="app-btn app-btn-ghost app-btn-sm" onclick="deleteProduct(\''+p.id+'\')" style="color:var(--accent-red);flex-shrink:0;"><i class="fas fa-trash"></i></button>';
      html+='</div>';
    });el.innerHTML=html;
  }).catch(function(e){el.innerHTML='<div style="text-align:center;padding:40px;color:var(--accent-red);"><i class="fas fa-exclamation-triangle" style="font-size:36px;display:block;margin-bottom:12px;"></i><p>'+escH(e.message)+'</p></div>';});
}
function showProductForm(id){
  document.getElementById('productModal').style.display='flex';
  if(id){
    document.getElementById('productModalTitle').textContent='编辑产品';
    document.getElementById('productEditId').value=id;
    document.getElementById('productDesc').value='';
    document.getElementById('productUrl').value='';
    document.getElementById('productName').value='';
    document.getElementById('productName').placeholder='加载中...';
    api('GET','/opc/'+_opcId+'/products').then(function(d){
      var p=(d.items||[]).find(function(x){return x.id===id;});
      if(p){document.getElementById('productName').value=p.name;document.getElementById('productName').placeholder='例如：AI写作助手';document.getElementById('productDesc').value=p.description||'';document.getElementById('productUrl').value=p.url||'';}
    });
  }
  else{document.getElementById('productModalTitle').textContent='创建产品';document.getElementById('productEditId').value='';document.getElementById('productName').value='';document.getElementById('productName').placeholder='例如：AI写作助手';document.getElementById('productDesc').value='';document.getElementById('productUrl').value='';}
}
function closeProductForm(){document.getElementById('productModal').style.display='none';}
function saveProduct(){
  var name=document.getElementById('productName').value.trim();if(!name){alert('请输入产品名称');return;}
  var desc=document.getElementById('productDesc').value.trim(),url=document.getElementById('productUrl').value.trim(),editId=document.getElementById('productEditId').value;
  var body={name:name,description:desc,url:url};
  var promise=editId?api('PUT','/opc/'+_opcId+'/products/'+editId,body):api('POST','/opc/'+_opcId+'/products',body);
  promise.then(function(){closeProductForm();loadProducts();}).catch(function(e){alert(e.message);});
}
function editProduct(id){showProductForm(id);}
function deleteProduct(id){if(!confirm('确定删除此产品？'))return;api('DELETE','/opc/'+_opcId+'/products/'+id).then(function(){loadProducts();}).catch(function(e){alert(e.message);});}
</script>
