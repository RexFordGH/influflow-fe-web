'use client';

import { ReactNode, useCallback, useState } from 'react';
import { cn } from '@heroui/react';
import EditorPro from '@/components/editorPro';
import { markdownStyles } from '../markdown/markdownStyles';

interface GroupSectionOfLongFormProps {
  group: {
    title: string;
    tweets: any[];
  };
  groupIndex: number;
  isHighlighted?: boolean;
  isLoading?: boolean;
  onSectionHover?: (sectionId: string | null) => void;
  onGroupTitleChange?: (groupId: string, newTitle: string) => void;
  editingNodeId?: string | null;
  setSectionRef?: (sectionId: string, element: HTMLDivElement | null) => void;
  children: ReactNode;
}

// 定义数字表情符号映射
const numberEmojis = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟'];

export function GroupSectionOfLongForm({
  group,
  groupIndex,
  isHighlighted = false,
  isLoading = false,
  onSectionHover,
  onGroupTitleChange,
  editingNodeId,
  setSectionRef,
  children,
}: GroupSectionOfLongFormProps) {
  const sectionId = `group-${groupIndex}`;
  const [currentEditorContent, setCurrentEditorContent] = useState(group.title);

  const handleMouseEnter = useCallback(() => {
    onSectionHover?.(sectionId);
  }, [onSectionHover, sectionId]);

  const handleMouseLeave = useCallback(() => {
    onSectionHover?.(null);
  }, [onSectionHover]);

  const handleEditorChange = useCallback(
    (newValue: string) => {
      try {
        const parsed = JSON.parse(newValue);
        let plainText = parsed.content
          .replace(/<br\s*\/?\s*>/g, '\n')
          .replace(/<[^>]+>/g, '')
          .replace(/&nbsp;/g, ' ')
          .trim();
        
        // 移除数字表情前缀
        plainText = plainText.replace(/^[0-9️⃣🔟]+\s*/, '');
        
        setCurrentEditorContent(plainText);
        onGroupTitleChange?.(groupIndex.toString(), plainText);
      } catch (e) {
        console.error('Failed to parse editor content:', e);
      }
    },
    [groupIndex, onGroupTitleChange],
  );

  const baseClasses = markdownStyles.sections.group.base;
  const highlightClasses = isHighlighted
    ? markdownStyles.sections.group.highlighted
    : '';
  const loadingClasses = isLoading ? markdownStyles.sections.group.loading : '';

  // 获取数字表情
  const numberEmoji = groupIndex < 10 ? numberEmojis[groupIndex] : `${groupIndex + 1}`;

  const editorValue = JSON.stringify({
    content: `<h3>${numberEmoji} ${group.title}</h3>`,
    type: 'doc',
    isEmpty: !group.title.trim(),
  });

  return (
    <>
      <div
        ref={(el) => setSectionRef?.(sectionId, el)}
        className={cn(baseClasses, highlightClasses, loadingClasses, 'group relative mb-6 !mt-[30px] !scale-100 border-none !py-[4px] px-[8px]')}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {isLoading && (
          <div className="absolute left-2 top-2">
            <div className="size-4 animate-spin rounded-full border-2 border-blue-500 border-t-transparent"></div>
          </div>
        )}
        
        <EditorPro
          value={editorValue}
          onChange={handleEditorChange}
          isEdit={true}
          hideMenuBar={true}
          debounceMs={1000}
          className={{
            base: 'border-none bg-transparent',
            editorWrapper: 'p-0',
            editor: 'prose max-w-none bg-transparent [&_.tiptap]:min-h-0 [&_.tiptap]:bg-transparent [&_.tiptap]:p-[1px] [&_.tiptap]:text-inherit [&_h3]:text-black [&_h3]:text-[16px] [&_h3]:font-[500]',
          }}
        />
      </div>
      
      {/* 渲染子组件（tweets） */}
      {children}
    </>
  );
}