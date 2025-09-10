'use client';

import { driver } from 'driver.js';
import 'driver.js/dist/driver.css';
import { useEffect, useState } from 'react';

import { ArticleRenderer } from '@/components/Renderer/ArticleRenderer';
import { IContentFormat } from '@/types/api';
import { IOutline } from '@/types/outline';
import { goToStepAfterStableSameAnchor } from '@/utils/tutorial';

// 将提供的数据转换为IOutline格式
const articleData: IOutline = {
  id: 'dab11c13-6547-4387-8b8c-216ef33cd1b7',
  content_format: 'longform' as IContentFormat,
  topic: 'Influxy: An AI Creation Tool Tailored for KOLs',
  total_tweets: 5,
  updatedAt: Date.now(),
  nodes: [
    {
      title: 'Opening Hook',
      tweets: [
        {
          title: 'Welcome from the Influxy Team',
          content:
            'Welcome to Influxy！ What does it look like when an AI understands your voice and supports your creative process end to end?That’s exactly what Influxy is built for. This isn’t just another AI writing tool—it’s your dedicated creative partner that learns how you think, understands your voice, and amplifies your unique perspective without replacing it.',
          image_url: null,
          tweet_number: 1,
        },
      ],
    },
    {
      title: 'Core Features and Innovative Experience',
      tweets: [
        {
          title: 'Digital Twin and Personalized Learning',
          content:
            '✨ More than a tool—built to learn your voice\n\nInfluxy analyzes your existing content to learn tone, style, and phrasing patterns. The intention is not to overwrite your voice, but to reliably reproduce it so you can focus on the ideas. Think of it as a dependable companion that stays consistent and available whenever you need it.',
          image_url: null,
          tweet_number: 2,
        },
        {
          title: 'End‑to‑End Intelligent Creation Flow',
          content:
            '🔥 From trends to publishing, in one place\n\nA typical flow looks like this:\n\n• Real‑time awareness of trends in your field\n• Suggestions for topics with clear potential\n• Automatically generated mind maps and content structures\n• Image‑and‑text drafts in seconds\n• One‑click publishing across platforms\n\nEverything is designed to make the process clearer and more manageable.',
          image_url: null,
          tweet_number: 3,
        },
        {
          title: 'Domain Optimization and Quality Uplift',
          content:
            '💡 Built with professional domains in mind\n\nInfluxy supports creators in AI, Web3, and finance with domain‑aware language, timely topics, and structured viewpoints.\n\nIt’s not only about speed; it’s about maintaining consistency and raising the baseline quality.',
          image_url: null,
          tweet_number: 4,
        },
      ],
    },
    {
      title: 'Sustained Empowerment and a New Era of Creation',
      tweets: [
        {
          title: 'Your Always‑On Partner and What’s Next',
          content:
            '🎯 Your 24/7 creative partner\n\nInfluxy is designed for sustainable creation. It keeps learning from your preferences, adapts over time, and supports iterative workflows so you can maintain pace without sacrificing quality.\n\nIf you’re building influence in the digital space, we hope Influxy can be a steady part of your process.\n\nWelcome aboard.',
          image_url: null,
          tweet_number: 5,
        },
      ],
    },
  ],
  mode: 'analysis',
  search_enabled: true,
};

export default function ArticleDirectPage() {
  const [isTooltipOpenNum, setIsTooltipOpenNum] = useState(0);
  const [isOnboarding, setIsOnboarding] = useState(false);
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false);

  // 初始化新手引导
  // 如果已经完成新手引导，进入该页面时直接返回主页，否则开始新手引导
  useEffect(() => {
    const ONBOARDING_KEY = 'ifw_onboarding_completed_v1';

    if (typeof window === 'undefined') return;

    const hasCompleted = window.localStorage.getItem(ONBOARDING_KEY) === 'true';
    setHasCompletedOnboarding(hasCompleted);

    if (hasCompleted) {
      window.location.href = '/';
      return;
    }

    // 延迟启动引导，确保页面完全加载
    const timer = setTimeout(() => {
      initArticleDirectOnboarding();
    }, 300);

    return () => clearTimeout(timer);
  }, []);

  // 新手引导初始化函数
  const initArticleDirectOnboarding = () => {
    // 确保元素存在后再启动新手引导
    const checkElementExists = () => {
      const mindmapElement = document.querySelector('.mindmap-container');
      if (mindmapElement) {
        tour.drive();
      } else {
        // 如果元素还不存在，继续等待
        setTimeout(checkElementExists, 100);
      }
    };

    const tour = driver({
      smoothScroll: true,
      stagePadding: 10,
      stageRadius: 12,
      showButtons: ['close', 'next'], // 显示关闭按钮
      nextBtnText: 'NEXT',
      prevBtnText: 'BACK',
      onCloseClick: async () => {
        if (
          !tour.hasNextStep() ||
          confirm(
            'Are you sure you want to skip the onboarding? You might miss helpful tips for getting started.',
          )
        ) {
          tour.destroy();
          const ONBOARDING_KEY = 'ifw_onboarding_completed_v1';
          // Set ONBOARDING_KEY
          window.localStorage.setItem(ONBOARDING_KEY, 'true');
          window.location.href = '/';
        }
      },
      steps: [
        {
          element: '.mindmap-container',
          popover: {
            title: 'Edit With Mindmap',
            description:
              'Edit, add, or remove nodes to refine your ideas—then click Regenerate to instantly create a new article that follows your updated structure.',
            side: 'right',
            align: 'center',
            popoverClass: 'mindmap-container driverjs-basic',
            onNextClick: async () => {
              setIsOnboarding(true);
              setIsTooltipOpenNum(1);
              await goToStepAfterStableSameAnchor(tour, '#twtter-data', {
                expectChange: false,
                timeout: 300,
                frames: 1,
                minDelay: 50,
              });
            },
          },
        },
        {
          element: '.twtter-data',
          popover: {
            title: 'Edit with AI',
            description:
              'After your article is generated, you can select any paragraph and use Edit with AI. Simply tell the AI how you’d like that section improved, and it will refine the paragraph based on your feedback.',
            side: 'bottom',
            align: 'end',
            popoverClass: 'twtter-data twtter-data-start driverjs-basic',
            onNextClick: async () => {
              setIsTooltipOpenNum(2);
              await goToStepAfterStableSameAnchor(tour, '#twtter-data', {
                expectChange: false,
                timeout: 300,
                frames: 1,
                minDelay: 50,
              });
            },
          },
        },
        {
          element: '.twtter-data',
          popover: {
            title: 'Upload Image',
            description:
              'You can upload a local image to make your post more engaging. Each article currently supports one image.',
            side: 'bottom',
            align: 'end',
            popoverClass: 'twtter-data twtter-data-center driverjs-basic',
            onNextClick: async () => {
              setIsTooltipOpenNum(3);
              await goToStepAfterStableSameAnchor(tour, '#twtter-data', {
                expectChange: false,
                timeout: 300,
                frames: 1,
                minDelay: 50,
              });
            },
          },
        },
        {
          element: '.twtter-data',
          popover: {
            title: 'Generate Image',
            description:
              'Instantly create a unique image with AI to match your article. This helps your post stand out and feel more personalized. ',
            side: 'bottom',
            align: 'end',
            popoverClass: 'twtter-data twtter-data-end driverjs-basic',
            onNextClick: async () => {
              const ONBOARDING_KEY = 'ifw_onboarding_completed_v1';
              // Set ONBOARDING_KEY
              window.localStorage.setItem(ONBOARDING_KEY, 'true');
              window.location.href = '/';
            },
          },
        },
      ],
      onHighlightStarted: (el) => {
        (el as HTMLElement).setAttribute('inert', ''); // 禁用交互/焦点
        (el as HTMLElement).classList.add('tour-noninteractive'); // 叠加指针禁用（双保险）
      },
      onDestroyStarted: () => {}, // 什么都不做，禁止用户点击非高亮处
    });

    // 启动新手引导
    checkElementExists();
  };

  const handleBack = () => {};
  const handleDataUpdate = () => {};

  return (
    <ArticleRenderer
      topic={articleData.topic}
      contentFormat={articleData.content_format}
      onBack={handleBack}
      initialData={articleData}
      onDataUpdate={handleDataUpdate}
      sessionId={articleData.id}
      isOnboarding={isOnboarding}
      isTooltipOpenNum={isTooltipOpenNum}
    />
  );
}
