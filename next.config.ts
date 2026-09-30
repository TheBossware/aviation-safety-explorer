import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The ISIT taxonomy is read from disk at runtime (src/lib/isit-taxonomy/taxonomy.ts);
  // make sure the files ship with the routes that load it.
  outputFileTracingIncludes: {
    "/isit-review": ["./data/isit/**/*.json"],
    "/isit-review/*": ["./data/isit/**/*.json"],
    "/api/isit/run": ["./data/isit/**/*.json"],
  },
};

export default nextConfig;
