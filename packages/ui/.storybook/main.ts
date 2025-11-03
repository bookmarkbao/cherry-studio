import type { StorybookConfig } from '@storybook/react-vite'
import { resolve } from 'path'

const config: StorybookConfig = {
  stories: ['../stories/components/**/*.stories.@(js|jsx|ts|tsx)'],
  addons: ['@storybook/addon-docs', '@storybook/addon-themes'],
  framework: '@storybook/react-vite',
  viteFinal: async (config) => {
    const { mergeConfig } = await import('vite')
    const tailwindPlugin = (await import('@tailwindcss/vite')).default
    console.log('aliasaliasaliasaliasalias', resolve('src/index.ts'))
    return mergeConfig(config, {
      plugins: [tailwindPlugin()],
      resolve: {
        alias: {
          '@cherrystudio/ui': resolve('src')
        }
      }
    })
  }
}

export default config
