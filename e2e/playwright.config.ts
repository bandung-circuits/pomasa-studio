import { defineConfig } from '@playwright/test'

// L4a browser E2E — deterministic, no model calls: the fixture MAS in
// e2e/fixture-mas carries a completed run (run.json + stage indexes + artifacts).
// Prereqs: npm i -D @playwright/test && npx playwright install chromium
export default defineConfig({
  testDir: './specs',
  timeout: 90_000,
  fullyParallel: false,
  workers: 1,
  use: {
    baseURL: 'http://127.0.0.1:43121',
    headless: true,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  webServer: {
    command: 'node servers.mjs',
    // 0.2.x 起 web host 强制 token 鉴权，任何路径对未认证请求都回 401，
    // 所以这里只等 TCP 端口就绪；token URL 由 servers.mjs 写盘、auth.ts 消费。
    port: 43121,
    reuseExistingServer: false,
    timeout: 120_000,
  },
})