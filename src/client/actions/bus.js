// Global action bus — cross-module side-effect notifications.
// Rule: store methods may be called directly; the bus is only for notifying
// other modules of side effects (see README.md). Plain pub/sub, no cascading.

export const actionBus = {
  subs: new Map(),
  on(type, fn) {
    if (!this.subs.has(type)) this.subs.set(type, new Set())
    this.subs.get(type).add(fn)
    return () => this.off(type, fn)
  },
  off(type, fn) {
    const set = this.subs.get(type)
    if (set) set.delete(fn)
  },
  emit(type, payload) {
    const set = this.subs.get(type)
    if (set) for (const fn of set) { try { fn(payload) } catch (e) { console.error('[pomasa] action', type, e) } }
  },
}
