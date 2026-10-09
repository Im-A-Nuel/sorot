import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  devIndicators: false,
  // Workspace packages ship TypeScript source.
  transpilePackages: ["@sorot/core", "@sorot/db"],
  // Keeps the Panta key and database driver out of any client bundle.
  serverExternalPackages: ["@neondatabase/serverless"],
};

export default nextConfig;
