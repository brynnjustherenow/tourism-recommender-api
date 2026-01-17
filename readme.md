# 旅游推荐官管理系统

一个基于 Golang 后端 + React 前端 + 微信小程序的完整旅游推荐服务管理平台。

## 项目简介

本系统实现了旅游推荐官的全生命周期管理，包括推荐官信息管理、推荐目的地管理、省市县三级地区选择、自动二维码生成（网页版和小程序版）、管理员权限控制等功能。

### 技术栈

#### 后端
- **语言**: Go 1.23.6
- **Web 框架**: Gin v1.10.0
- **ORM**: GORM v1.25.12
- **数据库**: PostgreSQL 12+
- **认证**: JWT (golang-jwt/jwt/v5)
- **加密**: bcrypt
- **二维码**: go-qrcode

#### 前端
- **框架**: React 18.2.0
- **路由**: React Router v6.22.0
- **UI 库**: Ant Design 5.14.0
- **HTTP 客户端**: Axios 1.6.7
- **构建工具**: Webpack 5.90.3
- **代码混淆**: webpack-obfuscator + terser-webpack-plugin
- **地区数据**: china-region-data

#### 微信小程序
- **框架**: 微信小程序原生框架
- **API**: 微信小程序 API

## 核心功能

### 管理后台
- ✅ 管理员登录认证（JWT Token）
- ✅ 推荐官管理（增删改查）
- ✅ 目的地管理（增删改查）
- ✅ 省市县三级地区选择
- ✅ 自动生成二维码（Base64格式）
  - 网页二维码：跳转到推荐官详情页
  - 小程序二维码：跳转到小程序详情页
- ✅ 二维码重新生成
- ✅ 分页、筛选、排序
- ✅ 数据软删除
- ✅ 权限控制（Admin / Super Admin）

### 公开接口
- ✅ 推荐官列表查询（无需登录）
- ✅ 推荐官详情查看
- ✅ 目的地列表查询
- ✅ 目的地详情查看
- ✅ 多条件筛选（地区、性别、年龄等）

### 前端特性
- ✅ 美观的 UI（Ant Design）
- ✅ 响应式设计
- ✅ 生产环境代码混淆
- ✅ 代码分割优化
- ✅ 组件化开发

## 快速开始

### 环境要求

- Go 1.23.6+
- Node.js 16+
- PostgreSQL 12+
- npm 8+ 或 yarn 1.22+
- Git

### 后端设置

```bash
# 进入后端目录
cd backend

# 复制环境变量文件
cp .env.example .env

# 编辑 .env 文件，配置数据库信息
# 必须修改：DB_PASSWORD, JWT_SECRET

# 安装依赖
go mod download

# 运行服务
go run main.go
```

后端将在 `http://localhost:8080` 启动

### 前端设置

```bash
# 进入前端目录
cd frontend

# 安装依赖
yarn install
# 或
npm install

# 启动开发服务器
yarn start
# 或
npm start
```

前端开发服务器将在 `http://localhost:3000` 启动

### 生产构建

```bash
# 构建前端（含代码混淆）
cd frontend
export NODE_ENV=production
yarn build

# 构建后端
cd backend
go build -o tourism-recommender-backend

# 运行
./tourism-recommender-backend
```

前端构建后的静态文件会自动输出到 `backend/static` 目录，由后端服务统一提供。

## 默认账号

首次启动后端时，系统会自动创建默认管理员账号：

- **用户名**: `admin`
- **密码**: `admin123`

⚠️ **重要**: 首次登录后请立即修改密码！

## 项目结构

```
tourism_recommender/
├── backend/                    # Go 后端 API
│   ├── config/                # 数据库配置
│   ├── controllers/           # 控制器层
│   │   ├── region_controller.go
│   │   ├── recommendor_controller.go
│   │   └── destination_controller.go
│   ├── middleware/            # 认证中间件
│   │   └── auth.go
│   ├── models/                # 数据模型
│   │   ├── admin.go
│   │   ├── region.go
│   │   ├── recommendor.go
│   │   └── destination.go
│   ├── routes/                # 路由定义
│   │   └── routes.go
│   ├── utils/                 # 工具函数
│   │   ├── jwt.go
│   │   ├── qrcode.go
│   │   └── pagination.go
│   ├── static/                # 编译后的前端文件
│   │   ├── index.html
│   │   ├── js/
│   │   ├── css/
│   │   └── images/
│   ├── main.go               # 程序入口
│   ├── go.mod               # Go 模块定义
│   └── .env                 # 环境变量
│
├── frontend/                  # React 前端
│   ├── src/
│   │   ├── components/     # React 组件
│   │   │   ├── RegionSelector.jsx  # 省市县选择
│   │   │   └── Layout.jsx        # 管理后台布局
│   │   ├── pages/          # 页面组件
│   │   │   ├── Login.jsx              # 登录页
│   │   │   ├── Dashboard.jsx          # 仪表板
│   │   │   ├── RecommendorManagement.jsx  # 推荐官管理
│   │   │   └── DestinationManagement.jsx  # 目的地管理
│   │   ├── services/       # API 服务
│   │   │   ├── api.js
│   │   │   └── auth.js
│   │   └── utils/         # 工具函数
│   ├── public/               # 静态资源
│   ├── webpack.config.js     # Webpack 配置（含混淆）
│   ├── .babelrc            # Babel 配置
│   └── package.json        # 依赖管理
│
├── wxapp/                     # 微信小程序
│   ├── pages/               # 小程序页面
│   ├── app.js               # 小程序入口
│   ├── app.json             # 小程序配置
│   └── sitemap.json         # 站点地图
│
├── PROJECT_SUMMARY.md       # 项目总结
├── SETUP_GUIDE.md         # 完整设置指南
└── README.md              # 本文件
```

## API 端点

### 认证相关

```
POST /api/admin/auth/login              # 管理员登录
POST /api/admin/auth/logout             # 管理员登出
```

### 公开接口（无需认证）

```
GET  /api/recommendors                # 推荐官列表（支持分页、筛选）
GET  /api/recommendors/:id            # 推荐官详情
GET  /api/destinations                # 目的地列表
GET  /api/destinations/:id            # 目的地详情
```

### 管理接口（需要管理员权限）

#### 推荐官管理
```
POST   /api/admin/recommendors              # 创建推荐官
GET    /api/admin/recommendors              # 推荐官列表
GET    /api/admin/recommendors/:id          # 推荐官详情
PUT    /api/admin/recommendors/:id          # 更新推荐官
DELETE /api/admin/recommendors/:id          # 删除推荐官
POST   /api/admin/recommendors/:id/qrcodes  # 重新生成二维码
```

#### 目的地管理
```
POST   /api/admin/destinations              # 创建目的地
GET    /api/admin/destinations              # 目的地列表
GET    /api/admin/destinations/:id          # 目的地详情
PUT    /api/admin/destinations/:id          # 更新目的地
DELETE /api/admin/destinations/:id          # 删除目的地
```

## 数据模型

### Admin（管理员）
- 用户名、密码（bcrypt 加密）
- 角色（super_admin / admin）
- 状态、最后登录时间

### Recommendor（推荐官）
- 基本信息：姓名、性别、年龄、证件号
- 联系方式：电话、邮箱
- 地区信息：省代码、市代码、区代码、完整地址
- 有效期：起始时间、结束时间
- 其他：头像、简介、评分、状态
- 二维码：网页二维码、小程序二维码（Base64）

### Destination（目的地）
- 基本信息：名称、描述、地址
- 归属：推荐官 ID
- 分类：景点、美食、住宿
- 其他：图片（JSON 数组）、评分、状态

## 开发说明

### 添加新的 API 端点

1. 在 `models/` 中创建或更新数据模型
2. 在 `controllers/` 中创建控制器
3. 在 `routes/routes.go` 中注册路由
4. 如需要认证，添加相应的中间件

### 前端开发

1. 在 `src/pages/` 中创建新页面
2. 在 `src/services/api.js` 中添加 API 调用
3. 在路由配置中注册新页面

### 代码混淆

生产环境构建时，Webpack 会自动：
- 压缩 JavaScript 代码
- 混淆变量名和函数名
- 移除 console.log
- 分割代码包

配置在 `frontend/webpack.config.js` 中。

## 环境变量

### 后端 (.env)

```env
# 数据库
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=your_password
DB_NAME=tourism_recommender
DB_SSLMODE=disable

# 服务器
SERVER_PORT=8080
GIN_MODE=debug

# JWT
JWT_SECRET=your_secret_key
JWT_EXPIRATION=24h

# 二维码
BASE_URL=http://localhost:8080
WX_APP_ID=your_miniprogram_appid
WX_APP_PATH=/
```

### 前端 (.env.local)

```env
REACT_APP_API_BASE_URL=http://localhost:8080/api
```

## 部署

### 使用 Docker Compose

```bash
# 构建前端
cd frontend
yarn build

# 启动服务
cd ..
docker-compose up -d
```

### 手动部署

1. 构建前端：`cd frontend && yarn build`
2. 构建后端：`cd backend && go build -o app`
3. 配置 Nginx 反向代理
4. 配置 PostgreSQL 数据库
5. 启动服务

## 常见问题

### 数据库连接失败

检查 PostgreSQL 服务状态、端口、防火墙设置。

### 前端无法连接 API

- 确认后端服务正在运行
- 检查 CORS 配置
- 验证 API 地址配置

### 登录失败

- 确认默认管理员账号：`admin` / `admin123`
- 检查 JWT_SECRET 配置
- 查看后端日志

### 编译失败

```bash
# 清理缓存
rm -rf node_modules .webpack-cache
yarn install

# Go 依赖
cd backend
go clean -cache
go mod tidy
```

## 相关文档

- `PROJECT_SUMMARY.md` - 项目总结和快速指南
- `SETUP_GUIDE.md` - 完整的设置和部署指南
- `backend/README.md` - 后端详细文档

## 技术支持

- 查看后端日志：运行后端的终端输出
- 查看前端日志：浏览器控制台（F12）
- API 健康检查：`http://localhost:8080/api/v1/health`

## 许可证

本项目采用 MIT 许可证。

---

**版本**: 1.0.0  
**最后更新**: 2026-01-17
