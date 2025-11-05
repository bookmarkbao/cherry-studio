import { App } from 'antd'
import { useEffect } from 'react'

import { initMessageApi } from './TopView/toast'

/**
 * MessageInitializer component
 * This component initializes the message API from App.useApp() hook
 * It should be rendered inside the AntdProvider (which wraps App component)
 * so that the message API can inherit the correct theme (dark/light mode)
 */
export const MessageInitializer = () => {
  const { message } = App.useApp()

  useEffect(() => {
    // Initialize the message API for use in toast.ts
    initMessageApi(message)
  }, [message])

  return null
}
