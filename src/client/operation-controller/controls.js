// Operation controller — right bar. Emits run.start / run.cancel for the current task.

function OperationController() {
  const loc = useLocators()
  const tm = useTaskManager()
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
            style: { width: '100%', marginBottom: 8, borderColor: 'var(--dsw-alias-state-error-primary)', color: 'var(--dsw-alias-state-error-primary)' },
            onClick: handleCancel,
          }, t('cancel.run'))
          : null,
        running
          ? h(psBtn, { disabled: true, style: { width: '100%', marginBottom: 8 } }, t('running'))
          : h(psBtn, { primary: true, disabled: tm.busy || !loc.unitKey, style: { width: '100%', marginBottom: 8 }, onClick: handleRun }, t('run')),
        h(psBtn, { ghost: true, disabled: tm.busy || !loc.unitKey, style: { width: '100%' }, onClick: handleNewTaskRun }, t('task.new.run')),
        h('div', { className: 'ps-muted', style: { marginTop: 16, fontSize: 12.5, lineHeight: 1.55 } }, t('run.control.hint')),
      ),
    ),
  )
}
