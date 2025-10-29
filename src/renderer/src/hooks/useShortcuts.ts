import { preferenceService } from '@data/PreferenceService'
import { isMac, isWin } from '@renderer/config/constant'
import { shortcutRendererStore } from '@renderer/services/ShortcutService'
import { shortcutDefinitions } from '@shared/shortcuts/definitions'
import type { HydratedShortcut, ShortcutPreferenceEntry, ShortcutPreferenceMap } from '@shared/shortcuts/types'
import { orderBy } from 'lodash'
import { useMemo, useSyncExternalStore } from 'react'
import { useHotkeys } from 'react-hotkeys-hook'

export interface UseShortcutOptions {
  preventDefault?: boolean
  enableOnFormTags?: boolean
  enabled?: boolean
  description?: string
}

const defaultOptions: UseShortcutOptions = {
  preventDefault: true,
  enableOnFormTags: true,
  enabled: true
}

const definitionMap = new Map(shortcutDefinitions.map((definition) => [definition.name, definition]))

const toHotkeysFormat = (keys: string[]): string => {
  return keys
    .map((key) => {
      switch (key.toLowerCase()) {
        case 'commandorcontrol':
        case 'command':
        case 'cmd':
          return 'mod'
        case 'control':
        case 'ctrl':
          return 'ctrl'
        case 'alt':
        case 'altgraph':
          return 'alt'
        case 'shift':
          return 'shift'
        case 'meta':
          return 'meta'
        case 'arrowup':
          return 'up'
        case 'arrowdown':
          return 'down'
        case 'arrowleft':
          return 'left'
        case 'arrowright':
          return 'right'
        case 'escape':
          return 'escape'
        case 'space':
          return 'space'
        default:
          return key.toLowerCase()
      }
    })
    .join('+')
}

const toDisplayFormat = (keys: string[]): string => {
  return keys
    .map((key) => {
      switch (key.toLowerCase()) {
        case 'control':
        case 'ctrl':
          return isMac ? '⌃' : 'Ctrl'
        case 'command':
        case 'cmd':
        case 'commandorcontrol':
          return isMac ? '⌘' : 'Ctrl'
        case 'meta':
          return isMac ? '⌘' : isWin ? 'Win' : 'Super'
        case 'alt':
        case 'altgraph':
          return isMac ? '⌥' : 'Alt'
        case 'shift':
          return isMac ? '⇧' : 'Shift'
        case 'arrowup':
          return '↑'
        case 'arrowdown':
          return '↓'
        case 'arrowleft':
          return '←'
        case 'arrowright':
          return '→'
        case 'slash':
          return '/'
        case 'semicolon':
          return ';'
        case 'bracketleft':
          return '['
        case 'bracketright':
          return ']'
        case 'backslash':
          return '\\'
        case 'quote':
          return "'"
        case 'comma':
          return ','
        case 'minus':
          return '-'
        case 'equal':
          return '='
        case 'escape':
          return isMac ? '⎋' : 'Esc'
        default:
          return key.charAt(0).toUpperCase() + key.slice(1).toLowerCase()
      }
    })
    .join(isMac ? '' : ' + ')
}

const useShortcutMap = () =>
  useSyncExternalStore(
    shortcutRendererStore.subscribe,
    shortcutRendererStore.getSnapshot,
    shortcutRendererStore.getServerSnapshot
  )

export const useShortcut = (
  name: string,
  callback: (event: KeyboardEvent) => void,
  options: UseShortcutOptions = defaultOptions
) => {
  const shortcuts = useShortcutMap()
  const shortcutConfig = shortcuts[name]

  const hotkey = useMemo(() => {
    if (
      !shortcutConfig ||
      shortcutConfig.scope !== 'renderer' ||
      !shortcutConfig.enabled ||
      shortcutConfig.key.length === 0
    ) {
      return null
    }
    return toHotkeysFormat(shortcutConfig.key)
  }, [shortcutConfig])

  useHotkeys(
    hotkey ?? 'none',
    (event) => {
      if (options.preventDefault) {
        event.preventDefault()
      }
      if (options.enabled !== false) {
        callback(event)
      }
    },
    {
      enableOnFormTags: options.enableOnFormTags,
      description: options.description ?? shortcutConfig?.description,
      enabled: Boolean(hotkey && shortcutConfig?.enabled)
    },
    [
      callback,
      hotkey,
      shortcutConfig,
      options.preventDefault,
      options.enableOnFormTags,
      options.enabled,
      options.description
    ]
  )
}

export function useShortcuts() {
  const shortcuts = useShortcutMap()
  const list = useMemo(() => {
    return orderBy(
      Object.values(shortcuts).map((shortcut) => ({
        ...shortcut,
        key: [...shortcut.key]
      })),
      ['system', 'name'],
      ['desc', 'asc']
    )
  }, [shortcuts])

  return { shortcuts: list }
}

export function useShortcutConfig(name: string): HydratedShortcut | undefined {
  const shortcuts = useShortcutMap()
  return shortcuts[name]
}

export function useShortcutDisplay(name: string) {
  const shortcut = useShortcutConfig(name)
  return useMemo(() => {
    if (!shortcut || !shortcut.enabled || shortcut.key.length === 0) {
      return ''
    }
    return toDisplayFormat(shortcut.key)
  }, [shortcut])
}

async function writeShortcutPreferences(updater: (current: ShortcutPreferenceMap) => ShortcutPreferenceMap) {
  const current = await preferenceService.get('shortcut.preferences')
  const next = updater({ ...current })
  await preferenceService.set('shortcut.preferences', next)
}

export async function setShortcutBinding(name: string, keys: string[]) {
  await writeShortcutPreferences((current) => {
    const entry: ShortcutPreferenceEntry = { ...current[name] }
    entry.key = [...keys]
    current[name] = entry
    return current
  })
}

export async function setShortcutEnabled(name: string, enabled: boolean) {
  await writeShortcutPreferences((current) => {
    const entry: ShortcutPreferenceEntry = { ...current[name] }
    entry.enabled = enabled
    current[name] = entry
    return current
  })
}

export async function resetShortcut(name: string) {
  const definition = definitionMap.get(name)
  if (!definition) {
    return
  }

  await writeShortcutPreferences((current) => {
    current[name] = {
      key: [...definition.defaultKey],
      enabled: definition.defaultEnabled
    }
    return current
  })
}

export async function resetAllShortcuts() {
  await writeShortcutPreferences(() => {
    return Object.fromEntries(
      shortcutDefinitions.map((definition) => [
        definition.name,
        {
          key: [...definition.defaultKey],
          enabled: definition.defaultEnabled
        }
      ])
    )
  })
}
