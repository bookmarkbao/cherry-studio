import { useVideos } from './useVideos'

export const useVideo = (providerId: string, id: string) => {
  const { videos } = useVideos(providerId)
  const video = videos.find((v) => v.id === id)
  return video
}
