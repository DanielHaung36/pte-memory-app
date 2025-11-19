# 数据库设置指南

## 方法一：使用Docker Compose（推荐）

1. 确保已安装Docker和Docker Compose
2. 在项目根目录运行：
```bash
docker-compose up -d
```

这将启动PostgreSQL和Redis服务。

## 方法二：本地PostgreSQL安装

### 1. 安装PostgreSQL
- 下载并安装PostgreSQL 15+
- 设置密码为 `superadminpass`（或修改.env文件中的密码）

### 2. 创建数据库
运行提供的批处理脚本：
```bash
setup-db.bat
```

或手动执行：
```sql
-- 连接到PostgreSQL
psql -U postgres -h localhost

-- 创建数据库
CREATE DATABASE pte_memory_db;

-- 连接到新数据库
\c pte_memory_db;

-- 启用必要的扩展
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "intarray";
```

### 3. 验证连接
```bash
psql -U postgres -h localhost -d pte_memory_db -c "SELECT version();"
```

## 方法三：修改为SQLite（开发环境）

如果不想使用PostgreSQL，可以修改后端代码使用SQLite：

1. 在 `go.mod` 中添加SQLite驱动：
```go
github.com/glebarez/sqlite v1.9.0
```

2. 修改 `database/database.go` 中的连接逻辑
3. 设置环境变量 `USE_SQLITE=true`

## 环境变量配置

确保 `.env` 文件包含正确的数据库配置：

```env
PORT=8080
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=superadminpass
DB_NAME=pte_memory_db
JWT_SECRET=ptememoryjwt
CORS_ORIGIN=http://localhost:3000,http://localhost:3001,http://localhost:3002
GIN_MODE=debug
```

## 启动服务

### 后端
```bash
cd backend
go mod tidy
go run main.go
```

### 前端
```bash
cd frontend
npm install --legacy-peer-deps
npm run dev
```

## 数据库迁移

GORM会自动处理数据库迁移，首次运行时会创建所有必要的表。

## 故障排除

### 连接失败
- 检查PostgreSQL服务是否运行
- 验证端口5432是否可访问
- 确认用户名和密码正确

### 权限问题
```sql
-- 授予用户权限
GRANT ALL PRIVILEGES ON DATABASE pte_memory_db TO postgres;
```

### 清理数据
```sql
-- 删除所有表（小心使用）
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;
```