import type { NextConfig } from "next";

const rootDir = process.cwd();

const nextConfig: NextConfig = {
  turbopack: {
    root: rootDir,
  },
  outputFileTracingRoot: rootDir,
  // Explicitly propagate server env vars so they survive in the Amplify Lambda runtime.
  // Amplify sets these during the build; without this, they are absent from process.env
  // inside the Lambda and Prisma throws "Environment variable not found: DATABASE_URL".
  env: {
    DATABASE_URL: process.env.DATABASE_URL ?? "",
    SUPABASE_URL: process.env.SUPABASE_URL ?? "",
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY ?? "",
    ADMIN_PASSWORD: process.env.ADMIN_PASSWORD ?? "",
  },
};

export default nextConfig;

