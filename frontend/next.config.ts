import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${process.env.BACKEND_URL || 'http://localhost:8000'}/api/:path*`,
      },
    ];
  },
  allowedDevOrigins: [
    '*.replit.dev',
    '*.worf.replit.dev',
    '127.0.0.1:5000',
    'localhost:5000',
    '192.168.29.243:3000',
  ],
};

export default nextConfig;
