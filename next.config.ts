import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  reactStrictMode: true,
  // Produce a self-contained Node.js server for Vercel, containers or a VPS.
  // Keep application code independent of any single hosting provider.
  output: "standalone",
};

export default nextConfig;
