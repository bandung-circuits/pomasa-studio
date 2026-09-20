// Current navigation context: masId + unitKey + taskKey + agentKey (canvas node).

export const locators = {
  masId: null,
  unitKey: null,
  taskKey: null,
  agentKey: null,
  _snap: { masId: null, unitKey: null, taskKey: null, agentKey: null },
  subs: new Set(),
  emit() { for (const fn of this.subs) fn() },
  snapshot() { return this._snap },
  set(partial) {
    const nextMas = partial.masId !== undefined ? partial.masId : this.masId
    const nextUnit = partial.unitKey !== undefined ? partial.unitKey : this.unitKey
    const nextTask = partial.taskKey !== undefined ? partial.taskKey : this.taskKey
    const nextAgent = partial.agentKey !== undefined ? partial.agentKey : this.agentKey
    if (nextMas === this.masId && nextUnit === this.unitKey && nextTask === this.taskKey && nextAgent === this.agentKey) return
    this.masId = nextMas
    this.unitKey = nextUnit
    this.taskKey = nextTask
    this.agentKey = nextAgent
    this._snap = { masId: this.masId, unitKey: this.unitKey, taskKey: this.taskKey, agentKey: this.agentKey }
    this.emit()
  },
  subscribe(fn) {
    this.subs.add(fn)
    return () => { this.subs.delete(fn) }
  },
}

function locatorsSubscribe(fn) { return locators.subscribe(fn) }
function locatorsSnapshot() { return locators._snap }

export function useLocators() {
  if (typeof React.useSyncExternalStore === 'function') {
    return React.useSyncExternalStore(locatorsSubscribe, locatorsSnapshot)
  }
  const [v, setV] = React.useState(locators.snapshot())
  React.useEffect(() => locators.subscribe(() => setV(locators.snapshot())), [])
  return v
}
