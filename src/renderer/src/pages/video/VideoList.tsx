import { useVideos } from '@renderer/hooks/video/useVideos'
import { Video } from '@renderer/types/video'

export type VideoListProps = { providerId: string }

export const VideoList = ({ providerId }: VideoListProps) => {
  const { videos } = useVideos(providerId)
  return (
    <div className="w-40">
      {videos.map((video) => (
        <VideoListItem key={video.id} video={video} />
      ))}
    </div>
  )
}

const VideoListItem = ({ video }: { video: Video }) => {
  // TODO: get thumbnail from video
  return <div>{video.metadata.id}</div>
}
