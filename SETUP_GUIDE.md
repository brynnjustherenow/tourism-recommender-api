# 旅游推荐官系统 - 完整设置指南

## 📋 目录

1. [项目概述](#项目概述)
2. [前置要求](#前置要求)
3. [后端设置](#后端设置)
4. [前端设置](#前端设置)
5. [编译和构建](#编译和构建)
6. [数据库初始化](#数据库初始化)
7. [部署指南](#部署指南)
8. [常见问题](#常见问题)

---

## 项目概述

### 系统架构

```
旅游推荐官系统
├── backend/              # Golang 后端 API
│   ├── config/          # 配置和数据库连接
│   ├── controllers/     # 控制器层
│   ├── middleware/      # 认证和中间件
│   ├── models/          # 数据模型
│   ├── routes/          # 路由定义
│   ├── utils/           # 工具函数（JWT、二维码等）
│   └── static/          # 编译后的前端文件
├── frontend/            # React 前端应用
│   ├── src/
│   │   ├── components/   # React 组件
│   │   ├── pages/       # 页面组件
│   │   ├── services/    # API 服务
│   │   ├── utils/       # 工具函数
│   │   └── assets/      # 静态资源
│   ├── public/          # 公共资源
│   ├── webpack.config.js # Webpack 配置
│   └── package.json     # 依赖管理
└── wxapp/              # 微信小程序
```

### 技术栈

#### 后端
- **语言**: Go 1.23.6
- **Web 框架**: Gin v1.10.0
- **ORM**: GORM v1.25.12
- **数据库**: PostgreSQL
- **认证**: JWT (golang-jwt/jwt/v5)
- **加密**: bcrypt (golang.org/x/crypto)
- **二维码**: go-qrcode

#### 前端
- **框架**: React 18.2.0
- **路由**: React Router v6.22.0
- **UI 库**: Ant Design 5.14.0
- **HTTP 客户端**: Axios 1.6.7
- **构建工具**: Webpack 5
- **混淆**: webpack-obfuscator + terser-webpack-plugin

#### 微信小程序
- **框架**: 微信小程序原生框架
- **API**: 微信小程序 API

---

## 前置要求

### 后端要求

```bash
# Go 版本
go version  # 需要 1.23.6 或更高

# PostgreSQL
psql --version  # 需要 12 或更高

# Git
git --version
```

### 前端要求

```bash
# Node.js
node --version  # 需要 16.x 或更高

# npm 或 yarn
npm --version  # 需要 8.x 或更高
# 或
yarn --version  # 需要 1.22.x 或更高
```

### 工具要求

- 代码编辑器：VS Code, GoLand, WebStorm 等
- API 测试工具：Postman, Insomnia 等
- 数据库管理工具：pgAdmin, DBeaver 等
- 浏览器：Chrome, Firefox, Edge（开发调试）
- 微信开发者工具：小程序开发

---

## 后端设置

### 1. 环境配置

#### 创建 `.env` 文件

```bash
cd backend
cp .env.example .env
```

#### 编辑 `.env` 文件

```env
# ============================================================================
# 数据库配置
# ============================================================================
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=your_password_here      # 修改为实际密码
DB_NAME=tourism_recommender
DB_SSLMODE=disable

# ============================================================================
# 服务器配置
# ============================================================================
SERVER_PORT=8080
GIN_MODE=debug                       # 开发: debug, 生产: release

# ============================================================================
# JWT 配置
# ============================================================================
JWT_SECRET=your-super-secret-key-here-change-in-production
JWT_EXPIRATION=24h                  # Token 有效期

# ============================================================================
# 二维码配置
# ============================================================================
BASE_URL=http://localhost:8080         # 开发环境
# BASE_URL=https://yourdomain.com    # 生产环境
WX_APP_ID=your_miniprogram_appid
WX_APP_PATH=/

# ============================================================================
# 管理员配置（首次运行需要）
# ============================================================================
# 默认管理员账号将在首次运行时创建
DEFAULT_ADMIN_USERNAME=admin
DEFAULT_ADMIN_PASSWORD=admin123
```

### 2. 安装依赖

```bash
cd backend

# 安装 Go 依赖
go mod download

# 验证依赖
go mod verify
```

### 3. 数据库设置

#### 创建数据库

```sql
-- 连接到 PostgreSQL
psql -U postgres

-- 创建数据库
CREATE DATABASE tourism_recommender;

-- 验证数据库
\l tourism_recommender

-- 退出
\q
```

#### 创建管理员用户（首次运行）

系统将在首次启动时自动创建默认管理员账号：
- 用户名：`admin`
- 密码：`admin123`

**重要**：首次登录后请立即修改密码！

### 4. 运行后端服务

#### 开发模式

```bash
cd backend

# 直接运行
go run main.go
```

#### 生产模式

```bash
cd backend

# 编译
go build -o tourism-recommender-backend

# 运行
./tourism-recommender-backend

# 或在后台运行
nohup ./tourism-recommender-backend > app.log 2>&1 &
```

### 5. 验证后端

#### 检查服务状态

```bash
# 测试健康检查
curl http://localhost:8080/api/v1/health

# 预期响应
{
  "status": "ok",
  "message": "Tourism Recommender API is running"
}
```

#### 测试数据库连接

查看日志输出，确认：
```
Loading database configuration from environment variables...
  DB_HOST: localhost
  DB_PORT: 5432
  DB_USER: postgres
  DB_PASSWORD: *** (hidden)
  DB_NAME: tourism_recommender
  DB_SSLMODE: disable
Connecting to database...
Database connection established successfully
Running database migrations...
Database migrations completed successfully
```

---

## 前端设置

### 1. 安装 Node.js 依赖

```bash
cd frontend

# 使用 npm
npm install

# 或使用 yarn（更快）
yarn install
```

### 2. 环境配置

#### 创建 `.env.local` 文件

```env
# ============================================================================
# API 配置
# ============================================================================
REACT_APP_API_BASE_URL=http://localhost:8080/api

# 生产环境示例
# REACT_APP_API_BASE_URL=https://api.yourdomain.com/api
```

### 3. 开发模式运行

```bash
cd frontend

# 启动开发服务器
npm start

# 或
yarn start
```

开发服务器将在 `http://localhost:3000` 启动。

### 4. 访问前端应用

- 管理后台：`http://localhost:3000/admin`
- 公开页面：`http://localhost:3000/recommendors`

### 5. 登录系统

首次使用：
1. 访问 `http://localhost:3000/login`
2. 输入默认管理员账号：
   - 用户名：`admin`
   - 密码：`admin123`
3. 登录成功后进入仪表板

---

## 编译和构建

### 后端编译

#### 开发构建

```bash
cd backend
go build -o tourism-recommender-backend
```

#### 生产构建（优化）

```bash
cd backend

# 优化编译
go build -ldflags="-s -w" -o tourism-recommender-backend

# 使用 go build 标签优化
go build -tags=production -ldflags="-s -w" -o tourism-recommender-backend
```

### 前端编译

#### 开发构建

```bash
cd frontend

# 使用 Webpack 开发模式构建
npm run build:dev

# 或
yarn build:dev
```

#### 生产构建（混淆）

```bash
cd frontend

# 设置生产环境变量
export NODE_ENV=production
# Windows PowerShell
$env:NODE_ENV="production"

# 构建生产版本（包含代码混淆）
npm run build

# 或
yarn build
```

生产构建会将文件输出到 `../backend/static` 目录，包括：
- `index.html` - 主页面
- `js/` - 混淆后的 JavaScript 文件
- `css/` - 样式文件
- `images/` - 图片资源

### 验证构建结果

```bash
# 检查输出目录
ls -lh backend/static/

# 应该看到：
# index.html
# js/
# css/
# images/
```

---

## 数据库初始化

### 自动迁移

后端启动时会自动运行数据库迁移，创建以下表：

1. **admins** - 管理员表
2. **recommendors** - 推荐官表
3. **destinations** - 目的地表

### 手动初始化（如需要）

```sql
-- 连接到数据库
psql -U postgres -d tourism_recommender

-- 查看表
\dt

-- 查看表结构
\d admins
\d recommendors
\d destinations

-- 退出
\q
```

### 创建测试数据

#### 创建管理员

```sql
INSERT INTO admins (username, password, role, name, email, status, created_at, updated_at)
VALUES (
    'admin',
    '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17hW2pS', -- 密码: admin123 的 bcrypt 哈希
    'super_admin',
    '系统管理员',
    'admin@example.com',
    'active',
    EXTRACT(EPOCH FROM NOW()),
    EXTRACT(EPOCH FROM NOW())
);
```

#### 创建推荐官

```sql
INSERT INTO recommendors (name, gender, age, id_number, bio, valid_from, valid_until, phone, email, province_code, city_code, district_code, region_address, status, rating, created_at, updated_at)
VALUES (
    '张三',
    'male',
    30,
    '123456789012345678',
    '资深旅游推荐官，擅长推荐北京周边的景点',
    '2024-01-01 00:00:00',
    '2025-12-31 23:59:59',
    '13800138000',
    'zhangsan@example.com',
    '110000',  -- 北京市
    '110100',  -- 北京市
    '110101',  -- 东城区
    '北京市/东城区',
    'active',
    4.5,
    EXTRACT(EPOCH FROM NOW()),
    EXTRACT(EPOCH FROM NOW())
);
```

---

## 部署指南

### 开发环境部署

#### 使用 Docker Compose

创建 `docker-compose.yml`：

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:15
    container_name: tourism-postgres
    environment:
      POSTGRES_DB: tourism_recommender
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./init.sql:/docker-entrypoint-initdb.d/init.sql
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 10s
      timeout: 5s
      retries: 5

  backend:
    build: ./backend
    container_name: tourism-backend
    ports:
      - "8080:8080"
    environment:
      - DB_HOST=postgres
      - DB_PORT=5432
      - DB_USER=postgres
      - DB_PASSWORD=postgres
      - DB_NAME=tourism_recommender
      - GIN_MODE=release
    depends_on:
      postgres:
        condition: service_healthy
    volumes:
      - ./backend/static:/app/static

  frontend:
    build: ./frontend
    container_name: tourism-frontend
    ports:
      - "3000:80"
    depends_on:
      - backend

volumes:
  postgres_data:
```

启动服务：

```bash
docker-compose up -d
```

### 生产环境部署

#### 1. 后端部署

**使用 systemd（Linux）**

创建服务文件 `/etc/systemd/system/tourism-recommender.service`：

```ini
[Unit]
Description=Tourism Recommender Backend Service
After=network.target postgresql.service

[Service]
Type=simple
User=tourism
WorkingDirectory=/opt/tourism-recommender/backend
ExecStart=/opt/tourism-recommender/backend/tourism-recommender-backend
Restart=on-failure
RestartSec=10s
Environment="GIN_MODE=release"

[Install]
WantedBy=multi-user.target
```

启动服务：

```bash
# 重载 systemd
sudo systemctl daemon-reload

# 启动服务
sudo systemctl start tourism-recommender

# 设置开机自启
sudo systemctl enable tourism-recommender

# 查看状态
sudo systemctl status tourism-recommender

# 查看日志
sudo journalctl -u tourism-recommender -f
```

**使用 Nginx 反向代理**

配置 Nginx (`/etc/nginx/sites-available/tourism-recommender`)：

```nginx
server {
    listen 80;
    server_name yourdomain.com;

    # 重定向到 HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com;

    # SSL 证书
    ssl_certificate /path/to/your/cert.pem;
    ssl_certificate_key /path/to/your/key.pem;

    # 静态文件（前端）
    location / {
        root /opt/tourism-recommender/backend/static;
        try_files $uri $uri/ /index.html;
        
        # 缓存配置
        expires 7d;
        add_header Cache-Control "public, immutable";
    }

    # API 代理
    location /api/ {
        proxy_pass http://localhost:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # 超时设置
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Gzip 压缩
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/json application/javascript;
}
```

重载 Nginx：

```bash
# 测试配置
sudo nginx -t

# 重载配置
sudo nginx -s reload
```

#### 2. 数据库部署

**使用云数据库服务**（推荐）

- 阿里云 RDS PostgreSQL
- 腾讯云 PostgreSQL
- AWS RDS PostgreSQL
- Azure Database for PostgreSQL

**自建 PostgreSQL**

```bash
# 安装 PostgreSQL
sudo apt install postgresql-15

# 初始化数据库
sudo -u postgres psql

# 创建数据库和用户
CREATE DATABASE tourism_recommender;
CREATE USER tourism WITH PASSWORD 'strong_password';
GRANT ALL PRIVILEGES ON DATABASE tourism_recommender TO tourism;

# 修改 pg_hba.conf（允许远程连接）
sudo nano /etc/postgresql/15/main/pg_hba.conf

# 添加：
# host    all             all             0.0.0.0/0            md5
```

#### 3. 前端部署

前端编译后的静态文件已嵌入后端，无需单独部署。

如需单独部署（CDN 加速）：

```bash
# 构建前端
cd frontend
npm run build

# 部署到静态服务器
# 选项1: AWS S3 + CloudFront
# 选项2: 阿里云 OSS + CDN
# 选项3: 腾讯云 COS + CDN
# 选项4: Nginx 静态文件服务
```

---

## 常见问题

### 1. 数据库连接失败

**问题**：
```
Failed to initialize database: failed to connect to database
```

**解决方案**：

```bash
# 检查 PostgreSQL 服务状态
sudo systemctl status postgresql

# 检查端口监听
sudo netstat -tulpn | grep 5432

# 检查防火墙
sudo ufw status
sudo ufw allow 5432

# 测试连接
psql -h localhost -U postgres -d tourism_recommender

# 检查 .env 配置
cat backend/.env
```

### 2. 端口被占用

**问题**：
```
bind: address already in use
```

**解决方案**：

```bash
# 查找占用端口的进程
sudo lsof -i :8080

# 或
sudo netstat -tulpn | grep 8080

# 杀死进程或更改端口
# 方法1: 杀死进程
sudo kill -9 <PID>

# 方法2: 更改端口
# 在 .env 中修改 SERVER_PORT=8081
```

### 3. 前端无法连接 API

**问题**：
```
Network Error
```

**解决方案**：

```bash
# 检查后端是否运行
curl http://localhost:8080/api/v1/health

# 检查 CORS 配置
# 后端 routes/routes.go 中的 CORS 中间件

# 检查前端 API 配置
cat frontend/.env.local
# 确保 REACT_APP_API_BASE_URL 正确

# 浏览器控制台查看错误
# F12 > Network > 失败的请求查看详细信息
```

### 4. JWT Token 无效

**问题**：
```
401 Unauthorized - Invalid or expired token
```

**解决方案**：

```bash
# 检查 JWT_SECRET 是否一致
# 后端 .env
cat backend/.env | grep JWT_SECRET

# 检查 Token 过期时间
# 修改 JWT_EXPIRATION=24h

# 清除浏览器 LocalStorage
# 开发者工具 > Application > Local Storage > Clear All

# 重新登录
```

### 5. 编译失败

**问题**：
```
Module not found
```

**解决方案**：

```bash
# 清理缓存
cd backend
go clean -cache
go mod tidy

# 重新下载依赖
go mod download

# 更新 Go 版本
# 确保 Go 版本 >= 1.23.6
go version
```

### 6. 代码混淆失败

**问题**：
```
webpack-obfuscator error
```

**解决方案**：

```bash
# 降低混淆级别
# 修改 frontend/webpack.config.js

# 或跳过混淆（仅生产）
# 将 webpack-obfuscator 移除或条件添加

# 临时解决方案：使用开发构建
NODE_ENV=development npm run build
```

### 7. 内存不足

**问题**：
```
fatal error: runtime: out of memory
```

**解决方案**：

```bash
# 增加 Go 进程内存限制
ulimit -v unlimited

# 或限制构建并发
go build -ldflags="-s -w" -o app

# 使用 -tags 优化
go build -tags=netgo -ldflags="-s -w" -o app
```

### 8. 微信小程序 API 调用失败

**问题**：
```
request:fail
```

**解决方案**：

```javascript
// 检查服务器域名白名单
// 微信公众平台 > 开发 > 开发管理 > 服务器域名

// 检查 API 地址
// wxapp/app.js 中的 apiBaseUrl

// 检查 HTTPS
// 微信要求必须使用 HTTPS（开发环境除外）

// 查看微信开发者工具 Console 错误信息
```

---

## 性能优化建议

### 后端优化

1. **数据库优化**
```sql
-- 创建索引
CREATE INDEX idx_recommendors_region ON recommendors(province_code, city_code);
CREATE INDEX idx_recommendors_status ON recommendors(status);
CREATE INDEX idx_recommendors_rating ON recommendors(rating DESC);
```

2. **Gin 配置**
```go
// 在 main.go 中
router.Use(gin.Recovery())
router.Use(gin.Logger())

// 启用 Gzip
import "github.com/gin-contrib/gzip"
router.Use(gzip.Gzip(gzip.DefaultCompression))
```

3. **连接池**
```go
sqlDB, _ := db.DB()
sqlDB.SetMaxOpenConns(100)
sqlDB.SetMaxIdleConns(10)
sqlDB.SetConnMaxLifetime(time.Hour)
```

### 前端优化

1. **代码分割**
```javascript
// webpack.config.js 已配置
// antd、vendor、common 分别打包
```

2. **懒加载**
```javascript
import { lazy, Suspense } from 'react';

const Dashboard = lazy(() => import('@pages/Dashboard'));
```

3. **缓存策略**
```javascript
// 使用 axios 缓存
// Service Worker 离线缓存
```

### 数据库优化

1. **查询优化**
```sql
-- 使用 EXPLAIN 分析
EXPLAIN SELECT * FROM recommendors WHERE ...;

-- 避免 SELECT *
SELECT id, name, rating FROM recommendors;
```

2. **定期维护**
```bash
# PostgreSQL
vacuumdb tourism_recommender;
reindexdb tourism_recommender;
```

---

## 安全建议

### 1. 环境变量安全

```bash
# 使用强密码
DB_PASSWORD=$(openssl rand -base64 32)

# 使用随机 JWT Secret
JWT_SECRET=$(openssl rand -base64 64)

# 不要将 .env 提交到 Git
echo ".env" >> .gitignore
```

### 2. 数据库安全

```sql
-- 限制数据库用户权限
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO tourism_user;

-- 启用 SSL
# 修改 pg_hba.conf
hostssl    all             all             0.0.0.0/0            scram-sha-256
```

### 3. API 安全

```go
// 启用 HTTPS
// 验证所有输入
// 限流防止 DDoS
// CORS 白名单
// 安全头部（已在 middleware/auth.go 中实现）
```

---

## 监控和日志

### 应用监控

```go
// 使用 Prometheus + Grafana
import "github.com/prometheus/client_golang/prometheus/promhttp"

router.GET("/metrics", gin.WrapH(promhttp.Handler()))
```

### 日志配置

```bash
# 日志轮转
/etc/logrotate.d/tourism-recommender

# 日志级别
# .env 中设置 GIN_MODE=release
```

---

## 备份和恢复

### 数据库备份

```bash
# 完整备份
pg_dump -U postgres tourism_recommender > backup_$(date +%Y%m%d).sql

# 仅备份推荐官数据
pg_dump -U postgres -t recommendors tourism_recommender > recommendors_backup.sql
```

### 恢复数据

```bash
# 恢复备份
psql -U postgres tourism_recommender < backup_20240101.sql
```

---

## 快速开始检查清单

运行前请确认：

- [ ] Go 1.23.6+ 已安装
- [ ] Node.js 16+ 已安装
- [ ] PostgreSQL 12+ 已安装并运行
- [ ] 后端 .env 文件已配置
- [ ] 数据库已创建
- [ ] 前端依赖已安装
- [ ] 默认管理员密码已修改
- [ ] 防火墙端口已开放（如需远程访问）

---

## 支持

如有问题，请查看：

- 后端日志：`backend/app.log`
- 浏览器控制台：F12
- 数据库日志：`/var/log/postgresql/`
- API 文档：`http://localhost:8080/api/v1/health`

---

## 版本信息

- 后端版本：v1.0.0
- 前端版本：v1.0.0
- 微信小程序版本：v1.0.0

最后更新：2024-01-01