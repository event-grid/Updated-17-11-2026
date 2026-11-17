import { defineConfig, devices } from "@playwright/test";

/**
 * End-to-end tests for customer-web (FRONTEND_ARCHITECTURE.md section 11).
 *
 * Needs the backend running with its seeded catalogue (scripts/development/run-backend.ps1).
 * Starts `npm run dev` itself unless a server is already running at E2E_BASE_URL.
 * Uses the installed Microsoft Edge (channel "msedge"), so no browser download is needed.
 */
const baseURL = process.env.E2E_BASE_URL ?? "http://localhost:3000";

export default defineConfig({
  testDir: "tests/e2e",
  fullyParallel: true,
  // The dev server compiles pages on first visit; more workers than this overload it locally.
  workers: 2,
  retries: 0,
  expect: { timeout: 10_000 },
  reporter: [["list"]],
  use: {
    baseURL,
    channel: "msedge",
    trace: "retain-on-failure",
  },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Edge"], channel: "msedge" } },
    { name: "phone", use: { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, channel: "msedge" } },
  ],
  webServer: {
    command: "npm run dev",
    url: baseURL,
    reuseExistingServer: true,
    timeout: 120_000,
  },
});
