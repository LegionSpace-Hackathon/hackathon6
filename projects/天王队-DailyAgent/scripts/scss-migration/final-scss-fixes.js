#!/usr/bin/env node

/**
 * 此脚本执行最终的SCSS修复
 * 1. 确保所有@use规则在文件开头
 * 2. 确保没有残留的@import规则
 * 3. 确保没有重复导入
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
 * 执行最终SCSS修复
 * @param {string} filePath 文件路径
 */
function finalScssFixes(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let originalContent = content;
    let hasChanges = false;
    
    // 1. 提取所有@use规则
    const useRules = [];
    const useMatches = content.match(/@use\s+['"](.*?)['"]\s+as\s+\*\s*;?/g) || [];
    
    if (useMatches.length > 0) {
      // 清除现有@use规则
      content = content.replace(/@use\s+['"](.*?)['"]\s+as\s+\*\s*;?/g, '');
      
      // 收集去重后的@use规则
      const uniqueRules = new Set();
      useMatches.forEach(rule => {
        // 确保每个规则以分号结束
        const formattedRule = rule.endsWith(';') ? rule : `${rule};`;
        uniqueRules.add(formattedRule);
      });
      
      // 确定优先级顺序
      const forwardRules = [...uniqueRules].filter(rule => rule.includes('_forward'));
      const variablesRules = [...uniqueRules].filter(rule => rule.includes('/variables') && !rule.includes('_forward'));
      const mixinsRules = [...uniqueRules].filter(rule => rule.includes('/mixins') && !rule.includes('_forward'));
      const otherRules = [...uniqueRules].filter(rule => !rule.includes('_forward') && !rule.includes('/variables') && !rule.includes('/mixins'));
      
      // 按优先级顺序合并规则
      [...forwardRules, ...variablesRules, ...mixinsRules, ...otherRules].forEach(rule => {
        useRules.push(rule);
      });
      
      // 查找并移除任何剩余的@import规则
      const importMatches = content.match(/@import\s+['"].*['"]\s*;/g) || [];
      if (importMatches.length > 0) {
        content = content.replace(/@import\s+['"].*['"]\s*;/g, '');
        console.log(`从 ${filePath} 中移除了 ${importMatches.length} 个@import规则`);
        hasChanges = true;
      }
      
      // 删除多余的空行
      content = content.replace(/^\s*[\r\n]+/gm, '');
      content = content.replace(/[\r\n]+\s*[\r\n]+/g, '\n\n');
      
      // 在文件开头添加@use规则
      content = '// SCSS模块导入\n' + useRules.join('\n') + '\n\n' + content;
      hasChanges = true;
    }
    
    // 检测内容是否有变化
    if (content !== originalContent) {
      fs.writeFileSync(filePath, content);
      console.log(`成功修复了文件: ${filePath}`);
      return true;
    }
  } catch (error) {
    console.error(`处理文件 ${filePath} 时出错:`, error);
  }
  
  return false;
}

// 查找所有SCSS文件
const scssFiles = findFiles(sourceDir, /\.scss$/);
console.log(`找到 ${scssFiles.length} 个SCSS文件需要检查`);

// 对每个文件进行处理
let fixedCount = 0;
for (const filePath of scssFiles) {
  if (finalScssFixes(filePath)) {
    fixedCount++;
  }
}

console.log(`\n处理完成！共修复了 ${fixedCount} 个文件。`); 