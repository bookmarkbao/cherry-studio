# macOS 打包与代码签名配置指南

本指南将帮助您配置 GitHub Actions 所需的 Apple 代码签名和公证相关的环境变量，以便自动打包和发布 macOS 版本的 Cherry Studio。

## 📋 概览

macOS 打包需要以下 5 个 GitHub Secrets：

| Secret 名称                   | 说明                                    | 是否必需       |
| ----------------------------- | --------------------------------------- | -------------- |
| `CSC_LINK`                    | 代码签名证书（.p12 格式的 Base64 编码） | 是             |
| `CSC_KEY_PASSWORD`            | 证书密码                                | 是             |
| `APPLE_ID`                    | Apple ID 邮箱                           | 是（用于公证） |
| `APPLE_APP_SPECIFIC_PASSWORD` | App 专用密码                            | 是（用于公证） |
| `APPLE_TEAM_ID`               | Apple Team ID                           | 是（用于公证） |

---

## 🎯 第一步：注册 Apple Developer 账号

### 1. 注册账号

- 访问：https://developer.apple.com/
- 点击 "Account" → "Join the Apple Developer Program"
- 费用：**$99 USD/年**（个人或公司账号）

### 2. 完成注册流程

- 登录后，接受开发者协议
- 等待账号激活（通常 24-48 小时）

---

## 🔑 第二步：创建代码签名证书

### 1. 在 macOS 上打开 Keychain Access（钥匙串访问）

在 macOS 电脑上操作：

```bash
# 打开钥匙串访问应用
open -a "Keychain Access"
```

### 2. 请求证书

1. 菜单栏：`钥匙串访问` → `证书助理` → `从证书颁发机构请求证书`
2. 填写信息：
   - **用户电子邮件地址**：您的 Apple ID 邮箱
   - **常用名称**：您的名字或公司名
   - **CA 电子邮件地址**：留空
   - 选择：**存储到磁盘**
3. 保存 `.certSigningRequest` 文件

### 3. 在 Apple Developer 网站创建证书

1. 访问：https://developer.apple.com/account/resources/certificates/list
2. 点击 `+` 按钮创建新证书
3. 选择：**Developer ID Application** （用于在 Mac App Store 外分发）
4. 上传刚才保存的 `.certSigningRequest` 文件
5. 下载生成的证书（`.cer` 文件）

### 4. 安装证书到钥匙串

双击下载的 `.cer` 文件，它会自动添加到钥匙串中。

### 5. 导出证书为 .p12 格式

在钥匙串访问中：

1. 选择 `登录` → `我的证书`
2. 找到名称为 "Developer ID Application: xxx" 的证书
3. 右键点击 → `导出 "Developer ID Application: xxx"`
4. 文件格式选择：**个人信息交换 (.p12)**
5. 保存文件（例如：`certificate.p12`）
6. **设置证书密码**（请记住这个密码，后面需要用到）

---

## 🔐 第三步：转换证书为 Base64

### 在 macOS/Linux 上：

```bash
# 转换 .p12 文件为 Base64
base64 -i certificate.p12 -o certificate-base64.txt

# 或者直接输出到终端（复制内容）
base64 -i certificate.p12
```

### 在 Windows 上（PowerShell）：

```powershell
# 读取文件并转换为 Base64
[Convert]::ToBase64String([IO.File]::ReadAllBytes("certificate.p12")) | Out-File -FilePath certificate-base64.txt -Encoding ASCII

# 或者直接输出
[Convert]::ToBase64String([IO.File]::ReadAllBytes("certificate.p12"))
```

**⚠️ 重要：**

- 保存输出的 Base64 字符串（一长串字符）
- 这就是 `CSC_LINK` 的值
- **不要包含换行符**，应该是一整行

---

## 🍎 第四步：创建 App 专用密码

用于 Apple 公证（Notarization）服务：

### 1. 访问 Apple ID 管理页面

- 访问：https://appleid.apple.com/
- 使用您的 Apple ID 登录

### 2. 生成 App 专用密码

1. 在 **安全** 部分，找到 **App 专用密码**
2. 点击 `生成密码...`
3. 输入标签名称（例如：`Cherry Studio GitHub Actions`）
4. 点击 **创建**
5. **⚠️ 立即复制显示的密码**（格式：`xxxx-xxxx-xxxx-xxxx`）
6. 这个密码只会显示一次，请妥善保存

这就是 `APPLE_APP_SPECIFIC_PASSWORD` 的值。

---

## 🏢 第五步：获取 Apple Team ID

### 1. 访问 Apple Developer 会员中心

- 访问：https://developer.apple.com/account
- 登录您的 Apple Developer 账号

### 2. 查看 Team ID

1. 在页面右上角，点击您的账号名称
2. 或访问：https://developer.apple.com/account/#/membership/
3. 找到 **Team ID**（通常是 10 位字符，例如：`A1B2C3D4E5`）

这就是 `APPLE_TEAM_ID` 的值。

---

## ⚙️ 第六步：在 GitHub 中配置 Secrets

### 1. 访问仓库的 Secrets 设置页面

```
https://github.com/你的用户名/cherry-studio/settings/secrets/actions
```

或者：

1. 打开您的 GitHub 仓库
2. 点击 `Settings`（设置）
3. 左侧菜单：`Secrets and variables` → `Actions`

### 2. 添加以下 Secrets

点击 `New repository secret` 按钮，逐个添加：

#### 1️⃣ CSC_LINK

```
Name: CSC_LINK
Value: [粘贴第三步得到的 Base64 字符串，应该是很长的一行]
```

#### 2️⃣ CSC_KEY_PASSWORD

```
Name: CSC_KEY_PASSWORD
Value: [粘贴您在导出 .p12 时设置的密码]
```

#### 3️⃣ APPLE_ID

```
Name: APPLE_ID
Value: [您的 Apple ID 邮箱，例如：your.email@example.com]
```

#### 4️⃣ APPLE_APP_SPECIFIC_PASSWORD

```
Name: APPLE_APP_SPECIFIC_PASSWORD
Value: [第四步创建的 App 专用密码，格式：xxxx-xxxx-xxxx-xxxx]
```

#### 5️⃣ APPLE_TEAM_ID

```
Name: APPLE_TEAM_ID
Value: [第五步获取的 Team ID，例如：A1B2C3D4E5]
```

### 3. 验证配置

配置完成后，您应该看到 5 个 secrets：

- ✅ CSC_LINK
- ✅ CSC_KEY_PASSWORD
- ✅ APPLE_ID
- ✅ APPLE_APP_SPECIFIC_PASSWORD
- ✅ APPLE_TEAM_ID

---

## 🚀 第七步：测试打包

### 方法 1：推送标签触发 Release

```bash
# 创建并推送标签
git tag v1.7.1-test
git push origin v1.7.1-test
```

### 方法 2：手动触发 Build workflow

1. 访问：`https://github.com/你的用户名/cherry-studio/actions`
2. 选择 "Build (No Release)" workflow
3. 点击 `Run workflow`
4. 选择 platform：`macos`
5. 点击 `Run workflow` 按钮

### 查看构建日志

1. 进入 Actions 页面
2. 点击正在运行的 workflow
3. 查看 "Build Mac" 步骤的日志
4. 确认没有签名或公证错误

---

## ❓ 常见问题

### Q1: 为什么需要代码签名？

**A:** macOS Gatekeeper 会阻止未签名的应用。签名后的应用能：

- 正常安装和运行，不会被拦截
- 通过 Apple 公证，增加用户信任
- 在更新时保持权限

### Q2: 公证（Notarization）是什么？

**A:** 公证是 Apple 对应用进行的自动安全检查，确保：

- 应用没有恶意代码
- 应用正确签名
- 用户下载后不会看到安全警告

### Q3: 如果没有 Apple Developer 账号怎么办？

**A:** 有几个选项：

#### 方案 1：不签名打包（推荐给个人项目）

**优点：**

- ✅ 完全免费
- ✅ 可以正常打包和分发
- ✅ 应用功能完全正常

**缺点：**

- ❌ 用户首次打开会看到安全警告
- ❌ 需要用户右键打开或在设置中允许
- ❌ 无法通过 Apple 公证

**配置方法：**

在 `.github/workflows/release.yml` 和 `.github/workflows/build.yml` 中，移除以下环境变量：

```yaml
# 注释或删除这些行
# CSC_LINK: ${{ secrets.CSC_LINK }}
# CSC_KEY_PASSWORD: ${{ secrets.CSC_KEY_PASSWORD }}
# APPLE_ID: ${{ secrets.APPLE_ID }}
# APPLE_APP_SPECIFIC_PASSWORD: ${{ secrets.APPLE_APP_SPECIFIC_PASSWORD }}
# APPLE_TEAM_ID: ${{ secrets.APPLE_TEAM_ID }}
```

在 `electron-builder.yml` 中设置：

```yaml
mac:
  identity: null # 禁用代码签名
  notarize: false # 禁用公证
```

**用户安装方法：**

1. 下载 `.dmg` 文件
2. 首次打开时，右键点击应用 → "打开"
3. 点击"打开"确认
4. 后续就可以正常双击打开了

#### 方案 2：使用免费的 Apple ID 签名（本地开发）

**优点：**

- ✅ 完全免费
- ✅ 可以本地签名
- ✅ 减少部分安全警告

**缺点：**

- ❌ 只能在 macOS 上打包
- ❌ 证书有效期只有 7 天
- ❌ 不能用于 CI/CD（GitHub Actions）
- ❌ 仍然无法公证

**配置方法：**
在本地 macOS 上使用 Xcode 生成的免费证书，仅适用于个人开发测试。

#### 方案 3：注册付费开发者账号（推荐给商业项目）

**费用：** $99 USD/年

**优点：**

- ✅ 完整的代码签名
- ✅ 可以公证应用
- ✅ 用户安装无障碍
- ✅ 专业可信
- ✅ 支持 CI/CD 自动打包

**适用场景：**

- 商业项目
- 需要公开发布的开源项目
- 需要自动化打包的项目

### Q4: Base64 转换后的字符串太长，GitHub 能接受吗？

**A:** 可以。GitHub Secrets 支持最大 64KB 的内容，证书的 Base64 编码通常只有几 KB。

### Q5: 如何更新过期的证书？

**A:** 证书有效期通常是 5 年：

1. 在 Apple Developer 网站创建新证书
2. 按照本指南重新导出和编码
3. 在 GitHub Secrets 中更新 `CSC_LINK` 的值

### Q6: 构建失败，提示 "certificate not found"

**A:** 检查：

- `CSC_LINK` 是否正确（完整的 Base64 字符串，无换行）
- `CSC_KEY_PASSWORD` 是否正确
- 证书是否是 "Developer ID Application" 类型

### Q7: 公证失败，提示认证错误

**A:** 检查：

- `APPLE_ID` 是否正确
- `APPLE_APP_SPECIFIC_PASSWORD` 是否有效（可能过期，需重新生成）
- `APPLE_TEAM_ID` 是否正确
- Apple Developer 账号是否激活且有效

---

## 📚 相关资源

- [Apple Developer 官网](https://developer.apple.com/)
- [代码签名指南](https://developer.apple.com/support/code-signing/)
- [公证流程文档](https://developer.apple.com/documentation/security/notarizing_macos_software_before_distribution)
- [electron-builder 文档](https://www.electron.build/code-signing)

---

## 🔒 安全建议

1. **永远不要将证书、密码或 secrets 提交到代码仓库**
2. **定期更新 App 专用密码**
3. **限制能访问 GitHub Secrets 的人员**
4. **证书文件使用后应安全删除或加密保存**
5. **不要在日志中输出敏感信息**

---

## ✅ 配置完成检查清单

- [ ] 已注册 Apple Developer 账号
- [ ] 已创建 Developer ID Application 证书
- [ ] 已导出 .p12 证书文件
- [ ] 已转换为 Base64 格式
- [ ] 已创建 App 专用密码
- [ ] 已获取 Team ID
- [ ] 已在 GitHub 中配置所有 5 个 Secrets
- [ ] 已测试构建流程

完成以上所有步骤后，您的 GitHub Actions 就能自动构建、签名并公证 macOS 版本的 Cherry Studio 了！

---

**最后更新：** 2025-10-22
