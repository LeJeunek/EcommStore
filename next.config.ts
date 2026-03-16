import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Essential for Prisma 7 + Next 16 stability
  serverExternalPackages: ["@prisma/client", "@prisma/adapter-neon"],
};

export default nextConfig;