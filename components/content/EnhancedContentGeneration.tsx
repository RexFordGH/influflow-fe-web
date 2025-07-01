'use client';

import {
  GeneratedContent,
  MindmapEdgeData,
  MindmapNodeData,
} from '@/types/content';
import {
  ArrowLeftIcon,
  ArrowPathIcon,
  PhotoIcon,
} from '@heroicons/react/24/outline';
import { Button, Card, CardBody, Progress, Spinner } from '@heroui/react';
import { useCallback, useEffect, useState } from 'react';
import { ReactFlowProvider } from 'reactflow';
import EditableContentMindmap from './EditableContentMindmap';
import { EnhancedMarkdownRenderer } from './EnhancedMarkdownRenderer';

interface EnhancedContentGenerationProps {
  topic: string;
  onBack: () => void;
}

// 基于思维导图节点生成Markdown内容
const generateMarkdownFromNodes = (
  nodes: MindmapNodeData[],
  topic: string,
): string => {
  // 按层级分组节点
  const nodesByLevel: { [level: number]: MindmapNodeData[] } = {};
  nodes.forEach((node) => {
    if (!nodesByLevel[node.level]) {
      nodesByLevel[node.level] = [];
    }
    nodesByLevel[node.level].push(node);
  });

  let markdown = `# ${topic} 基于思维导图的内容分析 🧵\n\n`;

  // 生成二级标题内容
  const level2Nodes = nodesByLevel[2] || [];
  level2Nodes.forEach((node, index) => {
    markdown += `## ${node.label} 📊\n\n`;

    // 查找该节点的子节点
    const childNodes = (nodesByLevel[3] || []).filter((child) => {
      // 这里简单地按索引关联，实际应该根据edges来确定关系
      return true; // 暂时包含所有三级节点
    });

    if (childNodes.length > 0) {
      markdown += `### 核心要点\n\n`;
      childNodes.forEach((child) => {
        markdown += `- **${child.label}**：这是关于${child.label}的详细说明，展示了在${node.label}方面的重要性和实际应用价值。\n`;
      });
      markdown += '\n';
    }

    // 添加段落内容
    markdown += `在${node.label}方面，我们需要深入理解其核心价值和实践意义。通过系统性的分析和研究，可以发现这一领域的发展趋势和关键要素。\n\n`;

    if (index < level2Nodes.length - 1) {
      markdown += `---\n\n`;
    }
  });

  // 添加总结
  markdown += `## 总结与展望 🚀\n\n`;
  markdown += `通过对${topic}的全面分析，我们可以看到这一领域的巨大潜力和发展空间。`;
  markdown += `未来发展将更加注重创新与实践的结合，为用户创造更大价值。\n\n`;
  markdown += `*本内容基于思维导图动态生成，体现了结构化思维的重要性。*\n\n`;
  markdown += `#${topic.replace(/\s+/g, '')} #思维导图 #内容生成`;

  return markdown;
};

// 生成更丰富的模拟内容数据
const generateEnhancedMockContent = (topic: string): GeneratedContent => {
  const nodes: MindmapNodeData[] = [
    {
      id: 'node-1',
      label: topic,
      level: 1,
      type: 'topic',
      position: { x: 50, y: 200 },
    },
    {
      id: 'node-2',
      label: '背景分析',
      level: 2,
      type: 'subtopic',
      position: { x: 300, y: 80 },
    },
    {
      id: 'node-3',
      label: '核心观点',
      level: 2,
      type: 'subtopic',
      position: { x: 300, y: 160 },
    },
    {
      id: 'node-4',
      label: '实践方法',
      level: 2,
      type: 'subtopic',
      position: { x: 300, y: 240 },
    },
    {
      id: 'node-5',
      label: '未来趋势',
      level: 2,
      type: 'subtopic',
      position: { x: 300, y: 320 },
    },
    {
      id: 'node-6',
      label: '市场现状',
      level: 3,
      type: 'point',
      position: { x: 550, y: 60 },
    },
    {
      id: 'node-7',
      label: '痛点问题',
      level: 3,
      type: 'point',
      position: { x: 550, y: 100 },
    },
    {
      id: 'node-8',
      label: '关键要素',
      level: 3,
      type: 'point',
      position: { x: 550, y: 140 },
    },
    {
      id: 'node-9',
      label: '价值主张',
      level: 3,
      type: 'point',
      position: { x: 550, y: 180 },
    },
    {
      id: 'node-10',
      label: '实施步骤',
      level: 3,
      type: 'point',
      position: { x: 550, y: 220 },
    },
    {
      id: 'node-11',
      label: '评估指标',
      level: 3,
      type: 'point',
      position: { x: 550, y: 260 },
    },
    {
      id: 'node-12',
      label: '技术发展',
      level: 3,
      type: 'point',
      position: { x: 550, y: 300 },
    },
    {
      id: 'node-13',
      label: '应用前景',
      level: 3,
      type: 'point',
      position: { x: 550, y: 340 },
    },
  ];

  const edges: MindmapEdgeData[] = [
    { id: 'edge-1-2', source: 'node-1', target: 'node-2' },
    { id: 'edge-1-3', source: 'node-1', target: 'node-3' },
    { id: 'edge-1-4', source: 'node-1', target: 'node-4' },
    { id: 'edge-1-5', source: 'node-1', target: 'node-5' },
    { id: 'edge-2-6', source: 'node-2', target: 'node-6' },
    { id: 'edge-2-7', source: 'node-2', target: 'node-7' },
    { id: 'edge-3-8', source: 'node-3', target: 'node-8' },
    { id: 'edge-3-9', source: 'node-3', target: 'node-9' },
    { id: 'edge-4-10', source: 'node-4', target: 'node-10' },
    { id: 'edge-4-11', source: 'node-4', target: 'node-11' },
    { id: 'edge-5-12', source: 'node-5', target: 'node-12' },
    { id: 'edge-5-13', source: 'node-5', target: 'node-13' },
  ];

  // 生成更详细的推文串格式内容
  const markdown = `# ${topic} 完整分析与思考 🧵

## 背景分析 📊

### 市场现状

当前${topic}领域正处于快速发展期，市场需求持续增长。根据最新数据显示，相关市场规模已达到新高度，预计未来几年将保持20%以上的年增长率。

### 痛点问题

尽管发展迅猛，但行业仍面临几个核心挑战：

- **技术壁垒高**：入门门槛较高，需要专业知识背景
- **成本控制难**：投资回报周期长，资金压力大  
- **人才稀缺**：专业人才供不应求，薪资成本上升
- **标准缺失**：行业标准不统一，质量参差不齐

## 核心观点 💡

### 关键要素

要在${topic}领域获得成功，必须关注以下几个关键要素：

1. **技术创新能力** - 持续的研发投入和技术迭代
2. **用户体验设计** - 以用户为中心的产品设计理念
3. **团队协作效率** - 高效的团队协作和项目管理
4. **市场敏感度** - 快速响应市场变化和用户需求

### 价值主张  

${topic}的核心价值在于：

- 提升效率：通过技术手段大幅提高工作效率
- 降低成本：优化资源配置，减少不必要的开支
- 增强体验：提供更好的用户体验和服务质量
- 创造价值：为用户和企业创造实际的商业价值

## 实践方法 🔧

### 实施步骤

基于深入研究和实践经验，推荐以下实施路径：

**第一阶段：基础建设**
- 团队组建和能力建设
- 技术架构设计和选型  
- 基础设施搭建和优化
- 流程规范制定和完善

**第二阶段：核心开发**
- 核心功能模块开发
- 用户界面设计和优化
- 数据处理和分析系统
- 安全和性能优化

**第三阶段：测试验证**  
- 功能测试和性能测试
- 用户体验测试和反馈
- 安全性测试和加固
- 压力测试和容量规划

### 评估指标

建立科学的评估体系：

- **技术指标**：性能、稳定性、安全性
- **业务指标**：用户增长、收入增长、成本控制
- **用户指标**：满意度、活跃度、留存率
- **团队指标**：效率、质量、协作度

## 未来趋势 🚀

### 技术发展

${topic}未来发展将呈现以下趋势：

- **智能化程度提升**：AI和机器学习技术深度融合
- **自动化水平增强**：更多流程实现自动化处理
- **个性化服务升级**：基于用户数据提供定制化服务
- **生态系统完善**：产业链上下游协同发展

### 应用前景

展望未来，${topic}将在以下领域发挥重要作用：

1. **企业数字化转型** - 助力传统企业数字化升级
2. **智慧城市建设** - 为城市治理提供技术支撑  
3. **教育培训革新** - 改变传统教育模式和方法
4. **生活服务升级** - 提升日常生活便利性和品质

---

**总结**：${topic}作为一个快速发展的领域，既充满机遇也面临挑战。只有把握核心要素，制定合理策略，才能在竞争中脱颖而出。

*通过系统性分析和实践验证，相信每个人都能在这个领域找到属于自己的发展路径。*

#${topic.replace(/\s+/g, '')} #创新思维 #行业分析`;

  return {
    id: `enhanced-content-${Date.now()}`,
    topic,
    createdAt: new Date().toISOString(),
    mindmap: { nodes, edges },
    markdown,
    image: {
      url: `https://images.unsplash.com/photo-1557804506-669a67965ba0?w=1200&h=600&fit=crop&crop=center`,
      alt: `${topic}主题配图`,
      caption: `关于${topic}的深度分析和思考`,
      prompt: `Create a professional, modern illustration about ${topic}, focusing on innovation and technology`,
    },
    metadata: {
      wordCount: markdown.length,
      estimatedReadTime: Math.ceil(markdown.length / 200),
      sources: [
        '行业研究报告',
        '专家访谈记录',
        '市场数据分析',
        '用户调研反馈',
        'AI知识整合',
      ],
    },
  };
};

export function EnhancedContentGeneration({
  topic,
  onBack,
}: EnhancedContentGenerationProps) {
  const [isGenerating, setIsGenerating] = useState(true);
  const [generatedContent, setGeneratedContent] =
    useState<GeneratedContent | null>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [highlightedSection, setHighlightedSection] = useState<string | null>(
    null,
  );
  const [generationStep, setGenerationStep] = useState(0);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [currentNodes, setCurrentNodes] = useState<MindmapNodeData[]>([]);
  const [currentEdges, setCurrentEdges] = useState<MindmapEdgeData[]>([]);

  // 生成思维过程步骤
  const generationSteps = [
    '🔍 分析主题内容和相关背景...',
    '🧠 构建思维导图结构框架...',
    '📝 生成结构化文章内容...',
    '🎨 创建主题相关配图...',
    '🔗 建立内容间关联关系...',
    '✨ 完善细节和优化排版...',
  ];

  // 模拟AI生成过程
  useEffect(() => {
    if (!isGenerating) return;

    let currentStep = 0;
    const interval = setInterval(() => {
      if (currentStep < generationSteps.length - 1) {
        currentStep++;
        setGenerationStep(currentStep);
      } else {
        clearInterval(interval);
        // 生成完成
        setTimeout(() => {
          const content = generateEnhancedMockContent(topic);
          setGeneratedContent(content);
          setCurrentNodes(content.mindmap.nodes);
          setCurrentEdges(content.mindmap.edges);
          setIsGenerating(false);
        }, 1000);
      }
    }, 1500);

    return () => clearInterval(interval);
  }, [topic, isGenerating]);

  const handleNodeSelect = useCallback(
    (nodeId: string | null) => {
      setSelectedNodeId(nodeId);

      // 根据选中的节点高亮对应的内容段落
      if (nodeId && generatedContent) {
        const node = generatedContent.mindmap.nodes.find(
          (n) => n.id === nodeId,
        );
        if (node) {
          // 简单的内容段落映射逻辑
          const sectionMapping: { [key: string]: string } = {
            'node-2': 'background-analysis', // 背景分析
            'node-3': 'core-viewpoints', // 核心观点
            'node-4': 'practical-methods', // 实践方法
            'node-5': 'future-trends', // 未来趋势
            'node-6': 'market-status', // 市场现状
            'node-7': 'pain-points', // 痛点问题
            'node-8': 'key-elements', // 关键要素
            'node-9': 'value-proposition', // 价值主张
            'node-10': 'implementation-steps', // 实施步骤
            'node-11': 'evaluation-metrics', // 评估指标
            'node-12': 'technology-development', // 技术发展
            'node-13': 'application-prospects', // 应用前景
          };

          setHighlightedSection(sectionMapping[nodeId] || null);
        }
      } else {
        setHighlightedSection(null);
      }
    },
    [generatedContent],
  );

  const handleSectionHover = useCallback((sectionId: string | null) => {
    setHighlightedSection(sectionId);

    // 根据内容段落高亮对应的思维导图节点
    if (sectionId) {
      const nodeMappings: { [key: string]: string } = {
        'background-analysis': 'node-2',
        'core-viewpoints': 'node-3',
        'practical-methods': 'node-4',
        'future-trends': 'node-5',
        'market-status': 'node-6',
        'pain-points': 'node-7',
        'key-elements': 'node-8',
        'value-proposition': 'node-9',
        'implementation-steps': 'node-10',
        'evaluation-metrics': 'node-11',
        'technology-development': 'node-12',
        'application-prospects': 'node-13',
      };

      setSelectedNodeId(nodeMappings[sectionId] || null);
    }
  }, []);

  const handleSourceClick = useCallback((sectionId: string) => {
    // 显示信息来源弹窗或侧边栏
    console.log('显示信息来源:', sectionId);
    // TODO: 实现信息来源展示功能
  }, []);

  // 处理思维导图节点变化
  const handleNodesChange = useCallback((newNodes: MindmapNodeData[]) => {
    setCurrentNodes(newNodes);
  }, []);

  const handleEdgesChange = useCallback((newEdges: MindmapEdgeData[]) => {
    setCurrentEdges(newEdges);
  }, []);

  // 基于思维导图重新生成内容
  const regenerateFromMindmap = useCallback(async () => {
    if (!generatedContent) return;

    setIsRegenerating(true);

    // 模拟基于思维导图重新生成Markdown内容
    setTimeout(() => {
      const newMarkdown = generateMarkdownFromNodes(currentNodes, topic);

      setGeneratedContent({
        ...generatedContent,
        mindmap: {
          nodes: currentNodes,
          edges: currentEdges,
        },
        markdown: newMarkdown,
        metadata: {
          ...generatedContent.metadata,
          wordCount: newMarkdown.length,
          estimatedReadTime: Math.ceil(newMarkdown.length / 200),
        },
      });

      setIsRegenerating(false);
    }, 2000);
  }, [currentNodes, currentEdges, generatedContent, topic]);

  const handleRegenerate = useCallback(async () => {
    setIsRegenerating(true);
    setIsGenerating(true);
    setGeneratedContent(null);
    setGenerationStep(0);
    setSelectedNodeId(null);
    setHighlightedSection(null);

    // 模拟重新生成过程
    setTimeout(() => {
      setIsRegenerating(false);
    }, 2000);
  }, []);

  const handleImageEdit = useCallback(() => {
    // TODO: 实现图片编辑功能
    console.log('编辑图片');
  }, []);

  // 加载状态
  if (isGenerating) {
    return (
      <div className="h-screen flex flex-col bg-gradient-to-br from-blue-50 to-indigo-50">
        {/* 顶部栏 */}
        <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                isIconOnly
                variant="light"
                onPress={onBack}
                className="hover:bg-gray-100"
              >
                <ArrowLeftIcon className="h-5 w-5" />
              </Button>
              <h1 className="text-xl font-semibold text-gray-900">
                {isRegenerating ? '重新生成中...' : 'AI 正在思考和创作'}
              </h1>
            </div>
          </div>
        </div>

        {/* 生成进度 */}
        <div className="flex-1 flex items-center justify-center p-6">
          <Card className="w-full max-w-2xl shadow-lg">
            <CardBody className="p-8">
              <div className="text-center">
                <div className="mb-8">
                  <Spinner size="lg" color="primary" className="mb-4" />
                  <div className="relative w-16 h-16 mx-auto mb-4">
                    <div className="absolute inset-0 rounded-full bg-blue-100 animate-pulse"></div>
                    <div className="absolute inset-2 rounded-full bg-blue-200 animate-ping"></div>
                  </div>
                </div>

                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  AI 正在为您创作内容
                </h2>

                <p className="text-gray-600 mb-2">
                  主题:{' '}
                  <span className="font-medium text-blue-600">{topic}</span>
                </p>

                <p className="text-sm text-gray-500 mb-8">
                  正在运用先进的AI技术为您生成思维导图和深度内容
                </p>

                <div className="space-y-6">
                  <Progress
                    value={
                      ((generationStep + 1) / generationSteps.length) * 100
                    }
                    color="primary"
                    size="md"
                    className="mb-6"
                  />

                  <div className="space-y-3">
                    {generationSteps.map((step, index) => (
                      <div
                        key={index}
                        className={`flex items-center space-x-3 p-3 rounded-lg transition-all duration-300 ${
                          index <= generationStep
                            ? 'text-blue-600 bg-blue-50 border border-blue-200'
                            : 'text-gray-400 bg-gray-50'
                        }`}
                      >
                        <div
                          className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center ${
                            index <= generationStep
                              ? 'bg-blue-600 text-white'
                              : 'bg-gray-300'
                          }`}
                        >
                          {index < generationStep ? (
                            <svg
                              className="w-4 h-4"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path
                                fillRule="evenodd"
                                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                clipRule="evenodd"
                              />
                            </svg>
                          ) : index === generationStep ? (
                            <div className="w-2 h-2 bg-current rounded-full animate-pulse" />
                          ) : (
                            <span className="text-xs font-medium">
                              {index + 1}
                            </span>
                          )}
                        </div>
                        <span className="text-sm font-medium">{step}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardBody>
          </Card>
        </div>
      </div>
    );
  }

  if (!generatedContent) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-red-600 mb-2">生成失败</h2>
          <p className="text-gray-600 mb-4">内容生成过程中出现错误</p>
          <Button color="primary" onPress={() => setIsGenerating(true)}>
            重新生成
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* 顶部工具栏 */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              isIconOnly
              variant="light"
              onPress={onBack}
              className="hover:bg-gray-100"
            >
              <ArrowLeftIcon className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-xl font-bold text-gray-900">
                {generatedContent.topic}
              </h1>
              <p className="text-sm text-gray-500">
                约 {generatedContent.metadata.wordCount} 字 · 预计阅读{' '}
                {generatedContent.metadata.estimatedReadTime} 分钟
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <Button
              color="primary"
              variant="flat"
              startContent={<ArrowPathIcon className="h-4 w-4" />}
              onPress={handleRegenerate}
              disabled={isRegenerating}
            >
              {isRegenerating ? '生成中...' : '重新生成'}
            </Button>
            <Button
              color="success"
              className="bg-green-600 text-white hover:bg-green-700"
            >
              导出内容
            </Button>
          </div>
        </div>
      </div>

      {/* 主要内容区域 */}
      <div className="flex-1 flex overflow-hidden">
        {/* 左侧思维导图 */}
        <div className="w-1/2 border-r border-gray-200 bg-white relative">
          <ReactFlowProvider>
            <EditableContentMindmap
              nodes={currentNodes}
              edges={currentEdges}
              onNodeSelect={handleNodeSelect}
              onNodesChange={handleNodesChange}
              onEdgesChange={handleEdgesChange}
              highlightedNodeId={selectedNodeId}
            />
          </ReactFlowProvider>
        </div>

        {/* 右侧内容区域 */}
        <div className="w-1/2 flex flex-col bg-white">
          {/* 顶部图片区域 */}
          <div className="flex-shrink-0 relative">
            <div className="relative h-48 bg-gradient-to-r from-blue-500 to-purple-600">
              <img
                src={generatedContent.image.url}
                alt={generatedContent.image.alt}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black bg-opacity-20"></div>
              <div className="absolute bottom-4 left-4 right-4">
                <p className="text-white text-sm font-medium drop-shadow-lg">
                  {generatedContent.image.caption}
                </p>
              </div>
              <div className="absolute top-4 right-4">
                <Button
                  isIconOnly
                  size="sm"
                  variant="flat"
                  className="bg-white/20 hover:bg-white/30 text-white backdrop-blur-sm"
                  onPress={handleImageEdit}
                >
                  <PhotoIcon className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Markdown内容区域 */}
          <div className="flex-1 overflow-hidden">
            <EnhancedMarkdownRenderer
              content={generatedContent.markdown}
              onSectionHover={handleSectionHover}
              onSourceClick={handleSourceClick}
              highlightedSection={highlightedSection}
              sources={generatedContent.metadata.sources}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
