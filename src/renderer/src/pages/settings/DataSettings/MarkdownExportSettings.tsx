import { DeleteOutlined, FolderOpenOutlined } from '@ant-design/icons'
import { HStack } from '@renderer/components/Layout'
import { useTheme } from '@renderer/context/ThemeProvider'
import { RootState, useAppDispatch } from '@renderer/store'
import {
  setExcludeCitationsInExport,
  setForceDollarMathInMarkdown,
  setImageExportMaxSize,
  setImageExportMode,
  setImageExportQuality,
  setmarkdownExportPath,
  setShowModelNameInMarkdown,
  setShowModelProviderInMarkdown,
  setStandardizeCitationsInExport,
  setUseTopicNamingForMessageTitle
} from '@renderer/store/settings'
import { Button, Select, Slider, Switch } from 'antd'
import Input from 'antd/es/input/Input'
import { FC } from 'react'
import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'

import { SettingDivider, SettingGroup, SettingHelpText, SettingRow, SettingRowTitle, SettingTitle } from '..'

const MarkdownExportSettings: FC = () => {
  const { t } = useTranslation()
  const { theme } = useTheme()
  const dispatch = useAppDispatch()

  const markdownExportPath = useSelector((state: RootState) => state.settings.markdownExportPath)
  const forceDollarMathInMarkdown = useSelector((state: RootState) => state.settings.forceDollarMathInMarkdown)
  const useTopicNamingForMessageTitle = useSelector((state: RootState) => state.settings.useTopicNamingForMessageTitle)
  const showModelNameInExport = useSelector((state: RootState) => state.settings.showModelNameInMarkdown)
  const showModelProviderInMarkdown = useSelector((state: RootState) => state.settings.showModelProviderInMarkdown)
  const excludeCitationsInExport = useSelector((state: RootState) => state.settings.excludeCitationsInExport)
  const standardizeCitationsInExport = useSelector((state: RootState) => state.settings.standardizeCitationsInExport)
  const imageExportMode = useSelector((state: RootState) => state.settings.imageExportMode)
  const imageExportQuality = useSelector((state: RootState) => state.settings.imageExportQuality)
  const imageExportMaxSize = useSelector((state: RootState) => state.settings.imageExportMaxSize)

  const handleSelectFolder = async () => {
    const path = await window.api.file.selectFolder()
    if (path) {
      dispatch(setmarkdownExportPath(path))
    }
  }

  const handleClearPath = () => {
    dispatch(setmarkdownExportPath(null))
  }

  const handleToggleForceDollarMath = (checked: boolean) => {
    dispatch(setForceDollarMathInMarkdown(checked))
  }

  const handleToggleTopicNaming = (checked: boolean) => {
    dispatch(setUseTopicNamingForMessageTitle(checked))
  }

  const handleToggleShowModelName = (checked: boolean) => {
    dispatch(setShowModelNameInMarkdown(checked))
  }

  const handleToggleShowModelProvider = (checked: boolean) => {
    dispatch(setShowModelProviderInMarkdown(checked))
  }

  const handleToggleExcludeCitations = (checked: boolean) => {
    dispatch(setExcludeCitationsInExport(checked))
  }

  const handleToggleStandardizeCitations = (checked: boolean) => {
    dispatch(setStandardizeCitationsInExport(checked))
  }

  const handleImageExportModeChange = (value: 'base64' | 'folder' | 'none') => {
    dispatch(setImageExportMode(value))
  }

  const handleImageExportQualityChange = (value: number) => {
    dispatch(setImageExportQuality(value))
  }

  const handleImageExportMaxSizeChange = (value: number) => {
    dispatch(setImageExportMaxSize(value))
  }

  return (
    <SettingGroup theme={theme}>
      <SettingTitle>{t('settings.data.markdown_export.title')}</SettingTitle>
      <SettingDivider />
      <SettingRow>
        <SettingRowTitle>{t('settings.data.markdown_export.path')}</SettingRowTitle>
        <HStack alignItems="center" gap="5px" style={{ width: 315 }}>
          <Input
            type="text"
            value={markdownExportPath || ''}
            readOnly
            style={{ width: 250 }}
            placeholder={t('settings.data.markdown_export.path_placeholder')}
            suffix={
              markdownExportPath ? (
                <DeleteOutlined onClick={handleClearPath} style={{ color: 'var(--color-error)', cursor: 'pointer' }} />
              ) : null
            }
          />
          <Button onClick={handleSelectFolder} icon={<FolderOpenOutlined />}>
            {t('settings.data.markdown_export.select')}
          </Button>
        </HStack>
      </SettingRow>
      <SettingRow>
        <SettingHelpText>{t('settings.data.markdown_export.help')}</SettingHelpText>
      </SettingRow>
      <SettingDivider />
      <SettingRow>
        <SettingRowTitle>{t('settings.data.markdown_export.force_dollar_math.title')}</SettingRowTitle>
        <Switch checked={forceDollarMathInMarkdown} onChange={handleToggleForceDollarMath} />
      </SettingRow>
      <SettingRow>
        <SettingHelpText>{t('settings.data.markdown_export.force_dollar_math.help')}</SettingHelpText>
      </SettingRow>
      <SettingDivider />
      <SettingRow>
        <SettingRowTitle>{t('settings.data.message_title.use_topic_naming.title')}</SettingRowTitle>
        <Switch checked={useTopicNamingForMessageTitle} onChange={handleToggleTopicNaming} />
      </SettingRow>
      <SettingRow>
        <SettingHelpText>{t('settings.data.message_title.use_topic_naming.help')}</SettingHelpText>
      </SettingRow>
      <SettingDivider />
      <SettingRow>
        <SettingRowTitle>{t('settings.data.markdown_export.show_model_name.title')}</SettingRowTitle>
        <Switch checked={showModelNameInExport} onChange={handleToggleShowModelName} />
      </SettingRow>
      <SettingRow>
        <SettingHelpText>{t('settings.data.markdown_export.show_model_name.help')}</SettingHelpText>
      </SettingRow>
      <SettingDivider />
      <SettingRow>
        <SettingRowTitle>{t('settings.data.markdown_export.show_model_provider.title')}</SettingRowTitle>
        <Switch checked={showModelProviderInMarkdown} onChange={handleToggleShowModelProvider} />
      </SettingRow>
      <SettingRow>
        <SettingHelpText>{t('settings.data.markdown_export.show_model_provider.help')}</SettingHelpText>
      </SettingRow>
      <SettingDivider />
      <SettingRow>
        <SettingRowTitle>{t('settings.data.markdown_export.exclude_citations.title')}</SettingRowTitle>
        <Switch checked={excludeCitationsInExport} onChange={handleToggleExcludeCitations} />
      </SettingRow>
      <SettingRow>
        <SettingHelpText>{t('settings.data.markdown_export.exclude_citations.help')}</SettingHelpText>
      </SettingRow>
      <SettingDivider />
      <SettingRow>
        <SettingRowTitle>{t('settings.data.markdown_export.standardize_citations.title')}</SettingRowTitle>
        <Switch checked={standardizeCitationsInExport} onChange={handleToggleStandardizeCitations} />
      </SettingRow>
      <SettingRow>
        <SettingHelpText>{t('settings.data.markdown_export.standardize_citations.help')}</SettingHelpText>
      </SettingRow>
      <SettingDivider />
      <SettingRow>
        <SettingRowTitle>{t('settings.data.markdown_export.image_export_mode.title')}</SettingRowTitle>
        <Select value={imageExportMode} onChange={handleImageExportModeChange} style={{ width: 200 }}>
          <Select.Option value="none">{t('settings.data.markdown_export.image_export_mode.none')}</Select.Option>
          <Select.Option value="base64">{t('settings.data.markdown_export.image_export_mode.base64')}</Select.Option>
          <Select.Option value="folder">{t('settings.data.markdown_export.image_export_mode.folder')}</Select.Option>
        </Select>
      </SettingRow>
      <SettingRow>
        <SettingHelpText>{t('settings.data.markdown_export.image_export_mode.help')}</SettingHelpText>
      </SettingRow>
      {imageExportMode !== 'none' && (
        <>
          <SettingDivider />
          <SettingRow>
            <SettingRowTitle>{t('settings.data.markdown_export.image_quality.title')}</SettingRowTitle>
            <HStack alignItems="center" gap="10px" style={{ width: 315 }}>
              <Slider
                min={10}
                max={100}
                step={5}
                value={imageExportQuality}
                onChange={handleImageExportQualityChange}
                style={{ width: 200 }}
              />
              <span>{imageExportQuality}%</span>
            </HStack>
          </SettingRow>
          <SettingRow>
            <SettingHelpText>{t('settings.data.markdown_export.image_quality.help')}</SettingHelpText>
          </SettingRow>
          <SettingDivider />
          <SettingRow>
            <SettingRowTitle>{t('settings.data.markdown_export.image_max_size.title')}</SettingRowTitle>
            <HStack alignItems="center" gap="10px" style={{ width: 315 }}>
              <Slider
                min={512}
                max={4096}
                step={256}
                value={imageExportMaxSize}
                onChange={handleImageExportMaxSizeChange}
                style={{ width: 200 }}
              />
              <span>{imageExportMaxSize}px</span>
            </HStack>
          </SettingRow>
          <SettingRow>
            <SettingHelpText>{t('settings.data.markdown_export.image_max_size.help')}</SettingHelpText>
          </SettingRow>
        </>
      )}
    </SettingGroup>
  )
}

export default MarkdownExportSettings
