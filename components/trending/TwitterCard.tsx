'use client';

import { useEffect, useRef, useState } from 'react';

import { Skeleton } from '@heroui/react';

interface TwitterCardProps {
  html: string;
  className?: string;
}

// 声明全局的 twttr 对象
declare global {
  interface Window {
    twttr: {
      widgets: {
        createTweet: (
          id: string,
          element: HTMLElement,
          options?: any,
        ) => Promise<HTMLElement>;
        load: (element?: HTMLElement) => void;
      };
    };
  }
}

function transformTweetHtml(html: string): string {
  // 解码HTML实体
  const decodedHtml = html
    .replace(/\\u003C/g, '<')
    .replace(/\\u003E/g, '>')
    .replace(/&mdash;/g, '—')
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&');

  return decodedHtml.trim();
}


export function TwitterCard({ html, className = '' }: TwitterCardProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!containerRef.current) return;

    setIsLoading(true);

    // 使用硬编码方式替换innerHTML
    const transformedHtml = transformTweetHtml(html);

    // 清空容器并重新插入HTML
    containerRef.current.innerHTML = '';

    // 创建一个临时div来解析HTML
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = transformedHtml;

    // 将解析后的元素添加到容器中
    while (tempDiv.firstChild) {
      containerRef.current.appendChild(tempDiv.firstChild);
    }

    // 延迟触发Twitter widgets处理
    setTimeout(() => {
      if (containerRef.current && window.twttr?.widgets) {
        window.twttr.widgets.load(containerRef.current);
        
        // 等待Twitter widgets处理完成，1.5秒后显示内容
        setTimeout(() => {
          setIsLoading(false);
        }, 1500);
      } else {
        // 如果没有Twitter widgets，直接显示
        setTimeout(() => {
          setIsLoading(false);
        }, 500);
      }
    }, 50);
  }, [html]);

  return (
    <div className={`relative h-[520px] overflow-hidden ${className}`}>
      {/* 骨架屏 */}
      {isLoading && (
        <div className="absolute inset-0 z-10 rounded-2xl border border-gray-200 bg-white p-4">
          {/* 头部信息 */}
          <div className="mb-3 flex items-center gap-3">
            <Skeleton className="h-12 w-12 rounded-full" />
            <div className="flex-1">
              <Skeleton className="mb-1 h-4 w-24 rounded" />
              <Skeleton className="h-3 w-16 rounded" />
            </div>
          </div>
          
          {/* 内容 */}
          <div className="space-y-2">
            <Skeleton className="h-4 w-full rounded" />
            <Skeleton className="h-4 w-4/5 rounded" />
            <Skeleton className="h-4 w-3/5 rounded" />
          </div>
          
          {/* 底部交互 */}
          <div className="mt-4 flex items-center gap-6">
            <Skeleton className="h-4 w-12 rounded" />
            <Skeleton className="h-4 w-12 rounded" />
            <Skeleton className="h-4 w-12 rounded" />
          </div>
        </div>
      )}
      
      {/* 实际的Twitter内容 */}
      <div
        ref={containerRef}
        className={`tweet-embed-container ${isLoading ? 'opacity-0' : 'opacity-100'} transition-opacity duration-500`}
        style={{
          maxHeight: '520px',
          overflowY: 'scroll',
        }}
      />
    </div>
  );
}
