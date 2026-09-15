import fs from 'node:fs'
import path from 'node:path'
import { pomasaHome } from './paths/index.js'
import { ensureSkill } from './core/skill.js'
import { bootstrapRuntime } from '../runtime/index.js'
import { loadMcpServers } from './mcp-loader.js'
import { MASA_MEME } from '../client/meme.js'
import { API_BASE } from './http.js'
import { createSessionRegistry } from './session-registry.js'
import { createWorkspaceService } from './workspace.js'
import { createMasCreator } from './MAS-creator/create.js'
import { createTaskRunner } from './task-runner/run.js'
import { createSubagentManager } from './subagent-manager/manager.js'
import { createAgentCreator } from './agent-creator/create.js'
import { createCatalog } from './catalog.js'

export const name = 'pomasa-studio'
export const inject = ['webServer', 'agentLoop', 'tools', 'agents', 'agentPresets']

const ROUTES = [
  'mas.list',
  'mas.create',
  'mas.get',
  'generation.status',
  'unit.list',
  'unit.state',
  'artifact.read',
  'run.start',
  'run.intervene',
  'run.cancel',
  'run.log',
  'generation.log',
  'mas.delete',
  'blueprint.read',
  'unit.add',
  'unit.rename',
  'unit.remove',
  'task.create',
  'task.rename',
  'task.remove',
  'export',
  'meta',
  'record',
  'subagent.list',
  'subagent.info',
  'agent.log',
  'design.start',
  'fs.reveal',
]

export function apply(ctx, config = {}) {
  const ws = ctx.get('webServer')
  if (ws === undefined) return
  const agentLoop = ctx.get('agentLoop')

  const home = () => pomasaHome(config)
  const gens = ensureSkill(config)
  const sessions = createSessionRegistry(ctx, config)
  const workspace = createWorkspaceService(ctx, config)
  workspace.ensurePomasaWorkspace().catch(() => {})
  bootstrapRuntime(config)

  const creator = createMasCreator({ config, home, agentLoop, gens, sessions })
  sessions.bindAgentDisposed(creator.isGenerationComplete)

  const subMgr = createSubagentManager(config, sessions, home)
  const agentCreator = createAgentCreator(ctx, { workspace, config })
  const runner = createTaskRunner({ config, home, sessions, subMgr, agentCreator })

  const catalog = createCatalog({ config, home, sessions, creator, runner, subMgr, agentCreator, revealInFileManager: config.revealInFileManager })
  const { handleApi } = catalog

  const disposers = ROUTES.map((r) =>
    ws.register({
      kind: 'exact',
      path: `${API_BASE}/${r}`,
      handler: handleApi,
    }),
  )
  disposers.push(ws.register({
    kind: 'exact',
    path: '/pomasa/meme.jpg',
    handler: (_req, res) => {
      const b64 = MASA_MEME.startsWith('data:image/') ? MASA_MEME.slice(MASA_MEME.indexOf(',') + 1) : MASA_MEME
      res.writeHead(200, { 'content-type': 'image/jpeg', 'cache-control': 'public, max-age=86400' })
      res.end(Buffer.from(b64, 'base64'))
    },
  }))
  disposers.push(ws.register({
    kind: 'exact',
    path: '/pomasa/diag',
    handler: (req, res) => {
      let body = ''
      req.on('data', (c) => { body += c })
      req.on('end', () => {
        try {
          fs.appendFileSync(path.join(home(), 'diag.jsonl'), JSON.stringify({ t: Date.now(), ...JSON.parse(body || '{}') }) + '\n')
        } catch { /* ignore */ }
        res.writeHead(204); res.end()
      })
    },
  }))

  loadMcpServers(ctx, home()).catch(() => { /* best-effort */ })

  return () => {
    for (const d of disposers) d()
  }
}
