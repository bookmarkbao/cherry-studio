import { Progress, Spinner } from '@heroui/react'
import { useVideos } from '@renderer/hooks/video/useVideos'
import { Video } from '@renderer/types/video'
import { CheckCircleIcon, CircleXIcon, ClockIcon, DownloadIcon } from 'lucide-react'
import { useTranslation } from 'react-i18next'

export type VideoListProps = { providerId: string }

export const VideoList = ({ providerId }: VideoListProps) => {
  const { videos } = useVideos(providerId)

  // Mock data for testing
  const mockVideos: Video[] = [
    {
      id: '1',
      type: 'openai',
      status: 'downloaded',
      prompt: 'A beautiful sunset over the ocean with waves crashing',
      thumbnail: 'https://picsum.photos/200/200?random=1',
      fileId: 'file-001',
      metadata: {
        id: 'video-001',
        object: 'video',
        created_at: Math.floor(Date.now() / 1000),
        completed_at: Math.floor(Date.now() / 1000),
        expires_at: null,
        error: null,
        model: 'sora-2',
        progress: 100,
        remixed_from_video_id: null,
        seconds: '4',
        size: '1280x720',
        status: 'completed'
      }
    },
    {
      id: '2',
      type: 'openai',
      status: 'in_progress',
      prompt: 'A cat playing with a ball of yarn in slow motion',
      progress: 65,
      metadata: {
        id: 'video-002',
        object: 'video',
        created_at: Math.floor(Date.now() / 1000),
        completed_at: null,
        expires_at: null,
        error: null,
        model: 'sora-2-pro',
        progress: 65,
        remixed_from_video_id: null,
        seconds: '8',
        size: '1792x1024',
        status: 'in_progress'
      }
    },
    {
      id: '3',
      type: 'openai',
      status: 'queued',
      prompt: 'Time-lapse of flowers blooming in a garden',
      metadata: {
        id: 'video-003',
        object: 'video',
        created_at: Math.floor(Date.now() / 1000),
        completed_at: null,
        expires_at: null,
        error: null,
        model: 'sora-2',
        progress: 0,
        remixed_from_video_id: null,
        seconds: '12',
        size: '1280x720',
        status: 'queued'
      }
    },
    {
      id: '4',
      type: 'openai',
      prompt: 'Birds flying in formation against blue sky',
      status: 'downloading',
      progress: 80,
      thumbnail: 'https://picsum.photos/200/200?random=4',
      metadata: {
        id: 'video-004',
        object: 'video',
        created_at: Math.floor(Date.now() / 1000),
        completed_at: Math.floor(Date.now() / 1000),
        expires_at: null,
        error: null,
        model: 'sora-2-pro',
        progress: 100,
        remixed_from_video_id: null,
        seconds: '8',
        size: '1792x1024',
        status: 'completed'
      }
    },
    {
      id: '5',
      type: 'openai',
      status: 'failed',
      error: { code: '400', message: 'Video generation failed' },
      prompt: 'Mountain landscape with snow peaks and forest',
      metadata: {
        id: 'video-005',
        object: 'video',
        created_at: Math.floor(Date.now() / 1000),
        completed_at: Math.floor(Date.now() / 1000),
        expires_at: null,
        error: { code: '400', message: 'Video generation failed' },
        model: 'sora-2',
        progress: 0,
        remixed_from_video_id: null,
        seconds: '4',
        size: '1280x720',
        status: 'failed'
      }
    },
    {
      id: '6',
      type: 'openai',
      status: 'completed',
      thumbnail: 'https://picsum.photos/200/200?random=6',
      prompt: 'City street at night with neon lights reflecting on wet pavement',
      metadata: {
        id: 'video-006',
        object: 'video',
        created_at: Math.floor(Date.now() / 1000),
        completed_at: Math.floor(Date.now() / 1000),
        expires_at: null,
        error: null,
        model: 'sora-2-pro',
        progress: 100,
        remixed_from_video_id: null,
        seconds: '12',
        size: '1024x1792',
        status: 'completed'
      }
    }
  ]

  // Use mock data instead of real videos for now
  const displayVideos = mockVideos

  return (
    <div className="w-40 space-y-3 overflow-auto p-2">
      {displayVideos.map((video) => (
        <VideoListItem key={video.id} video={video} />
      ))}
    </div>
  )
}

const VideoListItem = ({ video }: { video: Video }) => {
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
        return 'border-default-300 bg-default-100'
      case 'in_progress':
        return 'border-primary-300 bg-primary-50'
      case 'completed':
        return 'border-success-300 bg-success-50'
      case 'downloading':
        return 'border-primary-300 bg-primary-50'
      case 'downloaded':
        return 'border-success-300 bg-success-50'
      case 'failed':
        return 'border-danger-300 bg-danger-50'
      default:
        return 'border-default-200 bg-default-50'
    }
  }

  const showProgress = video.status === 'in_progress' || video.status === 'downloading'
  const showThumbnail = video.status === 'completed' || video.status === 'downloading' || video.status === 'downloaded'

  return (
    <div
      className={`group relative aspect-square cursor-pointer overflow-hidden rounded-xl border-2 transition-all hover:scale-105 hover:shadow-lg ${getStatusColor()}`}>
      {/* Thumbnail placeholder */}
      <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-default-100 to-default-200">
        {showThumbnail ? (
          <img src={video.thumbnail} alt="Video thumbnail" className="h-full w-full object-cover" />
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
