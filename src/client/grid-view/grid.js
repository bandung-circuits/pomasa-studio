// Resizable row/column grid — layout only; sizes persisted via configStore.

const GRID_SIZE_KEY = 'pomasa-grid-sizes'

function loadGridSizesMap() {
  try {
    const raw = typeof localStorage !== 'undefined' && localStorage.getItem(GRID_SIZE_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch { return {} }
}

function saveGridSizesMap(map) {
  try { if (typeof localStorage !== 'undefined') localStorage.setItem(GRID_SIZE_KEY, JSON.stringify(map)) } catch {}
}

function parseGridDefault(d) {
  if (typeof d !== 'number' || !Number.isFinite(d)) return { kind: 'flex', value: 1 }
  if (d >= 40 || (d !== Math.floor(d))) return { kind: 'px', value: d }
  return { kind: 'flex', value: d }
}

function normalizeGridSizes(defaults, stored) {
  const base = (defaults || []).map(parseGridDefault)
  if (!stored || !stored.length || stored.length !== base.length) return base
  const parsed = stored.map((s, i) => {
    if (!s || typeof s !== 'object') return base[i]
    const kind = s.kind === 'px' || s.kind === 'flex' ? s.kind : 'flex'
    const value = Number(s.value)
    if (!Number.isFinite(value) || value <= 0) return base[i]
    return { kind, value }
  })
  // Legacy px locks (maxHeight on cells) → proportional flex weights
  if (parsed.every((p) => p.kind === 'px')) {
    const sum = parsed.reduce((a, p) => a + p.value, 0) || 1
    return parsed.map((p) => ({ kind: 'flex', value: Math.max(0.15, p.value / sum) }))
  }
  return parsed.map((p, i) => (p.kind === 'flex' ? p : base[i]))
}

function gridSizeToStyle(size, axis) {
  const s = size || { kind: 'flex', value: 1 }
  const v = Number(s.value) || 1
  const minMain = 48
  // Flex weights only — no maxHeight/maxWidth; cells fill the grid track, drag adjusts ratios
  return axis === 'row'
    ? { flex: v + ' 1 0', minWidth: minMain }
    : { flex: v + ' 1 0', minHeight: minMain }
}

function equalFlexDefaults(count) {
  const n = Math.max(1, count || 1)
  return Array.from({ length: n }, () => 1)
}

function ensureFlexSizes(sizes) {
  return (sizes || []).map((s) => {
    if (!s || s.kind !== 'px') return s
    return { kind: 'flex', value: Number(s.value) || 1 }
  })
}

Object.assign(configStore, {
  _gridSizes: loadGridSizesMap(),
  getGridSizes(id) { return this._gridSizes[id] || null },
  setGridSizes(id, sizes) {
    this._gridSizes = { ...this._gridSizes, [id]: sizes }
    saveGridSizesMap(this._gridSizes)
    this.emit()
  },
})

function gridSizesSubscribe(fn) { return configStore.subscribe(fn) }
function gridSizesSnapshot() { return configStore._gridSizes }

function useGridSizes(id) {
  if (typeof React.useSyncExternalStore !== 'function') return null
  const all = React.useSyncExternalStore(gridSizesSubscribe, gridSizesSnapshot)
  return all[id] || null
}

let gridBusReady = false
function ensureGridBus() {
  if (gridBusReady) return
  gridBusReady = true
  actionBus.on('grid.size.change', (payload) => {
    if (payload && payload.id && payload.sizes) configStore.setGridSizes(payload.id, payload.sizes)
  })
}

function GridView(props) {
  ensureGridBus()
  const { id, axis, cells, defaults, className, style } = props
  const isRow = axis === 'row'
  const visible = (cells || []).filter((c) => c && !c.hidden)
  const stored = id ? useGridSizes(id) : null
  const baseDefaults = React.useMemo(
    () => ((defaults && defaults.length === visible.length)
      ? defaults
      : equalFlexDefaults(visible.length)),
    [defaults, visible.length],
  )
  const sizes = React.useMemo(
    () => normalizeGridSizes(baseDefaults, stored),
    [baseDefaults, stored],
  )
  const sizesRef = React.useRef(sizes)
  sizesRef.current = sizes
  const dragRef = React.useRef(null)
  const rootRef = React.useRef(null)

  const finishDrag = React.useCallback(() => {
    dragRef.current = null
    if (typeof document !== 'undefined') document.body.style.cursor = ''
  }, [])

  React.useEffect(() => {
    const onMove = (e) => {
      const d = dragRef.current
      if (!d || !rootRef.current) return
      const rect = rootRef.current.getBoundingClientRect()
      const total = isRow ? rect.width : rect.height
      if (total <= 0) return
      const delta = (isRow ? e.clientX : e.clientY) - d.startPos
      const next = ensureFlexSizes(sizesRef.current.map((s) => ({ ...s })))
      const a = next[d.index]
      const b = next[d.index + 1]
      if (!a || !b) return
      const shift = delta / Math.max(total, 1)
      a.kind = 'flex'
      b.kind = 'flex'
      a.value = Math.max(0.15, d.startA + shift * 4)
      b.value = Math.max(0.15, d.startB - shift * 4)
      if (id) actionBus.emit('grid.size.change', { id, sizes: next })
    }
    const onUp = () => finishDrag()
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
    return () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
    }
  }, [finishDrag, id, isRow])

  const onSplitDown = (index, e) => {
    if (!id || visible.length < 2) return
    e.preventDefault()
    const cur = sizesRef.current
    dragRef.current = {
      index,
      startPos: isRow ? e.clientX : e.clientY,
      startA: cur[index] ? cur[index].value : 1,
      startB: cur[index + 1] ? cur[index + 1].value : 1,
    }
    if (typeof document !== 'undefined') document.body.style.cursor = isRow ? 'col-resize' : 'row-resize'
  }

  const kids = []
  visible.forEach((cell, i) => {
    kids.push(h('div', {
      key: cell.key || ('cell-' + i),
      className: 'ps-grid-cell' + (cell.className ? ' ' + cell.className : ''),
      style: gridSizeToStyle(sizes[i], axis),
    }, cell.content))
    if (i < visible.length - 1 && cell.resizable !== false && visible[i + 1].resizable !== false) {
      kids.push(h('div', {
        key: 'split-' + i,
        className: 'ps-grid-split' + (isRow ? ' ps-grid-split-h' : ' ps-grid-split-v'),
        onPointerDown: (e) => onSplitDown(i, e),
      }))
    }
  })

  return h('div', {
    ref: rootRef,
    className: 'ps-grid ps-grid-' + axis + (className ? ' ' + className : ''),
    style,
  }, kids)
}

function RegionStack(props) {
  const { region } = props
  const parts = layoutSlots.parts(region)
  if (!parts.length) return null
  return h('div', { className: 'ps-region-stack' },
    parts.map((part) => {
      const content = part.render()
      if (content === null || content === undefined) return null
      if (part.title === null) return h('div', { key: part.id, className: 'ps-part ps-part-frameless' }, content)
      const title = typeof part.title === 'function' ? part.title() : part.title
      return h(PartFrame, {
        key: part.id,
        partId: part.id,
        title,
        description: part.description,
        partClassName: part.partClassName,
        bodyClassName: part.bodyClassName,
      }, content)
    }),
  )
}

function RegionGrid(props) {
  const { region, gridId, axis, defaults } = props
  const parts = layoutSlots.parts(region)
  if (!parts.length) return null
  const cells = parts.map((part) => ({
    key: part.id,
    resizable: true,
    content: (() => {
      const content = part.render()
      if (content === null || content === undefined) return null
      if (part.title === null) return h('div', { className: 'ps-part ps-part-frameless' }, content)
      const title = typeof part.title === 'function' ? part.title() : part.title
      return h(PartFrame, {
        title,
        partId: part.id,
        description: part.description,
        partClassName: part.partClassName,
        bodyClassName: part.bodyClassName,
      }, content)
    })(),
    hidden: false,
  })).filter((c) => c.content !== null)
  if (!cells.length) return null
  if (cells.length === 1) {
    return h('div', { className: 'ps-region-stack ps-region-single' }, cells[0].content)
  }
  const sizeDefaults = (defaults && defaults.length === cells.length)
    ? defaults
    : equalFlexDefaults(cells.length)
  return h(GridView, { id: gridId, axis, cells, defaults: sizeDefaults })
}

function WorkStage() {
  return h(RegionGrid, {
    region: 'work.center',
    gridId: 'work.center',
    axis: 'column',
  })
}

function WorkRightStage() {
  return h(RegionGrid, {
    region: 'work.right',
    gridId: 'work.right',
    axis: 'column',
  })
}

function WorkBottomBar() {
  const parts = layoutSlots.parts('work.bottom')
  const nodes = parts.map((part) => {
    const content = part.render()
    if (content === null || content === undefined) return null
    return h('div', { key: part.id, className: 'ps-work-status-inner' }, content)
  }).filter(Boolean)
  if (!nodes.length) return null
  return h('div', { className: 'ps-work-status' }, nodes)
}
