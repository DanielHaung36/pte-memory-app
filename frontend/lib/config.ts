// 统一的端口配置
export const API_CONFIG = {
  // 后端服务端口 - 统一配置点
  BACKEND_PORT: '8080',
  
  // 自动生成的URL配置
  get BACKEND_URL() {
    return process.env.NODE_ENV === 'development' 
      ? `http://localhost:${this.BACKEND_PORT}`
      : '';
  },
  
  get API_BASE_URL() {
    return process.env.NODE_ENV === 'development'
      ? `${this.BACKEND_URL}/api`
      : '/api';
  },
  
  get AUTH_API_URL() {
    return `${this.API_BASE_URL}/auth`;
  },
  
  get WEBSOCKET_URL() {
    return process.env.NODE_ENV === 'development'
      ? `ws://localhost:${this.BACKEND_PORT}/ws`
      : `${typeof window !== 'undefined' ? (window.location.protocol === 'https:' ? 'wss:' : 'ws:') : 'ws:'}//${typeof window !== 'undefined' ? window.location.host : ''}/ws`;
  }
} as const;

// 导出便捷的常量
export const { BACKEND_PORT, BACKEND_URL, API_BASE_URL, AUTH_API_URL, WEBSOCKET_URL } = API_CONFIG;