import fs from 'node:fs'
import path from 'node:path'
import { loadDescriptor } from '../data/descriptor.js'
import { masDir } from '../paths/index.js'
import { revealInFileManager } from '../file-system/reveal.js'
import {
  unitListing,
  unitState,
  readArtifact,
  addUnit,
  renameUnit,
  removeUnit,
  createTaskDir,
  renameTask,
  removeTask,
  resolveTaskRoot,
  workspacePath,
  DEFAULT_UNIT,
  LEGACY_TASK,
} from './state.js'

export function createHostTaskManager(deps) {
  const { config, home, sessions, runner } = deps
  const { isAgentAlive } = sessions
  const revealFn = deps.revealInFileManager || revealInFileManager

  function masRoot(masId) {
    return masDir(home(), masId)
  }

  async function unitList(masId) {
    const descriptor = loadDescriptor(masRoot(masId))
    if (!descriptor) return { ok: true, units: [], generated: false }
    return { ok: true, units: unitListing(config, descriptor, masId), generated: true }
  }

  async function unitStateFor(masId, unitKey, taskKey, masMgr) {
    const descriptor = loadDescriptor(masRoot(masId))
    if (!descriptor) return { ok: true, generated: false, stages: [] }
    const st = unitState(config, descriptor, masId, unitKey || DEFAULT_UNIT, taskKey || null)
    if (st && st.run && st.run.status === 'running') {
      const reg = masMgr.loadRegistry()
      const m = reg.mas.find((x) => x.id === masId)
      const ur = m && m.lastRunSessionIds || {}
      const uKey = unitKey || DEFAULT_UNIT
      const tKey = taskKey || LEGACY_TASK
      const runSid = ur[`${uKey}|${tKey}`] || ur[uKey] || ur[tKey] || Object.values(ur)[0] || null
      if (runSid && (await isAgentAlive(runSid)) === false) st.run.status = 'failed'
    }
    return { ok: true, generated: true, ...st }
  }

  function addUnitEntry(masId, key, kind) {
    const root = masRoot(masId)
    const descriptor = loadDescriptor(root)
    if (!descriptor) return { ok: false, code: 400, error: 'mas not generated yet' }
    if (unitListing(config, descriptor, masId).some((u) => u.key === key)) {
      return { ok: false, code: 409, error: 'unit already exists' }
    }
    const added = addUnit(config, masId, key, kind, descriptor)
    if (!added.ok) return { ok: false, code: 400, ...added }
    return { ok: true, units: unitListing(config, loadDescriptor(root), masId) }
  }

  function renameUnitEntry(masId, unitKey, newKey) {
    const root = masRoot(masId)
    const descriptor = loadDescriptor(root)
    if (!descriptor) return { ok: false, code: 400, error: 'mas not generated yet' }
    const renamed = renameUnit(config, masId, unitKey, newKey, descriptor)
    if (!renamed.ok) return { ok: false, code: 400, ...renamed }
    return { ok: true, ...renamed }
  }

  function removeUnitEntry(masId, unitKey, opts = {}) {
    const root = masRoot(masId)
    const descriptor = loadDescriptor(root)
    if (!descriptor) return { ok: false, code: 400, error: 'mas not generated yet' }
    const removed = removeUnit(config, masId, unitKey, descriptor, opts)
    if (!removed.ok) return { ok: false, code: 400, ...removed }
    return { ok: true, units: unitListing(config, loadDescriptor(root), masId), ...removed }
  }

  function createTask(masId, unitKey) {
    const descriptor = loadDescriptor(masRoot(masId))
    if (!descriptor) return { ok: false, code: 400, error: 'mas not generated yet' }
    const created = createTaskDir(config, masId, unitKey || DEFAULT_UNIT)
    return { ok: true, unitKey: created.unitKey, taskId: created.taskId, taskKey: created.taskId }
  }

  function renameTaskEntry(masId, unitKey, taskKey, newKey) {
    const descriptor = loadDescriptor(masRoot(masId))
    if (!descriptor) return { ok: false, code: 400, error: 'mas not generated yet' }
    const renamed = renameTask(config, masId, unitKey, taskKey, newKey)
    if (!renamed.ok) return { ok: false, code: 400, ...renamed }
    return { ok: true, ...renamed }
  }

  function removeTaskEntry(masId, unitKey, taskKey, opts = {}) {
    const descriptor = loadDescriptor(masRoot(masId))
    if (!descriptor) return { ok: false, code: 400, error: 'mas not generated yet' }
    const removed = removeTask(config, masId, unitKey, taskKey, opts)
    if (!removed.ok) return { ok: false, code: 400, ...removed }
    return { ok: true, ...removed }
  }

  function readArtifactEntry(masId, unitKey, taskKey, relPath, headOnly, firstHeading) {
    const art = readArtifact(config, masId, unitKey || DEFAULT_UNIT, taskKey || LEGACY_TASK, relPath || '')
    if (headOnly) {
      return { ok: true, path: art.path, format: art.format, title: firstHeading(art.content) || null }
    }
    return { ok: true, ...art }
  }

  function readBlueprint(masId, relPath, stage) {
    const base = path.resolve(masRoot(masId))
    let rel = String(relPath || '')
    let target = path.resolve(base, rel)
    if (target !== base && !target.startsWith(base + path.sep)) {
      return { ok: false, code: 400, error: 'path escapes mas root' }
    }
    if (!fs.existsSync(target) || !fs.statSync(target).isFile()) {
      const stageNum = parseInt(String(stage || ''), 10)
      if (Number.isInteger(stageNum) && stageNum >= 0) {
        const agentsDir = path.join(base, 'agents')
        const prefix = String(stageNum).padStart(2, '0') + '.'
        if (fs.existsSync(agentsDir)) {
          const found = fs.readdirSync(agentsDir).find((n) => n.startsWith(prefix) && fs.statSync(path.join(agentsDir, n)).isFile())
          if (found) {
            rel = path.join('agents', found)
            target = path.join(agentsDir, found)
          }
        }
      }
    }
    if (!fs.existsSync(target) || !fs.statSync(target).isFile()) {
      return { ok: false, code: 404, error: 'not found' }
    }
    const content = fs.readFileSync(target, 'utf8')
    const ext = path.extname(target).toLowerCase()
    return {
      ok: true,
      path: path.relative(base, target),
      format: ext === '.md' ? 'markdown' : ext === '.json' ? 'json' : 'text',
      content,
    }
  }

  async function runLog(masId, unitKey, taskKey) {
    const descriptor = loadDescriptor(masRoot(masId))
    if (!descriptor) return { ok: true, log: null, events: [] }
    return runner.getRunLog(masId, unitKey || DEFAULT_UNIT, taskKey || LEGACY_TASK)
  }

  function resolveUnitDir(masId, unitKey) {
    const unit = String(unitKey || DEFAULT_UNIT)
    const workspace = workspacePath(config, masId)
    const unitDir = path.join(workspace, unit)
    if (fs.existsSync(unitDir)) return unitDir
    if (unit === DEFAULT_UNIT && fs.existsSync(workspace)) return workspace
    fs.mkdirSync(unitDir, { recursive: true })
    return unitDir
  }

  async function revealEntry(masId, unitKey, taskKey) {
    const descriptor = loadDescriptor(masRoot(masId))
    if (!descriptor) return { ok: false, code: 400, error: 'mas not generated yet' }
    const task = taskKey == null ? '' : String(taskKey || '')
    if (task) {
      const resolved = resolveTaskRoot(config, masId, unitKey || DEFAULT_UNIT, task)
      if (!resolved) return { ok: false, code: 404, error: 'task not found' }
      return revealFn(resolved.root)
    }
    return revealFn(resolveUnitDir(masId, unitKey))
  }

  return {
    unitList,
    unitStateFor,
    addUnitEntry,
    renameUnitEntry,
    removeUnitEntry,
    createTask,
    renameTaskEntry,
    removeTaskEntry,
    readArtifactEntry,
    readBlueprint,
    runLog,
    revealEntry,
  }
}
