import React from 'react';

// 立即导入React兼容性模块并初始化
import { initReactPolyfill } from './utils/reactPolyfill';
initReactPolyfill();

// 确保React对象可用并导出createContext的引用
window.React = React;

// 导入环境变量
import { ENV } from '@/config/env';

// 导入完整的core-js polyfill
import 'core-js/stable';

// 添加Object.hasOwn的polyfill
if (!Object.hasOwn) {
  Object.defineProperty(Object, 'hasOwn', {
    value: function (object, property) {
      if (object === null || object === undefined) {
        throw new TypeError('Cannot convert undefined or null to object');
      }
      return Object.prototype.hasOwnProperty.call(Object(object), property);
    },
    configurable: true,
    writable: true
  });
}

// 先导入React相关库
import { Provider } from 'react-redux';
import { store } from './stores';
import ReactDOM from 'react-dom/client';


// 初始化vConsole
// import { initVConsole } from './utils/vConsole';
// initVConsole();

// 然后导入国际化，确保React已经可用
import './i18n'; 

// 最后导入其他模块
import App from './App';
import { initTheme } from './theme/utils';
import './styles/index.scss';

// 初始化主题（跟随系统）
initTheme();

// 开发工具禁用
const disableReactDevTools = (): void => {
  if (!ENV.IS_PROD) return;
  
  if (typeof (window as any).__REACT_DEVTOOLS_GLOBAL_HOOK__ === 'object') {
    for (const prop in (window as any).__REACT_DEVTOOLS_GLOBAL_HOOK__) {
      (window as any).__REACT_DEVTOOLS_GLOBAL_HOOK__[prop] = 
        typeof (window as any).__REACT_DEVTOOLS_GLOBAL_HOOK__[prop] === 'function'
          ? () => {}
          : null;
    }
  }
};

// 生产环境禁用开发工具
if (ENV.IS_PROD) {
  disableReactDevTools();
}

// 创建根元素
const rootElement = document.getElementById('root');

if (!rootElement) {
  console.error('根元素不存在，无法渲染应用');
} else {
  try {
    const root = ReactDOM.createRoot(rootElement);
    root.render(
      // 临时注释掉StrictMode进行测试，减少重复渲染
      // <React.StrictMode>
        <Provider store={store}>
          <App />
        </Provider>
      // </React.StrictMode>
    );
  } catch (error) {
    console.error('渲染应用时发生错误:', error);
  }
} 