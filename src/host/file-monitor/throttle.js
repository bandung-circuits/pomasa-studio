// Windowed change throttle (leading + chained trailing):
// - first notify: fire immediately, open a window
// - notify inside a window: mark dirty only
// - window ends with dirty: fire and immediately open the next window (chain)
// - window ends clean: chain stops; next notify leads again
// Timers are injectable for tests.
export function createChangeThrottle(fire, windowMs, timers) {
  const setT = (timers && timers.setTimeout) || setTimeout
  const clearT = (timers && timers.clearTimeout) || clearTimeout
  let timer = null
  let dirty = false

  function startWindow() {
    dirty = false
    timer = setT(() => {
      timer = null
      if (dirty) {
        fire()
        startWindow()
      }
    }, windowMs)
  }

  return {
    notify() {
      if (timer) { dirty = true; return }
      fire()
      startWindow()
    },
    stop() {
      if (timer) { clearT(timer); timer = null }
      dirty = false
    },
    get pending() { return !!timer },
  }
}
