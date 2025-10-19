// import { loggerService } from '@logger'
import { Avatar, Flex } from '@cherrystudio/ui'
import IntelLogo from '@renderer/assets/images/providers/intel.png'
import PaddleocrLogo from '@renderer/assets/images/providers/paddleocr.png'
import TesseractLogo from '@renderer/assets/images/providers/Tesseract.js.png'
import { ErrorBoundary } from '@renderer/components/ErrorBoundary'
import { isMac, isWin } from '@renderer/config/constant'
import { useTheme } from '@renderer/context/ThemeProvider'
import { useOcrProviders } from '@renderer/hooks/ocr/useOcrProviders'
import type { OcrProvider } from '@renderer/types'
import { isBuiltinOcrProvider, isOcrSystemProvider } from '@renderer/types'
import { Divider } from 'antd'
import { FileQuestionMarkIcon, MonitorIcon } from 'lucide-react'
import styled from 'styled-components'

import { SettingGroup, SettingTitle } from '..'
import { OcrOVSettings } from './OcrOVSettings'
import { OcrPpocrSettings } from './OcrPpocrSettings'
import { OcrSystemSettings } from './OcrSystemSettings'
import { OcrTesseractSettings } from './OcrTesseractSettings'

// const logger = loggerService.withContext('OcrTesseractSettings')

type Props = {
  provider: OcrProvider | undefined
}

const OcrProviderSettings = ({ provider }: Props) => {
  const { theme: themeMode } = useTheme()
  const { getOcrProviderName } = useOcrProviders()

  if (!provider || (!isWin && !isMac && isOcrSystemProvider(provider))) {
    return null
  }

  const ProviderSettings = () => {
    if (isBuiltinOcrProvider(provider)) {
      switch (provider.id) {
        case 'tesseract':
          return <OcrTesseractSettings />
        case 'system':
          return <OcrSystemSettings />
        case 'paddleocr':
          return <OcrPpocrSettings />
        case 'ovocr':
          return <OcrOVSettings />
        default:
          return null
      }
    } else {
      throw new Error('Not supported OCR provider')
    }
  }

  return (
    <SettingGroup theme={themeMode}>
      <SettingTitle>
        <Flex className="items-center gap-2">
          <OcrProviderLogo provider={provider} />
          <ProviderName> {getOcrProviderName(provider)}</ProviderName>
        </Flex>
      </SettingTitle>
      <Divider style={{ width: '100%', margin: '10px 0' }} />
      <ErrorBoundary>
        <ProviderSettings />
      </ErrorBoundary>
    </SettingGroup>
  )
}

const ProviderName = styled.span`
  font-size: 14px;
  font-weight: 500;
`

const OcrProviderLogo = ({ provider: p, size = 14 }: { provider: OcrProvider; size?: number }) => {
  if (isBuiltinOcrProvider(p)) {
    switch (p.id) {
      case 'tesseract':
        return <Avatar src={TesseractLogo} style={{ width: size, height: size }} />
      case 'system':
        return <MonitorIcon size={size} />
      case 'paddleocr':
        return <Avatar src={PaddleocrLogo} style={{ width: size, height: size }} />
      case 'ovocr':
        return <Avatar src={IntelLogo} style={{ width: size, height: size }} />
    }
  }
  return <FileQuestionMarkIcon size={size} />
}

export default OcrProviderSettings
