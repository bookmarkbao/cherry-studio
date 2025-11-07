# 更新配置系统设计文档

## 背景

当前 AppUpdater 直接请求 GitHub API 获取 beta 和 rc 的更新信息。为了支持国内用户，需要根据 IP 地理位置，分别从 GitHub/GitCode 获取一个固定的 JSON 配置文件，该文件包含所有渠道的更新地址。

## 设计目标

1. 支持根据 IP 地理位置选择不同的配置源（GitHub/GitCode）
2. 支持版本兼容性控制（如 v1.x 以下必须先升级到 v1.7.0 才能升级到 v2.0）
3. 易于扩展，支持未来多个主版本的升级路径（v1.6 → v1.7 → v2.0 → v2.8 → v3.0）
4. 保持与现有 electron-updater 机制的兼容性

## 当前版本策略

- **v1.7.x** 是 1.x 系列的最后版本
- **v1.7.0 以下**的用户必须先升级到 v1.7.0（或更高的 1.7.x 版本）
- **v1.7.0 及以上**的用户可以直接升级到 v2.x.x

## JSON 配置文件格式

### 文件位置

- **GitHub**: `https://raw.githubusercontent.com/CherryHQ/cherry-studio/main/app-upgrade-config.json`
- **GitCode**: `https://gitcode.com/CherryHQ/cherry-studio/raw/main/app-upgrade-config.json`

**说明**：两个镜像源提供相同的配置文件，客户端根据 IP 地理位置自动选择最优镜像源。

### 配置结构（当前实际配置）

```json
{
  "lastUpdated": "2025-01-05T00:00:00Z",
  "versions": {
    "1.6.7": {
      "minCompatibleVersion": "1.0.0",
      "description": "Last stable v1.7.x release - required intermediate version for users below v1.7",
      "channels": {
        "latest": {
          "version": "1.6.7",
          "feedUrls": {
            "github": "https://github.com/CherryHQ/cherry-studio/releases/download/v1.6.7",
            "gitcode": "https://gitcode.com/CherryHQ/cherry-studio/releases/download/v1.6.7"
          }
        },
        "rc": {
          "version": "1.6.0-rc.5",
          "feedUrls": {
            "github": "https://github.com/CherryHQ/cherry-studio/releases/download/v1.6.0-rc.5",
            "gitcode": "https://github.com/CherryHQ/cherry-studio/releases/download/v1.6.0-rc.5"
          }
        },
        "beta": {
          "version": "1.6.7-beta.3",
          "feedUrls": {
            "github": "https://github.com/CherryHQ/cherry-studio/releases/download/v1.7.0-beta.3",
            "gitcode": "https://github.com/CherryHQ/cherry-studio/releases/download/v1.7.0-beta.3"
          }
        }
      }
    },
    "2.0.0": {
      "minCompatibleVersion": "1.7.0",
      "description": "Major release v2.0 - required intermediate version for v2.x upgrades",
      "channels": {
        "latest": null,
        "rc": null,
        "beta": null
      }
    }
  }
}
```

### 未来扩展示例

当需要发布 v3.0 时，如果需要强制用户先升级到 v2.8，可以添加：

```json
{
  "2.8.0": {
    "minCompatibleVersion": "2.0.0",
    "description": "Stable v2.8 - required for v3 upgrade",
    "channels": {
      "latest": {
        "version": "2.8.0",
        "feedUrls": {
          "github": "https://github.com/CherryHQ/cherry-studio/releases/download/v2.8.0",
          "gitcode": "https://gitcode.com/CherryHQ/cherry-studio/releases/download/v2.8.0"
        }
      },
      "rc": null,
      "beta": null
    }
  },
  "3.0.0": {
    "minCompatibleVersion": "2.8.0",
    "description": "Major release v3.0",
    "channels": {
      "latest": {
        "version": "3.0.0",
        "feedUrls": {
          "github": "https://github.com/CherryHQ/cherry-studio/releases/latest",
          "gitcode": "https://gitcode.com/CherryHQ/cherry-studio/releases/latest"
        }
      },
      "rc": {
        "version": "3.0.0-rc.1",
        "feedUrls": {
          "github": "https://github.com/CherryHQ/cherry-studio/releases/download/v3.0.0-rc.1",
          "gitcode": "https://gitcode.com/CherryHQ/cherry-studio/releases/download/v3.0.0-rc.1"
        }
      },
      "beta": null
    }
  }
}
```

### 字段说明

- `lastUpdated`: 配置文件最后更新时间（ISO 8601 格式）
- `versions`: 版本配置对象，key 为版本号，按语义化版本排序
  - `minCompatibleVersion`: 可以升级到此版本的最低兼容版本
  - `description`: 版本描述
  - `channels`: 更新渠道配置
    - `latest`: 稳定版渠道
    - `rc`: Release Candidate 渠道
    - `beta`: Beta 测试渠道
    - 每个渠道包含：
      - `version`: 该渠道的版本号
      - `feedUrls`: 多镜像源 URL 配置
        - `github`: GitHub 镜像源的 electron-updater feed URL
        - `gitcode`: GitCode 镜像源的 electron-updater feed URL

## TypeScript 类型定义

```typescript
// 镜像源枚举
enum UpdateMirror {
  GITHUB = 'github',
  GITCODE = 'gitcode'
}

interface UpdateConfig {
  lastUpdated: string
  versions: {
    [versionKey: string]: VersionConfig
  }
}

interface VersionConfig {
  minCompatibleVersion: string
  description: string
  channels: {
    latest: ChannelConfig | null
    rc: ChannelConfig | null
    beta: ChannelConfig | null
  }
}

interface ChannelConfig {
  version: string
  feedUrls: Record<UpdateMirror, string>
  // 等同于:
  // feedUrls: {
  //   github: string
  //   gitcode: string
  // }
}
```

## 版本匹配逻辑

### 算法流程

1. 获取用户当前版本（`currentVersion`）和请求的渠道（`requestedChannel`）
2. 获取配置文件中所有版本号，按语义化版本从大到小排序
3. 遍历排序后的版本列表：
   - 检查 `currentVersion >= minCompatibleVersion`
   - 检查请求的 `channel` 是否存在且不为 `null`
   - 如果满足条件，返回该渠道配置
4. 如果没有找到匹配版本，返回 `null`

### 伪代码实现

```typescript
function findCompatibleVersion(
  currentVersion: string,
  requestedChannel: UpgradeChannel,
  config: UpdateConfig
): ChannelConfig | null {
  // 获取所有版本号并从大到小排序
  const versions = Object.keys(config.versions).sort(semver.rcompare)

  for (const versionKey of versions) {
    const versionConfig = config.versions[versionKey]
    const channelConfig = versionConfig.channels[requestedChannel]

    // 检查版本兼容性和渠道可用性
    if (
      semver.gte(currentVersion, versionConfig.minCompatibleVersion) &&
      channelConfig !== null
    ) {
      return channelConfig
    }
  }

  return null // 没有找到兼容版本
}
```

## 升级路径示例

### 场景 1: v1.6.5 用户升级（低于 1.7）

- **当前版本**: 1.6.5
- **请求渠道**: latest
- **匹配结果**: 1.7.0
- **原因**: 1.6.5 >= 0.0.0（满足 1.7.0 的 minCompatibleVersion），但不满足 2.0.0 的 minCompatibleVersion (1.7.0)
- **操作**: 提示用户升级到 1.7.0，这是升级到 v2.x 的必要中间版本

### 场景 2: v1.6.5 用户请求 rc/beta

- **当前版本**: 1.6.5
- **请求渠道**: rc 或 beta
- **匹配结果**: 1.7.0 (latest)
- **原因**: 1.7.0 版本不提供 rc/beta 渠道（值为 null）
- **操作**: 升级到 1.7.0 稳定版

### 场景 3: v1.7.0 用户升级到最新版

- **当前版本**: 1.7.0
- **请求渠道**: latest
- **匹配结果**: 2.0.0
- **原因**: 1.7.0 >= 1.7.0（满足 2.0.0 的 minCompatibleVersion）
- **操作**: 直接升级到 2.0.0（当前最新稳定版）

### 场景 4: v1.7.2 用户升级到 RC 版本

- **当前版本**: 1.7.2
- **请求渠道**: rc
- **匹配结果**: 2.0.0-rc.1
- **原因**: 1.7.2 >= 1.7.0（满足 2.0.0 的 minCompatibleVersion），且 rc 渠道存在
- **操作**: 升级到 2.0.0-rc.1

### 场景 5: v1.7.0 用户升级到 Beta 版本

- **当前版本**: 1.7.0
- **请求渠道**: beta
- **匹配结果**: 2.0.0-beta.1
- **原因**: 1.7.0 >= 1.7.0，且 beta 渠道存在
- **操作**: 升级到 2.0.0-beta.1

### 场景 6: v2.5.0 用户升级（未来）

假设已添加 v2.8.0 和 v3.0.0 配置：
- **当前版本**: 2.5.0
- **请求渠道**: latest
- **匹配结果**: 2.8.0
- **原因**: 2.5.0 >= 2.0.0（满足 2.8.0 的 minCompatibleVersion），但不满足 3.0.0 的要求
- **操作**: 提示用户升级到 2.8.0，这是升级到 v3.x 的必要中间版本

## 代码改动计划

### 主要修改

1. **新增方法**
   - `_fetchUpdateConfig(ipCountry: string): Promise<UpdateConfig | null>` - 根据 IP 获取配置文件
   - `_findCompatibleChannel(currentVersion: string, channel: UpgradeChannel, config: UpdateConfig): ChannelConfig | null` - 查找兼容的渠道配置

2. **修改方法**
   - `_getReleaseVersionFromGithub()` → 移除或重构为 `_getChannelFeedUrl()`
   - `_setFeedUrl()` - 使用新的配置系统替代现有逻辑

3. **新增类型定义**
   - `UpdateConfig`
   - `VersionConfig`
   - `ChannelConfig`

### 镜像源选择逻辑

客户端根据 IP 地理位置自动选择最优镜像源：

```typescript
private async _setFeedUrl() {
  const currentVersion = app.getVersion()
  const testPlan = configManager.getTestPlan()
  const requestedChannel = testPlan ? this._getTestChannel() : UpgradeChannel.LATEST

  // 根据 IP 国家确定镜像源
  const ipCountry = await getIpCountry()
  const mirror = ipCountry.toLowerCase() === 'cn' ? 'gitcode' : 'github'

  // 获取更新配置
  const config = await this._fetchUpdateConfig(mirror)

  if (config) {
    const channelConfig = this._findCompatibleChannel(currentVersion, requestedChannel, config)
    if (channelConfig) {
      // 从配置中选择对应镜像源的 URL
      const feedUrl = channelConfig.feedUrls[mirror]
      this._setChannel(requestedChannel, feedUrl)
      return
    }
  }

  // Fallback 逻辑
  const defaultFeedUrl = mirror === 'gitcode'
    ? FeedUrl.PRODUCTION
    : FeedUrl.GITHUB_LATEST
  this._setChannel(UpgradeChannel.LATEST, defaultFeedUrl)
}

private async _fetchUpdateConfig(mirror: 'github' | 'gitcode'): Promise<UpdateConfig | null> {
  const configUrl = mirror === 'gitcode'
    ? UpdateConfigUrl.GITCODE
    : UpdateConfigUrl.GITHUB

  try {
    const response = await net.fetch(configUrl, {
      headers: {
        'User-Agent': generateUserAgent(),
        'Accept': 'application/json',
        'X-Client-Id': configManager.getClientId()
      }
    })
    return await response.json() as UpdateConfig
  } catch (error) {
    logger.error('Failed to fetch update config:', error)
    return null
  }
}
```

## 降级和容错策略

1. **配置文件获取失败**: 记录错误日志，返回当前版本，不提供更新
2. **没有匹配的版本**: 提示用户当前版本不支持自动升级
3. **网络异常**: 缓存上次成功获取的配置（可选）

## GitHub Release 要求

为支持中间版本升级，需要保留以下文件：

- **v1.7.0 release** 及其 latest*.yml 文件（作为 v1.7 以下用户的升级目标）
- 未来如需强制中间版本（如 v2.8.0），需要保留对应的 release 和 latest*.yml 文件
- 各版本的完整安装包

### 当前需要的 Release

| 版本 | 用途 | 必须保留 |
|------|------|---------|
| v1.7.0 | 1.7 以下用户的升级目标 | ✅ 是 |
| v2.0.0-rc.1 | RC 测试渠道 | ❌ 可选 |
| v2.0.0-beta.1 | Beta 测试渠道 | ❌ 可选 |
| latest | 最新稳定版（自动） | ✅ 是 |

## 优势

1. **灵活性**: 支持任意复杂的升级路径
2. **可扩展性**: 新增版本只需在配置文件中添加新条目
3. **可维护性**: 配置与代码分离，无需发版即可调整升级策略
4. **多源支持**: 自动根据地理位置选择最优配置源
5. **版本控制**: 强制中间版本升级，确保数据迁移和兼容性

## 未来扩展

- 支持更细粒度的版本范围控制（如 `>=1.5.0 <1.8.0`）
- 支持多步升级路径提示（如提示用户需要 1.5 → 1.8 → 2.0）
- 支持 A/B 测试和灰度发布
- 支持配置文件的本地缓存和过期策略
