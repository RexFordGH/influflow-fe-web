'use client';

import { useState, useCallback } from 'react';
import { ReactFlowProvider } from 'reactflow';
import { Button, Progress, Spinner } from '@heroui/react';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { GeneratedContent, MindmapNodeData, MindmapEdgeData } from '@/types/content';
import ContentMindmap from './ContentMindmap';
import { MarkdownRenderer } from './MarkdownRenderer';

interface ContentGenerationPageProps {
  topic: string;
  onBack: () => void;
}

// 模拟生成的内容数据
const generateMockContent = (topic: string): GeneratedContent => {
  const nodes: MindmapNodeData[] = [
    {
      id: 'node-1',
      label: topic,
      level: 1,
      type: 'topic',
      position: { x: 50, y: 200 }
    },
    {
      id: 'node-2', 
      label: '背景介绍',
      level: 2,
      type: 'subtopic',
      position: { x: 300, y: 100 }
    },
    {
      id: 'node-3',
      label: '核心观点',
      level: 2, 
      type: 'subtopic',
      position: { x: 300, y: 200 }
    },
    {
      id: 'node-4',
      label: '实践建议',
      level: 2,
      type: 'subtopic', 
      position: { x: 300, y: 300 }
    },
    {
      id: 'node-5',
      label: '发展趋势',
      level: 3,
      type: 'point',
      position: { x: 550, y: 150 }
    },
    {
      id: 'node-6',
      label: '关键要素',
      level: 3,
      type: 'point',
      position: { x: 550, y: 250 }
    }
  ];

  const edges: MindmapEdgeData[] = [
    { id: 'edge-1-2', source: 'node-1', target: 'node-2' },
    { id: 'edge-1-3', source: 'node-1', target: 'node-3' },
    { id: 'edge-1-4', source: 'node-1', target: 'node-4' },
    { id: 'edge-3-5', source: 'node-3', target: 'node-5' },
    { id: 'edge-3-6', source: 'node-3', target: 'node-6' }
  ];

  const markdown = `# ${topic}

## 背景介绍

在当今快速发展的数字时代，${topic}已经成为一个备受关注的重要话题。随着技术的不断进步和社会需求的变化，我们需要深入理解这一领域的发展趋势和关键要素。

## 核心观点

### 发展趋势

当前${topic}正在经历前所未有的变革，主要体现在以下几个方面：

- **技术创新**：新兴技术的应用推动了整个行业的发展
- **用户需求**：用户对产品和服务的期望不断提升
- **市场竞争**：激烈的竞争促使企业不断优化策略

### 关键要素

要在${topic}领域取得成功，需要关注以下关键要素：

1. **战略规划**：制定清晰的长期发展战略
2. **技术投入**：持续投资于技术研发和创新
3. **人才培养**：建设专业的团队和人才梯队
4. **用户体验**：始终以用户为中心，提供优质体验

## 实践建议

基于以上分析，我们提出以下实践建议：

### 短期目标
- 建立基础框架和核心团队
- 确定技术路线和发展方向
- 开展初步的市场调研

### 长期规划
- 构建完整的产品生态系统
- 形成核心竞争优势
- 实现可持续发展

通过系统性的规划和执行，相信能够在${topic}领域取得显著成果。`;

  return {
    id: `content-${Date.now()}`,
    topic,
    createdAt: new Date().toISOString(),
    mindmap: { nodes, edges },
    markdown,
    image: {
      url: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=800&h=400&fit=crop',
      alt: `${topic}相关配图`,
      caption: `关于${topic}的示意图`,
      prompt: `Generate an image related to ${topic}`
    },
    metadata: {
      wordCount: markdown.length,
      estimatedReadTime: Math.ceil(markdown.length / 200),
      sources: ['AI生成内容', '相关研究资料']
    }
  };
};

export function ContentGenerationPage({ topic, onBack }: ContentGenerationPageProps) {
  const [isGenerating, setIsGenerating] = useState(true);
  const [generatedContent, setGeneratedContent] = useState<GeneratedContent | null>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [highlightedSection, setHighlightedSection] = useState<string | null>(null);
  const [generationStep, setGenerationStep] = useState(0);

  // 模拟生成过程
  useState(() => {
    const steps = [
      '分析主题内容...',
      '构建思维导图结构...',
      '生成文章内容...',
      '创建配图...',
      '完善细节...'
    ];

    let currentStep = 0;
    const interval = setInterval(() => {
      if (currentStep < steps.length - 1) {
        currentStep++;
        setGenerationStep(currentStep);
      } else {
        clearInterval(interval);
        // 生成完成
        setTimeout(() => {
          setGeneratedContent(generateMockContent(topic));
          setIsGenerating(false);
        }, 1000);
      }
    }, 1500);

    return () => clearInterval(interval);
  });

  const handleNodeSelect = useCallback((nodeId: string | null) => {
    setSelectedNodeId(nodeId);
    // 这里可以实现思维导图节点与Markdown段落的联动
  }, []);

  const handleSectionHover = useCallback((sectionId: string | null) => {
    setHighlightedSection(sectionId);
    // 这里可以实现Markdown段落与思维导图节点的联动
  }, []);

  const handleSourceClick = useCallback((sectionId: string) => {
    // 显示信息来源
    console.log('Show sources for section:', sectionId);
  }, []);

  const handleRegenerate = useCallback(() => {
    setIsGenerating(true);
    setGeneratedContent(null);
    setGenerationStep(0);
    
    // 重新生成
    setTimeout(() => {
      setGeneratedContent(generateMockContent(topic));
      setIsGenerating(false);
    }, 3000);
  }, [topic]);

  if (isGenerating) {
    const steps = [
      '分析主题内容...',
      '构建思维导图结构...',
      '生成文章内容...',
      '创建配图...',
      '完善细节...'
    ];

    return (
      <div className="h-screen flex flex-col bg-gray-50">
        {/* 顶部栏 */}
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                isIconOnly
                variant="light"
                onPress={onBack}
              >
                <ArrowLeftIcon className="h-5 w-5" />
              </Button>
              <h1 className="text-xl font-semibold">正在生成内容</h1>
            </div>
          </div>
        </div>

        {/* 生成进度 */}
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center max-w-md w-full px-6">
            <div className="mb-8">
              <Spinner size="lg" color="primary" />
            </div>
            
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              AI正在为您生成内容
            </h2>
            
            <p className="text-gray-600 mb-8">
              主题：{topic}
            </p>

            <div className="space-y-4">
              <Progress 
                value={(generationStep + 1) / steps.length * 100} 
                color="primary"
                className="mb-4"
              />
              
              <div className="space-y-2">
                {steps.map((step, index) => (
                  <div 
                    key={index}
                    className={`flex items-center space-x-3 ${
                      index <= generationStep ? 'text-blue-600' : 'text-gray-400'
                    }`}
                  >
                    <div className={`w-2 h-2 rounded-full ${
                      index <= generationStep ? 'bg-blue-600' : 'bg-gray-300'
                    }`} />
                    <span className="text-sm">{step}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!generatedContent) {
    return <div>Error: No content generated</div>;
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* 顶部栏 */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              isIconOnly
              variant="light"
              onPress={onBack}
            >
              <ArrowLeftIcon className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-xl font-semibold">{generatedContent.topic}</h1>
              <p className="text-sm text-gray-500">
                约{generatedContent.metadata.wordCount}字 · 预计阅读{generatedContent.metadata.estimatedReadTime}分钟
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button
              color="primary"
              variant="flat"
              onPress={handleRegenerate}
            >
              重新生成
            </Button>
          </div>
        </div>
      </div>

      {/* 主要内容区域 */}
      <div className="flex-1 flex overflow-hidden">
        {/* 左侧思维导图 */}
        <div className="w-1/2 border-r border-gray-200 bg-white">
          <ReactFlowProvider>
            <ContentMindmap
              nodes={generatedContent.mindmap.nodes}
              edges={generatedContent.mindmap.edges}
              onNodeSelect={handleNodeSelect}
              highlightedNodeId={selectedNodeId}
            />
          </ReactFlowProvider>
        </div>

        {/* 右侧Markdown内容 */}
        <div className="w-1/2">
          <MarkdownRenderer
            content={generatedContent.markdown}
            image={generatedContent.image}
            onSectionHover={handleSectionHover}
            onSourceClick={handleSourceClick}
            highlightedSection={highlightedSection}
          />
        </div>
      </div>
    </div>
  );
}