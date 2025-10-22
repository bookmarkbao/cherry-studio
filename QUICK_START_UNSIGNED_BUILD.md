# 🚀 快速开始：无需 Apple 账号打包 macOS 应用

> ✅ 完全免费 | ✅ 应用功能完整 | ✅ 支持 GitHub Actions 自动打包

---

## 📋 TL;DR (太长不看版)

**好消息：您的项目已经配置好了！可以直接开始无签名打包。**

只需要：

1. ✅ 配置 4 个基础 Secrets（不需要 Apple 相关的 5 个）
2. ✅ 运行 "Build (Unsigned)" workflow
3. ✅ 下载构建产物

---

## 🎯 您需要做什么

### 第一步：配置 GitHub Secrets（只需 4 个）

访问：`https://github.com/你的用户名/cherry-studio/settings/secrets/actions`

添加以下 4 个 Secrets（**不需要** Apple 相关的配置）：

```
✅ MAIN_VITE_CHERRYAI_CLIENT_SECRET
✅ MAIN_VITE_MINERU_API_KEY
✅ RENDERER_VITE_AIHUBMIX_SECRET
✅ RENDERER_VITE_PPIO_APP_SECRET
```

**不需要配置：**

```
❌ CSC_LINK
❌ CSC_KEY_PASSWORD
❌ APPLE_ID
❌ APPLE_APP_SPECIFIC_PASSWORD
❌ APPLE_TEAM_ID
```

### 第二步：运行无签名构建

#### 方法 1：使用专用的无签名构建工作流（推荐）

1. 访问：`https://github.com/你的用户名/cherry-studio/actions`
2. 选择 **"Build (Unsigned - No Apple Account Required)"** workflow
3. 点击 `Run workflow`
4. 选择平台：
   - `all` - 打包所有平台
   - `macos` - 仅打包 macOS
   - `windows` - 仅打包 Windows
   - `linux` - 仅打包 Linux
5. 点击绿色的 `Run workflow` 按钮
6. 等待构建完成（约 20-30 分钟）
7. 在 Artifacts 中下载构建产物

#### 方法 2：使用现有的 Build workflow

您现有的 `.github/workflows/build.yml` 也可以直接使用，因为它会自动跳过签名步骤（如果没有配置 Apple Secrets）。

### 第三步：测试安装

下载构建产物后：

#### macOS 测试

1. 下载 `.dmg` 文件
2. 双击打开，拖到 Applications
3. **右键点击应用** → 选择"打开"
4. 点击"打开"按钮确认
5. ✅ 应用正常运行

#### Windows 测试

1. 下载 `.exe` 安装包
2. 直接双击安装
3. ✅ 正常运行

#### Linux 测试

1. 下载 `.AppImage` 或 `.deb` 文件
2. 按常规方式安装
3. ✅ 正常运行

---

## 📦 构建产物说明

### macOS（无签名版本）

- `Cherry Studio-{version}-arm64.dmg` - Apple Silicon (M1/M2/M3)
- `Cherry Studio-{version}-x64.dmg` - Intel Mac
- `Cherry Studio-{version}-arm64.zip` - 压缩包版本
- `Cherry Studio-{version}-x64.zip` - 压缩包版本

**特点：**

- ✅ 应用功能完整，与签名版本完全相同
- ✅ 用户首次打开需要右键选择"打开"
- ✅ 后续可以正常双击打开

### Windows

- `Cherry Studio-{version}-x64-setup.exe` - 安装版
- `Cherry Studio-{version}-x64-portable.exe` - 便携版
- `Cherry Studio-{version}-arm64-setup.exe` - ARM 版本
- `Cherry Studio-{version}-arm64-portable.exe` - ARM 便携版

### Linux

- `Cherry Studio-{version}-x86_64.AppImage` - 通用版本
- `Cherry Studio-{version}-x64.deb` - Debian/Ubuntu
- `Cherry Studio-{version}-x64.rpm` - RedHat/CentOS/Fedora

---

## 👥 用户安装说明（复制到 README）

将以下内容添加到您的 README.md 或 Release 说明中：

```markdown
## 📥 安装说明

### macOS 用户

⚠️ **首次打开重要提示：**

由于应用未使用付费 Apple Developer 账号签名，首次打开需要特殊步骤：

1. 下载适合您的版本：

   - **Apple Silicon (M1/M2/M3/M4)**：下载 `arm64` 版本
   - **Intel 处理器**：下载 `x64` 版本

2. 双击 `.dmg` 文件，将 Cherry Studio 拖到 Applications 文件夹

3. **重要：** 不要直接双击打开应用，而是：

   - 在 Applications 文件夹中找到 Cherry Studio
   - **右键点击**应用图标
   - 选择 "打开"
   - 在弹出的对话框中点击 "打开" 按钮

4. 完成！后续可以正常双击打开

**为什么会这样？**

- 应用是开源的，代码完全透明
- 为节省成本，未使用付费 Apple 开发者账号签名
- 应用功能完全正常，只是需要用户手动允许运行

### Windows 用户

直接下载并运行安装程序即可。

### Linux 用户

下载对应格式的安装包：

- **AppImage**：添加执行权限后直接运行
- **deb**：`sudo dpkg -i cherry-studio-*.deb`
- **rpm**：`sudo rpm -i cherry-studio-*.rpm`
```

---

## 🔄 升级到签名版本（可选）

**如果将来您决定使用付费 Apple Developer 账号：**

### 成本

- $99 USD/年

### 好处

- ✅ 用户可以直接双击打开，无需右键
- ✅ 通过 Apple 公证，增强用户信任
- ✅ 更专业的形象

### 升级步骤

1. 注册 Apple Developer 账号
2. 按照 `docs/technical/apple-code-signing-guide.md` 配置
3. 在 GitHub Secrets 中添加 5 个 Apple 配置
4. 使用 `.github/workflows/release.yml` 进行发布

**重要：** 应用代码无需修改，只需添加配置。

---

## ❓ 常见问题

### Q1: 无签名版本安全吗？

**A:** 是的。代码签名只是 Apple 的认证机制，不影响应用本身的安全性。

- ✅ 代码完全开源，任何人都可以审查
- ✅ GitHub Actions 构建日志公开透明
- ✅ 提供 SHA256 校验和验证文件完整性

### Q2: 为什么选择不签名？

**A:** 主要原因：

- 💰 节省 $99/年 的 Apple Developer 费用
- 🆓 对于个人项目或小型开源项目更友好
- 🔍 代码开源，安全性可验证

### Q3: 用户会接受右键打开的方式吗？

**A:** 对于开源社区和技术用户，这是完全可接受的方式。许多知名开源项目（如 Homebrew、Docker Desktop 等）都采用类似方式。

### Q4: 现有的 workflow 还能用吗？

**A:** 可以。您有三个选项：

1. ✅ 使用新的 `.github/workflows/build-unsigned.yml`（推荐，更清晰）
2. ✅ 使用现有的 `.github/workflows/build.yml`（会自动跳过签名）
3. ✅ 使用 `.github/workflows/release.yml`（推送 tag 触发）

### Q5: 能否同时支持签名和无签名？

**A:** 可以。在 workflow 中使用：

```yaml
CSC_LINK: ${{ secrets.CSC_LINK || '' }}
```

如果配置了证书就签名，没配置就跳过。

---

## 📊 当前配置状态

### ✅ 已就绪

- ✅ `electron-builder.yml` - 已设置 `notarize: false`
- ✅ `.github/workflows/build-unsigned.yml` - 专用无签名构建工作流
- ✅ `.github/workflows/build.yml` - 支持可选签名
- ✅ 文档齐全

### 🔧 需要您完成

- [ ] 配置 4 个基础 GitHub Secrets
- [ ] 运行一次测试构建
- [ ] 在 macOS 上测试安装
- [ ] 更新 README，添加用户安装说明

---

## 📚 详细文档

- 📖 [无需 Apple 账号的完整指南](docs/technical/macos-build-without-apple-account.md)
- 📖 [Apple 代码签名完整指南](docs/technical/apple-code-signing-guide.md)
- 📖 [GitHub Secrets 配置参考](docs/technical/github-secrets-reference.md)

---

## 🎉 开始使用

**现在就开始：**

1. 配置 4 个基础 Secrets
2. 访问 Actions 页面
3. 运行 "Build (Unsigned)" workflow
4. 几十分钟后，下载您的应用！

**就这么简单！** 🚀

---

**最后更新：** 2025-10-22

**问题反馈：** 如果遇到问题，请在 GitHub Issues 中提出
