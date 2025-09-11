import { Assistant as ServerAssistant, KnowledgeBase, KnowledgeBaseItem, Model, Provider } from '@cherrystudio/api-sdk'
import {
  Assistant,
  AssistantSettingCustomParameters,
  EndpointType,
  KnowledgeBase as KnowledgeBaseType,
  KnowledgeItem as KnowledgeItemType,
  MCPServer,
  Model as ModelType,
  Provider as ClientProvider,
  ProviderType
} from '@renderer/types'
import { getDefaultGroupName } from '@renderer/utils/naming'
import dayjs from 'dayjs'
import { omit } from 'lodash'

import { getDefaultTopic } from '../AssistantService'

function formatCustomParameters(customParameters?: object | null): AssistantSettingCustomParameters[] {
  if (!customParameters || typeof customParameters !== 'object') {
    return []
  }

  return Object.entries(customParameters).map(([name, value]) => {
    let type: 'string' | 'number' | 'boolean' | 'json'

    if (typeof value === 'string') {
      type = 'string'
    } else if (typeof value === 'number') {
      type = 'number'
    } else if (typeof value === 'boolean') {
      type = 'boolean'
    } else {
      type = 'json'
    }

    return {
      name,
      value,
      type
    }
  })
}

export function formatProvider(provider: Provider): ClientProvider {
  let type = provider.type as ProviderType

  if (['cherryin', 'x-express-internal', 'x-express-opensource'].includes(provider.provider_id)) {
    type = 'new-api'
  }

  return {
    id: provider.provider_id,
    type,
    name: provider.name,
    apiKey: provider.apiKey,
    apiHost: provider.apiHost,
    apiVersion: provider.apiVersion,
    models: provider.models
      .map((model) => ({ ...model, provider: omit(provider, ['models']) as Provider }))
      .map(formatModel),
    enabled: true,
    isSystem: provider.isSystem
  }
}

export function formatModel(model: Model): ModelType {
  const modelData: ModelType = {
    id: model.model_id,
    provider: model.provider.provider_id,
    name: model.name,
    owned_by: model.provider.provider_id,
    group: getDefaultGroupName(model.model_id)
  }

  if (model.supported_endpoint_types) {
    modelData.supported_endpoint_types = model.supported_endpoint_types as EndpointType[]
    modelData.endpoint_type = model.supported_endpoint_types[0] as EndpointType
  }

  return modelData
}

export function formatKnowledgeBase(knowledgeBase: KnowledgeBase): KnowledgeBaseType {
  return {
    id: knowledgeBase.id.toString(),
    isServer: true,
    name: knowledgeBase.name,
    description: knowledgeBase.description || undefined,
    model: formatModel(knowledgeBase.model),
    dimensions: knowledgeBase.dimensions ?? undefined,
    documentCount: knowledgeBase.document_count || undefined,
    chunkSize: knowledgeBase.chunk_size || undefined,
    chunkOverlap: knowledgeBase.chunk_overlap || undefined,
    threshold: knowledgeBase.threshold || undefined,
    rerankModel: knowledgeBase.rerank_model ? formatModel(knowledgeBase.rerank_model) : undefined,
    created_at: Number(knowledgeBase.created_at),
    updated_at: Number(knowledgeBase.updated_at),
    version: 1,
    items: (knowledgeBase.items || []).map(formatKnowledgeBaseItem)
  }
}

export function formatKnowledgeBaseItem(knowledgeBaseItem: KnowledgeBaseItem): KnowledgeItemType {
  return {
    id: knowledgeBaseItem.id.toString(),
    baseId: knowledgeBaseItem.knowledgeBase.id.toString(),
    uniqueId: knowledgeBaseItem.unique_id,
    uniqueIds: knowledgeBaseItem.unique_ids,
    type: knowledgeBaseItem.type,
    content: knowledgeBaseItem.file || knowledgeBaseItem.content,
    remark: knowledgeBaseItem.remark,
    created_at: dayjs(knowledgeBaseItem.created_at).unix() * 1000,
    updated_at: dayjs(knowledgeBaseItem.updated_at).unix() * 1000,
    processingStatus: knowledgeBaseItem.processing_status,
    processingProgress: knowledgeBaseItem.processing_progress,
    processingError: knowledgeBaseItem.processing_error,
    retryCount: knowledgeBaseItem.retry_count
  }
}

function formatMcpServers(mcpServers: object): MCPServer[] {
  return Object.keys(mcpServers).map((key) => {
    const mcpServer = mcpServers[key]
    return {
      id: key,
      ...mcpServer
    }
  })
}

// name(pin):"@cherry/python"
// type(pin):"inMemory"
// description(pin):"在安全的沙盒环境中执行 Python 代码。使用 Pyodide 运行 Python，支持大多数标准库和科学计算包"
// isActive(pin):true
// provider(pin):"CherryAI"
// id(pin):"kndZRfd-QvJ2vbAlA-RGm"

export function formatAssistant(assistant: ServerAssistant): Assistant {
  const assistantId = 'server_' + String(assistant.id)
  return {
    id: assistantId,
    isServer: true,
    name: assistant.name,
    prompt: assistant.prompt,
    emoji: assistant.emoji,
    type: 'assistant',
    topics: [getDefaultTopic(assistantId)],
    messages: [],
    knowledge_bases: assistant.knowledge_bases?.map(formatKnowledgeBase) || [],
    model: assistant.model ? formatModel(assistant.model) : undefined,
    mcpServers: formatMcpServers(assistant.mcpServers || []),
    settings: {
      temperature: assistant.temperature,
      contextCount: assistant.contextCount,
      enableTopP: assistant.enableTopP,
      topP: assistant.topP,
      maxTokens: assistant.maxTokens || 0,
      enableMaxTokens: assistant.enableMaxTokens,
      streamOutput: assistant.streamOutput,
      toolUseMode: assistant.toolUseMode || 'function',
      customParameters: formatCustomParameters(assistant.customParameters),
      promptVisible: assistant.promptVisible
    }
  }
}
