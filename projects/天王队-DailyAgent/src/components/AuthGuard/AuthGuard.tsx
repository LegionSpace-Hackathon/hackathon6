import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from '../../stores/hooks';
import { restoreToSavedPage, clearPageState, clearLoginRedirectConfig } from '../../stores/slices/authSlice';

interface AuthGuardProps {
  children: React.ReactNode;
}

/**
 * 认证守卫组件
 * 处理登录后的页面恢复逻辑
 */
const AuthGuard: React.FC<AuthGuardProps> = ({ children }) => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { isAuthenticated, shouldRestorePageState, loginRedirectConfig } = useAppSelector(state => state.auth);

  useEffect(() => {
    if (isAuthenticated) {
      // 登录成功后的跳转处理
      const timer = setTimeout(() => {
        // 优先处理自定义跳转配置
        if (loginRedirectConfig?.path) {
          console.log('执行自定义跳转:', loginRedirectConfig.path);
          if (loginRedirectConfig.replace) {
            navigate(loginRedirectConfig.path, { replace: true });
          } else {
            navigate(loginRedirectConfig.path);
          }
          // 清除跳转配置
          dispatch(clearLoginRedirectConfig());
        } else if (shouldRestorePageState) {
          // 如果没有自定义跳转，则恢复页面状态
          console.log('恢复页面状态');
          dispatch(restoreToSavedPage());
        }
        
        // 清除可能残留的页面状态
        if (!shouldRestorePageState) {
          dispatch(clearPageState());
        }
      }, 200);
      
      return () => clearTimeout(timer);
    }
  }, [isAuthenticated, shouldRestorePageState, loginRedirectConfig, dispatch, navigate]);

  return <>{children}</>;
};

export default AuthGuard; 