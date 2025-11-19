'use client';

import { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { useRouter, usePathname } from 'next/navigation';
import { useGetMeQuery } from '@/lib/store/authApi';
import { setCredentials, logout } from '@/lib/store/authSlice';
import { motion } from 'framer-motion';
import { Brain, Heart, Sparkles } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAuth?: boolean;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requireAuth = true 
}) => {
  const dispatch = useDispatch();
  const router = useRouter();
  const pathname = usePathname();
  const [hasInitialized, setHasInitialized] = useState(false);
  
  const { data, error, isLoading, isError } = useGetMeQuery(undefined, {
    retry: false, // Don't retry on error to avoid infinite requests
  });

  const isAuthenticated = !!data?.user;
  const user = data?.user;

  useEffect(() => {
    if (isLoading) return; // Wait for API call to complete

    // Mark as initialized once we get a response (success or error)
    if (!hasInitialized) {
      setHasInitialized(true);
    }

    if (isError || error) {
      // User is not authenticated
      dispatch(logout());
    } else if (user) {
      // User is authenticated
      dispatch(setCredentials({ user }));
    }
  }, [data, error, isError, isLoading, user, dispatch, hasInitialized]);

  useEffect(() => {
    // Don't redirect until we've initialized and have a clear auth state
    if (isLoading || !hasInitialized) return;

    const publicRoutes = ['/auth/login', '/auth/register', '/'];
    const isPublicRoute = publicRoutes.includes(pathname);

    // Only redirect after we have clear authentication state
    if (hasInitialized) {
      if (requireAuth && !isAuthenticated && !isPublicRoute) {
        // 未认证用户访问受保护路由时，跳转到登录页
        console.log('Redirecting to login - not authenticated');
        router.push('/auth/login');
        return;
      }

      // 只有在非登录/注册页面且用户已登录时才重定向
      if (isAuthenticated && pathname === '/auth/login') {
        // 已登录用户访问登录页面时，延迟重定向到dashboard以避免循环
        console.log('Redirecting to dashboard - already authenticated');
        setTimeout(() => {
          router.replace('/dashboard');
        }, 100);
        return;
      }

      if (isAuthenticated && pathname === '/auth/register') {
        // 已登录用户访问注册页面时，重定向到dashboard
        console.log('Redirecting to dashboard - already authenticated');
        setTimeout(() => {
          router.replace('/dashboard');
        }, 100);
        return;
      }
    }
  }, [isAuthenticated, pathname, router, requireAuth, isLoading, hasInitialized]);

  // 显示加载状态
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center">
        <div className="text-center">
          {/* Logo动画 */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="relative inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-purple-500 via-blue-500 to-pink-500 rounded-2xl mb-6 shadow-2xl"
          >
            <Brain className="w-10 h-10 text-white" />
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
              className="absolute -top-1 -right-1 w-6 h-6 bg-gradient-to-br from-yellow-400 to-orange-400 rounded-full flex items-center justify-center"
            >
              <Sparkles className="w-3 h-3 text-white" />
            </motion.div>
          </motion.div>

          {/* 加载文字 */}
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-2"
          >
            PTE记忆助手
          </motion.h2>
          
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-gray-600 flex items-center justify-center"
          >
            <Heart className="w-4 h-4 text-pink-500 mr-2" />
            正在初始化学习环境...
          </motion.p>

          {/* 加载动画 */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="mt-8 flex justify-center"
          >
            <div className="flex space-x-2">
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  animate={{
                    scale: [1, 1.2, 1],
                    opacity: [0.3, 1, 0.3]
                  }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    delay: i * 0.2,
                    ease: "easeInOut"
                  }}
                  className="w-3 h-3 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full"
                />
              ))}
            </div>
          </motion.div>

          {/* 温馨提示 */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1 }}
            className="mt-6 text-xs text-gray-500"
          >
            为您准备最佳的学习体验 ✨
          </motion.div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default ProtectedRoute;