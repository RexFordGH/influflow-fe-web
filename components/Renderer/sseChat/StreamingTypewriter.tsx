'use client';

import { useState, useEffect, useRef } from 'react';

interface StreamingTypewriterProps {
  streamingContent: string;
  isStreaming: boolean;
  onComplete?: () => void;
}

export const StreamingTypewriter: React.FC<StreamingTypewriterProps> = ({
  streamingContent,
  isStreaming,
  onComplete,
}) => {
  const [displayedContent, setDisplayedContent] = useState('');
  const [showCursor, setShowCursor] = useState(true);
  const contentRef = useRef(streamingContent);
  const indexRef = useRef(0);

  // 更新内容引用
  useEffect(() => {
    contentRef.current = streamingContent;
  }, [streamingContent]);

  // 打字机效果
  useEffect(() => {
    if (!isStreaming) {
      setDisplayedContent(streamingContent);
      setShowCursor(false);
      onComplete?.();
      return;
    }

    const typeSpeed = 30; // 每个字符 30ms
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
  }, [isStreaming, streamingContent, onComplete]);

  // 光标闪烁效果
  useEffect(() => {
    if (!isStreaming) {
      setShowCursor(false);
      return;
    }

    const intervalId = setInterval(() => {
      setShowCursor((prev) => !prev);
    }, 500);

    return () => clearInterval(intervalId);
  }, [isStreaming]);

  return (
    <span className="whitespace-pre-wrap break-words">
      {displayedContent}
      {isStreaming && (
        <span
          className="ml-0.5 inline-block h-4 w-0.5 bg-gray-800"
          style={{
            opacity: showCursor ? 1 : 0,
            transition: 'opacity 0.1s',
          }}
        />
      )}
    </span>
  );
};