import { Button, Skeleton, Textarea } from '@heroui/react'
import { loggerService } from '@logger'
import { useAddOpenAIVideo } from '@renderer/hooks/video/useOpenAIVideos'
import { createVideo } from '@renderer/services/ApiService'
import { Provider } from '@renderer/types'
import { ArrowUp } from 'lucide-react'
import { useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { Video } from './Video'

export type VideoPanelProps = {
  provider: Provider
}

const logger = loggerService.withContext('VideoPanel')

export const VideoPanel = ({ provider }: VideoPanelProps) => {
  const { t } = useTranslation()
  const [prompt, setPrompt] = useState('')
  const addOpenAIVideo = useAddOpenAIVideo(provider.id)
  // TODO: get video job from api
  const video = { success: false, data: undefined }

  const sendRequest = useCallback(async () => {
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
  }, [addOpenAIVideo, prompt, provider])

  return (
    <div className="flex flex-1 flex-col p-2">
      <div className="m-8 flex-1">
        <Skeleton className="h-full w-full rounded-2xl" classNames={{ content: 'h-full w-full' }} isLoaded={true}>
          <Video video={video.data} />
        </Skeleton>
      </div>
      <div className="relative">
        <Textarea
          label={t('common.prompt')}
          placeholder={t('video.prompt.placeholder')}
          value={prompt}
          onValueChange={setPrompt}
          isClearable
          classNames={{ inputWrapper: 'pb-8' }}
          onKeyDown={(e: React.KeyboardEvent) => {
            if (e.key === 'Enter') {
              e.stopPropagation()
              sendRequest()
            }
          }}
        />
        <Button
          color="primary"
          radius="full"
          startContent={<ArrowUp size={16} className="text-primary-foreground" />}
          isIconOnly
          className="absolute right-1 bottom-1 h-6 w-6 min-w-0"
        />
      </div>
    </div>
  )
}
