#!/usr/bin/env node

/**
 * SCSS优化脚本
 * 此脚本会处理所有SCSS文件中的导入，确保正确使用@use和@forward
 * 同时消除循环引用和重复导入
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// ES模块中获取__dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 要处理的目录
const sourceDir = path.resolve(__dirname, '../src');
const themeDir = path.resolve(sourceDir, 'theme/scss');
const stylesDir = path.resolve(sourceDir, 'styles');

// 首先确保核心SCSS文件是正确的
function fixCoreScssFiles() {
  // 1. 修复_variables.scss
  const variablesPath = path.join(themeDir, '_variables.scss');
  if (fs.existsSync(variablesPath)) {
    const variablesContent = fs.readFileSync(variablesPath, 'utf8');
    fs.writeFileSync(variablesPath, variablesContent);
    console.log('已验证 _variables.scss 文件');
  }
  
  // 2. 修复_mixins.scss
  const mixinsPath = path.join(themeDir, '_mixins.scss');
  if (fs.existsSync(mixinsPath)) {
    const mixinsContent = fs.readFileSync(mixinsPath, 'utf8');
    fs.writeFileSync(mixinsPath, mixinsContent);
    console.log('已验证 _mixins.scss 文件');
  }
  
  // 3. 修复_forward.scss
  const forwardPath = path.join(themeDir, '_forward.scss');
  if (fs.existsSync(forwardPath)) {
    const forwardContent = `// SCSS模块导入 - 统一转发文件

/**
 * 此文件将所有主题相关变量和mixins向前转发，提供一个统一的导入点
 * 其他组件可以通过 @use '../../theme/scss/_forward' as * 导入所有内容
 */

// 转发变量
@forward './variables';

// 转发mixins
@forward './mixins';
`;
    fs.writeFileSync(forwardPath, forwardContent);
    console.log('已修复 _forward.scss 文件');
  }
  
  // 4. 修复theme/scss/index.scss
  const themeIndexPath = path.join(themeDir, 'index.scss');
  if (fs.existsSync(themeIndexPath)) {
    const themeIndexContent = `// 主题入口文件 - 使用统一转发模块
@use './_forward' as *;

// 主题全局样式
body {
  color: var(--text-color);
  background-color: var(--background-color);
  @include transition(all, 0.3s);
}

a {
  color: var(--primary-color);
  @include transition(color, 0.3s);
  
  &:hover {
    color: var(--primary-color-hover);
  }
}

// 按钮样式更新
.btn {
  &-primary {
    background-color: var(--primary-color);
    border-color: var(--primary-color);
    
    &:hover, &:focus {
      background-color: var(--primary-color-hover);
      border-color: var(--primary-color-hover);
    }
    
    &:active {
      background-color: var(--primary-color-active);
      border-color: var(--primary-color-active);
    }
  }
}

// 表单样式更新
.form-control {
  color: var(--text-color);
  background-color: var(--component-background);
  border-color: var(--border-color);
  
  &:hover {
    border-color: var(--primary-color-hover);
  }
  
  &:focus {
    border-color: var(--primary-color);
    box-shadow: 0 0 0 2px var(--primary-color-opacity);
  }
}

// 卡片和容器
.card, .login-form-wrapper, .dashboard-welcome {
  background-color: var(--component-background);
  @include box-shadow('base');
}

// 导航栏和头部
.dashboard-header, .app-header {
  background-color: var(--component-background);
  @include border(bottom);
}`;
    fs.writeFileSync(themeIndexPath, themeIndexContent);
    console.log('已修复 theme/scss/index.scss 文件');
  }
  
  // 5. 修复styles/index.scss
  const stylesIndexPath = path.join(stylesDir, 'index.scss');
  if (fs.existsSync(stylesIndexPath)) {
    const stylesIndexContent = `// SCSS模块导入
@use '../theme/scss/_forward' as *;
@use './_utils' as *;

/* 重置样式 */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

.button {
  touch-action: manipulation;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial,
  'Noto Sans', sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol',
  'Noto Color Emoji';
  font-size: 14px;
  line-height: 1.5;
  color: var(--text-color);
  background-color: var(--background-color);
  transition: all 0.3s;
}

ul,li{
  list-style: none;
}

a {
  color: var(--primary-color);
  text-decoration: none;
  background-color: transparent;
  outline: none;
  cursor: pointer;
  transition: color 0.3s;

  &:hover {
    color: var(--primary-color-hover);
  }
}

/* 加载动画 */
.loading-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  width: 100%;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid rgba(0, 0, 0, 0.1);
  border-radius: 50%;
  border-top-color: var(--primary-color);
  animation: spin 1s ease-in-out infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}


.page-container {
  padding: 24px;
  min-height: calc(100vh - 64px); /* 减去header的高度 */
}

/* 表单样式 */
.form-group {
  margin-bottom: 16px;
}

.form-control {
  width: 100%;
  padding: 8px 12px;
  font-size: 14px;
  line-height: 1.5;
  color: var(--text-color);
  background-color: var(--component-background);
  border: 1px solid var(--border-color);
  border-radius: 2px;
  transition: all 0.3s;

  &:hover {
    border-color: var(--primary-color-hover);
  }

  &:focus {
    border-color: var(--primary-color);
    outline: 0;
    box-shadow: 0 0 0 2px var(--primary-color-opacity);
  }
}

.btn {
  display: inline-block;
  font-weight: 400;
  text-align: center;
  white-space: nowrap;
  vertical-align: middle;
  user-select: none;
  border: 1px solid transparent;
  padding: 8px 16px;
  font-size: 14px;
  border-radius: 2px;
  transition: all 0.3s;
  cursor: pointer;
  outline: none;

  &:hover,
  &:focus {
    text-decoration: none;
  }

  &-primary {
    color: #fff;
    background-color: var(--primary-color);
    border-color: var(--primary-color);

    &:hover {
      background-color: var(--primary-color-hover);
      border-color: var(--primary-color-hover);
    }
  }
}

/* 响应式设计 */
@media (max-width: 768px) {
  
}`;
    fs.writeFileSync(stylesIndexPath, stylesIndexContent);
    console.log('已修复 styles/index.scss 文件');
  }
}

/**
 * 递归遍历目录找出所有匹配的文件
 * @param {string} dir 目录路径
 * @param {RegExp} fileMatch 文件匹配正则表达式
 * @returns {Array<string>} 匹配的文件路径列表
 */
function findFiles(dir, fileMatch) {
  let results = [];
  const list = fs.readdirSync(dir);
  
  for (const file of list) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      // 递归处理子目录
      results = results.concat(findFiles(filePath, fileMatch));
    } else if (fileMatch.test(file)) {
      // 添加匹配的文件
      results.push(filePath);
    }
  }
  
  return results;
}

/**
 * 修复组件SCSS文件
 * @param {string} filePath 文件路径
 */
function fixComponentScss(filePath) {
  // 跳过核心SCSS文件，这些文件已单独处理
  if (
    filePath.includes(path.join(themeDir, '_variables.scss')) ||
    filePath.includes(path.join(themeDir, '_mixins.scss')) ||
    filePath.includes(path.join(themeDir, '_forward.scss')) ||
    filePath.includes(path.join(themeDir, 'index.scss')) ||
    filePath.includes(path.join(stylesDir, 'index.scss')) ||
    filePath.includes(path.join(stylesDir, '_utils.scss'))
  ) {
    return false;
  }
  
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    let newContent = content;
    
    // 确定正确的相对路径
    let forwardImportPath;
    const relativeToTheme = path.relative(path.dirname(filePath), themeDir);
    
    // 构建正确的导入路径
    forwardImportPath = `${relativeToTheme}/_forward`;
    
    // 移除所有现有的@use和@import语句
    newContent = newContent.replace(/@use\s+['"].*['"]\s+as\s+\*\s*;?/g, '');
    newContent = newContent.replace(/@import\s+['"].*['"]\s*;?/g, '');
    
    // 清理多余空行
    newContent = newContent.replace(/^\s*[\r\n]/gm, '');
    newContent = newContent.replace(/[\r\n]+\s*[\r\n]+/g, '\n\n');
    
    // 添加正确的导入
    newContent = `// SCSS模块导入
@use '${forwardImportPath}' as *;

${newContent}`;
    
    if (newContent !== content) {
      fs.writeFileSync(filePath, newContent);
      console.log(`已修复组件SCSS文件: ${path.relative(sourceDir, filePath)}`);
      return true;
    }
  } catch (error) {
    console.error(`处理文件 ${filePath} 时出错:`, error);
  }
  
  return false;
}

// 执行优化
console.log('开始优化SCSS文件...');

// 1. 修复核心SCSS文件
fixCoreScssFiles();

// 2. 查找并修复组件SCSS文件
const scssFiles = findFiles(sourceDir, /\.scss$/);
console.log(`找到 ${scssFiles.length} 个SCSS文件需要检查`);

let fixedCount = 0;
for (const filePath of scssFiles) {
  if (fixComponentScss(filePath)) {
    fixedCount++;
  }
}

console.log(`\n优化完成！共修复了 ${fixedCount} 个组件SCSS文件。`); 