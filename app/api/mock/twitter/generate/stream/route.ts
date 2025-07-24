import { NextRequest } from 'next/server';

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function rndId() {
  // simple random id for SSE id field
  return Math.floor(Math.random() * Number.MAX_SAFE_INTEGER).toString();
}

function jsonEvent(id: string, event: string, data: any) {
  return `id: ${id}\nevent: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
}

function comment(text: string) {
  return `: ${text}\n`;
}

function nowIso() {
  return new Date().toISOString();
}

function pickTopic(userInput?: string, override?: string) {
  if (override) return override;
  if (!userInput) return 'Sample Topic';
  const text = decodeURIComponent(userInput).trim();
  if (!text) return 'Sample Topic';
  // take first 6 words as topic
  return text.split(/\s+/).slice(0, 6).join(' ');
}

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);

    // 支持两种方式：直接 query 传 user_input/content_format，或 data=JSON
    let user_input = url.searchParams.get('user_input') || '';
    let content_format = url.searchParams.get('content_format') || 'thread';
    const dataStr = url.searchParams.get('data');
    if (dataStr) {
      try {
        const parsed = JSON.parse(decodeURIComponent(dataStr));
        user_input = parsed.user_input ?? user_input;
        content_format = parsed.content_format ?? content_format;
      } catch {}
    }

    const delay_ms_param = url.searchParams.get('delay_ms');
    const delayMsBase = Math.max(
      50,
      Math.min(2000, parseInt(delay_ms_param || '100', 10) || 100),
    );
    const with_search = url.searchParams.get('with_search') === 'true';
    const force_error = url.searchParams.get('force_error') === 'true';
    const topicOverride = url.searchParams.get('topic') || undefined;

    const topic = pickTopic(user_input, topicOverride);

    const encoder = new TextEncoder();

    const stream = new ReadableStream<Uint8Array>({
      async start(controller) {
        const enqueue = (text: string) =>
          controller.enqueue(encoder.encode(text));
        const sendProgress = async (payload: any, delay = delayMsBase) => {
          enqueue(
            jsonEvent(rndId(), 'progress', {
              status: 'progress',
              data: payload,
            }),
          );
          await sleep(delay + Math.floor(Math.random() * 50));
        };
        const sendComment = async (text: string) => {
          enqueue(comment(text));
          await sleep(50);
        };

        try {
          // 1) 可选 extract_url
          const needExtract =
            with_search || /(https?:\/\/\S+)/i.test(user_input);
          await sendProgress({
            event_type: 'stage_start',
            stage: 'extract_url',
            message: 'Starting URL content extraction',
          });
          await sendProgress({
            event_type: 'stage_end',
            stage: 'extract_url',
            message: 'URL content extraction completed',
          });

          // 2) analysis_user_input
          await sendProgress({
            event_type: 'stage_start',
            stage: 'analysis_user_input',
            message: 'Starting user input analysis',
          });
          await sendProgress({
            event_type: 'stage_end',
            stage: 'analysis_user_input',
            message: 'User input analysis completed',
          });

          // 3) 可选 web_search
          await sendProgress({
            event_type: 'stage_start',
            stage: 'web_search',
            message: 'Starting web search',
          });
          await sendComment(`ping - ${nowIso()}`);
          await sendProgress({
            event_type: 'stage_end',
            stage: 'web_search',
            message: 'Web Search completed',
          });

          // 4) generate_tweet
          await sendProgress({
            event_type: 'stage_start',
            stage: 'generate_tweet',
            message: 'Starting tweet generation',
          });
          await sendProgress({
            event_type: 'stage_progress',
            stage: 'generate_tweet',
            message: `Identified topic: ${topic}`,
            data: { type: 'topic', topic },
          });

          const sections = [
            'Introduction',
            'Key Concepts',
            'Use Cases',
            'Wrap-Up',
          ];

          const tweets: Array<{
            section: string;
            title: string;
            content: string;
          }> = [];
          let tweetNumber = 1;

          for (const section of sections) {
            await sendProgress({
              event_type: 'stage_progress',
              stage: 'generate_tweet',
              message: `Starting new section: ${section}`,
              data: { type: 'section', section_title: section },
            });
            // 生成示例推文，每节 2 条
            for (let i = 0; i < 2; i++) {
              const title = `${section} - Insight ${i + 1}`;
              
              // 生成较短的测试内容
              const contentTemplates = [
                `关于 ${topic} 的 ${section} - 第 ${i + 1} 部分。\n这是一段测试内容，用于演示打字机效果。`,
                `${section} 阶段的第 ${i + 1} 个关键点。\n通过串行打字展示流式输出。`,
                `探索 ${topic} 在 ${section} 中的应用 #${i + 1}。\n简短的内容便于快速测试。`
              ];
              
              // 随机选择一个内容模板
              const content = contentTemplates[Math.floor(Math.random() * contentTemplates.length)] + `\n\n#${topic.replace(/\s+/g, '')} #${section.replace(/\s+/g, '')}`;
              tweets.push({ section, title, content });
              await sendProgress({
                event_type: 'stage_progress',
                stage: 'generate_tweet',
                message: `Generated tweet #${tweetNumber}`,
                data: {
                  type: 'tweet',
                  tweet_number: tweetNumber,
                  tweet_title: title,
                  section_title: section,
                  tweet_content: content,
                },
              });
              tweetNumber += 1;

              if (force_error && tweetNumber > 2) {
                // 模拟在中途失败
                enqueue(
                  jsonEvent(rndId(), 'error', {
                    status: 'error',
                    message: 'Mock generation failed',
                  }),
                );
                controller.close();
                return;
              }
            }
          }

          // stage_end(generate_tweet) 携带 outline（简化）
          const outline = {
            topic,
            content_format,
            nodes: sections.map((sec) => ({
              title: sec,
              leaf_nodes: tweets
                .map((t, idx) => ({
                  section: t.section,
                  idx: idx + 1,
                  title: t.title,
                  tweet_number: idx + 1,
                  tweet_content: t.content,
                }))
                .filter((t) => t.section === sec)
                .map((t) => ({
                  title: t.title,
                  tweet_number: t.tweet_number,
                  tweet_content: t.tweet_content,
                })),
            })),
          };

          await sendProgress({
            event_type: 'stage_end',
            stage: 'generate_tweet',
            message: 'Tweet generation completed',
            data: { outline },
          });

          // success 事件，提供完整结构（与 prd.md success 对齐，tweets[]）
          const successData = {
            id: crypto.randomUUID(),
            topic,
            content_format,
            nodes: sections.map((sec) => ({
              title: sec,
              tweets: tweets
                .map((t, idx) => ({
                  section: t.section,
                  idx: idx + 1,
                  tweet_number: idx + 1,
                  title: t.title,
                  content: t.content + '\n\n' + t.content,
                  image_url: null,
                }))
                .filter((t) => t.section === sec)
                .map((t) => ({
                  tweet_number: t.tweet_number,
                  title: t.title,
                  content: t.content,
                  image_url: t.image_url,
                })),
            })),
            total_tweets: tweets.length,
          };

          enqueue(
            jsonEvent(crypto.randomUUID(), 'success', {
              status: 'success',
              data: successData,
              thread_id: successData.id,
              is_final: true,
            }),
          );

          controller.close();
        } catch (e) {
          try {
            controller.close();
          } catch {}
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Mock SSE failed' }), {
      status: 500,
    });
  }
}
