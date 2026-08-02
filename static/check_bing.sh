#!/bin/bash
set -e

# ── 用法 ──
# bash check_bing.sh [-n 1|3|7|30|all] [sitemap路径]
#   -n    时间范围（天），默认 1，可选 1/3/7/30/all

# ── 参数 ──
DAYS=1
SITEMAP="public/sitemap.xml"

while getopts "n:h" opt; do
  case $opt in
    n) DAYS="$OPTARG" ;;
    h) echo "用法: bash $0 [-n 1|3|7|30|all] [sitemap路径]"; exit 0 ;;
    *) echo "用法: bash $0 [-n 1|3|7|30|all] [sitemap路径]"; exit 1 ;;
  esac
done
shift $((OPTIND-1))
[ -n "$1" ] && SITEMAP="$1"

HOST="www.aiopc123.com"
KEY="e28bbae34c694a3b868ecfb12f6c9a79"

# ── 生成静态文件 ──
echo "--- 生成 Hugo 静态文件 ---"
hugo > /dev/null 2>&1

echo "--- 读取 sitemap: $SITEMAP ---"
if [ ! -f "$SITEMAP" ]; then
  echo "错误: $SITEMAP 不存在，hugo 生成可能失败"
  exit 1
fi

# ── 解析 loc + lastmod ──
echo "--- 过滤最近 ${DAYS} 天的 URL ---"

CUTOFF_EPOCH=$(date -d "$DAYS days ago 00:00:00" +%s 2>/dev/null || echo 0)

LIST=""
COUNT=0
while IFS='|' read -r loc lastmod; do
  url=$(echo "$loc" | sed 's|http://localhost:[0-9]*|https://'"$HOST"'|g')
  [ -z "$url" ] && continue

  # 日期过滤
  if [ "$DAYS" != "all" ]; then
    mod_epoch=$(date -d "$lastmod" +%s 2>/dev/null || echo 0)
    [ "$mod_epoch" -lt "$CUTOFF_EPOCH" ] && continue
  fi

  [ -n "$LIST" ] && LIST="$LIST,"
  LIST="$LIST\"$url\""
  COUNT=$((COUNT + 1))
done < <(
  awk '
    /<loc>/     { gsub(/.*<loc>|<\/loc>.*/,""); loc=$0 }
    /<lastmod>/ { gsub(/.*<lastmod>|<\/lastmod>.*/,""); print loc"|"$0 }
  ' "$SITEMAP"
)

echo "共 $COUNT 个 URL 符合条件"

if [ "$COUNT" -eq 0 ]; then
  echo "没有 URL 可提交"
  exit 0
fi

# ── 构建 JSON ──
JSON=$(cat <<EOF
{
  "host": "$HOST",
  "key": "$KEY",
  "keyLocation": "https://$HOST/$KEY.txt",
  "urlList": [$LIST]
}
EOF
)

# ── 提交 ──
echo "--- 提交 ${COUNT} 个 URL 到 IndexNow ---"
curl -s -X POST https://api.indexnow.org/IndexNow \
  -H "Content-Type: application/json; charset=utf-8" \
  -d "$JSON"
