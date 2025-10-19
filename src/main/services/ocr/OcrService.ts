import { loggerService } from '@logger'
import type { OcrParams, OcrResult, SupportedOcrFile } from '@types'
import { BuiltinOcrProviderIds } from '@types'

import type { OcrBaseService } from './builtin/OcrBaseService'
import { ovOcrService } from './builtin/OvOcrService'
import { ppocrService } from './builtin/PpocrService'
import { systemOcrService } from './builtin/SystemOcrService'
import { tesseractService } from './builtin/TesseractService'

const logger = loggerService.withContext('OcrService')

export class OcrService {
  private registry: Map<string, OcrBaseService> = new Map()

  register(providerId: string, service: OcrBaseService): void {
    if (this.registry.has(providerId)) {
      logger.warn(`Provider ${providerId} has existing handler. Overwrited.`)
    }
    this.registry.set(providerId, service)
  }

  unregister(providerId: string): void {
    this.registry.delete(providerId)
  }

  public listProviderIds(): string[] {
    return Array.from(this.registry.keys())
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

// Register built-in providers
ocrService.register(BuiltinOcrProviderIds.tesseract, tesseractService)

if (systemOcrService) {
  ocrService.register(BuiltinOcrProviderIds.system, systemOcrService)
}

ocrService.register(BuiltinOcrProviderIds.paddleocr, ppocrService)

if (ovOcrService) {
  ocrService.register(BuiltinOcrProviderIds.ovocr, ovOcrService)
}
