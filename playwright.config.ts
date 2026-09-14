import { defineConfig, devices } from "@playwright/test";

/**
 * E2E + accessibility tests. The app is served by the Vite dev server in
 * `--mode test`, which loads `.env.test` and blanks every VITE_FIREBASE_*
 * variable → the app runs in demo mode against local seeded data. Nothing
 * here talks to the production Firebase project.
 *
 *   npm run test:e2e          # headless
 *   npm run test:e2e:ui       # Playwright UI mode
 *   E2E_BASE_URL=https://iub-event-management.web.app npm run test:e2e -- public
 */
const PORT = 4173;
const baseURL = process.env.E2E_BASE_URL ?? `http://localhost:${PORT}`;

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? [["github"], ["html", { open: "never" }]] : "list",
  timeout: 45_000,
  // The Vite dev server compiles lazy route chunks on first request.
  expect: { timeout: 15_000 },
  use: {
    baseURL,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    {
      name: "mobile",
      use: { ...devices["Pixel 7"] },
      testMatch: /public\.spec\.ts/,
    },
  ],
  webServer: process.env.E2E_BASE_URL
    ? undefined
    : {
        command: `node ./node_modules/vite/bin/vite.js --mode test --port ${PORT} --strictPort`,
        url: baseURL,
        reuseExistingServer: !process.env.CI,
        timeout: 60_000,
      },
});
