// Global action bus — cross-component events with optional parent/child propagation.

const ACTION_CHILDREN = {
  'mas.open': [],
  'mas.created': [],
  'unit.new': ['task.refresh'],
  'unit.delete': ['task.refresh'],
  'unit.rename': ['task.refresh'],
  'task.new': ['task.open', 'artifact.clear'],
  'task.delete': ['task.refresh'],
  'task.rename': ['task.refresh'],
  'task.open': ['artifact.clear'],
  'task.change': ['artifact.clear'],
}

const actionBus = {
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
    const kids = ACTION_CHILDREN[type]
    if (kids) for (const k of kids) this.emit(k, payload)
  },
}

function useAction(type, fn) {
  React.useEffect(() => actionBus.on(type, fn), [type, fn])
}
