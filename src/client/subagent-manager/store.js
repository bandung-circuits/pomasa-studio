// Client subagent registry — resolves agentKey → sessionId via /pomasa/subagent.*

const subagentClient = {
  cache: {},
  subs: new Set(),
  emit() { for (const fn of this.subs) fn() },
  subscribe(fn) { this.subs.add(fn); return () => { this.subs.delete(fn) } },
  key(masId, unitKey, taskKey, agentKey) {
    return [masId, unitKey || 'default', taskKey || 'legacy', agentKey || ''].join('|')
  },
  clear() { this.cache = {}; this.emit() },
  set(entry) {
    const k = this.key(entry.masId, entry.unitKey, entry.taskKey, entry.agentKey)
    this.cache[k] = entry
    this.emit()
  },
  get(masId, unitKey, taskKey, agentKey) {
    return this.cache[this.key(masId, unitKey, taskKey, agentKey)] || null
  },
}

function subagentClientSubscribe(fn) { return subagentClient.subscribe(fn) }
function subagentClientSnapshot() { return subagentClient.cache }

function useSubagentClient() {
  if (typeof React.useSyncExternalStore === 'function') {
    return React.useSyncExternalStore(subagentClientSubscribe, subagentClientSnapshot)
  }
  const [v, setV] = React.useState(subagentClient.cache)
  React.useEffect(() => subagentClient.subscribe(() => setV(subagentClient.cache)), [])
  return v
}

async function refreshSubagentInfo(api, masId, unitKey, taskKey, agentKey) {
  if (!api || !masId || !agentKey) return null
  const r = await api.subagentInfo(masId, unitKey, taskKey, agentKey)
  if (r && r.ok) {
    subagentClient.set({
      masId,
      unitKey: unitKey || 'default',
      taskKey: taskKey || 'legacy',
      agentKey,
      sessionId: r.sessionId || null,
      alive: !!r.alive,
      live: !!r.live,
      registered: !!r.registered,
      agent: r.agent || null,
    })
  }
  return r
}

async function refreshSubagentList(api, masId, unitKey, taskKey) {
  if (!api || !masId) return null
  const r = await api.subagentList(masId, unitKey, taskKey)
  if (r && r.ok && r.alive) {
    for (const [agentKey, info] of Object.entries(r.alive)) {
      subagentClient.set({
        masId,
        unitKey: unitKey || 'default',
        taskKey: taskKey || 'legacy',
        agentKey,
        sessionId: info.sessionId || null,
        alive: !!info.alive,
        live: !!info.live,
        registered: !!info.registered,
      })
    }
  }
  return r
}
