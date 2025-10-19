import type { BuiltinOcrProvider, OcrProviderCapability } from '@renderer/types'
import { systemOcr, tesseract } from '@shared/config/ocr'

import { isMac, isWin } from './constant'

export const DEFAULT_OCR_PROVIDER = {
  image: isWin || isMac ? systemOcr : tesseract
} as const satisfies Record<OcrProviderCapability, BuiltinOcrProvider>
