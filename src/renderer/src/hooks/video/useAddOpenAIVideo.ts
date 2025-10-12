import OpenAI from '@cherrystudio/openai'
import { useCallback } from 'react'

import { useVideos } from './useVideos'

export const useAddOpenAIVideo = (providerId: string) => {
  const { addVideo } = useVideos(providerId)

  const addOpenAIVideo = useCallback(
    (video: OpenAI.Videos.Video, prompt: string) => {
      switch (video.status) {
        case 'queued':
          addVideo({
            id: video.id,
            status: video.status,
            type: 'openai',
            metadata: video,
            prompt
          })
          break
        case 'in_progress':
          addVideo({
            id: video.id,
            status: 'in_progress',
            type: 'openai',
            progress: video.progress,
            metadata: video,
            prompt
          })
          break
        case 'completed':
          addVideo({
            id: video.id,
            status: 'completed',
            type: 'openai',
            metadata: video,
            prompt,
            thumbnail: null
          })
          break
        case 'failed':
          addVideo({
            id: video.id,
            status: 'failed',
            type: 'openai',
            error: video.error,
            metadata: video,
            prompt
          })
          break
      }
    },
    [addVideo]
  )

  return addOpenAIVideo
}
