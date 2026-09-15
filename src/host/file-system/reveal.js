import fs from 'node:fs'
import path from 'node:path'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'

const execFileAsync = promisify(execFile)

/** Human-readable file manager name for the current or given OS. */
export function fileManagerLabel(platform = process.platform) {
  if (platform === 'darwin') return 'Finder'
  if (platform === 'win32') return 'Explorer'
  return 'file manager'
}

/** Build a platform-specific reveal command without executing it. */
export function buildRevealCommand(targetPath, platform = process.platform) {
  const target = path.resolve(String(targetPath || ''))
  if (platform === 'darwin') {
    return { cmd: 'open', args: ['-R', target], fileManager: 'Finder' }
  }
  if (platform === 'win32') {
    return { cmd: 'explorer', args: [`/select,${target}`], fileManager: 'Explorer' }
  }
  const dir = fs.existsSync(target) && fs.statSync(target).isDirectory() ? target : path.dirname(target)
  return { cmd: 'xdg-open', args: [dir], fileManager: 'file manager' }
}

/**
 * Reveal a file or folder in the platform file manager.
 * macOS: Finder (`open -R`); Windows: Explorer (`/select`); Linux/other: `xdg-open` parent dir.
 */
export async function revealInFileManager(targetPath, opts = {}) {
  const platform = opts.platform || process.platform
  const target = path.resolve(String(targetPath || ''))
  if (!target || !fs.existsSync(target)) {
    return { ok: false, error: 'path not found' }
  }
  const { cmd, args, fileManager } = buildRevealCommand(target, platform)
  const execFn = opts.exec || execFileAsync
  try {
    await execFn(cmd, args, { windowsHide: true })
    return { ok: true, path: target, fileManager, platform }
  } catch (err) {
    return { ok: false, error: String(err?.message || err), path: target, fileManager, platform }
  }
}
