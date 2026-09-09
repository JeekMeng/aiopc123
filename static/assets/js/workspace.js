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
            if (str == null) return '';
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
                '  <a class="dropdown-item" href="/workspace/"><i class="fas fa-desktop"></i> OPC工作台</a>' +
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
                        var user = data.user || null;
                        if (!user) {
                            localStorage.removeItem('auth_user');
                            currentUser = null;
                            document.getElementById('workspaceGuard').style.display = 'flex';
                            return;
                        }
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
        // Theme Toggle
        function toggleTheme() {
            const body = document.body;
            const theme = body.getAttribute('data-theme');
            const newTheme = theme === 'light' ? 'dark' : 'light';
            body.setAttribute('data-theme', newTheme);
            document.querySelector('.theme-btn i').className = newTheme === 'dark' ? 'fas fa-moon' : 'fas fa-sun';
            try { localStorage.setItem('ws_theme', newTheme); } catch(e){}
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

        // ═══════════════════════════════════════════
        // ── 行业分类数据 ──
        // ═══════════════════════════════════════════

        var INDUSTRY_DATA = {
            '自媒体': [
                { id: 'tech-media', name: '科技自媒体', tpl: '推荐产品评测、AI工具分享' },
                { id: 'ai-media', name: 'AI自媒体', tpl: 'AI应用教学、行业洞察' },
                { id: 'resource-media', name: '资料分享自媒体', tpl: '资料整理、课程分享' }
            ],
            '独立站(境内)': [
                { id: '境内-电商网站', name: '电商网站', tpl: '产品销售、品牌展示' },
                { id: '境内-博客网站', name: '博客网站', tpl: '内容创作、SEO获客' },
                { id: '境内-导航网站', name: '导航网站', tpl: '工具导航、资源聚合' },
                { id: '境内-GEO获客系统', name: 'GEO获客系统', tpl: 'AI搜索优化、流量获取' }
            ],
            '独立站(境外)': [
                { id: '境外-电商网站', name: '电商网站', tpl: '跨境电商、海外销售' },
                { id: '境外-博客网站', name: '博客网站', tpl: '英文内容、联盟营销' },
                { id: '境外-导航网站', name: '导航网站', tpl: '海外工具导航' },
                { id: '境外-GEO获客系统', name: 'GEO获客系统', tpl: '海外AI搜索优化' }
            ],
            'AI产品': [
                { id: '办公智能体', name: '办公智能体', tpl: 'AI助手、效率工具' },
                { id: '代码智能体', name: '代码智能体', tpl: 'AI编程、开发工具' }
            ]
        };

        var DEPT_DEFAULTS = [
            { name: 'CEO', icon: 'fa-crown', bg: 'linear-gradient(135deg,#FF6B6B,#EE5A24)',
              tools: [
                { name:'豆包', icon:'fa-robot', url:'https://doubao.com', bg:'#007AFF', logo:'200295.webp' },
                { name:'千问', icon:'fa-robot', url:'https://tongyi.aliyun.com', bg:'#6236FF', logo:'200300.webp' },
                { name:'腾讯元宝', icon:'fa-robot', url:'https://yuanbao.tencent.com', bg:'#07C160', logo:'200297.webp' },
                { name:'DeepSeek', icon:'fa-robot', url:'https://chat.deepseek.com', bg:'#4D6BFE' }
              ]},
            { name: '技术部', icon: 'fa-code', bg: 'linear-gradient(135deg,#007AFF,#5856D6)',
              tools: [
                { name:'Claude', icon:'fa-robot', url:'https://claude.ai', bg:'#10A37F' },
                { name:'Codex', icon:'fa-robot', url:'https://openai.com', bg:'#10A37F' },
                { name:'OpenCode', icon:'fa-terminal', url:'https://opencode.ai', bg:'#333' },
                { name:'GitHub', icon:'fa-code-branch', url:'https://github.com', bg:'#24292e' }
              ]},
            { name: '产品部', icon: 'fa-lightbulb', bg: 'linear-gradient(135deg,#FF9500,#FF6B00)',
              tools: [
                { name:'ProductHunt', icon:'fa-rocket', url:'https://producthunt.com', bg:'#DA552F' },
                { name:'36氪', icon:'fa-newspaper', url:'https://36kr.com', bg:'#1E1E2F' },
                { name:'人人PM', icon:'fa-users', url:'http://woshipm.com', bg:'#2C7BE5' },
                { name:'Namechk', icon:'fa-search', url:'https://namechk.com', bg:'#00A67E' }
              ]},
            { name: '运营部', icon: 'fa-chart-line', bg: 'linear-gradient(135deg,#34C759,#30D158)',
              tools: [
                { name:'微信', icon:'fa-weixin', url:'https://mp.weixin.qq.com', bg:'#07C160' },
                { name:'抖音', icon:'fa-film', url:'https://open.douyin.com', bg:'#000' },
                { name:'小红书', icon:'fa-book', url:'https://www.xiaohongshu.com', bg:'#FE2C55', logo:'200119.webp' },
                { name:'新榜', icon:'fa-chart-bar', url:'https://newrank.cn', bg:'#FF6B00' }
              ]},
            { name: '市场部', icon: 'fa-bullhorn', bg: 'linear-gradient(135deg,#5856D6,#AF52DE)',
              tools: [
                { name:'巨量引擎', icon:'fa-chart-line', url:'https://oceanengine.com', bg:'#1E8BFF' },
                { name:'百度营销', icon:'fa-ad', url:'https://yj.baidu.com', bg:'#2932E1' },
                { name:'SEO', icon:'fa-search', url:'https://ahrefs.com', bg:'#2D333F' },
                { name:'HubSpot', icon:'fa-tasks', url:'https://hubspot.com', bg:'#FF7A59' }
              ]},
            { name: '剪辑部', icon: 'fa-film', bg: 'linear-gradient(135deg,#FD79A8,#E84393)',
              tools: [
                { name:'剪映', icon:'fa-video', url:'https://www.capcut.cn', bg:'#000' },
                { name:'Canva', icon:'fa-palette', url:'https://canva.com', bg:'#00C4CC' },
                { name:'CapCut', icon:'fa-film', url:'https://capcut.com', bg:'#000' },
                { name:'Descript', icon:'fa-microphone', url:'https://descript.com', bg:'#4D6BFE' }
              ]},
            { name: '行政部', icon: 'fa-building', bg: 'linear-gradient(135deg,#5856D6,#007AFF)',
              tools: [
                { name:'天眼查', icon:'fa-search', url:'https://tianyancha.com', bg:'#1890FF', logo:'200012.webp' },
                { name:'企查查', icon:'fa-building', url:'https://qichacha.com', bg:'#FF6B00', logo:'200011.webp' },
                { name:'一网通办', icon:'fa-laptop', url:'https://zwfw.gjbsj.gov.cn', bg:'#007AFF' },
                { name:'信用公示', icon:'fa-balance-scale', url:'http://gsxt.gov.cn', bg:'#C0392B' }
              ]}
        ];

        // ═══════════════════════════════════════════
        // ── 创建流程（7 步） ──
        // ═══════════════════════════════════════════

        var roadmapData = {
            currentStep: 0,
            totalSteps: 7,
            formData: {},
            steps: [
                // 步骤 1：选择行业类型
                {
                    title: '选择行业类型',
                    icon: 'fa-th-large',
                    color: '#FF6B6B',
                    gradient: 'linear-gradient(135deg, #FF6B6B, #EE5A24)',
                    desc: '选择你要创办的一人公司行业方向',
                    template: function(d) {
                        var tabs = Object.keys(INDUSTRY_DATA);
                        var activeTab = d._industryTab || tabs[0];
                        var tabHtml = tabs.map(function(t) {
                            return '<div class="industry-tab' + (t === activeTab ? ' active' : '') + '" onclick="switchIndustryTab(\'' + t + '\')">' + t + '</div>';
                        }).join('');
                        var subs = INDUSTRY_DATA[activeTab] || [];
                        var subHtml = subs.map(function(s) {
                            var checked = d._subCategory === s.id;
                            return '<div class="industry-item' + (checked ? ' selected' : '') + '" onclick="selectSubCategory(\'' + s.id + '\',\'' + s.name + '\',\'' + activeTab + '\')">' +
                                '<div class="industry-item-name">' + s.name + '</div>' +
                                '<div class="industry-item-desc">' + s.tpl + '</div>' +
                                '</div>';
                        }).join('');
                        return '<div class="step-card">' +
                            '<div class="step-icon-wrap" style="background:' + this.gradient + ';"><i class="fas ' + this.icon + '"></i></div>' +
                            '<h3>' + this.title + '</h3>' +
                            '<div class="step-desc">' + this.desc + '</div>' +
                            '<div class="industry-tabs">' + tabHtml + '</div>' +
                            '<div class="industry-list">' + subHtml + '</div>' +
                            '<input type="text" placeholder="或手动输入行业类型…" id="rInputIndustry" value="' + (d._industryManual || '') + '" oninput="roadmapForm._industryManual=this.value" style="margin-top:12px;">' +
                            '</div>';
                    }
                },
                // 步骤 2：公司地址
                {
                    title: '公司地址',
                    icon: 'fa-map-marker-alt',
                    color: '#74B9FF',
                    gradient: 'linear-gradient(135deg, #74B9FF, #0984E3)',
                    desc: '填写公司注册地址，用于匹配本地政策',
                    template: function(d) {
                        var cities = ['北京', '上海', '杭州', '深圳', '广州', '成都', '武汉', '南京', '西安', '苏州'];
                        var cityHtml = cities.map(function(c) {
                            return '<span class="suggestion-tag" onclick="fillAddress(&quot;' + c + '市&quot;)">' + c + '</span>';
                        }).join('');
                        return '<div class="step-card">' +
                            '<div class="step-icon-wrap" style="background:' + this.gradient + ';"><i class="fas ' + this.icon + '"></i></div>' +
                            '<h3>' + this.title + '</h3>' +
                            '<div class="step-desc">' + this.desc + '</div>' +
                            '<input type="text" placeholder="例：杭州市西湖区" id="rInputAddress" value="' + (d._address || '') + '" oninput="saveStepAddr()">' +
                            '<div class="suggestion-list">' + cityHtml + '</div>' +
                            '</div>';
                    }
                },
                // 步骤 3：公司信息（名称+Slogan+Logo+联系方式）
                {
                    title: '公司信息',
                    icon: 'fa-building',
                    color: '#34C759',
                    gradient: 'linear-gradient(135deg, #34C759, #30D158)',
                    desc: '填写公司基本信息，打造品牌形象',
                    template: function(d) {
                        var co = d._company || {};
                        return '<div class="step-card">' +
                            '<div class="step-icon-wrap" style="background:' + this.gradient + ';"><i class="fas ' + this.icon + '"></i></div>' +
                            '<h3>' + this.title + '</h3>' +
                            '<div class="step-desc">' + this.desc + '</div>' +
                            '<div class="logo-upload" onclick="triggerLogoUpload()"><i class="fas fa-camera"></i><span>上传Logo</span></div>' +
                            '<input type="file" id="logoFileInput" accept="image/*" style="display:none" onchange="handleLogoUpload(event)">' +
                            '<div id="logoPreview" style="display:none;text-align:center;margin-bottom:12px;"><img id="logoPreviewImg" style="max-width:80px;max-height:80px;border-radius:8px;"></div>' +
                            '<input type="text" placeholder="公司全称 *" id="rInputCoName" value="' + (co.name || '') + '" oninput="saveStepCompany()">' +
                            '<input type="text" placeholder="公司标语 / Slogan" id="rInputSlogan" value="' + (co.slogan || '') + '" oninput="saveStepCompany()">' +
                            '<input type="text" placeholder="手机号（选填）" id="rInputPhone" value="' + (co.phone || '') + '" oninput="saveStepCompany()">' +
                            '<input type="email" placeholder="邮箱（选填）" id="rInputEmail" value="' + (co.email || '') + '" oninput="saveStepCompany()">' +
                            '</div>';
                    }
                },
                // 步骤 4：工商注册
                {
                    title: '工商注册',
                    icon: 'fa-file-contract',
                    color: '#FDCB6E',
                    gradient: 'linear-gradient(135deg, #FDCB6E, #F39C12)',
                    desc: '填写工商注册所需信息',
                    recs: [
                        { name: '天眼查', icon: 'fa-search', bg: '#1890FF', url: 'https://tianyancha.com' },
                        { name: '企查查', icon: 'fa-building', bg: '#FF6B00', url: 'https://qichacha.com' },
                        { name: '信用公示', icon: 'fa-balance-scale', bg: '#C0392B', url: 'http://gsxt.gov.cn' },
                    ],
                    template: function(d) {
                        var biz = d._business || {};
                        var addr = d._address || '';
                        return '<div class="step-card">' +
                            '<div class="step-icon-wrap" style="background:' + this.gradient + ';"><i class="fas ' + this.icon + '"></i></div>' +
                            '<h3>' + this.title + '</h3>' +
                            '<div class="step-desc">' + this.desc + '</div>' +
                            '<input type="text" placeholder="法人代表姓名" id="rInputLegal" value="' + (biz.legal || '') + '" oninput="saveStepBiz()">' +
                            '<input type="text" placeholder="注册地址" id="rInputRegAddr" value="' + (biz.regAddr || addr) + '" oninput="saveStepBiz()">' +
                            '<input type="text" placeholder="注册资本（万元）" id="rInputCapital" value="' + (biz.capital || '') + '" oninput="saveStepBiz()">' +
                            renderRecs(this.recs) +
                            '</div>';
                    }
                },
                // 步骤 5：创建部门
                {
                    title: '创建部门',
                    icon: 'fa-sitemap',
                    color: '#5856D6',
                    gradient: 'linear-gradient(135deg, #5856D6, #007AFF)',
                    desc: '选择要创建的部门和默认 AI 工具',
                    template: function(d) {
                        var depts = (d._tplDepts && d._tplDepts.length) ? d._tplDepts : DEPT_DEFAULTS;
                        var selected = d._depts || depts.map(function(dd){return dd.name;});
                        var html = '<div class="step-card">' +
                            '<div class="step-icon-wrap" style="background:' + this.gradient + ';"><i class="fas ' + this.icon + '"></i></div>' +
                            '<h3>' + this.title + '</h3>' +
                            '<div class="step-desc">' + this.desc + '</div>' +
                            '<div class="dept-select-grid">';
                        depts.forEach(function(dept) {
                            var checked = selected.indexOf(dept.name) !== -1;
                            var toolsHtml = (dept.tools||[]).map(function(t) {
                                return '<span class="dept-tool-tag" style="background:' + (t.bg||'#007AFF') + '20;color:' + (t.bg||'#007AFF') + ';">' + (t.name||'') + '</span>';
                            }).join('');
                            html += '<div class="dept-select-item' + (checked ? ' selected' : '') + '" onclick="toggleDept(\'' + dept.name + '\', this)">' +
                                '<div class="dept-select-check"><i class="fas fa-check"></i></div>' +
                                '<div class="dept-select-info"><div class="dept-select-name">' + dept.name + '</div>' +
                                '<div class="dept-select-tools">' + toolsHtml + '</div></div></div>';
                        });
                        html += '</div>' +
                            '<div style="margin-top:12px;"><input type="text" placeholder="自定义部门名称" id="rInputCustomDept" class="app-input-sm">' +
                            '<button class="btn-ai-gen" onclick="addCustomDept()" style="margin-left:8px;"><i class="fas fa-plus"></i> 添加</button></div>' +
                            '</div>';
                        return html;
                    }
                },
                // 步骤 6：创建产品
                {
                    title: '创建产品',
                    icon: 'fa-cubes',
                    color: '#FF9500',
                    gradient: 'linear-gradient(135deg, #FF9500, #FF6B00)',
                    desc: '添加你要推出的产品（可创建多个）',
                    template: function(d) {
                        var products = d._products || [];
                        var prodHtml = products.map(function(p, i) {
                            return '<div class="product-entry" data-idx="' + i + '">' +
                                '<div class="product-entry-header"><span class="product-entry-num">#' + (i + 1) + '</span>' +
                                '<button class="product-del-btn" onclick="removeProduct(' + i + ')"><i class="fas fa-times"></i></button></div>' +
                                '<input type="text" placeholder="产品名称 *" class="prod-name" value="' + (p.name || '') + '" oninput="syncProducts()">' +
                                '<textarea placeholder="产品描述…" class="prod-desc" rows="2" oninput="syncProducts()">' + (p.description || '') + '</textarea>' +
                                '<input type="url" placeholder="产品链接（选填）" class="prod-url" value="' + (p.url || '') + '" oninput="syncProducts()">' +
                                '</div>';
                        }).join('');
                        return '<div class="step-card">' +
                            '<div class="step-icon-wrap" style="background:' + this.gradient + ';"><i class="fas ' + this.icon + '"></i></div>' +
                            '<h3>' + this.title + '</h3>' +
                            '<div class="step-desc">' + this.desc + '</div>' +
                            '<div id="productEntries">' + prodHtml + '</div>' +
                            '<button class="btn-ai-gen" onclick="addProductEntry()"><i class="fas fa-plus"></i> 添加产品</button>' +
                            '</div>';
                    }
                },
                // 步骤 7：公司成立 / 保存
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
                        var isEdit = !!roadmapData._editOpcId;
                        var co = d._company || {};
                        var depts = d._depts || [];
                        var prods = d._products || [];
                        var summary = [
                            { label: '行业类型', val: d._industry || '-' },
                            { label: '子分类', val: d._subCategoryName || '-' },
                            { label: '公司地址', val: d._address || '-' },
                            { label: '公司名称', val: co.name || '-' },
                            { label: 'Slogan', val: co.slogan || '-' },
                            { label: '联系手机', val: co.phone || '-' },
                            { label: '联系邮箱', val: co.email || '-' },
                            { label: (isEdit ? '部门' : '创建部门'), val: depts.length ? depts.join('、') : '-' },
                            { label: (isEdit ? '产品' : '产品数量'), val: isEdit ? (prods.map(function(p){return p.name}).join('、') || '-') : (prods.length + ' 个') },
                        ];
                        var items = summary.map(function(s) {
                            return '<div class="summary-item"><span>' + s.label + '</span><span class="sv">' + s.val + '</span></div>';
                        }).join('');
                        var coHtml = co.name ? '<span style="color:#FFD700;font-size:1.2em;font-weight:800;">' + co.name + '</span>' : '';
                        var heading = isEdit
                            ? '确认修改 ' + coHtml + ' 的信息'
                            : '恭喜您，您的 ' + coHtml + ' 公司正式成立了！';
                        var subText = isEdit
                            ? '确认以下信息无误后，点击保存'
                            : '你已完成全部 7 个步骤，以下是你的创业蓝图';
                        return '<div class="step-card celebration">' +
                            '<span class="big-icon">' + (isEdit ? '✏️' : '🎊') + '</span>' +
                            '<h2>' + heading + '</h2>' +
                            '<div class="sub-text">' + subText + '</div>' +
                            '<div class="summary-card">' + items + '</div>' +
                            (isEdit ? '' : renderRecs(this.recs, d)) +
                            '<div style="margin-top:16px;font-size:13px;color:rgba(255,255,255,0.35);">' + (isEdit ? '修改后所有信息将同步更新' : '🌟 保存这份蓝图，开始你的创业之旅吧！') + '</div>' +
                            '</div>';
                    }
                }
            ]
        };

        var roadmapForm = {};

        function openRoadmap(editOpcId) {
            var overlay = document.getElementById('roadmapOverlay');
            overlay.classList.add('active');
            document.body.style.overflow = 'hidden';
            roadmapForm = { _industryTab: '自媒体', _depts: ['CEO', '技术部'], _products: [] };
            roadmapData._editOpcId = editOpcId || null;
            roadmapData.currentStep = 0;
            renderStepList();
            goToStep(0);
            startParticles();
            if (editOpcId) loadOpcToForm(editOpcId);
        }

        function loadOpcToForm(opcId) {
            var u = null;
            try { u = JSON.parse(localStorage.getItem('auth_user')); } catch(e) {}
            if (!u || !u.id) return;
            // 加载 OPC 基本信息
            var xhr = new XMLHttpRequest();
            xhr.open('GET', API_BASE + '/opc/' + opcId, true);
            xhr.setRequestHeader('X-Auth-User-Id', u.id);
            xhr.withCredentials = true;
            xhr.onreadystatechange = function() {
                if (xhr.readyState === 4 && xhr.status === 200) {
                    var res = JSON.parse(xhr.responseText);
                    var opc = res.opc;
                    if (!opc) return;
                    roadmapForm._industry = opc.industry || '';
                    roadmapForm._subCategoryName = opc.sub_category || '';
                    roadmapForm._address = opc.address || '';
                    roadmapForm._logo = opc.logo || '';
                    roadmapForm._company = {
                        name: opc.name || '',
                        slogan: opc.slogan || '',
                        phone: opc.contact_phone || '',
                        email: opc.contact_email || ''
                    };
                    // 加载部门
                    loadDeptsToForm(opcId, u.id);
                    // 加载产品
                    loadProductsToForm(opcId, u.id);
                }
            };
            xhr.send();
        }

        function loadDeptsToForm(opcId, userId) {
            var xhr = new XMLHttpRequest();
            xhr.open('GET', API_BASE + '/opc/' + opcId + '/departments', true);
            xhr.setRequestHeader('X-Auth-User-Id', userId);
            xhr.withCredentials = true;
            xhr.onreadystatechange = function() {
                if (xhr.readyState === 4 && xhr.status === 200) {
                    var res = JSON.parse(xhr.responseText);
                    var items = res.items || [];
                    roadmapForm._depts = items.map(function(d) { return d.name; });
                    roadmapForm._deptIds = items.map(function(d) { return d.id; });
                    goToStep(roadmapData.currentStep);
                }
            };
            xhr.send();
        }

        function loadProductsToForm(opcId, userId) {
            var xhr = new XMLHttpRequest();
            xhr.open('GET', API_BASE + '/opc/' + opcId + '/products', true);
            xhr.setRequestHeader('X-Auth-User-Id', userId);
            xhr.withCredentials = true;
            xhr.onreadystatechange = function() {
                if (xhr.readyState === 4 && xhr.status === 200) {
                    var res = JSON.parse(xhr.responseText);
                    var items = res.items || [];
                    roadmapForm._products = items.map(function(p) {
                        return { name: p.name, description: p.description || '', url: p.url || '' };
                    });
                    roadmapForm._productIds = items.map(function(p) { return p.id; });
                    goToStep(roadmapData.currentStep);
                }
            };
            xhr.send();
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
            var isEdit = !!roadmapData._editOpcId;
            if (idx === total - 1) {
                nextBtn.innerHTML = isEdit
                    ? '<i class="fas fa-save"></i> 保存公司信息'
                    : '<i class="fas fa-check"></i> 完成创建';
                nextBtn.onclick = function() { submitOpcCreation(); };
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
            // Generic save — individual steps use specific save functions
        }

        function switchIndustryTab(tab) {
            roadmapForm._industryTab = tab;
            goToStep(roadmapData.currentStep);
        }

        function selectSubCategory(id, name, industry) {
            roadmapForm._subCategory = id;
            roadmapForm._subCategoryName = name;
            roadmapForm._industry = industry;
            goToStep(roadmapData.currentStep);
        }

        function fillAddress(val) {
            var inp = document.getElementById('rInputAddress');
            if (inp) { inp.value = val; roadmapForm._address = val; }
        }

        function saveStepAddr() {
            var el = document.getElementById('rInputAddress');
            if (el) roadmapForm._address = el.value;
        }

        function triggerLogoUpload() {
            document.getElementById('logoFileInput').click();
        }

        function handleLogoUpload(e) {
            var file = e.target.files[0];
            if (!file) return;
            if (file.size > 2 * 1024 * 1024) { alert('Logo 文件不能超过 2MB'); return; }
            if (!/^image\/(jpeg|png|gif|webp)/.test(file.type)) { alert('仅支持 JPG/PNG/GIF/WebP'); return; }
            var reader = new FileReader();
            reader.onload = function(ev) {
                roadmapForm._logo = ev.target.result;
                var preview = document.getElementById('logoPreview');
                var img = document.getElementById('logoPreviewImg');
                if (preview && img) { img.src = ev.target.result; preview.style.display = 'block'; }
            };
            reader.readAsDataURL(file);
        }

        function saveStepCompany() {
            roadmapForm._company = {
                name: (document.getElementById('rInputCoName') || {}).value || '',
                slogan: (document.getElementById('rInputSlogan') || {}).value || '',
                phone: (document.getElementById('rInputPhone') || {}).value || '',
                email: (document.getElementById('rInputEmail') || {}).value || ''
            };
        }

        function saveStepBiz() {
            roadmapForm._business = {
                legal: (document.getElementById('rInputLegal') || {}).value || '',
                regAddr: (document.getElementById('rInputRegAddr') || {}).value || '',
                capital: (document.getElementById('rInputCapital') || {}).value || ''
            };
        }

        function toggleDept(name, el) {
            if (!roadmapForm._depts) roadmapForm._depts = ['CEO', '技术部'];
            var arr = roadmapForm._depts;
            var idx = arr.indexOf(name);
            if (idx === -1) arr.push(name); else arr.splice(idx, 1);
            el.classList.toggle('selected');
        }

        function addCustomDept() {
            var inp = document.getElementById('rInputCustomDept');
            if (!inp || !inp.value.trim()) return;
            var name = inp.value.trim();
            if (!roadmapForm._depts) roadmapForm._depts = ['CEO', '技术部'];
            if (roadmapForm._depts.indexOf(name) === -1) roadmapForm._depts.push(name);
            inp.value = '';
            goToStep(roadmapData.currentStep);
        }

        function addProductEntry() {
            if (!roadmapForm._products) roadmapForm._products = [];
            roadmapForm._products.push({ name: '', description: '', url: '' });
            goToStep(roadmapData.currentStep);
        }

        function removeProduct(idx) {
            if (!roadmapForm._products) return;
            roadmapForm._products.splice(idx, 1);
            goToStep(roadmapData.currentStep);
        }

        function syncProducts() {
            var entries = document.querySelectorAll('.product-entry');
            var prods = [];
            entries.forEach(function(entry) {
                prods.push({
                    name: (entry.querySelector('.prod-name') || {}).value || '',
                    description: (entry.querySelector('.prod-desc') || {}).value || '',
                    url: (entry.querySelector('.prod-url') || {}).value || ''
                });
            });
            roadmapForm._products = prods;
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

        // ═══════════════════════════════════════════
        // ── OPC 创建提交 ──
        // ═══════════════════════════════════════════

        function submitOpcCreation() {
            var d = roadmapForm;
            var co = d._company || {};
            if (!co.name || !co.name.trim()) { alert('请填写公司名称'); goToStep(2); return; }
            if (!d._industry && !d._industryManual) { alert('请选择行业类型'); goToStep(0); return; }

            // 构建 departments 数组
            var deptNames = d._depts || [];
            var deptSource = (d._tplDepts && d._tplDepts.length) ? d._tplDepts : DEPT_DEFAULTS;
            var departments = [];
            deptNames.forEach(function(name) {
                var def = deptSource.find(function(dd) { return dd.name === name; });
                departments.push({
                    name: name,
                    description: '',
                    leader: '',
                    tools: def ? (def.tools || []) : []
                });
            });

            // 构建 products 数组
            var products = (d._products || []).filter(function(p) { return p.name && p.name.trim(); });

            var body = {
                name: co.name.trim(),
                description: '',
                logo: d._logo || '',
                address: d._address || '',
                slogan: co.slogan || '',
                contact_phone: co.phone || '',
                contact_email: co.email || '',
                industry: d._industry || d._industryManual || '',
                sub_category: d._subCategoryName || '',
                departments: departments,
                products: products
            };

            var u = null;
            try { u = JSON.parse(localStorage.getItem('auth_user')); } catch(e) {}
            var isEdit = !!roadmapData._editOpcId;

            // API 提交
            var xhr = new XMLHttpRequest();
            if (isEdit) {
                xhr.open('PUT', API_BASE + '/opc/' + roadmapData._editOpcId, true);
            } else {
                xhr.open('POST', API_BASE + '/opc', true);
            }
            xhr.setRequestHeader('Content-Type', 'application/json');
            if (u && u.id) xhr.setRequestHeader('X-Auth-User-Id', u.id);
            xhr.withCredentials = true;
            xhr.onreadystatechange = function() {
                if (xhr.readyState === 4) {
                    var ok = isEdit ? 200 : 201;
                    if (xhr.status === ok) {
                        var res = JSON.parse(xhr.responseText);
                        var opcId = isEdit ? roadmapData._editOpcId : res.opc.id;
                        // 编辑模式：同步更新部门和产品
                        if (isEdit) {
                            syncDeptsAndProducts(opcId, u.id, departments, products, opcId);
                        } else {
                            fireConfetti();
                            setTimeout(function() {
                                closeRoadmap();
                                window.location.href = '/workspace/?opc_id=' + opcId;
                            }, 1500);
                        }
                    } else {
                        try {
                            var err = JSON.parse(xhr.responseText);
                            alert((isEdit ? '保存' : '创建') + '失败: ' + (err.error || '未知错误'));
                        } catch(e) {
                            alert((isEdit ? '保存' : '创建') + '失败: ' + xhr.statusText);
                        }
                    }
                }
            };
            xhr.send(JSON.stringify(body));
        }

        function syncDeptsAndProducts(opcId, userId, departments, products, finalOpcId) {
            var headers = { 'Content-Type': 'application/json', 'X-Auth-User-Id': String(userId) };
            // 先删除旧部门，再批量创建新部门
            var oldDeptIds = roadmapForm._deptIds || [];
            var oldProdIds = roadmapForm._productIds || [];
            var doneCount = 0;
            var totalOps = oldDeptIds.length + oldProdIds.length + departments.length + products.length;
            if (totalOps === 0) { finishSave(finalOpcId); return; }

            function checkDone() {
                doneCount++;
                if (doneCount >= totalOps) finishSave(finalOpcId);
            }

            // 删除旧部门
            oldDeptIds.forEach(function(id) {
                var x = new XMLHttpRequest();
                x.open('DELETE', API_BASE + '/opc/' + opcId + '/departments/' + id, true);
                x.setRequestHeader('X-Auth-User-Id', String(userId));
                x.withCredentials = true;
                x.onreadystatechange = function() { if (x.readyState === 4) checkDone(); };
                x.send();
            });
            // 创建新部门
            departments.forEach(function(dept) {
                var x = new XMLHttpRequest();
                x.open('POST', API_BASE + '/opc/' + opcId + '/departments', true);
                x.setRequestHeader('Content-Type', 'application/json');
                x.setRequestHeader('X-Auth-User-Id', String(userId));
                x.withCredentials = true;
                x.onreadystatechange = function() { if (x.readyState === 4) checkDone(); };
                x.send(JSON.stringify(dept));
            });
            // 删除旧产品
            oldProdIds.forEach(function(id) {
                var x = new XMLHttpRequest();
                x.open('DELETE', API_BASE + '/opc/' + opcId + '/products/' + id, true);
                x.setRequestHeader('X-Auth-User-Id', String(userId));
                x.withCredentials = true;
                x.onreadystatechange = function() { if (x.readyState === 4) checkDone(); };
                x.send();
            });
            // 创建新产品
            products.forEach(function(prod) {
                var x = new XMLHttpRequest();
                x.open('POST', API_BASE + '/opc/' + opcId + '/products', true);
                x.setRequestHeader('Content-Type', 'application/json');
                x.setRequestHeader('X-Auth-User-Id', String(userId));
                x.withCredentials = true;
                x.onreadystatechange = function() { if (x.readyState === 4) checkDone(); };
                x.send(JSON.stringify(prod));
            });
        }

        function finishSave(opcId) {
            fireConfetti();
            setTimeout(function() {
                closeRoadmap();
                // 刷新公司信息卡片和部门网格
                loadOpcInfoCard(opcId);
                if (typeof loadWsSummary === 'function') loadWsSummary();
            }, 1000);
        }

        // ═══════════════════════════════════════════
        // ── 右侧卡片切换 ──
        // ═══════════════════════════════════════════

        function switchOpcCard(view) {
            var createCard = document.getElementById('card-create-opc');
            var infoCard = document.getElementById('card-opc-info');
            if (!createCard || !infoCard) return;
            if (view === 'info') {
                createCard.style.display = 'none';
                infoCard.style.display = 'block';
            } else {
                createCard.style.display = 'block';
                infoCard.style.display = 'none';
            }
        }

        function loadOpcInfoCard(opcId) {
            var u = null;
            try { u = JSON.parse(localStorage.getItem('auth_user')); } catch(e) {}
            if (!u || !u.id || !opcId) { switchOpcCard('create'); return; }

            var xhr = new XMLHttpRequest();
            xhr.open('GET', API_BASE + '/opc/' + opcId, true);
            xhr.setRequestHeader('X-Auth-User-Id', u.id);
            xhr.withCredentials = true;
            xhr.onreadystatechange = function() {
                if (xhr.readyState === 4 && xhr.status === 200) {
                    var res = JSON.parse(xhr.responseText);
                    var opc = res.opc;
                    if (!opc) { switchOpcCard('create'); return; }
                    // 填充信息卡片
                    var nameEl = document.getElementById('opcInfoName');
                    var logoEl = document.getElementById('opcInfoLogo');
                    if (nameEl) nameEl.textContent = opc.name || '';
                    if (logoEl) {
                        if (opc.logo) { logoEl.src = opc.logo; logoEl.style.display = 'block'; }
                        else { logoEl.style.display = 'none'; }
                    }
                    // 加载部门
                    loadOpcInfoDepts(opcId);
                    // 加载产品
                    loadOpcInfoProducts(opcId);
                    switchOpcCard('info');
                }
            };
            xhr.send();
        }

        function loadOpcInfoDepts(opcId) {
            var u = null;
            try { u = JSON.parse(localStorage.getItem('auth_user')); } catch(e) {}
            if (!u || !u.id) return;
            var deptEl = document.getElementById('opcInfoDepts');
            if (!deptEl) return;
            var xhr = new XMLHttpRequest();
            xhr.open('GET', API_BASE + '/opc/' + opcId + '/departments', true);
            xhr.setRequestHeader('X-Auth-User-Id', u.id);
            xhr.withCredentials = true;
            xhr.onreadystatechange = function() {
                if (xhr.readyState === 4 && xhr.status === 200) {
                    var res = JSON.parse(xhr.responseText);
                    var items = res.items || [];
                    if (items.length === 0) { deptEl.textContent = '暂无部门'; return; }
                    var names = items.map(function(d) { return d.name || ''; });
                    deptEl.textContent = names.join('、');
                }
            };
            xhr.send();
        }

        function loadOpcInfoProducts(opcId) {
            var u = null;
            try { u = JSON.parse(localStorage.getItem('auth_user')); } catch(e) {}
            if (!u || !u.id) return;
            var prodEl = document.getElementById('opcInfoProducts');
            if (!prodEl) return;
            var xhr = new XMLHttpRequest();
            xhr.open('GET', API_BASE + '/opc/' + opcId + '/products', true);
            xhr.setRequestHeader('X-Auth-User-Id', u.id);
            xhr.withCredentials = true;
            xhr.onreadystatechange = function() {
                if (xhr.readyState === 4 && xhr.status === 200) {
                    var res = JSON.parse(xhr.responseText);
                    var items = res.items || [];
                    if (items.length === 0) { prodEl.textContent = '暂无产品'; return; }
                    var names = items.map(function(p) { return p.name || ''; });
                    prodEl.textContent = names.join('、');
                }
            };
            xhr.send();
        }

        function shareOpcTemplate() {
            var u = null;
            try { u = JSON.parse(localStorage.getItem('auth_user')); } catch(e) {}
            if (!u || !u.id) { alert('请先登录'); return; }
            var opcId = null;
            try { opcId = new URLSearchParams(window.location.search).get('opc_id'); } catch(e) {}
            if (!opcId) {
                try { var cached = JSON.parse(localStorage.getItem('opc_list')||'[]'); if (cached.length) opcId = cached[0].id; } catch(e) {}
            }
            if (!opcId) { alert('请先创建一人公司'); return; }
            var defaultName = (document.getElementById('wsCompanyName').textContent || '我的公司') + '模板';
            var tplName = prompt('请输入模板名称', defaultName);
            if (!tplName) return;
            if (!confirm('将当前公司配置分享为公开模板？')) return;
            var xhr = new XMLHttpRequest();
            xhr.open('POST', API_BASE + '/opc/' + opcId + '/share-template', true);
            xhr.setRequestHeader('Content-Type', 'application/json');
            xhr.setRequestHeader('X-Auth-User-Id', u.id);
            xhr.withCredentials = true;
            xhr.onreadystatechange = function() {
                if (xhr.readyState === 4) {
                    if (xhr.status === 201) {
                        var resp = {};
                        try { resp = JSON.parse(xhr.responseText); } catch(e) {}
                        var msg = '模板分享成功！';
                        if (resp.earned > 0) msg += '\n+' + resp.earned + ' 积分';
                        alert(msg);
                        if (typeof loadPoints === 'function') loadPoints();
                    } else alert('分享失败，请重试');
                }
            };
            xhr.send(JSON.stringify({ step_data: JSON.stringify(roadmapForm), template_name: tplName }));
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
