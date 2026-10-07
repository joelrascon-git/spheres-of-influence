import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Every page is per-user and reads the auth cookie, so Cache Components'
  // static-shell model adds Suspense boilerplate without any caching benefit.
  cacheComponents: false,
  experimental: {
    serverActions: { bodySizeLimit: "25mb" },
  },
  images: {
    remotePatterns: [{ protocol: "https", hostname: "*.supabase.co" }],
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
