import { DeleteOutlined, FolderOpenOutlined, SaveOutlined, SyncOutlined, WarningOutlined } from '@ant-design/icons'
import { loggerService } from '@logger'
import { HStack } from '@renderer/components/Layout'
import { LocalBackupManager } from '@renderer/components/LocalBackupManager'
import { LocalBackupModal, useLocalBackupModal } from '@renderer/components/LocalBackupModals'
import Selector from '@renderer/components/Selector'
import { useTheme } from '@renderer/context/ThemeProvider'
import { useSettings } from '@renderer/hooks/useSettings'
import { startAutoSync, stopAutoSync } from '@renderer/services/BackupService'
import { useAppDispatch, useAppSelector } from '@renderer/store'
import {
  setLocalBackupAutoSync,
  setLocalBackupDir as _setLocalBackupDir,
  setLocalBackupMaxBackups as _setLocalBackupMaxBackups,
  setLocalBackupSkipBackupFile as _setLocalBackupSkipBackupFile,
  setLocalBackupSyncInterval as _setLocalBackupSyncInterval,
  setLocalSingleFileName as _setLocalSingleFileName,
  setLocalSingleFileOverwrite as _setLocalSingleFileOverwrite
} from '@renderer/store/settings'
import { AppInfo } from '@renderer/types'
import { Button, Input, Switch, Tooltip } from 'antd'
import dayjs from 'dayjs'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { SettingDivider, SettingGroup, SettingHelpText, SettingRow, SettingRowTitle, SettingTitle } from '..'

const logger = loggerService.withContext('LocalBackupSettings')

const LocalBackupSettings: React.FC = () => {
  const dispatch = useAppDispatch()

  const {
    localBackupDir: localBackupDirSetting,
    localBackupSyncInterval: localBackupSyncIntervalSetting,
    localBackupMaxBackups: localBackupMaxBackupsSetting,
    localBackupSkipBackupFile: localBackupSkipBackupFileSetting,
    localSingleFileOverwrite: localSingleFileOverwriteSetting,
    localSingleFileName: localSingleFileNameSetting
  } = useSettings()

  const [localBackupDir, setLocalBackupDir] = useState<string | undefined>(localBackupDirSetting)
  const [resolvedLocalBackupDir, setResolvedLocalBackupDir] = useState<string | undefined>(undefined)
  const [localBackupSkipBackupFile, setLocalBackupSkipBackupFile] = useState<boolean>(localBackupSkipBackupFileSetting)
  const [localSingleFileOverwrite, setLocalSingleFileOverwrite] = useState<boolean>(
    localSingleFileOverwriteSetting ?? false
  )
  const [localSingleFileName, setLocalSingleFileName] = useState<string>(localSingleFileNameSetting ?? '')
  const [backupManagerVisible, setBackupManagerVisible] = useState(false)

  const [syncInterval, setSyncInterval] = useState<number>(localBackupSyncIntervalSetting)
  const [maxBackups, setMaxBackups] = useState<number>(localBackupMaxBackupsSetting)

  const [appInfo, setAppInfo] = useState<AppInfo>()

  useEffect(() => {
    window.api.getAppInfo().then(setAppInfo)
  }, [])

  useEffect(() => {
    if (localBackupDirSetting) {
      window.api.resolvePath(localBackupDirSetting).then(setResolvedLocalBackupDir)
    }
  }, [localBackupDirSetting])

  const { theme } = useTheme()

  const { t } = useTranslation()

  const { localBackupSync } = useAppSelector((state) => state.backup)

  const onSyncIntervalChange = (value: number) => {
    setSyncInterval(value)
    dispatch(_setLocalBackupSyncInterval(value))
    if (value === 0) {
      dispatch(setLocalBackupAutoSync(false))
      stopAutoSync('local')
    } else {
      dispatch(setLocalBackupAutoSync(true))
      startAutoSync(false, 'local')
    }
  }

  const checkLocalBackupDirValid = async (dir: string) => {
    if (dir === '') {
      return false
    }

    const resolvedDir = await window.api.resolvePath(dir)

    // check new local backup dir is not in app data path
    // if is in app data path, show error
    if (await window.api.isPathInside(resolvedDir, appInfo!.appDataPath)) {
      window.toast.error(t('settings.data.local.directory.select_error_app_data_path'))
      return false
    }

    // check new local backup dir is not in app install path
    // if is in app install path, show error
    if (await window.api.isPathInside(resolvedDir, appInfo!.installPath)) {
      window.toast.error(t('settings.data.local.directory.select_error_in_app_install_path'))
      return false
    }

    // check new app data path has write permission
    const hasWritePermission = await window.api.hasWritePermission(resolvedDir)
    if (!hasWritePermission) {
      window.toast.error(t('settings.data.local.directory.select_error_write_permission'))
      return false
    }

    return true
  }

  const handleLocalBackupDirChange = async (value: string) => {
    if (value === localBackupDirSetting) {
      return
    }

    if (value === '') {
      handleClearDirectory()
      return
    }

    if (await checkLocalBackupDirValid(value)) {
      setLocalBackupDir(value)
      dispatch(_setLocalBackupDir(value))
      setResolvedLocalBackupDir(await window.api.resolvePath(value))

      dispatch(setLocalBackupAutoSync(true))
      startAutoSync(true, 'local')
      return
    }

    if (localBackupDirSetting) {
      setLocalBackupDir(localBackupDirSetting)
      return
    }
  }

  const onMaxBackupsChange = (value: number) => {
    setMaxBackups(value)
    dispatch(_setLocalBackupMaxBackups(value))
  }

  const onSkipBackupFilesChange = (value: boolean) => {
    setLocalBackupSkipBackupFile(value)
    dispatch(_setLocalBackupSkipBackupFile(value))
  }

  const onSingleFileOverwriteChange = (value: boolean) => {
    // Only show confirmation when enabling
    if (value && !localSingleFileOverwrite) {
      window.modal.confirm({
        title: t('settings.data.backup.singleFileOverwrite.confirm.title') || '启用覆盖式备份',
        content: (
          <div>
            <p>{t('settings.data.backup.singleFileOverwrite.confirm.content1') || '启用后，自动备份将：'}</p>
            <ul style={{ marginLeft: 20, marginTop: 10 }}>
              <li>{t('settings.data.backup.singleFileOverwrite.confirm.item1') || '使用固定文件名，不再添加时间戳'}</li>
              <li>{t('settings.data.backup.singleFileOverwrite.confirm.item2') || '每次备份都会覆盖同名文件'}</li>
              <li>{t('settings.data.backup.singleFileOverwrite.confirm.item3') || '仅保留最新的一个备份文件'}</li>
            </ul>
            <p style={{ marginTop: 10, color: 'var(--text-secondary)' }}>
              {t('settings.data.backup.singleFileOverwrite.confirm.note') ||
                '注意：此设置仅在自动备份且保留份数为1时生效'}
            </p>
          </div>
        ),
        okText: t('common.confirm') || '确认',
        cancelText: t('common.cancel') || '取消',
        onOk: () => {
          setLocalSingleFileOverwrite(value)
          dispatch(_setLocalSingleFileOverwrite(value))
        }
      })
    } else {
      setLocalSingleFileOverwrite(value)
      dispatch(_setLocalSingleFileOverwrite(value))
    }
  }

  const onSingleFileNameChange = (value: string) => {
    setLocalSingleFileName(value)
  }

  const onSingleFileNameBlur = () => {
    const trimmed = localSingleFileName.trim()
    // Validate filename
    if (trimmed) {
      // Check for invalid characters
      const invalidChars = /[<>:"/\\|?*]/
      if (invalidChars.test(trimmed)) {
        window.toast.error(t('settings.data.backup.singleFileName.invalid_chars') || '文件名包含无效字符')
        return
      }
      // Check for reserved names (Windows)
      const reservedNames = /^(CON|PRN|AUX|NUL|COM[1-9]|LPT[1-9])$/i
      const nameWithoutExt = trimmed.replace(/\.zip$/i, '')
      if (reservedNames.test(nameWithoutExt)) {
        window.toast.error(t('settings.data.backup.singleFileName.reserved') || '文件名是系统保留名称')
        return
      }
      // Check length
      if (trimmed.length > 250) {
        window.toast.error(t('settings.data.backup.singleFileName.too_long') || '文件名过长')
        return
      }
    }
    dispatch(_setLocalSingleFileName(trimmed))
  }

  const handleBrowseDirectory = async () => {
    try {
      const newLocalBackupDir = await window.api.select({
        properties: ['openDirectory', 'createDirectory'],
        title: t('settings.data.local.directory.select_title')
      })

      if (!newLocalBackupDir) {
        return
      }

      await handleLocalBackupDirChange(newLocalBackupDir)
    } catch (error) {
      logger.error('Failed to select directory:', error as Error)
    }
  }

  const handleClearDirectory = () => {
    setLocalBackupDir('')
    dispatch(_setLocalBackupDir(''))
    dispatch(setLocalBackupAutoSync(false))
    stopAutoSync('local')
  }

  const renderSyncStatus = () => {
    if (!localBackupDir) return null

    if (!localBackupSync.lastSyncTime && !localBackupSync.syncing && !localBackupSync.lastSyncError) {
      return <span style={{ color: 'var(--text-secondary)' }}>{t('settings.data.local.noSync')}</span>
    }

    return (
      <HStack gap="5px" alignItems="center">
        {localBackupSync.syncing && <SyncOutlined spin />}
        {!localBackupSync.syncing && localBackupSync.lastSyncError && (
          <Tooltip title={`${t('settings.data.local.syncError')}: ${localBackupSync.lastSyncError}`}>
            <WarningOutlined style={{ color: 'red' }} />
          </Tooltip>
        )}
        {localBackupSync.lastSyncTime && (
          <span style={{ color: 'var(--text-secondary)' }}>
            {t('settings.data.local.lastSync')}: {dayjs(localBackupSync.lastSyncTime).format('HH:mm:ss')}
          </span>
        )}
      </HStack>
    )
  }

  const { isModalVisible, handleBackup, handleCancel, backuping, customFileName, setCustomFileName, showBackupModal } =
    useLocalBackupModal(resolvedLocalBackupDir)

  const showBackupManager = () => {
    setBackupManagerVisible(true)
  }

  const closeBackupManager = () => {
    setBackupManagerVisible(false)
  }

  return (
    <SettingGroup theme={theme}>
      <SettingTitle>{t('settings.data.local.title')}</SettingTitle>
      <SettingDivider />
      {/* 覆盖式单文件备份，仅在自动备份开启且保留份数=1时推荐启用 */}
      <SettingRow>
        <SettingRowTitle>
          {t('settings.data.backup.singleFileOverwrite.title') || '覆盖式单文件备份（同名覆盖）'}
        </SettingRowTitle>
        <Switch
          checked={localSingleFileOverwrite}
          onChange={onSingleFileOverwriteChange}
          disabled={!(syncInterval > 0 && maxBackups === 1)}
        />
      </SettingRow>
      <SettingRow>
        <SettingHelpText>
          {t('settings.data.backup.singleFileOverwrite.help') ||
            '当自动备份开启且保留份数为1时，使用固定文件名每次覆盖。'}
        </SettingHelpText>
      </SettingRow>
      <SettingRow>
        <SettingRowTitle>{t('settings.data.backup.singleFileName.title') || '自定义文件名（可选）'}</SettingRowTitle>
        <Input
          placeholder={
            t('settings.data.backup.singleFileName.placeholder') || '如：cherry-studio.<hostname>.<device>.zip'
          }
          value={localSingleFileName}
          onChange={(e) => onSingleFileNameChange(e.target.value)}
          onBlur={onSingleFileNameBlur}
          style={{ width: 300 }}
          disabled={!localSingleFileOverwrite || !(syncInterval > 0 && maxBackups === 1)}
        />
      </SettingRow>
      <SettingDivider />
      <SettingRow>
        <SettingRowTitle>{t('settings.data.local.directory.label')}</SettingRowTitle>
        <HStack gap="5px">
          <Input
            value={localBackupDir}
            onChange={(e) => setLocalBackupDir(e.target.value)}
            onBlur={(e) => handleLocalBackupDirChange(e.target.value)}
            placeholder={t('settings.data.local.directory.placeholder')}
            style={{ minWidth: 200, maxWidth: 400, flex: 1 }}
          />
          <Button icon={<FolderOpenOutlined />} onClick={handleBrowseDirectory}>
            {t('common.browse')}
          </Button>
          <Button icon={<DeleteOutlined />} onClick={handleClearDirectory} disabled={!localBackupDir} danger>
            {t('common.clear')}
          </Button>
        </HStack>
      </SettingRow>
      <SettingDivider />
      <SettingRow>
        <SettingRowTitle>{t('settings.general.backup.title')}</SettingRowTitle>
        <HStack gap="5px" justifyContent="space-between">
          <Button onClick={showBackupModal} icon={<SaveOutlined />} loading={backuping} disabled={!localBackupDir}>
            {t('settings.data.local.backup.button')}
          </Button>
          <Button onClick={showBackupManager} icon={<FolderOpenOutlined />} disabled={!localBackupDir}>
            {t('settings.data.local.restore.button')}
          </Button>
        </HStack>
      </SettingRow>
      <SettingDivider />
      <SettingRow>
        <SettingRowTitle>{t('settings.data.local.autoSync.label')}</SettingRowTitle>
        <Selector
          size={14}
          value={syncInterval}
          onChange={onSyncIntervalChange}
          disabled={!localBackupDir}
          options={[
            { label: t('settings.data.local.autoSync.off'), value: 0 },
            { label: t('settings.data.local.minute_interval', { count: 1 }), value: 1 },
            { label: t('settings.data.local.minute_interval', { count: 5 }), value: 5 },
            { label: t('settings.data.local.minute_interval', { count: 15 }), value: 15 },
            { label: t('settings.data.local.minute_interval', { count: 30 }), value: 30 },
            { label: t('settings.data.local.hour_interval', { count: 1 }), value: 60 },
            { label: t('settings.data.local.hour_interval', { count: 2 }), value: 120 },
            { label: t('settings.data.local.hour_interval', { count: 6 }), value: 360 },
            { label: t('settings.data.local.hour_interval', { count: 12 }), value: 720 },
            { label: t('settings.data.local.hour_interval', { count: 24 }), value: 1440 }
          ]}
        />
      </SettingRow>
      <SettingDivider />
      <SettingRow>
        <SettingRowTitle>{t('settings.data.local.maxBackups.label')}</SettingRowTitle>
        <Selector
          size={14}
          value={maxBackups}
          onChange={onMaxBackupsChange}
          disabled={!localBackupDir}
          options={[
            { label: t('settings.data.local.maxBackups.unlimited'), value: 0 },
            { label: '1', value: 1 },
            { label: '3', value: 3 },
            { label: '5', value: 5 },
            { label: '10', value: 10 },
            { label: '20', value: 20 },
            { label: '50', value: 50 }
          ]}
        />
      </SettingRow>
      <SettingDivider />
      <SettingRow>
        <SettingRowTitle>{t('settings.data.backup.skip_file_data_title')}</SettingRowTitle>
        <Switch checked={localBackupSkipBackupFile} onChange={onSkipBackupFilesChange} />
      </SettingRow>
      <SettingRow>
        <SettingHelpText>{t('settings.data.backup.skip_file_data_help')}</SettingHelpText>
      </SettingRow>
      {localBackupSync && syncInterval > 0 && (
        <>
          <SettingDivider />
          <SettingRow>
            <SettingRowTitle>{t('settings.data.local.syncStatus')}</SettingRowTitle>
            {renderSyncStatus()}
          </SettingRow>
        </>
      )}
      <>
        <LocalBackupModal
          isModalVisible={isModalVisible}
          handleBackup={handleBackup}
          handleCancel={handleCancel}
          backuping={backuping}
          customFileName={customFileName}
          setCustomFileName={setCustomFileName}
        />

        <LocalBackupManager
          visible={backupManagerVisible}
          onClose={closeBackupManager}
          localBackupDir={resolvedLocalBackupDir}
        />
      </>
    </SettingGroup>
  )
}

export default LocalBackupSettings
