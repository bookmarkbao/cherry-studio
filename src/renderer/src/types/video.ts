import OpenAI from '@cherrystudio/openai'

import { Provider } from './provider'

// Only OpenAI (Responses) is supported for now.
export type VideoEndpointType = 'openai'
export type VideoStatus = 'queued' | 'in_progress' | 'completed' | 'downloading' | 'downloaded' | 'failed'

interface VideoBase {
  id: string
  type: VideoEndpointType
  status: VideoStatus
  prompt: string
}

interface OpenAIVideoBase {
  type: 'openai'
  metadata: OpenAI.Videos.Video
}

export interface VideoQueued extends VideoBase {
  status: 'queued'
}

export interface VideoInProgress extends VideoBase {
  status: 'in_progress'
  /** integer percent */
  progress: number
}
export interface VideoCompleted extends VideoBase {
  status: 'completed'
  /** When generation completed, firstly try to retrieve thumbnail. */
  thumbnail: string | null
}

export interface VideoDownloading extends VideoBase {
  /** Downloading video content */
  status: 'downloading'
  thumbnail: string
  /** integer percent */
  progress: number
}
export interface Videodownloaded extends VideoBase {
  status: 'downloaded'
  thumbnail: string
  /** Managed by fileManager */
  fileId: string
}

export interface VideoFailed extends VideoBase {
  status: 'failed'
  error: unknown
}

export interface OpenAIVideoQueued extends VideoQueued, OpenAIVideoBase {}
export interface OpenAIVideoInProgress extends VideoInProgress, OpenAIVideoBase {}
export interface OpenAIVideoCompleted extends VideoCompleted, OpenAIVideoBase {}
export interface OpenAIVideoDownloading extends VideoDownloading, OpenAIVideoBase {}
export interface OpenAIVideoDownloaded extends Videodownloaded, OpenAIVideoBase {}
export interface OpenAIVideoFailed extends VideoFailed, OpenAIVideoBase {
  error: OpenAI.Videos.Video['error']
}

export type OpenAIVideo =
  | OpenAIVideoQueued
  | OpenAIVideoInProgress
  | OpenAIVideoCompleted
  | OpenAIVideoDownloading
  | OpenAIVideoDownloaded
  | OpenAIVideoFailed

export type Video = OpenAIVideo

// Create Video
interface CreateVideoBaseParams {
  type: VideoEndpointType
  provider: Provider
}

export interface OpenAICreateVideoParams extends CreateVideoBaseParams {
  type: 'openai'
  params: OpenAI.VideoCreateParams
  options?: OpenAI.RequestOptions
}

export type CreateVideoParams = OpenAICreateVideoParams

interface CreateVideoBaseResult {
  type: VideoEndpointType
  video: unknown
}

export interface OpenAICreateVideoResult extends CreateVideoBaseResult {
  type: 'openai'
  video: OpenAI.Videos.Video
}

export type CreateVideoResult = OpenAICreateVideoResult

// Retrieve Video
interface RetrieveVideoBaseParams {
  type: VideoEndpointType
  provider: Provider
}

export interface OpenAIRetrieveVideoParams extends RetrieveVideoBaseParams {
  type: 'openai'
  videoId: string
  options?: OpenAI.RequestOptions
}

export type RetrieveVideoParams = OpenAIRetrieveVideoParams

interface RetrieveVideoBaseResult {
  type: VideoEndpointType
}

export interface OpenAIRetrieveVideoResult extends RetrieveVideoBaseResult {
  type: 'openai'
  video: OpenAI.Videos.Video
}

export type RetrieveVideoResult = OpenAIRetrieveVideoResult

// Retrieve Video Content
interface RetrieveVideoContentBaseParams {
  type: VideoEndpointType
  provider: Provider
}

export interface OpenAIRetrieveVideoContentParams extends RetrieveVideoContentBaseParams {
  type: 'openai'
  videoId: string
  query?: OpenAI.Videos.VideoDownloadContentParams
  options?: OpenAI.RequestOptions
}

export type RetrieveVideoContentParams = OpenAIRetrieveVideoContentParams

interface RetrieveVideoContentBaseResult {
  type: VideoEndpointType
}

export interface OpenAIRetrieveVideoContentResult extends RetrieveVideoContentBaseResult {
  type: 'openai'
  response: Response
}

export type RetrieveVideoContentResult = OpenAIRetrieveVideoContentResult
