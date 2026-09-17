// Boot page sign — compact branding for title bar.
import { PsIcon } from '../icons/icons.js'
import { t } from '../i18n.js'

export function BootSign() {
  return h('div', { className: 'ps-boot-sign' },
    h(PsIcon, { name: 'pomasa', size: 18, className: 'ps-boot-sign-icon' }),
    h('span', { className: 'ps-boot-name' }, t('studio.title')),
  )
}
