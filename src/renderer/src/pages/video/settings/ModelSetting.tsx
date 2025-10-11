import { Select, SelectItem } from '@heroui/react'
import { Model, SystemProviderId } from '@renderer/types'
import { Dispatch, SetStateAction } from 'react'
import { useTranslation } from 'react-i18next'

import { SettingItem, SettingTitle } from './shared'

export interface ModelSettingProps {
  providerId: string
  modelId: string
  setModelId: Dispatch<SetStateAction<string>>
}

interface ModelSelectItem extends Model {
  key: string
  label: string
}

// Hard-encoded for now. We may implement a function to filter video generation model from provider.models.
const videoModelsMap = {
  openai: ['sora-2', 'sora-2-pro'] as const
} as const satisfies Partial<Record<SystemProviderId, string[]>>

export const ModelSetting = ({ providerId, modelId, setModelId }: ModelSettingProps) => {
  const { t } = useTranslation()

  const items: ModelSelectItem[] = videoModelsMap[providerId]?.map((m: string) => ({ key: m, label: m })) ?? []

  return (
    <SettingItem>
      <SettingTitle name={t('common.model')} />
      <Select
        selectionMode="single"
        items={items}
        defaultSelectedKeys={[modelId]}
        disallowEmptySelection
        onSelectionChange={(keys) => {
          if (keys.currentKey) setModelId(keys.currentKey)
        }}>
        {(model) => (
          <SelectItem textValue={model.label}>
            <span>{model.label}</span>
          </SelectItem>
        )}
      </Select>
    </SettingItem>
  )
}
