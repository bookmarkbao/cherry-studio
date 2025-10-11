import OpenAI from '@cherrystudio/openai'

import { Provider } from './provider'

// Only OpenAI (Responses) is supported for now.
export type VideoEndpointType = 'openai'

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
