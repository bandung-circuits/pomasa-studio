// Tree child rows — unit (add prototype) and task (basic prototype).

function taskStatusBadge(task) {
  if (!task || !task.run) return psBadge('idle', t('not.run'))
  const st = String(task.status || 'completed').toLowerCase()
  if (st === 'running' || st === 'queued') return psBadge('generating', t('running'))
  if (st === 'failed' || st === 'aborted') return psBadge('failed', st)
  return psBadge('completed', t('unit.ran'))
}

function TreeRenameInput(props) {
  const { value, onCommit, onCancel } = props
  const ref = React.useRef(null)
  React.useEffect(() => { if (ref.current) ref.current.focus() }, [])
  const commit = () => {
    const v = String(ref.current && ref.current.value || '').trim()
    if (v) onCommit(v)
    else onCancel()
  }
  return h('input', {
    ref,
    className: 'ps-input ps-tree-rename',
    defaultValue: value,
    onClick: (e) => e.stopPropagation(),
    onKeyDown: (e) => {
      if (e.key === 'Enter') { e.preventDefault(); commit() }
      if (e.key === 'Escape') { e.preventDefault(); onCancel() }
    },
    onBlur: commit,
  })
}

function UnitTreeChild(props) {
  const { unit, loc, busy } = props
  const [editing, setEditing] = React.useState(false)
  const rowRef = React.useRef(null)

  React.useEffect(() => actionBus.on('unit.rename.pre', (p) => {
    if (p && p.unitKey === unit.key) setEditing(true)
  }), [unit.key])

  const onContextMenu = (e) => {
    e.preventDefault()
    e.stopPropagation()
    actionBus.emit('menu.open.tree.unit', {
      masId: locators.masId,
      unitKey: unit.key,
      anchor: rowRef.current,
      clientX: e.clientX,
      clientY: e.clientY,
    })
  }

  const commitRename = (newKey) => {
    setEditing(false)
    const key = String(newKey || '').trim().toLowerCase()
    if (!key || key === unit.key) return
    actionBus.emit('unit.rename', { masId: locators.masId, unitKey: unit.key, newKey: key })
  }

  return h('div', { className: 'ps-tree-unit' },
    h('div', {
      ref: rowRef,
      className: 'ps-unit-row ps-tree-unit-row',
      onContextMenu,
      title: str(unit.key),
    },
      editing
        ? h(TreeRenameInput, { value: unit.key, onCommit: commitRename, onCancel: () => setEditing(false) })
        : h('span', { className: 'ps-tree-unit-name', title: str(unit.key) }, str(unit.key)),
      !editing ? h(PsButton, {
        id: 'add',
        size: 14,
        className: 'ps-tree-unit-add',
        disabled: busy,
        title: t('task.new'),
        onClick: (e) => { e.stopPropagation(); actionBus.emit('task.new', { unitKey: unit.key }) },
      }) : null,
    ),
    (unit.tasks && unit.tasks.length)
      ? h('div', { className: 'ps-tree-tasks' },
        unit.tasks.map((task) => h(TaskTreeChild, {
          key: unit.key + '/' + task.id,
          unitKey: unit.key,
          task,
          selected: loc.unitKey === unit.key && loc.taskKey === task.id,
          onSelect: props.onSelectTask,
          onRunTask: props.onRunTask,
        })),
      )
      : h('div', { className: 'ps-muted ps-tree-empty' }, t('task.none')),
  )
}

function TaskTreeChild(props) {
  const { unitKey, task, selected, onSelect, onRunTask } = props
  const [editing, setEditing] = React.useState(false)
  const rowRef = React.useRef(null)

  React.useEffect(() => actionBus.on('task.rename.pre', (p) => {
    if (p && p.unitKey === unitKey && p.taskKey === task.id) setEditing(true)
  }), [unitKey, task.id])

  const onContextMenu = (e) => {
    e.preventDefault()
    e.stopPropagation()
    actionBus.emit('menu.open.tree.task', {
      masId: locators.masId,
      unitKey,
      taskKey: task.id,
      anchor: rowRef.current,
      clientX: e.clientX,
      clientY: e.clientY,
    })
  }

  const commitRename = (newKey) => {
    setEditing(false)
    const key = String(newKey || '').trim()
    if (!key || key === task.id) return
    actionBus.emit('task.rename', { masId: locators.masId, unitKey, taskKey: task.id, newKey: key })
  }

  return h('div', {
    ref: rowRef,
    className: 'ps-unit-row ps-tree-task-row' + (selected ? ' on' : ''),
    onClick: () => onSelect(unitKey, task.id),
    onDoubleClick: () => onRunTask(unitKey, task.id),
    onContextMenu,
    title: formatTaskLabel(task.id),
  },
    editing
      ? h(TreeRenameInput, { value: task.id, onCommit: commitRename, onCancel: () => setEditing(false) })
      : h('span', { className: 'ps-tree-task-name' }, formatTaskLabel(task.id)),
    !editing ? taskStatusBadge(task) : null,
  )
}

function registerTreeMenus() {
  menuService.register({
    id: 'tree.unit',
    openOn: 'menu.open.tree.unit',
    placement: 'anchor-end',
    items: (p) => {
      const isDefault = p && p.unitKey === 'default'
      return [
        { id: 'add', label: t('task.new'), action: 'task.new', payload: { unitKey: p && p.unitKey } },
        { id: 'rename', label: t('menu.rename'), action: 'unit.rename.pre', disabled: isDefault },
        { id: 'delete', label: t('menu.delete'), action: 'unit.delete.ask', danger: true, disabled: isDefault },
        { id: 'reveal', label: revealMenuLabel(), action: 'unit.reveal' },
      ]
    },
  })
  menuService.register({
    id: 'tree.task',
    openOn: 'menu.open.tree.task',
    placement: 'anchor-end',
    items: (p) => {
      const legacy = p && p.taskKey === 'legacy'
      return [
        { id: 'rename', label: t('menu.rename'), action: 'task.rename.pre', disabled: legacy },
        { id: 'delete', label: t('menu.delete'), action: 'task.delete.ask', danger: true, disabled: legacy },
        { id: 'reveal', label: revealMenuLabel(), action: 'task.reveal' },
      ]
    },
  })
}

registerTreeMenus()
