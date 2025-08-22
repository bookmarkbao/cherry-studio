import { ConfigurationResponseDto, MinApp as BaseMinApp } from '@cherrystudio/api-sdk'
import { MinAppType } from '@renderer/types'
import { MCPServer as BaseMCPServer } from '@renderer/types'

export type ServerConfiguration = ConfigurationResponseDto

export interface ServerMinApp extends BaseMinApp {
  logo?: string
}

export interface ServerMCPServer extends Partial<BaseMCPServer> {
  id?: string
  type?: 'stdio' | 'sse' | 'inMemory' | 'streamableHttp'
}

export interface SyncMinAppsResult {
  enabled: MinAppType[]
  disabled: MinAppType[]
}
