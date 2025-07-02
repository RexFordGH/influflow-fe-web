import { ModifyTweetResponse, ModifyOutlineResponse } from '@/types/api';
import type { Outline } from '@/types/outline';

export const localGenerateThreadResponse = {
  status: 'success',
  outline: {
    topic: "What's AI?",
    nodes: [
      {
        title: 'The Core of AI',
        tweets: [
          {
            tweet_number: 1,
            title: 'Hook: AI Unveiled',
            content:
              '🤖 What’s the REAL story behind AI? \n\nIt’s not just robots or sci-fi magic. \n\nAI is transforming your daily life right now—often without you noticing.\n\nUnlock the essentials of artificial intelligence in this thread. You’ll never see tech the same way. #AIbasics',
          },
          {
            tweet_number: 2,
            title: 'Definition & Foundation',
            content:
              'Artificial Intelligence (AI) means machines can mimic human abilities like learning, reasoning, and decision-making. \n• Think: computers playing chess\n• Apps recommending your next binge\n• Cars recognizing stop signs\n\nIt’s everywhere—often undetected. #AIexplained',
          },
          {
            tweet_number: 3,
            title: 'Types of AI',
            content:
              'There isn’t just one type of AI! \n• Narrow AI: Does one task (like Alexa or Spotify’s recommendations)\n• General AI: Theoretical, human-level reasoning\n• Superintelligent AI: Still sci-fi\n\nRight now, you’re surrounded by Narrow AI. #TechTalk',
          },
          {
            tweet_number: 4,
            title: 'How AI Actually Works',
            content:
              'AI runs on data and algorithms. Here’s how:\n• Data is collected (images, text, clicks)\n• Algorithms find patterns\n• Machines learn from feedback\n\nExample: Netflix suggests shows by learning your preferences over time. Next up—why this matters!',
          },
        ],
      },
      {
        title: 'AI in Action',
        tweets: [
          {
            tweet_number: 5,
            title: 'Everyday AI Examples',
            content:
              'You use AI daily—often without realizing:\n• Google Maps rerouting you\n• Email spam filters\n• Voice assistants, like Siri\n• Social media feeds\n\nA 2023 survey showed 77% of Americans interact with AI-powered tech weekly (Pew Research). Surprised yet?',
          },
          {
            tweet_number: 6,
            title: 'Why AI Is Exploding Now',
            content:
              'Why is AI booming right now?\n• Huge data volumes available\n• Cheaper, faster computers\n• Open-source tools (like TensorFlow)\n\nThis combo lets startups and giants innovate rapidly. The next big AI breakthrough could be built in a college dorm! #FutureOfAI',
          },
          {
            tweet_number: 7,
            title: 'Common Myths About AI',
            content:
              'Let’s bust some AI myths:\n• AI isn’t sentient (yet)\n• It can’t replace all jobs\n• AI doesn’t always get it right\n\nUnderstanding these facts will help you use AI wisely and avoid the hype. Ready to learn how AI impacts your future? #AItruths',
          },
        ],
      },
      {
        title: 'AI’s Impact & Next Steps',
        tweets: [
          {
            tweet_number: 8,
            title: 'Opportunities and Challenges',
            content:
              'AI brings both promise and problems:\n• Automates boring tasks\n• Helps diagnose diseases\n• Raises privacy and bias concerns\n\nA McKinsey report says AI could boost global GDP by $13 trillion by 2030—but only if we use it responsibly. #AIimpact',
          },
          {
            tweet_number: 9,
            title: 'How You Can Get Started With AI',
            content:
              'Curious about diving deeper into AI?\n• Try free tools like ChatGPT\n• Check courses on Coursera or Khan Academy\n• Follow #AInews for updates\n\nAnyone can learn the basics—no PhD required! What AI tool will you try first? Let’s keep the convo going.',
          },
          {
            tweet_number: 10,
            title: 'Final CTA: Join the AI Conversation',
            content:
              'AI is shaping your world—right now. Stay curious, keep learning, and don’t get left behind.\n\nFollow me for more simple breakdowns on tech trends and drop a comment: What’s the wildest AI use you’ve seen? Let’s connect! #LearnAI #StayCurious',
          },
        ],
      },
    ],
    total_tweets: 10,
  },
  error: null,
};

// 本地模拟 ModifyTweet 响应数据
export const createLocalModifyTweetResponse = (originalOutline: Outline, tweetNumber: number, prompt: string): ModifyTweetResponse => {
  // 模拟AI编辑后的内容，更新对应的tweet
  const updatedNodes = originalOutline.nodes.map((node, index) => {
    if (index === tweetNumber - 1) {
      // 更新指定的tweet
      const enhancedContent = `${node.title} - ${prompt.substring(0, 20)}...（AI增强版）`;
      return {
        title: enhancedContent,
        tweets: [
          {
            tweet_number: 1,
            content: `🎯 ${enhancedContent}\n\n根据用户指令"${prompt}"进行AI优化：\n• 内容更加吸引人\n• 增强可读性\n• 符合社交媒体最佳实践\n\n#AI优化 #内容创作`,
            title: enhancedContent
          }
        ]
      };
    }
    return node;
  });

  return {
    outline: {
      nodes: updatedNodes,
      topic: originalOutline.topic,
      total_tweets: originalOutline.total_tweets
    },
    tweet_number: tweetNumber,
    modification_prompt: prompt
  };
};

// 本地模拟 ModifyOutline 响应数据
export const createLocalModifyOutlineResponse = (originalOutline: Outline, newOutlineStructure: Outline): ModifyOutlineResponse => {
  // 模拟API对大纲进行智能优化
  const enhancedNodes = newOutlineStructure.nodes.map((node, index) => ({
    title: `${node.title}（已优化）`,
    tweets: [
      {
        tweet_number: index + 1,
        content: `📝 ${node.title}（已优化）\n\n经过AI智能分析和优化：\n• 结构更清晰\n• 逻辑更连贯\n• 表达更准确\n\n#内容优化 #AI助手`,
        title: `${node.title}（已优化）`
      }
    ]
  }));

  return {
    status: 'success',
    updated_outline: {
      nodes: enhancedNodes,
      topic: `${newOutlineStructure.topic}（AI优化版）`,
      total_tweets: enhancedNodes.length
    },
    error: ''
  };
};
