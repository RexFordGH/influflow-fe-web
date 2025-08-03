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
  placeholder = 'Tell me more about the details,',
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
    if (e.key === 'Enter' && !e.shiftKey) {
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
    <div className={`mx-auto w-full max-w-xl ${className}`}>
      <div className="rounded-[20px] bg-white p-3 pl-6 shadow-[0_0_12px_rgba(0,0,0,0.25)]">
        <div className="flex items-end gap-2.5">
          <textarea
            ref={textareaRef}
            value={message}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled}
            className="min-h-[60px] flex-1 resize-none border-none bg-transparent pt-4 text-base leading-6 outline-none"
            style={{
              fontFamily: 'Poppins',
              height: 'auto',
              maxHeight: '200px',
              overflow: 'auto',
            }}
          />

          <div className="flex items-center gap-2.5 pb-3">
            {/* Content Format Dropdown */}
            {/* <Dropdown>
              <DropdownTrigger>
                <Button
                  size="sm"
                  variant="light"
                  className="h-7 min-w-[79px] px-3 text-sm font-normal"
                  endContent={<ChevronDownIcon className="ml-1 size-3" />}
                  style={{ fontFamily: 'Poppins' }}
                >
                  {contentFormat}
                </Button>
              </DropdownTrigger>
              <DropdownMenu
                aria-label="Content format"
                selectedKeys={[contentFormat]}
                onSelectionChange={(keys) => {
                  const selected = Array.from(keys)[0] as string;
                  setContentFormat(selected);
                }}
              >
                <DropdownItem key="Threads">Threads</DropdownItem>
                <DropdownItem key="Article">Article</DropdownItem>
              </DropdownMenu>
            </Dropdown> */}

            {/* 发送按钮 */}
            <Button
              isIconOnly
              size="sm"
              disabled={disabled || !message.trim()}
              onClick={handleSend}
              className="size-10 min-w-10 rounded-full bg-[#448AFF]"
              aria-label="Send message"
            >
              <PaperAirplaneIcon className="size-5 -rotate-45 text-white" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
