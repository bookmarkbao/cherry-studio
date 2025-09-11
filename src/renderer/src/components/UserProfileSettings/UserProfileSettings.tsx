import DefaultAvatar from '@renderer/assets/images/avatar.png'
import EmojiAvatar from '@renderer/components/Avatar/EmojiAvatar'
import { useTheme } from '@renderer/context/ThemeProvider'
import { logout, useAuth } from '@renderer/hooks/useAuth'
import useAvatar from '@renderer/hooks/useAvatar'
import { useSettings } from '@renderer/hooks/useSettings'
import { SettingDivider, SettingGroup, SettingRow, SettingRowTitle, SettingTitle } from '@renderer/pages/settings'
import ImageStorage from '@renderer/services/ImageStorage'
import NavigationService from '@renderer/services/NavigationService'
import { useAppDispatch } from '@renderer/store'
import { setAvatar } from '@renderer/store/runtime'
import { setUserName } from '@renderer/store/settings'
import { compressImage, isEmoji } from '@renderer/utils'
import { Avatar, Button, Dropdown, Input, Popover, Upload } from 'antd'
import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import styled from 'styled-components'

import EmojiPicker from '../EmojiPicker'

const UserProfileSettings: React.FC = () => {
  const [emojiPickerOpen, setEmojiPickerOpen] = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const { t } = useTranslation()
  const { userName } = useSettings()
  const { theme } = useTheme()
  const dispatch = useAppDispatch()
  const avatar = useAvatar()
  const { serverUrl } = useAuth()

  const handleEmojiClick = async (emoji: string) => {
    try {
      await ImageStorage.set('avatar', emoji)
      dispatch(setAvatar(emoji))
      setEmojiPickerOpen(false)
    } catch (error: any) {
      window.toast.error(error.message)
    }
  }

  const handleReset = async () => {
    try {
      await ImageStorage.set('avatar', DefaultAvatar)
      dispatch(setAvatar(DefaultAvatar))
      setDropdownOpen(false)
    } catch (error: any) {
      window.toast.error(error.message)
    }
  }

  const onLogout = () => {
    window.modal.confirm({
      title: t('enterprise.auth.logout'),
      content: t('enterprise.auth.logout_confirm'),
      centered: true,
      onOk() {
        logout()
        NavigationService.navigate?.('/')
      }
    })
  }

  const items = [
    {
      key: 'upload',
      label: (
        <div style={{ width: '100%', textAlign: 'center' }}>
          <Upload
            customRequest={() => {}}
            accept="image/png, image/jpeg, image/gif"
            itemRender={() => null}
            maxCount={1}
            onChange={async ({ file }) => {
              try {
                const _file = file.originFileObj as File
                if (_file.type === 'image/gif') {
                  await ImageStorage.set('avatar', _file)
                } else {
                  const compressedFile = await compressImage(_file)
                  await ImageStorage.set('avatar', compressedFile)
                }
                dispatch(setAvatar(await ImageStorage.get('avatar')))
                setDropdownOpen(false)
              } catch (error: any) {
                window.toast.error(error.message)
              }
            }}>
            {t('settings.general.image_upload')}
          </Upload>
        </div>
      )
    },
    {
      key: 'emoji',
      label: (
        <div
          style={{ width: '100%', textAlign: 'center' }}
          onClick={(e) => {
            e.stopPropagation()
            setEmojiPickerOpen(true)
            setDropdownOpen(false)
          }}>
          {t('settings.general.emoji_picker')}
        </div>
      )
    },
    {
      key: 'reset',
      label: (
        <div
          style={{ width: '100%', textAlign: 'center' }}
          onClick={(e) => {
            e.stopPropagation()
            handleReset()
          }}>
          {t('settings.general.avatar.reset')}
        </div>
      )
    }
  ]

  return (
    <SettingGroup theme={theme}>
      <SettingTitle>{t('common.you')}</SettingTitle>
      <SettingDivider />
      <SettingRow>
        <SettingRowTitle>{t('common.avatar')}</SettingRowTitle>
        <Dropdown
          menu={{ items }}
          trigger={['click']}
          open={dropdownOpen}
          align={{ offset: [0, 4] }}
          placement="bottomLeft"
          onOpenChange={(visible) => {
            setDropdownOpen(visible)
            if (visible) {
              setEmojiPickerOpen(false)
            }
          }}>
          <Popover
            content={<EmojiPicker onEmojiClick={handleEmojiClick} />}
            trigger="click"
            open={emojiPickerOpen}
            onOpenChange={(visible) => {
              setEmojiPickerOpen(visible)
              if (visible) {
                setDropdownOpen(false)
              }
            }}
            placement="bottom">
            {isEmoji(avatar) ? (
              <EmojiAvatar size={40} fontSize={20}>
                {avatar}
              </EmojiAvatar>
            ) : (
              <UserAvatar src={avatar} />
            )}
          </Popover>
        </Dropdown>
      </SettingRow>
      <SettingDivider />
      <SettingRow>
        <SettingRowTitle>{t('settings.general.user_name.label')}</SettingRowTitle>
        <Input
          placeholder={t('settings.general.user_name.placeholder')}
          value={userName}
          variant="borderless"
          onChange={(e) => dispatch(setUserName(e.target.value.trim()))}
          style={{ width: 'auto', textAlign: 'right' }}
          maxLength={30}
        />
      </SettingRow>
      <SettingDivider />
      <SettingRow>
        <SettingRowTitle>{t('enterprise.login.placeholder.server_url')}</SettingRowTitle>
        <SettingRowTitle>{serverUrl}</SettingRowTitle>
      </SettingRow>
      <SettingDivider />
      <SettingRow>
        <span style={{ flex: 1 }} />
        <Button type="text" onClick={onLogout} danger>
          {t('enterprise.auth.logout')}
        </Button>
      </SettingRow>
    </SettingGroup>
  )
}

const UserAvatar = styled(Avatar)`
  cursor: pointer;
  width: 40px;
  height: 40px;
  transition: opacity 0.3s ease;
  &:hover {
    opacity: 0.8;
  }
`

export default UserProfileSettings
