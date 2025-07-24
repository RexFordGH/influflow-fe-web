## 后端接口和格式

接口说明：下面是一个完整的sse例子，主要包含4个阶段，extract url，user input analysis，web search，generate tweet。其中extract url和 web search这两个阶段是optional的，只有prompt里的条件出发到了才会执行，剩下两个是一定有的，然后最后一个事件里会包含完整数据，并且有个标记 is_final标记。现在只generate tweet阶段才有有data数据，其他三个暂时不放了， 先简单做，之后有需要可以放一些结果，比如搜索的文章链接之类的

## 流式Loading组件实现方案

### 设计目标
- 替换现有的模拟loading组件，使用真实的SSE流式输出
- 左侧展示阶段状态，右侧实时流式展示content内容
- 减缓用户等待焦虑，提供更好的用户体验

### 组件架构

#### 1. SSELoadingComponent 主组件
```typescript
interface SSELoadingComponentProps {
  topic: string;
  userInput: string;
  contentFormat: 'longform' | 'article';
  onComplete: (data: any) => void;
  onError: (error: Error) => void;
  onBack: () => void;
}
```

#### 2. 数据结构设计
```typescript
interface StageInfo {
  id: string;
  name: string;
  displayName: string;
  status: 'pending' | 'in_progress' | 'completed';
  content?: string;
  progress?: Array<{
    type: string;
    message: string;
    data?: any;
  }>;
}

const STAGES: Record<string, StageInfo> = {
  extract_url: {
    id: 'extract_url',
    name: 'extract_url',
    displayName: '提取URL内容',
    status: 'pending'
  },
  analysis_user_input: {
    id: 'analysis_user_input', 
    name: 'analysis_user_input',
    displayName: '分析用户输入',
    status: 'pending'
  },
  web_search: {
    id: 'web_search',
    name: 'web_search', 
    displayName: '搜索相关内容',
    status: 'pending'
  },
  generate_tweet: {
    id: 'generate_tweet',
    name: 'generate_tweet',
    displayName: '生成内容',
    status: 'pending'
  }
};
```

#### 3. UI布局设计
- 左侧：阶段列表（固定宽度300px）
  - 每个阶段显示：图标 + 阶段名称
  - 状态指示：pending(灰色) → in_progress(蓝色loading) → completed(绿色勾)
- 右侧：内容展示区域（自适应宽度）
  - 标题：当前处理的阶段名称
  - 内容：流式输出的文本内容，支持markdown渲染
  - generate_tweet阶段：展示topic、section、tweet等结构化信息

#### 4. SSE连接管理
```typescript
// 使用EventSource API建立SSE连接
const eventSource = new EventSource('/api/twitter/generate/stream');

// 处理不同事件类型
eventSource.addEventListener('progress', (event) => {
  const data = JSON.parse(event.data);
  // 更新阶段状态和内容
});

eventSource.addEventListener('success', (event) => {
  const data = JSON.parse(event.data);
  // 处理完成状态
});

eventSource.addEventListener('error', (event) => {
  // 错误处理
});
```

#### 5. 动画效果
- 阶段切换：淡入淡出过渡
- 内容流式输出：逐字显示效果（typewriter effect）
- Loading状态：旋转动画
- 完成状态：弹性动画

### 实现细节

#### 1. 流式内容渲染
- generate_tweet阶段特殊处理：
  - 识别topic时显示主题
  - 新section时显示分隔线和标题
  - tweet内容以卡片形式展示
  
#### 2. 错误处理
- 网络断开重连机制
- 超时处理（设置合理的timeout）
- 错误状态UI展示

#### 3. 性能优化
- 使用React.memo避免不必要的重渲染
- 虚拟滚动处理长内容
- 防抖处理频繁的SSE消息

### 技术栈
- React + TypeScript
- EventSource API (原生SSE支持)
- Framer Motion (动画)
- @heroui/react (UI组件)
- Tailwind CSS (样式)

## 生成文章流程说明

### 1. 流程概述
用户输入话题 → 显示Loading组件 → 调用生成接口 → 展示ArticleRenderer

### 2. 详细流程

#### 2.1 用户输入（WelcomeScreen.tsx）
- 用户在输入框输入话题
- 按Enter键触发`handleTopicSubmit`事件
- 传递参数：`topic`（话题）和`contentFormat`（内容格式：'longform' | 'thread'）

#### 2.2 展示ArticleRenderer组件
ArticleRenderer组件接收以下props：
```typescript
interface ArticleRendererProps {
  topic: string;
  contentFormat: ContentFormat;
  onBack: () => void;
  initialData?: Outline;
  onDataUpdate?: () => void;
}
```

#### 2.3 Loading阶段（CreateArticleLoading）
- 当前使用`CreateArticleLoading`组件显示模拟的加载动画
- 显示5个生成步骤，通过定时器模拟进度
- API完成后快速完成剩余动画

#### 2.4 API调用
- 调用`/api/twitter/generate/thread`接口（非流式）
- 获取完整数据后渲染思维导图和Markdown内容

### 3. SSE流式改造计划

#### 3.1 切换机制
- 保留原有的`CreateArticleLoading`组件
- 新增`SSELoadingComponent`组件
- 通过环境变量或feature flag控制使用哪个Loading组件
```typescript
const LoadingComponent = useSSELoading ? SSELoadingComponent : CreateArticleLoading;
```

#### 3.2 接口切换
- 原接口：`/api/twitter/generate/thread`（一次性返回）
- 新接口：`/api/twitter/generate/stream`（SSE流式返回）

#### 3.3 数据处理
- SSE接收的数据需要累积处理
- 最后的success事件包含完整数据（is_final: true）
- 使用完整数据更新ArticleRenderer的状态

### 4. SSE代理服务需求

#### 4.1 现有代理服务
- 路径：`/api/proxy/[...slug]`
- 作用：处理跨域请求，支持长时间API调用（10-30s）
- 当前实现：使用fetch转发请求，返回完整响应

#### 4.2 SSE流式代理需求
当前代理服务使用`response.body`直接返回，理论上支持流式响应，但需要验证：
1. 是否正确转发SSE相关headers（Content-Type: text/event-stream）
2. 是否支持长连接保持
3. 是否需要特殊处理SSE的chunk传输

#### 4.3 实现方案
**方案一：复用现有代理（推荐）**
- 验证现有代理对SSE的支持
- 确保正确处理`text/event-stream`响应
- 测试流式数据传输

**方案二：新增专用SSE代理**
- 创建`/api/proxy-sse/[...slug]`
- 专门处理SSE请求
- 优化流式传输性能

接口 api
```sh
/api/twitter/generate/stream

request: { user_input: '', content_format: 'longform' | 'article'}

response

id: -7459889135036400912
event: progress
data: {"status": "progress", "data": {"event_type": "stage_start", "stage": "extract_url", "message": "Starting URL content extraction"}}

id: -2726893694909341001
event: progress
data: {"status": "progress", "data": {"event_type": "stage_end", "stage": "extract_url", "message": "URL content extraction completed"}}

id: 5533762575719323440
event: progress
data: {"status": "progress", "data": {"event_type": "stage_start", "stage": "analysis_user_input", "message": "Starting user input analysis"}}

id: 9067686947917963007
event: progress
data: {"status": "progress", "data": {"event_type": "stage_end", "stage": "analysis_user_input", "message": "User input analysis completed"}}

id: -1510027477985502501
event: progress
data: {"status": "progress", "data": {"event_type": "stage_start", "stage": "web_search", "message": "Starting web search"}}

: ping - 2025-07-21 09:38:27.247455+00:00

id: 3832356358096362745
event: progress
data: {"status": "progress", "data": {"event_type": "stage_end", "stage": "web_search", "message": "Web Search completed"}}

id: -8440446563663393546
event: progress
data: {"status": "progress", "data": {"event_type": "stage_start", "stage": "generate_tweet", "message": "Starting tweet generation"}}

id: -990087187039734968
event: progress
data: {"status": "progress", "data": {"event_type": "stage_progress", "stage": "generate_tweet", "message": "Identified topic: what is btc", "data": {"type": "topic", "topic": "what is btc"}}}

id: -2862913100443690232
event: progress
data: {"status": "progress", "data": {"event_type": "stage_progress", "stage": "generate_tweet", "message": "Starting new section: Introduction to Bitcoin", "data": {"type": "section", "section_title": "Introduction to Bitcoin"}}}

id: -8404278223506348592
event: progress
data: {"status": "progress", "data": {"event_type": "stage_progress", "stage": "generate_tweet", "message": "Generated tweet #1", "data": {"type": "tweet", "tweet_number": 1, "tweet_title": "The truth about Bitcoin (BTC) revealed! 🚀", "section_title": "Introduction to Bitcoin", "tweet_content": "Bitcoin is digital gold—a decentralized, open network where you can send money globally without banks or middlemen. It’s secure, transparent, and immutable. Ready to unlock the future of money? Let’s dive in! #Bitcoin #Crypto"}}}

id: -2650891512753226590
event: progress
data: {"status": "progress", "data": {"event_type": "stage_progress", "stage": "generate_tweet", "message": "Starting new section: Bitcoin’s Origins and Basics", "data": {"type": "section", "section_title": "Bitcoin’s Origins and Basics"}}}

id: 958618827254381198
event: progress
data: {"status": "progress", "data": {"event_type": "stage_progress", "stage": "generate_tweet", "message": "Generated tweet #2", "data": {"type": "tweet", "tweet_number": 2, "tweet_title": "Who created Bitcoin? 🤔", "section_title": "Bitcoin’s Origins and Basics", "tweet_content": "Bitcoin launched in 2009 by the mysterious Satoshi Nakamoto. It was the first decentralized cryptocurrency, designed to be a peer-to-peer digital cash system without any single controlling entity. #BTC #Blockchain"}}}

id: 1417739043113888482
event: progress
data: {"status": "progress", "data": {"event_type": "stage_progress", "stage": "generate_tweet", "message": "Generated tweet #3", "data": {"type": "tweet", "tweet_number": 3, "tweet_title": "What makes BTC special?", "section_title": "Bitcoin’s Origins and Basics", "tweet_content": "Bitcoin runs on a decentralized blockchain—a public ledger everyone can see, but no one can alter. This means transactions are transparent and irreversible, making fraud almost impossible. #DigitalGold"}}}

id: -4159998926260522890
event: progress
data: {"status": "progress", "data": {"event_type": "stage_progress", "stage": "generate_tweet", "message": "Starting new section: How Bitcoin Works", "data": {"type": "section", "section_title": "How Bitcoin Works"}}}

id: 7178072160310794243
event: progress
data: {"status": "progress", "data": {"event_type": "stage_progress", "stage": "generate_tweet", "message": "Generated tweet #4", "data": {"type": "tweet", "tweet_number": 4, "tweet_title": "How do Bitcoin transactions happen?", "section_title": "How Bitcoin Works", "tweet_content": "BTC transfers happen directly between wallets globally, 24/7, without banks or credit card companies. Each wallet has a unique address, acting like an ID. This peer-to-peer system is fast and cheap! #CryptoPayments"}}}

id: -4029582354942147354
event: progress
data: {"status": "progress", "data": {"event_type": "stage_progress", "stage": "generate_tweet", "message": "Generated tweet #5", "data": {"type": "tweet", "tweet_number": 5, "tweet_title": "Is Bitcoin anonymous?", "section_title": "How Bitcoin Works", "tweet_content": "Not exactly. Bitcoin offers pseudo-anonymity: you use wallet addresses, not personal info, but transactions are public on the blockchain. You can generate new addresses to protect privacy, but your activity can still be traced. #Privacy"}}}

id: -8505715756359160801
event: progress
data: {"status": "progress", "data": {"event_type": "stage_progress", "stage": "generate_tweet", "message": "Starting new section: Why People Use Bitcoin", "data": {"type": "section", "section_title": "Why People Use Bitcoin"}}}

id: -1562528752141547410
event: progress
data: {"status": "progress", "data": {"event_type": "stage_progress", "stage": "generate_tweet", "message": "Generated tweet #6", "data": {"type": "tweet", "tweet_number": 6, "tweet_title": "Why do people use Bitcoin? Here are 3 key reasons:", "section_title": "Why People Use Bitcoin", "tweet_content": "1️⃣ Digital gold: scarce and valuable store of wealth  \n2️⃣ Fast, low-cost global transfers  \n3️⃣ Gateway to crypto, blockchain, and Web3 tech innovation  \nBitcoin is more than money—it’s a revolution. #BitcoinUses"}}}

id: 6732275613397200892
event: progress
data: {"status": "progress", "data": {"event_type": "stage_progress", "stage": "generate_tweet", "message": "Starting new section: Bitcoin Today and Beyond", "data": {"type": "section", "section_title": "Bitcoin Today and Beyond"}}}

id: -5631873599646187827
event: progress
data: {"status": "progress", "data": {"event_type": "stage_progress", "stage": "generate_tweet", "message": "Generated tweet #7", "data": {"type": "tweet", "tweet_number": 7, "tweet_title": "Bitcoin is still the king 👑", "section_title": "Bitcoin Today and Beyond", "tweet_content": "BTC remains the largest cryptocurrency by market cap and has inspired a global crypto movement. Some countries, like El Salvador, even adopted it as legal tender. The future of finance is being rewritten by Bitcoin. #BTC #FutureOfMoney"}}}

id: -6889081295467216106
event: progress
data: {"status": "progress", "data": {"event_type": "stage_progress", "stage": "generate_tweet", "message": "Generated tweet #8", "data": {"type": "tweet", "tweet_number": 8, "tweet_title": "For developers and tech lovers 🧑‍💻", "section_title": "Bitcoin Today and Beyond", "tweet_content": "Bitcoin’s open-source code (mostly C++) invites innovation. As a developer, exploring BTC means diving into blockchain, cryptography, and decentralized systems—foundations shaping tomorrow’s tech landscape. #Web3 #BlockchainDev"}}}

id: -3852479033615305523
event: progress
data: {"status": "progress", "data": {"event_type": "stage_progress", "stage": "generate_tweet", "message": "Starting new section: Wrap-Up and Invitation", "data": {"type": "section", "section_title": "Wrap-Up and Invitation"}}}

id: 3213480440902399023
event: progress
data: {"status": "progress", "data": {"event_type": "stage_end", "stage": "generate_tweet", "message": "Tweet generation completed", "data": {"outline": {"topic": "what is btc", "content_format": "thread", "nodes": [{"title": "Introduction to Bitcoin", "leaf_nodes": [{"title": "The truth about Bitcoin (BTC) revealed! 🚀", "tweet_number": 1, "tweet_content": "Bitcoin is digital gold—a decentralized, open network where you can send money globally without banks or middlemen. It’s secure, transparent, and immutable. Ready to unlock the future of money? Let’s dive in! #Bitcoin #Crypto"}]}, {"title": "Bitcoin’s Origins and Basics", "leaf_nodes": [{"title": "Who created Bitcoin? 🤔", "tweet_number": 2, "tweet_content": "Bitcoin launched in 2009 by the mysterious Satoshi Nakamoto. It was the first decentralized cryptocurrency, designed to be a peer-to-peer digital cash system without any single controlling entity. #BTC #Blockchain"}, {"title": "What makes BTC special?", "tweet_number": 3, "tweet_content": "Bitcoin runs on a decentralized blockchain—a public ledger everyone can see, but no one can alter. This means transactions are transparent and irreversible, making fraud almost impossible. #DigitalGold"}]}, {"title": "How Bitcoin Works", "leaf_nodes": [{"title": "How do Bitcoin transactions happen?", "tweet_number": 4, "tweet_content": "BTC transfers happen directly between wallets globally, 24/7, without banks or credit card companies. Each wallet has a unique address, acting like an ID. This peer-to-peer system is fast and cheap! #CryptoPayments"}, {"title": "Is Bitcoin anonymous?", "tweet_number": 5, "tweet_content": "Not exactly. Bitcoin offers pseudo-anonymity: you use wallet addresses, not personal info, but transactions are public on the blockchain. You can generate new addresses to protect privacy, but your activity can still be traced. #Privacy"}]}, {"title": "Why People Use Bitcoin", "leaf_nodes": [{"title": "Why do people use Bitcoin? Here are 3 key reasons:", "tweet_number": 6, "tweet_content": "1️⃣ Digital gold: scarce and valuable store of wealth  \n2️⃣ Fast, low-cost global transfers  \n3️⃣ Gateway to crypto, blockchain, and Web3 tech innovation  \nBitcoin is more than money—it’s a revolution. #BitcoinUses"}]}, {"title": "Bitcoin Today and Beyond", "leaf_nodes": [{"title": "Bitcoin is still the king 👑", "tweet_number": 7, "tweet_content": "BTC remains the largest cryptocurrency by market cap and has inspired a global crypto movement. Some countries, like El Salvador, even adopted it as legal tender. The future of finance is being rewritten by Bitcoin. #BTC #FutureOfMoney"}, {"title": "For developers and tech lovers 🧑‍💻", "tweet_number": 8, "tweet_content": "Bitcoin’s open-source code (mostly C++) invites innovation. As a developer, exploring BTC means diving into blockchain, cryptography, and decentralized systems—foundations shaping tomorrow’s tech landscape. #Web3 #BlockchainDev"}]}]}}}}

id: db4adfbb-a9f8-4654-8b2b-d2fefc32ed80
event: success
data: {"status": "success", "data": {"id": "db4adfbb-a9f8-4654-8b2b-d2fefc32ed80", "topic": "what is btc", "content_format": "thread", "nodes": [{"title": "Introduction to Bitcoin", "tweets": [{"tweet_number": 1, "title": "The truth about Bitcoin (BTC) revealed! 🚀", "content": "Bitcoin is digital gold—a decentralized, open network where you can send money globally without banks or middlemen. It’s secure, transparent, and immutable. Ready to unlock the future of money? Let’s dive in! #Bitcoin #Crypto", "image_url": null}]}, {"title": "Bitcoin’s Origins and Basics", "tweets": [{"tweet_number": 2, "title": "Who created Bitcoin? 🤔", "content": "Bitcoin launched in 2009 by the mysterious Satoshi Nakamoto. It was the first decentralized cryptocurrency, designed to be a peer-to-peer digital cash system without any single controlling entity. #BTC #Blockchain", "image_url": null}, {"tweet_number": 3, "title": "What makes BTC special?", "content": "Bitcoin runs on a decentralized blockchain—a public ledger everyone can see, but no one can alter. This means transactions are transparent and irreversible, making fraud almost impossible. #DigitalGold", "image_url": null}]}, {"title": "How Bitcoin Works", "tweets": [{"tweet_number": 4, "title": "How do Bitcoin transactions happen?", "content": "BTC transfers happen directly between wallets globally, 24/7, without banks or credit card companies. Each wallet has a unique address, acting like an ID. This peer-to-peer system is fast and cheap! #CryptoPayments", "image_url": null}, {"tweet_number": 5, "title": "Is Bitcoin anonymous?", "content": "Not exactly. Bitcoin offers pseudo-anonymity: you use wallet addresses, not personal info, but transactions are public on the blockchain. You can generate new addresses to protect privacy, but your activity can still be traced. #Privacy", "image_url": null}]}, {"title": "Why People Use Bitcoin", "tweets": [{"tweet_number": 6, "title": "Why do people use Bitcoin? Here are 3 key reasons:", "content": "1️⃣ Digital gold: scarce and valuable store of wealth  \n2️⃣ Fast, low-cost global transfers  \n3️⃣ Gateway to crypto, blockchain, and Web3 tech innovation  \nBitcoin is more than money—it’s a revolution. #BitcoinUses", "image_url": null}]}, {"title": "Bitcoin Today and Beyond", "tweets": [{"tweet_number": 7, "title": "Bitcoin is still the king 👑", "content": "BTC remains the largest cryptocurrency by market cap and has inspired a global crypto movement. Some countries, like El Salvador, even adopted it as legal tender. The future of finance is being rewritten by Bitcoin. #BTC #FutureOfMoney", "image_url": null}, {"tweet_number": 8, "title": "For developers and tech lovers 🧑‍💻", "content": "Bitcoin’s open-source code (mostly C++) invites innovation. As a developer, exploring BTC means diving into blockchain, cryptography, and decentralized systems—foundations shaping tomorrow’s tech landscape. #Web3 #BlockchainDev", "image_url": null}]}], "total_tweets": 8}, "thread_id": "db4adfbb-a9f8-4654-8b2b-d2fefc32ed80", "is_final": true}
```