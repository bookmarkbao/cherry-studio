/**
 * Backup utility functions for validating and processing backup filenames
 */

/**
 * Validates and sanitizes custom backup filename
 * @param filename - The custom filename provided by user
 * @param defaultName - The default filename to fall back to
 * @returns A safe filename with .zip extension
 */
export function validateAndSanitizeFilename(filename: string | undefined, defaultName: string): string {
  // If filename is not provided or empty after trimming, use default
  if (!filename || filename.trim() === '') {
    return ensureZipExtension(defaultName)
  }

  const sanitized = filename.trim()

  // Check for invalid characters
  const invalidChars = /[<>:"/\\|?*]/
  if (invalidChars.test(sanitized)) {
    // Invalid characters, use default name
    return ensureZipExtension(defaultName)
  }

  // Check for reserved names (Windows)
  const reservedNames = /^(CON|PRN|AUX|NUL|COM[1-9]|LPT[1-9])$/i
  const nameWithoutExt = sanitized.replace(/\.zip$/i, '')
  if (reservedNames.test(nameWithoutExt)) {
    // Reserved name, use default name
    return ensureZipExtension(defaultName)
  }

  // Check length (limit to 255 characters for most filesystems)
  if (sanitized.length > 250) {
    // Leave room for .zip extension
    // Filename is too long, truncate
    return ensureZipExtension(sanitized.substring(0, 250))
  }

  return ensureZipExtension(sanitized)
}

/**
 * Ensures the filename has a .zip extension
 * @param filename - The filename to check
 * @returns Filename with .zip extension
 */
function ensureZipExtension(filename: string): string {
  return filename.toLowerCase().endsWith('.zip') ? filename : `${filename}.zip`
}

/**
 * Checks if backup cleanup should be skipped based on configuration
 * @param autoBackupProcess - Whether this is an automatic backup process
 * @param maxBackups - Maximum number of backups to keep
 * @param singleFileOverwrite - Whether single file overwrite is enabled
 * @returns True if cleanup should be skipped
 */
export function shouldSkipCleanup(
  autoBackupProcess: boolean,
  maxBackups: number,
  singleFileOverwrite?: boolean
): boolean {
  return autoBackupProcess && maxBackups === 1 && !!singleFileOverwrite
}

/**
 * Generates a default backup filename based on device information
 * @param hostname - Device hostname
 * @param deviceType - Device type
 * @param timestamp - Optional timestamp (for non-overwrite mode)
 * @returns Generated filename
 */
export function generateDefaultFilename(hostname: string, deviceType: string, timestamp?: string): string {
  const base = `cherry-studio.${hostname}.${deviceType}`
  return timestamp ? `${base}.${timestamp}.zip` : `${base}.zip`
}

/**
 * Generates backup filename for overwrite mode
 * @param customFileName - Custom filename provided by user
 * @param hostname - Device hostname
 * @param deviceType - Device type
 * @returns Filename for overwrite mode
 */
export function generateOverwriteFilename(
  customFileName: string | undefined,
  hostname: string,
  deviceType: string
): string {
  const defaultName = generateDefaultFilename(hostname, deviceType)
  return validateAndSanitizeFilename(customFileName, defaultName)
}

/**
 * Generates backup filename for timestamped mode
 * @param customFileName - Custom filename provided by user
 * @param hostname - Device hostname
 * @param deviceType - Device type
 * @param timestamp - Timestamp string
 * @returns Filename for timestamped mode
 */
export function generateTimestampedFilename(
  customFileName: string | undefined,
  hostname: string,
  deviceType: string,
  timestamp: string
): string {
  if (customFileName && customFileName.trim()) {
    // If custom filename is provided, use it as base and add timestamp
    const base = customFileName.trim().replace(/\.zip$/i, '')
    return `${base}.${timestamp}.zip`
  }

  return generateDefaultFilename(hostname, deviceType, timestamp)
}
