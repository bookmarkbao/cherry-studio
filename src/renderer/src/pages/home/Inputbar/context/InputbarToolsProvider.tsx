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

/**
 * 工具注册中心 API
 * 供工具按钮使用，用于注册菜单项和触发器
 */
export interface ToolsRegistryAPI {
  /**
   * 注册工具到根菜单（`/` 触发的菜单）
   * @param toolKey 工具唯一标识
   * @param entries 菜单项列表
   * @returns 取消注册的函数
   */
  registerRootMenu: (toolKey: string, entries: QuickPanelListItem[]) => () => void

  /**
   * 注册触发器处理函数
   * @param toolKey 工具唯一标识
   * @param symbol 触发符号（如 @, #, / 等）
   * @param handler 触发时执行的处理函数
   * @returns 取消注册的函数
   */
  registerTrigger: (toolKey: string, symbol: QuickPanelReservedSymbol, handler: QuickPanelTriggerHandler) => () => void
}

/**
 * 触发器 API
 * 供 Inputbar 使用，用于触发面板和获取菜单项
 */
export interface TriggersAPI {
  /**
   * 触发指定符号的面板
   * @param symbol 触发符号
   * @param payload 传递给触发器的数据
   */
  emit: (symbol: QuickPanelReservedSymbol, payload?: unknown) => void

  /**
   * 获取根菜单的所有菜单项（合并所有工具注册的菜单项）
   * @returns 合并后的菜单项列表
   */
  getRootMenu: () => QuickPanelListItem[]
}

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

  // ✅ 工具注册中心 (供工具按钮使用)
  toolsRegistry: ToolsRegistryAPI

  // ✅ 触发器 API (供 Inputbar 使用)
  triggers: TriggersAPI
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
 * 组合类型，包含所有 state 和 dispatch
 * 用于工具按钮的 context 类型推断
 */
export type InputbarToolsContextValue = InputbarToolsState & InputbarToolsDispatch

/**
 * 同时获取 state 和 dispatch（便捷 hook）
 * 注意：会订阅状态变化
 */
export const useInputbarTools = (): InputbarToolsContextValue => {
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
  // Tools Registry API (供工具按钮使用，永远不变)
  // --------------------------------------------------------------------------
  const toolsRegistryAPI = useMemo<ToolsRegistryAPI>(
    () => ({
      registerRootMenu,
      registerTrigger
    }),
    [registerRootMenu, registerTrigger]
  )

  // --------------------------------------------------------------------------
  // Triggers API (供 Inputbar 使用，永远不变)
  // --------------------------------------------------------------------------
  const triggersAPI = useMemo<TriggersAPI>(
    () => ({
      emit: emitTrigger,
      getRootMenu: getQuickPanelRootMenu
    }),
    [emitTrigger, getQuickPanelRootMenu]
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

      // ✅ 拆分后的 API
      toolsRegistry: toolsRegistryAPI,
      triggers: triggersAPI
    }),
    [stableActions, toolsRegistryAPI, triggersAPI]
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
