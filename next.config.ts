import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: '100mb', // Increased from default 1mb to support image uploads
    },
  },
};

export default nextConfig;
