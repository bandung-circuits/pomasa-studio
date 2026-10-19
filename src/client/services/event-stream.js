// Mas event stream — refcounted, per-masId shared EventSource over
// /pomasa/events. Subscribers get onChange per SSE event. If the stream
// never opens (old host without the endpoint), onUnsupported fires once so
// callers can fall back to polling; after a successful open, transient
// errors are left to EventSource's native auto-reconnect.

const streams = new Map()

export function subscribeMasEvents(masId, handlers) {
  const { onChange, onUnsupported } = handlers || {}
  const id = String(masId || '')
  if (!id) return () => {}
  if (typeof EventSource !== 'function') {
    if (onUnsupported) onUnsupported()
    return () => {}
  }
  let s = streams.get(id)
  if (!s) {
    s = { es: null, opened: false, failed: false, subs: new Set() }
    const es = new EventSource('/pomasa/events?masId=' + encodeURIComponent(id))
    s.es = es
    es.onopen = () => { s.opened = true }
    es.onmessage = () => {
      for (const sub of [...s.subs]) {
        try { sub.onChange && sub.onChange() } catch { /* subscriber errors isolated */ }
      }
    }
    es.onerror = () => {
      if (s.opened || s.failed) return
      s.failed = true
      try { es.close() } catch { /* ignore */ }
      for (const sub of [...s.subs]) {
        try { sub.onUnsupported && sub.onUnsupported() } catch { /* isolated */ }
      }
    }
    streams.set(id, s)
  }
  const sub = { onChange, onUnsupported }
  if (s.failed) {
    if (onUnsupported) onUnsupported()
  } else {
    s.subs.add(sub)
  }
  return () => {
    s.subs.delete(sub)
    if (s.subs.size === 0) {
      if (s.es) { try { s.es.close() } catch { /* ignore */ } }
      streams.delete(id)
    }
  }
}
