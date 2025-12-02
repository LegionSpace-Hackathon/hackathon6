# 脚本工具说明

此目录包含项目中使用的各种脚本工具。

## SCSS迁移工具

### migrate-scss.js

这个脚本用于将项目中的SCSS文件从旧的@import语法迁移到新的@use/@forward语法。此迁移解决了Dart Sass的"legacy-js-api"废弃警告问题。

**用法:**

```bash
npm run migrate:scss
```

**功能:**

- 遍历所有SCSS文件，将@import语法转换为@use语法
- 创建或更新_forward.scss文件，统一转发主题变量和混合器
- 处理相对路径和绝对路径导入
- 保持主题变量优先导入
- 避免循环依赖

### optimize-scss.js

用于优化SCSS文件结构和导入关系。

**用法:**

```bash
node scripts/optimize-scss.js
```

### generateWebPImages.js

用于将项目中的图片文件转换为WebP格式，提高加载性能。

**用法:**

```bash
node scripts/generateWebPImages.js
```

### update-scss-imports.js

用于更新SCSS导入路径，主要是批量替换import路径。

**用法:**

```bash
node scripts/update-scss-imports.js
```

## 如何解决SCSS废弃警告

项目使用了以下方法解决SCSS废弃警告:

1. 在`.sassrc.js`中配置`api: 'modern'`启用新的JavaScript API
2. 使用环境变量`SASS_QUIET_DEPS=true`禁用依赖包中的警告
3. 在`vite.config.ts`中为SCSS添加现代化配置
4. 将@import语法替换为@use/@forward语法
5. 使用`additionalData`预载入全局变量和混合器

## SCSS模块化结构

项目现在使用以下SCSS模块化结构：

- `src/theme/scss/_variables.scss`: CSS变量定义
- `src/theme/scss/_mixins.scss`: 实用功能mixins
- `src/theme/scss/_forward.scss`: 转发模块，提供统一导入点
- `src/styles/_utils.scss`: 工具类定义

组件可以通过以下方式导入所有主题功能：

```scss
@use '../相对路径/theme/scss/_forward' as *;
``` 