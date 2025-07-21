'use client';

import { useEffect, useRef } from 'react';
import {Image} from '@heroui/react';

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

function extractTweetId(html: string): string | null {
  // 从HTML中提取推文ID
  const match = html.match(/status\/(\d+)/);
  return match ? match[1] : null;
}

export function TwitterCard({ html, className = '' }: TwitterCardProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

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
        console.log(
          'Processing TwitterCard:',
          containerRef.current.innerHTML.substring(0, 100),
        );

        // 查找并处理blockquote
        const blockquote = containerRef.current.querySelector(
          'blockquote.twitter-tweet',
        );
        if (blockquote) {
          // 确保没有已处理标记
          blockquote.removeAttribute('data-twitter-extracted');

          // 直接对这个元素调用widgets.load
          window.twttr.widgets.load(containerRef.current);

          console.log('Widget load called for:', blockquote);
        }
      }
    }, 50); // 增加延迟时间
  }, [html]);

  // 初始渲染时返回空容器
  return (
    <div
      ref={containerRef}
      className={`tweet-embed-container relative ${className}`}
    >
      <Image src="/icons/check.svg" alt="Twitter Card" width={16} height={16} />
    </div>
  );
}
