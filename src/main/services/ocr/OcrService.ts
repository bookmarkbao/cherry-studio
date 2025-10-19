import { dbService } from '@data/db/DbService'
import { ocrProviderTable } from '@data/db/schemas/ocr/provider'
import { loggerService } from '@logger'
import type {
  CreateOcrProviderRequest,
  CreateOcrProviderResponse,
  ListOcrProvidersResponse,
  OcrParams,
  OcrResult,
  PatchOcrProviderRequest,
  PatchOcrProviderResponse,
  PutOcrProviderRequest,
  PutOcrProviderResponse,
  SupportedOcrFile
} from '@types'
import { BuiltinOcrProviderIdMap, BuiltinOcrProviderIds } from '@types'
import { eq } from 'drizzle-orm'
import { merge } from 'lodash'

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
    this.register(BuiltinOcrProviderIdMap.tesseract, tesseractService)

    if (systemOcrService) {
      this.register(BuiltinOcrProviderIdMap.system, systemOcrService)
    }

    this.register(BuiltinOcrProviderIdMap.paddleocr, ppocrService)

    if (ovOcrService) {
      this.register(BuiltinOcrProviderIdMap.ovocr, ovOcrService)
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

  public async listProviders(registered?: boolean): Promise<ListOcrProvidersResponse> {
    const providers = await dbService.getDb().select().from(ocrProviderTable)
    if (registered) {
      const registeredKeys = Array.from(this.registry.keys())
      return { data: providers.filter((p) => registeredKeys.includes(p.id)) }
    } else {
      return { data: providers }
    }
  }

  public async getProvider(providerId: string) {
    const providers = await dbService
      .getDb()
      .select()
      .from(ocrProviderTable)
      .where(eq(ocrProviderTable.id, providerId))
      .limit(1)
    if (providers.length === 0) {
      throw new Error(`OCR provider ${providerId} not found`)
    }
    return { data: providers[0] }
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
    const config = providers[0].config
    const newConfig = merge({}, config, update.config)
    const [updated] = await dbService
      .getDb()
      .update(ocrProviderTable)
      .set({
        name: update.name,
        config: newConfig
      })
      .where(eq(ocrProviderTable.id, update.id))
      .returning()
    return { data: updated }
  }

  public async createProvider(create: CreateOcrProviderRequest): Promise<CreateOcrProviderResponse> {
    const providers = await dbService
      .getDb()
      .select()
      .from(ocrProviderTable)
      .where(eq(ocrProviderTable.id, create.id))
      .limit(1)

    if (providers.length > 0) {
      throw new Error(`OCR provider ${create.id} already exists`)
    }

    const [created] = await dbService.getDb().insert(ocrProviderTable).values(create).returning()

    return { data: created }
  }

  public async putProvider(update: PutOcrProviderRequest): Promise<PutOcrProviderResponse> {
    if (BuiltinOcrProviderIds.some((pid) => pid === update.id)) {
      throw new Error('Builtin OCR providers cannot be modified with PUT method.')
    }
    const providers = await dbService
      .getDb()
      .select()
      .from(ocrProviderTable)
      .where(eq(ocrProviderTable.id, update.id))
      .limit(1)

    if (providers.length === 0) {
      const [created] = await dbService.getDb().insert(ocrProviderTable).values(update).returning()
      return { data: created }
    }

    const [updated] = await dbService
      .getDb()
      .update(ocrProviderTable)
      .set(update)
      .where(eq(ocrProviderTable.id, update.id))
      .returning()

    return { data: updated }
  }

  public async deleteProvider(providerId: string): Promise<void> {
    if (BuiltinOcrProviderIds.some((pid) => pid === providerId)) {
      throw new Error('Builtin OCR providers cannot be deleted.')
    }
    const providers = await dbService
      .getDb()
      .select()
      .from(ocrProviderTable)
      .where(eq(ocrProviderTable.id, providerId))
      .limit(1)
    if (providers.length === 0) {
      throw new Error(`OCR provider ${providerId} not found`)
    }
    await dbService.getDb().delete(ocrProviderTable).where(eq(ocrProviderTable.id, providerId))
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
