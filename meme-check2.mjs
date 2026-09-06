// Reproduce the meme on the NEW harness (same composition as the Desktop):
// seed one MAS so the quiet empty state (whale-girl meme) shows, then report
// the img's computed src, load status, naturalWidth and a screenshot.
import { chromium } from 'playwright'
import { spawn, execFileSync } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

const root = '/Users/gigix/Projects/03.systems/pomasa-studio'
const APP = '/Applications/DSH Desktop.app'
const ENTRY = path.join(APP, 'Contents/Resources/harness-node-entry.mjs')
const DSH_BIN = path.join(APP, 'Contents/Resources/app/node_modules/@deepseek-ai/dsh/lib/bin.js')
const PORT = 43984
const base = fs.mkdtempSync(path.join(os.tmpdir(), 'pomasa-meme2-'))
const dshHome = path.join(base, 'dsh_home')
const pomasaHome = path.join(base, 'pomasa_home')
fs.mkdirSync(dshHome, { recursive: true }); fs.mkdirSync(pomasaHome, { recursive: true })
// Seed a registry with one MAS so the quiet hero (meme) renders.
fs.mkdirSync(path.join(pomasaHome, 'demo-mas'), { recursive: true })
fs.writeFileSync(path.join(pomasaHome, 'registry.json'), JSON.stringify({ version: 1, mas: [{ id: 'demo-mas', status: 'idle', createdAt: Date.now(), name: 'Demo', description: 'demo mas' }] }))
const env = { ...process.env, DSH_HOME: dshHome, POMASA_HOME: pomasaHome }

execFileSync('node', [ENTRY, DSH_BIN, '--profile', 'web', '--help'], { env, stdio: 'ignore' })
execFileSync('node', [ENTRY, DSH_BIN, 'plugin', '--profile', 'web', 'add', root], { env, stdio: 'ignore' })

let collected = ''
const proc = spawn('node', [ENTRY, DSH_BIN, '--profile', 'web', '--no-open', '--port', String(PORT)], { env, stdio: ['ignore', 'pipe', 'pipe'] })
proc.stdout.on('data', (d) => { collected += d })
proc.stderr.on('data', (d) => { collected += d })
process.on('exit', () => proc.kill('SIGKILL'))
let token = null
for (let i = 0; i < 60; i++) {
  await new Promise((r) => setTimeout(r, 1000))
  const m = collected.match(/token=([A-Za-z0-9_-]+)/)
  if (m) { token = m[1]; break }
}
console.log('token captured:', !!token)

const browser = await chromium.launch()
const page = await browser.newPage()
page.on('response', (r) => { if (r.url().includes('meme')) console.log('[resp]', r.status(), r.url().slice(0, 90)) })
page.on('requestfailed', (r) => { if (r.url().includes('meme')) console.log('[reqfail]', r.url().slice(0, 90), r.failure()) })
await page.goto(`http://127.0.0.1:${PORT}/?token=${token}`)
await page.waitForTimeout(8000)
for (const label of ['Continue', '继续', 'Configure later', '稍后配置', 'Skip']) {
  const b = page.getByRole('button', { name: label }).first()
  if (await b.isVisible().catch(() => false)) { await b.click({ force: true }).catch(() => {}); await page.waitForTimeout(1000) }
}
await page.evaluate(() => {
  const el = Array.from(document.querySelectorAll('.ps-footer-action')).find((e) => e.textContent && e.textContent.includes('POMASA Studio'))
  if (el) { el.click(); return true }
  return false
})
await page.waitForTimeout(4000)

const info = await page.evaluate(() => {
  const imgs = Array.from(document.querySelectorAll('.ps-meme, .ps-hero-glyph'))
  return imgs.map((e) => ({
    cls: e.className,
    tag: e.tagName,
    src: (e.src || e.textContent || '').slice(0, 70),
    complete: e.complete ?? null,
    nw: e.naturalWidth ?? null,
  }))
}).catch(() => [])
console.log('meme elements:', JSON.stringify(info, null, 1))
console.log('location.search:', await page.evaluate(() => window.location.search))
await page.screenshot({ path: '/tmp/pomasa-meme-live2.png' }).catch(() => {})
await browser.close()
process.exit(0)