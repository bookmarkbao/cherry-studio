import type Tesseract from 'tesseract.js'
import * as z from 'zod'

import type { FileMetadata, ImageFileMetadata, TranslateLanguageCode } from '.'
import { isImageFileMetadata, objectValues, TranslateLanguageCodeSchema } from '.'

export const BuiltinOcrProviderIdMap = {
  tesseract: 'tesseract',
  system: 'system',
  paddleocr: 'paddleocr',
  ovocr: 'ovocr'
} as const satisfies Record<string, BuiltinOcrProviderId>

export const BuiltinOcrProviderIds = Object.freeze(objectValues(BuiltinOcrProviderIdMap))

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
  enabled: z.boolean().default(false)
})

export type OcrProviderBaseConfig = z.infer<typeof OcrProviderBaseConfigSchema>

export const OcrProviderConfigSchema = OcrProviderBaseConfigSchema.loose()

export type OcrProviderConfig = z.infer<typeof OcrProviderConfigSchema>

const OcrProviderIdSchema = z.string()

export type OcrProviderId = z.infer<typeof OcrProviderIdSchema>

const OcrProviderNameSchema = z.string()

export const OcrProviderSchema = z.object({
  id: OcrProviderIdSchema,
  name: OcrProviderNameSchema,
  capabilities: OcrProviderCapabilityRecordSchema,
  config: OcrProviderConfigSchema
})

export type OcrProvider = z.infer<typeof OcrProviderSchema>

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

// ==========================================================
//    Tesseract OCR Types
// ==========================================================
export const OcrTesseractConfigSchema = OcrProviderBaseConfigSchema.extend({
  langs: z.record(TranslateLanguageCodeSchema, z.boolean()).optional()
})

export type OcrTesseractConfig = z.infer<typeof OcrTesseractConfigSchema>

export type OcrTesseractProvider = {
  id: 'tesseract'
  config: OcrTesseractConfig
} & ImageOcrProvider &
  BuiltinOcrProvider

export const isOcrTesseractProvider = (p: OcrProvider): p is OcrTesseractProvider => {
  return p.id === BuiltinOcrProviderIdMap.tesseract
}

export type TesseractLangCode = Tesseract.LanguageCode

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

// ==========================================================
//    PaddleOCR Types
// ==========================================================
export const OcrPpocrConfigSchema = OcrProviderBaseConfigSchema.extend({
  apiUrl: z.string().optional(),
  accessToken: z.string().optional()
})

export type OcrPpocrConfig = z.infer<typeof OcrPpocrConfigSchema>

export const isOcrPpocrConfig = (config: unknown): config is OcrPpocrConfig => {
  return OcrPpocrConfigSchema.safeParse(config).success
}

export type OcrPpocrProvider = {
  id: 'paddleocr'
  config: OcrPpocrConfig
} & ImageOcrProvider &
  // PdfOcrProvider &
  BuiltinOcrProvider

export const isOcrPpocrProvider = (p: OcrProvider): p is OcrPpocrProvider => {
  return p.id === BuiltinOcrProviderIdMap.paddleocr
}

// ==========================================================
//    OV OCR Types
// ==========================================================
export const OcrOvConfigSchema = OcrProviderBaseConfigSchema.extend({
  // It's not configurable for now.
  // langs: z.array(TranslateLanguageCodeSchema).optional()
})

export type OcrOvConfig = z.infer<typeof OcrOvConfigSchema>

export const isOcrOvConfig = (config: unknown): config is OcrOvConfig => {
  return OcrOvConfigSchema.safeParse(config).success
}

export type OcrOvProvider = {
  id: 'ovocr'
  config: OcrOvConfig
} & ImageOcrProvider &
  // PdfOcrProvider &
  BuiltinOcrProvider

export const isOcrOVProvider = (p: OcrProvider): p is OcrOvProvider => {
  return p.id === BuiltinOcrProviderIdMap.ovocr
}

// ==========================================================
//    Data-API OCR Types (notable)
// ==========================================================

const TimestampExtendShape = {
  createdAt: z.number().nullable(),
  updatedAt: z.number().nullable()
}

const DbOcrProviderSchema = OcrProviderSchema.extend(TimestampExtendShape)

export const ListOcrProvidersResponseSchema = z.object({
  data: z.array(DbOcrProviderSchema)
})

export type ListOcrProvidersResponse = z.infer<typeof ListOcrProvidersResponseSchema>

export const GetOcrProviderResponseSchema = z.object({
  data: DbOcrProviderSchema
})

export type GetOcrProviderResponse = z.infer<typeof GetOcrProviderResponseSchema>

export const PatchOcrProviderRequestSchema = z.object({
  id: OcrProviderIdSchema,
  name: OcrProviderNameSchema.optional(),
  config: OcrProviderConfigSchema.partial().optional()
})

export type PatchOcrProviderRequest = z.infer<typeof PatchOcrProviderRequestSchema>

export const PatchOcrProviderResponseSchema = z.object({
  data: DbOcrProviderSchema
})

export type PatchOcrProviderResponse = z.infer<typeof PatchOcrProviderResponseSchema>

export const CreateOcrProviderRequestSchema = OcrProviderSchema

export type CreateOcrProviderRequest = z.infer<typeof CreateOcrProviderRequestSchema>

export const CreateOcrProviderResponseSchema = z.object({
  data: DbOcrProviderSchema
})

export type CreateOcrProviderResponse = z.infer<typeof CreateOcrProviderResponseSchema>

export const PutOcrProviderRequestSchema = OcrProviderSchema

export type PutOcrProviderRequest = z.infer<typeof PutOcrProviderRequestSchema>

export const PutOcrProviderResponseSchema = z.object({
  data: DbOcrProviderSchema
})

export type PutOcrProviderResponse = z.infer<typeof PutOcrProviderResponseSchema>
