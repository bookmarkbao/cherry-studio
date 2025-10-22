# 对话图片导出功能设计方案

## 一、需求背景

随着多模态AI模型的普及，用户在对话中使用图片的频率增加。当前的导出功能只处理文本内容，图片被完全忽略，需要增加图片导出能力。

## 二、现状分析

### 2.1 图片存储机制

当前系统中图片有两种存储方式：

1. **用户上传的图片**
   - 存储位置：本地文件系统
   - 访问方式：通过 `FileMetadata.path` 字段，使用 `file://` 协议
   - 数据结构：`ImageMessageBlock.file`

2. **AI生成的图片**
   - 存储位置：内存中的Base64字符串
   - 访问方式：`ImageMessageBlock.metadata.generateImageResponse.images` 数组
   - 数据格式：Base64编码的图片数据

### 2.2 现有导出功能

当前支持的导出格式：
- Markdown（本地文件/指定路径）
- Word文档（.docx）
- Notion（需要API配置）
- 语雀（需要API配置）
- Obsidian（带弹窗配置）
- Joplin（需要API配置）
- 思源笔记（需要API配置）
- 笔记工作区
- 纯文本
- 图片截图

### 2.3 导出菜单问题

1. **设置分散**：导出相关设置分布在多个地方
2. **每次导出可能需要不同配置**：如是否包含推理内容、是否包含引用等
3. **缺乏统一的导出界面**：除Obsidian外，其他格式直接执行导出

## 三、解决方案

### 3.1 第一阶段：图片导出功能实现

#### 3.1.1 导出模式设计

提供两种图片导出模式供用户选择：

**模式1：Base64嵌入模式**
```markdown
![图片描述](data:image/png;base64,iVBORw0KGg...)
```
- 优点：单文件、便于分享、保证完整性
- 缺点：文件体积大、部分编辑器不支持、性能较差

**模式2：文件夹模式**
```
导出结构：
conversation_2024-01-21/
├── conversation.md
└── images/
    ├── user_upload_1.png
    ├── ai_generated_1.png
    └── ...
```
Markdown中使用相对路径：
```markdown
![图片描述](./images/user_upload_1.png)
```
- 优点：文件体积小、兼容性好、性能优秀
- 缺点：需要管理多个文件、分享需打包

#### 3.1.2 核心功能实现

1. **新增图片处理工具函数** (`utils/export.ts`)
   ```typescript
   // 处理消息中的所有图片块
   export async function processImageBlocks(
     message: Message,
     mode: 'base64' | 'folder',
     outputDir?: string
   ): Promise<ImageExportResult[]>

   // 将file://协议的图片转换为Base64
   export async function convertFileToBase64(filePath: string): Promise<string>

   // 保存图片到指定文件夹
   export async function saveImageToFolder(
     image: string | Buffer,
     outputDir: string,
     fileName: string
   ): Promise<string>

   // 在Markdown中插入图片引用
   export function insertImageIntoMarkdown(
     markdown: string,
     images: ImageExportResult[]
   ): string
   ```

2. **更新现有导出函数**
   - `messageToMarkdown()`: 增加图片处理参数
   - `topicToMarkdown()`: 批量处理话题中的图片
   - `exportTopicAsMarkdown()`: 支持图片导出选项

3. **图片元数据保留**
   - AI生成图片：保存prompt信息
   - 用户上传图片：保留原始文件名
   - 添加图片索引和时间戳

### 3.2 第二阶段：统一导出弹窗（后续实施）

#### 3.2.1 弹窗设计

创建统一的导出配置弹窗 `UnifiedExportDialog`：

```typescript
interface ExportDialogProps {
  // 导出内容
  content: {
    message?: Message
    messages?: Message[]
    topic?: Topic
    rawContent?: string
  }

  // 导出格式
  format: ExportFormat

  // 通用配置
  options: {
    includeReasoning?: boolean      // 包含推理内容
    excludeCitations?: boolean       // 排除引用
    imageExportMode?: 'base64' | 'folder' | 'none'  // 图片导出模式
    imageQuality?: number           // 图片质量（0-100）
    maxImageSize?: number           // 最大图片尺寸
  }

  // 格式特定配置
  formatOptions?: {
    // Markdown特定
    markdownPath?: string

    // Notion特定
    notionDatabase?: string
    notionPageName?: string

    // Obsidian特定
    obsidianVault?: string
    obsidianFolder?: string
    processingMethod?: string

    // 其他格式配置...
  }
}
```

#### 3.2.2 交互流程

1. 用户点击导出按钮
2. 弹出统一导出弹窗
3. 用户选择导出格式
4. 根据格式显示相应配置选项
5. 用户调整配置
6. 点击确认执行导出

#### 3.2.3 优势

1. **配置集中管理**：所有导出配置在一个界面完成
2. **动态配置**：每次导出可以调整不同设置
3. **用户体验统一**：所有格式使用相同的交互模式
4. **易于扩展**：新增导出格式只需添加配置项

## 四、实施计划

### Phase 1: 基础图片导出（本次实施）
- [x] 创建设计文档
- [ ] 实现图片处理工具函数
- [ ] 更新Markdown导出支持图片
- [ ] 添加图片导出模式设置
- [ ] 测试不同场景

### Phase 2: 扩展格式支持
- [ ] Word文档图片嵌入
- [ ] Obsidian图片处理
- [ ] Joplin图片上传
- [ ] 思源笔记图片支持

### Phase 3: 统一导出弹窗
- [ ] 设计弹窗UI组件
- [ ] 实现配置管理逻辑
- [ ] 迁移现有导出功能
- [ ] 添加配置持久化

### Phase 4: 高级功能
- [ ] 图片压缩优化
- [ ] 批量导出进度显示
- [ ] 导出历史记录
- [ ] 导出模板系统

## 五、技术细节

### 5.1 图片格式转换

```typescript
// Base64转换示例
async function imageToBase64(imagePath: string): Promise<string> {
  if (imagePath.startsWith('file://')) {
    const actualPath = imagePath.slice(7)
    const buffer = await fs.readFile(actualPath)
    const mimeType = getMimeType(actualPath)
    return `data:${mimeType};base64,${buffer.toString('base64')}`
  }
  return imagePath // 已经是Base64
}
```

### 5.2 文件夹结构生成

```typescript
async function createExportFolder(topicName: string): Promise<string> {
  const timestamp = dayjs().format('YYYY-MM-DD-HH-mm-ss')
  const folderName = `${sanitizeFileName(topicName)}_${timestamp}`
  const exportPath = path.join(getExportDir(), folderName)

  await fs.mkdir(path.join(exportPath, 'images'), { recursive: true })
  return exportPath
}
```

### 5.3 Markdown图片引用更新

```typescript
function updateMarkdownImages(
  markdown: string,
  imageMap: Map<string, string>
): string {
  let updatedMarkdown = markdown

  for (const [originalPath, newPath] of imageMap) {
    // 替换图片引用
    const regex = new RegExp(`!\\[([^\\]]*)\\]\\(${escapeRegex(originalPath)}\\)`, 'g')
    updatedMarkdown = updatedMarkdown.replace(
      regex,
      `![$1](${newPath})`
    )
  }

  return updatedMarkdown
}
```

## 六、注意事项

1. **性能考虑**
   - 大量图片时使用异步处理
   - 提供进度反馈
   - 实现取消操作

2. **兼容性**
   - 检测目标应用对图片格式的支持
   - 提供降级方案

3. **安全性**
   - 验证文件路径合法性
   - 限制图片大小
   - 清理临时文件

4. **用户体验**
   - 清晰的配置说明
   - 合理的默认值
   - 错误提示友好

## 七、后续优化

1. **Notion图片支持**（需要调研）
   - 研究Notion API的图片上传能力
   - 评估 `@notionhq/client` 库的图片处理功能
   - 可能需要先上传到图床再引用

2. **智能压缩**
   - 根据图片内容自动选择压缩算法
   - 保持图片质量的同时减小体积

3. **批量导出**
   - 支持多个话题同时导出
   - 生成导出报告

4. **云存储集成**
   - 支持直接上传到云存储
   - 生成分享链接

## 八、参考资料

- [Notion API Documentation](https://developers.notion.com/)
- [Obsidian URI Protocol](https://help.obsidian.md/Extending+Obsidian/Obsidian+URI)
- [Joplin Web Clipper API](https://joplinapp.org/api/references/rest_api/)
- [思源笔记 API](https://github.com/siyuan-note/siyuan/blob/master/API.md)

---

*文档创建日期：2025-01-21*
*最后更新：2025-01-21*