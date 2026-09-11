// Studio mode switch — bottom of work.left column.

function StudioModePanel() {
  const loc = useLocators()
  const mode = useStudioMode()
  const api = getServices()
  const [busy, setBusy] = React.useState(false)

  React.useEffect(() => actionBus.on('layout.boot', () => studioModeRef.reset()), [])
  React.useEffect(() => {
    studioModeRef.reset()
  }, [loc.masId])

  const switchExecute = () => {
    if (mode === 'execute') return
    studioModeRef.reset()
    taskManager.selectAgent('orchestrator')
    actionBus.emit('execute.mode.on', { masId: loc.masId })
    actionBus.emit('agent.chat.select', {
      masId: loc.masId,
      unitKey: loc.unitKey,
      taskKey: loc.taskKey,
      agentKey: 'orchestrator',
    })
  }

  const switchDesign = async () => {
    if (mode === 'design' || busy || !loc.masId) return
    setBusy(true)
    taskManager.setNotice(null)
    try {
      const r = await api.designStart(loc.masId)
      if (!r || !r.ok) {
        taskManager.setNotice({ kind: 'err', text: (r && r.error) || t('mode.design.start.fail') })
        return
      }
      studioModeRef.setDesign({ sessionId: r.sessionId, masRoot: r.masRoot })
      actionBus.emit('design.mode.on', {
        masId: loc.masId,
        sessionId: r.sessionId,
        masRoot: r.masRoot,
      })
    } catch (e) {
      taskManager.setNotice({ kind: 'err', text: String((e && e.message) || e) || t('mode.design.start.fail') })
    } finally {
      setBusy(false)
    }
  }

  return h('div', { className: 'ps-studio-mode' },
    h('div', { className: 'ps-mode-segment' },
      h(psBtn, {
        primary: mode === 'execute',
        ghost: mode !== 'execute',
        disabled: busy,
        onClick: switchExecute,
      }, t('mode.execute')),
      h(psBtn, {
        primary: mode === 'design',
        ghost: mode !== 'design',
        disabled: busy,
        onClick: switchDesign,
      }, busy && mode !== 'design' ? t('loading') : t('mode.design')),
    ),
  )
}
