// UI render hierarchy — relative z offsets from a host base (superset model).

const PS_HIERARCHY = {
  MAIN: 0,
  INFO: 1,
  TEMPORARY: 5,
  DIALOGUE: 9,
  SECONDARY: 10,
}

const PS_HIERARCHY_KIND = {
  main: PS_HIERARCHY.MAIN,
  info: PS_HIERARCHY.INFO,
  temporary: PS_HIERARCHY.TEMPORARY,
  dialogue: PS_HIERARCHY.DIALOGUE,
  secondary: PS_HIERARCHY.SECONDARY,
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
  if (offset >= PS_HIERARCHY.INFO) return PS_HIERARCHY_OVERLAY_FLOOR + b + offset
  return b + offset
}

function psHierarchyStyle(kind, base) {
  const z = psHierarchyZ(kind, base)
  return { zIndex: z, '--ps-z': String(z) }
}

function psHierarchyProps(kind, base) {
  return {
    className: 'ps-hier',
    style: psHierarchyStyle(kind, base),
  }
}

function psHierarchyBackdropProps(kind, base) {
  const style = psHierarchyStyle(kind, base)
  return {
    className: 'ps-modal-backdrop ps-hier',
    style: Object.assign({ isolation: 'isolate' }, style),
  }
}

function psHierarchyMainProps() {
  return {
    className: 'ps-hier-main',
    style: psHierarchyStyle('main', 0),
  }
}

function useHierarchyBase() {
  return React.useContext(HierarchyBaseContext)
}

function snapshotHierarchyBase() {
  return hierarchyBaseStack.length
    ? hierarchyBaseStack[hierarchyBaseStack.length - 1]
    : 0
}

function HierarchyScope(props) {
  const { kind, base: explicitBase, children } = props
  const parentBase = useHierarchyBase()
  const scopeBase = psHierarchyChildBase(kind, explicitBase != null ? explicitBase : parentBase)

  React.useLayoutEffect(() => {
    hierarchyBaseStack.push(scopeBase)
    return () => { hierarchyBaseStack.pop() }
  }, [scopeBase])

  return h(HierarchyBaseContext.Provider, { value: scopeBase }, children)
}

function psOverlayRoot() {
  if (typeof document === 'undefined') return null
  let el = document.getElementById('ps-overlay-root')
  if (!el) {
    el = document.createElement('div')
    el.id = 'ps-overlay-root'
    document.body.appendChild(el)
  }
  return el
}
