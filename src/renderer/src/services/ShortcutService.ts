import { loggerService } from '@logger'
import { IpcChannel } from '@shared/IpcChannel'
import { shortcutDefinitions } from '@shared/shortcuts/definitions'
import type { HydratedShortcutMap } from '@shared/shortcuts/types'

const logger = loggerService.withContext('RendererShortcutService')

type ShortcutListener = () => void

let shortcutsState: HydratedShortcutMap = buildDefaultState()
const listeners = new Set<ShortcutListener>()
let initialized = false

function buildDefaultState(): HydratedShortcutMap {
  return Object.fromEntries(
    shortcutDefinitions.map((definition) => [
      definition.name,
      {
        ...definition,
        key: [...definition.defaultKey],
        enabled: definition.defaultEnabled
      }
    ])
  )
}

function emitChange() {
  listeners.forEach((listener) => {
    try {
      listener()
    } catch (error) {
      logger.error('Shortcut listener threw an error:', error as Error)
    }
  })
}

function setShortcuts(next: HydratedShortcutMap) {
  shortcutsState = Object.fromEntries(
    Object.entries(next).map(([name, config]) => [
      name,
      {
        ...config,
        key: [...config.key]
      }
    ])
  )
  emitChange()
}

function subscribe(listener: ShortcutListener): () => void {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export function getShortcutsSnapshot(): HydratedShortcutMap {
  return shortcutsState
}

export function initializeShortcutService() {
  if (initialized) {
    return
  }

  initialized = true

  window.electron.ipcRenderer.on(IpcChannel.Shortcuts_Updated, (_event, payload: HydratedShortcutMap) => {
    setShortcuts(payload)
  })

  window.api.shortcuts
    .getAll()
    .then((payload: HydratedShortcutMap) => {
      setShortcuts(payload)
    })
    .catch((error: unknown) => {
      logger.warn('Failed to load shortcuts from main process, using defaults.', error as Error)
      setShortcuts(buildDefaultState())
    })
}

export const shortcutRendererStore = {
  subscribe,
  getSnapshot: getShortcutsSnapshot,
  getServerSnapshot: getShortcutsSnapshot
}
