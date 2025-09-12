# 文章生成流式渲染（SSE + 打字机）PRD

本文档定义将 ArticleRenderer 生成阶段的加载体验由现有 CreateArticleLoading 替换为“流式渲染 + 打字机效果”的完整方案。方案支持通过环境变量一键启用/关闭流式加载，并保留原有 CreateArticleLoading 作为回退路径。

关键信息（结合补充要求）：
- 关闭/完成时直接切换到渲染组件：当 SSE 流结束（session.done 或连接关闭）后，立即切入文章渲染视图（可延时切换），不再出现 CreateArticleLoading；流式开关开启时，从开始到结束都不会出现 CreateArticleLoading。
- 流式“逐步叠加”而非替换：与自由对话的替换模式不同，本文方案要求对正文内容采用增量 append（累计字符串）的方式，打字机逐步呈现，不覆盖已输出的内容。


## 1. 背景与目标

- 背景：当前 ArticleRenderer 在生成阶段使用 CreateArticleLoading 做静态占位，等待后端返回完整结果再一次性渲染正文。已有“自由对话”功能实现了 SSE 流式渲染与打字机体验，但其实现是“替换模式”，与本文需求不同。
- 目标：
  - 在文章生成阶段提供“流式 + 打字机”的更好交互体验；
  - 用一个环境变量开关控制是否启用流式渲染，便于 A/B 与快速回退；
  - 完成后直接进入文章渲染视图，不出现 CreateArticleLoading；
  - 方案模块化、与现有自由对话解耦，降低回归风险。


## 2. 新旧流程对比与开关策略

- 新流程（流式开启，推荐，lite/analysis 模式可用）
  1) 进入 ArticleRenderer 的“生成阶段”时，不再调用原来的同步生成；
  2) 先调用“创建会话”接口获得 session_id；
  3) 使用 session_id 连接“流式生成” SSE；
  4) 前端根据事件逐步 append 正文，打字机呈现；
  5) 收到 session.done 携带的最终 outline 后：
     - 立即切换渲染文章主体（思维导图 + Markdown）；
     - CreateArticleLoading 全过程不参与。

- 旧流程（流式关闭或 deep 模式，保留回退能力）
  - 使用现有同步生成逻辑与 CreateArticleLoading 占位，生成完成后再切换到文章渲染。

- 一键开关（环境变量）
  - 新增 NEXT_PUBLIC_ENABLE_ARTICLE_STREAMING；
  - constants/env.ts 增加：
    - export const enableArticleStreaming = process.env.NEXT_PUBLIC_ENABLE_ARTICLE_STREAMING === 'true';
  - ArticleRenderer 基于该变量与模式分支：enableArticleStreaming 为 true 且 mode !== 'deep' 时走流式；否则（false 或 mode === 'deep'）保持旧逻辑。

注意：启用流式时，从开始到结束都不会出现 CreateArticleLoading；SSE 关闭/完成后直接切入渲染组件。


## 3. 服务端接口与代理（Next API Routes）

依据后端文档 lib/api/generate-sse-api.md：
- 创建会话：POST /api/twitter/generate/session → 返回 session_id；
- 流式生成：GET /api/twitter/generate/stream?session_id=... → SSE。

为保证前端同源与鉴权透传，新增 Next.js 路由：
- app/api/twitter/generate/stream/route.ts
  - 方法：GET
  - 动作：将 `?session_id=` 透传至 `${API_HOST}/api/twitter/generate/stream`；
  - 设置 Accept: text/event-stream、Cache-Control、Connection 头；注意 header 的透传，这关系到 auth 认证
  - 使用 TransformStream 将后端可读流直接 pipe 给前端，实现 SSE 代理。

要求：
- 将 Authorization 从请求头透传到后端；
- runtime 建议 nodejs；
- dynamic: 'force-dynamic' 以避免边缘缓存对 SSE 的影响；
- 出错时返回 4xx/5xx 以及错误说明。


## 4. 前端 API 封装（lib/api/article-generate.ts）

新增封装，风格对齐现有 lib/api/agent-chat.ts：
- createGenerateSession(payload)
  - 入参：{ user_input: string; content_format: 'thread'|'longform'; mode: 'lite'|'analysis'|'deep' }
  - POST /api/twitter/generate/session，返回 { session_id }
  - 对 deep（deep search）模式不支持流式：上层逻辑严格禁用流式（即使开关为 true），使用原有同步流程与 CreateArticleLoading；UI 可提示不支持流式。

- connectGenerateStream(sessionId, onEvent, onError, options)
  - GET /api/twitter/generate/stream?session_id=...
  - 基于 @microsoft/fetch-event-source 实现稳定 SSE 连接：
    - 处理 onopen、onmessage、onerror；
    - 忽略心跳（以 ':' 开头）与空行；
    - maxRetry、retryInterval、openWhenHidden 可配置；
    - 收到 session.done 后标记 finished 并主动 abort，以避免多余重连；
    - 返回包含 abort() 与 isFinished() 的控制器。

示例（伪代码）：
```ts
export async function connectGenerateStream(
  sessionId: string,
  onEvent: (evt: GenerateEvent) => void,
  onError: (err: Error) => void,
  opts?: { maxRetry?: number; retryInterval?: number; openWhenHidden?: boolean },
) {
  // 逻辑同 connectAgentChatStream，但 URL 与完成条件改为 session.done
}
```


## 5. 事件类型与“逐步叠加”策略（与自由对话的差异）

- 主要事件（参考 generate-sse-api.md）
  - session.start
  - analyze_input.start/done
  - fetch_url.start/done
  - web_search.start/done
  - generate_tweet.start/delta/done
  - extract_outline.start/done
  - session.done（带最终 outline）
  - error

- 叠加策略（核心差异点）
  - 对 generate_tweet.delta 读取 data.content，将其 append 到一个“累积的正文字符串 fullText”；
  - 不覆盖/替换之前的内容，始终在上次基础上增量更新；
  - StreamingTypewriter 每次拿到最新 fullText，自动根据前缀判断并连续打字；
  - 各 *.start/done 事件用于更新 streamingTitle（步骤提示），不影响正文叠加。

伪代码：
```ts
let fullText = '';

function handleEvent(evt: GenerateEvent) {
  switch (evt.event_type) {
    case 'generate_tweet.delta': {
      const delta = evt.data?.content ?? '';
      if (delta) {
        fullText += delta; // 关键：累加，不替换
        setStreamingText(fullText);
      }
      break;
    }
    case 'generate_tweet.start':
    case 'web_search.start':
    case 'web_search.done':
    case 'analyze_input.start':
    case 'analyze_input.done':
    case 'extract_outline.start':
    case 'extract_outline.done': {
      setStreamingTitle(evt.message || '');
      break;
    }
    case 'session.done': {
      onComplete?.(evt.data?.outline);
      // 外层据此切入渲染组件
      break;
    }
    case 'error': {
      onError?.(new Error(evt.data?.error || 'generate failed'));
      break;
    }
  }
}
```


## 6. Hook：useArticleStreaming（新增）

职责：封装 session 创建、SSE 连接、事件处理（叠加）、打字机控制、错误处理与清理。

签名：
```ts
interface UseArticleStreamingOptions {
  topic: string;
  contentFormat: 'thread' | 'longform';
  mode?: 'lite' | 'analysis' | 'deep';
  userInput?: string;
  enableTypewriter?: boolean;       // 默认 true
  typewriterSpeed?: number;         // 默认 20ms/char
  onComplete?: (outline: IOutline) => void;
  onError?: (err: Error) => void;
}

interface UseArticleStreamingReturn {
  isConnected: boolean;
  isStreaming: boolean;
  error: Error | null;
  streamingTitle?: string;          // 步骤提示
  streamingText: string;            // 叠加后的全文
  reconnect: () => void;
  abort: () => void;
}
```

要点：
- 首次挂载：先调用 createGenerateSession，拿到 session_id；随后 connectGenerateStream；
- onmessage：按第 5 节的叠加策略更新 streamingText；
- typewriter：复用 components/Renderer/sseChat/StreamingTypewriter；
- 完成：收到 session.done 后回调 onComplete，并停止流；
- 清理：卸载时 abort，清除定时器；
- 重试：暴露 reconnect，内部基于保存的 session_id 重新连接。


## 7. UI 组件：ArticleGenerateStreaming（新增）

职责：在“生成阶段”展示流式 UI，复用 AIMessage（复制一个组件，方便后期区分） + StreamingTypewriter 以最小改造实现标题与正文打字机效果。

形态：
- 轻量容器，样式可参考 CreateArticleLoading 保持整体风格统一；
- 内部使用 useArticleStreaming，获得 streamingTitle 与 streamingText；
- 组装 ChatMessage 对象传给 AIMessage：
  - status = 'streaming'
  - streamingTitle = 当前步骤提示
  - streamingContent = 叠加后的 streamingText
- 控件：返回按钮、错误态 Retry 按钮（调用 reconnect），出错信息展示；
- onComplete 时触发父级回调（传回 outline），由外层切入文章渲染；
- 整个流式流程中不出现 CreateArticleLoading。

示意：
```tsx
export function ArticleGenerateStreaming(props) {
  const { streamingTitle, streamingText, isStreaming, error, reconnect } =
    useArticleStreaming(/* ... */);

  const aiMessage = {
    id: 'streaming',
    type: 'ai',
    content: '',
    status: isStreaming ? 'streaming' : error ? 'error' : 'complete',
    streamingTitle,
    streamingContent: streamingText,
  } as ChatMessage;

  return (
    <div className="h-screen flex items-center justify-center">
      <AIMessage message={aiMessage} isStreaming={isStreaming} />
      {error && <button onClick={reconnect}>Retry</button>}
    </div>
  );
}
```


## 8. 与 ArticleRenderer 集成

- constants/env.ts：新增导出 enableArticleStreaming；
- ArticleRenderer.tsx：
  - 原“自动开始生成”的 useEffect 中，加入条件：仅当 !(enableArticleStreaming && mode !== 'deep') 时才调 generation.startGeneration（走旧逻辑）。
  - 在“生成中 / 尚无数据”的 early return 分支：
    - 若 enableArticleStreaming === true 且 mode !== 'deep'：渲染 <ArticleGenerateStreaming ...>；
      - onComplete(outline) → 走原来的 onGenerationComplete 流程（convertThreadDataToMindmap → setCurrentNodes/Edges），自然切入正文；
      - 从开始到结束均不出现 CreateArticleLoading；
    - 否则（包括 enableArticleStreaming === false 或 mode === 'deep'）：渲染旧版 CreateArticleLoading（保持回退路径）。

强调：当 SSE 关闭/完成（session.done）时直接切入文章渲染，不出现 CreateArticleLoading。


## 9. 错误处理与回退

- SSE 连接异常：
  - connectGenerateStream 内置最大重试（默认 3 次），间隔 2s（可配）；
  - 超过重试上限：useArticleStreaming 设置 error，UI 显示错误提示与 Retry 按钮；
- 业务错误事件（error）：
  - 展示后端 message；
  - 可允许重试；
- 回退策略：
  - 配置开关为 false 即回到旧流程（CreateArticleLoading + 同步生成）。


## 10. 性能与体验

- 打字机速度：默认 20–30ms/字符；长文本可动态加速（如 >5k 字每次追加多字符）。
- 滚动：必要时可自动滚动到末尾，参考 sseChat/MessageList 的实现。文章主视图切入后保留现有滚动与图片处理逻辑。
- 资源清理：严格在卸载与完成时 abort SSE、清理定时器，避免内存泄漏。


## 11. 安全与鉴权

- Next API 路由转发 Authorization 头；
- 客户端 connectGenerateStream 使用与 agent-chat 一致的 token 获取方式；
- SSE Headers：Accept: text/event-stream, Cache-Control: no-cache, Connection: keep-alive；
- dynamic: 'force-dynamic'，runtime: 'nodejs'。


## 12. 落地任务清单

新增文件：
- app/api/twitter/generate/session/route.ts（POST 代理）
- app/api/twitter/generate/stream/route.ts（GET SSE 代理）
- lib/api/article-generate.ts（封装 createGenerateSession / connectGenerateStream）
- hooks/useArticleStreaming.ts（流式聚合 + 打字机）
- types/generate-stream.ts（事件类型）
- components/Renderer/ArticleGenerateStreaming.tsx（UI 容器）

修改文件：
- constants/env.ts（导出 enableArticleStreaming）
- components/Renderer/ArticleRenderer.tsx（按开关分支渲染；启用时不再触发旧生成；完成后直接切入正文）


## 13. 验收标准

- 开关为 true：
  - 进入生成阶段后显示流式 UI（AIMessage + 打字机），内容逐步“叠加”而非替换；
  - 步骤提示（streamingTitle）随事件变化；
  - 收到 session.done 后立即进入文章渲染（思维导图 + Markdown）；
  - 全程不出现 CreateArticleLoading；
  - 断线重试、错误提示与重试按钮可用。

- 开关为 false：
  - 仍走旧流程：CreateArticleLoading + 同步生成；
  - 生成完成后切入文章渲染，现有能力不受影响。
- 深度模式（deep / deep search）：
  - 无论开关是否开启，均走旧流程（CreateArticleLoading + 同步生成）；
  - ArticleRenderer 顶层按 mode === 'deep' 强制禁用流式。


## 14. 测试用例建议

- 正常流程（lite/analysis）：
  - delta 事件频繁：确认叠加正确、无闪烁；
  - session.done 正常收敛：切入正文。
- SSE 断线与重连：
  - 人为中断网络，观察自动重试；
  - 超过重试阈值显示错误并可 Retry。
- 错误事件：
  - 后端返回 error，前端正确展示 message 可重试。
- 长文与性能：
  - >5k 字内容，打字机仍流畅（必要时加速策略）。
- 回退路径：
  - 开关 false 验证旧流程完整可用。


## 15. 备注与扩展

- 如需将“步骤提示”与“正文区域”分区展示，可在 ArticleGenerateStreaming 中分列显示（顶部步骤、下方正文）。
- 后续可将“流式导出两栏模式”（左侧步骤日志、右侧正文）作为可选样式，通过 props 控制。
- 可增加埋点：SSE 建连耗时、delta 频率、总时长、错误率，用于体验优化。
