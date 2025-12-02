import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';
import type { RootState, AppDispatch } from './index';

// 导出带类型的钩子以便在整个应用中使用
export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;

// 选择语言
export const selectLanguage = (state: RootState) => state.i18n.lang;

// 以下选择器暂时返回默认值，因为当前Auth状态简化
export const selectUser = (state: RootState) => null; // 不再使用state.auth.user
export const selectIsAuthenticated = (state: RootState) => state.auth.isAuthenticated;
export const selectAuthLoading = (state: RootState) => false; // 不再使用state.auth.loading
export const selectAuthError = (state: RootState) => null; // 不再使用state.auth.error

export const selectI18n = (state: RootState) => state.i18n;
export const selectAuth = (state: RootState) => state.auth; 