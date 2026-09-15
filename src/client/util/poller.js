// createPoller — one async routine on an interval, with race guards:
// - trigger() during an in-flight run merges into it (and queues one re-run)
// - stop() invalidates the in-flight run: fn receives stale() and must check
//   it before writing state, so a superseded response can never land
export function createPoller(fn, ms) {
  let timer = null
  let generation = 0
  let inflight = null
  let queued = false

  async function run() {
    if (inflight) {
      queued = true
      return inflight
    }
    const gen = generation
    const stale = () => gen !== generation
    inflight = (async () => {
      try {
        await fn(stale)
      } catch { /* pollers are best-effort */ }
    })()
    try {
      await inflight
    } finally {
      inflight = null
      if (queued && gen === generation) {
        queued = false
        run()
      }
    }
  }

  return {
    start() { if (!timer) timer = setInterval(run, ms) },
    stop() {
      generation += 1
      queued = false
      if (timer) { clearInterval(timer); timer = null }
    },
    trigger: run,
  }
}
