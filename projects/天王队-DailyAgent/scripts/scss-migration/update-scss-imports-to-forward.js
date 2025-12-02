#!/usr/bin/env node

/**
 * 此脚本用于将SCSS文件中的多个@use导入更新为使用单一转发模块
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
 * 更新文件中的SCSS导入语句为使用转发模块
 * @param {string} filePath 文件路径
 */
function updateToForward(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const originalContent = content;
    
    // 检查文件是否同时导入了variables和mixins
    const hasVariablesImport = content.match(/@use\s+['"].*\/variables['"]\s+as\s+\*/g);
    const hasMixinsImport = content.match(/@use\s+['"].*\/mixins['"]\s+as\s+\*/g);
    
    if (hasVariablesImport && hasMixinsImport) {
      // 确定正确的相对路径
      let updatedContent = content;
      
      // 处理路径为 '../../../theme/scss/'
      if (content.includes('@use \'../../../theme/scss/variables\'') && content.includes('@use \'../../../theme/scss/mixins\'')) {
        updatedContent = updatedContent
          .replace(/@use\s+['"]\.\.\/\.\.\/\.\.\/theme\/scss\/variables['"]\s+as\s+\*/g, '')
          .replace(/@use\s+['"]\.\.\/\.\.\/\.\.\/theme\/scss\/mixins['"]\s+as\s+\*/g, '')
          .replace(/^\s*[\r\n]/gm, '');
        
        // 在文件开头添加转发模块引用
        updatedContent = '// 使用统一转发模块\n@use \'../../../theme/scss/_forward\' as *;\n\n' + updatedContent;
      } 
      // 处理路径为 '../../theme/scss/'
      else if (content.includes('@use \'../../theme/scss/variables\'') && content.includes('@use \'../../theme/scss/mixins\'')) {
        updatedContent = updatedContent
          .replace(/@use\s+['"]\.\.\/\.\.\/theme\/scss\/variables['"]\s+as\s+\*/g, '')
          .replace(/@use\s+['"]\.\.\/\.\.\/theme\/scss\/mixins['"]\s+as\s+\*/g, '')
          .replace(/^\s*[\r\n]/gm, '');
        
        // 在文件开头添加转发模块引用
        updatedContent = '// 使用统一转发模块\n@use \'../../theme/scss/_forward\' as *;\n\n' + updatedContent;
      } 
      // 处理路径为 '../theme/scss/'
      else if (content.includes('@use \'../theme/scss/variables\'') && content.includes('@use \'../theme/scss/mixins\'')) {
        updatedContent = updatedContent
          .replace(/@use\s+['"]\.\.\/theme\/scss\/variables['"]\s+as\s+\*/g, '')
          .replace(/@use\s+['"]\.\.\/theme\/scss\/mixins['"]\s+as\s+\*/g, '')
          .replace(/^\s*[\r\n]/gm, '');
        
        // 在文件开头添加转发模块引用
        updatedContent = '// 使用统一转发模块\n@use \'../theme/scss/_forward\' as *;\n\n' + updatedContent;
      }
      
      // 检查内容是否有变化
      if (updatedContent !== originalContent) {
        fs.writeFileSync(filePath, updatedContent);
        console.log(`已更新文件使用转发模块: ${filePath}`);
        return true;
      }
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
  if (updateToForward(filePath)) {
    updatedCount++;
  }
}

console.log(`\n处理完成！共更新了 ${updatedCount} 个文件使用统一转发模块。`); 