import { store } from '../store'
import { updateQuestionFromSocket, updateStatsFromSocket } from '../store/questionsSlice'
import { updateReviewStats } from '../store/reviewSlice'
import { updateUser } from '../store/authSlice'

// WebSocket事件类型
export const WS_EVENTS = {
  // 连接事件
  CONNECTED: 'connected',
  DISCONNECTED: 'disconnected',
  ERROR: 'error',
  HEARTBEAT: 'heartbeat',

  // 错题相关事件
  QUESTION_CREATED: 'question_created',
  QUESTION_UPDATED: 'question_updated', 
  QUESTION_DELETED: 'question_deleted',
  QUESTION_REVIEWED: 'question_reviewed',

  // 复习相关事件
  REVIEW_SESSION_STARTED: 'review_session_started',
  REVIEW_SESSION_ENDED: 'review_session_ended',
  REVIEW_PROGRESS: 'review_progress',
  REVIEW_STREAK: 'review_streak_updated',

  // 统计相关事件
  STATS_UPDATED: 'stats_updated',
  LEVEL_UP: 'level_up', 
  ACHIEVEMENT_UNLOCKED: 'achievement_unlocked',
} as const

// WebSocket消息接口
export interface WSMessage {
  type: string
  user_id?: string
  data: any
  time: string
}

// WebSocket客户端类
export class WebSocketClient {
  private ws: WebSocket | null = null
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5
  private reconnectInterval = 3000
  private isConnected = false
  private userID: string | null = null
  private messageQueue: WSMessage[] = []
  private heartbeatInterval?: NodeJS.Timeout
  private callbacks = new Map<string, ((data: any) => void)[]>()

  constructor() {
    this.setupStoreListener()
  }

  // 监听Redux store变化以获取用户ID
  private setupStoreListener() {
    store.subscribe(() => {
      const state = store.getState()
      const newUserID = state.auth.user?.id
      
      if (newUserID !== this.userID) {
        this.userID = newUserID || null
        
        if (this.userID && !this.isConnected) {
          this.connect()
        } else if (!this.userID && this.isConnected) {
          this.disconnect()
        }
      }
    })
  }

  // 连接WebSocket
  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.isConnected || !this.userID) {
        resolve()
        return
      }

      const wsUrl = `${process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8081'}/ws?user_id=${this.userID}`
      
      try {
        this.ws = new WebSocket(wsUrl)
        
        this.ws.onopen = () => {
          console.log('WebSocket connected')
          this.isConnected = true
          this.reconnectAttempts = 0
          this.startHeartbeat()
          this.flushMessageQueue()
          resolve()
        }

        this.ws.onmessage = (event) => {
          this.handleMessage(JSON.parse(event.data))
        }

        this.ws.onclose = (event) => {
          console.log('WebSocket disconnected', event)
          this.isConnected = false
          this.stopHeartbeat()
          
          if (!event.wasClean && this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnect()
          }
        }

        this.ws.onerror = (error) => {
          console.error('WebSocket error:', error)
          this.isConnected = false
          reject(error)
        }

      } catch (error) {
        console.error('Failed to create WebSocket:', error)
        reject(error)
      }
    })
  }

  // 断开WebSocket连接
  disconnect() {
    if (this.ws) {
      this.ws.close(1000, 'User disconnected')
      this.ws = null
    }
    this.isConnected = false
    this.stopHeartbeat()
  }

  // 重连WebSocket
  private reconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnect attempts reached')
      return
    }

    this.reconnectAttempts++
    console.log(`Reconnecting... Attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts}`)

    setTimeout(() => {
      this.connect().catch(console.error)
    }, this.reconnectInterval * this.reconnectAttempts)
  }

  // 发送消息
  send(message: Partial<WSMessage>) {
    const fullMessage: WSMessage = {
      type: message.type || '',
      user_id: this.userID || undefined,
      data: message.data || {},
      time: new Date().toISOString(),
      ...message,
    }

    if (this.isConnected && this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(fullMessage))
    } else {
      // 连接断开时将消息加入队列
      this.messageQueue.push(fullMessage)
    }
  }

  // 处理接收到的消息
  private handleMessage(message: WSMessage) {
    console.log('WebSocket message received:', message)

    switch (message.type) {
      case WS_EVENTS.CONNECTED:
        this.handleConnected(message.data)
        break

      case WS_EVENTS.QUESTION_CREATED:
      case WS_EVENTS.QUESTION_UPDATED:
      case WS_EVENTS.QUESTION_DELETED:
        this.handleQuestionEvent(message)
        break

      case WS_EVENTS.QUESTION_REVIEWED:
        this.handleQuestionReviewed(message)
        break

      case WS_EVENTS.REVIEW_SESSION_STARTED:
      case WS_EVENTS.REVIEW_SESSION_ENDED:
        this.handleReviewSession(message)
        break

      case WS_EVENTS.STATS_UPDATED:
        this.handleStatsUpdated(message)
        break

      case WS_EVENTS.LEVEL_UP:
        this.handleLevelUp(message)
        break

      case WS_EVENTS.ACHIEVEMENT_UNLOCKED:
        this.handleAchievement(message)
        break

      case WS_EVENTS.REVIEW_STREAK:
        this.handleStreakUpdate(message)
        break

      case WS_EVENTS.ERROR:
        this.handleError(message)
        break

      case WS_EVENTS.HEARTBEAT:
        // 响应心跳
        break

      default:
        console.warn('Unknown WebSocket message type:', message.type)
    }

    // 触发自定义回调
    this.triggerCallbacks(message.type, message.data)
  }

  // 处理连接成功
  private handleConnected(data: any) {
    console.log('WebSocket connection established:', data)
  }

  // 处理错题事件
  private handleQuestionEvent(message: WSMessage) {
    const { question_id, action, title, question_type } = message.data
    
    // 显示通知
    if (action === 'created') {
      this.showNotification(`错题创建成功: ${title}`, 'success')
    } else if (action === 'updated') {
      this.showNotification(`错题已更新: ${title}`, 'info')
    } else if (action === 'deleted') {
      this.showNotification(`错题已删除: ${title}`, 'warning')
    }

    // 更新Redux状态
    store.dispatch(updateQuestionFromSocket(message.data))
  }

  // 处理错题复习
  private handleQuestionReviewed(message: WSMessage) {
    const { title, review_result } = message.data
    
    if (review_result?.is_correct) {
      this.showNotification(`✅ 回答正确: ${title}`, 'success')
    } else {
      this.showNotification(`❌ 需要再练习: ${title}`, 'error')
    }

    // 更新统计数据
    this.requestStatsUpdate()
  }

  // 处理复习会话
  private handleReviewSession(message: WSMessage) {
    const { session_id, completed_count, total_questions, accuracy_rate } = message.data

    if (message.type === WS_EVENTS.REVIEW_SESSION_ENDED) {
      const accuracy = Math.round(accuracy_rate * 100)
      this.showNotification(
        `复习完成! 准确率: ${accuracy}% (${completed_count}/${total_questions})`,
        'success'
      )
    }

    // 更新复习统计
    store.dispatch(updateReviewStats({
      todayReviewed: completed_count,
      averageAccuracy: accuracy_rate * 100,
    }))
  }

  // 处理统计更新
  private handleStatsUpdated(message: WSMessage) {
    store.dispatch(updateStatsFromSocket(message.data))
  }

  // 处理升级
  private handleLevelUp(message: WSMessage) {
    const { new_level, previous_level, xp_gained } = message.data
    
    this.showNotification(
      `🎉 恭喜升级! Lv.${previous_level} → Lv.${new_level} (+${xp_gained} XP)`,
      'success',
      5000
    )

    // 更新用户信息
    store.dispatch(updateUser({
      level: new_level,
      xp: message.data.total_xp,
    }))
  }

  // 处理成就解锁
  private handleAchievement(message: WSMessage) {
    const { name, description, xp_reward } = message.data
    
    this.showNotification(
      `🏆 成就解锁: ${name}\n${description} (+${xp_reward} XP)`,
      'success',
      6000
    )
  }

  // 处理连击更新
  private handleStreakUpdate(message: WSMessage) {
    const { current_streak, streak_type } = message.data
    
    if (current_streak > 0 && current_streak % 5 === 0) {
      this.showNotification(
        `🔥 连击 ${current_streak} 次! 保持这个节奏!`,
        'info'
      )
    }

    store.dispatch(updateReviewStats({
      streak: current_streak,
    }))
  }

  // 处理错误
  private handleError(message: WSMessage) {
    const { code, message: errorMsg, details } = message.data
    console.error(`WebSocket Error ${code}: ${errorMsg}`, details)
    this.showNotification(`错误: ${errorMsg}`, 'error')
  }

  // 显示通知
  private showNotification(message: string, type: 'success' | 'error' | 'info' | 'warning', duration = 3000) {
    // 这里可以集成具体的通知库，比如 react-hot-toast
    if (typeof window !== 'undefined') {
      console.log(`[${type.toUpperCase()}] ${message}`)
      
      // 如果有全局通知函数，在这里调用
      if ((window as any).showToast) {
        (window as any).showToast(message, type, duration)
      }
    }
  }

  // 开始心跳
  private startHeartbeat() {
    this.heartbeatInterval = setInterval(() => {
      this.send({
        type: 'ping',
        data: { timestamp: Date.now() }
      })
    }, 30000) // 每30秒发送一次心跳
  }

  // 停止心跳
  private stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval)
      this.heartbeatInterval = undefined
    }
  }

  // 刷新消息队列
  private flushMessageQueue() {
    while (this.messageQueue.length > 0) {
      const message = this.messageQueue.shift()
      if (message) {
        this.send(message)
      }
    }
  }

  // 请求统计更新
  private requestStatsUpdate() {
    this.send({
      type: 'request_stats',
      data: {}
    })
  }

  // 添加事件回调
  on(eventType: string, callback: (data: any) => void) {
    if (!this.callbacks.has(eventType)) {
      this.callbacks.set(eventType, [])
    }
    this.callbacks.get(eventType)!.push(callback)
  }

  // 移除事件回调
  off(eventType: string, callback: (data: any) => void) {
    const callbacks = this.callbacks.get(eventType)
    if (callbacks) {
      const index = callbacks.indexOf(callback)
      if (index > -1) {
        callbacks.splice(index, 1)
      }
    }
  }

  // 触发回调
  private triggerCallbacks(eventType: string, data: any) {
    const callbacks = this.callbacks.get(eventType)
    if (callbacks) {
      callbacks.forEach(callback => {
        try {
          callback(data)
        } catch (error) {
          console.error('WebSocket callback error:', error)
        }
      })
    }
  }

  // 获取连接状态
  getConnectionStatus() {
    return {
      isConnected: this.isConnected,
      reconnectAttempts: this.reconnectAttempts,
      userID: this.userID,
      queuedMessages: this.messageQueue.length,
    }
  }
}

// 全局WebSocket客户端实例
export const wsClient = new WebSocketClient()

// React Hook for WebSocket
import { useEffect, useRef } from 'react'

export function useWebSocket(eventType?: string, callback?: (data: any) => void) {
  const callbackRef = useRef(callback)
  callbackRef.current = callback

  useEffect(() => {
    if (eventType && callbackRef.current) {
      const handler = (data: any) => callbackRef.current?.(data)
      wsClient.on(eventType, handler)
      
      return () => {
        wsClient.off(eventType, handler)
      }
    }
  }, [eventType])

  return {
    send: wsClient.send.bind(wsClient),
    isConnected: wsClient.getConnectionStatus().isConnected,
    connect: wsClient.connect.bind(wsClient),
    disconnect: wsClient.disconnect.bind(wsClient),
  }
}