'use client';

import { useCallback, useEffect, useState } from 'react';

import EditorPro from '../../editorPro/index';

import { LocalImageUploader } from './LocalImageUploader';
import {
  getBaseClasses,
  getHighlightClasses,
  markdownStyles,
  shouldEnableInteraction,
} from './markdownStyles';
import {
  EditWithAIButton,
  SectionRendererProps,
  TweetImageButton,
} from './SectionRenderer';

export function SectionRendererOfLongForm({
  section,
  isHighlighted = false,
  isLoading = false,
  onSectionHover,
  onTweetImageEdit,
  onTweetContentChange,
  onGroupTitleChange,
  onLocalImageUploadSuccess,
  onImageSelect,
  onDirectGenerate,
  onEditWithAI,
  editingNodeId,
  generatingImageTweetIds,
  tweetData,
  setSectionRef,
}: SectionRendererProps) {
  const [currentEditorContent, setCurrentEditorContent] = useState('');

  const handleEditorChange = useCallback(
    (newValue: string) => {
      try {
        const parsed = JSON.parse(newValue);
        let plainText = parsed.content
          .replace(/<br\s*\/?\s*>/g, '\n')
          .replace(/<[^>]+>/g, '')
          .replace(/&nbsp;/g, ' ')
          .trim();

        // For group sections, remove emoji number prefix before saving
        if (section.type === 'group') {
          plainText = plainText.replace(/^[0-9️⃣🔟]+\s*/, '');
        }

        setCurrentEditorContent(plainText);

        if (section.type === 'tweet' && section.tweetId) {
          onTweetContentChange?.(section.tweetId!, plainText);
        } else if (section.type === 'group' && section.groupId) {
          onGroupTitleChange?.(section.groupId, plainText);
        }
      } catch (e) {
        console.error('Failed to parse editor content:', e);
      }
    },
    [section, onTweetContentChange, onGroupTitleChange],
  );

  useEffect(() => {
    if (section.type === 'tweet') {
      // 直接使用 section.content，不再需要解析
      setCurrentEditorContent(section.content);
    }
  }, [section]);

  const createMouseHandlers = useCallback(() => {
    const shouldInteract = shouldEnableInteraction(section);

    const handleEnter = () => {
      if (!shouldInteract) return;

      if (section.type === 'tweet' && section.tweetId) {
        onSectionHover?.(section.tweetId);
      } else if (section.type === 'group' && section.groupId) {
        onSectionHover?.(`group-${section.groupId}`);
      } else {
        const targetId = section.mappingId || section.id;
        onSectionHover?.(targetId);
      }
    };

    const handleLeave = () => {
      if (!shouldInteract) return;
      onSectionHover?.(null);
    };

    return { handleEnter, handleLeave };
  }, [section, onSectionHover]);

  const renderEmoji = useCallback((text: string) => {
    return text.replace(/[🧵📊💡🔧🚀✨]/gu, (match) =>
      markdownStyles.formatting.emoji.replace('$1', match),
    );
  }, []);

  const getEmojiNumber = useCallback((index: number) => {
    const emojiNumbers = [
      '1️⃣',
      '2️⃣',
      '3️⃣',
      '4️⃣',
      '5️⃣',
      '6️⃣',
      '7️⃣',
      '8️⃣',
      '9️⃣',
      '🔟',
      '1️⃣1️⃣',
      '1️⃣2️⃣',
      '1️⃣3️⃣',
      '1️⃣4️⃣',
      '1️⃣5️⃣',
      '1️⃣6️⃣',
      '1️⃣7️⃣',
      '1️⃣8️⃣',
      '1️⃣9️⃣',
      '2️⃣0️⃣',
    ];
    return emojiNumbers[index] || `${index + 1}️⃣`;
  }, []);

  const shouldInteract = shouldEnableInteraction(section);
  const baseClasses = getBaseClasses(shouldInteract);
  const highlightClasses = getHighlightClasses(isHighlighted, shouldInteract);
  const loadingClasses = isLoading ? markdownStyles.states.loading : '';
  const { handleEnter, handleLeave } = createMouseHandlers();

  switch (section.type) {
    case 'list':
      const listItems = section.content
        .split('\n')
        .filter((item) => item.trim());
      const isNumberedList = /^\d+/.test(listItems[0] || '');

      return (
        <div
          key={section.id}
          ref={(el) => setSectionRef?.(section.id, el)}
          className={`${baseClasses} ${highlightClasses} ${loadingClasses}`}
          onMouseEnter={handleEnter}
          onMouseLeave={handleLeave}
        >
          {isLoading && (
            <div className={markdownStyles.loading.indicator}>
              <div className={markdownStyles.loading.spinner}></div>
            </div>
          )}
          {isNumberedList ? (
            <ol className={markdownStyles.lists.orderedContainer}>
              {listItems.map((item, idx) => (
                <li key={idx} className={markdownStyles.lists.orderedItem}>
                  <span className={markdownStyles.lists.itemContent}>
                    {item
                      .replace(/^\d+\.\s*/, '')
                      .replace(
                        /^\*\*(.*?)\*\*/,
                        '<strong class="font-semibold">$1</strong>',
                      )}
                  </span>
                </li>
              ))}
            </ol>
          ) : (
            <ul className={markdownStyles.lists.container}>
              {listItems.map((item, idx) => (
                <li key={idx} className={markdownStyles.lists.item}>
                  <span className={markdownStyles.lists.bullet} />
                  <span
                    dangerouslySetInnerHTML={{
                      __html: item
                        .replace(/^[\-*]\s*/, '')
                        .replace(
                          /\*\*(.*?)\*\*/g,
                          '<strong class="font-semibold text-gray-900">$1</strong>',
                        ),
                    }}
                  />
                </li>
              ))}
            </ul>
          )}
        </div>
      );

    case 'tweet':
      // 直接使用 section 中的数据，不再解析
      const textContent = section.content;

      const currentTweetData = tweetData?.nodes
        ?.flatMap((group: any) => group.tweets)
        ?.find(
          (tweet: any) => tweet.tweet_number.toString() === section.tweetId,
        );

      const editorValue = JSON.stringify({
        content: textContent,
        type: 'doc',
        isEmpty: !textContent.trim(),
      });

      const isGeneratingImage =
        generatingImageTweetIds?.includes(section.tweetId || '') || false;

      return (
        <div
          key={section.id}
          ref={(el) => setSectionRef?.(section.id, el)}
          className={`${baseClasses} ${highlightClasses} ${loadingClasses} group relative !mt-[16px] !scale-100 border-none !py-[4px] px-[8px] pb-0`}
          onMouseEnter={handleEnter}
          onMouseLeave={handleLeave}
        >
          {isLoading && (
            <div className="absolute left-2 top-2">
              <div className="size-4 animate-spin rounded-full border-2 border-blue-500 border-t-transparent"></div>
            </div>
          )}

          {textContent && textContent.trim() && (
            <div className="font-inter text-[15px] font-[400] leading-[1.35] tracking-tight text-black">
              <EditorPro
                value={editorValue}
                onChange={handleEditorChange}
                isEdit={true}
                hideMenuBar={true}
                debounceMs={1000}
                className={{
                  base: 'border-none bg-transparent',
                  editorWrapper: 'p-0',
                  editor:
                    'prose prose-sm [&_.tiptap]:leading-inherit max-w-none bg-transparent text-black [&_.tiptap]:min-h-0 [&_.tiptap]:bg-transparent [&_.tiptap]:p-[6px] [&_.tiptap]:text-inherit',
                }}
              />
            </div>
          )}

          {/* {isGeneratingImage && (
            <div className="my-4 flex flex-col items-center justify-center gap-[5px]">
              <ImageLoadingAnimation size={160} />
              <span className="text-sm text-gray-500">Generating image...</span>
            </div>
          )} */}

          {/* Image rendering is removed from here */}

          <div
            className={`absolute right-[4px] top-[-28px] flex items-center justify-end gap-1 transition-opacity ${
              // 如果当前section正在被编辑，始终显示按钮，否则hover时显示
              editingNodeId &&
              ((section.tweetId &&
                (section.tweetId === editingNodeId ||
                  section.tweetId.toString() === editingNodeId.toString())) ||
                editingNodeId === section.id)
                ? 'opacity-100'
                : 'opacity-0 group-hover:opacity-100'
            }`}
          >
            <EditWithAIButton
              nodeId={section.tweetId || section.id}
              onEditWithAI={onEditWithAI}
            />
            <LocalImageUploader
              tweetData={currentTweetData}
              onUploadSuccess={onLocalImageUploadSuccess}
              onImageSelect={onImageSelect}
            />
            <TweetImageButton
              currentTweetData={currentTweetData}
              onTweetImageEdit={onTweetImageEdit}
              isGeneratingImage={isGeneratingImage}
              onDirectGenerate={onDirectGenerate}
            />
          </div>
        </div>
      );

    case 'group':
      const groupLines = section.content.split('\n');
      let groupTitle = '';
      let groupContent = '';
      const groupTitleLine = groupLines.find((line) => line.startsWith('#'));
      if (groupTitleLine) {
        groupTitle = groupTitleLine.replace(/^#+\s*/, '').trim();
        const groupContentLines = groupLines.filter(
          (line) => !line.startsWith('#') && line.trim() !== '',
        );
        groupContent = groupContentLines.join('\n\n');
      } else {
        groupTitle = section.content;
      }

      // Add emoji number prefix to the title
      const emojiNumber = getEmojiNumber(section.groupIndex || 0);
      const titleWithEmoji = `${emojiNumber} ${groupTitle}`;

      const groupTitleEditorValue = JSON.stringify({
        content: titleWithEmoji,
        type: 'doc',
        isEmpty: !groupTitle.trim(),
      });
      return (
        <div
          key={section.id}
          ref={(el) => setSectionRef?.(section.id, el)}
          className={`${baseClasses} ${highlightClasses} ${loadingClasses} group relative !mt-[16px] py-0`}
          onMouseEnter={handleEnter}
          onMouseLeave={handleLeave}
        >
          {isLoading && (
            <div className="absolute left-2 top-2">
              <div className="size-4 animate-spin rounded-full border-2 border-blue-500 border-t-transparent"></div>
            </div>
          )}

          <div className="text-[15px] font-[600] leading-[1.35] tracking-tight text-black">
            <EditorPro
              value={groupTitleEditorValue}
              onChange={handleEditorChange}
              isEdit={true}
              hideMenuBar={true}
              debounceMs={1000}
              className={{
                base: 'border-none bg-transparent',
                editorWrapper: 'p-0',
                editor:
                  'prose prose-sm [&_.tiptap]:leading-inherit max-w-none bg-transparent text-black [&_.tiptap]:min-h-0 [&_.tiptap]:bg-transparent [&_.tiptap]:p-[6px] [&_.tiptap]:text-inherit',
              }}
            />
          </div>
          {groupContent && (
            <div className="mt-2 text-sm leading-relaxed text-gray-700">
              {groupContent}
            </div>
          )}
        </div>
      );

    default:
      return null;
  }
}
