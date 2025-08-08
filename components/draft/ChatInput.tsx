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
      <div className="relative mx-auto min-h-[120px] w-[600px] rounded-[20px] bg-white pb-3 pl-6 pr-3 pt-6 shadow-[0_0_12px_rgba(0,0,0,0.25)]">
        <textarea
          ref={textareaRef}
          value={message}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          className={`font-poppins h-auto max-h-[200px] min-h-[24px] w-full resize-none overflow-auto border-none bg-transparent pr-[60px] text-base font-normal leading-6 outline-none placeholder:text-[#8C8C8C] ${
            message ? 'text-black' : 'text-[#8C8C8C]'
          }`}
        />

        {/* 发送按钮 - 绝对定位 */}
        <div className="absolute bottom-3 right-3">
          <Button
            isIconOnly
            disabled={disabled || !message.trim()}
            onPress={handleSend}
            className="size-10 min-w-[40px] rounded-full bg-[#448AFF] p-[6px_12px]"
            aria-label="Send message"
          >
            <PaperAirplaneIcon className="size-5 -rotate-45 text-white" />
          </Button>
        </div>
      </div>
    </div>
  );
};
