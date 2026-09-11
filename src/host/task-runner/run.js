import fs from 'node:fs'
import path from 'node:path'
import { masDir } from '../paths/index.js'
import { loadDescriptor } from '../data/descriptor.js'
import { loadRegistry } from '../MAS-manager/registry.js'
import {
  createTaskDir,
  resolveTaskRoot,
  DEFAULT_UNIT,
  LEGACY_TASK,
} from '../task-manager/state.js'
import { promptMessage } from '../http.js'
import { sessionRunKey } from '../session-registry.js'

export function createTaskRunner(deps) {
  const { config, home, sessions, subMgr, agentCreator } = deps
  const { runSessions, isAgentAlive, sessionLog } = sessions

  function resolveRunTargets(body) {
    const masId = body.masId
    const unitKey = String(body.unit || body.unitKey || DEFAULT_UNIT)
    let taskKey = body.task || body.taskKey || null
    if (!taskKey) {
      const created = createTaskDir(config, masId, unitKey)
      taskKey = created.taskId
    }
    let resolved = resolveTaskRoot(config, masId, unitKey, taskKey)
    if (!resolved) {
      const created = createTaskDir(config, masId, unitKey, taskKey)
      resolved = { unitKey: created.unitKey, taskKey: created.taskId, root: created.root, legacy: false }
    }
    return [{ unitKey: resolved.unitKey, taskKey: resolved.taskKey, root: resolved.root }]
  }

  async function startRun(body, hasMas) {
    const { masId } = body
    if (!hasMas(masId)) return { ok: false, error: `no such mas: ${masId}` }

    if (body.units !== undefined) {
      const units = Array.isArray(body.units) ? body.units : [body.units]
      if (units.length !== 1) {
        return { ok: false, error: '一次只运行一个任务，请选择要运行的任务' }
      }
      body = { ...body, unit: units[0] }
    }

    const reg = loadRegistry(config)
    const m = reg.mas.find((x) => x.id === masId) || {}
    if (m.lastGenSessionId && (await isAgentAlive(m.lastGenSessionId))) {
      return { ok: false, error: 'MAS 正在生成中，生成完成前不能运行' }
    }
    if (m.lastRunSessionIds && Object.values(m.lastRunSessionIds).length) {
      for (const sid of Object.values(m.lastRunSessionIds)) {
        if (await isAgentAlive(sid)) {
          return { ok: false, error: '已有运行会话进行中，请等待完成或先取消' }
        }
      }
    }

    const descriptor = loadDescriptor(masDir(home(), masId))
    if (!descriptor) return { ok: false, error: 'mas not generated yet (no pomasa.json)' }

    const masRootPath = masDir(home(), masId)

    const targets = resolveRunTargets(body)
    if (targets.length !== 1) {
      return { ok: false, error: targets.length === 0 ? '没有可运行的任务' : '一次只运行一个任务，请选择要运行的任务' }
    }
    const { unitKey, taskKey, root } = targets[0]
    const mode = body.mode === 'fresh' ? 'fresh' : 'continue'
    const instruction = String(body.instruction || '').trim()
    if (mode === 'fresh' && fs.existsSync(root)) {
      for (const e of fs.readdirSync(root)) {
        const p = path.join(root, e)
        fs.rmSync(p, { recursive: true, force: true })
      }
    }
    fs.mkdirSync(root, { recursive: true })

    if (!agentCreator || typeof agentCreator.ensureRunTree !== 'function') {
      return { ok: false, error: 'agent creator unavailable' }
    }

    const tree = await agentCreator.ensureRunTree({
      masId,
      unitKey,
      taskKey,
      masRoot: masRootPath,
      unitRoot: root,
      opts: { mode, instruction },
    })
    if (!tree.ok) return tree

    return {
      ok: true,
      unitKey,
      taskKey,
      mode,
      prompt: tree.prompt,
      orchestratorSessionId: tree.orchestratorSessionId,
      agents: tree.agents,
    }
  }

  function handleRunIntervene(body) {
    const s = runSessions.get(sessionRunKey(body.masId, body.unit || DEFAULT_UNIT, body.task || body.taskKey || LEGACY_TASK))
    if (s) {
      s.agent.followup(promptMessage(String(body.message || '')))
      return { ok: true }
    }
    const reg = loadRegistry(config).mas.find((x) => x.id === body.masId) || {}
    const scope = `${body.unit || DEFAULT_UNIT}|${body.task || body.taskKey || LEGACY_TASK}`
    const sid = reg.lastRunSessionIds && reg.lastRunSessionIds[scope]
    if (sid && agentCreator && typeof agentCreator.followup === 'function') {
      const r = agentCreator.followup(sid, body.message)
      if (r.ok) return r
    }
    return { ok: false, code: 404, error: 'no active run session' }
  }

  function handleRunCancel(body) {
    const key = sessionRunKey(body.masId, body.unit || DEFAULT_UNIT, body.task || body.taskKey || LEGACY_TASK)
    const s = runSessions.get(key)
    if (s) {
      try { if (s.agent && typeof s.agent.cancel === 'function') s.agent.cancel() } catch { /* already gone */ }
      runSessions.delete(key)
    }
    return { ok: true }
  }

  async function getRunLog(masId, unitKey, taskKey) {
    const runKey = sessionRunKey(masId, unitKey, taskKey)
    const live = runSessions.get(runKey)
    const regGuess = loadRegistry(config).mas.find((m) => m.id === masId)
    const sid = (live && live.sessionId)
      || (regGuess && regGuess.lastRunSessionIds && (regGuess.lastRunSessionIds[`${unitKey}|${taskKey}`] || regGuess.lastRunSessionIds[unitKey]))
      || null
    const log = sid ? await sessionLog(sid) : null
    if (log) return { ok: true, log, events: [] }
    const resolved = resolveTaskRoot(config, masId, unitKey, taskKey)
    const workspace = path.join(masDir(home(), masId), 'workspace')
    const unitRoot = resolved ? resolved.root : path.join(workspace, unitKey, taskKey)
    if (unitRoot !== workspace && !unitRoot.startsWith(workspace + path.sep)) {
      return { ok: false, code: 400, error: 'unit path escapes mas workspace' }
    }
    const events = []
    if (fs.existsSync(path.join(unitRoot, 'events.jsonl'))) {
      const lines = fs.readFileSync(path.join(unitRoot, 'events.jsonl'), 'utf8').trim().split('\n').slice(-100)
      for (const line of lines) {
        try { events.push(JSON.parse(line)) } catch { /* skip malformed */ }
      }
    }
    return { ok: true, log: null, events }
  }

  return {
    startRun,
    handleRunIntervene,
    handleRunCancel,
    getRunLog,
  }
}
