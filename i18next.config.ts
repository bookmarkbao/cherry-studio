import { defineConfig } from 'i18next-cli'

export default defineConfig({
  locales: ['en-us', 'zh-cn', 'zh-tw'],
  extract: {
    input: 'src/renderer/src/**/*.{ts,tsx}',
    output: 'src/renderer/src/i18n/locales/{{language}}.json'
  }
})
