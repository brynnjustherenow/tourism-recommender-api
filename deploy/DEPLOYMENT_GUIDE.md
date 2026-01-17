# 后端服务快速部署指南

本指南将帮助你快速将乡村旅游推荐系统的后端服务部署到免费的云服务平台上，用于测试和演示。

## 📋 目录

- [方案对比](#方案对比)
- [前置要求](#前置要求)
- [环境变量说明](#环境变量说明)
- [推荐方案：Render.com](#推荐方案-rendercom)
- [其他方案](#其他方案)
- [常见问题](#常见问题)
- [注意事项](#注意事项)

---

## 方案对比

| 平台 | 免费额度 | 数据库 | 国内访问 | 部署难度 | 推荐度 |
|------|---------|--------|---------|---------|--------|
| **Render.com** | ✅ 免费 + 免费PostgreSQL | ✅ 包含 | ⭐⭐⭐ | 简单 | ⭐⭐⭐⭐⭐ |
| **Railway.app** | $5/月额度 | ✅ 包含 | ⭐⭐ | 简单 | ⭐⭐⭐⭐ |
| **Zeabur** | 有限免费额度 | 需单独配置 | ⭐⭐⭐⭐ | 中等 | ⭐⭐⭐⭐ |
| **Fly.io** | 有限免费额度 | 需单独配置 | ⭐⭐⭐ | 复杂 | ⭐⭐⭐ |
| **Vercel** | 无限制 | ❌ 不支持后端 | ⭐⭐⭐⭐⭐ | 简单 | ⭐⭐ |

**推荐选择：Render.com** - 最适合快速测试，包含免费的 PostgreSQL 数据库。

---

## 前置要求

在开始部署之前，请确保你已准备好：

1. ✅ **GitHub 账号**
   - 将项目代码推送到 GitHub 仓库
   - 确保仓库是公开的（或者使用私有仓库）

2. ✅ **数据库准备**
   - 本地数据库已初始化并有测试数据
   - 或者允许平台创建新的空数据库

3. ✅ **环境变量**
   - 了解需要配置的环境变量（见下文）

4. ✅ **项目结构**
   ```
   tourism_recommender/
   ├── backend/
   │   ├── main.go
   │   ├── go.mod
   │   ├── go.sum
   │   └── config/
   ├── deploy/
   │   ├── render.yaml
   │   ├── Dockerfile
   │   └── .env.example
   └── ...
   ```

---

## 环境变量说明

本应用使用以下环境变量进行配置。在本地开发时，这些变量通过 `.env` 文件提供；在云端部署时，这些变量通过平台的环境变量配置界面设置。

### 应用配置

| 变量名 | 说明 | 必需 | 默认值 | 示例 |
|--------|------|------|--------|------|
| `GIN_MODE` | 应用运行模式 | 否 | `debug` | `release` |
| `SERVER_PORT` | 服务器监听端口 | 否 | `8080` | `8080` |

**注意**：生产环境建议设置为 `release` 以获得更好的性能。

### 数据库配置

| 变量名 | 说明 | 必需 | 默认值 | 示例 |
|--------|------|------|--------|------|
| `DB_HOST` | 数据库主机地址 | 否 | `localhost` | `d-xxx.oregon-postgres.render.com` |
| `DB_PORT` | 数据库端口 | 否 | `5432` | `5432` |
| `DB_USER` | 数据库用户名 | 否 | `postgres` | `tourism_user` |
| `DB_PASSWORD` | 数据库密码 | **是** | - | `your_secure_password` |
| `DB_NAME` | 数据库名称 | 否 | `tourism_recommender` | `tourism_recommender` |
| `DB_SSLMODE` | SSL 连接模式 | 否 | `disable` | `require` |

**重要**：
- `DB_PASSWORD` 是唯一必需的环境变量，不设置会导致应用启动失败
- 本地开发时使用 `disable`，云端部署建议使用 `require`

### 管理员默认配置

这些变量用于创建默认管理员账号，通常在数据库初始化时使用。

| 变量名 | 说明 | 必需 | 默认值 | 示例 |
|--------|------|------|--------|------|
| `DEFAULT_ADMIN_USERNAME` | 默认管理员用户名 | 否 | `admin` | `admin` |
| `DEFAULT_ADMIN_PASSWORD` | 默认管理员密码 | 否 | `admin123456` | `your_secure_password` |
| `DEFAULT_ADMIN_EMAIL` | 默认管理员邮箱 | 否 | `admin@tourism.com` | `admin@example.com` |

**安全建议**：
- 生产环境务必修改默认密码
- 或者在部署后通过管理界面修改
- 不要将这些敏感信息提交到版本控制系统

### 二维码配置

用于生成推荐官二维码的配置。

| 变量名 | 说明 | 必需 | 默认值 | 示例 |
|--------|------|------|--------|------|
| `BASE_URL` | 应用基础URL | 否 | `http://localhost:8082` | `https://tourism-recommender-api.onrender.com` |
| `WX_APP_ID` | 微信小程序AppID | 否 | - | `wxa1802e324f2f4712` |
| `WX_APP_PATH` | 小程序页面路径 | 否 | - | `pages/recommendor/detail` |

**说明**：
- `BASE_URL` 应该设置为部署后的实际URL
- `WX_APP_ID` 从微信小程序后台获取
- `WX_APP_PATH` 是小程序中推荐官详情页的路径

### 完整环境变量示例

**本地开发（.env 文件）**：
```bash
# Application Configuration
GIN_MODE=debug
SERVER_PORT=8082

# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=your_local_password
DB_NAME=tourism_recommender
DB_SSLMODE=disable

# Admin Default Configuration
DEFAULT_ADMIN_USERNAME=admin
DEFAULT_ADMIN_PASSWORD=admin123456
DEFAULT_ADMIN_EMAIL=admin@tourism.com

# QR Code Configuration
BASE_URL=http://localhost:8082
WX_APP_ID=wxa1802e324f2f4712
WX_APP_PATH=pages/recommendor/detail
```

**云端部署（Render.com）**：
```bash
# Application Configuration
GIN_MODE=release
SERVER_PORT=8080

# Database Configuration (从Render数据库服务自动获取)
DB_HOST=d-xxx.oregon-postgres.render.com
DB_PORT=5432
DB_USER=tourism_user
DB_PASSWORD=generated_password
DB_NAME=tourism_recommender
DB_SSLMODE=require

# Admin Default Configuration
DEFAULT_ADMIN_USERNAME=admin
DEFAULT_ADMIN_PASSWORD=secure_production_password
DEFAULT_ADMIN_EMAIL=admin@tourism.com

# QR Code Configuration
BASE_URL=https://tourism-recommender-api.onrender.com
WX_APP_ID=wxa1802e324f2f4712
WX_APP_PATH=pages/recommendor/detail
```

---

## 推荐方案：Render.com

Render.com 是一个现代云平台，提供免费的 Web 服务和 PostgreSQL 数据库。

### 步骤 1：创建 Render 账号

1. 访问 [https://render.com](https://render.com)
2. 点击 "Get Started"
3. 使用 GitHub 账号登录并授权

### 步骤 2：准备项目

确保你的项目已推送到 GitHub：

```bash
# 在项目根目录
git add .
git commit -m "Prepare for deployment"
git push origin main
```

### 步骤 3：创建数据库

1. 在 Render 控制台，点击 **"New +"**
2. 选择 **"PostgreSQL"**
3. 填写以下信息：
   - **Name**: `tourism-recommender-db`
   - **Database**: `tourism_recommender`
   - **User**: `tourism_user`
   - **Region**: 选择离你最近的区域（如 Singapore 或 Oregon）
   - **Plan**: 选择 **Free**
4. 点击 **"Create Database"**
5. 等待数据库创建完成（约 2-3 分钟）

### 步骤 4：获取数据库连接信息

1. 点击创建的数据库
2. 在 **"Connect"** 部分找到 **"External Database URL"**
3. 记录以下信息（稍后需要）：
   - **Host**
   - **Port**
   - **User**
   - **Password**（点击 "Show" 显示）
   - **Database Name**

### 步骤 5：创建 Web 服务

#### 方法 A：使用 render.yaml 自动部署（推荐）

1. 在你的 GitHub 仓库根目录创建 `render.yaml` 文件
2. 复制 `deploy/render.yaml` 的内容
3. 提交并推送到 GitHub：
   ```bash
   git add render.yaml
   git commit -m "Add Render configuration"
   git push
   ```
4. 在 Render 控制台，点击 **"New +"**
5. 选择 **"Existing repository"**
6. 选择你的 GitHub 仓库
7. Render 会自动检测 `render.yaml` 并显示配置
8. 点击 **"Create Web Service"**

#### 方法 B：手动配置 Web 服务

1. 在 Render 控制台，点击 **"New +"**
2. 选择 **"Web Service"**
3. 选择你的 GitHub 仓库
4. 配置以下选项：

   **Build & Deploy**
   - **Name**: `tourism-recommender-api`
   - **Region**: 选择与数据库相同的区域
   - **Branch**: `main`
   - **Runtime**: `Go`
   - **Build Command**: `go build -o main main.go`
   - **Start Command**: `./main`

   **Environment**
   添加以下环境变量：

   ```bash
   # 应用配置
   GIN_MODE=release
   SERVER_PORT=8080

   # 数据库配置（从步骤 4 获取）
   DB_HOST=d-xxx.oregon-postgres.render.com
   DB_PORT=5432
   DB_USER=tourism_user
   DB_PASSWORD=your_password_here
   DB_NAME=tourism_recommender
   DB_SSLMODE=require

   # 管理员默认配置
   DEFAULT_ADMIN_USERNAME=admin
   DEFAULT_ADMIN_PASSWORD=secure_password_here
   DEFAULT_ADMIN_EMAIL=admin@tourism.com

   # 二维码配置
   BASE_URL=https://tourism-recommender-api.onrender.com
   WX_APP_ID=wxa1802e324f2f4712
   WX_APP_PATH=pages/recommendor/detail
   ```

5. 点击 **"Create Web Service"**

### 步骤 6：等待部署

1. Render 会自动构建和部署你的应用
2. 点击服务名称查看部署日志
3. 等待状态变为 **"Live"**（约 3-5 分钟）
4. 部署成功后，你会获得一个 URL，如：
   ```
   https://tourism-recommender-api.onrender.com
   ```

### 步骤 7：测试 API

使用你的新 URL 测试 API：

```bash
# 测试健康检查端点
curl https://tourism-recommender-api.onrender.com/api/health

# 测试获取推荐官列表
curl https://tourism-recommender-api.onrender.com/api/recommendors

# 测试获取推荐官详情
curl https://tourism-recommender-api.onrender.com/api/recommendors/1
```

### 步骤 8：配置小程序 API 地址

更新小程序的 API 地址配置：

在 `wxapp/app.js` 中修改：

```javascript
App({
  globalData: {
    // 将本地地址改为 Render 的地址
    apiBaseUrl: "https://tourism-recommender-api.onrender.com/api",
    // ...
  },
  // ...
});
```

---

## 其他方案

### Railway.app

Railway.app 是另一个优秀的免费部署平台。

**部署步骤：**

1. 访问 [https://railway.app](https://railway.app)
2. 使用 GitHub 登录
3. 点击 **"New Project"** → **"Deploy from GitHub repo"**
4. 选择你的仓库
5. Railway 会自动检测 Go 项目
6. 添加 PostgreSQL 数据库服务
7. 配置环境变量（参考上面的环境变量说明）
8. 点击 **"Deploy"**

**优点：**
- 界面美观
- 自动配置
- 支持日志和监控

**缺点：**
- 免费额度有限制
- 国内访问可能较慢

### Zeabur（国内友好）

如果你在国内，Zeabur 是一个不错的选择。

**部署步骤：**

1. 访问 [https://zeabur.com](https://zeabur.com)
2. 注册并登录
3. 创建新项目
4. 添加 GitHub 仓库
5. 创建服务：
   - 添加 PostgreSQL 服务
   - 添加 Go 服务
6. 配置环境变量（参考上面的环境变量说明）
7. 部署

**优点：**
- 国内访问速度快
- 支持国内支付
- 对开发者友好

**缺点：**
- 免费额度有限
- 相对较新

---

## 常见问题

### Q1: 部署后数据库是空的，怎么办？

**解决方案：**

1. **使用数据库迁移**（推荐）：
   - 你的应用会自动运行迁移（`routes.AutoMigrate`）
   - 首次部署时，表结构会自动创建

2. **手动导入数据**：
   - 使用 pgAdmin 或 DBeaver 连接数据库
   - 导入本地数据库的 SQL 备份
   - 或使用脚本插入测试数据

3. **创建管理员接口**：
   - 添加一个管理接口用于初始化数据
   - 通过 API 调用创建初始数据

4. **运行 Seed 脚本**：
   ```bash
   # 在云端服务中运行（通过SSH或执行环境）
   cd backend
   go run cmd/seed/main.go
   ```

### Q2: Render 免费服务会休眠，如何避免？

Render 免费层会在 15 分钟无请求后休眠，这是正常的。如果你需要保持服务活跃：

- **方案 1**：使用 cron-job.org 定时 ping
- **方案 2**：升级到付费计划（$7/月起）
- **方案 3**：接受休眠，首次请求会唤醒服务（约 30 秒）

### Q3: 如何查看部署日志？

**Render:**
1. 进入你的 Web Service
2. 点击 **"Logs"** 标签
3. 查看实时日志

**Railway:**
1. 进入项目
2. 点击服务
3. 查看 "Logs" 部分

### Q4: 部署失败怎么办？

常见原因：

1. **构建失败**：
   - 检查 `go.mod` 和 `go.sum` 是否完整
   - 检查代码是否能正常编译
   - 查看 Build 日志获取详细错误信息

2. **启动失败**：
   - 检查 `main.go` 的监听端口
   - 确保 `SERVER_PORT` 环境变量正确设置
   - 查看启动日志

3. **数据库连接失败**：
   - 检查数据库凭证
   - 检查防火墙设置
   - 确认 `DB_SSLMODE` 设置正确
   - 确保数据库和 Web 服务在同一区域

### Q5: 如何配置 CORS？

如果遇到跨域问题，在 `backend/routes/middleware.go` 中确保 CORS 中间件已配置：

```go
func SetupMiddleware(router *gin.Engine) {
    // CORS middleware
    router.Use(func(c *gin.Context) {
        c.Writer.Header().Set("Access-Control-Allow-Origin", "*")
        c.Writer.Header().Set("Access-Control-Allow-Credentials", "true")
        c.Writer.Header().Set("Access-Control-Allow-Headers", "Content-Type, Content-Length, Accept-Encoding, X-CSRF-Token, Authorization, accept, origin, Cache-Control, X-Requested-With")
        c.Writer.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS, GET, PUT, DELETE")

        if c.Request.Method == "OPTIONS" {
            c.AbortWithStatus(204)
            return
        }

        c.Next()
    })
}
```

### Q6: 环境变量设置后没有生效？

**检查清单：**

1. 确认环境变量名称拼写正确（区分大小写）
2. 确认没有多余的空格
3. 确认 `DB_PASSWORD` 已经设置（这是必需的）
4. 重新部署服务以应用新的环境变量
5. 查看启动日志，检查是否有变量读取的输出

### Q7: 二维码生成失败？

检查以下配置：

1. `BASE_URL` 是否设置为正确的部署 URL
2. `WX_APP_ID` 是否正确
3. `WX_APP_PATH` 是否是小程序中的有效路径
4. 查看应用日志，查看具体的错误信息

---

## 注意事项

### 安全建议

1. **不要在代码中硬编码敏感信息**
   - 使用环境变量存储数据库密码
   - 不要提交 `.env` 文件到 Git

2. **限制 API 访问**
   - 考虑添加 API 认证
   - 限制请求频率
   - 验证和管理用户输入

3. **保护数据库**
   - 使用强密码
   - 配置防火墙规则
   - 定期备份
   - 不要暴露数据库到公网（使用 Render 的内部网络）

4. **管理默认密码**
   - 部署后立即修改 `DEFAULT_ADMIN_PASSWORD`
   - 或删除默认管理员账号
   - 定期更新密码

### 性能优化

1. **减少请求延迟**
   - 启用数据库连接池
   - 使用 CDN 分发静态资源
   - 考虑添加缓存层（Redis）

2. **监控资源使用**
   - 关注免费额度限制
   - 设置告警通知
   - 监控应用性能指标

3. **日志管理**
   - 控制日志输出量
   - 定期清理旧日志
   - 使用结构化日志

### 成本控制

1. **了解免费额度**
   - Render: 750 小时/月，90 天试用
   - Railway: $5 免费额度
   - Zeabur: 有限免费额度

2. **避免超额**
   - 监控使用情况
   - 及时升级或降级服务
   - 删除不用的资源

3. **清理不用的资源**
   - 删除测试服务
   - 清理旧数据
   - 定期审查部署的应用

### 环境变量管理最佳实践

1. **本地开发**：
   - 使用 `.env` 文件
   - 将 `.env` 添加到 `.gitignore`
   - 提供 `.env.example` 作为模板

2. **云端部署**：
   - 使用平台的环境变量配置界面
   - 不要在代码中硬编码
   - 使用自动生成的密码（如 `generateValue: true`）

3. **版本控制**：
   - 提交 `.env.example` 到 Git
   - 绝不要提交包含真实密码的 `.env` 文件
   - 使用密钥管理工具（如 AWS Secrets Manager、HashiCorp Vault）

---

## 下一步

部署完成后，你可以：

1. ✅ **测试所有 API 端点**
   - 确保功能正常
   - 验证数据返回
   - 检查错误处理

2. ✅ **配置小程序**
   - 更新 API 地址
   - 测试小程序功能
   - 验证二维码生成

3. ✅ **添加监控**
   - 设置健康检查
   - 配置错误告警
   - 监控性能指标

4. ✅ **准备生产环境**
   - 购买域名
   - 配置 HTTPS（Render 自动提供）
   - 设置 CDN
   - 备份数据库

5. ✅ **优化配置**
   - 根据实际情况调整环境变量
   - 优化数据库查询
   - 添加缓存

---

## 环境变量快速参考表

| 类别 | 变量名 | 本地默认 | 生产环境推荐 | 必需 |
|------|--------|---------|-------------|------|
| **应用** | `GIN_MODE` | `debug` | `release` | 否 |
| | `SERVER_PORT` | `8082` | `8080` | 否 |
| **数据库** | `DB_HOST` | `localhost` | 从平台获取 | 否 |
| | `DB_PORT` | `5432` | `5432` | 否 |
| | `DB_USER` | `postgres` | 从平台获取 | 否 |
| | `DB_PASSWORD` | - | 从平台获取 | **是** |
| | `DB_NAME` | `tourism_recommender` | `tourism_recommender` | 否 |
| | `DB_SSLMODE` | `disable` | `require` | 否 |
| **管理员** | `DEFAULT_ADMIN_USERNAME` | `admin` | `admin` | 否 |
| | `DEFAULT_ADMIN_PASSWORD` | `admin123456` | 自定义强密码 | 否 |
| | `DEFAULT_ADMIN_EMAIL` | `admin@tourism.com` | 自定义邮箱 | 否 |
| **二维码** | `BASE_URL` | `http://localhost:8082` | 实际部署URL | 否 |
| | `WX_APP_ID` | 从小程序获取 | 从小程序获取 | 否 |
| | `WX_APP_PATH` | `pages/recommendor/detail` | 小程序页面路径 | 否 |

---

## 获取帮助

如果遇到问题：

1. 查看 Render 文档：https://render.com/docs
2. 查看项目 README
3. 检查 GitHub Issues
4. 联系技术支持
5. 查看应用日志获取详细错误信息

---

## 相关文件

- `deploy/render.yaml` - Render 自动部署配置
- `deploy/Dockerfile` - Docker 容器化配置
- `deploy/.env.example` - 环境变量示例文件
- `backend/.env.example` - 本地开发环境变量示例
- `backend/config/database.go` - 数据库配置代码

---

**祝你部署顺利！** 🚀