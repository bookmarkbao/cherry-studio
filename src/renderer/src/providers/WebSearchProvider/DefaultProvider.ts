import { WebSearchState } from '@renderer/store/websearch'
import { WebSearchProviderResponse } from '@renderer/types'

import BaseWebSearchProvider from './BaseWebSearchProvider'

export default class DefaultProvider extends BaseWebSearchProvider {
  search(_query: string, _websearch: WebSearchState, _httpOptions?: RequestInit): Promise<WebSearchProviderResponse> {
    throw new Error('Method not implemented.')
  }
}
