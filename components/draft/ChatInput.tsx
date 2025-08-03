'use client';

import { PaperAirplaneIcon } from '@heroicons/react/24/solid';
import { Button } from '@heroui/react';
import React, {
  ChangeEvent,
  KeyboardEvent,
  useEffect,
  useRef,
  useState,
} from 'react';

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
  placeholder?: string;
  maxLength?: number;
  className?: string;
}

export const ChatInput: React.FC<ChatInputProps> = ({
  onSend,
  disabled = false,
  placeholder = 'Tell me more about the details',
  maxLength = 1000,
  className = '',
}) => {
  const [message, setMessage] = useState('');
  const [contentFormat, setContentFormat] = useState('Threads');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // 自动调整高度
  useEffect(() => {
    if (textareaRef.current) {
      const textarea = textareaRef.current;
      textarea.style.height = 'auto';
      textarea.style.height = `${textarea.scrollHeight}px`;
    }
  }, [message]);

  // 处理发送
  const handleSend = () => {
    const trimmedMessage = message.trim();
    if (trimmedMessage && !disabled) {
      onSend(trimmedMessage);
      setMessage('');

      // 重置 textarea 高度
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  };

  // 处理键盘事件
  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      handleSend();
    }
  };

  // 处理输入变化
  const handleChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    if (value.length <= maxLength) {
      setMessage(value);
    }
  };

  return (
    <div className={`mx-auto w-full ${className}`}>
      <div
        className="relative bg-white mx-auto"
        style={{
          width: '600px',
          minHeight: '120px',
          borderRadius: '20px',
          boxShadow: '0 0 12px rgba(0, 0, 0, 0.25)',
          padding: '24px 12px 12px 24px',
        }}
      >
        <textarea
          ref={textareaRef}
          value={message}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          className="w-full resize-none border-none bg-transparent outline-none placeholder:text-[#8C8C8C]"
          style={{
            fontFamily: 'Poppins',
            fontSize: '16px',
            fontWeight: '400',
            lineHeight: '24px',
            color: message ? '#000000' : '#8C8C8C',
            minHeight: '24px',
            height: 'auto',
            maxHeight: '200px',
            overflow: 'auto',
            paddingRight: '60px',
          }}
        />

        {/* 发送按钮 - 绝对定位 */}
        <div
          className="absolute"
          style={{
            right: '12px',
            bottom: '12px',
          }}
        >
          <Button
            isIconOnly
            disabled={disabled || !message.trim()}
            onClick={handleSend}
            className="rounded-full"
            style={{
              width: '40px',
              height: '40px',
              minWidth: '40px',
              backgroundColor: '#448AFF',
              padding: '6px 12px',
            }}
            aria-label="Send message"
          >
            <PaperAirplaneIcon className="size-5 -rotate-45 text-white" />
          </Button>
        </div>
      </div>
    </div>
  );
};
