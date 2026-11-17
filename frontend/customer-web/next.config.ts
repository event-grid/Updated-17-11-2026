import type { NextConfig } from "next";

import { loadRootEnv } from "./load-root-env";
import { apiBaseUrl } from "./src/config/api";

// Settings from the root .env: only the addresses this site needs.
loadRootEnv(["PARTNER_PORTAL_URL", "ADMIN_PORTAL_URL"]);

const nextConfig: NextConfig = {
  /**
   * Same-origin routing (AR-01): the browser calls /api/* on this site and Next.js forwards it to the
   * backend, so the session cookie stays on this host and no CORS is needed. In production the load
   * balancer does the same routing before requests reach Next.js.
   */
  async rewrites() {
    return [{ source: "/api/:path*", destination: `${apiBaseUrl}/api/:path*` }];
  },
  // The pages were renamed from "providers" to "vendors"; old links still work.
  async redirects() {
    return [
      { source: "/providers", destination: "/vendors", permanent: true },
      { source: "/providers/:path*", destination: "/vendors/:path*", permanent: true },
    ];
  },
  cacheComponents: true,
  partialPrefetching: true,
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
