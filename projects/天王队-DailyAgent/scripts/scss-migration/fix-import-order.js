#!/usr/bin/env node

/**
 * 此脚本用于修复SCSS文件中的导入顺序问题
 */

const fs = require('fs');
const path = require('path');

// 要处理的特定文件
const filesToFix = [
  path.resolve(__dirname, '../src/features/docs/components/DocLayout.scss'),
  path.resolve(__dirname, '../src/features/docs/components/DocSidebar.scss'),
  path.resolve(__dirname, '../src/features/docs/components/DocViewer.scss'),
  path.resolve(__dirname, '../src/features/docs/pages/ArticlePage.scss'),
  path.resolve(__dirname, '../src/features/docs/pages/CategoryPage.scss'),
  path.resolve(__dirname, '../src/features/docs/pages/DocHome.scss'),
  path.resolve(__dirname, '../src/pages/Plugins/PluginStatistics.scss'),
];

/**
 * 修复SCSS文件中的导入顺序
 * @param {string} filePath 文件路径
 */
function fixImportOrder(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    if (!content.includes('@use')) {
      console.log(`文件不包含@use语句，跳过: ${filePath}`);
      return false;
    }
    
    // 提取现有的导入语句
    const useMatches = content.match(/@use\s+['"](.*?)['"]\s+as\s+\*/g) || [];
    
    if (useMatches.length < 2) {
      console.log(`文件导入语句少于2个，无需优化: ${filePath}`);
      return false;
    }
    
    // 移除现有的导入语句
    useMatches.forEach(match => {
      content = content.replace(match, '');
    });
    
    // 删除空行
    content = content.replace(/^\s*[\r\n]/gm, '');
    
    // 重新添加导入语句，按照清晰的顺序
    const newImports = ['// 重新排序的SCSS模块导入'];
    
    // 先添加variables
    const varsImport = useMatches.find(match => match.includes('/variables'));
    if (varsImport) {
      newImports.push(varsImport);
    }
    
    // 再添加mixins
    const mixinsImport = useMatches.find(match => match.includes('/mixins'));
    if (mixinsImport) {
      newImports.push(mixinsImport);
    }
    
    // 添加其他导入
    useMatches.forEach(match => {
      if (!match.includes('/variables') && !match.includes('/mixins')) {
        newImports.push(match);
      }
    });
    
    // 将新的导入添加到文件开头
    content = newImports.join('\n') + '\n\n' + content;
    
    // 写入文件
    fs.writeFileSync(filePath, content);
    console.log(`成功修复导入顺序: ${filePath}`);
    return true;
  } catch (error) {
    console.error(`处理文件 ${filePath} 时出错:`, error);
    return false;
  }
}

// 处理指定文件
let fixedCount = 0;
filesToFix.forEach(filePath => {
  if (fixImportOrder(filePath)) {
    fixedCount++;
  }
});

console.log(`\n处理完成！共修复了 ${fixedCount} 个文件的导入顺序。`); 