import { test, expect } from '@playwright/test'
import { openPomasaTab } from './helpers'

// The black-myth-zhong-kui fixture is a verbatim copy of a REAL generated MAS
// (real generator descriptor shape: bare .md agent names plus a prose
// orchestrator stage). It is the reference fixture for studio display work —
// keep asserting the real-shape render here so future UI changes can't regress it.
test('fixture MAS: real generator shape lists and opens in the workbench', async ({ page }) => {
  await openPomasaTab(page)
  const row = page.getByText('《黑神话·钟馗》市场调研', { exact: true }).first()
  await expect(row).toBeVisible({ timeout: 15000 })
  await row.click()
  // the work title bar uses the descriptor name, not the registry name
  await expect(page.locator('.ps-title-name')).toHaveText('《黑神话·钟馗》特点与预期销量研究', { timeout: 15000 })
  // a real 8-stage system: 7 blueprint-backed stages render on the canvas
  // (stage 8 "报告装配与交付" is a prose-orchestrator stage with no agent
  // file, so by design it is not a canvas node); the orchestrator row renders
  await expect(page.locator('.ps-canvas-stage-slot')).toHaveCount(7)
  await expect(page.locator('.ps-canvas-stage-slot').filter({ hasText: '初始扫描' })).toBeVisible()
  await expect(page.locator('.ps-orch-shell')).toBeVisible()
  await expect(page.getByRole('button', { name: '运行', exact: true })).toBeVisible()
})

test('language: bandung-lang=en renders the Studio chrome in English', async ({ page }) => {
  // The e2e profile has no dsh-app-dock, so drive the same source the dock
  // writes — localStorage 'bandung-lang' — before the client bundle boots.
  await page.addInitScript(() => { try { localStorage.setItem('bandung-lang', 'en') } catch { /* ignore */ } })
  await openPomasaTab(page)
  await expect(page.getByRole('button', { name: 'New', exact: true })).toBeVisible({ timeout: 15000 })
  await expect(page.getByRole('button', { name: '新建', exact: true })).toHaveCount(0)
  await expect(page.locator('.ps-workbench').getByRole('button', { name: 'Settings', exact: true })).toBeVisible()
  // MAS data keeps its own language — the fixture system name is content, not chrome
  await expect(page.getByText('《黑神话·钟馗》市场调研', { exact: true }).first()).toBeVisible()
})