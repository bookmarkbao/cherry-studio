import { preferenceService } from '@data/PreferenceService'
import { loggerService } from '@logger'
import { defaultLanguage } from '@shared/config/constant'
import type { LanguageVarious } from '@shared/data/preference/preferenceTypes'
import { app } from 'electron'
import i18n from 'i18next'

// import deDE from '../../renderer/src/i18n/locales/de-de.json'
// import elGR from '../../renderer/src/i18n/locales/el-gr.json'
import EnUs from '../../renderer/src/i18n/locales/en-us.json'
// import esES from '../../renderer/src/i18n/locales/es-es.json'
// import frFR from '../../renderer/src/i18n/locales/fr-fr.json'
// import JaJP from '../../renderer/src/i18n/locales/ja-jp.json'
// import ptPT from '../../renderer/src/i18n/locales/pt-pt.json'
// import RuRu from '../../renderer/src/i18n/locales/ru-ru.json'
import ZhCn from '../../renderer/src/i18n/locales/zh-cn.json'
import ZhTw from '../../renderer/src/i18n/locales/zh-tw.json'

const logger = loggerService.withContext('i18n')

const resources = Object.fromEntries([
  ['en-us', EnUs],
  ['zh-cn', ZhCn],
  ['zh-tw', ZhTw]
  // ['ja-JP', JaJP],
  // ['ru-RU', RuRu],
  // ['de-DE', deDE],
  // ['el-GR', elGR],
  // ['es-ES', esES],
  // ['fr-FR', frFR],
  // ['pt-PT', ptPT]
] as const)

export const getAppLanguage = (): LanguageVarious => {
  const language = preferenceService.get('app.language')
  const appLocale = app.getLocale()

  if (language) {
    return language
  }

  return (Object.keys(resources).includes(appLocale) ? appLocale : defaultLanguage) as LanguageVarious
}

export const getI18n = (): Record<string, any> => {
  const language = getAppLanguage()
  return resources[language]
}

i18n.init({
  resources,
  lng: getAppLanguage(),
  fallbackLng: defaultLanguage,
  interpolation: {
    escapeValue: false
  },
  saveMissing: true,
  missingKeyHandler: (_1, _2, key) => {
    logger.error(`Missing key: ${key}`)
  }
})

const t = i18n.t

const changeLang: typeof i18n.changeLanguage = i18n.changeLanguage

export { changeLang, i18n, t }
