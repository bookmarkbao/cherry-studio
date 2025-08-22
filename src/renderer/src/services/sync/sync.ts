import api, { updateApiBasePath, updateApiToken } from '@renderer/config/api'
import store from '@renderer/store'

import {
  syncAssistantModels,
  syncAssistants,
  syncDefaultModels,
  syncKnowledgeBases,
  syncMcpServers,
  syncMinapps,
  syncPreprocessProvider,
  syncProvider,
  syncSettings,
  syncWebSearchProviders,
  validateServerConfig
} from '.'

export async function syncConfig(): Promise<void> {
  const { accessToken, serverUrl } = store.getState().auth

  if (!accessToken || !serverUrl) {
    return
  }

  // 更新 API 配置
  updateApiToken(accessToken)
  updateApiBasePath(serverUrl)

  // 获取服务器配置
  const { data: configurations } = await api.configurationGetConfigurations()
  validateServerConfig(configurations)

  // 同步服务商
  syncProvider(configurations.providers)

  // 同步默认模型
  syncDefaultModels(configurations)

  // 同步助手
  syncAssistantModels(configurations.models)

  // 同步助手
  syncAssistants(configurations.assistants)

  // 同步知识库
  syncKnowledgeBases(configurations.knowledgeBases)

  // 同步 MCP 服务器
  syncMcpServers(configurations.mcpServers)

  // 同步设置
  syncSettings(configurations.settings)

  // 同步网络搜索提供商
  syncWebSearchProviders(configurations.settings)

  // 同步预处理提供商
  syncPreprocessProvider(configurations.settings)

  // 同步小程序
  if (configurations.minApps) {
    syncMinapps(configurations.minApps)
  }
}
