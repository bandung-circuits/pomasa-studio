import { API_BASE, parseQuery, jsonResponse, readBody, firstHeading } from './http.js'
import { mdToDocx } from './report-exporter/index.js'
import { createMasManager } from './MAS-manager/index.js'
import { createHostTaskManager } from './task-manager/index.js'
import { DEFAULT_UNIT, LEGACY_TASK } from './task-manager/state.js'
import { masDir } from './paths/index.js'

export function createCatalog(deps) {
  const { config, home, sessions, creator, runner, subMgr, agentCreator, revealInFileManager, registry } = deps
  const masMgr = createMasManager({ config, home, sessions, creator, registry })
  const taskMgr = createHostTaskManager({ config, home, sessions, runner, revealInFileManager })

  // Declarative route table — HTTP → manager forwarding only.
  //   mas: 'query'|'body'  404 guard: q.masId / body.masId must name a known MAS
  //   pass: true           always answer 200 with the handler result as-is
  //   errCode              fallback status when the result is { ok: false } without a code
  //   raw: true            handler writes the response itself (binary export)
  const ROUTES = [
    { method: 'GET', path: '/mas.list', pass: true, run: () => masMgr.listMas() },
    { method: 'GET', path: '/meta', pass: true, run: () => masMgr.meta() },
    { method: 'GET', path: '/mas.get', errCode: 404, run: (q) => masMgr.getMas(q.masId) },
    { method: 'GET', path: '/generation.status', mas: 'query', pass: true, run: (q) => creator.getGenerationStatus(q.masId) },
    { method: 'GET', path: '/unit.list', mas: 'query', pass: true, run: (q) => taskMgr.unitList(q.masId) },
    { method: 'GET', path: '/unit.state', mas: 'query', pass: true, run: (q) => taskMgr.unitStateFor(q.masId, q.unit, q.task, masMgr) },
    { method: 'GET', path: '/artifact.read', mas: 'query', pass: true, run: (q) => taskMgr.readArtifactEntry(q.masId, q.unit, q.task, q.path, q.head === '1', firstHeading) },
    { method: 'GET', path: '/blueprint.read', mas: 'query', run: (q) => taskMgr.readBlueprint(q.masId, q.path, q.stage) },
    { method: 'GET', path: '/run.log', mas: 'query', run: (q) => taskMgr.runLog(q.masId, q.unit, q.task) },
    { method: 'GET', path: '/generation.log', mas: 'query', pass: true, run: (q) => creator.getGenerationLog(q.masId) },
    {
      method: 'GET', path: '/subagent.list', mas: 'query',
      run: async (q) => {
        const declared = subMgr.listDeclared(q.masId)
        if (!declared.ok) return declared
        const alive = await subMgr.listAlive(q.masId, q.unit || DEFAULT_UNIT, q.task || LEGACY_TASK)
        return { ok: true, agents: declared.agents, alive: alive.agents || {} }
      },
    },
    { method: 'GET', path: '/subagent.info', mas: 'query', errCode: 404, run: (q) => subMgr.getInfo(q.masId, q.agentKey, q.unit || DEFAULT_UNIT, q.task || LEGACY_TASK) },
    { method: 'GET', path: '/agent.log', mas: 'query', errCode: 404, run: (q) => subMgr.getAgentLog(q.masId, q.agentKey, q.unit || DEFAULT_UNIT, q.task || LEGACY_TASK) },

    { method: 'POST', path: '/mas.create', run: (q, b) => creator.createMas(b) },
    { method: 'POST', path: '/run.start', run: (q, b) => runner.startRun(b, masMgr.hasMas.bind(masMgr)) },
    {
      method: 'POST', path: '/design.start', mas: 'body',
      run: (q, b) => agentCreator.ensureDesignAgent({ masId: String(b.masId || ''), masRoot: masDir(home(), String(b.masId || '')) }),
    },
    { method: 'POST', path: '/run.intervene', run: (q, b) => runner.handleRunIntervene(b) },
    { method: 'POST', path: '/run.cancel', pass: true, run: (q, b) => runner.handleRunCancel(b) },
    { method: 'POST', path: '/record', run: (q, b) => sessions.recordSession(b, masMgr.hasMas.bind(masMgr)) },
    {
      method: 'POST', path: '/export', raw: true,
      run: async (q, b, res) => {
        if (b.format !== 'docx') return jsonResponse(res, 400, { ok: false, error: 'only docx export is available (PDF was removed in 0.2.2)' })
        try {
          const buf = await mdToDocx(String(b.content || ''))
          res.writeHead(200, {
            'content-type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'content-disposition': 'attachment; filename="pomasa.docx"',
          })
          res.end(Buffer.isBuffer(buf) ? buf : Buffer.from(buf))
        } catch (e) {
          jsonResponse(res, 500, { ok: false, error: 'export failed: ' + String((e && e.message) || e) })
        }
      },
    },
    { method: 'POST', path: '/unit.add', mas: 'body', run: (q, b) => taskMgr.addUnitEntry(String(b.masId || ''), String(b.key || '').trim().toLowerCase(), String(b.kind || 'default').trim().toLowerCase()) },
    { method: 'POST', path: '/task.create', mas: 'body', run: (q, b) => taskMgr.createTask(String(b.masId || ''), String(b.unit || b.unitKey || DEFAULT_UNIT)) },
    { method: 'POST', path: '/unit.rename', mas: 'body', run: (q, b) => taskMgr.renameUnitEntry(String(b.masId || ''), String(b.unit || b.unitKey || ''), String(b.newKey || b.key || '')) },
    { method: 'POST', path: '/unit.remove', mas: 'body', run: (q, b) => taskMgr.removeUnitEntry(String(b.masId || ''), String(b.unit || b.unitKey || ''), { permanent: b.permanent === true }) },
    { method: 'POST', path: '/task.rename', mas: 'body', run: (q, b) => taskMgr.renameTaskEntry(String(b.masId || ''), String(b.unit || b.unitKey || DEFAULT_UNIT), String(b.task || b.taskKey || ''), String(b.newKey || b.taskId || '')) },
    { method: 'POST', path: '/task.remove', mas: 'body', run: (q, b) => taskMgr.removeTaskEntry(String(b.masId || ''), String(b.unit || b.unitKey || DEFAULT_UNIT), String(b.task || b.taskKey || ''), { permanent: b.permanent === true }) },
    {
      method: 'POST', path: '/fs.reveal', mas: 'body',
      run: (q, b) => {
        const hasTask = b.task != null || b.taskKey != null
        return taskMgr.revealEntry(String(b.masId || ''), String(b.unit || b.unitKey || DEFAULT_UNIT), hasTask ? String(b.task || b.taskKey || '') : null)
      },
    },
    { method: 'POST', path: '/mas.delete', errCode: 404, run: (q, b) => masMgr.deleteMas(String(b.masId || ''), { permanent: b.permanent === true }) },
  ]

  async function handleApi(req, res) {
    const u = new URL(req.url, 'http://x')
    const sub = u.pathname.replace(API_BASE, '')
    const route = ROUTES.find((r) => r.path === sub && r.method === req.method)
    if (!route) return jsonResponse(res, 404, { ok: false, error: 'not found' })
    try {
      const q = parseQuery(u.search)
      const body = route.method === 'POST' ? await readBody(req) : undefined
      if (route.mas) {
        const masId = route.mas === 'query' ? q.masId : String(body.masId || '')
        if (!masMgr.hasMas(masId)) return jsonResponse(res, 404, { ok: false, error: 'no such mas' })
      }
      if (route.raw) return await route.run(q, body, res)
      const r = await route.run(q, body)
      if (!route.pass && r && r.ok === false) return jsonResponse(res, r.code || route.errCode || 400, r)
      return jsonResponse(res, 200, r)
    } catch (err) {
      const code = typeof err?.code === 'number' ? err.code : 500
      return jsonResponse(res, code, { ok: false, error: String(err?.message || err) })
    }
  }

  return { handleApi, hasMas: masMgr.hasMas.bind(masMgr) }
}
