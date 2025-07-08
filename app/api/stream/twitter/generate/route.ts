import { NextRequest } from 'next/server';

const TARGET_API_BASE_URL = 'https://influflow-api.up.railway.app';

export async function GET(request: NextRequest) {
  try {
    // 从查询参数中获取请求数据
    const url = new URL(request.url);
    const requestBodyStr = url.searchParams.get('data');
    
    if (!requestBodyStr) {
      return new Response(
        JSON.stringify({ error: 'Missing data parameter' }),
        { status: 400 }
      );
    }
    
    const requestBody = JSON.parse(decodeURIComponent(requestBodyStr));
    
    // 从请求头中获取JWT token
    const authHeader = request.headers.get('Authorization');
    
    // 创建对后端的POST请求
    const response = await fetch(`${TARGET_API_BASE_URL}/api/twitter/generate/stream`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(authHeader ? { Authorization: authHeader } : {}),
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      return new Response(
        JSON.stringify({ error: 'Backend request failed' }),
        { status: response.status }
      );
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

            // 将数据转发给客户端
            const chunk = new TextDecoder().decode(value);
            controller.enqueue(encoder.encode(`data: ${chunk}\n\n`));
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
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });
  } catch (error) {
    console.error('SSE Proxy error:', error);
    return new Response(
      JSON.stringify({ error: 'SSE Proxy failed' }),
      { status: 500 }
    );
  }
}