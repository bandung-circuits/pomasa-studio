import path from 'node:path'
import { loadDescriptor } from '../data/descriptor.js'
import { listDeclaredAgents, ORCHESTRATOR_KEY } from '../data/graph.js'
import { loadRegistry, upsertMas } from '../MAS-manager/registry.js'
import { runPrompt } from '../MAS-creator/prompt.js'
import { defaultModel, promptMessage } from '../http.js'
import { warmPrompt } from '../subagent-manager/manager.js'
import { DEFAULT_UNIT, LEGACY_TASK } from '../task-manager/state.js'
import { agentSessionId } from './ids.js'
import { standbyAssistantText, standbySeed, standbyUserText } from './seed.js'

function runScopeKey(unitKey, taskKey) {
  return `${unitKey || DEFAULT_UNIT}|${taskKey || LEGACY_TASK}`
}

function resolveModel(ctx) {
  try {
    const sel = ctx.get?.('agentDefaultModel')
    if (sel && typeof sel.currentSelection === 'function') {
      const cur = sel.currentSelection()
      if (cur && cur.model) return { provider: cur.provider || 'deepseek-official', model: cur.model }
    }
  } catch { /* ignore */ }
  const dm = defaultModel()
  if (dm && dm.model) return { provider: dm.provider || 'deepseek-official', model: dm.model }
  return { provider: 'deepseek-official', model: 'deepseek-chat' }
}

export function createAgentCreator(ctx, deps) {
  const { workspace, config } = deps

  function getAgents() {
    try { return ctx.get('agents') } catch { return null }
  }

  function getAgentPresets() {
    try { return ctx.get('agentPresets') } catch { return null }
  }

  async function resolvePresetId(presetId) {
    const id = presetId || 'standard'
    const presets = getAgentPresets()
    if (presets && typeof presets.resolve === 'function') {
      try {
        const resolved = await presets.resolve(id)
        if (resolved && resolved.id) return resolved.id
      } catch { /* fall through */ }
    }
    return id
  }

  async function setupRootAgent(agentCtx, resolvedPresetId) {
    const presets = getAgentPresets()
    if (presets && typeof presets.mount === 'function') {
      await presets.mount(agentCtx, resolvedPresetId)
    }
  }

  async function setupChildAgent(agentCtx, parentSessionId, resolvedPresetId) {
    const presets = getAgentPresets()
    const agents = getAgents()
    const parent = agents && typeof agents.get === 'function' ? agents.get(parentSessionId) : null
    if (presets && parent && parent.ctx && typeof presets.composeFrom === 'function') {
      presets.composeFrom(agentCtx, parent.ctx)
      return
    }
    if (presets && typeof presets.mount === 'function') {
      await presets.mount(agentCtx, resolvedPresetId)
    }
  }

  function buildAgentSetup(meta, resolvedPresetId) {
    const isChild = meta && meta.origin === 'subagent'
    const parentSessionId = meta && meta.parentSession
    return async (agentCtx) => {
      if (isChild && parentSessionId) {
        await setupChildAgent(agentCtx, parentSessionId, resolvedPresetId)
      } else {
        await setupRootAgent(agentCtx, resolvedPresetId)
      }
    }
  }

  async function parkAgentHandle(handle) {
    if (!handle || typeof handle.dispose !== 'function') return
    try {
      const r = handle.dispose()
      if (r && typeof r.then === 'function') await r
    } catch { /* best-effort */ }
  }

  async function ensureAgent({ sessionId, cwd, meta, seed, agentOptions, parkAfterSeed = false }) {
    const agents = getAgents()
    if (!agents || typeof agents.create !== 'function') {
      return { ok: false, error: 'agents service unavailable' }
    }
    const live = typeof agents.get === 'function' ? agents.get(sessionId) : null
    if (live) {
      if (!parkAfterSeed) return { ok: true, sessionId, reused: true, agent: live }
      return {
        ok: false,
        error: `agent ${sessionId} is still live; use New task & run to rebuild prebuilt subagents`,
      }
    }

    const resolvedPresetId = await resolvePresetId('standard')
    const setup = buildAgentSetup(meta, resolvedPresetId)
    const opts = {
      sessionId,
      meta: { cwd, agentPreset: resolvedPresetId, ...(meta || {}) },
      seed,
      agentOptions,
      setup,
    }
    try {
      const handle = await agents.create(opts)
      if (parkAfterSeed) {
        await parkAgentHandle(handle)
        return { ok: true, sessionId, reused: false, parked: true, agent: null }
      }
      return { ok: true, sessionId, reused: false, agent: handle.agent }
    } catch (e) {
      if (typeof agents.resume === 'function') {
        try {
          const handle = await agents.resume({
            resumeSessionId: sessionId,
            agentOptions,
            setup,
          })
          if (parkAfterSeed) {
            await parkAgentHandle(handle)
            return { ok: true, sessionId, reused: true, parked: true, agent: null }
          }
          return { ok: true, sessionId, reused: true, agent: handle.agent }
        } catch { /* fall through */ }
      }
      return { ok: false, error: String(e && e.message || e) }
    }
  }

  async function ensureRoot({ sessionId, cwd, seed, agentOptions }) {
    return ensureAgent({
      sessionId,
      cwd,
      meta: { delegationDepth: 0 },
      seed,
      agentOptions,
    })
  }

  async function ensureChild({ sessionId, cwd, parentSessionId, label, seed, agentOptions }) {
    return ensureAgent({
      sessionId,
      cwd,
      meta: {
        parentSession: parentSessionId,
        origin: 'subagent',
        delegationDepth: 1,
      },
      seed,
      agentOptions,
      parkAfterSeed: true,
    })
  }

  async function attachToCwdWorkspace(sessionId, cwd, title) {
    if (!workspace || typeof workspace.ensureWorkspace !== 'function') return
    try {
      const ws = await workspace.ensureWorkspace(cwd, title)
      if (ws && typeof ws.attachSession === 'function') {
        await ws.attachSession(sessionId)
      }
    } catch { /* best-effort */ }
  }

  function followup(sessionId, text) {
    const agents = getAgents()
    const agent = agents && typeof agents.get === 'function' ? agents.get(sessionId) : null
    if (!agent || typeof agent.followup !== 'function') {
      return { ok: false, error: 'agent not live' }
    }
    agent.followup(promptMessage(String(text || '')))
    return { ok: true }
  }

  function recordRunAgents(masId, unitKey, taskKey, agentMap) {
    const scope = runScopeKey(unitKey, taskKey)
    const existing = (loadRegistry(config).mas.find((m) => m.id === masId) || {})
    const orchSid = agentMap.orchestrator || null
    upsertMas(config, {
      id: masId,
      status: 'running',
      lastRunAt: Date.now(),
      lastRunSessionIds: { ...(existing.lastRunSessionIds || {}), [scope]: orchSid },
      lastAgentSessionIds: { ...(existing.lastAgentSessionIds || {}), [scope]: { ...agentMap } },
    })
  }

  function runPromptWithRoster(masRoot, unitRoot, unitKey, opts, roster) {
    const base = runPrompt(masRoot, unitRoot, unitKey, opts)
    if (!roster || !roster.length) return base
    const lines = roster
      .filter((r) => r.key !== ORCHESTRATOR_KEY)
      .map((r) => `- ${r.key}: ${r.sessionId} (${r.title})`)
      .join('\n')
    return `${base}

已预建子代理（**禁止**使用 subagent 工具新建；请用 send_message 复用下列 sessionId；list_agents 仅用于核对 id，不可轮询完成）：
${lines}`
  }

  /**
   * Prebuild orchestrator + stage subagents under task cwd with standby seed (zero LLM).
   */
  async function ensureRunTree({ masId, unitKey, taskKey, masRoot, unitRoot, opts }) {
    const descriptor = loadDescriptor(masRoot)
    if (!descriptor) return { ok: false, error: 'mas not generated yet' }
    const declared = listDeclaredAgents(descriptor, masRoot)
    const { provider, model } = resolveModel(ctx)
    const agentOptions = { provider, model }
    const agentMap = {}
    const roster = []
    const agentsOut = []

    const orchAgent = declared.find((a) => a.key === ORCHESTRATOR_KEY)
    if (!orchAgent) return { ok: false, error: 'orchestrator blueprint missing' }

    const orchSid = agentSessionId(masId, unitKey, taskKey, ORCHESTRATOR_KEY)
    const orchSeed = standbySeed({
      userText: standbyUserText(orchAgent, masRoot, unitRoot),
      assistantText: standbyAssistantText(orchAgent),
      provider,
      model,
    })
    const orch = await ensureRoot({ sessionId: orchSid, cwd: unitRoot, seed: orchSeed, agentOptions })
    if (!orch.ok) return orch
    agentMap.orchestrator = orchSid
    roster.push({ key: ORCHESTRATOR_KEY, sessionId: orchSid, title: orchAgent.title })
    await attachToCwdWorkspace(orchSid, unitRoot, `${masId}/${unitKey}/${taskKey}`)

    for (const agent of declared) {
      if (agent.key === ORCHESTRATOR_KEY) continue
      const sid = agentSessionId(masId, unitKey, taskKey, agent.key)
      const seed = standbySeed({
        userText: standbyUserText(agent, masRoot, unitRoot),
        assistantText: standbyAssistantText(agent),
        provider,
        model,
        subagentLabel: agent.title || agent.key,
      })
      const child = await ensureChild({
        sessionId: sid,
        cwd: unitRoot,
        parentSessionId: orchSid,
        label: agent.title,
        seed,
        agentOptions,
      })
      if (!child.ok) return child
      agentMap[agent.key] = sid
      roster.push({ key: agent.key, sessionId: sid, title: agent.title })
      agentsOut.push({
        key: agent.key,
        kind: agent.kind,
        title: agent.title,
        sessionId: sid,
        prompt: warmPrompt(agent, masRoot, unitRoot),
      })
      await attachToCwdWorkspace(sid, unitRoot, agent.title || agent.key)
    }

    recordRunAgents(masId, unitKey, taskKey, agentMap)

    const prompt = runPromptWithRoster(masRoot, unitRoot, `${unitKey}/${taskKey}`, opts, roster)

    return {
      ok: true,
      orchestratorSessionId: orchSid,
      agentMap,
      roster,
      agents: agentsOut,
      prompt,
    }
  }

  return {
    ensureAgent,
    ensureRoot,
    ensureChild,
    attachToCwdWorkspace,
    followup,
    ensureRunTree,
    runPromptWithRoster,
    agentSessionId,
  }
}
