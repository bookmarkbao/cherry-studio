# 灵活发布指南：使用 Build Workflow 发布

本指南介绍如何使用 `Build` 和 `Build Unsigned` workflow 进行灵活的版本发布。

---

## 🎯 为什么需要这个功能？

传统的 `Release` workflow 有以下限制：

- 只能发布所有平台
- 必须推送 Git 标签触发
- 流程相对固定

新增的灵活发布功能允许您：

- ✅ 选择特定平台发布
- ✅ 手动触发，无需推送标签
- ✅ 快速发布热修复版本
- ✅ 同时支持签名和无签名

---

## 📊 三种发布方式对比

| 方式                   | Workflow       | 优势               | 适用场景           |
| ---------------------- | -------------- | ------------------ | ------------------ |
| **标准发布**           | Release        | 自动触发、完整流程 | 正式版本、定期发布 |
| **灵活发布（签名）**   | Build          | 可选平台、手动触发 | 特定平台、快速发布 |
| **灵活发布（无签名）** | Build Unsigned | 免费、快速         | 个人项目、测试版本 |

---

## 🚀 使用方法

### 方式 1：发布所有平台（类似 Release）

#### 步骤：

**1. 访问 Actions 页面**

```
https://github.com/你的用户名/cherry-studio/actions
```

**2. 选择工作流**

- 有 Apple 账号：选择 "Build (No Release)"
- 无 Apple 账号：选择 "Build (Unsigned)"

**3. 配置参数**

```
Build platform: all
Create GitHub Release: 勾选 ✅
Release tag: v1.7.1
```

**4. 运行 Workflow**

点击绿色的 "Run workflow" 按钮

**5. 等待构建完成**

约 30-60 分钟（所有平台）

**6. 检查并发布 Release**

```
访问：https://github.com/你的用户名/cherry-studio/releases
编辑草稿 Release
点击 "Publish release"
```

---

### 方式 2：仅发布特定平台

#### 场景示例

假设您只修改了 macOS 的一个 bug，不需要重新构建所有平台。

#### 步骤：

**1. 触发 Workflow**

```
Build platform: macos  ← 只选择 macOS
Create GitHub Release: 勾选 ✅
Release tag: v1.7.1-macos-hotfix
```

**2. 等待构建**

约 15-20 分钟（单平台）

**3. 发布 Release**

Release 中只包含 macOS 相关文件

---

### 方式 3：无签名快速发布

#### 适用场景

- 没有 Apple Developer 账号
- 个人项目或测试版本
- 需要快速发布

#### 步骤：

**1. 选择 Build Unsigned Workflow**

**2. 配置参数**

```
Build platform: all
Create GitHub Release: 勾选 ✅
Release tag: v1.7.1-unsigned
```

**3. 查看 Release**

Release 会自动添加无签名提示：

```
⚠️ Note: This is an unsigned release

macOS users: Please right-click the app and select "Open" on first launch.

这是一个无签名版本，macOS 用户首次打开时请右键选择"打开"。
```

---

## 💡 实际使用案例

### 案例 1：热修复 Windows 平台

**问题：** Windows 版本有严重 bug，需要紧急修复

**解决方案：**

```
1. 修复代码并合并
2. 触发 Build workflow
3. 选择 platform: windows
4. 勾选 Create GitHub Release
5. Release tag: v1.7.0-windows-hotfix
6. 15-20 分钟后发布
```

**优势：**

- 不影响其他平台
- 无需重新构建 macOS 和 Linux
- 节省时间

---

### 案例 2：预发布测试版本

**场景：** 在正式发布前，先发布给部分用户测试

**解决方案：**

```
1. 触发 Build Unsigned workflow
2. 选择 platform: all
3. 勾选 Create GitHub Release
4. Release tag: v1.7.1-beta.1
5. 发布为 "pre-release"
```

**优势：**

- 无需 Apple 签名，快速发布
- 降低测试成本
- 可以收集反馈后再发布正式版

---

### 案例 3：多平台分阶段发布

**场景：** 先发布 Windows/Linux，macOS 稍后发布

**第一步：发布 Windows 和 Linux**

```
# 发布 Windows
触发 Build → platform: windows → Create Release
Release tag: v1.7.1

# 发布 Linux
触发 Build → platform: linux → Create Release
Release tag: v1.7.1  ← 使用相同 tag，文件会添加到同一个 Release
```

**第二步：稍后发布 macOS**

```
触发 Build → platform: macos → Create Release
Release tag: v1.7.1  ← 再次使用相同 tag
```

**结果：** 一个完整的 Release，包含所有平台

---

## ⚙️ 高级功能

### 功能 1：allowUpdates 自动合并

两个 workflow 都配置了 `allowUpdates: true`，这意味着：

```yaml
allowUpdates: true # 允许更新已存在的 Release
```

**效果：**

- 多次运行会更新同一个 Release
- 可以分批次添加平台文件
- 不会创建重复的 Release

**使用示例：**

```bash
# 第一次：发布 Windows
workflow 运行 → platform: windows → tag: v1.7.1
结果：创建 Release v1.7.1，包含 Windows 文件

# 第二次：添加 macOS
workflow 运行 → platform: macos → tag: v1.7.1
结果：更新 Release v1.7.1，添加 macOS 文件

# 第三次：添加 Linux
workflow 运行 → platform: linux → tag: v1.7.1
结果：更新 Release v1.7.1，添加 Linux 文件
```

---

### 功能 2：draft 草稿模式

```yaml
draft: true # 创建为草稿
```

**效果：**

- Release 创建后不会立即公开
- 可以先检查文件
- 编辑 Release 说明
- 准备好后再发布

**工作流程：**

```
1. Workflow 完成 → 创建草稿 Release
2. 检查所有文件是否正确
3. 编辑 Release 说明
4. 点击 "Publish release" 正式发布
```

---

### 功能 3：makeLatest 控制

```yaml
makeLatest: false # 不标记为最新版本
```

**效果：**

- Release 不会自动标记为 "Latest"
- 适合预发布或历史版本
- 需要手动设置 Latest

**使用场景：**

- Beta 测试版本
- 热修复版本（不想覆盖主版本）
- 向后兼容的旧版本

---

## 🔄 与 Release Workflow 对比

### Release Workflow

**优势：**

- ✅ 自动触发（推送标签）
- ✅ 流程标准化
- ✅ 适合定期发布

**限制：**

- ❌ 只能发布所有平台
- ❌ 必须推送标签
- ❌ 流程相对固定

### Build/Build Unsigned Workflow

**优势：**

- ✅ 可选特定平台
- ✅ 手动触发，灵活
- ✅ 支持热修复
- ✅ 无需推送标签

**限制：**

- ❌ 需要手动操作
- ❌ 不会自动更新 package.json 版本

---

## 📋 最佳实践

### ✅ 推荐做法

**1. 正式发布用 Release Workflow**

```bash
git tag v1.7.0
git push origin v1.7.0
# 等待自动构建和发布
```

**2. 热修复用 Build Workflow**

```
# 修复后立即发布受影响的平台
platform: windows  ← 只构建需要的平台
```

**3. 测试版本用 Build Unsigned**

```
# 快速发布测试版本
无需 Apple 账号
节省时间和成本
```

**4. 分阶段发布用分批次构建**

```
# 第一天：发布 Windows/Linux
# 第二天：添加 macOS
# 所有文件在同一个 Release 中
```

### ❌ 避免做法

**1. 不要混用版本号**

```
❌ 错误：
  Windows: v1.7.0
  macOS:   v1.7.1
  Linux:   v1.7.0

✅ 正确：
  所有平台使用相同版本号 v1.7.0
```

**2. 不要在同一版本中混合签名和无签名**

```
❌ 错误：
  同一个 Release 中有签名版和无签名版

✅ 正确：
  分别创建不同的 Release
  v1.7.0 - 签名版
  v1.7.0-unsigned - 无签名版
```

**3. 不要忘记编辑 Release 说明**

```
❌ 错误：
  直接发布空的 Release 说明

✅ 正确：
  在草稿阶段编辑完整的 Release 说明
  包括更新内容、安装说明等
```

---

## 🆘 常见问题

### Q1: 可以多次运行同一个 tag 吗？

**A:** 可以。配置了 `allowUpdates: true`，多次运行会更新同一个 Release，不会创建重复。

---

### Q2: 如何发布多个平台到同一个 Release？

**A:** 多次运行 workflow，使用相同的 tag，文件会自动合并到同一个 Release。

---

### Q3: Build Workflow 和 Release Workflow 有什么区别？

**A:**

- **Release**: 自动触发、所有平台、推送标签
- **Build**: 手动触发、可选平台、灵活快速

---

### Q4: 无签名版本和签名版本可以在同一个 Release 吗？

**A:** 不推荐。建议分别创建：

- `v1.7.0` - 签名版本
- `v1.7.0-unsigned` - 无签名版本

---

### Q5: 如果忘记勾选 "Create GitHub Release" 怎么办？

**A:** 文件会保存在 Actions Artifacts 中（保留 7 天），可以手动下载或重新运行 workflow。

---

## 📚 相关文档

- [版本发布指南](./release-guide.md) - 传统 Release workflow 使用指南
- [工作流对比](./workflows-comparison.md) - 所有工作流的详细对比
- [无签名构建指南](./macos-build-without-apple-account.md) - 无签名方案详解

---

## 🎬 快速开始

**第一次使用？跟着这个流程：**

```
1. 访问 Actions 页面
   ├─ 选择 "Build (Unsigned)"
   │
2. 配置参数
   ├─ Build platform: all
   ├─ Create GitHub Release: ✅
   └─ Release tag: v1.7.1-test
   │
3. 运行 Workflow
   │
4. 等待 30-60 分钟
   │
5. 检查 Release
   ├─ 查看是否有所有文件
   ├─ 编辑 Release 说明
   └─ 发布！
```

---

**最后更新：** 2025-10-22
