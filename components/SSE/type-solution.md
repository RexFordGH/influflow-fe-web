你现在的行为是：每来一条 tweet 就渲染一个 `<ReactTyped>`，于是**多条同时“打字”**。要实现“串行打字（只打一条，完了再打下一条）”，核心就是**把并发改成排队**。

下面给两种可直接落地的做法，保留你现有的 SSE 解析与 UI 结构（`topic / section / tweet` 三种 item 仍按你现在的逻辑 push）&#x20;

---

# 做法 A：单通道打字（推荐，最少改动）

思路：维护

* `finished: Set<number>` —— 已完成的 tweet\_number
* `active: number | null` —— 当前正在打字的 tweet\_number（只允许一个）
* 当新 tweet 到达时，如果 `active` 为空，就把它设为 `active`；否则进入等待；
* `<ReactTyped>` 只渲染到 `active` 那张卡片；其它未开始的 tweet 只展示标题或“等待中”占位；
* 在 `<ReactTyped onComplete>` 里把 `active` 标记为完成并推进到下一个。

### 关键代码（嵌到你现有的 `SSELoading` 中）

```tsx
// 1) 新增状态
const [finished, setFinished] = useState<Set<number>>(new Set());
const [active, setActive] = useState<number | null>(null);

// 2) 计算待打字的“下一条”
const tweets = useMemo(
  () => items.filter(i => i.type === 'tweet').sort((a,b) => (a.tweet_number ?? 0) - (b.tweet_number ?? 0)),
  [items]
);

// 3) 当 items/finished 变化时，挑选下一条作为 active
useEffect(() => {
  if (active != null) return; // 正在打，不切换
  const next = tweets.find(t => !finished.has(t.tweet_number!));
  if (next) setActive(next.tweet_number!);
}, [tweets, finished, active]);

// 4) 为了避免 StrictMode 双调用，防御 onComplete 重复推进
const completeGuardRef = useRef<Record<number, boolean>>({});

// 5) 渲染 tweet 卡片：只有 active 才打字，其它要么展示全文（已完成）要么占位（未开始）
{tweets.map((it) => {
  const isDone = finished.has(it.tweet_number!);
  const isActive = active === it.tweet_number;

  return (
    <div key={`tweet-${it.tweet_number}`} className="rounded-lg border p-3 bg-white/60">
      <div className="text-sm font-semibold mb-1">#{it.tweet_number} {it.tweet_title || ''}</div>
      <div className="whitespace-pre-wrap leading-relaxed font-mono text-sm">
        {isDone && (it.tweet_content ?? '')}
        {!isDone && !isActive && <span className="text-gray-400">等待上一段完成…</span>}
        {isActive && (
          <ReactTyped
            key={`typing-${it.tweet_number}`} // 确保只为当前 active 实例化
            strings={[it.tweet_content ?? '']}
            typeSpeed={30}
            backSpeed={0}
            showCursor={false}
            loop={false}
            smartBackspace={false}
            onComplete={() => {
              if (completeGuardRef.current[it.tweet_number!]) return;
              completeGuardRef.current[it.tweet_number!] = true;

              setFinished(prev => {
                const s = new Set(prev);
                s.add(it.tweet_number!);
                return s;
              });
              // 推进到下一条（useEffect 会自动选中）
              setActive(null);
            }}
          />
        )}
      </div>
    </div>
  );
})}
```

要点：

* **只让 `active` 那条挂着 `<ReactTyped>`**，其它不打；这样天然串行。
* 推进用 `onComplete`，避免自己计时或轮询。
* 如果后端乱序到达，也没问题：我们用 `tweet_number` 排序（或你也可以按“到达顺序”排队）。

---

# 做法 B：集中打字器 + 输出缓存

思路：维护一个**全局“打字器”**（只实例化一个 `<ReactTyped>`），把待输出的文本（每条 tweet 的 `content`）塞进**队列**，在一个容器中逐条打字；每条完成后把最终文本**回填**到自己的 tweet 卡片，再取队头继续打。

实现步骤：

1. `queue: Array<{id: number, text: string}>`
2. `current: {id: number, text: string} | null`
3. 容器 `<div id="typewriter-output">` 放一个 `<ReactTyped>`，`strings={[current?.text ?? '']}`
4. `onComplete`：把 `current` 的 `text` 写入对应 tweet 卡片的“静态内容”里，然后 `setCurrent(null)`；`useEffect` 观察 `current` 为空且 `queue` 非空，就 `setCurrent(queue[0])` 并 `queue.shift()`。
5. Tweet 卡片本身**不渲染 `<ReactTyped>`**，只负责显示“静态内容”；真正的打字器只有一个。

优点：不会存在“多条同时打”的可能，Typed.js 只实例化一个；缺点是需要一个额外的“输出预览区”（或者把这个“集中打字器”直接渲染在当前 active 的 tweet 卡片里，也可）。

---

## 推荐与小贴士

* 如果你希望视觉上就在**每张卡片内**打字，选 **做法 A**；
* 如果你愿意有一个“正在输出区”，并在完成后写回卡片，选 **做法 B**（更省资源，因为永远只有一个 Typed 实例）。

无论哪种做法，你已有的 SSE 事件分发（`topic/section/tweet`）、阶段进度和自动滚动逻辑都不用改动，主要就是\*\*把“并发渲染 Typed”改成“仅对 active 渲染 Typed”\*\*即可。&#x20;

需要我把完整补丁按你的文件结构贴好，我可以直接给出可粘贴版本。
