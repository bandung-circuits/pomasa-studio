// Client entry — bundled to lib/client.js by scripts/bundle-client.mjs.
export const inject = ['slots', 'workspaces', 'sessions']

function sf(ctx, name) {
  if (!ctx) return null
  try { if (ctx[name]) return ctx[name] } catch { /* gated property access */ }
  if (typeof ctx.get === 'function') {
    try { return ctx.get(name) } catch { return null }
  }
  return null
}

function pomasaDiag(ctx, phase) {
  const ws = sf(ctx, 'workspaces')
  const ses = sf(ctx, 'sessions')
  const ui = sf(ctx, 'uiWorkspace')
  const body = {
    phase,
    ws: !!ws, ses: !!ses, ui: !!ui,
    wsMethods: ws ? Object.keys(ws).slice(0, 40) : null,
    sesMethods: ses ? Object.keys(ses).slice(0, 40) : null,
    uiMethods: ui ? Object.keys(ui).slice(0, 40) : null,
    connectWs: !!(ws && typeof ws.connectWorkspace === 'function'),
    connectUi: !!(ui && typeof ui.connectWorkspace === 'function'),
    bind: !!(ses && typeof ses.binding === 'function'),
    href: typeof location !== 'undefined' ? location.href.slice(0, 80) : '',
  }
  try { fetch('/pomasa/diag', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) }).catch(() => {}) } catch { /* ignore */ }
  console.warn('[pomasa] diag', body)
}

export function apply(ctx) {
  const slots = ctx.get('slots')
  if (slots === undefined) return
  try { pomasaDiag(ctx, 'apply') } catch { /* ignore */ }

  if (typeof document !== 'undefined') {
    const id = 'pomasa-studio-styles'
    if (!document.getElementById(id)) {
      const el = document.createElement('style')
      el.id = id
      el.textContent = CSS
      document.head.appendChild(el)
    }
  }

  const panel = {
    open: false,
    subs: new Set(),
    emit() { for (const fn of this.subs) fn() },
    toggle() { this.open = !this.open; this.emit() },
    close() { if (this.open) { this.open = false; this.emit() } },
    subscribe(fn) { this.subs.add(fn); return () => { this.subs.delete(fn) } },
  }

  function usePanelOpen() {
    if (typeof React.useSyncExternalStore === 'function') {
      return React.useSyncExternalStore(panel.subscribe.bind(panel), () => panel.open)
    }
    const [v, setV] = React.useState(panel.open)
    React.useEffect(() => panel.subscribe(() => setV(panel.open)), [])
    return v
  }

  function WorkbenchPanel() {
    const open = usePanelOpen()
    useLang()
    const [sb, setSb] = React.useState(280)
    React.useEffect(() => {
      if (!open) return
      const el = document.querySelector('[class*="sidebarCol"]')
      if (!el) return
      const measure = () => {
        const w = Math.round(el.getBoundingClientRect().width)
        if (w > 0) setSb(w)
      }
      measure()
      if (typeof ResizeObserver === 'function') {
        const ro = new ResizeObserver(measure)
        ro.observe(el)
        return () => ro.disconnect()
      }
      return undefined
    }, [open])
    return h('div', { className: 'ps-shell-root', style: open ? undefined : { display: 'none' } },
      h('div', { className: 'ps-shell-nav', style: { flexBasis: sb + 'px' } }),
      h('div', { className: 'ps-shell-panel' },
        h(StudioRoot, {
          sessionId: '',
          key: 'shell',
          onRun: (masId, unitKey, taskKey, prompt, agentKey) => driveSession('run', masId, unitKey, taskKey, prompt, agentKey),
          onFollowupExisting: (sessionId, prompt) => followupSession(sessionId, prompt),
          onCancelRun: (masId) => cancelRunSession(masId),
          onGeneration: (masId, prompt) => driveSession('gen', masId, 'default', null, prompt, 'orchestrator'),
          sessionDriver,
        }),
      ),
    )
  }

  async function ensurePomasaWorkspaceClient(attempt = 0) {
    let svc
    try { svc = ctx.get('workspaces') } catch { svc = null }
    const retry = () => {
      if (attempt < 6) setTimeout(() => { ensurePomasaWorkspaceClient(attempt + 1) }, 2500)
    }
    if (!svc || typeof svc.create !== 'function') return retry()
    let meta = null
    try { meta = await (await fetch('/pomasa/meta')).json() } catch { return retry() }
    if (!meta || !meta.ok || !meta.home) return retry()
    const readItems = () => {
      try {
        const snap = svc.list && typeof svc.list.getSnapshot === 'function' ? svc.list.getSnapshot() : null
        return snap && Array.isArray(snap.items) ? snap.items : []
      } catch { return [] }
    }
    const findWs = (items) =>
      items.find((w) => (w && String(w.path || w.cwd || '') === meta.home))
      || items.find((w) => (w && (w.title || '') === 'POMASA'))
      || items.find((w) => (w && String(w.path || w.cwd || '').split('/').pop() === '.pomasa')) || null
    let ws = findWs(readItems())
    try {
      if (!ws) {
        const created = await svc.create({ path: meta.home })
        ws = (created && created.workspaceId) ? created : findWs(readItems())
      }
      if (ws && (ws.title || '') !== 'POMASA' && typeof svc.rename === 'function') {
        try {
          const rn = await svc.rename(ws.workspaceId ?? ws.id, 'POMASA')
          ws = rn?.workspace ?? rn ?? ws
        } catch { /* cosmetic */ }
      }
    } catch { return retry() }
    if (!ws) retry()
  }

  const lastRunSession = new Map()

  async function cancelRunSession(masId) {
    const sid = lastRunSession.get(masId)
    if (!sid) return { ok: true }
    try {
      const sessionsSvc = ctx.get('sessions')
      const bound = sessionsSvc && typeof sessionsSvc.binding === 'function' ? sessionsSvc.binding(sid) : null
      if (bound && bound.session && typeof bound.session.cancel === 'function') {
        await bound.session.cancel()
      }
    } catch { /* best-effort */ }
    return { ok: true }
  }

  async function driveSession(kind, masId, unitKey, taskKey, prompt, agentKey) {
    const workspacesSvc = sf(ctx, 'workspaces')
    const sessionsSvc = sf(ctx, 'sessions')
    const uiWs = sf(ctx, 'uiWorkspace')
    const connectSession = (uiWs && typeof uiWs.connectWorkspace === 'function')
      ? uiWs.connectWorkspace.bind(uiWs)
      : (workspacesSvc && typeof workspacesSvc.connectWorkspace === 'function')
        ? workspacesSvc.connectWorkspace.bind(workspacesSvc)
        : null
    const canCreate = !!(sessionsSvc && typeof sessionsSvc.create === 'function')
    if (!workspacesSvc || !sessionsSvc || typeof sessionsSvc.binding !== 'function' || (!connectSession && !canCreate)) {
      const diag = { ws: !!workspacesSvc, ses: !!sessionsSvc && typeof sessionsSvc.binding === 'function', uiws: !!uiWs, conn: !!connectSession, create: canCreate }
      console.warn('[pomasa] session services unavailable', diag)
      try { pomasaDiag(ctx, 'drive:fail') } catch { /* ignore */ }
      return { ok: false, error: `${t('err.ws.svc')} [ws:${diag.ws},ses:${diag.ses},uiws:${diag.uiws},conn:${diag.conn},create:${diag.create}]` }
    }
    let meta = null
    try { meta = await (await fetch('/pomasa/meta')).json() } catch { /* ignore */ }
    const home = meta && meta.ok ? meta.home : null
    const readItems = () => {
      try {
        const snap = workspacesSvc.list && typeof workspacesSvc.list.getSnapshot === 'function' ? workspacesSvc.list.getSnapshot() : null
        return snap && Array.isArray(snap.items) ? snap.items : []
      } catch { return [] }
    }
    let ws = null
    if (home) ws = readItems().find((w) => (w && String(w.path || w.cwd || '') === home)) || null
    if (!ws) ws = readItems().find((w) => (w && (w.title || '') === 'POMASA')) || null
    if (!ws && typeof workspacesSvc.create === 'function' && home) {
      try {
        const created = await workspacesSvc.create({ path: home })
        ws = (created && created.workspaceId) ? created : null
      } catch { /* ignore */ }
    }
    if (!ws) return { ok: false, error: t('err.ws.home') }
    let sessionId
    try {
      const wid = ws.workspaceId ?? ws.id
      const created = connectSession ? await connectSession(wid) : await sessionsSvc.create({ workspaceId: wid })
      sessionId = created && typeof created === 'object' && created.id ? created.id : created
    }
    catch (e) { return { ok: false, error: t('err.ws.create', { m: String(e && e.message || e) }) } }
    try {
      const bound = typeof sessionsSvc.binding === 'function' ? sessionsSvc.binding(sessionId) : null
      const sess = bound && bound.session
      if (sess && typeof sess.prompt === 'function') {
        await sess.prompt([{ type: 'text', text: String(prompt || '') }], 'queue')
      } else {
        return { ok: false, error: t('err.ws.no.prompt') }
      }
    } catch (e) { return { ok: false, error: t('err.ws.start', { m: String(e && e.message || e) }) } }
    try {
      await fetch('/pomasa/record', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          masId,
          kind,
          unit: unitKey || 'default',
          task: taskKey || 'legacy',
          sessionId,
          agentKey: agentKey || (kind === 'gen' ? 'orchestrator' : 'orchestrator'),
        }),
      })
    } catch { /* best-effort */ }
    if (kind === 'run') lastRunSession.set(masId, sessionId)
    try { pomasaDiag(ctx, 'drive:ok') } catch { /* ignore */ }
    return { ok: true, sessionId }
  }

  async function followupSession(sessionId, text) {
    const sessionsSvc = sf(ctx, 'sessions')
    if (!sessionsSvc || typeof sessionsSvc.binding !== 'function') {
      return { ok: false, error: t('err.ws.svc') }
    }
    try {
      const bound = sessionsSvc.binding(sessionId)
      const sess = bound && bound.session
      if (sess && typeof sess.prompt === 'function') {
        await sess.prompt([{ type: 'text', text: String(text || '') }], 'queue')
        return { ok: true, sessionId }
      }
      return { ok: false, error: t('err.ws.no.prompt') }
    } catch (e) {
      return { ok: false, error: String(e && e.message || e) }
    }
  }

  async function openSessionForWatch(sessionsSvc, sessionId) {
    if (typeof sessionsSvc.open === 'function') {
      try { sessionsSvc.open(sessionId) } catch { /* ignore */ }
    }
    let bound = typeof sessionsSvc.binding === 'function' ? sessionsSvc.binding(sessionId) : null
    if ((!bound || !bound.session) && typeof sessionsSvc.subagentAddress === 'function') {
      const addr = sessionsSvc.subagentAddress(sessionId)
      if (addr && typeof sessionsSvc.openSubagent === 'function') {
        try { sessionsSvc.openSubagent(addr) } catch { /* ignore */ }
      }
    }
  }

  async function watchSession(sessionId, onUpdate, opts) {
    if (!sessionId || typeof onUpdate !== 'function') return () => {}
    const sessionsSvc = sf(ctx, 'sessions')
    let persisted = []
    let stopped = false
    let liveUnsub = () => {}

    async function pullPersisted() {
      if (!opts || !opts.masId || !opts.agentKey) return
      try {
        const r = await fetch('/pomasa/agent.log' + '?' + [
          'masId=' + encodeURIComponent(opts.masId),
          'unit=' + encodeURIComponent(opts.unitKey || 'default'),
          'task=' + encodeURIComponent(opts.taskKey || ''),
          'agentKey=' + encodeURIComponent(opts.agentKey),
        ].join('&'))
        const log = r.ok ? await r.json() : null
        if (log && log.ok && Array.isArray(log.events)) {
          persisted = eventsToChatMessages(log.events)
        }
      } catch { /* persistence is best-effort */ }
    }

    function emitMerged() {
      if (stopped) return
      let live = []
      if (sessionsSvc && typeof sessionsSvc.binding === 'function') {
        const face = sessionsSvc.binding(sessionId)?.session
        if (face && typeof face.getSnapshot === 'function') {
          try { live = snapshotToChatMessages(face.getSnapshot()) } catch { live = [] }
        }
      }
      onUpdate(mergeChatMessages(persisted, live))
    }

    await pullPersisted()
    emitMerged()

    const pollId = setInterval(() => {
      pullPersisted().then(emitMerged).catch(() => {})
    }, 2500)

    const liveRequested = !!(opts && opts.live)
    if (liveRequested && sessionsSvc) {
      await openSessionForWatch(sessionsSvc, sessionId)
      const face = sessionsSvc.binding?.(sessionId)?.session
      if (face && typeof face.subscribe === 'function' && typeof face.getSnapshot === 'function') {
        liveUnsub = face.subscribe(emitMerged)
        emitMerged()
      }
    }

    return () => {
      stopped = true
      clearInterval(pollId)
      liveUnsub()
    }
  }

  async function readSessionMessages(sessionId) {
    const sessionsSvc = sf(ctx, 'sessions')
    if (!sessionsSvc || typeof sessionsSvc.binding !== 'function') return []
    try {
      if (typeof sessionsSvc.open === 'function') await sessionsSvc.open(sessionId)
      const bound = sessionsSvc.binding(sessionId)
      const face = bound && bound.session
      if (face && typeof face.getSnapshot === 'function') {
        return snapshotToChatMessages(face.getSnapshot())
      }
    } catch { /* ignore */ }
    return []
  }

  const sessionDriver = {
    followup: followupSession,
    readMessages: readSessionMessages,
    watch: watchSession,
  }
  setSessionDriver(sessionDriver)

  function applySlots(slots, h2) {
    registerStartupButton(slots, panel, h2)

    slots.inject('shell.overlay', () => slots.register(
      { name: 'shell.overlay', id: 'pomasa-studio', order: 10, label: t('studio.title') },
      () => h2(WorkbenchPanel, null),
    ))
  }

  applySlots(slots, h)
  ensurePomasaWorkspaceClient().catch(() => { /* best-effort */ })
}
