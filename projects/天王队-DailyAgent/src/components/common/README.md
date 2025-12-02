# 动画组件使用指南

本文档介绍如何使用项目中的动画组件系统，该系统结合了 `animate.css` 和 `react-transition-group` 来实现丰富的页面动画效果。

## 组件概览

### 1. AnimatedSection - 通用动画容器

最常用的动画组件，支持多种入场动画效果。

```tsx
import { AnimatedSection } from '../common';

<AnimatedSection
  animation="fadeIn"          // 动画类型
  duration={1000}            // 持续时间(ms)
  delay={200}               // 延迟时间(ms)  
  threshold={0.1}           // 触发阈值(0-1)
  rootMargin="50px"         // 提前触发距离
  className="my-section"    // 自定义类名
  triggerOnce={true}        // 是否只触发一次
  disabled={false}          // 是否禁用动画
>
  <div>您的内容</div>
</AnimatedSection>
```

#### 支持的动画类型

| 动画类型 | 效果描述 | 适用场景 |
|---------|---------|---------|
| `fadeIn` | 淡入效果 | 通用，适合文本和图片 |
| `slideInUp` | 从下往上滑入 | 适合卡片、底部内容 |
| `slideInDown` | 从上往下滑入 | 适合头部、标题 |
| `slideInLeft` | 从左往右滑入 | 适合左侧内容 |
| `slideInRight` | 从右往左滑入 | 适合右侧内容 |
| `scaleIn` | 缩放进入 | 适合按钮、图标 |
| `bounceIn` | 弹跳进入 | 适合强调内容 |
| `rotateIn` | 旋转进入 | 适合装饰元素 |
| `flipInX` | 水平翻转进入 | 适合卡片翻转 |
| `flipInY` | 垂直翻转进入 | 适合特殊效果 |
| `zoomIn` | 放大进入 | 适合视频、图片展示 |
| `lightSpeedIn` | 光速进入 | 适合科技感内容 |

### 2. StaggeredAnimation - 交错动画

用于实现多个子元素依次动画的效果。

```tsx
import { StaggeredAnimation } from '../common';

<StaggeredAnimation
  animation="fadeIn"        // 子元素动画类型
  staggerDelay={200}       // 每个子元素间隔时间(ms)
  baseDuration={1000}      // 基础动画持续时间
  threshold={0.1}          // 触发阈值
  rootMargin="50px"        // 提前触发距离
  className="stagger-container"
>
  <div>子元素 1</div>
  <div>子元素 2</div>
  <div>子元素 3</div>
</StaggeredAnimation>
```

### 3. ScrollTriggeredHeader - 滚动触发头部

专门用于头部组件，带有滚动状态变化效果。

```tsx
import { ScrollTriggeredHeader } from '../common';

<ScrollTriggeredHeader
  scrollThreshold={100}        // 滚动阈值
  initialAnimation="slideInDown" // 初始动画
  className="header-wrapper"
>
  <Header />
</ScrollTriggeredHeader>
```

## 最佳实践

### 1. 性能优化

- 对于大量动画元素，建议使用 `triggerOnce={true}` 避免重复触发
- 移动端使用较短的动画时间（600-800ms）
- 避免同时触发过多动画

### 2. 用户体验

- 遵循自然的动画顺序（从上到下，从左到右）
- 使用合适的延迟时间避免动画冲突
- 考虑用户的 `prefers-reduced-motion` 设置

### 3. 动画选择指南

#### 首屏内容
```tsx
// 标题 - 淡入效果
<AnimatedSection animation="fadeIn" duration={1200} delay={200}>
  <h1>页面标题</h1>
</AnimatedSection>

// 主要内容 - 从下滑入
<AnimatedSection animation="slideInUp" duration={1000} delay={400}>
  <div>主要内容</div>
</AnimatedSection>
```

#### 功能展示区域
```tsx
// 交替显示的功能卡片
<StaggeredAnimation animation="slideInLeft" staggerDelay={300}>
  <FeatureCard />
  <FeatureCard />
  <FeatureCard />
</StaggeredAnimation>
```

#### 视频/媒体内容
```tsx
// 视频内容 - 缩放效果
<AnimatedSection animation="zoomIn" duration={1000} threshold={0.2}>
  <VideoPlayer />
</AnimatedSection>
```

#### 科技/AI相关内容
```tsx
// AI终端 - 光速效果
<AnimatedSection animation="lightSpeedIn" duration={1200}>
  <AITerminal />
</AnimatedSection>
```

#### 下载/行动号召
```tsx
// 下载按钮 - 弹跳效果
<AnimatedSection animation="bounceIn" duration={1200}>
  <DownloadButton />
</AnimatedSection>
```

#### 页脚内容
```tsx
// 页脚 - 从下滑入
<AnimatedSection animation="slideInUp" duration={1000} delay={100}>
  <Footer />
</AnimatedSection>
```

## 调试和定制

### 查看动画效果

1. 打开浏览器开发者工具
2. 在 Elements 面板中找到动画元素
3. 观察 CSS 类名的变化（如 `animate__animated animate__fadeIn`）

### 自定义动画时长

```tsx
// 方法1：通过 props
<AnimatedSection duration={1500} />

// 方法2：通过 CSS 变量
<AnimatedSection 
  style={{ '--animate-duration': '1.5s' } as React.CSSProperties}
/>
```

### 禁用动画

```tsx
// 条件性禁用
<AnimatedSection disabled={isLowPowerMode}>
  <Content />
</AnimatedSection>
```

## 注意事项

1. **避免动画冲突**：确保同一时间不会有过多动画同时执行
2. **移动端优化**：动画在移动端会自动缩短时长
3. **无障碍支持**：系统已内置对 `prefers-reduced-motion` 的支持
4. **性能监控**：使用 `will-change` 属性进行了性能优化，动画完成后会自动清理

## 故障排除

### 动画不触发
- 检查元素是否进入视窗
- 确认 `threshold` 和 `rootMargin` 设置
- 验证 `triggerOnce` 状态

### 动画卡顿
- 检查是否同时运行过多动画
- 确认硬件加速是否生效
- 考虑降低动画复杂度

### 样式冲突
- 检查是否有其他 CSS 规则覆盖
- 确认 `animate.css` 已正确导入
- 验证自定义样式的优先级 