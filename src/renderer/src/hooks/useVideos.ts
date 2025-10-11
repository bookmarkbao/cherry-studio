import { useAppDispatch, useAppSelector } from '@renderer/store'
import { addVideoAction, removeVideoAction, setVideosAction, updateVideoAction } from '@renderer/store/video'
import { Video } from '@renderer/types/video'
import { useCallback, useEffect } from 'react'

export const useVideos = (providerId: string) => {
  const videos = useAppSelector((state) => state.video.videoMap[providerId])
  const dispatch = useAppDispatch()

  const addVideo = useCallback(
    (video: Video) => {
      if (videos && videos.every((v) => v.id !== video.id)) {
        dispatch(addVideoAction({ providerId, video }))
      }
    },
    [dispatch, providerId, videos]
  )

  const updateVideo = useCallback(
    (update: Partial<Video> & { id: string }) => {
      dispatch(updateVideoAction({ providerId, update }))
    },
    [dispatch, providerId]
  )

  const setVideos = useCallback(
    (newVideos: Video[]) => {
      dispatch(setVideosAction({ providerId, videos: newVideos }))
    },
    [dispatch, providerId]
  )

  const removeVideo = useCallback(
    (videoId: string) => {
      dispatch(removeVideoAction({ providerId, videoId }))
    },
    [dispatch, providerId]
  )

  useEffect(() => {
    if (!videos) {
      setVideos([])
    }
  }, [setVideos, videos])

  return {
    videos: videos ?? [],
    addVideo,
    updateVideo,
    setVideos,
    removeVideo
  }
}
