# GitHub Actions 常见问题排查

本文档收集了使用 GitHub Actions 自动打包时的常见问题和解决方案。

---

## ❌ 错误: "Unrecognized named-value: 'matrix'"

### 问题描述

在 GitHub Actions 中出现错误：

```
Unrecognized named-value: 'matrix'. Located at position 1 within expression: matrix.platform
```

### 原因分析

这个错误发生的原因是：**在 job 级别的 `if` 条件中使用了 `matrix` 变量**。

在 GitHub Actions 中：

- `matrix` 变量只能在 **step 级别** 使用
- **不能**在 **job 级别** 使用

这是因为 job 级别的 `if` 条件在 matrix 展开之前就会被评估。

### 错误示例

```yaml
# ❌ 错误的写法
jobs:
  build:
    runs-on: ${{ matrix.os }}

    strategy:
      matrix:
        include:
          - os: ubuntu-latest
            platform: linux
          - os: macos-latest
            platform: macos

    # ❌ 这里会报错！job 级别不能使用 matrix
    if: |
      github.event.inputs.platform == 'all' ||
      github.event.inputs.platform == matrix.platform

    steps:
      - name: Build
        run: echo "Building..."
```

### 解决方案

将 `if` 条件移到 **step 级别**：

```yaml
# ✅ 正确的写法
jobs:
  build:
    runs-on: ${{ matrix.os }}

    strategy:
      matrix:
        include:
          - os: ubuntu-latest
            platform: linux
          - os: macos-latest
            platform: macos

    steps:
      # ✅ 在 step 级别使用 if 条件
      - name: Check out Git repository
        if: |
          github.event.inputs.platform == 'all' ||
          github.event.inputs.platform == matrix.platform
        uses: actions/checkout@v5

      - name: Build
        if: |
          github.event.inputs.platform == 'all' ||
          github.event.inputs.platform == matrix.platform
        run: echo "Building..."
```

### 已修复的文件

以下文件已经修复了这个问题：

- ✅ `.github/workflows/build.yml`
- ✅ `.github/workflows/build-unsigned.yml`

现在它们都在 step 级别使用条件判断，可以正确根据平台选择来跳过不需要的构建。

---

## 💡 GitHub Actions Matrix 使用指南

### Matrix 变量的作用域

| 位置                        | 是否可以使用 matrix | 说明                          |
| --------------------------- | ------------------- | ----------------------------- |
| `jobs.<job_id>.if`          | ❌ 不可以           | job 级别在 matrix 展开前评估  |
| `jobs.<job_id>.steps[*].if` | ✅ 可以             | step 级别可以访问 matrix 变量 |
| `jobs.<job_id>.runs-on`     | ✅ 可以             | 用于动态选择运行器            |
| `jobs.<job_id>.env`         | ✅ 可以             | 用于设置环境变量              |

### 示例：根据平台条件执行

```yaml
name: Conditional Build

on:
  workflow_dispatch:
    inputs:
      platform:
        type: choice
        options:
          - all
          - windows
          - macos
          - linux

jobs:
  build:
    runs-on: ${{ matrix.os }}

    strategy:
      matrix:
        include:
          - os: windows-latest
            platform: windows
          - os: macos-latest
            platform: macos
          - os: ubuntu-latest
            platform: linux

    steps:
      # 所有步骤都需要添加条件
      - name: Checkout
        if: |
          github.event.inputs.platform == 'all' ||
          github.event.inputs.platform == matrix.platform
        uses: actions/checkout@v5

      # 平台特定步骤需要组合条件
      - name: Build Windows
        if: |
          matrix.os == 'windows-latest' &&
          (github.event.inputs.platform == 'all' || github.event.inputs.platform == 'windows')
        run: echo "Building for Windows"

      - name: Build macOS
        if: |
          matrix.os == 'macos-latest' &&
          (github.event.inputs.platform == 'all' || github.event.inputs.platform == 'macos')
        run: echo "Building for macOS"

      - name: Build Linux
        if: |
          matrix.os == 'ubuntu-latest' &&
          (github.event.inputs.platform == 'all' || github.event.inputs.platform == 'linux')
        run: echo "Building for Linux"
```

---

## 🔍 其他常见错误

### 错误: "Context access might be invalid"

**问题：** 尝试在不支持的位置访问上下文变量。

**解决：** 查看 [GitHub Actions Context 文档](https://docs.github.com/en/actions/learn-github-actions/contexts#context-availability) 确认变量可用性。

### 错误: "Unable to process file command 'env'"

**问题：** `GITHUB_OUTPUT` 或 `GITHUB_ENV` 格式错误。

**解决：**

```bash
# ✅ 正确写法
echo "key=value" >> $GITHUB_OUTPUT

# ❌ 错误写法
echo "key=value" >> $GITHUB_ENV
```

### 错误: Secrets 未找到

**问题：** Secret 名称拼写错误或未配置。

**解决：**

1. 检查 Secret 名称是否正确（区分大小写）
2. 确认在 `Settings` → `Secrets and variables` → `Actions` 中已配置
3. 使用条件判断处理可选的 secrets：
   ```yaml
   CSC_LINK: ${{ secrets.CSC_LINK || '' }}
   ```

---

## 📚 参考资源

- [GitHub Actions 官方文档](https://docs.github.com/en/actions)
- [Workflow 语法](https://docs.github.com/en/actions/using-workflows/workflow-syntax-for-github-actions)
- [Contexts](https://docs.github.com/en/actions/learn-github-actions/contexts)
- [Expressions](https://docs.github.com/en/actions/learn-github-actions/expressions)

---

## 🆘 调试技巧

### 1. 启用调试日志

在 GitHub Secrets 中添加：

```
ACTIONS_STEP_DEBUG = true
ACTIONS_RUNNER_DEBUG = true
```

### 2. 打印上下文信息

```yaml
- name: Debug
  run: |
    echo "Event: ${{ github.event_name }}"
    echo "Platform input: ${{ github.event.inputs.platform }}"
    echo "Matrix OS: ${{ matrix.os }}"
    echo "Matrix Platform: ${{ matrix.platform }}"
```

### 3. 测试条件表达式

```yaml
- name: Test Condition
  if: always() # 总是运行，用于测试
  run: |
    echo "Condition result: ${{ github.event.inputs.platform == 'all' }}"
```

---

## ✅ 快速检查清单

遇到 workflow 问题时，检查：

- [ ] Secret 名称是否正确？
- [ ] `if` 条件是否在正确的级别？
- [ ] Matrix 变量是否在 step 级别使用？
- [ ] YAML 缩进是否正确（使用空格，不用 Tab）？
- [ ] 是否有语法错误（使用 YAML 验证器）？
- [ ] 所有需要的 actions 是否使用正确版本？

---

**最后更新：** 2025-10-22
