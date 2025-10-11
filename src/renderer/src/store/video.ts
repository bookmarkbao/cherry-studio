import { loggerService } from '@logger'
import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { Video } from '@renderer/types/video'

const logger = loggerService.withContext('Store:paintings')

export interface VideoState {
  /** Provider ID to videos */
  videoMap: Record<string, Video[]>
}

const initialState: VideoState = {
  videoMap: {}
}

const videoSlice = createSlice({
  name: 'video',
  initialState,
  reducers: {
    addVideo: (state: VideoState, action: PayloadAction<{ providerId: string; video: Video }>) => {
      const { providerId, video } = action.payload
      if (state[providerId]) {
        state.videoMap[providerId].unshift(video)
      } else {
        state.videoMap[providerId] = [video]
      }
    },
    removeVideo: (state: VideoState, action: PayloadAction<{ providerId: string; videoId: string }>) => {
      const { providerId, videoId } = action.payload
      const videos = state.videoMap[providerId]
      state.videoMap[providerId] = videos?.filter((c) => c.id !== videoId)
    },
    updateVideo: (
      state: VideoState,
      action: PayloadAction<{ providerId: string; update: Partial<Video> & { id: string } }>
    ) => {
      const { providerId, update } = action.payload

      const existingIndex = state.videoMap[providerId].findIndex((c) => c.id === update.id)
      if (existingIndex !== -1) {
        state.videoMap[providerId] = state.videoMap[providerId]?.map((c) => (c.id === update.id ? { ...c, update } : c))
      } else {
        logger.error(`Video with id ${update.id} not found in ${providerId}`)
      }
    },
    setVideos: (state: VideoState, action: PayloadAction<{ providerId: string; videos: Video[] }>) => {
      const { providerId, videos } = action.payload
      state.videoMap[providerId] = videos
    }
  }
})

export const {
  addVideo: addVideoAction,
  removeVideo: removeVideoAction,
  updateVideo: updateVideoAction,
  setVideos: setVideosAction
} = videoSlice.actions

export default videoSlice.reducer
