import { useAvailablePlugins, useInstalledPlugins, usePluginActions } from '@renderer/hooks/usePlugins'
import type { GetAgentResponse, GetAgentSessionResponse, UpdateAgentFunctionUnion } from '@renderer/types/agent'
import { Card, Tabs } from 'antd'
import type { FC } from 'react'
import { useMemo } from 'react'
import { useCallback } from 'react'
import { useTranslation } from 'react-i18next'

import { InstalledPluginsList } from './components/InstalledPluginsList'
import { PluginBrowser } from './components/PluginBrowser'
import { SettingsContainer } from './shared'

interface PluginSettingsProps {
  agentBase: GetAgentResponse | GetAgentSessionResponse
  update: UpdateAgentFunctionUnion
}

const PluginSettings: FC<PluginSettingsProps> = ({ agentBase }) => {
  const { t } = useTranslation()

  // Fetch available plugins
  const { agents, commands, skills, loading: loadingAvailable, error: errorAvailable } = useAvailablePlugins()

  // Fetch installed plugins
  const { plugins, loading: loadingInstalled, error: errorInstalled, refresh } = useInstalledPlugins(agentBase.id)

  // Plugin actions
  const { install, uninstall, installing, uninstalling } = usePluginActions(agentBase.id, refresh)

  // Handle install action
  const handleInstall = useCallback(
    async (sourcePath: string, type: 'agent' | 'command' | 'skill') => {
      const result = await install(sourcePath, type)

      if (result.success) {
        window.toast.success(t('agent.settings.plugins.success.install'))
      } else {
        window.toast.error(t('agent.settings.plugins.error.install') + (result.error ? ': ' + result.error : ''))
      }
    },
    [install, t]
  )

  // Handle uninstall action
  const handleUninstall = useCallback(
    async (filename: string, type: 'agent' | 'command' | 'skill') => {
      const result = await uninstall(filename, type)

      if (result.success) {
        window.toast.success(t('agent.settings.plugins.success.uninstall'))
      } else {
        window.toast.error(t('agent.settings.plugins.error.uninstall') + (result.error ? ': ' + result.error : ''))
      }
    },
    [uninstall, t]
  )

  const tabItems = useMemo(() => {
    return [
      {
        key: 'available',
        label: t('agent.settings.plugins.available.title'),
        children: (
          <div className="flex h-full flex-col overflow-y-auto pt-1 pr-2">
            {errorAvailable ? (
              <Card variant="borderless">
                <p className="text-danger">
                  {t('agent.settings.plugins.error.load')}: {errorAvailable}
                </p>
              </Card>
            ) : (
              <PluginBrowser
                agentId={agentBase.id}
                agents={agents}
                commands={commands}
                skills={skills}
                installedPlugins={plugins}
                onInstall={handleInstall}
                onUninstall={handleUninstall}
                loading={loadingAvailable || installing || uninstalling}
              />
            )}
          </div>
        )
      },
      {
        key: 'installed',
        label: t('agent.settings.plugins.installed.title'),
        children: (
          <div className="flex h-full flex-col overflow-y-auto pt-4 pr-2">
            {errorInstalled ? (
              <Card className="bg-danger-50 dark:bg-danger-900/20">
                <p className="text-danger">
                  {t('agent.settings.plugins.error.load')}: {errorInstalled}
                </p>
              </Card>
            ) : (
              <InstalledPluginsList
                plugins={plugins}
                onUninstall={handleUninstall}
                loading={loadingInstalled || uninstalling}
              />
            )}
          </div>
        )
      }
    ]
  }, [
    agentBase.id,
    agents,
    commands,
    errorAvailable,
    errorInstalled,
    handleInstall,
    handleUninstall,
    installing,
    loadingAvailable,
    loadingInstalled,
    plugins,
    skills,
    t,
    uninstalling
  ])

  return (
    <SettingsContainer className="pr-0">
      <Tabs centered items={tabItems} />
    </SettingsContainer>
  )
}

export default PluginSettings
