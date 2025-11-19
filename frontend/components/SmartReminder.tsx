'use client';

import React, { useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';
import { RootState } from '@/lib/store';
import { useGetDueQuestionsQuery, useGetOverdueQuestionsQuery } from '@/lib/store/questionsApi';
import { useSmartAlert } from '@/components/ui/SmartAlert';

interface SmartReminderProps {
  className?: string;
}

interface ReminderSchedule {
  lastReminderTime: number;
  reminderCount: number;
  lastActiveTime: number;
}

export const SmartReminder: React.FC<SmartReminderProps> = ({ className = '' }) => {
  const router = useRouter();
  const user = useSelector((state: RootState) => state.auth.user);
  const { data: dueQuestionsData } = useGetDueQuestionsQuery({ limit: 50 });
  const { data: overdueQuestionsData } = useGetOverdueQuestionsQuery();
  const { reviewReminder, streakAlert, info, warning } = useSmartAlert();

  // 获取本地存储的提醒状态
  const getReminderSchedule = useCallback((): ReminderSchedule => {
    if (typeof window === 'undefined') return { lastReminderTime: 0, reminderCount: 0, lastActiveTime: Date.now() };
    
    const stored = localStorage.getItem('smartReminder');
    return stored ? JSON.parse(stored) : { lastReminderTime: 0, reminderCount: 0, lastActiveTime: Date.now() };
  }, []);

  const setReminderSchedule = useCallback((schedule: ReminderSchedule) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('smartReminder', JSON.stringify(schedule));
    }
  }, []);

  // 智能复习提醒逻辑
  const checkForReviewReminders = useCallback(() => {
    const schedule = getReminderSchedule();
    const now = Date.now();
    const timeSinceLastReminder = now - schedule.lastReminderTime;
    const timeSinceLastActive = now - schedule.lastActiveTime;
    
    const dueCount = dueQuestionsData?.questions?.length || 0;
    const overdueCount = overdueQuestionsData?.questions?.length || 0;
    const totalReviewCount = dueCount + overdueCount;
    const currentStreak = user?.streak || 0;
    
    // 基本条件检查
    if (totalReviewCount === 0) return;
    
    // 智能提醒间隔计算（基于用户行为模式）
    const getNextReminderInterval = () => {
      const hourInMs = 60 * 60 * 1000;
      const baseInterval = 2 * hourInMs; // 基础间隔2小时
      
      // 根据连击数调整提醒频率
      if (currentStreak >= 10) return baseInterval * 0.8; // 高连击用户适当减少提醒
      if (currentStreak >= 5) return baseInterval;
      if (currentStreak >= 1) return baseInterval * 1.2;
      return baseInterval * 1.5; // 新用户或低连击用户增加提醒
    };

    const reminderInterval = getNextReminderInterval();
    
    // 检查是否应该发送提醒
    if (timeSinceLastReminder < reminderInterval) return;
    
    // 避免过度提醒（一天最多3次）
    const oneDayInMs = 24 * 60 * 60 * 1000;
    if (now - schedule.lastReminderTime < oneDayInMs && schedule.reminderCount >= 3) {
      return;
    }

    // 生成智能提醒消息（增强艾宾浩斯逻辑）
    const generateReminderMessage = () => {
      const timeOfDay = new Date().getHours();
      let timeGreeting = '';
      if (timeOfDay < 12) timeGreeting = '早上好';
      else if (timeOfDay < 18) timeGreeting = '下午好';
      else timeGreeting = '晚上好';

      // 1. 最高优先级：逾期题目（违反艾宾浩斯曲线）
      if (overdueCount > 0) {
        const daysSinceOverdue = Math.max(
          ...overdueQuestionsData?.questions?.map(q => {
            const nextReview = new Date(q.review_schedule?.next_review_date || q.created_at);
            return Math.floor((Date.now() - nextReview.getTime()) / (1000 * 60 * 60 * 24));
          }) || [0]
        );

        return {
          title: `🚨 艾宾浩斯复习紧急提醒`,
          message: `${timeGreeting}！您有 ${overdueCount} 道错题已逾期 ${daysSinceOverdue} 天，${dueCount} 道题到期复习。根据艾宾浩斯遗忘曲线，及时复习能大幅提升记忆效果！`,
        };
      }

      // 2. 高优先级：今天到期的题目（艾宾浩斯关键节点）
      const todayDueCount = dueQuestionsData?.questions?.filter(q => {
        const nextReview = new Date(q.review_schedule?.next_review_date || q.created_at);
        const today = new Date();
        return nextReview.toDateString() === today.toDateString();
      }).length || 0;

      if (todayDueCount > 0) {
        return {
          title: `⏰ 艾宾浩斯最佳复习时机`,
          message: `${timeGreeting}！今天有 ${todayDueCount} 道题到达最佳复习时间点。根据遗忘曲线，现在复习效果最佳，记忆保持率可达90%以上！`,
        };
      }

      // 3. 中优先级：批量复习建议
      if (totalReviewCount >= 20) {
        const newQuestions = dueQuestionsData?.questions?.filter(q => 
          (q.review_schedule?.repetition_count || 0) === 0
        ).length || 0;
        
        return {
          title: `🎯 智能复习建议`,
          message: `${timeGreeting}！累积了 ${totalReviewCount} 道题目待复习（${newQuestions} 道新题）。建议分批进行：新题10-15道，复习题10-15道，符合认知负荷理论！`,
        };
      }

      // 4. 一般优先级：常规复习提醒
      if (totalReviewCount >= 10) {
        const easyCount = dueQuestionsData?.questions?.filter(q => 
          (q.review_schedule?.ease_factor || 2.5) >= 2.8
        ).length || 0;

        return {
          title: `📚 智能复习计划`,
          message: `${timeGreeting}！您有 ${totalReviewCount} 道题待复习，其中 ${easyCount} 道题掌握良好。建议先复习难题，再巩固易题，效率更高！`,
        };
      }

      // 5. 低优先级：保持学习节奏
      const masteredCount = dueQuestionsData?.questions?.filter(q => 
        q.review_schedule?.is_mastered
      ).length || 0;

      return {
        title: `💪 保持学习节奏`,
        message: `${timeGreeting}！还有 ${totalReviewCount} 道题等待复习${masteredCount > 0 ? `（${masteredCount} 道即将掌握）` : ''}。坚持艾宾浩斯复习法，记忆效果更持久！`,
      };
    };

    const { title, message } = generateReminderMessage();
    
    // 发送智能提醒
    reviewReminder(
      message,
      title,
      () => router.push('/review'),
      '立即复习'
    );

    // 更新提醒状态
    setReminderSchedule({
      lastReminderTime: now,
      reminderCount: schedule.reminderCount + 1,
      lastActiveTime: schedule.lastActiveTime,
    });
  }, [dueQuestionsData, user, reviewReminder, router, getReminderSchedule, setReminderSchedule]);

  // 连击保护提醒
  const checkStreakProtection = useCallback(() => {
    const schedule = getReminderSchedule();
    const now = Date.now();
    const timeSinceLastActive = now - schedule.lastActiveTime;
    const currentStreak = user?.streak || 0;
    
    // 只有当前有连击时才提醒
    if (currentStreak === 0) return;
    
    const hoursInactive = timeSinceLastActive / (1000 * 60 * 60);
    
    // 根据连击长度调整保护提醒
    let warningThreshold = 12; // 默认12小时无活动提醒
    if (currentStreak >= 20) warningThreshold = 8;  // 高连击用户8小时提醒
    else if (currentStreak >= 10) warningThreshold = 10; // 中等连击10小时提醒
    
    if (hoursInactive >= warningThreshold) {
      const totalReviewCount = (dueQuestionsData?.questions?.length || 0) + (overdueQuestionsData?.questions?.length || 0);
      const overdueCount = overdueQuestionsData?.questions?.length || 0;
      
      let alertMessage = `您已经 ${Math.floor(hoursInactive)} 小时没有学习了！当前连击 ${currentStreak} 次`;
      let actionPath = '/questions';
      let actionText = '添加题目';
      
      if (overdueCount > 0) {
        alertMessage += `，有 ${overdueCount} 道错题已逾期，${totalReviewCount - overdueCount} 道题待复习`;
        actionPath = '/review';
        actionText = '立即复习';
      } else if (totalReviewCount > 0) {
        alertMessage += `，还有 ${totalReviewCount} 道题待复习`;
        actionPath = '/review';
        actionText = '开始复习';  
      } else {
        alertMessage += '，快来添加新题目';
      }
      
      alertMessage += '，保持连击吧！';
      
      streakAlert(
        alertMessage,
        '🔥 连击保护提醒',
        () => router.push(actionPath),
        actionText
      );
      
      // 重置活动时间避免重复提醒
      setReminderSchedule({
        ...schedule,
        lastActiveTime: now,
      });
    }
  }, [user, dueQuestionsData, streakAlert, router, getReminderSchedule, setReminderSchedule]);

  // 学习建议提醒
  const checkLearningAdvice = useCallback(() => {
    const now = new Date();
    const hour = now.getHours();
    const dayOfWeek = now.getDay();
    const dueCount = dueQuestionsData?.questions?.length || 0;
    const overdueCount = overdueQuestionsData?.questions?.length || 0;
    const totalReviewCount = dueCount + overdueCount;
    
    // 周末学习建议（包含错题复习）
    if ((dayOfWeek === 0 || dayOfWeek === 6) && totalReviewCount > 0 && hour >= 9 && hour <= 11) {
      const schedule = getReminderSchedule();
      const lastWeekendReminder = localStorage.getItem('lastWeekendReminder');
      const today = now.toDateString();
      
      if (lastWeekendReminder !== today) {
        let message = '周末是巩固学习的好时机！';
        
        if (overdueCount > 0) {
          message += `建议优先处理 ${overdueCount} 道逾期错题，然后复习 ${Math.min(dueCount, 8)} 道待复习题目。`;
        } else {
          message += `建议利用上午时光复习 ${Math.min(totalReviewCount, 10)} 道题目。`;
        }
        
        message += '艾宾浩斯复习法让周末学习更高效，为新的一周做好准备！';
        
        info(message, '📅 周末学习建议');
        localStorage.setItem('lastWeekendReminder', today);
      }
    }
    
    // 新增：晚间复习建议（艾宾浩斯最佳时间）
    if (hour >= 19 && hour <= 21 && totalReviewCount > 0) {
      const lastEveningReminder = localStorage.getItem('lastEveningReminder');
      const today = now.toDateString();
      
      if (lastEveningReminder !== today) {
        const todayDueCount = dueQuestionsData?.questions?.filter(q => {
          const nextReview = new Date(q.review_schedule?.next_review_date || q.created_at);
          return nextReview.toDateString() === today;
        }).length || 0;
        
        if (todayDueCount > 0) {
          info(
            `晚间是记忆巩固的黄金时段！今天还有 ${todayDueCount} 道题到期复习${overdueCount > 0 ? `，${overdueCount} 道逾期题目` : ''}。睡前复习有助于记忆整合。`,
            '🌙 晚间复习提醒'
          );
          localStorage.setItem('lastEveningReminder', today);
        }
      }
    }
  }, [dueQuestionsData, overdueQuestionsData, info, getReminderSchedule]);

  // 主要效果 Hook - 定期检查提醒
  useEffect(() => {
    if (!user || (!dueQuestionsData && !overdueQuestionsData)) return;

    const checkReminders = () => {
      checkForReviewReminders();
      checkStreakProtection();
      checkLearningAdvice();
    };

    // 立即检查一次
    const initialTimeout = setTimeout(checkReminders, 3000);
    
    // 每30分钟检查一次
    const interval = setInterval(checkReminders, 30 * 60 * 1000);

    return () => {
      clearTimeout(initialTimeout);
      clearInterval(interval);
    };
  }, [user, dueQuestionsData, checkForReviewReminders, checkStreakProtection, checkLearningAdvice]);

  // 用户活动跟踪
  useEffect(() => {
    const updateLastActiveTime = () => {
      const schedule = getReminderSchedule();
      setReminderSchedule({
        ...schedule,
        lastActiveTime: Date.now(),
      });
    };

    // 监听用户交互
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    
    let activityTimeout: NodeJS.Timeout;
    const handleActivity = () => {
      clearTimeout(activityTimeout);
      activityTimeout = setTimeout(updateLastActiveTime, 10000); // 10秒无活动后更新
    };

    events.forEach(event => {
      document.addEventListener(event, handleActivity, true);
    });

    return () => {
      clearTimeout(activityTimeout);
      events.forEach(event => {
        document.removeEventListener(event, handleActivity, true);
      });
    };
  }, [getReminderSchedule, setReminderSchedule]);

  // 这个组件不渲染任何可见内容
  return null;
};

export default SmartReminder;