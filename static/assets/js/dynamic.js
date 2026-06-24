(function () {
  'use strict';

  var API_BASE = window.location.port === '1313'
    ? 'http://localhost:8787/api'
    : '/api';

  var currentUser = null;
  var modalEl = null;
  var AUTH_KEY = 'auth_user';

  function saveAuth(user) {
    try { localStorage.setItem(AUTH_KEY, JSON.stringify(user)); } catch (e) {} }

  function clearAuth() {
    try { localStorage.removeItem(AUTH_KEY); } catch (e) {} }

  function loadAuth() {
    try { var d = localStorage.getItem(AUTH_KEY); return d ? JSON.parse(d) : null; } catch (e) { return null; } }

  function api(path, options) {
    options = options || {};
    options.credentials = 'include';
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

  function createModal() {
    var html =
      '<div class="modal fade" id="authModal" tabindex="-1">' +
      '  <div class="modal-dialog modal-dialog-centered" style="max-width:440px">' +
      '    <div class="modal-content auth-modal-content">' +
      '      <div class="auth-modal-header">' +
      '        <ul class="nav nav-tabs border-0" id="authTabs">' +
      '          <li class="nav-item"><a class="nav-link active" data-tab="login" href="#">登录</a></li>' +
      '          <li class="nav-item"><a class="nav-link" data-tab="register" href="#">注册</a></li>' +
      '        </ul>' +
      '        <button type="button" class="close auth-close" data-dismiss="modal">&times;</button>' +
      '      </div>' +
      '      <div class="modal-body auth-modal-body">' +
      '        <form id="loginForm" style="display:block">' +
      '          <div class="auth-input-wrap">' +
      '            <i class="fas fa-envelope auth-input-icon"></i>' +
      '            <input type="email" class="form-control auth-input" id="loginEmail" placeholder="请输入邮箱" required>' +
      '          </div>' +
      '          <div class="auth-input-wrap">' +
      '            <i class="fas fa-lock auth-input-icon"></i>' +
      '            <input type="password" class="form-control auth-input" id="loginPassword" placeholder="请输入密码" required>' +
      '          </div>' +
      '          <button type="submit" class="btn auth-btn" id="loginBtn">登 录</button>' +
      '          <div class="auth-error text-danger small mt-2 text-center" style="display:none"></div>' +
      '        </form>' +
      '        <form id="registerForm" style="display:none">' +
      '          <div class="auth-input-wrap">' +
      '            <i class="fas fa-user auth-input-icon"></i>' +
      '            <input type="text" class="form-control auth-input" id="regNickname" placeholder="请输入昵称" required>' +
      '          </div>' +
      '          <div class="auth-input-wrap">' +
      '            <i class="fas fa-envelope auth-input-icon"></i>' +
      '            <input type="email" class="form-control auth-input" id="regEmail" placeholder="请输入邮箱" required>' +
      '          </div>' +
      '          <div class="auth-input-wrap">' +
            '            <i class="fas fa-lock auth-input-icon"></i>' +
            '            <input type="password" class="form-control auth-input" id="regPassword" placeholder="设置密码(至少6位)" required>' +
            '          </div>' +
            '          <div class="auth-input-wrap">' +
            '            <i class="fas fa-check-circle auth-input-icon"></i>' +
            '            <input type="password" class="form-control auth-input" id="regConfirmPassword" placeholder="确认密码" required>' +
            '          </div>' +
            '          <button type="submit" class="btn auth-btn" id="registerBtn">注 册</button>' +
      '          <div class="auth-error text-danger small mt-2 text-center" style="display:none"></div>' +
      '        </form>' +
      '      </div>' +
      '    </div>' +
      '  </div>' +
      '</div>';
    document.body.insertAdjacentHTML('beforeend', html);
    modalEl = document.getElementById('authModal');

    document.querySelectorAll('#authTabs .nav-link').forEach(function (tab) {
      tab.addEventListener('click', function (e) {
        e.preventDefault();
        document.querySelectorAll('#authTabs .nav-link').forEach(function (t) { t.classList.remove('active'); });
        this.classList.add('active');
        var tabName = this.getAttribute('data-tab');
        document.getElementById('loginForm').style.display = tabName === 'login' ? 'block' : 'none';
        document.getElementById('registerForm').style.display = tabName === 'register' ? 'block' : 'none';
      });
    });

    document.getElementById('loginForm').addEventListener('submit', function (e) {
      e.preventDefault();
      var email = document.getElementById('loginEmail').value;
      var password = document.getElementById('loginPassword').value;
      loginUser(email, password);
    });

    document.getElementById('registerForm').addEventListener('submit', function (e) {
      e.preventDefault();
      var nickname = document.getElementById('regNickname').value;
      var email = document.getElementById('regEmail').value;
      var password = document.getElementById('regPassword').value;
      var confirmPwd = document.getElementById('regConfirmPassword').value;
      if (password !== confirmPwd) {
        showAuthError('registerForm', '两次输入的密码不一致');
        return;
      }
      registerUser(email, password, nickname);
    });
  }

  function showAuthError(formId, msg) {
    var el = document.querySelector('#' + formId + ' .auth-error');
    el.textContent = msg;
    el.style.display = 'block';
    setTimeout(function () { el.style.display = 'none'; }, 3000);
  }

  function loginUser(email, password) {
    var btn = document.getElementById('loginBtn');
    btn.disabled = true;
    btn.textContent = '登录中...';
    api('/auth/login', { method: 'POST', body: { email: email, password: password } })
      .then(function (data) {
        currentUser = data.user;
        saveAuth(data.user);
        updateUI();
        $(modalEl).modal('hide');
        initBookmarkButtons();
        initComments();
        refreshCustomNavCache();
        if (document.getElementById('profile-page')) {
          initProfilePage();
        } else {
          window.location.href = '/profile/';
        }
      })
      .catch(function (err) {
        showAuthError('loginForm', err.message);
      })
      .finally(function () {
        btn.disabled = false;
        btn.textContent = '登录';
      });
  }

  function registerUser(email, password, nickname) {
    var btn = document.getElementById('registerBtn');
    btn.disabled = true;
    btn.textContent = '注册中...';
    api('/auth/register', { method: 'POST', body: { email: email, password: password, nickname: nickname } })
      .then(function (data) {
        currentUser = data.user;
        saveAuth(data.user);
        updateUI();
        $(modalEl).modal('hide');
        initBookmarkButtons();
        initComments();
        refreshCustomNavCache();
        if (document.getElementById('profile-page')) {
          initProfilePage();
        } else {
          window.location.href = '/profile/';
        }
      })
      .catch(function (err) {
        showAuthError('registerForm', err.message);
      })
      .finally(function () {
        btn.disabled = false;
        btn.textContent = '注册';
      });
  }

  function logoutUser() {
    api('/auth/logout', { method: 'POST' }).then(function () {
      currentUser = null;
      clearAuth();
      updateUI();
      initProfilePage();
      initAdmin();
      initCustomNav();
    });
  }

  function updateUI() {
    var container = document.getElementById('user-menu');
    if (!container) return;
    if (currentUser) {
      var adminLink = currentUser.role === 'admin'
        ? '<div class="dropdown-divider"></div><a class="dropdown-item" href="/admin/"><i class="fas fa-shield-alt mr-2"></i>管理后台</a>'
        : '';
      container.innerHTML =
        '<div class="dropdown d-inline-block">' +
        '  <a href="#" class="dropdown-toggle" data-toggle="dropdown">' +
        '    <i class="fas fa-user-circle mr-1"></i>' + escapeHtml(currentUser.nickname) +
        '  </a>' +
        '  <div class="dropdown-menu dropdown-menu-right">' +
        '    <a class="dropdown-item" href="/profile/"><i class="fas fa-user mr-2"></i>个人中心</a>' +
        adminLink +
        '    <div class="dropdown-divider"></div>' +
        '    <a class="dropdown-item" href="#" id="logoutBtn"><i class="fas fa-sign-out-alt mr-2"></i>退出登录</a>' +
        '  </div>' +
        '</div>';
      document.getElementById('logoutBtn').addEventListener('click', function (e) {
        e.preventDefault();
        logoutUser();
      });
    } else {
      container.innerHTML =
        '<a href="#" class="mr-3" data-toggle="modal" data-target="#authModal">登录</a>' +
        '<a href="#" data-toggle="modal" data-target="#authModal">注册</a>';
    }
  }

  function escapeHtml(str) {
    var div = document.createElement('div');
    div.appendChild(document.createTextNode(str));
    return div.innerHTML;
  }

  function initAuth() {
    if (!document.getElementById('user-menu')) return;
    createModal();

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
      initProfilePage();
      initAdmin();
      initCustomNav();
    });

    if (!window._authStorageBound) {
      window._authStorageBound = true;
      window.addEventListener('storage', function (e) {
        if (e.key !== AUTH_KEY) return;
        currentUser = e.newValue ? JSON.parse(e.newValue) : null;
        updateUI();
        initProfilePage();
        initAdmin();
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
        $(modalEl).modal('show');
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
        if (!currentUser) {
          $(modalEl).modal('show');
          return;
        }
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
          $(modalEl).modal('show');
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

  function initProfilePage() {
    var container = document.getElementById('profile-page');
    if (!container) return;

    if (!container._profileReady) {
      container._profileReady = true;
      var hint = document.createElement('div');
      hint.className = 'profile-login-hint';
      hint.style.display = 'none';
      hint.innerHTML = '<p>请先登录</p><a href="#" class="btn btn-primary" data-toggle="modal" data-target="#authModal">去登录</a>';
      container.insertBefore(hint, container.firstChild);
      container._profileReq = 0;
    }

    var hint = container.querySelector('.profile-login-hint');
    var sections = container.querySelectorAll('.profile-header, .profile-section');

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

    var bookmarkList = container.querySelector('.bookmark-list');
    var commentList = container.querySelector('.my-comments-list');
    if (!bookmarkList) return;

    var reqId = ++container._profileReq;

    bookmarkList.innerHTML = '<div class="text-muted text-center py-3">加载中...</div>';
    api('/bookmarks').then(function (data) {
      if (reqId !== container._profileReq) return;
      if (data.bookmarks.length === 0) {
        bookmarkList.innerHTML = '<div class="text-muted text-center py-3">还没有收藏任何网站</div>';
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
        bookmarkList.innerHTML = html;
        bookmarkList.querySelectorAll('.delete-bookmark').forEach(function (btn) {
          btn.addEventListener('click', function () {
            var id = btn.getAttribute('data-id');
            if (confirm('确定删除此收藏？')) {
              api('/bookmarks/' + id, { method: 'DELETE' }).then(function () {
                btn.closest('.bookmark-item').remove();
              });
            }
          });
        });
      }
    }).catch(function () {
      if (reqId !== container._profileReq) return;
      bookmarkList.innerHTML = '<div class="text-danger text-center py-3">加载失败</div>';
    });

    if (!commentList) return;
    commentList.innerHTML = '<div class="text-muted text-center py-3">加载中...</div>';
    api('/comments?mine=1').then(function (data) {
      if (reqId !== container._profileReq) return;
      if (data.comments.length === 0) {
        commentList.innerHTML = '<div class="text-muted text-center py-3">还没有发表任何评论</div>';
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
        commentList.innerHTML = html;
        commentList.querySelectorAll('.delete-my-comment').forEach(function (btn) {
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
      if (reqId !== container._profileReq) return;
      commentList.innerHTML = '<div class="text-danger text-center py-3">加载失败</div>';
    });
    initChangePwdForm();
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
    var usersTable = usersPanel.querySelector('.admin-users-table');
    var commentsList = commentsPanel.querySelector('.admin-comments-list');
    var submissionsList = submissionsPanel ? submissionsPanel.querySelector('.admin-submissions-list') : null;

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
      });
    });

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
            checkboxes[i].checked = false;
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

  document.addEventListener('DOMContentLoaded', function () {
    initAuth();
    initSubmitPage();

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
})();
