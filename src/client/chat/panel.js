// Agent chat panel — ConversationRoot-like layout in work.right grid cell.

function ChatMessageList(props) {
  const { messages } = props
  const list = messages || []
  if (!list.length) {
    return h('div', { className: 'ps-chat-empty' }, t('chat.empty'))
  }
  return h('div', { className: 'ps-chat-msgs' },
    list.map((m, i) => h('div', { key: i, className: 'ps-chat-msg ' + (m.role || 'assistant') + (m.partial ? ' partial' : '') },
      h('div', { className: 'ps-chat-role' }, m.role === 'user' ? t('chat.you') : t('chat.agent')),
      h('div', { className: 'ps-chat-text' }, str(m.text)),
    )),
  )
}

function AgentChatPanel(props) {
  const { sessionDriver } = props
  const loc = useLocators()
  const api = getServices()
  const [messages, setMessages] = React.useState([])
  const [info, setInfo] = React.useState(null)
  const [busy, setBusy] = React.useState(false)
  const [draft, setDraft] = React.useState('')
  const agentKey = loc.agentKey || 'orchestrator'
  const subCache = useSubagentClient()
  const cacheEntry = subCache[subagentClient.key(loc.masId, loc.unitKey, loc.taskKey, agentKey)]

  const loadInfo = React.useCallback(async () => {
    if (!loc.masId || !agentKey) { setInfo(null); return }
    const r = await refreshSubagentInfo(api, loc.masId, loc.unitKey, loc.taskKey, agentKey)
    setInfo(r && r.ok ? r : null)
  }, [api, loc.masId, loc.unitKey, loc.taskKey, agentKey])

  React.useEffect(() => { loadInfo() }, [loadInfo])
  React.useEffect(() => actionBus.on('agent.chat.select', () => loadInfo()), [loadInfo])
  React.useEffect(() => actionBus.on('node.select', () => loadInfo()), [loadInfo])

  // NodesContainer polls subagent.list every 3s — mirror live/alive into chat watch deps.
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

  React.useEffect(() => {
    if (!loc.masId || !agentKey) return undefined
    const t = setInterval(() => { loadInfo() }, 3000)
    return () => clearInterval(t)
  }, [loadInfo, loc.masId, agentKey])

  React.useEffect(() => {
    if (!info || !info.sessionId || !sessionDriver || typeof sessionDriver.watch !== 'function') {
      setMessages([])
      return undefined
    }
    let stop = false
    let off = () => {}
    Promise.resolve(sessionDriver.watch(info.sessionId, (msgs) => {
      if (!stop) setMessages(Array.isArray(msgs) ? msgs : [])
    }, {
      masId: loc.masId,
      unitKey: loc.unitKey,
      taskKey: loc.taskKey,
      agentKey,
      live: !!(info && info.live),
    })).then((unsub) => {
      if (stop && typeof unsub === 'function') unsub()
      else off = typeof unsub === 'function' ? unsub : () => {}
    })
    return () => { stop = true; off() }
  }, [info && info.sessionId, info && info.live, sessionDriver, loc.masId, loc.unitKey, loc.taskKey, agentKey])

  const canSend = !!(info && info.live && info.sessionId && sessionDriver && sessionDriver.followup)
  const submit = async () => {
    const text = String(draft || '').trim()
    if (!text || !canSend || busy) return
    setBusy(true)
    try {
      const r = await sessionDriver.followup(info.sessionId, text)
      if (r && r.ok) setDraft('')
    } finally { setBusy(false) }
  }

  const title = info && info.agent ? str(info.agent.title) : (agentKey === 'orchestrator' ? t('chat.orchestrator') : str(agentKey))

  return h(React.Fragment, null,
    h(ScrollFrame, { 'data-conversation-scroll': '' },
      h(ScrollBox, null,
        h('div', { className: 'ps-chat-head' },
          h('span', { className: 'ps-chat-title' }, title),
          info && info.alive ? h('span', { className: 'ps-badge running' }, t('node.alive')) : null,
        ),
        !info || !info.sessionId
          ? h('div', { className: 'ps-chat-empty ps-muted' }, t('chat.need.run'))
          : h(ChatMessageList, { messages }),
      ),
    ),
    h('div', { className: 'ps-chat-composer-seat', 'data-composer-seat': '' },
      h('div', { className: 'ps-chat-compose' },
        h('div', { className: 'ps-chat-compose-card' },
          h('textarea', {
            className: 'ps-chat-compose-input',
            rows: 3,
            value: draft,
            disabled: !canSend || busy,
            placeholder: canSend ? t('chat.placeholder') : t('chat.disabled'),
            onChange: (e) => setDraft(e.target.value),
            onKeyDown: (e) => {
              if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submit() }
            },
          }),
          h('div', { className: 'ps-chat-compose-actions' },
            h(PsButton, {
              id: 'send',
              disabled: !canSend || busy || !draft.trim(),
              onClick: submit,
            }),
          ),
        ),
      ),
    ),
  )
}
