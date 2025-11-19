import { useSelector, useDispatch } from 'react-redux';
import type { RootState } from '@/lib/store';
import { setCredentials, logout as logoutAction } from '@/lib/store/authSlice';
import { toast } from 'react-hot-toast';

// Redux版本的useAuth hook，替代旧的AuthContext
export function useAuth() {
  const dispatch = useDispatch();
  const { user, token, isAuthenticated, isLoading } = useSelector((state: RootState) => state.auth);

  const login = async (credentials: { email: string; password: string }) => {
    try {
      // TODO: 实现实际的登录API调用
      const mockUser = {
        id: '1',
        username: credentials.email.split('@')[0],
        email: credentials.email,
        level: 1,
        xp: 0,
        streak: 0,
        best_streak: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      
      const mockToken = 'mock-jwt-token';
      
      dispatch(setCredentials({
        user: mockUser,
        token: mockToken,
      }));
      
      toast.success('登录成功！');
      return { success: true };
    } catch (error) {
      toast.error('登录失败，请重试');
      return { success: false, error: error };
    }
  };

  const register = async (data: { username: string; email: string; password: string }) => {
    try {
      // TODO: 实现实际的注册API调用
      const mockUser = {
        id: '1',
        username: data.username,
        email: data.email,
        level: 1,
        xp: 0,
        streak: 0,
        best_streak: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      
      const mockToken = 'mock-jwt-token';
      
      dispatch(setCredentials({
        user: mockUser,
        token: mockToken,
      }));
      
      toast.success('注册成功！');
      return { success: true };
    } catch (error) {
      toast.error('注册失败，请重试');
      return { success: false, error: error };
    }
  };

  const logout = () => {
    dispatch(logoutAction());
    toast.success('已退出登录');
  };

  return {
    user,
    token,
    isAuthenticated,
    isLoading,
    login,
    register,
    logout,
  };
}

// Export as useReduxAuth for backward compatibility
export const useReduxAuth = useAuth;