// Workspace bootstrap — ensures a dsh workspace exists for the POMASA home
// dir (~/.pomasa), retrying until the host services and meta endpoint answer.
export async function ensurePomasaWorkspaceClient(ctx, attempt = 0) {
  let svc
  try { svc = ctx.get('workspaces') } catch { svc = null }
  const retry = () => {
    if (attempt < 6) setTimeout(() => { ensurePomasaWorkspaceClient(ctx, attempt + 1) }, 2500)
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
