import { mergeAttributes } from '@tiptap/core'
import { HorizontalRule } from '@tiptap/extension-horizontal-rule'

/**
 * Enhanced HorizontalRule extension that preserves leading spaces in markdown
 *
 * Standard Markdown allows 0-3 spaces before a horizontal rule (---, ***, ___)
 * This extension preserves that indentation when serializing back to markdown
 */
export const EnhancedHorizontalRule = HorizontalRule.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      // Store the number of leading spaces (0-3)
      indentation: {
        default: 0,
        parseHTML: (element) => {
          const indent = element.getAttribute('data-indentation')
          return indent ? parseInt(indent, 10) : 0
        },
        renderHTML: (attributes) => {
          if (!attributes.indentation) return {}
          return {
            'data-indentation': attributes.indentation
          }
        }
      }
    }
  },

  parseHTML() {
    return [
      {
        tag: 'hr',
        getAttrs: (element) => {
          if (typeof element === 'string') return {}

          const htmlElement = element as HTMLElement
          const indentAttr = htmlElement.getAttribute('data-indentation')

          return {
            indentation: indentAttr ? parseInt(indentAttr, 10) : 0
          }
        }
      }
    ]
  },

  renderHTML({ HTMLAttributes }) {
    return ['hr', mergeAttributes(this.options.HTMLAttributes, HTMLAttributes)]
  },

  // Custom markdown parsing to capture leading spaces
  parseMarkdown(token) {
    // The token.raw contains the original markdown including leading spaces
    // Match 0-3 leading spaces before ---, ***, or ___
    const match = /^( {0,3})(?:---|___|\*\*\*)/.exec(token.raw || '')
    const indentation = match ? match[1].length : 0

    return {
      type: this.name,
      attrs: {
        indentation
      }
    }
  },

  // Custom markdown serialization to restore leading spaces
  renderMarkdown(node) {
    const indentation = node.attrs?.indentation || 0
    const spaces = ' '.repeat(Math.min(indentation, 3)) // Max 3 spaces per spec
    return spaces + '---\n\n'
  }
})
