import { NextRequest } from 'next/server';

import { API_HOST } from '@/constants/env';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const sessionId = searchParams.get('session_id');

    if (!sessionId) {
      return new Response('缺少 session_id 参数', { status: 400 });
    }

    const forwardHeaders = new Headers();

    req.headers.forEach((value, key) => {
      if (!['host', 'content-length'].includes(key.toLowerCase())) {
        forwardHeaders.set(key, value);
      }
    });

    forwardHeaders.set('Accept', 'text/event-stream');
    forwardHeaders.set('Cache-Control', 'no-cache');
    forwardHeaders.set('Connection', 'keep-alive');

    const targetUrl = `${API_HOST}/api/twitter/generate/stream?session_id=${sessionId}`;

    const backendResponse = await fetch(targetUrl, {
      method: 'GET',
      headers: forwardHeaders,
      // @ts-ignore - Next.js 特定选项
      duplex: 'half',
    });

    if (!backendResponse.ok || !backendResponse.body) {
      return new Response(`后端响应异常: ${backendResponse.status}`, {
        status: backendResponse.status,
      });
    }

    const { readable, writable } = new TransformStream();

    backendResponse.body.pipeTo(writable).catch((error) => {
      console.error('[SSE Proxy] 流传输错误:', error);
    });

    return new Response(readable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    });
  } catch (error) {
    console.error('SSE 代理错误:', error);
    return new Response(
      `SSE 代理异常: ${error instanceof Error ? error.message : '未知错误'}`,
      { status: 500 },
    );
  }
}