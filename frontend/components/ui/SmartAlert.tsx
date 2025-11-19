'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle, Brain, Clock, Zap } from 'lucide-react';

export type SmartAlertType = 'success' | 'error' | 'warning' | 'info' | 'review' | 'streak';

interface SmartAlertProps {
  type: SmartAlertType;
  title?: string;
  message: string;
  isVisible: boolean;
  onClose?: () => void;
  onAction?: () => void;
  actionText?: string;
  autoClose?: boolean;
  duration?: number;
  className?: string;
}

const alertStyles = {
  success: {
    container: 'bg-green-50 border-green-200 text-green-800',
    icon: CheckCircle,
    iconColor: 'text-green-600',
    actionButton: 'bg-green-600 hover:bg-green-700 text-white',
  },
  error: {
    container: 'bg-red-50 border-red-200 text-red-800',
    icon: AlertCircle,
    iconColor: 'text-red-600',
    actionButton: 'bg-red-600 hover:bg-red-700 text-white',
  },
  warning: {
    container: 'bg-yellow-50 border-yellow-200 text-yellow-800',
    icon: AlertTriangle,
    iconColor: 'text-yellow-600',
    actionButton: 'bg-yellow-600 hover:bg-yellow-700 text-white',
  },
  info: {
    container: 'bg-blue-50 border-blue-200 text-blue-800',
    icon: Info,
    iconColor: 'text-blue-600',
    actionButton: 'bg-blue-600 hover:bg-blue-700 text-white',
  },
  review: {
    container: 'bg-purple-50 border-purple-200 text-purple-800',
    icon: Brain,
    iconColor: 'text-purple-600',
    actionButton: 'bg-purple-600 hover:bg-purple-700 text-white',
  },
  streak: {
    container: 'bg-orange-50 border-orange-200 text-orange-800',
    icon: Zap,
    iconColor: 'text-orange-600',
    actionButton: 'bg-orange-600 hover:bg-orange-700 text-white',
  },
};

export const SmartAlert: React.FC<SmartAlertProps> = ({
  type,
  title,
  message,
  isVisible,
  onClose,
  onAction,
  actionText,
  autoClose = true,
  duration = 8000, // 延长智能提醒的显示时间
  className = '',
}) => {
  const style = alertStyles[type];
  const IconComponent = style.icon;

  React.useEffect(() => {
    if (autoClose && isVisible && onClose && type !== 'review' && type !== 'streak') {
      const timer = setTimeout(() => {
        onClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [autoClose, isVisible, onClose, duration, type]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, x: 400, scale: 0.9 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={{ opacity: 0, x: 400, scale: 0.9 }}
          transition={{ 
            type: "spring",
            stiffness: 300,
            damping: 30
          }}
          className={`fixed top-20 right-4 z-50 max-w-md w-full ${className}`}
        >
          <div className={`rounded-xl border shadow-xl backdrop-blur-sm p-4 ${style.container}`}>
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <motion.div
                  animate={{ 
                    scale: type === 'review' || type === 'streak' ? [1, 1.1, 1] : 1,
                    rotate: type === 'review' ? [0, 5, -5, 0] : 0
                  }}
                  transition={{ 
                    duration: 2,
                    repeat: type === 'review' || type === 'streak' ? Infinity : 0,
                    repeatType: "reverse"
                  }}
                >
                  <IconComponent className={`h-6 w-6 ${style.iconColor}`} />
                </motion.div>
              </div>
              <div className="ml-3 flex-1">
                {title && (
                  <h3 className="text-sm font-bold mb-2 flex items-center">
                    {title}
                    {(type === 'review' || type === 'streak') && (
                      <motion.span
                        animate={{ opacity: [0.5, 1, 0.5] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                        className="ml-2 text-xs"
                      >
                        🔥
                      </motion.span>
                    )}
                  </h3>
                )}
                <p className="text-sm leading-relaxed mb-3">
                  {message}
                </p>
                
                {/* 操作按钮区域 */}
                <div className="flex items-center justify-between">
                  {onAction && actionText && (
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={onAction}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${style.actionButton}`}
                    >
                      {actionText}
                    </motion.button>
                  )}
                  
                  {onClose && (
                    <button
                      onClick={onClose}
                      className={`ml-auto inline-flex rounded-md p-1 hover:bg-black hover:bg-opacity-10 transition-colors ${style.iconColor}`}
                    >
                      <span className="sr-only">关闭</span>
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// Hook for managing smart alerts
export const useSmartAlert = () => {
  const [alerts, setAlerts] = React.useState<Array<{
    id: string;
    type: SmartAlertType;
    title?: string;
    message: string;
    isVisible: boolean;
    onAction?: () => void;
    actionText?: string;
  }>>([]);

  const showAlert = React.useCallback((
    type: SmartAlertType,
    message: string,
    title?: string,
    onAction?: () => void,
    actionText?: string
  ) => {
    const id = Math.random().toString(36).substr(2, 9);
    setAlerts(prev => [...prev, { 
      id, 
      type, 
      title, 
      message, 
      isVisible: true,
      onAction,
      actionText 
    }]);
    return id;
  }, []);

  const hideAlert = React.useCallback((id: string) => {
    setAlerts(prev =>
      prev.map(alert =>
        alert.id === id ? { ...alert, isVisible: false } : alert
      )
    );
    
    setTimeout(() => {
      setAlerts(prev => prev.filter(alert => alert.id !== id));
    }, 300);
  }, []);

  const success = React.useCallback((message: string, title?: string) => {
    return showAlert('success', message, title);
  }, [showAlert]);

  const error = React.useCallback((message: string, title?: string) => {
    return showAlert('error', message, title);
  }, [showAlert]);

  const warning = React.useCallback((message: string, title?: string) => {
    return showAlert('warning', message, title);
  }, [showAlert]);

  const info = React.useCallback((message: string, title?: string) => {
    return showAlert('info', message, title);
  }, [showAlert]);

  const reviewReminder = React.useCallback((
    message: string, 
    title: string = "📚 复习提醒",
    onAction?: () => void,
    actionText: string = "开始复习"
  ) => {
    return showAlert('review', message, title, onAction, actionText);
  }, [showAlert]);

  const streakAlert = React.useCallback((
    message: string,
    title: string = "🔥 连击提醒",
    onAction?: () => void,
    actionText: string = "继续连击"
  ) => {
    return showAlert('streak', message, title, onAction, actionText);
  }, [showAlert]);

  return {
    alerts,
    showAlert,
    hideAlert,
    success,
    error,
    warning,
    info,
    reviewReminder,
    streakAlert,
  };
};

// Smart Alert container component
export const SmartAlertContainer: React.FC = () => {
  const { alerts, hideAlert } = useSmartAlert();

  return (
    <div className="fixed top-0 right-0 z-50 p-4 space-y-2">
      {alerts.map((alert) => (
        <SmartAlert
          key={alert.id}
          type={alert.type}
          title={alert.title}
          message={alert.message}
          isVisible={alert.isVisible}
          onClose={() => hideAlert(alert.id)}
          onAction={alert.onAction}
          actionText={alert.actionText}
        />
      ))}
    </div>
  );
};