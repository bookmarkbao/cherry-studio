import { usePreference } from '@data/hooks/usePreference'
import type { ImageOcrProvider } from '@renderer/types'
import { isImageOcrProvider } from '@renderer/types'
import { useMemo } from 'react'

import { useOcrProviders } from './useOcrProviders'

export const useOcrImageProvider = () => {
  const { providers, loading, error } = useOcrProviders()
  const imageProviders: ImageOcrProvider[] | undefined = providers?.filter((p) => isImageOcrProvider(p))
  const [imageProviderId, setImageProviderId] = usePreference('ocr.settings.image_provider_id')
  const imageProvider = useMemo(() => {
    return imageProviders?.find((p) => p.id === imageProviderId)
  }, [imageProviderId, imageProviders])
  return { imageProvider, loading, error, imageProviderId, setImageProviderId }
}
