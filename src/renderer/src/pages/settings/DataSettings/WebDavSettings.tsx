import { FolderOpenOutlined, SaveOutlined, SyncOutlined, WarningOutlined } from '@ant-design/icons'
import { HStack } from '@renderer/components/Layout'
import Selector from '@renderer/components/Selector'
import { WebdavBackupManager } from '@renderer/components/WebdavBackupManager'
import { useWebdavBackupModal, WebdavBackupModal } from '@renderer/components/WebdavModals'
import { useTheme } from '@renderer/context/ThemeProvider'
import { useSettings } from '@renderer/hooks/useSettings'
import { startAutoSync, stopAutoSync } from '@renderer/services/BackupService'
import { useAppDispatch, useAppSelector } from '@renderer/store'
import {
  setWebdavAutoSync,
  setWebdavDisableStream as _setWebdavDisableStream,
  setWebdavHost as _setWebdavHost,
  setWebdavMaxBackups as _setWebdavMaxBackups,
  setWebdavPass as _setWebdavPass,
  setWebdavPath as _setWebdavPath,
  setWebdavSingleFileName as _setWebdavSingleFileName,
  setWebdavSingleFileOverwrite as _setWebdavSingleFileOverwrite,
  setWebdavSkipBackupFile as _setWebdavSkipBackupFile,
  setWebdavSyncInterval as _setWebdavSyncInterval,
  setWebdavUser as _setWebdavUser
} from '@renderer/store/settings'
import { Button, Input, Switch, Tooltip } from 'antd'
import dayjs from 'dayjs'
import { FC, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { SettingDivider, SettingGroup, SettingHelpText, SettingRow, SettingRowTitle, SettingTitle } from '..'

const WebDavSettings: FC = () => {
  const {
    webdavHost: webDAVHost,
    webdavUser: webDAVUser,
    webdavPass: webDAVPass,
    webdavPath: webDAVPath,
    webdavSyncInterval: webDAVSyncInterval,
    webdavMaxBackups: webDAVMaxBackups,
    webdavSkipBackupFile: webdDAVSkipBackupFile,
    webdavDisableStream: webDAVDisableStream,
    webdavSingleFileOverwrite: webDAVSingleFileOverwrite,
    webdavSingleFileName: webDAVSingleFileName
  } = useSettings()

  const [webdavHost, setWebdavHost] = useState<string | undefined>(webDAVHost)
  const [webdavUser, setWebdavUser] = useState<string | undefined>(webDAVUser)
  const [webdavPass, setWebdavPass] = useState<string | undefined>(webDAVPass)
  const [webdavPath, setWebdavPath] = useState<string | undefined>(webDAVPath)
  const [webdavSkipBackupFile, setWebdavSkipBackupFile] = useState<boolean>(webdDAVSkipBackupFile)
  const [webdavDisableStream, setWebdavDisableStream] = useState<boolean>(webDAVDisableStream)
  const [webdavSingleFileOverwrite, setWebdavSingleFileOverwrite] = useState<boolean>(
    webDAVSingleFileOverwrite ?? false
  )
  const [webdavSingleFileName, setWebdavSingleFileName] = useState<string>(webDAVSingleFileName ?? '')
  const [backupManagerVisible, setBackupManagerVisible] = useState(false)

  const [syncInterval, setSyncInterval] = useState<number>(webDAVSyncInterval)
  const [maxBackups, setMaxBackups] = useState<number>(webDAVMaxBackups)

  const dispatch = useAppDispatch()
  const { theme } = useTheme()

  const { t } = useTranslation()

  const { webdavSync } = useAppSelector((state) => state.backup)

  // 同步 maxBackups 状态
  useEffect(() => {
    setMaxBackups(webDAVMaxBackups)
  }, [webDAVMaxBackups])

  // 把之前备份的文件定时上传到 webdav，首先先配置 webdav 的 host, port, user, pass, path

  const onSyncIntervalChange = (value: number) => {
    setSyncInterval(value)
    dispatch(_setWebdavSyncInterval(value))
    if (value === 0) {
      dispatch(setWebdavAutoSync(false))
      stopAutoSync('webdav')
    } else {
      dispatch(setWebdavAutoSync(true))
      startAutoSync(false, 'webdav')
    }
  }

  const onMaxBackupsChange = (value: number) => {
    setMaxBackups(value)
    dispatch(_setWebdavMaxBackups(value))
  }

  const onSkipBackupFilesChange = (value: boolean) => {
    setWebdavSkipBackupFile(value)
    dispatch(_setWebdavSkipBackupFile(value))
  }

  const onDisableStreamChange = (value: boolean) => {
    setWebdavDisableStream(value)
    dispatch(_setWebdavDisableStream(value))
  }

  const onSingleFileOverwriteChange = (value: boolean) => {
    // Only show confirmation when enabling
    if (value && !webdavSingleFileOverwrite) {
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
          setWebdavSingleFileOverwrite(value)
          dispatch(_setWebdavSingleFileOverwrite(value))
        }
      })
    } else {
      setWebdavSingleFileOverwrite(value)
      dispatch(_setWebdavSingleFileOverwrite(value))
    }
  }

  const onSingleFileNameChange = (value: string) => {
    setWebdavSingleFileName(value)
  }

  const onSingleFileNameBlur = () => {
    const trimmed = webdavSingleFileName.trim()
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
    dispatch(_setWebdavSingleFileName(trimmed))
  }

  const renderSyncStatus = () => {
    if (!webdavHost) return null

    if (!webdavSync.lastSyncTime && !webdavSync.syncing && !webdavSync.lastSyncError) {
      return <span style={{ color: 'var(--text-secondary)' }}>{t('settings.data.webdav.noSync')}</span>
    }

    return (
      <HStack gap="5px" alignItems="center">
        {webdavSync.syncing && <SyncOutlined spin />}
        {!webdavSync.syncing && webdavSync.lastSyncError && (
          <Tooltip title={`${t('settings.data.webdav.syncError')}: ${webdavSync.lastSyncError}`}>
            <WarningOutlined style={{ color: 'red' }} />
          </Tooltip>
        )}
        {webdavSync.lastSyncTime && (
          <span style={{ color: 'var(--text-secondary)' }}>
            {t('settings.data.webdav.lastSync')}: {dayjs(webdavSync.lastSyncTime).format('HH:mm:ss')}
          </span>
        )}
      </HStack>
    )
  }

  const { isModalVisible, handleBackup, handleCancel, backuping, customFileName, setCustomFileName, showBackupModal } =
    useWebdavBackupModal()

  const showBackupManager = () => {
    setBackupManagerVisible(true)
  }

  const closeBackupManager = () => {
    setBackupManagerVisible(false)
  }

  return (
    <SettingGroup theme={theme}>
      <SettingTitle>{t('settings.data.webdav.title')}</SettingTitle>
      <SettingDivider />
      <SettingRow>
        <SettingRowTitle>{t('settings.data.webdav.host.label')}</SettingRowTitle>
        <Input
          placeholder={t('settings.data.webdav.host.placeholder')}
          value={webdavHost}
          onChange={(e) => setWebdavHost(e.target.value)}
          style={{ width: 250 }}
          type="url"
          onBlur={() => dispatch(_setWebdavHost(webdavHost || ''))}
        />
      </SettingRow>
      <SettingDivider />
      <SettingRow>
        <SettingRowTitle>{t('settings.data.webdav.user')}</SettingRowTitle>
        <Input
          placeholder={t('settings.data.webdav.user')}
          value={webdavUser}
          onChange={(e) => setWebdavUser(e.target.value)}
          style={{ width: 250 }}
          onBlur={() => dispatch(_setWebdavUser(webdavUser || ''))}
        />
      </SettingRow>
      <SettingDivider />
      <SettingRow>
        <SettingRowTitle>{t('settings.data.webdav.password')}</SettingRowTitle>
        <Input.Password
          placeholder={t('settings.data.webdav.password')}
          value={webdavPass}
          onChange={(e) => setWebdavPass(e.target.value)}
          style={{ width: 250 }}
          onBlur={() => dispatch(_setWebdavPass(webdavPass || ''))}
        />
      </SettingRow>
      <SettingDivider />
      <SettingRow>
        <SettingRowTitle>{t('settings.data.webdav.path.label')}</SettingRowTitle>
        <Input
          placeholder={t('settings.data.webdav.path.placeholder')}
          value={webdavPath}
          onChange={(e) => setWebdavPath(e.target.value)}
          style={{ width: 250 }}
          onBlur={() => dispatch(_setWebdavPath(webdavPath || ''))}
        />
      </SettingRow>
      <SettingDivider />
      <SettingRow>
        <SettingRowTitle>{t('settings.general.backup.title')}</SettingRowTitle>
        <HStack gap="5px" justifyContent="space-between">
          <Button onClick={showBackupModal} icon={<SaveOutlined />} loading={backuping}>
            {t('settings.data.webdav.backup.button')}
          </Button>
          <Button onClick={showBackupManager} icon={<FolderOpenOutlined />} disabled={!webdavHost}>
            {t('settings.data.webdav.restore.button')}
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
          disabled={!webdavHost}
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
      <SettingDivider />
      <SettingRow>
        <SettingRowTitle>{t('settings.data.webdav.maxBackups')}</SettingRowTitle>
        <Selector
          size={14}
          value={maxBackups}
          onChange={onMaxBackupsChange}
          disabled={!webdavHost}
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
        <Switch checked={webdavSkipBackupFile} onChange={onSkipBackupFilesChange} />
      </SettingRow>
      <SettingRow>
        <SettingHelpText>{t('settings.data.backup.skip_file_data_help')}</SettingHelpText>
      </SettingRow>
      <SettingDivider />
      <SettingRow>
        <SettingRowTitle>{t('settings.data.webdav.disableStream.title')}</SettingRowTitle>
        <Switch checked={webdavDisableStream} onChange={onDisableStreamChange} />
      </SettingRow>
      <SettingRow>
        <SettingHelpText>{t('settings.data.webdav.disableStream.help')}</SettingHelpText>
      </SettingRow>
      {/* 覆盖式单文件备份，仅在自动备份开启且保留份数=1时推荐启用 */}
      <SettingDivider />
      <SettingRow>
        <SettingRowTitle>
          {t('settings.data.backup.singleFileOverwrite.title') || '覆盖式单文件备份（同名覆盖）'}
        </SettingRowTitle>
        <Switch
          checked={webdavSingleFileOverwrite}
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
                推荐场景：只需要保留最新备份，节省存储空间
              </p>
            </div>
          )}
        </SettingHelpText>
      </SettingRow>
      <SettingDivider />
      <SettingRow>
        <SettingRowTitle>{t('settings.data.backup.singleFileName.title') || '自定义文件名（可选）'}</SettingRowTitle>
        <Input
          placeholder={
            t('settings.data.backup.singleFileName.placeholder') || '如：cherry-studio.<hostname>.<device>.zip'
          }
          value={webdavSingleFileName}
          onChange={(e) => onSingleFileNameChange(e.target.value)}
          onBlur={onSingleFileNameBlur}
          style={{ width: 300 }}
          disabled={!webdavSingleFileOverwrite || !(syncInterval > 0 && maxBackups === 1)}
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
      {webdavSync && syncInterval > 0 && (
        <>
          <SettingDivider />
          <SettingRow>
            <SettingRowTitle>{t('settings.data.webdav.syncStatus')}</SettingRowTitle>
            {renderSyncStatus()}
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
        />

        <WebdavBackupManager
          visible={backupManagerVisible}
          onClose={closeBackupManager}
          webdavConfig={{
            webdavHost,
            webdavUser,
            webdavPass,
            webdavPath,
            webdavDisableStream
          }}
        />
      </>
    </SettingGroup>
  )
}

export default WebDavSettings
