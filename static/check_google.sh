# 推送首页
curl -X POST https://indexing.googleapis.com/v3/urlNotifications:publish 
-H "Authorization: 95fc0aa0ce264434b23d283c7084a1e7" -H "Content-Type:application/json" 
-d '{"url":"https://www.aiopc123.com/","type":"URL_UPDATED"}'

# 推送文章页
curl -X POST https://indexing.googleapis.com/v3/urlNotifications:publish 
-H "Authorization: 95fc0aa0ce264434b23d283c7084a1e7" 
-H "Content-Type:application/json" 
-d '{"url":"https://www.aiopc123.com/about","type":"URL_UPDATED"}'
