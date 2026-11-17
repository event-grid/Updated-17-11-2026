import type { NextConfig } from "next";

import { loadRootEnv } from "./load-root-env";

// Settings from the root .env: only the ones this app needs.
loadRootEnv(["EVNTGRID_API_BASE_URL", "CUSTOMER_SITE_URL", "SESSION_COOKIE_DOMAIN"]);

const nextConfig: NextConfig = {
  /* config options here */
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
