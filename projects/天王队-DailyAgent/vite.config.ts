import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import tailwindcss from '@tailwindcss/vite';
import viteCompression from 'vite-plugin-compression';
import { visualizer } from 'rollup-plugin-visualizer';
// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const isProd = mode === 'production';
  
  // 自定义插件：确保React在HTML头部预定义
  const ensureReactGlobal = {
    name: 'ensure-react-global',
    transformIndexHtml(html) {
      return html.replace(
        '</head>',
        `<script>
          window.React = window.React || {};
          if (!window.React.createContext) {
            window.React.createContext = function(defaultValue) {
              return {
                Provider: function(props) { return props.children; },
                Consumer: function(props) { 
                  if (typeof props.children === 'function') {
                    return props.children(defaultValue);
                  }
                  return props.children;
                },
                displayName: 'Prefilled_Context',
                _currentValue: defaultValue,
                _currentValue2: defaultValue
              };
            };
          }
        </script>
        </head>`
      );
    }
  };
  
  return {
    plugins: [
      tailwindcss(),
      ensureReactGlobal,
      react({
        jsxRuntime: 'automatic',
      }),
      ...(isProd ? [
        viteCompression({
          algorithm: 'gzip',
          ext: '.gz',
        }),
        viteCompression({
          algorithm: 'brotliCompress',
          ext: '.br',
        }),
      ] : []),
      ...(process.env.ANALYZE ? [
        visualizer({
          open: true,
          filename: 'dist/stats.html',
          gzipSize: true,
          brotliSize: true,
        }),
      ] : []),
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'src'),
      },
    },
    define: {
      'window.React': 'React',
      'process.env': {
        NODE_ENV: JSON.stringify(mode),
        ...Object.fromEntries(
          Object.entries(env).filter(([key]) => key.startsWith('VITE_')).map(
            ([key, val]) => [key, val]
          )
        ),
      },
      // 添加版本号到构建时
      'import.meta.env.VITE_APP_VERSION': JSON.stringify(process.env.npm_package_version || '1.0.0'),
    },
    build: {
      outDir: 'dist',
      assetsDir: 'assets',
      minify: 'terser',
      terserOptions: {
        compress: {
          // 生产环境移除console和debugger
          drop_console: isProd,
          drop_debugger: isProd,
          // 移除特定的console方法
          pure_funcs: isProd ? ['console.log', 'console.info', 'console.debug', 'console.trace'] : [],
        },
        format: {
          // 移除注释
          comments: false,
        },
      },
      rollupOptions: {
        output: {
          // ============ 优化的代码分割策略 ============
          manualChunks: {
            // React核心库
            'react-vendor': ['react', 'react-dom', 'react-router-dom'],
            // Redux状态管理
            'redux-vendor': ['react-redux', '@reduxjs/toolkit'],
            // 国际化
            'i18n-vendor': ['i18next', 'react-i18next'],
            // UI组件库
            'ui-vendor': ['antd', 'antd-mobile', 'antd-mobile-icons'],
            // 工具库
            'utils-vendor': ['dayjs', 'axios', 'crypto-js'],
            // Markdown相关
            'markdown-vendor': ['marked', 'react-markdown', 'dompurify', 'rehype-raw', 'rehype-sanitize', 'remark-gfm'],
            // 图表库
            'charts-vendor': ['echarts'],
          },
          // 优化chunk文件名，利用浏览器缓存
          chunkFileNames: (chunkInfo) => {
            const facadeModuleId = chunkInfo.facadeModuleId ? chunkInfo.facadeModuleId.split('/').slice(-2).join('/') : 'chunk';
            return `assets/js/[name]-[hash].js`;
          },
          entryFileNames: 'assets/js/[name]-[hash].js',
          assetFileNames: (assetInfo) => {
            // 根据文件类型分类存放
            const info = assetInfo.name?.split('.');
            let extType = info?.[info.length - 1];
            
            if (/\.(png|jpe?g|gif|svg|webp|ico)$/i.test(assetInfo.name || '')) {
              return 'assets/images/[name]-[hash][extname]';
            } else if (/\.(woff2?|eot|ttf|otf)$/i.test(assetInfo.name || '')) {
              return 'assets/fonts/[name]-[hash][extname]';
            } else if (/\.css$/i.test(assetInfo.name || '')) {
              return 'assets/css/[name]-[hash][extname]';
            }
            
            return 'assets/[name]-[hash][extname]';
          },
        },
      },
      reportCompressedSize: false,
      chunkSizeWarningLimit: 800, // 降低到800KB，更早发现大文件问题
      // 启用源码映射（source map）配置
      sourcemap: isProd ? false : true, // 生产环境关闭sourcemap减小体积
    },
    server: {
      port: 3000,
      host: true,
      open: true,
      proxy: {
        '/api/dify': {
          target: 'http://192.168.208.240:8081',
          changeOrigin: true,
          secure: false,
        },
        '/api': {
          target: 'http://192.168.208.86:10010',
          // target: 'https://space.tongfudun.com',
          changeOrigin: true,
          secure: false,
          rewrite: (path) => path
        }
      }
    },
  };
});
