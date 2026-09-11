// Boot page sign — POMASA STUDIO branding.

function BootSign() {
  return h('div', { className: 'ps-boot-sign' },
    h('span', { className: 'ps-boot-glyph' }, '◫'),
    h('span', { className: 'ps-boot-name' }, t('studio.title')),
  )
}
