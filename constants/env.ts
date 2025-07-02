export const API_BASE_URL =
  process.env.NODE_ENV === 'development'
    ? '/proxy-api' // 开发环境使用代理
    : 'https://influflow-api.up.railway.app'; // 生产环境直接请求
