import { loggerService } from '@logger'
import type { ActionTool } from '@renderer/components/ActionTools'
import { TOOL_SPECS, useToolManager } from '@renderer/components/ActionTools'
import { usePendingMap } from '@renderer/hooks/usePendingMap'
import { useQuickCompletion } from '@renderer/hooks/useQuickCompletion'
import { useSettings } from '@renderer/hooks/useSettings'
import type { Chunk } from '@renderer/types/chunk'
import { ChunkType } from '@renderer/types/chunk'
import { getErrorMessage, parseJSON } from '@renderer/utils'
import { abortCompletion, readyToAbort } from '@renderer/utils/abortController'
import { WrenchIcon } from 'lucide-react'
import { useCallback, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import * as z from 'zod'

const logger = loggerService.withContext('useMermaidFixTool')

interface UseMermaidFixTool {
  enabled?: boolean
  context: {
    /** Code block id */
    blockId: string
    /** Error */
    error: unknown
    /** Mermaid code */
    content: string
  }
  onSave: (newContent: string) => void
  setError: (error: unknown) => void
  setTools: React.Dispatch<React.SetStateAction<ActionTool[]>>
}

const ResultSchema = z.union([
  z.object({
    fixed: z.literal(true),
    result: z.string()
  }),
  z.object({
    fixed: z.literal(false),
    reason: z.string()
  })
])

type Input = {
  // mermaid 代码
  mermaid: string
  // 错误信息
  error: string
  // 用户语言代码, 如 zh-cn, en-us
  lang: string
}

const SYSTEM_PROMPT = `
You are an AI assistant that fixes Mermaid code. The input is a JSON string with the following structure: {"mermaid": "the Mermaid code", "error": "the error message from rendering", "lang": "the user's language code"}.

Your task is to analyze the error and the Mermaid code. If the error is due to a mistake in the Mermaid code, fix it and output a JSON string with {"fixed": true, "result": "the fixed Mermaid code"}. If the error is not caused by the code (e.g., environment issues, unsupported features, or other non-code errors), output {"fixed": false, "reason": "a brief explanation in the language specified by the 'lang' field"}.

Your output must be a pure JSON string with no additional text, comments, or formatting.

Example input:
{
  "mermaid": "graph TD\nA[Start] --> B{Error?}",
  "error": "Syntax error: unexpected token",
  "lang": "en-us"
}

Example outputs:
- If fixed: {"fixed": true, "result": "graph TD\nA[Start] --> B{Error?}\nB -->|Yes| C[End]"}
- If not fixed: {"fixed": false, "reason": "The error is due to an unsupported feature in the current environment."}

`

export const useMermaidFixTool = ({ enabled, context, onSave, setError, setTools }: UseMermaidFixTool) => {
  const { t } = useTranslation()
  const { registerTool, removeTool } = useToolManager(setTools)
  const { language } = useSettings()
  const completion = useQuickCompletion(SYSTEM_PROMPT)

  const { error, content, blockId } = context
  const abortKeyRef = useRef<string | null>(null)

  const { setPending } = usePendingMap()
  logger.debug('input', {
    mermaid: content,
    error: getErrorMessage(error),
    lang: language
  })
  const prompt = JSON.stringify({
    mermaid: content,
    error: getErrorMessage(error),
    lang: language
  } satisfies Input)

  const fixCode = useCallback(async () => {
    setPending(blockId, true)
    const abortKey = crypto.randomUUID()
    abortKeyRef.current = abortKey
    const signal = readyToAbort(abortKey)
    let result = ''

    const onChunk = (chunk: Chunk) => {
      if (chunk.type === ChunkType.TEXT_DELTA) {
        result = chunk.text
      }
    }

    try {
      await completion({
        prompt,
        onChunk,
        params: {
          options: {
            signal
          }
        }
      })
    } catch (e) {
      window.toast.error({ title: t('code_block.mermaid_fix.failed'), description: getErrorMessage(e) })
      return
    }

    result = result.trim()
    logger.debug('output', { result })

    const parsedJson = parseJSON(result)
    if (parsedJson === null) {
      window.toast.error({
        title: t('code_block.mermaid_fix.failed'),
        description: t('code_block.mermaid_fix.invalid_result')
      })
    } else {
      logger.debug('parseJSON success', { parsedJson })
      const parsedResult = ResultSchema.safeParse(parsedJson)
      logger.debug('validation', { parsedResult })

      if (parsedResult.success) {
        const validResult = parsedResult.data
        if (validResult.fixed) {
          onSave(validResult.result)
          setError(undefined)
        } else {
          window.toast.warning({ title: t('code_block.mermaid_fix.failed'), description: validResult.reason })
        }
      } else {
        window.toast.error({
          title: t('code_block.mermaid_fix.failed'),
          description: t('code_block.mermaid_fix.invalid_result')
        })
      }
    }

    setPending(blockId, false)
  }, [setPending, blockId, completion, prompt, t, onSave, setError])

  // when unmounted
  useEffect(() => {
    return () => {
      const abortKey = abortKeyRef.current
      if (abortKey) {
        abortCompletion(abortKey)
      }
    }
  }, [])

  useEffect(() => {
    if (enabled) {
      registerTool({
        ...TOOL_SPECS.mermaid_fix,
        icon: <WrenchIcon size={'1rem'} className="tool-icon" />,
        tooltip: t('code_block.mermaid_fix.label'),
        visible: () => error !== undefined && error !== null,
        onClick: fixCode
      })
    }

    return () => removeTool(TOOL_SPECS.expand.id)
  }, [enabled, error, fixCode, registerTool, removeTool, t])
}
