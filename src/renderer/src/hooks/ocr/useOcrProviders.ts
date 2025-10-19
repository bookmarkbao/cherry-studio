import { useQuery } from '@data/hooks/useDataApi'
import { getBuiltinOcrProviderLabel } from '@renderer/i18n/label'
import type { OcrProvider } from '@renderer/types'
import { isBuiltinOcrProvider } from '@renderer/types'
import { BUILTIN_OCR_PROVIDERS } from '@shared/config/ocr'
import { useMemo } from 'react'

export const useOcrProviders = () => {
  const { data: validProviderIds, loading, error } = useQuery('/ocr/providers')
  const providers = useMemo(
    () => BUILTIN_OCR_PROVIDERS.filter((p) => validProviderIds?.includes(p.id)),
    [validProviderIds]
  )

  const getOcrProviderName = (p: OcrProvider) => {
    return isBuiltinOcrProvider(p) ? getBuiltinOcrProviderLabel(p.id) : p.name
  }

  return {
    providers,
    loading,
    error,
    getOcrProviderName
  }
}
