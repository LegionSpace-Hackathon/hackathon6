import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { RootState } from '../stores';
import { logout } from '../stores/slices/authSlice';
import { redirectToLogin } from '../utils/loginUtils';

/**
 * 认证相关Hook
 */
export const useAuth = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user, token, loading } = useSelector((state: RootState) => state.auth);
  
  // 检查是否已登录
  const isLoggedIn = Boolean(user && token);
  
  // 登出
  const handleLogout = () => {
    dispatch(logout());
    navigate('/', { replace: true });
  };
  
  // 要求登录
  const requireLogin = (currentPath?: string, params?: Record<string, any>) => {
    if (!isLoggedIn) {
      redirectToLogin(navigate, currentPath, params);
      return false;
    }
    return true;
  };
  
  // 检查权限
  const hasPermission = (permission: string) => {
    if (!user || !user.permissions) {
      return false;
    }
    return user.permissions.includes(permission);
  };
  
  // 检查角色
  const hasRole = (role: string) => {
    if (!user) {
      return false;
    }
    return user.role === role;
  };
  
  return {
    user,
    token,
    loading,
    isLoggedIn,
    handleLogout,
    requireLogin,
    hasPermission,
    hasRole
  };
};

export default useAuth;
