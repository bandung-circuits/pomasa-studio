// Thin fetch wrapper over the host /pomasa endpoints. No DSH client modules needed.
export function createApi() {
  async function request(path, opts) {
    const res = await fetch(path, Object.assign({}, opts, {
      headers: Object.assign({ 'Content-Type': 'application/json' }, (opts && opts.headers) || {}),
    }))
    if (!res.ok && res.status === 404) return { ok: false, error: 'not found' }
    return res.json()
  }
  function q(params) {
    const keys = Object.keys(params)
    if (!keys.length) return ''
    return '?' + keys.map((k) => k + '=' + encodeURIComponent(params[k] == null ? '' : params[k])).join('&')
  }
  return {
    meta: () => request('/pomasa/meta'),
    listMas: () => request('/pomasa/mas.list'),
    getMas: (masId) => request('/pomasa/mas.get' + q({ masId })),
    generationStatus: (masId) => request('/pomasa/generation.status' + q({ masId })),
    unitList: (masId) => request('/pomasa/unit.list' + q({ masId })),
    unitState: (masId, unitKey, taskKey) => request('/pomasa/unit.state' + q({ masId, unit: unitKey || 'default', task: taskKey || '' })),
    artifact: (masId, unitKey, taskKey, path) => request('/pomasa/artifact.read' + q({ masId, unit: unitKey || 'default', task: taskKey || 'legacy', path })),
    artifactHead: (masId, unitKey, taskKey, path) => request('/pomasa/artifact.read' + q({ masId, unit: unitKey || 'default', task: taskKey || 'legacy', path, head: '1' })),
    blueprintRead: (masId, path, stage) => request('/pomasa/blueprint.read' + q({ masId, path, ...(stage != null ? { stage } : {}) })),
    runLog: (masId, unitKey, taskKey) => request('/pomasa/run.log' + q({ masId, unit: unitKey || 'default', task: taskKey || 'legacy' })),
    generationLog: (masId) => request('/pomasa/generation.log' + q({ masId })),
    startRun: (masId, unitKey, taskKey, opts) => request('/pomasa/run.start', { method: 'POST', body: JSON.stringify({
      masId,
      unit: unitKey || 'default',
      task: taskKey || '',
      mode: (opts && opts.mode) || 'continue',
      instruction: (opts && opts.instruction) || '',
    }) }),
    unitAdd: (masId, key, kind) => request('/pomasa/unit.add', { method: 'POST', body: JSON.stringify({ masId, key, kind: kind || 'default' }) }),
    unitRename: (masId, unitKey, newKey) => request('/pomasa/unit.rename', { method: 'POST', body: JSON.stringify({ masId, unit: unitKey, newKey }) }),
    unitRemove: (masId, unitKey, permanent = false) => request('/pomasa/unit.remove', { method: 'POST', body: JSON.stringify({ masId, unit: unitKey, permanent: !!permanent }) }),
    taskCreate: (masId, unitKey) => request('/pomasa/task.create', { method: 'POST', body: JSON.stringify({ masId, unit: unitKey || 'default' }) }),
    taskRename: (masId, unitKey, taskKey, newKey) => request('/pomasa/task.rename', { method: 'POST', body: JSON.stringify({ masId, unit: unitKey || 'default', task: taskKey, newKey }) }),
    taskRemove: (masId, unitKey, taskKey, permanent = false) => request('/pomasa/task.remove', { method: 'POST', body: JSON.stringify({ masId, unit: unitKey || 'default', task: taskKey, permanent: !!permanent }) }),
    fsReveal: (masId, unitKey, taskKey) => request('/pomasa/fs.reveal', { method: 'POST', body: JSON.stringify({
      masId,
      unit: unitKey || 'default',
      ...(taskKey != null && taskKey !== '' ? { task: taskKey } : {}),
    }) }),
    exportMd: (content, format) => fetch('/pomasa/export', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ content, format }) }).then((r) => (r.ok ? r.blob() : null)),
    createMas: (fields) => request('/pomasa/mas.create', { method: 'POST', body: JSON.stringify(fields) }),
    recordSession: (masId, kind, unitKey, taskKey, sessionId, agentKey) => request('/pomasa/record', { method: 'POST', body: JSON.stringify({
      masId,
      kind,
      unit: unitKey || 'default',
      task: taskKey || 'legacy',
      sessionId,
      agentKey: agentKey || 'orchestrator',
    }) }),
    subagentList: (masId, unitKey, taskKey) => request('/pomasa/subagent.list' + q({ masId, unit: unitKey || 'default', task: taskKey || '' })),
    subagentInfo: (masId, unitKey, taskKey, agentKey) => request('/pomasa/subagent.info' + q({
      masId,
      unit: unitKey || 'default',
      task: taskKey || '',
      agentKey: agentKey || 'orchestrator',
    })),
    agentLog: (masId, unitKey, taskKey, agentKey) => request('/pomasa/agent.log' + q({
      masId,
      unit: unitKey || 'default',
      task: taskKey || '',
      agentKey: agentKey || 'orchestrator',
    })),
    deleteMas: (masId, permanent = false) => request('/pomasa/mas.delete', { method: 'POST', body: JSON.stringify({ masId, permanent: !!permanent }) }),
    designStart: (masId) => request('/pomasa/design.start', { method: 'POST', body: JSON.stringify({ masId }) }),
  }
}
