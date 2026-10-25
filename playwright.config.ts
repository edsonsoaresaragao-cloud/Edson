import { defineConfig, devices } from "@playwright/test";
import chromium from "@sparticuz/chromium";
process.env.XDG_CACHE_HOME ||= "/workspace/.cache";
export default defineConfig({
  testDir: "./tests/browser",
  timeout: 60000,
  fullyParallel: false,
  workers: 1,
  use: {
    baseURL: process.env.TEST_BASE_URL || "http://localhost:3000",
    headless: true,
    launchOptions: {
      executablePath:
        process.env.CHROMIUM_PATH || (await chromium.executablePath()),
      args: chromium.args.filter(
        (a) => !["--single-process", "--disable-web-security"].includes(a),
      ),
    },
    trace: "retain-on-failure",
  },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"] } },
    {
      name: "mobile",
      use: { ...devices["iPhone 13"], defaultBrowserType: "chromium" },
    },
  ],
});
