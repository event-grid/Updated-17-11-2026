import path from "node:path";

import { defineConfig } from "vitest/config";

/** Unit tests (FRONTEND_ARCHITECTURE.md section 11). End-to-end tests run with Playwright instead. */
export default defineConfig({
  resolve: {
    alias: { "@": path.resolve(import.meta.dirname, "src") },
  },
  test: {
    include: ["tests/unit/**/*.test.{ts,tsx}"],
    environment: "node",
  },
});
