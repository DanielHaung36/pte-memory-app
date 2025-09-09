import { configureStore } from '@reduxjs/toolkit'
import { setupListeners } from '@reduxjs/toolkit/query'
import { questionsApi } from './questionsApi'
import { authApi } from './authApi'
import { wrongQuestionsApi } from './wrongQuestionsApi'
import { gamesApi } from './gamesApi'
import questionsReducer from './questionsSlice'
import authReducer from './authSlice'
import reviewReducer from './reviewSlice'

export const store = configureStore({
  reducer: {
    [questionsApi.reducerPath]: questionsApi.reducer,
    [authApi.reducerPath]: authApi.reducer,
    [wrongQuestionsApi.reducerPath]: wrongQuestionsApi.reducer,
    [gamesApi.reducerPath]: gamesApi.reducer,
    questions: questionsReducer,
    auth: authReducer,
    review: reviewReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
      },
    }).concat(questionsApi.middleware, authApi.middleware, wrongQuestionsApi.middleware, gamesApi.middleware),
})

setupListeners(store.dispatch)

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch