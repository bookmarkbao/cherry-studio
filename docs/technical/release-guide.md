# 🚀 Cherry Studio 版本发布指南

本指南介绍如何使用 GitHub Actions 自动构建并发布 Cherry Studio 的新版本。

---

## 📋 发布流程概览

```mermaid
graph LR
    A[准备发布] --> B[推送标签/手动触发]
    B --> C[GitHub Actions 构建]
    C --> D[三平台同时构建]
    D --> E[创建 GitHub Release 草稿]
    E --> F[检查并编辑 Release]
    F --> G[发布正式版本]
```

---

## 🎯 发布前准备

### 1. 确认代码已准备就绪

- [ ] 所有功能开发完成
- [ ] 测试通过
- [ ] 文档已更新
- [ ] CHANGELOG 已更新
- [ ] 代码已合并到主分支

### 2. 确认 GitHub Secrets 配置完整

#### 必需配置（4 个，所有平台）

```
✅ MAIN_VITE_CHERRYAI_CLIENT_SECRET
✅ MAIN_VITE_MINERU_API_KEY
✅ RENDERER_VITE_AIHUBMIX_SECRET
✅ RENDERER_VITE_PPIO_APP_SECRET
```

#### macOS 签名配置（5 个，可选）

```
⚠️ CSC_LINK
⚠️ CSC_KEY_PASSWORD
⚠️ APPLE_ID
⚠️ APPLE_APP_SPECIFIC_PASSWORD
⚠️ APPLE_TEAM_ID
```

> 💡 如果没有配置 macOS 签名，会生成无签名的 macOS 版本（用户需右键打开）

---

## 🚀 发布方法

### 方法 1：推送 Git 标签触发（推荐）

这是最常用的方法，适合正式发布。

#### 步骤：

**1. 确定版本号**

遵循 [语义化版本](https://semver.org/lang/zh-CN/)：

- `v1.0.0` - 主版本（重大更新）
- `v1.1.0` - 次版本（功能更新）
- `v1.0.1` - 补丁版本（Bug 修复）
- `v1.7.0-beta.2` - 预发布版本

**2. 在本地创建标签**

```bash
# 切换到要发布的分支
git checkout main  # 或 develop

# 拉取最新代码
git pull origin main

# 创建标签（将 v1.7.1 替换为您的版本号）
git tag -a v1.7.1 -m "Release v1.7.1"

# 查看标签
git tag -l
```

**3. 推送标签到 GitHub**

```bash
# 推送标签（这会触发 Release workflow）
git push origin v1.7.1
```

**4. 监控构建过程**

访问：`https://github.com/你的用户名/cherry-studio/actions`

- 等待所有三个平台的构建完成（约 30-60 分钟）
- 检查是否有错误

**5. 检查 Release 草稿**

访问：`https://github.com/你的用户名/cherry-studio/releases`

- 会看到一个标记为 "Draft" 的 Release
- 检查所有文件是否都已上传

**6. 发布 Release**

- 编辑 Release 说明
- 添加更新日志
- 取消勾选 "Set as a pre-release"（如果是正式版）
- 点击 "Publish release"

---

### 方法 2：手动触发 Workflow

适合测试发布流程或紧急发布。

#### 步骤：

**1. 访问 Actions 页面**

```
https://github.com/你的用户名/cherry-studio/actions
```

**2. 选择 Release Workflow**

- 点击左侧 "Release" workflow
- 点击右侧 "Run workflow" 按钮

**3. 输入版本标签**

```
Release tag: v1.7.1
```

**4. 运行 Workflow**

- 点击绿色的 "Run workflow" 按钮
- 等待构建完成

**5. 后续步骤同方法 1**

---

## 📦 构建产物说明

### Windows 平台

Release 会包含以下文件：

```
Cherry Studio-1.7.1-x64-setup.exe          # Windows 64位安装版
Cherry Studio-1.7.1-x64-portable.exe       # Windows 64位便携版
Cherry Studio-1.7.1-arm64-setup.exe        # Windows ARM64安装版
Cherry Studio-1.7.1-arm64-portable.exe     # Windows ARM64便携版
latest.yml                                  # 自动更新配置
```

### macOS 平台

```
Cherry Studio-1.7.1-arm64.dmg              # Apple Silicon (M1/M2/M3)
Cherry Studio-1.7.1-x64.dmg                # Intel Mac
Cherry Studio-1.7.1-arm64.zip              # 压缩包版本
Cherry Studio-1.7.1-x64.zip                # 压缩包版本
latest-mac.yml                              # 自动更新配置
```

### Linux 平台

```
Cherry Studio-1.7.1-x86_64.AppImage        # 通用AppImage
Cherry Studio-1.7.1-arm64.AppImage         # ARM64 AppImage
Cherry Studio-1.7.1-x64.deb                # Debian/Ubuntu
Cherry Studio-1.7.1-x64.rpm                # RedHat/CentOS/Fedora
Cherry Studio-1.7.1-x64.tar.gz             # 压缩包
latest-linux.yml                            # 自动更新配置
```

### 其他文件

```
*.blockmap                                  # 增量更新文件
```

---

## ✏️ Release 说明模板

### 中英文模板

```markdown
## 🎉 What's New in v1.7.1 / v1.7.1 新特性

### ✨ New Features / 新功能

- Added XXX feature
- 添加了 XXX 功能

### 🐛 Bug Fixes / 问题修复

- Fixed XXX issue
- 修复了 XXX 问题

### 🔧 Improvements / 改进

- Improved XXX performance
- 优化了 XXX 性能

### 📦 Installation / 安装说明

**Windows:**

- Download and run the `.exe` installer
- 下载并运行 `.exe` 安装程序

**macOS:**

- Download the `.dmg` file
- ⚠️ First time: Right-click → Open (for unsigned builds)
- 下载 `.dmg` 文件
- ⚠️ 首次打开：右键点击 → 打开（针对无签名版本）

**Linux:**

- AppImage: `chmod +x *.AppImage && ./Cherry-Studio-*.AppImage`
- Debian/Ubuntu: `sudo dpkg -i *.deb`
- RedHat/CentOS: `sudo rpm -i *.rpm`

---

### 🔗 Links / 相关链接

- 📖 Documentation: [GitHub](https://github.com/your-username/cherry-studio)
- 💬 Discussions: [GitHub Discussions](https://github.com/your-username/cherry-studio/discussions)
- 🐛 Report Issues: [GitHub Issues](https://github.com/your-username/cherry-studio/issues)

### 📊 Checksums / 校验和

See below for SHA256 checksums of all files.
所有文件的 SHA256 校验和见下方。
```

---

## 🔄 版本号管理

### 自动更新 package.json

Release workflow 会自动更新 `package.json` 中的版本号：

```bash
# 从 v1.7.1 提取版本号 1.7.1
TAG="v1.7.1"
VERSION="${TAG#v}"
npm version "$VERSION" --no-git-tag-version --allow-same-version
```

### 版本号规范

```
v<major>.<minor>.<patch>[-<prerelease>]

示例：
v1.0.0          # 正式版本
v1.0.0-alpha.1  # Alpha 测试版
v1.0.0-beta.1   # Beta 测试版
v1.0.0-rc.1     # Release Candidate
```

---

## 🛠️ 故障排查

### 问题 1：构建失败 - Secrets 缺失

**症状：** 构建日志显示 "Secret not found"

**解决：**

```bash
# 检查必需的 4 个 Secrets 是否都已配置
访问：Settings → Secrets and variables → Actions
确认：MAIN_VITE_CHERRYAI_CLIENT_SECRET 等 4 个 Secrets
```

### 问题 2：macOS 构建失败 - 签名错误

**症状：** macOS 构建失败，提示证书问题

**解决方案 A：** 配置 Apple 签名（推荐）

- 参考：`docs/technical/apple-code-signing-guide.md`
- 配置 5 个 Apple Secrets

**解决方案 B：** 使用无签名构建

```yaml
# 修改 .github/workflows/release.yml
# 移除 Build Mac 步骤中的 Apple Secrets 环境变量
# 或使用 build-unsigned.yml 工作流
```

### 问题 3：Release 未自动创建

**原因：** 权限不足

**解决：**

```yaml
# 确认 workflow 有写权限
permissions:
  contents: write # ✅ 必需
```

### 问题 4：某个平台构建失败，但想先发布

**解决：**

1. 不要删除 Release 草稿
2. 下载失败平台的构建产物（如果部分成功）
3. 或者在本地构建失败的平台
4. 手动上传到 Release
5. 发布 Release

---

## 📊 发布后检查清单

### 立即检查

- [ ] Release 页面显示正常
- [ ] 所有平台的文件都已上传
- [ ] 文件大小合理（未损坏）
- [ ] Release 说明清晰完整
- [ ] 版本号正确

### 下载测试

- [ ] Windows 版本可以下载和安装
- [ ] macOS 版本可以下载和打开
- [ ] Linux 版本可以下载和运行

### 功能测试

- [ ] 应用启动正常
- [ ] 主要功能工作正常
- [ ] 自动更新功能正常（如果有）

### 宣传发布

- [ ] 更新官网（如果有）
- [ ] 发布社交媒体公告
- [ ] 通知用户/社区
- [ ] 更新文档链接

---

## 🔐 安全注意事项

### 保护 Secrets

```bash
# ❌ 不要
- 将 Secrets 提交到代码
- 在日志中打印 Secrets
- 公开分享 Secrets

# ✅ 应该
- 使用 GitHub Secrets 存储
- 定期轮换敏感密钥
- 限制仓库访问权限
```

### 验证构建产物

```bash
# 提供 SHA256 校验和
cd dist
sha256sum * > SHA256SUMS.txt

# 用户可以验证：
sha256sum -c SHA256SUMS.txt
```

---

## 🎯 快速命令参考

### 发布新版本（完整流程）

```bash
# 1. 更新代码
git checkout main
git pull origin main

# 2. 创建并推送标签
VERSION="v1.7.1"
git tag -a $VERSION -m "Release $VERSION"
git push origin $VERSION

# 3. 监控构建
# 访问 GitHub Actions 页面

# 4. 发布 Release
# 访问 GitHub Releases 页面，编辑草稿并发布
```

### 删除错误的标签

```bash
# 本地删除
git tag -d v1.7.1

# 远程删除
git push origin :refs/tags/v1.7.1
```

### 创建测试版本

```bash
# 创建 beta 版本
git tag -a v1.7.1-beta.1 -m "Beta release"
git push origin v1.7.1-beta.1
```

---

## 📚 相关文档

- [Apple 代码签名指南](./apple-code-signing-guide.md)
- [GitHub Secrets 配置](./github-secrets-reference.md)
- [无签名构建指南](./macos-build-without-apple-account.md)
- [故障排查](./github-actions-troubleshooting.md)

---

## 🆘 紧急发布流程

如果需要紧急发布修复（Hotfix）：

```bash
# 1. 基于最新 tag 创建分支
git checkout v1.7.0
git checkout -b hotfix-1.7.1

# 2. 修复问题
# ... 编辑代码 ...
git commit -am "Fix critical bug"

# 3. 合并回主分支
git checkout main
git merge hotfix-1.7.1

# 4. 创建新标签
git tag -a v1.7.1 -m "Hotfix: Critical bug fix"
git push origin main
git push origin v1.7.1

# 5. 监控构建和发布
```

---

## 📝 版本发布记录

建议在项目中维护 `CHANGELOG.md`：

```markdown
# Changelog

## [1.7.1] - 2025-01-20

### Fixed

- Fixed critical bug in XXX

### Changed

- Updated XXX dependency

## [1.7.0] - 2025-01-15

### Added

- New feature XXX

### Improved

- Performance improvements
```

---

**最后更新：** 2025-10-22

**下次发布：** 根据开发进度确定
