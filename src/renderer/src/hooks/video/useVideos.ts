import { loggerService } from '@logger'
import { retrieveVideo, retrieveVideoContent } from '@renderer/services/ApiService'
import { getProviderById } from '@renderer/services/ProviderService'
import { useAppDispatch, useAppSelector } from '@renderer/store'
import {
  addVideoAction,
  removeVideoAction,
  setVideoAction,
  setVideosAction,
  updateVideoAction
} from '@renderer/store/video'
import { Video } from '@renderer/types/video'
import { useCallback, useEffect, useRef } from 'react'
import useSWR from 'swr'

const logger = loggerService.withContext('useVideo')

export const useVideos = (providerId: string) => {
  const videos = useAppSelector((state) => state.video.videoMap[providerId])
  const videosRef = useRef(videos)
  const dispatch = useAppDispatch()

  useEffect(() => {
    videosRef.current = videos
  }, [videos])

  const addVideo = useCallback(
    (video: Video) => {
      if (videos && videos.every((v) => v.id !== video.id)) {
        dispatch(addVideoAction({ providerId, video }))
      }
    },
    [dispatch, providerId, videos]
  )

  const updateVideo = useCallback(
    (update: Partial<Omit<Video, 'status'>> & { id: string }) => {
      dispatch(updateVideoAction({ providerId, update }))
    },
    [dispatch, providerId]
  )

  const setVideo = useCallback(
    (video: Video) => {
      dispatch(setVideoAction({ providerId, video }))
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

  // update videos from api
  // NOTE: This provider should support openai videos endpoint. No runtime check here.
  const provider = getProviderById(providerId)
  const fetcher = async () => {
    if (!videos || !provider) return []
    const openaiVideos = videos
      .filter((v) => v.type === 'openai')
      .filter((v) => v.status === 'queued' || v.status === 'in_progress')
    const jobs = openaiVideos.map((v) => retrieveVideo({ type: 'openai', videoId: v.id, provider }))
    const result = await Promise.allSettled(jobs)
    return result.filter((p) => p.status === 'fulfilled').map((p) => p.value)
  }
  const { data, error } = useSWR('video/openai/videos', fetcher, { refreshInterval: 3000 })
  useEffect(() => {
    if (error) {
      logger.error('Failed to fetch video status updates', error)
      return
    }
    if (!provider) {
      logger.warn(`Provider ${providerId} not found.`)
      return
    }
    const videos = videosRef.current

    if (!data || !videos) return
    data.forEach((v) => {
      const retrievedVideo = v.video
      const storeVideo = videos.find((v) => v.id === retrievedVideo.id)
      if (!storeVideo) {
        logger.warn(`Try to update video ${retrievedVideo.id}, but it's not in the store.`)
        return
      }
      switch (retrievedVideo.status) {
        case 'in_progress':
          if (storeVideo.status === 'queued' || storeVideo.status === 'in_progress') {
            setVideo({
              ...storeVideo,
              status: 'in_progress',
              progress: retrievedVideo.progress,
              metadata: retrievedVideo
            })
          }
          break
        case 'completed':
          // Only update it when in_progress/queued -> completed
          if (storeVideo.status === 'in_progress' || storeVideo.status === 'queued') {
            setVideo({ ...storeVideo, status: 'completed', thumbnail: null, metadata: retrievedVideo })
            // try to request thumbnail here.
            retrieveVideoContent({
              type: 'openai',
              provider,
              videoId: retrievedVideo.id,
              query: { variant: 'thumbnail' }
            })
              .then((v) => {
                // TODO: this is a iamge/webp type response. save it somewhere.
                logger.debug('thumbnail resposne', v.response)
              })
              .catch((e) => {
                logger.error(`Failed to get thumbnail for video ${retrievedVideo.id}`, e as Error)
              })
          }
          break
        case 'failed':
          setVideo({
            ...storeVideo,
            status: 'failed',
            error: retrievedVideo.error,
            metadata: retrievedVideo
          })
      }
    })
  }, [data, error, provider, providerId, setVideo])

  return {
    videos: videos ?? [],
    addVideo,
    updateVideo,
    setVideos,
    setVideo,
    removeVideo
  }
}
