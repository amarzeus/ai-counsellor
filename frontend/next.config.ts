import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:8000/api/:path*',
      },
    ];
  },
  allowedDevOrigins: [
    '*.replit.dev',
    '*.worf.replit.dev',
    '127.0.0.1:5000',
    'localhost:5000',
  ],
};

export default nextConfig;
