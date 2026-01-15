# 旅游推荐官系统 - Backend

## 项目概述

这是一个基于 Golang 的旅游推荐官管理系统后端，使用 Gin 框架、GORM ORM 和 PostgreSQL 数据库构建。系统提供了完整的 RESTful API，用于管理旅游推荐官、地区和旅游目的地信息。

### 主要功能

- **认证系统**：管理员登录、登出、修改密码、Token 刷新
- **推荐官管理**：添加、编辑、删除、查询推荐官信息
- **地区管理**：管理推荐官所属的地区信息
- **目的地管理**：管理推荐官推荐的旅游目的地
- **二维码生成**：自动生成网页版和微信小程序二维码
- **分页查询**：支持分页、排序、筛选功能
- **软删除**：支持数据的软删除功能

## 技术栈

- **框架**: Gin Web Framework
- **ORM**: GORM
- **数据库**: PostgreSQL
- **语言**: Go 1.23.6
- **二维码**: go-qrcode

## 项目结构

```
backend/
├── config/              # 配置文件
│   └── database.go      # 数据库配置
├── controllers/         # 控制器
│   ├── auth_controller.go
│   ├── region_controller.go
│   ├── recommendor_controller.go
│   └── destination_controller.go
├── models/             # 数据模型
│   ├── admin.go
│   ├── region.go
│   ├── recommendor.go
│   └── destination.go
├── routes/             # 路由定义
│   └── routes.go
├── middleware/         # 中间件
│   └── auth.go         # 认证中间件
├── utils/              # 工具函数
│   ├── jwt.go          # JWT Token 工具
│   ├── qrcode.go       # 二维码生成
│   └── pagination.go   # 分页工具
├── static/             # 前端静态文件
│   ├── css/
│   ├── js/
│   ├── images/
│   └── index.html
├── .env.example        # 环境变量示例
├── .gitignore
├── go.mod
├── go.sum
└── main.go            # 程序入口
```

## 前置要求

- Go 1.23.6 或更高版本
- PostgreSQL 12 或更高版本
- Git

## 安装步骤

### 1. 克隆项目

```bash
git clone <repository-url>
cd tourism_recommender/backend
```

### 2. 安装依赖

```bash
go mod download
```

### 3. 配置数据库

首先，确保 PostgreSQL 已安装并运行。然后创建数据库：

```sql
CREATE DATABASE tourism_recommender;
```

### 4. 配置环境变量

复制 `.env.example` 文件为 `.env` 并修改配置：

```bash
cp .env.example .env
```

编辑 `.env` 文件，设置以下变量：

```env
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=your_password_here
DB_NAME=tourism_recommender
DB_SSLMODE=disable

# Server Configuration
SERVER_PORT=8080
GIN_MODE=debug

# QR Code Configuration
BASE_URL=http://localhost:8080
WX_APP_ID=your_miniprogram_appid
WX_APP_PATH=/
```

### 5. 运行数据库迁移

程序启动时会自动运行数据库迁移，创建所需的表和索引。

## 运行应用

### 初始化数据库和创建默认管理员

首次运行前，需要初始化数据库并创建默认管理员账号：

```bash
# 运行种子数据脚本
go run cmd/seed/main.go
```

这将：
1. 创建所有数据库表
2. 创建默认管理员账号

默认管理员账号信息（可在 `.env` 文件中配置）：
- 用户名: `admin`
- 密码: `admin123456`
- 邮箱: `admin@tourism.com`
- 角色: 超级管理员

⚠️ **重要**: 首次登录后请立即修改默认密码！

### 开发模式

```bash
go run main.go
```

### 生产模式

```bash
# 编译
go build -o tourism-recommender-backend

# 运行
./tourism-recommender-backend
```

服务启动后，访问 http://localhost:8080 查看前端界面，或使用 API 端点。

## API 文档

### 基础信息

- **Base URL**: `http://localhost:8080/api`
- **Content-Type**: `application/json`

### API 端点

#### 健康检查

```
GET /api/v1/health
```

#### 认证管理

```
POST   /api/auth/login               # 管理员登录
POST   /api/auth/logout              # 管理员登出（需要认证）
GET    /api/auth/me                  # 获取当前用户信息（需要认证）
PUT    /api/auth/change-password     # 修改密码（需要认证）
POST   /api/auth/refresh-token       # 刷新 Token
```

#### 地区管理

```
POST   /api/admin/regions          # 创建地区
GET    /api/admin/regions          # 获取地区列表
GET    /api/admin/regions/:id      # 获取单个地区
PUT    /api/admin/regions/:id      # 更新地区
DELETE /api/admin/regions/:id      # 删除地区
```

#### 推荐官管理

```
POST   /api/admin/recommendors              # 创建推荐官
GET    /api/admin/recommendors              # 获取推荐官列表（管理员）
GET    /api/recommendors                    # 获取推荐官列表（公开）
GET    /api/recommendors/:id                # 获取单个推荐官详情
PUT    /api/admin/recommendors/:id          # 更新推荐官
DELETE /api/admin/recommendors/:id          # 删除推荐官
POST   /api/admin/recommendors/:id/qrcodes  # 重新生成二维码
```

#### 目的地管理

```
POST   /api/admin/destinations                  # 创建目的地
GET    /api/admin/destinations                  # 获取目的地列表（管理员）
GET    /api/destinations                        # 获取目的地列表（公开）
GET    /api/destinations/:id                    # 获取单个目的地详情
PUT    /api/admin/destinations/:id              # 更新目的地
DELETE /api/admin/destinations/:id              # 删除目的地
GET    /api/recommendors/:id/destinations       # 获取推荐官的目的地列表
```

### 认证说明

所有需要认证的 API 都需要在请求头中携带 JWT Token：

```
Authorization: Bearer <your-jwt-token>
```

#### 登录请求示例

```bash
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "admin123456"
  }'
```

#### 登录响应示例

```json
{
  "message": "Login successful",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expires_at": 1234567890,
    "user": {
      "id": 1,
      "username": "admin",
      "name": "超级管理员",
      "email": "admin@tourism.com",
      "phone": "13800138000",
      "avatar": "",
      "role": "super_admin",
      "status": "active"
    }
  }
}
```

#### 使用 Token 访问受保护资源

```bash
curl -X GET http://localhost:8080/api/auth/me \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

### 分页和筛选参数

所有列表 API 都支持以下参数：

| 参数 | 类型 | 描述 | 默认值 |
|------|------|------|--------|
| page | int | 页码 | 1 |
| page_size | int | 每页数量 | 10 |
| sort_by | string | 排序字段 | id |
| sort_order | string | 排序方向 (asc/desc) | asc |

#### 推荐官筛选参数

- `name`: 按姓名搜索（模糊匹配）
- `gender`: 性别 (male/female/other)
- `region_id`: 地区 ID
- `status`: 状态 (active/inactive)
- `min_age`: 最小年龄
- `max_age`: 最大年龄

#### 目的地筛选参数

- `name`: 按名称搜索（模糊匹配）
- `category`: 分类 (scenic_spot/food/accommodation)
- `recommendor_id`: 推荐官 ID
- `region_id`: 地区 ID
- `status`: 状态 (active/inactive)

### 请求示例

#### 创建推荐官

```bash
curl -X POST http://localhost:8080/api/admin/recommendors \
  -H "Content-Type: application/json" \
  -d '{
    "name": "张三",
    "gender": "male",
    "age": 30,
    "id_number": "123456789012345678",
    "bio": "资深旅游推荐官",
    "valid_from": "2024-01-01T00:00:00Z",
    "valid_until": "2025-12-31T23:59:59Z",
    "region_id": 1,
    "status": "active"
  }'
```

#### 获取推荐官列表（分页）

```bash
curl "http://localhost:8080/api/recommendors?page=1&page_size=10&sort_by=rating&sort_order=desc&region_id=1"
```

#### 获取推荐官详情

```bash
curl http://localhost:8080/api/recommendors/1
```

## 数据模型

### Admin（管理员）

```json
{
  "id": 1,
  "username": "admin",
  "email": "admin@tourism.com",
  "phone": "13800138000",
  "avatar": "http://example.com/avatar.jpg",
  "role": "super_admin",
  "status": "active",
  "last_login": 1234567890,
  "created_at": 1234567890,
  "updated_at": 1234567890
}
```

**角色类型**:
- `super_admin` - 超级管理员，拥有所有权限
- `admin` - 普通管理员，拥有基本管理权限

**状态类型**:
- `active` - 活跃
- `inactive` - 非活跃
- `locked` - 锁定

### Region（地区）

```json
{
  "id": 1,
  "name": "北京",
  "description": "中国首都",
  "created_at": 1234567890,
  "updated_at": 1234567890
}
```

### Recommendor（推荐官）

```json
{
  "id": 1,
  "name": "张三",
  "gender": "male",
  "age": 30,
  "id_number": "123456789012345678",
  "avatar": "http://example.com/avatar.jpg",
  "bio": "资深旅游推荐官",
  "valid_from": "2024-01-01T00:00:00Z",
  "valid_until": "2025-12-31T23:59:59Z",
  "phone": "13800138000",
  "email": "zhangsan@example.com",
  "region_id": 1,
  "region": {...},
  "destinations": [...],
  "status": "active",
  "rating": 4.5,
  "qr_code_web": "data:image/png;base64,...",
  "qr_code_wxapp": "data:image/png;base64,...",
  "created_at": "2024-01-01T00:00:00Z",
  "updated_at": "2024-01-01T00:00:00Z"
}
```

### Destination（目的地）

```json
{
  "id": 1,
  "recommendor_id": 1,
  "recommendor": {...},
  "name": "故宫",
  "description": "中国明清两代的皇家宫殿",
  "images": "[\"http://example.com/img1.jpg\"]",
  "address": "北京市东城区景山前街4号",
  "category": "scenic_spot",
  "rating": 4.8,
  "status": "active",
  "created_at": 1234567890,
  "updated_at": 1234567890
}
```

## 二维码功能

系统为每个推荐官自动生成两种二维码：

1. **网页二维码**：跳转到推荐官的网页详情页
2. **小程序二维码**：跳转到微信小程序的推荐官详情页

二维码以 Base64 编码格式存储在数据库中，可以直接在前端显示。

### 二维码 URL

- **网页详情页**: `{BASE_URL}/recommendor/{id}`
- **小程序页面**: `pages/recommendor/detail?id={id}`

## 开发说明

### 添加新的 API 端点

1. 在 `models/` 目录创建或更新数据模型
2. 在 `controllers/` 目录创建或更新控制器
3. 在 `routes/routes.go` 中注册新的路由
4. 如果需要，在 `middleware/` 目录添加中间件
5. 如果需要，在 `utils/` 目录添加工具函数

### 数据库迁移

系统使用 GORM 的 AutoMigrate 功能自动管理数据库迁移。首次运行时，请先执行：

```bash
go run seed.go
```

如需手动创建表：

系统使用 GORM 的 AutoMigrate 功能自动管理数据库迁移。如需手动创建表：

```go
import "gorm.io/gorm"

// 在代码中调用
db.AutoMigrate(
    &models.Admin{},
    &models.Region{},
    &models.Recommendor{},
    &models.Destination{},
)
```

### 环境变量

除了数据库配置外，还可以配置以下认证相关变量：

```env
# JWT 密钥（生产环境必须修改）
JWT_SECRET=your-secret-key-change-this-in-production

# Token 过期时间（小时）
TOKEN_EXPIRATION_HOURS=24

# 默认管理员账号
DEFAULT_ADMIN_USERNAME=admin
DEFAULT_ADMIN_PASSWORD=admin123456
DEFAULT_ADMIN_EMAIL=admin@tourism.com
```

### 环境变量

系统支持通过环境变量配置，所有配置项见 `.env.example` 文件。

## 部署

### Docker 部署

创建 `Dockerfile`：

```dockerfile
FROM golang:1.23.6-alpine AS builder

WORKDIR /app
COPY . .
RUN go mod download
RUN CGO_ENABLED=0 GOOS=linux go build -o tourism-recommender-backend

FROM alpine:latest
RUN apk --no-cache add ca-certificates
WORKDIR /root/
COPY --from=builder /app/tourism-recommender-backend .
EXPOSE 8080
CMD ["./tourism-recommender-backend"]
```

构建和运行：

```bash
docker build -t tourism-recommender-backend .
docker run -p 8080:8080 --env-file .env tourism-recommender-backend
```

### 使用 Docker Compose

创建 `docker-compose.yml`：

```yaml
version: '3.8'

services:
  db:
    image: postgres:13
    environment:
      POSTGRES_DB: tourism_recommender
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: password
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  backend:
    build: .
    ports:
      - "8080:8080"
    environment:
      DB_HOST: db
      DB_PORT: 5432
      DB_USER: postgres
      DB_PASSWORD: password
      DB_NAME: tourism_recommender
    depends_on:
      - db

volumes:
  postgres_data:
```

运行：

```bash
docker-compose up -d
```

## 故障排除

### 数据库连接失败

- 检查 PostgreSQL 服务是否运行
- 验证 `.env` 文件中的数据库配置
- 确保数据库已创建

### 端口被占用

修改 `.env` 文件中的 `SERVER_PORT` 变量。

### 二维码无法生成

- 检查 `BASE_URL` 环境变量是否正确设置
- 确保网络连接正常（如果使用在线二维码服务）

## 许可证

本项目采用 MIT 许可证。

## 联系方式

如有问题或建议，请提交 Issue 或 Pull Request。