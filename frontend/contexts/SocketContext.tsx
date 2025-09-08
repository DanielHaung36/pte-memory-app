'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { wsClient, WebSocketClient } from '@/lib/websocket'
import { useReduxAuth } from '@/hooks/useReduxAuth'

interface SocketContextType {
  ws: WebSocketClient
  connected: boolean
  sendMessage: (type: string, data?: any) => boolean
}

const SocketContext = createContext<SocketContextType>({ 
  ws: wsClient, 
  connected: false,
  sendMessage: () => false
})

export const useSocket = () => {
  return useContext(SocketContext)
}

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [connected, setConnected] = useState(false)
  const { user } = useReduxAuth()

  useEffect(() => {
    if (user?.id) {
      // Connect WebSocket
      wsClient.connect(user.id)

      // Setup event listeners
      const handleConnect = () => {
        console.log('WebSocket connected')
        setConnected(true)
      }

      const handleDisconnect = () => {
        console.log('WebSocket disconnected')
        setConnected(false)
      }

      const handleCelebration = (data: any) => {
        console.log('Celebration received:', data)
        // Could trigger UI animations here
      }

      const handleNotification = (data: any) => {
        console.log('Notification received:', data)
      }

      // Add event listeners
      wsClient.on('connected', handleConnect)
      wsClient.on('disconnected', handleDisconnect)
      wsClient.on('celebration', handleCelebration)
      wsClient.on('notification', handleNotification)

      return () => {
        // Remove event listeners
        wsClient.off('connected', handleConnect)
        wsClient.off('disconnected', handleDisconnect)
        wsClient.off('celebration', handleCelebration)
        wsClient.off('notification', handleNotification)
      }
    }
  }, [user?.id])

  const sendMessage = (type: string, data?: any) => {
    return wsClient.send(type, data)
  }

  const value = {
    ws: wsClient,
    connected,
    sendMessage,
  }

  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>
}