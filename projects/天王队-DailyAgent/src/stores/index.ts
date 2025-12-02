import { configureStore } from '@reduxjs/toolkit';
import { createPerformanceMiddleware } from '../monitoring/reduxMonitor';
import i18nReducer, { I18nState } from './slices/i18nSlice';
import authReducer, { AuthState } from './slices/authSlice';
import themeReducer, { ThemeState } from './slices/themeSlice';

// 定义根状态类型
export interface RootState {
  i18n: I18nState;
  auth: AuthState;
  theme: ThemeState;
}

// 创建性能监控中间件
const performanceMiddleware = createPerformanceMiddleware();

export const store = configureStore({
  reducer: {
    i18n: i18nReducer,
    auth: authReducer,
    theme: themeReducer,
  },
  middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(performanceMiddleware),
  devTools: process.env.NODE_ENV !== 'production',
});

// 从store本身推断类型
export type AppDispatch = typeof store.dispatch;
