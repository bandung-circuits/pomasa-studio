// Multi-platform host entry — darwin / win32 / linux.
// All OS-specific path, exec, and file-manager behavior goes through here.
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { fileURLToPath } from 'node:url'

const execFileAsync = promisify(execFile)

export function currentPlatform() {
  return process.platform
}

export function isWin32(platform = currentPlatform()) {
  return platform === 'win32'
}

export function isDarwin(platform = currentPlatform()) {
  return platform === 'darwin'
}

/** Resolve a `import.meta.url` / `new URL(...)` to a native path (Windows-safe). */
export function modulePath(url) {
  return fileURLToPath(url)
}

export function userHome() {
  return os.homedir()
}

export function dshHome(config = {}) {
  return path.resolve(config.dshHome || process.env.DSH_HOME || path.join(userHome(), '.dsh'))
}

export function execOptions(platform = currentPlatform()) {
  return { windowsHide: true, shell: false }
}

function comparePath(p, platform) {
  let s = String(p || '')
  if (platform === 'win32') {
    s = s.replace(/\//g, '\\')
    if (!/^[a-zA-Z]:\\$/.test(s)) s = s.replace(/\\+$/, '')
    return s.toLowerCase()
  }
  if (s !== '/') s = s.replace(/\/+$/, '')
  return s
}

/**
 * True when `target` is `base` or a descendant. On win32, comparison is
 * case-insensitive and slash-normalized so `C:\Foo` contains `c:/foo/bar`.
 */
export function isPathInside(target, base, platform = currentPlatform()) {
  if (!target || !base) return false
  if (platform === currentPlatform()) {
    const t = path.resolve(String(target))
    const b = path.resolve(String(base))
    const tC = platform === 'win32' ? t.toLowerCase() : t
    const bC = platform === 'win32' ? b.toLowerCase() : b
    if (tC === bC) return true
    const prefix = bC.endsWith(path.sep) ? bC : bC + path.sep
    return tC.startsWith(prefix)
  }
  const t = comparePath(target, platform)
  const b = comparePath(base, platform)
  if (t === b) return true
  const sep = platform === 'win32' ? '\\' : '/'
  const prefix = b.endsWith(sep) ? b : b + sep
  return t.startsWith(prefix)
}

export function fileManagerLabel(platform = currentPlatform()) {
  if (platform === 'darwin') return 'Finder'
  if (platform === 'win32') return 'Explorer'
  return 'file manager'
}

/** Build a platform-specific reveal command without executing it. */
export function buildRevealCommand(targetPath, platform = currentPlatform()) {
  const target = path.resolve(String(targetPath || ''))
  if (platform === 'darwin') {
    return { cmd: 'open', args: ['-R', target], fileManager: 'Finder' }
  }
  if (platform === 'win32') {
    return { cmd: 'explorer', args: ['/select,' + target], fileManager: 'Explorer' }
  }
  const dir = fs.existsSync(target) && fs.statSync(target).isDirectory() ? target : path.dirname(target)
  return { cmd: 'xdg-open', args: [dir], fileManager: 'file manager' }
}

/** explorer.exe often exits 1 after successfully opening a window. */
function isWindowsExplorerSuccess(err, platform) {
  if (platform !== 'win32' || !err) return false
  const status = err.status
  if (status === 1) return true
  if (typeof err.code === 'number' && err.code === 1) return true
  return false
}

/**
 * Reveal a file or folder in the platform file manager.
 * macOS: Finder (`open -R`); Windows: Explorer (`/select,`); Linux: `xdg-open`.
 */
export async function revealInFileManager(targetPath, opts = {}) {
  const platform = opts.platform || currentPlatform()
  const target = path.resolve(String(targetPath || ''))
  if (!target || !fs.existsSync(target)) {
    return { ok: false, error: 'path not found' }
  }
  const { cmd, args, fileManager } = buildRevealCommand(target, platform)
  const execFn = opts.exec || execFileAsync
  try {
    await execFn(cmd, args, execOptions(platform))
    return { ok: true, path: target, fileManager, platform }
  } catch (err) {
    if (isWindowsExplorerSuccess(err, platform)) {
      return { ok: true, path: target, fileManager, platform }
    }
    return { ok: false, error: String(err?.message || err), path: target, fileManager, platform }
  }
}
