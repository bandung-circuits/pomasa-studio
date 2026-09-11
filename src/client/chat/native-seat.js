// NativeConversationSeat — visual dock of DSH ConversationRoot into chat part (no appendChild).

const nativeConversationState = {
  savedSelection: null,
  dockedEl: null,
  savedInline: null,
}

function findConversationRoot() {
  if (typeof document === 'undefined') return null
  const scroll = document.querySelector('[data-conversation-scroll]')
  if (!scroll || !scroll.parentElement) return null
  return scroll.parentElement
}

function captureInlineStyles(el) {
  return {
    position: el.style.position,
    top: el.style.top,
    left: el.style.left,
    width: el.style.width,
    height: el.style.height,
    zIndex: el.style.zIndex,
    margin: el.style.margin,
    pointerEvents: el.style.pointerEvents,
    visibility: el.style.visibility,
    boxSizing: el.style.boxSizing,
  }
}

function restoreInlineStyles(el, saved) {
  if (!el || !saved) return
  el.style.position = saved.position
  el.style.top = saved.top
  el.style.left = saved.left
  el.style.width = saved.width
  el.style.height = saved.height
  el.style.zIndex = saved.zIndex
  el.style.margin = saved.margin
  el.style.pointerEvents = saved.pointerEvents
  el.style.visibility = saved.visibility
  el.style.boxSizing = saved.boxSizing
  el.classList.remove('ps-native-conversation-root')
}

function dockConversationRoot(el, rect) {
  if (!el || !rect || rect.width < 1 || rect.height < 1) return
  if (nativeConversationState.dockedEl !== el) {
    if (nativeConversationState.dockedEl && nativeConversationState.savedInline) {
      restoreInlineStyles(nativeConversationState.dockedEl, nativeConversationState.savedInline)
    }
    nativeConversationState.dockedEl = el
    nativeConversationState.savedInline = captureInlineStyles(el)
  }
  el.classList.add('ps-native-conversation-root')
  el.style.boxSizing = 'border-box'
  el.style.position = 'fixed'
  el.style.top = rect.top + 'px'
  el.style.left = rect.left + 'px'
  el.style.width = rect.width + 'px'
  el.style.height = rect.height + 'px'
  const dockHier = psHierarchyStyle('dock')
  el.style.zIndex = String(dockHier.zIndex)
  el.style.setProperty('--ps-z', dockHier['--ps-z'])
  el.style.margin = '0'
  el.style.pointerEvents = 'auto'
  el.style.visibility = 'visible'
  if (typeof document !== 'undefined') document.body.classList.add('ps-native-conversation-docked')
}

function undockConversationRoot() {
  const el = nativeConversationState.dockedEl
  if (el && nativeConversationState.savedInline) {
    restoreInlineStyles(el, nativeConversationState.savedInline)
  }
  nativeConversationState.dockedEl = null
  nativeConversationState.savedInline = null
  if (typeof document !== 'undefined') document.body.classList.remove('ps-native-conversation-docked')
}

function saveSessionSelection(sessionsSvc) {
  if (!sessionsSvc || typeof sessionsSvc.list !== 'object' || !sessionsSvc.list.getSnapshot) return null
  const snap = sessionsSvc.list.getSnapshot()
  return {
    sessionId: snap.current,
    address: snap.currentAddress,
  }
}

function restoreSessionSelection(sessionsSvc, saved) {
  if (!sessionsSvc || !saved) return
  try {
    if (saved.address && typeof sessionsSvc.openSubagent === 'function') {
      sessionsSvc.openSubagent(saved.address)
      return
    }
    if (saved.sessionId && typeof sessionsSvc.open === 'function') {
      sessionsSvc.open(saved.sessionId)
      return
    }
    if (typeof sessionsSvc.clear === 'function') sessionsSvc.clear()
  } catch { /* best-effort */ }
}

function openNativeSession(sessionsSvc, bind) {
  if (!sessionsSvc || !bind) return
  try {
    if (bind.address && typeof sessionsSvc.openSubagent === 'function') {
      sessionsSvc.openSubagent(bind.address)
      return
    }
    if (bind.sessionId && typeof sessionsSvc.open === 'function') {
      sessionsSvc.open(bind.sessionId)
    }
  } catch { /* ignore */ }
}

function buildNativeBind(info, agentKey, subCache, loc) {
  if (!info || !info.sessionId) return null
  const sid = info.sessionId
  const isOrch = !agentKey || agentKey === 'orchestrator'
  if (isOrch) return { sessionId: sid }
  const orchKey = subagentClient.key(loc.masId, loc.unitKey, loc.taskKey, 'orchestrator')
  const orchEntry = subCache[orchKey]
  const parentSessionId = orchEntry && orchEntry.sessionId
  if (!parentSessionId) return { sessionId: sid }
  return {
    address: {
      parentSessionId,
      childSessionId: sid,
      mode: 'continuable',
    },
  }
}

function NativeConversationSeat(props) {
  const { active, bind } = props
  const seatRef = React.useRef(null)
  const sessionsSvc = getSessionsService()
  const bindKey = bind
    ? (bind.address
      ? bind.address.parentSessionId + '|' + bind.address.childSessionId
      : bind.sessionId || '')
    : ''

  React.useEffect(() => {
    if (!active) return undefined
    if (!nativeConversationState.savedSelection && sessionsSvc) {
      nativeConversationState.savedSelection = saveSessionSelection(sessionsSvc)
    }
    return undefined
  }, [active, sessionsSvc])

  React.useEffect(() => {
    if (!active || !sessionsSvc || !bind) return undefined
    openNativeSession(sessionsSvc, bind)
    return undefined
  }, [active, sessionsSvc, bindKey])

  React.useLayoutEffect(() => {
    if (!active) {
      undockConversationRoot()
      return undefined
    }

    let cancelled = false
    let ro = null
    let mo = null

    const update = () => {
      if (cancelled || !seatRef.current) return
      const root = findConversationRoot()
      if (!root) return
      const rect = seatRef.current.getBoundingClientRect()
      dockConversationRoot(root, rect)
    }

    const attach = () => {
      update()
      if (seatRef.current && typeof ResizeObserver === 'function') {
        ro = new ResizeObserver(update)
        ro.observe(seatRef.current)
      }
      window.addEventListener('scroll', update, true)
      window.addEventListener('resize', update)
    }

    if (findConversationRoot()) attach()
    else if (typeof MutationObserver === 'function') {
      mo = new MutationObserver(() => {
        if (findConversationRoot()) {
          mo.disconnect()
          mo = null
          attach()
        }
      })
      mo.observe(document.body, { childList: true, subtree: true })
    }

    return () => {
      cancelled = true
      if (ro) ro.disconnect()
      if (mo) mo.disconnect()
      window.removeEventListener('scroll', update, true)
      window.removeEventListener('resize', update)
      undockConversationRoot()
    }
  }, [active, bindKey])

  React.useEffect(() => {
    if (active) return undefined
    undockConversationRoot()
    if (sessionsSvc && nativeConversationState.savedSelection) {
      restoreSessionSelection(sessionsSvc, nativeConversationState.savedSelection)
      nativeConversationState.savedSelection = null
    }
    return undefined
  }, [active, sessionsSvc])

  if (!active) return null

  return h('div', {
    ref: seatRef,
    className: 'ps-native-conversation-seat',
    'data-native-conversation-seat': '',
  })
}
