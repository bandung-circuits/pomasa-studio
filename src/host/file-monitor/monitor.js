import fs from 'node:fs'

/** Replaceable file watch base. Phase 1: not wired into apply (client polls). */
export class FileMonitor {
  constructor(root, onChange) {
    this.root = root
    this.onChange = onChange
    this._watcher = null
  }

  watch() {
    if (this._watcher || !this.root || !fs.existsSync(this.root)) return
    try {
      this._watcher = fs.watch(this.root, { recursive: true }, () => {
        if (typeof this.onChange === 'function') this.onChange({ root: this.root })
      })
    } catch { /* fs.watch unsupported or path invalid */ }
  }

  close() {
    if (this._watcher) {
      try { this._watcher.close() } catch { /* ignore */ }
      this._watcher = null
    }
  }
}

export function createFileMonitor(root, onChange) {
  return new FileMonitor(root, onChange)
}
