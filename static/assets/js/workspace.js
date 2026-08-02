        // ═══════════════════════════════════════════
        // ── Auth System ──
        // ═══════════════════════════════════════════

        var API_BASE = (function(){var p=window.location.port;return(p==='1313'||p==='1317')?'http://localhost:8787/api':'/api';})();
        var currentUser = null;

        // ═══════════════════════════════════════════
        // ── RBAC 角色权限系统 ──
        // ═══════════════════════════════════════════

        var ROLES = {
            guest: { id:'guest',  name:'游客',     level:0 },
            user:  { id:'user',   name:'普通用户',  level:10 },
            vip:   { id:'vip',    name:'VIP会员',   level:20 },
            svip:  { id:'svip',   name:'SVIP会员',  level:30 },
            admin: { id:'admin',  name:'超级管理员', level:999 }
        };

        var PERMISSIONS = {
            'workspace.view':          '访问工作台',
            'workspace.bookmark':      '收藏管理',
            'workspace.comment':       '评论管理',
            'roadmap.use':             '创办一人公司',
            'admin.users.view':        '查看用户列表',
            'admin.users.manage':      '管理用户角色',
            'admin.membership.manage': '管理会员等级',
            'admin.permissions.manage':'管理权限配置'
        };

        var ROLE_PERMISSIONS = {
            guest: [],
            user:   ['workspace.view','workspace.bookmark','workspace.comment'],
            vip:    ['workspace.view','workspace.bookmark','workspace.comment','roadmap.use'],
            svip:   ['workspace.view','workspace.bookmark','workspace.comment','roadmap.use'],
            admin:  Object.keys(PERMISSIONS)
        };

        var VIP_LEVELS = [
            { id:'',     name:'普通用户' },
            { id:'vip',  name:'VIP会员' },
            { id:'svip', name:'SVIP会员' }
        ];

        var USER_TYPES = [
            { id:'personal',   name:'个人用户' },
            { id:'enterprise', name:'企业用户' }
        ];

        function getEffectiveRole(user) {
            if (!user) return 'guest';
            if (user.role === 'admin') return 'admin';
            var lv = user.vip_level || '';
            if (lv === 'svip') return 'svip';
            if (lv === 'vip')  return 'vip';
            return 'user';
        }

        function hasPermission(user, perm) {
            var role = getEffectiveRole(user);
            return getEffectivePermissions(role).indexOf(perm) !== -1;
        }

        function getRoleName(roleId) { return (ROLES[roleId] || {}).name || roleId; }

        function loadPermissionsConfig() {
            try { return JSON.parse(localStorage.getItem('permissions_config') || 'null'); } catch(e) { return null; }
        }

        function savePermissionsConfig(config) {
            try { localStorage.setItem('permissions_config', JSON.stringify(config)); } catch(e) {}
        }

        function getEffectivePermissions(role) {
            var defaults = ROLE_PERMISSIONS[role] || [];
            var overrides = loadPermissionsConfig();
            if (!overrides || !overrides[role]) return defaults;
            var merged = [];
            var allPerms = Object.keys(PERMISSIONS);
            for (var i = 0; i < allPerms.length; i++) {
                var p = allPerms[i];
                if (overrides[role].indexOf(p) !== -1) merged.push(p);
            }
            return merged;
        }

        function escapeHtml(str) {
            var d = document.createElement('div');
            d.appendChild(document.createTextNode(str));
            return d.innerHTML;
        }

        function loadProfileOverrides(user) {
            try {
                var p = JSON.parse(localStorage.getItem('user_profiles') || '{}');
                if (p[user.id]) {
                    if (p[user.id].vip_level) user.vip_level = p[user.id].vip_level;
                    if (p[user.id].user_type) user.user_type = p[user.id].user_type;
                }
            } catch(e) {}
            return user;
        }

        function getAuthUser() {
            try { var d = localStorage.getItem('auth_user'); return d ? JSON.parse(d) : null; } catch(e) { return null; }
        }

        function updateAuthUI(user) {
            var c = document.getElementById('userMenuContainer');
            if (!c) return;
            var name = user.nickname || user.username || user.email || '用户';
            var initial = name[0].toUpperCase();
            var role = getEffectiveRole(user);
            var badge = '';
            var adminLink = '';
            if (role === 'vip') badge = '<span class="role-badge role-vip">VIP</span>';
            else if (role === 'svip') badge = '<span class="role-badge role-svip">SVIP</span>';
            else if (role === 'admin') {
                badge = '<span class="role-badge role-admin">管理</span>';
                adminLink = '<a class="dropdown-item" href="/admin/"><i class="fas fa-shield-alt"></i> 管理后台</a>';
            }
            c.innerHTML =
                '<div class="user-menu" id="userMenuBtn" onclick="toggleUserDropdown()">' +
                '  <div class="user-avatar' + (role === 'admin' ? ' admin-avatar' : '') + '">' + initial + '</div>' +
                '  <span class="user-name">' + name + '</span>' +
                badge +
                '</div>' +
                '<div class="workspace-user-dropdown" id="userDropdown">' +
                '  <a class="dropdown-item" href="/profile/"><i class="fas fa-user-circle"></i> 个人中心</a>' +
                adminLink +
                '  <div class="dropdown-divider"></div>' +
                '  <button class="dropdown-item" onclick="logoutUser()"><i class="fas fa-sign-out-alt"></i> 退出登录</button>' +
                '</div>';
        }

        function checkAuth() {
            currentUser = getAuthUser();
            if (currentUser) {
                fetch(API_BASE + '/auth/me', { credentials: 'include' })
                    .then(function(r) { return r.json().then(function(d) { if (!r.ok) { throw new Error(d.error || 'expired'); } return d; }); })
                    .then(function(data) {
                        var user = data.user || data;
                        user = loadProfileOverrides(user);
                        localStorage.setItem('auth_user', JSON.stringify(user));
                        currentUser = user;
                        document.getElementById('workspaceGuard').style.display = 'none';
                        updateAuthUI(user);
                        updateRoadmapAccess();
                    })
                    .catch(function() {
                        localStorage.removeItem('auth_user');
                        currentUser = null;
                        document.getElementById('workspaceGuard').style.display = 'flex';
                    });
            } else {
                document.getElementById('workspaceGuard').style.display = 'flex';
            }
        }

        function toggleUserDropdown() {
            var dd = document.getElementById('userDropdown');
            if (dd) dd.classList.toggle('show');
        }



        function logoutUser() {
            fetch(API_BASE + '/auth/logout', { method: 'POST', credentials: 'include' })
                .then(function() { localStorage.removeItem('auth_user'); currentUser = null; window.location.href = '/user/login/'; })
                .catch(function() { localStorage.removeItem('auth_user'); currentUser = null; window.location.href = '/user/login/'; });
        }

        function updateRoadmapAccess() {
            var card = document.getElementById('card-roadmap');
            var locked = document.getElementById('roadmapLocked');
            if (!card || !locked) return;
            if (hasPermission(currentUser, 'roadmap.use')) {
                locked.style.display = 'none';
                card.onclick = function() { openRoadmap(); };
                card.style.cursor = 'pointer';
            } else {
                locked.style.display = 'flex';
                card.onclick = null;
                card.style.cursor = 'default';
            }
        }



        // Close dropdown on outside click
        document.addEventListener('click', function(e) {
            if (!e.target.closest('#userMenuContainer')) {
                var dd = document.getElementById('userDropdown');
                if (dd) dd.classList.remove('show');
            }
        });

        // ── Load saved company name into top bar ──
        (function() {
            var cn = '';
            try {
                var params = new URLSearchParams(window.location.search);
                cn = params.get('company') || localStorage.getItem('roadmap_company') || '';
            } catch(e) {}
            if (cn) {
                var el = document.querySelector('.company-name');
                if (el) el.textContent = cn;
            }
        })();

        // Theme Toggle
        function toggleTheme() {
            const body = document.body;
            const theme = body.getAttribute('data-theme');
            const newTheme = theme === 'light' ? 'dark' : 'light';
            body.setAttribute('data-theme', newTheme);
            document.querySelector('.theme-btn i').className = newTheme === 'dark' ? 'fas fa-moon' : 'fas fa-sun';
        }

        // Global Search
        let currentSearchType = 'all';

        const searchData = {
            url: [
                { title: 'AI工具导航', desc: '精选AI工具合集', icon: 'fa-globe', bg: '#667eea', href: '/site/' },
                { title: 'ChatGPT', desc: 'OpenAI对话模型', icon: 'fa-robot', bg: '#74aa9c', href: 'https://chat.openai.com' },
                { title: 'Midjourney', desc: 'AI绘画工具', icon: 'fa-palette', bg: '#000', href: 'https://midjourney.com' },
                { title: 'GitHub', desc: '代码托管平台', icon: 'fa-github', bg: '#333', href: 'https://github.com' }
            ],
            dataset: [
                { title: 'AI一人公司运营数据集', desc: '100万+条 · 免费', icon: 'fa-comments', bg: '#667eea', href: '/book/' },
                { title: 'AI工具用户行为数据集', desc: '50万+条 · 199 Token', icon: 'fa-shopping-cart', bg: '#f5576c', href: '/book/' },
                { title: '新闻文章数据集', desc: '10万+篇 · 免费', icon: 'fa-newspaper', bg: '#43e97b', href: '/book/' },
                { title: 'AI图像数据集', desc: '5万+张 · 299 Token', icon: 'fa-image', bg: '#ff6b6b', href: '/book/' }
            ],
            resource: [
                { title: '电子书', desc: 'AI技术书籍与教程', icon: 'fa-book', bg: '#667eea', href: '/book/' },
                { title: '文档模板', desc: '办公与设计模板', icon: 'fa-file-alt', bg: '#f093fb', href: '/book/' },
                { title: '数据集', desc: '各类数据集资源', icon: 'fa-database', bg: '#5c6bc0', href: '/book/' },
                { title: '视频教程', desc: 'AI教学视频资源', icon: 'fa-video', bg: '#ff6b6b', href: '/blog/' }
            ],
            article: [
                { title: '2024年AI工具发展趋势深度报告', desc: 'AI前沿 · 12,567阅读', icon: 'fa-chart-line', bg: '#667eea', href: '/blog/' },
                { title: '一个人如何完成自媒体全流程运营', desc: '运营技巧 · 5,234阅读', icon: 'fa-bullhorn', bg: '#f093fb', href: '/blog/' },
                { title: '5款免费AI工具让你效率翻倍', desc: 'AI前沿 · 12,345阅读', icon: 'fa-magic', bg: '#43e97b', href: '/blog/' },
                { title: '新手入门ChatGPT完全指南', desc: 'AI前沿 · 8,901阅读', icon: 'fa-robot', bg: '#5c6bc0', href: '/blog/' }
            ]
        };

        function setSearchType(type, btn) {
            currentSearchType = type;
            document.querySelectorAll('.search-type-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            handleSearch(document.getElementById('globalSearchInput').value);
        }

        function handleSearch(query) {
            const resultsContainer = document.getElementById('searchResults');

            if (!query.trim()) {
                resultsContainer.classList.remove('show');
                resultsContainer.innerHTML = '';
                return;
            }

            const results = [];
            const q = query.toLowerCase();

            if (currentSearchType === 'all' || currentSearchType === 'url') {
                searchData.url.forEach(item => {
                    if (item.title.toLowerCase().includes(q) || item.desc.toLowerCase().includes(q)) {
                        results.push({ ...item, type: '网址' });
                    }
                });
            }

            if (currentSearchType === 'all' || currentSearchType === 'dataset') {
                searchData.dataset.forEach(item => {
                    if (item.title.toLowerCase().includes(q) || item.desc.toLowerCase().includes(q)) {
                        results.push({ ...item, type: '数据' });
                    }
                });
            }

            if (currentSearchType === 'all' || currentSearchType === 'resource') {
                searchData.resource.forEach(item => {
                    if (item.title.toLowerCase().includes(q) || item.desc.toLowerCase().includes(q)) {
                        results.push({ ...item, type: '素材' });
                    }
                });
            }

            if (currentSearchType === 'all' || currentSearchType === 'article') {
                searchData.article.forEach(item => {
                    if (item.title.toLowerCase().includes(q) || item.desc.toLowerCase().includes(q)) {
                        results.push({ ...item, type: '文章' });
                    }
                });
            }

            if (currentSearchType === 'web') {
                results.push({
                    title: '搜索: ' + query,
                    desc: '使用百度搜索',
                    icon: 'fa-search',
                    bg: '#2932e1',
                    href: 'https://www.baidu.com/s?wd=' + encodeURIComponent(query),
                    type: '网页'
                });
                results.push({
                    title: '搜索: ' + query,
                    desc: '使用Google搜索',
                    icon: 'fa-google',
                    bg: '#4285f4',
                    href: 'https://www.google.com/search?q=' + encodeURIComponent(query),
                    type: '网页'
                });
            }

            if (results.length > 0) {
                resultsContainer.innerHTML = results.map(item => `
                    <div class="search-result-item" onclick="location.href='${item.href}'">
                        <div class="search-result-icon" style="background: ${item.bg};">
                            <i class="fas ${item.icon}"></i>
                        </div>
                        <div class="search-result-info">
                            <div class="search-result-title">${item.title}</div>
                            <div class="search-result-desc">${item.desc}</div>
                        </div>
                        <span class="search-result-type">${item.type}</span>
                    </div>
                `).join('');
                resultsContainer.classList.add('show');
            } else {
                resultsContainer.innerHTML = '<div style="text-align:center;padding:20px;color:var(--text-tertiary);font-size:13px;">未找到相关结果</div>';
                resultsContainer.classList.add('show');
            }
        }

        // Card Management
        let cardCount = 4;

        function minimizeCard(cardId, event) {
            if (event) event.stopPropagation();
            const card = document.getElementById(cardId);
            card.classList.toggle('minimized');
        }

        function deleteCard(cardId) {
            const card = document.getElementById(cardId);
            card.classList.add('card-deleting');
            setTimeout(() => {
                card.style.display = 'none';
            }, 300);
        }

        function addCard(type) {
            const names = { url: '网址导航', article: '文章资讯', dataset: '数据集市', resource: '素材中心' };
            const icons = { url: 'fa-globe', article: 'fa-newspaper', dataset: 'fa-database', resource: 'fa-image' };
            const colors = { url: 'var(--accent-blue)', article: 'var(--accent-green)', dataset: 'var(--accent-purple)', resource: 'var(--accent-orange)' };
            const gradients = {
                url: 'linear-gradient(135deg, #667eea, #764ba2)',
                article: 'linear-gradient(135deg, #43e97b, #38f9d7)',
                dataset: 'linear-gradient(135deg, #5c6bc0, #3949ab)',
                resource: 'linear-gradient(135deg, #ff6b6b, #feca57)'
            };

            cardCount++;
            const id = 'card-' + type + '-' + cardCount;
            const title = names[type];
            const icon = icons[type];
            const color = colors[type];
            const gradient = gradients[type];

            const card = document.createElement('div');
            card.className = 'floating-card';
            card.id = id;
            card.setAttribute('data-title', title);
            card.style.cssText = 'width:280px;top:' + (120 + cardCount * 20) + 'px;left:' + (40 + cardCount * 20) + 'px;';

            card.innerHTML = `
                <div class="card-mini-view">
                    <div class="card-mini-icon"><i class="fas ${icon}"></i></div>
                    <div class="card-mini-title">${title}</div>
                </div>
                <div class="card-header">
                    <div class="card-title" style="display:flex;align-items:center;gap:8px;">
                        <i class="fas ${icon}" style="color:${color};"></i>
                        ${title}
                    </div>
                    <div style="display:flex;gap:4px;">
                        <button class="card-minimize" onclick="minimizeCard('${id}', event)">
                            <i class="fas fa-minus"></i>
                        </button>
                        <button class="card-minimize" onclick="deleteCard('${id}')" style="margin-left:4px;">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                </div>
                <div class="card-content">
                    <div class="card-icon" style="background:${gradient};${type === 'article' ? 'color:#333;' : ''}">
                        <i class="fas ${icon}"></i>
                    </div>
                    <div class="card-title">${title}</div>
                    <div class="card-desc">自定义${title}卡片</div>
                    <div style="font-size:12px;color:var(--text-tertiary);">右键点击桌面添加更多卡片</div>
                </div>
            `;

            document.querySelector('.desktop').appendChild(card);
            hideContextMenu();
        }

        function restoreAllCards() {
            document.querySelectorAll('.floating-card').forEach(card => {
                card.classList.remove('minimized', 'card-deleting');
                card.style.display = '';
            });
            hideContextMenu();
        }

        function deleteAllCards() {
            document.querySelectorAll('.floating-card').forEach(card => {
                card.classList.add('card-deleting');
                setTimeout(() => {
                    card.style.display = 'none';
                }, 300);
            });
            hideContextMenu();
        }

        // Context Menu
        function showContextMenu(x, y) {
            const menu = document.getElementById('contextMenu');
            menu.style.display = 'block';
            menu.style.left = x + 'px';
            menu.style.top = y + 'px';
        }

        function hideContextMenu() {
            document.getElementById('contextMenu').style.display = 'none';
            document.getElementById('dockContextMenu').style.display = 'none';
        }

        document.addEventListener('contextmenu', function(e) {
            e.preventDefault();
            const dock = e.target.closest('.dock');
            if (dock) {
                const menu = document.getElementById('dockContextMenu');
                menu.style.display = 'block';
                menu.style.left = e.clientX + 'px';
                menu.style.top = e.clientY + 'px';
            } else {
                showContextMenu(e.clientX, e.clientY);
            }
        });

        document.addEventListener('click', function(e) {
            if (!e.target.closest('.context-menu')) {
                hideContextMenu();
            }
        });

        // Dock Management
        function addDockItem() {
            hideContextMenu();
            alert('Dock 添加功能已触发');
        }

        function removeDockItem() {
            hideContextMenu();
            alert('Dock 移除功能已触发');
        }

        // ── Universal Draggable ──
        function makeDraggable(el, handleSelector, noDragSel) {
            el.addEventListener('mousedown', function(e) {
                if (handleSelector && !e.target.closest(handleSelector)) return;
                if (noDragSel && e.target.closest(noDragSel)) return;
                if (el.classList.contains('minimized')) return;

                const desktop = document.querySelector('.desktop');
                const desktopRect = desktop.getBoundingClientRect();
                const rect = el.getBoundingClientRect();

                const cs = getComputedStyle(el);
                if (cs.transform !== 'none') {
                    el.style.left = (rect.left - desktopRect.left) + 'px';
                    el.style.top = (rect.top - desktopRect.top) + 'px';
                    el.style.transform = 'none';
                }

                const offsetX = e.clientX - rect.left;
                const offsetY = e.clientY - rect.top;
                const w = rect.width;
                const h = rect.height;

                function onMove(e) {
                    let x = e.clientX - desktopRect.left - offsetX;
                    let y = e.clientY - desktopRect.top - offsetY;
                    x = Math.max(0, Math.min(x, desktopRect.width - w));
                    y = Math.max(0, Math.min(y, desktopRect.height - h));
                    el.style.left = x + 'px';
                    el.style.top = y + 'px';
                    el.style.right = 'auto';
                    el.style.bottom = 'auto';
                }

                function onUp() {
                    document.removeEventListener('mousemove', onMove);
                    document.removeEventListener('mouseup', onUp);
                }

                document.addEventListener('mousemove', onMove);
                document.addEventListener('mouseup', onUp);
            });
        }

        // Floating cards — drag from body, not from .card-minimize or .card-header
        document.querySelectorAll('.floating-card').forEach(function(c) {
            makeDraggable(c, null, '.card-minimize, .card-header');
        });

        // Search box — drag from container padding (not input or buttons)
        var sb = document.querySelector('.search-box');
        if (sb) makeDraggable(sb, null, 'input, .search-type-btn, .search-results, .search-result-item');

        // AI dialog — drag from header only
        var ai = document.querySelector('.ai-dialog');
        if (ai) makeDraggable(ai, '.ai-dialog-header');

        // Dock Item Drag Preview
        document.addEventListener('mousedown', function(e) {
            var dockItem = e.target.closest('.dock-item');
            if (!dockItem || dockItem.classList.contains('fixed')) return;

            var preview = document.createElement('div');
            preview.className = 'dock-drag-preview';
            preview.innerHTML = dockItem.innerHTML;
            preview.style.background = getComputedStyle(dockItem).background;
            document.body.appendChild(preview);

            function onMove(e) {
                preview.style.left = e.clientX + 'px';
                preview.style.top = e.clientY + 'px';
            }

            function onUp() {
                document.removeEventListener('mousemove', onMove);
                document.removeEventListener('mouseup', onUp);
                preview.remove();
            }

            document.addEventListener('mousemove', onMove);
            document.addEventListener('mouseup', onUp);
        });

        // ═══════════════════════════════════════════
        // ── Roadmap: 一人公司路线图 ──
        // ═══════════════════════════════════════════

        // ── Helper: render app-icon recommendations ──
        function renderRecs(recs, d) {
            if (!recs || recs.length === 0) return '';
            var items = recs.map(function(r) {
                var name = r.name;
                var url = r.url;
                if (r.dynamic && d) {
                    var cn = d[2] && d[2].a || '';
                    name = cn ? cn + ' 公司' : '公司';
                    url = cn ? '/workspace/?company=' + encodeURIComponent(cn) : '/workspace/';
                }
                return '<a class="step-rec" href="' + url + '" target="_blank" rel="noopener" title="' + name + '">' +
                    '<div class="step-rec-icon" style="background:' + r.bg + ';"><i class="fas ' + r.icon + '"></i></div>' +
                    '<span class="step-rec-name">' + name + '</span></a>';
            }).join('');
            return '<div class="step-recs">' +
                '<div class="step-recs-label">推荐工具</div>' +
                '<div class="step-recs-grid">' + items + '</div></div>';
        }

        var roadmapData = {
            currentStep: 0,
            totalSteps: 8,
            formData: {},
            steps: [
                {
                    title: '产品灵感',
                    icon: 'fa-lightbulb',
                    color: '#FF6B6B',
                    gradient: 'linear-gradient(135deg, #FF6B6B, #EE5A24)',
                    desc: '你的产品创意是什么？描述一下你想要做的方向',
                    recs: [
                        { name: 'ProductHunt', icon: 'fa-rocket', bg: '#DA552F', url: 'https://producthunt.com' },
                        { name: '36氪', icon: 'fa-newspaper', bg: '#1E1E2F', url: 'https://36kr.com' },
                        { name: '人人都是产品经理', icon: 'fa-book', bg: '#2C7BE5', url: 'http://woshipm.com' },
                    ],
                    template: function(d) {
                        return '<div class="step-card">' +
                            '<div class="step-icon-wrap" style="background:' + this.gradient + ';"><i class="fas ' + this.icon + '"></i></div>' +
                            '<h3>' + this.title + '</h3>' +
                            '<div class="step-desc">' + this.desc + '</div>' +
                            '<textarea placeholder="例如：一款面向自由职业者的AI项目管理工具…" id="rInput0" oninput="saveStep(0)">' + (d[0] || '') + '</textarea>' +
                            '<div style="font-size:11px;color:rgba(255,255,255,0.25);">💡 提示：想想你日常工作中最想解决的痛点</div>' +
                            renderRecs(this.recs) +
                            '</div>';
                    }
                },
                {
                    title: '产品名称',
                    icon: 'fa-pen-fancy',
                    color: '#A29BFE',
                    gradient: 'linear-gradient(135deg, #A29BFE, #6C5CE7)',
                    desc: '给你的产品取一个响亮的名字',
                    recs: [
                        { name: 'Namechk', icon: 'fa-globe', bg: '#00A67E', url: 'https://namechk.com' },
                        { name: '商标查询', icon: 'fa-trademark', bg: '#E74C3C', url: 'http://sbj.cnipa.gov.cn' },
                        { name: 'Namecheap', icon: 'fa-shopping-cart', bg: '#E3722E', url: 'https://namecheap.com' },
                    ],
                    template: function(d) {
                        var suggestions = ['创享AI', '智联工坊', '灵犀办公', '慧聚云'];
                        var sugHtml = suggestions.map(function(s) { return '<span class="suggestion-tag" onclick="fillSuggestion(\'' + s + '\')">' + s + '</span>'; }).join('');
                        return '<div class="step-card">' +
                            '<div class="step-icon-wrap" style="background:' + this.gradient + ';"><i class="fas ' + this.icon + '"></i></div>' +
                            '<h3>' + this.title + '</h3>' +
                            '<div class="step-desc">' + this.desc + '</div>' +
                            '<input type="text" placeholder="输入产品名称…" id="rInput1" value="' + (d[1] || '') + '" oninput="saveStep(1)">' +
                            '<button class="btn-ai-gen" onclick="generateNames()"><i class="fas fa-magic"></i> AI 生成建议</button>' +
                            '<div class="suggestion-list">' + sugHtml + '</div>' +
                            renderRecs(this.recs) +
                            '</div>';
                    }
                },
                {
                    title: '公司注册',
                    icon: 'fa-building',
                    color: '#74B9FF',
                    gradient: 'linear-gradient(135deg, #74B9FF, #0984E3)',
                    desc: '填写公司基本信息，打造你的品牌形象',
                    recs: [
                        { name: '天眼查', icon: 'fa-search', bg: '#1890FF', url: 'https://tianyancha.com' },
                        { name: '企查查', icon: 'fa-building', bg: '#FF6B00', url: 'https://qichacha.com' },
                        { name: '国家企业信用公示', icon: 'fa-balance-scale', bg: '#C0392B', url: 'http://gsxt.gov.cn' },
                    ],
                    template: function(d) {
                        return '<div class="step-card">' +
                            '<div class="step-icon-wrap" style="background:' + this.gradient + ';"><i class="fas ' + this.icon + '"></i></div>' +
                            '<h3>' + this.title + '</h3>' +
                            '<div class="step-desc">' + this.desc + '</div>' +
                            '<div class="logo-upload" onclick="alert(\'Logo上传功能待集成\')"><i class="fas fa-camera"></i></div>' +
                            '<input type="text" placeholder="公司全称" id="rInput2a" value="' + (d[2] && d[2].a || '') + '" oninput="saveStep(2)">' +
                            '<input type="text" placeholder="公司标语 / Slogan" id="rInput2b" value="' + (d[2] && d[2].b || '') + '" oninput="saveStep(2)">' +
                            renderRecs(this.recs) +
                            '</div>';
                    }
                },
                {
                    title: '政策查询',
                    icon: 'fa-clipboard-check',
                    color: '#55EFC4',
                    gradient: 'linear-gradient(135deg, #55EFC4, #00B894)',
                    desc: '选择你的行业分类，查看相关政策要求',
                    recs: [
                        { name: '中国政府网', icon: 'fa-flag', bg: '#E74C3C', url: 'https://gov.cn' },
                        { name: '国家税务总局', icon: 'fa-calculator', bg: '#2C3E50', url: 'https://chinatax.gov.cn' },
                        { name: '国家知识产权局', icon: 'fa-copyright', bg: '#2980B9', url: 'https://cnipa.gov.cn' },
                    ],
                    template: function(d) {
                        var industries = ['信息技术', '文化传媒', '电子商务', '教育咨询', '设计创意', '其他'];
                        var items = industries.map(function(ind, i) {
                            var checked = d[4] && d[4].indexOf(ind) !== -1;
                            return '<div class="checklist-item' + (checked ? ' checked' : '') + '" onclick="toggleIndustry(this, \'' + ind + '\')">' +
                                '<div class="ck-icon"><i class="fas fa-check"></i></div>' +
                                '<span>' + ind + '</span></div>';
                        }).join('');
                        return '<div class="step-card">' +
                            '<div class="step-icon-wrap" style="background:' + this.gradient + ';"><i class="fas ' + this.icon + '"></i></div>' +
                            '<h3>' + this.title + '</h3>' +
                            '<div class="step-desc">' + this.desc + '</div>' +
                            '<div class="checklist-grid">' + items + '</div>' +
                            '<div style="font-size:11px;color:rgba(255,255,255,0.25);">📋 选择后系统将匹配注册政策和补贴信息</div>' +
                            renderRecs(this.recs) +
                            '</div>';
                    }
                },
                {
                    title: '工商注册',
                    icon: 'fa-file-contract',
                    color: '#FDCB6E',
                    gradient: 'linear-gradient(135deg, #FDCB6E, #F39C12)',
                    desc: '填写工商注册所需的核心信息',
                    recs: [
                        { name: '一网通办', icon: 'fa-laptop', bg: '#007AFF', url: 'https://zwfw.gjbsj.gov.cn' },
                        { name: '电子营业执照', icon: 'fa-qrcode', bg: '#8E44AD', url: 'https://dzswj.gsxt.gov.cn' },
                        { name: '银行开户预约', icon: 'fa-university', bg: '#27AE60', url: 'https://icbc.com.cn' },
                    ],
                    template: function(d) {
                        return '<div class="step-card">' +
                            '<div class="step-icon-wrap" style="background:' + this.gradient + ';"><i class="fas ' + this.icon + '"></i></div>' +
                            '<h3>' + this.title + '</h3>' +
                            '<div class="step-desc">' + this.desc + '</div>' +
                            '<input type="text" placeholder="法人代表姓名" id="rInput5a" value="' + (d[5] && d[5].a || '') + '" oninput="saveStep(5)">' +
                            '<input type="text" placeholder="注册地址" id="rInput5b" value="' + (d[5] && d[5].b || '') + '" oninput="saveStep(5)">' +
                            '<input type="text" placeholder="注册资本（万元）" id="rInput5c" value="' + (d[5] && d[5].c || '') + '" oninput="saveStep(5)">' +
                            renderRecs(this.recs) +
                            '</div>';
                    }
                },
                {
                    title: '线上运营',
                    icon: 'fa-rocket',
                    color: '#FD79A8',
                    gradient: 'linear-gradient(135deg, #FD79A8, #E84393)',
                    desc: '选择你计划开通的线上运营平台',
                    recs: [
                        { name: '微信公众平台', icon: 'fa-weixin', bg: '#07C160', url: 'https://mp.weixin.qq.com' },
                        { name: '抖音开放平台', icon: 'fa-film', bg: '#000', url: 'https://open.douyin.com' },
                        { name: '支付宝开放平台', icon: 'fa-hand-holding-usd', bg: '#1677FF', url: 'https://open.alipay.com' },
                    ],
                    template: function(d) {
                        var platforms = ['官方网站', '微信公众号', '抖音号', '小红书', 'B站', '知乎专栏', '小程序', '淘宝店铺'];
                        var items = platforms.map(function(p, i) {
                            var checked = d[6] && d[6].indexOf(p) !== -1;
                            return '<div class="checklist-item' + (checked ? ' checked' : '') + '" onclick="togglePlatform(this, \'' + p + '\')">' +
                                '<div class="ck-icon"><i class="fas fa-check"></i></div>' +
                                '<span>' + p + '</span></div>';
                        }).join('');
                        return '<div class="step-card">' +
                            '<div class="step-icon-wrap" style="background:' + this.gradient + ';"><i class="fas ' + this.icon + '"></i></div>' +
                            '<h3>' + this.title + '</h3>' +
                            '<div class="step-desc">' + this.desc + '</div>' +
                            '<div class="checklist-grid">' + items + '</div>' +
                            renderRecs(this.recs) +
                            '</div>';
                    }
                },
                {
                    title: '营销推广',
                    icon: 'fa-bullhorn',
                    color: '#A29BFE',
                    gradient: 'linear-gradient(135deg, #A29BFE, #6C5CE7)',
                    desc: '规划你的初期推广策略和预算',
                    recs: [
                        { name: '巨量引擎', icon: 'fa-chart-line', bg: '#1E8BFF', url: 'https://oceanengine.com' },
                        { name: '百度营销', icon: 'fa-ad', bg: '#2932E1', url: 'https://yj.baidu.com' },
                        { name: '新榜', icon: 'fa-chart-bar', bg: '#FF6B00', url: 'https://newrank.cn' },
                    ],
                    template: function(d) {
                        var budget = d[7] && d[7].budget || 5000;
                        return '<div class="step-card">' +
                            '<div class="step-icon-wrap" style="background:' + this.gradient + ';"><i class="fas ' + this.icon + '"></i></div>' +
                            '<h3>' + this.title + '</h3>' +
                            '<div class="step-desc">' + this.desc + '</div>' +
                            '<div class="checklist-grid">' +
                            '<div class="checklist-item' + (d[7] && d[7].seo ? ' checked' : '') + '" onclick="toggleMarketing(this, \'seo\')"><div class="ck-icon"><i class="fas fa-check"></i></div><span>SEO 优化</span></div>' +
                            '<div class="checklist-item' + (d[7] && d[7].social ? ' checked' : '') + '" onclick="toggleMarketing(this, \'social\')"><div class="ck-icon"><i class="fas fa-check"></i></div><span>社交媒体</span></div>' +
                            '<div class="checklist-item' + (d[7] && d[7].ads ? ' checked' : '') + '" onclick="toggleMarketing(this, \'ads\')"><div class="ck-icon"><i class="fas fa-check"></i></div><span>付费广告</span></div>' +
                            '<div class="checklist-item' + (d[7] && d[7].kol ? ' checked' : '') + '" onclick="toggleMarketing(this, \'kol\')"><div class="ck-icon"><i class="fas fa-check"></i></div><span>KOL 合作</span></div>' +
                            '</div>' +
                            '<div class="budget-slider-wrap">' +
                            '<input type="range" min="1000" max="100000" step="1000" value="' + budget + '" oninput="updateBudget(this.value)">' +
                            '<div class="budget-val">¥<span id="budgetDisplay">' + budget.toLocaleString() + '</span></div>' +
                            '</div>' +
                            renderRecs(this.recs) +
                            '</div>';
                    }
                },
                {
                    title: '公司成立！🎉',
                    icon: 'fa-glass-cheers',
                    color: '#FFD700',
                    gradient: 'linear-gradient(135deg, #FFD700, #FFA500)',
                    desc: '恭喜你完成了一人公司创建的全流程！',
                    recs: [
                        { name: 'AI导航', icon: 'fa-compass', bg: '#007AFF', url: '/' },
                        { name: '本工作台', icon: 'fa-desktop', bg: '#AF52DE', url: '/workspace/', dynamic: true },
                    ],
                    template: function(d) {
                        var summary = [
                            { label: '产品灵感', key: 0 },
                            { label: '产品名称', key: 1 },
                            { label: '公司全称', key: '2a' },
                            { label: '标语', key: '2b' },
                            { label: '行业方向', key: 4 },
                            { label: '运营平台', key: 6 },
                        ];
                        var items = summary.map(function(s) {
                            var val = '-';
                            if (s.key === 0) val = d[0] || '-';
                            else if (s.key === 1) val = d[1] || '-';
                            else if (s.key === '2a') val = (d[2] && d[2].a) || '-';
                            else if (s.key === '2b') val = (d[2] && d[2].b) || '-';
                            else if (s.key === 4) val = (d[4] && d[4].join(', ')) || '-';
                            else if (s.key === 6) val = (d[6] && d[6].join(', ')) || '-';
                            return '<div class="summary-item"><span>' + s.label + '</span><span class="sv">' + val + '</span></div>';
                        }).join('');
                        var coName = d[2] && d[2].a || '';
                        var coHtml = coName ? '<span style="color:#FFD700;font-size:1.2em;font-weight:800;">' + coName + '</span> 公司' : '公司';
                        return '<div class="step-card celebration">' +
                            '<span class="big-icon">🎊</span>' +
                            '<h2>恭喜您，您的 ' + coHtml + ' 正式成立了！</h2>' +
                            '<div class="sub-text">你已完成全部 8 个步骤，以下是你的创业蓝图</div>' +
                            '<div class="summary-card">' + items + '</div>' +
                            renderRecs(this.recs, d) +
                            '<div style="margin-top:16px;font-size:13px;color:rgba(255,255,255,0.35);">🌟 保存这份蓝图，开始你的创业之旅吧！</div>' +
                            '</div>';
                    }
                }
            ]
        };

        var roadmapForm = {};

        function openRoadmap() {
            var overlay = document.getElementById('roadmapOverlay');
            overlay.classList.add('active');
            document.body.style.overflow = 'hidden';
            roadmapForm = {};
            roadmapData.currentStep = 0;
            renderStepList();
            goToStep(0);
            startParticles();
        }

        function closeRoadmap() {
            var overlay = document.getElementById('roadmapOverlay');
            overlay.classList.remove('active');
            document.body.style.overflow = '';
            stopParticles();
            stopConfetti();
        }

        function renderStepList() {
            var list = document.getElementById('stepList');
            list.innerHTML = '';
            for (var i = 0; i < roadmapData.steps.length; i++) {
                var s = roadmapData.steps[i];
                var btn = document.createElement('button');
                btn.className = 'roadmap-step-indicator';
                btn.innerHTML = '<span class="step-num">' + (i + 1) + '</span><span>' + s.title.replace('🎉', '').trim() + '</span>';
                btn.onclick = (function(idx) { return function() { goToStep(idx); }; })(i);
                btn.id = 'stepIndicator' + i;
                list.appendChild(btn);
            }
        }

        function updateStepList() {
            var cur = roadmapData.currentStep;
            for (var i = 0; i < roadmapData.steps.length; i++) {
                var btn = document.getElementById('stepIndicator' + i);
                if (!btn) continue;
                btn.className = 'roadmap-step-indicator';
                if (i === cur) btn.classList.add('active');
                else if (i < cur) btn.classList.add('completed');
            }
        }

        function goToStep(idx) {
            var container = document.getElementById('stepsContainer');
            var titleEl = document.getElementById('stepTitle');
            var prev = roadmapData.currentStep;
            var total = roadmapData.steps.length;

            if (idx < 0) idx = 0;
            if (idx >= total) idx = total - 1;

            // Direction for animation
            var direction = idx > prev ? 1 : -1;

            // Remove old active
            var oldActive = container.querySelector('.roadmap-step.active');
            if (oldActive) {
                oldActive.classList.remove('active');
                oldActive.classList.add(direction > 0 ? 'exit-left' : 'exit-left');
                setTimeout(function() { if (oldActive) oldActive.classList.remove('exit-left'); }, 500);
            }

            roadmapData.currentStep = idx;

            // Render new step
            container.innerHTML = '';
            var stepDiv = document.createElement('div');
            stepDiv.className = 'roadmap-step';
            stepDiv.style.transform = 'translateX(' + (direction > 0 ? 50 : -50) + 'px) rotateY(' + (direction > 0 ? 4 : -4) + 'deg)';
            stepDiv.innerHTML = roadmapData.steps[idx].template(roadmapForm);
            container.appendChild(stepDiv);

            // Trigger reflow
            void stepDiv.offsetWidth;

            // Animate in
            stepDiv.classList.add('active');
            stepDiv.style.transform = '';

            // Update title with gradient
            titleEl.textContent = roadmapData.steps[idx].title.replace('🎉', '').trim();
            if (idx === total - 1) {
                titleEl.textContent = '🎉 公司成立！';
            }

            // Update nav buttons
            document.getElementById('btnPrev').style.visibility = idx === 0 ? 'hidden' : 'visible';
            var nextBtn = document.getElementById('btnNext');
            if (idx === total - 1) {
                nextBtn.innerHTML = '<i class="fas fa-check"></i> 完成';
                nextBtn.onclick = function() { closeRoadmap(); fireConfetti(); };
            } else {
                nextBtn.innerHTML = '下一步 <i class="fas fa-arrow-right"></i>';
                nextBtn.onclick = function() { nextStep(); };
            }

            // Update counter
            document.getElementById('stepCounter').textContent = (idx + 1) + ' / ' + total;

            // Update sidebar
            updateStepList();
            updateProgress();

            // Fire confetti on last step
            if (idx === total - 1) {
                fireConfetti();
            } else {
                stopConfetti();
            }
        }

        function nextStep() {
            goToStep(roadmapData.currentStep + 1);
        }

        function prevStep() {
            goToStep(roadmapData.currentStep - 1);
        }

        function saveStep(idx) {
            var el = document.getElementById('rInput' + idx);
            if (el) {
                roadmapForm[idx] = el.value;
            }
            // Composite fields (like step 2: company info)
            var elA = document.getElementById('rInput2a');
            var elB = document.getElementById('rInput2b');
            if (elA && elB) {
                roadmapForm[2] = { a: elA.value, b: elB.value };
                try { localStorage.setItem('roadmap_company', elA.value || ''); } catch(e) {}
            }
            var el5a = document.getElementById('rInput5a');
            var el5b = document.getElementById('rInput5b');
            var el5c = document.getElementById('rInput5c');
            if (el5a && el5b && el5c) {
                roadmapForm[5] = { a: el5a.value, b: el5b.value, c: el5c.value };
            }
        }

        function fillSuggestion(name) {
            var inp = document.getElementById('rInput1');
            if (inp) { inp.value = name; roadmapForm[1] = name; }
        }

        function generateNames() {
            var names = ['智造未来', 'AI创想家', '云帆启航', '独角兽工场', '灵感引擎'];
            var list = document.querySelector('.suggestion-list');
            if (list) {
                list.innerHTML = names.map(function(n) {
                    return '<span class="suggestion-tag" onclick="fillSuggestion(\'' + n + '\')">' + n + '</span>';
                }).join('');
            }
        }

        function toggleIndustry(el, name) {
            el.classList.toggle('checked');
            if (!roadmapForm[4]) roadmapForm[4] = [];
            var arr = roadmapForm[4];
            var idx = arr.indexOf(name);
            if (idx === -1) arr.push(name);
            else arr.splice(idx, 1);
            saveStep(4);
        }

        function togglePlatform(el, name) {
            el.classList.toggle('checked');
            if (!roadmapForm[6]) roadmapForm[6] = [];
            var arr = roadmapForm[6];
            var idx = arr.indexOf(name);
            if (idx === -1) arr.push(name);
            else arr.splice(idx, 1);
        }

        function toggleMarketing(el, key) {
            el.classList.toggle('checked');
            if (!roadmapForm[7]) roadmapForm[7] = {};
            roadmapForm[7][key] = !roadmapForm[7][key];
        }

        function updateBudget(val) {
            if (!roadmapForm[7]) roadmapForm[7] = {};
            roadmapForm[7].budget = parseInt(val);
            var display = document.getElementById('budgetDisplay');
            if (display) display.textContent = parseInt(val).toLocaleString();
        }

        function updateProgress() {
            var total = roadmapData.steps.length;
            var cur = roadmapData.currentStep;
            var pct = Math.round((cur) / (total - 1) * 100);
            var circle = document.getElementById('progressCircle');
            var text = document.getElementById('progressText');
            if (circle) {
                var circ = 2 * Math.PI * 45;
                var offset = circ - (pct / 100) * circ;
                circle.style.strokeDashoffset = offset;
            }
            if (text) text.textContent = pct + '%';
        }

        // ── Particle Canvas ──
        var particleInterval;

        function startParticles() {
            var canvas = document.getElementById('particle-canvas');
            if (!canvas) return;
            var ctx = canvas.getContext('2d');
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;

            var particles = [];
            var count = 80;

            for (var i = 0; i < count; i++) {
                particles.push({
                    x: Math.random() * canvas.width,
                    y: Math.random() * canvas.height,
                    r: Math.random() * 2 + 0.5,
                    dx: (Math.random() - 0.5) * 0.5,
                    dy: (Math.random() - 0.5) * 0.5,
                    o: Math.random() * 0.5 + 0.1
                });
            }

            var mouseX = canvas.width / 2;
            var mouseY = canvas.height / 2;

            function onMouse(e) {
                mouseX = e.clientX;
                mouseY = e.clientY;
            }
            document.addEventListener('mousemove', onMouse);

            function animate() {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                for (var i = 0; i < particles.length; i++) {
                    var p = particles[i];
                    p.x += p.dx;
                    p.y += p.dy;

                    // Mouse interaction
                    var dx = mouseX - p.x;
                    var dy = mouseY - p.y;
                    var dist = Math.sqrt(dx * dx + dy * dy);
                    if (dist < 200) {
                        p.x -= dx * 0.002;
                        p.y -= dy * 0.002;
                    }

                    if (p.x < 0) p.x = canvas.width;
                    if (p.x > canvas.width) p.x = 0;
                    if (p.y < 0) p.y = canvas.height;
                    if (p.y > canvas.height) p.y = 0;

                    ctx.beginPath();
                    ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
                    ctx.fillStyle = 'rgba(255, 255, 255, ' + p.o + ')';
                    ctx.fill();

                    // Draw connections
                    for (var j = i + 1; j < particles.length; j++) {
                        var p2 = particles[j];
                        var d2 = Math.sqrt(Math.pow(p.x - p2.x, 2) + Math.pow(p.y - p2.y, 2));
                        if (d2 < 150) {
                            ctx.beginPath();
                            ctx.moveTo(p.x, p.y);
                            ctx.lineTo(p2.x, p2.y);
                            ctx.strokeStyle = 'rgba(255, 255, 255, ' + (0.08 * (1 - d2 / 150)) + ')';
                            ctx.lineWidth = 0.5;
                            ctx.stroke();
                        }
                    }
                }
                particleInterval = requestAnimationFrame(animate);
            }
            animate();

            window._particleCleanup = function() {
                document.removeEventListener('mousemove', onMouse);
            };
        }

        function stopParticles() {
            if (particleInterval) {
                cancelAnimationFrame(particleInterval);
                particleInterval = null;
            }
            if (window._particleCleanup) {
                window._particleCleanup();
                window._particleCleanup = null;
            }
        }

        // ── Confetti ──
        var confettiInterval;

        function fireConfetti() {
            var canvas = document.getElementById('confetti-canvas');
            if (!canvas) return;
            var ctx = canvas.getContext('2d');
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;

            var pieces = [];
            var colors = ['#FF6B6B', '#FFD700', '#55EFC4', '#74B9FF', '#A29BFE', '#FD79A8', '#FFA502'];

            for (var i = 0; i < 150; i++) {
                pieces.push({
                    x: Math.random() * canvas.width,
                    y: Math.random() * canvas.height - canvas.height,
                    w: Math.random() * 10 + 5,
                    h: Math.random() * 6 + 3,
                    color: colors[Math.floor(Math.random() * colors.length)],
                    vy: Math.random() * 3 + 2,
                    vx: (Math.random() - 0.5) * 2,
                    rot: Math.random() * 360,
                    rotSpeed: (Math.random() - 0.5) * 10,
                    o: 1
                });
            }

            var duration = 3000;
            var start = Date.now();

            function animate() {
                var elapsed = Date.now() - start;
                if (elapsed > duration) {
                    ctx.clearRect(0, 0, canvas.width, canvas.height);
                    return;
                }

                ctx.clearRect(0, 0, canvas.width, canvas.height);
                for (var i = 0; i < pieces.length; i++) {
                    var p = pieces[i];
                    p.x += p.vx;
                    p.y += p.vy;
                    p.vy += 0.05;
                    p.rot += p.rotSpeed;
                    p.o = Math.max(0, 1 - elapsed / duration);

                    ctx.save();
                    ctx.translate(p.x, p.y);
                    ctx.rotate(p.rot * Math.PI / 180);
                    ctx.globalAlpha = p.o;
                    ctx.fillStyle = p.color;
                    ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
                    ctx.restore();
                }

                confettiInterval = requestAnimationFrame(animate);
            }
            animate();
        }

        function stopConfetti() {
            if (confettiInterval) {
                cancelAnimationFrame(confettiInterval);
                confettiInterval = null;
                var canvas = document.getElementById('confetti-canvas');
                if (canvas) {
                    var ctx = canvas.getContext('2d');
                    ctx.clearRect(0, 0, canvas.width, canvas.height);
                }
            }
        }

        // Handle resize for canvases
        window.addEventListener('resize', function() {
            var pc = document.getElementById('particle-canvas');
            var cc = document.getElementById('confetti-canvas');
            if (pc) { pc.width = window.innerWidth; pc.height = window.innerHeight; }
            if (cc) { cc.width = window.innerWidth; cc.height = window.innerHeight; }
        });

        // Close overlay on Esc
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape') closeRoadmap();
        });

        // Run auth check on page load
        checkAuth();
