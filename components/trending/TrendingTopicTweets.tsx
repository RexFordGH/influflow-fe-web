'use client';

import { useEffect } from 'react';

import MOCK_TWEETS from './mock';
import { TwitterCard } from './TwitterCard';

interface TrendingTopicTweetsProps {
  isVisible: boolean;
}

export function TrendingTopicTweets({ isVisible }: TrendingTopicTweetsProps) {
  // 当组件变为可见时，手动触发Twitter widgets加载
  useEffect(() => {
    if (isVisible) {
      console.log('Checking Twitter widgets availability...');
      console.log('window.twttr:', window.twttr);
      console.log('window.twttr?.widgets:', window.twttr?.widgets);

      if (window.twttr?.widgets) {
        // 延迟一点确保DOM渲染完成
        const timer = setTimeout(() => {
          console.log('Manually loading Twitter widgets...');
          const blockquotes = document.querySelectorAll(
            'blockquote.twitter-tweet',
          );
          console.log('Found blockquotes:', blockquotes.length);

          // 清除所有已处理的标记，让Twitter重新处理
          blockquotes.forEach((bq, index) => {
            console.log(`Blockquote ${index}:`, bq.outerHTML.substring(0, 200));

            // 移除Twitter已处理的标记
            bq.removeAttribute('data-twitter-extracted');

            // 移除可能存在的处理后的iframe
            const nextSibling = bq.nextElementSibling;
            if (
              nextSibling &&
              nextSibling.tagName === 'IFRAME' &&
              nextSibling.id.includes('twitter-widget')
            ) {
              nextSibling.remove();
            }
          });

          console.log('Cleared Twitter processed attributes, reloading...');
          window.twttr.widgets.load();
        }, 200);

        return () => clearTimeout(timer);
      } else {
        console.error(
          'Twitter widgets not available! Checking script loading...',
        );
        // 检查Twitter脚本是否存在
        const twitterScript = document.querySelector(
          'script[src*="platform.twitter.com"]',
        );
        console.log('Twitter script element:', twitterScript);

        if (!twitterScript) {
          console.error('Twitter script not found in DOM!');
        }
      }
    }
  }, [isVisible]);

  if (!isVisible) {
    return null;
  }

  return (
    <div className="w-full rounded-lg border border-gray-200 bg-gray-50 p-4 shadow-sm">
      {/* 标题部分 */}
      <div className="mb-4">
        <h3 className="mb-1 text-sm font-medium text-black">Viral Tweets</h3>
        <p className="text-xs text-gray-600">
          Reference these popular posts to boost views and maximize engagement.
        </p>
      </div>

      {/* Tweets 网格 */}
      <div
        className="max-h-[400px] overflow-y-auto"
        onWheel={(e) => {
          e.stopPropagation();
        }}
      >
        <div className="grid grid-cols-3 gap-3">
          {MOCK_TWEETS.map((tweet, index) => (
            <TwitterCard key={index} html={tweet.html} className="flex-1" />
          ))}
        </div>
      </div>
    </div>
  );
}
