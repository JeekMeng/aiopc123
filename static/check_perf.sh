#!/bin/bash
# ============================================================
# 性能检测脚本 — check_perf.sh
# 检测网站多页面加载性能，包含：
#   - DNS 解析 / TCP 连接 / TLS 握手 / TTFB / 总耗时
#   - 页面大小 / 下载速度
#   - Cloudflare 缓存状态（HIT / MISS / DYNAMIC）
#   - Brotli 压缩启用情况
#   - HTTP 状态码
#
# 用法：
#   bash static/check_perf.sh                    # 终端输出（带颜色）
#   bash static/check_perf.sh >> logs/perf.log   # 追加到日志
#
# 定时执行（crontab，每天 6:00）：
#   0 6 * * * cd /path/to/site && bash static/check_perf.sh >> logs/perf-$(date +\%Y\%m).log 2>&1
# ============================================================

set -eo pipefail

# ── 配置 ──────────────────────────────────────────────────
BASE_URL="https://www.aiopc123.com"

# 待检测页面（代表不同页面类型）
PAGES=(
  "/"
  "/blog/200005/"
  "/site/200001/"
  "/book/10000/"
)

# 静态资源（抽检）
ASSETS=(
  "/assets/css/style-3.03029.1.css"
  "/assets/js/jquery.min-3.2.1.js"
)

# 阈值
THRESHOLD_DNS=0.1        # DNS 解析 < 0.1s
THRESHOLD_TCP=0.3        # TCP 连接 < 0.3s
THRESHOLD_TLS=0.5        # TLS 握手 < 0.5s
THRESHOLD_TTFB=1.0       # TTFB < 1.0s
THRESHOLD_TOTAL=2.0      # 总耗时 < 2.0s
THRESHOLD_SIZE=500       # 页面大小 < 500KB
THRESHOLD_SPEED=100000   # 下载速度 > 100 KB/s

# ── 颜色（仅终端输出时启用） ──────────────────────────────
if [[ -t 1 ]]; then
  RED='\033[0;31m'
  GREEN='\033[0;32m'
  YELLOW='\033[1;33m'
  CYAN='\033[0;36m'
  NC='\033[0m' # No Color
else
  RED='' GREEN='' YELLOW='' CYAN='' NC=''
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

passfail() {
  local ok=$1 label=$2 val=$3 unit=$4 threshold=$5
  local ok_text="$PASS  $label=$val$unit"
  local fail_text="$FAIL  $label=$val$unit (阈值: $threshold)"
  if [[ "$ok" -eq 0 ]]; then
    echo "$ok_text"
  else
    echo "$fail_text"
  fi
}

# ── 检测单页面 ────────────────────────────────────────────
check_page() {
  local path=$1 url="${BASE_URL}${path}"
  local tmpfile
  tmpfile=$(mktemp)
  trap 'rm -f "$tmpfile"' RETURN

  log "检测: ${CYAN}${path}${NC}"

  # 第一阶段：计时 + 下载
  local http_code dns tcp tls ttfb total size speed
  http_code=$(curl -o "$tmpfile" -s -w "%{http_code}\t%{time_namelookup}\t%{time_connect}\t%{time_appconnect}\t%{time_starttransfer}\t%{time_total}\t%{size_download}\t%{speed_download}" \
    --max-time 10 "$url" 2>/dev/null || echo "000  0 0 0 0 0 0 0")

  read -r http_code dns tcp tls ttfb total size speed <<< "$http_code"

  # 第二阶段：检查响应头（缓存状态、压缩）
  local cf_cache cf_ray content_encoding
  cf_cache=$(curl -sI --max-time 5 "$url" 2>/dev/null | grep -i "^cf-cache-status:" | sed 's/.*: //' | tr -d '\r' || echo "N/A")
  content_encoding=$(curl -sI -H "Accept-Encoding: br, gzip" --max-time 5 "$url" 2>/dev/null | grep -i "^content-encoding:" | sed 's/.*: //' | tr -d '\r' || echo "N/A")

  # 格式化数值
  dns_s=$(printf "%.3f" "$dns" 2>/dev/null || echo "$dns")
  tcp_s=$(printf "%.3f" "$tcp" 2>/dev/null || echo "$tcp")
  tls_s=$(printf "%.3f" "$tls" 2>/dev/null || echo "$tls")
  ttfb_s=$(printf "%.3f" "$ttfb" 2>/dev/null || echo "$ttfb")
  total_s=$(printf "%.3f" "$total" 2>/dev/null || echo "$total")
  size_kb=$(( size / 1024 ))
  speed_kb=$(( speed / 1024 ))

  # 判断状态码
  local http_ok=0
  if [[ "$http_code" == "200" ]]; then
    echo "  $PASS  HTTP $http_code"
    http_ok=0
  elif [[ "$http_code" == "000" ]]; then
    echo "  $FAIL  HTTP 请求超时/失败"
    http_ok=1
  else
    echo "  $WARN  HTTP $http_code（非 200）"
    http_ok=1
  fi

  # 判断各项指标
  local exit_code=0

  # DNS
  local dns_ok=0
  awk "BEGIN{exit($dns > $THRESHOLD_DNS)}" 2>/dev/null && dns_ok=$? || dns_ok=1
  awk -v v="$dns" -v t="$THRESHOLD_DNS" 'BEGIN{if(v>t) exit 1; exit 0}' 2>/dev/null || dns_ok=$?
  if awk -v v="$dns" -v t="$THRESHOLD_DNS" 'BEGIN{if(v>t) exit 1; exit 0}' 2>/dev/null; then
    dns_ok=0; else dns_ok=1; fi
  passfail "$dns_ok" "DNS" "$dns_s" "s" "$THRESHOLD_DNS s"
  [[ "$dns_ok" -ne 0 ]] && exit_code=1

  # TCP
  if awk -v v="$tcp" -v t="$THRESHOLD_TCP" 'BEGIN{if(v>t) exit 1; exit 0}' 2>/dev/null; then
    tcp_ok=0; else tcp_ok=1; fi
  passfail "$tcp_ok" "TCP" "$tcp_s" "s" "$THRESHOLD_TCP s"
  [[ "$tcp_ok" -ne 0 ]] && exit_code=1

  # TLS
  if awk -v v="$tls" -v t="$THRESHOLD_TLS" 'BEGIN{if(v>t) exit 1; exit 0}' 2>/dev/null; then
    tls_ok=0; else tls_ok=1; fi
  passfail "$tls_ok" "TLS" "$tls_s" "s" "$THRESHOLD_TLS s"
  [[ "$tls_ok" -ne 0 ]] && exit_code=1

  # TTFB
  if awk -v v="$ttfb" -v t="$THRESHOLD_TTFB" 'BEGIN{if(v>t) exit 1; exit 0}' 2>/dev/null; then
    ttfb_ok=0; else ttfb_ok=1; fi
  passfail "$ttfb_ok" "TTFB" "$ttfb_s" "s" "$THRESHOLD_TTFB s"
  [[ "$ttfb_ok" -ne 0 ]] && exit_code=1

  # Total
  if awk -v v="$total" -v t="$THRESHOLD_TOTAL" 'BEGIN{if(v>t) exit 1; exit 0}' 2>/dev/null; then
    total_ok=0; else total_ok=1; fi
  passfail "$total_ok" "总耗时" "$total_s" "s" "$THRESHOLD_TOTAL s"
  [[ "$total_ok" -ne 0 ]] && exit_code=1

  # Size
  if awk -v v="$size" -v t="$((THRESHOLD_SIZE * 1024))" 'BEGIN{if(v>t) exit 1; exit 0}' 2>/dev/null; then
    size_ok=0; else size_ok=1; fi
  passfail "$size_ok" "大小" "${size_kb}" "KB" "$THRESHOLD_SIZE KB"
  [[ "$size_ok" -ne 0 ]] && exit_code=1

  # Speed
  local speed_label="$speed_kb KB/s"
  if awk -v v="$speed" -v t="$THRESHOLD_SPEED" 'BEGIN{if(v<t) exit 1; exit 0}' 2>/dev/null; then
    speed_ok=0; else speed_ok=1; fi
  passfail "$speed_ok" "速度" "$speed_label" "" "> $((THRESHOLD_SPEED / 1024)) KB/s"
  [[ "$speed_ok" -ne 0 ]] && exit_code=1

  # Cloudflare 缓存
  if [[ "$cf_cache" == "HIT" ]]; then
    echo "  $PASS  Cloudflare 缓存: HIT ✓"
  elif [[ "$cf_cache" == "DYNAMIC" ]]; then
    echo "  $WARN  Cloudflare 缓存: DYNAMIC（页面未缓存）"
    [[ "$path" != *".css"* && "$path" != *".js"* ]] && exit_code=1
  elif [[ "$cf_cache" == "MISS" ]]; then
    echo "  $WARN  Cloudflare 缓存: MISS（首次访问）"
  else
    echo "  $WARN  Cloudflare 缓存: $cf_cache"
  fi

  # Brotli 压缩
  if [[ "$content_encoding" == "br" ]]; then
    echo "  $PASS  压缩: Brotli (br) ✓"
  elif [[ -n "$content_encoding" && "$content_encoding" != "N/A" ]]; then
    echo "  $WARN  压缩: $content_encoding（非 Brotli）"
  else
    echo "  $WARN  压缩: 未启用"
  fi

  # 最终结论
  if [[ "$http_ok" -ne 0 ]]; then
    echo "  → ${FAIL} 页面不可达"
    return 2
  elif [[ "$exit_code" -ne 0 ]]; then
    echo "  → ${WARN} 有指标未达标"
    return 1
  else
    echo "  → ${PASS} 全部达标"
    return 0
  fi
}

# ── 主流程 ────────────────────────────────────────────────
main() {
  log "=========================================="
  log "性能检测开始 — $BASE_URL"
  log "=========================================="

  local total=0 passed=0 warned=0 failed=0

  # 检测页面
  for page in "${PAGES[@]}"; do
    echo ""
    local rc=0
    check_page "$page" || rc=$?
    if [[ "$rc" -eq 0 ]]; then
      passed=$((passed + 1))
    elif [[ "$rc" -eq 1 ]]; then
      warned=$((warned + 1))
    else
      failed=$((failed + 1))
    fi
    total=$((total + 1))
  done

  # 检测静态资源（只检查 HTTP + 缓存）
  for asset in "${ASSETS[@]}"; do
    echo ""
    log "检测静态资源: ${CYAN}${asset}${NC}"
    local url="${BASE_URL}${asset}"
    local http_code cf_cache
    http_code=$(curl -o /dev/null -s -w "%{http_code}" --max-time 5 "$url" 2>/dev/null || echo "000")
    cf_cache=$(curl -sI --max-time 5 "$url" 2>/dev/null | grep -i "^cf-cache-status:" | sed 's/.*: //' | tr -d '\r' || echo "N/A")
    if [[ "$http_code" == "200" ]]; then
      echo "  $PASS  HTTP $http_code"
      if [[ "$cf_cache" == "HIT" ]]; then
        echo "  $PASS  缓存: $cf_cache"
      else
        echo "  $WARN  缓存: $cf_cache"
      fi
      passed=$((passed + 1))
    else
      echo "  $FAIL  HTTP $http_code"
      failed=$((failed + 1))
    fi
    total=$((total + 1))
  done

  # 汇总
  echo ""
  log "=========================================="
  log "检测完成: $total 项 | ${GREEN}通过 $passed${NC} | ${YELLOW}警告 $warned${NC} | ${RED}失败 $failed${NC}"
  log "=========================================="

  if [[ "$failed" -gt 0 ]]; then
    return 2
  elif [[ "$warned" -gt 0 ]]; then
    return 1
  else
    return 0
  fi
}

main "$@"
