import fs from 'node:fs'
import path from 'node:path'
import { jsonResponse } from '../http.js'
import { masDir } from '../paths/index.js'
import * as bus from '../services/index.js'
import { createFileMonitor } from './monitor.js'
import { createChangeThrottle } from './throttle.js'

/**
 * Watch hub — one lazily-created monitor per scope (mas root), refcounted
 * subscribers, monitor-level change throttle. Two raw sources feed the same
 * throttle: the monitor's fs events, and host file-system writes via the
 * services bus (covers fs.watch blind spots and poll-strategy intervals).
 */
export function createWatchHub({ config, home }) {
  const windowMs = config.fileWatchWindowMs ?? 3000
  const intervalMs = config.fileWatchPollMs ?? 3000
  const scopes = new Map()

  function ensureScope(root) {
    let s = scopes.get(root)
    if (s) return s
    s = { subs: new Set(), throttle: null, monitor: null, busOff: null }
    s.throttle = createChangeThrottle(() => {
      for (const fn of [...s.subs]) {
        try { fn({ root }) } catch { /* subscriber errors must not break others */ }
      }
    }, windowMs)
    // fs.watch is timing-dependent; tests (and exotic hosts) can run bus-only
    if (config.fileWatchMonitor !== false) {
      s.monitor = createFileMonitor(root, () => s.throttle.notify(), { intervalMs })
      s.monitor.watch()
    }
    const prefix = root.endsWith(path.sep) ? root : root + path.sep
    s.busOff = bus.on('file.change', (p) => {
      const file = p && (p.path || p.from)
      if (file && String(file).startsWith(prefix)) s.throttle.notify()
    })
    scopes.set(root, s)
    return s
  }

  function subscribe(root, fn) {
    const s = ensureScope(root)
    s.subs.add(fn)
    return () => {
      s.subs.delete(fn)
      if (s.subs.size > 0) return
      s.throttle.stop()
      if (s.monitor) s.monitor.close()
      if (s.busOff) s.busOff()
      scopes.delete(root)
    }
  }

  /** SSE endpoint: streams throttled change events for one mas until req close. */
  function handleEvents(q, res, req) {
    const masId = String(q.masId || '')
    if (!masId) return jsonResponse(res, 400, { ok: false, error: 'masId is required' })
    const root = masDir(home(), masId)
    if (!fs.existsSync(root)) return jsonResponse(res, 404, { ok: false, error: 'no such mas' })
    res.writeHead(200, {
      'content-type': 'text/event-stream; charset=utf-8',
      'cache-control': 'no-cache',
      connection: 'keep-alive',
    })
    res.write(': connected\n\n')
    const unsub = subscribe(root, () => {
      try { res.write('data: {"type":"change"}\n\n') } catch { /* closed mid-write */ }
    })
    const ping = setInterval(() => {
      try { res.write(': ping\n\n') } catch { /* closed mid-write */ }
    }, 25000)
    if (typeof ping.unref === 'function') ping.unref()
    // Resolve only when the connection closes, so no framework layer ends the
    // response after the handler returns.
    return new Promise((resolve) => {
      const cleanup = () => { clearInterval(ping); unsub(); resolve() }
      if (req && typeof req.on === 'function') req.on('close', cleanup)
      else cleanup()
    })
  }

  return { subscribe, handleEvents, _scopes: scopes }
}
