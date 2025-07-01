/**
 * TipTap Markdown 编辑器组件
 * 提供所见即所得的 Markdown 编辑体验
 */

'use client';

import {
  BoldIcon,
  CodeBracketIcon,
  ItalicIcon,
  ListBulletIcon,
  Bars3BottomLeftIcon as NumberedListIcon,
  ChatBubbleLeftIcon as QuoteIcon,
} from '@heroicons/react/24/outline';
import { Button, ButtonGroup, Divider } from '@heroui/react';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { useEffect, useMemo, useRef } from 'react';

import { parseMarkdown } from '@/lib/markdown/parser';
import { useContentStore } from '@/stores/contentStore';

/**
 * Markdown 编辑器工具栏组件
 */
const EditorToolbar = ({ editor }: { editor: any }) => {
  if (!editor) return null;

  return (
    <div className="flex flex-wrap items-center gap-1 border-b border-gray-200 bg-gray-50 p-2 dark:border-gray-600 dark:bg-gray-700">
      {/* 文本格式化 */}
      <ButtonGroup size="sm" variant="flat">
        <Button
          color={editor.isActive('bold') ? 'primary' : 'default'}
          variant={editor.isActive('bold') ? 'solid' : 'flat'}
          onClick={() => editor.chain().focus().toggleBold().run()}
          className="min-w-unit-8"
        >
          <BoldIcon className="size-4" />
        </Button>

        <Button
          color={editor.isActive('italic') ? 'primary' : 'default'}
          variant={editor.isActive('italic') ? 'solid' : 'flat'}
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className="min-w-unit-8"
        >
          <ItalicIcon className="size-4" />
        </Button>

        <Button
          color={editor.isActive('code') ? 'primary' : 'default'}
          variant={editor.isActive('code') ? 'solid' : 'flat'}
          onClick={() => editor.chain().focus().toggleCode().run()}
          className="min-w-unit-8"
        >
          <CodeBracketIcon className="size-4" />
        </Button>
      </ButtonGroup>

      <Divider orientation="vertical" className="mx-1 h-6" />

      {/* 标题级别 */}
      <ButtonGroup size="sm" variant="flat">
        {[1, 2, 3, 4, 5, 6].map((level) => (
          <Button
            key={level}
            color={
              editor.isActive('heading', { level }) ? 'primary' : 'default'
            }
            variant={editor.isActive('heading', { level }) ? 'solid' : 'flat'}
            onClick={() =>
              editor.chain().focus().toggleHeading({ level }).run()
            }
            className="min-w-unit-8"
          >
            H{level}
          </Button>
        ))}
      </ButtonGroup>

      <Divider orientation="vertical" className="mx-1 h-6" />

      {/* 列表 */}
      <ButtonGroup size="sm" variant="flat">
        <Button
          color={editor.isActive('bulletList') ? 'primary' : 'default'}
          variant={editor.isActive('bulletList') ? 'solid' : 'flat'}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className="min-w-unit-8"
        >
          <ListBulletIcon className="size-4" />
        </Button>

        <Button
          color={editor.isActive('orderedList') ? 'primary' : 'default'}
          variant={editor.isActive('orderedList') ? 'solid' : 'flat'}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className="min-w-unit-8"
        >
          <NumberedListIcon className="size-4" />
        </Button>
      </ButtonGroup>

      <Divider orientation="vertical" className="mx-1 h-6" />

      {/* 其他格式 */}
      <ButtonGroup size="sm" variant="flat">
        <Button
          color={editor.isActive('blockquote') ? 'primary' : 'default'}
          variant={editor.isActive('blockquote') ? 'solid' : 'flat'}
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          className="min-w-unit-8"
        >
          <QuoteIcon className="size-4" />
        </Button>

        <Button
          color={editor.isActive('codeBlock') ? 'primary' : 'default'}
          variant={editor.isActive('codeBlock') ? 'solid' : 'flat'}
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          className="min-w-unit-8"
        >
          <CodeBracketIcon className="size-4" />
        </Button>
      </ButtonGroup>
    </div>
  );
};

/**
 * 主编辑器组件
 *
 * 功能特性：
 * 1. 所见即所得的 Markdown 编辑
 * 2. 丰富的格式化工具栏
 * 3. 实时与思维导图同步
 * 4. 支持快捷键操作
 * 5. 集成 HeroUI 设计系统
 */
const MarkdownEditor = () => {
  const {
    markdown,
    setMarkdown,
    setMarkdownNodes,
    syncMarkdownToFlow,
    selectedNodeId,
    hoveredNodeId,
    mappings,
  } = useContentStore();

  // 防抖计时器引用
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // 用于跟踪更新源
  const isUpdatingFromFlow = useRef(false);

  // 防抖同步函数
  const debouncedSync = useMemo(() => {
    return async (newMarkdown: string) => {
      // 如果正在从Flow更新，跳过同步
      if (isUpdatingFromFlow.current) {
        return;
      }

      // 清除之前的计时器
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      // 设置新的计时器
      debounceTimerRef.current = setTimeout(async () => {
        try {
          if (newMarkdown.trim()) {
            const parseResult = await parseMarkdown(newMarkdown);
            setMarkdownNodes(parseResult.nodes);
            syncMarkdownToFlow();
          } else {
            // 如果内容为空，清空思维导图
            setMarkdownNodes([]);
            syncMarkdownToFlow();
          }
        } catch (error) {
          console.warn('自动同步失败:', error);
        }
      }, 500); // 500ms防抖延迟
    };
  }, [setMarkdownNodes, syncMarkdownToFlow]);

  // 初始化 TipTap 编辑器
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        // 配置 StarterKit 扩展
        heading: {
          levels: [1, 2, 3, 4, 5, 6],
        },
        codeBlock: {
          languageClassPrefix: 'language-',
        },
      }),
    ],
    content: markdown,
    editorProps: {
      attributes: {
        class:
          'prose prose-lg dark:prose-invert max-w-none focus:outline-none text-gray-900 dark:text-gray-100 break-words',
        style: 'min-height: 100%; height: auto;',
      },
    },
    onUpdate: ({ editor }) => {
      // 获取JSON格式的文档结构来提取Markdown
      const json = editor.getJSON();
      const newMarkdown = convertJsonToMarkdown(json);

      // console.log('TipTap 更新 - JSON:', json)
      // console.log('TipTap 更新 - 生成的 Markdown:', newMarkdown)

      // 立即更新Markdown内容
      setMarkdown(newMarkdown);

      // 使用防抖同步到思维导图
      debouncedSync(newMarkdown);
    },
  });

  // 监听外部 Markdown 变化，更新编辑器内容
  useEffect(() => {
    if (editor && markdown) {
      // 获取当前编辑器的文档JSON
      const currentJson = editor.getJSON();
      const currentMarkdown = convertJsonToMarkdown(currentJson);

      // 只有内容真的不同时才更新，避免无限循环
      if (markdown !== currentMarkdown) {
        // 标记正在从Flow更新
        isUpdatingFromFlow.current = true;

        const htmlContent = convertMarkdownToHtml(markdown);
        editor.commands.setContent(htmlContent);

        // 延迟重置标志
        setTimeout(() => {
          isUpdatingFromFlow.current = false;
        }, 100);
      }
    }
  }, [markdown, editor]);

  // JSON到Markdown转换函数
  const convertJsonToMarkdown = (json: any): string => {
    if (!json || !json.content) return '';

    const lines: string[] = [];

    json.content.forEach((node: any, index: number) => {
      const converted = convertNodeToMarkdown(node);
      if (converted.trim()) {
        lines.push(converted);

        // 在标题之后添加空行，除非是最后一个节点
        if (node.type === 'heading' && index < json.content.length - 1) {
          lines.push('');
        }
      }
    });

    return lines.join('\n');
  };

  // 单个节点转换为Markdown
  const convertNodeToMarkdown = (node: any): string => {
    if (!node) return '';

    switch (node.type) {
      case 'heading':
        const level = '#'.repeat(node.attrs?.level || 1);
        const text =
          node.content?.map((child: any) => child.text || '').join('') || '';
        return `${level} ${text}`;

      case 'paragraph':
        const content =
          node.content
            ?.map((child: any) => {
              if (child.type === 'text') {
                let text = child.text || '';
                // 处理格式化标记
                if (child.marks) {
                  child.marks.forEach((mark: any) => {
                    switch (mark.type) {
                      case 'bold':
                        text = `**${text}**`;
                        break;
                      case 'italic':
                        text = `*${text}*`;
                        break;
                      case 'code':
                        text = `\`${text}\``;
                        break;
                    }
                  });
                }
                return text;
              }
              return '';
            })
            .join('') || '';

        // 只返回非空的段落内容
        return content.trim() ? content : '';

      case 'bulletList':
        return (
          node.content
            ?.map((item: any) => `- ${convertNodeToMarkdown(item)}`)
            .join('\n') || ''
        );

      case 'orderedList':
        return (
          node.content
            ?.map(
              (item: any, index: number) =>
                `${index + 1}. ${convertNodeToMarkdown(item)}`,
            )
            .join('\n') || ''
        );

      case 'listItem':
        return (
          node.content
            ?.map((child: any) => convertNodeToMarkdown(child))
            .join('') || ''
        );

      case 'blockquote':
        const quoteContent =
          node.content
            ?.map((child: any) => convertNodeToMarkdown(child))
            .join('\n') || '';
        return quoteContent
          .split('\n')
          .map((line: string) => `> ${line}`)
          .join('\n');

      case 'codeBlock':
        const code =
          node.content?.map((child: any) => child.text || '').join('') || '';
        return `\`\`\`\n${code}\n\`\`\``;

      default:
        return '';
    }
  };

  // 简化的Markdown到HTML转换（保持基本功能）
  const convertMarkdownToHtml = (md: string): string => {
    if (!md) return '<p></p>';

    const lines = md.split('\n');
    let html = '';

    for (const line of lines) {
      if (line.match(/^#{1,6} /)) {
        const level = line.match(/^#{1,6}/)?.[0].length || 1;
        const text = line.replace(/^#{1,6} /, '');
        html += `<h${level}>${text}</h${level}>`;
      } else if (line.trim()) {
        html += `<p>${line}</p>`;
      }
    }

    return html || '<p></p>';
  };

  // 处理节点选中时的高亮效果
  useEffect(() => {
    if (!editor || !selectedNodeId) return;

    const mapping = mappings.find((m) => m.nodeId === selectedNodeId);
    if (mapping) {
      // 高亮对应的 Markdown 区域
      // 这里需要实现具体的高亮逻辑
      // console.log('高亮 Markdown 区域:', mapping.markdownSection)
    }
  }, [selectedNodeId, mappings, editor]);

  // 处理鼠标悬浮时的预览效果
  useEffect(() => {
    if (!editor || !hoveredNodeId) return;

    const mapping = mappings.find((m) => m.nodeId === hoveredNodeId);
    if (mapping) {
      // 临时高亮预览
      // console.log('预览 Markdown 区域:', mapping.markdownSection)
    }
  }, [hoveredNodeId, mappings, editor]);

  // 组件卸载时清理计时器
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  // 缓存单词计数，避免每次渲染重新计算
  const wordCount = useMemo(() => {
    return markdown.split(/\s+/).filter((word) => word.length > 0).length;
  }, [markdown]);

  if (!editor) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-gray-500">编辑器加载中...</div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-lg border border-gray-200 bg-white dark:border-gray-600 dark:bg-gray-800">
      {/* 工具栏 */}
      <EditorToolbar editor={editor} />

      {/* 编辑器内容区域 */}
      <div className="relative flex-1">
        <div className="absolute inset-0 overflow-y-auto overflow-x-hidden bg-white dark:bg-gray-800">
          <EditorContent
            editor={editor}
            className="prose prose-lg dark:prose-invert w-full max-w-none"
          />
        </div>
      </div>

      {/* 状态栏 */}
      <div className="flex items-center justify-between border-t border-gray-200 bg-gray-50 p-2 text-xs text-gray-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-400">
        <div>
          字符数: {markdown.length} | 单词数: {wordCount}
        </div>

        <div className="flex items-center gap-2">
          {selectedNodeId && (
            <span className="text-blue-500">已选中节点: {selectedNodeId}</span>
          )}

          {hoveredNodeId && hoveredNodeId !== selectedNodeId && (
            <span className="text-green-500">悬浮节点: {hoveredNodeId}</span>
          )}
        </div>
      </div>
    </div>
  );
};

export default MarkdownEditor;
