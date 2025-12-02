import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import zhCN from './zh-CN.json';
import en from './en.json';
// 只保留 Agent 相关的翻译，移除不相关的模块
// import ChainmeetResources from './chainmeet';
// import { developerTranslations } from './developer';

// 合并资源 - 只保留基础翻译
const resources = {
  'zh-CN': {
    translation: {
      ...zhCN,
      // ...ChainmeetResources.zh,
      // ...developerTranslations.zh,
    }
  },
  'en': {
    translation: {
      ...en,
      // ...ChainmeetResources.en,
      // ...developerTranslations.en,
    }
  }
};

// 使用同步方式初始化i18n，避免异步初始化可能导致的问题
try {
  i18n
    .use(initReactI18next)
    .init({
      resources,
      lng: 'zh-CN',
      fallbackLng: 'zh-CN',
      interpolation: {
        escapeValue: false, // not needed for react as it escapes by default
      },
      react: {
        useSuspense: false, // 禁用Suspense，避免初始化问题
      }
    });
  
  console.log('i18n初始化成功');
} catch (error) {
  console.error('i18n初始化失败:', error);
}

export default i18n; 