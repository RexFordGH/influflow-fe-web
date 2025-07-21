'use client';

import { useEffect } from 'react';
import MOCK_TWEETS from './mock';
import { TwitterCard } from './TwitterCard';

interface TrendingTopicTweetsProps {
  isVisible: boolean;
}

// 声明全局的 twttr 对象
declare global {
  interface Window {
    twttr: {
      widgets: {
        load: (element?: HTMLElement) => void;
      };
    };
  }
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
    <div className="w-full bg-gray-50 p-4 rounded-lg shadow-sm border border-gray-200">
      {/* 标题部分 */}
      <div className="mb-4">
        <h3 className="text-sm font-medium text-black mb-1">Viral Tweets</h3>
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
          {/* <blockquote class="twitter-tweet">
            <p lang="en" dir="ltr">
              At dawn from the gateway to Mars, the launch of Starship's second
              flight test
              <a href="https://t.co/ffKnsVKwG4">pic.twitter.com/ffKnsVKwG4</a>
            </p>
            &mdash; SpaceX (@SpaceX)
            <a href="https://twitter.com/SpaceX/status/1732824684683784516?ref_src=twsrc%5Etfw">
              December 7, 2023
            </a>
          </blockquote> */}

          {/* <blockquote class="twitter-tweet">
            <p lang="en" dir="ltr">
              ‼️TETHER FIRED THEIR AUDITOR TO AVOID RESERVE TRANSPARENCY‼️
              <br />
              Under the proposed GENIUS Act, stablecoin issuers would be
              required to back 100% of their tokens with cash, U.S. Treasuries,
              and other low-risk cash equivalents.
              <br />
              Tether, on the other hand, openly holds:
              <br />• 5% in…
              <a href="https://t.co/LAChBvIUyB">pic.twitter.com/LAChBvIUyB</a>
            </p>
            &mdash; SMQKE (@SMQKEDQG)
            <a href="https://twitter.com/SMQKEDQG/status/1934666056838078555?ref_src=twsrc%5Etfw">
              June 16, 2025
            </a>
          </blockquote> */}
          {/* <TwitterCard
            html={`<blockquote class="twitter-tweet">
              <p lang="en" dir="ltr">
                At dawn from the gateway to Mars, the launch of Starship's
                second flight test 
                <a href="https://t.co/ffKnsVKwG4">pic.twitter.com/ffKnsVKwG4</a>
              </p>
              &mdash; SpaceX (@SpaceX) 
              <a href="https://twitter.com/SpaceX/status/1732824684683784516?ref_src=twsrc%5Etfw">
                December 7, 2023
              </a>
            </blockquote>`}
            className="flex-1"
          /> */}
          {MOCK_TWEETS.map((tweet, index) => (
            <TwitterCard key={index} html={tweet.html} className="flex-1" />
          ))}
        </div>
      </div>
    </div>
  );
}
