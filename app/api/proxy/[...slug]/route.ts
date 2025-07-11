import { API_HOST } from '@/constants/env';
import { NextRequest, NextResponse } from 'next/server';

// 由于 next.config.ts 里的 rewrites 无法配置超时（后端 AI 接口需要 10～30s），所以这里改为用 API代理
async function handler(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string[] }> },
) {
  // CRITICAL FIX: The request body must be awaited BEFORE accessing params.
  const body =
    req.method === 'GET' || req.method === 'HEAD'
      ? undefined
      : await req.text();

  // Now it's safe to access params.
  const awaitedParams = await params;
  const path = awaitedParams.slug.join('/');
  const url = new URL(req.url);
  const searchParams = url.search;
  const targetUrl = `${API_HOST}/${path}${searchParams}`;

  console.log('api proxy targetUrl', targetUrl);

  try {
    // Forward client headers to target API
    const forwardHeaders = new Headers();

    // Copy all relevant headers from the original request
    req.headers.forEach((value, key) => {
      // Skip headers that shouldn't be forwarded
      if (!['host', 'content-length'].includes(key.toLowerCase())) {
        forwardHeaders.set(key, value);
      }
    });

    // Ensure Content-Type is set for non-GET requests
    if (
      req.method !== 'GET' &&
      req.method !== 'HEAD' &&
      !forwardHeaders.has('content-type')
    ) {
      forwardHeaders.set('Content-Type', 'application/json');
    }

    const response = await fetch(targetUrl, {
      method: req.method,
      headers: forwardHeaders,
      body: body, // Pass the consumed body.
    });

    const headers = new Headers(response.headers);
    headers.delete('Content-Encoding');
    headers.delete('Content-Length');

    return new NextResponse(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: headers,
    });
  } catch (error) {
    console.error('Proxy error:', error);
    return NextResponse.json(
      { error: 'Proxy failed', details: (error as Error).message },
      { status: 500 },
    );
  }
}

export {
  handler as DELETE,
  handler as GET,
  handler as PATCH,
  handler as POST,
  handler as PUT,
};
