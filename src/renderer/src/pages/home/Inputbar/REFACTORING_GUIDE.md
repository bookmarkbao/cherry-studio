# Inputbar 重构指南

## 📖 概述

本指南说明如何使用新的 hooks 和 `InputbarCore` 组件重构 Inputbar.tsx 和 AgentSessionInputbar.tsx。

## 🎯 设计原则

### ✅ 应该抽象的
- **通用工具**：文本状态、textarea 调整、键盘处理
- **UI 框架**：InputbarCore 提供统一的布局结构
- **可复用逻辑**：粘贴处理、文件拖拽

### ❌ 不应该抽象的
- **业务逻辑**：消息发送、文件上传、token 估算
- **特定功能**：QuickPanel、翻译、MCP 工具
- **差异化实现**：Chat 和 AgentSession 的不同需求

---

## 📚 可用的 Hooks

### 1. 应用级通用 Hooks（`src/renderer/src/hooks/`）

#### `useInputText`
```typescript
import { useInputText } from '@renderer/hooks/useInputText'

const { text, setText, prevText, isEmpty, clear } = useInputText({
  initialValue: '',
  onChange: (text) => console.log('Text changed:', text)
})
```

**功能：**
- 管理文本状态
- 追踪历史文本
- 提供 isEmpty、clear 便捷方法

#### `useTextareaResize`
```typescript
import { useTextareaResize } from '@renderer/hooks/useTextareaResize'

const { textareaRef, resize, customHeight, setExpanded, isExpanded } = useTextareaResize({
  maxHeight: 400,
  minHeight: 30,
  autoResize: true
})

// 使用
<TextArea ref={textareaRef} style={{ height: customHeight }} />
<button onClick={() => setExpanded(!isExpanded)}>Expand</button>
```

**功能：**
- 自动调整 textarea 高度
- 支持展开/收起
- 自定义高度限制

#### `useKeyboardHandler`
```typescript
import { useKeyboardHandler } from '@renderer/hooks/useKeyboardHandler'

const handleKeyDown = useKeyboardHandler(
  {
    onSend: () => sendMessage(),
    onEscape: () => closePanel(),
    onTab: () => navigateToNextField()
  },
  {
    sendShortcut: 'Ctrl+Enter',
    enableTabNavigation: true,
    enableEscape: true
  }
)

// 使用
<textarea onKeyDown={handleKeyDown} />
```

**功能：**
- 统一的键盘快捷键处理
- 支持多种发送快捷键
- 可选的 Tab 和 Escape 处理

### 2. Inputbar 组件级 Hooks（`src/renderer/src/pages/home/Inputbar/hooks/`）

#### `usePasteHandler`
```typescript
import { usePasteHandler } from './hooks/usePasteHandler'

const { handlePaste } = usePasteHandler(text, setText, {
  supportedExts: ['.png', '.jpg', '.pdf'],
  setFiles: (updater) => setFiles(updater),
  pasteLongTextAsFile: true,
  pasteLongTextThreshold: 5000,
  onResize: () => resize(),
  t: useTranslation().t
})

// 使用
<textarea onPaste={handlePaste} />
```

**功能：**
- 粘贴文件处理
- 长文本转文件
- 图片粘贴

#### `useFileDragDrop`
```typescript
import { useFileDragDrop } from './hooks/useFileDragDrop'

const dragDrop = useFileDragDrop({
  supportedExts: ['.png', '.jpg', '.pdf'],
  setFiles: (updater) => setFiles(updater),
  onTextDropped: (text) => setText(text),
  enabled: true,
  t: useTranslation().t
})

// 使用
<div
  onDragEnter={dragDrop.handleDragEnter}
  onDragLeave={dragDrop.handleDragLeave}
  onDragOver={dragDrop.handleDragOver}
  onDrop={dragDrop.handleDrop}
  className={dragDrop.isDragging ? 'dragging' : ''}
/>
```

**功能：**
- 文件拖拽上传
- 文本拖拽处理
- 文件类型过滤

### 3. InputbarCore 组件

```typescript
import { InputbarCore } from './components/InputbarCore'

<InputbarCore
  text={text}
  onTextChange={(e) => setText(e.target.value)}
  textareaRef={textareaRef}
  textareaHeight={customHeight}
  onKeyDown={handleKeyDown}
  onPaste={handlePaste}
  onFocus={() => setInputFocus(true)}
  onBlur={() => setInputFocus(false)}
  {...dragDrop}

  topContent={
    <>
      {files.length > 0 && <AttachmentPreview files={files} />}
      {mentionedModels.length > 0 && <MentionModelsInput models={mentionedModels} />}
    </>
  }

  leftToolbar={<InputbarTools scope={scope} assistantId={assistant.id} />}

  rightToolbar={
    <>
      <TokenCount {...tokenCountProps} />
      <SendMessageButton sendMessage={sendMessage} disabled={isEmpty} />
    </>
  }

  quickPanel={<QuickPanelView setInputText={setText} />}

  fontSize={fontSize}
  enableSpellCheck={enableSpellCheck}
  disabled={loading}
  isExpanded={isExpanded}
/>
```

---

## 🔄 重构示例

### 示例 1：简化的 Inputbar（仅保留核心功能）

```typescript
import { useInputText } from '@renderer/hooks/useInputText'
import { useTextareaResize } from '@renderer/hooks/useTextareaResize'
import { useKeyboardHandler } from '@renderer/hooks/useKeyboardHandler'
import { usePasteHandler } from './hooks/usePasteHandler'
import { useFileDragDrop } from './hooks/useFileDragDrop'
import { InputbarCore } from './components/InputbarCore'

const SimplifiedInputbar: FC<Props> = ({ assistant, topic }) => {
  const { t } = useTranslation()
  const { files, setFiles } = useInputbarToolsState()

  // 1. 文本管理
  const { text, setText, isEmpty } = useInputText()

  // 2. Textarea 调整
  const { textareaRef, resize, customHeight, setExpanded, isExpanded } = useTextareaResize({
    maxHeight: 400
  })

  // 3. 发送消息（业务逻辑保留在组件内）
  const sendMessage = useCallback(async () => {
    if (isEmpty) return

    const uploadedFiles = await FileManager.uploadFiles(files)
    const { message, blocks } = getUserMessage({
      assistant,
      topic,
      content: text,
      files: uploadedFiles
    })

    dispatch(_sendMessage(message, blocks, assistant, topic.id))

    setText('')
    setFiles([])
    resize(true)
  }, [text, files, assistant, topic, isEmpty])

  // 4. 键盘处理
  const handleKeyDown = useKeyboardHandler(
    {
      onSend: sendMessage,
      onEscape: () => setExpanded(false)
    },
    {
      sendShortcut: 'Enter',
      enableEscape: true
    }
  )

  // 5. 粘贴处理
  const { handlePaste } = usePasteHandler(text, setText, {
    supportedExts: [...imageExts, ...documentExts],
    setFiles,
    onResize: resize,
    t
  })

  // 6. 拖拽处理
  const dragDrop = useFileDragDrop({
    supportedExts: [...imageExts, ...documentExts],
    setFiles,
    enabled: true,
    t
  })

  return (
    <InputbarCore
      text={text}
      onTextChange={(e) => setText(e.target.value)}
      textareaRef={textareaRef}
      textareaHeight={customHeight}
      onKeyDown={handleKeyDown}
      onPaste={handlePaste}
      {...dragDrop}

      topContent={
        files.length > 0 && <AttachmentPreview files={files} setFiles={setFiles} />
      }

      rightToolbar={
        <SendMessageButton sendMessage={sendMessage} disabled={isEmpty} />
      }

      placeholder={t('chat.input.placeholder')}
      fontSize={14}
      enableSpellCheck={true}
    />
  )
}
```

### 示例 2：AgentSessionInputbar 使用通用 Hooks

```typescript
import { useInputText } from '@renderer/hooks/useInputText'
import { useTextareaResize } from '@renderer/hooks/useTextareaResize'
import { useKeyboardHandler } from '@renderer/hooks/useKeyboardHandler'
import { InputbarCore } from '../Inputbar/components/InputbarCore'

const AgentSessionInputbar: FC<Props> = ({ agentId, sessionId }) => {
  const { t } = useTranslation()
  const { session } = useSession(agentId, sessionId)

  // 1. 文本管理
  const { text, setText, isEmpty } = useInputText()

  // 2. Textarea 调整（简化配置）
  const { textareaRef } = useTextareaResize()

  // 3. 发送消息（Agent Session 专用逻辑）
  const sendMessage = useCallback(async () => {
    if (isEmpty) return

    const userMessageId = uuid()
    const mainBlock = createMainTextBlock(userMessageId, text, {
      status: MessageBlockStatus.SUCCESS
    })

    const userMessage = createMessage('user', sessionTopicId, agentId, {
      id: userMessageId,
      blocks: [mainBlock.id],
      model: parseSessionModel(session.model)
    })

    const assistantStub = buildAssistantStub(session, agentId)

    dispatch(dispatchSendMessage(userMessage, [mainBlock], assistantStub, sessionTopicId, {
      agentId,
      sessionId
    }))

    setText('')
  }, [text, isEmpty, session, agentId, sessionId])

  // 4. 键盘处理（简化版）
  const handleKeyDown = useKeyboardHandler(
    { onSend: sendMessage },
    { sendShortcut: 'Enter' }
  )

  return (
    <InputbarCore
      text={text}
      onTextChange={(e) => setText(e.target.value)}
      textareaRef={textareaRef}
      onKeyDown={handleKeyDown}

      leftToolbar={
        <CreateSessionButton onClick={handleCreateSession} />
      }

      rightToolbar={
        <SendMessageButton sendMessage={sendMessage} disabled={isEmpty} />
      }

      placeholder={t('chat.input.placeholder_without_triggers')}
      fontSize={14}
      enableSpellCheck={true}
    />
  )
}
```

---

## 📝 重构步骤

### 对于 Inputbar.tsx

1. **引入通用 hooks**
   ```typescript
   import { useInputText } from '@renderer/hooks/useInputText'
   import { useTextareaResize } from '@renderer/hooks/useTextareaResize'
   import { useKeyboardHandler } from '@renderer/hooks/useKeyboardHandler'
   ```

2. **替换文本状态管理**
   ```typescript
   // Before
   const [text, setText] = useState('')

   // After
   const { text, setText, isEmpty } = useInputText()
   ```

3. **替换 resize 逻辑**
   ```typescript
   // Before
   const textareaRef = useRef<TextAreaRef>(null)
   const [textareaHeight, setTextareaHeight] = useState<number>()
   const resizeTextArea = useCallback(() => { /* ... */ }, [])

   // After
   const { textareaRef, resize, customHeight } = useTextareaResize({
     maxHeight: 400
   })
   ```

4. **引入组件级 hooks**
   ```typescript
   import { usePasteHandler } from './hooks/usePasteHandler'
   import { useFileDragDrop } from './hooks/useFileDragDrop'
   ```

5. **使用 InputbarCore 替换现有 UI**
   - 将现有的 JSX 拆分为 topContent、leftToolbar、rightToolbar
   - 使用 InputbarCore 组装

6. **保留业务逻辑**
   - sendMessage 逻辑保持不变
   - QuickPanel 触发逻辑保持不变
   - 翻译功能保持不变

### 对于 AgentSessionInputbar.tsx

1. **引入通用 hooks**（同上）

2. **简化配置**
   - 只使用需要的 hooks
   - 不使用 paste、dragDrop（如果不需要）

3. **保留专用逻辑**
   - Agent Session 的 sendMessage 逻辑
   - Session 创建逻辑

---

## ⚠️ 注意事项

### 1. 不要过度抽象

```typescript
// ❌ 错误：强行统一不同的业务逻辑
const sendMessage = useSendMessage({
  type: 'chat',
  enableFiles: true,
  enableTracing: true
})

// ✅ 正确：各自实现
const sendMessage = useCallback(async () => {
  // Chat 专用的发送逻辑
}, [dependencies])
```

### 2. 保持类型安全

```typescript
// 确保 setFiles 接受 updater 函数
const { handlePaste } = usePasteHandler(text, setText, {
  setFiles: (updater) => setFiles(updater), // ✅ 正确
  setFiles: setFiles, // ❌ 错误：类型不匹配
})
```

### 3. 依赖管理

```typescript
// useCallback 的依赖应该包含所有引用的变量
const sendMessage = useCallback(async () => {
  // ...
}, [text, files, assistant, topic]) // ✅ 完整的依赖
```

---

## 🎉 重构收益

1. **代码复用**：通用 hooks 可在多处使用
2. **易于测试**：每个 hook 可独立测试
3. **逻辑清晰**：职责分离，易于理解
4. **易于维护**：修改影响范围小
5. **类型安全**：完整的 TypeScript 支持

---

## 📚 参考

- [useInputText.ts](../../../hooks/useInputText.ts)
- [useTextareaResize.ts](../../../hooks/useTextareaResize.ts)
- [useKeyboardHandler.ts](../../../hooks/useKeyboardHandler.ts)
- [usePasteHandler.ts](./hooks/usePasteHandler.ts)
- [useFileDragDrop.ts](./hooks/useFileDragDrop.ts)
- [InputbarCore.tsx](./components/InputbarCore.tsx)
