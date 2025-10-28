import { mergeAttributes, Node } from '@tiptap/core'
import { ReactNodeViewRenderer } from '@tiptap/react'

import YamlFrontMatterNodeView from '../components/YamlFrontMatterNodeView'

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

  // Markdown token name for custom parsing
  markdownTokenName: 'yamlFrontMatter',

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

  // Parse markdown token to Tiptap JSON
  parseMarkdown(token: any) {
    // Extract YAML content from the token
    // The content should be the raw YAML text between --- delimiters
    const content = token.text || token.raw || ''
    return {
      type: this.name,
      attrs: {
        content: content.trim()
      }
    }
  },

  // Serialize Tiptap node to markdown
  renderMarkdown(node: any) {
    const content = node.attrs.content || ''
    // If content doesn't end with ---, add it
    const trimmedContent = content.trim()
    if (trimmedContent && !trimmedContent.endsWith('---')) {
      return trimmedContent + '\n---\n\n'
    }
    return trimmedContent ? trimmedContent + '\n\n' : ''
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
