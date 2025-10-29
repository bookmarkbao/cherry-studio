import type { ShortcutDefinition } from './types'

export const shortcutDefinitions: ShortcutDefinition[] = [
  {
    name: 'show_app',
    defaultKey: [],
    defaultEnabled: true,
    description: 'Show or hide the main window',
    scope: 'main',
    editable: true,
    system: true
  },
  {
    name: 'show_mini_window',
    defaultKey: ['CommandOrControl', 'E'],
    defaultEnabled: false,
    description: 'Show or hide the mini window',
    scope: 'main',
    editable: true,
    system: true
  },
  {
    name: 'selection_assistant_toggle',
    defaultKey: [],
    defaultEnabled: false,
    description: 'Enable or disable the selection assistant',
    scope: 'main',
    editable: true,
    system: true
  },
  {
    name: 'selection_assistant_select_text',
    defaultKey: [],
    defaultEnabled: false,
    description: 'Trigger selection assistant text capture',
    scope: 'main',
    editable: true,
    system: true
  },
  {
    name: 'zoom_in',
    defaultKey: ['CommandOrControl', '='],
    defaultEnabled: true,
    description: 'Zoom in',
    scope: 'main',
    editable: false,
    system: true
  },
  {
    name: 'zoom_out',
    defaultKey: ['CommandOrControl', '-'],
    defaultEnabled: true,
    description: 'Zoom out',
    scope: 'main',
    editable: false,
    system: true
  },
  {
    name: 'zoom_reset',
    defaultKey: ['CommandOrControl', '0'],
    defaultEnabled: true,
    description: 'Reset zoom',
    scope: 'main',
    editable: false,
    system: true
  },
  {
    name: 'show_settings',
    defaultKey: ['CommandOrControl', ','],
    defaultEnabled: true,
    description: 'Open settings',
    scope: 'renderer',
    editable: false,
    system: true
  },
  {
    name: 'new_topic',
    defaultKey: ['CommandOrControl', 'N'],
    defaultEnabled: true,
    description: 'Start a new chat topic',
    scope: 'renderer',
    editable: true,
    system: false
  },
  {
    name: 'rename_topic',
    defaultKey: ['CommandOrControl', 'T'],
    defaultEnabled: false,
    description: 'Rename current topic',
    scope: 'renderer',
    editable: true,
    system: false
  },
  {
    name: 'toggle_show_assistants',
    defaultKey: ['CommandOrControl', '['],
    defaultEnabled: true,
    description: 'Toggle assistant sidebar',
    scope: 'renderer',
    editable: true,
    system: false
  },
  {
    name: 'toggle_show_topics',
    defaultKey: ['CommandOrControl', ']'],
    defaultEnabled: true,
    description: 'Toggle topic sidebar',
    scope: 'renderer',
    editable: true,
    system: false
  },
  {
    name: 'copy_last_message',
    defaultKey: ['CommandOrControl', 'Shift', 'C'],
    defaultEnabled: false,
    description: 'Copy the last assistant reply',
    scope: 'renderer',
    editable: true,
    system: false
  },
  {
    name: 'edit_last_user_message',
    defaultKey: ['CommandOrControl', 'Shift', 'E'],
    defaultEnabled: false,
    description: 'Edit the last user message',
    scope: 'renderer',
    editable: true,
    system: false
  },
  {
    name: 'search_message_in_chat',
    defaultKey: ['CommandOrControl', 'F'],
    defaultEnabled: true,
    description: 'Search messages in current chat',
    scope: 'renderer',
    editable: true,
    system: false
  },
  {
    name: 'search_message',
    defaultKey: ['CommandOrControl', 'Shift', 'F'],
    defaultEnabled: true,
    description: 'Search messages globally',
    scope: 'renderer',
    editable: true,
    system: false
  },
  {
    name: 'clear_topic',
    defaultKey: ['CommandOrControl', 'L'],
    defaultEnabled: true,
    description: 'Clear current topic',
    scope: 'renderer',
    editable: true,
    system: false
  },
  {
    name: 'toggle_new_context',
    defaultKey: ['CommandOrControl', 'K'],
    defaultEnabled: true,
    description: 'Toggle new context mode',
    scope: 'renderer',
    editable: true,
    system: false
  },
  {
    name: 'exit_fullscreen',
    defaultKey: ['Escape'],
    defaultEnabled: true,
    description: 'Exit fullscreen mode',
    scope: 'renderer',
    editable: false,
    system: true
  }
]
