import { classNames } from '@renderer/utils'
import type { TextAreaRef } from 'antd/es/input/TextArea'
import TextArea from 'antd/es/input/TextArea'
import type { CSSProperties, FC } from 'react'
import React from 'react'
import styled from 'styled-components'

import NarrowLayout from '../../Messages/NarrowLayout'

export interface InputbarCoreProps {
  // Text management
  text: string
  onTextChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void
  placeholder?: string

  // Textarea ref and resize
  textareaRef: React.RefObject<TextAreaRef>
  textareaHeight?: number

  // Event handlers
  onKeyDown?: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void
  onPaste?: (e: React.ClipboardEvent<HTMLTextAreaElement>) => void
  onFocus?: () => void
  onBlur?: () => void

  // Drag & drop (optional)
  onDragEnter?: (e: React.DragEvent<HTMLDivElement>) => void
  onDragLeave?: (e: React.DragEvent<HTMLDivElement>) => void
  onDragOver?: (e: React.DragEvent<HTMLDivElement>) => void
  onDrop?: (e: React.DragEvent<HTMLDivElement>) => void
  isDragging?: boolean

  // Toolbar sections
  leftToolbar?: React.ReactNode
  rightToolbar?: React.ReactNode

  // Preview sections (attachments, mentions, etc.)
  topContent?: React.ReactNode

  // QuickPanel integration (optional)
  quickPanel?: React.ReactNode

  // Drag handle (optional)
  dragHandle?: React.ReactNode

  // Styling
  fontSize?: number
  enableSpellCheck?: boolean
  disabled?: boolean
  className?: string
  isExpanded?: boolean

  // Textarea autoSize
  autoSize?: boolean | { minRows?: number; maxRows?: number }
}

const TextareaStyle: CSSProperties = {
  paddingLeft: 0,
  padding: '6px 15px 0px'
}

/**
 * InputbarCore - 核心输入栏组件
 *
 * 提供基础的文本输入、工具栏、拖拽等功能的 UI 框架
 * 业务逻辑通过 props 注入，保持组件纯粹
 *
 * @example
 * ```tsx
 * <InputbarCore
 *   text={text}
 *   onTextChange={(e) => setText(e.target.value)}
 *   textareaRef={textareaRef}
 *   textareaHeight={customHeight}
 *   onKeyDown={handleKeyDown}
 *   onPaste={handlePaste}
 *   topContent={<AttachmentPreview files={files} />}
 *   leftToolbar={<InputbarTools />}
 *   rightToolbar={<SendMessageButton />}
 *   quickPanel={<QuickPanelView />}
 *   fontSize={14}
 *   enableSpellCheck={true}
 * />
 * ```
 */
export const InputbarCore: FC<InputbarCoreProps> = ({
  text,
  onTextChange,
  placeholder,
  textareaRef,
  textareaHeight,
  onKeyDown,
  onPaste,
  onFocus,
  onBlur,
  onDragEnter,
  onDragLeave,
  onDragOver,
  onDrop,
  isDragging,
  leftToolbar,
  rightToolbar,
  topContent,
  quickPanel,
  dragHandle,
  fontSize,
  enableSpellCheck,
  disabled,
  className,
  isExpanded,
  autoSize = { minRows: 2, maxRows: 20 }
}) => {
  return (
    <NarrowLayout style={{ width: '100%' }}>
      <Container
        onDragEnter={onDragEnter}
        onDragLeave={onDragLeave}
        onDragOver={onDragOver}
        onDrop={onDrop}
        className={classNames('inputbar', className)}>
        {quickPanel}

        <InputBarContainer
          id="inputbar"
          className={classNames('inputbar-container', isDragging && 'file-dragging', isExpanded && 'expanded')}>
          {dragHandle}

          {topContent}

          <Textarea
            ref={textareaRef}
            value={text}
            onChange={onTextChange}
            onKeyDown={onKeyDown}
            onPaste={onPaste}
            onFocus={onFocus}
            onBlur={onBlur}
            placeholder={placeholder}
            autoFocus
            variant="borderless"
            spellCheck={enableSpellCheck}
            rows={2}
            autoSize={textareaHeight ? false : autoSize}
            styles={{ textarea: TextareaStyle }}
            style={{
              fontSize,
              height: textareaHeight,
              minHeight: '30px'
            }}
            disabled={disabled}
          />

          <BottomBar>
            <LeftSection>{leftToolbar}</LeftSection>
            <RightSection>{rightToolbar}</RightSection>
          </BottomBar>
        </InputBarContainer>
      </Container>
    </NarrowLayout>
  )
}

// Styled Components

const Container = styled.div`
  display: flex;
  flex-direction: column;
  position: relative;
  z-index: 2;
  padding: 0 18px 18px 18px;
  [navbar-position='top'] & {
    padding: 0 18px 10px 18px;
  }
`

const InputBarContainer = styled.div`
  border: 0.5px solid var(--color-border);
  transition: all 0.2s ease;
  position: relative;
  border-radius: 17px;
  padding-top: 8px;
  background-color: var(--color-background-opacity);

  &.file-dragging {
    border: 2px dashed #2ecc71;

    &::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-color: rgba(46, 204, 113, 0.03);
      border-radius: 14px;
      z-index: 5;
      pointer-events: none;
    }
  }
`

const Textarea = styled(TextArea)`
  padding: 0;
  border-radius: 0;
  display: flex;
  resize: none !important;
  overflow: auto;
  width: 100%;
  box-sizing: border-box;
  transition: none !important;
  &.ant-input {
    line-height: 1.4;
  }
  &::-webkit-scrollbar {
    width: 3px;
  }
`

const BottomBar = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  padding: 5px 8px;
  height: 40px;
  gap: 16px;
  position: relative;
  z-index: 2;
  flex-shrink: 0;
`

const LeftSection = styled.div`
  display: flex;
  align-items: center;
  flex: 1;
  min-width: 0;
`

const RightSection = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 6px;
`
