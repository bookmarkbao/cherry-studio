import { retrieveVideo } from '@renderer/services/ApiService'
import { SystemProviderIds } from '@renderer/types'
import { useEffect } from 'react'
import useSWR, { SWRConfiguration, useSWRConfig } from 'swr'

import { useProvider } from '../useProvider'
import { useAddOpenAIVideo } from './useAddOpenAIVideo'
import { useVideo } from './useVideo'
import { useVideos } from './useVideos'

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
  const { updateVideo } = useVideos(providerId)
  const addOpenAIVideo = useAddOpenAIVideo(providerId)
  let options: SWRConfiguration = {}
  switch (video?.status) {
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

  useEffect(() => {
    // update progress
    if (data && data.video.status === 'in_progress' && data.video.progress) {
      if (video) {
        updateVideo({ id: video.id, progress: data.video.progress })
      } else {
        addOpenAIVideo(data.video, 'Prompt lost')
      }
    }
  }, [addOpenAIVideo, data, updateVideo, video])

  return {
    video: data,
    isLoading,
    error,
    revalidate
  }
}
