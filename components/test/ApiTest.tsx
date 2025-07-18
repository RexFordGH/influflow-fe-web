'use client';

import { Button } from '@heroui/react';
import { useState } from 'react';

import {
  getErrorMessage,
  useGenerateThread,
  useHealth,
} from '@/lib/api/services';

export function ApiTest() {
  const [topic, setTopic] = useState('人工智能的发展前景');

  // 健康检查
  const {
    data: healthData,
    isLoading: healthLoading,
    error: healthError,
  } = useHealth();

  // 生成Thread
  const {
    mutate: generateThread,
    isPending: isGenerating,
    error: generateError,
  } = useGenerateThread();

  const handleGenerateThread = () => {
    if (!topic.trim()) return;

    generateThread(
      {
        user_input: topic.trim(),
        content_format: 'longform' as const,
      },
      {
        onSuccess: (data) => {
          console.log('生成成功:', data);
        },
        onError: (error) => {
          console.error('生成失败:', error);
        },
      },
    );
  };

  return (
    <div className="mx-auto max-w-md space-y-4 rounded-lg bg-white p-6 shadow-lg">
      <h2 className="text-center text-xl font-bold">API 测试</h2>

      {/* 健康检查状态 */}
      <div className="rounded border p-4">
        <h3 className="mb-2 font-semibold">API 健康状态</h3>
        {healthLoading && <p className="text-blue-500">检查中...</p>}
        {healthError && (
          <p className="text-red-500">错误: {getErrorMessage(healthError)}</p>
        )}
        {healthData && (
          <div className="text-green-500">
            <p>状态: 正常</p>
            <p>时间: {healthData.timestamp}</p>
          </div>
        )}
      </div>

      {/* 生成 Thread 测试 */}
      <div className="rounded border p-4">
        <h3 className="mb-2 font-semibold">生成 Twitter Thread</h3>
        <div className="space-y-2">
          <input
            type="text"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="输入话题"
            className="w-full rounded border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <Button
            onPress={handleGenerateThread}
            isLoading={isGenerating}
            disabled={!topic.trim() || isGenerating}
            color="primary"
            className="w-full"
          >
            {isGenerating ? '生成中...' : '生成 Thread'}
          </Button>
          {generateError && (
            <p className="text-sm text-red-500">
              错误: {getErrorMessage(generateError)}
            </p>
          )}
        </div>
      </div>

      {/* 使用说明 */}
      <div className="text-sm text-gray-600">
        <p>• 健康检查会自动每30秒刷新一次</p>
        <p>• 输入话题后点击生成按钮测试API</p>
        <p>• 查看控制台获取详细响应信息</p>
      </div>
    </div>
  );
}
