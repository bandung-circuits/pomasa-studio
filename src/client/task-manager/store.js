// Task manager — polling unit/task tree + current task state. No UI.

function emptyTaskSnap() {
  return {
    descriptor: null,
    generated: null,
    units: [],
    unitState: null,
    genStatus: null,
    busy: false,
    notice: null,
    stageSel: 0,
    selectedArtifact: null,
  }
}

const taskManager = {
  api: null,
  pollTimer: null,
  bound: false,
  descriptor: null,
  generated: null,
  units: [],
  unitState: null,
  genStatus: null,
  busy: false,
  notice: null,
  stageSel: 0,
  selectedArtifact: null,
  _snap: emptyTaskSnap(),
  subs: new Set(),
  emit() { for (const fn of this.subs) fn() },
  snapshot() { return this._snap },
  subscribe(fn) {
    this.subs.add(fn)
    return () => { this.subs.delete(fn) }
  },
  bump() {
    this._snap = {
      descriptor: this.descriptor,
      generated: this.generated,
      units: this.units,
      unitState: this.unitState,
      genStatus: this.genStatus,
      busy: this.busy,
      notice: this.notice,
      stageSel: this.stageSel,
      selectedArtifact: this.selectedArtifact,
    }
    this.emit()
  },
  bind() {
    if (this.bound) return
    this.bound = true
    this.api = getServices()
    locators.subscribe(() => this.onLocatorChange())
    actionBus.on('layout.boot', () => this.reset())
    actionBus.on('mas.open', () => this.refresh())
    actionBus.on('mas.created', () => this.refresh())
    actionBus.on('task.open', () => this.refresh())
    actionBus.on('task.refresh', () => this.refresh())
    actionBus.on('unit.new', (p) => this.addUnit(p && p.kind, p && p.key))
    actionBus.on('task.new', (p) => this.addTask(p && p.unitKey))
    actionBus.on('unit.prompt', () => this.promptAddUnit())
    actionBus.on('unit.delete.ask', (p) => this.confirmDeleteUnit(p))
    actionBus.on('unit.delete', (p) => this.removeUnit(p && p.unitKey, p && p.permanent))
    actionBus.on('unit.rename', (p) => this.renameUnit(p && p.unitKey, p && p.newKey))
    actionBus.on('task.delete.ask', (p) => this.confirmDeleteTask(p))
    actionBus.on('task.delete', (p) => this.removeTask(p && p.unitKey, p && p.taskKey, p && p.permanent))
    actionBus.on('task.rename', (p) => this.renameTask(p && p.unitKey, p && p.taskKey, p && p.newKey))
    this.onLocatorChange()
  },
  reset() {
    this.stopPoll()
    this.descriptor = null
    this.generated = null
    this.units = []
    this.unitState = null
    this.genStatus = null
    this.busy = false
    this.notice = null
    this.stageSel = 0
    this.selectedArtifact = null
    subagentClient.clear()
    this.bump()
  },
  onLocatorChange() {
    const loc = locators.snapshot()
    if (!loc.masId) { this.reset(); return }
    this.startPoll()
    this.refresh()
  },
  startPoll() {
    this.stopPoll()
    this.pollTimer = setInterval(() => this.refresh(), 3000)
  },
  stopPoll() {
    if (this.pollTimer) { clearInterval(this.pollTimer); this.pollTimer = null }
  },
  pickDefaultSelection(units) {
    const list = units || []
    const def = list.find((u) => u.key === 'default')
    if (def) {
      const tasks = def.tasks || []
      const t = tasks.find((x) => x.run) || tasks[tasks.length - 1]
      if (t) return { unitKey: def.key, taskKey: t.id }
    }
    for (const u of list) {
      const tasks = u.tasks || []
      const t = tasks.find((x) => x.run) || tasks[tasks.length - 1]
      if (t) return { unitKey: u.key, taskKey: t.id }
    }
    if (def) return { unitKey: def.key, taskKey: null }
    if (list[0]) return { unitKey: list[0].key, taskKey: null }
    return { unitKey: 'default', taskKey: null }
  },
  async refresh() {
    const masId = locators.masId
    if (!masId || !this.api) return
    try {
      const g = await this.api.getMas(masId)
      this.descriptor = g.descriptor || null
      this.generated = !!g.generated
      if (g.generated) {
        const ul = await this.api.unitList(masId)
        this.units = ul.units || []
        const loc = locators.snapshot()
        if (!loc.unitKey) {
          const d = this.pickDefaultSelection(this.units)
          locators.set({ unitKey: d.unitKey, taskKey: d.taskKey })
        } else if (loc.unitKey && !loc.taskKey) {
          const u = this.units.find((x) => x.key === loc.unitKey)
          const t = (u && u.tasks && u.tasks.length) ? (u.tasks.find((x) => x.run) || u.tasks[u.tasks.length - 1]) : null
          if (t) locators.set({ taskKey: t.id })
        }
        const cur = locators.snapshot()
        if (cur.unitKey) {
          const st = await this.api.unitState(masId, cur.unitKey, cur.taskKey)
          if (st.ok) this.unitState = st
        }
      } else {
        const gs = await this.api.generationStatus(masId)
        if (gs.ok) this.genStatus = gs
      }
      this.bump()
    } catch (e) {
      this.notice = { kind: 'err', text: String(e && e.message || e) }
      this.bump()
    }
  },
  selectTask(unitKey, taskKey) {
    this.stageSel = 0
    this.selectedArtifact = null
    locators.set({ unitKey, taskKey, agentKey: null })
    actionBus.emit('task.open', { masId: locators.masId, unitKey, taskKey })
    this.bump()
    this.refresh()
  },
  selectAgent(agentKey) {
    const key = String(agentKey || '')
    if (!key) return
    const stages = (this.unitState && this.unitState.stages) || []
    const idx = stages.findIndex((s) => s.id === key)
    if (idx >= 0) this.stageSel = idx
    else {
      const desc = (this.descriptor && this.descriptor.stages) || []
      const pos = desc.findIndex((s) => s.id === key)
      if (pos >= 0) this.stageSel = pos
    }
    this.selectedArtifact = null
    locators.set({ agentKey: key })
    actionBus.emit('node.select', { masId: locators.masId, unitKey: locators.unitKey, taskKey: locators.taskKey, agentKey: key })
    this.bump()
  },
  selectStage(pos) {
    const stages = (this.unitState && this.unitState.stages) || []
    const stage = stages[pos]
    if (stage && stage.id) this.selectAgent(stage.id)
    else {
      this.stageSel = pos
      this.selectedArtifact = null
      this.bump()
    }
  },
  async addUnit(kind, key) {
    const unitKey = String(key != null ? key : '').trim().toLowerCase()
    const unitKind = String(kind || 'default')
    if (!unitKey || this.busy || !this.api) return
    this.busy = true
    this.notice = null
    this.bump()
    const r = await this.api.unitAdd(locators.masId, unitKey, unitKind)
    this.busy = false
    if (r.ok) {
      await this.refresh()
      this.selectTask(unitKey, null)
    } else {
      this.notice = { kind: 'err', text: r.error || t('unit.add.fail') }
      this.bump()
    }
  },
  async renameUnit(unitKey, newKey) {
    const oldKey = String(unitKey || '').trim().toLowerCase()
    const neu = String(newKey || '').trim().toLowerCase()
    if (!oldKey || !neu || this.busy || !this.api) return
    this.busy = true
    this.notice = null
    this.bump()
    const r = await this.api.unitRename(locators.masId, oldKey, neu)
    this.busy = false
    if (r.ok) {
      const loc = locators.snapshot()
      if (loc.unitKey === oldKey) locators.set({ unitKey: r.unitKey || neu })
      await this.refresh()
    } else {
      this.notice = { kind: 'err', text: r.error || t('unit.rename.fail') }
      this.bump()
    }
  },
  async removeUnit(unitKey, permanent = false) {
    const u = String(unitKey || '').trim().toLowerCase()
    if (!u || this.busy || !this.api) return
    this.busy = true
    this.notice = null
    this.bump()
    const r = await this.api.unitRemove(locators.masId, u, permanent)
    this.busy = false
    if (r.ok) {
      const loc = locators.snapshot()
      if (loc.unitKey === u) locators.set({ unitKey: null, taskKey: null })
      await this.refresh()
    } else {
      this.notice = { kind: 'err', text: r.error || t('unit.delete.fail') }
      this.bump()
    }
  },
  async renameTask(unitKey, taskKey, newKey) {
    const u = String(unitKey || 'default')
    const oldId = String(taskKey || '')
    const neu = String(newKey || '').trim()
    if (!oldId || !neu || this.busy || !this.api) return
    this.busy = true
    this.notice = null
    this.bump()
    const r = await this.api.taskRename(locators.masId, u, oldId, neu)
    this.busy = false
    if (r.ok) {
      const loc = locators.snapshot()
      if (loc.unitKey === u && loc.taskKey === oldId) {
        locators.set({ taskKey: r.taskId || neu })
      }
      await this.refresh()
    } else {
      this.notice = { kind: 'err', text: r.error || t('task.rename.fail') }
      this.bump()
    }
  },
  async removeTask(unitKey, taskKey, permanent = false) {
    const u = String(unitKey || 'default')
    const tid = String(taskKey || '')
    if (!tid || this.busy || !this.api) return
    this.busy = true
    this.notice = null
    this.bump()
    const r = await this.api.taskRemove(locators.masId, u, tid, permanent)
    this.busy = false
    if (r.ok) {
      const loc = locators.snapshot()
      if (loc.unitKey === u && loc.taskKey === tid) locators.set({ taskKey: null })
      await this.refresh()
    } else {
      this.notice = { kind: 'err', text: r.error || t('task.delete.fail') }
      this.bump()
    }
  },
  async addTask(unitKey) {
    const u = String(unitKey || locators.unitKey || 'default')
    if (this.busy || !this.api) return null
    this.busy = true
    this.notice = null
    this.bump()
    const r = await this.api.taskCreate(locators.masId, u)
    this.busy = false
    if (r.ok) {
      this.selectTask(r.unitKey || u, r.taskId || r.taskKey)
      return r.taskId || r.taskKey
    }
    this.notice = { kind: 'err', text: r.error || t('task.add.fail') }
    this.bump()
    return null
  },
  taskHasResults(unitKey, taskKey) {
    const u = (this.units || []).find((x) => x.key === unitKey)
    const task = u && (u.tasks || []).find((x) => x.id === taskKey)
    return !!(task && task.run)
  },
  currentTaskHasResults() {
    const loc = locators.snapshot()
    if (this.unitState && this.unitState.run) return true
    return this.taskHasResults(loc.unitKey, loc.taskKey)
  },
  async promptAddUnit() {
    if (this.busy || !locators.masId) return
    const key = await promptDialog({ title: t('unit.prompt.title'), placeholder: t('unit.add.ph') })
    if (!key) return
    const unitKey = String(key).trim().toLowerCase()
    if (!unitKey || unitKey === 'default') {
      this.setNotice({ kind: 'err', text: t('unit.add.fail') })
      return
    }
    await this.addUnit('default', unitKey)
  },
  async confirmDeleteUnit(p) {
    if (!p || !p.unitKey) return
    const choice = await deleteDialog({
      title: t('menu.delete'),
      body: t('unit.delete.confirm', { name: str(p.unitKey) }),
    })
    if (choice === 'soft') actionBus.emit('unit.delete', { ...p, permanent: false })
    if (choice === 'hard') actionBus.emit('unit.delete', { ...p, permanent: true })
  },
  async confirmDeleteTask(p) {
    if (!p || !p.taskKey) return
    const choice = await deleteDialog({
      title: t('menu.delete'),
      body: t('task.delete.confirm', { name: formatTaskLabel(p.taskKey) }),
    })
    if (choice === 'soft') actionBus.emit('task.delete', { ...p, permanent: false })
    if (choice === 'hard') actionBus.emit('task.delete', { ...p, permanent: true })
  },
  setBusy(v) { this.busy = !!v; this.bump() },
  setNotice(n) { this.notice = n; this.bump() },
  setSelectedArtifact(a) { this.selectedArtifact = a; this.bump() },
}

function taskManagerSubscribe(fn) { return taskManager.subscribe(fn) }
function taskManagerSnapshot() { return taskManager._snap }

function useTaskManager() {
  if (typeof React.useSyncExternalStore === 'function') {
    return React.useSyncExternalStore(taskManagerSubscribe, taskManagerSnapshot)
  }
  const [v, setV] = React.useState(taskManager.snapshot())
  React.useEffect(() => taskManager.subscribe(() => setV(taskManager.snapshot())), [])
  return v
}

function currentStage(tm) {
  const loc = locators.snapshot()
  const stages = (tm.unitState && tm.unitState.stages) || []
  if (loc.agentKey) {
    const hit = stages.find((s) => s.id === loc.agentKey)
    if (hit) return hit
    const desc = (tm.descriptor && tm.descriptor.stages) || []
    const d = desc.find((s) => s.id === loc.agentKey)
    if (d) {
      return stages.find((s) => s.index === d.index) || {
        index: d.index,
        id: d.id,
        title: d.title,
        status: 'waiting',
        artifactCount: 0,
        contracts: d.contracts || [],
      }
    }
    if (loc.agentKey === 'orchestrator') {
      const run = tm.unitState && tm.unitState.run
      return {
        index: 0,
        id: 'orchestrator',
        title: 'Orchestrator',
        status: run ? (run.status || 'waiting') : 'waiting',
        artifactCount: 0,
        contracts: [],
        isOrchestrator: true,
      }
    }
  }
  return stages[tm.stageSel] || stages[0] || null
}

function currentRunStatus(tm) {
  const run = (tm.unitState && tm.unitState.run) || null
  return run ? str(run.status) : 'waiting'
}

function formatTaskLabel(taskId) {
  if (!taskId || taskId === 'legacy') return t('task.legacy')
  const m = String(taskId).match(/^(\d{4})(\d{2})(\d{2})-(\d{2})(\d{2})(\d{2})/)
  if (m) return `${m[1]}-${m[2]}-${m[3]} ${m[4]}:${m[5]}:${m[6]}`
  return str(taskId)
}
