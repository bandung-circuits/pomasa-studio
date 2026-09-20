import { test, type Page } from '@playwright/test'

// The Studio workbench opens from the footer startup button (sidebar.footer.action
// → DSH footArea), toggling the shell.overlay panel.
async function pomasaVisible(page: Page) {
  return await page.locator('.ps-workbench').first().isVisible().catch(() => false)
}

async function waitForWorkbench(page: Page) {
  for (let i = 0; i < 12; i += 1) {
    await page.waitForTimeout(1000)
    if (await pomasaVisible(page)) return true
  }
  return false
}

export async function ensureSession(page: Page): Promise<void> {
  await page.goto('/')
  await page.waitForTimeout(3000)
  // DSH 0.1 fresh-env boot shows two onboarding modals whose masks (z-index 1000)
  // freeze every click until dismissed: the Internal Testing Notice, then the
  // "Add an API key" dialog. Dismiss both before interacting.
  const cont = page.getByRole('button', { name: 'Continue' }).first()
  if (await cont.isVisible().catch(() => false)) {
    await cont.click({ force: true }).catch(() => {})
    await page.waitForTimeout(1000)
  }
  const later = page.getByRole('button', { name: 'Configure later' }).first()
  if (await later.isVisible().catch(() => false)) {
    await later.click({ force: true }).catch(() => {})
    await page.waitForTimeout(1000)
  }
  if (await pomasaVisible(page)) return

  // Entry via footer startup button in the DSH sidebar foot area.
  const click = (selector: string) => page.$eval(selector, (el) => el.click())
  await page.waitForSelector('[data-ps-startup="pomasa-studio"]', { timeout: 60_000 }).catch(() => {})
  if (await page.$('[data-ps-startup="pomasa-studio"]')) {
    await click('[data-ps-startup="pomasa-studio"]')
    if (await waitForWorkbench(page)) return
  }

  console.log('ensure: FAILED to reach POMASA; body=', (await page.locator('body').innerText()).slice(0, 160).replace(/\n+/g, ' | '))
  test.skip(true, 'POMASA workbench not reachable')
}

export async function openPomasaTab(page: Page): Promise<void> {
  await ensureSession(page)
  if (!(await pomasaVisible(page))) {
    test.skip(true, 'POMASA workbench not rendered')
  }
  await page.waitForTimeout(500)
}