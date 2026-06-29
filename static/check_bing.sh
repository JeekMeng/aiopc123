#!/bin/bash
# 从 sitemap.xml 提取 URL 并批量提交到 Bing IndexNow

SITEMAP="${1:-public/sitemap.xml}"
HOST="www.aiopc123.com"
KEY="e28bbae34c694a3b868ecfb12f6c9a79"

echo "读取 sitemap: $SITEMAP"

URLS=$(grep -oP '(?<=<loc>).*?(?=</loc>)' "$SITEMAP" | sed 's|http://localhost:[0-9]*|https://www.aiopc123.com|g')

COUNT=$(echo "$URLS" | grep -c .)
echo "共 $COUNT 个 URL"

LIST=""
while IFS= read -r url; do
  [ -z "$url" ] && continue
  [ -n "$LIST" ] && LIST="$LIST,"
  LIST="$LIST\"$url\""
done <<< "$URLS"

JSON=$(cat <<EOF
{
  "host": "$HOST",
  "key": "$KEY",
  "keyLocation": "https://$HOST/$KEY.txt",
  "urlList": [$LIST]
}
EOF
)

echo "提交中..."
curl -i -X POST https://api.indexnow.org/IndexNow \
  -H "Content-Type: application/json; charset=utf-8" \
  -d "$JSON"
