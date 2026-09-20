import { loadDescriptor } from '../data/descriptor.js'
import { listDeclaredAgents, ORCHESTRATOR_KEY } from '../data/graph.js'
import { runPrompt } from '../MAS-creator/prompt.js'
import { defaultModel } from '../config/default-model.js'
import { promptMessage } from '../http.js'
import { promptLangFromMasRoot, promptT } from '../prompts/index.js'
import { warmPrompt } from '../subagent-manager/manager.js'
import { agentSessionId, designSessionId } from './ids.js'
import { standbyAssistantText, standbySeed, standbyUserText } from './seed.js'
import { designAssistantText, designUserText } from './design-prompt.js'

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
  const { workspace, config, registry } = deps

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

  function runPromptWithRoster(masRoot, unitRoot, unitKey, opts, roster, lang) {
    const l = lang || promptLangFromMasRoot(masRoot)
    const base = runPrompt(masRoot, unitRoot, unitKey, opts, l)
    if (!roster || !roster.length) return base
    const lines = roster
      .filter((r) => r.key !== ORCHESTRATOR_KEY)
      .map((r) => `- ${r.key}: ${r.sessionId} (${r.title})`)
      .join('\n')
    return `${base}

${promptT(l, 'run.roster')}
${lines}`
  }

  /**
   * Prebuild orchestrator + stage subagents under task cwd with standby seed (zero LLM).
   */
  async function ensureRunTree({ masId, unitKey, taskKey, masRoot, unitRoot, opts }) {
    const descriptor = loadDescriptor(masRoot)
    if (!descriptor) return { ok: false, error: 'mas not generated yet' }
    const declared = listDeclaredAgents(descriptor, masRoot)
    const lang = promptLangFromMasRoot(masRoot)
    const { provider, model } = resolveModel(ctx)
    const agentOptions = { provider, model }
    const agentMap = {}
    const roster = []
    const agentsOut = []

    const orchAgent = declared.find((a) => a.key === ORCHESTRATOR_KEY)
    if (!orchAgent) return { ok: false, error: 'orchestrator blueprint missing' }

    const orchSid = agentSessionId(masId, unitKey, taskKey, ORCHESTRATOR_KEY)
    const orchSeed = standbySeed({
      userText: standbyUserText(orchAgent, masRoot, unitRoot, lang),
      assistantText: standbyAssistantText(orchAgent, lang),
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
        userText: standbyUserText(agent, masRoot, unitRoot, lang),
        assistantText: standbyAssistantText(agent, lang),
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
        prompt: warmPrompt(agent, masRoot, unitRoot, lang),
      })
      await attachToCwdWorkspace(sid, unitRoot, agent.title || agent.key)
    }

    registry.recordRunAgents(masId, unitKey, taskKey, agentMap)

    const prompt = runPromptWithRoster(masRoot, unitRoot, `${unitKey}/${taskKey}`, opts, roster, lang)

    return {
      ok: true,
      orchestratorSessionId: orchSid,
      agentMap,
      roster,
      agents: agentsOut,
      prompt,
    }
  }

  /**
   * Live design agent under MAS root (not task cwd).
   */
  async function ensureDesignAgent({ masId, masRoot }) {
    const descriptor = loadDescriptor(masRoot)
    if (!descriptor) return { ok: false, error: 'mas not generated yet' }
    const declared = listDeclaredAgents(descriptor, masRoot)
    const lang = promptLangFromMasRoot(masRoot)
    const { provider, model } = resolveModel(ctx)
    const agentOptions = { provider, model }
    const sid = designSessionId(masId)
    const seed = standbySeed({
      userText: designUserText(masRoot, declared, lang),
      assistantText: designAssistantText(lang),
      provider,
      model,
    })
    const root = await ensureRoot({ sessionId: sid, cwd: masRoot, seed, agentOptions })
    if (!root.ok) return root
    await attachToCwdWorkspace(sid, masRoot, `${masId}/design`)
    return {
      ok: true,
      sessionId: sid,
      masRoot,
      reused: !!root.reused,
    }
  }

  return {
    ensureAgent,
    ensureRoot,
    ensureChild,
    attachToCwdWorkspace,
    followup,
    ensureRunTree,
    ensureDesignAgent,
    runPromptWithRoster,
    agentSessionId,
    designSessionId,
  }
}
