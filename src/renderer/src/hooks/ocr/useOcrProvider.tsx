import { loggerService } from '@logger'
import { updateOcrProviderConfig } from '@renderer/store/ocr'
import type { OcrProviderConfig } from '@renderer/types'
import { isBuiltinOcrProviderId } from '@renderer/types'
import { BUILTIN_OCR_PROVIDERS_MAP } from '@shared/config/ocr'
import { useTranslation } from 'react-i18next'
import { useDispatch } from 'react-redux'

import { useOcrProviders } from './useOcrProviders'

const logger = loggerService.withContext('useOcrProvider')

export const useOcrProvider = (id: string) => {
  const { t } = useTranslation()
  const dispatch = useDispatch()
  const { providers, addProvider } = useOcrProviders()
  let provider = providers.find((p) => p.id === id)

  // safely fallback
  if (!provider) {
    logger.error(`Ocr Provider ${id} not found`)
    window.toast.error(t('ocr.error.provider.not_found'))
    if (isBuiltinOcrProviderId(id)) {
      try {
        addProvider(BUILTIN_OCR_PROVIDERS_MAP[id])
      } catch (e) {
        logger.warn(`Add ${BUILTIN_OCR_PROVIDERS_MAP[id].name} failed. Just use temp provider from config.`)
        window.toast.warning(t('ocr.warning.provider.fallback', { name: BUILTIN_OCR_PROVIDERS_MAP[id].name }))
      } finally {
        provider = BUILTIN_OCR_PROVIDERS_MAP[id]
      }
    } else {
      logger.warn(`Fallback to tesseract`)
      window.toast.warning(t('ocr.warning.provider.fallback', { name: 'Tesseract' }))
      provider = BUILTIN_OCR_PROVIDERS_MAP.tesseract
    }
  }

  const updateConfig = (update: Partial<OcrProviderConfig>) => {
    dispatch(updateOcrProviderConfig({ id: provider.id, update }))
  }

  return {
    provider,
    updateConfig
  }
}
