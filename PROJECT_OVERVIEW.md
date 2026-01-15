# 旅游推荐官系统 - 项目总览

## 项目简介

旅游推荐官系统是一个完整的旅游推荐服务管理平台，包含后端管理系统和微信小程序客户端。系统实现了旅游推荐官的个人信息管理、推荐目的地管理、地区管理等功能，并提供完整的 RESTful API 供前端和小程序调用。

## 系统架构

```
旅游推荐官系统
├── 后端管理系统 (Golang + Gin + GORM + PostgreSQL)
├── 前端管理界面 (嵌入式 Web 应用)
└── 微信小程序客户端
```

## 功能模块

### 后端 API

#### 1. 管理后台 API (`/api/admin/*`)

**地区管理**
- 创建、查看、更新、删除地区
- 地区信息：名称、描述

**推荐官管理**
- 创建、查看、更新、删除推荐官
- 推荐官信息：姓名、性别、年龄、证件号、头像、简介、有效期、电话、邮箱、所属地区、状态、评分
- 自动生成网页和微信小程序二维码（Base64 格式）
- 支持分页、排序、筛选查询
- 支持按姓名、性别、地区、状态、年龄范围筛选

**目的地管理**
- 创建、查看、更新、删除目的地
- 目的地信息：名称、所属推荐官、描述、图片（JSON数组）、地址、分类、评分、状态
- 支持分页、排序、筛选查询
- 支持按名称、分类、推荐官、地区、状态筛选

#### 2. 公开 API (`/api/*`)

**推荐官查询**
- 获取活跃推荐官列表（分页）
- 获取推荐官详情（包含推荐的目的地）
- 支持多种筛选条件

**目的地查询**
- 获取活跃目的地列表（分页）
- 获取目的地详情
- 获取指定推荐官的目的地列表
- 支持多种筛选条件

### 前端管理界面

嵌入式 Web 应用，提供以下功能：

1. **推荐官管理**
   - 添加、编辑、删除推荐官
   - 查看和生成二维码
   - 筛选和搜索推荐官
   - 分页浏览

2. **地区管理**
   - 添加、编辑、删除地区
   - 查看地区列表

3. **目的地管理**
   - 添加、编辑、删除目的地
   - 按分类、推荐官筛选
   - 分页浏览

### 微信小程序

#### 已实现功能

1. **首页**
   - 轮播图展示
   - 分类导航（景点、美食、住宿、购物）
   - 精选推荐官横向滚动展示
   - 热门目的地网格展示
   - 下拉刷新、上拉加载更多

2. **应用配置**
   - TabBar 导航（首页、搜索、我的）
   - 全局 API 请求封装
   - 用户登录管理
   - 位置服务
   - 网络状态监听

3. **工具函数**
   - 日期格式化
   - 距离计算
   - 图片处理

## 技术栈

### 后端

- **语言**: Go 1.23.6
- **Web 框架**: Gin v1.10.0
- **ORM**: GORM v1.25.12
- **数据库**: PostgreSQL
- **驱动**: lib/pq v1.10.9
- **二维码**: go-qrcode

### 前端

- **技术**: 原生 HTML5 + CSS3 + JavaScript (ES6+)
- **特性**: 响应式设计、AJAX 请求、模态框、分页组件

### 微信小程序

- **框架**: 微信小程序原生框架
- **API**: 微信小程序 API (网络请求、位置、存储等)

## 数据模型

### Region（地区）
```go
- ID (uint)
- Name (string) - 地区名称（唯一）
- Description (string) - 地区描述
- CreatedAt (int64) - 创建时间
- UpdatedAt (int64) - 更新时间
- DeletedAt (gorm.DeletedAt) - 软删除时间
```

### Recommendor（推荐官）
```go
- ID (uint)
- Name (string) - 姓名
- Gender (Gender) - 性别 (male/female/other)
- Age (int) - 年龄
- IDNumber (string) - 证件号（唯一）
- Avatar (string) - 头像URL
- Bio (string) - 简介
- ValidFrom (time.Time) - 有效期起始
- ValidUntil (time.Time) - 有效期结束
- Phone (string) - 电话
- Email (string) - 邮箱
- RegionID (uint) - 所属地区ID
- Region (Region) - 所属地区（关联）
- Destinations ([]Destination) - 推荐的目的地（关联）
- Status (string) - 状态 (active/inactive)
- Rating (float64) - 评分 (0-5)
- QRCodeWeb (string) - 网页二维码 (Base64)
- QRCodeWxapp (string) - 小程序二维码 (Base64)
- CreatedAt (time.Time) - 创建时间
- UpdatedAt (time.Time) - 更新时间
- DeletedAt (gorm.DeletedAt) - 软删除时间
```

### Destination（目的地）
```go
- ID (uint)
- RecommendorID (uint) - 所属推荐官ID
- Recommendor (Recommendor) - 所属推荐官（关联）
- Name (string) - 名称
- Description (string) - 描述
- Images (string) - 图片URLs (JSON数组)
- Address (string) - 地址
- Category (string) - 分类 (scenic_spot/food/accommodation)
- Rating (float64) - 评分 (0-5)
- Status (string) - 状态 (active/inactive)
- CreatedAt (int64) - 创建时间
- UpdatedAt (int64) - 更新时间
- DeletedAt (gorm.DeletedAt) - 软删除时间
```

## 项目结构

```
tourism_recommender/
├── backend/                          # 后端项目
│   ├── config/                       # 配置文件
│   │   └── database.go              # 数据库配置和连接
│   ├── controllers/                  # 控制器层
│   │   ├── region_controller.go     # 地区管理控制器
│   │   ├── recommendor_controller.go # 推荐官管理控制器
│   │   └── destination_controller.go # 目的地管理控制器
│   ├── models/                       # 数据模型层
│   │   ├── region.go                # 地区模型
│   │   ├── recommendor.go           # 推荐官模型
│   │   └── destination.go           # 目的地模型
│   ├── routes/                       # 路由层
│   │   └── routes.go                # 路由定义和中间件
│   ├── utils/                        # 工具类
│   │   ├── qrcode.go                # 二维码生成工具
│   │   └── pagination.go            # 分页和筛选工具
│   ├── static/                       # 前端静态文件
│   │   ├── css/
│   │   │   └── style.css            # 前端样式
│   │   ├── js/
│   │   │   └── app.js               # 前端逻辑
│   │   ├── images/                   # 图片资源
│   │   └── index.html               # 前端主页
│   ├── .env.example                  # 环境变量示例
│   ├── .gitignore                    # Git忽略文件
│   ├── go.mod                        # Go模块定义
│   ├── main.go                       # 程序入口
│   └── README.md                     # 后端文档
│
└── wxapp/                            # 微信小程序
    ├── pages/                        # 页面
    │   ├── index/                   # 首页
    │   │   ├── index.wxml           # 页面结构
    │   │   ├── index.wxss           # 页面样式
    │   │   └── index.js             # 页面逻辑
    │   ├── search/                  # 搜索页
    │   ├── recommendor/              # 推荐官详情页
    │   ├── destination/             # 目的地详情页
    │   └── user/                    # 用户中心页
    ├── components/                   # 自定义组件
    ├── utils/                        # 工具函数
    ├── images/                       # 图片资源
    ├── app.js                        # 小程序入口
    ├── app.json                      # 小程序配置
    ├── app.wxss                      # 全局样式
    └── sitemap.json                  # 站点地图
```

## 快速开始

### 1. 后端设置

```bash
# 进入后端目录
cd tourism_recommender/backend

# 复制环境变量文件
cp .env.example .env

# 编辑 .env 文件，配置数据库连接信息

# 安装依赖
go mod download

# 运行服务
go run main.go
```

后端服务将在 http://localhost:8080 启动

### 2. 数据库初始化

确保 PostgreSQL 已安装并运行，然后创建数据库：

```sql
CREATE DATABASE tourism_recommender;
```

程序启动时会自动创建所需的表结构。

### 3. 访问管理界面

打开浏览器访问 http://localhost:8080 即可使用管理界面。

### 4. 配置微信小程序

1. 在微信开发者工具中导入 `wxapp` 目录
2. 修改 `app.js` 中的 `apiBaseUrl` 为实际的后端地址
3. 配置小程序 AppID 和相关权限
4. 点击"编译"运行小程序

## API 示例

### 创建推荐官

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

### 获取推荐官列表

```bash
curl "http://localhost:8080/api/recommendors?page=1&page_size=10&sort_by=rating&sort_order=desc"
```

### 获取推荐官详情

```bash
curl http://localhost:8080/api/recommendors/1
```

## 核心功能说明

### 1. 二维码生成

系统为每个推荐官自动生成两种二维码：

- **网页二维码**: 跳转到 `{BASE_URL}/recommendor/{id}`
- **小程序二维码**: 跳转到小程序的 `pages/recommendor/detail?id={id}` 页面

二维码以 Base64 编码格式存储在数据库中，可直接在前端显示。

### 2. 分页和筛选

所有列表 API 都支持：

- **分页**: `page`, `page_size`
- **排序**: `sort_by`, `sort_order`
- **筛选**: 多种条件筛选（姓名、性别、地区、状态等）

### 3. 软删除

所有数据支持软删除，删除的数据不会从数据库中物理删除，而是设置 `deleted_at` 字段。

### 4. 数据验证

所有 API 请求都经过严格的数据验证，确保数据完整性和安全性。

## 扩展功能建议

### 后端

1. 用户认证和权限管理
2. 文件上传接口（头像、目的地图片）
3. 评论和评分系统
4. 收藏功能
5. 搜索和推荐算法
6. 数据统计和分析

### 小程序

1. 完善搜索页面
2. 推荐官详情页
3. 目的地详情页
4. 用户中心页面
5. 收藏功能
6. 评价功能
7. 地图展示
8. 分享功能

## 部署建议

### 开发环境

- 使用 Docker Compose 启动 PostgreSQL 和后端服务
- 使用微信开发者工具运行小程序

### 生产环境

- 后端部署到云服务器（阿里云、腾讯云等）
- 使用 Nginx 作为反向代理
- PostgreSQL 部署到云数据库服务
- 小程序发布到微信平台

## 常见问题

### 1. 数据库连接失败

- 检查 PostgreSQL 服务是否运行
- 验证 `.env` 文件中的数据库配置
- 确保数据库已创建

### 2. 二维码无法生成

- 检查 `BASE_URL` 环境变量是否正确
- 确保网络连接正常

### 3. 前端无法访问 API

- 检查 CORS 配置
- 确认后端服务正常运行
- 验证 API 地址是否正确

## 许可证

本项目采用 MIT 许可证。

## 联系方式

如有问题或建议，请提交 Issue 或 Pull Request。