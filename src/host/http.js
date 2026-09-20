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
  if (!data) return {}
  try {
    return JSON.parse(data)
  } catch {
    const err = new Error('invalid JSON body')
    err.code = 400
    throw err
  }
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
