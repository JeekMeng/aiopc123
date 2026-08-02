#!/bin/bash
# ============================================================
# 功能健康检测脚本 — check_health.sh
# 检测网站功能完整性和 SEO/GEO 健康度，包含：
#   - A. 页面可达性（全站所有 URL HTTP 200）
#   - B. 404 处理（不存在的 URL 返回 404）
#   - C. SEO 元数据（meta description / title / og:image）
#   - D. 结构化数据（JSON-LD: Article / BreadcrumbList / FAQPage / HowTo）
#   - E. TLS 证书有效期
#   - F. 关键文件（robots.txt / sitemap.xml / llms.txt / Bing key / OG image）
#   - G. CSP 安全头
#
# 用法：
#   bash static/check_health.sh                    # 终端输出（带颜色）
#   bash static/check_health.sh >> logs/health.log # 追加到日志
#
# 定时执行（crontab，每周一 7:00）：
#   0 7 * * 1 cd /path/to/site && bash static/check_health.sh >> logs/health-$(date +\%Y\%m).log 2>&1
# ============================================================

set -o pipefail

# ── 配置 ──────────────────────────────────────────────────
BASE_URL="https://www.aiopc123.com"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
SITE_DIR="$(dirname "$SCRIPT_DIR")"

# 关键检测页面
KEY_PAGES=(
  "/"
  "/blog/200005/"
  "/blog/200008/"
  "/site/200001/"
  "/book/10000/"
  "/about/"
)

# 关键文件
CRITICAL_FILES=(
  "/robots.txt"
  "/sitemap.xml"
  "/llms.txt"
  "/e28bbae34c694a3b868ecfb12f6c9a79.txt"
  "/assets/images/bi-favicon.png"
)

# 404 检测 URL
NONEXIST_URL="/nonexistent-page-test-12345/"

# 超时
CURL_TIMEOUT=10

# ── 颜色 ──────────────────────────────────────────────────
if [[ -t 1 ]]; then
  RED='\033[0;31m'
  GREEN='\033[0;32m'
  YELLOW='\033[1;33m'
  CYAN='\033[0;36m'
  BLUE='\033[0;34m'
  BOLD='\033[1m'
  NC='\033[0m'
else
  RED='' GREEN='' YELLOW='' CYAN='' BLUE='' BOLD='' NC=''
fi

PASS="${GREEN}PASS${NC}"
FAIL="${RED}FAIL${NC}"
WARN="${YELLOW}WARN${NC}"

# ── 工具函数 ──────────────────────────────────────────────
timestamp() {
  date '+%Y-%m-%d %H:%M:%S'
}

log() {
  echo "[$(timestamp)] $*"
}

section() {
  echo ""
  log "${BOLD}── $1 ──${NC}"
}

check_http() {
  local url=$1
  curl -o /dev/null -s -w "%{http_code}" --max-time "$CURL_TIMEOUT" "$url" 2>/dev/null || echo "000"
}

check_http_head() {
  local url=$1
  curl -sI --max-time 5 "$url" 2>/dev/null || echo ""
}

fetch_body() {
  local url=$1
  curl -s --max-time "$CURL_TIMEOUT" "$url" 2>/dev/null || echo ""
}

# ── 从 check_bing.sh 提取 URL 列表 ────────────────────────
extract_urls_from_bing_script() {
  local bing_script="$SCRIPT_DIR/check_bing.sh"
  if [[ -f "$bing_script" ]]; then
    grep -oP '"https://www\.aiopc123\.com[^"]*"' "$bing_script" | sed 's|"https://www.aiopc123.com||' | sed 's|"||' | sort -u
  fi
}

# ── A. 页面可达性 ─────────────────────────────────────────
check_accessibility() {
  section "A. 页面可达性"

  local all_urls=()
  local total=0 passed=0 failed=0

  # 从 check_bing.sh 提取 URL
  local urls_from_bing
  urls_from_bing=$(extract_urls_from_bing_script)
  if [[ -n "$urls_from_bing" ]]; then
    while IFS= read -r path; do
      all_urls+=("$path")
    done <<< "$urls_from_bing"
  fi

  # 补充关键页面（确保覆盖）
  for page in "${KEY_PAGES[@]}"; do
    local found=0
    for u in "${all_urls[@]}"; do
      [[ "$u" == "$page" ]] && { found=1; break; }
    done
    [[ "$found" -eq 0 ]] && all_urls+=("$page")
  done

  total=${#all_urls[@]}

  for path in "${all_urls[@]}"; do
    [[ -z "$path" ]] && continue
    local url="${BASE_URL}${path}"
    local http_code
    http_code=$(check_http "$url")
    if [[ "$http_code" == "200" || "$http_code" == "308" ]]; then
      echo "  $PASS  ${path} (HTTP $http_code)"
      ((passed++))
    elif [[ "$http_code" == "000" ]]; then
      echo "  $FAIL  ${path} (请求超时)"
      ((failed++))
    else
      echo "  $WARN  ${path} (HTTP $http_code)"
      ((failed++))
    fi
  done

  echo ""
  echo "  → 结果: ${total} URLs, ${GREEN}${passed} PASS${NC}, ${RED}${failed} FAIL${NC}"
  [[ "$failed" -gt 0 ]] && return 1 || return 0
}

# ── B. 404 处理 ──────────────────────────────────────────
check_404() {
  section "B. 404 页面处理"

  local url="${BASE_URL}${NONEXIST_URL}"
  local http_code
  http_code=$(check_http "$url")
  if [[ "$http_code" == "404" ]]; then
    echo "  $PASS  不存在 URL → HTTP $http_code ✓"
    return 0
  elif [[ "$http_code" == "200" ]]; then
    echo "  $FAIL  不存在 URL 返回 200（未 404！可能有软 404 问题）"
    return 1
  else
    echo "  $WARN  不存在 URL → HTTP $http_code"
    return 1
  fi
}

# ── C. SEO 元数据 ────────────────────────────────────────
check_seo_meta() {
  section "C. SEO 元数据检测"

  local overall=0

  for page in "${KEY_PAGES[@]}"; do
    local url="${BASE_URL}${page}"
    local body
    body=$(fetch_body "$url")
    [[ -z "$body" ]] && { echo "  $FAIL  ${page} 无法获取页面内容"; overall=1; continue; }

    echo "  页面: ${CYAN}${page}${NC}"

    # Title
    local title
    title=$(echo "$body" | grep -oP '<title>[^<]+</title>' | sed 's|<title>||;s|</title>||' || echo "")
    local title_len=${#title}
    if [[ -n "$title" ]]; then
      if [[ "$title_len" -le 60 ]]; then
        echo "    $PASS  Title ($title_len 字): ${title:0:50}..."
      else
        echo "    $WARN  Title ($title_len 字，建议 ≤60): ${title:0:50}..."
        overall=1
      fi
    else
      echo "    $FAIL  Title 标签缺失"
      overall=1
    fi

    # Meta description
    local desc
    desc=$(echo "$body" | grep -oP '<meta[^>]+name="?description"?[^>]+content="?[^">]*' | grep -oP 'content="?[^">]*' | sed 's/content="\?//' || echo "")
    local desc_len=${#desc}
    if [[ -n "$desc" ]]; then
      if [[ "$desc_len" -ge 120 && "$desc_len" -le 155 ]]; then
        echo "    $PASS  Description ($desc_len 字)"
      else
        echo "    $WARN  Description ($desc_len 字，建议 120-155)"
        overall=1
      fi
      # 检查模板化描述
      if echo "$desc" | grep -qi "是一个OPC公司经营类别"; then
        echo "    $FAIL  Description 含模板化文案"
        overall=1
      fi
    else
      echo "    $FAIL  Meta description 缺失"
      overall=1
    fi

    # OG image
    local og_image
    og_image=$(echo "$body" | grep -oP '<meta[^>]+property="?og:image(?::[a-z]+)?"?[^>]+content="?[^">]*' | grep -oP 'content="?https?://[^">]*' | head -1 | sed 's/content="\?//' || echo "")
    if [[ -n "$og_image" ]]; then
      # 验证图片是否存在
      local img_code
      img_code=$(check_http "$og_image")
      if [[ "$img_code" == "200" ]]; then
        echo "    $PASS  OG Image 可达 ($img_code)"
      else
        echo "    $FAIL  OG Image 无法访问 (HTTP $img_code)"
        overall=1
      fi
    else
      echo "    $FAIL  OG Image 标签缺失"
      overall=1
    fi

    # H1 标签
    local h1
    h1=$(echo "$body" | grep -oP '<h1[^>]*>[^<]+</h1>' || echo "")
    if [[ -n "$h1" ]]; then
      echo "    $PASS  H1 存在 ✓"
    else
      echo "    $WARN  H1 标签缺失"
      overall=1
    fi
  done

  [[ "$overall" -ne 0 ]] && return 1 || return 0
}

# ── D. 结构化数据 ────────────────────────────────────────
check_structured_data() {
  section "D. 结构化数据（JSON-LD）"

  local overall=0

  # 首页: BreadcrumbList
  local homepage_body
  homepage_body=$(fetch_body "${BASE_URL}/")
  if [[ -n "$homepage_body" ]]; then
    if echo "$homepage_body" | grep -q "BreadcrumbList"; then
      echo "  $PASS  首页 BreadcrumbList ✓"
    else
      echo "  $WARN  首页 未检测到 BreadcrumbList（首页可能不需要）"
    fi
  fi

  # Blog 页: Article + FAQPage + HowTo + BreadcrumbList
  local blog_paths=("/blog/200005/" "/blog/200008/")
  for bp in "${blog_paths[@]}"; do
    local body
    body=$(fetch_body "${BASE_URL}${bp}")
    [[ -z "$body" ]] && { echo "  $FAIL  ${bp} 无法获取"; overall=1; continue; }

    echo "  页面: ${CYAN}${bp}${NC}"

    if echo "$body" | grep -q '"@type":\s*"Article"'; then
      echo "    $PASS  Article Schema ✓"
    else
      echo "    $FAIL  Article Schema 缺失"
      overall=1
    fi

    if echo "$body" | grep -q "BreadcrumbList"; then
      echo "    $PASS  BreadcrumbList ✓"
    else
      echo "    $FAIL  BreadcrumbList 缺失"
      overall=1
    fi

    if echo "$body" | grep -q "FAQPage"; then
      echo "    $PASS  FAQPage Schema ✓"
    else
      echo "    $WARN  FAQPage Schema 缺失（可能不需要）"
    fi

    # HowTo 只在 blog/200005 需要
    if [[ "$bp" == "/blog/200005/" ]]; then
      if echo "$body" | grep -q "HowTo"; then
        echo "    $PASS  HowTo Schema ✓"
      else
        echo "    $FAIL  HowTo Schema 缺失（教程页应配置）"
        overall=1
      fi
    fi
  done

  # Book 页: Book Schema
  local book_body
  book_body=$(fetch_body "${BASE_URL}/book/10000/")
  if [[ -n "$book_body" ]]; then
    if echo "$book_body" | grep -q '"@type":\s*"Book"'; then
      echo "  $PASS  Book/10000 Book Schema ✓"
    else
      echo "  $FAIL  Book/10000 Book Schema 缺失"
      overall=1
    fi
  fi

  # Site 页: Service Schema
  local site_body
  site_body=$(fetch_body "${BASE_URL}/site/200001/")
  if [[ -n "$site_body" ]]; then
    if echo "$site_body" | grep -q '"@type":\s*"Service"\|"@type":\s*"Product"'; then
      echo "  $PASS  Site/200001 Service Schema ✓"
    else
      echo "  $WARN  Site/200001 Service Schema 缺失"
    fi
  fi

  [[ "$overall" -ne 0 ]] && return 1 || return 0
}

# ── E. TLS 证书 ──────────────────────────────────────────
check_tls() {
  section "E. TLS 证书有效期"

  local cert_info expiry_date days_left
  cert_info=$(echo | openssl s_client -servername "www.aiopc123.com" -connect "www.aiopc123.com:443" 2>/dev/null | openssl x509 -noout -enddate 2>/dev/null || echo "")
  if [[ -z "$cert_info" ]]; then
    echo "  $FAIL  无法获取证书信息"
    return 1
  fi

  expiry_date=$(echo "$cert_info" | sed 's/notAfter=//')
  days_left=$(( ($(date -d "$expiry_date" +%s) - $(date +%s)) / 86400 ))

  if [[ "$days_left" -gt 30 ]]; then
    echo "  $PASS  证书有效期: ${days_left} 天 ✓"
    return 0
  elif [[ "$days_left" -gt 7 ]]; then
    echo "  $WARN  证书即将到期: ${days_left} 天"
    return 1
  else
    echo "  $FAIL  证书 ${days_left} 天后到期，请立即续期！"
    return 2
  fi
}

# ── F. 关键文件 ──────────────────────────────────────────
check_critical_files() {
  section "F. 关键文件可达性"

  local overall=0
  for file in "${CRITICAL_FILES[@]}"; do
    local url="${BASE_URL}${file}"
    local http_code
    http_code=$(check_http "$url")
    local file_label="$file"
    if [[ "$file" == *"e28bbae"* ]]; then
      file_label="/e28bbae...txt (Bing IndexNow)"
    fi
    if [[ "$http_code" == "200" ]]; then
      echo "  $PASS  ${file_label} (HTTP $http_code)"
      # 检查 llms.txt 内容是否够长
      if [[ "$file" == "/llms.txt" ]]; then
        local lines
        lines=$(fetch_body "$url" | wc -l)
        if [[ "$lines" -ge 5 ]]; then
          echo "        内容行数: ${lines} ✓"
        else
          echo "        $WARN 内容仅 ${lines} 行，建议扩展"
          overall=1
        fi
      fi
    else
      echo "  $FAIL  ${file_label} (HTTP $http_code)"
      overall=1
    fi
  done

  [[ "$overall" -ne 0 ]] && return 1 || return 0
}

# ── G. CSP 安全头 ────────────────────────────────────────
check_csp() {
  section "G. CSP 安全头"

  local headers
  headers=$(check_http_head "${BASE_URL}/")

  if echo "$headers" | grep -qi "content-security-policy"; then
    local csp
    csp=$(echo "$headers" | grep -i "content-security-policy" | head -1 | sed 's/.*: //' | tr -d '\r')
    echo "  $PASS  CSP 头存在 ✓"

    # 检查是否包含关键外部域名
    if echo "$csp" | grep -q "hm.baidu.com"; then
      echo "    $PASS  百度统计已放行 ✓"
    else
      echo "    $WARN  百度统计（hm.baidu.com）未在 CSP 中"
    fi

    if echo "$csp" | grep -q "sdk.51.la"; then
      echo "    $PASS  51.LA 统计已放行 ✓"
    else
      echo "    $WARN  51.LA（sdk.51.la）未在 CSP 中"
    fi
  else
    echo "  $FAIL  CSP 头缺失"
    echo "    → Hugo 的 [security.headers] 仅在 hugo server 开发模式下生效"
    echo "    → 静态站点需要通过 Cloudflare Workers / Page Rule 添加 CSP"
    echo "    → 配置参考: 性能优化评估文档.md"
    return 1
  fi
}

# ── 主流程 ────────────────────────────────────────────────
main() {
  log "=========================================="
  log "功能健康检测开始 — $BASE_URL"
  log "=========================================="

  local results=()
  local exit_code=0

  # A. 可达性
  check_accessibility
  local rc=$?
  results+=("A.可达性: $([ $rc -eq 0 ] && echo PASS || echo FAIL)")

  # B. 404 处理
  check_404
  rc=$?
  results+=("B.404处理: $([ $rc -eq 0 ] && echo PASS || echo FAIL)")
  [[ "$rc" -gt "$exit_code" ]] && exit_code=$rc

  # C. SEO 元数据
  check_seo_meta
  rc=$?
  results+=("C.SEO元数据: $([ $rc -eq 0 ] && echo PASS || echo FAIL)")
  [[ "$rc" -gt "$exit_code" ]] && exit_code=$rc

  # D. 结构化数据
  check_structured_data
  rc=$?
  results+=("D.结构化数据: $([ $rc -eq 0 ] && echo PASS || echo FAIL)")
  [[ "$rc" -gt "$exit_code" ]] && exit_code=$rc

  # E. TLS 证书
  check_tls
  rc=$?
  results+=("E.TLS证书: $([ $rc -eq 0 ] && echo PASS || echo FAIL)")
  [[ "$rc" -gt "$exit_code" ]] && exit_code=$rc

  # F. 关键文件
  check_critical_files
  rc=$?
  results+=("F.关键文件: $([ $rc -eq 0 ] && echo PASS || echo FAIL)")
  [[ "$rc" -gt "$exit_code" ]] && exit_code=$rc

  # G. CSP 安全头
  check_csp
  rc=$?
  results+=("G.CSP安全头: $([ $rc -eq 0 ] && echo PASS || echo FAIL)")
  [[ "$rc" -gt "$exit_code" ]] && exit_code=$rc

  # 汇总
  echo ""
  log "=========================================="
  log "健康检测汇总"
  for r in "${results[@]}"; do
    local label="${r%%:*}"
    local status="${r#*: }"
    if [[ "$status" == "PASS" ]]; then
      echo "  ${GREEN}✓${NC} $r"
    else
      echo "  ${RED}✗${NC} $r"
    fi
  done
  if [[ "$exit_code" -eq 0 ]]; then
    log "结论: ${GREEN}全部通过${NC}"
  elif [[ "$exit_code" -eq 1 ]]; then
    log "结论: ${YELLOW}有警告项${NC}"
  else
    log "结论: ${RED}存在失败项，需人工检查${NC}"
  fi
  log "=========================================="

  return "$exit_code"
}

main "$@"
