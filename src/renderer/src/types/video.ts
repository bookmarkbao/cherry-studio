import OpenAI from '@cherrystudio/openai'

import { Provider } from './provider'

// Only OpenAI (Responses) is supported for now.
export type VideoEndpointType = 'openai'

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
