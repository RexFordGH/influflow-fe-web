export const API_BASE_URL =
  process.env.NODE_ENV === 'development'
    ? '/proxy-api'
    : 'https://influflow-api.up.railway.app';
