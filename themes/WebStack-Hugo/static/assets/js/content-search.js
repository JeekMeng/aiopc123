//关键词sug
var hotList = 0;
$(function() {
    //当键盘键被松开时发送Ajax获取数据
    $('#search-text').keyup(function() {
        var keywords = $(this).val();
        if ($(this).attr('zhannei') === 'true') return;
        if (keywords == '') { $('#word').hide(); return };
        $.ajax({
            url: 'https://suggestion.baidu.com/su?wd=' + keywords,
            dataType: 'jsonp',
            jsonp: 'cb',
            beforeSend: function() {
            },
            success: function(res) {
                $('#word').empty().show();
                hotList = res.s.length;
                if (hotList) {
                    $("#word").css("display", "block");
                    for (var i = 0; i < hotList-1; i++) {
                        if (i===hotList-1){
                            $("#word").append('<li id="lastHot"><span>' + (i + 1) + "</span>" + res.s[i] + "</li>");
                        }
                        else{
                            $("#word").append("<li><span>" + (i + 1) + "</span>" + res.s[i] + "</li>");
                        }
                        $("#word li").eq(i).click(function() {
                            $('#search-text').val(this.childNodes[1].nodeValue);
                            window.open(thisSearch + this.childNodes[1].nodeValue);
                            $('#word').css('display', 'none')
                        });
                        if (i === 0) {
                            $("#word ul li").eq(i).css({
                                "border-top": "none"
                            });
                            $("#word ul span").eq(i).css({
                                "color": "#fff",
                                "background": "#f54545"
                            })
                        } else if (i === 1) {
                            $("#word ul span").eq(i).css({
                                "color": "#fff",
                                "background": "#ff8547"
                            })
                        } else if (i === 2) {
                            $("#word ul span").eq(i).css({
                                "color": "#fff",
                                "background": "#ffac38"
                            })
                        }
                    } 
                } else {
                        $("#word").css("display", "none")
                }
            },
            error: function() {
                $('#word').empty().show();
                $('#word').hide();
            }
        })
    })

    //点击搜索数据复制给搜索框
    $(document).on('click', '#word li', function() {
        var word = $(this).text().replace(/^[0-9]/, '');
        $('#search-text').val(word);
        $('#word').empty();
        $('#word').hide();
         $('.submit').trigger('click');
    })
    $(document).on('click', '.io-grey-mode', function() {
        $('#word').empty();
        $('#word').hide();
    })

});

// ── 站内搜索 ──
(function() {
    var sitesData = [];

    // 加载 sites.json
    $.getJSON('/sites.json', function(data) {
        sitesData = data;
    });

    function getContainer(input) {
        return input.attr('id') === 'm_search-text' ? $('#m_site-search-results') : $('#site-search-results');
    }

    function doSiteSearch(input) {
        var keyword = input.val().trim().toLowerCase();
        var container = getContainer(input);

        if (!keyword) {
            container.hide();
            return;
        }

        var matches = sitesData.filter(function(item) {
            var title = (item.title || '').toLowerCase();
            var desc = (item.description || '').toLowerCase();
            var cat = (item.category || []).join(' ').toLowerCase();
            var tags = (item.tags || []).join(' ').toLowerCase();
            return title.indexOf(keyword) !== -1 ||
                   desc.indexOf(keyword) !== -1 ||
                   cat.indexOf(keyword) !== -1 ||
                   tags.indexOf(keyword) !== -1;
        });

        var list = container.find('.site-search-list');
        var empty = container.find('.site-search-empty');

        list.empty();
        if (matches.length > 0) {
            empty.hide();
            matches.slice(0, 20).forEach(function(item) {
                var stars = '';
                if (item.score) {
                    var s = Math.round(item.score / 2);
                    for (var j = 0; j < s; j++) stars += '★';
                }
                var $a = $('<a>').attr('href', item.url).attr('target', '_blank');
                $a.append($('<span>').text(item.title));
                if (stars) $a.append(' <span class="text-warning">' + stars + '</span>');
                if (item.description) $a.append(' <small class="text-muted">' + $('<span>').text(item.description).html() + '</small>');
                list.append($('<li>').append($a));
            });
            container.show();
        } else {
            empty.show();
            container.show();
        }
    }

    // Keyup → live filter (跳过方向键防止覆盖选中状态)
    $(document).on('keyup', '#search-text, #m_search-text', function(e) {
        if ($(this).attr('zhannei') === 'true') {
            if (e.which === 38 || e.which === 40 || e.which === 13 || e.which === 16 || e.which === 17 || e.which === 18) return;
            doSiteSearch($(this));
        }
    });

    // Keydown → 上下键选中、Enter 跳转
    $(document).on('keydown', '#search-text, #m_search-text', function(e) {
        if ($(this).attr('zhannei') !== 'true') return;
        var container = getContainer($(this));
        var items = container.find('.site-search-list li');

        var current = items.filter('.current');
        var idx = current.length ? items.index(current) : -1;

        if (e.which === 40) { // ↓
            if (!items.length) return;
            e.preventDefault();
            items.removeClass('current');
            idx = (idx + 1) % items.length;
            items.eq(idx).addClass('current');
        } else if (e.which === 38) { // ↑
            if (!items.length) return;
            e.preventDefault();
            items.removeClass('current');
            idx = idx <= 0 ? items.length - 1 : idx - 1;
            items.eq(idx).addClass('current');
        } else if (e.which === 13) { // Enter
            e.preventDefault();
            if (items.length) {
                if (idx < 0) idx = 0;
                var a = items.eq(idx).find('a');
                if (a.length) window.open(a.attr('href'), '_blank');
                container.hide();
                $(this).val('');
            }
            return false;
        }
    });

    // 点击搜索结果跳转
    $(document).on('click', '.site-search-list li', function() {
        var a = $(this).find('a');
        if (a.length) window.open(a.attr('href'), '_blank');
    });

    // 拦截表单提交（站内搜索模式）
    // 阻止 app-anim.js 的 window.open
    $(function() {
        $('.super-search-fm').on('submit', function(e) {
            var input = $(this).find('.search-key');
            if (input.attr('zhannei') === 'true') {
                e.preventDefault();
                e.stopImmediatePropagation();
                doSiteSearch(input);
                return false;
            }
        });
    });

    // 点击任意处关闭站内搜索结果
    $(document).on('click', function(e) {
        if (!$(e.target).closest('#site-search-results, #m_site-search-results, #search-text, #m_search-text, .super-search-fm').length) {
            $('#site-search-results, #m_site-search-results').hide();
        }
    });
})();
