import { Setting } from '@cherrystudio/api-sdk'

export const getSettingValue = (settings: Setting[], key: string): string => {
  const setting = settings.find((s) => s.key === key)
  return setting?.value || ''
}
