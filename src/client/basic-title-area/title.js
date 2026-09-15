// Title bars for boot and work layouts — emit actions, read locators/task-manager.

function BootTitleBarSlot() {
  return h('div', { className: 'ps-title-bar' },
    h('div', { className: 'ps-title-left' }, h(BootSign, null)),
    h('span', { className: 'spacer', style: { flex: 1 } }),
    h(psBtn, { primary: true, style: { padding: '5px 12px', fontSize: 13.5 }, onClick: () => actionBus.emit('mas.create', {}) }, t('new.btn')),
    h(psIconBtn, { icon: 'settings', onClick: () => actionBus.emit('settings.open', {}), title: t('settings.title') }),
  )
}

function WorkTitleBarSlot() {
  const loc = useLocators()
  const tm = useTaskManager()
  const name = str((tm.descriptor && (tm.descriptor.name || tm.descriptor.id)) || loc.masId || '')
  const caption = loc.masId
    ? ('ID ' + str(loc.masId) + (tm.descriptor && tm.descriptor.schemaVersion ? ' · schema ' + str(tm.descriptor.schemaVersion) : ''))
    : ''
  return h('div', { className: 'ps-title-bar' },
    h(psIconBtn, { icon: 'back', onClick: () => {
      locators.set({ masId: null, unitKey: null, taskKey: null })
      actionBus.emit('layout.boot', {})
    }, title: t('layout.back') }),
    h('div', { className: 'ps-title-mas' },
      h('span', { className: 'ps-title-name' }, name),
      caption ? h('span', { className: 'ps-title-caption' }, caption) : null,
    ),
    h('span', { className: 'spacer', style: { flex: 1 } }),
    h(StudioModeSwitchBtn, null),
    h(psIconBtn, { icon: 'settings', onClick: () => actionBus.emit('settings.open', {}), title: t('settings.title') }),
  )
}

function BootTitleBar(props) {
  return h(BootTitleBarSlot, props)
}

function WorkTitleBar(props) {
  return h(WorkTitleBarSlot, props)
}
