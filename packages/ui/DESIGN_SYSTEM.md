# Cherry Studio Design System 集成方案

本文档聚焦三个核心问题：

1. **如何将 todocss.css 集成到 Tailwind CSS v4**
2. **如何在项目中使用集成后的设计系统**
3. **如何平衡 UI 库和主包的需求**

---

## 一、集成策略

### 1.1 文件架构

```
todocss.css (设计师提供)
    ↓ 转换 & 优化
design-tokens.css (--ds-* 变量)
    ↓ @theme inline 映射
globals.css (cs-* 工具类)
    ↓ 开发者使用
React Components
```

### 1.2 核心转换规则

#### 变量简化

```css
/* todocss.css */
--Brand--Base_Colors--Primary: hsla(84, 81%, 44%, 1);

/* ↓ 转换为 design-tokens.css */
--ds-primary: hsla(84, 81%, 44%, 1);

/* ↓ 映射到 globals.css */
@theme inline {
  --color-cs-primary: var(--ds-primary);
}

/* ↓ 生成工具类 */
bg-cs-primary, text-cs-primary, border-cs-primary
```

#### 去除冗余

- **间距/尺寸合并**: `--Spacing--md` 和 `--Sizing--md` 值相同 → 统一为 `--ds-size-md`
- **透明度废弃**: `--Opacity--Red--Red-80` → 使用 `bg-cs-destructive/80`
- **错误修正**: `--Font_weight--Regular: 400px` → `--ds-font-weight-regular: 400`

### 1.3 命名规范

| 层级 | 前缀 | 示例 | 用途 |
|------|------|------|------|
| 设计令牌 | `--ds-*` | `--ds-primary` | 定义值 |
| Tailwind 映射 | `--color-cs-*` | `--color-cs-primary` | 生成工具类 |
| 工具类 | `cs-*` | `bg-cs-primary` | 开发者使用 |

#### Tailwind v4 映射规则

| 变量前缀 | 生成的工具类 |
|----------|-------------|
| `--color-cs-*` | `bg-*`, `text-*`, `border-*`, `fill-*` |
| `--spacing-cs-*` | `p-*`, `m-*`, `gap-*` |
| `--size-cs-*` | `w-*`, `h-*`, `size-*` |
| `--radius-cs-*` | `rounded-*` |
| `--font-size-cs-*` | `text-*` |

### 1.4 为什么使用 @theme inline

```css
/* ❌ @theme - 静态编译，不支持运行时主题切换 */
@theme {
  --color-primary: var(--ds-primary);
}

/* ✅ @theme inline - 保留变量引用，支持运行时切换 */
@theme inline {
  --color-cs-primary: var(--ds-primary);
}
```

**关键差异**：`@theme inline` 使 CSS 变量在运行时动态解析，实现明暗主题切换。

---

## 二、项目使用指南

### 2.1 在 UI 库中使用

#### 文件结构

```
packages/ui/
├── src/styles/
│   ├── design-tokens.css    # 核心变量定义
│   └── globals.css          # Tailwind 集成
└── package.json             # 导出配置
```

#### globals.css 示例

```css
@import 'tailwindcss';
@import './design-tokens.css';

@theme inline {
  /* 颜色 */
  --color-cs-primary: var(--ds-primary);
  --color-cs-bg: var(--ds-background);
  --color-cs-fg: var(--ds-foreground);

  /* 间距 */
  --spacing-cs-xs: var(--ds-size-xs);
  --spacing-cs-sm: var(--ds-size-sm);
  --spacing-cs-md: var(--ds-size-md);

  /* 尺寸 */
  --size-cs-xs: var(--ds-size-xs);
  --size-cs-sm: var(--ds-size-sm);

  /* 圆角 */
  --radius-cs-sm: var(--ds-radius-sm);
  --radius-cs-md: var(--ds-radius-md);
}

@custom-variant dark (&:is(.dark *));
```

#### 组件中使用

```tsx
// packages/ui/src/components/Button.tsx
export const Button = ({ children }) => (
  <button className="
    bg-cs-primary
    text-white
    px-cs-sm
    py-cs-xs
    rounded-cs-md
    hover:bg-cs-primary/90
    transition-colors
  ">
    {children}
  </button>
)
```

### 2.2 在主项目中使用

#### 导入 UI 库样式

```css
/* src/renderer/src/assets/styles/tailwind.css */
@import 'tailwindcss' source('../../../../renderer');
@import '@cherrystudio/ui/styles/globals.css';

@custom-variant dark (&:is(.dark *));
```

#### 覆盖或扩展变量

```css
/* src/renderer/src/assets/styles/tailwind.css */
@import '@cherrystudio/ui/styles/globals.css';

/* 主项目特定覆盖 */
:root {
  --ds-primary: #custom-color;  /* 覆盖 UI 库的主题色 */
}
```

#### 在主项目组件中使用

```tsx
// src/renderer/src/pages/Home.tsx
export const Home = () => (
  <div className="
    bg-cs-bg
    p-cs-md
    rounded-cs-lg
  ">
    <Button>主项目按钮</Button>
  </div>
)
```

### 2.3 主题切换实现

```tsx
// App.tsx
import { useState } from 'react'

export function App() {
  const [theme, setTheme] = useState<'light' | 'dark'>('light')

  return (
    <div className={theme}>
      <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
        切换主题
      </button>
      {/* 所有子组件自动响应主题 */}
    </div>
  )
}
```

### 2.4 透明度修饰符

```tsx
<div className="
  bg-cs-primary/10      /* 10% 透明度 */
  bg-cs-primary/50      /* 50% 透明度 */
  bg-cs-primary/[0.15]  /* 自定义透明度 */
">
```

---

## 三、UI 库与主包平衡策略

### 3.1 UI 库职责

**目标**：提供可复用、可定制的基础设计系统

```json
// packages/ui/package.json
{
  "exports": {
    "./styles/design-tokens.css": "./src/styles/design-tokens.css",
    "./styles/globals.css": "./src/styles/globals.css"
  }
}
```

**原则**：

- ✅ 定义通用的设计令牌（`--ds-*`）
- ✅ 提供默认的 Tailwind 映射（`--color-cs-*`）
- ✅ 保持变量语义化，不包含业务逻辑
- ❌ 不包含主项目特定的颜色或尺寸

### 3.2 主包职责

**目标**：导入 UI 库，根据业务需求扩展或覆盖

```css
/* src/renderer/src/assets/styles/tailwind.css */
@import '@cherrystudio/ui/styles/globals.css';

/* 主项目扩展 */
@theme inline {
  --color-cs-brand-accent: #ff6b6b;  /* 新增颜色 */
}

/* 主项目覆盖 */
:root {
  --ds-primary: #custom-primary;     /* 覆盖 UI 库的主题色 */
}
```

**原则**：

- ✅ 导入 UI 库的 `globals.css`
- ✅ 通过覆盖 `--ds-*` 变量定制主题
- ✅ 添加项目特定的 `--color-cs-*` 映射
- ✅ 保留向后兼容的旧变量（如 `color.css`）

### 3.3 向后兼容方案

#### 保留旧变量

```css
/* src/renderer/src/assets/styles/color.css */
:root {
  --color-primary: #00b96b;         /* 旧变量 */
  --color-background: #181818;      /* 旧变量 */
}

/* 映射到新系统 */
:root {
  --ds-primary: var(--color-primary);
  --ds-background: var(--color-background);
}
```

#### 渐进式迁移

```tsx
// 阶段 1：旧代码继续工作
<div style={{ color: 'var(--color-primary)' }}>旧代码</div>

// 阶段 2：新代码使用工具类
<div className="text-cs-primary">新代码</div>

// 阶段 3：逐步替换旧代码
```

### 3.4 冲突处理

| 场景 | 策略 |
|------|------|
| UI 库与 Tailwind 默认类冲突 | 使用 `cs-` 前缀隔离 |
| 主包需要覆盖 UI 库颜色 | 覆盖 `--ds-*` 变量 |
| 主包需要新增颜色 | 添加新的 `--color-cs-*` 映射 |
| 旧变量与新系统共存 | 通过 `var()` 映射到 `--ds-*` |

### 3.5 独立发布 UI 库

```json
// packages/ui/package.json
{
  "name": "@cherrystudio/ui",
  "exports": {
    "./styles/design-tokens.css": "./src/styles/design-tokens.css",
    "./styles/globals.css": "./src/styles/globals.css"
  },
  "peerDependencies": {
    "tailwindcss": "^4.1.13"
  }
}
```

**外部项目使用**：
```css
/* 其他项目的 tailwind.css */
@import 'tailwindcss';
@import '@cherrystudio/ui/styles/globals.css';

/* 覆盖主题色 */
:root {
  --ds-primary: #your-brand-color;
}
```

---

## 四、完整映射示例

### todocss.css → design-tokens.css

| todocss.css | design-tokens.css | 说明 |
|-------------|-------------------|------|
| `--Brand--Base_Colors--Primary` | `--ds-primary` | 简化命名 |
| `--Spacing--md` + `--Sizing--md` | `--ds-size-md` | 合并重复 |
| `--Opacity--Red--Red-80` | *(删除)* | 使用 `/80` 修饰符 |
| `--Font_weight--Regular: 400px` | `--ds-font-weight-regular: 400` | 修正错误 |
| `--Brand--UI_Element_Colors--Primary_Button--Background` | `--ds-btn-primary` | 简化语义 |

### design-tokens.css → globals.css → 工具类

| design-tokens.css | globals.css | 工具类 |
|-------------------|-------------|--------|
| `--ds-primary` | `--color-cs-primary` | `bg-cs-primary` |
| `--ds-size-md` | `--spacing-cs-md` | `p-cs-md` |
| `--ds-size-md` | `--size-cs-md` | `w-cs-md` |
| `--ds-radius-lg` | `--radius-cs-lg` | `rounded-cs-lg` |

---

## 五、关键决策记录

1. **使用 `@theme inline`** - 支持运行时主题切换
2. **`cs-` 前缀** - 命名空间隔离，避免冲突
3. **合并 Spacing/Sizing** - 消除冗余
4. **废弃 Opacity 变量** - 使用 Tailwind 的 `/modifier` 语法
5. **双层变量系统** - `--ds-*` (定义) → `--color-cs-*` (映射)
6. **共存策略** - Tailwind 默认类 + `cs-` 品牌类
