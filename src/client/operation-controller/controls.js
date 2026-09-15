// Operation controller — right bar. Emits run.start / run.cancel for the current task.

function DisabledRunButton(props) {
  const { label, primary, className, style } = props
  return h(PartDescription, { text: t('mode.design.run.disabled') },
    h(psBtn, {
      primary,
      className,
      style,
      disabled: true,
      tabIndex: -1,
    }, label),
  )
}

function OperationController() {
  const loc = useLocators()
  const tm = useTaskManager()
  const studioMode = useStudioMode()
  const designMode = studioMode === 'design'
  const runStatus = currentRunStatus(tm)
  const running = runStatus === 'running' || runStatus === 'queued'
  const handleRun = () => {
    requestRunForTask(loc.unitKey || 'default', loc.taskKey)
  }
  const handleCancel = () => {
    confirmDialog({ title: t('cancel.run'), body: t('confirm.cancel.run'), danger: true, okLabel: t('cancel.run') }).then((ok) => {
      if (ok) actionBus.emit('run.cancel', { masId: loc.masId, unitKey: loc.unitKey, taskKey: loc.taskKey })
    })
  }
  const handleNewTaskRun = async () => {
    const unitKey = loc.unitKey || 'default'
    const tid = await taskManager.addTask(unitKey)
    if (tid) actionBus.emit('run.start', { masId: loc.masId, unitKey, taskKey: tid, mode: 'continue', instruction: '' })
  }
  const runDisabled = designMode || tm.busy || !loc.unitKey
  const runBtnStyle = { width: '100%', marginBottom: 8 }
  return h(ScrollFrame, null,
    h(ScrollBox, null,
      h('div', { className: 'ps-work-right-inner' },
        loc.taskKey
          ? h('div', { className: 'ps-caption', style: { marginBottom: 10 } },
            t('task.current', { unit: str(loc.unitKey || 'default'), task: formatTaskLabel(loc.taskKey) }))
          : h('div', { className: 'ps-muted', style: { marginBottom: 10, fontSize: 12.5 } }, t('task.pick')),
        running
          ? h(psBtn, {
            className: 'ps-btn-danger',
            style: { ...runBtnStyle, borderColor: 'var(--dsw-alias-state-error-primary)', color: 'var(--dsw-alias-state-error-primary)' },
            onClick: handleCancel,
          }, t('cancel.run'))
          : null,
        running
          ? h(psBtn, { disabled: true, style: runBtnStyle }, t('running'))
          : (designMode
            ? h(DisabledRunButton, { label: t('run'), primary: true, style: runBtnStyle })
            : h(psBtn, { primary: true, disabled: runDisabled, style: runBtnStyle, onClick: handleRun }, t('run'))),
        designMode
          ? h(DisabledRunButton, { label: t('task.new.run'), style: { width: '100%' } })
          : h(psBtn, { ghost: true, disabled: runDisabled, style: { width: '100%' }, onClick: handleNewTaskRun }, t('task.new.run'))
      ),
    ),
  )
}
