// Footer startup button — registers in DSH sidebar footArea via sidebar.footer.action.
import { t } from '../i18n.js'
import { PsIcon } from '../icons/icons.js'

function usePanelOpen(panel) {
  if (typeof React.useSyncExternalStore === 'function') {
    return React.useSyncExternalStore(panel.subscribe.bind(panel), () => panel.open)
  }
  const [v, setV] = React.useState(panel.open)
  React.useEffect(() => panel.subscribe(() => setV(panel.open)), [panel])
  return v
}

function StartupButton(props) {
  const { open, onToggle, wide = true } = props
  const cls = 'ps-startup-btn'
    + (wide ? '' : ' ps-startup-btn--rail')
    + (open ? ' ps-startup-btn--on' : '')
  return h('button', {
    type: 'button',
    className: cls,
    'data-ps-startup': 'pomasa-studio',
    'aria-haspopup': 'dialog',
    'aria-expanded': open ? 'true' : 'false',
    title: open ? t('launcher.close') : t('launcher.open'),
    onClick: onToggle,
  },
    h('span', { 'data-slot': 'pomasa.trigger', style: { display: 'contents' } },
      h(PsIcon, { name: 'pomasa', size: wide ? 16 : 18, className: 'ps-startup-btn-icon' }),
      wide ? h('span', { className: 'ps-startup-btn-label' }, t('startup.label')) : null,
    ),
  )
}

export function registerStartupButton(slots, panel, h2) {
  function FooterStartup(props) {
    const open = usePanelOpen(panel)
    const wide = !(props && props.wide === false)
    return h2(StartupButton, { open, wide, onToggle: () => panel.toggle() })
  }
  slots.inject('sidebar.footer.action', () => slots.register(
    { name: 'sidebar.footer.action', id: 'pomasa-studio', order: 15, label: t('startup.label') },
    (props) => h2(FooterStartup, props),
  ))
}
