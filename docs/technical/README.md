# Cherry Studio 技术文档索引

欢迎来到 Cherry Studio 技术文档中心！本文档将帮助您快速找到所需的信息。

---

## 🚀 快速开始

### 第一次使用？从这里开始

1. **[快速开始：无签名构建](../../QUICK_START_UNSIGNED_BUILD.md)** ⭐ 推荐

   - 无需 Apple 账号
   - 完全免费
   - 快速上手

2. **[工作流对比](./workflows-comparison.md)**
   - 了解不同工作流的用途
   - 选择适合您的构建方式

---

## 📚 文档导航

### 🏗️ 构建与打包

| 文档                                                         | 说明                      | 适用场景           |
| ------------------------------------------------------------ | ------------------------- | ------------------ |
| **[无签名构建指南](./macos-build-without-apple-account.md)** | 无需 Apple 账号打包 macOS | 个人项目、测试     |
| **[Apple 代码签名指南](./apple-code-signing-guide.md)**      | 完整的 macOS 签名配置     | 商业项目、正式发布 |
| **[GitHub Secrets 配置](./github-secrets-reference.md)**     | 所有 Secrets 的配置参考   | 配置时查阅         |

### 🚢 发布与部署

| 文档                                            | 说明             | 适用场景           |
| ----------------------------------------------- | ---------------- | ------------------ |
| **[版本发布指南](./release-guide.md)**          | 完整的发布流程   | 发布新版本         |
| **[灵活发布指南](./flexible-release-guide.md)** | 使用 Build 发布  | 特定平台、快速发布 |
| **[工作流对比](./workflows-comparison.md)**     | 不同工作流的对比 | 选择合适的工作流   |

### 🔧 故障排查

| 文档                                                               | 说明               | 适用场景   |
| ------------------------------------------------------------------ | ------------------ | ---------- |
| **[GitHub Actions 故障排查](./github-actions-troubleshooting.md)** | 常见问题和解决方案 | 遇到错误时 |

---

## 🎯 按需求查找

### 我想...

#### 第一次配置自动打包

1. ✅ 阅读 [快速开始：无签名构建](../../QUICK_START_UNSIGNED_BUILD.md)
2. ✅ 配置 [GitHub Secrets](./github-secrets-reference.md)
3. ✅ 运行第一次构建

**预计时间：** 15 分钟

---

#### 发布新版本

1. ✅ 阅读 [版本发布指南](./release-guide.md)
2. ✅ 准备发布材料
3. ✅ 推送标签或手动触发

**预计时间：** 1 小时（包括构建）

---

#### 配置 macOS 代码签名

1. ✅ 注册 Apple Developer 账号（$99/年）
2. ✅ 阅读 [Apple 代码签名指南](./apple-code-signing-guide.md)
3. ✅ 配置 5 个 Apple Secrets
4. ✅ 测试构建

**预计时间：** 2-3 小时（首次）

---

#### 解决构建错误

1. ✅ 查看 [故障排查文档](./github-actions-troubleshooting.md)
2. ✅ 检查 Secrets 配置
3. ✅ 查看构建日志

**预计时间：** 10-30 分钟

---

## 📊 文档结构

```
docs/technical/
├── README.md                               # 本文档（索引）
├── apple-code-signing-guide.md             # Apple 代码签名完整指南
├── github-secrets-reference.md             # GitHub Secrets 配置参考
├── macos-build-without-apple-account.md    # 无签名构建指南
├── release-guide.md                        # 版本发布指南（标准方式）
├── flexible-release-guide.md               # 灵活发布指南（新增）
├── workflows-comparison.md                 # 工作流对比
└── github-actions-troubleshooting.md       # 故障排查

QUICK_START_UNSIGNED_BUILD.md               # 快速开始（项目根目录）
```

---

## 🆚 方案对比

### 无签名 vs 签名构建

| 特性         | 无签名构建                                           | 签名构建                                  |
| ------------ | ---------------------------------------------------- | ----------------------------------------- |
| **费用**     | 🆓 免费                                              | 💰 $99/年                                 |
| **配置难度** | ⭐ 简单                                              | ⭐⭐⭐ 复杂                               |
| **用户体验** | ⚠️ 需右键打开                                        | ✅ 直接打开                               |
| **适用场景** | 个人、测试                                           | 商业、正式                                |
| **文档**     | [无签名指南](./macos-build-without-apple-account.md) | [签名指南](./apple-code-signing-guide.md) |

### 不同工作流对比

| 工作流             | 用途       | 是否发布 | 文档                                            |
| ------------------ | ---------- | -------- | ----------------------------------------------- |
| **Release**        | 正式发布   | ✅ 是    | [发布指南](./release-guide.md)                  |
| **Build**          | 测试构建   | ❌ 否    | [工作流对比](./workflows-comparison.md)         |
| **Build Unsigned** | 无签名测试 | ❌ 否    | [快速开始](../../QUICK_START_UNSIGNED_BUILD.md) |
| **Nightly**        | 每日构建   | ❌ 否    | [工作流对比](./workflows-comparison.md)         |
| **PR CI**          | 代码检查   | ❌ 否    | [工作流对比](./workflows-comparison.md)         |

---

## 🔑 关键概念

### GitHub Secrets

存储敏感信息的安全方式，包括：

- 基础配置（4 个）：必需
- Apple 配置（5 个）：可选

📖 详见：[GitHub Secrets 配置参考](./github-secrets-reference.md)

### 代码签名

Apple 要求的安全机制：

- ✅ 有签名：用户可以直接打开
- ❌ 无签名：用户需要右键打开

📖 详见：[Apple 代码签名指南](./apple-code-signing-guide.md)

### GitHub Actions Workflow

自动化构建和发布的脚本：

- 定义在 `.github/workflows/` 目录
- 可以自动或手动触发

📖 详见：[工作流对比](./workflows-comparison.md)

---

## 🎓 学习路径

### 新手路径（推荐）

```
第1步：了解基础
├─ 阅读「快速开始」
└─ 了解「工作流对比」

第2步：首次构建
├─ 配置 4 个基础 Secrets
├─ 运行 Build Unsigned
└─ 下载并测试构建产物

第3步：发布版本
├─ 阅读「发布指南」
├─ 准备发布材料
└─ 推送标签发布
```

### 进阶路径

```
第1步：配置签名
├─ 注册 Apple Developer
├─ 按照「签名指南」配置
└─ 测试签名构建

第2步：优化流程
├─ 自定义工作流
├─ 配置自动化
└─ 设置通知

第3步：深度定制
├─ 修改构建脚本
├─ 添加自定义步骤
└─ 集成其他服务
```

---

## 💡 最佳实践

### ✅ 推荐做法

1. **开始时使用无签名构建**

   - 快速上手
   - 验证流程
   - 节省成本

2. **正式发布前配置签名**

   - 提升用户体验
   - 增强信任度
   - 专业形象

3. **保持文档更新**
   - 记录配置过程
   - 分享经验教训
   - 帮助团队成员

### ❌ 避免做法

1. **不要硬编码 Secrets**

   - 使用 GitHub Secrets
   - 不要提交到代码

2. **不要跳过测试**

   - 先用 Build 测试
   - 再用 Release 发布

3. **不要忽略错误**
   - 查看构建日志
   - 参考故障排查文档

---

## 🆘 获取帮助

### 遇到问题？

1. **查看文档**

   - 先查看相关文档
   - 使用本页面的导航

2. **故障排查**

   - 查看 [故障排查文档](./github-actions-troubleshooting.md)
   - 检查常见问题

3. **寻求帮助**
   - GitHub Issues
   - 项目讨论区
   - 社区论坛

### 文档问题？

如果发现文档有误或需要改进：

1. 提交 Issue 说明问题
2. 或者直接提交 PR 修复

---

## 📝 文档更新日志

| 日期       | 更新内容                        |
| ---------- | ------------------------------- |
| 2025-10-22 | 创建完整的技术文档体系          |
| 2025-10-22 | 添加无签名构建方案              |
| 2025-10-22 | 修复 GitHub Actions matrix 错误 |
| 2025-10-22 | 为 Build 工作流添加可选发布功能 |
| 2025-10-22 | 添加灵活发布指南                |

---

## 🔗 外部资源

### 官方文档

- [GitHub Actions 文档](https://docs.github.com/en/actions)
- [electron-builder 文档](https://www.electron.build/)
- [Apple Developer 文档](https://developer.apple.com/)

### 社区资源

- [GitHub Discussions](https://github.com/discussions)
- [Stack Overflow](https://stackoverflow.com/questions/tagged/github-actions)

---

## ✅ 快速检查清单

### 首次配置

- [ ] 已阅读快速开始文档
- [ ] 已配置 4 个基础 Secrets
- [ ] 已成功运行第一次构建
- [ ] 已下载并测试构建产物

### 准备发布

- [ ] 已配置所有必需 Secrets
- [ ] 已测试构建流程
- [ ] 已准备 Release 说明
- [ ] 已了解发布流程

### 配置签名

- [ ] 已注册 Apple Developer
- [ ] 已创建代码签名证书
- [ ] 已配置 5 个 Apple Secrets
- [ ] 已测试签名构建

---

**文档维护者：** Cherry Studio 团队

**最后更新：** 2025-10-22

**反馈建议：** 欢迎提交 Issue 或 PR
