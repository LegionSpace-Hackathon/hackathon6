#!/usr/bin/env node

/**
 * 此脚本用于将SCSS文件中的@import语句批量更新为@use语句
 */

const fs = require('fs');
const path = require('path');

// 要处理的目录
const sourceDir = path.resolve(__dirname, '../src');

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
 * 更新文件中的SCSS导入语句
 * @param {string} filePath 文件路径
 */
function updateImports(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let originalContent = content;
    let changed = false;
    
    // 替换各种路径的导入
    if (content.includes('@import')) {
      // 替换 "../../theme/scss/variables.scss"
      content = content.replace(
        /@import\s+['"]\.\.\/\.\.\/theme\/scss\/variables\.scss['"]\s*;?/g,
        '@use \'../../theme/scss/variables\' as *;'
      );
      
      // 替换 "../../theme/scss/mixins.scss"
      content = content.replace(
        /@import\s+['"]\.\.\/\.\.\/theme\/scss\/mixins\.scss['"]\s*;?/g,
        '@use \'../../theme/scss/mixins\' as *;'
      );
      
      // 替换 "../../../theme/scss/variables.scss"
      content = content.replace(
        /@import\s+['"]\.\.\/\.\.\/\.\.\/theme\/scss\/variables\.scss['"]\s*;?/g,
        '@use \'../../../theme/scss/variables\' as *;'
      );
      
      // 替换 "../../../theme/scss/mixins.scss"
      content = content.replace(
        /@import\s+['"]\.\.\/\.\.\/\.\.\/theme\/scss\/mixins\.scss['"]\s*;?/g,
        '@use \'../../../theme/scss/mixins\' as *;'
      );
      
      // 替换 "../theme/scss/variables.scss"
      content = content.replace(
        /@import\s+['"]\.\.\/theme\/scss\/variables\.scss['"]\s*;?/g,
        '@use \'../theme/scss/variables\' as *;'
      );
      
      // 替换 "../theme/scss/mixins.scss"
      content = content.replace(
        /@import\s+['"]\.\.\/theme\/scss\/mixins\.scss['"]\s*;?/g,
        '@use \'../theme/scss/mixins\' as *;'
      );
    }
    
    if (content !== originalContent) {
      // 如果内容有变化，写回文件
      fs.writeFileSync(filePath, content);
      console.log(`更新了文件: ${filePath}`);
      return true;
    }
  } catch (error) {
    console.error(`处理文件 ${filePath} 时出错:`, error);
  }
  
  return false;
}

// 查找所有SCSS文件
const scssFiles = findFiles(sourceDir, /\.scss$/);
console.log(`找到 ${scssFiles.length} 个SCSS文件需要处理`);

// 对每个文件进行处理
let updatedCount = 0;
for (const filePath of scssFiles) {
  if (updateImports(filePath)) {
    updatedCount++;
  }
}

console.log(`\n处理完成！共更新了 ${updatedCount} 个文件，总共扫描了 ${scssFiles.length} 个文件。`); 