import { usePreference } from '@data/hooks/usePreference'
import { loggerService } from '@logger'
import { getBuiltinOcrProviderLabel } from '@renderer/i18n/label'
import { useAppSelector } from '@renderer/store'
import { addOcrProvider, removeOcrProvider } from '@renderer/store/ocr'
import type { OcrProvider } from '@renderer/types'
import { isBuiltinOcrProvider, isBuiltinOcrProviderId, isImageOcrProvider } from '@renderer/types'
import { useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useDispatch } from 'react-redux'

const logger = loggerService.withContext('useOcrProviders')

export const useOcrProviders = () => {
  // TODO: migrate to useQuery
  const providers = useAppSelector((state) => state.ocr.providers)
  const imageProviders = providers.filter(isImageOcrProvider)
  const [imageProviderId, setImageProviderId] = usePreference('ocr.settings.image_provider_id')
  const imageProvider = useMemo(() => {
    return imageProviders.find((p) => p.id === imageProviderId)
  }, [imageProviderId, imageProviders])
  const dispatch = useDispatch()
  const { t } = useTranslation()

  /**
   * 添加一个新的OCR服务提供者
   * @param provider - OCR提供者对象，包含id和其他配置信息
   * @throws {Error} 当尝试添加一个已存在ID的提供者时抛出错误
   */
  const addProvider = useCallback(
    (provider: OcrProvider) => {
      if (providers.some((p) => p.id === provider.id)) {
        const msg = `Provider with id ${provider.id} already exists`
        logger.error(msg)
        window.toast.error(t('ocr.error.provider.existing'))
        throw new Error(msg)
      }
      dispatch(addOcrProvider(provider))
    },
    [dispatch, providers, t]
  )

  /**
   * 移除一个OCR服务提供者
   * @param id - 要移除的OCR提供者ID
   * @throws {Error} 当尝试移除一个内置提供商时抛出错误
   */
  const removeProvider = (id: string) => {
    if (isBuiltinOcrProviderId(id)) {
      const msg = `Cannot remove builtin provider ${id}`
      logger.error(msg)
      window.toast.error(t('ocr.error.provider.cannot_remove_builtin'))
      throw new Error(msg)
    }

    dispatch(removeOcrProvider(id))
  }

  const getOcrProviderName = (p: OcrProvider) => {
    return isBuiltinOcrProvider(p) ? getBuiltinOcrProviderLabel(p.id) : p.name
  }

  return {
    providers,
    imageProvider,
    addProvider,
    removeProvider,
    setImageProviderId,
    getOcrProviderName
  }
}
