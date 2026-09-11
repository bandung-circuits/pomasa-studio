import path from 'node:path'
import { loadDescriptor } from '../data/descriptor.js'
import { listDeclaredAgents, ORCHESTRATOR_KEY } from '../data/graph.js'
import { loadRegistry } from '../MAS-manager/registry.js'
import { masDir } from '../paths/index.js'
import { DEFAULT_UNIT, LEGACY_TASK } from '../task-manager/state.js'

function runScopeKey(unitKey, taskKey) {
  return `${unitKey || DEFAULT_UNIT}|${taskKey || LEGACY_TASK}`
}

/** Standby prompt — agent reads blueprint but does not start work until orchestrated. */
export function warmPrompt(agent, masRoot, unitRoot) {
  const bp = path.join(masRoot, agent.agent)
  if (agent.kind === 'orchestrator' || agent.key === ORCHESTRATOR_KEY) {
    return `你是本 MAS 的编排者（Orchestrator）待机实例。请先阅读蓝图：${bp}

当前任务单元根（运行沙箱）：${unitRoot}
请保持待机，等待研究者启动运行或发出指令后再按蓝图编排各阶段。不要自行开始阶段工作或写产物。`
  }
  return `你是阶段子代理「${agent.title}」（${agent.key}）的待机实例。请先阅读蓝图：${bp}

当前任务单元根：${unitRoot}
请保持待机，等待编排者（Orchestrator）调度后再执行本阶段任务。不要自行开始工作或在单元根外写入文件。`
}

export function createSubagentManager(config, sessions, home) {
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
    const m = loadRegistry(config).mas.find((x) => x.id === masId)
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
    return {
      ok: true,
      agentKey,
      prompt: warmPrompt(agent, root, unitRoot),
    }
  }

  function buildWarmAgents(descriptor, masRoot, unitRoot) {
    const agents = listDeclaredAgents(descriptor, masRoot)
    const out = []
    for (const agent of agents) {
      if (agent.key === ORCHESTRATOR_KEY) continue
      out.push({
        key: agent.key,
        kind: agent.kind,
        title: agent.title,
        agent: agent.agent,
        prompt: warmPrompt(agent, masRoot, unitRoot),
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
