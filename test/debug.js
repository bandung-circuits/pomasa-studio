#!/usr/bin/env node
/**
 * Local dev loop: rebuild the plugin client bundle and restart dsh web.
 *
 * Avoids manually finding/killing the dsh main process on 3080, 3081, …
 *
 * Usage:
 *   node test/debug.js              # build + restart (foreground)
 *   node test/debug.js --watch      # watch src/assets → rebuild + restart (≤1/3s)
 *   node test/debug.js --no-build   # restart only
 *   node test/debug.js --verify     # build + verify + restart
 *   node test/debug.js --detach     # build + restart in background
 *
 * Env:
 *   POMASA_DEBUG_PORT=3080        first port to scan (default 3080)
 *   POMASA_DEBUG_PORT_COUNT=20    how many consecutive ports to scan
 *   DSH_CMD="npx @deepseek-ai/dsh" override dsh launcher
 */
import { spawn, execFileSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)))
const args = process.argv.slice(2)
const verify = args.includes('--verify')
const noBuild = args.includes('--no-build')
const detach = args.includes('--detach')
const watch = args.includes('--watch')
const portArg = args.find((a, i) => args[i - 1] === '--port')
const firstPort = Number(process.env.POMASA_DEBUG_PORT || portArg || 3080)
const portCount = Number(process.env.POMASA_DEBUG_PORT_COUNT || 20)
const REFRESH_MS = 3000

/** @type {import('node:child_process').ChildProcess | null} */
let dshChild = null
let watchStopping = false
let refreshBusy = false
let refreshQueued = false
let refreshTimer = null
let lastRefreshAt = 0

function log(msg) {
  console.log(`[debug] ${msg}`)
}

function run(cmd, cmdArgs, opts = {}) {
  log(`${cmd} ${cmdArgs.join(' ')}`)
  const r = spawn(cmd, cmdArgs, { stdio: 'inherit', cwd: ROOT, ...opts })
  return new Promise((resolve, reject) => {
    r.on('error', reject)
    r.on('close', (code) => (code === 0 ? resolve() : reject(new Error(`${cmd} exited ${code}`))))
  })
}

function sleep(ms) {
  const end = Date.now() + ms
  while (Date.now() < end) { /* short grace period */ }
}

function pidsOnPorts(start, count) {
  const ports = new Set()
  for (let i = 0; i < count; i += 1) ports.add(start + i)
  const pids = new Set()
  try {
    const out = execFileSync('lsof', ['-nP', '-iTCP', '-sTCP:LISTEN'], { encoding: 'utf8' })
    for (const line of out.split('\n')) {
      const portMatch = line.match(/:(\d+)\s+\(LISTEN\)/)
      if (!portMatch || !ports.has(Number(portMatch[1]))) continue
      const pidMatch = line.match(/^[^(]+\s+(\d+)/)
      if (pidMatch) pids.add(Number(pidMatch[1]))
    }
  } catch { /* lsof unavailable or no listeners */ }
  return pids
}

function pidsByCommand() {
  const pids = new Set()
  for (const pattern of ['dsh', '@deepseek-ai/dsh']) {
    try {
      const out = execFileSync('pgrep', ['-fl', pattern], { encoding: 'utf8' })
      for (const line of out.split('\n')) {
        if (!/\bweb\b/.test(line)) continue
        const m = line.match(/^(\d+)/)
        if (m) pids.add(Number(m[1]))
      }
    } catch { /* no matches */ }
  }
  return pids
}

function stopDshWeb() {
  const pids = new Set([...pidsOnPorts(firstPort, portCount), ...pidsByCommand()])
  if (pids.size === 0) {
    log(`no dsh web listener on ${firstPort}–${firstPort + portCount - 1}`)
    return
  }
  for (const pid of pids) {
    try {
      process.kill(pid, 'SIGTERM')
      log(`SIGTERM pid ${pid}`)
    } catch { /* already gone */ }
  }
  const deadline = Date.now() + 4000
  while (Date.now() < deadline) {
    let alive = false
    for (const pid of pids) {
      try {
        process.kill(pid, 0)
        alive = true
      } catch { /* exited */ }
    }
    if (!alive) break
    sleep(200)
  }
  for (const pid of pids) {
    try {
      process.kill(pid, 0)
      process.kill(pid, 'SIGKILL')
      log(`SIGKILL pid ${pid}`)
    } catch { /* exited */ }
  }
}

function stopTrackedDsh() {
  if (dshChild && !dshChild.killed) {
    try {
      dshChild.kill('SIGTERM')
      log(`SIGTERM dsh child pid ${dshChild.pid}`)
    } catch { /* ignore */ }
    dshChild = null
  }
  stopDshWeb()
}

function dshLaunch() {
  const envCmd = process.env.DSH_CMD
  if (envCmd) {
    const parts = envCmd.trim().split(/\s+/).filter(Boolean)
    return { cmd: parts[0], args: [...parts.slice(1), 'web'] }
  }
  const local = path.join(ROOT, 'node_modules', '.bin', 'dsh')
  if (fs.existsSync(local)) return { cmd: local, args: ['web'] }
  return { cmd: process.platform === 'win32' ? 'npx.cmd' : 'npx', args: ['@deepseek-ai/dsh', 'web'] }
}

async function waitReady(port, timeoutMs = 60000) {
  const url = `http://127.0.0.1:${port}/pomasa/mas.list`
  const start = Date.now()
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(url)
      if (res.ok) {
        const body = await res.json()
        if (body && body.ok) return true
      }
    } catch { /* not up */ }
    await new Promise((r) => setTimeout(r, 400))
  }
  return false
}

async function buildOnce() {
  if (!noBuild) {
    await run(process.execPath, ['scripts/bundle-client.mjs'])
  }
  if (verify) {
    await run(process.execPath, ['verify.mjs'])
  }
}

function startDshForeground() {
  stopTrackedDsh()
  const { cmd, args: dshArgs } = dshLaunch()
  log(`starting ${cmd} ${dshArgs.join(' ')}`)
  dshChild = spawn(cmd, dshArgs, {
    cwd: ROOT,
    stdio: 'inherit',
    env: process.env,
  })
  dshChild.on('exit', (code, signal) => {
    dshChild = null
    if (watchStopping) return
    if (watch) {
      log(`dsh exited (${signal || code}); waiting for file changes…`)
      return
    }
    process.exit(code ?? 0)
  })
  return dshChild
}

async function refreshCycle(reason) {
  if (refreshBusy) {
    refreshQueued = true
    return
  }
  const elapsed = Date.now() - lastRefreshAt
  if (elapsed < REFRESH_MS) {
    scheduleRefresh(REFRESH_MS - elapsed, reason)
    return
  }
  refreshBusy = true
  refreshQueued = false
  lastRefreshAt = Date.now()
  try {
    log(reason ? `refresh (${reason})` : 'refresh')
    await buildOnce()
    startDshForeground()
  } catch (err) {
    log(`refresh failed: ${err.message || err}`)
  } finally {
    refreshBusy = false
    if (refreshQueued) scheduleRefresh(REFRESH_MS, 'queued')
  }
}

function scheduleRefresh(delay, reason) {
  if (refreshTimer) clearTimeout(refreshTimer)
  refreshTimer = setTimeout(() => {
    refreshTimer = null
    void refreshCycle(reason || 'watch')
  }, Math.max(0, delay))
}

function shouldWatchPath(name) {
  if (!name || typeof name !== 'string') return false
  const base = path.basename(name)
  if (base.startsWith('.') || base.endsWith('~')) return false
  if (base.endsWith('.md')) return false
  return /\.(js|mjs|cjs|json|svg|yml|yaml)$/.test(base) || base === 'bundle-client.mjs'
}

function watchTargets() {
  const dirs = [
    path.join(ROOT, 'src', 'client'),
    path.join(ROOT, 'src', 'host'),
    path.join(ROOT, 'assets'),
    path.join(ROOT, 'scripts'),
  ]
  const files = [
    path.join(ROOT, 'cordis.patch.yml'),
  ]
  return { dirs: dirs.filter((d) => fs.existsSync(d)), files: files.filter((f) => fs.existsSync(f)) }
}

function startWatchers() {
  const { dirs, files } = watchTargets()
  const onEvent = (_event, filename) => {
    if (!shouldWatchPath(filename)) return
    log(`change: ${filename}`)
    void refreshCycle(String(filename))
  }
  for (const dir of dirs) {
    try {
      fs.watch(dir, { recursive: true }, onEvent)
      log(`watch ${path.relative(ROOT, dir)}/`)
    } catch (err) {
      log(`watch failed for ${dir}: ${err.message || err}`)
    }
  }
  for (const file of files) {
    try {
      fs.watch(file, onEvent)
      log(`watch ${path.relative(ROOT, file)}`)
    } catch (err) {
      log(`watch failed for ${file}: ${err.message || err}`)
    }
  }
  log(`watch mode on — refresh at most once every ${REFRESH_MS / 1000}s`)
}

async function runWatchMode() {
  await refreshCycle('initial')
  startWatchers()
  process.on('SIGINT', () => {
    watchStopping = true
    if (refreshTimer) clearTimeout(refreshTimer)
    stopTrackedDsh()
    process.exit(0)
  })
  process.on('SIGTERM', () => {
    watchStopping = true
    if (refreshTimer) clearTimeout(refreshTimer)
    stopTrackedDsh()
    process.exit(0)
  })
  await new Promise(() => {})
}

async function main() {
  if (watch) {
    if (detach) {
      console.error('[debug] --watch cannot be combined with --detach')
      process.exit(1)
    }
    await runWatchMode()
    return
  }

  await buildOnce()
  stopDshWeb()

  const { cmd, args: dshArgs } = dshLaunch()
  log(`starting ${cmd} ${dshArgs.join(' ')}`)

  if (detach) {
    const child = spawn(cmd, dshArgs, {
      cwd: ROOT,
      detached: true,
      stdio: ['ignore', 'pipe', 'pipe'],
      env: process.env,
    })
    let port = firstPort
    child.stdout?.on('data', (buf) => {
      const text = buf.toString()
      process.stdout.write(text)
      const m = text.match(/127\.0\.0\.1:(\d+)/)
      if (m) port = Number(m[1])
    })
    child.stderr?.pipe(process.stderr)
    child.unref()
    for (let i = 0; i < 120; i += 1) {
      if (await waitReady(port, 500)) {
        log(`ready http://127.0.0.1:${port}`)
        process.exit(0)
      }
      await new Promise((r) => setTimeout(r, 500))
    }
    console.error('[debug] dsh web did not become ready')
    process.exit(1)
  }

  await run(cmd, dshArgs)
}

main().catch((err) => {
  console.error('[debug]', err.message || err)
  process.exit(1)
})
