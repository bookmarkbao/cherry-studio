import { loggerService } from '@logger'
import { isWin } from '@main/constant'
import { generateUserAgent } from '@main/utils/systemInfo'
import { IpcChannel } from '@shared/IpcChannel'
import { CancellationToken, UpdateInfo } from 'builder-util-runtime'
import { app } from 'electron'
import { AppUpdater as _AppUpdater, autoUpdater, Logger, NsisUpdater, UpdateCheckResult } from 'electron-updater'
import path from 'path'

import { configManager } from './ConfigManager'
import { windowService } from './WindowService'

const logger = loggerService.withContext('AppUpdater')

// Language markers constants for multi-language release notes
const LANG_MARKERS = {
  EN_START: '<!--LANG:en-->',
  ZH_CN_START: '<!--LANG:zh-CN-->',
  END: '<!--LANG:END-->'
} as const

export default class AppUpdater {
  autoUpdater: _AppUpdater = autoUpdater
  private cancellationToken: CancellationToken = new CancellationToken()
  private updateCheckResult: UpdateCheckResult | null = null

  constructor() {
    autoUpdater.logger = logger as Logger
    autoUpdater.forceDevUpdateConfig = !app.isPackaged
    autoUpdater.autoDownload = configManager.getAutoUpdate()
    autoUpdater.autoInstallOnAppQuit = configManager.getAutoUpdate()
    autoUpdater.requestHeaders = {
      ...autoUpdater.requestHeaders,
      'User-Agent': generateUserAgent(),
      'X-Client-Id': configManager.getClientId()
    }

    autoUpdater.on('error', (error) => {
      logger.error('update error', error as Error)
      windowService.getMainWindow()?.webContents.send(IpcChannel.UpdateError, error)
    })

    autoUpdater.on('update-available', (releaseInfo: UpdateInfo) => {
      logger.info('update available', releaseInfo)
      const processedReleaseInfo = this.processReleaseInfo(releaseInfo)
      windowService.getMainWindow()?.webContents.send(IpcChannel.UpdateAvailable, processedReleaseInfo)
    })

    // 检测到不需要更新时
    autoUpdater.on('update-not-available', () => {
      windowService.getMainWindow()?.webContents.send(IpcChannel.UpdateNotAvailable)
    })

    // 更新下载进度
    autoUpdater.on('download-progress', (progress) => {
      windowService.getMainWindow()?.webContents.send(IpcChannel.DownloadProgress, progress)
    })

    // 当需要更新的内容下载完成后
    autoUpdater.on('update-downloaded', (releaseInfo: UpdateInfo) => {
      const processedReleaseInfo = this.processReleaseInfo(releaseInfo)
      windowService.getMainWindow()?.webContents.send(IpcChannel.UpdateDownloaded, processedReleaseInfo)
      logger.info('update downloaded', processedReleaseInfo)
    })

    if (isWin) {
      ;(autoUpdater as NsisUpdater).installDirectory = path.dirname(app.getPath('exe'))
    }

    this.autoUpdater = autoUpdater
  }


  public setAutoUpdate(isActive: boolean) {
    autoUpdater.autoDownload = isActive
    autoUpdater.autoInstallOnAppQuit = isActive
  }

  public cancelDownload() {
    this.cancellationToken.cancel()
    this.cancellationToken = new CancellationToken()
    if (this.autoUpdater.autoDownload) {
      this.updateCheckResult?.cancellationToken?.cancel()
    }
  }

  public async checkForUpdates() {
    if (isWin && 'PORTABLE_EXECUTABLE_DIR' in process.env) {
      return {
        currentVersion: app.getVersion(),
        updateInfo: null
      }
    }

    try {
      this.updateCheckResult = await this.autoUpdater.checkForUpdates()
      logger.info(
        `update check result: ${this.updateCheckResult?.isUpdateAvailable}, channel: ${this.autoUpdater.channel}, currentVersion: ${this.autoUpdater.currentVersion}`
      )

      if (this.updateCheckResult?.isUpdateAvailable && !this.autoUpdater.autoDownload) {
        // 如果 autoDownload 为 false，则需要再调用下面的函数触发下
        // do not use await, because it will block the return of this function
        logger.info('downloadUpdate manual by check for updates', this.cancellationToken)
        this.autoUpdater.downloadUpdate(this.cancellationToken)
      }

      return {
        currentVersion: this.autoUpdater.currentVersion,
        updateInfo: this.updateCheckResult?.isUpdateAvailable ? this.updateCheckResult?.updateInfo : null
      }
    } catch (error) {
      logger.error('Failed to check for update:', error as Error)
      return {
        currentVersion: app.getVersion(),
        updateInfo: null
      }
    }
  }

  public quitAndInstall() {
    app.isQuitting = true
    setImmediate(() => autoUpdater.quitAndInstall())
  }

  /**
   * Check if release notes contain multi-language markers
   */
  private hasMultiLanguageMarkers(releaseNotes: string): boolean {
    return releaseNotes.includes(LANG_MARKERS.EN_START)
  }

  /**
   * Parse multi-language release notes and return the appropriate language version
   * @param releaseNotes - Release notes string with language markers
   * @returns Parsed release notes for the user's language
   *
   * Expected format:
   * <!--LANG:en-->English content<!--LANG:zh-CN-->Chinese content<!--LANG:END-->
   */
  private parseMultiLangReleaseNotes(releaseNotes: string): string {
    try {
      const language = configManager.getLanguage()
      const isChineseUser = language === 'zh-CN' || language === 'zh-TW'

      // Create regex patterns using constants
      const enPattern = new RegExp(
        `${LANG_MARKERS.EN_START.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}([\\s\\S]*?)${LANG_MARKERS.ZH_CN_START.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`
      )
      const zhPattern = new RegExp(
        `${LANG_MARKERS.ZH_CN_START.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}([\\s\\S]*?)${LANG_MARKERS.END.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`
      )

      // Extract language sections
      const enMatch = releaseNotes.match(enPattern)
      const zhMatch = releaseNotes.match(zhPattern)

      // Return appropriate language version with proper fallback
      if (isChineseUser && zhMatch) {
        return zhMatch[1].trim()
      } else if (enMatch) {
        return enMatch[1].trim()
      } else {
        // Clean fallback: remove all language markers
        logger.warn('Failed to extract language-specific release notes, using cleaned fallback')
        return releaseNotes
          .replace(new RegExp(`${LANG_MARKERS.EN_START}|${LANG_MARKERS.ZH_CN_START}|${LANG_MARKERS.END}`, 'g'), '')
          .trim()
      }
    } catch (error) {
      logger.error('Failed to parse multi-language release notes', error as Error)
      // Return original notes as safe fallback
      return releaseNotes
    }
  }

  /**
   * Process release info to handle multi-language release notes
   * @param releaseInfo - Original release info from updater
   * @returns Processed release info with localized release notes
   */
  private processReleaseInfo(releaseInfo: UpdateInfo): UpdateInfo {
    const processedInfo = { ...releaseInfo }

    // Handle multi-language release notes in string format
    if (releaseInfo.releaseNotes && typeof releaseInfo.releaseNotes === 'string') {
      // Check if it contains multi-language markers
      if (this.hasMultiLanguageMarkers(releaseInfo.releaseNotes)) {
        processedInfo.releaseNotes = this.parseMultiLangReleaseNotes(releaseInfo.releaseNotes)
      }
    }

    return processedInfo
  }
}
