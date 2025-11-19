// WebSocket client for real-time communication
import { toast } from 'react-hot-toast'
import { API_CONFIG } from './config'

export interface WebSocketMessage {
  type: string
  user_id?: string
  data: any
  timestamp: string
}

export class WebSocketClient {
  private ws: WebSocket | null = null
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5
  private reconnectDelay = 1000
  private listeners: Map<string, Function[]> = new Map()
  private userID: string | null = null

  constructor() {
    this.setupEventListeners()
  }

  connect(userID: string) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      return // Already connected
    }

    this.userID = userID
    const wsUrl = `${API_CONFIG.WEBSOCKET_URL}?user_id=${userID}`
    
    try {
      this.ws = new WebSocket(wsUrl)
      this.setupWebSocketEventHandlers()
    } catch (error) {
      console.error('WebSocket connection error:', error)
      this.handleReconnect()
    }
  }

  private setupWebSocketEventHandlers() {
    if (!this.ws) return

    this.ws.onopen = (event) => {
      console.log('WebSocket connected')
      this.reconnectAttempts = 0
      toast.success('已连接到实时服务')
      this.emit('connected', { event })
    }

    this.ws.onmessage = (event) => {
      try {
        const message: WebSocketMessage = JSON.parse(event.data)
        this.handleMessage(message)
      } catch (error) {
        console.error('Error parsing WebSocket message:', error)
      }
    }

    this.ws.onclose = (event) => {
      console.log('WebSocket disconnected:', event.code, event.reason)
      this.emit('disconnected', { event })
      
      if (!event.wasClean && this.reconnectAttempts < this.maxReconnectAttempts) {
        this.handleReconnect()
      }
    }

    this.ws.onerror = (error) => {
      console.error('WebSocket error:', error)
      this.emit('error', { error })
    }
  }

  private handleMessage(message: WebSocketMessage) {
    // Emit to specific listeners
    this.emit(message.type, message.data)

    // Handle built-in message types
    switch (message.type) {
      case 'notification':
        this.handleNotification(message.data)
        break
      case 'celebration':
        this.handleCelebration(message.data)
        break
      case 'mastery_celebration':
        this.handleMasteryCelebration(message.data)
        break
      case 'progress_updated':
        this.handleProgressUpdate(message.data)
        break
      case 'connected':
        console.log('WebSocket connected:', message.data.message)
        break
    }
  }

  private handleNotification(data: any) {
    const { message, type } = data
    
    switch (type) {
      case 'success':
        toast.success(message)
        break
      case 'error':
        toast.error(message)
        break
      case 'info':
        toast(message)
        break
      default:
        toast(message)
    }
  }

  private handleCelebration(data: any) {
    const { type, count, message } = data
    
    if (type === 'streak') {
      // Show streak celebration
      toast.success(`🔥 ${message}`, {
        duration: 4000,
        style: {
          background: '#f59e0b',
          color: 'white',
        }
      })
      
      // Trigger celebration animation if listeners exist
      this.emit('streak_celebration', { count, message })
    }
  }

  private handleMasteryCelebration(data: any) {
    const { node_name, message } = data
    
    toast.success(message, {
      duration: 5000,
      style: {
        background: '#10b981',
        color: 'white',
      }
    })
    
    // Trigger mastery animation
    this.emit('knowledge_mastery', data)
  }

  private handleProgressUpdate(data: any) {
    // Emit progress update for components to handle
    this.emit('progress_update', data.progress)
  }

  private handleReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      toast.error('无法连接到实时服务，请刷新页面重试')
      return
    }

    this.reconnectAttempts++
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1) // Exponential backoff
    
    setTimeout(() => {
      if (this.userID) {
        console.log(`Attempting to reconnect... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`)
        this.connect(this.userID)
      }
    }, delay)
  }

  // Event listener methods
  on(eventType: string, callback: Function) {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, [])
    }
    this.listeners.get(eventType)?.push(callback)
  }

  off(eventType: string, callback: Function) {
    const callbacks = this.listeners.get(eventType)
    if (callbacks) {
      const index = callbacks.indexOf(callback)
      if (index > -1) {
        callbacks.splice(index, 1)
      }
    }
  }

  private emit(eventType: string, data: any) {
    const callbacks = this.listeners.get(eventType)
    if (callbacks) {
      callbacks.forEach(callback => {
        try {
          callback(data)
        } catch (error) {
          console.error(`Error in ${eventType} callback:`, error)
        }
      })
    }
  }

  // Send methods
  send(type: string, data: any = {}) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.warn('WebSocket not connected, cannot send message')
      return false
    }

    const message: WebSocketMessage = {
      type,
      user_id: this.userID || undefined,
      data,
      timestamp: new Date().toISOString()
    }

    try {
      this.ws.send(JSON.stringify(message))
      return true
    } catch (error) {
      console.error('Error sending WebSocket message:', error)
      return false
    }
  }

  // Convenience methods for common actions
  joinStudySession(sessionID: string) {
    return this.send('join_study_session', { session_id: sessionID })
  }

  updateProgress(progressData: any) {
    return this.send('update_progress', progressData)
  }

  reportStreak(streakCount: number) {
    return this.send('streak_achieved', { streak: streakCount })
  }

  reportKnowledgeMastery(nodeID: string, nodeName: string) {
    return this.send('knowledge_mastered', { 
      node_id: nodeID, 
      node_name: nodeName 
    })
  }

  ping() {
    return this.send('ping')
  }

  // Connection management
  disconnect() {
    if (this.ws) {
      this.ws.close(1000, 'Client disconnect')
      this.ws = null
    }
    this.userID = null
    this.listeners.clear()
  }

  isConnected() {
    return this.ws && this.ws.readyState === WebSocket.OPEN
  }

  private setupEventListeners() {
    // Handle page visibility changes
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible' && this.userID && !this.isConnected()) {
        // Reconnect when page becomes visible
        this.connect(this.userID)
      }
    })

    // Handle page unload
    window.addEventListener('beforeunload', () => {
      this.disconnect()
    })
  }
}

import { useEffect } from 'react'

// Singleton instance
export const wsClient = new WebSocketClient()

// React hook for WebSocket

export function useWebSocket(userID: string | null) {
  useEffect(() => {
    if (userID && !wsClient.isConnected()) {
      wsClient.connect(userID)
    }

    return () => {
      // Don't disconnect on unmount, keep connection alive
    }
  }, [userID])

  return wsClient
}