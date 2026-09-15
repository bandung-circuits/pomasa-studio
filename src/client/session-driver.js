// Session driver — creates/cancels dsh sessions bound to the POMASA workspace
// and records them back to the host. Owns the last-run/last-gen session maps.
import { t } from './i18n.js'
import { pomasaDiag, sf } from './services/host-adapter.js'

export function createSessionDriver(ctx) {
  const lastRunSession = new Map()
  const lastGenSession = new Map()

  async function cancelBoundSession(sid) {
    if (!sid) return
    try {
      const sessionsSvc = ctx.get('sessions')
      const bound = sessionsSvc && typeof sessionsSvc.binding === 'function' ? sessionsSvc.binding(sid) : null
      if (bound && bound.session && typeof bound.session.cancel === 'function') {
        await bound.session.cancel()
      }
    } catch { /* best-effort */ }
  }

  async function cancelRunSession(masId) {
    await cancelBoundSession(lastRunSession.get(masId))
    return { ok: true }
  }

  async function cancelGenSession(masId) {
    await cancelBoundSession(lastGenSession.get(masId))
    lastGenSession.delete(masId)
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
      try { pomasaDiag('drive:fail') } catch { /* ignore */ }
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
          agentKey: agentKey || 'orchestrator',
        }),
      })
    } catch { /* best-effort */ }
    if (kind === 'run') lastRunSession.set(masId, sessionId)
    if (kind === 'gen') lastGenSession.set(masId, sessionId)
    try { pomasaDiag('drive:ok') } catch { /* ignore */ }
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

  return {
    drive: driveSession,
    followup: followupSession,
    cancelRun: cancelRunSession,
    cancelGen: cancelGenSession,
  }
}
