# AI聊天界面

一个 React 聊天应用，支持文本消息、附件上传和多种技能功能。

## 功能特性

- 💬 文本消息发送和接收
- 📎 附件上传（支持多文件）
- 🎨 现代化 UI 设计
- 🛠️ 技能按钮（编程、AI PPT、图像生成等）
- 📱 响应式设计，支持移动端
- 🔄 自动滚动到最新消息
- ⏰ 消息时间戳显示

## 安装和运行

### 1. 安装依赖

```bash
npm install
```

### 2. 启动开发服务器

```bash
npm run dev
```

或者

```bash
npm start
```

应用将在 `http://localhost:3000` 启动，浏览器会自动打开。

### 3. 构建生产版本

```bash
npm run build
```

## 项目结构

```
Hackathon/
├── public/
│   └── index.html          # HTML 模板
├── src/
│   ├── components/
│   │   ├── ChatInterface.tsx    # 主聊天界面组件
│   │   ├── MessageInput.tsx     # 消息输入组件
│   │   └── MessageList.tsx       # 消息列表组件
│   ├── types/
│   │   └── index.ts              # TypeScript 类型定义
│   ├── utils/
│   │   └── greeting.ts           # 问候语工具函数
│   ├── App.tsx                   # 主应用组件
│   ├── index.tsx                 # 入口文件
│   └── styles.css                # 全局样式
├── package.json
├── tsconfig.json            # TypeScript 配置
├── webpack.config.js
└── README.md
```

## 使用说明

1. **发送文本消息**：在输入框中输入文本，按 Enter 或点击发送按钮
2. **上传附件**：点击📎图标选择文件，支持多文件上传
3. **使用技能**：点击底部的技能按钮快速使用相应功能
4. **浏览器调试**：打开浏览器开发者工具（F12）进行调试

## 技术栈

- React 18
- TypeScript
- Webpack 5
- Babel
- CSS3

## 浏览器支持

- Chrome (推荐)
- Firefox
- Safari
- Edge

## 开发说明

项目使用 Webpack Dev Server 进行开发，支持热模块替换（HMR），修改代码后会自动刷新。

在浏览器中打开开发者工具（F12）可以进行：
- 查看 React 组件树（需要安装 React DevTools 扩展）
- 调试 TypeScript/JavaScript 代码
- 检查网络请求
- 查看控制台日志

## TypeScript 支持

项目使用 TypeScript 编写，提供完整的类型安全：
- 所有组件都有类型定义
- Props 接口定义在 `src/types/index.ts`
- 严格的类型检查，减少运行时错误

