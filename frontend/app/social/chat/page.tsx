"use client";

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MessageCircle,
  Send,
  Search,
  Phone,
  Video,
  MoreVertical,
  Smile,
  Paperclip,
  Image,
  Mic,
  Check,
  CheckCheck,
  Users,
  Plus,
  Archive,
  Star,
  Settings,
  Circle,
  Clock
} from 'lucide-react';
import AppNavigation from '@/components/ui/navigation/AppNavigation';

interface ChatMessage {
  id: string;
  senderId: string;
  content: string;
  timestamp: string;
  type: 'text' | 'image' | 'audio' | 'study_share';
  isRead: boolean;
  studyData?: {
    questionsCompleted: number;
    accuracy: number;
    subject: string;
  };
}

interface ChatConversation {
  id: string;
  participant: {
    id: string;
    username: string;
    avatar?: string;
    status: 'online' | 'offline' | 'studying';
    lastOnline: string;
  };
  lastMessage: ChatMessage;
  unreadCount: number;
  isPinned: boolean;
  isArchived: boolean;
  messages: ChatMessage[];
}

const mockConversations: ChatConversation[] = [
  {
    id: '1',
    participant: {
      id: 'user1',
      username: '李明',
      status: 'online',
      lastOnline: '2025-01-10T15:30:00'
    },
    lastMessage: {
      id: 'msg1',
      senderId: 'user1',
      content: '今天的口语练习感觉怎么样？',
      timestamp: '2025-01-10T15:25:00',
      type: 'text',
      isRead: false
    },
    unreadCount: 2,
    isPinned: true,
    isArchived: false,
    messages: [
      {
        id: 'msg1',
        senderId: 'user1',
        content: '今天的口语练习感觉怎么样？',
        timestamp: '2025-01-10T15:25:00',
        type: 'text',
        isRead: false
      },
      {
        id: 'msg2',
        senderId: 'me',
        content: '还不错，就是在Read Aloud部分还需要多练习',
        timestamp: '2025-01-10T15:20:00',
        type: 'text',
        isRead: true
      },
      {
        id: 'msg3',
        senderId: 'user1',
        content: '我也是！要不我们明天一起练习？',
        timestamp: '2025-01-10T15:15:00',
        type: 'text',
        isRead: true
      }
    ]
  },
  {
    id: '2',
    participant: {
      id: 'user2',
      username: 'Sarah Chen',
      status: 'studying',
      lastOnline: '2025-01-10T14:45:00'
    },
    lastMessage: {
      id: 'msg4',
      senderId: 'user2',
      content: '分享了学习记录',
      timestamp: '2025-01-10T14:00:00',
      type: 'study_share',
      isRead: true,
      studyData: {
        questionsCompleted: 25,
        accuracy: 89,
        subject: 'IELTS Writing'
      }
    },
    unreadCount: 0,
    isPinned: false,
    isArchived: false,
    messages: [
      {
        id: 'msg4',
        senderId: 'user2',
        content: '今天写作练习效果很好！',
        timestamp: '2025-01-10T14:00:00',
        type: 'study_share',
        isRead: true,
        studyData: {
          questionsCompleted: 25,
          accuracy: 89,
          subject: 'IELTS Writing'
        }
      }
    ]
  },
  {
    id: '3',
    participant: {
      id: 'user3',
      username: '王小华',
      status: 'offline',
      lastOnline: '2025-01-09T20:30:00'
    },
    lastMessage: {
      id: 'msg5',
      senderId: 'me',
      content: '好的，那我们明天见！',
      timestamp: '2025-01-09T19:15:00',
      type: 'text',
      isRead: true
    },
    unreadCount: 0,
    isPinned: false,
    isArchived: false,
    messages: [
      {
        id: 'msg5',
        senderId: 'me',
        content: '好的，那我们明天见！',
        timestamp: '2025-01-09T19:15:00',
        type: 'text',
        isRead: true
      }
    ]
  }
];

export default function ChatPage() {
  const [conversations, setConversations] = useState<ChatConversation[]>(mockConversations);
  const [selectedChat, setSelectedChat] = useState<ChatConversation | null>(conversations[0]);
  const [newMessage, setNewMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [selectedChat?.messages]);

  const filteredConversations = conversations.filter(conv =>
    conv.participant.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'bg-green-500';
      case 'studying': return 'bg-blue-500 animate-pulse';
      case 'offline': return 'bg-gray-400';
      default: return 'bg-gray-400';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'online': return '在线';
      case 'studying': return '学习中';
      case 'offline': return '离线';
      default: return '';
    }
  };

  const formatMessageTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return '刚刚';
    if (diffInMinutes < 60) return `${diffInMinutes}分钟前`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}小时前`;
    
    return date.toLocaleDateString('zh-CN', { 
      month: 'numeric', 
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric'
    });
  };

  const handleSendMessage = () => {
    if (!newMessage.trim() || !selectedChat) return;

    const newMsg: ChatMessage = {
      id: Date.now().toString(),
      senderId: 'me',
      content: newMessage,
      timestamp: new Date().toISOString(),
      type: 'text',
      isRead: false
    };

    setConversations(conversations.map(conv => {
      if (conv.id === selectedChat.id) {
        return {
          ...conv,
          messages: [...conv.messages, newMsg],
          lastMessage: newMsg
        };
      }
      return conv;
    }));

    setSelectedChat({
      ...selectedChat,
      messages: [...selectedChat.messages, newMsg],
      lastMessage: newMsg
    });

    setNewMessage('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-50 via-white to-blue-50">
      <AppNavigation />
      
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center space-x-3 mb-4"
          >
            <div className="p-3 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-2xl shadow-lg">
              <MessageCircle className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent">
              私聊消息
            </h1>
          </motion.div>
          
          <p className="text-gray-600 mb-6">
            与学习伙伴实时交流，分享学习心得和疑问
          </p>
        </div>

        {/* Chat Container */}
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
          <div className="flex h-[700px]">
            {/* Conversations List */}
            <div className="w-1/3 border-r border-gray-100 flex flex-col">
              {/* Search */}
              <div className="p-4 border-b border-gray-100">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <input
                    type="text"
                    placeholder="搜索对话..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-cyan-500 focus:border-transparent bg-white/80"
                  />
                </div>
              </div>

              {/* Conversation List */}
              <div className="flex-1 overflow-y-auto">
                {filteredConversations.map((conversation) => (
                  <motion.div
                    key={conversation.id}
                    whileHover={{ backgroundColor: 'rgba(6, 182, 212, 0.05)' }}
                    onClick={() => setSelectedChat(conversation)}
                    className={`p-4 border-b border-gray-50 cursor-pointer transition-colors ${
                      selectedChat?.id === conversation.id ? 'bg-cyan-50' : ''
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="relative">
                        <div className="w-12 h-12 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full flex items-center justify-center">
                          <span className="text-white font-bold text-lg">
                            {conversation.participant.username[0]}
                          </span>
                        </div>
                        <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${getStatusColor(conversation.participant.status)}`}></div>
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h3 className="font-semibold text-gray-900 truncate">
                            {conversation.participant.username}
                          </h3>
                          <div className="flex items-center space-x-2">
                            {conversation.isPinned && (
                              <Star className="h-3 w-3 text-yellow-500 fill-current" />
                            )}
                            <span className="text-xs text-gray-500">
                              {formatMessageTime(conversation.lastMessage.timestamp)}
                            </span>
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between mt-1">
                          <p className="text-sm text-gray-600 truncate">
                            {conversation.lastMessage.type === 'study_share' 
                              ? '分享了学习记录' 
                              : conversation.lastMessage.content
                            }
                          </p>
                          {conversation.unreadCount > 0 && (
                            <div className="bg-cyan-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                              {conversation.unreadCount}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Chat Area */}
            <div className="flex-1 flex flex-col">
              {selectedChat ? (
                <>
                  {/* Chat Header */}
                  <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="relative">
                        <div className="w-10 h-10 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full flex items-center justify-center">
                          <span className="text-white font-bold">
                            {selectedChat.participant.username[0]}
                          </span>
                        </div>
                        <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border border-white ${getStatusColor(selectedChat.participant.status)}`}></div>
                      </div>
                      
                      <div>
                        <h3 className="font-semibold text-gray-900">
                          {selectedChat.participant.username}
                        </h3>
                        <p className="text-sm text-gray-500">
                          {getStatusText(selectedChat.participant.status)}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <button className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                        <Phone className="h-4 w-4" />
                      </button>
                      <button className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                        <Video className="h-4 w-4" />
                      </button>
                      <button className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                        <MoreVertical className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  {/* Messages */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {selectedChat.messages.map((message) => (
                      <motion.div
                        key={message.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`flex ${message.senderId === 'me' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl ${
                          message.senderId === 'me' 
                            ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white' 
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {message.type === 'study_share' && message.studyData ? (
                            <div className="space-y-2">
                              <p className="text-sm font-medium">
                                {message.senderId === 'me' ? '我' : selectedChat.participant.username} 分享了学习记录
                              </p>
                              <div className="bg-white/20 rounded-lg p-3 text-xs">
                                <div className="grid grid-cols-2 gap-2">
                                  <div>题目: {message.studyData.questionsCompleted}</div>
                                  <div>准确率: {message.studyData.accuracy}%</div>
                                  <div className="col-span-2">科目: {message.studyData.subject}</div>
                                </div>
                              </div>
                            </div>
                          ) : (
                            <p>{message.content}</p>
                          )}
                          
                          <div className={`flex items-center justify-end space-x-1 mt-1 text-xs ${
                            message.senderId === 'me' ? 'text-white/70' : 'text-gray-500'
                          }`}>
                            <span>{formatMessageTime(message.timestamp)}</span>
                            {message.senderId === 'me' && (
                              message.isRead ? (
                                <CheckCheck className="h-3 w-3" />
                              ) : (
                                <Check className="h-3 w-3" />
                              )
                            )}
                          </div>
                        </div>
                      </motion.div>
                    ))}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Message Input */}
                  <div className="p-4 border-t border-gray-100">
                    <div className="flex items-center space-x-3">
                      <button className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                        <Paperclip className="h-4 w-4" />
                      </button>
                      <button className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                        <Image className="h-4 w-4" />
                      </button>
                      <button className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                        <Mic className="h-4 w-4" />
                      </button>
                      
                      <div className="flex-1 relative">
                        <textarea
                          value={newMessage}
                          onChange={(e) => setNewMessage(e.target.value)}
                          onKeyPress={handleKeyPress}
                          placeholder="输入消息..."
                          rows={1}
                          className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-cyan-500 focus:border-transparent bg-white/80 resize-none"
                        />
                      </div>
                      
                      <button className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                        <Smile className="h-4 w-4" />
                      </button>
                      
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={handleSendMessage}
                        disabled={!newMessage.trim()}
                        className={`p-2 rounded-lg transition-all ${
                          newMessage.trim() 
                            ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-lg' 
                            : 'bg-gray-200 text-gray-400'
                        }`}
                      >
                        <Send className="h-4 w-4" />
                      </motion.button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <MessageCircle className="h-8 w-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      选择一个对话
                    </h3>
                    <p className="text-gray-600">
                      选择左侧的对话开始聊天
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Empty State */}
        {filteredConversations.length === 0 && (
          <div className="text-center py-12 mt-8">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <MessageCircle className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              还没有对话
            </h3>
            <p className="text-gray-600 mb-6">
              开始与学习伙伴聊天，分享学习心得
            </p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="bg-gradient-to-r from-cyan-500 to-blue-500 text-white px-6 py-3 rounded-xl font-medium shadow-lg hover:shadow-xl transition-all flex items-center space-x-2 mx-auto"
            >
              <Plus className="h-5 w-5" />
              <span>开始新对话</span>
            </motion.button>
          </div>
        )}
      </div>
    </div>
  );
}