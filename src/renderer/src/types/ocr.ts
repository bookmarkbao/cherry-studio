import type Tesseract from 'tesseract.js'
import * as z from 'zod'

import type { FileMetadata, ImageFileMetadata, TranslateLanguageCode } from '.'
import { isImageFileMetadata } from '.'

export const BuiltinOcrProviderIds = {
  tesseract: 'tesseract',
  system: 'system',
  paddleocr: 'paddleocr',
  ovocr: 'ovocr'
} as const satisfies Record<string, BuiltinOcrProviderId>

export const BuiltinOcrProviderIdSchema = z.enum(['tesseract', 'system', 'paddleocr', 'ovocr'])

export type BuiltinOcrProviderId = z.infer<typeof BuiltinOcrProviderIdSchema>

export const isBuiltinOcrProviderId = (id: string): id is BuiltinOcrProviderId => {
  return BuiltinOcrProviderIdSchema.safeParse(id).success
}

// extensible
export const OcrProviderCapabilities = {
  image: 'image'
  // pdf: 'pdf'
} as const satisfies Record<string, OcrProviderCapability>

export const OcrProviderCapabilitySchema = z.enum(['image'])

export type OcrProviderCapability = z.infer<typeof OcrProviderCapabilitySchema>

export const isOcrProviderCapability = (cap: string): cap is OcrProviderCapability => {
  return OcrProviderCapabilitySchema.safeParse(cap).success
}

export const OcrProviderCapabilityRecordSchema = z.partialRecord(OcrProviderCapabilitySchema, z.boolean())

export type OcrProviderCapabilityRecord = z.infer<typeof OcrProviderCapabilityRecordSchema>

// OCR models and providers share the same type definition.
// A provider can offer capabilities to process multiple file types,
// while a model belonging to that provider may be limited to processing only one specific file type.
export type OcrModelCapabilityRecord = OcrProviderCapabilityRecord

export const OcrModelSchema = z.object({
  id: z.string(),
  name: z.string(),
  providerId: z.string(),
  capabilities: OcrProviderCapabilityRecordSchema
})

export type OcrModel = z.infer<typeof OcrModelSchema>

/**
 * Extend this type to define provider-specefic config types.
 */
export const OcrProviderApiConfigSchema = z.object({
  apiKey: z.string(),
  apiHost: z.string(),
  apiVersion: z.string().optional()
})

export type OcrProviderApiConfig = z.infer<typeof OcrProviderApiConfigSchema>

export const isOcrProviderApiConfig = (config: unknown): config is OcrProviderApiConfig => {
  return OcrProviderApiConfigSchema.safeParse(config).success
}

/**
 * For future. Model based ocr, api based ocr. May different api client.
 *
 * Extend this type to define provider-specific config types.
 */
export const OcrProviderBaseConfigSchema = z.object({
  /** Not used for now. Could safely remove. */
  api: OcrProviderApiConfigSchema.optional(),
  /** Not used for now. Could safely remove. */
  models: z.array(OcrModelSchema).optional(),
  /** Not used for now. Could safely remove. */
  enabled: z.boolean().optional()
})

export type OcrProviderBaseConfig = z.infer<typeof OcrProviderBaseConfigSchema>

export type OcrProviderConfig =
  | OcrApiProviderConfig
  | OcrTesseractConfig
  | OcrSystemConfig
  | OcrPpocrConfig
  | OcrOvConfig

export const OcrProviderSchema = z.object({
  id: z.string(),
  name: z.string(),
  capabilities: OcrProviderCapabilityRecordSchema
})

export type OcrProvider = z.infer<typeof OcrProviderSchema> & {
  /** @deprecated */
  config?: OcrProviderBaseConfig
}

export const isOcrProvider = (p: unknown): p is OcrProvider => {
  return OcrProviderSchema.safeParse(p).success
}

export const OcrApiProviderConfigSchema = OcrProviderBaseConfigSchema.extend({
  api: OcrProviderApiConfigSchema
})

export type OcrApiProviderConfig = z.infer<typeof OcrApiProviderConfigSchema>

export const isOcrApiProviderConfig = (config: unknown): config is OcrApiProviderConfig => {
  return OcrApiProviderConfigSchema.safeParse(config).success
}

export const OcrApiProviderSchema = OcrProviderSchema

/** Currently, there is no API provider yet, but we've left room for expansion. */
export type OcrApiProvider = z.infer<typeof OcrApiProviderSchema>

export const isOcrApiProvider = (p: unknown): p is OcrApiProvider => {
  return OcrApiProviderSchema.safeParse(p).success
}

export type BuiltinOcrProvider = OcrProvider & {
  id: BuiltinOcrProviderId
}

export const isBuiltinOcrProvider = (p: OcrProvider): p is BuiltinOcrProvider => {
  return isBuiltinOcrProviderId(p.id)
}

// Not sure compatible api endpoint exists. May not support custom ocr provider
export type CustomOcrProvider = OcrProvider & {
  id: Exclude<string, BuiltinOcrProviderId>
}

export type ImageOcrProvider = OcrProvider & {
  capabilities: OcrProviderCapabilityRecord & {
    [OcrProviderCapabilities.image]: true
  }
}

// export type PdfOcrProvider = OcrProvider & {
//   capabilities: OcrProviderCapabilityRecord & {
//     [OcrProviderCapabilities.pdf]: true
//   }
// }

export const isImageOcrProvider = (p: OcrProvider): p is ImageOcrProvider => {
  return p.capabilities.image === true
}

export type SupportedOcrFile = ImageFileMetadata

export const isSupportedOcrFile = (file: FileMetadata): file is SupportedOcrFile => {
  return isImageFileMetadata(file)
}

export type OcrParams = {
  providerId: string
}

export type OcrResult = {
  text: string
}

export type OcrHandler = (file: SupportedOcrFile) => Promise<OcrResult>

export type OcrImageHandler = (file: ImageFileMetadata) => Promise<OcrResult>

// Tesseract Types
export type OcrTesseractConfig = OcrProviderBaseConfig & {
  langs?: Partial<Record<TesseractLangCode, boolean>>
}

export type OcrTesseractProvider = {
  id: 'tesseract'
} & ImageOcrProvider &
  BuiltinOcrProvider

export const isOcrTesseractProvider = (p: OcrProvider): p is OcrTesseractProvider => {
  return p.id === BuiltinOcrProviderIds.tesseract
}

export type TesseractLangCode = Tesseract.LanguageCode

// System Types
export type OcrSystemConfig = OcrProviderBaseConfig & {
  langs?: TranslateLanguageCode[]
}

export type OcrSystemProvider = {
  id: 'system'
} & ImageOcrProvider &
  // PdfOcrProvider &
  BuiltinOcrProvider

export const isOcrSystemProvider = (p: OcrProvider): p is OcrSystemProvider => {
  return p.id === BuiltinOcrProviderIds.system
}

// PaddleOCR Types
export type OcrPpocrConfig = OcrProviderBaseConfig & {
  apiUrl?: string
  accessToken?: string
}

export type OcrPpocrProvider = {
  id: 'paddleocr'
} & ImageOcrProvider &
  // PdfOcrProvider &
  BuiltinOcrProvider

export const isOcrPpocrProvider = (p: OcrProvider): p is OcrPpocrProvider => {
  return p.id === BuiltinOcrProviderIds.paddleocr
}

// OV OCR Types
export type OcrOvConfig = OcrProviderBaseConfig & {
  // It's not configurable for now.
  // langs?: TranslateLanguageCode[]
}

export type OcrOvProvider = {
  id: 'ovocr'
} & ImageOcrProvider &
  // PdfOcrProvider &
  BuiltinOcrProvider

export const isOcrOVProvider = (p: OcrProvider): p is OcrOvProvider => {
  return p.id === BuiltinOcrProviderIds.ovocr
}
