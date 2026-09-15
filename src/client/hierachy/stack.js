// UI render hierarchy — relative z offsets from a host base (superset model).

const PS_HIERARCHY = {
  MAIN: 0,
  INFO: 1,
  TEMPORARY: 5,
  DIALOGUE: 9,
  SECONDARY: 10,
  /** ConversationRoot dock in chat — above shell.overlay (20), below #ps-overlay-root (100). */
  DOCK: 21,
}

const PS_HIERARCHY_KIND = {
  main: PS_HIERARCHY.MAIN,
  info: PS_HIERARCHY.INFO,
  temporary: PS_HIERARCHY.TEMPORARY,
  dialogue: PS_HIERARCHY.DIALOGUE,
  secondary: PS_HIERARCHY.SECONDARY,
  dock: PS_HIERARCHY.DOCK,
}

/** Global floor so portaled overlays sit above parts (z-index 1–3) and grid chrome. */
const PS_HIERARCHY_OVERLAY_FLOOR = 100

const HierarchyBaseContext = React.createContext(0)
const hierarchyBaseStack = []

function psHierarchyOffset(kind) {
  if (typeof kind === 'number') return kind
  return PS_HIERARCHY_KIND[kind] != null ? PS_HIERARCHY_KIND[kind] : PS_HIERARCHY.MAIN
}

/** Accumulate parent kind offset onto base for nested overlays (e.g. secondary + temporary). */
function psHierarchyChildBase(kind, base) {
  const b = Number(base) || 0
  return b + psHierarchyOffset(kind)
}

function psHierarchyZ(kind, base) {
  const b = Number(base) || 0
  const offset = psHierarchyOffset(kind)
  if (offset === PS_HIERARCHY.DOCK) return offset
  if (offset >= PS_HIERARCHY.INFO) return PS_HIERARCHY_OVERLAY_FLOOR + b + offset
  return b + offset
}

export function psHierarchyStyle(kind, base) {
  const z = psHierarchyZ(kind, base)
  return { zIndex: z, '--ps-z': String(z) }
}

export function psHierarchyProps(kind, base) {
  return {
    className: 'ps-hier',
    style: psHierarchyStyle(kind, base),
  }
}

export function psHierarchyBackdropProps(kind, base) {
  const style = psHierarchyStyle(kind, base)
  return {
    className: 'ps-modal-backdrop ps-hier',
    style: Object.assign({ isolation: 'isolate' }, style),
  }
}

export function psHierarchyMainProps() {
  return {
    className: 'ps-hier-main',
    style: psHierarchyStyle('main', 0),
  }
}

export function useHierarchyBase() {
  return React.useContext(HierarchyBaseContext)
}

export function snapshotHierarchyBase() {
  return hierarchyBaseStack.length
    ? hierarchyBaseStack[hierarchyBaseStack.length - 1]
    : 0
}

export function HierarchyScope(props) {
  const { kind, base: explicitBase, children } = props
  const parentBase = useHierarchyBase()
  const scopeBase = psHierarchyChildBase(kind, explicitBase != null ? explicitBase : parentBase)

  React.useLayoutEffect(() => {
    hierarchyBaseStack.push(scopeBase)
    return () => { hierarchyBaseStack.pop() }
  }, [scopeBase])

  return h(HierarchyBaseContext.Provider, { value: scopeBase }, children)
}

export function psOverlayRoot() {
  if (typeof document === 'undefined') return null
  let el = document.getElementById('ps-overlay-root')
  if (!el) {
    el = document.createElement('div')
    el.id = 'ps-overlay-root'
    document.body.appendChild(el)
  }
  return el
}

/** Portal a secondary overlay into #ps-overlay-root with optional nested hierarchy base. */
export function portalSecondaryModal(hierarchyBase, content) {
  const inner = h(HierarchyScope, {
    kind: 'secondary',
    base: hierarchyBase != null ? hierarchyBase : undefined,
  }, content)
  const root = psOverlayRoot()
  if (root && typeof ReactDOM !== 'undefined' && ReactDOM.createPortal) {
    return ReactDOM.createPortal(inner, root)
  }
  return inner
}
