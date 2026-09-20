import fs from 'node:fs'
import path from 'node:path'
import { pluginDir } from '../paths/index.js'

let logDir = path.join(pluginDir(), 'logs')

export function setLogDir(dir) {
  logDir = dir
}

export function logDirPath() {
  return logDir
}

function stamp() {
  return new Date().toISOString()
}

function append(level, scope, message, detail) {
  try {
    fs.mkdirSync(logDir, { recursive: true })
    const line = JSON.stringify({
      t: Date.now(),
      iso: stamp(),
      level,
      scope,
      message: String(message),
      ...(detail !== undefined ? { detail } : {}),
    })
    fs.appendFileSync(path.join(logDir, 'host.log'), line + '\n')
  } catch { /* logging must never throw */ }
}

export function info(scope, message, detail) { append('info', scope, message, detail) }
export function warn(scope, message, detail) { append('warn', scope, message, detail) }
export function error(scope, message, detail) { append('error', scope, message, detail) }

/** Run fn; on failure log and return fallback (if provided). */
export function catchLog(scope, fn, fallback) {
  try {
    return fn()
  } catch (err) {
    error(scope, err?.message || String(err), { stack: err?.stack })
    return fallback
  }
}

/** Async variant of catchLog. */
export async function catchLogAsync(scope, fn, fallback) {
  try {
    return await fn()
  } catch (err) {
    error(scope, err?.message || String(err), { stack: err?.stack })
    return fallback
  }
}
