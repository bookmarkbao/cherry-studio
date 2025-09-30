import { loggerService } from '@logger'
import db from '@renderer/databases'
import { getStoreSetting } from '@renderer/hooks/useSettings'
import i18n from '@renderer/i18n'
import store from '@renderer/store'
import { FileMetadata } from '@renderer/types'
import { getFileDirectory } from '@renderer/utils'
import dayjs from 'dayjs'

const logger = loggerService.withContext('FileManager')

class FileManager {
  static async selectFiles(options?: Electron.OpenDialogOptions): Promise<FileMetadata[] | null> {
    return await window.api.file.select(options)
  }

  static async addFile(file: FileMetadata): Promise<FileMetadata> {
    const fileRecord = await db.files.get(file.id)

    if (fileRecord) {
      await db.files.update(fileRecord.id, { ...fileRecord, count: fileRecord.count + 1 })
      return fileRecord
    }

    await db.files.add(file)

    return file
  }

  static async addFiles(files: FileMetadata[]): Promise<FileMetadata[]> {
    return Promise.all(files.map((file) => this.addFile(file)))
  }

  static async readBinaryImage(file: FileMetadata): Promise<Buffer> {
    const fileData = await window.api.file.binaryImage(file.id + file.ext)
    return fileData.data
  }

  static async readBase64File(file: FileMetadata): Promise<string> {
    const fileData = await window.api.file.base64File(file.id + file.ext)
    return fileData.data
  }

  static async addBase64File(file: FileMetadata): Promise<FileMetadata> {
    logger.info(`Adding base64 file: ${JSON.stringify(file)}`)

    const base64File = await window.api.file.base64File(file.id + file.ext)
    const fileRecord = await db.files.get(base64File.id)

    if (fileRecord) {
      await db.files.update(fileRecord.id, { ...fileRecord, count: fileRecord.count + 1 })
      return fileRecord
    }

    await db.files.add(base64File)

    return base64File
  }

  static async uploadFile(file: FileMetadata, isUploadS3: boolean = false): Promise<FileMetadata> {
    // logger.info(`Uploading file: ${JSON.stringify(file)}`)
    const uploadFile = await window.api.file.upload(file)
    // logger.info('Uploaded file:', uploadFile)
    const fileRecord = await db.files.get(uploadFile.id)

    if (fileRecord) {
      await db.files.update(fileRecord.id, { ...fileRecord, count: fileRecord.count + 1 })
      return fileRecord
    }

    await db.files.add(uploadFile)

    const s3State = getStoreSetting('s3State')
    console.log('s3State', s3State);
    if (s3State && isUploadS3) {
      await this.uploadS3File(uploadFile)
    }

    return uploadFile
  }

  /**
   * 上传文件到S3
   * @param file 文件元数据
   * @returns 上传成功返回undefined，失败抛出错误
   */
  static async uploadS3File(file: FileMetadata): Promise<undefined> {
    const { accessToken, serverUrl } = store.getState().auth
    if (!accessToken || !serverUrl) {
      return
    }

    // 读取实际的文件数据
    const fileData = await window.api.file.base64File(file.id + file.ext)
    const base64Data = fileData.data
    const mimeString = fileData.mime

    // 将base64数据转换为Blob
    const byteString = atob(base64Data)
    const ab = new ArrayBuffer(byteString.length)
    const ia = new Uint8Array(ab)
    for (let i = 0; i < byteString.length; i++) {
      ia[i] = byteString.charCodeAt(i)
    }
    const blob = new Blob([ab], { type: mimeString })

    // 创建FormData并添加文件数据
    const formData = new FormData()
    formData.append('file', blob, file.origin_name)

    const response = await fetch(`${serverUrl}/upload/file`, {
      method: 'POST',
      body: formData,
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    })
    if (!response.ok) {
      throw new Error('API请求失败')
    }
    const data = await response.json()
    logger.info('Uploaded Oss file:', data)
  }

  static async uploadFiles(files: FileMetadata[], isUploadS3: boolean = false): Promise<FileMetadata[]> {
    return Promise.all(files.map((file) => this.uploadFile(file, isUploadS3)))
  }

  static async getFile(id: string): Promise<FileMetadata | undefined> {
    const file = await db.files.get(id)

    if (file) {
      const filesPath = store.getState().runtime.filesPath
      file.path = filesPath + '/' + file.id + file.ext
    }

    return file
  }

  static getFilePath(file: FileMetadata) {
    const filesPath = store.getState().runtime.filesPath
    return filesPath + '/' + file.id + file.ext
  }

  static async deleteFile(id: string, force: boolean = false): Promise<void> {
    const file = await this.getFile(id)

    logger.info('Deleting file:', file)

    if (!file) {
      return
    }

    if (!force) {
      if (file.count > 1) {
        await db.files.update(id, { ...file, count: file.count - 1 })
        return
      }
    }

    await db.files.delete(id)

    try {
      await window.api.file.delete(id + file.ext)
    } catch (error) {
      logger.error('Failed to delete file:', error as Error)
    }
  }

  static async deleteFiles(files: FileMetadata[]): Promise<void> {
    await Promise.all(files.map((file) => this.deleteFile(file.id)))
  }

  static async allFiles(): Promise<FileMetadata[]> {
    return db.files.toArray()
  }

  static isDangerFile(file: FileMetadata) {
    return ['.sh', '.bat', '.cmd', '.ps1', '.vbs', 'reg'].includes(file.ext)
  }

  static getSafePath(file: FileMetadata) {
    // use the path from the file metadata instead
    // this function is used to get path for files which are not in the filestorage
    return this.isDangerFile(file) ? getFileDirectory(file.path) : file.path
  }

  static getFileUrl(file: FileMetadata) {
    const filesPath = store.getState().runtime.filesPath
    return 'file://' + filesPath + '/' + file.name
  }

  static async updateFile(file: FileMetadata) {
    if (!file.origin_name.includes(file.ext)) {
      file.origin_name = file.origin_name + file.ext
    }

    await db.files.update(file.id, file)
  }

  static formatFileName(file: FileMetadata) {
    if (!file || !file.origin_name) {
      return ''
    }

    const date = dayjs(file.created_at).format('YYYY-MM-DD')

    if (file.origin_name.includes('pasted_text')) {
      return date + ' ' + i18n.t('message.attachments.pasted_text') + file.ext
    }

    if (file.origin_name.startsWith('temp_file') && file.origin_name.includes('image')) {
      return date + ' ' + i18n.t('message.attachments.pasted_image') + file.ext
    }

    return file.origin_name
  }
}

export default FileManager
