#!/usr/bin/env node

/**
 * 此脚本用于检测和修复SCSS文件中可能存在的循环引用问题
 * 在使用@use指令时，循环引用是一个常见问题
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
 * 修复多个@use导入同一个模块的问题
 * @param {string} filePath 文件路径
 */
function fixDuplicateUses(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let originalContent = content;
    let varsUseCount = 0;
    let mixinsUseCount = 0;
    
    // 检查模块重复导入情况
    const varsMatches = content.match(/@use\s+['"].*\/variables['"]\s+as\s+\*/g);
    const mixinsMatches = content.match(/@use\s+['"].*\/mixins['"]\s+as\s+\*/g);
    
    varsUseCount = varsMatches ? varsMatches.length : 0;
    mixinsUseCount = mixinsMatches ? mixinsMatches.length : 0;
    
    if (varsUseCount > 1 || mixinsUseCount > 1) {
      console.log(`检测到文件中存在重复导入: ${filePath}`);
      console.log(`  - variables模块导入 ${varsUseCount} 次`);
      console.log(`  - mixins模块导入 ${mixinsUseCount} 次`);
      
      // 如果有多个模块导入，保留第一个，删除其它的
      if (varsUseCount > 1) {
        const firstVarsMatch = varsMatches[0];
        content = content.replace(new RegExp(`@use\\s+['"].*\/variables['"]\\s+as\\s+\\*`, 'g'), 
          (match, offset) => {
            if (match === firstVarsMatch) {
              return match;
            }
            return '// 移除重复导入: ' + match;
          }
        );
      }
      
      if (mixinsUseCount > 1) {
        const firstMixinsMatch = mixinsMatches[0];
        content = content.replace(new RegExp(`@use\\s+['"].*\/mixins['"]\\s+as\\s+\\*`, 'g'),
          (match, offset) => {
            if (match === firstMixinsMatch) {
              return match;
            }
            return '// 移除重复导入: ' + match;
          }
        );
      }
    }
    
    // 检查循环引用情况
    const circularPattern = /(@use\s+['"].*['"].*\n.*@use\s+['"].*['"].*)/g;
    const circularMatches = content.match(circularPattern);
    
    if (circularMatches) {
      console.log(`检测到潜在的循环引用: ${filePath}`);
      // 在这里可以添加更复杂的循环检测逻辑
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
  if (fixDuplicateUses(filePath)) {
    updatedCount++;
  }
}

console.log(`\n处理完成！共修复了 ${updatedCount} 个文件中的重复导入或循环引用问题。`); 