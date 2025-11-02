import MCPToolsButton from '@renderer/pages/home/Inputbar/MCPToolsButton'
import { defineTool, registerTool, TopicType } from '@renderer/pages/home/Inputbar/types'
import { isPromptToolUse, isSupportedToolUse } from '@renderer/utils/mcp-tools'

const mcpToolsTool = defineTool({
  key: 'mcp_tools',
  label: (t) => t('settings.mcp.title'),
  visibleInScopes: [TopicType.Chat],
  condition: ({ features, assistant }) =>
    features.enableMCPTools && (isSupportedToolUse(assistant) || isPromptToolUse(assistant)),
  dependencies: {
    actions: ['onTextChange', 'resizeTextArea'] as const
  },
  render: ({ assistant, actions, quickPanel }) => (
    <MCPToolsButton
      assistantId={assistant.id}
      quickPanel={quickPanel}
      setInputValue={actions.onTextChange}
      resizeTextArea={actions.resizeTextArea}
    />
  )
})

registerTool(mcpToolsTool)

export default mcpToolsTool
