import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

/** Plugin package root (`src/host/`). */
export function pluginDir() {
  return fileURLToPath(new URL('../', import.meta.url))
}

/**
 * Resolve the global POMASA home. Returns the REALPATH: DSH compares workspace
 * and session paths verbatim, and on macOS /tmp is a symlink to /private/tmp —
 * a resolved-but-not-realpath path would mismatch the workspace the host
 * registers, breaking session grouping.
 */
export function pomasaHome(config = {}) {
  const resolved = path.resolve(config.pomasaHome || process.env.POMASA_HOME || path.join(os.homedir(), '.pomasa'))
  try { return fs.realpathSync(resolved) } catch { return resolved }
}

export function masDir(home, masId) {
  return path.join(home, masId)
}

export function workspaceDir(home, masId) {
  return path.join(masDir(home, masId), 'workspace')
}

export function unitDir(home, masId, unitKey) {
  return path.join(workspaceDir(home, masId), unitKey)
}

export function taskDir(home, masId, unitKey, taskId) {
  return path.join(unitDir(home, masId, unitKey), taskId)
}

export function registryPath(home) {
  return path.join(home, 'registry.json')
}

export function hiddenMarkerPath(root) {
  return path.join(root, '.pomasa-hidden')
}

/**
 * The packaged POMASA skill snapshot ships inside the plugin package.
 * Resolved via fileURLToPath, never URL.pathname: on Windows `.pathname` yields
 * a POSIX-style `/C:/...` path that path.resolve() then treats as current-drive
 * root, producing a doubled `C:\C:\...` prefix that does not exist.
 */
export function packagedSkillDir() {
  return fileURLToPath(new URL('../../../skill/', import.meta.url))
}

/** Checked-in template at repo root (`pomasa-home/`). */
export function templatePomasaHome() {
  return fileURLToPath(new URL('../../../pomasa-home', import.meta.url))
}
