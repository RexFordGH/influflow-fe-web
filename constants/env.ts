export const API_BASE_URL =
  process.env.NODE_ENV === 'development'
    ? '/api/proxy' // 开发环境使用手动代理路由
    : 'https://influflow-api.up.railway.app'; // 生产环境直接请求
