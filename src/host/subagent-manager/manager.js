import { loadDescriptor } from '../data/descriptor.js'
import { listDeclaredAgents, ORCHESTRATOR_KEY } from '../data/graph.js'
import { masDir } from '../paths/index.js'
import { promptLangFromMasRoot } from '../prompts/index.js'
import { standbyUserText } from '../prompts/warmup.js'
import { DEFAULT_UNIT, LEGACY_TASK } from '../task-manager/state.js'

function runScopeKey(unitKey, taskKey) {
  return `${unitKey || DEFAULT_UNIT}|${taskKey || LEGACY_TASK}`
}

/** Standby prompt — agent reads blueprint but does not start work until orchestrated. */
export function warmPrompt(agent, masRoot, unitRoot, lang) {
  return standbyUserText(agent, masRoot, unitRoot, lang || promptLangFromMasRoot(masRoot))
}

export function createSubagentManager(config, sessions, home, registry) {
  const { isAgentAlive, isAgentRegistered, sessionLog } = sessions
  const resolveHome = typeof home === 'function' ? home : () => config.pomasaHome

  function masRoot(masId) {
    return masDir(resolveHome(), masId)
  }

  function listDeclared(masId) {
    const root = masRoot(masId)
    const descriptor = loadDescriptor(root)
    if (!descriptor) return { ok: false, code: 404, error: 'mas not generated yet' }
    return { ok: true, agents: listDeclaredAgents(descriptor, root) }
  }

  function agentSessions(masId, unitKey, taskKey) {
    const m = registry.findMas(masId)
    if (!m || !m.lastAgentSessionIds) return {}
    return m.lastAgentSessionIds[runScopeKey(unitKey, taskKey)] || {}
  }

  async function agentStatus(sessionId) {
    if (!sessionId) return { sessionId: null, registered: false, live: false, alive: false }
    const live = typeof isAgentRegistered === 'function' ? await isAgentRegistered(sessionId) : false
    const alive = typeof isAgentAlive === 'function' ? await isAgentAlive(sessionId) : false
    return {
      sessionId,
      registered: true,
      live: live === true,
      alive: alive === true,
    }
  }

  async function listAlive(masId, unitKey, taskKey) {
    const map = agentSessions(masId, unitKey, taskKey)
    const out = {}
    for (const [key, sessionId] of Object.entries(map)) {
      if (!sessionId) {
        out[key] = { sessionId: null, alive: false, live: false, registered: false }
        continue
      }
      out[key] = await agentStatus(sessionId)
    }
    return { ok: true, agents: out }
  }

  async function getInfo(masId, agentKey, unitKey, taskKey) {
    const declared = listDeclared(masId)
    if (!declared.ok) return declared
    const agent = declared.agents.find((a) => a.key === agentKey)
    if (!agent) return { ok: false, code: 404, error: 'unknown agent' }
    const map = agentSessions(masId, unitKey, taskKey)
    const sessionId = map[agentKey] || null
    if (!sessionId) {
      return {
        ok: true,
        agent,
        registered: false,
        live: false,
        sessionId: null,
        alive: false,
      }
    }
    const st = await agentStatus(sessionId)
    return {
      ok: true,
      agent,
      registered: st.registered,
      live: st.live,
      sessionId: st.sessionId,
      alive: st.alive,
    }
  }

  async function getAgentLog(masId, agentKey, unitKey, taskKey) {
    const declared = listDeclared(masId)
    if (!declared.ok) return declared
    const agent = declared.agents.find((a) => a.key === agentKey)
    if (!agent) return { ok: false, code: 404, error: 'unknown agent' }
    const map = agentSessions(masId, unitKey, taskKey)
    const sessionId = map[agentKey] || null
    if (!sessionId) return { ok: false, code: 404, error: 'no session for agent' }
    const log = typeof sessionLog === 'function' ? await sessionLog(sessionId) : null
    if (!log) return { ok: false, code: 404, error: 'session log unavailable' }
    return {
      ok: true,
      sessionId,
      meta: log.meta || null,
      events: log.events || [],
    }
  }

  async function warmUp(masId, agentKey, unitKey, taskKey, unitRoot) {
    const declared = listDeclared(masId)
    if (!declared.ok) return declared
    const agent = declared.agents.find((a) => a.key === agentKey)
    if (!agent) return { ok: false, error: 'unknown agent' }
    const root = masRoot(masId)
    const lang = promptLangFromMasRoot(root)
    return {
      ok: true,
      agentKey,
      prompt: warmPrompt(agent, root, unitRoot, lang),
    }
  }

  function buildWarmAgents(descriptor, masRoot, unitRoot) {
    const agents = listDeclaredAgents(descriptor, masRoot)
    const lang = promptLangFromMasRoot(masRoot)
    const out = []
    for (const agent of agents) {
      if (agent.key === ORCHESTRATOR_KEY) continue
      out.push({
        key: agent.key,
        kind: agent.kind,
        title: agent.title,
        agent: agent.agent,
        prompt: warmPrompt(agent, masRoot, unitRoot, lang),
      })
    }
    return out
  }

  async function stop(_masId, _agentKey) {
    return { ok: false, error: 'stop via client session.cancel (phase 2)' }
  }

  async function restart(_masId, _agentKey) {
    return { ok: false, error: 'restart not implemented (phase 2)' }
  }

  return {
    listDeclared,
    listAlive,
    getInfo,
    getAgentLog,
    warmUp,
    warmPrompt,
    buildWarmAgents,
    stop,
    restart,
  }
}
