/*
  Minimal SSE client wrapper for /api/sse-proxy/twitter/generate/stream
*/

export type ContentFormat = 'longform' | 'article' | 'thread';

export interface SubscribeParams {
  user_input: string;
  content_format: ContentFormat;
  onOpen?: () => void;
  onProgress?: (evt: ProgressEventPayload) => void;
  onSuccess?: (evt: SuccessEventPayload) => void;
  onError?: (err: ErrorEvent | MessageEvent | Event) => void;
}

export interface ProgressEventPayload {
  status: 'progress';
  data: {
    event_type: 'stage_start' | 'stage_progress' | 'stage_end';
    stage: 'extract_url' | 'analysis_user_input' | 'web_search' | 'generate_tweet' | string;
    message?: string;
    data?: any;
  };
}

export interface SuccessEventPayload {
  status: 'success';
  data: any;
  is_final?: boolean;
}

export interface Subscription {
  close: () => void;
  eventSource: EventSource | null;
}

function buildSSEUrl(params: { user_input: string; content_format: ContentFormat }) {
  const isMock = process.env.NEXT_PUBLIC_USE_MOCK_SSE === 'true';
  if (isMock) {
    // 直接把参数放到 query，便于用 curl 观测
    const qp = new URLSearchParams({ user_input: params.user_input, content_format: params.content_format });
    return `/api/mock/twitter/generate/stream?${qp.toString()}`;
  }
  const payload = encodeURIComponent(
    JSON.stringify({ user_input: params.user_input, content_format: params.content_format })
  );
  return `/api/sse-proxy/twitter/generate/stream?data=${payload}`;
}

export function subscribe({ user_input, content_format, onOpen, onProgress, onSuccess, onError }: SubscribeParams): Subscription {
  const url = buildSSEUrl({ user_input, content_format });

  // EventSource will include cookies for same-origin requests
  const es = new EventSource(url);

  const handleOpen = () => {
    onOpen?.();
  };

  const handleProgress = (event: MessageEvent) => {
    try {
      const payload: ProgressEventPayload = JSON.parse(event.data);
      if (payload?.status === 'progress') {
        onProgress?.(payload);
      }
    } catch (e) {
      // ignore parse error but surface to onError for observability
      onError?.(event);
    }
  };

  const handleSuccess = (event: MessageEvent) => {
    try {
      const payload: SuccessEventPayload = JSON.parse(event.data);
      if (payload?.status === 'success') {
        onSuccess?.(payload);
      }
    } catch (e) {
      onError?.(event);
    }
  };

  const handleError = (event: Event) => {
    onError?.(event);
  };

  es.addEventListener('open', handleOpen as EventListener);
  es.addEventListener('progress', handleProgress as EventListener);
  es.addEventListener('success', handleSuccess as EventListener);
  es.addEventListener('error', handleError as EventListener);

  return {
    eventSource: es,
    close: () => {
      try {
        es.removeEventListener('open', handleOpen as EventListener);
        es.removeEventListener('progress', handleProgress as EventListener);
        es.removeEventListener('success', handleSuccess as EventListener);
        es.removeEventListener('error', handleError as EventListener);
      } catch {}
      es.close();
    },
  };
}
