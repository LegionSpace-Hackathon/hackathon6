import { NavigateFunction } from 'react-router-dom';

/**
 * 登录工具函数
 */

// 跳转到登录页面，支持返回原页面和传递参数
export const redirectToLogin = (
  navigate: NavigateFunction,
  currentPath?: string,
  params?: Record<string, any>
) => {
  const redirectUrl = currentPath || window.location.pathname;
  const searchParams = new URLSearchParams();
  
  // 添加重定向URL
  searchParams.set('redirect', redirectUrl);
  
  // 如果有参数，将其序列化并添加到URL中
  if (params && Object.keys(params).length > 0) {
    searchParams.set('params', encodeURIComponent(JSON.stringify(params)));
  }
  
  // 保存当前页面的查询参数
  const currentSearch = window.location.search;
  if (currentSearch) {
    searchParams.set('originalSearch', encodeURIComponent(currentSearch));
  }
  
  navigate(`/login?${searchParams.toString()}`);
};

// 从URL中解析重定向信息
export const parseRedirectInfo = (searchParams: URLSearchParams) => {
  const redirectUrl = searchParams.get('redirect') || '/';
  const paramsStr = searchParams.get('params');
  const originalSearch = searchParams.get('originalSearch');
  
  let params: Record<string, any> = {};
  if (paramsStr) {
    try {
      params = JSON.parse(decodeURIComponent(paramsStr));
    } catch (e) {
      console.warn('解析重定向参数失败:', e);
    }
  }
  
  return {
    redirectUrl,
    params,
    originalSearch: originalSearch ? decodeURIComponent(originalSearch) : ''
  };
};

// 构建最终的重定向URL
export const buildRedirectUrl = (
  baseUrl: string,
  params?: Record<string, any>,
  originalSearch?: string
) => {
  let targetUrl = baseUrl;
  
  // 添加原始查询参数
  if (originalSearch) {
    targetUrl += originalSearch;
  }
  
  // 添加额外参数
  if (params && Object.keys(params).length > 0) {
    const urlParams = new URLSearchParams(params);
    const separator = targetUrl.includes('?') ? '&' : '?';
    targetUrl += separator + urlParams.toString();
  }
  
  return targetUrl;
};

// 检查是否需要登录
export const checkLoginRequired = () => {
  // 这里可以添加检查用户登录状态的逻辑
  const token = localStorage.getItem('token') || sessionStorage.getItem('token');
  return !token;
};

// 保存登录前的页面状态
export const savePageState = (path: string, state?: any) => {
  const pageState = {
    path,
    state,
    timestamp: Date.now()
  };
  sessionStorage.setItem('loginRedirectState', JSON.stringify(pageState));
};

// 获取登录前的页面状态
export const getPageState = () => {
  const stateStr = sessionStorage.getItem('loginRedirectState');
  if (stateStr) {
    try {
      const pageState = JSON.parse(stateStr);
      // 清除状态，避免重复使用
      sessionStorage.removeItem('loginRedirectState');
      return pageState;
    } catch (e) {
      console.warn('解析页面状态失败:', e);
    }
  }
  return null;
};

// 登录成功后的处理
export const handleLoginSuccess = (
  navigate: NavigateFunction,
  searchParams: URLSearchParams,
  defaultRedirect = '/'
) => {
  const { redirectUrl, params, originalSearch } = parseRedirectInfo(searchParams);
  const finalUrl = buildRedirectUrl(redirectUrl, params, originalSearch);
  
  // 获取保存的页面状态
  const pageState = getPageState();
  
  navigate(finalUrl, { 
    replace: true,
    state: pageState?.state
  });
};

export default {
  redirectToLogin,
  parseRedirectInfo,
  buildRedirectUrl,
  checkLoginRequired,
  savePageState,
  getPageState,
  handleLoginSuccess
};
