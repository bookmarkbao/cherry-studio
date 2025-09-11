import {
  Assistant as ServerAssistant,
  ConfigurationResponseDtoMcpServersInner,
  KnowledgeBase,
  Provider,
  ServerModel,
  Setting
} from '@cherrystudio/api-sdk'
import { loggerService } from '@logger'
import { DEFAULT_MIN_APPS } from '@renderer/config/minapps'
import store from '@renderer/store'
import { addAssistant, updateAssistant } from '@renderer/store/assistants'
import { setSyncInterval } from '@renderer/store/auth'
import { updateBases } from '@renderer/store/knowledge'
import { setDefaultModel, setQuickModel, setTranslateModel, updateProviders } from '@renderer/store/llm'
import { setMCPServers } from '@renderer/store/mcp'
import { setDisabledMinApps, setMinApps, setPinnedMinApps } from '@renderer/store/minapps'
import { setDefaultPreprocessProvider, updatePreprocessProvider } from '@renderer/store/preprocess'
import { setProxyMode, setProxyUrl } from '@renderer/store/settings'
import { setDefaultProvider, setWebSearchProviders } from '@renderer/store/websearch'
import { Assistant, KnowledgeBase as KnowledgeBaseType, MCPServer, MinAppType, Model } from '@renderer/types'
import { getDefaultGroupName } from '@renderer/utils'
import { isEmpty, isEqual } from 'lodash'

import { formatAssistant, formatKnowledgeBase, formatProvider } from './format'
import { ServerConfiguration, ServerMinApp, SyncMinAppsResult } from './types'
import { getSettingValue } from './utils'

const logger = loggerService.withContext('Sync')

// 验证服务器配置
export function validateServerConfig(config: ServerConfiguration): void {
  if (!config.apiKey) {
    throw new Error('请联系管理员配置 API 密钥')
  }

  if (isEmpty(config.models)) {
    throw new Error('服务端未配置模型')
  }
}

export function convertServerModel(serverModel: ServerModel): Model {
  return {
    id: serverModel.id,
    name: serverModel.name,
    group: getDefaultGroupName(serverModel.id || serverModel.name),
    owned_by: serverModel.owned_by,
    provider: serverModel.provider
  }
}

// 同步模型配置
export function syncProvider(serverProviders: Provider[]): void {
  store.dispatch(updateProviders(serverProviders.map(formatProvider)))
}

// 同步默认模型设置
export function syncDefaultModels(config: ServerConfiguration): void {
  const dispatch = store.dispatch
  const { defaultModel, topicNamingModel, translateModel } = store.getState().llm

  const serverDefaultModel = config.models[0]
  const defaultAssistantModel = config.defaultAssistantModel || serverDefaultModel
  const defaultQuickModel = config.defaultTopicNamingModel || serverDefaultModel
  const defaultTranslationModel = config.defaultTranslationModel || serverDefaultModel

  if (!isEqual(defaultModel, defaultAssistantModel)) {
    dispatch(setDefaultModel({ model: convertServerModel(defaultAssistantModel) }))
  }

  if (!isEqual(topicNamingModel, defaultQuickModel)) {
    dispatch(setQuickModel({ model: convertServerModel(defaultQuickModel) }))
  }

  if (!isEqual(translateModel, defaultTranslationModel)) {
    dispatch(setTranslateModel({ model: convertServerModel(defaultTranslationModel) }))
  }
}

// 同步助手配置
export function syncAssistantModels(serverModels: ServerModel[]): void {
  const dispatch = store.dispatch
  const assistants = store.getState().assistants.assistants

  for (const assistant of assistants) {
    const assistantModel = assistant.model
    if (assistantModel) {
      const serverModel = serverModels.find((m) => m.id === assistantModel.id)
      // 如果服务端没有这个模型，则删除助手模型
      if (!serverModel) {
        dispatch(updateAssistant({ ...assistant, model: undefined }))
      }
      // 如果服务端有这个模型，但是助手模型没有服务器提供商，则更新助手模型
      if (serverModel && !assistantModel.provider) {
        dispatch(updateAssistant({ ...assistant, model: convertServerModel(serverModel) }))
      }
    }
  }
}

// 格式化小程序配置
export function formatMinApp(minApp: ServerMinApp): MinAppType {
  const serverUrl = store.getState().auth.serverUrl
  return {
    id: 'id_' + minApp.id,
    name: minApp.name,
    url: minApp.url || '',
    bodered: minApp.bodered || false,
    background: minApp.background || '',
    logo: minApp.logo ? serverUrl + minApp.logo : undefined,
    isServer: true
  }
}

// 处理系统小程序
export function processSystemApps(minApps: ServerMinApp[]): MinAppType[] {
  return minApps
    .filter((minApp) => minApp.isSystem && minApp.enabled)
    .map((minApp) => {
      const app = DEFAULT_MIN_APPS.find((app) => app.id === minApp.app_id)
      return app || null
    })
    .filter((app): app is MinAppType => app !== null)
}

// 处理非系统小程序
export function processNonSystemApps(minApps: ServerMinApp[]): MinAppType[] {
  return minApps.filter((minApp) => !minApp.isSystem).map(formatMinApp)
}

// 小程序同步函数
export async function syncMinapps(minApps: ServerMinApp[]): Promise<SyncMinAppsResult> {
  const dispatch = store.dispatch
  const { enabled, disabled, pinned } = store.getState().minapps

  // 构建服务端应用列表
  const systemApps = processSystemApps(minApps)
  const nonSystemApps = processNonSystemApps(minApps)
  const serverApps = [...systemApps, ...nonSystemApps]

  // 获取服务端应用 ID 和映射
  const serverAppIds = new Set(serverApps.map((app) => app.id))
  const serverAppMap = new Map(serverApps.map((app) => [app.id, app]))

  // 更新已启用列表
  const newEnabled = enabled
    .filter((app) => {
      if (app.type === 'Custom') return true
      return serverAppIds.has(app.id) && !disabled.some((disabledApp) => disabledApp.id === app.id)
    })
    .map((app) => {
      if (app.type === 'Custom' || !serverAppIds.has(app.id)) return app
      return serverAppMap.get(app.id) || app
    })

  // 添加新的服务端应用
  const newServerApps = serverApps.filter(
    (serverApp) => !enabled.some((app) => app.id === serverApp.id) && !disabled.some((app) => app.id === serverApp.id)
  )
  newEnabled.push(...newServerApps)

  // 更新已禁用列表
  const newDisabled = disabled
    .map((app) => {
      if (app.type === 'Custom') return app
      const serverMinApp = minApps.find((minApp) =>
        minApp.isSystem ? app.id === minApp.app_id : app.id === 'id_' + minApp.id
      )
      if (serverMinApp) {
        if (serverMinApp.isSystem) {
          const systemApp = DEFAULT_MIN_APPS.find((sApp) => sApp.id === serverMinApp.app_id)
          return systemApp || app
        }
        return {
          ...formatMinApp(serverMinApp),
          type: app.type
        }
      }
      return app
    })
    .filter((app) => {
      if (app.type === 'Custom') return true
      return serverAppIds.has(app.id)
    })

  // 更新固定列表
  const newPinned = pinned
    .filter((app) => {
      if (app.type === 'Custom') return true
      return serverAppIds.has(app.id)
    })
    .map((app) => {
      if (app.type === 'Custom' || !serverAppIds.has(app.id)) return app
      return serverAppMap.get(app.id) || app
    })

  // 更新状态
  dispatch(setMinApps(newEnabled))
  dispatch(setDisabledMinApps(newDisabled))
  dispatch(setPinnedMinApps(newPinned))

  return { enabled: newEnabled, disabled: newDisabled }
}

// MCP 服务器同步函数
export async function syncMcpServers(mcpServers: ConfigurationResponseDtoMcpServersInner[] = []): Promise<void> {
  const currentMcpServers = store.getState().mcp.servers.filter((mcpServer) => mcpServer.isServer)
  const serverMcpServers = mcpServers.map((mcpServer) => ({ ...mcpServer, isServer: true })) as MCPServer[]
  const userMcpServers = store.getState().mcp.servers.filter((mcpServer) => !mcpServer.isServer)

  if (isEqual(currentMcpServers, serverMcpServers)) {
    return
  }

  store.dispatch(setMCPServers([...userMcpServers, ...serverMcpServers]))
}

export function syncAssistants(_assistants: ServerAssistant[]): void {
  const dispatch = store.dispatch
  const assistants = store.getState().assistants.assistants
  const serverAssistants: Assistant[] = _assistants.map(formatAssistant)

  // 遍历服务端助手列表进行同步
  for (const serverAssistant of serverAssistants) {
    const existingAssistant = assistants.find((a) => a.id === serverAssistant.id)

    if (existingAssistant) {
      // 如果存在，则更新除了 topics 和 messages 之外的所有字段
      const updatedAssistant = {
        ...serverAssistant,
        tags: existingAssistant.tags,
        topics: existingAssistant.topics,
        messages: existingAssistant.messages,
        webSearchProviderId: existingAssistant.webSearchProviderId,
        enableWebSearch: existingAssistant.enableWebSearch
      }

      dispatch(updateAssistant(updatedAssistant))
    } else {
      // 如果不存在，则直接添加新的助手
      dispatch(addAssistant(serverAssistant))
    }
  }

  // 获取当前助手和服务端助手列表差异
  assistants.forEach((a) => {
    if (a.isServer && !serverAssistants.find((s) => s.id === a.id)) {
      dispatch(updateAssistant({ ...a, isServer: false }))
    }
  })
}

export function syncKnowledgeBases(knowledgeBases: KnowledgeBase[]): void {
  const dispatch = store.dispatch
  const storeKnowledgeBases = store.getState().knowledge.bases.filter((base) => !base.isServer)
  const serverKnowledgeBases: KnowledgeBaseType[] = knowledgeBases.map(formatKnowledgeBase)
  dispatch(updateBases([...serverKnowledgeBases, ...storeKnowledgeBases]))
}

export function syncSettings(settings: Setting[]): void {
  const dispatch = store.dispatch
  try {
    const syncIntervalSetting = settings.find((s) => s.key === 'sync_interval')
    const syncIntervalMinutes = syncIntervalSetting?.value ? parseFloat(syncIntervalSetting.value) : 10 // Minutes
    const syncIntervalSeconds = syncIntervalMinutes * 60
    if (syncIntervalSeconds !== store.getState().auth?.syncInterval) {
      dispatch(setSyncInterval(syncIntervalSeconds))
    }

    // 同步代理设置
    const httpProxySetting = settings.find((s) => s.key === 'http_proxy')
    const webviewProxySetting = settings.find((s) => s.key === 'webview_proxy')

    // 同步 webview 代理设置
    if (webviewProxySetting && webviewProxySetting.value) {
      window.api.setProxyForWebview(webviewProxySetting.value)
    }

    if (httpProxySetting) {
      if (httpProxySetting.value?.includes('://')) {
        dispatch(setProxyMode('custom'))
        dispatch(setProxyUrl(httpProxySetting.value))
      }
      if (httpProxySetting.value === 'http://reset-system') {
        dispatch(setProxyMode('system'))
      }
      if (httpProxySetting.value === 'http://reset-none') {
        dispatch(setProxyMode('none'))
      }
    }
  } catch (error) {
    dispatch(setSyncInterval(60 * 10)) // 10 minutes
    logger.error('同步设置失败:', error as Error)
  }
}

export async function syncWebSearchProviders(settings: Setting[]): Promise<void> {
  try {
    const { providers } = store.getState().websearch
    // 创建一个深拷贝以避免直接修改状态
    const webSearchProviders = JSON.parse(JSON.stringify(providers))

    // 从设置中获取所有相关配置
    const defaultWebSearchProvider = getSettingValue(settings, 'default_web_search_provider')
    const zhipuApiKey = getSettingValue(settings, 'zhipu_api_key')
    const zhipuApiHost = getSettingValue(settings, 'zhipu_api_host')
    const tavilyApiKey = getSettingValue(settings, 'tavily_api_key')
    const tavilyApiHost = getSettingValue(settings, 'tavily_api_host')
    const searxngApiHost = getSettingValue(settings, 'searxng_api_host')
    const searxngApiKey = getSettingValue(settings, 'searxng_api_key')
    const searxngUser = getSettingValue(settings, 'searxng_user')
    const exaApiKey = getSettingValue(settings, 'exa_api_key')
    const exaApiHost = getSettingValue(settings, 'exa_api_host')
    const bochaApiKey = getSettingValue(settings, 'bocha_api_key')
    const bochaApiHost = getSettingValue(settings, 'bocha_api_host')

    const updatedProviders = webSearchProviders.map((provider) => {
      switch (provider.id) {
        case 'zhipu':
          if (zhipuApiKey) provider.apiKey = zhipuApiKey === ' ' ? '' : zhipuApiKey
          if (zhipuApiHost) provider.apiHost = zhipuApiHost
          break
        case 'tavily':
          if (tavilyApiKey) provider.apiKey = tavilyApiKey === ' ' ? '' : tavilyApiKey
          if (tavilyApiHost) provider.apiHost = tavilyApiHost
          break
        case 'searxng':
          if (searxngApiKey) provider.basicAuthPassword = searxngApiKey === ' ' ? '' : searxngApiKey
          if (searxngUser) provider.basicAuthUsername = searxngUser === ' ' ? '' : searxngUser
          if (searxngApiHost) provider.apiHost = searxngApiHost
          break
        case 'exa':
          if (exaApiKey) provider.apiKey = exaApiKey === ' ' ? '' : exaApiKey
          if (exaApiHost) provider.apiHost = exaApiHost
          break
        case 'bocha':
          if (bochaApiKey) provider.apiKey = bochaApiKey === ' ' ? '' : bochaApiKey
          if (bochaApiHost) provider.apiHost = bochaApiHost
          break
      }
      return provider
    })

    store.dispatch(setWebSearchProviders(updatedProviders))

    if (defaultWebSearchProvider) {
      store.dispatch(setDefaultProvider(defaultWebSearchProvider))
    }

    logger.info('Web search providers synced successfully.')
  } catch (error) {
    logger.error('同步网络搜索提供商失败:', error as Error)
  }
}

export function syncPreprocessProvider(settings: Setting[]): void {
  const dispatch = store.dispatch

  const defaultPreprocessProvider = getSettingValue(settings, 'doc_preprocessing_provider')
  const mineruApiHost = getSettingValue(settings, 'mineru_api_host')
  const mineruApiKey = getSettingValue(settings, 'mineru_api_key')
  const doc2xApiHost = getSettingValue(settings, 'doc2x_api_host')
  const doc2xApiKey = getSettingValue(settings, 'doc2x_api_key')
  const mistralApiHost = getSettingValue(settings, 'mistral_api_host')
  const mistralApiKey = getSettingValue(settings, 'mistral_api_key')

  const preprocessProviders = ['mineru', 'doc2x', 'mistral']
  const defaultPreprocessProviderId = defaultPreprocessProvider

  if (defaultPreprocessProviderId && preprocessProviders.includes(defaultPreprocessProviderId)) {
    dispatch(setDefaultPreprocessProvider(defaultPreprocessProviderId))
  }

  if (mineruApiHost || mineruApiKey) {
    dispatch(
      updatePreprocessProvider({
        id: 'mineru',
        apiHost: mineruApiHost || 'https://mineru.net',
        apiKey: mineruApiKey === ' ' ? '' : mineruApiKey
      })
    )
  }
  if (doc2xApiHost || doc2xApiKey) {
    dispatch(
      updatePreprocessProvider({
        id: 'doc2x',
        apiHost: doc2xApiHost || 'https://v2.doc2x.noedgeai.com',
        apiKey: doc2xApiKey === ' ' ? '' : doc2xApiKey
      })
    )
  }
  if (mistralApiHost || mistralApiKey) {
    dispatch(
      updatePreprocessProvider({
        id: 'mistral',
        apiHost: mistralApiHost || 'https://api.mistral.ai',
        apiKey: mistralApiKey === ' ' ? '' : mistralApiKey
      })
    )
  }
}
