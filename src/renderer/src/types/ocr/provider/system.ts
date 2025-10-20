import type { TranslateLanguageCode } from '../../translate'
import type { OcrProvider } from './base'
import { type ImageOcrProvider } from './base'
import { type BuiltinOcrProvider } from './base'
import { type OcrProviderBaseConfig } from './base'
import { BuiltinOcrProviderIdMap } from './base'

// ==========================================================
//    System OCR Types
// ==========================================================

export interface OcrSystemConfig extends OcrProviderBaseConfig {
  langs?: TranslateLanguageCode[]
}
export type OcrSystemProvider = {
  id: 'system'
  config: OcrSystemConfig
} & ImageOcrProvider &
  // PdfOcrProvider &
  BuiltinOcrProvider

export const isOcrSystemProvider = (p: OcrProvider): p is OcrSystemProvider => {
  return p.id === BuiltinOcrProviderIdMap.system
}
