# 旅游推荐官系统 - 项目总结

## 📋 项目概述

一个基于 Golang 后端 + React 前端 + 微信小程序的旅游推荐官管理系统。

### 技术栈
- **后端**: Go 1.23.6 + Gin + GORM + PostgreSQL + JWT
- **前端**: React 18 + Ant Design 5 + Webpack + 代码混淆
- **小程序**: 微信小程序原生框架
- **省市县选择**: china-region-data 库

### 核心功能
- ✅ 管理员登录认证（JWT）
- ✅ 推荐官管理（增删改查、二维码生成）
- ✅ 目的地管理（增删改查）
- ✅ 省市县三级地区选择
- ✅ 公开 API（无需登录访问）
- ✅ Admin API（需要管理员权限）
- ✅ 前端代码混淆（生产环境）

---

## 🚀 快速开始

### 1. 环境要求

```bash
# 后端
Go 1.23.6+
PostgreSQL 12+

# 前端
Node.js 16+
npm 8+ 或 yarn 1.22+

# 工具
Git
微信开发者工具（小程序）
```

### 2. 后端设置

```bash
# 进入后端目录
cd backend

# 复制环境变量文件
cp .env.example .env

# 编辑 .env，配置数据库等信息
# 必须修改: DB_PASSWORD, JWT_SECRET
```

```env
# 核心配置项
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=你的密码
DB_NAME=tourism_recommender

SERVER_PORT=8080
GIN_MODE=debug

JWT_SECRET=你的密钥
JWT_EXPIRATION=24h

BASE_URL=http://localhost:8080
WX_APP_ID=小程序AppID
```

```bash
# 安装依赖
go mod download

# 运行后端
go run main.go
```

后端启动后访问: http://localhost:8080

### 3. 前端设置

```bash
# 进入前端目录
cd frontend

# 安装依赖（推荐使用 yarn，更快）
yarn install
# 或
npm install

# 配置 API 地址（可选，默认 /api）
# 创建 .env.local
echo "REACT_APP_API_BASE_URL=http://localhost:8080/api" > .env.local

# 启动开发服务器
yarn start
# 或
npm start
```

前端启动后访问: http://localhost:3000

### 4. 微信小程序设置

```bash
# 进入小程序目录
cd wxapp

# 配置 API 地址
# 修改 app.js 中的 apiBaseUrl
# 将其改为实际的后端地址

# 在微信开发者工具中打开 wxapp 目录
# 点击"编译"运行
```

---

## 📁 项目结构

```
tourism_recommender/
├── backend/                    # Go 后端
│   ├── config/                # 数据库配置
│   ├── controllers/           # 控制器（推荐官、目的地、管理员）
│   ├── middleware/            # 认证中间件（JWT、CORS）
│   ├── models/                # 数据模型（Admin、Recommendor、Destination）
│   ├── routes/                # 路由定义
│   ├── utils/                 # 工具（JWT、二维码、分页）
│   ├── static/                # 编译后的前端（自动生成）
│   ├── main.go               # 程序入口
│   └── .env                  # 环境变量
│
├── frontend/                   # React 前端
│   ├── src/
│   │   ├── components/      # 组件（RegionSelector、Layout）
│   │   ├── pages/           # 页面（Login、Dashboard、推荐官管理）
│   │   ├── services/        # API 服务
│   │   └── utils/           # 工具函数
│   ├── public/               # 静态资源
│   ├── webpack.config.js      # Webpack 配置（含混淆）
│   └── package.json         # 依赖
│
├── wxapp/                     # 微信小程序
│   ├── pages/               # 页面
│   ├── app.js               # 小程序入口
│   └── app.json             # 小程序配置
│
└── PROJECT_SUMMARY.md        # 本文件
```

---

## 🔐 默认账号

### 管理员账号

首次启动后端时自动创建：
- 用户名: `admin`
- 密码: `admin123`

⚠️ **重要**: 首次登录后请立即修改密码！

---

## 🏗️ 生产部署

### 1. 前端编译（混淆）

```bash
cd frontend

# 设置生产环境
export NODE_ENV=production

# 构建混淆版本
npm run build
# 或
yarn build
```

构建输出到: `../backend/static/`

### 2. 后端编译

```bash
cd backend

# 优化编译
go build -ldflags="-s -w" -o tourism-recommender-backend
```

### 3. 运行

```bash
# 运行编译后的后端
./tourism-recommender-backend

# 访问: http://your-domain.com
# - 前端: /
# - API: /api
```

---

## 🔗 API 端点

### 公开 API（无需认证）

```
GET  /api/v1/health                  # 健康检查
GET  /api/recommendors                # 推荐官列表
GET  /api/recommendors/:id            # 推荐官详情
GET  /api/destinations                # 目的地列表
GET  /api/destinations/:id            # 目的地详情
```

### 管理员 API（需要认证）

```
POST /api/admin/auth/login             # 登录
POST /api/admin/auth/logout            # 登出

# 推荐官管理（需要 Admin 权限）
POST /api/admin/recommendors           # 创建
GET  /api/admin/recommendors           # 列表
GET  /api/admin/recommendors/:id       # 详情
PUT  /api/admin/recommendors/:id       # 更新
DELETE /api/admin/recommendors/:id     # 删除
POST /api/admin/recommendors/:id/qrcodes  # 重新生成二维码

# 目的地管理（需要 Admin 权限）
POST /api/admin/destinations          # 创建
GET  /api/admin/destinations          # 列表
GET  /api/admin/destinations/:id      # 详情
PUT  /api/admin/destinations/:id      # 更新
DELETE /api/admin/destinations/:id    # 删除
```

---

## 📝 开发流程

### 前端开发

```bash
cd frontend
yarn start          # 启动开发服务器
# 访问 http://localhost:3000
# 修改代码会自动热更新
```

### 后端开发

```bash
cd backend
go run main.go      # 直接运行
# 或
go build && ./tourism-recommender-backend
```

### 小程序开发

```bash
# 在微信开发者工具中
# 打开 wxapp 目录
# 修改代码后点击"编译"
```

---

## ✅ 功能检查清单

- [x] 管理员登录认证
- [x] JWT Token 管理
- [x] 推荐官 CRUD
- [x] 目的地 CRUD
- [x] 省市县三级选择
- [x] 二维码生成（Base64）
- [x] 分页、筛选、排序
- [x] 代码混淆（生产环境）
- [x] 响应式 UI（Ant Design）
- [x] 软删除
- [x] CORS 配置

---

## 🐛 常见问题

### Q1: 数据库连接失败

```bash
# 检查 PostgreSQL 服务
sudo systemctl status postgresql

# 检查端口
netstat -tulpn | grep 5432

# 检查 .env 配置
cat backend/.env
```

### Q2: 前端无法连接 API

```bash
# 检查后端是否运行
curl http://localhost:8080/api/v1/health

# 检查前端 API 配置
cat frontend/.env.local | grep API_BASE_URL

# 检查浏览器控制台错误
# F12 > Console
```

### Q3: 编译失败

```bash
# 清理缓存
cd frontend
rm -rf node_modules .webpack-cache
yarn install

cd backend
go clean -cache
go mod tidy
```

---

## 📚 相关文档

- `backend/README.md` - 后端详细文档
- `frontend/README.md` - 前端详细文档（待创建）
- `SETUP_GUIDE.md` - 完整设置指南

---

## 📞 技术支持

如有问题，请查看：

1. 后端日志: `backend/app.log`
2. 浏览器控制台: F12
3. 数据库日志: `/var/log/postgresql/`

---

**版本**: v1.0.0  
**最后更新**: 2024-01-01