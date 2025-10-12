import { retrieveVideo } from '@renderer/services/ApiService'
import { SystemProviderIds } from '@renderer/types'
import useSWR, { useSWRConfig } from 'swr'

import { useProvider } from '../useProvider'

export const useOpenAIVideo = (id: string) => {
  const { provider: openai } = useProvider(SystemProviderIds.openai)
  const fetcher = async () => {
    return retrieveVideo({
      type: 'openai',
      videoId: id,
      provider: openai
    })
  }
  const { data, isLoading, error } = useSWR(`video/openai/${id}`, fetcher, {
    revalidateOnFocus: false,
    revalidateOnMount: true
  })
  const { mutate } = useSWRConfig()
  const revalidate = () => mutate(`video/openai/${id}`)
  return {
    video: data,
    isLoading,
    error,
    revalidate
  }
}
