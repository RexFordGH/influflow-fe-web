import { Button } from '@/components/base';
import { addToast } from '@/components/base/toast';
import { EventSourcePolyfill } from 'event-source-polyfill';
import React, { useEffect, useRef, useState } from 'react';

interface SSEProgressData {
  status: 'progress';
  data: {
    stage: 'analysis' | 'generation';
    message: string;
    data?: any;
    topic_data?: { type: 'topic'; topic: string };
    section_data?: { type: 'section'; title: string };
    tweet_data?: {
      type: 'tweet';
      section_title: string;
      title: string;
      tweet_number: number;
      tweet_content: string;
    };
    completed?: boolean;
    final_outline?: any;
  };
}

interface StreamingContentDisplayProps {
  requestBody: Record<string, any>;
  onGenerationComplete: (fullContent: string) => void;
  onCancel: () => void;
}

const StreamingContentDisplay: React.FC<StreamingContentDisplayProps> = ({
  requestBody,
  onGenerationComplete,
  onCancel,
}) => {
  const [content, setContent] = useState('');
  const [currentStage, setCurrentStage] = useState<'analysis' | 'generation'>('analysis');
  const [currentMessage, setCurrentMessage] = useState('');
  const [tweetCount, setTweetCount] = useState(0);
  const contentRef = useRef(content);

  useEffect(() => {
    contentRef.current = content;
  }, [content]);

  useEffect(() => {
    setContent(''); // Reset content on new generation
    setCurrentStage('analysis');
    setCurrentMessage('');
    setTweetCount(0);

    // 将请求参数转换为URL查询字符串
    const params = new URLSearchParams(requestBody as Record<string, string>);
    const url = `/api/proxy/api/twitter/generate_stream?${params.toString()}`;

    const eventSource = new EventSourcePolyfill(url);

    eventSource.onmessage = (event) => {
      try {
        const parsedData: SSEProgressData = JSON.parse(event.data);
        
        if (parsedData.status === 'progress') {
          const { data } = parsedData;
          setCurrentStage(data.stage);
          setCurrentMessage(data.message);
          
          // 处理不同类型的数据
          if (data.tweet_data) {
            const tweetHtml = `
              <div class="tweet-item mb-4 p-4 border rounded-lg">
                <div class="tweet-header mb-2">
                  <span class="font-bold text-blue-600">Tweet ${data.tweet_data.tweet_number}</span>
                  <span class="text-gray-500 ml-2">${data.tweet_data.title}</span>
                </div>
                <div class="tweet-content">
                  ${data.tweet_data.tweet_content.replace(/\n/g, '<br />')}
                </div>
              </div>
            `;
            setContent((prev) => prev + tweetHtml);
            setTweetCount(data.tweet_data.tweet_number);
          }
          
          // 如果生成完成
          if (data.completed) {
            eventSource.close();
            onGenerationComplete(contentRef.current);
            return;
          }
        }
      } catch (error) {
        console.error('Failed to parse SSE data:', event.data);
      }
    };

    eventSource.onerror = (error) => {
      console.error('EventSource failed:', error);
      addToast({
        title: '流式连接错误',
        description: '无法连接到服务器，请稍后重试。',
      });
      eventSource.close();
      onCancel(); // 通知父组件出错了
    };

    return () => {
      eventSource.close();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requestBody]);

  return (
    <div className="w-full p-6 bg-gray-50 rounded-lg shadow-md">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-800 mb-2">
          正在生成内容...
        </h3>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <div className="flex items-center gap-1">
            <div className={`w-2 h-2 rounded-full ${currentStage === 'analysis' ? 'bg-blue-500' : 'bg-green-500'}`} />
            <span>阶段: {currentStage === 'analysis' ? '分析' : '生成'}</span>
          </div>
          {tweetCount > 0 && (
            <div className="flex items-center gap-1">
              <span>•</span>
              <span>已生成 {tweetCount} 条推文</span>
            </div>
          )}
        </div>
        <div className="mt-2 text-sm text-gray-500">
          {currentMessage}
        </div>
      </div>
      
      <div
        className="prose prose-lg max-w-none min-h-[200px] p-4 border rounded-md bg-white"
        dangerouslySetInnerHTML={{ __html: content }}
      />
      
      <div className="mt-4 flex justify-end">
        <Button variant="bordered" onClick={onCancel}>
          取消
        </Button>
      </div>
    </div>
  );
};

export default StreamingContentDisplay;
