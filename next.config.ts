import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
      {
        protocol: 'http',
        hostname: '**',
      },
      {
        protocol: 'https',
        hostname: 'hhmage.com',
      },
      {
        protocol: 'https',
        hostname: 'hongniuzyimage.com',
      }
    ],
  },
  async rewrites() {
    return [
      {
        source: '/api/proxy',
        destination: 'http://api.ffzyapi.com/api.php/provide/vod/at/json/'
      }
    ];
  }
};

export default nextConfig;
