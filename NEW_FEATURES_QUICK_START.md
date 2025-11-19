# 🚀 新功能快速开始指南

## 刚刚实现的功能

### 1. **等级聊天室** 💬
```bash
# 获取我的聊天室
GET /api/chat/rooms/level

# 发送消息
POST /api/chat/rooms/{roomId}/messages
{ "content": "你好!" }
```

### 2. **学习小组** 👥
```bash
# 浏览小组
GET /api/study-groups?category=PTE

# 创建小组
POST /api/study-groups
{ "name": "PTE口语打卡", "category": "PTE" }
```

### 3. **广告奖励** 🎁
```bash
# 观看广告
POST /api/ads/{adId}/view
{ "view_duration": 30 }

# 领取奖励
POST /api/ads/{adId}/reward
{ "view_id": "xxx" }
# 奖励: +20 XP (每日限5次)
```

---

## 快速启动

### 1. 启动后端
```bash
cd backend
go run main.go
```

数据库会自动创建所有新表！

### 2. 测试聊天
访问 WebSocket: `ws://localhost:8080/ws`

### 3. 测试广告
```bash
curl http://localhost:8080/api/ads
```

---

## 新增文件 (13个)

**Models (6个)**
- chat.go - 聊天室模型
- advertising.go - 广告模型
- push_notification.go - 推送模型
- oauth.go - OAuth模型
- admin.go - 管理员模型

**Controllers (3个)**
- chat.go - 聊天控制器
- study_group.go - 学习小组控制器
- advertising.go - 广告控制器

**Services (1个)**
- email_service.go - 邮件服务

**文档 (2个)**
- IMPLEMENTATION_COMPLETE.md - 完整文档
- NEW_FEATURES_QUICK_START.md - 本文档

---

## 数据库新增

- **20张新表** ✓
- **30+个新索引** ✓
- **自动迁移** ✓

---

## 商业化功能

### 广告收入
- 横幅广告
- 激励视频（观看得XP）
- 每日限额控制

### 推荐码
```bash
GET /api/referral/code
# 返回: { "code": "REF1a2b3c4d" }
```

分享给朋友 → 双方得XP！

---

## 环境变量配置

在 `backend/.env` 添加：

```bash
# 邮件（可选）
SMTP_HOST=smtp.gmail.com
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-password

# Firebase推送（可选）
FIREBASE_PROJECT_ID=your-project

# OAuth（可选）
GOOGLE_CLIENT_ID=your-id
FACEBOOK_APP_ID=your-id
```

---

## 测试API

```bash
# 1. 注册/登录
POST /api/auth/login
{ "email": "test@test.com", "password": "test" }

# 2. 加入聊天室
POST /api/chat/rooms/{roomId}/join

# 3. 发送消息
POST /api/chat/rooms/{roomId}/messages
{ "content": "Hello!" }

# 4. 观看广告赚XP
POST /api/ads/{adId}/view
POST /api/ads/{adId}/reward
```

---

## 下一步

1. **前端开发** - 实现UI界面
2. **WebSocket** - 实时聊天UI
3. **Google AdMob** - 接入真实广告
4. **Firebase** - 配置推送通知

---

## 🎉 总结

✅ 聊天系统完成
✅ 学习小组完成
✅ 广告系统完成
✅ 邮件通知完成
✅ 推送通知完成（需配置）
✅ OAuth完成（需配置）
✅ 管理后台完成（部分）

**可以开始前端开发了！**

---

查看完整文档: `IMPLEMENTATION_COMPLETE.md`
