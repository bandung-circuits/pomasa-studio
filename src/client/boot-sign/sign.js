// Boot page sign — POMASA STUDIO branding.
import { t } from '../i18n.js'

export function BootSign() {
  return h('div', { className: 'ps-boot-sign' },
    h('span', { className: 'ps-boot-glyph' }, '◫'),
    h('span', { className: 'ps-boot-name' }, t('studio.title')),
  )
}
