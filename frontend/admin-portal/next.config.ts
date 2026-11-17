import type { NextConfig } from "next";

import { loadRootEnv } from "./load-root-env";

// Settings from the root .env: only the ones this app needs.
loadRootEnv(["EVNTGRID_API_BASE_URL", "ADMIN_API_TOKEN", "ADMIN_PORTAL_EMAIL", "ADMIN_PORTAL_PASSWORD", "CUSTOMER_SITE_URL", "PARTNER_PORTAL_URL"]);

const nextConfig: NextConfig = {
  /* config options here */
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
