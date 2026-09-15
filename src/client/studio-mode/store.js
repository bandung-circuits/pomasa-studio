// Studio mode — execute (0) vs design (1); picker in title bar.

const MODE_EXECUTE = 0
const MODE_DESIGN = 1

const studioModeRef = {
  mode: 'execute',
  sessionId: null,
  masRoot: null,
  focusAgent: null,
  subs: new Set(),
  emit() { for (const fn of this.subs) fn() },
  subscribe(fn) { this.subs.add(fn); return () => { this.subs.delete(fn) } },
  modeIndex() {
    return this.mode === 'design' ? MODE_DESIGN : MODE_EXECUTE
  },
  setModeIndex(idx) {
    this.mode = idx === MODE_DESIGN ? 'design' : 'execute'
    this.emit()
  },
  setDesign(payload) {
    this.mode = 'design'
    this.sessionId = payload && payload.sessionId ? String(payload.sessionId) : null
    this.masRoot = payload && payload.masRoot ? String(payload.masRoot) : null
    this.focusAgent = null
    this.emit()
  },
  setFocusAgent(agent) {
    this.focusAgent = agent || null
    this.emit()
  },
  reset() {
    this.mode = 'execute'
    this.sessionId = null
    this.masRoot = null
    this.focusAgent = null
    this.emit()
  },
}

const modePickerRef = {
  open: false,
  subs: new Set(),
  emit() { for (const fn of this.subs) fn() },
  subscribe(fn) { this.subs.add(fn); return () => { this.subs.delete(fn) } },
  setOpen(v) { this.open = !!v; this.emit() },
}

let designSessionSnapshot = null
let designSessionSnapshotSig = ''

function designSessionSig() {
  const a = studioModeRef.focusAgent
  return [
    studioModeRef.mode,
    studioModeRef.sessionId,
    studioModeRef.masRoot,
    a ? a.agentKey : '',
    a ? a.agentPath : '',
    a ? a.title : '',
  ].join('\0')
}

function getDesignSessionSnapshot() {
  const sig = designSessionSig()
  if (designSessionSnapshot && designSessionSnapshotSig === sig) return designSessionSnapshot
  designSessionSnapshotSig = sig
  designSessionSnapshot = {
    mode: studioModeRef.mode,
    sessionId: studioModeRef.sessionId,
    masRoot: studioModeRef.masRoot,
    focusAgent: studioModeRef.focusAgent,
  }
  return designSessionSnapshot
}

function useStudioMode() {
  if (typeof React.useSyncExternalStore === 'function') {
    return React.useSyncExternalStore(
      studioModeRef.subscribe.bind(studioModeRef),
      () => studioModeRef.mode,
    )
  }
  const [v, setV] = React.useState(studioModeRef.mode)
  React.useEffect(() => studioModeRef.subscribe(() => setV(studioModeRef.mode)), [])
  return v
}

function useStudioModeIndex() {
  if (typeof React.useSyncExternalStore === 'function') {
    return React.useSyncExternalStore(
      studioModeRef.subscribe.bind(studioModeRef),
      () => studioModeRef.modeIndex(),
    )
  }
  const [v, setV] = React.useState(studioModeRef.modeIndex())
  React.useEffect(() => studioModeRef.subscribe(() => setV(studioModeRef.modeIndex())), [])
  return v
}

function useDesignSession() {
  if (typeof React.useSyncExternalStore === 'function') {
    return React.useSyncExternalStore(
      studioModeRef.subscribe.bind(studioModeRef),
      getDesignSessionSnapshot,
      getDesignSessionSnapshot,
    )
  }
  const [v, setV] = React.useState(getDesignSessionSnapshot())
  React.useEffect(() => studioModeRef.subscribe(() => setV(getDesignSessionSnapshot())), [])
  return v
}

function useModePickerOpen() {
  if (typeof React.useSyncExternalStore === 'function') {
    return React.useSyncExternalStore(
      modePickerRef.subscribe.bind(modePickerRef),
      () => modePickerRef.open,
    )
  }
  const [v, setV] = React.useState(modePickerRef.open)
  React.useEffect(() => modePickerRef.subscribe(() => setV(modePickerRef.open)), [])
  return v
}

function isStudioDesignMode() {
  return studioModeRef.mode === 'design'
}

function resetStudioMode() {
  studioModeRef.reset()
  modePickerRef.setOpen(false)
}
