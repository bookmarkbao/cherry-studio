/**
 * @deprecated 此组件使用频率仅为 2 次，不符合 UI 库提取标准（需 ≥3 次）
 * 计划在未来版本中移除。且此组件依赖 antd 和 styled-components，与项目迁移方向不符。
 *
 * This component has only 2 usages and does not meet the UI library extraction criteria (requires ≥3 usages).
 * Planned for removal in future versions. Also depends on antd and styled-components, which conflicts with the migration direction.
 */

// Original path: src/renderer/src/components/EditableNumber/index.tsx
import { InputNumber } from 'antd'
import type { FC } from 'react'
import { useEffect, useRef, useState } from 'react'
import styled from 'styled-components'

export interface EditableNumberProps {
  value?: number | null
  min?: number
  max?: number
  step?: number
  precision?: number
  placeholder?: string
  disabled?: boolean
  changeOnBlur?: boolean
  onChange?: (value: number | null) => void
  onBlur?: () => void
  style?: React.CSSProperties
  className?: string
  size?: 'small' | 'middle' | 'large'
  suffix?: string
  prefix?: string
  align?: 'start' | 'center' | 'end'
}

const EditableNumber: FC<EditableNumberProps> = ({
  value,
  min,
  max,
  step = 0.01,
  precision,
  placeholder,
  disabled = false,
  onChange,
  onBlur,
  changeOnBlur = false,
  style,
  className,
  size = 'middle',
  align = 'end'
}) => {
  const [isEditing, setIsEditing] = useState(false)
  const [inputValue, setInputValue] = useState(value)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setInputValue(value)
  }, [value])

  const handleFocus = () => {
    if (disabled) return
    setIsEditing(true)
  }

  const handleInputChange = (newValue: number | null) => {
    onChange?.(newValue ?? null)
  }

  const handleBlur = () => {
    setIsEditing(false)
    onBlur?.()
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleBlur()
    } else if (e.key === 'Escape') {
      e.stopPropagation()
      setInputValue(value)
      setIsEditing(false)
    }
  }

  return (
    <Container>
      <InputNumber
        style={{ ...style, opacity: isEditing ? 1 : 0 }}
        ref={inputRef}
        value={inputValue}
        min={min}
        max={max}
        step={step}
        precision={precision}
        size={size}
        onChange={handleInputChange}
        onBlur={handleBlur}
        onFocus={handleFocus}
        onKeyDown={handleKeyDown}
        className={className}
        controls={isEditing}
        changeOnBlur={changeOnBlur}
      />
      <DisplayText style={style} className={className} $align={align} $isEditing={isEditing}>
        {value ?? placeholder}
      </DisplayText>
    </Container>
  )
}

const Container = styled.div`
  display: inline-block;
  position: relative;
`

const DisplayText = styled.div<{
  $align: 'start' | 'center' | 'end'
  $isEditing: boolean
}>`
  position: absolute;
  inset: 0;
  display: ${({ $isEditing }) => ($isEditing ? 'none' : 'flex')};
  align-items: center;
  justify-content: ${({ $align }) => $align};
  pointer-events: none;
`

export default EditableNumber
