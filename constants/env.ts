export const isLocal = process.env.NEXT_PUBLIC_ENV === 'local';
export const isDev = process.env.NEXT_PUBLIC_ENV === 'test';
export const isProd = process.env.NEXT_PUBLIC_ENV === 'production';

export const API_HOST = process.env.NEXT_PUBLIC_API_BASE_URL; // 测试/生产环境 ->直接请求后端环境
// 开发环境 -> next api 代理路由
export const API_BASE_URL = isLocal ? '/api/proxy' : API_HOST;
