# GitHub Secrets 配置参考卡

快速参考：在 GitHub 中配置 Cherry Studio 自动打包所需的 Secrets。

> 📍 配置路径：`Settings` → `Secrets and variables` → `Actions` → `New repository secret`

---

## 🔐 必需配置（所有平台）

这些 secrets 是所有平台（Windows、macOS、Linux）打包必需的：

### 1. MAIN_VITE_CHERRYAI_CLIENT_SECRET

```
用途：CherryAI 客户端认证密钥
示例：sk_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
获取方式：项目内部配置或联系项目管理员
```

### 2. MAIN_VITE_MINERU_API_KEY

```
用途：MineRu OCR 服务 API 密钥
示例：miner_xxxxxxxxxxxxxxxxxxxx
获取方式：项目内部配置或联系项目管理员
```

### 3. RENDERER_VITE_AIHUBMIX_SECRET

```
用途：AI Hub Mix 服务密钥
示例：ahm_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
获取方式：项目内部配置或联系项目管理员
```

### 4. RENDERER_VITE_PPIO_APP_SECRET

```
用途：PPIO 应用服务密钥
示例：ppio_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
获取方式：项目内部配置或联系项目管理员
```

---

## 🍎 macOS 专用配置（代码签名与公证）

仅在需要打包 macOS 版本时配置：

### 5. CSC_LINK

```
用途：代码签名证书（.p12 文件的 Base64 编码）
格式：MIIKxAIBAzCCCo...（很长的 Base64 字符串）
获取方式：
  1. 从 Apple Developer 获取证书
  2. 导出为 .p12 文件
  3. 转换为 Base64：base64 -i certificate.p12
注意：必须是一行，不能有换行符
```

### 6. CSC_KEY_PASSWORD

```
用途：.p12 证书的密码
示例：YourP@ssw0rd123
获取方式：导出 .p12 证书时设置的密码
```

### 7. APPLE_ID

```
用途：Apple ID 邮箱（用于公证）
示例：your.email@example.com
获取方式：您的 Apple Developer 账号邮箱
```

### 8. APPLE_APP_SPECIFIC_PASSWORD

```
用途：App 专用密码（用于公证）
格式：xxxx-xxxx-xxxx-xxxx
获取方式：
  1. 访问 https://appleid.apple.com/
  2. 安全 → App 专用密码 → 生成密码
注意：只显示一次，请立即保存
```

### 9. APPLE_TEAM_ID

```
用途：Apple Team ID
示例：A1B2C3D4E5（10位字符）
获取方式：
  1. 访问 https://developer.apple.com/account
  2. 查看 Membership 或右上角账号信息
```

---

## 📋 GitHub Secrets 配置截图示例

### 配置页面路径：

```
https://github.com/你的用户名/cherry-studio/settings/secrets/actions
```

### 添加 Secret：

```
1. 点击 "New repository secret" 按钮
2. Name: [输入 Secret 名称，如 APPLE_ID]
3. Value: [粘贴对应的值]
4. 点击 "Add secret" 保存
```

### 配置完成后应该看到：

#### 基础配置（4 个）

- ✅ MAIN_VITE_CHERRYAI_CLIENT_SECRET
- ✅ MAIN_VITE_MINERU_API_KEY
- ✅ RENDERER_VITE_AIHUBMIX_SECRET
- ✅ RENDERER_VITE_PPIO_APP_SECRET

#### macOS 专用（5 个，可选）

- ✅ CSC_LINK
- ✅ CSC_KEY_PASSWORD
- ✅ APPLE_ID
- ✅ APPLE_APP_SPECIFIC_PASSWORD
- ✅ APPLE_TEAM_ID

---

## 🚀 验证配置

配置完成后，可以通过以下方式验证：

### 方法 1：查看 GitHub Actions 工作流

```
访问：https://github.com/你的用户名/cherry-studio/actions
查看最近的构建日志，确认没有 "secret not found" 错误
```

### 方法 2：手动触发测试构建

```
1. Actions → "Build (No Release)" → Run workflow
2. 选择平台
3. 查看构建日志
```

---

## ⚠️ 安全注意事项

### ✅ 应该做的：

- 将所有敏感信息配置为 GitHub Secrets
- 定期更新密码和证书
- 限制仓库访问权限
- 使用强密码

### ❌ 不应该做的：

- **绝对不要**将 secrets 写入代码
- **绝对不要**在日志中打印 secrets
- **绝对不要**将证书文件提交到仓库
- **绝对不要**公开分享这些配置

---

## 🆘 快速问题排查

### 问题：构建失败，提示缺少 secret

```
解决：检查 Secret 名称是否拼写正确（区分大小写）
```

### 问题：macOS 代码签名失败

```
解决：
1. 确认 CSC_LINK 是完整的 Base64 字符串
2. 确认 CSC_KEY_PASSWORD 正确
3. 确认证书类型是 "Developer ID Application"
```

### 问题：公证失败

```
解决：
1. 检查 APPLE_ID 是否正确
2. App 专用密码可能过期，需重新生成
3. 确认 Apple Developer 账号已激活
```

---

## 📚 相关文档

- 📖 [完整配置指南](./apple-code-signing-guide.md)
- 🔗 [GitHub Actions 文档](https://docs.github.com/en/actions/security-guides/encrypted-secrets)
- 🔗 [electron-builder 代码签名](https://www.electron.build/code-signing)

---

**配置模板（复制使用）**

```bash
# 在 GitHub Secrets 中逐个添加：

# 必需配置（4个）
MAIN_VITE_CHERRYAI_CLIENT_SECRET=<从项目管理员获取>
MAIN_VITE_MINERU_API_KEY=<从项目管理员获取>
RENDERER_VITE_AIHUBMIX_SECRET=<从项目管理员获取>
RENDERER_VITE_PPIO_APP_SECRET=<从项目管理员获取>

# macOS 打包配置（5个，可选）
CSC_LINK=<证书 Base64 编码>
CSC_KEY_PASSWORD=<证书密码>
APPLE_ID=<Apple ID 邮箱>
APPLE_APP_SPECIFIC_PASSWORD=<xxxx-xxxx-xxxx-xxxx>
APPLE_TEAM_ID=<10位Team ID>
```

---

**最后更新：** 2025-10-22
