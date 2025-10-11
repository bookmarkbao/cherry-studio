import OpenAI from '@cherrystudio/openai'

// Only OpenAI for now.
export type CreateVideoParams = { params: OpenAI.VideoCreateParams; options?: OpenAI.RequestOptions }

export type CreateVideoResult = OpenAI.Videos.Video
