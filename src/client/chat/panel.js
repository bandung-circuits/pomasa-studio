// Agent chat panel — docks DSH ConversationRoot (scrollBody + composer) into work.right.

function AgentChatPanel() {
  const loc = useLocators()
  const api = getServices()
  const workbenchOpen = useWorkbenchOpen()
  const expandOpen = useNodesExpandOpen()
  const studioMode = useStudioMode()
  const designSession = useDesignSession()
  const [info, setInfo] = React.useState(null)
  const [chatAgentKey, setChatAgentKey] = React.useState(null)
  const isDesign = studioMode === 'design'
  const agentKey = isDesign ? null : (chatAgentKey || loc.agentKey || 'orchestrator')
  const subCache = useSubagentClient()
  const cacheEntry = !isDesign && agentKey
    ? subCache[subagentClient.key(loc.masId, loc.unitKey, loc.taskKey, agentKey)]
    : null
  const orchEntry = subCache[subagentClient.key(loc.masId, loc.unitKey, loc.taskKey, 'orchestrator')]
  const orchAlive = !!(orchEntry && orchEntry.alive)

  const loadInfo = React.useCallback(async (keyOverride) => {
    const key = keyOverride != null ? keyOverride : agentKey
    if (isDesign || !loc.masId || !key) { setInfo(null); return }
    const r = await refreshSubagentInfo(api, loc.masId, loc.unitKey, loc.taskKey, key)
    setInfo(r && r.ok ? r : null)
  }, [api, loc.masId, loc.unitKey, loc.taskKey, agentKey, isDesign])

  React.useEffect(() => { if (!isDesign) loadInfo() }, [loadInfo, isDesign])
  React.useEffect(() => actionBus.on('agent.chat.select', (payload) => {
    if (isStudioDesignMode()) {
      if (payload && payload.agentKey) {
        studioModeRef.setFocusAgent({
          agentKey: payload.agentKey,
          agentPath: payload.agentPath,
          title: payload.title,
        })
        insertAgentIdToComposer(payload.agentKey)
      }
      return
    }
    if (payload && payload.agentKey) {
      setChatAgentKey(payload.agentKey)
      loadInfo(payload.agentKey)
    }
  }), [loadInfo])
  React.useEffect(() => actionBus.on('execute.mode.on', () => {
    setChatAgentKey('orchestrator')
    loadInfo('orchestrator')
  }), [loadInfo])
  React.useEffect(() => actionBus.on('design.mode.on', () => {
    setInfo(null)
    setChatAgentKey(null)
  }), [])

  React.useEffect(() => {
    if (isDesign || !cacheEntry || !cacheEntry.sessionId) return
    setInfo((prev) => {
      if (!prev || !prev.sessionId) return prev
      const live = !!cacheEntry.live
      const alive = !!cacheEntry.alive
      const registered = !!cacheEntry.registered
      if (prev.live === live && prev.alive === alive && prev.registered === registered) return prev
      return { ...prev, live, alive, registered }
    })
  }, [isDesign, cacheEntry && cacheEntry.live, cacheEntry && cacheEntry.alive, cacheEntry && cacheEntry.registered, cacheEntry && cacheEntry.sessionId])

  const executeBind = !isDesign ? buildNativeBind(info, agentKey, subCache, loc) : null
  const designBind = isDesign && designSession.sessionId ? { sessionId: designSession.sessionId } : null
  const bind = designBind || executeBind
  const bindKey = bind
    ? (bind.address
      ? bind.address.parentSessionId + '|' + bind.address.childSessionId
      : bind.sessionId || '')
    : ''
  const active = !!(workbenchOpen && loc.masId && bind && !expandOpen)

  React.useEffect(() => {
    if (typeof document === 'undefined') return undefined
    const locked = !isDesign && orchAlive && workbenchOpen && bind && !expandOpen
    if (locked) document.body.classList.add('ps-native-composer-locked')
    else document.body.classList.remove('ps-native-composer-locked')
    return () => { document.body.classList.remove('ps-native-composer-locked') }
  }, [isDesign, orchAlive, workbenchOpen, bindKey, expandOpen])

  React.useEffect(() => {
    if (!isDesign || !active) return undefined
    return installDesignComposerHook(() => getDesignSessionSnapshot().focusAgent)
  }, [isDesign, active, bindKey, designSession.focusAgent])

  React.useEffect(() => {
    if (workbenchOpen && bind && !expandOpen) return undefined
    undockConversationRoot()
    const sessionsSvc = getSessionsService()
    if (sessionsSvc && nativeConversationState.savedSelection) {
      restoreSessionSelection(sessionsSvc, nativeConversationState.savedSelection)
      nativeConversationState.savedSelection = null
    }
    return undefined
  }, [workbenchOpen, bindKey, expandOpen])

  if (!workbenchOpen || !loc.masId) {
    return h('div', { className: 'ps-chat-empty ps-muted' }, t('chat.need.run'))
  }

  if (isDesign && !designSession.sessionId) {
    return h('div', { className: 'ps-native-conversation-placeholder' },
      h('div', { className: 'ps-chat-empty ps-muted' }, t('mode.design.chat.need')),
    )
  }

  if (!isDesign && !bind) {
    return h('div', { className: 'ps-native-conversation-placeholder' },
      h('div', { className: 'ps-chat-empty ps-muted' }, t('chat.need.run')),
    )
  }

  return h('div', { className: 'ps-native-conversation-host' },
    h(NativeConversationSeat, { active, bind }),
  )
}
