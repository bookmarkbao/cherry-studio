import UserProfileSettings from '@renderer/components/UserProfileSettings'
import { useTheme } from '@renderer/context/ThemeProvider'
import { FC } from 'react'

import { SettingContainer } from '.'

const UserSettings: FC = () => {
  const { theme } = useTheme()

  return (
    <SettingContainer theme={theme}>
      <UserProfileSettings />
    </SettingContainer>
  )
}

export default UserSettings
