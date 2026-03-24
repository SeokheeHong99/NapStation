import type { NextConfig } from "next";

const rootDir = process.cwd();

const nextConfig: NextConfig = {
  turbopack: {
    root: rootDir,
  },
  outputFileTracingRoot: rootDir,
};

export default nextConfig;
