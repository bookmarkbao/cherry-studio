import { isMac } from '@renderer/config/constant'
import { UserAvatar as DefaultUserAvatar } from '@renderer/config/env'
import { isEmoji } from '@renderer/utils/naming'
import { Avatar } from 'antd'
import { FC } from 'react'
import styled from 'styled-components'

import UserPopup from '../Popups/UserPopup'
import EmojiAvatar from './EmojiAvatar'

interface Props {
  avatar: string
  size: number
}

const UserAvatar: FC<Props> = ({ avatar, size = 31 }) => {
  const onEditUser = () => UserPopup.show()

  if (isEmoji(avatar)) {
    return (
      <EmojiAvatar onClick={onEditUser} className="sidebar-avatar" size={size} fontSize={18}>
        {avatar}
      </EmojiAvatar>
    )
  }

  return (
    <AvatarImg
      src={avatar || DefaultUserAvatar}
      draggable={false}
      size={size}
      className="nodrag"
      onClick={onEditUser}
    />
  )
}

const AvatarImg = styled(Avatar)`
  width: 31px;
  height: 31px;
  background-color: var(--color-background-soft);
  margin-bottom: ${isMac ? '12px' : '12px'};
  margin-top: ${isMac ? '0px' : '2px'};
  border: none;
  cursor: pointer;
  [navbar-position='top'] & {
    margin-bottom: 0px;
    margin-top: 0px;
  }
`

export default UserAvatar
