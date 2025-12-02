/**
 * SCSS迁移脚本
 * 将旧的@import语法转换为现代的@use/@forward语法
 */

import fs from 'fs';
import path from 'path';
import { promisify } from 'util';
import { fileURLToPath } from 'url';

// ES模块中获取__dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const readdir = promisify(fs.readdir);
const stat = promisify(fs.stat);
const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);

// 需要忽略的目录
const IGNORED_DIRS = ['node_modules', 'dist', '.git'];

// 主题和样式文件目录
const THEME_DIR = path.resolve(__dirname, '../src/theme/scss');
const STYLES_DIR = path.resolve(__dirname, '../src/styles');

// 记录已处理的文件和转换的导入语句
let processedFiles = 0;
let convertedImports = 0;

/**
 * 获取所有的SCSS文件
 * @param {string} dir - 起始目录
 * @returns {Promise<string[]>} - SCSS文件路径数组
 */
async function getAllScssFiles(dir) {
  const files = [];
  
  async function traverse(currentDir) {
    const entries = await readdir(currentDir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name);
      
      if (entry.isDirectory()) {
        if (!IGNORED_DIRS.includes(entry.name)) {
          await traverse(fullPath);
        }
      } else if (entry.isFile() && (entry.name.endsWith('.scss') || entry.name.endsWith('.sass'))) {
        files.push(fullPath);
      }
    }
  }
  
  await traverse(dir);
  return files;
}

/**
 * 处理SCSS文件内容
 * @param {string} filePath - 文件路径
 * @param {string} content - 文件内容
 * @returns {string} - 处理后的文件内容
 */
function processScssContent(filePath, content) {
  // 匹配@import语句
  const importRegex = /@import\s+['"]([^'"]+)['"](;)?/g;
  
  // 是否是部分文件（以_开头）
  const isPartial = path.basename(filePath).startsWith('_');
  
  // 是否是主题文件
  const isThemeFile = filePath.includes(THEME_DIR);
  
  // 是否是样式工具文件
  const isStyleUtil = filePath.includes(STYLES_DIR) && path.basename(filePath).startsWith('_');

  // 如果是主题变量文件，使用@forward
  if (isThemeFile && (filePath.includes('_variables.scss') || filePath.includes('_mixins.scss'))) {
    return content;
  }
  
  // 如果是_forward.scss文件，使用@forward
  if (path.basename(filePath) === '_forward.scss') {
    return content;
  }

  // 替换导入语句
  let newContent = content.replace(importRegex, (match, importPath, semicolon) => {
    convertedImports++;
    
    // 处理导入路径
    let namespace = '';
    let useAs = 'as *';
    
    // 处理主题变量和混合器
    if (importPath.includes('variables') || importPath.includes('mixins')) {
      return `@use "${importPath}" ${useAs};`;
    }
    
    // 处理相对路径
    if (importPath.startsWith('./') || importPath.startsWith('../')) {
      return `@use "${importPath}" ${useAs};`;
    }

    // 处理主题路径
    if (importPath.includes('theme/scss')) {
      return `@use "${importPath}" ${useAs};`;
    }
    
    // 处理绝对路径
    if (importPath.startsWith('@/')) {
      importPath = importPath.replace('@/', '');
      return `@use "${importPath}" ${useAs};`;
    }
    
    // 默认处理方式
    return `@use "${importPath}" ${useAs};`;
  });
  
  // 如果文件中有导入主题变量，确保主题变量先导入
  if (newContent.includes('@use "') && !newContent.includes('@use "src/theme/scss/_forward.scss"')) {
    // 只有普通组件文件需要导入主题
    if (!isThemeFile && !isPartial && !isStyleUtil) {
      newContent = `@use "src/theme/scss/_forward.scss" as *;\n\n${newContent}`;
    }
  }
  
  return newContent;
}

/**
 * 处理单个SCSS文件
 * @param {string} filePath - 文件路径
 */
async function processScssFile(filePath) {
  try {
    const content = await readFile(filePath, 'utf8');
    const processedContent = processScssContent(filePath, content);
    
    if (content !== processedContent) {
      await writeFile(filePath, processedContent, 'utf8');
      console.log(`✅ 已处理: ${path.relative(process.cwd(), filePath)}`);
    } else {
      console.log(`🔹 无需修改: ${path.relative(process.cwd(), filePath)}`);
    }
    
    processedFiles++;
  } catch (error) {
    console.error(`❌ 处理文件失败: ${filePath}`, error);
  }
}

/**
 * 创建或更新_forward.scss文件
 */
async function createForwardFile() {
  const forwardPath = path.join(THEME_DIR, '_forward.scss');
  let forwardContent = '';
  
  // 检查_variables.scss是否存在
  const variablesPath = path.join(THEME_DIR, '_variables.scss');
  if (fs.existsSync(variablesPath)) {
    forwardContent += '@forward "./variables";\n';
  }
  
  // 检查_mixins.scss是否存在
  const mixinsPath = path.join(THEME_DIR, '_mixins.scss');
  if (fs.existsSync(mixinsPath)) {
    forwardContent += '@forward "./mixins";\n';
  }
  
  // 检查_theme.scss是否存在
  const themePath = path.join(THEME_DIR, '_theme.scss');
  if (fs.existsSync(themePath)) {
    forwardContent += '@forward "./theme";\n';
  }
  
  await writeFile(forwardPath, forwardContent, 'utf8');
  console.log(`✅ 已创建/更新: ${path.relative(process.cwd(), forwardPath)}`);
}

/**
 * 主函数
 */
async function main() {
  try {
    console.log('🔄 开始迁移SCSS文件...');
    
    // 创建或更新_forward.scss
    await createForwardFile();
    
    // 获取所有SCSS文件
    const files = await getAllScssFiles(path.resolve(__dirname, '..'));
    console.log(`🔍 找到${files.length}个SCSS文件`);
    
    // 处理所有文件
    for (const file of files) {
      await processScssFile(file);
    }
    
    console.log('\n✨ 迁移完成!');
    console.log(`📊 统计信息:`);
    console.log(`   - 处理文件数量: ${processedFiles}`);
    console.log(`   - 转换导入语句: ${convertedImports}`);
    
  } catch (error) {
    console.error('❌ 迁移过程中发生错误:', error);
    process.exit(1);
  }
}

// 执行主函数
main(); 