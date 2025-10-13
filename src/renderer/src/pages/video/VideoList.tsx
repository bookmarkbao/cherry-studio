import { Video } from '@renderer/types'
import { PlusIcon } from 'lucide-react'

import { VideoListItem } from './VideoListItem'

export type VideoListProps = {
  videos: Video[]
  activeVideoId?: string
  setActiveVideoId: (id: string | undefined) => void
}

export const VideoList = ({ videos, activeVideoId, setActiveVideoId }: VideoListProps) => {
  return (
    <div className="w-40 space-y-3 overflow-auto p-2">
      <div
        className="group relative flex aspect-square cursor-pointer items-center justify-center overflow-hidden rounded-xl border-2 transition-all hover:scale-105 hover:shadow-lg"
        onClick={() => setActiveVideoId(undefined)}>
        <PlusIcon size={24} />
      </div>
      {/* {mockVideos.map((video) => ( */}
      {videos.map((video) => (
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
