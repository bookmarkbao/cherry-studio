# GitHub Actions 工作流对比

本文档对比 Cherry Studio 项目中的不同 GitHub Actions 工作流，帮助您选择合适的工作流。

---

## 📊 工作流总览

| 工作流             | 文件                 | 用途           | 触发方式        | 是否发布 |
| ------------------ | -------------------- | -------------- | --------------- | -------- |
| **Release**        | `release.yml`        | 正式版本发布   | 推送标签 / 手动 | ✅ 是    |
| **Build**          | `build.yml`          | 测试构建       | 手动            | ⚠️ 可选  |
| **Build Unsigned** | `build-unsigned.yml` | 无签名测试构建 | 手动            | ⚠️ 可选  |
| **Nightly Build**  | `nightly-build.yml`  | 每日构建       | 定时 / 手动     | ❌ 否    |
| **PR CI**          | `pr-ci.yml`          | 代码检查       | PR 提交         | ❌ 否    |

---

## 🔍 详细对比

### 1. Release Workflow - 正式发布

**文件：** `.github/workflows/release.yml`

#### 特点

| 项目             | 说明                               |
| ---------------- | ---------------------------------- |
| **主要用途**     | 构建并发布正式版本                 |
| **触发条件**     | 推送 `v*.*.*` 标签 或 手动触发     |
| **构建平台**     | Windows + macOS + Linux（全部）    |
| **是否签名**     | ✅ macOS 签名（如果配置）          |
| **发布 Release** | ✅ 自动创建 GitHub Release（草稿） |
| **构建时长**     | 约 30-60 分钟                      |
| **Artifacts**    | 上传到 GitHub Release              |

#### 使用场景

```bash
# 正式发布新版本
git tag -a v1.7.1 -m "Release v1.7.1"
git push origin v1.7.1
```

#### 需要的 Secrets

**必需（4 个）：**

- `MAIN_VITE_CHERRYAI_CLIENT_SECRET`
- `MAIN_VITE_MINERU_API_KEY`
- `RENDERER_VITE_AIHUBMIX_SECRET`
- `RENDERER_VITE_PPIO_APP_SECRET`

**可选（5 个，macOS 签名）：**

- `CSC_LINK`
- `CSC_KEY_PASSWORD`
- `APPLE_ID`
- `APPLE_APP_SPECIFIC_PASSWORD`
- `APPLE_TEAM_ID`

#### 特点

✅ 自动创建 Release  
✅ 上传所有构建产物  
✅ 支持版本号自动更新  
✅ 支持 macOS 签名和公证

---

### 2. Build Workflow - 测试构建

**文件：** `.github/workflows/build.yml`

#### 特点

| 项目             | 说明                                       |
| ---------------- | ------------------------------------------ |
| **主要用途**     | 测试构建，可选发布                         |
| **触发条件**     | 手动触发                                   |
| **构建平台**     | 可选择：全部 / Windows / macOS / Linux     |
| **是否签名**     | ⚠️ 如果配置了就签名，没配置就跳过          |
| **发布 Release** | ⚠️ 可选（需勾选并提供 tag）                |
| **构建时长**     | 约 20-40 分钟（单平台更快）                |
| **Artifacts**    | 保存在 Actions Artifacts（7 天）或 Release |

#### 使用场景

**测试构建（不发布）：**

```
Actions → Build (No Release) → Run workflow
选择平台：macOS
Create GitHub Release: 不勾选
```

**构建并发布：**

```
Actions → Build (No Release) → Run workflow
选择平台：all
Create GitHub Release: 勾选
Release tag: v1.7.1
```

#### 需要的 Secrets

**必需（4 个）：**

- `MAIN_VITE_CHERRYAI_CLIENT_SECRET`
- `MAIN_VITE_MINERU_API_KEY`
- `RENDERER_VITE_AIHUBMIX_SECRET`
- `RENDERER_VITE_PPIO_APP_SECRET`

**可选（5 个）：**

- 如果配置了 Apple Secrets，会进行签名
- 如果没配置，会跳过签名

#### 特点

✅ 可以选择单个平台构建  
✅ 节省构建时间  
✅ 可选是否创建 Release  
✅ 既适合测试，也适合发布

---

### 3. Build Unsigned Workflow - 无签名构建

**文件：** `.github/workflows/build-unsigned.yml`

#### 特点

| 项目             | 说明                                       |
| ---------------- | ------------------------------------------ |
| **主要用途**     | 无需 Apple 账号的构建                      |
| **触发条件**     | 手动触发                                   |
| **构建平台**     | 可选择：全部 / Windows / macOS / Linux     |
| **是否签名**     | ❌ macOS 不签名                            |
| **发布 Release** | ⚠️ 可选（需勾选并提供 tag）                |
| **构建时长**     | 约 20-40 分钟                              |
| **Artifacts**    | 保存在 Actions Artifacts（7 天）或 Release |

#### 使用场景

**测试构建（不发布）：**

```
Actions → Build (Unsigned) → Run workflow
选择平台：macOS
Create GitHub Release: 不勾选
```

**构建并发布（无签名版本）：**

```
Actions → Build (Unsigned) → Run workflow
选择平台：all
Create GitHub Release: 勾选
Release tag: v1.7.1
```

💡 **适合场景：** 没有 Apple Developer 账号或快速发布无签名版本

#### 需要的 Secrets

**仅需（4 个）：**

- `MAIN_VITE_CHERRYAI_CLIENT_SECRET`
- `MAIN_VITE_MINERU_API_KEY`
- `RENDERER_VITE_AIHUBMIX_SECRET`
- `RENDERER_VITE_PPIO_APP_SECRET`

**不需要：**

- ❌ 不需要任何 Apple Secrets

#### 特点

✅ 完全免费（无需 $99 Apple 账号）  
✅ macOS 版本无签名（用户需右键打开）  
✅ 可选是否创建 Release  
✅ 适合个人项目、测试和无签名发布  
✅ 构建速度快（无公证步骤）

---

### 4. Nightly Build Workflow - 每日构建

**文件：** `.github/workflows/nightly-build.yml`

#### 特点

| 项目             | 说明                            |
| ---------------- | ------------------------------- |
| **主要用途**     | 自动构建最新开发版              |
| **触发条件**     | 每天 1:00 AM（北京时间）自动    |
| **构建平台**     | Windows + macOS + Linux（全部） |
| **是否签名**     | ✅ macOS 签名（如果配置）       |
| **发布 Release** | ❌ 不发布                       |
| **构建时长**     | 约 30-60 分钟                   |
| **Artifacts**    | 保存 3 天，自动清理旧版本       |

#### 使用场景

- 自动测试最新代码
- 提供给测试人员的每日版本
- 验证构建系统正常

#### 特点

✅ 每日自动构建  
✅ 自动清理旧构建（保留 14 天内）  
✅ 包含 SHA256 校验和  
✅ 文件名包含日期

---

### 5. PR CI Workflow - 代码检查

**文件：** `.github/workflows/pr-ci.yml`

#### 特点

| 项目         | 说明                                    |
| ------------ | --------------------------------------- |
| **主要用途** | PR 代码质量检查                         |
| **触发条件** | PR 创建/更新                            |
| **运行平台** | Ubuntu（仅检查，不构建）                |
| **检查内容** | Lint / Format / TypeCheck / i18n / Test |
| **构建时长** | 约 5-10 分钟                            |

#### 使用场景

- PR 提交时自动运行
- 确保代码质量
- 不构建应用

#### 检查项目

```
✅ Lint Check (yarn test:lint)
✅ Format Check (yarn format:check)
✅ Type Check (yarn typecheck)
✅ i18n Check (yarn check:i18n)
✅ Unit Tests (yarn test)
```

---

## 🎯 使用场景决策树

```
需要发布正式版本？
├─ 是 → 使用 Release Workflow
│   ├─ 有 Apple 账号 → 配置所有 9 个 Secrets
│   └─ 没有 Apple 账号 → 只配置 4 个基础 Secrets（macOS 无签名）
│
└─ 否 → 需要测试构建？
    ├─ 是 → 有 Apple 账号？
    │   ├─ 是 → Build Workflow
    │   └─ 否 → Build Unsigned Workflow
    │
    └─ 否 → 提交 PR？
        └─ 是 → PR CI Workflow（自动运行）
```

---

## 📋 快速参考表

### 什么时候用哪个工作流？

| 场景                      | 推荐工作流             | 命令/操作                                  |
| ------------------------- | ---------------------- | ------------------------------------------ |
| 发布新版本（签名）        | Release                | `git push origin v1.7.1`                   |
| 发布新版本（无签名）      | Build Unsigned         | 勾选 Create Release + 填写 tag             |
| 发布特定平台              | Build / Build Unsigned | 选择平台 + 勾选 Create Release             |
| 测试 macOS 构建（有证书） | Build                  | Actions → Build → Run（不勾选 Release）    |
| 测试 macOS 构建（无证书） | Build Unsigned         | Actions → Build Unsigned（不勾选 Release） |
| 测试特定平台              | Build / Build Unsigned | 选择平台后运行（不勾选 Release）           |
| 每日测试版本              | Nightly Build          | 自动运行（或手动触发）                     |
| 代码质量检查              | PR CI                  | 提交 PR 自动运行                           |

---

## 🔧 配置差异

### Secrets 需求

| Workflow       | 基础 Secrets (4 个) | Apple Secrets (5 个)  |
| -------------- | ------------------- | --------------------- |
| Release        | ✅ 必需             | ⚠️ 推荐（macOS 签名） |
| Build          | ✅ 必需             | ⚠️ 可选               |
| Build Unsigned | ✅ 必需             | ❌ 不需要             |
| Nightly Build  | ✅ 必需             | ⚠️ 可选               |
| PR CI          | ❌ 不需要           | ❌ 不需要             |

### 权限需求

| Workflow       | 权限                                 | 说明                 |
| -------------- | ------------------------------------ | -------------------- |
| Release        | `contents: write`                    | 需要创建 Release     |
| Build          | `contents: read`                     | 只读                 |
| Build Unsigned | `contents: read`                     | 只读                 |
| Nightly Build  | `contents: write` + `actions: write` | 需要删除旧 Artifacts |
| PR CI          | `contents: read`                     | 只读                 |

---

## 💡 最佳实践

### 开发阶段

```
1. 开发功能
2. 提交 PR → 触发 PR CI（自动）
3. 测试构建 → 使用 Build Unsigned（手动）
4. 合并 PR
```

### 发布阶段

**方式 1：使用 Release workflow（推荐，支持签名）**

```
1. 准备发布
2. 创建 tag → 触发 Release（自动）
3. 等待构建完成
4. 检查 Release 草稿
5. 编辑并发布 Release
```

**方式 2：使用 Build/Build Unsigned workflow（灵活）**

```
1. 准备发布
2. 手动触发 workflow
3. 选择平台（all 或特定平台）
4. 勾选 "Create GitHub Release"
5. 填写 release tag
6. 等待构建完成
7. 检查 Release 草稿并发布
```

**优势对比：**

- Release: 自动触发、支持签名、适合正式版本
- Build/Build Unsigned: 手动触发、可选平台、灵活快速

### 测试阶段

```
# 快速测试（单平台）
使用 Build Unsigned → 选择 macOS

# 完整测试（所有平台）
使用 Build → 选择 all

# 长期测试
使用 Nightly Build（自动每日构建）
```

---

## 🆘 常见问题

### Q: Release 和 Build 有什么区别？

**A:**

- **Release**: 构建并**发布**，创建 GitHub Release
- **Build**: 只构建，**不发布**，Artifacts 保存 7 天

### Q: 什么时候用 Build Unsigned？

**A:**

- 没有 Apple Developer 账号（$99/年）
- 快速测试 macOS 构建
- 个人项目或内部使用

### Q: Nightly Build 会自动发布吗？

**A:**
不会。Nightly Build 只构建并保存 Artifacts，不创建 Release。

### Q: PR CI 会构建应用吗？

**A:**
不会。PR CI 只进行代码质量检查（lint、format、test），不构建应用。

### Q: 可以同时运行多个 Workflow 吗？

**A:**
可以。不同的 Workflow 相互独立，可以并行运行。

---

## 📚 相关文档

- [发布版本指南](./release-guide.md) - 详细的版本发布流程
- [Apple 代码签名](./apple-code-signing-guide.md) - macOS 签名配置
- [无签名构建](./macos-build-without-apple-account.md) - 免费方案
- [故障排查](./github-actions-troubleshooting.md) - 常见问题

---

**最后更新：** 2025-10-22
