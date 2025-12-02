# H5登录页面

基于Figma设计稿开发的H5登录页面，支持手机号验证码登录和邮箱密码登录。

## 功能特性

- ✅ 手机号验证码登录
- ✅ 邮箱密码登录  
- ✅ 登录方式切换
- ✅ 登录后自动跳转回原页面
- ✅ 支持多参数传输
- ✅ 国际化支持（中文/英文）
- ✅ 响应式设计
- ✅ 浅色/深色主题支持
- ✅ 完整的错误处理
- ✅ 验证码倒计时功能

## 页面访问

```
/login
```

## URL参数

登录页面支持以下URL参数：

- `redirect`: 登录成功后跳转的页面路径（默认：`/`）
- `params`: 需要传递给目标页面的参数（JSON字符串，经过URL编码）

### 示例

```javascript
// 基本跳转
/login?redirect=/profile

// 带参数跳转
/login?redirect=/profile&params=%7B%22tab%22%3A%22settings%22%7D
// 解码后的params: {"tab":"settings"}
```

## 使用方式

### 1. 使用LoginGuard保护路由

```tsx
import LoginGuard from '../../components/LoginGuard';

const ProtectedPage = () => {
  return (
    <LoginGuard>
      <div>这是需要登录才能访问的页面</div>
    </LoginGuard>
  );
};
```

### 2. 使用useAuth Hook

```tsx
import { useAuth } from '../../hooks';

const MyComponent = () => {
  const { isLoggedIn, user, requireLogin, handleLogout } = useAuth();
  
  const handleProtectedAction = () => {
    if (!requireLogin('/current-page', { action: 'protected' })) {
      return; // 用户未登录，已自动跳转到登录页
    }
    
    // 执行需要登录的操作
    console.log('用户已登录，可以执行操作');
  };
  
  return (
    <div>
      {isLoggedIn ? (
        <div>
          <p>欢迎, {user?.username}!</p>
          <button onClick={handleLogout}>退出登录</button>
        </div>
      ) : (
        <button onClick={() => requireLogin()}>请先登录</button>
      )}
      
      <button onClick={handleProtectedAction}>
        执行需要登录的操作
      </button>
    </div>
  );
};
```

### 3. 手动跳转到登录页

```tsx
import { useNavigate } from 'react-router-dom';
import { redirectToLogin } from '../../utils/loginUtils';

const MyComponent = () => {
  const navigate = useNavigate();
  
  const handleLogin = () => {
    // 简单跳转
    redirectToLogin(navigate);
    
    // 指定返回页面
    redirectToLogin(navigate, '/profile');
    
    // 带参数跳转
    redirectToLogin(navigate, '/profile', { tab: 'settings', id: '123' });
  };
  
  return (
    <button onClick={handleLogin}>登录</button>
  );
};
```

## Mock登录凭据

目前使用Mock数据进行测试：

### 手机号登录
- 任意手机号
- 验证码：`123456`

### 邮箱登录
- 任意邮箱地址
- 密码：`123456`

## API接口

### 手机号登录
```typescript
authAPI.phoneLogin({
  phone: '13800138000',
  verifyCode: '123456',
  countryCode: '+86'
})
```

### 邮箱登录
```typescript
authAPI.emailLogin({
  email: 'user@example.com',
  password: '123456'
})
```

### 获取验证码
```typescript
authAPI.getVerifyCode({
  phone: '13800138000',
  countryCode: '+86'
})
```

## 样式定制

登录页面支持主题变量定制，可在 `src/theme/scss/variables.scss` 中修改：

```scss
// 主色调
--primary-color: #1dbb88;

// 背景色
--background-color: #ffffff;
--surface-color: #f6f8fa;

// 文字颜色
--text-primary: #222222;
--text-secondary: #a8a8a8;

// 错误颜色
--error-color: #dc2626;
```

## 国际化

登录页面完全支持国际化，相关翻译文件：

- 中文：`src/i18n/zh-CN.json`
- 英文：`src/i18n/en.json`

### 添加新语言

1. 在 `src/i18n/` 目录下添加对应的语言文件
2. 在语言文件中添加 `login` 相关的翻译
3. 在 `src/i18n/index.ts` 中注册新语言

## 错误处理

登录页面包含完整的错误处理：

- 表单验证错误
- 网络请求错误  
- 服务器响应错误
- 用户友好的错误提示

## 开发注意事项

1. **API替换**：目前使用Mock数据，后续需要替换为真实API
2. **验证码逻辑**：需要对接真实的短信验证码服务
3. **安全性**：生产环境需要添加防暴力破解等安全措施
4. **App唤起**：需要完善App唤起逻辑

## 文件结构

```
src/pages/Login/
├── index.tsx           # 登录页面组件
├── Login.scss          # 页面样式
└── README.md           # 文档

src/components/LoginGuard/
├── index.ts            # 导出文件
└── LoginGuard.tsx      # 登录保护组件

src/hooks/
└── useAuth.ts          # 认证Hook

src/utils/
└── loginUtils.ts       # 登录工具函数

src/api/
└── auth.ts             # 认证API接口
```

## 更新日志

### v1.0.0 (2024-12-19)
- ✅ 初始版本发布
- ✅ 支持手机号和邮箱登录
- ✅ 完整的UI和交互
- ✅ 国际化支持
- ✅ 响应式设计
- ✅ 登录状态管理
- ✅ 自动跳转功能
