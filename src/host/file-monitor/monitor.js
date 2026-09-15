import fs from 'node:fs'
import path from 'node:path'

const SNAPSHOT_LIMIT = 5000

function defaultIgnore(name) {
  return name.startsWith('.')
}

/** Recursive `${path}:${mtimeMs}:${size}` snapshot of root, ignore-filtered, capped. */
function takeSnapshot(root, ignore) {
  const snap = new Map()
  const walk = (dir) => {
    if (snap.size >= SNAPSHOT_LIMIT) return
    let entries
    try { entries = fs.readdirSync(dir, { withFileTypes: true }) } catch { return }
    for (const e of entries) {
      if (snap.size >= SNAPSHOT_LIMIT) return
      if (ignore(e.name)) continue
      const full = path.join(dir, e.name)
      if (e.isDirectory()) walk(full)
      else {
        try {
          const st = fs.statSync(full)
          snap.set(full, st.mtimeMs + ':' + st.size)
        } catch { /* vanished mid-walk */ }
      }
    }
  }
  walk(root)
  return snap
}

function snapshotChanged(prev, next) {
  if (prev.size !== next.size) return true
  for (const [k, v] of next) {
    if (prev.get(k) !== v) return true
  }
  return false
}

/**
 * Watch a root for changes. Two strategies, chosen by the caller per task:
 * - 'watch' (default): fs.watch push. Falls back to 'poll' automatically when
 *   recursive watch is unsupported (Linux) or watch setup fails.
 * - 'poll': periodic snapshot diff — for scopes with many files where an OS
 *   watch is impractical.
 */
export class FileMonitor {
  constructor(root, onChange, opts) {
    const options = opts || {}
    this.root = root
    this.onChange = onChange
    this.strategy = options.strategy === 'poll' ? 'poll' : 'watch'
    this.intervalMs = options.intervalMs || 3000
    this.recursive = options.recursive !== false
    this.ignore = typeof options.ignore === 'function' ? options.ignore : defaultIgnore
    this._watcher = null
    this._timer = null
    this._snapshot = null
  }

  watch() {
    if (this._watcher || this._timer || !this.root || !fs.existsSync(this.root)) return
    if (this.strategy === 'watch') {
      try {
        this._watcher = fs.watch(this.root, { recursive: this.recursive }, () => {
          this._emit()
        })
        this._watcher.on('error', () => { this._fallbackToPoll() })
        return
      } catch { return this._fallbackToPoll() }
    }
    this._startPoll()
  }

  _fallbackToPoll() {
    if (this._watcher) {
      try { this._watcher.close() } catch { /* ignore */ }
      this._watcher = null
    }
    this.strategy = 'poll'
    this._startPoll()
  }

  _startPoll() {
    if (this._timer) return
    this._snapshot = takeSnapshot(this.root, this.ignore)
    this._timer = setInterval(() => {
      const next = takeSnapshot(this.root, this.ignore)
      if (snapshotChanged(this._snapshot, next)) {
        this._snapshot = next
        this._emit()
      }
    }, this.intervalMs)
    if (typeof this._timer.unref === 'function') this._timer.unref()
  }

  _emit() {
    if (typeof this.onChange === 'function') this.onChange({ root: this.root })
  }

  close() {
    if (this._watcher) {
      try { this._watcher.close() } catch { /* ignore */ }
      this._watcher = null
    }
    if (this._timer) {
      clearInterval(this._timer)
      this._timer = null
    }
    this._snapshot = null
  }
}

export function createFileMonitor(root, onChange, opts) {
  return new FileMonitor(root, onChange, opts)
}
