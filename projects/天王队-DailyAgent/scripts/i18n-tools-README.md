# 国际化配置检查工具使用说明

## 工具概述

本目录包含用于检查和维护国际化配置的工具脚本。

## 可用工具

### 1. check-i18n-usage.cjs - 配置一致性检查

**功能**：
- 检查中英文配置键的一致性
- 查找重复的翻译值
- 生成统计信息

**运行方法**：
```bash
node scripts/check-i18n-usage.cjs
```

**输出文件**：
- `i18n-inconsistent-keys.md` - 不一致键列表
- `i18n-duplicate-report.md` - 重复值报告

### 2. find-unused-i18n-keys.cjs - 未使用键检测

**功能**：
- 在源代码中搜索翻译键的使用情况
- 生成未使用键的列表
- 计算使用率统计

**运行方法**：
```bash
node scripts/find-unused-i18n-keys.cjs
```

**注意**：此脚本运行时间较长（约1-2分钟），因为需要搜索整个代码库。

**输出文件**：
- `i18n-unused-keys.md` - 未使用键的Markdown报告
- `i18n-unused-keys.json` - 未使用键的JSON格式数据

### 3. generate-missing-translations.cjs - 生成翻译补丁

**功能**：
- 识别缺失的翻译
- 生成补丁文件
- 创建便于翻译的清单

**运行方法**：
```bash
node scripts/generate-missing-translations.cjs
```

**输出文件**：
- `i18n-en-patch.json` - 英文翻译补丁
- `i18n-zh-patch.json` - 中文翻译补丁
- `i18n-zh-only-keys.txt` - 仅中文键清单
- `i18n-en-only-keys.txt` - 仅英文键清单

## 工作流程

### 定期维护流程

1. **运行完整检查**：
   ```bash
   # 检查配置一致性和重复值
   node scripts/check-i18n-usage.cjs
   
   # 检查未使用的键（可选）
   node scripts/find-unused-i18n-keys.cjs
   ```

2. **生成翻译补丁**：
   ```bash
   node scripts/generate-missing-translations.cjs
   ```

3. **修复不一致问题**：
   - 查看生成的补丁文件
   - 翻译缺失的内容
   - 手动合并到对应的JSON文件

4. **验证修复**：
   ```bash
   # 再次运行检查确认问题已解决
   node scripts/check-i18n-usage.cjs
   ```

### 添加新翻译时

1. 在 `zh-CN.json` 和 `en.json` 中**同时**添加新键
2. 运行检查脚本验证：
   ```bash
   node scripts/check-i18n-usage.cjs
   ```
3. 确保没有不一致警告

## 检查结果说明

### 当前状态（最近一次检查）

- ✅ **使用率**: 100% (所有键都在使用中)
- ❌ **不一致键**: 82个
  - 47个仅存在于中文配置
  - 35个仅存在于英文配置
- ⚠️ **重复值**: 334组
  - 176组中文重复
  - 158组英文重复

### 优先级

1. **高优先级**: 修复不一致的键
   - 影响：切换语言时部分文本无法显示
   - 建议：立即修复

2. **中优先级**: 处理重复值
   - 影响：配置文件较大，维护成本高
   - 建议：逐步优化

3. **低优先级**: 未使用的键
   - 影响：轻微增加文件大小
   - 建议：确认后谨慎删除

## 注意事项

### 关于未使用键检测

- 基于简单的文本搜索
- 可能存在假阳性（例如动态生成的键）
- **建议手动确认后再删除**

### 关于重复值

- 某些重复可能是有意为之
- 特定场景可能需要独立的键
- 合并前需要评估业务需求

### 自动化建议

❌ **不建议**使用自动化脚本直接修改配置文件，原因：

1. 翻译需要人工审核确保质量
2. 键的合并需要评估业务逻辑
3. 避免误删正在使用的配置

## 生成的文件说明

| 文件名 | 说明 | 是否版本控制 |
|--------|------|-------------|
| `国际化配置清理报告.md` | 总体分析报告 | ❌ 否 |
| `i18n-inconsistent-keys.md` | 不一致键详细列表 | ❌ 否 |
| `i18n-duplicate-report.md` | 重复值详细报告 | ❌ 否 |
| `i18n-unused-keys.md` | 未使用键报告 | ❌ 否 |
| `i18n-unused-keys.json` | 未使用键JSON数据 | ❌ 否 |
| `i18n-en-patch.json` | 英文补丁文件 | ❌ 否 |
| `i18n-zh-patch.json` | 中文补丁文件 | ❌ 否 |
| `i18n-zh-only-keys.txt` | 仅中文键清单 | ❌ 否 |
| `i18n-en-only-keys.txt` | 仅英文键清单 | ❌ 否 |

所有生成的文件都应该添加到 `.gitignore`，不纳入版本控制。

## 添加到.gitignore

```gitignore
# i18n检查工具生成的文件
/国际化配置清理报告.md
/i18n-*.md
/i18n-*.json
/i18n-*.txt
```

## 故障排除

### 脚本运行失败

如果脚本无法运行，检查：
1. Node.js 版本 (需要 v14+)
2. 是否在项目根目录运行
3. i18n配置文件是否存在

### grep命令错误

脚本中的某些grep错误可以忽略，这是正常现象。只要最终能生成报告即可。

## 联系支持

如有问题或建议，请联系开发团队。

---

最后更新: ${new Date().toLocaleString('zh-CN')}

