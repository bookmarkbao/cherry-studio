import { CheckOutlined, FolderOutlined, LoadingOutlined, SyncOutlined, WarningOutlined } from '@ant-design/icons'
import { HStack } from '@renderer/components/Layout'
import NutstorePathPopup from '@renderer/components/Popups/NutsorePathPopup'
import Selector from '@renderer/components/Selector'
import { WebdavBackupManager } from '@renderer/components/WebdavBackupManager'
import { useWebdavBackupModal, WebdavBackupModal } from '@renderer/components/WebdavModals'
import { useTheme } from '@renderer/context/ThemeProvider'
import { useNutstoreSSO } from '@renderer/hooks/useNutstoreSSO'
import { useTimer } from '@renderer/hooks/useTimer'
import {
  backupToNutstore,
  checkConnection,
  createDirectory,
  restoreFromNutstore,
  startNutstoreAutoSync,
  stopNutstoreAutoSync
} from '@renderer/services/NutstoreService'
import { useAppDispatch, useAppSelector } from '@renderer/store'
import {
  setNutstoreAutoSync,
  setNutstoreMaxBackups,
  setNutstorePath,
  setNutstoreSingleFileName,
  setNutstoreSingleFileOverwrite,
  setNutstoreSkipBackupFile,
  setNutstoreSyncInterval,
  setNutstoreToken
} from '@renderer/store/nutstore'
import { modalConfirm } from '@renderer/utils'
import { NUTSTORE_HOST } from '@shared/config/nutstore'
import { Button, Input, Switch, Tooltip, Typography } from 'antd'
import dayjs from 'dayjs'
import { FC, useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { type FileStat } from 'webdav'

import { SettingDivider, SettingGroup, SettingHelpText, SettingRow, SettingRowTitle, SettingTitle } from '..'

const NutstoreSettings: FC = () => {
  const { theme } = useTheme()
  const { t } = useTranslation()
  const {
    nutstoreToken,
    nutstorePath,
    nutstoreSyncInterval,
    nutstoreAutoSync,
    nutstoreSyncState,
    nutstoreSkipBackupFile,
    nutstoreMaxBackups,
    nutstoreSingleFileOverwrite,
    nutstoreSingleFileName
  } = useAppSelector((state) => state.nutstore)

  const dispatch = useAppDispatch()

  const [nutstoreUsername, setNutstoreUsername] = useState<string | undefined>(undefined)
  const [nutstorePass, setNutstorePass] = useState<string | undefined>(undefined)
  const [storagePath, setStoragePath] = useState<string | undefined>(nutstorePath)
  const [checkConnectionLoading, setCheckConnectionLoading] = useState(false)
  const [nsConnected, setNsConnected] = useState<boolean>(false)
  const [syncInterval, setSyncInterval] = useState<number>(nutstoreSyncInterval)
  const [maxBackups, setMaxBackups] = useState<number>(nutstoreMaxBackups)
  const [nutSkipBackupFile, setNutSkipBackupFile] = useState<boolean>(nutstoreSkipBackupFile)
  const [nutSingleFileOverwrite, setNutSingleFileOverwrite] = useState<boolean>(nutstoreSingleFileOverwrite ?? false)
  const [nutSingleFileName, setNutSingleFileName] = useState<string>(nutstoreSingleFileName ?? '')
  const [backupManagerVisible, setBackupManagerVisible] = useState(false)

  const nutstoreSSOHandler = useNutstoreSSO()
  const { setTimeoutTimer } = useTimer()

  // 同步 maxBackups 状态
  useEffect(() => {
    setMaxBackups(nutstoreMaxBackups)
  }, [nutstoreMaxBackups])

  const handleClickNutstoreSSO = useCallback(async () => {
    const ssoUrl = await window.api.nutstore.getSSOUrl()
    window.open(ssoUrl, '_blank')
    const nutstoreToken = await nutstoreSSOHandler()

    dispatch(setNutstoreToken(nutstoreToken))
  }, [dispatch, nutstoreSSOHandler])

  useEffect(() => {
    async function decryptTokenEffect() {
      if (nutstoreToken) {
        const decrypted = await window.api.nutstore.decryptToken(nutstoreToken)

        if (decrypted) {
          setNutstoreUsername(decrypted.username)
          setNutstorePass(decrypted.access_token)
          if (!nutstorePath) {
            dispatch(setNutstorePath('/cherry-studio'))
            setStoragePath('/cherry-studio')
          }
        }
      }
    }
    decryptTokenEffect()
  }, [nutstoreToken, dispatch, nutstorePath])

  const handleLayout = useCallback(async () => {
    const confirmedLogout = await modalConfirm({
      title: t('settings.data.nutstore.logout.title'),
      content: t('settings.data.nutstore.logout.content')
    })
    if (confirmedLogout) {
      dispatch(setNutstoreToken(''))
      dispatch(setNutstorePath(''))
      dispatch(setNutstoreAutoSync(false))
      setNutstoreUsername('')
      setStoragePath(undefined)
    }
  }, [dispatch, t])

  const handleCheckConnection = async () => {
    if (!nutstoreToken) return
    setCheckConnectionLoading(true)
    const isConnectedToNutstore = await checkConnection()

    window.toast[isConnectedToNutstore ? 'success' : 'error']({
      timeout: 2000,
      title: isConnectedToNutstore
        ? t('settings.data.nutstore.checkConnection.success')
        : t('settings.data.nutstore.checkConnection.fail')
    })

    setNsConnected(isConnectedToNutstore)
    setCheckConnectionLoading(false)

    setTimeoutTimer('handleCheckConnection', () => setNsConnected(false), 3000)
  }

  const { isModalVisible, handleBackup, handleCancel, backuping, customFileName, setCustomFileName, showBackupModal } =
    useWebdavBackupModal({
      backupMethod: backupToNutstore
    })

  const onSyncIntervalChange = (value: number) => {
    setSyncInterval(value)
    dispatch(setNutstoreSyncInterval(value))
    if (value === 0) {
      dispatch(setNutstoreAutoSync(false))
      stopNutstoreAutoSync()
    } else {
      dispatch(setNutstoreAutoSync(true))
      startNutstoreAutoSync()
    }
  }

  const onSkipBackupFilesChange = (value: boolean) => {
    setNutSkipBackupFile(value)
    dispatch(setNutstoreSkipBackupFile(value))
  }

  const onMaxBackupsChange = (value: number) => {
    setMaxBackups(value)
    dispatch(setNutstoreMaxBackups(value))
  }

  const onSingleFileOverwriteChange = (value: boolean) => {
    // Only show confirmation when enabling
    if (value && !nutSingleFileOverwrite) {
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
          setNutSingleFileOverwrite(value)
          dispatch(setNutstoreSingleFileOverwrite(value))
        }
      })
    } else {
      setNutSingleFileOverwrite(value)
      dispatch(setNutstoreSingleFileOverwrite(value))
    }
  }

  const onSingleFileNameChange = (value: string) => {
    setNutSingleFileName(value)
  }

  const onSingleFileNameBlur = () => {
    const trimmed = nutSingleFileName.trim()
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
    dispatch(setNutstoreSingleFileName(trimmed))
  }

  const handleClickPathChange = async () => {
    if (!nutstoreToken) {
      return
    }

    const result = await window.api.nutstore.decryptToken(nutstoreToken)

    if (!result) {
      return
    }

    const targetPath = await NutstorePathPopup.show({
      ls: async (target: string) => {
        const { username, access_token } = result
        const token = window.btoa(`${username}:${access_token}`)
        const items = await window.api.nutstore.getDirectoryContents(token, target)
        return items.map(fileStatToStatModel)
      },
      mkdirs: async (path) => {
        await createDirectory(path)
      }
    })

    if (!targetPath) {
      return
    }

    setStoragePath(targetPath)
    dispatch(setNutstorePath(targetPath))
  }

  const renderSyncStatus = () => {
    if (!nutstoreToken) return null

    if (!nutstoreSyncState.lastSyncTime && !nutstoreSyncState.syncing && !nutstoreSyncState.lastSyncError) {
      return <span style={{ color: 'var(--text-secondary)' }}>{t('settings.data.webdav.noSync')}</span>
    }

    return (
      <HStack gap="5px" alignItems="center">
        {nutstoreSyncState.syncing && <SyncOutlined spin />}
        {!nutstoreSyncState.syncing && nutstoreSyncState.lastSyncError && (
          <Tooltip title={`${t('settings.data.webdav.syncError')}: ${nutstoreSyncState.lastSyncError}`}>
            <WarningOutlined style={{ color: 'red' }} />
          </Tooltip>
        )}
        {nutstoreSyncState.lastSyncTime && (
          <span style={{ color: 'var(--text-secondary)' }}>
            {t('settings.data.webdav.lastSync')}: {dayjs(nutstoreSyncState.lastSyncTime).format('HH:mm:ss')}
          </span>
        )}
      </HStack>
    )
  }

  const isLogin = nutstoreToken && nutstoreUsername

  const showBackupManager = () => {
    setBackupManagerVisible(true)
  }

  const closeBackupManager = () => {
    setBackupManagerVisible(false)
  }

  return (
    <SettingGroup theme={theme}>
      <SettingTitle>{t('settings.data.nutstore.title')}</SettingTitle>
      <SettingDivider />
      <SettingRow>
        <SettingRowTitle>
          {isLogin ? t('settings.data.nutstore.isLogin') : t('settings.data.nutstore.notLogin')}
        </SettingRowTitle>
        {isLogin ? (
          <HStack gap="5px" justifyContent="space-between" alignItems="center">
            <Button
              type={nsConnected ? 'primary' : 'default'}
              ghost={nsConnected}
              onClick={handleCheckConnection}
              loading={checkConnectionLoading}>
              {checkConnectionLoading ? (
                <LoadingOutlined spin />
              ) : nsConnected ? (
                <CheckOutlined />
              ) : (
                t('settings.data.nutstore.checkConnection.name')
              )}
            </Button>
            <Button type="primary" danger onClick={handleLayout}>
              {t('settings.data.nutstore.logout.button')}
            </Button>
          </HStack>
        ) : (
          <Button onClick={handleClickNutstoreSSO}>{t('settings.data.nutstore.login.button')}</Button>
        )}
      </SettingRow>
      <SettingDivider />
      {isLogin && (
        <>
          <SettingRow>
            <SettingRowTitle>{t('settings.data.nutstore.username')}</SettingRowTitle>
            <Typography.Text style={{ color: 'var(--color-text-3)' }}>{nutstoreUsername}</Typography.Text>
          </SettingRow>

          <SettingDivider />
          <SettingRow>
            <SettingRowTitle>{t('settings.data.nutstore.path.label')}</SettingRowTitle>
            <HStack gap="4px" justifyContent="space-between">
              <Input
                placeholder={t('settings.data.nutstore.path.placeholder')}
                style={{ width: 250 }}
                value={nutstorePath}
                onChange={(e) => {
                  setStoragePath(e.target.value)
                  dispatch(setNutstorePath(e.target.value))
                }}
              />
              <Button type="default" onClick={handleClickPathChange}>
                <FolderOutlined />
              </Button>
            </HStack>
          </SettingRow>
          <SettingDivider />
          <SettingRow>
            <SettingRowTitle>{t('settings.general.backup.title')}</SettingRowTitle>
            <HStack gap="5px" justifyContent="space-between">
              <Button onClick={showBackupModal} loading={backuping}>
                {t('settings.data.nutstore.backup.button')}
              </Button>
              <Button onClick={showBackupManager} disabled={!nutstoreToken}>
                {t('settings.data.nutstore.restore.button')}
              </Button>
            </HStack>
          </SettingRow>
          <SettingDivider />
          <SettingRow>
            <SettingRowTitle>{t('settings.data.webdav.autoSync.label')}</SettingRowTitle>
            <Selector
              size={14}
              value={syncInterval}
              onChange={onSyncIntervalChange}
              options={[
                { label: t('settings.data.webdav.autoSync.off'), value: 0 },
                { label: t('settings.data.webdav.minute_interval', { count: 1 }), value: 1 },
                { label: t('settings.data.webdav.minute_interval', { count: 5 }), value: 5 },
                { label: t('settings.data.webdav.minute_interval', { count: 15 }), value: 15 },
                { label: t('settings.data.webdav.minute_interval', { count: 30 }), value: 30 },
                { label: t('settings.data.webdav.hour_interval', { count: 1 }), value: 60 },
                { label: t('settings.data.webdav.hour_interval', { count: 2 }), value: 120 },
                { label: t('settings.data.webdav.hour_interval', { count: 6 }), value: 360 },
                { label: t('settings.data.webdav.hour_interval', { count: 12 }), value: 720 },
                { label: t('settings.data.webdav.hour_interval', { count: 24 }), value: 1440 }
              ]}
            />
          </SettingRow>
          {nutstoreAutoSync && syncInterval > 0 && (
            <>
              <SettingDivider />
              <SettingRow>
                <SettingRowTitle>{t('settings.data.webdav.syncStatus')}</SettingRowTitle>
                {renderSyncStatus()}
              </SettingRow>
            </>
          )}
          <SettingDivider />
          <SettingRow>
            <SettingRowTitle>{t('settings.data.webdav.maxBackups')}</SettingRowTitle>
            <Selector
              size={14}
              value={nutstoreMaxBackups}
              onChange={onMaxBackupsChange}
              disabled={!nutstoreToken}
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
            <Switch checked={nutSkipBackupFile} onChange={onSkipBackupFilesChange} />
          </SettingRow>
          <SettingRow>
            <SettingHelpText>{t('settings.data.backup.skip_file_data_help')}</SettingHelpText>
          </SettingRow>
          {/* 覆盖式单文件备份，仅在自动备份开启且保留份数=1时推荐启用 */}
          <SettingDivider />
          <SettingRow>
            <SettingRowTitle>
              {t('settings.data.backup.singleFileOverwrite.title') || '覆盖式单文件备份（同名覆盖）'}
            </SettingRowTitle>
            <Switch
              checked={nutSingleFileOverwrite}
              onChange={onSingleFileOverwriteChange}
              disabled={!(syncInterval > 0 && maxBackups === 1)}
            />
          </SettingRow>
          <SettingRow>
            <SettingHelpText>
              {t('settings.data.backup.singleFileOverwrite.help') || (
                <div>
                  <p>当自动备份开启且保留份数为1时，使用固定文件名每次覆盖。</p>
                  <p style={{ marginTop: 8, fontSize: 12, color: 'var(--text-secondary)' }}>
                    推荐场景：只需要保留最新备份，节省坚果云存储空间
                  </p>
                </div>
              )}
            </SettingHelpText>
          </SettingRow>
          <SettingDivider />
          <SettingRow>
            <SettingRowTitle>
              {t('settings.data.backup.singleFileName.title') || '自定义文件名（可选）'}
            </SettingRowTitle>
            <Input
              placeholder={
                t('settings.data.backup.singleFileName.placeholder') || '如：cherry-studio.<hostname>.<device>.zip'
              }
              value={nutSingleFileName}
              onChange={(e) => onSingleFileNameChange(e.target.value)}
              onBlur={onSingleFileNameBlur}
              style={{ width: 300 }}
              disabled={!nutSingleFileOverwrite || !(syncInterval > 0 && maxBackups === 1)}
            />
          </SettingRow>
          <SettingRow>
            <SettingHelpText>
              {t('settings.data.backup.singleFileName.help') || (
                <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                  <p>• 留空将使用默认格式：cherry-studio.[主机名].[设备类型].zip</p>
                  <p>
                    • 支持的变量：{`{hostname}`} - 主机名，{`{device}`} - 设备类型
                  </p>
                  <p>• 不支持的字符：{'<>:"/\\|?*'}</p>
                  <p>• 最大长度：250个字符</p>
                </div>
              )}
            </SettingHelpText>
          </SettingRow>
        </>
      )}
      <>
        <WebdavBackupModal
          isModalVisible={isModalVisible}
          handleBackup={handleBackup}
          handleCancel={handleCancel}
          backuping={backuping}
          customFileName={customFileName}
          setCustomFileName={setCustomFileName}
          customLabels={{
            modalTitle: t('settings.data.nutstore.backup.modal.title'),
            filenamePlaceholder: t('settings.data.nutstore.backup.modal.filename.placeholder')
          }}
        />

        <WebdavBackupManager
          visible={backupManagerVisible}
          onClose={closeBackupManager}
          webdavConfig={{
            webdavHost: NUTSTORE_HOST,
            webdavUser: nutstoreUsername,
            webdavPass: nutstorePass,
            webdavPath: storagePath
          }}
          restoreMethod={restoreFromNutstore}
          customLabels={{
            restoreConfirmTitle: t('settings.data.nutstore.restore.confirm.title'),
            restoreConfirmContent: t('settings.data.nutstore.restore.confirm.content'),
            invalidConfigMessage: t('message.error.invalid.nutstore')
          }}
        />
      </>
    </SettingGroup>
  )
}

export interface StatModel {
  path: string
  basename: string
  isDir: boolean
  isDeleted: boolean
  mtime: number
  size: number
}

function fileStatToStatModel(from: FileStat): StatModel {
  return {
    path: from.filename,
    basename: from.basename,
    isDir: from.type === 'directory',
    isDeleted: false,
    mtime: new Date(from.lastmod).valueOf(),
    size: from.size
  }
}

export default NutstoreSettings
