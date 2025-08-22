'use client';

import { useState, useEffect, useRef } from 'react';

interface StreamingTypewriterProps {
  streamingContent: string;
  isStreaming: boolean;
  onComplete?: () => void;
  typeSpeed?: number; // 可配置打字速度
  showCursor?: boolean; // 是否显示光标
}

export const StreamingTypewriter: React.FC<StreamingTypewriterProps> = ({
  streamingContent,
  isStreaming,
  onComplete,
  typeSpeed = 30, // 默认 30ms
  showCursor: shouldShowCursor = true, // 默认显示光标
}) => {
  const [displayedContent, setDisplayedContent] = useState('');
  const [cursorVisible, setCursorVisible] = useState(true);
  const contentRef = useRef(streamingContent);
  const indexRef = useRef(0);
  const prevContentRef = useRef(streamingContent);

  // 更新内容引用
  useEffect(() => {
    // 如果内容完全改变（不是追加），重置索引
    if (!streamingContent.startsWith(prevContentRef.current)) {
      indexRef.current = 0;
      setDisplayedContent('');
    }
    prevContentRef.current = streamingContent;
    contentRef.current = streamingContent;
  }, [streamingContent]);

  // 打字机效果
  useEffect(() => {
    if (!isStreaming) {
      setDisplayedContent(streamingContent);
      setCursorVisible(false);
      onComplete?.();
      return;
    }

    let timeoutId: NodeJS.Timeout;

    const typeNextChar = () => {
      if (indexRef.current < contentRef.current.length) {
        setDisplayedContent(contentRef.current.slice(0, indexRef.current + 1));
        indexRef.current++;
        timeoutId = setTimeout(typeNextChar, typeSpeed);
      } else if (contentRef.current.length > 0) {
        // 内容更新，继续打字
        if (indexRef.current < contentRef.current.length) {
          timeoutId = setTimeout(typeNextChar, typeSpeed);
        }
      }
    };

    typeNextChar();

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [isStreaming, streamingContent, onComplete, typeSpeed]);

  // 光标闪烁效果
  useEffect(() => {
    if (!isStreaming || !shouldShowCursor) {
      setCursorVisible(false);
      return;
    }

    const intervalId = setInterval(() => {
      setCursorVisible((prev) => !prev);
    }, 500);

    return () => clearInterval(intervalId);
  }, [isStreaming, shouldShowCursor]);

  return (
    <span className="whitespace-pre-wrap break-words">
      {displayedContent}
      {isStreaming && shouldShowCursor && (
        <span
          className="ml-0.5 inline-block h-4 w-0.5 bg-gray-800"
          style={{
            opacity: cursorVisible ? 1 : 0,
            transition: 'opacity 0.1s',
          }}
        />
      )}
    </span>
  );
};