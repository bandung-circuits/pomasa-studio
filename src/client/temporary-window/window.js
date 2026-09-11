// TemporaryWindow — anchored popover; portaled to body; closes on outside click / Escape.

function TemporaryWindow(props) {
  const {
    anchorRef,
    open,
    onOpenChange,
    hierarchyBase = 0,
    className,
    children,
  } = props
  const panelRef = React.useRef(null)
  const [pos, setPos] = React.useState({ left: 0, top: 0 })
  const [positioned, setPositioned] = React.useState(false)
  const hoverRef = React.useRef(false)

  const place = React.useCallback(() => {
    const anchor = anchorRef && anchorRef.current
    if (!anchor || typeof anchor.getBoundingClientRect !== 'function') return false
    const r = anchor.getBoundingClientRect()
    const pad = 8
    let left = r.left
    let top = r.bottom + 6
    const vw = typeof window !== 'undefined' ? window.innerWidth : 800
    const vh = typeof window !== 'undefined' ? window.innerHeight : 600
    const w = 220
    if (left + w + pad > vw) left = Math.max(pad, vw - w - pad)
    if (top + 120 + pad > vh) top = Math.max(pad, r.top - 120 - 6)
    setPos({ left, top })
    setPositioned(true)
    return true
  }, [anchorRef])

  React.useLayoutEffect(() => {
    if (!open) {
      setPositioned(false)
      return
    }
    place()
    const onScroll = () => place()
    window.addEventListener('scroll', onScroll, true)
    window.addEventListener('resize', onScroll)
    return () => {
      window.removeEventListener('scroll', onScroll, true)
      window.removeEventListener('resize', onScroll)
    }
  }, [open, place])

  React.useEffect(() => {
    if (!open) return
    const onKey = (e) => { if (e.key === 'Escape') onOpenChange && onOpenChange(false) }
    const onDown = (e) => {
      if (e.button !== 0) return
      const panel = panelRef.current
      const anchor = anchorRef && anchorRef.current
      if (panel && panel.contains(e.target)) return
      if (anchor && anchor.contains(e.target)) return
      onOpenChange && onOpenChange(false)
    }
    window.addEventListener('keydown', onKey)
    window.addEventListener('mousedown', onDown)
    return () => {
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('mousedown', onDown)
    }
  }, [open, onOpenChange, anchorRef])

  const scheduleClose = React.useCallback(() => {
    window.setTimeout(() => {
      if (!hoverRef.current) onOpenChange && onOpenChange(false)
    }, 120)
  }, [onOpenChange])

  React.useEffect(() => {
    if (!open) return
    const anchor = anchorRef && anchorRef.current
    const onAnchorEnter = () => { hoverRef.current = true }
    const onAnchorLeave = () => { hoverRef.current = false; scheduleClose() }
    if (anchor) {
      anchor.addEventListener('mouseenter', onAnchorEnter)
      anchor.addEventListener('mouseleave', onAnchorLeave)
    }
    return () => {
      if (anchor) {
        anchor.removeEventListener('mouseenter', onAnchorEnter)
        anchor.removeEventListener('mouseleave', onAnchorLeave)
      }
    }
  }, [open, anchorRef, scheduleClose])

  if (!open) return null

  const hier = psHierarchyProps('temporary', hierarchyBase)
  const cls = ['ps-temp-win', 'ps-hier-overlay', hier.className]
  if (className) cls.push(className)

  const panel = h('div', {
    ref: panelRef,
    className: cls.join(' '),
    style: Object.assign({}, hier.style, {
      position: 'fixed',
      left: pos.left + 'px',
      top: pos.top + 'px',
      visibility: positioned ? 'visible' : 'hidden',
    }),
    onMouseEnter: () => { hoverRef.current = true },
    onMouseLeave: () => { hoverRef.current = false; scheduleClose() },
  }, children)

  const root = psOverlayRoot()
  if (root && typeof ReactDOM !== 'undefined' && ReactDOM.createPortal) {
    return ReactDOM.createPortal(panel, root)
  }
  return panel
}
