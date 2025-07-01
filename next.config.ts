import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      // 代理所有后端API请求
      {
        source: '/proxy-api/:path*',
        destination: 'https://influflow-api.up.railway.app/:path*',
      },
    ];
  },
};

export default nextConfig;
