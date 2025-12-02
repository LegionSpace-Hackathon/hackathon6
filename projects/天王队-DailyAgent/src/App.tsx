import React, { useEffect, useState } from 'react';
import { BrowserRouter, useNavigate, useRoutes, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAppSelector, useAppDispatch, selectLanguage } from './stores/hooks';
import { setThemeModeAction } from './stores/slices/themeSlice';
import { ConfigProvider } from 'antd';
import { setLanguage } from './stores/slices/i18nSlice';
import { initTheme, watchSystemThemeChange, setThemeMode } from './theme/utils';
import { isApp, getAppAuthToken } from './utils';
import { getAppLanguage, getQueryValue } from './utils/uaHelper';
import { autoAppLogin, setLoginModalVisible, restoreToSavedPage } from './stores/slices/authSlice';
import { store } from './stores';
import routes from '@/routes';
import LanguageRouteGuard from './components/common/LanguageRouteGuard';
import { initPerformanceMonitoring, useRouteMonitor } from '@/monitoring';
import PerformanceMonitor from '@/components/performance/PerformanceMonitor';
import LoginModal from './components/LoginModal/LoginModal';
import AuthGuard from './components/AuthGuard';
import { setChainmeetShare } from './utils/chainpal-utils-0.0.4';
import blobManager from './utils/blobManager';
import cacheManager from './utils/cacheManager';
import { initGlobalErrorHandler } from './lib/errorHandler';
import ErrorBoundary from './components/common/ErrorBoundary';
import 'ds-markdown/style.css';

// 路由组件
const AppRoutes = () => {
  // 启用路由性能监控
  useRouteMonitor();
  
  // 获取当前路由位置和翻译函数
  const location = useLocation();
  const { t } = useTranslation();

  // 路由变化时更新分享信息（仅 Agent 页面）
  useEffect(() => {
    if (isApp && location.pathname.includes('/agent')) {
      try {
        setChainmeetShare({
          title: t('agent.serviceDesc') || 'Agent',
          desc: t('agent.serviceIntro') || '',
          icon: `${window.location.origin}/favicon.ico`
        });
      } catch (error) {
        console.error('更新分享信息失败:', error);
      }
    }
    if (!document.title) {
      document.title = t('agent.serviceDesc') || 'Agent';
    }
  }, [location.pathname, t]);

  const element = useRoutes(routes);
  return element;
};

function App() {
  const { i18n, t } = useTranslation();
  const dispatch = useAppDispatch();
  const lang = useAppSelector(selectLanguage);
  const [i18nReady, setI18nReady] = useState(false);
  // 获取认证状态和登录弹窗状态
  const { loginModalVisible, isAuthenticated, shouldRestorePageState } = useAppSelector(
    (state) => state.auth
  );
  // 获取主题模式
  const themeMode = useAppSelector((state) => state.theme.mode);

  // 初始化应用
  useEffect(() => {
    // 初始化缓存管理器
    cacheManager.init();

    // 初始化主题 - 跟随系统主题
    const themeMode = initTheme();
    console.log('themeMode', themeMode);
    dispatch(setThemeModeAction("dark"));

    // 初始化性能监控
    initPerformanceMonitoring();

    // 初始化全局错误处理
    initGlobalErrorHandler();

    // 如果是App环境，尝试自动登录
    if (isApp) {
      console.log('运行在App环境中');
      handleAppLogin();
    }

    // 处理语言初始化 - URL参数优先级最高
    const initializeLanguage = () => {
      // 1. 优先检查URL参数
      const urlLang = getQueryValue('lang');
      let targetLang = 'zh-CN'; // 默认语言

      if (urlLang) {
        // URL参数存在，使用URL参数
        targetLang = urlLang === 'en' ? 'en' : 'zh-CN';
        console.log('使用URL参数语言:', targetLang);
      } else if (isApp) {
        // 2. 检查App环境语言
        const appLang = getAppLanguage();
        if (appLang) {
          targetLang = appLang as string;
          console.log('使用App环境语言:', targetLang);
        }
      } else {
        // 3. 检查localStorage中的语言设置
        const savedLang = localStorage.getItem('i18n_lang');
        if (savedLang === 'en' || savedLang === 'zh-CN') {
          targetLang = savedLang;
          console.log('使用localStorage语言:', targetLang);
        }
      }

      // 暂时移除Redux状态同步，避免类型错误
      // Redux状态已在i18nSlice初始化时正确设置

      // 确保i18n已初始化
      const checkI18n = () => {
        if (i18n.isInitialized) {
          console.log('i18n已初始化，设置语言为:', targetLang);
          i18n.changeLanguage(targetLang);
          setI18nReady(true);
        } else {
          console.log('等待i18n初始化...');
          setTimeout(checkI18n, 50);
        }
      };

      checkI18n();
    };

    initializeLanguage();

    // 应用卸载时清理blob管理器
    const cleanup = () => {
      blobManager.destroy();
    };

    if (window.innerWidth < 768) {
      // document.body.style.touchAction = 'none';
      document?.body?.addEventListener('touchstart', function () {});
    }

    // 监听页面卸载事件
    window.addEventListener('beforeunload', cleanup);

    // 组件卸载时清理
    return () => {
      window.removeEventListener('beforeunload', cleanup);
      cleanup();
    };
  }, []);

  // 监听系统主题变化（当主题模式为 auto 时）
  useEffect(() => {
    if (themeMode !== 'auto') {
      return;
    }

    const unwatch = watchSystemThemeChange(() => {
      // 系统主题变化时，重新应用 auto 模式
      setThemeMode('auto');
    });

    return unwatch;
  }, [themeMode]);


  // App自动登录
  const handleAppLogin = async () => {
    try {
      // 检查是否已经认证，避免重复调用
      const currentState = store.getState();
      const { isAuthenticated, token, autoLoginAttempted, autoLoginInProgress } = currentState.auth;
      
      // 如果已经认证且有有效token，跳过自动登录
      if (isAuthenticated && token) {
        console.log('用户已认证，跳过自动登录');
        return;
      }
      
      // 如果自动登录正在进行中，跳过（防止并发）
      if (autoLoginInProgress) {
        console.log('自动登录正在进行中，跳过');
        return;
      }
      
      // 如果已经尝试过自动登录且用户已认证，跳过（防止重复调用）
      if (autoLoginAttempted && isAuthenticated) {
        console.log('自动登录已尝试过且用户已认证，跳过');
        return;
      }
      
      // 获取App授权Token
      const appToken = await getAppAuthToken();
      if (appToken) {
        console.log('开始自动登录');
        // 调用自动登录
        dispatch(autoAppLogin(appToken));
      }
    } catch (error) {
      console.error('App自动登录失败:', error);
      // 自动登录失败时不清理现有认证状态
    }
  };

  // 当语言变化时更新
  useEffect(() => {
    if (i18n.isInitialized) {
      console.log('更新语言为:', lang);
      i18n.changeLanguage(lang);
    }
  }, [lang, i18n]);

  // 认证状态变化的处理已经移到AuthGuard组件中


  // 处理登录弹窗关闭
  const handleLoginModalClose = () => {
    dispatch(setLoginModalVisible(false));
  };

  // 处理登录弹窗关闭后的导航逻辑
  const handleLoginModalCloseCallback = () => {
    // Agent 页面不需要特殊处理，保持当前页面
  };

  // 如果i18n还未准备好，显示简单的加载界面
  // if (!i18nReady && ENV.IS_PROD) {
  //   return (
  //     <div
  //       style={{
  //         display: 'flex',
  //         height: '100vh',
  //         justifyContent: 'center',
  //         alignItems: 'center',
  //         flexDirection: 'column',
  //         backgroundColor: '#f5f5f5',
  //       }}
  //     >
  //       <div style={{ fontSize: '24px', marginBottom: '16px' }}>正在加载...</div>
  //       <div
  //         style={{
  //           width: '50px',
  //           height: '50px',
  //           border: '5px solid #eee',
  //           borderTopColor: '#3498db',
  //           borderRadius: '50%',
  //           animation: 'spin 1s linear infinite',
  //         }}
  //       ></div>
  //       <style>{`
  //         @keyframes spin {
  //           0% { transform: rotate(0deg); }
  //           100% { transform: rotate(360deg); }
  //         }
  //       `}</style>
  //     </div>
  //   );
  // }

  return (
    <ErrorBoundary>
      <ConfigProvider
        theme={{
          token: {
            colorPrimary: '#15D69C',
          },
        }}
      >
        <BrowserRouter>
          {/* 语言路由守卫 - 确保URL中始终包含lang参数 */}
          <LanguageRouteGuard />
          <AuthGuard>
            <AppRoutes />
          </AuthGuard>
          {/* 全局登录弹窗 */}
          <LoginModal
            visible={loginModalVisible}
            onCancel={handleLoginModalClose}
            onClose={handleLoginModalCloseCallback}
          />
        </BrowserRouter>
      </ConfigProvider>
    </ErrorBoundary>
  );
}

export default App;
