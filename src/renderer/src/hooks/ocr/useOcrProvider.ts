import { useMutation, useQuery } from '@data/hooks/useDataApi'
import type { OcrProviderConfig } from '@renderer/types'
import { getErrorMessage } from '@renderer/utils'
import type { ConcreteApiPaths } from '@shared/data/api'
import { useCallback } from 'react'
import { useTranslation } from 'react-i18next'

// const logger = loggerService.withContext('useOcrProvider')

export const useOcrProvider = (id: string) => {
  const { t } = useTranslation()

  const path: ConcreteApiPaths = `/ocr/providers/${id}`
  const { data: provider, loading, error } = useQuery(path, undefined)
  const { mutate, loading: mutating } = useMutation('PATCH', path)

  const updateConfig = useCallback(
    async (update: Partial<OcrProviderConfig>) => {
      try {
        await mutate({ body: update })
      } catch (e) {
        window.toast.error({ title: t('ocr.provider.config.patch.error.failed'), description: getErrorMessage(e) })
      }
    },
    [mutate, t]
  )

  return {
    provider,
    loading,
    mutating,
    error,
    updateConfig
  }
}
