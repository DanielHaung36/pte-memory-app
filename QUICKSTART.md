# PTE Memory App - 快速启动指南

## 🚀 快速启动（推荐）

### 选项1: 使用Docker（最简单）

1. **启动数据库服务**：
```bash
docker-compose up -d
```

2. **启动后端**：
```bash
cd backend
go mod tidy
go run main.go
```

3. **启动前端**：
```bash
cd frontend
npm install --legacy-peer-deps
npm run dev
```

### 选项2: 使用SQLite（无需PostgreSQL）

1. **启动后端（自动使用SQLite）**：
```bash
cd backend
run.bat  # Windows
# 或
CGO_ENABLED=1 go run main.go  # Linux/Mac
```

2. **启动前端**：
```bash
cd frontend
npm install --legacy-peer-deps
npm run dev
```

## 📋 系统要求

- **Go**: 1.21+
- **Node.js**: 18+
- **PostgreSQL**: 15+ (可选，有SQLite回退)
- **Docker**: 20+ (可选)

## 🔧 详细设置

### 后端设置

1. **安装依赖**：
```bash
cd backend
go mod tidy
```

2. **环境配置**：
检查并修改 `.env` 文件中的配置

3. **数据库设置**（可选）：
   - 使用Docker：`docker-compose up -d`
   - 手动安装：参考 `DATABASE_SETUP.md`
   - 使用SQLite：无需额外设置

4. **启动服务**：
```bash
# Windows
run.bat

# Linux/Mac  
CGO_ENABLED=1 go run main.go
```

### 前端设置

1. **安装依赖**：
```bash
cd frontend
npm install --legacy-peer-deps
```

2. **开发模式**：
```bash
npm run dev
```

3. **生产构建**：
```bash
npm run build
npm start
```

## 🌟 新增功能特性

### 后端增强功能

- ✅ **智能复习算法**：基于SM-2算法的个性化复习计划
- ✅ **高级数据分析**：学习模式识别、趋势分析、性能预测
- ✅ **实时通信**：WebSocket支持，实时进度同步
- ✅ **错题管理**：完整的错题分类、分析、复习系统
- ✅ **成就系统**：多维度成就跟踪和奖励机制

### 前端增强功能

- ✅ **增强分析仪表板**：丰富的数据可视化和洞察
- ✅ **实时数据同步**：即时反馈和状态更新
- ✅ **响应式设计**：优化的移动端和桌面端体验
- ✅ **交互式图表**：使用Recharts的专业数据展示

## 🔗 API端点

### 核心API
- `GET /api/questions` - 获取题目列表
- `POST /api/questions` - 创建新题目  
- `GET /api/questions/due` - 获取待复习题目
- `POST /api/questions/review` - 提交复习结果

### 增强分析API
- `GET /api/analytics/dashboard` - 仪表板统计数据
- `GET /api/analytics/trends` - 学习趋势分析
- `GET /api/analytics/insights` - 个性化洞察
- `GET /api/analytics/achievements` - 成就进度

### 错题管理API
- `GET /api/wrong-questions` - 获取错题列表
- `POST /api/wrong-questions` - 添加错题记录
- `GET /api/wrong-questions/stats` - 错题统计

## 🎯 使用流程

1. **注册/登录**：创建账户或登录现有账户
2. **添加题目**：通过 `/questions/simple` 页面添加学习材料
3. **开始复习**：系统会根据遗忘曲线安排复习计划
4. **查看分析**：在仪表板查看学习进度和表现分析
5. **错题管理**：系统自动记录错题，提供针对性复习

## 🐛 故障排除

### 常见问题

1. **数据库连接失败**：
   - 检查PostgreSQL是否运行
   - 使用SQLite模式：设置 `CGO_ENABLED=1`

2. **前端依赖冲突**：
   - 使用 `npm install --legacy-peer-deps`
   - 清除缓存：`npm cache clean --force`

3. **后端编译错误**：
   - 确保Go版本1.21+
   - 启用CGO：`set CGO_ENABLED=1`

### 性能优化

- **数据库**：使用PostgreSQL获得更好性能
- **缓存**：启用Redis缓存（docker-compose包含）
- **前端**：使用生产构建 `npm run build`

## 📧 支持

- **问题报告**：在GitHub Issues中提交
- **功能请求**：通过GitHub Discussions讨论
- **文档**：查看 `CLAUDE.md` 了解详细架构

## 🎉 开始学习

访问 `http://localhost:3000` 开始你的PTE学习之旅！