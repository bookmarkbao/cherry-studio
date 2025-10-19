import { dbService } from '@data/db/DbService'
import { ocrProviderTable } from '@data/db/schemas/ocr/provider'
import { loggerService } from '@logger'
import type {
  ListOcrProvidersResponse,
  OcrParams,
  OcrResult,
  PatchOcrProviderRequest,
  PatchOcrProviderResponse,
  SupportedOcrFile
} from '@types'
import { BuiltinOcrProviderIds } from '@types'
import { eq } from 'drizzle-orm'

import type { OcrBaseService } from './builtin/OcrBaseService'
import { ovOcrService } from './builtin/OvOcrService'
import { ppocrService } from './builtin/PpocrService'
import { systemOcrService } from './builtin/SystemOcrService'
import { tesseractService } from './builtin/TesseractService'

const logger = loggerService.withContext('OcrService')

export class OcrService {
  private registry: Map<string, OcrBaseService> = new Map()

  constructor() {
    // TODO: Ensure builtin providers are in db.
    // Register built-in providers
    this.register(BuiltinOcrProviderIds.tesseract, tesseractService)

    if (systemOcrService) {
      this.register(BuiltinOcrProviderIds.system, systemOcrService)
    }

    this.register(BuiltinOcrProviderIds.paddleocr, ppocrService)

    if (ovOcrService) {
      this.register(BuiltinOcrProviderIds.ovocr, ovOcrService)
    }
  }

  private register(providerId: string, service: OcrBaseService): void {
    if (this.registry.has(providerId)) {
      logger.warn(`Provider ${providerId} has existing handler. Overwrited.`)
    }
    this.registry.set(providerId, service)
  }

  // @ts-expect-error not used for now, but just keep it.
  private unregister(providerId: string): void {
    this.registry.delete(providerId)
  }

  public async listProviders(): Promise<ListOcrProvidersResponse> {
    const registeredKeys = Array.from(this.registry.keys())
    const providers = await dbService.getDb().select().from(ocrProviderTable)

    return { data: providers.filter((p) => registeredKeys.includes(p.id)) }
  }

  public async patchProvider(update: PatchOcrProviderRequest): Promise<PatchOcrProviderResponse> {
    const providers = await dbService
      .getDb()
      .select()
      .from(ocrProviderTable)
      .where(eq(ocrProviderTable.id, update.id))
      .limit(1)
    if (providers.length == 0) {
      throw new Error(`OCR provider ${update.id} not found`)
    }
    return { data: providers[0] }
  }

  public async ocr(file: SupportedOcrFile, params: OcrParams): Promise<OcrResult> {
    const service = this.registry.get(params.providerId)
    if (!service) {
      throw new Error(`Provider ${params.providerId} is not registered`)
    }
    return service.ocr(file)
  }
}

export const ocrService = new OcrService()
