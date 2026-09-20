// Boot footer tips bar — cycles preset usage hints and repo links.
import { psIconBtn } from '../buttons/button.js'
import { t } from '../i18n.js'
import { BOOT_TIPS, BOOT_TIPS_INTERVAL_MS } from './tips.js'

function wrapIndex(i, len) {
  if (len <= 0) return 0
  return ((i % len) + len) % len
}

function BootTipText(props) {
  const { tip } = props
  const text = t(tip.textKey)
  if (tip.href) {
    return h('a', {
      className: 'ps-boot-tips-link',
      href: tip.href,
      target: '_blank',
      rel: 'noopener noreferrer',
    }, text)
  }
  return h('span', { className: 'ps-boot-tips-text' }, text)
}

export function BootTipsBar() {
  const tips = BOOT_TIPS
  const len = tips.length
  const [index, setIndex] = React.useState(0)
  const [paused, setPaused] = React.useState(false)

  const goPrev = React.useCallback(() => {
    setIndex((i) => wrapIndex(i - 1, len))
  }, [len])

  const goNext = React.useCallback(() => {
    setIndex((i) => wrapIndex(i + 1, len))
  }, [len])

  React.useEffect(() => {
    if (len <= 1 || paused) return undefined
    const timer = setInterval(() => {
      setIndex((i) => wrapIndex(i + 1, len))
    }, BOOT_TIPS_INTERVAL_MS)
    return () => clearInterval(timer)
  }, [len, paused])

  if (!len) return null
  const tip = tips[wrapIndex(index, len)]

  return h('div', {
    className: 'ps-boot-tips-bar',
    role: 'status',
    'aria-live': 'polite',
    onMouseEnter: () => setPaused(true),
    onMouseLeave: () => setPaused(false),
  },
    h('div', { className: 'ps-boot-tips-main', key: tip.id },
      h(BootTipText, { tip }),
    ),
    len > 1
      ? h('div', { className: 'ps-boot-tips-controls' },
        h(psIconBtn, {
          icon: 'back',
          className: 'ps-boot-tips-nav ps-boot-tips-nav--prev',
          onClick: goPrev,
          title: t('boot.tips.prev'),
        }),
        h('span', { className: 'ps-boot-tips-counter ps-muted' },
          String(wrapIndex(index, len) + 1) + ' / ' + String(len),
        ),
        h(psIconBtn, {
          icon: 'back',
          className: 'ps-boot-tips-nav ps-boot-tips-nav--next',
          onClick: goNext,
          title: t('boot.tips.next'),
        }),
      )
      : null,
  )
}
