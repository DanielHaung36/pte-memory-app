# 前端API实现总结

## 概述

前端使用 **RTK Query** (Redux Toolkit Query) 实现所有后端API的调用，通过Next.js的rewrites功能代理到后端服务器。

## 技术栈

- **Next.js 15** - React框架
- **TypeScript** - 类型安全
- **Redux Toolkit** - 状态管理
- **RTK Query** - API数据获取和缓存
- **Axios** - HTTP客户端（基础层）

## 代理配置

### Next.js代理 (`next.config.js`)

```javascript
async rewrites() {
  return [
    {
      source: '/api/:path*',
      destination: `http://localhost:8080/api/:path*`,
    },
    {
      source: '/uploads/:path*',
      destination: `http://localhost:8080/uploads/:path*`,
    },
  ]
}
```

### 环境配置 (`lib/config.ts`)

- 开发环境：自动代理到 `http://localhost:8080`
- 生产环境：使用相对路径 `/api`
- 自动处理Cookie认证

## 已实现的API模块

### 1. **uploadApi** - 文件上传系统
**文件**: `lib/store/uploadApi.ts`

**功能**:
- ✅ 上传用户头像
- ✅ 上传题目音频
- ✅ 上传题目图片
- ✅ 删除文件

**Hooks**:
```typescript
useUploadAvatarMutation()
useUploadQuestionAudioMutation()
useUploadQuestionImageMutation()
useDeleteFileMutation()
```

### 2. **examApi** - 考试练习系统
**文件**: `lib/store/examApi.ts`

**功能**:
- ✅ 获取PTE练习题
- ✅ 获取IELTS练习题
- ✅ 获取公开练习题
- ✅ 开始模拟考试
- ✅ 获取考试统计
- ✅ 获取题型列表
- ✅ 点赞题目

**Hooks**:
```typescript
useGetPTEPracticeQuery({ type, subtype, limit })
useGetIELTSPracticeQuery({ type, task, module, limit })
useGetPublicPracticeQuery({ exam_type, limit })
useStartMockTestMutation()
useGetExamStatisticsQuery()
useGetQuestionTypesQuery()
useLikeQuestionMutation()
```

### 3. **libraryApi** - 题库管理系统
**文件**: `lib/store/libraryApi.ts`

**功能**:
- ✅ 获取公开题库列表
- ✅ 获取题库详情
- ✅ 创建题库
- ✅ 获取我的题库
- ✅ 下载题库
- ✅ 评分题库

**Hooks**:
```typescript
useGetPublicLibrariesQuery({ category, limit, offset })
useGetLibraryDetailQuery(id)
useCreateLibraryMutation()
useGetMyLibrariesQuery()
useDownloadLibraryMutation()
useRateLibraryMutation()
```

### 4. **notificationApi** - 通知系统
**文件**: `lib/store/notificationApi.ts`

**功能**:
- ✅ 获取通知列表
- ✅ 获取未读通知数量
- ✅ 按类型获取通知
- ✅ 标记通知为已读
- ✅ 标记所有通知为已读
- ✅ 删除通知
- ✅ 清空所有通知
- ✅ 测试通知
- ✅ 获取提醒设置
- ✅ 更新提醒设置

**Hooks**:
```typescript
useGetNotificationsQuery({ limit, offset })
useGetUnreadCountQuery()
useGetNotificationsByTypeQuery(type)
useMarkNotificationReadMutation()
useMarkAllNotificationsReadMutation()
useDeleteNotificationMutation()
useClearAllNotificationsMutation()
useTestNotificationMutation()
useGetReminderSettingsQuery()
useUpdateReminderSettingsMutation()
```

### 5. **chatApi** - 聊天系统
**文件**: `lib/store/chatApi.ts`

**功能**:
- ✅ 获取等级聊天室列表
- ✅ 加入聊天室
- ✅ 离开聊天室
- ✅ 获取聊天室消息
- ✅ 发送聊天消息
- ✅ 获取私聊列表
- ✅ 开始私聊
- ✅ 获取私聊消息
- ✅ 发送私聊消息

**Hooks**:
```typescript
useGetLevelChatRoomsQuery()
useJoinChatRoomMutation()
useLeaveChatRoomMutation()
useGetChatMessagesQuery({ roomId, limit, offset })
useSendChatMessageMutation()
useGetPrivateChatsQuery()
useStartPrivateChatMutation()
useGetPrivateMessagesQuery({ chatId, limit, offset })
useSendPrivateMessageMutation()
```

### 6. **studyGroupApi** - 学习小组系统
**文件**: `lib/store/studyGroupApi.ts`

**功能**:
- ✅ 获取学习小组列表
- ✅ 获取学习小组详情
- ✅ 创建学习小组
- ✅ 获取我的学习小组
- ✅ 加入学习小组
- ✅ 离开学习小组
- ✅ 更新学习小组
- ✅ 删除学习小组
- ✅ 获取小组帖子
- ✅ 创建小组帖子

**Hooks**:
```typescript
useGetStudyGroupsQuery({ category, privacy, limit, offset })
useGetStudyGroupQuery(id)
useCreateStudyGroupMutation()
useGetMyStudyGroupsQuery()
useJoinStudyGroupMutation()
useLeaveStudyGroupMutation()
useUpdateStudyGroupMutation()
useDeleteStudyGroupMutation()
useGetStudyGroupPostsQuery({ groupId, limit, offset })
useCreateStudyGroupPostMutation()
```

### 7. **advertisingApi** - 广告系统
**文件**: `lib/store/advertisingApi.ts`

**功能**:
- ✅ 获取广告列表
- ✅ 记录广告观看
- ✅ 领取广告奖励
- ✅ 获取广告配额

**Hooks**:
```typescript
useGetAdvertisementsQuery({ position, type })
useRecordAdViewMutation()
useClaimAdRewardMutation()
useGetAdQuotaQuery()
```

### 8. **pushApi** - 推送通知系统
**文件**: `lib/store/pushApi.ts`

**功能**:
- ✅ 注册设备Token
- ✅ 注销设备Token
- ✅ 获取用户设备列表
- ✅ 获取推送设置
- ✅ 更新推送设置
- ✅ 获取推送历史
- ✅ 发送测试推送

**Hooks**:
```typescript
useRegisterDeviceTokenMutation()
useUnregisterDeviceTokenMutation()
useGetUserDevicesQuery()
useGetPushSettingsQuery()
useUpdatePushSettingsMutation()
useGetPushHistoryQuery({ limit, offset })
useSendTestPushMutation()
```

### 9. **adminApi** - 管理后台系统
**文件**: `lib/store/adminApi.ts`

**功能**:
- ✅ 获取管理统计
- ✅ 获取所有用户
- ✅ 获取用户详情
- ✅ 封禁用户
- ✅ 解封用户
- ✅ 更新用户角色
- ✅ 获取待审核题目
- ✅ 批准题目
- ✅ 拒绝题目
- ✅ 批量审核题目
- ✅ 获取用户举报
- ✅ 处理举报
- ✅ 获取系统配置
- ✅ 创建系统配置
- ✅ 更新系统配置
- ✅ 获取操作日志
- ✅ 创建广告
- ✅ 更新广告
- ✅ 获取广告统计
- ✅ 发送广播推送
- ✅ 获取推送模板
- ✅ 创建推送模板
- ✅ 更新推送模板
- ✅ 获取推送统计

**Hooks**:
```typescript
useGetAdminStatsQuery()
useGetAllUsersQuery({ limit, offset, search })
useGetUserDetailQuery(id)
useBanUserMutation()
useUnbanUserMutation()
useUpdateUserRoleMutation()
useGetPendingQuestionsQuery({ limit, offset })
useApproveQuestionMutation()
useRejectQuestionMutation()
useBatchReviewQuestionsMutation()
useGetUserReportsQuery({ status, limit, offset })
useProcessReportMutation()
useGetSystemConfigsQuery()
useCreateSystemConfigMutation()
useUpdateSystemConfigMutation()
useGetAdminLogsQuery({ admin_id, action, limit, offset })
// ... 更多管理功能
```

### 10. **已存在的API模块**

以下模块已在之前实现：

- ✅ **authApi** - 认证系统
- ✅ **userApi** - 用户管理
- ✅ **questionsApi** - 题目管理
- ✅ **wrongQuestionsApi** - 错题管理
- ✅ **gamesApi** - 游戏系统
- ✅ **analyticsApi** - 数据分析
- ✅ **socialApi** - 社交功能
- ✅ **shopApi** - 商店系统

### ❌ **已废弃的API模块**

- ~~**knowledgeApi**~~ - 知识图谱功能（已移除）

## Store配置

所有API已在Redux Store中正确配置：

```typescript
// lib/store/index.ts
export const store = configureStore({
  reducer: {
    [uploadApi.reducerPath]: uploadApi.reducer,
    [examApi.reducerPath]: examApi.reducer,
    [libraryApi.reducerPath]: libraryApi.reducer,
    [notificationApi.reducerPath]: notificationApi.reducer,
    [chatApi.reducerPath]: chatApi.reducer,
    [studyGroupApi.reducerPath]: studyGroupApi.reducer,
    [advertisingApi.reducerPath]: advertisingApi.reducer,
    [pushApi.reducerPath]: pushApi.reducer,
    [adminApi.reducerPath]: adminApi.reducer,
    // ... 其他API
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(
      uploadApi.middleware,
      examApi.middleware,
      libraryApi.middleware,
      notificationApi.middleware,
      chatApi.middleware,
      studyGroupApi.middleware,
      advertisingApi.middleware,
      pushApi.middleware,
      adminApi.middleware,
      // ... 其他middleware
    ),
})
```

## 使用示例

### 1. 文件上传示例

```typescript
'use client'

import { useUploadAvatarMutation } from '@/lib/store/uploadApi'

export default function AvatarUpload() {
  const [uploadAvatar, { isLoading, isSuccess }] = useUploadAvatarMutation()

  const handleUpload = async (file: File) => {
    const formData = new FormData()
    formData.append('avatar', file)

    try {
      const result = await uploadAvatar(formData).unwrap()
      console.log('上传成功:', result.url)
    } catch (error) {
      console.error('上传失败:', error)
    }
  }

  return (
    <div>
      <input
        type="file"
        onChange={(e) => e.target.files && handleUpload(e.target.files[0])}
        accept="image/*"
      />
      {isLoading && <p>上传中...</p>}
      {isSuccess && <p>上传成功！</p>}
    </div>
  )
}
```

### 2. 通知系统示例

```typescript
'use client'

import { useGetNotificationsQuery, useMarkNotificationReadMutation } from '@/lib/store/notificationApi'

export default function Notifications() {
  const { data, isLoading } = useGetNotificationsQuery({ limit: 10 })
  const [markRead] = useMarkNotificationReadMutation()

  if (isLoading) return <div>加载中...</div>

  return (
    <div>
      {data?.notifications.map((notif) => (
        <div key={notif.id} onClick={() => markRead(notif.id)}>
          <h3>{notif.title}</h3>
          <p>{notif.message}</p>
        </div>
      ))}
    </div>
  )
}
```

### 3. 聊天室示例

```typescript
'use client'

import {
  useGetLevelChatRoomsQuery,
  useJoinChatRoomMutation,
  useGetChatMessagesQuery,
  useSendChatMessageMutation
} from '@/lib/store/chatApi'
import { useState } from 'react'

export default function ChatRoom() {
  const [selectedRoom, setSelectedRoom] = useState<string | null>(null)
  const { data: rooms } = useGetLevelChatRoomsQuery()
  const { data: messages } = useGetChatMessagesQuery(
    { roomId: selectedRoom!, limit: 50 },
    { skip: !selectedRoom }
  )
  const [sendMessage] = useSendChatMessageMutation()
  const [joinRoom] = useJoinChatRoomMutation()

  const handleSendMessage = async (content: string) => {
    if (!selectedRoom) return
    await sendMessage({ roomId: selectedRoom, content })
  }

  return (
    <div>
      {/* 聊天室列表 */}
      {rooms?.rooms.map((room) => (
        <div key={room.id} onClick={() => {
          setSelectedRoom(room.id)
          joinRoom(room.id)
        }}>
          {room.name}
        </div>
      ))}

      {/* 消息列表 */}
      {messages?.messages.map((msg) => (
        <div key={msg.id}>
          <strong>{msg.user?.username}:</strong> {msg.content}
        </div>
      ))}
    </div>
  )
}
```

## RTK Query特性

### 自动缓存管理
- 自动缓存查询结果
- 智能失效和重新获取
- 标签系统进行精细控制

### 乐观更新
```typescript
const [updateData] = useMutation()

// 乐观更新示例
await updateData(newData, {
  optimisticUpdate: true
})
```

### 条件查询
```typescript
const { data } = useGetDataQuery(params, {
  skip: !shouldFetch, // 条件性跳过查询
  pollingInterval: 3000, // 轮询
  refetchOnMountOrArgChange: true, // 重新挂载时刷新
})
```

## 认证处理

所有API自动包含Cookie认证：
- 登录后自动设置HTTP-only cookie
- 所有请求自动携带cookie
- 401错误自动跳转到登录页

## 错误处理

RTK Query提供统一的错误处理：

```typescript
const { data, error, isError } = useGetDataQuery()

if (isError) {
  console.error('API错误:', error)
  // 显示错误提示
}
```

## 开发建议

### 1. 使用TypeScript类型
所有API都有完整的TypeScript类型定义，充分利用类型安全。

### 2. 利用缓存
RTK Query自动缓存，避免重复请求同样的数据。

### 3. 标签失效
使用`invalidatesTags`确保数据更新后刷新相关查询。

### 4. 条件查询
使用`skip`参数避免不必要的请求。

### 5. 加载状态
利用`isLoading`, `isFetching`, `isSuccess`等状态提升用户体验。

## 下一步

### 需要实现的UI页面

1. **文件上传组件**
   - 头像上传器
   - 音频上传器
   - 图片上传器

2. **考试练习页面**
   - PTE练习页面
   - IELTS练习页面
   - 模拟考试页面

3. **题库页面**
   - 题库浏览
   - 题库详情
   - 我的题库

4. **通知中心**
   - 通知列表
   - 提醒设置

5. **聊天系统**
   - 聊天室界面
   - 私聊界面

6. **学习小组**
   - 小组列表
   - 小组详情
   - 小组讨论区

7. **广告系统**
   - 激励广告展示

8. **管理后台**
   - 用户管理
   - 内容审核
   - 系统配置
   - 数据统计

## 总结

✅ **前端API实现完成度: 100%**

- 所有后端API已通过RTK Query实现
- Next.js代理配置完成
- Redux Store正确集成
- TypeScript类型完整
- 自动Cookie认证
- 统一错误处理

现在可以开始构建UI组件来使用这些API了！
