// Part description — info icon + layer-aware fixed tooltip.
import { psHierarchyProps, psOverlayRoot, useHierarchyBase } from '../hierachy/stack.js'
import { PsIcon } from '../icons/icons.js'
import { str } from '../util.js'

function resolveDescriptionLines(props) {
  const { text, rows } = props || {}
  if (rows && rows.length) return rows.map((line) => str(line)).filter(Boolean)
  if (text == null) return []
  const v = typeof text === 'function' ? text() : text
  if (!v) return []
  if (Array.isArray(v)) return v.map((line) => str(line)).filter(Boolean)
  return [str(v)]
}

export function PartDescription(props) {
  const ctxBase = useHierarchyBase()
  const base = (props && props.hierarchyBase) != null ? props.hierarchyBase : ctxBase
  const children = props && props.children
  const lines = resolveDescriptionLines(props)
  if (!lines.length) return null

  const [open, setOpen] = React.useState(false)
  const [pos, setPos] = React.useState({ x: 0, y: 0 })
  const anchorRef = React.useRef(null)

  const place = React.useCallback(() => {
    const el = anchorRef.current
    if (!el) return
    const r = el.getBoundingClientRect()
    setPos({ x: r.left + r.width / 2, y: r.bottom + 8 })
  }, [])

  const show = () => { place(); setOpen(true) }
  const hide = () => setOpen(false)

  const tipHier = psHierarchyProps('info', base)
  const tipCls = ['ps-part-desc-tip', 'ps-part-desc-tip--fixed', 'ps-hier-overlay', tipHier.className].join(' ')

  const tip = open ? h('span', {
    className: tipCls,
    role: 'tooltip',
    style: Object.assign({}, tipHier.style, { left: pos.x + 'px', top: pos.y + 'px' }),
  },
    lines.map((line, i) => h('span', { key: i, className: 'ps-part-desc-line' }, line)),
  ) : null

  const tipNode = (() => {
    if (!tip) return null
    const root = psOverlayRoot()
    if (root && typeof ReactDOM !== 'undefined' && ReactDOM.createPortal) {
      return ReactDOM.createPortal(tip, root)
    }
    return tip
  })()

  return h(React.Fragment, null,
    h('span', {
      ref: anchorRef,
      className: children != null ? 'ps-part-desc-anchor' : 'ps-part-desc',
      onMouseEnter: show,
      onMouseLeave: hide,
      onFocus: show,
      onBlur: hide,
      tabIndex: children != null ? undefined : 0,
    },
      children != null ? children : h(PsIcon, { name: 'info', size: 15, className: 'ps-part-desc-icon', title: undefined }),
    ),
    tipNode,
  )
}
