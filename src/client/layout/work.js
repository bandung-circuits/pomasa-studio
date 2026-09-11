// Work layout — title / middle (3-column grid) / optional status bar.

function WorkLayout() {
  registerStudioSlots()
  const tm = useTaskManager()
  if (tm.generated === null) {
    return h('div', { className: 'ps-layout-work' },
      h('div', { className: 'ps-muted', style: { padding: 24 } }, t('loading')),
    )
  }

  const notice = tm.notice
    ? h('div', { className: 'ps-notice ' + tm.notice.kind, style: { margin: '0 16px' } }, str(tm.notice.text))
    : null

  const stage = h(WorkStage, null)
  const generating = tm.generated === false

  const middleCells = generating
    ? [{ key: 'center', className: 'ps-work-stage', content: stage, resizable: false }]
    : [
        { key: 'left', className: 'ps-work-side', content: h(RegionStack, { region: 'work.left' }), resizable: true },
        { key: 'center', className: 'ps-work-stage', content: stage, resizable: true },
        { key: 'right', className: 'ps-work-side', content: h(WorkRightStage, null), resizable: true },
      ]

  const middle = h(GridView, {
    id: generating ? null : 'work.middle',
    axis: 'row',
    className: 'ps-work-middle',
    cells: middleCells,
    defaults: generating ? [1] : [1, 3, 1.2],
  })

  return h('div', { className: 'ps-layout-work' },
    layoutSlots.render('work.title'),
    notice,
    h('div', { className: 'ps-work-shell' },
      h('div', { className: 'ps-work-shell-middle' }, middle),
      h(WorkBottomBar, null),
    ),
  )
}
