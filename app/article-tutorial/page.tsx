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
  id: 'okx-dex-article',
  content_format: 'longform' as IContentFormat,
  topic: 'OKX DEX收费调整引发关注',
  total_tweets: 7,
  updatedAt: Date.now(),
  nodes: [
    {
      title: 'Opening Hook',
      tweets: [
        {
          title: 'OKX DEX收费调整引发关注',
          content: 'OKX DEX这个收费调整，说实话挺有意思的',
          image_url: null,
          tweet_number: 1,
        },
      ],
    },
    {
      title: 'OKX DEX产品特点与用户体验',
      tweets: [
        {
          title: '聚合器与智能路由优势',
          content:
            '不是传统DEX，是个聚合器，通过智能路由在100+个DEX里给你找最优价格',
          image_url: null,
          tweet_number: 2,
        },
        {
          title: '零滑点和免Gas费优势',
          content:
            '零滑点优势确实牛逼，正向滑点不收你的，这对大额交易太重要了\n\n免Gas费也是真香，小白进DeFi门槛直接降到最低',
          image_url: null,
          tweet_number: 3,
        },
      ],
    },
    {
      title: '收费策略与市场对比',
      tweets: [
        {
          title: '分层收费策略',
          content:
            '现在收费策略也很精明：\n\n主流币0费率 - 保住基础用户群体，BTC、ETH这些大家都在交易的\n\nMEME币0.85% - 这些币投机性强，用户对价格敏感度低，但要求速度快防MEV，收费合理',
          image_url: null,
          tweet_number: 4,
        },
        {
          title: '与竞争对手的对比分析',
          content:
            '跟竞争对手比：\n- vs Uniswap这些传统DEX：价格更优、有Gas补贴、界面简洁\n- vs 1inch、Matcha这些聚合器：关键看综合成本，OKX通过Gas补贴+零正向滑点在某些场景下确实更划算',
          image_url: null,
          tweet_number: 5,
        },
      ],
    },
    {
      title: '综合评价与未来展望',
      tweets: [
        {
          title: '商业化转型与综合体验',
          content:
            '总的来说，从免费引流进入商业化成熟阶段了\n\n现在不是看"免不免费"，而是看"综合成本和体验是不是最优"',
          image_url: null,
          tweet_number: 6,
        },
        {
          title: '对不同用户群体的吸引力与执行质量',
          content:
            '算上滑点节省、Gas补贴这些，对高频交易者、MEME币玩家、怕麻烦的用户来说，还是很有竞争力的\n\n关键是执行质量确实不错，最优价格、防MEV保护、界面简洁，该收的费也收得明白',
          image_url: null,
          tweet_number: 7,
        },
      ],
    },
  ],
};

export default function ArticleDirectPage() {
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false);

  const handleBack = () => {
    // 可以添加返回逻辑，比如路由跳转
    window.history.back();
  };

  const handleDataUpdate = () => {};

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
      initArticleDirectOnboarding(ONBOARDING_KEY);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  // 新手引导初始化函数
  const initArticleDirectOnboarding = (onboardingKey: string) => {
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
      stagePadding: 10,
      stageRadius: 12,
      showButtons: ['close', 'next'], // 显示关闭按钮
      nextBtnText: 'NEXT',
      prevBtnText: 'BACK',
      // onCloseClick: async () => {
      //   if (
      //     !tour.hasNextStep() ||
      //     confirm(
      //       'Are you sure you want to skip the onboarding? You might miss helpful tips for getting started.',
      //     )
      //   ) {
      //     tour.destroy();
      //     const ONBOARDING_KEY = 'ifw_onboarding_completed_v1';
      //     // Set ONBOARDING_KEY
      //     window.localStorage.setItem(ONBOARDING_KEY, 'true');
      //     window.location.href = '/';
      //   }
      // },
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
          },
        },
        // {
        //   element: '.prompt-history-button',
        //   popover: {
        //     title: 'Prompts History',
        //     description:
        //       'Click to view all your past prompts—revisit, reuse, or refine them anytime.',
        //     side: 'bottom',
        //     align: 'start',
        //     popoverClass: 'prompt-history-button driverjs-basic',
        //   },
        // },
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

  return (
    <ArticleRenderer
      topic="OKX DEX收费调整引发关注"
      contentFormat="longform"
      onBack={handleBack}
      initialData={articleData}
      onDataUpdate={handleDataUpdate}
      sessionId="okx-dex-session"
      isOnboarding={true}
    />
  );
}
