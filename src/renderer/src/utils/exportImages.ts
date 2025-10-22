import { loggerService } from '@logger'
import type { ImageMessageBlock, Message } from '@renderer/types/newMessage'
import { findImageBlocks } from '@renderer/utils/messageUtils/find'
import dayjs from 'dayjs'
import * as path from 'path'

const logger = loggerService.withContext('Utils:exportImages')

export interface ImageExportResult {
  originalPath: string
  exportedPath: string
  alt: string
  isBase64: boolean
}

/**
 * Convert a file:// protocol image to Base64
 * @param filePath The file:// protocol path
 * @returns Base64 encoded image string
 */
export async function convertFileToBase64(filePath: string): Promise<string> {
  try {
    if (!filePath.startsWith('file://')) {
      throw new Error('Invalid file protocol')
    }

    const actualPath = filePath.slice(7) // Remove 'file://' prefix
    const fileContent = await window.api.file.readBinary(actualPath)

    // Determine MIME type based on file extension
    const ext = path.extname(actualPath).toLowerCase()
    let mimeType = 'image/jpeg'
    switch (ext) {
      case '.png':
        mimeType = 'image/png'
        break
      case '.jpg':
      case '.jpeg':
        mimeType = 'image/jpeg'
        break
      case '.gif':
        mimeType = 'image/gif'
        break
      case '.webp':
        mimeType = 'image/webp'
        break
      case '.svg':
        mimeType = 'image/svg+xml'
        break
    }

    return `data:${mimeType};base64,${fileContent.toString('base64')}`
  } catch (error) {
    logger.error('Failed to convert file to Base64:', error as Error)
    throw error
  }
}

/**
 * Save an image to a specified folder
 * @param image Image data (Base64 or file path)
 * @param outputDir Output directory
 * @param fileName File name for the saved image
 * @returns Path to the saved image
 */
export async function saveImageToFolder(image: string, outputDir: string, fileName: string): Promise<string> {
  try {
    const imagePath = path.join(outputDir, fileName)

    if (image.startsWith('data:')) {
      // Base64 image - write directly as Base64 string, let main process handle conversion
      await window.api.file.write(imagePath, image)
    } else if (image.startsWith('file://')) {
      // File protocol image - copy file
      const sourcePath = image.slice(7)
      await window.api.file.copyFile(sourcePath, imagePath)
    } else {
      throw new Error('Unsupported image format')
    }

    return imagePath
  } catch (error) {
    logger.error('Failed to save image to folder:', error as Error)
    throw error
  }
}

/**
 * Generate a unique filename for an image
 * @param index Image index
 * @param isUserUpload Whether the image was uploaded by user
 * @param originalName Original filename (if available)
 * @returns Generated filename
 */
function generateImageFileName(index: number, isUserUpload: boolean, originalName?: string): string {
  const prefix = isUserUpload ? 'user_' : 'ai_'

  if (originalName && isUserUpload) {
    // Try to preserve original filename for user uploads
    const sanitized = originalName.replace(/[^a-zA-Z0-9._-]/g, '_')
    return `${prefix}${index}_${sanitized}`
  }

  // Generate timestamp-based name
  const timestamp = Date.now()
  return `${prefix}${index}_${timestamp}.png`
}

/**
 * Extract image alt text from metadata
 * @param block Image block
 * @returns Alt text for the image
 */
function getImageAltText(block: ImageMessageBlock): string {
  // Try to use prompt for AI generated images
  if (block.metadata?.prompt) {
    return block.metadata.prompt.slice(0, 100) // Limit alt text length
  }

  // Use original filename for user uploads
  if (block.file?.origin_name) {
    return block.file.origin_name
  }

  return 'Image'
}

/**
 * Process image blocks from a message
 * @param message Message containing image blocks
 * @param mode Export mode: 'base64' | 'folder' | 'none'
 * @param outputDir Output directory (required for 'folder' mode)
 * @returns Array of processed image results
 */
export async function processImageBlocks(
  message: Message,
  mode: 'base64' | 'folder' | 'none',
  outputDir?: string
): Promise<ImageExportResult[]> {
  if (mode === 'none') {
    return []
  }

  const imageBlocks = findImageBlocks(message)
  if (imageBlocks.length === 0) {
    return []
  }

  const results: ImageExportResult[] = []
  // For future image quality and size optimization
  // const { imageExportQuality, imageExportMaxSize } = store.getState().settings

  for (let i = 0; i < imageBlocks.length; i++) {
    const block = imageBlocks[i]
    const alt = getImageAltText(block)

    try {
      // Handle AI generated images (stored as Base64)
      if (block.metadata?.generateImageResponse?.images) {
        const images = block.metadata.generateImageResponse.images

        for (let j = 0; j < images.length; j++) {
          const imageData = images[j]

          if (mode === 'base64') {
            // Already in Base64 format
            results.push({
              originalPath: imageData,
              exportedPath: imageData,
              alt: `${alt} ${j + 1}`,
              isBase64: true
            })
          } else if (mode === 'folder' && outputDir) {
            // Save Base64 to file
            const fileName = generateImageFileName(i * 10 + j, false)
            await saveImageToFolder(imageData, outputDir, fileName)
            results.push({
              originalPath: imageData,
              exportedPath: `./images/${fileName}`,
              alt: `${alt} ${j + 1}`,
              isBase64: false
            })
          }
        }
      }

      // Handle user uploaded images (stored as file paths)
      if (block.file?.path) {
        const filePath = `file://${block.file.path}`

        if (mode === 'base64') {
          // Convert to Base64
          const base64Data = await convertFileToBase64(filePath)
          results.push({
            originalPath: filePath,
            exportedPath: base64Data,
            alt,
            isBase64: true
          })
        } else if (mode === 'folder' && outputDir) {
          // Copy to folder
          const fileName = generateImageFileName(i, true, block.file.origin_name)
          await saveImageToFolder(filePath, outputDir, fileName)
          results.push({
            originalPath: filePath,
            exportedPath: `./images/${fileName}`,
            alt,
            isBase64: false
          })
        }
      }

      // Handle URL images (if any)
      if (block.url) {
        if (mode === 'base64') {
          // If it's already a data URL, use it directly
          if (block.url.startsWith('data:')) {
            results.push({
              originalPath: block.url,
              exportedPath: block.url,
              alt,
              isBase64: true
            })
          } else {
            // For HTTP URLs, we'd need to fetch and convert
            // This is left as a future enhancement
            logger.warn('HTTP URL images not yet supported:', block.url)
          }
        } else if (mode === 'folder' && outputDir) {
          // Save URL image to file (future enhancement)
          logger.warn('Saving HTTP URL images not yet supported:', block.url)
        }
      }
    } catch (error) {
      logger.error(`Failed to process image block ${i}:`, error as Error)
      // Continue processing other images even if one fails
    }
  }

  return results
}

/**
 * Insert images into Markdown content
 * @param markdown Original markdown content
 * @param images Processed image results
 * @param messageId Message ID for reference
 * @returns Markdown with images inserted
 */
export function insertImagesIntoMarkdown(markdown: string, images: ImageExportResult[]): string {
  if (images.length === 0) {
    return markdown
  }

  // Build image markdown
  const imageMarkdown = images.map((img) => `![${img.alt}](${img.exportedPath})`).join('\n\n')

  // Insert images after the message header
  // Look for the first line break after ## header
  const headerMatch = markdown.match(/^##\s+.+\n/)
  if (headerMatch) {
    const insertPos = headerMatch[0].length
    return markdown.slice(0, insertPos) + '\n' + imageMarkdown + '\n' + markdown.slice(insertPos)
  }

  // If no header found, prepend images
  return imageMarkdown + '\n\n' + markdown
}

/**
 * Create export folder structure for topic/conversation
 * @param topicName Topic name
 * @param baseExportPath Base export path
 * @returns Created folder paths
 */
export async function createExportFolderStructure(
  topicName: string,
  baseExportPath?: string
): Promise<{ rootDir: string; imagesDir: string }> {
  const timestamp = dayjs().format('YYYY-MM-DD-HH-mm-ss')
  const sanitizedName = topicName.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 50)
  const folderName = `${sanitizedName}_${timestamp}`

  const exportPath = baseExportPath || (await window.api.file.selectFolder())
  if (!exportPath) {
    throw new Error('No export path selected')
  }

  const rootDir = path.join(exportPath, folderName)
  const imagesDir = path.join(rootDir, 'images')

  // Create directories
  await window.api.file.createDirectory(rootDir)
  await window.api.file.createDirectory(imagesDir)

  return { rootDir, imagesDir }
}

/**
 * Process all images in multiple messages
 * @param messages Array of messages
 * @param mode Export mode
 * @param outputDir Output directory for folder mode
 * @returns Map of message ID to image results
 */
export async function processMessagesImages(
  messages: Message[],
  mode: 'base64' | 'folder' | 'none',
  outputDir?: string
): Promise<Map<string, ImageExportResult[]>> {
  const resultsMap = new Map<string, ImageExportResult[]>()

  for (const message of messages) {
    const imageResults = await processImageBlocks(message, mode, outputDir)
    if (imageResults.length > 0) {
      resultsMap.set(message.id, imageResults)
    }
  }

  return resultsMap
}
