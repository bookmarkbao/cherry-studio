import { loggerService } from '@logger'
import { mergeAttributes, Node } from '@tiptap/core'
import { ReactNodeViewRenderer } from '@tiptap/react'

import YamlFrontMatterNodeView from '../components/YamlFrontMatterNodeView'

const logger = loggerService.withContext('YamlFrontMatterExtension')

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    yamlFrontMatter: {
      insertYamlFrontMatter: (content?: string) => ReturnType
    }
  }
}

export const YamlFrontMatter = Node.create({
  name: 'yamlFrontMatter',
  group: 'block',
  atom: true,
  draggable: false,

  // Custom tokenizer for YAML front matter
  markdownTokenizer: {
    name: 'yamlFrontMatter',
    level: 'block',
    // Optimization: check if content starts with ---
    start(src: string) {
      logger.info('🔍 Tokenizer start() called', {
        srcLength: src.length,
        srcPrefix: src.substring(0, 60).replace(/\n/g, '\\n'),
        startsWithDashes: src.startsWith('---\n')
      })

      const result = src.match(/^---\n/) ? 0 : -1
      logger.info('✅ Tokenizer start() result:', { result })
      return result
    },
    // Parse YAML front matter
    tokenize(src: string) {
      logger.info('🔍 Tokenizer tokenize() called', {
        srcLength: src.length,
        srcPrefix: src.substring(0, 120).replace(/\n/g, '\\n')
      })

      // Match: ---\n...yaml content...\n---
      const match = /^---\n([\s\S]*?)\n---(?:\n|$)/.exec(src)

      if (!match) {
        logger.warn('❌ Tokenizer tokenize() - NO MATCH FOUND')
        return undefined
      }

      const token = {
        type: 'yamlFrontMatter',
        raw: match[0],
        text: match[1] // YAML content without delimiters
      }

      logger.info('✅ Tokenizer tokenize() - MATCH FOUND', {
        rawLength: token.raw.length,
        textLength: token.text.length,
        textPreview: token.text.substring(0, 100).replace(/\n/g, '\\n')
      })

      return token
    }
  },

  // Parse markdown token to Tiptap JSON
  parseMarkdown(token, helpers) {
    logger.info('🔍 parseMarkdown() called', {
      tokenType: token.type,
      hasText: !!token.text,
      textLength: token.text?.length || 0,
      textPreview: token.text?.substring(0, 100).replace(/\n/g, '\\n'),
      hasTokens: !!token.tokens,
      tokensLength: token.tokens?.length || 0
    })

    const result = {
      type: this.name,
      attrs: {
        content: token.text || ''
      },
      content: helpers.parseChildren(token.tokens || [])
    }

    logger.info('✅ parseMarkdown() result', {
      type: result.type,
      contentLength: result.attrs.content.length,
      hasContent: !!result.content
    })

    return result
  },

  // Serialize Tiptap node to markdown
  renderMarkdown(node) {
    logger.info('🔍 renderMarkdown() called', {
      nodeType: node.type,
      hasContent: !!node.attrs?.content,
      contentLength: node.attrs?.content?.length || 0,
      contentPreview: node.attrs?.content?.substring(0, 100).replace(/\n/g, '\\n')
    })

    const content = node.attrs?.content || ''
    if (!content.trim()) {
      logger.info('⚠️ renderMarkdown() - empty content, returning empty string')
      return ''
    }

    const trimmedContent = content.trim()
    let result = ''

    // Ensure proper format with closing ---
    if (trimmedContent.endsWith('---')) {
      result = trimmedContent + '\n\n'
    } else {
      result = trimmedContent + '\n---\n\n'
    }

    logger.info('✅ renderMarkdown() result', {
      resultLength: result.length,
      resultPreview: result.substring(0, 120).replace(/\n/g, '\\n')
    })

    return result
  },

  addOptions() {
    return {
      HTMLAttributes: {}
    }
  },

  addAttributes() {
    return {
      content: {
        default: '',
        parseHTML: (element) => {
          const dataContent = element.getAttribute('data-content')
          if (dataContent) {
            // Decode HTML entities that might be in the data-content attribute
            const textarea = document.createElement('textarea')
            textarea.innerHTML = dataContent
            return textarea.value
          }
          return element.textContent || ''
        },
        renderHTML: (attributes) => ({
          'data-content': attributes.content
        })
      }
    }
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-type="yaml-front-matter"]',
        getAttrs: (element) => {
          if (typeof element === 'string') return false

          const htmlElement = element as HTMLElement
          const dataContent = htmlElement.getAttribute('data-content')
          const textContent = htmlElement.textContent || ''

          return {
            content: dataContent || textContent
          }
        }
      }
    ]
  },

  renderHTML({ HTMLAttributes, node }) {
    const content = node.attrs.content || ''
    return [
      'div',
      mergeAttributes(HTMLAttributes, {
        'data-type': 'yaml-front-matter',
        'data-content': content
      }),
      content
    ]
  },

  addCommands() {
    return {
      insertYamlFrontMatter:
        (content = '') =>
        ({ commands }) => {
          return commands.insertContent({
            type: this.name,
            attrs: {
              content
            }
          })
        }
    }
  },

  addNodeView() {
    return ReactNodeViewRenderer(YamlFrontMatterNodeView)
  },

  addInputRules() {
    return []
  }
})
