// Workbench root — boot/work routing, overlays, session-driver adapters.

function StudioRoot(props) {
  useLang()
  const loc = useLocators()
  const [layout, setLayout] = React.useState('boot')
  const [creatorOpen, setCreatorOpen] = React.useState(false)
  const [settingsOpen, setSettingsOpen] = React.useState(false)
  const api = getServices()
  const runnersRef = React.useRef(props)
  runnersRef.current = props

  React.useEffect(() => {
    registerStudioSlots()
    taskManager.bind()
  }, [])

  React.useEffect(() => actionBus.on('layout.boot', () => setLayout('boot')), [])
  React.useEffect(() => actionBus.on('layout.work', () => setLayout('work')), [])
  React.useEffect(() => actionBus.on('mas.create', () => setCreatorOpen(true)), [])
  React.useEffect(() => actionBus.on('settings.open', () => setSettingsOpen(true)), [])

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

  const onCreatorDone = (id) => {
    setCreatorOpen(false)
    if (id) {
      locators.set({ masId: id, unitKey: null, taskKey: null, agentKey: null })
      actionBus.emit('mas.created', { masId: id })
    }
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
    h(MenuHost, null),
    h(FileReaderHost, null),
  )
}
