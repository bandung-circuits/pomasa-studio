import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { randomUUID } from 'node:crypto'

export const API_BASE = '/pomasa'

export function promptMessage(text) {
  return {
    id: randomUUID(),
    role: 'user',
    content: [{ type: 'text', text }],
    source: { kind: 'plugin', plugin: 'pomasa-studio' },
  }
}

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

export function parseQuery(url) {
  const q = new URL(url, 'http://x').searchParams
  const out = {}
  for (const [k, v] of q) out[k] = v
  return out
}

export function jsonResponse(res, code, obj) {
  const body = JSON.stringify(obj)
  res.writeHead(code, { 'content-type': 'application/json; charset=utf-8' })
  res.end(body)
}

export async function readBody(req) {
  let data = ''
  for await (const chunk of req) data += chunk
  return data ? JSON.parse(data) : {}
}

/** First heading (H1) of a markdown artifact, used as the file's own title. */
export function firstHeading(md) {
  if (typeof md !== 'string') return null
  for (const line of md.split('\n')) {
    const t = line.trim()
    if (t.startsWith('#')) return t.replace(/^#+\s*/, '').trim()
  }
  return null
}
