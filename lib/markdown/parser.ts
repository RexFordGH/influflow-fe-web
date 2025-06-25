/**
 * Markdown 解析器
 * 使用 unified + remark 生态处理 Markdown 内容
 * 主要功能：解析 Markdown 为 AST，提取标题结构用于思维导图
 */

import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkGfm from 'remark-gfm'
import remarkStringify from 'remark-stringify'
import type { Root, Heading, Text } from 'mdast'

// 思维导图节点类型
export interface MindmapNode {
  id: string
  level: number // 标题层级 (1-6)
  title: string
  content: string
  children: MindmapNode[]
  position?: {
    line: number
    column: number
  }
}

// Markdown 解析结果
export interface ParseResult {
  ast: Root
  nodes: MindmapNode[]
  content: string
}

/**
 * 创建 Markdown 处理器
 * 配置了 GFM（GitHub Flavored Markdown）支持
 */
export const createMarkdownProcessor = () => {
  return unified()
    .use(remarkParse) // 解析 Markdown
    .use(remarkGfm)   // 支持 GitHub 风格的 Markdown
    .use(remarkStringify) // 序列化为 Markdown
}

/**
 * 解析 Markdown 内容为 AST 和思维导图节点
 * @param markdown - Markdown 字符串
 * @returns ParseResult 包含 AST 和节点信息
 */
export const parseMarkdown = async (markdown: string): Promise<ParseResult> => {
  const processor = createMarkdownProcessor()
  const ast = processor.parse(markdown) as Root
  
  // 提取标题节点用于构建思维导图
  const nodes = extractHeadingNodes(ast)
  
  return {
    ast,
    nodes,
    content: markdown
  }
}

/**
 * 从 AST 中提取标题节点，构建层级结构
 * @param ast - Markdown AST
 * @returns MindmapNode[] 思维导图节点数组
 */
const extractHeadingNodes = (ast: Root): MindmapNode[] => {
  const headings: MindmapNode[] = []
  const stack: MindmapNode[] = [] // 用于构建层级关系的栈
  
  ast.children.forEach((node, index) => {
    if (node.type === 'heading') {
      const heading = node as Heading
      const title = extractTextFromNode(heading)
      
      const mindmapNode: MindmapNode = {
        id: `heading-${index}`,
        level: heading.depth,
        title: title || `标题 ${heading.depth}`,
        content: '', // 后续可以提取标题下的内容
        children: [],
        position: {
          line: heading.position?.start.line || 0,
          column: heading.position?.start.column || 0
        }
      }
      
      // 构建层级关系
      buildHierarchy(stack, mindmapNode, headings)
    }
  })
  
  return headings
}

/**
 * 构建节点的层级关系
 * @param stack - 当前层级栈
 * @param currentNode - 当前节点
 * @param rootNodes - 根节点数组
 */
const buildHierarchy = (
  stack: MindmapNode[], 
  currentNode: MindmapNode, 
  rootNodes: MindmapNode[]
) => {
  // 找到合适的父节点
  while (stack.length > 0 && stack[stack.length - 1].level >= currentNode.level) {
    stack.pop()
  }
  
  if (stack.length === 0) {
    // 根节点
    rootNodes.push(currentNode)
  } else {
    // 添加到父节点的子节点
    stack[stack.length - 1].children.push(currentNode)
  }
  
  stack.push(currentNode)
}

/**
 * 从节点中提取纯文本内容
 * @param node - AST 节点
 * @returns string 文本内容
 */
const extractTextFromNode = (node: any): string => {
  if (node.type === 'text') {
    return (node as Text).value
  }
  
  if (node.children) {
    return node.children
      .map((child: any) => extractTextFromNode(child))
      .join('')
  }
  
  return ''
}

/**
 * 将思维导图节点转换回 Markdown
 * @param nodes - 思维导图节点数组
 * @returns string Markdown 内容
 */
export const nodesToMarkdown = (nodes: MindmapNode[]): string => {
  const lines: string[] = []
  
  const processNode = (node: MindmapNode) => {
    // 生成标题
    const heading = '#'.repeat(node.level) + ' ' + node.title
    lines.push(heading)
    
    // 添加内容（如果有）
    if (node.content.trim()) {
      lines.push('')
      lines.push(node.content)
    }
    
    // 处理子节点
    node.children.forEach(child => {
      lines.push('')
      processNode(child)
    })
  }
  
  nodes.forEach((node, index) => {
    if (index > 0) lines.push('')
    processNode(node)
  })
  
  return lines.join('\n')
}

/**
 * 示例使用方法和测试数据
 */
export const SAMPLE_MARKDOWN = `# 人工智能发展历程

## 早期发展（1950-1980）

### 图灵测试
图灵测试是人工智能领域的重要里程碑。

### 专家系统
早期的人工智能主要基于规则和专家知识。

## 机器学习时代（1980-2010）

### 神经网络
多层感知机的发展推动了机器学习的进步。

### 支持向量机
SVM在分类任务中表现出色。

## 深度学习革命（2010-至今）

### 卷积神经网络
CNN在图像识别领域取得突破。

### 大语言模型
GPT系列模型展示了语言理解的巨大潜力。

#### Transformer架构
注意力机制成为现代AI的核心技术。
`