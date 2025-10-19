import { usePreference } from '@data/hooks/usePreference'
import { loggerService } from '@logger'
import type {
  BuiltinOcrProviderId,
  OcrOvConfig,
  OcrOvProvider,
  OcrPpocrConfig,
  OcrPpocrProvider,
  OcrSystemConfig,
  OcrSystemProvider,
  OcrTesseractConfig,
  OcrTesseractProvider
} from '@renderer/types'
import { BUILTIN_OCR_PROVIDERS_MAP } from '@shared/config/ocr'
import { merge } from 'lodash'
import { useCallback, useMemo } from 'react'

const logger = loggerService.withContext('useOcrProvider')

const PROVIDER_REGISTRY = {
  ovocr: null as unknown as OcrOvProvider,
  paddleocr: null as unknown as OcrPpocrProvider,
  system: null as unknown as OcrSystemProvider,
  tesseract: null as unknown as OcrTesseractProvider
}

const CONFIG_REGISTRY = {
  ovocr: null as unknown as OcrOvConfig,
  paddleocr: null as unknown as OcrPpocrConfig,
  system: null as unknown as OcrSystemConfig,
  tesseract: null as unknown as OcrTesseractConfig
} as const

type ProviderMap = typeof PROVIDER_REGISTRY

type ConfigMap = typeof CONFIG_REGISTRY

type TProvider<T extends BuiltinOcrProviderId> = ProviderMap[T]

type TConfig<T extends BuiltinOcrProviderId> = ConfigMap[T]

type UseOcrProviderReturn<T extends BuiltinOcrProviderId> = {
  provider: TProvider<T>
  config: TConfig<T>
  updateConfig: (update: Partial<TConfig<T>>) => void
}

export const useOcrProvider = <T extends BuiltinOcrProviderId>(id: T): UseOcrProviderReturn<T> => {
  const provider = useMemo(() => {
    switch (id) {
      case 'ovocr':
        return BUILTIN_OCR_PROVIDERS_MAP.ovocr
      case 'paddleocr':
        return BUILTIN_OCR_PROVIDERS_MAP.paddleocr
      case 'system':
        return BUILTIN_OCR_PROVIDERS_MAP.system
      case 'tesseract':
        return BUILTIN_OCR_PROVIDERS_MAP.tesseract
    }
  }, [id])
  const [ovConfig, setOvConfig] = usePreference('ocr.provider.config.ovocr')
  const [ppConfig, setPpConfig] = usePreference('ocr.provider.config.paddleocr')
  const [sysConfig, setSysConfig] = usePreference('ocr.provider.config.system')
  const [tesConfig, setTesConfig] = usePreference('ocr.provider.config.tesseract')

  const config = useMemo(() => {
    switch (id) {
      case 'ovocr':
        return ovConfig
      case 'paddleocr':
        return ppConfig
      case 'system':
        return sysConfig
      case 'tesseract':
        return tesConfig
    }
  }, [id, ovConfig, ppConfig, sysConfig, tesConfig])

  const updateConfig = useCallback(
    (update: Partial<TConfig<T>>) => {
      switch (id) {
        case 'ovocr':
          setOvConfig(merge({}, ovConfig, update))
          break
        case 'paddleocr':
          setPpConfig(merge({}, ppConfig, update))
          break
        case 'system':
          setSysConfig(merge({}, sysConfig, update))
          break
        case 'tesseract':
          setTesConfig(merge({}, tesConfig, update))
          break
        default:
          logger.warn(`Unsupported OCR provider id: ${id}`)
      }
    },
    [id, ovConfig, ppConfig, setOvConfig, setPpConfig, setSysConfig, setTesConfig, sysConfig, tesConfig]
  )

  return {
    provider,
    config,
    updateConfig
  } as UseOcrProviderReturn<T>
}
