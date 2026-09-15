import fs from 'node:fs'
import * as fsx from '../file-system/index.js'
import { pomasaHome, registryPath } from '../paths/index.js'
import { DEFAULT_UNIT, LEGACY_TASK } from '../task-manager/state.js'

export function loadRegistry(config) {
  const file = registryPath(pomasaHome(config))
  if (!fs.existsSync(file)) return { version: 1, mas: [] }
  try {
    return JSON.parse(fsx.read(file))
  } catch {
    return { version: 1, mas: [] }
  }
}

export function saveRegistry(config, reg) {
  fsx.write(registryPath(pomasaHome(config)), JSON.stringify(reg, null, 2) + '\n')
}

export function upsertMas(config, patch) {
  const reg = loadRegistry(config)
  const i = reg.mas.findIndex((m) => m.id === patch.id)
  if (i >= 0) reg.mas[i] = { ...reg.mas[i], ...patch }
  else reg.mas.unshift({ id: patch.id, status: 'idle', createdAt: Date.now(), ...patch })
  saveRegistry(config, reg)
  return reg.mas.find((m) => m.id === patch.id)
}

export function scopeKey(unitKey, taskKey) {
  return `${unitKey || DEFAULT_UNIT}|${taskKey || LEGACY_TASK}`
}

/**
 * The single writer for session-related registry fields. All modules record
 * gen/run session ownership through this store so lastRunSessionIds and
 * lastAgentSessionIds have exactly one write path each.
 */
export function createRegistryStore(config) {
  const load = () => loadRegistry(config)
  const save = (reg) => saveRegistry(config, reg)
  const upsert = (patch) => upsertMas(config, patch)
  const findMas = (masId) => load().mas.find((m) => m.id === masId) || null

  function recordGenSession(masId, sessionId) {
    upsert({ id: masId, status: 'generating', lastGenSessionId: sessionId })
  }

  function markGenFailed(masId) {
    upsert({ id: masId, status: 'failed' })
  }

  function runSessionIds(masId) {
    const m = findMas(masId)
    return (m && m.lastRunSessionIds) || {}
  }

  function findRunSessionId(masId, unitKey, taskKey) {
    return runSessionIds(masId)[scopeKey(unitKey, taskKey)] || null
  }

  // Single-agent merge: one agent session joins an existing scope (/record).
  function recordRunSession(masId, { unitKey, taskKey, agentKey, sessionId }) {
    const key = agentKey || 'orchestrator'
    const scope = scopeKey(unitKey, taskKey)
    const existing = findMas(masId) || {}
    const lastAgentSessionIds = { ...(existing.lastAgentSessionIds || {}) }
    const agentMap = { ...(lastAgentSessionIds[scope] || {}), [key]: sessionId }
    lastAgentSessionIds[scope] = agentMap
    const orchSid = agentMap.orchestrator || (key === 'orchestrator' ? sessionId : (existing.lastRunSessionIds || {})[scope])
    upsert({
      id: masId,
      status: 'running',
      lastRunAt: Date.now(),
      lastRunSessionIds: { ...(existing.lastRunSessionIds || {}), [scope]: orchSid || sessionId },
      lastAgentSessionIds,
    })
  }

  // Bulk replace: a freshly prebuilt run tree becomes the scope's agent set.
  function recordRunAgents(masId, unitKey, taskKey, agentMap) {
    const scope = scopeKey(unitKey, taskKey)
    const existing = findMas(masId) || {}
    const orchSid = agentMap.orchestrator || (existing.lastRunSessionIds || {})[scope] || null
    upsert({
      id: masId,
      status: 'running',
      lastRunAt: Date.now(),
      lastRunSessionIds: { ...(existing.lastRunSessionIds || {}), [scope]: orchSid },
      lastAgentSessionIds: { ...(existing.lastAgentSessionIds || {}), [scope]: { ...agentMap } },
    })
  }

  return {
    load,
    save,
    upsertMas: upsert,
    findMas,
    recordGenSession,
    markGenFailed,
    recordRunSession,
    recordRunAgents,
    runSessionIds,
    findRunSessionId,
    scopeKey,
  }
}
