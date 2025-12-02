#!/usr/bin/env node

/**
 * 此脚本用于将SCSS文件中的@import语句批量更新为@use语句
 * 它会扫描src目录下的所有.scss文件，并替换@import语句
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// ES模块中获取__dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 要处理的目录
const sourceDir = path.resolve(__dirname, '../src');

// 需要替换的模式及其对应的现代语法
const replacements = [
  {
    pattern: /@import\s+['"]../../theme\/scss\/variables\.scss['"]/g,
    replacement: '@use "../../theme/scss/variables" as *'
  },
  {
    pattern: /@import\s+['"]../../theme\/scss\/mixins\.scss['"]/g,
    replacement: '@use "../../theme/scss/mixins" as *'
  },
  {
    pattern: /@import\s+['"]../../../theme\/scss\/variables\.scss['"]/g,
    replacement: '@use "../../../theme/scss/variables" as *'
  },
  {
    pattern: /@import\s+['"]../../../theme\/scss\/mixins\.scss['"]/g,
    replacement: '@use "../../../theme/scss/mixins" as *'
  },
  {
    pattern: /@import\s+['"]../theme\/scss\/variables\.scss['"]/g,
    replacement: '@use "../theme/scss/variables" as *'
  },
  {
    pattern: /@import\s+['"]../theme\/scss\/mixins\.scss['"]/g,
    replacement: '@use "../theme/scss/mixins" as *'
  },
  // 可以根据需要添加更多替换模式
];

/**
 * 递归遍历目录找出所有匹配的文件
 * @param {string} dir 目录路径
 * @param {RegExp} fileMatch 文件匹配正则表达式
 * @returns {Array<string>} 匹配的文件路径列表
 */
function findFiles(dir, fileMatch) {
  let results = [];
  const list = fs.readdirSync(dir);
  
  list.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      // 递归处理子目录
      results = results.concat(findFiles(filePath, fileMatch));
    } else if (fileMatch.test(file)) {
      // 添加匹配的文件
      results.push(filePath);
    }
  });
  
  return results;
}

/**
 * 更新文件中的SCSS导入语句
 * @param {string} filePath 文件路径
 * @returns {boolean} 是否更新了文件
 */
function updateImports(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let originalContent = content;
  
  // 应用所有替换规则
  replacements.forEach(({ pattern, replacement }) => {
    content = content.replace(pattern, replacement);
  });
  
  if (content !== originalContent) {
    // 如果内容有变化，写回文件
    fs.writeFileSync(filePath, content);
    console.log(`更新了文件: ${filePath}`);
    return true;
  }
  
  return false;
}

// 查找所有SCSS文件
const scssFiles = findFiles(sourceDir, /\.scss$/);

// 对每个文件进行处理
let updatedCount = 0;
scssFiles.forEach(filePath => {
  if (updateImports(filePath)) {
    updatedCount++;
  }
});

console.log(`\n处理完成！共更新了 ${updatedCount} 个文件，总共扫描了 ${scssFiles.length} 个文件。`); 