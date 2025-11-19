import { configureStore } from '@reduxjs/toolkit'
import { setupListeners } from '@reduxjs/toolkit/query'
import { questionsApi } from './questionsApi'
import { authApi } from './authApi'
import { userApi } from './userApi'
import { wrongQuestionsApi } from './wrongQuestionsApi'
import { gamesApi } from './gamesApi'
import { analyticsApi } from './analyticsApi'
import { socialApi } from './socialApi'
import { shopApi } from './shopApi'
// import { knowledgeApi } from './knowledgeApi' // DEPRECATED - 知识图谱功能已移除
import { uploadApi } from './uploadApi'
import { examApi } from './examApi'
import { libraryApi } from './libraryApi'
import { notificationApi } from './notificationApi'
import { chatApi } from './chatApi'
import { studyGroupApi } from './studyGroupApi'
import { advertisingApi } from './advertisingApi'
import { pushApi } from './pushApi'
import { adminApi } from './adminApi'
import { importApi } from './importApi'
import { commentsApi } from './commentsApi'
import { pteApi } from './pteApi'
import questionsReducer from './questionsSlice'
import authReducer from './authSlice'
import reviewReducer from './reviewSlice'

export const store = configureStore({
  reducer: {
    [questionsApi.reducerPath]: questionsApi.reducer,
    [authApi.reducerPath]: authApi.reducer,
    [userApi.reducerPath]: userApi.reducer,
    [wrongQuestionsApi.reducerPath]: wrongQuestionsApi.reducer,
    [gamesApi.reducerPath]: gamesApi.reducer,
    [analyticsApi.reducerPath]: analyticsApi.reducer,
    [socialApi.reducerPath]: socialApi.reducer,
    [shopApi.reducerPath]: shopApi.reducer,
    // [knowledgeApi.reducerPath]: knowledgeApi.reducer, // DEPRECATED
    [uploadApi.reducerPath]: uploadApi.reducer,
    [examApi.reducerPath]: examApi.reducer,
    [libraryApi.reducerPath]: libraryApi.reducer,
    [notificationApi.reducerPath]: notificationApi.reducer,
    [chatApi.reducerPath]: chatApi.reducer,
    [studyGroupApi.reducerPath]: studyGroupApi.reducer,
    [advertisingApi.reducerPath]: advertisingApi.reducer,
    [pushApi.reducerPath]: pushApi.reducer,
    [adminApi.reducerPath]: adminApi.reducer,
    [importApi.reducerPath]: importApi.reducer,
    [commentsApi.reducerPath]: commentsApi.reducer,
    [pteApi.reducerPath]: pteApi.reducer,
    questions: questionsReducer,
    auth: authReducer,
    review: reviewReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
      },
    }).concat(
      questionsApi.middleware,
      authApi.middleware,
      userApi.middleware,
      wrongQuestionsApi.middleware,
      gamesApi.middleware,
      analyticsApi.middleware,
      socialApi.middleware,
      shopApi.middleware,
      // knowledgeApi.middleware, // DEPRECATED
      uploadApi.middleware,
      examApi.middleware,
      libraryApi.middleware,
      notificationApi.middleware,
      chatApi.middleware,
      studyGroupApi.middleware,
      advertisingApi.middleware,
      pushApi.middleware,
      adminApi.middleware,
      importApi.middleware,
      commentsApi.middleware,
      pteApi.middleware
    ),
})

setupListeners(store.dispatch)

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch