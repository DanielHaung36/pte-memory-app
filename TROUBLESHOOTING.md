# 🔧 故障排除指南

## 常见问题及解决方案

### 1. 403 Forbidden 错误

**问题**: 前端无法连接后端API，出现403错误
**原因**: CORS配置问题，后端不允许前端域名访问

**解决方案**:
1. 检查后端 `.env` 文件中的 `CORS_ORIGIN` 配置
2. 确保包含前端运行的端口（3000, 3001, 3002等）
3. 重启后端服务

```env
# backend/.env
CORS_ORIGIN=http://localhost:3000,http://localhost:3001,http://localhost:3002
```

### 2. 数据库连接错误

**问题**: 后端启动时数据库连接失败
**错误信息**: `Failed to connect to database`

**解决方案**:
1. 确认PostgreSQL服务运行
   ```bash
   # Windows
   net start postgresql-x64-13
   
   # 或检查服务管理器中的PostgreSQL服务
   ```

2. 检查数据库是否存在
   ```bash
   psql -U postgres -c "SELECT datname FROM pg_database WHERE datname='pte_memory_db';"
   ```

3. 创建数据库（如果不存在）
   ```bash
   createdb -U postgres pte_memory_db
   ```

4. 验证连接信息 `backend/.env`
   ```env
   DB_HOST=localhost
   DB_PORT=5432
   DB_USER=postgres
   DB_PASSWORD=你的密码
   DB_NAME=pte_memory_db
   ```

### 3. 前端依赖安装失败

**问题**: `npm install` 出现 ERESOLVE 错误
**解决方案**:
```bash
# 使用legacy-peer-deps
npm install --legacy-peer-deps

# 或者清理缓存后重试
npm cache clean --force
rm -rf node_modules package-lock.json
npm install --legacy-peer-deps
```

### 4. Go 编译错误

**问题**: `go run main.go` 编译失败
**解决方案**:
```bash
# 更新依赖
go mod tidy
go mod download

# 清理模块缓存
go clean -modcache
go mod tidy
```

### 5. 端口被占用

**问题**: 端口3000或8080被占用
**解决方案**:

**Windows**:
```batch
# 查看端口占用
netstat -ano | findstr :8080
netstat -ano | findstr :3000

# 终止进程 (替换PID)
taskkill /PID <进程ID> /F
```

**前端会自动寻找可用端口**，如3001、3002等

### 6. API请求超时

**问题**: 前端请求后端超时
**检查步骤**:
1. 确认后端服务运行 - 访问 http://localhost:8080/health
2. 检查防火墙设置
3. 验证axios配置正确

### 7. 数据库迁移失败

**问题**: GORM自动迁移失败
**解决方案**:
1. 手动运行数据库初始化脚本
   ```bash
   psql -d pte_memory_db -f setup-database.sql
   ```

2. 检查数据库用户权限
   ```sql
   GRANT ALL PRIVILEGES ON DATABASE pte_memory_db TO postgres;
   ```

### 8. JWT Token 错误

**问题**: 认证失败，token无效
**解决方案**:
1. 检查 `JWT_SECRET` 配置
2. 清理浏览器Cookie
3. 重新登录获取新token

## 📋 系统检查清单

启动系统前请确认：

### 后端检查
- [ ] PostgreSQL服务运行
- [ ] 数据库 `pte_memory_db` 存在
- [ ] `.env` 文件配置正确
- [ ] Go版本 1.21+
- [ ] 8080端口可用

### 前端检查  
- [ ] Node.js版本 18+
- [ ] 依赖安装成功
- [ ] 3000/3001/3002端口可用
- [ ] 后端API连接正常

## 🧪 快速测试

### 1. 后端API测试
```bash
# 健康检查
curl http://localhost:8080/health

# CORS测试
curl -X OPTIONS http://localhost:8080/api/auth/login -H "Origin: http://localhost:3002"
```

### 2. 前端页面测试
- 访问首页: http://localhost:3000 (或其他端口)
- 测试注册页面: http://localhost:3000/auth/register
- 查看控制台错误信息

## 🔍 日志分析

### 后端日志
- GORM SQL查询日志
- HTTP请求日志  
- 错误堆栈跟踪

### 前端日志
- 浏览器开发者工具 Console
- Network 面板查看API请求
- Application 面板查看localStorage/cookies

## 🆘 获取帮助

如果以上解决方案都无法解决问题：

1. **收集错误信息**:
   - 完整的错误日志
   - 系统环境信息
   - 复现步骤

2. **检查配置文件**:
   - `backend/.env`
   - `frontend/package.json`
   - 数据库连接信息

3. **提供系统信息**:
   - 操作系统版本
   - Node.js、Go、PostgreSQL版本
   - 错误发生的具体时间和场景

---
*记住：大多数问题都是配置或环境相关的，仔细检查每一步配置通常能解决90%的问题！* 🎯