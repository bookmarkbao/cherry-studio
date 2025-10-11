import { Button, Progress, Radio, RadioGroup, Spinner } from '@heroui/react'
import { Video, VideoStatus } from '@renderer/types/video'
import { CheckCircleIcon, CircleXIcon } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'

export interface VideoProps {
  video?: Video
}

export const VideoViewer = ({ video: _video }: VideoProps) => {
  const { t } = useTranslation()
  const [video, setVideo] = useState<Video | undefined>(_video)
  const [loadSuccess, setLoadSuccess] = useState<boolean | undefined>(undefined)
  return (
    <>
      {/* For test */}
      <RadioGroup
        label="Status"
        value={video?.status}
        onValueChange={(v) => {
          if (v !== 'undefined') setVideo({ ..._video, status: v as VideoStatus, progress: 60 } as Video)
          else setVideo(undefined)
        }}
        orientation="horizontal"
        className="absolute z-100 rounded-2xl bg-foreground-100 p-4">
        <Radio value="undefined">undefined</Radio>
        <Radio value="queued">queued</Radio>
        <Radio value="in_progress">in_progress</Radio>
        <Radio value="completed">completed</Radio>
        <Radio value="downloading">downloading</Radio>
        <Radio value="downloaded">downloaded</Radio>
        <Radio value="failed">failed</Radio>
      </RadioGroup>
      <div className="flex h-full w-full items-center justify-center rounded-2xl bg-foreground-200">
        {video === undefined && t('video.undefined')}
        {video && video.status === 'queued' && (
          <div className="flex h-full w-full flex-col items-center justify-center rounded-2xl">
            <Spinner variant="dots" />
            <span>{t('video.status.queued')}</span>
          </div>
        )}
        {video && video.status === 'in_progress' && (
          <div className="flex h-full w-full flex-col items-center justify-center rounded-2xl">
            <Progress
              label={t('video.status.in_progress')}
              aria-label={t('video.status.in_progress')}
              className="max-w-md"
              color="primary"
              showValueLabel={true}
              size="md"
              value={video.progress}
            />
          </div>
        )}
        {video && video.status === 'completed' && (
          <div className="flex h-full w-full flex-col items-center justify-center rounded-2xl bg-success-200">
            <CheckCircleIcon size={64} className="text-success" />
            <span className="font-bold text-2xl">{t('video.status.completed')}</span>
          </div>
        )}
        {video && video.status === 'downloading' && (
          <div className="flex h-full w-full flex-col items-center justify-center rounded-2xl">
            <Progress
              label={t('video.status.downloading')}
              aria-label={t('video.status.downloading')}
              className="max-w-md"
              color="primary"
              showValueLabel={true}
              size="md"
              value={video.progress}
            />
          </div>
        )}
        {video && video.status === 'downloaded' && loadSuccess !== false && (
          <video
            controls
            className="h-full w-full"
            onLoadedData={() => setLoadSuccess(true)}
            onError={() => setLoadSuccess(false)}>
            <source src="video.mp4" type="video/mp4" />
          </video>
        )}
        {video && video.status === 'failed' && (
          <div className="flex h-full w-full flex-col items-center justify-center rounded-2xl bg-danger-200">
            <CircleXIcon size={64} className="fill-danger text-danger-200" />
            <span className="font-bold text-2xl">{t('video.status.failed')}</span>
            <div className="my-2 flex justify-between gap-2">
              <Button onPress={() => window.toast.info('Not implemented')}>{t('common.detail')}</Button>
              <Button onPress={() => window.toast.info('Not implemented')}>{t('common.retry')}</Button>
            </div>
          </div>
        )}
        {video && video.status === 'downloaded' && loadSuccess === false && (
          <div className="flex h-full w-full flex-col items-center justify-center rounded-2xl bg-danger-200">
            <CircleXIcon size={64} className="fill-danger text-danger-200" />
            <span className="font-bold text-2xl">{t('video.error.load.message')}</span>
            <span>{t('video.error.load.reason')}</span>
            <div className="my-2 flex justify-between gap-2">
              <Button onPress={() => window.toast.info('Not implemented')}>{t('common.redownload')}</Button>
            </div>
          </div>
        )}
      </div>
    </>
  )
}
