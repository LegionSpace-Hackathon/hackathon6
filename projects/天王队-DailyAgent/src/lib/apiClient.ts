import axios, { AxiosInstance, InternalAxiosRequestConfig, AxiosResponse } from 'axios';
import i18n from '../i18n';
import { store } from '../stores';
import { selectLanguage } from '../stores/slices/i18nSlice';
import { setLoginModalVisible, clearAuth, triggerSavePageState } from '../stores/slices/authSlice';
import { shouldSavePageState } from '../utils/pageStateManager';

// 从环境变量获取API基础URL
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

// 防重复处理的标记和时间戳
let isHandlingTokenExpired = false;
let lastTokenExpiredTime = 0;
const TOKEN_EXPIRED_DEBOUNCE_TIME = 1000; // 1秒内不重复处理

/**
 * 处理token过期的统一逻辑（带防重复机制）
 */
const handleTokenExpired = () => {
  const now = Date.now();

  // 防重复处理：如果正在处理中或者1秒内已经处理过，则跳过
  if (isHandlingTokenExpired || (now - lastTokenExpiredTime) < TOKEN_EXPIRED_DEBOUNCE_TIME) {
    console.log('Token过期处理已在进行中，跳过重复调用');
    return;
  }

  // 检查登录弹窗是否已经显示
  const currentState = store.getState();
  if (currentState.auth.loginModalVisible) {
    console.log('登录弹窗已显示，跳过重复处理');
    return;
  }

  // 设置处理标记
  isHandlingTokenExpired = true;
  lastTokenExpiredTime = now;

  try {
    console.log('开始处理Token过期');

    // 记录当前页面路径，用于登录弹窗关闭后的导航
    const currentPath = window.location.pathname;
    console.log('当前页面路径:', currentPath);

    // 检查当前页面是否需要保存状态
    if (shouldSavePageState()) {
      // 保存当前页面状态
      store.dispatch(triggerSavePageState());
    }

    // 清除认证信息
    store.dispatch(clearAuth());

    // 显示登录弹窗
    store.dispatch(setLoginModalVisible(true));

    console.log('Token已过期，已清除认证信息并显示登录弹窗');
  } finally {
    // 延迟重置标记，确保短时间内不会重复处理
    setTimeout(() => {
      isHandlingTokenExpired = false;
    }, TOKEN_EXPIRED_DEBOUNCE_TIME);
  }
};

// 创建Axios实例
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 20000,
  headers: {
    'Content-Type': 'application/json',
    "referer": window.location.href,
    'language': i18n.language === 'en' ? 'en' : 'zh'
  }
});

// 请求拦截器
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig): InternalAxiosRequestConfig => {
    // 从localStorage获取token
    const token = localStorage.getItem('token');

    // 添加认证头
    if (token && !config.headers.Authorization) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // 添加组织ID请求头
    // 只有在有 Authorization 时才添加 orgId
    if (token && config.headers) {
      const state = store.getState();
      const currentOrgId = state.organization?.currentOrgId;
      
      // 如果有当前组织ID，添加到请求头
      // 注意：currentOrgId 为 null 表示个人组织，此时不添加 orgId 请求头
      if (currentOrgId) {
        config.headers['orgId'] = currentOrgId;
        console.log('API请求携带组织ID:', currentOrgId);
      } else {
        console.log('API请求不携带组织ID（个人组织或未选择）');
      }
    }

    // 添加语言头
    if (config.headers) {
      // 从i18n获取当前语言，保持实时一致
      const currentLanguage = i18n.language;
      console.log('currentLanguage', currentLanguage);

      // 设置Accept-Language和自定义language头
      // 注意：referer是受限制的请求头，不能通过JavaScript设置，浏览器会自动添加
      config.headers['Accept-Language'] = currentLanguage;
      config.headers['language'] = currentLanguage === 'en' ? 'en' : 'zh';
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 响应拦截器
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    return response.data;
  },
  (error) => {
    if (error.response) {
      // 处理HTTP错误状态码
      switch (error.response.status) {
        case 401:
        case 403:
          // 只有明确的认证失败才处理token过期
          // 检查是否是认证相关的错误
          const isAuthError = error.response.status === 401 || 
            (error.response.status === 403 || 
             (error.response.data?.code === 403 || 
              error.response.data?.message?.includes('token') ||
              error.response.data?.message?.includes('认证') ||
              error.response.data?.message?.includes('授权')));
          
          if (isAuthError) {
            console.log('检测到认证错误，处理token过期');
            handleTokenExpired();
          } else {
            console.log('403错误但不是认证问题，不处理token过期',error.response);
          }
          break;
        case 500:
          // 服务器错误
          console.error('服务器错误');
          break;
        default:
          // 其他错误
          console.error(`请求错误: ${error.response.status}`);
          break;
      }
    } else if (error.request) {
      // 请求发出，但没有收到响应 - 网络问题，不处理token过期
      console.error('网络错误，无法连接到服务器');
    } else {
      // 请求配置出错
      console.error(`请求错误: ${error.message}`);
    }

    return Promise.reject({
      code: error.response?.status || 'NETWORK_ERROR',
      message: error.response?.data?.message ||
        i18n.t('error.networkError', { ns: 'translation' })
    });
  }
);

export default apiClient; 