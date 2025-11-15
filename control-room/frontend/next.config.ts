import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Fix lockfile warning by explicitly setting the workspace root for Turbopack
  turbopack: {
    root: path.join(__dirname, '../../'),
  },
  // Also set for output file tracing
  outputFileTracingRoot: path.join(__dirname, '../../'),
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
};

export default nextConfig;
