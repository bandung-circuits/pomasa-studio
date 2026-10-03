// Boot a hermetic dsh web for browser E2E. Two modes:
//   default:  empty web profile + this plugin (fixture POMASA_HOME)
//   POMASA_E2E_SRC_HOME=user: copy the user's whole ~/.dsh (settings, sessions,
//   profiles) into a temp DSH_HOME, so the browser sees the same environment
//   as the desktop app (conversation scenes included). Temp home is deleted on
//   exit.
import { spawn, execFileSync } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'


// 0.2.x 的兼容门会参考 registry 上"已发布"的插件元数据；本地 checkout 往往
// 已放宽 peers 但新版本尚未发布（如 dock@0.1.4 vs 本地 0.1.5）。add 被拒时
// 对该精确版本授 allow-version 再重试 —— 本地代码即真相，发布后走不进此分支。
function addPluginWithCompatRetry(env, spec, published) {
  const base = ['plugin', '--profile', 'web']
  const opts = { env, stdio: 'ignore' }
  const allowAll = () => {
    for (const p of published) {
      try { execFileSync('dsh', [...base, 'allow-version', p, '--dsh-version', process.env.DSH_VERSION, '--accept-risk'], opts) } catch { /* ignore */ }
    }
  }
  try {
    execFileSync('dsh', [...base, 'add', spec], opts)
    return
  } catch { /* 落入豁免重试 */ }
  for (let round = 0; round < 3; round += 1) {
    allowAll()
    try {
      execFileSync('dsh', [...base, 'add', spec], opts)
      return
    } catch { /* 再来一轮 */ }
  }
  // 最后一次把错误暴露出来
  execFileSync('dsh', [...base, 'add', spec], { env, stdio: 'inherit' })
}const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)))
const SEED = path.join(ROOT, 'e2e', 'fixture-mas')
const PORT = Number(process.env.POMASA_E2E_PORT || 43121)

const base = '/tmp/pomasa-e2e-live'
fs.rmSync(base, { recursive: true, force: true })
const pomasaHome = path.join(base, 'pomasa_home')
const dshHome = path.join(base, 'dsh_home')
fs.mkdirSync(dshHome, { recursive: true })

let proc

function cleanup() {
  try {
    if (proc) proc.kill('SIGKILL')
    fs.rmSync(base, { recursive: true, force: true })
  } catch { /* ignore */ }
}
process.on('exit', () => { try { fs.rmSync(URL_FILE, { force: true }) } catch { /* ignore */ } })
process.on('exit', cleanup)
process.on('SIGTERM', () => { cleanup(); process.exit(0) })
process.on('SIGINT', () => { cleanup(); process.exit(0) })

fs.cpSync(SEED, pomasaHome, { recursive: true })

let env = Object.assign({}, process.env, {
  DSH_HOME: dshHome,
  POMASA_HOME: pomasaHome,
  // E2E never calls a real LLM: generation is mocked (fast, deterministic),
  // unless POMASA_E2E_FAST=0 opts into the real provider (needs API key).
  POMASA_TEST_FAST_GENERATION: process.env.POMASA_E2E_FAST === '0' ? '0' : '1',
})

if (process.env.POMASA_E2E_SRC_HOME === 'user') {
  // Copy the user's sessions + model settings (not profiles, whose node_modules
  // would blow the copy); dsh auto-creates a fresh web profile + this plugin.
  const src = path.join(os.homedir(), '.dsh')
  if (!fs.existsSync(src)) {
    console.error('~/.dsh not found')
    process.exit(1)
  }
  fs.cpSync(src, dshHome, {
    recursive: true,
    filter: (p) => !p.includes('node_modules') && !p.split(path.sep).includes('profiles'),
  })
  execFileSync('dsh', ['--profile', 'web', '--help'], { env, stdio: 'ignore' })
  // 坞先装（bundles 先于本插件，register 发生在本插件 apply 之前，才能入坞）
  addPluginWithCompatRetry(env, path.join(ROOT, '..', 'dsh-app-dock'), ['dsh-app-dock@0.1.4','dsh-app-dock@0.1.3','dsh-app-dock@0.1.2'])
  addPluginWithCompatRetry(env, ROOT, ['pomasa-studio@0.3.0','pomasa-studio@0.2.5'])
} else {
  execFileSync('dsh', ['--profile', 'web', '--help'], { env, stdio: 'ignore' })
  // 坞先装（bundles 先于本插件，register 发生在本插件 apply 之前，才能入坞）
  addPluginWithCompatRetry(env, path.join(ROOT, '..', 'dsh-app-dock'), ['dsh-app-dock@0.1.4','dsh-app-dock@0.1.3','dsh-app-dock@0.1.2'])
  addPluginWithCompatRetry(env, ROOT, ['pomasa-studio@0.3.0','pomasa-studio@0.2.5'])
}

// 0.2.x 起 web host 强制 token 鉴权（cookie 由首次带 token 访问下发）。
// 捕获 dsh stdout 里的带 token URL 写盘，供 e2e/auth.ts 读取。
const URL_FILE = path.join(ROOT, 'e2e', '.dsh-e2e-url')
let dshOut = ''
proc = spawn('dsh', ['--profile', 'web', '--no-open', '--port', String(PORT), '--trusted-host', `127.0.0.1:${PORT}`], { env })
proc.stdout?.on('data', (chunk) => {
  dshOut += chunk
  process.stdout.write(chunk)
  const m = dshOut.match(/http:\/\/127\.0\.0\.1:\d+\/\?token=[A-Za-z0-9_-]+/)
  if (m) { try { fs.writeFileSync(URL_FILE, m[0]) } catch { /* ignore */ } }
})
proc.stderr?.on('data', () => {})

for (let i = 0; i < 120; i += 1) {
  await new Promise((r) => setTimeout(r, 500))
  try {
    // 0.2.x 鉴权会挡掉未带 cookie 的 API 调用，就绪判定只看端口/HTTP 已应答。
    const res = await fetch(`http://127.0.0.1:${PORT}/`)
    if (res.status > 0 && res.status < 500) {
      console.log(`POMASA_STUDIO_E2E_READY ${URL_FILE}`)
      setInterval(() => {}, 1 << 30)
      break
    }
  } catch { /* not up yet */ }
  if (i === 119) {
    process.exitCode = 1
    console.error('dsh web did not become ready')
  }
}