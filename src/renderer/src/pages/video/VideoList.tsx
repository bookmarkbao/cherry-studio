import { cn, Progress, Spinner } from '@heroui/react'
import { useVideos } from '@renderer/hooks/video/useVideos'
import { Video } from '@renderer/types'
import { CheckCircleIcon, CircleXIcon, ClockIcon, DownloadIcon, PlusIcon } from 'lucide-react'
import { useTranslation } from 'react-i18next'

export type VideoListProps = {
  providerId: string
  activeVideoId?: string
  setActiveVideoId: (id: string | undefined) => void
}

export const VideoList = ({ providerId, activeVideoId, setActiveVideoId }: VideoListProps) => {
  const { videos } = useVideos(providerId)

  // const displayVideos = mockVideos
  const displayVideos = videos

  return (
    <div className="w-40 space-y-3 overflow-auto p-2">
      <div
        className="group relative flex aspect-square cursor-pointer items-center justify-center overflow-hidden rounded-xl border-2 transition-all hover:scale-105 hover:shadow-lg"
        onClick={() => setActiveVideoId(undefined)}>
        <PlusIcon size={24} />
      </div>
      {displayVideos.map((video) => (
        <VideoListItem
          key={video.id}
          video={video}
          isActive={activeVideoId === video.id}
          onClick={() => setActiveVideoId(video.id)}
        />
      ))}
    </div>
  )
}

const VideoListItem = ({ video, isActive, onClick }: { video: Video; isActive: boolean; onClick: () => void }) => {
  const { t } = useTranslation()

  const getStatusIcon = () => {
    switch (video.status) {
      case 'queued':
        return <ClockIcon size={20} className="text-default-500" />
      case 'in_progress':
        return <Spinner size="sm" color="primary" />
      case 'completed':
        return <CheckCircleIcon size={20} className="text-success" />
      case 'downloading':
        return <DownloadIcon size={20} className="text-primary" />
      case 'downloaded':
        return null // No indicator for downloaded state
      case 'failed':
        return <CircleXIcon size={20} className="text-danger" />
      default:
        return null
    }
  }

  const getStatusColor = () => {
    switch (video.status) {
      case 'queued':
        return 'bg-default-100'
      case 'in_progress':
        return 'bg-primary-50'
      case 'completed':
        return 'bg-success-50'
      case 'downloading':
        return 'bg-primary-50'
      case 'downloaded':
        return 'bg-success-50'
      case 'failed':
        return 'bg-danger-50'
      default:
        return 'bg-default-50'
    }
  }

  const showProgress = video.status === 'in_progress' || video.status === 'downloading'
  const showThumbnail = video.status === 'completed' || video.status === 'downloading' || video.status === 'downloaded'

  return (
    <div
      className={cn(
        `group relative aspect-square cursor-pointer overflow-hidden rounded-xl border-2 transition-all hover:scale-105 hover:shadow-lg ${getStatusColor()}`,
        isActive ? 'border-primary' : undefined
      )}
      onClick={onClick}>
      {/* Thumbnail placeholder */}
      <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-default-100 to-default-200">
        {showThumbnail ? (
          <img src={video.thumbnail ?? ''} alt="Video thumbnail" className="h-full w-full object-cover" />
        ) : (
          <div className="flex flex-col items-center gap-2 text-default-400">
            <div className="text-2xl">🎬</div>
          </div>
        )}
      </div>

      {/* Status overlay */}
      <div className="absolute inset-0 bg-black/20 opacity-0 transition-opacity group-hover:opacity-100" />

      {/* Status indicator */}
      {getStatusIcon() && (
        <div className="absolute top-2 right-2 flex items-center gap-1 rounded-full bg-white/90 px-2 py-1 backdrop-blur-sm">
          {getStatusIcon()}
          <span className="font-medium text-xs">{t(`video.status.${video.status}`)}</span>
        </div>
      )}

      {/* Progress bar for in_progress and downloading states */}
      {showProgress && (
        <div className="absolute right-0 bottom-0 left-0 p-2">
          <Progress
            size="sm"
            value={video.progress}
            color={video.status === 'downloading' ? 'primary' : 'primary'}
            className="w-full"
            showValueLabel={false}
          />
        </div>
      )}

      {/* Video info overlay */}
      <div className="absolute right-0 bottom-0 left-0 bg-gradient-to-t from-black/60 to-transparent p-3 pt-6 opacity-0 transition-opacity group-hover:opacity-100">
        <div className="text-white">
          <p className="truncate font-medium text-sm">{video.metadata.id}</p>
          {video.prompt && <p className="mt-1 line-clamp-2 text-xs opacity-80">{video.prompt}</p>}
        </div>
      </div>

      {/* Failed state overlay */}
      {video.status === 'failed' && (
        <div className="absolute inset-0 flex items-center justify-center bg-danger/10"></div>
      )}
    </div>
  )
}
