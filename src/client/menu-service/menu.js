// MenuHost — renders registered context menus; forwards item clicks as actions.

const menuState = {
  open: null,
  payload: null,
  _snap: { open: null, payload: null },
  subs: new Set(),
  emit() { for (const fn of this.subs) fn() },
  subscribe(fn) { this.subs.add(fn); return () => { this.subs.delete(fn) } },
  show(menu, payload) {
    this.open = menu
    this.payload = Object.assign({}, payload || {}, { hierarchyBase: snapshotHierarchyBase() })
    this._snap = { open: this.open, payload: this.payload }
    this.emit()
  },
  hide() {
    if (!this.open && !this.payload) return
    this.open = null
    this.payload = null
    this._snap = { open: null, payload: null }
    this.emit()
  },
}

function menuSubscribe(fn) { return menuState.subscribe(fn) }
function menuSnapshot() { return menuState._snap }

function useMenuState() {
  if (typeof React.useSyncExternalStore === 'function') {
    return React.useSyncExternalStore(menuSubscribe, menuSnapshot)
  }
  const [v, setV] = React.useState(menuSnapshot())
  React.useEffect(() => menuState.subscribe(() => setV(menuSnapshot())), [])
  return v
}

function clampMenuPos(x, y, w, h) {
  const pad = 8
  const vw = typeof window !== 'undefined' ? window.innerWidth : 800
  const vh = typeof window !== 'undefined' ? window.innerHeight : 600
  let left = x
  let top = y
  if (left + w + pad > vw) left = Math.max(pad, vw - w - pad)
  if (top + h + pad > vh) top = Math.max(pad, vh - h - pad)
  if (left < pad) left = pad
  if (top < pad) top = pad
  return { left, top }
}

function menuAnchorPoint(placement, payload) {
  const anchor = payload && payload.anchor
  if (placement === 'pointer' && payload && payload.clientX != null) {
    return { x: payload.clientX, y: payload.clientY }
  }
  if (anchor && typeof anchor.getBoundingClientRect === 'function') {
    const r = anchor.getBoundingClientRect()
    if (placement === 'anchor-start') return { x: r.left, y: r.top }
    if (placement === 'pointer') return { x: r.left, y: r.bottom }
    return { x: r.right, y: r.bottom }
  }
  return { x: (payload && payload.clientX) || 0, y: (payload && payload.clientY) || 0 }
}

function ensureMenuHost() {
  menuService.wireAll()
}

function MenuHost() {
  ensureMenuHost()
  const { open, payload } = useMenuState()
  const panelRef = React.useRef(null)
  const [pos, setPos] = React.useState({ left: 0, top: 0 })

  React.useEffect(() => {
    if (!open || !payload) return
    const p = menuAnchorPoint(open.placement, payload)
    const w = 200
    const h = Math.max(1, (open.items(payload) || []).length) * 34 + 8
    setPos(clampMenuPos(p.x, p.y, w, h))
  }, [open, payload])

  React.useEffect(() => {
    if (!open) return
    const onKey = (e) => { if (e.key === 'Escape') menuState.hide() }
    const onDown = (e) => {
      if (e.button !== 0) return
      const el = panelRef.current
      if (el && el.contains(e.target)) return
      menuState.hide()
    }
    window.addEventListener('keydown', onKey)
    window.addEventListener('mousedown', onDown)
    return () => {
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('mousedown', onDown)
    }
  }, [open])

  if (!open || !payload) return null
  const items = (typeof open.items === 'function' ? open.items(payload) : open.items) || []
  if (!items.length) return null

  const pick = (item) => {
    if (item.disabled) return
    menuState.hide()
    actionBus.emit(item.action, Object.assign({}, payload, item.payload || {}))
  }

  const menuHier = psHierarchyProps('dialogue', payload.hierarchyBase != null ? payload.hierarchyBase : 0)
  return h('div', {
    ref: panelRef,
    className: 'ps-menu ' + menuHier.className,
    style: Object.assign({}, menuHier.style, { left: pos.left + 'px', top: pos.top + 'px' }),
    onContextMenu: (e) => e.preventDefault(),
  },
    items.map((item) => h('button', {
      key: item.id || item.action,
      type: 'button',
      className: 'ps-menu-item' + (item.danger ? ' danger' : '') + (item.disabled ? ' disabled' : ''),
      disabled: !!item.disabled,
      onClick: () => pick(item),
    }, str(item.label))),
  )
}
