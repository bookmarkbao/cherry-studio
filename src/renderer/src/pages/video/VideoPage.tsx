// interface VideoPageProps {}

import { Divider } from '@heroui/react'
import { Navbar, NavbarCenter } from '@renderer/components/app/Navbar'
import { useProvider } from '@renderer/hooks/useProvider'
import { SystemProviderIds } from '@renderer/types'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import { ModelSetting } from './settings/ModelSetting'
import { ProviderSetting } from './settings/ProviderSetting'
import { VideoList } from './VideoList'
import { VideoPanel } from './VideoPanel'

export const VideoPage = () => {
  const { t } = useTranslation()
  const [providerId, setProviderId] = useState<string>(SystemProviderIds.openai)
  const [modelId, setModelId] = useState('sora-2')
  const { provider } = useProvider(providerId)
  return (
    <div className="flex flex-1 flex-col">
      <Navbar>
        <NavbarCenter style={{ borderRight: 'none' }}>{t('video.title')}</NavbarCenter>
      </Navbar>
      <div id="content-container" className="flex flex-1">
        {/* Settings */}
        <div className="flex w-70 flex-col p-2">
          <ProviderSetting providerId={providerId} setProviderId={setProviderId} />
          <ModelSetting providerId={providerId} modelId={modelId} setModelId={setModelId} />
        </div>
        <Divider orientation="vertical" />
        <VideoPanel provider={provider} />
        <Divider orientation="vertical" />
        {/* Video list */}
        <VideoList providerId={providerId} />
      </div>
    </div>
  )
}
