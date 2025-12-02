const fs = require('fs');
const path = require('path');

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

// 获取嵌套值
function getValue(obj, path) {
  const keys = path.split('.');
  let value = obj;
  for (const key of keys) {
    value = value?.[key];
  }
  return value;
}

// 生成缺失翻译的补丁
function generatePatch(sourceObj, targetObj, missingKeys, sourceLang, targetLang) {
  const patch = {};
  
  for (const key of missingKeys) {
    const sourceValue = getValue(sourceObj, key);
    if (sourceValue) {
      // 生成嵌套对象结构
      const keys = key.split('.');
      let current = patch;
      
      for (let i = 0; i < keys.length - 1; i++) {
        if (!current[keys[i]]) {
          current[keys[i]] = {};
        }
        current = current[keys[i]];
      }
      
      // 设置值，添加翻译提示
      current[keys[keys.length - 1]] = `[需要翻译] ${sourceValue}`;
    }
  }
  
  return patch;
}

const zhKeys = extractKeys(zhCN);
const enKeys = extractKeys(en);

const zhOnlyKeys = zhKeys.filter(k => !enKeys.includes(k));
const enOnlyKeys = enKeys.filter(k => !zhKeys.includes(k));

console.log('========================================');
console.log('生成缺失翻译补丁');
console.log('========================================\n');

// 生成英文补丁（基于中文）
if (zhOnlyKeys.length > 0) {
  console.log(`\n生成英文补丁 (${zhOnlyKeys.length} 个缺失翻译)...\n`);
  
  const enPatch = generatePatch(zhCN, en, zhOnlyKeys, 'zh', 'en');
  
  const patchContent = `// 英文配置补丁 - 需要添加的翻译
// 以下内容需要翻译后合并到 src/i18n/en.json

${JSON.stringify(enPatch, null, 2)}

// 使用方法:
// 1. 将上述JSON内容翻译成英文
// 2. 手动合并到 src/i18n/en.json 文件中对应的位置
// 3. 删除翻译提示前缀 "[需要翻译]"
`;
  
  fs.writeFileSync(
    path.join(__dirname, '../i18n-en-patch.json'),
    patchContent,
    'utf8'
  );
  
  console.log('✅ 已生成: i18n-en-patch.json');
  console.log('\n缺失的英文翻译:');
  zhOnlyKeys.slice(0, 10).forEach(key => {
    const value = getValue(zhCN, key);
    console.log(`  ${key}: "${value}"`);
  });
  if (zhOnlyKeys.length > 10) {
    console.log(`  ... 还有 ${zhOnlyKeys.length - 10} 个`);
  }
}

// 生成中文补丁（基于英文）
if (enOnlyKeys.length > 0) {
  console.log(`\n生成中文补丁 (${enOnlyKeys.length} 个缺失翻译)...\n`);
  
  const zhPatch = generatePatch(en, zhCN, enOnlyKeys, 'en', 'zh');
  
  const patchContent = `// 中文配置补丁 - 需要添加的翻译
// 以下内容需要翻译后合并到 src/i18n/zh-CN.json

${JSON.stringify(zhPatch, null, 2)}

// 使用方法:
// 1. 将上述JSON内容翻译成中文
// 2. 手动合并到 src/i18n/zh-CN.json 文件中对应的位置
// 3. 删除翻译提示前缀 "[需要翻译]"
`;
  
  fs.writeFileSync(
    path.join(__dirname, '../i18n-zh-patch.json'),
    patchContent,
    'utf8'
  );
  
  console.log('✅ 已生成: i18n-zh-patch.json');
  console.log('\n缺失的中文翻译:');
  enOnlyKeys.slice(0, 10).forEach(key => {
    const value = getValue(en, key);
    console.log(`  ${key}: "${value}"`);
  });
  if (enOnlyKeys.length > 10) {
    console.log(`  ... 还有 ${enOnlyKeys.length - 10} 个`);
  }
}

console.log('\n========================================');
console.log('补丁生成完成!');
console.log('========================================');

console.log('\n📋 下一步操作:');
console.log('1. 查看生成的补丁文件');
console.log('2. 翻译其中的内容');
console.log('3. 手动合并到对应的JSON文件中');
console.log('4. 运行检查脚本确认问题已解决\n');

// 生成便于复制粘贴的清单
console.log('\n📝 待翻译键清单已保存到:');
if (zhOnlyKeys.length > 0) {
  const zhOnlyList = zhOnlyKeys.map(key => {
    const value = getValue(zhCN, key);
    return `"${key}": "${value}"`;
  }).join(',\n');
  
  fs.writeFileSync(
    path.join(__dirname, '../i18n-zh-only-keys.txt'),
    `# 只在中文配置中存在的键\n\n${zhOnlyList}`,
    'utf8'
  );
  console.log('  - i18n-zh-only-keys.txt (中文 -> 需翻译成英文)');
}

if (enOnlyKeys.length > 0) {
  const enOnlyList = enOnlyKeys.map(key => {
    const value = getValue(en, key);
    return `"${key}": "${value}"`;
  }).join(',\n');
  
  fs.writeFileSync(
    path.join(__dirname, '../i18n-en-only-keys.txt'),
    `# 只在英文配置中存在的键\n\n${enOnlyList}`,
    'utf8'
  );
  console.log('  - i18n-en-only-keys.txt (英文 -> 需翻译成中文)');
}

console.log('\n');

