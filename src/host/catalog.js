import { API_BASE, parseQuery, jsonResponse, readBody, firstHeading } from './http.js'
import { mdToDocx } from './report-exporter/index.js'
import { createMasManager } from './MAS-manager/index.js'
import { createHostTaskManager } from './task-manager/index.js'
import { DEFAULT_UNIT, LEGACY_TASK } from './task-manager/state.js'
import { masDir } from './paths/index.js'

export function createCatalog(deps) {
  const { config, home, sessions, creator, runner, subMgr, agentCreator, revealInFileManager } = deps
  const masMgr = createMasManager({ config, home, sessions, creator })
  const taskMgr = createHostTaskManager({ config, home, sessions, runner, revealInFileManager })

  async function handleApi(req, res) {
    const u = new URL(req.url, 'http://x')
    const sub = u.pathname.replace(API_BASE, '')
    const q = parseQuery(u.search)
    try {
      if (sub === '/mas.list') {
        return jsonResponse(res, 200, await masMgr.listMas())
      }

      if (sub === '/meta' && req.method === 'GET') {
        return jsonResponse(res, 200, masMgr.meta())
      }

      if (sub === '/mas.get' && req.method === 'GET') {
        const r = masMgr.getMas(q.masId)
        if (!r.ok) return jsonResponse(res, r.code || 404, r)
        return jsonResponse(res, 200, r)
      }

      if (sub === '/generation.status' && req.method === 'GET') {
        if (!masMgr.hasMas(q.masId)) return jsonResponse(res, 404, { ok: false, error: 'no such mas' })
        return jsonResponse(res, 200, await creator.getGenerationStatus(q.masId))
      }

      if (sub === '/unit.list' && req.method === 'GET') {
        if (!masMgr.hasMas(q.masId)) return jsonResponse(res, 404, { ok: false, error: 'no such mas' })
        return jsonResponse(res, 200, await taskMgr.unitList(q.masId))
      }

      if (sub === '/unit.state' && req.method === 'GET') {
        if (!masMgr.hasMas(q.masId)) return jsonResponse(res, 404, { ok: false, error: 'no such mas' })
        return jsonResponse(res, 200, await taskMgr.unitStateFor(q.masId, q.unit, q.task, masMgr))
      }

      if (sub === '/artifact.read' && req.method === 'GET') {
        if (!masMgr.hasMas(q.masId)) return jsonResponse(res, 404, { ok: false, error: 'no such mas' })
        const r = taskMgr.readArtifactEntry(q.masId, q.unit, q.task, q.path, q.head === '1', firstHeading)
        return jsonResponse(res, 200, r)
      }

      if (sub === '/blueprint.read' && req.method === 'GET') {
        if (!masMgr.hasMas(q.masId)) return jsonResponse(res, 404, { ok: false, error: 'no such mas' })
        const r = taskMgr.readBlueprint(q.masId, q.path, q.stage)
        if (!r.ok) return jsonResponse(res, r.code || 400, r)
        return jsonResponse(res, 200, r)
      }

      if (sub === '/run.log' && req.method === 'GET') {
        if (!masMgr.hasMas(q.masId)) return jsonResponse(res, 404, { ok: false, error: 'no such mas' })
        const result = await taskMgr.runLog(q.masId, q.unit, q.task)
        if (!result.ok) return jsonResponse(res, result.code || 400, result)
        return jsonResponse(res, 200, result)
      }

      if (sub === '/generation.log' && req.method === 'GET') {
        if (!masMgr.hasMas(q.masId)) return jsonResponse(res, 404, { ok: false, error: 'no such mas' })
        return jsonResponse(res, 200, await creator.getGenerationLog(q.masId))
      }

      if (sub === '/mas.create' && req.method === 'POST') {
        const body = await readBody(req)
        const r = await creator.createMas(body)
        if (!r.ok) return jsonResponse(res, 400, r)
        return jsonResponse(res, 200, r)
      }

      if (sub === '/run.start' && req.method === 'POST') {
        const body = await readBody(req)
        const r = await runner.startRun(body, masMgr.hasMas.bind(masMgr))
        if (!r.ok) return jsonResponse(res, 400, r)
        return jsonResponse(res, 200, r)
      }

      if (sub === '/design.start' && req.method === 'POST') {
        const body = await readBody(req)
        const masId = String(body.masId || '')
        if (!masMgr.hasMas(masId)) return jsonResponse(res, 404, { ok: false, error: 'no such mas' })
        const masRootPath = masDir(home(), masId)
        const r = await agentCreator.ensureDesignAgent({ masId, masRoot: masRootPath })
        if (!r.ok) return jsonResponse(res, 400, r)
        return jsonResponse(res, 200, r)
      }

      if (sub === '/run.intervene' && req.method === 'POST') {
        const body = await readBody(req)
        const r = runner.handleRunIntervene(body)
        if (!r.ok) return jsonResponse(res, r.code || 400, r)
        return jsonResponse(res, 200, r)
      }

      if (sub === '/run.cancel' && req.method === 'POST') {
        const body = await readBody(req)
        return jsonResponse(res, 200, runner.handleRunCancel(body))
      }

      if (sub === '/record' && req.method === 'POST') {
        const body = await readBody(req)
        const r = sessions.recordSession(body, masMgr.hasMas.bind(masMgr))
        if (!r.ok) return jsonResponse(res, r.code || 400, r)
        return jsonResponse(res, 200, r)
      }

      if (sub === '/subagent.list' && req.method === 'GET') {
        if (!masMgr.hasMas(q.masId)) return jsonResponse(res, 404, { ok: false, error: 'no such mas' })
        const declared = subMgr.listDeclared(q.masId)
        if (!declared.ok) return jsonResponse(res, declared.code || 400, declared)
        const alive = await subMgr.listAlive(q.masId, q.unit || DEFAULT_UNIT, q.task || LEGACY_TASK)
        return jsonResponse(res, 200, { ok: true, agents: declared.agents, alive: alive.agents || {} })
      }

      if (sub === '/subagent.info' && req.method === 'GET') {
        if (!masMgr.hasMas(q.masId)) return jsonResponse(res, 404, { ok: false, error: 'no such mas' })
        const r = await subMgr.getInfo(q.masId, q.agentKey, q.unit || DEFAULT_UNIT, q.task || LEGACY_TASK)
        if (!r.ok) return jsonResponse(res, r.code || 404, r)
        return jsonResponse(res, 200, r)
      }

      if (sub === '/agent.log' && req.method === 'GET') {
        if (!masMgr.hasMas(q.masId)) return jsonResponse(res, 404, { ok: false, error: 'no such mas' })
        const r = await subMgr.getAgentLog(q.masId, q.agentKey, q.unit || DEFAULT_UNIT, q.task || LEGACY_TASK)
        if (!r.ok) return jsonResponse(res, r.code || 404, r)
        return jsonResponse(res, 200, r)
      }

      if (sub === '/export' && req.method === 'POST') {
        const body = await readBody(req)
        if (body.format !== 'docx') return jsonResponse(res, 400, { ok: false, error: 'only docx export is available (PDF was removed in 0.2.2)' })
        const content = String(body.content || '')
        try {
          const buf = await mdToDocx(content)
          res.writeHead(200, {
            'content-type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'content-disposition': 'attachment; filename="pomasa.docx"',
          })
          res.end(Buffer.isBuffer(buf) ? buf : Buffer.from(buf))
          return
        } catch (e) {
          res.writeHead(500, { 'content-type': 'application/json; charset=utf-8' })
          res.end(JSON.stringify({ ok: false, error: 'export failed: ' + String((e && e.message) || e) }))
          return
        }
      }

      if (sub === '/unit.add' && req.method === 'POST') {
        const body = await readBody(req)
        const masId = String(body.masId || '')
        if (!masMgr.hasMas(masId)) return jsonResponse(res, 404, { ok: false, error: 'no such mas' })
        const r = taskMgr.addUnitEntry(masId, String(body.key || '').trim().toLowerCase(), String(body.kind || 'default').trim().toLowerCase())
        if (!r.ok) return jsonResponse(res, r.code || 400, r)
        return jsonResponse(res, 200, r)
      }

      if (sub === '/task.create' && req.method === 'POST') {
        const body = await readBody(req)
        const masId = String(body.masId || '')
        if (!masMgr.hasMas(masId)) return jsonResponse(res, 404, { ok: false, error: 'no such mas' })
        const r = taskMgr.createTask(masId, String(body.unit || body.unitKey || DEFAULT_UNIT))
        if (!r.ok) return jsonResponse(res, r.code || 400, r)
        return jsonResponse(res, 200, r)
      }

      if (sub === '/unit.rename' && req.method === 'POST') {
        const body = await readBody(req)
        const masId = String(body.masId || '')
        if (!masMgr.hasMas(masId)) return jsonResponse(res, 404, { ok: false, error: 'no such mas' })
        const r = taskMgr.renameUnitEntry(masId, String(body.unit || body.unitKey || ''), String(body.newKey || body.key || ''))
        if (!r.ok) return jsonResponse(res, r.code || 400, r)
        return jsonResponse(res, 200, r)
      }

      if (sub === '/unit.remove' && req.method === 'POST') {
        const body = await readBody(req)
        const masId = String(body.masId || '')
        if (!masMgr.hasMas(masId)) return jsonResponse(res, 404, { ok: false, error: 'no such mas' })
        const r = taskMgr.removeUnitEntry(masId, String(body.unit || body.unitKey || ''), { permanent: body.permanent === true })
        if (!r.ok) return jsonResponse(res, r.code || 400, r)
        return jsonResponse(res, 200, r)
      }

      if (sub === '/task.rename' && req.method === 'POST') {
        const body = await readBody(req)
        const masId = String(body.masId || '')
        if (!masMgr.hasMas(masId)) return jsonResponse(res, 404, { ok: false, error: 'no such mas' })
        const r = taskMgr.renameTaskEntry(
          masId,
          String(body.unit || body.unitKey || DEFAULT_UNIT),
          String(body.task || body.taskKey || ''),
          String(body.newKey || body.taskId || ''),
        )
        if (!r.ok) return jsonResponse(res, r.code || 400, r)
        return jsonResponse(res, 200, r)
      }

      if (sub === '/task.remove' && req.method === 'POST') {
        const body = await readBody(req)
        const masId = String(body.masId || '')
        if (!masMgr.hasMas(masId)) return jsonResponse(res, 404, { ok: false, error: 'no such mas' })
        const r = taskMgr.removeTaskEntry(
          masId,
          String(body.unit || body.unitKey || DEFAULT_UNIT),
          String(body.task || body.taskKey || ''),
          { permanent: body.permanent === true },
        )
        if (!r.ok) return jsonResponse(res, r.code || 400, r)
        return jsonResponse(res, 200, r)
      }

      if (sub === '/fs.reveal' && req.method === 'POST') {
        const body = await readBody(req)
        const masId = String(body.masId || '')
        if (!masMgr.hasMas(masId)) return jsonResponse(res, 404, { ok: false, error: 'no such mas' })
        const hasTask = body.task != null || body.taskKey != null
        const r = await taskMgr.revealEntry(
          masId,
          String(body.unit || body.unitKey || DEFAULT_UNIT),
          hasTask ? String(body.task || body.taskKey || '') : null,
        )
        if (!r.ok) return jsonResponse(res, r.code || 400, r)
        return jsonResponse(res, 200, r)
      }

      if (sub === '/mas.delete' && req.method === 'POST') {
        const body = await readBody(req)
        const r = masMgr.deleteMas(String(body.masId || ''), { permanent: body.permanent === true })
        if (!r.ok) return jsonResponse(res, r.code || 404, r)
        return jsonResponse(res, 200, r)
      }

      return jsonResponse(res, 404, { ok: false, error: 'not found' })
    } catch (err) {
      return jsonResponse(res, 500, { ok: false, error: String(err?.message || err) })
    }
  }

  return { handleApi, hasMas: masMgr.hasMas.bind(masMgr) }
}
