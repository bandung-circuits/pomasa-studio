// Title bars for boot and work layouts — emit actions, read locators/task-manager.
import { actionBus } from '../actions/bus.js'
import { BootSign } from '../boot-sign/sign.js'
import { psIconBtn } from '../buttons/button.js'
import { t } from '../i18n.js'
import { locators, useLocators } from '../locators/context.js'
import { StudioModeSwitchBtn } from '../studio-mode/panel.js'
import { useTaskManager } from '../task-manager/store.js'
import { closeWorkbenchPanel, str } from '../util.js'

function StudioCloseBtn() {
  return h(psIconBtn, {
    icon: 'close',
    className: 'ps-title-close-btn',
    onClick: () => closeWorkbenchPanel(),
    title: t('launcher.close'),
  })
}

export function BootTitleBarSlot() {
  return h('div', { className: 'ps-title-bar' },
    h('div', { className: 'ps-title-left' }, h(BootSign, null)),
    h('span', { className: 'spacer', style: { flex: 1 } }),
    h(psIconBtn, { icon: 'settings', onClick: () => actionBus.emit('settings.open', {}), title: t('settings.title') }),
    h(StudioCloseBtn, null),
  )
}

export function WorkTitleBarSlot() {
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
    h(StudioCloseBtn, null),
  )
}

function WorkTitleBar(props) {
  return h(WorkTitleBarSlot, props)
}
