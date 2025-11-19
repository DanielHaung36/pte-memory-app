"use client";

import { Provider } from 'react-redux';
import { store } from '@/lib/store';
import { useEffect } from 'react';
import { initializeReviewSettings } from '@/lib/store/reviewSlice';

export function ReduxProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // 初始化复习设置
    store.dispatch(initializeReviewSettings());
    
    // 认证状态初始化现在在ProtectedRoute中通过useGetMeQuery处理
    // WebSocket连接也会在认证成功后自动建立
  }, []);

  return <Provider store={store}>{children}</Provider>;
}