/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    appDir: true,
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:8000/api/:path*',
      },
    ];
  },
  typescript: {
    // Enable strict TypeScript checking
    ignoreBuildErrors: false,
  },
  eslint: {
    // Enable strict ESLint checking
    ignoreDuringBuilds: false,
  },
};

module.exports = nextConfig;