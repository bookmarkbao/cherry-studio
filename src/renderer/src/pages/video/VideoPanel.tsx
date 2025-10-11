import { Button, Skeleton, Textarea } from '@heroui/react'
import { loggerService } from '@logger'
import { useAddOpenAIVideo } from '@renderer/hooks/video/useOpenAIVideos'
import { createVideo } from '@renderer/services/ApiService'
import { Provider } from '@renderer/types'
import { Video } from '@renderer/types/video'
import { getErrorMessage } from '@renderer/utils'
import { ArrowUp } from 'lucide-react'
import { useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { VideoViewer } from './VideoViewer'

export type VideoPanelProps = {
  provider: Provider
  video?: Video
}

const logger = loggerService.withContext('VideoPanel')

export const VideoPanel = ({ provider, video }: VideoPanelProps) => {
  const { t } = useTranslation()
  const [prompt, setPrompt] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const addOpenAIVideo = useAddOpenAIVideo(provider.id)

  const handleCreateVideo = useCallback(async () => {
    if (isProcessing) return
    setIsProcessing(true)
    try {
      const result = await createVideo({
        type: 'openai',
        params: {
          prompt
        },
        provider
      })
      const video = result.video
      switch (result.type) {
        case 'openai':
          addOpenAIVideo(video)
          break
        default:
          logger.error(`Invalid video type ${result.type}.`)
      }
    } catch (e) {
      window.toast.error({ title: t('video.error.create'), description: getErrorMessage(e), timeout: 5000 })
    } finally {
      setIsProcessing(false)
    }
  }, [addOpenAIVideo, isProcessing, prompt, provider, t])

  return (
    <div className="flex flex-1 flex-col p-2">
      <div className="m-8 flex-1">
        <Skeleton className="h-full w-full rounded-2xl" classNames={{ content: 'h-full w-full' }} isLoaded={true}>
          <VideoViewer video={video} />
        </Skeleton>
      </div>
      <div className="relative">
        <Textarea
          label={t('common.prompt')}
          placeholder={t('video.prompt.placeholder')}
          value={prompt}
          onValueChange={setPrompt}
          isClearable
          isDisabled={isProcessing}
          classNames={{ inputWrapper: 'pb-8' }}
          onKeyDown={(e: React.KeyboardEvent) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              handleCreateVideo()
            }
          }}
        />
        <Button
          color="primary"
          radius="full"
          isIconOnly
          isLoading={isProcessing}
          className="absolute right-2 bottom-2 h-6 w-6 min-w-0">
          <ArrowUp size={16} className="text-primary-foreground" />
        </Button>
      </div>
    </div>
  )
}
