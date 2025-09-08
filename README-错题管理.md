# PTE/雅思错题管理系统

## 🎯 系统概述

基于RTK Query和WebSocket的现代化错题管理系统，专为PTE/雅思考生设计。提供智能复习、实时同步、统计分析等功能。

## ✨ 核心功能

### 📚 错题管理
- **快速添加** - 简化版错题录入，支持四大题型（口语、写作、阅读、听力）
- **智能分类** - 5级难度分级，标签管理，类型筛选
- **答案对比** - 正确答案与用户答案对比分析
- **详细解析** - 支持解析说明和学习要点

### 🧠 智能复习
- **间隔重复** - 基于SM-2算法的艾宾浩斯复习计划
- **准确率跟踪** - 实时统计答题准确率和复习次数
- **复习提醒** - 待复习和逾期题目智能提醒
- **掌握度评估** - 自动评估知识点掌握程度

### 📊 数据统计
- **实时统计** - 总题数、待复习数、已掌握数、平均准确率
- **类型分析** - 各题型分布和掌握情况
- **进度追踪** - 今日/本周/本月复习进度
- **可视化展示** - 直观的图表和进度条

### 🔄 实时同步
- **WebSocket** - 实时同步所有操作和状态变更
- **离线提示** - 连接状态实时显示
- **事件通知** - 题目添加、复习完成等实时通知

## 🛠️ 技术架构

### 前端技术栈
- **Next.js 14** - App Router + TypeScript
- **Redux Toolkit** - 状态管理 + RTK Query
- **WebSocket Client** - 实时通信
- **Framer Motion** - 动画效果
- **Tailwind CSS** - 样式框架
- **React Hot Toast** - 通知提示

### 后端技术栈
- **Go + Gin** - 高性能API服务
- **PostgreSQL** - 关系型数据库
- **GORM** - ORM框架
- **WebSocket Hub** - 实时通信中心
- **JWT认证** - 用户身份验证

## 🚀 快速开始

### 后端启动
```bash
cd backend
go mod tidy
go run main.go
```

### 前端启动
```bash
cd frontend
npm install --legacy-peer-deps
npm run dev
```

### 访问应用
- 前端：http://localhost:3000
- 后端API：http://localhost:8080
- WebSocket：ws://localhost:8080/ws

## 📱 主要页面

### 1. 错题列表页面 (`/questions`)
- 显示所有错题卡片
- 搜索和筛选功能
- 实时统计数据
- 类型、难度、标签过滤

### 2. 快速添加页面 (`/questions/simple`)
- 简化版错题录入
- 四大题型选择
- 难度星级选择
- 标签管理
- 实时保存提示

### 3. 登录页面 (`/auth/login/simple-page`)
- 简洁的登录界面
- Redux状态管理
- 自动跳转功能

## 📊 数据模型

### 错题模型 (Question)
```go
type Question struct {
    ID               string
    UserID           string
    Title            string
    Content          string
    QuestionType     QuestionType // speaking/writing/reading/listening
    CorrectAnswer    string
    UserAnswer       string
    Explanation      string
    DifficultyLevel  int         // 1-5
    Tags             []string
    AudioURL         string
    CreatedAt        time.Time
    ReviewSchedule   *ReviewSchedule
    QuestionStats    *QuestionStats
}
```

### 复习计划模型 (ReviewSchedule)
```go
type ReviewSchedule struct {
    ID                string
    QuestionID        string
    CurrentInterval   int
    EaseFactor        float64
    RepetitionCount   int
    NextReviewDate    time.Time
    IsCompleted       bool
    IsMastered        bool
    Priority          int
}
```

## 🌐 API端点

### 错题管理
- `POST /api/questions` - 创建错题
- `GET /api/questions` - 获取错题列表
- `GET /api/questions/statistics` - 获取统计数据
- `GET /api/questions/search` - 搜索错题
- `POST /api/questions/review` - 复习错题
- `POST /api/questions/batch` - 批量操作

### WebSocket事件
- `question_created` - 错题创建
- `question_reviewed` - 复习完成
- `stats_updated` - 统计更新
- `level_up` - 等级提升

## 🎨 UI特色

### 现代化设计
- 渐变色背景
- 圆角卡片设计
- 流畅的动画过渡
- 响应式布局

### 用户体验
- 实时连接状态显示
- 加载动画和错误处理
- 直观的操作反馈
- 简化的操作流程

## 📈 核心优势

1. **简化流程** - 一步到位的错题添加，避免繁琐的多步骤操作
2. **实时同步** - WebSocket确保所有操作实时反映
3. **智能算法** - 基于遗忘曲线的科学复习计划
4. **数据驱动** - 详细的统计分析帮助优化学习策略
5. **现代技术** - 使用最新的前后端技术栈

## 🔧 配置说明

### 环境变量
```env
# 后端配置
DATABASE_URL=postgres://username:password@localhost/dbname
JWT_SECRET=your-jwt-secret
PORT=8080
CORS_ORIGIN=http://localhost:3000,http://localhost:3001

# 前端配置
NEXT_PUBLIC_API_URL=http://localhost:8080
NEXT_PUBLIC_WS_URL=ws://localhost:8080
```

## 🎯 后续规划

- [ ] 移动端适配优化
- [ ] 语音识别功能
- [ ] AI智能解析
- [ ] 社交学习功能
- [ ] 数据导出功能
- [ ] 学习报告生成

---

**开发完成** ✅ 系统已完全可用，支持完整的错题管理流程！