import { preferenceService } from '@data/PreferenceService'
import { loggerService } from '@logger'
import { defaultLanguage } from '@shared/config/constant'
import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'

// import deDE from './locales/de-de.json'
// import elGR from './locales/el-gr.json'
import enUS from './locales/en-us.json'
// import esES from './locales/es-es.json'
// import frFR from './locales/fr-fr.json'
// import jaJP from './locales/ja-jp.json'
// import ptPT from './locales/pt-pt.json'
// import ruRU from './locales/ru-ru.json'
import zhCN from './locales/zh-cn.json'
import zhTW from './locales/zh-tw.json'

const logger = loggerService.withContext('I18N')

const resources = Object.fromEntries([
  ['en-US', enUS],
  // ['ja-JP', jaJP],
  // ['ru-RU', ruRU],
  ['zh-CN', zhCN],
  ['zh-TW', zhTW]
  // ['de-DE', deDE],
  // ['el-GR', elGR],
  // ['es-ES', esES],
  // ['fr-FR', frFR],
  // ['pt-PT', ptPT]
])

export const getLanguage = async () => {
  return (await preferenceService.get('app.language')) || navigator.language || defaultLanguage
}

export const getLanguageCode = async () => {
  return (await getLanguage()).split('-')[0]
}

i18n.use(initReactI18next).init({
  resources,
  lng: await getLanguage(),
  fallbackLng: defaultLanguage,
  interpolation: {
    escapeValue: false
  },
  saveMissing: true,
  missingKeyHandler: (_1, _2, key) => {
    logger.error(`Missing key: ${key}`)
  }
})

export default i18n
