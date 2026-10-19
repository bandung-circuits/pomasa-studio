/**
 * Background event bus. Host modules emit domain events; client refresh wiring
 * can subscribe later without coupling file-system to HTTP.
 */
const listeners = new Map()

export function on(event, fn) {
  if (!listeners.has(event)) listeners.set(event, new Set())
  listeners.get(event).add(fn)
  return () => listeners.get(event)?.delete(fn)
}

export function emit(event, payload) {
  const subs = listeners.get(event)
  if (!subs) return
  for (const fn of subs) {
    try { fn(payload) } catch { /* subscriber errors must not break emitters */ }
  }
}

export function clear() {
  listeners.clear()
}
