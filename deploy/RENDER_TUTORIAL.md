# Render.com 详细部署教程 🚀

本教程将手把手教你如何在 Render.com 上部署乡村旅游推荐系统，包括如何获取数据库密码和配置所有环境变量。

## 📋 目录

- [方法一：自动部署（使用 render.yaml）](#方法一自动部署使用-renderyaml)
- [方法二：手动部署（推荐，更可控）](#方法二手动部署推荐更可控)
- [如何获取数据库密码](#如何获取数据库密码)
- [完整环境变量配置](#完整环境变量配置)
- [测试部署](#测试部署)
- [常见问题](#常见问题)

---

## 方法一：自动部署（使用 render.yaml）

⚠️ **注意**：`render.yaml` 主要用于 Render CLI 或 GitHub Actions 自动化部署。如果你是第一次使用 Render，**推荐使用方法二（手动部署）**，更直观且更容易理解。

### 前提条件

1. 你的 GitHub 仓库中已经包含 `render.yaml` 文件
2. `render.yaml` 文件应该在仓库的**根目录**（不是 `deploy/` 子目录）

### 使用 Render CLI 自动部署（高级用户）

如果你熟悉命令行，可以使用 Render CLI：

```bash
# 安装 Render CLI
npm install -g @renderinc/cli

# 登录 Render
render login

# 从 render.yaml 创建所有资源
render blueprints submit
```

### 使用 GitHub Actions 自动部署

如果你想要每次 push 到 GitHub 时自动部署：

1. 在 Render 控制台连接你的 GitHub 仓库
2. Render 会自动检测 `render.yaml`
3. 点击 "Apply render.yaml" 开始部署

---

## 方法二：手动部署（推荐，更可控）

这是最常用且最可靠的方法，适合所有用户。

## 步骤 1：注册 Render 账号

1. 访问 [https://render.com](https://render.com)
2. 点击右上角的 **"Get Started"**
3. 选择使用 **GitHub** 账号登录
4. 授权 Render 访问你的 GitHub 仓库

## 步骤 2：创建 PostgreSQL 数据库

### 2.1 开始创建数据库

1. 登录后，点击左上角的 **"New +"** 按钮
2. 在弹出的菜单中选择 **"PostgreSQL"**

### 2.2 配置数据库

填写以下信息：

| 字段 | 值 | 说明 |
|------|-----|------|
| **Name** | `tourism-recommender-db` | 数据库实例名称 |
| **Database** | `tourism_recommender` | 数据库名称 |
| **User** | `tourism_user` | 数据库用户名 |
| **Region** | **Singapore** | 选择新加坡，国内访问更快 |
| **PostgreSQL Version** | 选择默认值（如 14） | 数据库版本 |
| **Plan** | **Free** | 免费计划 |

### 2.3 创建数据库

点击底部的 **"Create Database"** 按钮

### 2.4 等待数据库创建

- 数据库创建需要 2-3 分钟
- 你会看到进度条和日志
- 等待状态变为 **"Available"**

---

## 步骤 3：获取数据库连接信息（重要！）

### 3.1 打开数据库详情

1. 在 Dashboard 中找到刚创建的数据库
2. 点击数据库名称进入详情页

### 3.2 获取 Internal Database URL（推荐）

1. 在数据库详情页，找到 **"Connect"** 部分
2. 你会看到一个名为 **"Internal Database URL"** 的字段
3. 点击旁边的 **"Copy"** 按钮复制这个 URL

**格式示例**：
```
postgresql://tourism_user:密码@d-xxx.singapore-postgres.render.com/tourism_recommender
```

**这个 URL 包含了所有需要的信息**，包括密码！

### 3.3 分别获取各个连接信息（如果需要）

如果你需要单独配置各个环境变量，可以这样获取：

#### 3.3.1 获取 Host
- 在 **"Connect"** 部分找到 **"Host"**
- 示例：`d-xxx.singapore-postgres.render.com`

#### 3.3.2 获取 Port
- 在 **"Connect"** 部分找到 **"Private Port"**
- 通常是 `5432`

#### 3.3.3 获取 User
- 在 **"Connect"** 部分找到 **"User"**
- 你在创建时设置的用户名，如 `tourism_user`

#### 3.3.4 获取 Database Name
- 在 **"Connect"** 部分找到 **"Database"**
- 你在创建时设置的数据库名，如 `tourism_recommender`

#### 3.3.5 获取密码（重点！）

**方法 1：从 Internal Database URL 中提取**

从你复制的 URL 中提取密码：
```
postgresql://tourism_user:密码@d-xxx.singapore-postgres.render.com/tourism_recommender
                           ^^^^
                          密码在这里
```

**方法 2：使用 psql 连接测试**

如果你本地安装了 PostgreSQL，可以连接测试：
```bash
psql -h d-xxx.singapore-postgres.render.com \
     -U tourism_user \
     -d tourism_recommender \
     -p 5432
```
输入密码时会要求输入，这就是你的数据库密码。

**方法 3：查看 Render 环境变量**

1. 在数据库详情页，点击左侧的 **"Environment"**
2. 你可以看到自动生成的环境变量
3. 密码已经包含在 `DATABASE_URL` 中

---

## 步骤 4：创建 Web 服务

### 4.1 开始创建 Web 服务

1. 点击左上角的 **"New +"** 按钮
2. 选择 **"Web Service"**

### 4.2 连接 GitHub 仓库

1. 在 **"Connect a repository"** 部分选择 **"Existing repository"**
2. 找到你的 GitHub 仓库（`tourism_recommender`）
3. 点击 **"Connect"**

### 4.3 配置 Web 服务

填写以下信息：

#### General 部分

| 字段 | 值 | 说明 |
|------|-----|------|
| **Name** | `tourism-recommender-api` | 服务名称 |
| **Region** | **Singapore** | 必须与数据库相同区域 |
| **Branch** | `main` | 选择你的主分支 |
| **Runtime** | **Go** | 编程语言 |

#### Build & Deploy 部分

| 字段 | 值 | 说明 |
|------|-----|------|
| **Build Command** | `go build -o main main.go` | 编译命令 |
| **Start Command** | `./main` | 启动命令 |
| **Instance Type** | **Free** | 免费计划 |

### 4.4 配置环境变量（关键步骤！）

滚动到 **"Advanced"** 部分，点击 **"Add Environment Variable"**

#### 4.4.1 应用配置

添加以下环境变量：

| Key | Value | 说明 |
|-----|-------|------|
| `GIN_MODE` | `release` | 生产环境模式 |
| `SERVER_PORT` | `8080` | 服务端口 |

#### 4.4.2 数据库配置

**重要**：这里有**两种配置方法**，选择一种即可。

##### 方法 A：使用数据库环境变量（推荐）

Render 提供了自动从数据库实例获取环境变量的功能：

1. 点击 **"Add Environment Variable"**
2. 在 **Key** 输入框中，不要输入任何内容
3. 点击输入框右侧的 **"Link Database"** 按钮
4. 选择你的数据库实例（`tourism-recommender-db`）
5. 这会自动添加以下环境变量：
   - `DATABASE_URL` - 完整的数据库连接 URL（包含密码）
   - `DB_HOST` - 数据库主机
   - `DB_PORT` - 数据库端口
   - `DB_USER` - 数据库用户
   - `DB_PASSWORD` - 数据库密码
   - `DB_NAME` - 数据库名称

6. 添加额外的数据库配置：
   
| Key | Value | 说明 |
|-----|-------|------|
| `DB_SSLMODE` | `require` | 使用 SSL 连接 |

**⚠️ 重要**：使用方法 A 时，`DB_PASSWORD` 会自动生成并填充，你不需要手动输入！

##### 方法 B：手动输入数据库配置（不推荐）

如果你选择手动输入，使用之前获取的信息：

| Key | Value | 说明 |
|-----|-------|------|
| `DB_HOST` | `d-xxx.singapore-postgres.render.com` | 从步骤 3 获取 |
| `DB_PORT` | `5432` | 数据库端口 |
| `DB_USER` | `tourism_user` | 数据库用户名 |
| `DB_PASSWORD` | `your_password_here` | 从 Internal Database URL 提取 |
| `DB_NAME` | `tourism_recommender` | 数据库名称 |
| `DB_SSLMODE` | `require` | 使用 SSL 连接 |

#### 4.4.3 管理员默认配置

添加以下环境变量（可选，不设置会使用默认值）：

| Key | Value | 说明 |
|-----|-------|------|
| `DEFAULT_ADMIN_USERNAME` | `admin` | 管理员用户名 |
| `DEFAULT_ADMIN_PASSWORD` | `your_secure_password` | 设置一个强密码！ |
| `DEFAULT_ADMIN_EMAIL` | `admin@tourism.com` | 管理员邮箱 |

**⚠️ 安全提示**：请务必修改 `DEFAULT_ADMIN_PASSWORD` 为一个强密码！

#### 4.4.4 二维码配置

添加以下环境变量：

| Key | Value | 说明 |
|-----|-------|------|
| `BASE_URL` | `https://tourism-recommender-api.onrender.com` | 部署后的 URL（创建后更新）|
| `WX_APP_ID` | `wxa1802e324f2f4712` | 微信小程序 AppID |
| `WX_APP_PATH` | `pages/recommendor/detail` | 小程序页面路径 |

**注意**：`BASE_URL` 需要在服务创建后更新为实际的 URL。

### 4.5 创建 Web 服务

点击底部的 **"Create Web Service"** 按钮

---

## 步骤 5：等待部署完成

### 5.1 查看部署进度

1. 创建后会自动跳转到部署页面
2. 你可以看到实时日志
3. 等待状态变为 **"Live"**（约 3-5 分钟）

### 5.2 查看部署日志

如果部署失败，点击 **"Logs"** 标签查看详细错误信息：

- **Build Log** - 构建过程日志
- **Service Log** - 运行时日志

### 5.3 获取服务 URL

部署成功后，你会看到类似这样的 URL：
```
https://tourism-recommender-api.onrender.com
```

### 5.4 更新 BASE_URL

回到 Web 服务的环境变量配置：
1. 点击 **"Environment"** 标签
2. 找到 `BASE_URL` 变量
3. 将值更新为实际的 URL
4. 点击 **"Save Changes"**
5. 服务会自动重新部署

---

## 测试部署

### 1. 健康检查

在浏览器或终端中访问：

```bash
curl https://tourism-recommender-api.onrender.com/api/v1/health
```

预期响应：
```json
{
  "status": "ok",
  "message": "Tourism Recommender API is running"
}
```

### 2. 测试推荐官接口

```bash
# 获取推荐官列表
curl https://tourism-recommender-api.onrender.com/api/recommendors

# 获取推荐官详情（如果存在）
curl https://tourism-recommender-api.onrender.com/api/recommendors/1
```

### 3. 更新小程序配置

打开 `wxapp/app.js`，修改 API 地址：

```javascript
App({
  globalData: {
    // 替换为你的 Render URL
    apiBaseUrl: "https://tourism-recommender-api.onrender.com/api",
    // ...
  },
});
```

---

## 常见问题

### Q1: render.yaml 没有自动加载怎么办？

**原因**：`render.yaml` 只在使用 Render CLI 或 GitHub Actions 时才会被自动加载。

**解决方案**：
- 如果你是手动在控制台创建服务，`render.yaml` 不会被自动识别
- 你需要手动按照上面的步骤配置服务
- `render.yaml` 主要用于自动化部署流水线

### Q2: 找不到数据库密码？

**解决方案**：
1. 在数据库详情页，找到 **"Internal Database URL"**
2. 复制这个 URL，格式如：`postgresql://user:password@host/database`
3. 密码就在 `user:` 和 `@` 之间
4. 或者使用方法 A（Link Database），让 Render 自动配置

### Q3: 部署失败，提示数据库连接错误？

**检查清单**：
1. 数据库和 Web 服务是否在同一区域？
2. `DB_SSLMODE` 是否设置为 `require`？
3. 数据库状态是否为 "Available"？
4. 数据库密码是否正确？
5. 查看部署日志中的详细错误信息

### Q4: 部署成功但无法访问 API？

**检查项**：
1. 等待 30 秒，服务可能还在启动中
2. 检查服务状态是否为 "Live"
3. 确认使用正确的 API 路径：`/api/v1/health`
4. 查看服务日志，检查是否有错误
5. 检查防火墙或网络设置

### Q5: 数据库密码在哪里重置？

**解决方案**：
1. 进入数据库详情页
2. 点击 **"Settings"** 标签
3. 滚动到 **"Reset Password"** 部分
4. 点击 **"Reset Password"** 按钮
5. 新密码会显示出来（仅此一次显示，请立即保存）

### Q6: 免费服务会休眠吗？

**是的**：
- Render 免费服务会在 15 分钟无请求后休眠
- 首次请求唤醒约 30 秒
- 如果需要保持活跃，可以：
  - 使用 cron-job.org 定时 ping
  - 升级到付费计划（$7/月起）
  - 或者接受休眠，这适合测试和演示

### Q7: 如何查看应用日志？

**方法**：
1. 进入 Web 服务详情页
2. 点击 **"Logs"** 标签
3. 你可以看到实时日志
4. 可以使用搜索和过滤功能

### Q8: 环境变量修改后如何生效？

**方法**：
1. 进入 Web 服务详情页
2. 点击 **"Environment"** 标签
3. 修改环境变量
4. 点击 **"Save Changes"**
5. 服务会自动重新部署
6. 等待部署完成（3-5 分钟）

---

## 完整环境变量清单

### 必需变量

| Key | Value | 说明 |
|-----|-------|------|
| `DB_PASSWORD` | 自动生成或手动输入 | 数据库密码（必需）|

### 应用配置

| Key | Value | 说明 |
|-----|-------|------|
| `GIN_MODE` | `release` | 应用运行模式 |
| `SERVER_PORT` | `8080` | 服务端口 |

### 数据库配置

如果使用 **Link Database**（推荐）：
- Render 会自动生成所有数据库环境变量
- 你只需要添加 `DB_SSLMODE=require`

如果**手动输入**：
| Key | Value | 说明 |
|-----|-------|------|
| `DB_HOST` | 从数据库页面复制 | 数据库主机 |
| `DB_PORT` | `5432` | 数据库端口 |
| `DB_USER` | 从数据库页面复制 | 数据库用户 |
| `DB_PASSWORD` | 从 Internal Database URL 提取 | 数据库密码 |
| `DB_NAME` | `tourism_recommender` | 数据库名称 |
| `DB_SSLMODE` | `require` | SSL 模式 |

### 管理员配置

| Key | Value | 说明 |
|-----|-------|------|
| `DEFAULT_ADMIN_USERNAME` | `admin` | 管理员用户名 |
| `DEFAULT_ADMIN_PASSWORD` | 自定义强密码 | 管理员密码 |
| `DEFAULT_ADMIN_EMAIL` | `admin@tourism.com` | 管理员邮箱 |

### 二维码配置

| Key | Value | 说明 |
|-----|-------|------|
| `BASE_URL` | `https://your-app.onrender.com` | 应用基础 URL |
| `WX_APP_ID` | `wxa1802e324f2f4712` | 微信小程序 AppID |
| `WX_APP_PATH` | `pages/recommendor/detail` | 小程序页面路径 |

---

## 部署成功后的后续步骤

### 1. 验证数据库连接

使用数据库管理工具（如 DBeaver、pgAdmin）连接数据库，确认连接成功。

### 2. 创建测试数据

如果数据库是空的，你可以：
- 通过 API 创建数据
- 运行 seed 脚本
- 手动导入 SQL 文件

### 3. 配置小程序

更新小程序的 API 地址，测试所有功能。

### 4. 设置监控

- 启用健康检查
- 配置错误告警
- 定期查看日志

### 5. 备份数据

- 如果是生产环境，定期备份数据库
- 了解如何恢复数据

---

## 需要更多帮助？

- **Render 官方文档**：https://render.com/docs
- **部署检查清单**：查看 `deploy/DEPLOYMENT_CHECKLIST.md`
- **快速开始指南**：查看 `deploy/QUICK_START.md`
- **完整部署指南**：查看 `deploy/DEPLOYMENT_GUIDE.md`

---

**祝你部署顺利！** 🎉