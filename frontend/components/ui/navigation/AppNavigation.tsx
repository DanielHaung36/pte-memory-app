'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '@/lib/store';
import { clearCredentials } from '@/lib/store/authSlice';
import {
  Home,
  BookOpen,
  GraduationCap,
  BarChart3,
  Settings,
  User,
  Star,
  Heart,
  Trophy,
  LogOut,
  Menu,
  X,
  Zap,
  Target,
  Map,
  Gamepad2
} from 'lucide-react';
import { toast } from 'react-hot-toast';

interface NavigationProps {
  showUserMenu?: boolean;
  className?: string;
}

const navigationItems = [
  { href: '/dashboard', icon: Home, label: '首页', color: 'text-blue-500' },
  { href: '/wrong-questions', icon: Target, label: '错题本', color: 'text-purple-500' },
  { href: '/questions', icon: BookOpen, label: '题库', color: 'text-green-500' },
  { href: '/review', icon: GraduationCap, label: '复习', color: 'text-blue-500' },
  { href: '/knowledge-graph', icon: Map, label: '知识图谱', color: 'text-orange-500' },
  { href: '/games', icon: Gamepad2, label: '游戏', color: 'text-pink-500' },
  { href: '/analytics', icon: BarChart3, label: '统计', color: 'text-teal-500' },
];

const AppNavigation: React.FC<NavigationProps> = ({ 
  showUserMenu = true, 
  className = '' 
}) => {
  const pathname = usePathname();
  const router = useRouter();
  const dispatch = useDispatch();
  const { user, isAuthenticated } = useSelector((state: RootState) => state.auth);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  const handleLogout = () => {
    dispatch(clearCredentials());
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    toast.success('已安全退出', {
      icon: '👋',
      style: {
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        borderRadius: '16px',
      }
    });
    router.push('/auth/login');
  };

  return (
    <nav className={`bg-white/90 backdrop-blur-lg border-b border-gray-100/50 sticky top-0 z-50 ${className}`}>
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/dashboard" className="flex items-center space-x-3 group pl-2">
            <motion.div
              whileHover={{ scale: 1.1, rotate: 10 }}
              whileTap={{ scale: 0.95 }}
              className="relative p-2 bg-gradient-to-br from-emerald-400 via-cyan-400 to-blue-500 rounded-xl shadow-lg"
            >
              <GraduationCap className="h-6 w-6 text-white" />
              <motion.div
                animate={{ 
                  scale: [1, 1.2, 1],
                  rotate: [0, 10, 0]
                }}
                transition={{ 
                  duration: 3,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
                className="absolute -top-1 -right-1 w-3 h-3 bg-gradient-to-br from-yellow-400 to-orange-400 rounded-full flex items-center justify-center"
              >
                <Star className="w-1.5 h-1.5 text-white" />
              </motion.div>
            </motion.div>
            
            <div className="hidden sm:block">
              <motion.h1 
                className="text-lg font-bold bg-gradient-to-r from-emerald-600 via-cyan-600 to-blue-600 bg-clip-text text-transparent"
                whileHover={{ scale: 1.05 }}
              >
                PTE智学伴侣
              </motion.h1>
              <div className="flex items-center text-xs text-gray-500">
                <Heart className="w-3 h-3 text-emerald-400 mr-1" />
                智能陪练，轻松提分
              </div>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center space-x-0.5">
            {navigationItems.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;

              return (
                <Link key={item.href} href={item.href}>
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className={`relative px-3 py-2.5 rounded-lg transition-all duration-200 flex items-center space-x-2 ${
                      isActive 
                        ? 'bg-gradient-to-r from-emerald-50 to-cyan-50 text-emerald-700 shadow-sm' 
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <Icon className={`h-4 w-4 ${isActive ? 'text-emerald-600' : item.color}`} />
                    <span className="font-medium text-sm">{item.label}</span>
                    
                    {isActive && (
                      <motion.div
                        layoutId="activeTab"
                        className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-6 h-0.5 bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-full"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ type: "spring", stiffness: 500, damping: 30 }}
                      />
                    )}
                  </motion.div>
                </Link>
              );
            })}
          </div>

          {/* Right Side */}
          <div className="flex items-center space-x-4">
            {isAuthenticated && user && showUserMenu && (
              <>
                {/* User Level & XP */}
                <div className="hidden md:flex items-center space-x-2">
                  <motion.div 
                    className="flex items-center space-x-2 bg-gradient-to-r from-emerald-100 to-cyan-100 px-2.5 py-1.5 rounded-lg"
                    whileHover={{ scale: 1.05 }}
                  >
                    <Trophy className="h-3.5 w-3.5 text-emerald-600" />
                    <span className="text-xs font-medium text-emerald-700">
                      Lv.{user.level}
                    </span>
                  </motion.div>
                  
                  <motion.div 
                    className="flex items-center space-x-2 bg-gradient-to-r from-cyan-100 to-blue-100 px-2.5 py-1.5 rounded-lg"
                    whileHover={{ scale: 1.05 }}
                  >
                    <Zap className="h-3.5 w-3.5 text-cyan-600" />
                    <span className="text-xs font-medium text-cyan-700">
                      {user.xp} XP
                    </span>
                  </motion.div>
                </div>

                {/* User Menu */}
                <div className="relative">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                    className="flex items-center space-x-2 p-2 rounded-xl hover:bg-gray-50 transition-colors"
                  >
                    <div className="w-8 h-8 bg-gradient-to-br from-emerald-400 to-cyan-500 rounded-full flex items-center justify-center">
                      <span className="text-white font-medium text-sm">
                        {user.username.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <span className="hidden sm:block text-sm font-medium text-gray-700">
                      {user.username}
                    </span>
                  </motion.button>

                  <AnimatePresence>
                    {isUserMenuOpen && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 10 }}
                        transition={{ duration: 0.15 }}
                        className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-100 py-2 z-50"
                      >
                        <div className="px-4 py-3 border-b border-gray-100">
                          <p className="text-sm font-medium text-gray-900">{user.username}</p>
                          <p className="text-xs text-gray-500">{user.email}</p>
                        </div>
                        
                        <Link href="/profile" onClick={() => setIsUserMenuOpen(false)}>
                          <div className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                            <User className="h-4 w-4 mr-3" />
                            个人资料
                          </div>
                        </Link>
                        
                        <Link href="/settings" onClick={() => setIsUserMenuOpen(false)}>
                          <div className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                            <Settings className="h-4 w-4 mr-3" />
                            设置
                          </div>
                        </Link>
                        
                        <div className="border-t border-gray-100 my-2" />
                        
                        <button
                          onClick={handleLogout}
                          className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                        >
                          <LogOut className="h-4 w-4 mr-3" />
                          退出登录
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </>
            )}

            {/* Mobile Menu Button */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="lg:hidden p-2 rounded-xl hover:bg-gray-50 transition-colors"
            >
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </motion.button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="lg:hidden border-t border-gray-100 bg-white/95 backdrop-blur-sm"
          >
            <div className="max-w-7xl mx-auto px-4 py-4">
              <div className="space-y-2">
                {navigationItems.map((item) => {
                  const isActive = pathname === item.href;
                  const Icon = item.icon;

                  return (
                    <Link key={item.href} href={item.href} onClick={() => setIsMenuOpen(false)}>
                      <motion.div
                        whileHover={{ scale: 1.02, x: 4 }}
                        className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-all ${
                          isActive 
                            ? 'bg-gradient-to-r from-emerald-50 to-cyan-50 text-emerald-700' 
                            : 'text-gray-600 hover:bg-gray-50'
                        }`}
                      >
                        <Icon className={`h-5 w-5 ${isActive ? 'text-emerald-600' : item.color}`} />
                        <span className="font-medium">{item.label}</span>
                      </motion.div>
                    </Link>
                  );
                })}
              </div>
              
              {isAuthenticated && user && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <div className="flex items-center justify-between px-4">
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-8 bg-gradient-to-br from-emerald-400 to-cyan-500 rounded-full flex items-center justify-center">
                        <span className="text-white font-medium text-sm">
                          {user.username.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <span className="text-sm font-medium">{user.username}</span>
                    </div>
                    <button
                      onClick={handleLogout}
                      className="text-red-600 hover:text-red-700 p-2"
                    >
                      <LogOut className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Background Overlay for Mobile Menu */}
      {isUserMenuOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/10 backdrop-blur-sm"
          onClick={() => setIsUserMenuOpen(false)}
        />
      )}
    </nav>
  );
};

export default AppNavigation;