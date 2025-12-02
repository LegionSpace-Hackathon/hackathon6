const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// 读取JSON文件
const zhCN = JSON.parse(fs.readFileSync(path.join(__dirname, '../src/i18n/zh-CN.json'), 'utf8'));
const en = JSON.parse(fs.readFileSync(path.join(__dirname, '../src/i18n/en.json'), 'utf8'));

// 提取所有翻译键
function extractKeys(obj, prefix = '') {
  const keys = [];
  for (const key in obj) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
      keys.push(...extractKeys(obj[key], fullKey));
    } else {
      keys.push(fullKey);
    }
  }
  return keys;
}

const allKeys = [...new Set([...extractKeys(zhCN), ...extractKeys(en)])];
const srcPath = path.join(__dirname, '../src');

console.log('========================================');
console.log('查找未使用的翻译键');
console.log('========================================\n');
console.log(`共有 ${allKeys.length} 个翻译键需要检查...\n`);

const unusedKeys = [];
const usedKeys = [];
let checked = 0;

// 分批检查，显示进度
const batchSize = 50;
for (let i = 0; i < allKeys.length; i += batchSize) {
  const batch = allKeys.slice(i, i + batchSize);
  
  for (const key of batch) {
    checked++;
    
    // 显示进度
    if (checked % 100 === 0) {
      process.stdout.write(`\r检查进度: ${checked}/${allKeys.length} (${Math.floor(checked/allKeys.length*100)}%)`);
    }
    
    try {
      // 搜索翻译键的使用，使用更简单的模式
      const escapedKey = key.replace(/\./g, '\\.');
      
      // 尝试多种搜索模式
      const patterns = [
        `'${key}'`,     // 单引号
        `"${key}"`,     // 双引号  
        `\`${key}\``,   // 反引号
      ];
      
      let found = false;
      for (const pattern of patterns) {
        try {
          const result = execSync(
            `grep -r "${pattern}" "${srcPath}" --include="*.tsx" --include="*.ts" --include="*.jsx" --include="*.js" 2>&1 || true`,
            { encoding: 'utf8', maxBuffer: 10 * 1024 * 1024 }
          );
          
          if (result && result.trim() && !result.includes('No such file')) {
            found = true;
            usedKeys.push(key);
            break;
          }
        } catch (e) {
          // 继续尝试下一个pattern
        }
      }
      
      if (!found) {
        unusedKeys.push(key);
      }
    } catch (error) {
      // 忽略错误，继续检查
    }
  }
}

console.log(`\n\n检查完成！\n`);

// 生成报告
console.log('========================================');
console.log('未使用的翻译键报告');
console.log('========================================\n');
console.log(`共检查: ${allKeys.length} 个键`);
console.log(`使用中: ${usedKeys.length} 个键`);
console.log(`可能未使用: ${unusedKeys.length} 个键`);
console.log(`使用率: ${Math.floor(usedKeys.length/allKeys.length*100)}%\n`);

if (unusedKeys.length > 0) {
  console.log('⚠️  以下键可能未被使用:\n');
  
  // 按前缀分组
  const grouped = {};
  unusedKeys.forEach(key => {
    const prefix = key.split('.')[0];
    if (!grouped[prefix]) {
      grouped[prefix] = [];
    }
    grouped[prefix].push(key);
  });
  
  // 显示前50个
  const keysToShow = unusedKeys.slice(0, 50);
  keysToShow.forEach(k => console.log(`  - ${k}`));
  
  if (unusedKeys.length > 50) {
    console.log(`\n  ... 还有 ${unusedKeys.length - 50} 个未使用的键\n`);
  }
  
  // 生成详细报告
  const report = [];
  report.push('# 未使用的国际化键列表\n');
  report.push(`总计: ${unusedKeys.length} 个可能未使用的键\n`);
  report.push('## 按模块分组\n');
  
  Object.keys(grouped).sort().forEach(prefix => {
    report.push(`### ${prefix} (${grouped[prefix].length} 个)\n`);
    grouped[prefix].forEach(key => {
      report.push(`- \`${key}\``);
    });
    report.push('\n');
  });
  
  report.push('\n## 完整列表\n');
  unusedKeys.forEach(key => {
    report.push(`- \`${key}\``);
  });
  
  fs.writeFileSync(
    path.join(__dirname, '../i18n-unused-keys.md'),
    report.join('\n'),
    'utf8'
  );
  
  // 生成JSON格式便于后续处理
  fs.writeFileSync(
    path.join(__dirname, '../i18n-unused-keys.json'),
    JSON.stringify({
      total: allKeys.length,
      used: usedKeys.length,
      unused: unusedKeys.length,
      unusedKeys: unusedKeys,
      grouped: grouped
    }, null, 2),
    'utf8'
  );
  
  console.log('\n已生成详细报告:');
  console.log('  - i18n-unused-keys.md (Markdown格式)');
  console.log('  - i18n-unused-keys.json (JSON格式)');
} else {
  console.log('✅ 所有翻译键都在使用中！');
}

console.log('\n========================================');
console.log('提示:');
console.log('1. 这是基于简单文本搜索的结果，可能存在假阳性');
console.log('2. 建议手动确认后再删除');
console.log('3. 动态生成的键可能被误判为未使用');
console.log('========================================\n');

