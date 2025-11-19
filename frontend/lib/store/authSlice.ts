import { createSlice, PayloadAction } from '@reduxjs/toolkit'

interface User {
  id: string
  username: string
  email: string
  level: number
  xp: number
  streak: number
  best_streak: number
  created_at: string
  updated_at: string
  avatar?: string
}

interface AuthState {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
}

const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  isLoading: false,
}

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (state, action: PayloadAction<{ user: User }>) => {
      const { user } = action.payload
      state.user = user
      state.isAuthenticated = true
      // No longer storing in localStorage
    },
    
    logout: (state) => {
      state.user = null
      state.isAuthenticated = false
      // No longer removing from localStorage
    },
    
    updateUser: (state, action: PayloadAction<Partial<User>>) => {
      if (state.user) {
        state.user = { ...state.user, ...action.payload }
        // No longer storing in localStorage
      }
    },
    
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload
    },
    
    // Remove initializeAuth since we'll use /me endpoint instead
  },
})

export const { 
  setCredentials, 
  logout, 
  updateUser, 
  setLoading
} = authSlice.actions

// 为了向后兼容，导出clearCredentials别名
export const clearCredentials = logout
export default authSlice.reducer