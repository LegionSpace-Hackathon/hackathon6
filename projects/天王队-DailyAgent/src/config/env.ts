/**
 * 环境变量配置
 * 统一管理项目中使用的环境变量，提供类型检查
 */

// API配置
export const API_CONFIG = {
  BASE_URL: import.meta.env.VITE_API_BASE_URL || '/api',
  TIMEOUT: Number(import.meta.env.VITE_API_TIMEOUT) || 30000,
};

// 应用信息
export const APP_INFO = {
  TITLE: import.meta.env.VITE_APP_TITLE || '大群空间',
  DESCRIPTION: import.meta.env.VITE_APP_DESCRIPTION || '企业级React前端项目脚手架',
  VERSION: import.meta.env.VITE_APP_VERSION || '1.0.0',
};

// 日志和监控配置
export const MONITORING = {
  LOG_LEVEL: import.meta.env.VITE_LOG_LEVEL || 'info',
  ENABLE_ERROR_TRACKING: import.meta.env.VITE_ENABLE_ERROR_TRACKING === 'true',
  SENTRY_DSN: import.meta.env.VITE_SENTRY_DSN || '',
};

// 环境标识
export const ENV = {
  IS_DEV: import.meta.env.DEV,
  IS_PROD: import.meta.env.PROD,
  MODE: import.meta.env.MODE,
};

// 特性开关
export const FEATURES = {
  AUTH_ENABLED: import.meta.env.VITE_FEATURE_AUTH_ENABLED !== 'false',
  ANALYTICS_ENABLED: import.meta.env.VITE_FEATURE_ANALYTICS_ENABLED === 'true',
};

// ============ 环境变量安全检查 ============
/**
 * 检查环境变量中是否包含敏感信息
 * 在生产环境启动时进行检查，防止敏感信息泄露
 */
export const validateEnvSecurity = () => {
  const dangerousPatterns = [
    /password/i,
    /secret/i,
    /private[_-]?key/i,
    /api[_-]?key/i,
    /token/i,
  ];
  
  const envVars = Object.keys(import.meta.env);
  const dangerous: string[] = [];
  
  for (const key of envVars) {
    // 跳过PUBLIC_开头的变量（Vite公开变量）
    if (key.startsWith('VITE_')) {
      continue;
    }
    
    // 检查变量名是否包含敏感词
    if (dangerousPatterns.some(pattern => pattern.test(key))) {
      dangerous.push(key);
    }
  }
  
  if (dangerous.length > 0 && ENV.IS_PROD) {
    console.error('⚠️ 警告：检测到可能包含敏感信息的环境变量:', dangerous);
    console.error('请确保这些变量不包含实际的敏感数据，或移到服务端处理');
  }
  
  // 检查常见的安全问题
  if (ENV.IS_PROD) {
    // 确保API URL不是localhost
    if (API_CONFIG.BASE_URL.includes('localhost') || API_CONFIG.BASE_URL.includes('127.0.0.1')) {
      console.error('⚠️ 生产环境不应使用localhost作为API地址');
    }
    
    // 确保没有启用开发者工具
    if (import.meta.env.VITE_ENABLE_DEVTOOLS === 'true') {
      console.warn('⚠️ 生产环境不应启用开发者工具');
    }
  }
  
  return dangerous.length === 0;
};

// 自动执行安全检查
if (ENV.IS_PROD) {
  validateEnvSecurity();
}

// 导出所有配置
export default {
  API: API_CONFIG,
  APP: APP_INFO,
  MONITORING,
  ENV,
  FEATURES,
  validateSecurity: validateEnvSecurity,
}; 