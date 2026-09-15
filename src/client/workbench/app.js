// Workbench root — boot/work routing, overlays, session-driver adapters.

function enterGeneratedMas(masId) {
  locators.set({ masId, unitKey: null, taskKey: null, agentKey: null })
  actionBus.emit('mas.created', { masId })
}

async function openGenerationProgress(masId, runnersRef) {
  if (!masId) return false
  const cancelGen = runnersRef.current && runnersRef.current.onCancelGeneration
  const result = await progressDialog({
    masId,
    title: t('gen.progress.title'),
    onCancel: cancelGen ? () => cancelGen(masId) : null,
  })
  if (result === true) {
    enterGeneratedMas(masId)
    return true
  }
  return false
}

function StudioRoot(props) {
  useLang()
  const loc = useLocators()
  const tm = useTaskManager()
  const [layout, setLayout] = React.useState('boot')
  const [creatorOpen, setCreatorOpen] = React.useState(false)
  const [settingsOpen, setSettingsOpen] = React.useState(false)
  const api = getServices()
  const runnersRef = React.useRef(props)
  runnersRef.current = props
  const progressOnceRef = React.useRef(null)

  React.useEffect(() => {
    registerStudioSlots()
    taskManager.bind()
    api.meta().then((r) => {
      if (r && r.ok && r.host && r.host.fileManager) setHostFileManager(r.host.fileManager)
    }).catch(() => {})
  }, [])

  React.useEffect(() => actionBus.on('layout.boot', () => setLayout('boot')), [])
  React.useEffect(() => actionBus.on('layout.work', () => setLayout('work')), [])
  React.useEffect(() => actionBus.on('mas.create', () => setCreatorOpen(true)), [])
  React.useEffect(() => actionBus.on('settings.open', () => setSettingsOpen(true)), [])

  React.useEffect(() => actionBus.on('mas.open', async (payload) => {
    const masId = payload && payload.masId
    if (!masId) return
    try {
      const g = await api.getMas(masId)
      if (g && g.generated) {
        setLayout('work')
        return
      }
      setLayout('boot')
      const ok = await openGenerationProgress(masId, runnersRef)
      if (ok) setLayout('work')
    } catch {
      setLayout('work')
    }
  }), [api])

  React.useEffect(() => actionBus.on('run.start', async (payload) => {
    const masId = payload && payload.masId
    const unitKey = (payload && payload.unitKey) || 'default'
    if (!masId) return
    taskManager.setBusy(true)
    taskManager.setNotice(null)
    try {
      let taskKey = payload && payload.taskKey
      if (!taskKey) {
        const created = await api.taskCreate(masId, unitKey)
        if (!created.ok) { taskManager.setNotice({ kind: 'err', text: created.error || t('task.add.fail') }); return }
        taskKey = created.taskId || created.taskKey
        taskManager.selectTask(unitKey, taskKey)
      }
      const r = await api.startRun(masId, unitKey, taskKey, {
        mode: (payload && payload.mode) || 'continue',
        instruction: (payload && payload.instruction) || '',
      })
      if (!r.ok) { taskManager.setNotice({ kind: 'err', text: r.error || t('run.start.fail') }); return }
      const orchSid = r.orchestratorSessionId
      const followup = runnersRef.current.onFollowupExisting
      if (!orchSid || !followup) {
        taskManager.setNotice({ kind: 'err', text: t('run.drive.unavailable') })
        return
      }
      const d = await followup(orchSid, r.prompt)
      if (d.ok) {
        taskManager.setNotice({ kind: 'ok', text: t('run.started') })
        await refreshSubagentList(api, masId, r.unitKey || unitKey, r.taskKey || taskKey)
        taskManager.refresh()
      } else taskManager.setNotice({ kind: 'err', text: d.error || t('run.start.fail') })
    } catch (e) {
      taskManager.setNotice({ kind: 'err', text: String(e && e.message || e) })
    } finally {
      taskManager.setBusy(false)
    }
  }), [api])

  React.useEffect(() => actionBus.on('run.cancel', (payload) => {
    const cancel = runnersRef.current.onCancelRun
    const p = cancel ? cancel(payload && payload.masId, payload && payload.unitKey) : Promise.resolve()
    Promise.resolve(p).then(() => taskManager.refresh())
  }), [])

  React.useEffect(() => {
    if (layout !== 'work' || !loc.masId || tm.generated !== false) return
    if (progressOnceRef.current === loc.masId) return
    progressOnceRef.current = loc.masId
    let active = true
    openGenerationProgress(loc.masId, runnersRef).then((ok) => {
      if (!active) return
      if (ok) setLayout('work')
      else {
        progressOnceRef.current = null
        locators.set({ masId: null, unitKey: null, taskKey: null, agentKey: null })
        actionBus.emit('layout.boot', {})
      }
    })
    return () => { active = false }
  }, [layout, loc.masId, tm.generated])

  const onCreatorDone = async (id) => {
    setCreatorOpen(false)
    if (!id) return
    setLayout('boot')
    const ok = await openGenerationProgress(id, runnersRef)
    if (ok) setLayout('work')
  }

  const body = (layout === 'work' && loc.masId)
    ? h(WorkLayout, { key: loc.masId })
    : h(BootLayout, null)

  const mainHier = psHierarchyMainProps()
  return h(PsBoundary, null,
    h('div', {
      className: 'ps-workbench ps-root ' + mainHier.className,
      style: mainHier.style,
    },
      body,
    ),
    h(CreateMas, {
      open: creatorOpen,
      api,
      onCancel: () => setCreatorOpen(false),
      onDone: onCreatorDone,
      onGeneration: (masId, prompt) => {
        const fn = runnersRef.current.onGeneration
        return fn ? fn(masId, prompt) : Promise.resolve({ ok: false, error: t('gen.start.failed') })
      },
    }),
    h(SettingsPanel, { open: settingsOpen, onClose: () => setSettingsOpen(false) }),
    h(DialogueHost, null),
    h(StudioModePickerHost, null),
    h(MenuHost, null),
    h(FileReaderHost, null),
  )
}
