import { retrieveVideo } from '@renderer/services/ApiService'
import { SystemProviderIds } from '@renderer/types'
import useSWR, { SWRConfiguration, useSWRConfig } from 'swr'

import { useProvider } from '../useProvider'
import { useVideo } from './useVideo'

export const useOpenAIVideo = (id: string) => {
  const providerId = SystemProviderIds.openai
  const { provider: openai } = useProvider(providerId)
  const fetcher = async () => {
    return retrieveVideo({
      type: 'openai',
      videoId: id,
      provider: openai
    })
  }
  const video = useVideo(providerId, id)
  let options: SWRConfiguration = {}
  switch (video?.status) {
    case 'queued':
    case 'in_progress':
      options = {
        refreshInterval: 3000
      }
      break
    default:
      options = {
        revalidateOnFocus: false,
        revalidateOnMount: true
      }
  }
  const { data, isLoading, error } = useSWR(`video/openai/${id}`, fetcher, options)
  const { mutate } = useSWRConfig()
  const revalidate = () => mutate(`video/openai/${id}`)

  return {
    video: data,
    isLoading,
    error,
    revalidate
  }
}
