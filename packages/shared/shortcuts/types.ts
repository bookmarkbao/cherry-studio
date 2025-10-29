export type ShortcutScope = 'main' | 'renderer'

export interface ShortcutDefinition {
  name: string
  defaultKey: string[]
  defaultEnabled: boolean
  description: string
  scope: ShortcutScope
  editable: boolean
  system: boolean
}

export interface ShortcutPreferenceEntry {
  key?: string[]
  enabled?: boolean
}

export type ShortcutPreferenceMap = Record<string, ShortcutPreferenceEntry>

export type HydratedShortcut = ShortcutDefinition & {
  key: string[]
  enabled: boolean
}

export type HydratedShortcutMap = Record<string, HydratedShortcut>
