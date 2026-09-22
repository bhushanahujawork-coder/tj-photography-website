import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    qualities: [90, 100],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "img.youtube.com",
      },
      {
        protocol: "https",
        hostname: "*.vercel-storage.com",
      },
    ],
  },
  async redirects() {
    return [
      {
        source: '/portfolio',
        destination: '/quickportfolio',
        permanent: true,
      },
    ]
  },
};

export default nextConfig;
