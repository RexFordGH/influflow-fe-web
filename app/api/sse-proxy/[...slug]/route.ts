import { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // 从查询参数中获取请求数据
    const url = new URL(request.url);
    const requestBodyStr = url.searchParams.get('data');

    console.log('requestBodyStr', requestBodyStr);

    if (!requestBodyStr) {
      return new Response(JSON.stringify({ error: 'Missing data parameter' }), {
        status: 400,
      });
    }

    const requestBody = JSON.parse(decodeURIComponent(requestBodyStr));

    // 从请求头中获取JWT token
    const authHeader = request.headers.get('Authorization');

    // 构建查询参数
    const queryParams = new URLSearchParams({
      user_input: requestBody.user_input,
      content_format: requestBody.content_format,
    });

    // 创建对后端的GET请求
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/twitter/generate/stream?${queryParams}`,
      {
        method: 'GET',
        headers: {
          'Accept': 'text/event-stream',
          ...(authHeader ? { Authorization: authHeader } : {}),
        },
      },
    );

    console.log('response', response);

    if (!response.ok) {
      return new Response(JSON.stringify({ error: 'Backend request failed' }), {
        status: response.status,
      });
    }

    // 创建SSE响应
    const encoder = new TextEncoder();

    const stream = new ReadableStream({
      async start(controller) {
        const reader = response.body?.getReader();

        if (!reader) {
          controller.close();
          return;
        }

        try {
          while (true) {
            const { done, value } = await reader.read();

            if (done) {
              controller.close();
              break;
            }

            // 直接转发原始数据，不要再次包装
            controller.enqueue(value);
          }
        } catch (error) {
          console.error('Stream error:', error);
          controller.error(error);
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });
  } catch (error) {
    console.error('SSE Proxy error:', error);
    return new Response(JSON.stringify({ error: 'SSE Proxy failed' }), {
      status: 500,
    });
  }
}
