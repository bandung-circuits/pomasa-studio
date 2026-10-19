// Boot toolbar — VS-style wide action rows; actions registered at module scope.
import { actionBus } from '../actions/bus.js'
import { PsIcon } from '../icons/icons.js'
import { t } from '../i18n.js'
import { closeWorkbenchPanel } from '../util.js'
import { registerToolbarAction, toolbarActions } from './actions.js'

const BOOT_TOOLBAR_ID = 'boot'

registerToolbarAction({
  toolbarId: BOOT_TOOLBAR_ID,
  id: 'mas.create',
  order: 10,
  icon: 'add-mas',
  label: () => t('boot.action.create.label'),
  description: () => t('boot.action.create.desc'),
  onClick: () => actionBus.emit('mas.create', {}),
})

registerToolbarAction({
  toolbarId: BOOT_TOOLBAR_ID,
  id: 'settings.open',
  order: 20,
  icon: 'settings',
  label: () => t('boot.action.settings.label'),
  description: () => t('boot.action.settings.desc'),
  onClick: () => actionBus.emit('settings.open', {}),
})

registerToolbarAction({
  toolbarId: BOOT_TOOLBAR_ID,
  id: 'studio.close',
  order: 30,
  icon: 'close',
  label: () => t('boot.action.close.label'),
  description: () => t('boot.action.close.desc'),
  onClick: () => closeWorkbenchPanel(),
})

function BootActionCard(props) {
  const { entry } = props
  if (entry.render) {
    return h('div', { className: 'ps-boot-toolbar-item' },
      typeof entry.render === 'function' ? entry.render() : entry.render,
    )
  }
  const label = entry.label ? (typeof entry.label === 'function' ? entry.label() : entry.label) : ''
  const description = entry.description
    ? (typeof entry.description === 'function' ? entry.description() : entry.description)
    : ''
  return h('button', {
    type: 'button',
    className: 'ps-boot-action-card',
    onClick: entry.onClick,
    title: description || label,
  },
    h('span', { className: 'ps-boot-action-icon', 'aria-hidden': true },
      h(PsIcon, { name: entry.icon, size: 28 }),
    ),
    h('span', { className: 'ps-boot-action-text' },
      label ? h('span', { className: 'ps-boot-action-label' }, label) : null,
      description ? h('span', { className: 'ps-boot-action-desc' }, description) : null,
    ),
  )
}

export function BootToolbar() {
  const actions = toolbarActions(BOOT_TOOLBAR_ID)
  return h('nav', { className: 'ps-boot-toolbar', 'aria-label': t('boot.toolbar') },
    h('h2', { className: 'ps-boot-toolbar-heading' }, t('boot.getStarted')),
    h('div', { className: 'ps-boot-toolbar-bar' },
      actions.map((entry) => h(BootActionCard, { key: entry.id, entry })),
    ),
  )
}
