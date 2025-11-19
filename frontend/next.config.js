/** @type {import('next').NextConfig} */
// 统一的后端端口配置
const BACKEND_PORT = process.env.BACKEND_PORT || "8080";

const nextConfig = {
  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors.
    ignoreDuringBuilds: true,
  },
  images: {
    domains: ["localhost"],
  },
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `http://localhost:${BACKEND_PORT}/api/:path*`,
      },
      {
        source: "/uploads/:path*",
        destination: `http://localhost:${BACKEND_PORT}/uploads/:path*`,
      },
    ];
  },
};

module.exports = nextConfig;
