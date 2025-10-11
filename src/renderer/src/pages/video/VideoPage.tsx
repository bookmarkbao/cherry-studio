// interface VideoPageProps {}

import { Divider } from '@heroui/react'
import { Navbar, NavbarCenter } from '@renderer/components/app/Navbar'
import { useProvider } from '@renderer/hooks/useProvider'
import { SystemProviderIds } from '@renderer/types'
import { CreateVideoParams } from '@renderer/types/video'
import { isVideoModel } from '@renderer/utils/model/video'
import { DeepPartial } from 'ai'
import { merge } from 'lodash'
import { useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { ModelSetting } from './settings/ModelSetting'
import { OpenAIParamSettings } from './settings/OpenAIParamSettings'
import { ProviderSetting } from './settings/ProviderSetting'
import { SettingsGroup } from './settings/shared'
import { VideoList } from './VideoList'
import { VideoPanel } from './VideoPanel'

export const VideoPage = () => {
  const { t } = useTranslation()
  const [providerId, setProviderId] = useState<string>(SystemProviderIds.openai)
  const { provider } = useProvider(providerId)
  const [params, setParams] = useState<CreateVideoParams>({
    type: 'openai',
    provider,
    params: {
      model: 'sora-2',
      prompt: ''
    },
    options: {}
  })

  const updateParams = useCallback((update: DeepPartial<Omit<CreateVideoParams, 'type'>>) => {
    setParams((prev) => merge({}, prev, update))
  }, [])

  const updateModelId = useCallback(
    (id: string) => {
      if (isVideoModel(id)) {
        updateParams({ params: { model: id } })
      }
    },
    [updateParams]
  )

  return (
    <div className="flex flex-1 flex-col">
      <Navbar>
        <NavbarCenter style={{ borderRight: 'none' }}>{t('video.title')}</NavbarCenter>
      </Navbar>
      <div id="content-container" className="flex flex-1">
        {/* Settings */}
        <div className="flex w-70 flex-col p-2">
          <SettingsGroup>
            <ProviderSetting providerId={providerId} setProviderId={setProviderId} />
            <ModelSetting
              providerId={providerId}
              modelId={params.params.model ?? 'sora-2'}
              setModelId={updateModelId}
            />
          </SettingsGroup>
          {provider.type === 'openai-response' && <OpenAIParamSettings params={params} updateParams={updateParams} />}
        </div>
        <Divider orientation="vertical" />
        <VideoPanel provider={provider} params={params} updateParams={updateParams} />
        <Divider orientation="vertical" />
        {/* Video list */}
        <VideoList providerId={providerId} />
      </div>
    </div>
  )
}
