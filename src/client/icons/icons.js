// SVG icon registry — ICON_SVGS injected from assets/ at bundle time.

function psIconSize(raw, size) {
  return String(raw)
    .replace(/\swidth="24"/, ' width="' + size + '"')
    .replace(/\sheight="24"/, ' height="' + size + '"')
}

function PsIcon(props) {
  const { name, size = 18, className, title } = props
  const raw = typeof ICON_SVGS !== 'undefined' && ICON_SVGS[name]
  if (!raw) return null
  const cls = 'ps-icon' + (className ? ' ' + className : '')
  return h('span', {
    className: cls,
    title,
    dangerouslySetInnerHTML: { __html: psIconSize(raw, size) },
    'aria-hidden': title ? undefined : true,
  })
}
