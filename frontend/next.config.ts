import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${process.env.NEXT_PUBLIC_API_URL || process.env.BACKEND_URL || 'http://localhost:8000'}/api/:path*`,
      },
    ];
  },
  allowedDevOrigins: [
    '*.replit.dev',
    '*.worf.replit.dev',
    '*.sisko.replit.dev',
    '127.0.0.1',
    '127.0.0.1:5000',
    'localhost',
    'localhost:5000',
    '192.168.29.243:3000',
  ],
};

export default nextConfig;
