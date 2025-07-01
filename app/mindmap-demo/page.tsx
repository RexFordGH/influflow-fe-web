/**
 * 思维导图与 Markdown 编辑器联动演示页面
 * 展示完整的技术验证方案
 */

'use client';

import { Button } from '@heroui/react';
import { useEffect, useState } from 'react';
import { ReactFlowProvider } from 'reactflow';

import MarkdownEditor from '@/components/editor/MarkdownEditor';
import MindmapFlow from '@/components/mindmap/MindmapFlow';
import { parseMarkdown, SAMPLE_MARKDOWN } from '@/lib/markdown/parser';
import { useContentStore } from '@/stores/contentStore';

/**
 * 主演示页面组件
 *
 * 页面布局：
 * - 左侧：思维导图 (React Flow)
 * - 右侧：Markdown 编辑器 (TipTap)
 * - 顶部：控制面板和说明
 */
const MindmapDemoPage = () => {
  const { markdown, setMarkdown, setMarkdownNodes, syncMarkdownToFlow } =
    useContentStore();

  const [isLoading, setIsLoading] = useState(false);

  /**
   * 初始化演示数据
   * 加载示例 Markdown 内容并解析为思维导图
   */
  const initializeDemo = async () => {
    setIsLoading(true);

    try {
      console.log('开始初始化演示...');

      // 设置示例 Markdown 内容
      setMarkdown(SAMPLE_MARKDOWN);
      console.log('Markdown 设置完成:', SAMPLE_MARKDOWN.length, '字符');

      // 解析 Markdown 为思维导图节点
      const parseResult = await parseMarkdown(SAMPLE_MARKDOWN);
      console.log('解析结果:', parseResult.nodes.length, '个节点');
      setMarkdownNodes(parseResult.nodes);

      // 同步到 React Flow
      syncMarkdownToFlow();
      console.log('同步完成');
    } catch (error) {
      console.error('初始化演示失败:', error);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * 手动触发同步
   */
  const handleManualSync = async () => {
    if (!markdown.trim()) return;

    setIsLoading(true);

    try {
      const parseResult = await parseMarkdown(markdown);
      setMarkdownNodes(parseResult.nodes);
      syncMarkdownToFlow();
    } catch (error) {
      console.error('同步失败:', error);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * 清空内容
   */
  const handleClear = () => {
    setMarkdown('');
    setMarkdownNodes([]);
    syncMarkdownToFlow();
  };

  // 页面加载时初始化演示
  useEffect(() => {
    initializeDemo();
  }, []);

  return (
    <div className="flex h-screen flex-col bg-gray-50 dark:bg-gray-900">
      {/* 顶部控制面板 */}
      <div className="border-b border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              思维导图 & Markdown 联动演示
            </h1>
            <p className="mt-1 text-gray-600 dark:text-gray-400">
              技术验证：React Flow + TipTap + Unified 实现自动同步（500ms防抖）
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              color="primary"
              onPress={handleManualSync}
              isLoading={isLoading}
              disabled={!markdown.trim()}
              variant="flat"
            >
              立即同步
            </Button>

            <Button
              color="secondary"
              variant="flat"
              onPress={initializeDemo}
              isLoading={isLoading}
            >
              重新加载示例
            </Button>

            <Button color="danger" variant="light" onPress={handleClear}>
              清空
            </Button>
          </div>
        </div>
      </div>

      {/* 主内容区域 */}
      <div className="flex flex-1 overflow-hidden">
        {/* 左侧：思维导图 */}
        <div className="flex-1 border-r border-gray-200 dark:border-gray-700">
          <div className="flex h-full flex-col">
            <div className="border-b border-gray-200 bg-white p-3 dark:border-gray-700 dark:bg-gray-800">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                思维导图视图
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                从 Markdown 标题结构自动生成，双击节点可编辑，自动智能布局
              </p>
            </div>

            <div className="flex-1">
              <ReactFlowProvider>
                <MindmapFlow />
              </ReactFlowProvider>
            </div>
          </div>
        </div>

        {/* 右侧：Markdown 编辑器 */}
        <div className="flex-1">
          <div className="flex h-full flex-col">
            <div className="border-b border-gray-200 bg-white p-3 dark:border-gray-700 dark:bg-gray-800">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Markdown 编辑器
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                所见即所得编辑，自动实时同步到思维导图
              </p>
            </div>

            <div className="flex-1">
              <MarkdownEditor />
            </div>
          </div>
        </div>
      </div>

      {/* 底部信息面板 */}
      <div className="border-t border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
        <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
          <div>
            <strong>技术栈：</strong>
            React Flow (思维导图) + TipTap (编辑器) + Unified (Markdown解析) +
            Zustand (状态管理)
          </div>

          <div>
            <strong>功能特性：</strong>
            自动解析 | 双向同步 | 节点编辑 | 层级映射 | 实时预览
          </div>
        </div>
      </div>
    </div>
  );
};

export default MindmapDemoPage;
