import ModelAvatar from '@renderer/components/Avatar/ModelAvatar'
import { HStack, VStack } from '@renderer/components/Layout'
import { TopView } from '@renderer/components/TopView'
import { usePromptProcessor } from '@renderer/hooks/usePromptProcessor'
import { Assistant } from '@renderer/types'
import { Modal, Table, Tabs, Tag as AntdTag, Typography } from 'antd'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import ReactMarkdown from 'react-markdown'
import styled from 'styled-components'

const { Text } = Typography

interface ShowParams {
  assistant: Assistant
}

interface Props extends ShowParams {
  resolve: (data: any) => void
}

const PopupContainer: React.FC<Props> = ({ assistant, resolve }) => {
  const [open, setOpen] = useState(true)
  const { t } = useTranslation()

  const processedPrompt = usePromptProcessor({
    prompt: assistant.prompt,
    modelName: assistant.model?.name
  })

  const onOk = () => {
    setOpen(false)
  }

  const onCancel = () => {
    setOpen(false)
  }

  const onClose = () => {
    resolve({})
  }

  AssistantSettingsPreviewPopup.hide = onCancel

  // 自定义参数表格的列定义
  const customParametersColumns = [
    {
      title: t('models.parameter_name'),
      dataIndex: 'name',
      key: 'name',
      width: '30%'
    },
    {
      title: t('models.parameter_type'),
      dataIndex: 'type',
      key: 'type',
      width: '20%',
      render: (type: string) => <Tag color="geekblue">{type}</Tag>
    },
    {
      title: t('models.parameter_value'),
      dataIndex: 'value',
      key: 'value',
      width: '50%',
      render: (value: any) => <Text code>{typeof value === 'object' ? JSON.stringify(value) : String(value)}</Text>
    }
  ]

  // 准备自定义参数数据
  const customParametersData =
    assistant.settings?.customParameters?.map((param, index) => ({
      key: index,
      name: param.name,
      type: param.type,
      value: param.value
    })) || []

  // 参数页内容
  const parametersContent = (
    <ParametersContainer>
      <VStack gap={12}>
        {assistant.model && (
          <SettingItem>
            <SettingLabel>{t('assistants.settings.default_model')}</SettingLabel>
            <HStack gap={8} alignItems="center">
              <ModelAvatar model={assistant.model} size={20} />
              <Text>{assistant.model.name}</Text>
            </HStack>
          </SettingItem>
        )}

        {assistant.settings?.enableTemperature !== false && (
          <SettingItem>
            <SettingLabel>{t('chat.settings.temperature.label')}</SettingLabel>
            <Text>{assistant.settings?.temperature ?? 0.7}</Text>
          </SettingItem>
        )}

        {assistant.settings?.enableTopP !== false && (
          <SettingItem>
            <SettingLabel>{t('chat.settings.top_p.label')}</SettingLabel>
            <Text>{assistant.settings?.topP ?? 1}</Text>
          </SettingItem>
        )}

        <SettingItem>
          <SettingLabel>{t('chat.settings.context_count.label')}</SettingLabel>
          <Text>{assistant.settings?.contextCount ?? 25}</Text>
        </SettingItem>

        {assistant.settings?.enableMaxTokens && (
          <SettingItem>
            <SettingLabel>{t('chat.settings.max_tokens.label')}</SettingLabel>
            <Text>{assistant.settings?.maxTokens ?? 0}</Text>
          </SettingItem>
        )}

        <SettingItem>
          <SettingLabel>{t('models.stream_output')}</SettingLabel>
          <Tag color={assistant.settings?.streamOutput !== false ? 'green' : 'red'}>
            {assistant.settings?.streamOutput !== false ? t('common.enabled') : t('common.disabled')}
          </Tag>
        </SettingItem>

        <SettingItem>
          <SettingLabel>{t('assistants.settings.tool_use_mode.label')}</SettingLabel>
          <Tag color="blue">
            {assistant.settings?.toolUseMode === 'function'
              ? t('assistants.settings.tool_use_mode.function')
              : t('assistants.settings.tool_use_mode.prompt')}
          </Tag>
        </SettingItem>

        {customParametersData.length > 0 && (
          <CustomParametersSection>
            <SectionTitle>{t('models.custom_parameters')}</SectionTitle>
            <Table
              columns={customParametersColumns}
              dataSource={customParametersData}
              pagination={false}
              size="small"
              bordered
              showHeader={false}
            />
          </CustomParametersSection>
        )}
      </VStack>
    </ParametersContainer>
  )

  // 提示词页内容
  const promptContent = assistant.prompt ? (
    <PromptContainer>
      <ReactMarkdown>{processedPrompt || assistant.prompt}</ReactMarkdown>
    </PromptContainer>
  ) : (
    <EmptyPromptContainer>
      <Text type="secondary">{t('common.no_data')}</Text>
    </EmptyPromptContainer>
  )

  // Tab 项配置
  const tabItems = [
    {
      key: 'parameters',
      label: t('common.model'),
      children: parametersContent
    },
    {
      key: 'prompt',
      label: t('common.prompt'),
      children: promptContent
    }
  ]

  return (
    <Modal
      title={assistant.emoji + ' ' + assistant.name}
      open={open}
      width={750}
      onOk={onOk}
      onCancel={onCancel}
      afterClose={onClose}
      transitionName="animation-move-down"
      footer={null}
      centered>
      <Container>
        <Tabs defaultActiveKey="parameters" items={tabItems} />
      </Container>
    </Modal>
  )
}

const TopViewKey = 'AssistantSettingsPreviewPopup'

const Container = styled.div`
  max-height: 70vh;
  overflow-y: hidden;
`

const ParametersContainer = styled.div`
  max-height: 60vh;
  overflow-y: auto;
  padding: 16px 0;
  padding-top: 0;
`

const CustomParametersSection = styled.div`
  width: 100%;
  margin-top: 8px;
`

const SectionTitle = styled.div`
  font-size: 16px;
  font-weight: 600;
  color: var(--color-text-1);
  margin-bottom: 16px;
  padding-bottom: 8px;
  border-bottom: 1px solid var(--color-border);
`

const EmptyPromptContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 200px;
  background: var(--color-fill-1);
  border-radius: 8px;
  border: 1px solid var(--color-border);
`

const SettingItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 5px 0;
  border-bottom: 1px solid var(--color-border-2);

  &:last-child {
    margin-bottom: 0;
    border-bottom: none;
  }
`

const SettingLabel = styled(Text)`
  font-weight: 500;
  color: var(--color-text-2);
  min-width: 140px;
  flex-shrink: 0;
`

const Tag = styled(AntdTag)`
  margin: 0;
`

const PromptContainer = styled.div`
  max-height: 60vh;
  overflow-y: auto;
  padding: 16px;
  border-radius: 8px;
  background: var(--color-fill-1);
  border: 1px solid var(--color-border);
  font-size: 14px;
  line-height: 1.6;
  margin-bottom: 16px;

  p {
    margin-bottom: 8px;

    &:last-child {
      margin-bottom: 0;
    }
  }

  code {
    background: var(--color-fill-2);
    padding: 2px 4px;
    border-radius: 3px;
    font-size: 13px;
  }

  pre {
    background: var(--color-fill-2);
    padding: 8px;
    border-radius: 4px;
    overflow-x: auto;

    code {
      background: none;
      padding: 0;
    }
  }

  h1,
  h2,
  h3,
  h4,
  h5,
  h6 {
    margin: 16px 0 8px 0;
    font-weight: 600;

    &:first-child {
      margin-top: 0;
    }
  }

  ul,
  ol {
    margin: 8px 0;
    padding-left: 20px;

    li {
      margin-bottom: 4px;
    }
  }

  blockquote {
    margin: 16px 0;
    padding: 8px 16px;
    border-left: 4px solid var(--color-primary);
    background: var(--color-fill-2);
    border-radius: 4px;
  }

  table {
    width: 100%;
    border-collapse: collapse;
    margin: 16px 0;

    th,
    td {
      border: 1px solid var(--color-border);
      padding: 8px 12px;
      text-align: left;
    }

    th {
      background: var(--color-fill-2);
      font-weight: 600;
    }
  }

  hr {
    margin: 16px 0;
    border: none;
    border-top: 1px solid var(--color-border);
  }

  strong {
    font-weight: 600;
  }

  em {
    font-style: italic;
  }

  a {
    color: var(--color-primary);
    text-decoration: none;

    &:hover {
      text-decoration: underline;
    }
  }
`

export default class AssistantSettingsPreviewPopup {
  static topviewId = 0
  static hide() {
    TopView.hide(TopViewKey)
  }
  static show(props: ShowParams) {
    return new Promise<any>((resolve) => {
      TopView.show(
        <PopupContainer
          {...props}
          resolve={(v) => {
            resolve(v)
            TopView.hide(TopViewKey)
          }}
        />,
        TopViewKey
      )
    })
  }
}
