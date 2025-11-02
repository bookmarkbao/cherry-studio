import type { QuickPanelListItem, QuickPanelReservedSymbol } from '@renderer/components/QuickPanel'
import type { FileType, KnowledgeBase, Model } from '@renderer/types'
import { FileTypes } from '@renderer/types'
import React, { createContext, use, useCallback, useEffect, useMemo, useRef, useState } from 'react'

type QuickPanelTriggerHandler = (payload?: unknown) => void

// ============================================================================
// State Context (只读状态，会频繁变化)
// ============================================================================

export interface InputbarToolsState {
  // 核心状态
  files: FileType[]
  mentionedModels: Model[]
  selectedKnowledgeBases: KnowledgeBase[]
  isExpanded: boolean

  // 派生状态（基于核心状态计算得出）
  couldAddImageFile: boolean
  couldMentionNotVisionModel: boolean
  extensions: string[]
}

// ============================================================================
// Dispatch Context (操作函数，永远不变)
// ============================================================================

export interface InputbarToolsDispatch {
  // State setters
  setFiles: React.Dispatch<React.SetStateAction<FileType[]>>
  setMentionedModels: React.Dispatch<React.SetStateAction<Model[]>>
  setSelectedKnowledgeBases: React.Dispatch<React.SetStateAction<KnowledgeBase[]>>
  setIsExpanded: React.Dispatch<React.SetStateAction<boolean>>

  // Parent actions (来自 Inputbar 组件)
  resizeTextArea: () => void
  addNewTopic: () => void
  clearTopic: () => void
  onNewContext: () => void

  // Quick Panel API
  quickPanel: {
    getQuickPanelRootMenu: () => QuickPanelListItem[]
    registerRootMenu: (toolKey: string, entries: QuickPanelListItem[]) => () => void
    registerTrigger: (
      toolKey: string,
      symbol: QuickPanelReservedSymbol,
      handler: QuickPanelTriggerHandler
    ) => () => void
    emitTrigger: (symbol: QuickPanelReservedSymbol, payload?: unknown) => void
  }
}

// ============================================================================
// Context 创建
// ============================================================================

const InputbarToolsStateContext = createContext<InputbarToolsState | undefined>(undefined)
const InputbarToolsDispatchContext = createContext<InputbarToolsDispatch | undefined>(undefined)

// ============================================================================
// Hooks
// ============================================================================

/**
 * 获取 Inputbar Tools 的状态（只读）
 * 注意：订阅此 hook 的组件会在状态变化时重新渲染
 */
export const useInputbarToolsState = (): InputbarToolsState => {
  const context = use(InputbarToolsStateContext)
  if (!context) {
    throw new Error('useInputbarToolsState must be used within InputbarToolsProvider')
  }
  return context
}

/**
 * 获取 Inputbar Tools 的 dispatch 函数（永远不变）
 * 订阅此 hook 的组件不会因为状态变化而重新渲染
 */
export const useInputbarToolsDispatch = (): InputbarToolsDispatch => {
  const context = use(InputbarToolsDispatchContext)
  if (!context) {
    throw new Error('useInputbarToolsDispatch must be used within InputbarToolsProvider')
  }
  return context
}

/**
 * 同时获取 state 和 dispatch（便捷 hook）
 * 注意：会订阅状态变化
 */
export const useInputbarTools = (): InputbarToolsState & InputbarToolsDispatch => {
  const state = useInputbarToolsState()
  const dispatch = useInputbarToolsDispatch()
  return { ...state, ...dispatch }
}

// ============================================================================
// Provider Props
// ============================================================================

interface InputbarToolsProviderProps {
  children: React.ReactNode
  initialState?: Partial<{
    files: FileType[]
    mentionedModels: Model[]
    selectedKnowledgeBases: KnowledgeBase[]
    isExpanded: boolean
    couldAddImageFile: boolean
    extensions: string[]
  }>
  actions: {
    resizeTextArea: () => void
    addNewTopic: () => void
    clearTopic: () => void
    onNewContext: () => void
  }
}

// ============================================================================
// Provider 实现
// ============================================================================

export const InputbarToolsProvider: React.FC<InputbarToolsProviderProps> = ({ children, initialState, actions }) => {
  // --------------------------------------------------------------------------
  // 核心状态
  // --------------------------------------------------------------------------
  const [files, setFiles] = useState<FileType[]>(initialState?.files || [])
  const [mentionedModels, setMentionedModels] = useState<Model[]>(initialState?.mentionedModels || [])
  const [selectedKnowledgeBases, setSelectedKnowledgeBases] = useState<KnowledgeBase[]>(
    initialState?.selectedKnowledgeBases || []
  )
  const [isExpanded, setIsExpanded] = useState(initialState?.isExpanded || false)

  // --------------------------------------------------------------------------
  // 派生状态（内部管理）
  // --------------------------------------------------------------------------
  const [couldAddImageFile, setCouldAddImageFile] = useState(initialState?.couldAddImageFile || false)
  const [extensions, setExtensions] = useState<string[]>(initialState?.extensions || [])

  const couldMentionNotVisionModel = !files.some((file) => file.type === FileTypes.IMAGE)

  // --------------------------------------------------------------------------
  // Quick Panel Registry (使用 ref 存储，不触发重新渲染)
  // --------------------------------------------------------------------------
  const rootMenuRegistryRef = useRef(new Map<string, QuickPanelListItem[]>())
  const triggerRegistryRef = useRef(new Map<QuickPanelReservedSymbol, Map<string, QuickPanelTriggerHandler>>())

  // --------------------------------------------------------------------------
  // Quick Panel API (创建一次，永远不变)
  // --------------------------------------------------------------------------
  const getQuickPanelRootMenu = useCallback(() => {
    const allEntries: QuickPanelListItem[] = []
    rootMenuRegistryRef.current.forEach((entries) => {
      allEntries.push(...entries)
    })
    return allEntries
  }, [])

  const registerRootMenu = useCallback((toolKey: string, entries: QuickPanelListItem[]) => {
    rootMenuRegistryRef.current.set(toolKey, entries)
    return () => {
      rootMenuRegistryRef.current.delete(toolKey)
    }
  }, [])

  const registerTrigger = useCallback(
    (toolKey: string, symbol: QuickPanelReservedSymbol, handler: QuickPanelTriggerHandler) => {
      if (!triggerRegistryRef.current.has(symbol)) {
        triggerRegistryRef.current.set(symbol, new Map())
      }

      const handlers = triggerRegistryRef.current.get(symbol)!
      handlers.set(toolKey, handler)

      return () => {
        const currentHandlers = triggerRegistryRef.current.get(symbol)
        if (!currentHandlers) return

        currentHandlers.delete(toolKey)
        if (currentHandlers.size === 0) {
          triggerRegistryRef.current.delete(symbol)
        }
      }
    },
    []
  )

  const emitTrigger = useCallback((symbol: QuickPanelReservedSymbol, payload?: unknown) => {
    const handlers = triggerRegistryRef.current.get(symbol)
    handlers?.forEach((handler) => {
      handler?.(payload)
    })
  }, [])

  // --------------------------------------------------------------------------
  // 稳定化 actions (避免父组件 actions 引用变化导致 dispatch context 更新)
  // --------------------------------------------------------------------------
  const actionsRef = useRef(actions)
  useEffect(() => {
    actionsRef.current = actions
  }, [actions])

  const stableActions = useMemo(
    () => ({
      resizeTextArea: () => actionsRef.current.resizeTextArea(),
      addNewTopic: () => actionsRef.current.addNewTopic(),
      clearTopic: () => actionsRef.current.clearTopic(),
      onNewContext: () => actionsRef.current.onNewContext()
    }),
    []
  )

  // --------------------------------------------------------------------------
  // State Context Value (会随状态变化而变化)
  // --------------------------------------------------------------------------
  const stateValue = useMemo<InputbarToolsState>(
    () => ({
      files,
      mentionedModels,
      selectedKnowledgeBases,
      isExpanded,
      couldAddImageFile,
      couldMentionNotVisionModel,
      extensions
    }),
    [
      files,
      mentionedModels,
      selectedKnowledgeBases,
      isExpanded,
      couldAddImageFile,
      couldMentionNotVisionModel,
      extensions
    ]
  )

  // --------------------------------------------------------------------------
  // Quick Panel API (永远不变，因为所有函数都是稳定的)
  // --------------------------------------------------------------------------
  const quickPanelAPI = useMemo(
    () => ({
      getQuickPanelRootMenu,
      registerRootMenu,
      registerTrigger,
      emitTrigger
    }),
    [getQuickPanelRootMenu, registerRootMenu, registerTrigger, emitTrigger]
  )

  // --------------------------------------------------------------------------
  // Dispatch Context Value (创建一次，永远不变)
  // --------------------------------------------------------------------------
  const dispatchValue = useMemo<InputbarToolsDispatch>(
    () => ({
      // State setters (React 保证这些函数引用永远不变)
      setFiles,
      setMentionedModels,
      setSelectedKnowledgeBases,
      setIsExpanded,

      // Stable actions
      ...stableActions,

      // Quick Panel API
      quickPanel: quickPanelAPI
    }),
    [stableActions, quickPanelAPI]
  )

  // --------------------------------------------------------------------------
  // 内部 Dispatch (包含 setCouldAddImageFile 和 setExtensions)
  // --------------------------------------------------------------------------
  // 这些 setter 需要暴露给 Inputbar，但不需要暴露给工具按钮
  // 为了避免污染主 dispatch context，使用单独的 internal context
  const internalDispatchValue = useMemo(
    () => ({
      setCouldAddImageFile,
      setExtensions
    }),
    []
  )

  return (
    <InputbarToolsStateContext value={stateValue}>
      <InputbarToolsDispatchContext value={dispatchValue}>
        <InputbarToolsInternalDispatchContext value={internalDispatchValue}>
          {children}
        </InputbarToolsInternalDispatchContext>
      </InputbarToolsDispatchContext>
    </InputbarToolsStateContext>
  )
}

// ============================================================================
// Internal Dispatch Context (仅供 Inputbar 组件使用)
// ============================================================================

interface InputbarToolsInternalDispatch {
  setCouldAddImageFile: React.Dispatch<React.SetStateAction<boolean>>
  setExtensions: React.Dispatch<React.SetStateAction<string[]>>
}

const InputbarToolsInternalDispatchContext = createContext<InputbarToolsInternalDispatch | undefined>(undefined)

/**
 * 内部 hook，仅供 Inputbar 组件使用
 * 用于设置派生状态 (couldAddImageFile, extensions)
 */
export const useInputbarToolsInternalDispatch = (): InputbarToolsInternalDispatch => {
  const context = use(InputbarToolsInternalDispatchContext)
  if (!context) {
    throw new Error('useInputbarToolsInternalDispatch must be used within InputbarToolsProvider')
  }
  return context
}
