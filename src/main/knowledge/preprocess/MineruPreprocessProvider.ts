import fs from 'node:fs'
import path from 'node:path'

import { loggerService } from '@logger'
import { fileStorage } from '@main/services/FileStorage'
import { FileMetadata, PreprocessProvider } from '@types'
import { net } from 'electron'

import BasePreprocessProvider from './BasePreprocessProvider'

const logger = loggerService.withContext('MineruPreprocessProvider')

type ApiResponse<T> = {
  backend: string
  version: string
  results: T
}

type QuotaResponse = {
  code: number
  data: {
    user_left_quota: number
    total_left_quota: number
  }
  msg?: string
  trace_id?: string
}

export default class MineruPreprocessProvider extends BasePreprocessProvider {
  constructor(provider: PreprocessProvider, userId?: string) {
    super(provider, userId)
    // todo：免费期结束后删除
    this.provider.apiKey = this.provider.apiKey || import.meta.env.MAIN_VITE_MINERU_API_KEY
  }

  public async parseFile(
    sourceId: string,
    file: FileMetadata
  ): Promise<{ processedFile: FileMetadata; quota: number }> {
    try {
      const filePath = fileStorage.getFilePathById(file)
      logger.info(`MinerU preprocess processing started: ${filePath} ${sourceId}`)
      await this.validateFile(filePath)

      // 1. 获取上传URL并上传文件
      const mdContent = await this.uploadFile(file)
      logger.info(`MinerU file upload completed`)

      // 3. 下载并解压文件
      const { path: outputPath } = await this.downloadAndExtractFile(mdContent, file)

      // 4. check quota
      // const quota = await this.checkQuota()

      // 5. 创建处理后的文件信息
      return {
        processedFile: this.createProcessedFileInfo(file, outputPath),
        quota: 0
      }
    } catch (error: any) {
      logger.error(`MinerU preprocess processing failed for:`, error as Error)
      throw new Error(error.message)
    }
  }

  public async checkQuota() {
    try {
      const quota = await net.fetch(`${this.provider.apiHost}/api/v4/quota`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.provider.apiKey}`,
          token: this.userId ?? ''
        }
      })
      if (!quota.ok) {
        throw new Error(`HTTP ${quota.status}: ${quota.statusText}`)
      }
      const response: QuotaResponse = await quota.json()
      return response.data.user_left_quota
    } catch (error) {
      logger.error('Error checking quota:', error as Error)
      throw error
    }
  }

  private async validateFile(filePath: string): Promise<void> {
    const pdfBuffer = await fs.promises.readFile(filePath)

    const doc = await this.readPdf(pdfBuffer)

    // 文件页数小于600页
    if (doc.numPages >= 600) {
      throw new Error(`PDF page count (${doc.numPages}) exceeds the limit of 600 pages`)
    }
    // 文件大小小于200MB
    if (pdfBuffer.length >= 200 * 1024 * 1024) {
      const fileSizeMB = Math.round(pdfBuffer.length / (1024 * 1024))
      throw new Error(`PDF file size (${fileSizeMB}MB) exceeds the limit of 200MB`)
    }
  }

  private createProcessedFileInfo(file: FileMetadata, outputPath: string): FileMetadata {
    // 查找解压后的主要文件
    let finalPath = ''
    let finalName = file.origin_name.replace('.pdf', '.md')

    try {
      const files = fs.readdirSync(outputPath)

      const mdFile = files.find((f) => f.endsWith('.md'))
      if (mdFile) {
        const originalMdPath = path.join(outputPath, mdFile)
        const newMdPath = path.join(outputPath, finalName)

        // 重命名文件为原始文件名
        try {
          fs.renameSync(originalMdPath, newMdPath)
          finalPath = newMdPath
          logger.info(`Renamed markdown file from ${mdFile} to ${finalName}`)
        } catch (renameError) {
          logger.warn(`Failed to rename file ${mdFile} to ${finalName}: ${renameError}`)
          // 如果重命名失败，使用原文件
          finalPath = originalMdPath
          finalName = mdFile
        }
      }
    } catch (error) {
      logger.warn(`Failed to read output directory ${outputPath}: ${error}`)
      finalPath = path.join(outputPath, `${file.id}.md`)
    }

    return {
      ...file,
      name: finalName,
      path: finalPath,
      ext: '.md',
      size: fs.existsSync(finalPath) ? fs.statSync(finalPath).size : 0
    }
  }

  private async downloadAndExtractFile(content: string, file: FileMetadata): Promise<{ path: string }> {
    const dirPath = this.storageDir

    const extractPath = path.join(dirPath, `${file.id}`)
    const mdPath = path.join(extractPath, `${file.id}.md`)

    logger.info(`Downloading MinerU result to: ${mdPath}`)

    try {

      // 确保提取目录存在
      if (!fs.existsSync(extractPath)) {
        fs.mkdirSync(extractPath, { recursive: true })
      }

      fs.writeFileSync(mdPath, Buffer.from(content))
      logger.info(`Downloaded markdown file: ${mdPath}`)

      return { path: extractPath }
    } catch (error: any) {
      logger.error(`Failed to download and extract file: ${error.message}`)
      throw new Error(error.message)
    }
  }

  private async uploadFile(file: FileMetadata): Promise<string> {
    try {
      // 步骤1: 获取上传URL
      return await this.getBatchUploadUrls(file)
    } catch (error: any) {
      logger.error(`Failed to upload file:`, error as Error)
      throw new Error(error.message)
    }
  }

  private async getBatchUploadUrls(file: FileMetadata): Promise<string> {
    const endpoint = `${this.provider.apiHost}/file_parse`

    try {
      // 获取文件的实际路径
      const filePath = fileStorage.getFilePathById(file);

      // 读取文件内容
      const fileBuffer = await fs.promises.readFile(filePath);

      // 创建Blob对象
      const blob = new Blob([fileBuffer], { type: `application/${file.ext.slice(1)}` });

      // 创建FormData并添加文件数据
      const formData = new FormData()
      formData.append('backbend', 'vlm-vllm-async-engine')
      formData.append('files', blob, file.origin_name)

      const response = await net.fetch(endpoint, {
        method: 'POST',
        body: formData
      })

      if (response.ok) {
        const data: ApiResponse<any> = await response.json()

        if (data.results) {
          let name = file.origin_name.split('.')[0]
          return data.results[name].md_content
        } else {
          throw new Error(`API returned error: ${JSON.stringify(data)}`)
        }
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
    } catch (error: any) {
      logger.error(`Failed to get batch upload URLs: ${error.message}`)
      throw new Error(error.message)
    }
  }
}
