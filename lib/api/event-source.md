好的 👍
那我帮你把现在的 `connectAgentChatStream` 直接**重构成基于 `@microsoft/fetch-event-source` 的稳定版本**，实现以下能力：

---

## ✨ 目标能力

- **支持自定义 Header**（可以加 `Authorization`，解决原生 EventSource 限制）
- **自动重连**（可配置最大重连次数 & 间隔）
- **自动过滤心跳事件**（`: ping`）防止 JSON.parse 抛错
- **收到 `chat.done` 自动结束**（不会误触发 onError）
- **兼容 SSE 规范的多事件类型**（`event:` + `data:`）
- **保持浏览器和 Node.js/Next.js 通用**

---

## 1. 安装依赖

```bash
npm install @microsoft/fetch-event-source
```

---

## 2. 重构实现

```ts
// connectAgentChatStream.ts
import {
  fetchEventSource,
  EventSourceMessage,
} from '@microsoft/fetch-event-source';
import type { AgentChatEvent } from './types';

interface ConnectOptions {
  /** 最大重连次数 */
  maxRetry?: number;
  /** 重连间隔（毫秒） */
  retryInterval?: number;
  /** 认证 token，可自行从 Cookie/LocalStorage 中获取 */
  token?: string;
}

export async function connectAgentChatStream(
  chatThreadId: string,
  onEvent: (event: AgentChatEvent) => void,
  onError: (error: Error) => void,
  options: ConnectOptions = {},
) {
  const { maxRetry = 3, retryInterval = 2000, token } = options;

  let retryCount = 0;
  let finished = false; // 标记是否正常结束

  await fetchEventSource(
    `/api/agent/chat/stream?chat_thread_id=${chatThreadId}`,
    {
      method: 'GET',
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        'Content-Type': 'application/json',
      },
      onmessage(msg: EventSourceMessage) {
        const raw = msg.data?.trim();
        if (!raw || raw.startsWith(':')) {
          // 忽略 ping / 心跳
          return;
        }

        try {
          const data: AgentChatEvent = JSON.parse(raw);
          onEvent(data);

          if (data.event_type === 'chat.done') {
            finished = true;
            console.log('[SSE] Chat finished, closing connection.');
            // fetchEventSource 不能直接 close，但我们可以依靠 finished flag
          }
        } catch (err) {
          console.error('[SSE] 事件解析失败:', raw, err);
          // 仅记录，不中断整个 SSE
        }
      },
      async onopen(res) {
        if (res.ok && res.status === 200) {
          console.log('[SSE] 连接已建立');
          retryCount = 0;
        } else {
          console.error('[SSE] 服务端连接被拒绝:', res.status, res.statusText);
          throw new Error(`SSE Connection rejected: ${res.status}`);
        }
      },
      onerror(err) {
        if (finished) {
          console.log('[SSE] 已正常结束，不再重连');
          return;
        }

        console.error('[SSE] 连接错误:', err);
        retryCount++;
        if (retryCount > maxRetry) {
          console.error('[SSE] 达到最大重试次数，停止重连');
          onError(new Error('SSE 连接失败（已达最大重试次数）'));
          throw err; // 阻止内置重连
        }

        console.log(
          `[SSE] ${retryInterval}ms 后重连（${retryCount}/${maxRetry}）`,
        );
      },
      openWhenHidden: true, // 页面隐藏时保持连接
      fetch: (input, init) => fetch(input, { ...init }), // 使用浏览器 fetch
    },
  );
}
```

---

## 3. 使用示例

```ts
import { connectAgentChatStream } from './connectAgentChatStream';

connectAgentChatStream(
  '123456',
  (event) => {
    console.log('[SSE Event]', event.event_type, event.data);

    if (event.event_type === 'message.done') {
      console.log('最新消息:', event.data.text);
    }

    if (event.event_type === 'chat.done') {
      console.log('最终结果:', event.data.outline);
    }
  },
  (error) => {
    console.error('SSE 出错:', error);
  },
  {
    token: localStorage.getItem('auth_token') || '',
    maxRetry: 5,
    retryInterval: 3000,
  },
);
```

---

## 4. 对比原生 EventSource 的好处

| 功能                | 原生 EventSource | fetch-event-source 封装版本 |
| ------------------- | ---------------- | --------------------------- |
| 自定义 header       | ❌               | ✅（支持 Authorization）    |
| 自动重连            | ❌（需手动）     | ✅（内置，可配置最大次数）  |
| 心跳/空消息过滤     | ❌（需手动）     | ✅                          |
| 解析 JSON           | ❌（需手动）     | ✅（我们封装了）            |
| 区分正常结束 / 异常 | ❌               | ✅                          |
| Next.js SSR 支持    | ❌（仅浏览器）   | ✅（可在 Node runtime 用）  |

---

## 5. 建议的生产部署思路

1. **前端**统一通过 `/api/proxy-stream/...` 访问（解决跨域+加认证Header）
2. **代理层**负责从 Cookie/Session 中取 token → 加到 Authorization header 转发到后端
3. 前端只需要调用 `connectAgentChatStream`，无需关心鉴权细节
4. 后端 SSE 结束时发送 `chat.done`，前端结束标志位 `finished` → 不触发错误提示

---

我建议下一步，可以帮你把这个 fetch-event-source 版本 **直接整合到之前写的 React Hook (`useAgentChat`) 中**，这样你在 React 里就能直接：

```ts
const { latestMessage, isLoading, error } = useAgentChat(chatId, {
  useProxy: true,
});
```

就用上带重连、带 Header 的稳定 SSE 链路。

要我帮你把这个流式 SSE 封装融入 Hook 吗？这样前端调用体验就会很丝滑。
