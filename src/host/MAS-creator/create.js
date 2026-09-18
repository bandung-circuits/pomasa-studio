import fs from 'node:fs'
import path from 'node:path'
import { masDir } from '../paths/index.js'
import { modulePath } from '../platform/index.js'
import { loadDescriptor } from '../data/descriptor.js'
import { unitListing, collectRunJsonPaths } from '../task-manager/state.js'
import { writeUserInput, generationPrompt } from './prompt.js'
import { promptLangFromValue } from '../prompts/index.js'

export function createMasCreator(deps) {
  const { config, home, agentLoop, gens, sessions, registry } = deps
  const { genSessions, isAgentAlive, isAgentRegistered } = sessions

  function isGenerationComplete(masId) {
    const root = masDir(home(), masId)
    if (!fs.existsSync(path.join(root, 'pomasa.json'))) return false
    const descriptor = loadDescriptor(root)
    if (!descriptor || !Array.isArray(descriptor.stages)) return false
    const referenced = descriptor.stages.map((s) => s.agent).filter(Boolean)
    if (referenced.length === 0) return false
    return referenced.every((agent) => fs.existsSync(path.join(root, String(agent))))
  }

  function runFinalState(masRoot, descriptor) {
    const files = collectRunJsonPaths(config, path.basename(masRoot))
    const present = files.filter((f) => fs.existsSync(f))
    if (present.length === 0) return null
    let running = false
    let failed = false
    let completed = false
    for (const f of present) {
      let st = 'running'
      try { st = String((JSON.parse(fs.readFileSync(f, 'utf8'))).status ?? 'running') } catch { /* unreadable = running */ }
      st = st.toLowerCase()
      if (st === 'running' || st === 'queued') running = true
      else if (st === 'completed' || st === 'done') completed = true
      else failed = true
    }
    if (running) return 'running'
    if (failed) return 'failed'
    if (completed) return 'completed'
    return null
  }

  async function masSummary(m) {
    const root = masDir(home(), m.id)
    const descriptor = loadDescriptor(root)
    const generated = !!descriptor && isGenerationComplete(m.id)
    let status
    if (generated === false && ((m.lastGenSessionId && (await isAgentAlive(m.lastGenSessionId))) || genSessions.has(m.id))) {
      status = 'generating'
    } else if (!generated) {
      const attempted = !!(m.lastGenSessionId) || m.status === 'generating' || m.status === 'failed'
      status = attempted ? 'gen-failed' : 'idle'
    } else {
      const runSid = Object.values(m.lastRunSessionIds || {})[0] || null
      const alive = runSid ? (await isAgentAlive(runSid)) : null
      const registered = runSid && typeof isAgentRegistered === 'function' ? await isAgentRegistered(runSid) : false
      if (alive === true || (m.status === 'running' && registered)) {
        status = 'running'
      } else {
        const rf = runFinalState(root, descriptor)
        if (rf === 'failed') status = 'run-failed'
        else if (rf === 'running') status = 'run-failed'
        else if (rf === 'completed') status = 'completed'
        else status = 'idle'
      }
    }
    let unitCount = 0
    try {
      if (descriptor && Array.isArray(descriptor.stages)) unitCount = unitListing(config, descriptor, m.id).length
    } catch { /* non-fatal */ }
    return {
      id: m.id,
      name: m.name || m.id,
      description: m.description || '',
      status,
      unitCount,
      createdAt: m.createdAt ?? null,
      lastRunAt: m.lastRunAt ?? null,
    }
  }

  async function createMas(body) {
    const id = String(body.projectId || '').trim().toLowerCase()
    if (!id) return { ok: false, error: 'projectId is required' }
    if (!body.topic) return { ok: false, error: 'topic is required' }
    const root = masDir(home(), id)
    if (fs.existsSync(root)) return { ok: false, error: `mas already exists: ${id}` }

    fs.mkdirSync(path.join(root, 'workspace'), { recursive: true })
    fs.mkdirSync(path.join(root, 'agents'), { recursive: true })
    fs.mkdirSync(path.join(root, 'references'), { recursive: true })
    writeUserInput(config, id, body)

    registry.upsertMas({
      id,
      name: body.name || id,
      description: body.topic.slice(0, 120),
      status: 'generating',
      createdAt: Date.now(),
    })

    const refs = Array.isArray(body.refFiles) ? body.refFiles : []
    for (const rf of refs) {
      const safe = path.basename(String(rf.name || ''))
      if (!safe) continue
      fs.writeFileSync(path.join(root, 'references', safe), String(rf.content || ''), 'utf8')
    }

    if (!agentLoop) {
      return { ok: true, masId: id, generation: 'external' }
    }

    if (config.fastGeneration === true || process.env.POMASA_TEST_FAST_GENERATION === '1') {
      const fakeSessionId = `pomasa-gen-${id}`
      const events = []
      const push = (type, data) => events.push({ type, seq: events.length + 1, time: Date.now(), data })
      push('message', { role: 'assistant', content: '开始生成 MAS：读取 POMASA skill 与模式目录（mock）。' })
      push('tool', { name: 'read', arguments: JSON.stringify({ file: 'SKILL.md' }) })
      push('tool', { name: 'read', arguments: JSON.stringify({ file: 'pattern-catalog/README.md' }) })
      setTimeout(() => {
        try {
          const srcRoot = modulePath(new URL('../../../fixtures/mock-generated', import.meta.url))
          fs.cpSync(srcRoot, root, { recursive: true })
          const pj = path.join(root, 'pomasa.json')
          let txt = fs.readFileSync(pj, 'utf8')
          txt = txt.split('PLACEHOLDER_MAS_ID').join(id).split('MOCK_MAS_NAME').join(body.name || id)
          fs.writeFileSync(pj, txt)
          push('tool', { name: 'write', arguments: JSON.stringify({ file: 'agents/00.orchestrator.md' }) })
          push('message', { role: 'assistant', content: 'MAS 骨架生成完成（mock）：pomasa.json 已写入。' })
        } catch (e) {
          push('message', { role: 'assistant', content: 'mock 生成失败：' + String(e && e.message || e) })
        }
      }, 3000)
      genSessions.set(id, { agent: null, sessionId: fakeSessionId, fast: true, events, startedAt: Date.now() })
      return { ok: true, masId: id, generation: 'session' }
    }

    return { ok: true, masId: id, generation: 'client', prompt: generationPrompt(gens, id, root, promptLangFromValue(body.language)) }
  }

  async function getGenerationStatus(masId) {
    const m = registry.findMas(masId) || {}
    const done = isGenerationComplete(masId)
    let status
    if (done) {
      registry.upsertMas({ id: masId, status: 'idle' })
      genSessions.delete(masId)
      status = 'completed'
    } else if ((m.lastGenSessionId && (await isAgentAlive(m.lastGenSessionId))) || genSessions.has(masId)) {
      status = 'generating'
    } else {
      const attempted = !!(m.lastGenSessionId || m.status === 'generating' || m.status === 'failed')
      status = attempted ? 'failed' : 'idle'
    }
    return { ok: true, status, step: status === 'generating' ? 'generating' : null }
  }

  async function getGenerationLog(masId) {
    const live = genSessions.get(masId)
    if (live && live.fast) return { ok: true, log: { sessionId: live.sessionId, events: live.events || [] } }
    const sid = (live && live.sessionId) || (registry.findMas(masId) || {}).lastGenSessionId || null
    const log = sid ? await sessions.sessionLog(sid) : null
    return { ok: true, log }
  }

  return {
    isGenerationComplete,
    masSummary,
    createMas,
    getGenerationStatus,
    getGenerationLog,
  }
}
