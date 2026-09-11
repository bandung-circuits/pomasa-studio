import fs from 'node:fs'
import path from 'node:path'
import * as fsx from '../file-system/index.js'
import { masDir, pomasaHome, workspaceDir } from '../paths/index.js'

export const DEFAULT_UNIT = 'default'
export const LEGACY_TASK = 'legacy'
const STAGE_DIR_RE = /^\d{2}\.[a-z0-9._-]+$/i

function pad2(n) { return String(n).padStart(2, '0') }

/** Stage output folders (01.overview) must not be treated as grouping units. */
export function isStageLayoutDir(name, descriptor) {
  if (!name || name === DEFAULT_UNIT) return false
  if (STAGE_DIR_RE.test(name)) return true
  const stages = descriptor?.stages || []
  return stages.some((s) => s && (s.id === name || `${pad2(s.index)}.${s.id}` === name))
}

export function createTaskId(date = new Date()) {
  return `${date.getFullYear()}${pad2(date.getMonth() + 1)}${pad2(date.getDate())}-${pad2(date.getHours())}${pad2(date.getMinutes())}${pad2(date.getSeconds())}`
}

export function inferUnitKind(key, descriptor) {
  if (!key || key === DEFAULT_UNIT) return 'default'
  if (/^\d{4}-\d{2}-\d{2}$/.test(key)) return 'date'
  if (descriptor?.work?.dimensions?.includes('country')) return 'country'
  if (descriptor?.work?.mode === 'multi') return 'country'
  return 'default'
}

export function normalizeUnitEntry(u, descriptor) {
  if (typeof u === 'string') {
    const key = u.trim().toLowerCase()
    if (!key) return null
    return { key, kind: inferUnitKind(key, descriptor) }
  }
  if (u && typeof u === 'object') {
    const key = String(u.key ?? u.id ?? '').trim().toLowerCase()
    if (!key) return null
    const kind = u.kind === 'date' || u.kind === 'country' || u.kind === 'default'
      ? u.kind
      : inferUnitKind(key, descriptor)
    return { key, kind }
  }
  return null
}

export function workspacePath(config, masId) {
  return workspaceDir(pomasaHome(config), masId)
}

function isHiddenDir(dir) {
  return fsx.isHidden(dir)
}

function taskEntry(id, root, legacy) {
  const run = readRunState({ root })
  return {
    id,
    root,
    legacy: !!legacy,
    run: !!run,
    status: run?.status || (run ? 'completed' : 'waiting'),
  }
}

/** Scan tasks under workspace/{unitKey}/ plus legacy layouts. */
export function taskRootsInUnit(config, masId, unitKey) {
  const workspace = workspacePath(config, masId)
  const unitDir = path.join(workspace, unitKey)
  const tasks = []
  const seen = new Set()

  if (unitKey === DEFAULT_UNIT && fs.existsSync(path.join(workspace, 'run.json'))) {
    tasks.push(taskEntry(LEGACY_TASK, workspace, true))
    seen.add(LEGACY_TASK)
  }

  if (!fs.existsSync(unitDir)) return tasks

  const unitRun = path.join(unitDir, 'run.json')
  const subdirs = fs.readdirSync(unitDir, { withFileTypes: true }).filter((e) => e.isDirectory())
  const taskSubdirs = subdirs.filter((e) => {
    const root = path.join(unitDir, e.name)
    return fs.existsSync(path.join(root, 'run.json'))
      || (fs.readdirSync(root).length > 0 && e.name !== LEGACY_TASK)
  })

  if (fs.existsSync(unitRun) && taskSubdirs.length === 0 && !seen.has(LEGACY_TASK)) {
    tasks.push(taskEntry(LEGACY_TASK, unitDir, true))
    seen.add(LEGACY_TASK)
  }

  for (const e of subdirs) {
    if (seen.has(e.name)) continue
    const root = path.join(unitDir, e.name)
    if (isHiddenDir(root)) continue
    if (e.name === LEGACY_TASK && fs.existsSync(path.join(root, 'run.json'))) {
      tasks.push(taskEntry(LEGACY_TASK, root, true))
      seen.add(LEGACY_TASK)
      continue
    }
    if (!fs.statSync(root).isDirectory()) continue
    tasks.push(taskEntry(e.name, root, false))
    seen.add(e.name)
  }
  return tasks
}

/** Declared units from descriptor + enumerated + disk folders. */
export function plannedUnits(config, descriptor, masId) {
  const out = []
  const seen = new Set()
  const push = (entry, source) => {
    if (!entry || seen.has(entry.key)) return
    seen.add(entry.key)
    out.push({ ...entry, source })
  }
  if (Array.isArray(descriptor.work.units)) {
    for (const u of descriptor.work.units) {
      const entry = normalizeUnitEntry(u, descriptor)
      if (entry) push(entry, 'declared')
    }
  }
  if (descriptor.work.unitsIndex) {
    const file = path.join(masDir(pomasaHome(config), masId), descriptor.work.unitsIndex)
    if (fs.existsSync(file)) {
      try {
        const raw = JSON.parse(fs.readFileSync(file, 'utf8'))
        const list = Array.isArray(raw) ? raw : (raw.units ?? raw.entries ?? [])
        for (const u of list) {
          const key = typeof u === 'string' ? u : (u.key ?? u.id)
          if (typeof key === 'string') push(normalizeUnitEntry(key, descriptor), 'enumerated')
        }
      } catch { /* unreadable enumeration is not fatal */ }
    }
  }
  push({ key: DEFAULT_UNIT, kind: 'default' }, 'default')
  const workspace = workspacePath(config, masId)
  if (fs.existsSync(workspace)) {
    for (const e of fs.readdirSync(workspace, { withFileTypes: true })) {
      if (!e.isDirectory()) continue
      if (isHiddenDir(path.join(workspace, e.name))) continue
      if (isStageLayoutDir(e.name, descriptor)) continue
      push(normalizeUnitEntry(e.name, descriptor), 'disk')
    }
  }
  return out
}

/** Unit + task tree for UI. */
export function unitListing(config, descriptor, masId) {
  const planned = plannedUnits(config, descriptor, masId)
  const byKey = new Map(planned.map((p) => [p.key, p]))
  const list = []
  for (const p of planned) {
    const tasks = taskRootsInUnit(config, masId, p.key)
    list.push({
      key: p.key,
      kind: p.kind || 'default',
      planned: p.source === 'declared' || p.source === 'enumerated',
      source: p.source,
      run: tasks.some((t) => t.run),
      tasks,
    })
  }
  for (const [key, meta] of byKey) {
    if (list.some((u) => u.key === key)) continue
    const tasks = taskRootsInUnit(config, masId, key)
    list.push({
      key,
      kind: meta.kind || 'default',
      planned: false,
      source: 'disk',
      run: tasks.some((t) => t.run),
      tasks,
    })
  }
  return list.sort((a, b) => {
    const order = { date: 0, country: 1, default: 2 }
    const ka = order[a.kind] ?? 2
    const kb = order[b.kind] ?? 2
    if (ka !== kb) return ka - kb
    return String(a.key).localeCompare(String(b.key))
  })
}

/** Resolve task sandbox root. */
export function resolveTaskRoot(config, masId, unitKey, taskKey) {
  const unit = String(unitKey || DEFAULT_UNIT)
  const task = String(taskKey || '')
  const workspace = workspacePath(config, masId)
  if (task === LEGACY_TASK) {
    if (unit === DEFAULT_UNIT && fs.existsSync(path.join(workspace, 'run.json'))) {
      return { unitKey: unit, taskKey: LEGACY_TASK, root: workspace, legacy: true }
    }
    const unitDir = path.join(workspace, unit)
    if (fs.existsSync(path.join(unitDir, 'run.json'))) {
      return { unitKey: unit, taskKey: LEGACY_TASK, root: unitDir, legacy: true }
    }
    return null
  }
  if (!task) return null
  const root = path.join(workspace, unit, task)
  if (!fs.existsSync(root)) return null
  return { unitKey: unit, taskKey: task, root, legacy: false }
}

export function createTaskDir(config, masId, unitKey, taskId) {
  const unit = String(unitKey || DEFAULT_UNIT)
  let id = taskId || createTaskId()
  const workspace = workspacePath(config, masId)
  const unitDir = path.join(workspace, unit)
  fs.mkdirSync(unitDir, { recursive: true })
  let root = path.join(unitDir, id)
  let n = 1
  while (fs.existsSync(root)) {
    id = `${taskId || createTaskId()}-${n}`
    root = path.join(unitDir, id)
    n += 1
  }
  fs.mkdirSync(root, { recursive: true })
  return { unitKey: unit, taskId: id, root }
}

export function addUnit(config, masId, key, kind, descriptor) {
  const entry = normalizeUnitEntry({ key, kind: kind || inferUnitKind(key, descriptor) }, descriptor)
  if (!entry) return { ok: false, error: 'invalid unit key' }
  if (!/^[a-z0-9][a-z0-9._-]*$/.test(entry.key) || entry.key === '.' || entry.key === '..') {
    return { ok: false, error: 'invalid unit key' }
  }
  const root = masDir(pomasaHome(config), masId)
  const pj = path.join(root, 'pomasa.json')
  const raw = JSON.parse(fs.readFileSync(pj, 'utf8'))
  if (!raw.work) raw.work = {}
  if (!Array.isArray(raw.work.units)) raw.work.units = []
  const exists = raw.work.units.some((u) => {
    const e = normalizeUnitEntry(u, descriptor)
    return e && e.key === entry.key
  })
  if (exists) return { ok: false, error: 'unit already exists' }
  raw.work.units.push({ key: entry.key, kind: entry.kind })
  fs.writeFileSync(pj, JSON.stringify(raw, null, 2) + '\n')
  fs.mkdirSync(path.join(workspacePath(config, masId), entry.key), { recursive: true })
  return { ok: true, unit: entry }
}

function validUnitKey(key) {
  return /^[a-z0-9][a-z0-9._-]*$/.test(key) && key !== '.' && key !== '..'
}

export function renameUnit(config, masId, oldKey, newKey, descriptor) {
  const oldK = String(oldKey || '').trim().toLowerCase()
  const newK = String(newKey || '').trim().toLowerCase()
  if (oldK === DEFAULT_UNIT) return { ok: false, error: 'cannot rename default unit' }
  if (!validUnitKey(newK)) return { ok: false, error: 'invalid unit key' }
  if (oldK === newK) return { ok: true, unitKey: newK }
  const workspace = workspacePath(config, masId)
  const oldDir = path.join(workspace, oldK)
  const newDir = path.join(workspace, newK)
  if (!fs.existsSync(oldDir)) return { ok: false, error: 'unit not found' }
  if (fs.existsSync(newDir)) return { ok: false, error: 'unit already exists' }
  fs.renameSync(oldDir, newDir)
  const root = masDir(pomasaHome(config), masId)
  const pj = path.join(root, 'pomasa.json')
  if (fs.existsSync(pj)) {
    const raw = JSON.parse(fs.readFileSync(pj, 'utf8'))
    if (Array.isArray(raw.work?.units)) {
      raw.work.units = raw.work.units.map((u) => {
        const e = normalizeUnitEntry(u, descriptor)
        if (e && e.key === oldK) return { key: newK, kind: inferUnitKind(newK, descriptor) }
        return u
      })
      fs.writeFileSync(pj, JSON.stringify(raw, null, 2) + '\n')
    }
  }
  return { ok: true, unitKey: newK, oldKey: oldK }
}

export function removeUnit(config, masId, unitKey, descriptor, opts = {}) {
  const permanent = opts.permanent === true
  const key = String(unitKey || '').trim().toLowerCase()
  if (key === DEFAULT_UNIT) return { ok: false, error: 'cannot remove default unit' }
  const dir = path.join(workspacePath(config, masId), key)
  if (!fs.existsSync(dir)) return { ok: false, error: 'unit not found' }
  if (permanent) {
    fsx.remove(dir, { recursive: true })
  } else {
    fsx.markHidden(dir, { kind: 'unit', masId, unitKey: key })
  }
  const root = masDir(pomasaHome(config), masId)
  const pj = path.join(root, 'pomasa.json')
  if (fs.existsSync(pj)) {
    const raw = JSON.parse(fs.readFileSync(pj, 'utf8'))
    if (Array.isArray(raw.work?.units)) {
      raw.work.units = raw.work.units.filter((u) => {
        const e = normalizeUnitEntry(u, descriptor)
        return !e || e.key !== key
      })
      fsx.write(pj, JSON.stringify(raw, null, 2) + '\n')
    }
  }
  return { ok: true, unitKey: key, permanent }
}

export function renameTask(config, masId, unitKey, taskKey, newId) {
  const unit = String(unitKey || DEFAULT_UNIT)
  const oldId = String(taskKey || '')
  const id = String(newId || '').trim()
  if (oldId === LEGACY_TASK) return { ok: false, error: 'cannot rename legacy task' }
  if (!id || !validUnitKey(id)) return { ok: false, error: 'invalid task id' }
  if (oldId === id) return { ok: true, taskId: id, unitKey: unit }
  const resolved = resolveTaskRoot(config, masId, unit, oldId)
  if (!resolved) return { ok: false, error: 'task not found' }
  const dest = path.join(workspacePath(config, masId), unit, id)
  if (fs.existsSync(dest)) return { ok: false, error: 'task already exists' }
  fs.renameSync(resolved.root, dest)
  return { ok: true, unitKey: unit, taskId: id, oldTaskId: oldId }
}

export function removeTask(config, masId, unitKey, taskKey, opts = {}) {
  const permanent = opts.permanent === true
  const unit = String(unitKey || DEFAULT_UNIT)
  const task = String(taskKey || '')
  if (task === LEGACY_TASK) return { ok: false, error: 'cannot remove legacy task' }
  const resolved = resolveTaskRoot(config, masId, unit, task)
  if (!resolved) return { ok: false, error: 'task not found' }
  if (permanent) {
    fsx.remove(resolved.root, { recursive: true })
  } else {
    fsx.markHidden(resolved.root, { kind: 'task', masId, unitKey: unit, taskKey: task })
  }
  return { ok: true, unitKey: unit, taskId: task, permanent }
}

/** @deprecated — use resolveTaskRoot */
export function unitRoots(config, descriptor, masId) {
  const list = unitListing(config, descriptor, masId)
  const out = []
  for (const u of list) {
    for (const t of u.tasks || []) {
      out.push({ key: u.key, taskKey: t.id, root: t.root })
    }
  }
  return out
}

export function readRunState(unit) {
  const file = path.join(unit.root, 'run.json')
  if (!fs.existsSync(file)) return null
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'))
  } catch {
    return null
  }
}

function readIndex(unit, contract) {
  if (!contract.indexPath) return { entries: null }
  const file = path.join(unit.root, contract.indexPath)
  if (!fs.existsSync(file)) return { entries: null }
  let raw
  try {
    raw = JSON.parse(fs.readFileSync(file, 'utf8'))
  } catch {
    return { entries: null, invalid: true, file }
  }
  const list = Array.isArray(raw)
    ? raw
    : (raw.entries ?? raw.items ?? raw.versions ?? raw.files ?? raw.artifacts ?? raw.list)
  return { entries: Array.isArray(list) ? list : null }
}

export function aggregateUnit(unit, descriptor) {
  const run = readRunState(unit)
  const runStages = new Map((run?.stages || []).map((s) => [s.index, s]))
  const stages = descriptor.stages.map((stage) => {
    const runStage = runStages.get(stage.index) || null
    const contracts = stage.contracts.map((contract) => {
      const idx = readIndex(unit, contract)
      return {
        id: contract.id,
        title: contract.title,
        shape: contract.shape,
        indexPath: contract.indexPath,
        index: idx.entries,
        invalid: idx.invalid || false,
      }
    })
    const count = contracts.reduce((n, c) => n + (Array.isArray(c.index) ? c.index.length : 0), 0)
    return {
      index: stage.index,
      id: stage.id,
      title: stage.title,
      kind: stage.kind,
      status: runStage?.status || inferStatus(contracts),
      startedAt: runStage?.started_at ?? null,
      finishedAt: runStage?.finished_at ?? null,
      artifactCount: count,
      contracts,
    }
  })
  return {
    unitKey: unit.unitKey ?? unit.key,
    taskKey: unit.taskKey ?? null,
    found: true,
    unitRoot: unit.root,
    run,
    stages,
  }
}

export function unitState(config, descriptor, masId, unitKey, taskKey) {
  const unit = String(unitKey || DEFAULT_UNIT)
  let task = taskKey != null && taskKey !== '' ? String(taskKey) : null
  if (!task) {
    const tasks = taskRootsInUnit(config, masId, unit)
    const picked = tasks.find((t) => t.run) || tasks[tasks.length - 1] || null
    if (!picked) return { unitKey: unit, taskKey: null, found: false, run: null, stages: [] }
    task = picked.id
  }
  const resolved = resolveTaskRoot(config, masId, unit, task)
  if (!resolved) return { unitKey: unit, taskKey: task, found: false, run: null, stages: [] }
  return aggregateUnit({ ...resolved, key: resolved.unitKey }, descriptor)
}

function inferStatus(contracts) {
  return contracts.some((c) => Array.isArray(c.index) && c.index.length > 0) ? 'completed' : 'waiting'
}

export function readArtifact(config, masId, unitKey, taskKey, relPath) {
  const resolved = resolveTaskRoot(config, masId, unitKey || DEFAULT_UNIT, taskKey || LEGACY_TASK)
    || resolveTaskRoot(config, masId, unitKey || DEFAULT_UNIT, taskKey)
  if (!resolved) throw new Error('task not found')
  const base = path.resolve(resolved.root)
  const target = path.resolve(base, relPath)
  if (target !== base && !target.startsWith(base + path.sep)) {
    throw new Error('path escapes unit root')
  }
  if (!fs.existsSync(target) || !fs.statSync(target).isFile()) {
    throw new Error(`not found: ${relPath}`)
  }
  const content = fs.readFileSync(target, 'utf8')
  const ext = path.extname(target).toLowerCase()
  const format = ext === '.md' ? 'markdown' : ext === '.json' ? 'json' : 'text'
  return { path: path.relative(base, target), format, size: Buffer.byteLength(content), content }
}

/** Collect every run.json path for mas status aggregation. */
export function collectRunJsonPaths(config, masId) {
  const workspace = workspacePath(config, masId)
  const files = []
  if (!fs.existsSync(workspace)) return files
  if (fs.existsSync(path.join(workspace, 'run.json'))) files.push(path.join(workspace, 'run.json'))
  const walk = (dir) => {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      const p = path.join(dir, e.name)
      if (e.isFile() && e.name === 'run.json') files.push(p)
      else if (e.isDirectory()) walk(p)
    }
  }
  walk(workspace)
  return [...new Set(files)]
}
