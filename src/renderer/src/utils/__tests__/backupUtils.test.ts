/**
 * Tests for backup utility functions
 */

import {
  generateDefaultFilename,
  generateOverwriteFilename,
  generateTimestampedFilename,
  shouldSkipCleanup,
  validateAndSanitizeFilename
} from '../backupUtils'

describe('backupUtils', () => {
  describe('validateAndSanitizeFilename', () => {
    describe('基本功能测试', () => {
      it('当文件名为 undefined 时应返回默认名称', () => {
        const result = validateAndSanitizeFilename(undefined, 'default.zip')
        expect(result).toBe('default.zip')
      })

      it('当文件名为空字符串时应返回默认名称', () => {
        const result = validateAndSanitizeFilename('', 'default.zip')
        expect(result).toBe('default.zip')
      })

      it('当文件名只包含空格时应返回默认名称', () => {
        const result = validateAndSanitizeFilename('   ', 'default.zip')
        expect(result).toBe('default.zip')
      })

      it('应自动添加 .zip 扩展名', () => {
        const result = validateAndSanitizeFilename('backup', 'default.zip')
        expect(result).toBe('backup.zip')
      })

      it('应保留已有的 .zip 扩展名', () => {
        const result = validateAndSanitizeFilename('backup.zip', 'default.zip')
        expect(result).toBe('backup.zip')
      })

      it('应处理大写的 .ZIP 扩展名', () => {
        const result = validateAndSanitizeFilename('backup.ZIP', 'default.zip')
        expect(result).toBe('backup.ZIP')
      })

      it('应修剪文件名前后的空格', () => {
        const result = validateAndSanitizeFilename('  backup.zip  ', 'default.zip')
        expect(result).toBe('backup.zip')
      })
    })

    describe('无效字符测试', () => {
      it('应拒绝包含 < 的文件名', () => {
        const result = validateAndSanitizeFilename('backup<test>', 'default.zip')
        expect(result).toBe('default.zip')
      })

      it('应拒绝包含 > 的文件名', () => {
        const result = validateAndSanitizeFilename('backup>test', 'default.zip')
        expect(result).toBe('default.zip')
      })

      it('应拒绝包含 : 的文件名', () => {
        const result = validateAndSanitizeFilename('backup:test', 'default.zip')
        expect(result).toBe('default.zip')
      })

      it('应拒绝包含 " 的文件名', () => {
        const result = validateAndSanitizeFilename('backup"test', 'default.zip')
        expect(result).toBe('default.zip')
      })

      it('应拒绝包含 / 的文件名', () => {
        const result = validateAndSanitizeFilename('backup/test', 'default.zip')
        expect(result).toBe('default.zip')
      })

      it('应拒绝包含 \\ 的文件名', () => {
        const result = validateAndSanitizeFilename('backup\\test', 'default.zip')
        expect(result).toBe('default.zip')
      })

      it('应拒绝包含 | 的文件名', () => {
        const result = validateAndSanitizeFilename('backup|test', 'default.zip')
        expect(result).toBe('default.zip')
      })

      it('应拒绝包含 ? 的文件名', () => {
        const result = validateAndSanitizeFilename('backup?test', 'default.zip')
        expect(result).toBe('default.zip')
      })

      it('应拒绝包含 * 的文件名', () => {
        const result = validateAndSanitizeFilename('backup*test', 'default.zip')
        expect(result).toBe('default.zip')
      })

      it('应拒绝包含混合无效字符的文件名', () => {
        const result = validateAndSanitizeFilename('backup<>:"/\\|?*test', 'default.zip')
        expect(result).toBe('default.zip')
      })
    })

    describe('保留名称测试', () => {
      it('应拒绝 Windows 保留名称 CON', () => {
        const result = validateAndSanitizeFilename('CON', 'default.zip')
        expect(result).toBe('default.zip')
      })

      it('应拒绝 Windows 保留名称 PRN', () => {
        const result = validateAndSanitizeFilename('PRN', 'default.zip')
        expect(result).toBe('default.zip')
      })

      it('应拒绝 Windows 保留名称 AUX', () => {
        const result = validateAndSanitizeFilename('AUX', 'default.zip')
        expect(result).toBe('default.zip')
      })

      it('应拒绝 Windows 保留名称 NUL', () => {
        const result = validateAndSanitizeFilename('NUL', 'default.zip')
        expect(result).toBe('default.zip')
      })

      it('应拒绝 Windows 保留名称 COM1', () => {
        const result = validateAndSanitizeFilename('COM1', 'default.zip')
        expect(result).toBe('default.zip')
      })

      it('应拒绝 Windows 保留名称 LPT1', () => {
        const result = validateAndSanitizeFilename('LPT1', 'default.zip')
        expect(result).toBe('default.zip')
      })

      it('应拒绝大小写的保留名称 con', () => {
        const result = validateAndSanitizeFilename('con', 'default.zip')
        expect(result).toBe('default.zip')
      })

      it('应拒绝带扩展名的保留名称 CON.zip', () => {
        const result = validateAndSanitizeFilename('CON.zip', 'default.zip')
        expect(result).toBe('default.zip')
      })
    })

    describe('长度限制测试', () => {
      it('应截断过长的文件名', () => {
        const longName = 'a'.repeat(260)
        const result = validateAndSanitizeFilename(longName, 'default.zip')
        expect(result.length).toBeLessThanOrEqual(254) // 250 chars + .zip
      })

      it('应正确处理正好250字符的文件名', () => {
        const name = 'a'.repeat(246) + '.zip' // Total 250 chars
        const result = validateAndSanitizeFilename(name, 'default.zip')
        expect(result).toBe(name)
      })

      it('应截断251字符的文件名', () => {
        const name = 'a'.repeat(247) + '.zip' // Total 251 chars
        const result = validateAndSanitizeFilename(name, 'default.zip')
        expect(result.length).toBe(254)
      })
    })
  })

  describe('shouldSkipCleanup', () => {
    describe('各种组合场景测试', () => {
      it('自动备份且单文件覆盖时应跳过清理', () => {
        const result = shouldSkipCleanup(true, 1, true)
        expect(result).toBe(true)
      })

      it('最大备份数大于1时不应跳过清理', () => {
        const result = shouldSkipCleanup(true, 3, true)
        expect(result).toBe(false)
      })

      it('非自动备份时不应跳过清理', () => {
        const result = shouldSkipCleanup(false, 1, true)
        expect(result).toBe(false)
      })

      it('单文件覆盖禁用时不应跳过清理', () => {
        const result = shouldSkipCleanup(true, 1, false)
        expect(result).toBe(false)
      })

      it('单文件覆盖为 undefined 时不应跳过清理', () => {
        const result = shouldSkipCleanup(true, 1, undefined)
        expect(result).toBe(false)
      })

      it('最大备份数为0时不应跳过清理', () => {
        const result = shouldSkipCleanup(true, 0, true)
        expect(result).toBe(false)
      })

      it('所有条件都为 false 时不应跳过清理', () => {
        const result = shouldSkipCleanup(false, 0, false)
        expect(result).toBe(false)
      })
    })
  })

  describe('generateDefaultFilename', () => {
    it('应生成不带时间戳的默认文件名', () => {
      const result = generateDefaultFilename('myhost', 'desktop')
      expect(result).toBe('cherry-studio.myhost.desktop.zip')
    })

    it('应生成带时间戳的默认文件名', () => {
      const result = generateDefaultFilename('myhost', 'desktop', '20240101120000')
      expect(result).toBe('cherry-studio.myhost.desktop.20240101120000.zip')
    })

    it('应处理包含特殊字符的主机名', () => {
      const result = generateDefaultFilename('my-host_pc', 'desktop')
      expect(result).toBe('cherry-studio.my-host_pc.desktop.zip')
    })
  })

  describe('generateOverwriteFilename', () => {
    it('应使用自定义文件名', () => {
      const result = generateOverwriteFilename('my-backup', 'myhost', 'desktop')
      expect(result).toBe('my-backup.zip')
    })

    it('应使用默认文件名当自定义文件名为空', () => {
      const result = generateOverwriteFilename('', 'myhost', 'desktop')
      expect(result).toBe('cherry-studio.myhost.desktop.zip')
    })

    it('应使用默认文件名当自定义文件名为 undefined', () => {
      const result = generateOverwriteFilename(undefined, 'myhost', 'desktop')
      expect(result).toBe('cherry-studio.myhost.desktop.zip')
    })

    it('应清理包含无效字符的自定义文件名', () => {
      const result = generateOverwriteFilename('my<backup>', 'myhost', 'desktop')
      expect(result).toBe('cherry-studio.myhost.desktop.zip')
    })

    it('应清理包含保留名称的自定义文件名', () => {
      const result = generateOverwriteFilename('CON', 'myhost', 'desktop')
      expect(result).toBe('cherry-studio.myhost.desktop.zip')
    })

    it('应截断过长的自定义文件名', () => {
      const longName = 'a'.repeat(260)
      const result = generateOverwriteFilename(longName, 'myhost', 'desktop')
      expect(result.length).toBeLessThanOrEqual(254)
    })

    it('应保留自定义文件名的大小写', () => {
      const result = generateOverwriteFilename('My-Backup.ZIP', 'myhost', 'desktop')
      expect(result).toBe('My-Backup.ZIP')
    })
  })

  describe('generateTimestampedFilename', () => {
    it('应使用自定义文件名作为基础并添加时间戳', () => {
      const result = generateTimestampedFilename('my-backup', 'myhost', 'desktop', '20240101120000')
      expect(result).toBe('my-backup.20240101120000.zip')
    })

    it('应使用默认文件名当自定义文件名为空', () => {
      const result = generateTimestampedFilename('', 'myhost', 'desktop', '20240101120000')
      expect(result).toBe('cherry-studio.myhost.desktop.20240101120000.zip')
    })

    it('应使用默认文件名当自定义文件名为 undefined', () => {
      const result = generateTimestampedFilename(undefined, 'myhost', 'desktop', '20240101120000')
      expect(result).toBe('cherry-studio.myhost.desktop.20240101120000.zip')
    })

    it('应使用默认文件名当自定义文件名只包含空格', () => {
      const result = generateTimestampedFilename('   ', 'myhost', 'desktop', '20240101120000')
      expect(result).toBe('cherry-studio.myhost.desktop.20240101120000.zip')
    })

    it('应修剪自定义文件名的前后空格', () => {
      const result = generateTimestampedFilename('  my-backup  ', 'myhost', 'desktop', '20240101120000')
      expect(result).toBe('my-backup.20240101120000.zip')
    })

    it('应移除自定义文件名的 .zip 扩展名后添加时间戳', () => {
      const result = generateTimestampedFilename('my-backup.zip', 'myhost', 'desktop', '20240101120000')
      expect(result).toBe('my-backup.20240101120000.zip')
    })

    it('应处理自定义文件名的大写 .ZIP 扩展名', () => {
      const result = generateTimestampedFilename('my-backup.ZIP', 'myhost', 'desktop', '20240101120000')
      expect(result).toBe('my-backup.20240101120000.zip')
    })

    it('应生成正确的时间戳格式', () => {
      const result = generateTimestampedFilename('backup', 'host', 'device', '20241231235959')
      expect(result).toBe('backup.20241231235959.zip')
    })
  })
})
