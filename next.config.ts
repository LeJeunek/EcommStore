import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Essential for Prisma 7 + Next 16 stability
  serverExternalPackages: ["@prisma/client", "@prisma/adapter-neon"],

  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "utfs.io",
        port: "",
      },
    ],
  },
};

export default nextConfig;
