import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

/**
 * Read the user's default agent model from the DSH host's settings.yaml.
 * Best-effort: the host config format is not a stable API, so any mismatch
 * (missing file, changed indentation) degrades to null instead of throwing.
 */
export function defaultModel() {
  try {
    const home = process.env.DSH_HOME || path.join(os.homedir(), '.dsh')
    const txt = fs.readFileSync(path.join(home, 'settings.yaml'), 'utf8')
    const block = txt.match(/agent-default-model:\s*\n((?:[ \t].*\n)*)/)
    if (!block) return null
    let model = null
    let provider = null
    for (const line of block[1].split('\n')) {
      const pm = line.match(/^\s*model:\s*["']?([^\s"']+)/)
      if (pm) model = pm[1]
      const pv = line.match(/^\s*provider:\s*["']?([^\s"']+)/)
      if (pv) provider = pv[1]
    }
    return model ? { model, ...(provider ? { provider } : {}) } : null
  } catch {
    return null
  }
}
