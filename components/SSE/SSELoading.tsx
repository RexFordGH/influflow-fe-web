'use client';

import { STAGES_INITIAL, StageInfo, StageKey, StreamItem } from '@/types/sse';
import {
  ContentFormat,
  ProgressEventPayload,
  Subscription,
  SuccessEventPayload,
  subscribe,
} from '@/utils/sseClient';
import { useEffect, useMemo, useRef, useState } from 'react';
import { ReactTyped } from 'react-typed';

export interface SSELoadingProps {
  topic?: string;
  userInput: string;
  contentFormat: ContentFormat; // map to backend expected
  onComplete: (data: any) => void;
  onError?: (error: Error | unknown) => void;
  onBack?: () => void;
}

interface QueueItem {
  id: number;
  text: string;
  title?: string;
}

export default function SSELoading({
  userInput,
  contentFormat,
  onComplete,
  onError,
  onBack,
  topic,
}: SSELoadingProps) {
  const [stages, setStages] = useState<Record<StageKey, StageInfo>>({
    ...STAGES_INITIAL,
  });
  const [items, setItems] = useState<StreamItem[]>(
    topic ? [{ type: 'topic', topic }] : [],
  );

  // 方案B：集中打字器状态
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [current, setCurrent] = useState<QueueItem | null>(null);
  const [completedTexts, setCompletedTexts] = useState<Record<number, string>>(
    {},
  );

  const containerRef = useRef<HTMLDivElement | null>(null);

  // guard against duplicate subscriptions (React StrictMode mount/unmount)
  const startedRef = useRef(false);
  const completedRef = useRef(false);
  const subRef = useRef<Subscription | null>(null);
  const mountedRef = useRef(true);

  // 记录已经加入队列的推文，避免重复添加
  const queuedTweetsRef = useRef<Set<number>>(new Set());

  // 存储SSE成功的数据，等待所有打字完成后再调用
  const successDataRef = useRef<any>(null);
  const sseFinishedRef = useRef(false);

  // 当有新推文时，加入队列
  useEffect(() => {
    const newTweets = items.filter((item) => {
      if (item.type !== 'tweet') return false;
      const tweetItem = item as Extract<StreamItem, { type: 'tweet' }>;
      return !queuedTweetsRef.current.has(tweetItem.tweet_number);
    });

    if (newTweets.length > 0) {
      const newQueueItems = newTweets.map((tweet) => {
        const tweetItem = tweet as Extract<StreamItem, { type: 'tweet' }>;
        queuedTweetsRef.current.add(tweetItem.tweet_number);
        return {
          id: tweetItem.tweet_number,
          text: tweetItem.tweet_content || '',
          title: tweetItem.tweet_title,
        };
      });

      setQueue((prev) =>
        [...prev, ...newQueueItems].sort((a, b) => a.id - b.id),
      );
    }
  }, [items]);

  // 队列处理：当current为空且队列非空时，取出下一个
  useEffect(() => {
    if (current || queue.length === 0) return;

    const [next, ...rest] = queue;
    setCurrent(next);
    setQueue(rest);
  }, [current, queue]);

  // 检查是否所有打字都完成
  useEffect(() => {
    if (!sseFinishedRef.current) return;

    // 检查是否所有推文都已完成打字
    const allTweetIds = Array.from(queuedTweetsRef.current);
    const allCompleted =
      allTweetIds.length > 0 && allTweetIds.every((id) => completedTexts[id]);

    // 如果SSE已结束、所有打字都完成、且没有正在处理的项
    if (allCompleted && current === null && queue.length === 0) {
      console.log(
        'All typing completed, calling onComplete with data:',
        successDataRef.current,
      );
      // onComplete?.(successDataRef.current);
    }
  }, [completedTexts, current, queue, onComplete]);

  // auto-scroll to bottom when new content
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const nearBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 50;
    if (nearBottom) {
      el.scrollTop = el.scrollHeight;
    }
  }, [items]);

  useEffect(() => {
    // 防止重复订阅
    if (startedRef.current) {
      console.log('SSE subscription already started, skipping...');
      return;
    }

    startedRef.current = true;
    completedRef.current = false;

    console.log('Starting SSE subscription with:', {
      userInput,
      contentFormat,
    });

    const sub = subscribe({
      user_input: userInput,
      content_format: contentFormat,
      onOpen: () => {
        console.log('SSE connection opened');
      },
      onProgress: (evt: ProgressEventPayload) => {
        console.log('SSE progress event:', evt);
        const { event_type, stage, data } = evt.data || {};
        setStages((prev) => {
          const next = { ...prev };
          if (stage && stage in next) {
            if (event_type === 'stage_start')
              next[stage as StageKey].status = 'in_progress';
            if (event_type === 'stage_end')
              next[stage as StageKey].status = 'completed';
          }
          return next;
        });

        if (
          stage === 'generate_tweet' &&
          event_type === 'stage_progress' &&
          data
        ) {
          console.log('SSE generate_tweet stage_progress data:', data);

          if (data.type === 'topic' && data.topic) {
            setItems((prev) =>
              prev.some((i) => i.type === 'topic')
                ? prev
                : [...prev, { type: 'topic', topic: data.topic }],
            );
          } else if (data.type === 'section' && data.section_title) {
            setItems((prev) => [
              ...prev,
              {
                type: 'section',
                section_title: data.section_title,
                content: data.content,
              },
            ]);
          } else if (
            data.type === 'tweet' &&
            typeof data.tweet_number === 'number' &&
            data.tweet_content
          ) {
            console.log('Adding tweet:', {
              tweet_number: data.tweet_number,
              tweet_content: data.tweet_content,
              tweet_title: data.tweet_title,
            });

            setItems((prev) => {
              // avoid duplicate tweet_number
              const exists = prev.some(
                (i) =>
                  i.type === 'tweet' && i.tweet_number === data.tweet_number,
              );
              const next = exists
                ? prev
                : [
                    ...prev,
                    {
                      type: 'tweet',
                      tweet_number: data.tweet_number,
                      tweet_title: data.tweet_title,
                      section_title: data.section_title,
                      tweet_content: data.tweet_content,
                    } as StreamItem,
                  ];
              console.log('Items after update:', next);
              return next;
            });
          }
        }
      },
      onSuccess: (evt: SuccessEventPayload) => {
        console.log('SSE success event:', evt);
        if (completedRef.current) {
          console.log('Already completed, ignoring duplicate success event');
          return;
        }
        completedRef.current = true;

        // 存储成功数据，但不立即调用onComplete
        successDataRef.current = evt.data;
        sseFinishedRef.current = true;
        console.log('SSE finished, waiting for all typing to complete...');

        // close after success to avoid late 'error' firing from EventSource on server close
        subRef.current?.close();
      },
      onError: (e: any) => {
        console.error('SSE error:', e);
        if (completedRef.current) {
          console.log('Already completed, ignoring error after success');
          return; // ignore late errors after success
        }
        if (!mountedRef.current) {
          console.log('Component unmounted, ignoring error');
          return;
        }
        onError?.(e instanceof Error ? e : new Error('SSE error'));
      },
    });

    subRef.current = sub;

    return () => {
      console.log('Cleaning up SSE subscription');
      subRef.current?.close();
      subRef.current = null;
      // 不要重置 startedRef，防止重复订阅
      // startedRef.current = false;
    };
  }, []); // 只在组件挂载时执行一次

  // 组件卸载时清理
  useEffect(() => {
    return () => {
      console.log('SSELoading component unmounting');
      mountedRef.current = false;
      // 只在组件真正卸载时重置 startedRef
      startedRef.current = false;
    };
  }, []);

  const stageOrder: StageKey[] = useMemo(
    () => [
      'extract_url',
      'analysis_user_input',
      'web_search',
      'generate_tweet',
    ],
    [],
  );

  return (
    <div className="flex w-full h-full">
      <aside className="flex-1 h-full flex flex-col justify-center items-center shrink-0 border-r  p-4 bg-white/50">
        <ul className="space-y-2">
          {stageOrder.map((key) => {
            const s = stages[key];
            return (
              <li key={key} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span
                    className={
                      s.status === 'completed'
                        ? 'text-green-600'
                        : s.status === 'in_progress'
                          ? 'text-blue-600 animate-pulse'
                          : 'text-gray-400'
                    }
                  >
                    {s.status === 'completed'
                      ? '✔'
                      : s.status === 'in_progress'
                        ? '●'
                        : '○'}
                  </span>
                  <span className="text-sm">{s.displayName}</span>
                </div>
                <span className="text-xs text-gray-400">{s.status}</span>
              </li>
            );
          })}
        </ul>
        <div className="mt-4 flex gap-2">
          {onBack && (
            <button
              className="px-3 py-1 text-sm border rounded"
              onClick={onBack}
            >
              返回
            </button>
          )}
        </div>
      </aside>
      <main className="flex-1 rounded-lg p-4 overflow-auto" ref={containerRef}>
        <div className="space-y-4">
          {items.map((it, idx) => {
            if (it.type === 'topic') {
              return (
                <div key={`topic-${idx}`} className="text-lg font-bold">
                  Topic：{it.topic}
                </div>
              );
            }
            if (it.type === 'section') {
              return (
                <div key={`section-${idx}`} className="pt-2">
                  <div className="text-base font-semibold">
                    {it.section_title}
                  </div>
                  {it.content && (
                    <div className="text-sm text-gray-600 mt-1">
                      {it.content}
                    </div>
                  )}
                </div>
              );
            }
            // 推文卡片：显示静态内容或等待状态
            const completedText = completedTexts[it.tweet_number!];
            const isTyping = current?.id === it.tweet_number;
            const isWaiting = !completedText && !isTyping;

            return (
              <div
                key={`tweet-${it.tweet_number}`}
                className="rounded-lg p-3 bg-white/60"
              >
                <div className="text-sm font-semibold mb-1">
                  #{it.tweet_number} {it.tweet_title || ''}
                </div>
                <div className="whitespace-pre-wrap leading-relaxed font-mono text-sm">
                  {completedText && completedText}
                  {isWaiting && (
                    <span className="text-gray-400">等待上一段完成…</span>
                  )}
                  {isTyping && (
                    <div className="text-blue-600">
                      {/* 集中打字器渲染在当前活动的推文卡片内 */}
                      <ReactTyped
                        key={`typing-${current.id}`}
                        strings={[current.text]}
                        typeSpeed={30}
                        backSpeed={0}
                        showCursor={false}
                        loop={false}
                        smartBackspace={false}
                        onComplete={() => {
                          // 保存完成的文本
                          setCompletedTexts((prev) => ({
                            ...prev,
                            [current.id]: current.text,
                          }));
                          // 清空current，触发下一个队列项
                          setCurrent(null);
                        }}
                      />
                    </div>
                  )}
                </div>
              </div>
            );
          })}
          {/* Empty state */}
          {items.length === 0 && (
            <div className="text-gray-500 text-sm">
              正在建立连接并准备生成内容…
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
