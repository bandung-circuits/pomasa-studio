// ScrollFrame + ScrollBox — Frame scrolls; default Box follows Frame width; canvas is nodes derivative.

const partScrollStore = {
  _scales: {},
  _ver: 0,
  _subs: new Set(),
  getScale(partId) {
    if (!partId) return 1
    return this._scales[partId] != null ? this._scales[partId] : 1
  },
  setScale(partId, scale) {
    if (!partId) return
    const s = Math.max(0.5, Math.min(2, Number(scale) || 1))
    if (this._scales[partId] === s) return
    this._scales[partId] = s
    this._ver += 1
    this.emit()
  },
  snap() { return this._ver },
  subscribe(fn) { this._subs.add(fn); return () => { this._subs.delete(fn) } },
  emit() { for (const fn of this._subs) fn() },
}

function partScrollSubscribe(fn) { return partScrollStore.subscribe(fn) }

function partScrollSnapshot(partId) {
  partScrollStore.snap()
  return partScrollStore.getScale(partId)
}

function usePartScrollScale(partId, enabled) {
  if (!enabled || !partId) return 1
  if (typeof React.useSyncExternalStore === 'function') {
    return React.useSyncExternalStore(
      partScrollSubscribe,
      () => partScrollSnapshot(partId),
    )
  }
  const [scale, setScale] = React.useState(() => partScrollStore.getScale(partId))
  React.useEffect(() => partScrollStore.subscribe(() => {
    setScale(partScrollStore.getScale(partId))
  }), [partId])
  return scale
}

function ScrollFrame(props) {
  const { className, children, ...rest } = props
  const cls = ['ps-scroll-frame']
  if (className) cls.push(className)
  return h('div', Object.assign({ className: cls.join(' ') }, rest), children)
}

function ScrollBox(props) {
  const {
    mode = 'default',
    scale = 1,
    className,
    children,
  } = props

  if (mode === 'canvas') {
    const cls = ['ps-scrollbox', 'ps-scrollbox--canvas']
    if (className) cls.push(className)
    const box = h('div', { className: cls.join(' ') },
      h('div', { className: 'ps-scrollbox-canvas', style: { zoom: scale } }, children),
    )
    return h(ScrollFrame, null, box)
  }

  const cls = ['ps-scrollbox']
  if (className) cls.push(className)
  return h('div', { className: cls.join(' ') }, children)
}
