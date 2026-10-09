import { existsSync } from "node:fs";
import { resolve } from "node:path";
import type { NextConfig } from "next";

// The monorepo keeps one .env at the repo root. Next only reads .env from its own folder, so load the root one too.
const rootEnv = resolve(process.cwd(), "..", ".env");
if (existsSync(rootEnv)) process.loadEnvFile(rootEnv);

const nextConfig: NextConfig = {
  devIndicators: false,
  // Workspace packages ship TypeScript source.
  transpilePackages: ["@sorot/core", "@sorot/db"],
  // Keeps the database driver out of any client bundle.
  serverExternalPackages: ["@neondatabase/serverless"],
};

export default nextConfig;
