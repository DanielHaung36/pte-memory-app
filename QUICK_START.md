# 🚀 快速启动指南

## ⚠️ 遇到403错误？

如果前端出现 `403 Forbidden` 错误，这是CORS配置问题：

1. **检查前端运行端口** - 前端可能运行在3001或3002端口
2. **更新后端CORS配置** - 编辑 `backend/.env` 文件：
   ```env
   CORS_ORIGIN=http://localhost:3000,http://localhost:3001,http://localhost:3002
   ```
3. **重启后端服务** - 重新运行 `start-backend.bat`

## 环境准备

### 1. 必需软件
- Node.js 18+ (推荐 LTS 版本)
- Go 1.21+
- PostgreSQL 12+

### 2. 数据库设置
```bash
# 创建数据库
createdb pte_memory_db

# 运行数据库初始化脚本 (可选)
psql -d pte_memory_db -f setup-database.sql
```

### 3. 环境变量配置
检查 `backend/.env` 文件中的数据库连接配置：
```env
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=你的密码
DB_NAME=pte_memory_db
```

## 快速启动 (Windows)

### 方法一: 使用批处理脚本 (推荐)
```batch
# 启动后端 (新开一个终端)
start-backend.bat

# 启动前端 (新开另一个终端)  
start-frontend.bat
```

### 方法二: 手动启动
```bash
# 启动后端 (终端1)
cd backend
go mod tidy
go run main.go

# 启动前端 (终端2)
cd frontend  
npm install --legacy-peer-deps
npm run dev
```

## 访问应用

- **前端**: http://localhost:3000
- **后端API**: http://localhost:8080
- **健康检查**: http://localhost:8080/health

## 功能测试

### 1. 用户注册/登录
1. 访问 http://localhost:3000
2. 点击"开始免费使用"注册账户
3. 填写用户名、邮箱和密码
4. 自动跳转到仪表板

### 2. 添加错题
1. 在仪表板点击"添加错题"
2. 选择题目类型 (听力/口语/阅读/写作)
3. 填写题目内容和正确答案
4. 提交保存

### 3. 开始复习
1. 在仪表板查看"待复习题目"
2. 点击"复习"开始答题
3. 体验连击系统和经验奖励

### 4. 音频功能测试
- 在题目中添加音频URL或使用TTS功能
- 测试播放控制和音量调节

### 5. 小游戏体验
- 访问游戏页面体验单词配对游戏
- 测试计时和得分系统

## 故障排除

### 前端依赖问题
```bash
# 如果遇到依赖冲突，使用：
npm install --legacy-peer-deps --force

# 清理缓存重试：
npm cache clean --force
rm -rf node_modules package-lock.json
npm install --legacy-peer-deps
```

### 后端编译问题
```bash
# 清理模块缓存
go clean -modcache
go mod tidy
go mod download
```

### 数据库连接问题
1. 确认PostgreSQL服务运行
2. 检查数据库用户权限
3. 验证.env文件中的连接信息

## API接口文档

### 认证相关
- POST `/api/auth/register` - 用户注册
- POST `/api/auth/login` - 用户登录
- GET `/api/auth/me` - 获取用户信息

### 题目管理
- POST `/api/questions` - 创建题目
- GET `/api/questions` - 获取题目列表
- GET `/api/questions/due` - 获取待复习题目
- PUT `/api/questions/:id` - 更新题目
- DELETE `/api/questions/:id` - 删除题目

### 系统状态
- GET `/health` - 系统健康检查

## 开发建议

1. **数据库管理**: 推荐使用 pgAdmin 或 DBeaver 管理PostgreSQL
2. **API测试**: 使用 Postman 或 Insomnia 测试API接口
3. **日志查看**: 后端日志会显示详细的请求和错误信息
4. **热重载**: 前端支持热重载，后端修改需重启服务

## 生产部署

### Docker 部署 (推荐)
```bash
# 构建和启动所有服务
docker-compose up -d

# 查看日志
docker-compose logs -f
```

### 手动部署
```bash
# 构建前端
cd frontend && npm run build

# 编译后端
cd backend && go build -o pte-memory-app

# 启动服务
./pte-memory-app
```

## 技术支持

- **GitHub Issues**: 报告问题和建议
- **文档**: 查看 README.md 了解详细信息
- **架构说明**: 参考项目根目录的架构文档

---
*Happy Learning! 🎓*