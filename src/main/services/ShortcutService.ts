import { preferenceService } from '@data/PreferenceService'
import { loggerService } from '@logger'
import { handleZoomFactor } from '@main/utils/zoom'
import { IpcChannel } from '@shared/IpcChannel'
import { shortcutDefinitions } from '@shared/shortcuts/definitions'
import type { HydratedShortcut, ShortcutDefinition, ShortcutPreferenceMap } from '@shared/shortcuts/types'
import type { BrowserWindow } from 'electron'
import { BrowserWindow as ElectronBrowserWindow, globalShortcut, ipcMain } from 'electron'

import selectionService from './SelectionService'
import { windowService } from './WindowService'

const logger = loggerService.withContext('ShortcutService')

type ShortcutHandler = (window: BrowserWindow | undefined) => void

class ShortcutService {
  private handlers = new Map<string, ShortcutHandler>()
  private hydratedShortcuts = new Map<string, HydratedShortcut>()
  private registeredAccelerators = new Map<string, string[]>()
  private readonly definitionMap = new Map<string, ShortcutDefinition>()
  private ipcRegistered = false

  constructor() {
    this.definitionMap = new Map(shortcutDefinitions.map((definition) => [definition.name, definition]))

    this.setupIpcHandlers()
    this.registerDefaultHandlers()
    this.hydrateShortcuts()
    this.registerPreferenceListeners()
  }

  public registerHandler(name: string, handler: ShortcutHandler) {
    if (this.handlers.has(name)) {
      logger.warn(`Handler for shortcut '${name}' is being overwritten.`)
    }
    this.handlers.set(name, handler)
  }

  public registerMainProcessShortcuts(window?: BrowserWindow) {
    const targetWindow = this.getTargetWindow(window)

    this.unregisterTrackedAccelerators()

    for (const config of this.hydratedShortcuts.values()) {
      if (config.scope !== 'main') {
        continue
      }

      if (!config.enabled || config.key.length === 0) {
        continue
      }

      const handler = this.handlers.get(config.name)
      if (!handler) {
        logger.warn(`No handler registered for shortcut '${config.name}'.`)
        continue
      }

      const accelerators = this.buildAccelerators(config)
      if (accelerators.length === 0) {
        continue
      }

      for (const accelerator of accelerators) {
        try {
          const registered = globalShortcut.register(accelerator, () => {
            try {
              handler(this.getTargetWindow(targetWindow))
            } catch (error) {
              logger.error(`Error while executing handler for shortcut '${config.name}':`, error as Error)
            }
          })

          if (!registered) {
            logger.warn(`Electron rejected shortcut accelerator '${accelerator}' for '${config.name}'.`)
            continue
          }

          this.trackAccelerator(config.name, accelerator)
        } catch (error) {
          logger.warn(`Failed to register shortcut '${config.name}' with accelerator '${accelerator}':`, error as Error)
        }
      }
    }

    this.broadcastShortcuts()
  }

  public unregisterAllShortcuts() {
    this.unregisterTrackedAccelerators()
  }

  public getHydratedShortcuts(): Record<string, HydratedShortcut> {
    return Object.fromEntries(
      [...this.hydratedShortcuts.entries()].map(([name, config]) => [
        name,
        {
          ...config,
          key: [...config.key]
        }
      ])
    )
  }

  private setupIpcHandlers() {
    if (this.ipcRegistered) {
      return
    }

    ipcMain.handle(IpcChannel.Shortcuts_GetAll, () => {
      return this.getHydratedShortcuts()
    })

    this.ipcRegistered = true
  }

  private registerPreferenceListeners() {
    preferenceService.subscribeChange('shortcut.preferences', (newPreferences) => {
      this.hydrateAndRegister(newPreferences)
    })
  }

  private hydrateAndRegister(preferences?: ShortcutPreferenceMap) {
    this.hydrateShortcuts(preferences)
    this.registerMainProcessShortcuts()
  }

  private hydrateShortcuts(preferences?: ShortcutPreferenceMap) {
    const preferenceSnapshot = preferences ?? preferenceService.get('shortcut.preferences')

    this.hydratedShortcuts.clear()

    for (const definition of shortcutDefinitions) {
      const userPreference = preferenceSnapshot?.[definition.name]
      const key =
        userPreference?.key && userPreference.key.length > 0 ? [...userPreference.key] : [...definition.defaultKey]
      const enabled = typeof userPreference?.enabled === 'boolean' ? userPreference.enabled : definition.defaultEnabled

      this.hydratedShortcuts.set(definition.name, {
        ...definition,
        key,
        enabled
      })
    }
  }

  private broadcastShortcuts() {
    const payload = this.getHydratedShortcuts()

    for (const window of ElectronBrowserWindow.getAllWindows()) {
      if (window.isDestroyed()) {
        continue
      }

      try {
        window.webContents.send(IpcChannel.Shortcuts_Updated, payload)
      } catch (error) {
        logger.warn('Failed to broadcast shortcut update to renderer window:', error as Error)
      }
    }
  }

  private unregisterTrackedAccelerators() {
    for (const accelerators of this.registeredAccelerators.values()) {
      for (const accelerator of accelerators) {
        try {
          globalShortcut.unregister(accelerator)
        } catch (error) {
          logger.warn(`Failed to unregister accelerator '${accelerator}':`, error as Error)
        }
      }
    }

    this.registeredAccelerators.clear()
  }

  private trackAccelerator(name: string, accelerator: string) {
    if (!this.registeredAccelerators.has(name)) {
      this.registeredAccelerators.set(name, [])
    }
    this.registeredAccelerators.get(name)!.push(accelerator)
  }

  private buildAccelerators(config: HydratedShortcut): string[] {
    if (config.key.length === 0) {
      return []
    }

    const baseAccelerator = this.normalizeAccelerator(config.key)
    if (!baseAccelerator) {
      logger.warn(`Invalid shortcut configuration for '${config.name}', skipping registration.`)
      return []
    }

    if (config.name === 'zoom_in' && this.isUsingDefaultKey(config)) {
      return [baseAccelerator, 'CommandOrControl+numadd']
    }

    if (config.name === 'zoom_out' && this.isUsingDefaultKey(config)) {
      return [baseAccelerator, 'CommandOrControl+numsub']
    }

    if (config.name === 'zoom_reset' && this.isUsingDefaultKey(config)) {
      return [baseAccelerator, 'CommandOrControl+num0']
    }

    return [baseAccelerator]
  }

  private isUsingDefaultKey(config: HydratedShortcut): boolean {
    const definition = this.definitionMap.get(config.name)
    if (!definition) {
      return false
    }

    if (definition.defaultKey.length !== config.key.length) {
      return false
    }

    return definition.defaultKey.every((key, index) => key === config.key[index])
  }

  private normalizeAccelerator(keys: string[]): string | null {
    const normalizedKeys = keys.map((key) => this.normalizeKeyForElectron(key)).filter((key): key is string => !!key)

    if (normalizedKeys.length !== keys.length) {
      return null
    }

    return normalizedKeys.join('+')
  }

  private normalizeKeyForElectron(key: string): string | null {
    switch (key) {
      case 'CommandOrControl':
      case 'Ctrl':
      case 'Alt':
      case 'Meta':
      case 'Shift':
        return key
      case 'Command':
      case 'Cmd':
        return 'CommandOrControl'
      case 'Control':
        return 'Ctrl'
      case 'ArrowUp':
        return 'Up'
      case 'ArrowDown':
        return 'Down'
      case 'ArrowLeft':
        return 'Left'
      case 'ArrowRight':
        return 'Right'
      case 'AltGraph':
        return 'AltGr'
      case 'Slash':
        return '/'
      case 'Semicolon':
        return ';'
      case 'BracketLeft':
        return '['
      case 'BracketRight':
        return ']'
      case 'Backslash':
        return '\\'
      case 'Quote':
        return "'"
      case 'Comma':
        return ','
      case 'Minus':
        return '-'
      case 'Equal':
        return '='
      case 'Space':
        return 'Space'
      default:
        return key
    }
  }

  private registerDefaultHandlers() {
    this.registerHandler('zoom_in', (window) => {
      const target = this.getTargetWindow(window)
      if (!target) {
        return
      }
      handleZoomFactor([target], 0.1)
    })

    this.registerHandler('zoom_out', (window) => {
      const target = this.getTargetWindow(window)
      if (!target) {
        return
      }
      handleZoomFactor([target], -0.1)
    })

    this.registerHandler('zoom_reset', (window) => {
      const target = this.getTargetWindow(window)
      if (!target) {
        return
      }
      handleZoomFactor([target], 0, true)
    })

    this.registerHandler('show_app', () => {
      windowService.toggleMainWindow()
    })

    this.registerHandler('show_mini_window', () => {
      if (!preferenceService.get('feature.quick_assistant.enabled')) {
        return
      }
      windowService.toggleMiniWindow()
    })

    this.registerHandler('selection_assistant_toggle', () => {
      selectionService?.toggleEnabled()
    })

    this.registerHandler('selection_assistant_select_text', () => {
      selectionService?.processSelectTextByShortcut()
    })
  }

  private getTargetWindow(window?: BrowserWindow): BrowserWindow | undefined {
    if (window && !window.isDestroyed()) {
      return window
    }

    const mainWindow = windowService.getMainWindow()
    if (mainWindow && !mainWindow.isDestroyed()) {
      return mainWindow
    }

    return undefined
  }
}

export const shortcutService = new ShortcutService()

export function registerShortcuts(window: BrowserWindow) {
  shortcutService.registerMainProcessShortcuts(window)
}

export function unregisterAllShortcuts() {
  shortcutService.unregisterAllShortcuts()
}
