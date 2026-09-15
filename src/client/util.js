// Shared client helpers (no imports — bundled by scripts/bundle-client.mjs).

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

function str(v) {
  if (v === null || v === undefined) return ''
  if (typeof v === 'string') return v
  if (typeof v === 'number') return String(v)
  try { return JSON.stringify(v) } catch { return String(v) }
}

function stageColor(status) {
  return {
    waiting: 'transparent',
    active: 'var(--dsw-alias-brand-primary)',
    completed: 'var(--dsw-alias-state-success-primary)',
    failed: 'var(--dsw-alias-state-error-primary)',
    skipped: 'transparent',
    aborted: 'var(--dsw-alias-state-warn-primary)',
  }[stateColorSafe(status)] || 'transparent'
}

function stateColorSafe(status) {
  return typeof status === 'string' ? status : 'waiting'
}

function stageCountText(s) {
  const st = s && STAGE_STATUS_TEXT[s.status] ? STAGE_STATUS_TEXT[s.status]() : null
  return st ? t('stage.count.text', { n: str(s.artifactCount), st }) : t('stage.count.plain', { n: str(s.artifactCount) })
}

function resolveArtifactPath(contract, entry) {
  const seg = str((entry && (entry.file || entry.path)) || '')
  if (!contract || !contract.indexPath || !seg) return seg
  const dir = String(contract.indexPath).split('/').slice(0, -1).join('/')
  if (!dir) return seg
  return seg.startsWith(dir + '/') ? seg : dir + '/' + seg
}

function fmtSize(n) {
  if (!n) return ''
  if (n > 1024 * 1024) return (n / 1024 / 1024).toFixed(1) + ' MB'
  if (n > 1024) return Math.round(n / 1024) + ' KB'
  return n + ' B'
}

function prettyJson(content) {
  try { return JSON.stringify(JSON.parse(content), null, 2) } catch (e) { return content }
}

const sessionDriverRef = { current: null }
function setSessionDriver(d) { sessionDriverRef.current = d }
function getSessionDriver() { return sessionDriverRef.current }

const sessionsServiceRef = { current: null }
function setSessionsService(s) { sessionsServiceRef.current = s }
function getSessionsService() { return sessionsServiceRef.current }

const workbenchPanelRef = { current: null }
function setWorkbenchPanel(p) { workbenchPanelRef.current = p }

function closeWorkbenchPanel() {
  const panel = workbenchPanelRef.current
  if (panel && typeof panel.close === 'function') panel.close()
}

function useWorkbenchOpen() {
  const panel = workbenchPanelRef.current
  if (!panel) return false
  if (typeof React.useSyncExternalStore === 'function') {
    return React.useSyncExternalStore(panel.subscribe.bind(panel), () => panel.open)
  }
  const [v, setV] = React.useState(panel.open)
  React.useEffect(() => panel.subscribe(() => setV(panel.open)), [panel])
  return v
}

const nodesExpandRef = {
  open: false,
  subs: new Set(),
  emit() { for (const fn of this.subs) fn() },
  subscribe(fn) { this.subs.add(fn); return () => { this.subs.delete(fn) } },
  setOpen(v) { this.open = !!v; this.emit() },
}

function setNodesExpandOpen(v) { nodesExpandRef.setOpen(v) }

function useNodesExpandOpen() {
  if (typeof React.useSyncExternalStore === 'function') {
    return React.useSyncExternalStore(nodesExpandRef.subscribe.bind(nodesExpandRef), () => nodesExpandRef.open)
  }
  const [v, setV] = React.useState(nodesExpandRef.open)
  React.useEffect(() => nodesExpandRef.subscribe(() => setV(nodesExpandRef.open)), [])
  return v
}

function normalizeChatMessages(rows) {
  const out = []
  for (const m of rows || []) {
    const role = m.role || (m.type === 'user' ? 'user' : 'assistant')
    let text = ''
    if (typeof m.content === 'string') text = m.content
    else if (Array.isArray(m.content)) text = m.content.map((c) => c.text || c.content || '').join('')
    else text = str(m.text || m.content || '')
    if (text) out.push({ role, text, partial: !!m.partial })
  }
  return out
}

function snapshotToChatMessages(snap) {
  if (!snap) return []
  const out = []
  for (const n of snap.nodes || []) {
    if (n.kind === 'user') {
      const text = (n.content || []).filter((b) => b && b.type === 'text').map((b) => b.text || '').join('')
      if (text) out.push({ role: 'user', text })
    } else if (n.kind === 'assistant') {
      const text = (n.blocks || []).filter((b) => b && b.kind === 'text').map((b) => b.text || '').join('')
      if (text) out.push({ role: 'assistant', text })
    }
  }
  if (snap.partial && snap.partial.text) {
    out.push({ role: 'assistant', text: snap.partial.text, partial: true })
  }
  return out
}

function eventContentToText(content) {
  if (typeof content === 'string') return content
  if (!Array.isArray(content)) return ''
  return content.filter((b) => b && b.type === 'text').map((b) => b.text || '').join('')
}

/** Extract chat rows from persisted session events (user/message, assistant/message). */
function eventsToChatMessages(events) {
  const out = []
  for (const ev of events || []) {
    if (!ev || !ev.type) continue
    if (ev.type === 'user/message' && ev.data) {
      const text = eventContentToText(ev.data.content)
      if (text) out.push({ role: 'user', text })
    } else if (ev.type === 'assistant/message' && ev.data) {
      const msg = ev.data.message || ev.data
      const text = eventContentToText(msg && msg.content)
      if (text) out.push({ role: 'assistant', text })
    }
  }
  return out
}

function mergeChatMessages(persisted, live) {
  if (!live || !live.length) return persisted || []
  if (!persisted || !persisted.length) return live
  if (live.length >= persisted.length) return live
  return persisted
}

/** One-line latest assistant text from persisted session events. */
function latestAssistantLine(events) {
  const msgs = eventsToChatMessages(events)
  for (let i = msgs.length - 1; i >= 0; i--) {
    const m = msgs[i]
    if (m.role === 'assistant' && m.text) return String(m.text).replace(/\s+/g, ' ').trim()
  }
  for (let i = msgs.length - 1; i >= 0; i--) {
    if (msgs[i].text) return String(msgs[i].text).replace(/\s+/g, ' ').trim()
  }
  return ''
}
