"use client";

import { Provider } from 'react-redux';
import { store } from '@/lib/store';
import { useEffect } from 'react';
import { initializeAuth } from '@/lib/store/authSlice';
import { initializeReviewSettings } from '@/lib/store/reviewSlice';
import { wsClient } from '@/lib/websocket/client';

export function ReduxProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // 初始化认证状态
    store.dispatch(initializeAuth());
    
    // 初始化复习设置
    store.dispatch(initializeReviewSettings());
    
    // 确保WebSocket客户端初始化
    const state = store.getState();
    if (state.auth.isAuthenticated && state.auth.user?.id) {
      wsClient.connect().catch(console.error);
    }
  }, []);

  return <Provider store={store}>{children}</Provider>;
}