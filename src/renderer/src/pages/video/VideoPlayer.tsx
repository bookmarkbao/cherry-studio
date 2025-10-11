import { Video } from '@renderer/types/video'
import { CircleXIcon } from 'lucide-react'
import { useTranslation } from 'react-i18next'

export interface VideoProps {
  video?: Video | null
}

export const VideoPlayer = ({ video }: VideoProps) => {
  const { t } = useTranslation()
  return (
    <div className="flex h-full w-full items-center justify-center rounded-2xl bg-foreground-200">
      {/* TODO: complete video widget */}
      {video && <video></video>}
      {video === undefined && t('video.undefined')}
      {video === null && (
        <div className="flex h-full w-full flex-col items-center justify-center rounded-2xl bg-danger-100">
          <CircleXIcon size={64} className="fill-danger text-danger-100" />
          <span className="font-bold text-2xl">{t('video.error.invalid')}</span>
        </div>
      )}
    </div>
  )
}
