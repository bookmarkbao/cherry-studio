# macOS 打包：无需 Apple Developer 账号方案

本文档介绍如何在**没有付费 Apple Developer 账号**的情况下打包 macOS 应用。

---

## ✅ 适用场景

- 个人项目或开源项目
- 不需要在 Mac App Store 发布
- 愿意让用户手动允许运行应用
- 预算有限，暂时不想付费 $99/年

---

## 📋 方案对比

| 特性                | 无签名打包      | 付费开发者账号打包 |
| ------------------- | --------------- | ------------------ |
| 费用                | **免费**        | $99/年             |
| 是否需要配置证书    | ❌ 不需要       | ✅ 需要            |
| 应用是否能正常运行  | ✅ 能           | ✅ 能              |
| 用户安装体验        | ⚠️ 需要右键打开 | ✅ 直接双击打开    |
| 是否能公证          | ❌ 不能         | ✅ 能              |
| GitHub Actions 支持 | ✅ 支持         | ✅ 支持            |

---

## 🚀 配置步骤

### 第一步：修改 electron-builder.yml

打开 `electron-builder.yml`，找到 `mac:` 部分，修改为：

```yaml
mac:
  entitlementsInherit: build/entitlements.mac.plist
  notarize: false # 禁用公证（无需 Apple 账号）
  artifactName: ${productName}-${version}-${arch}.${ext}
  minimumSystemVersion: "20.1.0"
  extendInfo:
    - NSCameraUsageDescription: Application requests access to the device's camera.
    - NSMicrophoneUsageDescription: Application requests access to the device's microphone.
    - NSDocumentsFolderUsageDescription: Application requests access to the user's Documents folder.
    - NSDownloadsFolderUsageDescription: Application requests access to the user's Downloads folder.
  target:
    - target: dmg
    - target: zip
```

**关键配置：**

- `notarize: false` - 禁用公证功能
- 不需要配置 `identity` 或 `CSC_*` 环境变量

### 第二步：修改 GitHub Actions Workflow

#### 方法 A：完全移除签名配置（推荐）

在 `.github/workflows/build.yml` 中，找到 "Build Mac" 步骤，修改为：

```yaml
- name: Build Mac
  if: matrix.os == 'macos-latest'
  run: |
    sudo -H pip install setuptools
    yarn build:mac
  env:
    NODE_OPTIONS: --max-old-space-size=8192
    MAIN_VITE_CHERRYAI_CLIENT_SECRET: ${{ secrets.MAIN_VITE_CHERRYAI_CLIENT_SECRET }}
    MAIN_VITE_MINERU_API_KEY: ${{ secrets.MAIN_VITE_MINERU_API_KEY }}
    RENDERER_VITE_AIHUBMIX_SECRET: ${{ secrets.RENDERER_VITE_AIHUBMIX_SECRET }}
    RENDERER_VITE_PPIO_APP_SECRET: ${{ secrets.RENDERER_VITE_PPIO_APP_SECRET }}
    # 不需要以下 Apple 签名相关的环境变量：
    # CSC_LINK: ${{ secrets.CSC_LINK }}
    # CSC_KEY_PASSWORD: ${{ secrets.CSC_KEY_PASSWORD }}
    # APPLE_ID: ${{ secrets.APPLE_ID }}
    # APPLE_APP_SPECIFIC_PASSWORD: ${{ secrets.APPLE_APP_SPECIFIC_PASSWORD }}
    # APPLE_TEAM_ID: ${{ secrets.APPLE_TEAM_ID }}
```

同样的修改也应用到：

- `.github/workflows/release.yml`
- `.github/workflows/nightly-build.yml`

#### 方法 B：可选签名配置

如果您希望**同时支持有签名和无签名**两种模式，可以这样配置：

```yaml
- name: Build Mac
  if: matrix.os == 'macos-latest'
  run: |
    sudo -H pip install setuptools
    yarn build:mac
  env:
    NODE_OPTIONS: --max-old-space-size=8192
    MAIN_VITE_CHERRYAI_CLIENT_SECRET: ${{ secrets.MAIN_VITE_CHERRYAI_CLIENT_SECRET }}
    MAIN_VITE_MINERU_API_KEY: ${{ secrets.MAIN_VITE_MINERU_API_KEY }}
    RENDERER_VITE_AIHUBMIX_SECRET: ${{ secrets.RENDERER_VITE_AIHUBMIX_SECRET }}
    RENDERER_VITE_PPIO_APP_SECRET: ${{ secrets.RENDERER_VITE_PPIO_APP_SECRET }}
    # 可选：如果配置了证书就使用，没配置就跳过
    CSC_LINK: ${{ secrets.CSC_LINK || '' }}
    CSC_KEY_PASSWORD: ${{ secrets.CSC_KEY_PASSWORD || '' }}
    APPLE_ID: ${{ secrets.APPLE_ID || '' }}
    APPLE_APP_SPECIFIC_PASSWORD: ${{ secrets.APPLE_APP_SPECIFIC_PASSWORD || '' }}
    APPLE_TEAM_ID: ${{ secrets.APPLE_TEAM_ID || '' }}
```

**说明：**

- 使用 `|| ''` 语法，如果 secret 不存在，就使用空值
- electron-builder 会自动跳过签名步骤

### 第三步：不需要配置 GitHub Secrets

使用无签名方案，您**只需要配置 4 个基础 Secrets**：

- ✅ `MAIN_VITE_CHERRYAI_CLIENT_SECRET`
- ✅ `MAIN_VITE_MINERU_API_KEY`
- ✅ `RENDERER_VITE_AIHUBMIX_SECRET`
- ✅ `RENDERER_VITE_PPIO_APP_SECRET`

**不需要配置：**

- ❌ `CSC_LINK`
- ❌ `CSC_KEY_PASSWORD`
- ❌ `APPLE_ID`
- ❌ `APPLE_APP_SPECIFIC_PASSWORD`
- ❌ `APPLE_TEAM_ID`

### 第四步：触发构建

#### 手动触发测试构建

```bash
# 1. 访问 GitHub Actions
https://github.com/你的用户名/cherry-studio/actions

# 2. 选择 "Build (No Release)" workflow
# 3. 点击 "Run workflow"
# 4. 选择 platform: macos
# 5. 查看构建日志
```

#### 推送标签触发发布

```bash
git tag v1.7.1
git push origin v1.7.1
```

---

## 📦 构建产物

无签名打包会生成：

- `Cherry Studio-{version}-arm64.dmg` - Apple Silicon 版本
- `Cherry Studio-{version}-x64.dmg` - Intel 版本
- `Cherry Studio-{version}-arm64.zip` - Apple Silicon 压缩包
- `Cherry Studio-{version}-x64.zip` - Intel 压缩包

**特点：**

- ✅ 文件正常生成
- ✅ 应用功能完整
- ⚠️ 没有代码签名和公证

---

## 👥 用户安装指南

### 安装方法

1. **下载 `.dmg` 文件**

   - Apple Silicon Mac（M1/M2/M3）：下载 `arm64` 版本
   - Intel Mac：下载 `x64` 版本

2. **首次打开应用**

   双击打开会看到安全警告：

   ```
   "Cherry Studio" can't be opened because it is from an unidentified developer.
   ```

3. **允许运行应用**

   **方法 1：通过右键菜单（推荐）**

   - 右键点击应用图标
   - 选择 "打开"
   - 点击 "打开" 按钮确认

   **方法 2：通过系统设置**

   - 打开 "系统设置" → "隐私与安全性"
   - 找到 "Cherry Studio" 提示
   - 点击 "仍然打开"

4. **后续使用**
   - 允许一次后，后续可以直接双击打开
   - 不会再出现安全警告

### 为用户提供的安装说明模板

可以在 README 或发布说明中添加：

```markdown
## macOS 安装说明

由于应用未经过 Apple 公证，首次打开时会看到安全警告。这是正常现象，请按以下步骤操作：

### 安装步骤

1. 下载适合您 Mac 的版本：

   - **Apple Silicon (M1/M2/M3)**：下载 arm64 版本
   - **Intel 处理器**：下载 x64 版本

2. 双击 `.dmg` 文件，将应用拖到 Applications 文件夹

3. 首次打开应用：

   - **不要**直接双击打开
   - 在 Applications 文件夹中**右键点击** Cherry Studio
   - 选择"打开"
   - 在弹出的对话框中点击"打开"按钮

4. 完成！后续可以正常双击打开

### 为什么会出现安全警告？

应用未经过 Apple 付费开发者账号签名和公证，但代码完全开源透明，您可以在 GitHub 上查看所有源代码。

如果您对安全性有疑虑，可以：

- 查看我们的源代码：https://github.com/你的用户名/cherry-studio
- 自行编译应用
- 等待我们未来提供经过公证的版本
```

---

## 🔒 安全性说明

### 对于开发者

无签名打包**不会影响应用的实际安全性**：

- ✅ 应用代码完全相同
- ✅ 功能完全正常
- ✅ 开源项目更透明
- ⚠️ 只是没有 Apple 的"官方认证"标识

### 对于用户

用户可以通过以下方式验证应用安全性：

1. **查看源代码**

   - 项目开源在 GitHub
   - 可以审查所有代码

2. **验证文件哈希**

   - 提供 SHA256 校验和
   - 确保文件未被篡改

3. **查看构建日志**
   - GitHub Actions 日志公开
   - 可以看到完整构建过程

---

## ⚡ 快速开始清单

- [ ] 修改 `electron-builder.yml`，设置 `notarize: false`
- [ ] 修改 GitHub Actions workflows，移除 Apple 签名环境变量
- [ ] 确认只配置了 4 个基础 Secrets（不需要 Apple 相关的 5 个）
- [ ] 触发一次测试构建
- [ ] 下载构建产物，在 macOS 上测试安装
- [ ] 在 README 中添加 macOS 安装说明

---

## 🔄 未来迁移到签名版本

如果将来您决定使用付费 Apple Developer 账号：

1. ✅ 恢复 `electron-builder.yml` 中的签名配置
2. ✅ 在 GitHub Secrets 中添加 5 个 Apple 相关配置
3. ✅ 触发新的构建
4. ✅ 用户可以享受无缝安装体验

**迁移成本：** 几乎为零，只需添加配置即可。

---

## 📊 对比总结

### 推荐方案选择

**如果您的项目是：**

| 项目类型       | 推荐方案 | 原因                 |
| -------------- | -------- | -------------------- |
| 个人学习项目   | 无签名   | 免费，功能完整       |
| 小型开源项目   | 无签名   | 节省成本，代码透明   |
| 中大型开源项目 | 有签名   | 提升用户信任和体验   |
| 商业项目       | 有签名   | 专业形象，用户体验好 |
| 企业应用       | 有签名   | 符合安全规范         |

---

## 🆘 常见问题

### Q: 无签名版本是否安全？

**A:** 是的。签名只是 Apple 的认证机制，不影响应用本身的安全性。开源项目更透明，用户可以审查代码。

### Q: 用户会接受右键打开的方式吗？

**A:** 对于技术用户和开源社区，这是可接受的。许多知名开源项目都采用这种方式。

### Q: 能否先无签名，后续再添加签名？

**A:** 可以。随时可以添加签名配置，无需修改应用代码。

### Q: GitHub Actions 会报错吗？

**A:** 不会。electron-builder 会自动检测，如果没有证书就跳过签名步骤。

---

## 📚 相关资源

- [完整的 Apple 代码签名指南](./apple-code-signing-guide.md)
- [GitHub Secrets 配置参考](./github-secrets-reference.md)
- [electron-builder 文档](https://www.electron.build/code-signing)
- [macOS Gatekeeper 说明](https://support.apple.com/en-us/HT202491)

---

**最后更新：** 2025-10-22
