import axios from 'axios'
import { API_CONFIG } from './config'

const axiosInstance = axios.create({
  baseURL: API_CONFIG.API_BASE_URL,
  timeout: 10000,
  withCredentials: true, // Include cookies in requests
})

// Request interceptor (no longer needed for token management)
axiosInstance.interceptors.request.use(
  (config) => {
    // Token is now handled automatically via HTTP-only cookies
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor to handle errors
axiosInstance.interceptors.response.use(
  (response) => {
    return response
  },
  (error) => {
    if (error.response?.status === 401) {
      // No need to remove localStorage items since we're using HTTP-only cookies
      // Cookie will be cleared by server logout endpoint
      window.location.href = '/auth/login'
    }
    return Promise.reject(error)
  }
)

export default axiosInstance