import { DEFAULT_UNIT, LEGACY_TASK } from './task-manager/state.js'

export function sessionRunKey(masId, unitKey, taskKey) {
  return `${masId}|${unitKey || DEFAULT_UNIT}|${taskKey || LEGACY_TASK}`
}

export function createSessionRegistry(ctx, config, registry) {
  const genSessions = new Map()
  const runSessions = new Map()
  const sessionOwner = new Map()

  async function sessionLog(sessionId) {
    if (!sessionId) return null
    let persistence
    try {
      persistence = ctx.get?.('sessionPersistence')
    } catch { /* context may not expose it */ }
    if (!persistence || typeof persistence.inspect !== 'function') return null
    try {
      const inspected = await persistence.inspect(sessionId)
      return { sessionId, meta: inspected.meta, events: inspected.events || [] }
    } catch {
      return null
    }
  }

  async function isAgentAlive(sid) {
    if (!sid) return null
    try {
      const agents = ctx.get?.('agents')
      const registryKnown = agents && typeof agents.get === 'function'
      const a = registryKnown ? agents.get(sid) : null
      if (a) {
        if (a.status === 'ended' || a.status === 'disposed') return false
        return a.status === 'running'
      }
      const subs = ctx.get?.('subagents')
      if (subs && typeof subs.listChildren === 'function') {
        try {
          const rows = await subs.listChildren(sid)
          if (Array.isArray(rows) && rows.some((r) => r && r.activity === 'running')) return true
        } catch { /* catalog query failure is not fatal */ }
      }
      return registryKnown ? false : null
    } catch { /* ignore */ }
    return null
  }

  async function isAgentRegistered(sid) {
    if (!sid) return false
    try {
      const agents = ctx.get?.('agents')
      const a = agents && typeof agents.get === 'function' ? agents.get(sid) : null
      if (!a) return false
      return a.status !== 'ended' && a.status !== 'disposed'
    } catch { return false }
  }

  function bindAgentDisposed(isGenerationComplete) {
    if (typeof ctx.on !== 'function') return
    ctx.on('agent/disposed', (info) => {
      const sessionId = (info && (info.id ?? info.agentId ?? info.sessionId)) || ''
      if (typeof sessionId !== 'string' || !sessionId) return
      const owner = sessionOwner.get(sessionId)
      if (!owner) return
      sessionOwner.delete(sessionId)
      if (owner.kind === 'gen') {
        const masId = owner.masId
        if (!genSessions.has(masId)) return
        const generated = isGenerationComplete(masId)
        genSessions.delete(masId)
        if (!generated) registry.markGenFailed(masId)
      } else if (owner.runKey) {
        runSessions.delete(owner.runKey)
      }
    })
  }

  function recordSession(body, hasMas) {
    const masId = String(body.masId || '')
    if (!hasMas(masId)) return { ok: false, code: 404, error: 'no such mas' }
    const kind = body.kind === 'gen' ? 'gen' : 'run'
    const sessionId = String(body.sessionId || '')
    if (!sessionId) return { ok: false, code: 400, error: 'sessionId is required' }
    if (kind === 'gen') {
      registry.recordGenSession(masId, sessionId)
    } else {
      registry.recordRunSession(masId, {
        unitKey: body.unit || body.unitKey,
        taskKey: body.task || body.taskKey,
        agentKey: body.agentKey,
        sessionId,
      })
    }
    return { ok: true }
  }

  function clearMasSessions(masId) {
    const gen = genSessions.get(masId)
    if (gen && gen.agent && typeof gen.agent.cancel === 'function') {
      try { gen.agent.cancel('user') } catch { /* already gone */ }
    }
    genSessions.delete(masId)
    for (const [key, s] of runSessions) {
      if (key.startsWith(`${masId}|`)) {
        try { if (s.agent && typeof s.agent.cancel === 'function') s.agent.cancel('user') } catch { /* already gone */ }
        runSessions.delete(key)
      }
    }
    for (const [sid, owner] of sessionOwner) {
      if (owner.masId === masId) sessionOwner.delete(sid)
    }
  }

  return {
    genSessions,
    runSessions,
    sessionOwner,
    sessionLog,
    isAgentAlive,
    isAgentRegistered,
    bindAgentDisposed,
    recordSession,
    clearMasSessions,
  }
}
