// Agent chat panel — docks DSH ConversationRoot (scrollBody + composer) into work.right.

function AgentChatPanel() {
  const loc = useLocators()
  const api = getServices()
  const workbenchOpen = useWorkbenchOpen()
  const expandOpen = useNodesExpandOpen()
  const [info, setInfo] = React.useState(null)
  const agentKey = loc.agentKey || 'orchestrator'
  const subCache = useSubagentClient()
  const cacheEntry = subCache[subagentClient.key(loc.masId, loc.unitKey, loc.taskKey, agentKey)]
  const orchEntry = subCache[subagentClient.key(loc.masId, loc.unitKey, loc.taskKey, 'orchestrator')]
  const orchAlive = !!(orchEntry && orchEntry.alive)

  const loadInfo = React.useCallback(async () => {
    if (!loc.masId || !agentKey) { setInfo(null); return }
    const r = await refreshSubagentInfo(api, loc.masId, loc.unitKey, loc.taskKey, agentKey)
    setInfo(r && r.ok ? r : null)
  }, [api, loc.masId, loc.unitKey, loc.taskKey, agentKey])

  React.useEffect(() => { loadInfo() }, [loadInfo])
  React.useEffect(() => actionBus.on('agent.chat.select', () => loadInfo()), [loadInfo])
  React.useEffect(() => actionBus.on('node.select', () => loadInfo()), [loadInfo])

  React.useEffect(() => {
    if (!cacheEntry || !cacheEntry.sessionId) return
    setInfo((prev) => {
      if (!prev || !prev.sessionId) return prev
      const live = !!cacheEntry.live
      const alive = !!cacheEntry.alive
      const registered = !!cacheEntry.registered
      if (prev.live === live && prev.alive === alive && prev.registered === registered) return prev
      return { ...prev, live, alive, registered }
    })
  }, [cacheEntry && cacheEntry.live, cacheEntry && cacheEntry.alive, cacheEntry && cacheEntry.registered, cacheEntry && cacheEntry.sessionId])

  const bind = buildNativeBind(info, agentKey, subCache, loc)
  const bindKey = bind
    ? (bind.address
      ? bind.address.parentSessionId + '|' + bind.address.childSessionId
      : bind.sessionId || '')
    : ''
  const active = !!(workbenchOpen && loc.masId && bind && !expandOpen)

  React.useEffect(() => {
    if (typeof document === 'undefined') return undefined
    const locked = orchAlive && workbenchOpen && bind && !expandOpen
    if (locked) document.body.classList.add('ps-native-composer-locked')
    else document.body.classList.remove('ps-native-composer-locked')
    return () => { document.body.classList.remove('ps-native-composer-locked') }
  }, [orchAlive, workbenchOpen, bindKey, expandOpen])

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

  if (!bind) {
    return h('div', { className: 'ps-native-conversation-placeholder' },
      h('div', { className: 'ps-chat-empty ps-muted' }, t('chat.need.run')),
    )
  }

  return h('div', { className: 'ps-native-conversation-host' },
    h(NativeConversationSeat, { active, bind }),
  )
}
