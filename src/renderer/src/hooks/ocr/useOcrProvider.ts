import { loggerService } from '@logger'
import { updateOcrProviderConfig } from '@renderer/store/ocr'
import type { OcrProviderConfig } from '@renderer/types'
import { BUILTIN_OCR_PROVIDERS_MAP } from '@shared/config/ocr'
import { useTranslation } from 'react-i18next'
import { useDispatch } from 'react-redux'

import { useOcrProviders } from './useOcrProviders'

const logger = loggerService.withContext('useOcrProvider')

export const useOcrProvider = (id: string) => {
  const { t } = useTranslation()
  const dispatch = useDispatch()
  const { providers } = useOcrProviders()
  let provider = providers.find((p) => p.id === id)

  // safely fallback
  if (!provider) {
    logger.error(`Ocr Provider ${id} not found`)
    logger.warn(`Fallback to tesseract`)
    window.toast.error(t('ocr.error.provider.not_found'))
    window.toast.warning(t('ocr.warning.provider.fallback', { name: 'Tesseract' }))
    provider = BUILTIN_OCR_PROVIDERS_MAP.tesseract
  }

  const updateConfig = (update: Partial<OcrProviderConfig>) => {
    dispatch(updateOcrProviderConfig({ id: provider.id, update }))
  }

  return {
    provider,
    updateConfig
  }
}
