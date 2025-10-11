import { Button, cn, Image, Skeleton, Textarea, Tooltip } from '@heroui/react'
import { loggerService } from '@logger'
import { useAddOpenAIVideo } from '@renderer/hooks/video/useAddOpenAIVideo'
import { createVideo } from '@renderer/services/ApiService'
import { Provider } from '@renderer/types'
import { CreateVideoParams, Video } from '@renderer/types/video'
import { getErrorMessage } from '@renderer/utils'
import { MB } from '@shared/config/constant'
import { DeepPartial } from 'ai'
import { isEmpty } from 'lodash'
import { ArrowUp, CircleXIcon, ImageIcon } from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { VideoViewer } from './VideoViewer'

export type VideoPanelProps = {
  provider: Provider
  video?: Video
  params: CreateVideoParams
  updateParams: (upadte: DeepPartial<Omit<CreateVideoParams, 'type'>>) => void
}

const logger = loggerService.withContext('VideoPanel')

export const VideoPanel = ({ provider, video, params, updateParams }: VideoPanelProps) => {
  const { t } = useTranslation()
  const addOpenAIVideo = useAddOpenAIVideo(provider.id)

  const [isProcessing, setIsProcessing] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const inputReference = params.params.input_reference

  const couldCreateVideo = useMemo(
    () => !isProcessing && !isEmpty(params.params.prompt),
    [isProcessing, params.params.prompt]
  )

  useEffect(() => {
    if (video) {
      updateParams({ params: { prompt: video.prompt } })
    }
  }, [updateParams, video])

  const handleCreateVideo = useCallback(async () => {
    if (!couldCreateVideo) return
    setIsProcessing(true)
    try {
      const result = await createVideo(params)
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
  }, [addOpenAIVideo, couldCreateVideo, params, t])

  const handleUploadFile = useCallback(() => {
    fileInputRef.current?.click()
  }, [])

  const setPrompt = useCallback((value: string) => updateParams({ params: { prompt: value } }), [updateParams])

  const UploadImageReferenceButton = useCallback(() => {
    const content = inputReference ? (
      <div className="group">
        <Image
          className="aspect-square max-h-50 max-w-50 object-contain"
          src={URL.createObjectURL(inputReference as File)}
        />
        <Button
          variant="light"
          color="danger"
          className="absolute top-1 right-1 z-100 h-6 w-6 min-w-0 opacity-0 group-hover:opacity-100"
          isIconOnly
          startContent={<CircleXIcon size={16} className="text-danger" />}
          onPress={() => updateParams({ params: { input_reference: undefined } })}
        />
      </div>
    ) : (
      t('video.input_reference.add.tooltip')
    )
    return (
      <>
        <Tooltip content={content} closeDelay={0}>
          <Button
            variant="light"
            startContent={<ImageIcon size={16} className={cn(inputReference ? 'text-primary' : undefined)} />}
            isIconOnly
            className="h-6 w-6 min-w-0"
            isDisabled={isProcessing}
            onPress={handleUploadFile}
          />
        </Tooltip>
      </>
    )
  }, [handleUploadFile, isProcessing, inputReference, t, updateParams])

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
          value={params.params.prompt}
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
        <div className="absolute bottom-0 flex w-full items-end justify-between p-2">
          <div className="flex">
            <UploadImageReferenceButton />
            <input
              ref={fileInputRef}
              type="file"
              hidden
              onChange={(e) => {
                const files = e.target.files
                if (files && files.length > 0) {
                  const file = files[0]
                  if (!file.type.startsWith('image/')) {
                    window.toast.error(t('video.input_reference.add.error.format'))
                    return
                  }
                  const maxSize = 5 * MB
                  if (file.size > maxSize) {
                    window.toast.error(t('video.input_reference.add.error.size'))
                    return
                  }
                  updateParams({ params: { input_reference: file } })
                } else {
                  updateParams({ params: { input_reference: undefined } })
                }
              }}
            />
          </div>

          <Tooltip content={t('common.send')} closeDelay={0}>
            <Button
              color="primary"
              radius="full"
              isIconOnly
              isDisabled={!couldCreateVideo}
              isLoading={isProcessing}
              className="h-6 w-6 min-w-0"
              onPress={handleCreateVideo}>
              <ArrowUp size={16} className="text-primary-foreground" />
            </Button>
          </Tooltip>
        </div>
      </div>
    </div>
  )
}
