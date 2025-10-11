import { SystemProviderId } from '@renderer/types'

// Hard-encoded for now. We may implement a function to filter video generation model from provider.models.
export const videoModelsMap = {
  openai: ['sora-2', 'sora-2-pro'] as const
} as const satisfies Partial<Record<SystemProviderId, string[]>>
