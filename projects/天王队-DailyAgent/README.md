# Space Front (大群空间)

企业级React前端框架，基于React 18 + TypeScript + Redux Toolkit + Vite构建。

## ✨ 最新功能更新

### 🎯 可编辑DIV输入框 (v2.0)

我们将传统的TextArea输入框完全重构为现代化的可编辑div结构，提供更强大的内容编辑能力：

#### 核心特性

- **嵌套编辑结构**：外层主编辑区域 + 内层占位符编辑块
- **模板问题支持**：点击模板问题自动创建占位符编辑块，如 `{企业名称}`
- **智能文本选择**：自动选中占位符内容，便于快速编辑
- **现代化界面**：符合主流应用设计趋势
- **响应式设计**：完美适配移动端和桌面端

#### 使用场景

```typescript
// 预设问题配置
const SALES_PRESET_QUESTIONS: PresetQuestion[] = [
  { text: '挖掘商机', type: 'send' },
  { text: '查询企业', type: 'template', template: '查询的企业：{企业名称}' },
  { text: '录入线索', type: 'template', template: '录入线索：{公司名称}' },
];
```

#### 技术实现亮点

- **DOM动态操作**：使用原生DOM API动态创建占位符编辑块
- **事件代理机制**：智能处理嵌套编辑区域的交互事件
- **内容同步**：实时同步多层编辑内容到主状态
- **Range API**：精确控制文本选择和光标定位

## 🚀 功能特性

- ✅ **国际化支持**（中文/英文）
- ✅ **Redux状态管理**
- ✅ **路由管理与权限控制**
- ✅ **API请求封装**
- ✅ **响应式布局设计**
- ✅ **浅色/深色主题切换**
- ✅ **模块化SCSS**
- ✅ **TypeScript类型安全**
- ✅ **现代化聊天输入**（新增）
- ✅ **智能预设问题**（增强）

## 📦 技术栈

- **框架**: React 18.2.0
- **构建工具**: Vite 4.4.5
- **状态管理**: Redux Toolkit
- **路由**: React Router
- **样式**: SCSS + CSS Variables
- **类型检查**: TypeScript
- **国际化**: i18next
- **HTTP客户端**: Axios

## 🛠️ 开发指南

### 环境要求

- Node.js >= 16.0.0
- npm >= 8.0.0

### 快速开始

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建生产版本
npm run build
```

### 项目结构

```
src/
├── components/          # 通用组件
├── pages/              # 页面组件
│   └── Agent/          # 智能体相关
│       └── components/
│           └── Chat/   # 聊天组件（新架构）
├── stores/             # 状态管理
├── api/                # API接口
├── theme/              # 主题配置
├── i18n/               # 国际化
└── utils/              # 工具函数


##git 仓库
## http://git.tongfudun.com/legion/space/space-front.git

##开发分支
master 产线
pre 灰度




```

## 🎨 架构特色

### 1. 关注点分离

- 业务逻辑、UI展示和状态管理完全分离
- 组件职责单一，便于维护和测试

### 2. 类型安全

- 全面的TypeScript类型定义
- 避免运行时类型错误
- 优秀的开发体验

### 3. 主题系统

- 基于CSS变量的主题切换
- 支持浅色和深色模式
- 集中管理设计tokens

### 4. 性能优化

- 组件懒加载
- React.memo和useCallback优化
- 虚拟滚动支持

## 📋 编码规范

### 命名约定

- **文件夹**: 小写字母 + 短横线 (`user-profile`)
- **组件**: 大驼峰命名 (`UserProfile.tsx`)
- **函数**: 小驼峰命名 (`handleClick`)
- **常量**: 全大写 + 下划线 (`MAX_RETRY_COUNT`)

### 导入规则

```typescript
// 使用相对路径，避免别名导入
import { Component } from './Component';
import { utils } from '../utils';
import { api } from '../../api';
```

### 组件模板

```typescript
import React from 'react';
import './ComponentName.scss';

interface ComponentNameProps {
  className?: string;
  // 其他props...
}

const ComponentName: React.FC<ComponentNameProps> = ({
  className = ''
}) => {
  return (
    <div className={`component-name ${className}`}>
      {/* 组件内容 */}
    </div>
  );
};

export default ComponentName;
```

## 🔧 开发工作流

### 分支管理

- `main`: 主分支（稳定版本）
- `develop`: 开发分支
- `feature/xxx`: 功能分支
- `bugfix/xxx`: 错误修复分支

### 提交规范

```
<type>(<scope>): <subject>

feat: 新功能
fix: 修复bug
docs: 文档更新
style: 代码风格调整
refactor: 重构
perf: 性能优化
test: 测试相关
chore: 构建工具变更
```

## 🚀 部署

### 生产构建

```bash
npm run build
```

### 服务器配置

- 使用Nginx托管静态文件
- 配置路由重定向支持SPA
- 设置API代理和缓存策略

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 🤝 贡献指南

欢迎提交Issue和Pull Request！

1. Fork本仓库
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 创建Pull Request

---

# 是否启用API Mock

VITE_USE_MOCK=true

```

## 主题定制

项目提供了浅色/深色两种主题，可通过以下方式管理：

1. 全局CSS变量定义在 `src/theme/scss/variables.scss`
2. 使用 ThemeToggle 组件切换主题
3. 可通过 `getThemeMode()` 和 `setThemeMode()` 工具函数管理主题

## 国际化支持

添加新语言：

1. 在 `src/i18n/` 目录下创建新的语言文件
2. 在 `src/i18n/index.ts` 中导入并注册

## API模块化

API接口按功能模块组织，位于 `src/api/` 目录：

- `auth` - 认证相关接口
- `user` - 用户相关接口

## 贡献指南

请参阅 [CONTRIBUTING.md](./CONTRIBUTING.md)

## 许可证

[MIT](./LICENSE)

# 智能体功能迁移文档

本文档记录了将demo项目中的智能体功能迁移到Space Front大群空间项目的过程和结果。

## 1. 概述

### 1.1 迁移目标

将demo项目中的智能体相关功能迁移到Space Front项目，包括但不限于：
- 智能体列表页面
- AI代理列表页面
- 智能体详情页面
- 智能体统计页面
- 评论功能
- 图表统计功能

### 1.2 技术栈对比

**Demo项目：**
- React + TypeScript
- Ant Design Mobile (UI组件库)
- React Router
- i18next (国际化)

**Space Front项目：**
- React 18 + TypeScript
- 自定义UI组件
- Redux Toolkit (状态管理)
- React Router
- i18next (国际化)

## 2. 迁移内容

### 2.1 组件迁移

| 组件名称 | 来源 | 目标 | 说明 |
|---------|------|------|------|
| 智能体列表项 | `demo/src/components/listItem` | `src/components/plugins/PluginListItem` | 智能体卡片组件 |
| AI代理列表 | `demo/src/components/aiAgent` | `src/components/plugins/AiAgentList` | AI代理展示组件 |
| 评论表单 | `demo/src/components/comment` | `src/components/plugins/CommentForm` | 评论提交组件 |
| 评论列表 | 新增 | `src/components/plugins/CommentList` | 评论列表展示组件 |
| 图表组件 | `demo/src/components/chart` | `src/components/common/ChartComponent` | 统计图表组件 |

### 2.2 页面迁移

| 页面名称 | 来源 | 目标 | 说明 |
|---------|------|------|------|
| 智能体列表 | `demo/src/pages/plugin` | `src/pages/Plugins/PluginList` | 市场列表页 |
| AI代理列表 | `demo/src/pages/plugin` | `src/pages/Plugins/AiList` | AI代理列表页 |
| 智能体详情 | `demo/src/pages/statistics` | `src/pages/Plugins/PluginDetail` | 智能体详情页 |
| 智能体统计 | `demo/src/pages/statistics` | `src/pages/Plugins/PluginStatistics` | 智能体统计数据页 |

### 2.3 API接口

以下API接口已在`src/api/chainmeet/index.ts`中实现：

- `postPluginList`: 获取智能体列表
- `postAiAgentList`: 获取AI代理列表
- `postPluginDetail`: 获取智能体详情
- `postPluginCommentList`: 获取智能体评论列表
- `postAddComment`: 添加评论
- `postPluginStatistics`: 获取智能体统计数据
- `postPluginEchartStatistics`: 获取智能体图表统计数据
- `postPluginStatisticsName`: 获取智能体统计数据名称列表

### 2.4 路由配置

在`src/routes/publicRoutes.tsx`中添加了以下路由：

- `/plugins`: 智能体列表页
- `/plugins/list`: 智能体列表页（别名）
- `/plugins/ai-list`: AI代理列表页
- `/plugins/detail/:id`: 智能体详情页
- `/plugins/statistics/:id`: 智能体统计页面

## 3. 功能特性

### 3.1 智能体列表

- 展示所有可用的智能体
- 支持点击查看详情
- 显示智能体基本信息（名称、图标、描述）
- 显示简单的数据统计信息

### 3.2 AI代理列表

- 展示AI相关的智能体
- 包含筛选和排序功能
- 显示AI代理基本信息

### 3.3 智能体详情

- 显示智能体详细信息
- 分区展示：数据概览、关于智能体、用户评论
- 提供订阅和打开智能体的功能
- 支持查看和添加评论

### 3.4 智能体统计

- 展示智能体运营数据
- 支持日/周/月数据切换
- 提供趋势图表展示
- 支持选择不同的统计指标

### 3.5 评论功能

- 查看智能体评论列表
- 添加新评论
- 评分和文字评价

### 3.6 国际化支持

所有迁移的功能都支持中英文双语切换，翻译文件位于：
- `src/i18n/zh-CN.json`
- `src/i18n/en.json`

## 4. 迁移中的调整

### 4.1 UI组件调整

由于两个项目使用不同的UI库，做了以下调整：
- 从Ant Design Mobile组件替换为自定义组件
- 重新实现了评论表单和评论列表
- 调整了样式以符合Space Front的设计风格

### 4.2 API调用调整

- 使用Space Front项目的API客户端进行请求
- 保持了相同的请求参数和响应格式
- 添加了更完善的错误处理和加载状态

### 4.3 状态管理调整

- 使用React hooks进行组件内状态管理
- 没有使用全局Redux状态，因为这些功能主要是页面级别的状态

## 5. 后续优化建议

- 添加更多交互动画和过渡效果
- 优化移动端适配和响应式设计
- 实现完整的日期选择器功能
- 添加数据缓存减少重复请求
- 优化大数据量下的图表性能

## 6. 结论

智能体功能已成功从demo项目迁移到Space Front项目，保持了原有功能的完整性，并进行了适当的调整以符合Space Front的架构和设计风格。迁移过程中关注了代码质量、性能和用户体验，确保了功能的可用性和可维护性。
```
