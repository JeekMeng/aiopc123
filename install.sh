### 1. 安装nginx + ssl
apt update && apt install nginx -y
systemctl start nginx
systemctl enable nginx

apt install certbot python3-certbot-nginx -y


### 2. 拷贝public下的文件到/var/www/html/
cp public/*  /var/www/html/

### 3. 放行防火墙端口
ufw allow 80
ufw allow 443

### 4. 域名后台：
类型：A 记录
主机名：@ 或 www
记录值：你的香港服务器 IP
TTL：600
生效后，浏览器输入域名就能打开网站。

### 5. certbot --nginx -d 你的域名

### 6. 你以后更新网站流程（超简单）
本地改内容
执行 hugo
重新上传 public 覆盖服务器文件
刷新即生效
