(function () {
  'use strict';

  var API_BASE = (window.location.port === '1313' || window.location.port === '1317')
    ? 'http://localhost:8787/api'
    : '/api';

  var currentUser = null;
  var AUTH_KEY = 'auth_user';
  var _cachedPolicies = [];
  var CITY_CODES = {
    "上海": "310000", "北京": "110000", "天津": "120000", "重庆": "500000",
    "南京": "320100", "苏州": "320500", "无锡": "320200", "常州": "320400",
    "南通": "320600", "扬州": "321000", "徐州": "320300", "盐城": "320900",
    "宿迁": "321300", "连云港": "320700",
    "杭州": "330100", "宁波": "330200", "温州": "330300",
    "广州": "440100", "深圳": "440300", "珠海": "440400", "佛山": "440600",
    "东莞": "441900", "中山": "442000", "惠州": "441300",
    "成都": "510100", "武汉": "420100", "长沙": "430100",
    "郑州": "410100", "西安": "610100", "济南": "370100", "青岛": "370200",
    "合肥": "340100", "福州": "350100", "厦门": "350200",
    "昆明": "530100", "石家庄": "130100", "海口": "460100"
  };

  function saveAuth(user) {
    try { localStorage.setItem(AUTH_KEY, JSON.stringify(user)); } catch (e) {} }

  function clearAuth() {
    try { localStorage.removeItem(AUTH_KEY); } catch (e) {} }

  function loadAuth() {
    try { var d = localStorage.getItem(AUTH_KEY); return d ? JSON.parse(d) : null; } catch (e) { return null; } }

  function api(path, options) {
    options = options || {};
    options.credentials = 'include';
    if (currentUser) {
      options.headers = options.headers || {};
      options.headers['X-Auth-User-Id'] = currentUser.id;
    }
    if (options.body && typeof options.body === 'object') {
      options.body = JSON.stringify(options.body);
      options.headers = options.headers || {};
      options.headers['Content-Type'] = 'application/json';
    }
    return fetch(API_BASE + path, options).then(function (r) {
      return r.json().then(function (data) {
        if (!r.ok) {
          var err = new Error(data.error || '请求失败');
          err.status = r.status;
          throw err;
        }
        return data;
      });
    });
  }


  function logoutUser() {
    api('/auth/logout', { method: 'POST' }).then(function () {
      currentUser = null;
      clearAuth();
      window.location.href = '/user/login/';
    });
  }

  function updateUI() {
    var container = document.getElementById('user-menu');
    var appContainer = document.getElementById('appUserMenu');
    if (!container && !appContainer) return;
    if (currentUser) {
      var adminLink = currentUser.role === 'admin'
        ? '<div class="dropdown-divider"></div><a class="dropdown-item" href="/admin/"><i class="fas fa-shield-alt mr-2"></i>管理后台</a>'
        : '';
      var html =
        '<div class="dropdown d-inline-block">' +
        '  <a href="#" class="dropdown-toggle" data-toggle="dropdown">' +
        '    <i class="fas fa-user-circle mr-1"></i>' + escapeHtml(currentUser.nickname) +
        '  </a>' +
        '  <div class="dropdown-menu dropdown-menu-right">' +
        '    <a class="dropdown-item" href="/user/"><i class="fas fa-user mr-2"></i>个人中心</a>' +
        adminLink +
        '    <div class="dropdown-divider"></div>' +
        '    <a class="dropdown-item" href="#" id="logoutBtn"><i class="fas fa-sign-out-alt mr-2"></i>退出登录</a>' +
        '  </div>' +
        '</div>';
      if (container) container.innerHTML = html;
      if (appContainer) appContainer.innerHTML = html;
      var logoutBtn = document.getElementById('logoutBtn');
      if (logoutBtn) {
        logoutBtn.addEventListener('click', function (e) {
          e.preventDefault();
          logoutUser();
        });
      }
    } else {
      if (container) {
        container.innerHTML =
          '<a href="/user/login/" class="mr-3">登录</a>' +
          '<a href="/user/register/">注册</a>';
      }
      if (appContainer) {
        appContainer.innerHTML =
          '<span class="top-btn" onclick="openAuthModal()" style="width:36px;height:36px;border-radius:8px;border:none;background:transparent;color:var(--text-primary);cursor:pointer;display:inline-flex;align-items:center;justify-content:center;">' +
          '  <i class="fas fa-user"></i>' +
          '</span>';
      }
    }
  }

  function escapeHtml(str) {
    var div = document.createElement('div');
    div.appendChild(document.createTextNode(str));
    return div.innerHTML;
  }

  function initAuth() {
    var userMenu = document.getElementById('user-menu');
    var appUserMenu = document.getElementById('appUserMenu');
    if (!userMenu && !appUserMenu) return;


    var cached = loadAuth();

    api('/auth/me').then(function (data) {
      if (data.user) {
        if (cached && data.user.id !== cached.id) {
          currentUser = cached;
        } else {
          currentUser = data.user;
          saveAuth(data.user);
        }
      } else if (cached) {
        currentUser = cached;
      } else {
        currentUser = null;
        clearAuth();
      }
    }).catch(function () {
      if (cached) {
        currentUser = cached;
      }
    }).finally(function () {
      updateUI();
      initBookmarkButtons();
      initComments();
      initUserSection();
      initAdminSection();
      initCustomNav();
    });

    if (!window._authStorageBound) {
      window._authStorageBound = true;
      window.addEventListener('storage', function (e) {
        if (e.key !== AUTH_KEY) return;
        currentUser = e.newValue ? JSON.parse(e.newValue) : null;
        updateUI();
        initUserSection();
        initAdminSection();
        initCustomNav();
      });
    }
  }

  function refreshCustomNavCache() {
    if (currentUser) {
      api('/bookmarks').then(function (data) {
        try { localStorage.setItem('customNavCache', JSON.stringify(data.bookmarks || [])); } catch (e) {}
        var listEl = document.getElementById('custom-nav-list');
        if (listEl) renderCustomNav(data.bookmarks || []);
      }).catch(function () {});
    }
  }

  function renderCustomNav(bookmarks) {
    var listEl = document.getElementById('custom-nav-list');
    if (!listEl) return;
    if (!bookmarks || bookmarks.length === 0) {
      listEl.innerHTML = '<div class="col-12"><div class="text-center text-muted py-4" style="border:1px dashed #dee2e6;border-radius:8px"><i class="fas fa-star mr-2"></i>点击右侧 + 号添加常用网址，方便快速访问</div></div>';
      return;
    }
    var html = '';
    bookmarks.forEach(function (b) {
      var logo = b.logo || '';
      if (logo && !/^https?:\/\//i.test(logo)) {
        logo = (window.logosPath || '/assets/images/logos/') + logo.replace(/^\//, '');
      }
      var itemId = b.id !== undefined ? b.id : '';
      var linkUrl = b.site_id ? '/site/' + b.site_id + '/' : b.url;
      html +=
        '<div class="url-card col-6 col-sm-6 col-md-4 col-xl-5a col-xxl-6a">' +
        '  <div class="url-body default">' +
        '    <a href="' + linkUrl + '" target="_blank" class="card no-c mb-4">' +
        '      <div class="card-body" style="position:relative">' +
        '        <div class="url-content d-flex align-items-center">' +
        '          <div class="url-img mr-2 d-flex align-items-center justify-content-center">' +
        '<img class="lazy" src="' + (logo || window.defaultLogo || '/assets/images/logos/default.webp') + '" onerror="this.src=\'' + (window.defaultLogo || '/assets/images/logos/default.webp') + '\'" alt="' + escapeHtml(b.title) + '">' +
        '          </div>' +
        '          <div class="url-info flex-fill">' +
        '            <div class="text-sm overflowClip_1"><strong>' + escapeHtml(b.title) + '</strong></div>' +
        '            <p class="overflowClip_1 m-0 text-muted text-xs">' + escapeHtml(b.description || '') + '</p>' +
        '          </div>' +
        '        </div>' +
        '        <button class="btn btn-sm custom-nav-del-btn" data-id="' + itemId + '" data-url="' + b.url.replace(/"/g, '&quot;') + '" title="移除此项"><i class="fas fa-times"></i></button>' +
        '      </div>' +
        '    </a>' +
        '  </div>' +
        '</div>';
    });
    listEl.innerHTML = html;

    listEl.querySelectorAll('.custom-nav-del-btn').forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        if (!confirm('确定移除此项？')) return;
        var id = btn.getAttribute('data-id');
        if (currentUser) {
          api('/bookmarks/' + id, { method: 'DELETE' }).then(function () {
            refreshCustomNavCache();
          }).catch(function (err) {
            alert(err.message);
          });
        } else {
          try {
            var cached = JSON.parse(localStorage.getItem('customNavCache') || '[]');
            var url = btn.getAttribute('data-url');
            cached = cached.filter(function (x) { return x.url !== url; });
            localStorage.setItem('customNavCache', JSON.stringify(cached));
            renderCustomNav(cached);
          } catch (e) {}
        }
      });
    });
  }

  function showCustomNavAddDialog() {
    var existing = document.getElementById('customNavAddModal');
    if (existing) existing.remove();

    var html =
      '<div class="modal fade" id="customNavAddModal" tabindex="-1">' +
      '  <div class="modal-dialog modal-dialog-centered" style="max-width:420px">' +
      '    <div class="modal-content" style="border-radius:12px">' +
      '      <div class="modal-header border-0 pb-0">' +
      '        <h5 class="modal-title"><i class="fas fa-plus-circle mr-2"></i>添加自定义导航</h5>' +
      '        <button type="button" class="close" data-dismiss="modal">&times;</button>' +
      '      </div>' +
      '      <div class="modal-body pt-2 px-4">' +
      '        <div class="form-group">' +
      '          <input type="text" class="form-control" id="navAddTitle" placeholder="标题" required>' +
      '        </div>' +
      '        <div class="form-group">' +
      '          <input type="url" class="form-control" id="navAddUrl" placeholder="网址 (https://...)" required>' +
      '        </div>' +
      '        <div class="form-group">' +
      '          <input type="text" class="form-control" id="navAddDesc" placeholder="描述 (选填)">' +
      '        </div>' +
      '        <div class="form-group">' +
      '          <input type="text" class="form-control" id="navAddLogo" placeholder="图标网址 (选填)">' +
      '        </div>' +
      '        <button type="button" class="btn btn-primary btn-block" id="navAddSubmitBtn">添加</button>' +
      '        <div class="nav-add-error text-danger small mt-2 text-center" style="display:none"></div>' +
      '      </div>' +
      '    </div>' +
      '  </div>' +
      '</div>';
    document.body.insertAdjacentHTML('beforeend', html);

    var m = document.getElementById('customNavAddModal');
    $(m).modal('show');

    document.getElementById('navAddSubmitBtn').addEventListener('click', function () {
      var title = document.getElementById('navAddTitle').value.trim();
      var url = document.getElementById('navAddUrl').value.trim();
      var description = document.getElementById('navAddDesc').value.trim();
      var logo = document.getElementById('navAddLogo').value.trim();
      var errEl = m.querySelector('.nav-add-error');

      if (!title || !url) {
        errEl.textContent = '标题和网址不能为空';
        errEl.style.display = 'block';
        return;
      }

      if (currentUser) {
        api('/bookmarks', { method: 'POST', body: { title: title, url: url, description: description, logo: logo } })
          .then(function () {
            $(m).modal('hide');
            refreshCustomNavCache();
          })
          .catch(function (err) {
            errEl.textContent = err.message;
            errEl.style.display = 'block';
          });
      } else {
        try {
          var cached = JSON.parse(localStorage.getItem('customNavCache') || '[]');
          cached.push({
            id: Date.now() + '_' + Math.random().toString(36).slice(2, 8),
            title: title, url: url, description: description, logo: logo,
          });
          localStorage.setItem('customNavCache', JSON.stringify(cached));
          $(m).modal('hide');
          renderCustomNav(cached);
        } catch (e) {
          errEl.textContent = '保存失败';
          errEl.style.display = 'block';
        }
      }
    });

    $(m).on('hidden.bs.modal', function () { m.remove(); });
  }

  function initCustomNav() {
    var container = document.getElementById('custom-nav-section');
    if (!container) return;

    document.getElementById('customNavAddBtn').addEventListener('click', function () {
      if (!currentUser) {
        window.location.href = '/user/login/';
        return;
      }
      showCustomNavAddDialog();
    });

    if (currentUser) {
      refreshCustomNavCache();
    } else {
      try {
        var cached = localStorage.getItem('customNavCache');
        if (cached) {
          renderCustomNav(JSON.parse(cached));
        } else {
          renderCustomNav([]);
        }
      } catch (e) {
        renderCustomNav([]);
      }
    }
  }

  function initBookmarkButtons() {
    document.querySelectorAll('.bookmark-btn').forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        e.preventDefault();
        if (btn.getAttribute('data-busy') === 'true') return;
        if (!currentUser) {
          window.location.href = '/user/login/';
          return;
        }
        btn.setAttribute('data-busy', 'true');
        var siteId = btn.getAttribute('data-site-id');
        var title = btn.getAttribute('data-title');
        var url = btn.getAttribute('data-url');
        var description = btn.getAttribute('data-description') || '';
        var logo = btn.getAttribute('data-logo') || '';
        if (btn.classList.contains('bookmarked')) {
          var bookmarkId = btn.getAttribute('data-bookmark-id');
          api('/bookmarks/' + bookmarkId, { method: 'DELETE' }).then(function () {
            btn.classList.remove('bookmarked');
            btn.setAttribute('data-bookmark-id', '');
            btn.innerHTML = '<i class="far fa-bookmark mr-1"></i>收藏';
            refreshCustomNavCache();
          }).catch(function (err) {
            alert(err.message);
          }).finally(function () {
            btn.removeAttribute('data-busy');
          });
        } else {
          api('/bookmarks', {
            method: 'POST',
            body: { site_id: siteId ? parseInt(siteId) : null, title: title, url: url, description: description, logo: logo }
          }).then(function (data) {
            btn.classList.add('bookmarked');
            btn.setAttribute('data-bookmark-id', data.bookmark.id);
            btn.innerHTML = '<i class="fas fa-bookmark mr-1"></i>已收藏';
            refreshCustomNavCache();
          }).catch(function (err) {
            alert(err.message);
          }).finally(function () {
            btn.removeAttribute('data-busy');
          });
        }
      });
    });
  }

  function initComments() {
    var container = document.getElementById('comment-section');
    if (!container) return;
    var siteId = container.getAttribute('data-site-id');
    if (!siteId) return;

    function loadComments() {
      api('/comments?site=' + encodeURIComponent(siteId)).then(function (data) {
        renderComments(data.comments);
      });
    }

    function renderComments(comments) {
      var list = container.querySelector('.comment-list');
      if (!list) return;
      if (comments.length === 0) {
        list.innerHTML = '<div class="text-muted text-center py-4">暂无评论，来写第一条吧</div>';
        return;
      }
      var html = '';
      comments.forEach(function (c) {
        var date = new Date(c.created_at + 'Z').toLocaleDateString('zh-CN');
        html +=
          '<div class="comment-item media mb-3 p-3" style="background:#f8f9fa;border-radius:8px">' +
          '  <div class="media-body">' +
          '    <div class="d-flex justify-content-between align-items-center">' +
          '      <strong class="text-dark">' + escapeHtml(c.nickname || '匿名') + '</strong>' +
          '      <small class="text-muted">' + date + '</small>' +
          '    </div>' +
          '    <p class="mb-0 mt-1">' + escapeHtml(c.content) + '</p>' +
          (c.user_id === (currentUser ? currentUser.id : null)
            ? '<button class="btn btn-sm btn-link text-danger p-0 mt-1 delete-comment" data-id="' + c.id + '">删除</button>'
            : '') +
          '  </div>' +
          '</div>';
      });
      list.innerHTML = html;
      list.querySelectorAll('.delete-comment').forEach(function (btn) {
        btn.addEventListener('click', function () {
          var id = btn.getAttribute('data-id');
          if (confirm('确定删除此评论？')) {
            api('/comments/' + id, { method: 'DELETE' }).then(loadComments);
          }
        });
      });
    }

    var form = container.querySelector('.comment-form');
    if (form) {
      form.addEventListener('submit', function (e) {
        e.preventDefault();
        if (!currentUser) {
          window.location.href = '/user/login/';
          return;
        }
        var textarea = form.querySelector('textarea');
        var content = textarea.value.trim();
        if (!content) return;
        var btn = form.querySelector('button[type="submit"]');
        btn.disabled = true;
        api('/comments', { method: 'POST', body: { site_id: siteId, content: content } })
          .then(function () {
            textarea.value = '';
            loadComments();
          })
          .catch(function (err) {
            alert(err.message);
          })
          .finally(function () {
            btn.disabled = false;
          });
      });
    }

    loadComments();
  }

  function initUserSection() {
    var pageEl = document.getElementById('userPage');
    if (!pageEl) return;
    var section = pageEl.getAttribute('data-section') || 'home';

    if (!pageEl._profileReady) {
      pageEl._profileReady = true;
      var hint = document.createElement('div');
      hint.className = 'profile-login-hint';
      hint.style.display = 'none';
      hint.innerHTML = '<p>请先登录</p><a href="/user/login/" class="btn btn-primary">去登录</a>';
      pageEl.insertBefore(hint, pageEl.firstChild);
      pageEl._profileReq = 0;
    }

    var hint = pageEl.querySelector('.profile-login-hint');
    var sections = pageEl.querySelectorAll('.profile-header, .profile-section');

    if (!currentUser) {
      hint.style.display = '';
      sections.forEach(function (el) { el.style.display = 'none'; });
      return;
    }

    hint.style.display = 'none';
    sections.forEach(function (el) { el.style.display = ''; });

    var nicknameEl = document.getElementById('profile-nickname');
    var emailEl = document.getElementById('profile-email');
    if (nicknameEl) nicknameEl.textContent = currentUser.nickname;
    if (emailEl) emailEl.textContent = currentUser.email;

    switch (section) {
      case 'home':
        break;
      case 'profile':
        initChangePwdForm();
        break;
      case 'bookmarks':
        var bl = pageEl.querySelector('.bookmark-list');
        if (!bl) break;
        loadUserBookmarks(bl, pageEl);
        break;
      case 'comments':
        var cl = pageEl.querySelector('.my-comments-list');
        if (!cl) break;
        loadUserComments(cl, pageEl);
        break;
    }
  }

  function loadUserBookmarks(container, pageEl) {
    var reqId = ++pageEl._profileReq;
    container.innerHTML = '<div class="text-muted text-center py-3">加载中...</div>';
    api('/bookmarks').then(function (data) {
      if (reqId !== pageEl._profileReq) return;
      if (data.bookmarks.length === 0) {
        container.innerHTML = '<div class="text-muted text-center py-3">还没有收藏任何网站</div>';
      } else {
        var html = '';
        data.bookmarks.forEach(function (b) {
          var logo = b.logo || '';
          if (logo && !/^https?:\/\//i.test(logo)) {
            logo = (window.logosPath || '/assets/images/logos/') + logo.replace(/^\//, '');
          }
          html +=
            '<div class="bookmark-item d-flex justify-content-between align-items-center p-3 mb-2" style="background:#f8f9fa;border-radius:8px">' +
            '  <div class="d-flex align-items-center" style="min-width:0">' +
            (logo ? '    <img src="' + logo + '" alt="" class="mr-3" style="width:32px;height:32px;border-radius:4px;object-fit:contain;flex-shrink:0">' : '') +
            '    <div style="min-width:0">' +
            '      <a href="' + b.url + '" target="_blank" class="text-dark font-weight-bold text-truncate d-block">' + escapeHtml(b.title) + '</a>' +
            '      <p class="small text-muted mb-0 text-truncate">' + escapeHtml(b.description || '') + '</p>' +
            '    </div>' +
            '  </div>' +
            '  <button class="btn btn-sm btn-outline-danger ml-2 delete-bookmark flex-shrink-0" data-id="' + b.id + '">删除</button>' +
            '</div>';
        });
        container.innerHTML = html;
        container.querySelectorAll('.delete-bookmark').forEach(function (btn) {
          btn.addEventListener('click', function () {
            var id = btn.getAttribute('data-id');
            if (confirm('确定删除此收藏？')) {
              api('/bookmarks/' + id, { method: 'DELETE' }).then(function () {
                btn.closest('.bookmark-item').remove();
                refreshCustomNavCache();
              }).catch(function (err) {
                alert(err.message);
              });
            }
          });
        });
      }
    }).catch(function () {
      if (reqId !== pageEl._profileReq) return;
      container.innerHTML = '<div class="text-danger text-center py-3">加载失败</div>';
    });
  }

  function loadUserComments(container, pageEl) {
    var reqId = ++pageEl._profileReq;
    container.innerHTML = '<div class="text-muted text-center py-3">加载中...</div>';
    api('/comments?mine=1').then(function (data) {
      if (reqId !== pageEl._profileReq) return;
      if (data.comments.length === 0) {
        container.innerHTML = '<div class="text-muted text-center py-3">还没有发表任何评论</div>';
      } else {
        var html = '';
        data.comments.forEach(function (c) {
          var date = new Date(c.created_at + 'Z').toLocaleDateString('zh-CN');
          html +=
            '<div class="comment-item p-3 mb-2" style="background:#f8f9fa;border-radius:8px">' +
            '  <div class="d-flex justify-content-between align-items-start">' +
            '    <div style="min-width:0">' +
            '      <p class="mb-1">' + escapeHtml(c.content) + '</p>' +
            '      <small class="text-muted">站点: ' + escapeHtml(c.site_id) + ' · ' + date + '</small>' +
            '    </div>' +
            '    <button class="btn btn-sm btn-link text-danger p-0 ml-2 delete-my-comment flex-shrink-0" data-id="' + c.id + '">删除</button>' +
            '  </div>' +
            '</div>';
        });
        container.innerHTML = html;
        container.querySelectorAll('.delete-my-comment').forEach(function (btn) {
          btn.addEventListener('click', function () {
            var id = btn.getAttribute('data-id');
            if (confirm('确定删除此评论？')) {
              api('/comments/' + id, { method: 'DELETE' }).then(function () {
                btn.closest('.comment-item').remove();
              });
            }
          });
        });
      }
    }).catch(function () {
      if (reqId !== pageEl._profileReq) return;
      container.innerHTML = '<div class="text-danger text-center py-3">加载失败</div>';
    });
  }

  function initChangePwdForm() {
    var form = document.getElementById('changePwdForm');
    if (!form) return;
    if (form._pwdBound) return;
    form._pwdBound = true;
    var errEl = form.querySelector('.change-pwd-error');
    var okEl = form.querySelector('.change-pwd-success');
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var cur = document.getElementById('curPwd').value;
      var np = document.getElementById('newPwd').value;
      var confirm = document.getElementById('confirmPwd').value;
      errEl.style.display = 'none';
      okEl.style.display = 'none';
      if (!cur || !np || !confirm) {
        errEl.textContent = '请填写所有字段';
        errEl.style.display = 'block';
        return;
      }
      if (np.length < 6) {
        errEl.textContent = '新密码至少6位';
        errEl.style.display = 'block';
        return;
      }
      if (np !== confirm) {
        errEl.textContent = '两次输入的新密码不一致';
        errEl.style.display = 'block';
        return;
      }
      var btn = form.querySelector('.change-pwd-btn');
      btn.disabled = true;
      btn.textContent = '修改中...';
      api('/auth/change-password', { method: 'POST', body: { currentPassword: cur, newPassword: np } })
        .then(function () {
          okEl.textContent = '密码修改成功';
          okEl.style.display = 'block';
          form.reset();
        })
        .catch(function (err) {
          errEl.textContent = err.message;
          errEl.style.display = 'block';
        })
        .finally(function () {
          btn.disabled = false;
          btn.textContent = '修改密码';
        });
    });
  }

  function initAdmin() {
    var container = document.getElementById('admin-page');
    if (!container) return;
    if (!currentUser || currentUser.role !== 'admin') {
      container.innerHTML = '<div class="text-center py-5"><p class="text-danger">权限不足</p></div>';
      return;
    }

    var usersPanel = document.getElementById('admin-users-panel');
    var commentsPanel = document.getElementById('admin-comments-panel');
    var submissionsPanel = document.getElementById('admin-submissions-panel');
    var passwordPanel = document.getElementById('admin-password-panel');
    var policiesPanel = document.getElementById('admin-policies-panel');
    var usersTable = usersPanel.querySelector('.admin-users-table');
    var commentsList = commentsPanel.querySelector('.admin-comments-list');
    var submissionsList = submissionsPanel ? submissionsPanel.querySelector('.admin-submissions-list') : null;
    var policiesTable = policiesPanel ? policiesPanel.querySelector('.admin-policies-table') : null;

    document.querySelectorAll('#adminTabs .nav-link').forEach(function (tab) {
      tab.addEventListener('click', function (e) {
        e.preventDefault();
        document.querySelectorAll('#adminTabs .nav-link').forEach(function (t) { t.classList.remove('active'); });
        this.classList.add('active');
        var tabName = this.getAttribute('data-tab');
        usersPanel.style.display = tabName === 'users' ? 'block' : 'none';
        commentsPanel.style.display = tabName === 'comments' ? 'block' : 'none';
        if (submissionsPanel) submissionsPanel.style.display = tabName === 'submissions' ? 'block' : 'none';
        if (passwordPanel) passwordPanel.style.display = tabName === 'password' ? 'block' : 'none';
        if (policiesPanel) {
          policiesPanel.style.display = tabName === 'policies' ? 'block' : 'none';
          if (tabName === 'policies') loadPolicies();
        }
      });
    });

    function loadPolicies(search) {
      if (!policiesTable) return;
      var url = '/admin/policies';
      if (search) url += '?search=' + encodeURIComponent(search);
      api(url).then(function (data) {
        var policies = data.policies || [];
        _cachedPolicies = policies;
        if (policies.length === 0) {
          policiesTable.innerHTML = '<div class="text-muted text-center py-3">暂无政策数据</div>';
          return;
        }
        var html =
          '<table class="table table-hover">' +
          '<thead><tr><th>ID</th><th>名称</th><th>城市</th><th>发布机构</th><th>日期</th><th>状态</th><th style="width:180px">操作</th></tr></thead><tbody>';
        policies.forEach(function (p) {
          var statusMap = { active: '进行中', upcoming: '即将实施', ended: '已结束' };
          var statusText = statusMap[p.status] || p.status;
          html +=
            '<tr>' +
            '<td><small class="text-muted">' + escapeHtml(p.id) + '</small></td>' +
            '<td>' + escapeHtml(p.name) + '</td>' +
            '<td>' + escapeHtml(p.city) + '</td>' +
            '<td>' + escapeHtml(p.issuer || '-') + '</td>' +
            '<td><small>' + escapeHtml(p.publish_date || '-') + '</small></td>' +
            '<td><span class="badge ' + (p.status === 'active' ? 'badge-success' : p.status === 'upcoming' ? 'badge-warning' : 'badge-secondary') + '">' + statusText + '</span></td>' +
            '<td>' +
            '<button class="btn btn-sm btn-outline-primary mr-1 policy-edit" data-id="' + escapeHtml(p.id) + '">编辑</button>' +
            '<button class="btn btn-sm btn-outline-danger policy-delete" data-id="' + escapeHtml(p.id) + '">删除</button>' +
            '</td>' +
            '</tr>';
        });
        html += '</tbody></table>';
        policiesTable.innerHTML = html;

        policiesTable.querySelectorAll('.policy-edit').forEach(function (btn) {
          btn.addEventListener('click', function () {
            var id = btn.getAttribute('data-id');
            api('/admin/policies/' + id).then(function (policy) {
              openPolicyModal(policy);
            }).catch(function (err) {
              alert(err.message);
            });
          });
        });

        policiesTable.querySelectorAll('.policy-delete').forEach(function (btn) {
          btn.addEventListener('click', function () {
            var id = btn.getAttribute('data-id');
            if (confirm('确定要删除此政策？')) {
              api('/admin/policies/' + id, { method: 'DELETE' }).then(function () {
                loadPolicies(document.getElementById('policySearch').value);
              }).catch(function (err) {
                alert(err.message);
              });
            }
          });
        });
      }).catch(function (err) {
        policiesTable.innerHTML = '<div class="text-danger text-center py-3">加载失败: ' + err.message + '</div>';
      });
    }

    function openPolicyModal(policy) {
      if (!policy) return;
      document.getElementById('pf_id').value = policy.id || '';
      document.getElementById('pf_name').value = policy.name || '';
      document.getElementById('pf_city').value = policy.city || '';
      document.getElementById('pf_province').value = policy.province || '';
      document.getElementById('pf_issuer').value = policy.issuer || '';
      document.getElementById('pf_publish_date').value = policy.publish_date || '';
      document.getElementById('pf_level').value = policy.level || 'city';
      document.getElementById('pf_status').value = policy.status || 'active';
      document.getElementById('pf_summary').value = policy.summary || '';
      document.getElementById('pf_official_url').value = (policy.links && policy.links.official) || '';
      document.getElementById('pf_news_url').value = (policy.links && policy.links.news && policy.links.news[0]) || '';

      var container = document.getElementById('benefits-container');
      container.innerHTML = '';
      var benefits = policy.benefits || [];
      if (benefits.length === 0) {
        addBenefitRow(container);
      } else {
        benefits.forEach(function (b) {
          addBenefitRow(container, b.item || '', b.amount || '', b.type || 'voucher');
        });
      }
      $('#policyModal').modal('show');
    }

    function addBenefitRow(container, item, amount, type) {
      var row = document.createElement('div');
      row.className = 'benefit-row d-flex gap-2 mb-1';
      row.innerHTML =
        '<input type="text" class="form-control form-control-sm" placeholder="项目名" style="width:30%" value="' + escapeHtml(item || '') + '">' +
        '<input type="text" class="form-control form-control-sm" placeholder="金额/说明" style="width:40%" value="' + escapeHtml(amount || '') + '">' +
        '<select class="form-control form-control-sm" style="width:20%">' +
        '<option value="voucher"' + (type === 'voucher' ? ' selected' : '') + '>券</option>' +
        '<option value="cash"' + (type === 'cash' ? ' selected' : '') + '>现金</option>' +
        '<option value="loan"' + (type === 'loan' ? ' selected' : '') + '>贷款</option>' +
        '<option value="other"' + (type === 'other' ? ' selected' : '') + '>其他</option>' +
        '</select>' +
        '<button type="button" class="btn btn-sm btn-outline-danger benefit-remove">×</button>';
      container.appendChild(row);
      row.querySelector('.benefit-remove').addEventListener('click', function () {
        row.remove();
      });
    }

    function collectBenefits() {
      var rows = document.querySelectorAll('#benefits-container .benefit-row');
      var benefits = [];
      rows.forEach(function (row) {
        var inputs = row.querySelectorAll('input');
        var select = row.querySelector('select');
        var item = inputs[0] ? inputs[0].value.trim() : '';
        var amount = inputs[1] ? inputs[1].value.trim() : '';
        var type = select ? select.value : 'voucher';
        if (item || amount) {
          benefits.push({ item: item, amount: amount, type: type });
        }
      });
      return benefits;
    }

    function savePolicy() {
      var id = document.getElementById('pf_id').value;
      var data = {
        name: document.getElementById('pf_name').value.trim(),
        city: document.getElementById('pf_city').value.trim(),
        province: document.getElementById('pf_province').value.trim(),
        issuer: document.getElementById('pf_issuer').value.trim(),
        publish_date: document.getElementById('pf_publish_date').value,
        level: document.getElementById('pf_level').value,
        status: document.getElementById('pf_status').value,
        summary: document.getElementById('pf_summary').value.trim(),
        benefits: collectBenefits(),
        links: {}
      };
      var officialUrl = document.getElementById('pf_official_url').value.trim();
      var newsUrl = document.getElementById('pf_news_url').value.trim();
      if (officialUrl) data.links.official = officialUrl;
      if (newsUrl) data.links.news = [newsUrl];
      if (!data.name || !data.city) {
        alert('名称和城市为必填项');
        return;
      }
      var method = id ? 'PUT' : 'POST';
      var url = id ? '/admin/policies/' + encodeURIComponent(id) : '/admin/policies';
      if (!id) {
        var code = CITY_CODES[data.city];
        if (!code) { alert('无法识别城市编码，请先选择有效城市'); return; }
        var prefix = code + '-';
        var maxSeq = 99;
        _cachedPolicies.forEach(function(p) {
          if (p.id && p.id.indexOf(prefix) === 0) {
            var num = parseInt(p.id.slice(prefix.length), 10);
            if (!isNaN(num) && num > maxSeq) maxSeq = num;
          }
        });
        data.id = prefix + (maxSeq + 1);
      }
      var btn = document.getElementById('policySaveBtn');
      btn.disabled = true;
      btn.textContent = '保存中...';
      api(url, { method: method, body: data }).then(function () {
        $('#policyModal').modal('hide');
        loadPolicies(document.getElementById('policySearch').value);
      }).catch(function (err) {
        alert(err.message);
      }).finally(function () {
        btn.disabled = false;
        btn.textContent = '保存';
      });
    }

    // --- policies tab event bindings ---
    if (policiesPanel) {
      document.getElementById('policySearchBtn').addEventListener('click', function () {
        loadPolicies(document.getElementById('policySearch').value);
      });
      document.getElementById('policySearch').addEventListener('keyup', function (e) {
        if (e.key === 'Enter') loadPolicies(this.value);
      });
      document.getElementById('policyImportBtn').addEventListener('click', function () {
        document.getElementById('policyFileInput').click();
      });
      document.getElementById('policyFileInput').addEventListener('change', function (e) {
        var file = e.target.files[0];
        if (!file) return;
        var reader = new FileReader();
        reader.onload = function (ev) {
          try {
            var json = JSON.parse(ev.target.result);
            var arr = Array.isArray(json) ? json : (json.policies || []);
            if (arr.length === 0) { alert('JSON 格式错误，需要 policies 数组'); return; }
            api('/admin/policies/import', { method: 'POST', body: { policies: arr } }).then(function (res) {
              alert('导入完成: ' + res.imported + '/' + res.total + ' 条');
              loadPolicies(document.getElementById('policySearch').value);
            }).catch(function (err) {
              alert(err.message);
            });
          } catch (err) {
            alert('JSON 解析失败: ' + err.message);
          }
        };
        reader.readAsText(file);
        e.target.value = '';
      });
      document.getElementById('policyExportBtn').addEventListener('click', function () {
        api('/admin/policies/export').then(function (data) {
          var blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
          var url = URL.createObjectURL(blob);
          var a = document.createElement('a');
          a.href = url;
          a.download = 'policies-' + new Date().toISOString().slice(0, 10) + '.json';
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
        }).catch(function (err) {
          alert(err.message);
        });
      });
      document.getElementById('benefitAddBtn').addEventListener('click', function () {
        addBenefitRow(document.getElementById('benefits-container'));
      });
      document.getElementById('policySaveBtn').addEventListener('click', savePolicy);
      $('#policyModal').on('hidden.bs.modal', function () {
        document.getElementById('pf_id').value = '';
      });
    }

    function loadUsers() {
      api('/admin/users').then(function (data) {
        if (data.users.length === 0) {
          usersTable.innerHTML = '<div class="text-muted text-center py-3">暂无用户</div>';
          return;
        }
        var html =
          '<table class="table table-hover">' +
          '<thead><tr><th>ID</th><th>邮箱</th><th>昵称</th><th>角色</th><th>注册时间</th><th>登录IP</th><th>操作</th></tr></thead><tbody>';
        data.users.forEach(function (u) {
          var date = u.created_at ? new Date(u.created_at + 'Z').toLocaleDateString('zh-CN') : '-';
          var isSelf = currentUser && currentUser.id === u.id;
          html +=
            '<tr>' +
            '<td>' + u.id + '</td>' +
            '<td>' + escapeHtml(u.email) + '</td>' +
            '<td>' + escapeHtml(u.nickname || '-') + '</td>' +
            '<td><span class="badge ' + (u.role === 'admin' ? 'badge-danger' : 'badge-secondary') + '">' + u.role + '</span></td>' +
            '<td>' + date + '</td>' +
            '<td style="max-width:160px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-family:monospace;font-size:12px">' + escapeHtml(u.last_login_ip || '-') + '</td>' +
            '<td>' +
            (isSelf ? '<span class="text-muted small">当前用户</span>' :
              '<button class="btn btn-sm btn-outline-warning mr-1 toggle-role" data-id="' + u.id + '" data-role="' + u.role + '">' + (u.role === 'admin' ? '取消管理员' : '设为管理员') + '</button>' +
              '<button class="btn btn-sm btn-outline-danger delete-admin-user" data-id="' + u.id + '">删除</button>') +
            '</td>' +
            '</tr>';
        });
        html += '</tbody></table>';
        usersTable.innerHTML = html;

        usersTable.querySelectorAll('.toggle-role').forEach(function (btn) {
          btn.addEventListener('click', function () {
            var id = btn.getAttribute('data-id');
            var curRole = btn.getAttribute('data-role');
            var newRole = curRole === 'admin' ? 'user' : 'admin';
            api('/admin/users/' + id + '/role', { method: 'PATCH', body: { role: newRole } }).then(function () {
              loadUsers();
            }).catch(function (err) {
              alert(err.message);
            });
          });
        });

        usersTable.querySelectorAll('.delete-admin-user').forEach(function (btn) {
          btn.addEventListener('click', function () {
            var id = btn.getAttribute('data-id');
            if (confirm('确定要删除此用户及其所有收藏和评论？')) {
              api('/admin/users/' + id, { method: 'DELETE' }).then(function () {
                loadUsers();
              }).catch(function (err) {
                alert(err.message);
              });
            }
          });
        });
      }).catch(function (err) {
        usersTable.innerHTML = '<div class="text-danger text-center py-3">加载失败: ' + err.message + '</div>';
      });
    }

    function loadComments() {
      api('/admin/comments').then(function (data) {
        if (data.comments.length === 0) {
          commentsList.innerHTML = '<div class="text-muted text-center py-3">暂无评论</div>';
          return;
        }
        var html = '';
        data.comments.forEach(function (c) {
          var date = new Date(c.created_at + 'Z').toLocaleDateString('zh-CN');
          html +=
            '<div class="comment-item p-3 mb-2 d-flex justify-content-between align-items-start" style="background:#f8f9fa;border-radius:8px">' +
            '  <div style="min-width:0">' +
            '    <p class="mb-1">' + escapeHtml(c.content) + '</p>' +
            '    <small class="text-muted">' + escapeHtml(c.nickname || '匿名') + ' (' + escapeHtml(c.email || '') + ') · ' + date + '</small>' +
            '  </div>' +
            '  <button class="btn btn-sm btn-outline-danger ml-2 flex-shrink-0 delete-admin-comment" data-id="' + c.id + '">删除</button>' +
            '</div>';
        });
        commentsList.innerHTML = html;

        commentsList.querySelectorAll('.delete-admin-comment').forEach(function (btn) {
          btn.addEventListener('click', function () {
            var id = btn.getAttribute('data-id');
            if (confirm('确定删除此评论？')) {
              api('/admin/comments/' + id, { method: 'DELETE' }).then(function () {
                loadComments();
              }).catch(function (err) {
                alert(err.message);
              });
            }
          });
        });
      }).catch(function (err) {
        commentsList.innerHTML = '<div class="text-danger text-center py-3">加载失败: ' + err.message + '</div>';
      });
    }

    function loadSubmissions() {
      if (!submissionsList) return;
      api('/admin/submissions').then(function (data) {
        if (data.submissions.length === 0) {
          submissionsList.innerHTML = '<div class="text-muted text-center py-3">暂无入驻申请</div>';
          return;
        }
        var html = '';
        data.submissions.forEach(function (s) {
          var date = s.created_at ? new Date(s.created_at + 'Z').toLocaleDateString('zh-CN') : '-';
          var statusBadge = s.status === 'approved' ? 'badge-success' : s.status === 'rejected' ? 'badge-danger' : 'badge-warning';
          var statusText = s.status === 'approved' ? '已通过' : s.status === 'rejected' ? '已拒绝' : '待审核';
          html +=
            '<div class="p-3 mb-2" style="background:#f8f9fa;border-radius:8px">' +
            '  <div class="d-flex justify-content-between align-items-start">' +
            '    <div style="min-width:0">' +
            '      <strong>' + escapeHtml(s.name) + '</strong>' +
            '      <span class="badge ' + statusBadge + ' ml-2" style="font-size:11px">' + statusText + '</span>' +
            '      <p class="small text-muted mb-1 mt-1">' + escapeHtml(s.summary) + '</p>' +
            '      <small class="text-muted">' + escapeHtml(s.city) + ' · ' + escapeHtml(s.contact_name) + ' · ' + date + '</small>' +
            '    </div>' +
            '    <div class="ml-2 flex-shrink-0">' +
            (s.status === 'pending' ?
              '<button class="btn btn-sm btn-outline-success mr-1 approve-sub" data-id="' + s.id + '">通过</button>' +
              '<button class="btn btn-sm btn-outline-danger mr-1 reject-sub" data-id="' + s.id + '">拒绝</button>'
              : '') +
            '      <button class="btn btn-sm btn-outline-secondary delete-sub" data-id="' + s.id + '">删除</button>' +
            '    </div>' +
            '  </div>' +
            '</div>';
        });
        submissionsList.innerHTML = html;

        submissionsList.querySelectorAll('.approve-sub').forEach(function (btn) {
          btn.addEventListener('click', function () {
            api('/admin/submissions/' + btn.getAttribute('data-id') + '/status', { method: 'PATCH', body: { status: 'approved' } }).then(loadSubmissions);
          });
        });
        submissionsList.querySelectorAll('.reject-sub').forEach(function (btn) {
          btn.addEventListener('click', function () {
            api('/admin/submissions/' + btn.getAttribute('data-id') + '/status', { method: 'PATCH', body: { status: 'rejected' } }).then(loadSubmissions);
          });
        });
        submissionsList.querySelectorAll('.delete-sub').forEach(function (btn) {
          btn.addEventListener('click', function () {
            if (confirm('确定删除此申请？')) {
              api('/admin/submissions/' + btn.getAttribute('data-id'), { method: 'DELETE' }).then(loadSubmissions);
            }
          });
        });
      }).catch(function (err) {
        if (submissionsList) submissionsList.innerHTML = '<div class="text-danger text-center py-3">加载失败: ' + err.message + '</div>';
      });
    }

    loadUsers();
    loadComments();
    loadSubmissions();
    initChangePwdForm();
  }

  function initSubmitPage() {
    var container = document.getElementById('submit-page');
    if (!container) return;

    var form = document.getElementById('submitForm');
    if (!form) return;

    var catGrid = document.getElementById('categoryGrid');
    var catLeft = document.getElementById('catLeft');
    var catRight = document.getElementById('catRightPanel');
    var catCount = document.getElementById('catCount');
    var catError = container.querySelector('.cat-error');

    function switchCategory(targetId) {
      catLeft.querySelectorAll('.cat-left-item').forEach(function (el) {
        el.classList.toggle('active', el.getAttribute('data-target') === targetId);
      });
      catRight.querySelectorAll('.cat-group-items').forEach(function (el) {
        el.style.display = el.id === targetId ? 'flex' : 'none';
      });
    }

    catLeft.addEventListener('click', function (e) {
      var item = e.target.closest('.cat-left-item');
      if (!item) return;
      switchCategory(item.getAttribute('data-target'));
    });

    catRight.addEventListener('change', function (e) {
      if (e.target.type === 'checkbox') {
        setTimeout(function () {
          var checked = catGrid.querySelectorAll('input[type="checkbox"]:checked');
          catCount.textContent = checked.length;
          if (checked.length > 3) {
            e.target.checked = false;
            catCount.textContent = '3';
            catError.textContent = '最多选择3个分类';
            catError.style.display = 'block';
            setTimeout(function () { catError.style.display = 'none'; }, 2000);
          }
        }, 0);
      }
    });

    var firstItem = catLeft.querySelector('.cat-left-item');
    if (firstItem) switchCategory(firstItem.getAttribute('data-target'));

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var btn = document.getElementById('submitBtn');
      var errEl = container.querySelector('.submit-error');

      var checked = catGrid.querySelectorAll('input[type="checkbox"]:checked');
      if (checked.length === 0) {
        errEl.textContent = '请至少选择一个网站分类';
        errEl.style.display = 'block';
        return;
      }

      var categories = [];
      checked.forEach(function (cb) { categories.push(cb.value); });

      btn.disabled = true;
      btn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>提交中...';

      api('/submissions', {
        method: 'POST',
        body: {
          name: document.querySelector('input[name="name"]').value.trim(),
          logo: document.querySelector('input[name="logo"]').value.trim(),
          city: document.querySelector('input[name="city"]').value.trim(),
          categories: categories,
          summary: document.querySelector('input[name="summary"]').value.trim(),
          detail: document.querySelector('textarea[name="detail"]').value.trim(),
          tags: [],
          website: document.querySelector('input[name="website"]').value.trim(),
          wechat: document.querySelector('input[name="wechat"]').value.trim(),
          contact_name: document.querySelector('input[name="contact_name"]').value.trim(),
          contact_phone: document.querySelector('input[name="contact_phone"]').value.trim(),
          notes: document.querySelector('textarea[name="notes"]').value.trim(),
        },
      })
        .then(function () {
          form.style.display = 'none';
          document.getElementById('submitSuccess').style.display = 'block';
        })
        .catch(function (err) {
          errEl.textContent = err.message;
          errEl.style.display = 'block';
        })
        .finally(function () {
          btn.disabled = false;
          btn.innerHTML = '<i class="fas fa-paper-plane mr-2"></i>提交入驻申请';
        });
    });
  }

  // ═══════════════════════════════════════════
  // ── RBAC Data & Permission Management ──
  // ═══════════════════════════════════════════

  var RBAC_ROLES = {
    guest: { id:'guest',  name:'游客',     level:0 },
    user:  { id:'user',   name:'普通用户',  level:10 },
    vip:   { id:'vip',    name:'VIP会员',   level:20 },
    svip:  { id:'svip',   name:'SVIP会员',  level:30 },
    admin: { id:'admin',  name:'超级管理员', level:999 }
  };

  var RBAC_PERMISSIONS = {
    'workspace.view':          '访问工作台',
    'workspace.bookmark':      '收藏管理',
    'workspace.comment':       '评论管理',
    'roadmap.use':             '创办一人公司',
    'admin.users.view':        '查看用户列表',
    'admin.users.manage':      '管理用户角色',
    'admin.membership.manage': '管理会员等级',
    'admin.permissions.manage':'管理权限配置'
  };

  var RBAC_ROLE_PERMISSIONS = {
    guest: [],
    user:   ['workspace.view','workspace.bookmark','workspace.comment'],
    vip:    ['workspace.view','workspace.bookmark','workspace.comment','roadmap.use'],
    svip:   ['workspace.view','workspace.bookmark','workspace.comment','roadmap.use'],
    admin:  Object.keys(RBAC_PERMISSIONS)
  };

  function rbacLoadConfig() {
    try { return JSON.parse(localStorage.getItem('permissions_config') || 'null'); } catch(e) { return null; }
  }

  function rbacSaveConfig(config) {
    try { localStorage.setItem('permissions_config', JSON.stringify(config)); } catch(e) {}
  }

  function rbacGetEffectivePerms(role) {
    var defaults = RBAC_ROLE_PERMISSIONS[role] || [];
    var overrides = rbacLoadConfig();
    if (!overrides || !overrides[role]) return defaults;
    var merged = [];
    var allPerms = Object.keys(RBAC_PERMISSIONS);
    for (var i = 0; i < allPerms.length; i++) {
      var p = allPerms[i];
      if (overrides[role].indexOf(p) !== -1) merged.push(p);
    }
    return merged;
  }

  window.renderPermissionsPanel = function renderPermissionsPanel(gridId) {
    var grid = document.getElementById(gridId || 'adminPermsGrid');
    if (!grid) return;
    var allPerms = Object.keys(RBAC_PERMISSIONS);
    var config = rbacLoadConfig() || {};
    var html = '';
    var roleIds = ['user', 'vip', 'svip', 'admin'];
    for (var ri = 0; ri < roleIds.length; ri++) {
      var rid = roleIds[ri];
      var role = RBAC_ROLES[rid];
      if (!role) continue;
      var rolePerms = config[rid] || RBAC_ROLE_PERMISSIONS[rid] || [];
      var items = '';
      for (var pi = 0; pi < allPerms.length; pi++) {
        var p = allPerms[pi];
        var checked = rolePerms.indexOf(p) !== -1;
        var disabled = rid === 'admin' ? ' disabled' : '';
        items += '<label class="perms-toggle' + (checked ? ' checked' : '') + disabled + '">' +
          '<input type="checkbox" value="' + p + '"' + (checked ? ' checked' : '') + disabled +
          ' onchange="togglePermission(\'' + rid + '\',\'' + p + '\',this.checked)">' +
          '<span class="perms-toggle-label">' + RBAC_PERMISSIONS[p] + '</span>' +
          '</label>';
      }
      html += '<div class="perms-role-section">' +
        '<div class="perms-role-header">' +
        '<span class="perms-role-badge" style="background:' + (rid === 'admin' ? 'var(--accent-red)' : rid === 'svip' ? '#AF52DE' : rid === 'vip' ? '#FFA500' : 'var(--bg-secondary)') + ';">' + role.name + '</span>' +
        '<span class="perms-count">' + rolePerms.length + ' / ' + allPerms.length + ' 项权限</span>' +
        '</div>' +
        '<div class="perms-items">' + items + '</div>' +
        '</div>';
    }
    grid.innerHTML = html;
  };

  window.togglePermission = function togglePermission(roleId, perm, checked) {
    if (roleId === 'admin') return;
    var config = rbacLoadConfig() || {};
    if (!config[roleId]) config[roleId] = (RBAC_ROLE_PERMISSIONS[roleId] || []).slice();
    var idx = config[roleId].indexOf(perm);
    if (checked && idx === -1) config[roleId].push(perm);
    if (!checked && idx !== -1) config[roleId].splice(idx, 1);
    rbacSaveConfig(config);
    window.renderPermissionsPanel();
  };

  window.resetPermissions = function resetPermissions() {
    if (!confirm('确定恢复所有角色的权限为默认值？')) return;
    localStorage.removeItem('permissions_config');
    window.renderPermissionsPanel();
  };

  window.renderRolesPanel = function renderRolesPanel(containerId) {
    var container = document.getElementById(containerId || 'adminRolesContainer');
    if (!container) return;
    var html = '';
    var allPerms = Object.keys(RBAC_PERMISSIONS);
    var roleIds = ['guest', 'user', 'vip', 'svip', 'admin'];
    for (var ri = 0; ri < roleIds.length; ri++) {
      var rid = roleIds[ri];
      var role = RBAC_ROLES[rid];
      if (!role) continue;
      var perms = RBAC_ROLE_PERMISSIONS[rid] || [];
      var badgeColor = rid === 'admin' ? 'var(--accent-red)' : rid === 'svip' ? '#AF52DE' : rid === 'vip' ? '#FFA500' : rid === 'user' ? '#007AFF' : 'var(--text-tertiary)';
      html += '<div class="app-card app-card-sm mb-2">' +
        '<div class="d-flex justify-content-between align-items-center mb-2">' +
        '<div><span class="app-badge" style="background:' + badgeColor + ';color:#fff;padding:4px 12px;border-radius:6px;">' + role.name + '</span>' +
        '<span class="text-muted" style="margin-left:12px;font-size:12px;">等级 ' + role.level + '</span></div>' +
        '<span class="text-muted" style="font-size:12px;">' + perms.length + ' / ' + allPerms.length + ' 项默认权限</span></div>' +
        '<div style="display:flex;flex-wrap:wrap;gap:6px;">';
      for (var pi = 0; pi < allPerms.length; pi++) {
        var p = allPerms[pi];
        var has = perms.indexOf(p) !== -1;
        html += '<span class="app-badge ' + (has ? 'app-badge-success' : 'app-badge-secondary') + '" style="font-size:11px;">' +
          RBAC_PERMISSIONS[p] + '</span>';
      }
      html += '</div></div>';
    }
    container.innerHTML = html;
  };

  // ═══════════════════════════════════════════
  // ── Section-based Admin Init ──
  // ═══════════════════════════════════════════

  function initAdminSection() {
    var pageEl = document.getElementById('adminPage');
    if (!pageEl) return;
    var section = pageEl.getAttribute('data-section');
    if (!section) return;
    if (!currentUser) {
      var cached = loadAuth();
      if (cached) currentUser = cached;
    }
    if (!currentUser || currentUser.role !== 'admin') {
      pageEl.innerHTML = '<div class="text-center py-5"><p class="text-danger">' + escapeHtml('权限不足') + '</p></div>';
      return;
    }
    switch (section) {
      case 'dashboard':
        api('/admin/users').then(function (data) {
          var users = data.users || [];
          document.getElementById('statUsers').textContent = users.length;
        }).catch(function () {});
        api('/admin/comments').then(function (data) {
          var comments = data.comments || [];
          document.getElementById('statComments').textContent = comments.length;
        }).catch(function () {});
        api('/admin/submissions').then(function (data) {
          var submissions = data.submissions || [];
          document.getElementById('statSubmissions').textContent = submissions.length;
          var pending = submissions.filter(function (s) { return s.status === 'pending'; });
          document.getElementById('statPending').textContent = pending.length;
        }).catch(function () {});
        break;
      case 'users':
        adminPageLoadUsers();
        break;
      case 'comments':
        adminPageLoadComments();
        break;
      case 'submissions':
        adminPageLoadSubmissions();
        break;
      case 'permissions':
        window.renderPermissionsPanel('adminPermsGrid');
        break;
      case 'bookmarks':
        adminPageLoadBookmarks();
        break;
      case 'policies':
        adminPageLoadPolicies();
        bindPolicyPageEvents();
        break;
      case 'roles':
        window.renderRolesPanel('adminRolesContainer');
        break;
    }
  }

  // Expose user management functions on window
  window.toggleUserRole = function toggleUserRole(userId, curRole) {
    var newRole = curRole === 'admin' ? 'user' : 'admin';
    api('/admin/users/' + userId + '/role', { method: 'PATCH', body: { role: newRole } })
      .then(function () { adminPageLoadUsers(); })
      .catch(function (err) { alert(err.message); });
  };

  window.cycleVipLevel = function cycleVipLevel(userId, currentLevel) {
    var levels = ['', 'vip', 'svip'];
    var idx = levels.indexOf(currentLevel);
    var nextLevel = levels[(idx + 1) % levels.length];
    try {
      var p = JSON.parse(localStorage.getItem('user_profiles') || '{}');
      if (!p[userId]) p[userId] = {};
      p[userId].vip_level = nextLevel;
      localStorage.setItem('user_profiles', JSON.stringify(p));
    } catch (e) {}
    adminPageLoadUsers();
  };

  window.cycleUserType = function cycleUserType(userId, currentType) {
    var newType = currentType === 'personal' ? 'enterprise' : 'personal';
    try {
      var p = JSON.parse(localStorage.getItem('user_profiles') || '{}');
      if (!p[userId]) p[userId] = {};
      p[userId].user_type = newType;
      localStorage.setItem('user_profiles', JSON.stringify(p));
    } catch (e) {}
    adminPageLoadUsers();
  };

  window.deleteUser = function deleteUser(userId) {
    if (!confirm('确定要删除此用户及其所有数据？')) return;
    api('/admin/users/' + userId, { method: 'DELETE' })
      .then(function () {
        try {
          var p = JSON.parse(localStorage.getItem('user_profiles') || '{}');
          delete p[userId];
          localStorage.setItem('user_profiles', JSON.stringify(p));
        } catch (e) {}
        adminPageLoadUsers();
      })
      .catch(function (err) { alert(err.message); });
  };

  // ── Admin page loading helpers ──

  function adminPageLoadUsers() {
    var body = document.getElementById('adminUsersBody');
    if (!body) return;
    body.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:40px;color:var(--text-tertiary);">' + escapeHtml('加载中...') + '</td></tr>';
    api('/admin/users').then(function (data) {
      var users = data.users || [];
      if (users.length === 0) {
        body.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:40px;color:var(--text-tertiary);">' + escapeHtml('暂无用户') + '</td></tr>';
        return;
      }
      body.innerHTML = users.map(function (u) {
        var isSelf = currentUser && currentUser.id === u.id;
        var roleLabel = u.role === 'admin'
          ? '<span class="role-badge role-admin" style="font-size:11px;">管理员</span>'
          : '<span class="role-badge" style="font-size:11px;background:var(--bg-secondary);color:var(--text-secondary);">用户</span>';
        var vl = u.vip_level || '';
        var vipLabel = vl === 'svip'
          ? '<span class="role-badge role-svip" style="font-size:11px;">SVIP</span>'
          : vl === 'vip'
          ? '<span class="role-badge role-vip" style="font-size:11px;">VIP</span>'
          : '<span style="font-size:11px;color:var(--text-tertiary);">普通</span>';
        var ut = u.user_type || 'personal';
        var actions = isSelf
          ? '<span style="color:var(--text-tertiary);font-size:12px;">当前用户</span>'
          : '<button class="app-btn app-btn-sm app-btn-secondary" onclick="toggleUserRole(\'' + u.id + '\',\'' + u.role + '\')">' + (u.role === 'admin' ? '取消管理' : '设为管理') + '</button>' +
            '<button class="app-btn app-btn-sm app-btn-secondary" onclick="cycleVipLevel(\'' + u.id + '\',\'' + vl + '\')">切换VIP</button>' +
            '<button class="app-btn app-btn-sm app-btn-secondary" onclick="cycleUserType(\'' + u.id + '\',\'' + ut + '\')">切换类型</button>' +
            '<button class="app-btn app-btn-sm app-btn-danger" onclick="deleteUser(\'' + u.id + '\')">删除</button>';
        return '<tr>' +
          '<td>' + u.id + '</td>' +
          '<td style="max-width:160px;overflow:hidden;text-overflow:ellipsis;">' + escapeHtml(u.email) + '</td>' +
          '<td>' + escapeHtml(u.nickname || '-') + '</td>' +
          '<td>' + roleLabel + '</td>' +
          '<td>' + vipLabel + '</td>' +
          '<td style="font-size:12px;color:var(--text-secondary);">' + (ut === 'enterprise' ? '企业用户' : '个人用户') + '</td>' +
          '<td style="white-space:nowrap;">' + actions + '</td>' +
          '</tr>';
      }).join('');
    }).catch(function (err) {
      body.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:40px;color:var(--accent-red);">' + escapeHtml('加载失败: ' + err.message) + '</td></tr>';
    });
  }

  function adminPageLoadComments() {
    var list = document.getElementById('adminCommentsList');
    if (!list) return;
    list.innerHTML = '<div class="text-muted text-center py-3">' + escapeHtml('加载中...') + '</div>';
    api('/admin/comments').then(function (data) {
      if (data.comments.length === 0) {
        list.innerHTML = '<div class="text-muted text-center py-3">' + escapeHtml('暂无评论') + '</div>';
        return;
      }
      list.innerHTML = data.comments.map(function (c) {
        var date = new Date(c.created_at + 'Z').toLocaleDateString('zh-CN');
        return '<div class="app-card app-card-sm mb-2">' +
          '<div class="d-flex justify-content-between align-items-start">' +
          '<div><p class="mb-1">' + escapeHtml(c.content) + '</p>' +
          '<small class="text-muted">' + escapeHtml(c.nickname || '匿名') + ' (' + escapeHtml(c.email || '') + ') · ' + date + '</small></div>' +
          '<button class="app-btn app-btn-sm app-btn-danger ml-2 flex-shrink-0" onclick="adminPageDeleteComment(\'' + c.id + '\')">删除</button>' +
          '</div></div>';
      }).join('');
    }).catch(function (err) {
      list.innerHTML = '<div class="text-danger text-center py-3">' + escapeHtml('加载失败: ' + err.message) + '</div>';
    });
  }

  window.adminPageDeleteComment = function adminPageDeleteComment(id) {
    if (!confirm('确定删除此评论？')) return;
    api('/admin/comments/' + id, { method: 'DELETE' }).then(function () {
      adminPageLoadComments();
    }).catch(function (err) {
      alert(err.message);
    });
  };

  function adminPageLoadSubmissions() {
    var list = document.getElementById('adminSubmissionsList');
    if (!list) return;
    list.innerHTML = '<div class="text-muted text-center py-3">' + escapeHtml('加载中...') + '</div>';
    api('/admin/submissions').then(function (data) {
      if (data.submissions.length === 0) {
        list.innerHTML = '<div class="text-muted text-center py-3">' + escapeHtml('暂无入驻申请') + '</div>';
        return;
      }
      list.innerHTML = data.submissions.map(function (s) {
        var date = s.created_at ? new Date(s.created_at + 'Z').toLocaleDateString('zh-CN') : '-';
        var statusMap = { approved: '已通过', rejected: '已拒绝', pending: '待审核' };
        var statusBadgeCls = s.status === 'approved' ? 'app-badge-success' : s.status === 'rejected' ? 'app-badge-danger' : 'app-badge-warning';
        return '<div class="app-card app-card-sm mb-2">' +
          '<div class="d-flex justify-content-between align-items-start">' +
          '<div><strong>' + escapeHtml(s.name) + '</strong>' +
          ' <span class="app-badge ' + statusBadgeCls + '">' + (statusMap[s.status] || s.status) + '</span>' +
          '<p class="small text-muted mb-1 mt-1">' + escapeHtml(s.summary) + '</p>' +
          '<small class="text-muted">' + escapeHtml(s.city) + ' · ' + escapeHtml(s.contact_name) + ' · ' + date + '</small></div>' +
          '<div class="ml-2 flex-shrink-0">' +
          (s.status === 'pending'
            ? '<button class="app-btn app-btn-sm app-btn-success mr-1" onclick="adminPageApproveSub(\'' + s.id + '\')">通过</button>' +
              '<button class="app-btn app-btn-sm app-btn-danger mr-1" onclick="adminPageRejectSub(\'' + s.id + '\')">拒绝</button>'
            : '') +
          '<button class="app-btn app-btn-sm app-btn-secondary" onclick="adminPageDeleteSub(\'' + s.id + '\')">删除</button>' +
          '</div></div></div>';
      }).join('');
    }).catch(function (err) {
      list.innerHTML = '<div class="text-danger text-center py-3">' + escapeHtml('加载失败: ' + err.message) + '</div>';
    });
  }

  window.adminPageApproveSub = function adminPageApproveSub(id) {
    api('/admin/submissions/' + id + '/status', { method: 'PATCH', body: { status: 'approved' } }).then(adminPageLoadSubmissions);
  };
  window.adminPageRejectSub = function adminPageRejectSub(id) {
    api('/admin/submissions/' + id + '/status', { method: 'PATCH', body: { status: 'rejected' } }).then(adminPageLoadSubmissions);
  };
  window.adminPageDeleteSub = function adminPageDeleteSub(id) {
    if (!confirm('确定删除此申请？')) return;
    api('/admin/submissions/' + id, { method: 'DELETE' }).then(adminPageLoadSubmissions);
  };

  function adminPageLoadPolicies(search) {
    var tbody = document.getElementById('adminPoliciesBody');
    if (!tbody) return;
    tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:40px;color:var(--text-tertiary);">' + escapeHtml('加载中...') + '</td></tr>';
    var url = '/admin/policies';
    if (search) url += '?search=' + encodeURIComponent(search);
    api(url).then(function (data) {
      var policies = data.policies || [];
      _cachedPolicies = policies;
      if (policies.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:40px;color:var(--text-tertiary);">' + escapeHtml('暂无政策数据') + '</td></tr>';
        return;
      }
      var statusMap = { active: '进行中', upcoming: '即将实施', ended: '已结束' };
      var html = '';
      policies.forEach(function (p) {
        var statusText = statusMap[p.status] || p.status;
        html += '<tr>' +
          '<td><small class="text-muted">' + escapeHtml(p.id) + '</small></td>' +
          '<td>' + escapeHtml(p.name) + '</td>' +
          '<td>' + escapeHtml(p.city) + '</td>' +
          '<td>' + escapeHtml(p.issuer || '-') + '</td>' +
          '<td><small>' + escapeHtml(p.publish_date || '-') + '</small></td>' +
          '<td><span class="app-badge ' + (p.status === 'active' ? 'app-badge-success' : p.status === 'upcoming' ? 'app-badge-warning' : 'app-badge-secondary') + '">' + statusText + '</span></td>' +
          '<td><button class="app-btn app-btn-sm app-btn-secondary" onclick="adminPageEditPolicy(\'' + escapeHtml(p.id) + '\')">编辑</button> ' +
          '<button class="app-btn app-btn-sm app-btn-danger" onclick="adminPageDeletePolicy(\'' + escapeHtml(p.id) + '\')">删除</button></td>' +
          '</tr>';
      });
      tbody.innerHTML = html;
    }).catch(function (err) {
      tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:40px;color:var(--accent-red);">' + escapeHtml('加载失败: ' + err.message) + '</td></tr>';
    });
  }

  function adminPageLoadBookmarks(search) {
    var list = document.getElementById('adminBookmarksList');
    if (!list) return;
    list.innerHTML = '<div class="text-muted text-center py-3">' + escapeHtml('加载中...') + '</div>';
    api('/bookmarks').then(function (data) {
      var bookmarks = data.bookmarks || data || [];
      if (!bookmarks.length) {
        list.innerHTML = '<div class="text-muted text-center py-3">' + escapeHtml('暂无收藏') + '</div>';
        return;
      }
      list.innerHTML = bookmarks.map(function (b) {
        var date = b.created_at ? new Date(b.created_at + 'Z').toLocaleDateString('zh-CN') : '';
        return '<div class="app-card app-card-sm mb-2">' +
          '<div class="d-flex justify-content-between align-items-center">' +
          '<div><strong>' + escapeHtml(b.title) + '</strong>' +
          '<br><small class="text-muted">' + escapeHtml(b.description || '') + (date ? ' · ' + date : '') + '</small></div>' +
          '<button class="app-btn app-btn-sm app-btn-danger" onclick="adminPageDeleteBookmark(\'' + b.id + '\')">删除</button>' +
          '</div></div>';
      }).join('');
    }).catch(function (err) {
      list.innerHTML = '<div class="text-danger text-center py-3">' + escapeHtml('加载失败: ' + err.message) + '</div>';
    });
  }

  window.adminPageDeleteBookmark = function adminPageDeleteBookmark(id) {
    if (!confirm('确定删除此收藏？')) return;
    api('/bookmarks/' + id, { method: 'DELETE' }).then(function () {
      adminPageLoadBookmarks();
    }).catch(function (err) {
      alert(err.message);
    });
  };

  // ── Policy CRUD ──

  window.adminPageEditPolicy = function adminPageEditPolicy(id) {
    api('/admin/policies/' + id).then(function (policy) {
      openPolicyModal(policy);
    }).catch(function (err) {
      alert(err.message);
    });
  };

  window.adminPageDeletePolicy = function adminPageDeletePolicy(id) {
    if (!confirm('确定删除此政策？')) return;
    api('/admin/policies/' + id, { method: 'DELETE' }).then(function () {
      adminPageLoadPolicies(document.getElementById('policySearchInput').value);
    }).catch(function (err) {
      alert(err.message);
    });
  };

  function openPolicyModal(policy) {
    if (!policy) return;
    document.getElementById('pf_id').value = policy.id || '';
    document.getElementById('pf_name').value = policy.name || '';
    document.getElementById('pf_city').value = policy.city || '';
    document.getElementById('pf_province').value = policy.province || '';
    document.getElementById('pf_issuer').value = policy.issuer || '';
    document.getElementById('pf_publish_date').value = policy.publish_date || '';
    document.getElementById('pf_level').value = policy.level || 'city';
    document.getElementById('pf_status').value = policy.status || 'active';
    document.getElementById('pf_summary').value = policy.summary || '';
    document.getElementById('pf_official_url').value = (policy.links && policy.links.official) || '';
    document.getElementById('pf_news_url').value = (policy.links && policy.links.news && policy.links.news[0]) || '';
    var container = document.getElementById('benefits-container');
    container.innerHTML = '';
    var benefits = policy.benefits || [];
    if (benefits.length === 0) {
      addPolicyBenefitRow(container);
    } else {
      benefits.forEach(function (b) {
        addPolicyBenefitRow(container, b.item || '', b.amount || '', b.type || 'voucher');
      });
    }
    $('#policyModal').modal('show');
  }

  var _cachedPolicies = [];
  var CITY_CODES_POLICY = {
    "上海": "310000", "北京": "110000", "天津": "120000", "重庆": "500000",
    "南京": "320100", "苏州": "320500", "无锡": "320200", "常州": "320400",
    "南通": "320600", "扬州": "321000", "徐州": "320300", "盐城": "320900",
    "宿迁": "321300", "连云港": "320700",
    "杭州": "330100", "宁波": "330200", "温州": "330300",
    "广州": "440100", "深圳": "440300", "珠海": "440400", "佛山": "440600",
    "东莞": "441900", "中山": "442000", "惠州": "441300",
    "成都": "510100", "武汉": "420100", "长沙": "430100",
    "郑州": "410100", "西安": "610100", "济南": "370100", "青岛": "370200",
    "合肥": "340100", "福州": "350100", "厦门": "350200",
    "昆明": "530100", "石家庄": "130100", "海口": "460100"
  };

  function addPolicyBenefitRow(container, item, amount, type) {
    var row = document.createElement('div');
    row.className = 'benefit-row d-flex gap-2 mb-1';
    row.innerHTML =
      '<input type="text" class="app-input app-input-sm" placeholder="项目名" style="width:30%;display:inline-block;" value="' + escapeHtml(item || '') + '">' +
      '<input type="text" class="app-input app-input-sm" placeholder="金额/说明" style="width:40%;display:inline-block;" value="' + escapeHtml(amount || '') + '">' +
      '<select class="app-select" style="width:20%;display:inline-block;height:32px;font-size:13px;">' +
      '<option value="voucher"' + (type === 'voucher' ? ' selected' : '') + '>券</option>' +
      '<option value="cash"' + (type === 'cash' ? ' selected' : '') + '>现金</option>' +
      '<option value="loan"' + (type === 'loan' ? ' selected' : '') + '>贷款</option>' +
      '<option value="other"' + (type === 'other' ? ' selected' : '') + '>其他</option>' +
      '</select>' +
      '<button type="button" class="app-btn app-btn-sm app-btn-danger benefit-remove">×</button>';
    container.appendChild(row);
    row.querySelector('.benefit-remove').addEventListener('click', function () { row.remove(); });
  }

  function collectPolicyBenefits() {
    var rows = document.querySelectorAll('#benefits-container .benefit-row');
    var benefits = [];
    rows.forEach(function (row) {
      var inputs = row.querySelectorAll('input');
      var select = row.querySelector('select');
      var item = inputs[0] ? inputs[0].value.trim() : '';
      var amount = inputs[1] ? inputs[1].value.trim() : '';
      var type = select ? select.value : 'voucher';
      if (item || amount) {
        benefits.push({ item: item, amount: amount, type: type });
      }
    });
    return benefits;
  }

  function savePolicy() {
    var id = document.getElementById('pf_id').value;
    var data = {
      name: document.getElementById('pf_name').value.trim(),
      city: document.getElementById('pf_city').value.trim(),
      province: document.getElementById('pf_province').value.trim(),
      issuer: document.getElementById('pf_issuer').value.trim(),
      publish_date: document.getElementById('pf_publish_date').value,
      level: document.getElementById('pf_level').value,
      status: document.getElementById('pf_status').value,
      summary: document.getElementById('pf_summary').value.trim(),
      benefits: collectPolicyBenefits(),
      links: {}
    };
    var officialUrl = document.getElementById('pf_official_url').value.trim();
    var newsUrl = document.getElementById('pf_news_url').value.trim();
    if (officialUrl) data.links.official = officialUrl;
    if (newsUrl) data.links.news = [newsUrl];
    if (!data.name || !data.city) { alert('名称和城市为必填项'); return; }
    var method = id ? 'PUT' : 'POST';
    var url = id ? '/admin/policies/' + encodeURIComponent(id) : '/admin/policies';
    if (!id) {
      var code = CITY_CODES_POLICY[data.city];
      if (!code) { alert('无法识别城市编码，请先选择有效城市'); return; }
      var prefix = code + '-';
      var maxSeq = 99;
      (_cachedPolicies || []).forEach(function (p) {
        if (p.id && p.id.indexOf(prefix) === 0) {
          var num = parseInt(p.id.slice(prefix.length), 10);
          if (!isNaN(num) && num > maxSeq) maxSeq = num;
        }
      });
      data.id = prefix + (maxSeq + 1);
    }
    var btn = document.getElementById('policySaveBtn');
    btn.disabled = true;
    btn.textContent = '保存中...';
    api(url, { method: method, body: data }).then(function () {
      $('#policyModal').modal('hide');
      adminPageLoadPolicies(document.getElementById('policySearchInput').value);
    }).catch(function (err) {
      alert(err.message);
    }).finally(function () {
      btn.disabled = false;
      btn.textContent = '保存';
    });
  }

  // ── Bind policy page events ──
  function bindPolicyPageEvents() {
    var searchBtn = document.getElementById('policySearchBtn');
    if (!searchBtn) return;
    searchBtn.addEventListener('click', function () {
      adminPageLoadPolicies(document.getElementById('policySearchInput').value);
    });
    document.getElementById('policySearchInput').addEventListener('keyup', function (e) {
      if (e.key === 'Enter') adminPageLoadPolicies(this.value);
    });
    document.getElementById('policyImportBtn').addEventListener('click', function () {
      document.getElementById('policyFileInput').click();
    });
    document.getElementById('policyFileInput').addEventListener('change', function (e) {
      var file = e.target.files[0];
      if (!file) return;
      var reader = new FileReader();
      reader.onload = function (ev) {
        try {
          var json = JSON.parse(ev.target.result);
          var arr = Array.isArray(json) ? json : (json.policies || []);
          if (arr.length === 0) { alert('JSON 格式错误'); return; }
          api('/admin/policies/import', { method: 'POST', body: { policies: arr } }).then(function (res) {
            alert('导入完成: ' + res.imported + '/' + res.total + ' 条');
            adminPageLoadPolicies(document.getElementById('policySearchInput').value);
          }).catch(function (err) { alert(err.message); });
        } catch (err) { alert('JSON 解析失败: ' + err.message); }
      };
      reader.readAsText(file);
      e.target.value = '';
    });
    document.getElementById('policyExportBtn').addEventListener('click', function () {
      api('/admin/policies/export').then(function (data) {
        var blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        var url = URL.createObjectURL(blob);
        var a = document.createElement('a');
        a.href = url;
        a.download = 'policies-' + new Date().toISOString().slice(0, 10) + '.json';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }).catch(function (err) { alert(err.message); });
    });
    document.getElementById('benefitAddBtn').addEventListener('click', function () {
      addPolicyBenefitRow(document.getElementById('benefits-container'));
    });
    document.getElementById('policySaveBtn').addEventListener('click', savePolicy);
    $('#policyModal').on('hidden.bs.modal', function () {
      document.getElementById('pf_id').value = '';
    });
  }

  function seedTestData() {
    if (!localStorage.getItem('_test_data_seeded')) {
      try {
        localStorage.setItem('_test_data_seeded', '1');
        var profiles = JSON.parse(localStorage.getItem('user_profiles') || '{}');
        if (Object.keys(profiles).length === 0) {
          profiles['2'] = { vip_level: 'vip', user_type: 'enterprise' };
          profiles['3'] = { vip_level: 'svip', user_type: 'personal' };
          profiles['4'] = { vip_level: 'vip', user_type: 'personal' };
          localStorage.setItem('user_profiles', JSON.stringify(profiles));
        }
        if (!localStorage.getItem('permissions_config')) {
          var config = {};
          config.vip = (RBAC_ROLE_PERMISSIONS.vip || []).concat(['admin.users.view', 'admin.membership.manage']);
          config.svip = Object.keys(RBAC_PERMISSIONS).filter(function (p) { return p !== 'admin.permissions.manage'; });
          localStorage.setItem('permissions_config', JSON.stringify(config));
        }
      } catch (e) {}
    }
  }

  document.addEventListener('DOMContentLoaded', function () {
    seedTestData();
    initAuth();
    initSubmitPage();
    initUserSection();
    initAdminSection();

    document.querySelectorAll('.sidebar-menu-inner a[href^="#"]').forEach(function (a) {
      a.addEventListener('click', function (e) {
        var id = this.getAttribute('href');
        if (id === '#') return;
        var target = document.getElementById(id.substring(1));
        if (target) {
          e.preventDefault();
          target.scrollIntoView();
        }
      });
    });

  });

  window.openAuthModal = function () {
    window.location.href = '/user/login/';
  };
})();
