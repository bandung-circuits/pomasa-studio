import { test, expect } from '@playwright/test'
import { openPomasaTab } from './helpers'

test('POMASA Studio opens the workbench', async ({ page }) => {
  await openPomasaTab(page)
  const bootName = page.locator('.ps-boot-sign .ps-boot-name')
  await expect(bootName).toBeVisible({ timeout: 15000 })
  await expect(bootName).toHaveText('POMASA Studio')
})

test('MAS list shows the fixture mas and opens detail', async ({ page }) => {
  await openPomasaTab(page)
  const card = page.getByText('Demo MAS', { exact: true }).first()
  await expect(card).toBeVisible({ timeout: 15000 })
  await card.click()
  const stages = page.locator('.ps-canvas-stage-slot')
  await expect(stages.filter({ hasText: 'Overview' })).toBeVisible({ timeout: 15000 })
  await expect(stages.filter({ hasText: 'Research' })).toBeVisible()
  await expect(stages.filter({ hasText: 'Report' })).toBeVisible()
})

test('stage artifacts render and viewer opens markdown', async ({ page }) => {
  await openPomasaTab(page)
  await page.getByText('Demo MAS', { exact: true }).first().click()
  await expect(page.locator('.ps-art-title', { hasText: 'Overview Document' })).toBeVisible({ timeout: 15000 })
  // select the Research stage on the canvas; its artifacts list below
  await page.locator('.ps-canvas-stage-slot').filter({ hasText: 'Research' }).click()
  await expect(page.locator('.ps-art-title', { hasText: 'Finding Alpha' })).toBeVisible({ timeout: 10000 })
  await page.locator('.ps-art-title', { hasText: 'Finding Alpha' }).click() // opens the artifact modal
  await expect(page.getByText('Alpha 的内容')).toBeVisible({ timeout: 10000 })
  await page.getByRole('button', { name: '✕' }).click() // close the modal before picking the next artifact
  await page.locator('.ps-art-title', { hasText: 'Finding Beta' }).click()
  await expect(page.locator('strong', { hasText: '加粗' })).toBeVisible({ timeout: 10000 })
})

test('switching multi-unit MAS to single-unit MAS resets the detail view', async ({ page }) => {
  await openPomasaTab(page)
  // open the multi-unit fixture first: the units tree lists its country units
  await page.getByText('全球南方AI战略国别研究', { exact: true }).first().click()
  await expect(page.locator('.ps-tree-unit-name').first()).toBeVisible({ timeout: 15000 })
  await expect(page.locator('.ps-tree-unit-name', { hasText: 'brazil' })).toBeVisible()
  // back to the MAS list, then open the single-unit fixture
  await page.locator('.ps-title-bar .ps-icon-btn').first().click()
  await page.getByText('《黑神话·钟馗》市场调研', { exact: true }).first().click()
  // single MAS: the canvas renders its own stages, and the tree holds only default
  await expect(page.locator('.ps-canvas-stage-slot').filter({ hasText: '初始扫描' })).toBeVisible({ timeout: 15000 })
  await expect(page.locator('.ps-tree-unit-name')).toHaveCount(1)
  await expect(page.locator('.ps-tree-unit-name').first()).toHaveText('default')
})
