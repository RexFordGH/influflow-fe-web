'use client';

import { PaperAirplaneIcon } from '@heroicons/react/24/solid';
import { cn } from '@heroui/react';
import { ChangeEvent, KeyboardEvent, useCallback, useState } from 'react';

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  disabled: boolean;
  maxLength?: number;
  placeholder?: string;
}

export const ChatInput: React.FC<ChatInputProps> = ({
  onSendMessage,
  disabled,
  maxLength = 1000,
  placeholder = '输入您的问题或编辑需求...',
}) => {
  const [message, setMessage] = useState('');
  const [characterCount, setCharacterCount] = useState(0);

  const handleSend = useCallback(() => {
    if (message.trim() && !disabled) {
      onSendMessage(message.trim());
      setMessage('');
      setCharacterCount(0);
    }
  }, [message, disabled, onSendMessage]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend],
  );

  const handleChange = useCallback(
    (e: ChangeEvent<HTMLTextAreaElement>) => {
      const value = e.target.value;
      if (value.length <= maxLength) {
        setMessage(value);
        setCharacterCount(value.length);
      }
    },
    [maxLength],
  );

  const inputClasses = {
    container: cn(
      'bg-white rounded-[20px]',
      'shadow-[0_0_12px_rgba(68,138,255,0.15)]',
      'p-3 flex flex-col gap-2.5',
    ),
    textareaWrapper: 'flex items-end gap-3',
    textarea: cn(
      'font-poppins text-sm font-normal',
      'border-none outline-none resize-none',
      'min-h-[21px] max-h-[80px]',
      'placeholder:text-gray-400',
      'flex-1',
      'overflow-y-auto',
      'bg-transparent',
    ),
    sendButton: cn(
      'w-10 h-10',
      'bg-blue-500 hover:bg-blue-600',
      'rounded-full',
      'flex items-center justify-center',
      'transition-colors duration-200',
      'disabled:opacity-50 disabled:cursor-not-allowed',
      'flex-shrink-0',
    ),
    characterCount: 'text-xs text-gray-500 text-right',
  };

  return (
    <div className={inputClasses.container} style={{
      height: '120px',
    }}>
      <div className={inputClasses.textareaWrapper}>
        <textarea
          value={message}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          className={inputClasses.textarea}
          rows={1}
          style={{
            minHeight: '40px',
            maxHeight: '120px',
          }}
        />
        <button
          onClick={handleSend}
          disabled={disabled || !message.trim()}
          className={inputClasses.sendButton}
          aria-label="发送消息"
          // 按钮基于父元素居中
          style={{
            position: 'absolute',
            bottom: '33px',
            right: '50px',
          }}
        >
          {/* <PaperAirplaneIcon className="size-5 text-white" /> */}
          <img
            src="/icons/send.svg"
            alt="发送"
            width={40}
            height={40}
            className="pointer-events-none"
          />
        </button>
      </div>
      {/* <div className={inputClasses.characterCount}>
        {characterCount} / {maxLength}
      </div> */}
    </div>
  );
};
