import { HolderOutlined } from '@ant-design/icons'
import { loggerService } from '@logger'
import { ActionIconButton } from '@renderer/components/Buttons'
import type { QuickPanelTriggerInfo } from '@renderer/components/QuickPanel'
import { QuickPanelReservedSymbol, QuickPanelView, useQuickPanel } from '@renderer/components/QuickPanel'
import TranslateButton from '@renderer/components/TranslateButton'
import {
  isAutoEnableImageGenerationModel,
  isGenerateImageModel,
  isGenerateImageModels,
  isMandatoryWebSearchModel,
  isVisionModel,
  isVisionModels,
  isWebSearchModel
} from '@renderer/config/models'
import db from '@renderer/databases'
import { useAssistant } from '@renderer/hooks/useAssistant'
import { useInputText } from '@renderer/hooks/useInputText'
import { useMessageOperations, useTopicLoading } from '@renderer/hooks/useMessageOperations'
import { useRuntime } from '@renderer/hooks/useRuntime'
import { useSettings } from '@renderer/hooks/useSettings'
import { useShortcut } from '@renderer/hooks/useShortcuts'
import { useSidebarIconShow } from '@renderer/hooks/useSidebarIcon'
import { useTextareaResize } from '@renderer/hooks/useTextareaResize'
import { useTimer } from '@renderer/hooks/useTimer'
import useTranslate from '@renderer/hooks/useTranslate'
import {
  InputbarToolsProvider,
  useInputbarToolsDispatch,
  useInputbarToolsInternalDispatch,
  useInputbarToolsState
} from '@renderer/pages/home/Inputbar/context/InputbarToolsProvider'
import { getDefaultTopic } from '@renderer/services/AssistantService'
import { EVENT_NAMES, EventEmitter } from '@renderer/services/EventService'
import FileManager from '@renderer/services/FileManager'
import { checkRateLimit, getUserMessage } from '@renderer/services/MessagesService'
import PasteService from '@renderer/services/PasteService'
import { spanManagerService } from '@renderer/services/SpanManagerService'
import { estimateTextTokens as estimateTxtTokens, estimateUserPromptUsage } from '@renderer/services/TokenService'
import { translateText } from '@renderer/services/TranslateService'
import WebSearchService from '@renderer/services/WebSearchService'
import { useAppDispatch, useAppSelector } from '@renderer/store'
import { setSearching } from '@renderer/store/runtime'
import { sendMessage as _sendMessage } from '@renderer/store/thunk/messageThunk'
import { type Assistant, type FileType, type KnowledgeBase, type Model, type Topic, TopicType } from '@renderer/types'
import type { MessageInputBaseParams } from '@renderer/types/newMessage'
import { delay } from '@renderer/utils'
import { formatQuotedText } from '@renderer/utils/formats'
import { getSendMessageShortcutLabel, isSendMessageKeyPressed } from '@renderer/utils/input'
import { documentExts, imageExts, textExts } from '@shared/config/constant'
import { IpcChannel } from '@shared/IpcChannel'
import { Tooltip } from 'antd'
import { debounce } from 'lodash'
import { CirclePause, Languages } from 'lucide-react'
import type { FC } from 'react'
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import styled from 'styled-components'

import AttachmentPreview from './AttachmentPreview'
import { InputbarCore } from './components/InputbarCore'
import { useFileDragDrop } from './hooks/useFileDragDrop'
import { usePasteHandler } from './hooks/usePasteHandler'
import InputbarTools from './InputbarTools'
import KnowledgeBaseInput from './KnowledgeBaseInput'
import MentionModelsInput from './MentionModelsInput'
import { getInputbarConfig } from './registry'
import SendMessageButton from './SendMessageButton'
import TokenCount from './TokenCount'
import type { InputbarScope } from './types'

const logger = loggerService.withContext('Inputbar')

interface Props {
  assistant: Assistant
  setActiveTopic: (topic: Topic) => void
  topic: Topic
}

const InputbarInner: FC<Props> = ({ assistant: initialAssistant, setActiveTopic, topic }) => {
  const scope = useMemo<InputbarScope>(() => topic.type ?? TopicType.Chat, [topic.type])
  const config = useMemo(() => getInputbarConfig(scope), [scope])
  const features = config.features

  const state = useInputbarToolsState()
  const inputbarDispatch = useInputbarToolsDispatch()
  const inputbarInternalDispatch = useInputbarToolsInternalDispatch()

  const { files, mentionedModels, selectedKnowledgeBases, isExpanded } = state
  const { setFiles, setMentionedModels, setSelectedKnowledgeBases, setIsExpanded, toolsRegistry, triggers } =
    inputbarDispatch
  const { setCouldAddImageFile, setExtensions } = inputbarInternalDispatch

  // 使用 useInputText 管理文本状态
  const { text, setText, prevText, isEmpty: inputEmpty } = useInputText()

  const showKnowledgeIcon = useSidebarIconShow('knowledge')
  const [inputFocus, setInputFocus] = useState(false)
  const { assistant, addTopic, model, setModel, updateAssistant } = useAssistant(initialAssistant.id)
  const {
    targetLanguage,
    sendMessageShortcut,
    fontSize,
    pasteLongTextAsFile,
    pasteLongTextThreshold,
    showInputEstimatedTokens,
    autoTranslateWithSpace,
    enableQuickPanelTriggers,
    enableSpellCheck
  } = useSettings()
  const [estimateTokenCount, setEstimateTokenCount] = useState(0)
  const [contextCount, setContextCount] = useState({ current: 0, max: 0 })

  // 使用 useTextareaResize 管理 textarea
  const {
    textareaRef,
    resize: resizeTextArea,
    customHeight: textareaHeight,
    setCustomHeight: setTextareaHeight,
    setExpanded,
    isExpanded: textareaIsExpanded
  } = useTextareaResize({
    maxHeight: 400,
    minHeight: 30
  })

  const { t } = useTranslation()
  const { getLanguageByLangcode } = useTranslate()
  const { searching } = useRuntime()
  const { pauseMessages } = useMessageOperations(topic)
  const loading = useTopicLoading(topic)
  const dispatch = useAppDispatch()
  const [spaceClickCount, setSpaceClickCount] = useState(0)
  const spaceClickTimer = useRef<NodeJS.Timeout | null>(null)
  const [isTranslating, setIsTranslating] = useState(false)
  const startDragY = useRef<number>(0)
  const startHeight = useRef<number>(0)
  const isMultiSelectMode = useAppSelector((state) => state.runtime.chat.isMultiSelectMode)
  const isVisionAssistant = useMemo(() => isVisionModel(model), [model])
  const isGenerateImageAssistant = useMemo(() => isGenerateImageModel(model), [model])
  const { setTimeoutTimer } = useTimer()

  // 全局 QuickPanel Hook (用于控制面板显示状态)
  const quickPanel = useQuickPanel()
  const quickPanelOpen = quickPanel.open

  const isVisionSupported = useMemo(
    () =>
      (mentionedModels.length > 0 && isVisionModels(mentionedModels)) ||
      (mentionedModels.length === 0 && isVisionAssistant),
    [mentionedModels, isVisionAssistant]
  )

  const isGenerateImageSupported = useMemo(
    () =>
      (mentionedModels.length > 0 && isGenerateImageModels(mentionedModels)) ||
      (mentionedModels.length === 0 && isGenerateImageAssistant),
    [mentionedModels, isGenerateImageAssistant]
  )

  const canAddImageFile = useMemo(() => {
    if (!features.enableAttachments) {
      return false
    }
    return isVisionSupported || isGenerateImageSupported
  }, [features.enableAttachments, isGenerateImageSupported, isVisionSupported])

  const canAddTextFile = useMemo(() => {
    if (!features.enableAttachments) {
      return false
    }
    return isVisionSupported || (!isVisionSupported && !isGenerateImageSupported)
  }, [features.enableAttachments, isGenerateImageSupported, isVisionSupported])

  const supportedExts = useMemo(() => {
    if (!features.enableAttachments) {
      return []
    }

    if (canAddImageFile && canAddTextFile) {
      return [...imageExts, ...documentExts, ...textExts]
    }

    if (canAddImageFile) {
      return [...imageExts]
    }

    if (canAddTextFile) {
      return [...documentExts, ...textExts]
    }

    return []
  }, [canAddImageFile, canAddTextFile, features.enableAttachments])

  // 使用 usePasteHandler 处理粘贴
  const { handlePaste } = usePasteHandler(text, setText, {
    supportedExts,
    setFiles,
    pasteLongTextAsFile,
    pasteLongTextThreshold,
    onResize: resizeTextArea,
    t
  })

  // 使用 useFileDragDrop 处理拖拽
  const dragDrop = useFileDragDrop({
    supportedExts,
    setFiles,
    onTextDropped: (droppedText) => setText((prev) => prev + droppedText),
    enabled: features.enableAttachments,
    t
  })

  useEffect(() => {
    setCouldAddImageFile(canAddImageFile)
  }, [canAddImageFile, setCouldAddImageFile])

  const placeholderText = enableQuickPanelTriggers
    ? t('chat.input.placeholder', { key: getSendMessageShortcutLabel(sendMessageShortcut) })
    : t('chat.input.placeholder_without_triggers', {
        key: getSendMessageShortcutLabel(sendMessageShortcut),
        defaultValue: t('chat.input.placeholder', {
          key: getSendMessageShortcutLabel(sendMessageShortcut)
        })
      })

  useEffect(() => {
    setExtensions(supportedExts)
  }, [setExtensions, supportedExts])

  const setInputText = useCallback<React.Dispatch<React.SetStateAction<string>>>(
    (value) => {
      if (typeof value === 'function') {
        setText((prev) => value(prev))
      } else {
        setText(value)
      }
    },
    [setText]
  )

  const focusTextarea = useCallback(() => {
    textareaRef.current?.focus()
  }, [textareaRef])

  // resizeTextArea 现在来自 useTextareaResize hook

  // 判断是否可以发送：文本不为空或有文件
  const cannotSend = useMemo(() => inputEmpty && files.length === 0, [inputEmpty, files.length])

  const sendMessage = useCallback(async () => {
    if (!features.enableSendButton || cannotSend) {
      return
    }
    if (checkRateLimit(assistant)) {
      return
    }

    logger.info('Starting to send message')

    const parent = spanManagerService.startTrace(
      { topicId: topic.id, name: 'sendMessage', inputs: text },
      mentionedModels.length > 0 ? mentionedModels : [assistant.model]
    )
    EventEmitter.emit(EVENT_NAMES.SEND_MESSAGE, { topicId: topic.id, traceId: parent?.spanContext().traceId })

    try {
      const uploadedFiles = await FileManager.uploadFiles(files)

      const baseUserMessage: MessageInputBaseParams = { assistant, topic, content: text }
      if (uploadedFiles) {
        baseUserMessage.files = uploadedFiles
      }
      if (mentionedModels.length) {
        baseUserMessage.mentions = mentionedModels
      }

      baseUserMessage.usage = await estimateUserPromptUsage(baseUserMessage)

      const { message, blocks } = getUserMessage(baseUserMessage)
      message.traceId = parent?.spanContext().traceId

      dispatch(_sendMessage(message, blocks, assistant, topic.id))

      setText('')
      setFiles([])
      setTimeoutTimer('sendMessage_1', () => setText(''), 500)
      setTimeoutTimer('sendMessage_2', () => resizeTextArea(true), 0)
      setIsExpanded(false)
    } catch (error) {
      logger.warn('Failed to send message:', error as Error)
      parent?.recordException(error as Error)
    }
  }, [
    assistant,
    dispatch,
    features.enableSendButton,
    files,
    cannotSend,
    mentionedModels,
    resizeTextArea,
    setFiles,
    setIsExpanded,
    setText,
    setTimeoutTimer,
    text,
    topic
  ])

  const translate = useCallback(async () => {
    if (isTranslating || !features.enableTranslate) {
      return
    }

    try {
      setIsTranslating(true)
      const translatedText = await translateText(text, getLanguageByLangcode(targetLanguage))
      translatedText && setText(translatedText)
      setTimeoutTimer('translate', () => resizeTextArea(), 0)
    } catch (error) {
      logger.warn('Translation failed:', error as Error)
    } finally {
      setIsTranslating(false)
    }
  }, [
    features.enableTranslate,
    getLanguageByLangcode,
    isTranslating,
    resizeTextArea,
    setText,
    setTimeoutTimer,
    targetLanguage,
    text
  ])

  const tokenCountProps = useMemo(() => {
    if (!config.showTokenCount || estimateTokenCount === undefined || !showInputEstimatedTokens) {
      return undefined
    }

    return {
      estimateTokenCount,
      inputTokenCount: estimateTokenCount,
      contextCount
    }
  }, [config.showTokenCount, contextCount, estimateTokenCount, showInputEstimatedTokens])

  // ============================================================================
  // QuickPanel Root Menu 优化 (使用 ref 模式，避免频繁重新注册)
  // ============================================================================
  const rootTriggerHandlerRef = useRef<((payload?: unknown) => void) | undefined>(undefined)

  // ✅ 更新 handler 逻辑（内部逻辑变化，不重新注册 trigger）
  useEffect(() => {
    rootTriggerHandlerRef.current = (payload) => {
      // 获取最新的工具注册的菜单项
      const menuItems = triggers.getRootMenu()

      // 添加 Inputbar 特有的菜单项（如翻译）
      if (features.enableTranslate && text.trim()) {
        menuItems.push({
          label: t('translate.title'),
          description: t('translate.menu.description'),
          icon: <Languages size={16} />,
          action: () => translate()
        })
      }

      if (!menuItems.length) {
        return
      }

      const triggerInfo = (payload ?? {}) as QuickPanelTriggerInfo
      quickPanelOpen({
        title: t('settings.quickPanel.title'),
        list: menuItems,
        symbol: QuickPanelReservedSymbol.Root,
        triggerInfo
      })
    }
  }, [features.enableTranslate, triggers, quickPanelOpen, t, text, translate])

  useEffect(() => {
    if (!config.enableQuickPanel) {
      return
    }

    const disposeRootTrigger = toolsRegistry.registerTrigger(
      'inputbar-root',
      QuickPanelReservedSymbol.Root,
      (payload) => rootTriggerHandlerRef.current?.(payload)
    )

    return () => {
      disposeRootTrigger()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config.enableQuickPanel])

  const onToggleExpanded = useCallback(() => {
    if (!features.enableExpand) {
      return
    }

    const currentlyExpanded = isExpanded || textareaIsExpanded
    const shouldExpand = !currentlyExpanded

    // 使用 hook 提供的 setExpanded
    setExpanded(shouldExpand)
    // 同步更新 Context state
    setIsExpanded(shouldExpand)

    focusTextarea()
  }, [features.enableExpand, focusTextarea, isExpanded, textareaIsExpanded, setExpanded, setIsExpanded])

  const appendTxtContentToInput = useCallback(
    async (file: FileType, event: React.MouseEvent<HTMLDivElement>) => {
      event.preventDefault()
      event.stopPropagation()

      try {
        const targetPath = file.path
        const content = await window.api.file.readExternal(targetPath, true)
        try {
          await navigator.clipboard.writeText(content)
        } catch (clipboardError) {
          logger.warn('Failed to copy txt attachment content to clipboard:', clipboardError as Error)
        }

        setText((prev) => {
          if (!prev) {
            return content
          }

          const needsSeparator = !prev.endsWith('\n')
          return needsSeparator ? `${prev}\n${content}` : prev + content
        })

        setFiles((prev) => prev.filter((currentFile) => currentFile.id !== file.id))

        setTimeoutTimer(
          'appendTxtAttachment',
          () => {
            const textArea = textareaRef.current?.resizableTextArea?.textArea
            if (textArea) {
              const end = textArea.value.length
              textArea.focus()
              textArea.setSelectionRange(end, end)
            }

            resizeTextArea(true)
          },
          0
        )
      } catch (error) {
        logger.warn('Failed to append txt attachment content:', error as Error)
        window.toast.error(t('chat.input.file_error'))
      }
    },
    [resizeTextArea, setFiles, setText, setTimeoutTimer, t, textareaRef]
  )

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (event.key === 'Tab' && inputFocus) {
        event.preventDefault()
        const textArea = textareaRef.current?.resizableTextArea?.textArea
        if (!textArea) {
          return
        }
        const cursorPosition = textArea.selectionStart
        const selectionLength = textArea.selectionEnd - textArea.selectionStart
        const text = textArea.value

        let match = text.slice(cursorPosition + selectionLength).match(/\$\{[^}]+\}/)
        let startIndex: number

        if (!match) {
          match = text.match(/\$\{[^}]+\}/)
          startIndex = match?.index ?? -1
        } else {
          startIndex = cursorPosition + selectionLength + match.index!
        }

        if (startIndex !== -1) {
          const endIndex = startIndex + match![0].length
          textArea.setSelectionRange(startIndex, endIndex)
          return
        }
      }
      if (autoTranslateWithSpace && event.key === ' ') {
        setSpaceClickCount((prev) => prev + 1)
        if (spaceClickTimer.current) {
          clearTimeout(spaceClickTimer.current)
        }
        spaceClickTimer.current = setTimeout(() => {
          setSpaceClickCount(0)
        }, 200)

        if (spaceClickCount === 2 && features.enableTranslate) {
          logger.info('Triple space detected - trigger translation')
          setSpaceClickCount(0)
          translate()
          return
        }
      }

      if (features.enableExpand && (isExpanded || textareaIsExpanded) && event.key === 'Escape') {
        event.stopPropagation()
        onToggleExpanded()
        return
      }

      const isEnterPressed = event.key === 'Enter' && !event.nativeEvent.isComposing
      if (isEnterPressed) {
        if (isSendMessageKeyPressed(event, sendMessageShortcut)) {
          sendMessage()
          event.preventDefault()
          return
        }

        if (event.shiftKey) {
          return
        }

        event.preventDefault()
        const textArea = textareaRef.current?.resizableTextArea?.textArea
        if (textArea) {
          const start = textArea.selectionStart
          const end = textArea.selectionEnd
          const currentText = textArea.value
          const newText = currentText.substring(0, start) + '\n' + currentText.substring(end)

          setText(newText)

          setTimeoutTimer(
            'handleKeyDown',
            () => {
              textArea.selectionStart = textArea.selectionEnd = start + 1
            },
            0
          )
        }
      }

      if (event.key === 'Backspace' && text.length === 0 && files.length > 0) {
        setFiles((prev) => prev.slice(0, -1))
        event.preventDefault()
      }
    },
    [
      inputFocus,
      autoTranslateWithSpace,
      features.enableExpand,
      features.enableTranslate,
      isExpanded,
      textareaIsExpanded,
      text.length,
      files.length,
      textareaRef,
      spaceClickCount,
      translate,
      onToggleExpanded,
      sendMessageShortcut,
      sendMessage,
      setText,
      setTimeoutTimer,
      setFiles
    ]
  )

  const handleTextareaChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const newText = e.target.value
      setText(newText)

      // prevText 现在来自 useInputText hook
      const isDeletion = newText.length < prevText.length

      const textArea = textareaRef.current?.resizableTextArea?.textArea
      const cursorPosition = textArea?.selectionStart ?? newText.length
      const lastSymbol = newText[cursorPosition - 1]
      const previousChar = newText[cursorPosition - 2]
      const isCursorAtTextStart = cursorPosition <= 1
      const hasValidTriggerBoundary = previousChar === ' ' || isCursorAtTextStart

      const openRootPanelAt = (position: number) => {
        triggers.emit(QuickPanelReservedSymbol.Root, {
          type: 'input',
          position,
          originalText: newText
        })
      }

      const openMentionPanelAt = (position: number) => {
        triggers.emit(QuickPanelReservedSymbol.MentionModels, {
          type: 'input',
          position,
          originalText: newText
        })
      }

      if (enableQuickPanelTriggers && config.enableQuickPanel) {
        const hasRootMenuItems = triggers.getRootMenu().length > 0
        const textBeforeCursor = newText.slice(0, cursorPosition)
        const lastRootIndex = textBeforeCursor.lastIndexOf(QuickPanelReservedSymbol.Root)
        const lastMentionIndex = textBeforeCursor.lastIndexOf(QuickPanelReservedSymbol.MentionModels)
        const lastTriggerIndex = Math.max(lastRootIndex, lastMentionIndex)

        if (!quickPanel.isVisible && lastTriggerIndex !== -1 && cursorPosition > lastTriggerIndex) {
          const triggerChar = newText[lastTriggerIndex]
          const boundaryChar = newText[lastTriggerIndex - 1] ?? ''
          const hasBoundary = lastTriggerIndex === 0 || /\s/.test(boundaryChar)
          const searchSegment = newText.slice(lastTriggerIndex + 1, cursorPosition)
          const hasSearchContent = searchSegment.trim().length > 0

          if (hasBoundary && (!hasSearchContent || isDeletion)) {
            if (triggerChar === QuickPanelReservedSymbol.Root && hasRootMenuItems) {
              openRootPanelAt(lastTriggerIndex)
            } else if (triggerChar === QuickPanelReservedSymbol.MentionModels && features.enableMentionModels) {
              openMentionPanelAt(lastTriggerIndex)
            }
          }
        }

        if (lastSymbol === QuickPanelReservedSymbol.Root && hasValidTriggerBoundary && hasRootMenuItems) {
          if (quickPanel.isVisible && quickPanel.symbol !== QuickPanelReservedSymbol.Root) {
            quickPanel.close('switch-symbol')
          }
          if (!quickPanel.isVisible || quickPanel.symbol !== QuickPanelReservedSymbol.Root) {
            openRootPanelAt(cursorPosition - 1)
          }
        }

        if (
          features.enableMentionModels &&
          lastSymbol === QuickPanelReservedSymbol.MentionModels &&
          hasValidTriggerBoundary
        ) {
          if (quickPanel.isVisible && quickPanel.symbol !== QuickPanelReservedSymbol.MentionModels) {
            quickPanel.close('switch-symbol')
          }
          if (!quickPanel.isVisible || quickPanel.symbol !== QuickPanelReservedSymbol.MentionModels) {
            openMentionPanelAt(cursorPosition - 1)
          }
        }
      }

      if (quickPanel.isVisible && quickPanel.triggerInfo?.type === 'input') {
        const activeSymbol = quickPanel.symbol as QuickPanelReservedSymbol
        const triggerPosition = quickPanel.triggerInfo.position ?? -1
        const isTrackedSymbol =
          activeSymbol === QuickPanelReservedSymbol.Root || activeSymbol === QuickPanelReservedSymbol.MentionModels

        if (isTrackedSymbol && triggerPosition >= 0) {
          // Check if cursor is before the trigger position (user deleted the symbol)
          if (cursorPosition <= triggerPosition) {
            quickPanel.close('delete-symbol')
          } else {
            // Check if the trigger symbol still exists at the expected position
            const triggerChar = newText[triggerPosition]
            if (triggerChar !== activeSymbol) {
              quickPanel.close('delete-symbol')
            }
          }
        }
      }
    },
    [
      setText,
      prevText.length,
      textareaRef,
      enableQuickPanelTriggers,
      config.enableQuickPanel,
      quickPanel,
      triggers,
      features.enableMentionModels
    ]
  )

  const onTranslated = useCallback(
    (translatedText: string) => {
      setText(translatedText)
      setTimeoutTimer('onTranslated', () => resizeTextArea(), 0)
    },
    [resizeTextArea, setText, setTimeoutTimer]
  )

  const handleFocus = useCallback(() => {
    setInputFocus(true)
    dispatch(setSearching(false))
    quickPanel.close()
    PasteService.setLastFocusedComponent('inputbar')
  }, [dispatch, quickPanel])

  const handleBlur = useCallback(() => {
    setInputFocus(false)
  }, [])

  const handleDragStart = useCallback(
    (event: React.MouseEvent) => {
      if (!config.enableDragDrop) {
        return
      }

      startDragY.current = event.clientY
      startHeight.current = textareaRef.current?.resizableTextArea?.textArea?.offsetHeight || 0

      const handleMouseMove = (e: MouseEvent) => {
        const deltaY = startDragY.current - e.clientY
        const newHeight = Math.max(40, Math.min(400, startHeight.current + deltaY))
        setTextareaHeight(newHeight)
      }

      const handleMouseUp = () => {
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
      }

      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
    },
    [config.enableDragDrop, setTextareaHeight, textareaRef]
  )

  const onQuote = useCallback(
    (quoted: string) => {
      const formatted = formatQuotedText(quoted)
      setText((prevText) => {
        const next = prevText ? `${prevText}\n${formatted}\n` : `${formatted}\n`
        setTimeoutTimer('onQuote', () => resizeTextArea(), 0)
        return next
      })
      focusTextarea()
    },
    [focusTextarea, resizeTextArea, setText, setTimeoutTimer]
  )

  const onPause = useCallback(async () => {
    await pauseMessages()
  }, [pauseMessages])

  const clearTopic = useCallback(async () => {
    if (!features.enableClearTopic) {
      return
    }

    if (loading) {
      await onPause()
      await delay(1)
    }

    EventEmitter.emit(EVENT_NAMES.CLEAR_MESSAGES, topic)
    focusTextarea()
  }, [features.enableClearTopic, focusTextarea, loading, onPause, topic])

  const onNewContext = useCallback(() => {
    if (!features.enableNewContext) {
      return
    }

    if (loading) {
      onPause()
      return
    }
    EventEmitter.emit(EVENT_NAMES.NEW_CONTEXT)
  }, [features.enableNewContext, loading, onPause])

  const addNewTopic = useCallback(async () => {
    if (!features.enableNewTopic) {
      return
    }

    const newTopic = getDefaultTopic(assistant.id)

    await db.topics.add({ id: newTopic.id, messages: [] })

    if (assistant.defaultModel) {
      setModel(assistant.defaultModel)
    }

    addTopic(newTopic)
    setActiveTopic(newTopic)

    setTimeoutTimer('addNewTopic', () => EventEmitter.emit(EVENT_NAMES.SHOW_TOPIC_SIDEBAR), 0)
  }, [
    addTopic,
    assistant.defaultModel,
    assistant.id,
    features.enableNewTopic,
    setActiveTopic,
    setModel,
    setTimeoutTimer
  ])

  const handleRemoveModel = useCallback(
    (modelToRemove: Model) => {
      setMentionedModels(mentionedModels.filter((current) => current.id !== modelToRemove.id))
    },
    [mentionedModels, setMentionedModels]
  )

  const handleRemoveKnowledgeBase = useCallback(
    (knowledgeBase: KnowledgeBase) => {
      const nextKnowledgeBases = assistant.knowledge_bases?.filter((kb) => kb.id !== knowledgeBase.id)
      updateAssistant({ ...assistant, knowledge_bases: nextKnowledgeBases })
      setSelectedKnowledgeBases(nextKnowledgeBases ?? [])
    },
    [assistant, setSelectedKnowledgeBases, updateAssistant]
  )

  useShortcut(
    'new_topic',
    () => {
      addNewTopic()
      EventEmitter.emit(EVENT_NAMES.SHOW_TOPIC_SIDEBAR)
      focusTextarea()
    },
    { preventDefault: true, enableOnFormTags: true, enabled: features.enableNewTopic }
  )

  useShortcut('clear_topic', clearTopic, {
    preventDefault: true,
    enableOnFormTags: true,
    enabled: features.enableClearTopic
  })

  useEffect(() => {
    const _setEstimateTokenCount = debounce(setEstimateTokenCount, 100, { leading: false, trailing: true })
    const unsubscribes = [
      EventEmitter.on(EVENT_NAMES.ESTIMATED_TOKEN_COUNT, ({ tokensCount, contextCount }) => {
        _setEstimateTokenCount(tokensCount)
        setContextCount({ current: contextCount.current, max: contextCount.max })
      }),
      ...(features.enableNewTopic ? [EventEmitter.on(EVENT_NAMES.ADD_NEW_TOPIC, addNewTopic)] : [])
    ]

    const quoteListener = window.electron?.ipcRenderer.on(IpcChannel.App_QuoteToMain, (_, selectedText: string) =>
      onQuote(selectedText)
    )

    return () => {
      unsubscribes.forEach((unsubscribe) => unsubscribe())
      quoteListener?.()
    }
  }, [addNewTopic, features.enableNewTopic, onQuote])

  useEffect(() => {
    const debouncedEstimate = debounce((value: string) => {
      if (showInputEstimatedTokens) {
        const count = estimateTxtTokens(value) || 0
        setEstimateTokenCount(count)
      }
    }, 500)

    debouncedEstimate(text)
    return () => debouncedEstimate.cancel()
  }, [showInputEstimatedTokens, text])

  useEffect(() => {
    if (!document.querySelector('.topview-fullscreen-container')) {
      focusTextarea()
    }
  }, [
    topic.id,
    assistant.mcpServers,
    assistant.knowledge_bases,
    assistant.enableWebSearch,
    assistant.webSearchProviderId,
    mentionedModels,
    focusTextarea
  ])

  useEffect(() => {
    const timerId = requestAnimationFrame(() => resizeTextArea())
    return () => cancelAnimationFrame(timerId)
  }, [resizeTextArea])

  useEffect(() => {
    const onFocus = () => {
      if (document.activeElement?.closest('.ant-modal')) {
        return
      }

      const lastFocusedComponent = PasteService.getLastFocusedComponent()
      if (!lastFocusedComponent || lastFocusedComponent === 'inputbar') {
        focusTextarea()
      }
    }

    window.addEventListener('focus', onFocus)
    return () => window.removeEventListener('focus', onFocus)
  }, [focusTextarea])

  useEffect(() => {
    setSelectedKnowledgeBases(showKnowledgeIcon && features.enableKnowledge ? (assistant.knowledge_bases ?? []) : [])
  }, [assistant.knowledge_bases, features.enableKnowledge, setSelectedKnowledgeBases, showKnowledgeIcon])

  useEffect(() => {
    if (!features.enableWebSearch && assistant.enableWebSearch) {
      updateAssistant({ ...assistant, enableWebSearch: false })
    } else if (features.enableWebSearch && !isWebSearchModel(model) && assistant.enableWebSearch) {
      updateAssistant({ ...assistant, enableWebSearch: false })
    }

    if (
      assistant.webSearchProviderId &&
      (!WebSearchService.isWebSearchEnabled(assistant.webSearchProviderId) || isMandatoryWebSearchModel(model))
    ) {
      updateAssistant({ ...assistant, webSearchProviderId: undefined })
    }

    if (!features.enableGenImage && assistant.enableGenerateImage) {
      updateAssistant({ ...assistant, enableGenerateImage: false })
      return
    }

    if (isGenerateImageModel(model)) {
      if (isAutoEnableImageGenerationModel(model) && !assistant.enableGenerateImage) {
        updateAssistant({ ...assistant, enableGenerateImage: true })
      }
    } else if (assistant.enableGenerateImage) {
      updateAssistant({ ...assistant, enableGenerateImage: false })
    }
  }, [assistant, features.enableGenImage, features.enableWebSearch, model, updateAssistant])

  useEffect(() => {
    PasteService.init()
    PasteService.registerHandler('inputbar', (event) =>
      PasteService.handlePaste(
        event,
        supportedExts,
        setFiles,
        setText,
        pasteLongTextAsFile,
        pasteLongTextThreshold,
        text,
        resizeTextArea,
        t
      )
    )

    return () => {
      PasteService.unregisterHandler('inputbar')
    }
  }, [
    config.enableQuickPanel,
    pasteLongTextAsFile,
    pasteLongTextThreshold,
    resizeTextArea,
    setFiles,
    setText,
    supportedExts,
    t,
    text
  ])

  useEffect(() => {
    return () => {
      if (spaceClickTimer.current) {
        clearTimeout(spaceClickTimer.current)
      }
    }
  }, [])

  const rightSectionExtras = useMemo(() => {
    const extras: React.ReactNode[] = []

    if (features.enableTranslate) {
      extras.push(<TranslateButton key="translate" text={text} onTranslated={onTranslated} isLoading={isTranslating} />)
    }

    if (features.enableAbortButton && loading) {
      extras.push(
        <Tooltip key="pause" placement="top" title={t('chat.input.pause')} mouseLeaveDelay={0} arrow>
          <ActionIconButton onClick={onPause} style={{ marginRight: -2 }}>
            <CirclePause size={20} color="var(--color-error)" />
          </ActionIconButton>
        </Tooltip>
      )
    }

    if (extras.length === 0) {
      return null
    }

    return <>{extras}</>
  }, [features.enableAbortButton, features.enableTranslate, isTranslating, loading, onPause, onTranslated, t, text])

  if (isMultiSelectMode) {
    return null
  }

  const composerExpanded = isExpanded || textareaIsExpanded

  // topContent: 所有顶部预览内容
  const topContent = (
    <>
      {features.enableAttachments && files.length > 0 && (
        <AttachmentPreview files={files} setFiles={setFiles} onAttachmentContextMenu={appendTxtContentToInput} />
      )}

      {features.enableKnowledge && selectedKnowledgeBases.length > 0 && (
        <KnowledgeBaseInput
          selectedKnowledgeBases={selectedKnowledgeBases}
          onRemoveKnowledgeBase={handleRemoveKnowledgeBase}
        />
      )}

      {features.enableMentionModels && mentionedModels.length > 0 && (
        <MentionModelsInput selectedModels={mentionedModels} onRemoveModel={handleRemoveModel} />
      )}
    </>
  )

  // leftToolbar: 左侧工具栏
  const leftToolbar = config.showTools ? <InputbarTools scope={scope} assistantId={assistant.id} /> : null

  // rightToolbar: 右侧工具栏
  const rightToolbar = (
    <>
      {tokenCountProps && (
        <TokenCount
          estimateTokenCount={tokenCountProps.estimateTokenCount}
          inputTokenCount={tokenCountProps.inputTokenCount}
          contextCount={tokenCountProps.contextCount}
        />
      )}

      {features.enableSendButton && (
        <SendMessageButton sendMessage={sendMessage} disabled={cannotSend || loading || searching} />
      )}

      {rightSectionExtras}
    </>
  )

  // quickPanel: QuickPanel 组件
  const quickPanelElement = config.enableQuickPanel ? <QuickPanelView setInputText={setInputText} /> : null

  // dragHandle: 拖拽手柄
  const dragHandleElement = config.enableDragDrop ? (
    <DragHandle onMouseDown={handleDragStart}>
      <HolderOutlined style={{ fontSize: 12 }} />
    </DragHandle>
  ) : null

  return (
    <InputbarCore
      text={text}
      onTextChange={handleTextareaChange}
      placeholder={isTranslating ? t('chat.input.translating') : config.placeholder || placeholderText}
      textareaRef={textareaRef}
      textareaHeight={textareaHeight}
      onKeyDown={handleKeyDown}
      onPaste={handlePaste}
      onFocus={handleFocus}
      onBlur={handleBlur}
      onDragEnter={dragDrop.handleDragEnter}
      onDragLeave={dragDrop.handleDragLeave}
      onDragOver={dragDrop.handleDragOver}
      onDrop={dragDrop.handleDrop}
      isDragging={dragDrop.isDragging}
      leftToolbar={leftToolbar}
      rightToolbar={rightToolbar}
      topContent={topContent}
      quickPanel={quickPanelElement}
      dragHandle={dragHandleElement}
      fontSize={fontSize}
      enableSpellCheck={enableSpellCheck}
      disabled={loading || searching}
      isExpanded={composerExpanded}
    />
  )
}

const DragHandle = styled.div`
  position: absolute;
  top: -3px;
  left: 0;
  right: 0;
  height: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: row-resize;
  color: var(--color-icon);
  opacity: 0;
  transition: opacity 0.2s;
  z-index: 1;

  &:hover {
    opacity: 1;
  }

  .anticon {
    transform: rotate(90deg);
    font-size: 14px;
  }
`

// Wrapper 组件：提供 Context Provider
const Inputbar: FC<Props> = ({ assistant, setActiveTopic, topic }) => {
  const initialState = useMemo(
    () => ({
      files: [] as FileType[],
      mentionedModels: [] as Model[],
      selectedKnowledgeBases: assistant.knowledge_bases ?? [],
      isExpanded: false,
      couldAddImageFile: false,
      extensions: [] as string[]
    }),
    [assistant.knowledge_bases]
  )

  return (
    <InputbarToolsProvider initialState={initialState}>
      <InputbarInner assistant={assistant} setActiveTopic={setActiveTopic} topic={topic} />
    </InputbarToolsProvider>
  )
}

export default Inputbar
