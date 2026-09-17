// Boot layout — title bar + VS-style hero, recent left | actions right + footer tips.
import { RegionStack } from '../grid-view/grid.js'
import { t } from '../i18n.js'
import { layoutSlots, registerStudioSlots } from '../parts/slots.js'

export function BootLayout() {
  registerStudioSlots()
  return h('div', { className: 'ps-layout-boot' },
    layoutSlots.render('boot.title'),
    h('div', { className: 'ps-boot-body' },
      h('div', { className: 'ps-boot-main' },
        h('h1', { className: 'ps-boot-hero' }, t('boot.welcome')),
        h('div', { className: 'ps-boot-split' },
          h('div', { className: 'ps-boot-recent-wrap' },
            h(RegionStack, { region: 'boot.content' }),
          ),
          h('div', { className: 'ps-boot-actions' },
            h(RegionStack, { region: 'boot.toolbar' }),
          ),
        ),
      ),
    ),
    h('div', { className: 'ps-boot-footer' },
      h(RegionStack, { region: 'boot.footer' }),
    ),
  )
}
