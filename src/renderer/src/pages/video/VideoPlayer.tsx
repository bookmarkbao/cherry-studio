import { Progress, Radio, RadioGroup, Spinner } from '@heroui/react'
import { Video, VideoStatus } from '@renderer/types/video'
import { CheckCircleIcon, CircleXIcon } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'

export interface VideoProps {
  video?: Video
}

export const VideoPlayer = ({ video: _video }: VideoProps) => {
  const { t } = useTranslation()
  const [video, setVideo] = useState<Video | undefined>(_video)
  return (
    <div className="flex h-full w-full items-center justify-center rounded-2xl bg-foreground-200">
      {/* For test */}
      <RadioGroup
        label="Status"
        onValueChange={(v) => {
          if (v) setVideo({ ...video, status: v as VideoStatus } as Video)
          else setVideo(undefined)
        }}>
        <Radio value="undefined">undefined</Radio>
        <Radio value="queued">queued</Radio>
        <Radio value="in_progress">in_progress</Radio>
        <Radio value="completed">completed</Radio>
        <Radio value="downloading">downloading</Radio>
        <Radio value="downloaded">downloaded</Radio>
        <Radio value="failed">failed</Radio>
      </RadioGroup>
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
        <div className="flex h-full w-full flex-col items-center justify-center rounded-2xl bg-success-100">
          <CheckCircleIcon size={64} className="fill-success text-success-100" />
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
      {/* TODO: complete video widget */}
      {video && video.status === 'downloaded' && <video></video>}
      {video && video.status === 'failed' && (
        <div className="flex h-full w-full flex-col items-center justify-center rounded-2xl bg-danger-100">
          <CircleXIcon size={64} className="fill-danger text-danger-100" />
          <span className="font-bold text-2xl">{t('video.status.failed')}</span>
        </div>
      )}
    </div>
  )
}
