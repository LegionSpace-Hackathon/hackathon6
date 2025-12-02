module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx,html}'],
  css: ['./dist/assets/css/**/*.css'],
  safelist: {
    standard: [
      // 保留和React相关的类名
      /^react-/,
      // 保留和组件状态相关的类名
      /^active$/,
      /^disabled$/,
      /^selected$/,
      /^show$/,
      /^hide$/,
      /^open$/,
      /^closed$/,
      // 保留和布局相关的类名
      /^container/,
      /^row$/,
      /^col-/,
      /^d-/,
      /^flex-/,
      /^justify-/,
      /^align-/,
      // 保留和主题相关的类名
      /^theme-/,
      /^dark-mode$/,
      /^light-mode$/,
      // 保留和动画相关的类名
      /^fade/,
      /^slide/,
      /^animate-/,
      // 保留和响应式相关的类名
      /^sm-/,
      /^md-/,
      /^lg-/,
      /^xl-/,
      // 保留特定组件的类名
      /^plugin-/,
      /^chart-/,
    ],
    deep: [
      // 保留所有data属性
      /^data-/,
      // 保留所有aria属性
      /^aria-/,
      // 保留所有role属性
      /^role$/,
    ],
    greedy: [
      // 保留可能是动态生成的类名
      /^[a-z]+-[0-9]+$/,
    ],
  },
  fontFace: true,
  keyframes: true,
  variables: true,
  rejected: true,
  rejectedCss: './purged/rejected.css',
  dynamicAttributes: ['aria-label', 'data-value'],
}; 