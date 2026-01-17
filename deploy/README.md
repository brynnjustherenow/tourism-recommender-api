# 后端部署配置

本目录包含乡村旅游推荐系统后端服务的部署配置文件和文档。

## 📁 目录结构

```
deploy/
├── README.md           # 部署说明文档（本文件）
├── DEPLOYMENT_GUIDE.md # 详细部署指南
├── render.yaml        # Render.com 自动部署配置
├── Dockerfile         # Docker 容器化配置
└── .env.example       # 环境变量示例
```

## 🚀 快速开始

### 1. 推荐方案：Render.com（免费）

最简单的方式是使用 Render.com，它提供免费的 Web 服务和 PostgreSQL 数据库。

**步骤：**

1. 创建 Render 账号（使用 GitHub 登录）
2. 将代码推送到 GitHub
3. 在 Render 中创建 PostgreSQL 数据库
4. 在 Render 中创建 Web 服务（参考 `render.yaml`）
5. 等待部署完成

详细步骤请查看 [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)

### 2. 使用 Docker 部署

如果你想使用 Docker 容器化部署：

```bash
# 构建镜像
docker build -t tourism-recommender-api -f Dockerfile ../backend

# 运行容器
docker run -p 8080:8080 \
  -e DB_HOST=your_db_host \
  -e DB_PORT=5432 \
  -e DB_USER=your_db_user \
  -e DB_PASSWORD=your_db_password \
  -e DB_NAME=tourism_recommender \
  tourism-recommender-api
```

## 📋 部署平台对比

| 平台 | 免费额度 | 数据库 | 难度 | 推荐度 |
|------|---------|--------|------|--------|
| Render.com | ✅ 免费 | ✅ PostgreSQL | ⭐ | ⭐⭐⭐⭐⭐ |
| Railway.app | $5/月 | ✅ PostgreSQL | ⭐ | ⭐⭐⭐⭐ |
| Zeabur | 有限免费 | ⚠️ 需单独配置 | ⭐⭐ | ⭐⭐⭐⭐ |
| Fly.io | 有限免费 | ⚠️ 需单独配置 | ⭐⭐⭐ | ⭐⭐⭐ |

## 🔧 配置说明

### 环境变量

部署时需要配置以下环境变量：

```bash
# 应用配置
GIN_MODE=release              # 运行模式：release 或 debug
SERVER_PORT=8080              # 服务端口

# 数据库配置
DB_HOST=your_db_host          # 数据库主机地址
DB_PORT=5432                  # 数据库端口
DB_USER=your_db_user          # 数据库用户名
DB_PASSWORD=your_db_password  # 数据库密码（必填）
DB_NAME=tourism_recommender   # 数据库名称
DB_SSLMODE=require            # SSL 模式
```

### 数据库初始化

应用启动时会自动运行数据库迁移，创建所需的表结构。如需导入初始数据：

1. 使用数据库管理工具连接到部署的数据库
2. 导入本地数据库的 SQL 备份
3. 或通过 API 创建初始数据

## 📖 详细文档

- **[DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)** - 完整的部署指南，包含：
  - 各平台的详细部署步骤
  - 常见问题解答
  - 故障排查指南
  - 安全和性能建议

## ⚠️ 注意事项

1. **不要提交敏感信息**：`.env` 文件不应提交到版本控制
2. **数据库安全**：使用强密码，配置 SSL 连接
3. **监控资源**：免费平台有资源限制，注意监控使用情况
4. **定期备份**：定期备份数据库数据

## 🆘 获取帮助

如果遇到问题，请：

1. 查看 [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) 中的常见问题部分
2. 检查平台文档
3. 查看部署日志

## 📝 后续步骤

部署完成后：

1. ✅ 测试 API 端点
2. ✅ 更新小程序配置（修改 API 地址）
3. ✅ 配置域名和 HTTPS（可选）
4. ✅ 设置监控和告警（可选）

---

**祝你部署顺利！** 🎉