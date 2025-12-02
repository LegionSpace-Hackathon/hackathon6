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

const zhKeys = extractKeys(zhCN);
const enKeys = extractKeys(en);

console.log('========================================');
console.log('国际化配置检查报告');
console.log('========================================\n');

// 1. 检查键的一致性
console.log('1. 检查中英文配置键的一致性');
console.log('========================================');

const zhOnlyKeys = zhKeys.filter(k => !enKeys.includes(k));
const enOnlyKeys = enKeys.filter(k => !zhKeys.includes(k));

if (zhOnlyKeys.length > 0) {
  console.log('\n❌ 只存在于中文配置中的键 (缺少英文翻译):');
  zhOnlyKeys.forEach(k => console.log(`  - ${k}`));
}

if (enOnlyKeys.length > 0) {
  console.log('\n❌ 只存在于英文配置中的键 (缺少中文翻译):');
  enOnlyKeys.forEach(k => console.log(`  - ${k}`));
}

if (zhOnlyKeys.length === 0 && enOnlyKeys.length === 0) {
  console.log('✅ 中英文配置键完全一致');
}

// 2. 检查重复值
console.log('\n\n2. 检查重复的翻译值');
console.log('========================================');

function findDuplicates(obj, prefix = '') {
  const values = new Map();
  
  function traverse(o, p) {
    for (const key in o) {
      const fullKey = p ? `${p}.${key}` : key;
      if (typeof o[key] === 'string') {
        const value = o[key].trim();
        if (values.has(value)) {
          values.get(value).push(fullKey);
        } else {
          values.set(value, [fullKey]);
        }
      } else if (typeof o[key] === 'object' && o[key] !== null) {
        traverse(o[key], fullKey);
      }
    }
  }
  
  traverse(obj, prefix);
  
  // 过滤出真正的重复项（忽略空字符串）
  const realDuplicates = [];
  for (const [value, keys] of values.entries()) {
    if (keys.length > 1 && value.length > 0) {
      realDuplicates.push({ value, keys });
    }
  }
  
  return realDuplicates;
}

const zhDuplicates = findDuplicates(zhCN);
const enDuplicates = findDuplicates(en);

if (zhDuplicates.length > 0) {
  console.log(`\n⚠️  中文配置中发现 ${zhDuplicates.length} 组重复值:\n`);
  zhDuplicates.slice(0, 20).forEach(({ value, keys }) => {
    console.log(`  值: "${value}"`);
    console.log(`  键: ${keys.join(', ')}\n`);
  });
  if (zhDuplicates.length > 20) {
    console.log(`  ... 还有 ${zhDuplicates.length - 20} 组重复值`);
  }
}

if (enDuplicates.length > 0) {
  console.log(`\n⚠️  英文配置中发现 ${enDuplicates.length} 组重复值:\n`);
  enDuplicates.slice(0, 20).forEach(({ value, keys }) => {
    console.log(`  值: "${value}"`);
    console.log(`  键: ${keys.join(', ')}\n`);
  });
  if (enDuplicates.length > 20) {
    console.log(`  ... 还有 ${enDuplicates.length - 20} 组重复值`);
  }
}

if (zhDuplicates.length === 0 && enDuplicates.length === 0) {
  console.log('✅ 没有发现重复的翻译值');
}

// 3. 统计信息
console.log('\n\n3. 统计信息');
console.log('========================================');
console.log(`中文配置键数量: ${zhKeys.length}`);
console.log(`英文配置键数量: ${enKeys.length}`);
console.log(`不一致键数量: ${zhOnlyKeys.length + enOnlyKeys.length}`);
console.log(`中文重复值组数: ${zhDuplicates.length}`);
console.log(`英文重复值组数: ${enDuplicates.length}`);

// 4. 生成重复项清理建议
if (zhDuplicates.length > 0 || enDuplicates.length > 0) {
  console.log('\n\n4. 重复值清理建议');
  console.log('========================================');
  
  const duplicateReport = [];
  duplicateReport.push('# 国际化配置重复值清理报告\n');
  duplicateReport.push('## 中文重复值\n');
  
  if (zhDuplicates.length > 0) {
    zhDuplicates.forEach(({ value, keys }) => {
      duplicateReport.push(`### 值: "${value}"`);
      duplicateReport.push('使用的键:');
      keys.forEach(k => duplicateReport.push(`- ${k}`));
      duplicateReport.push('\n');
    });
  } else {
    duplicateReport.push('无重复值\n');
  }
  
  duplicateReport.push('\n## 英文重复值\n');
  
  if (enDuplicates.length > 0) {
    enDuplicates.forEach(({ value, keys }) => {
      duplicateReport.push(`### 值: "${value}"`);
      duplicateReport.push('使用的键:');
      keys.forEach(k => duplicateReport.push(`- ${k}`));
      duplicateReport.push('\n');
    });
  } else {
    duplicateReport.push('无重复值\n');
  }
  
  fs.writeFileSync(
    path.join(__dirname, '../i18n-duplicate-report.md'),
    duplicateReport.join('\n'),
    'utf8'
  );
  console.log('\n已生成重复值报告: i18n-duplicate-report.md');
}

// 5. 生成不一致键列表
if (zhOnlyKeys.length > 0 || enOnlyKeys.length > 0) {
  const inconsistentKeys = [];
  inconsistentKeys.push('# 国际化配置不一致键列表\n');
  
  if (zhOnlyKeys.length > 0) {
    inconsistentKeys.push('## 只在中文配置中存在的键（需要添加英文翻译）:\n');
    zhOnlyKeys.forEach(k => inconsistentKeys.push(`- ${k}`));
    inconsistentKeys.push('\n');
  }
  
  if (enOnlyKeys.length > 0) {
    inconsistentKeys.push('## 只在英文配置中存在的键（需要添加中文翻译）:\n');
    enOnlyKeys.forEach(k => inconsistentKeys.push(`- ${k}`));
    inconsistentKeys.push('\n');
  }
  
  fs.writeFileSync(
    path.join(__dirname, '../i18n-inconsistent-keys.md'),
    inconsistentKeys.join('\n'),
    'utf8'
  );
  console.log('已生成不一致键列表: i18n-inconsistent-keys.md');
}

console.log('\n========================================');
console.log('检查完成!');
console.log('========================================\n');

console.log('\n提示: 由于项目较大，未使用键的检查可能需要较长时间。');
console.log('建议通过IDE的全局搜索功能手动确认可疑的未使用键。\n');

