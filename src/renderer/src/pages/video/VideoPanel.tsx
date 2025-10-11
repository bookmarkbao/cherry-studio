import { Button, Skeleton, Textarea } from '@heroui/react'
import { ArrowUp } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import { Video } from './Video'

export const VideoPanel = () => {
  const { t } = useTranslation()
  const [prompt, setPrompt] = useState('')
  // TODO: get video job from api
  const video = { success: false, data: undefined }
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
