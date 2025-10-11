// interface VideoPageProps {}

import { Divider } from '@heroui/react'
import { Navbar, NavbarCenter } from '@renderer/components/app/Navbar'
import { SystemProviderIds } from '@renderer/types'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import { ProviderSetting } from './settings/ProviderSetting'

export const VideoPage = () => {
  const { t } = useTranslation()
  const [providerId, setProviderId] = useState<string>(SystemProviderIds.openai)
  return (
    <div className="flex flex-1 flex-col">
      <Navbar>
        <NavbarCenter style={{ borderRight: 'none' }}>{t('video.title')}</NavbarCenter>
      </Navbar>
      <div id="content-container" className="flex flex-1">
        <div className="flex w-70 flex-col p-2">
          <ProviderSetting providerId={providerId} setProviderId={setProviderId} />
        </div>
        <Divider orientation="vertical" />
        <div className="flex-1 p-2"></div>
        <Divider orientation="vertical" />
        <div className="w-25"></div>
      </div>
    </div>
  )
}
