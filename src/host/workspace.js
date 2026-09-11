import { ensurePomasaHome } from '../runtime/bootstrap.js'
import { loadRegistry } from './MAS-manager/registry.js'
import { pomasaHome } from './paths/index.js'

export function createWorkspaceService(ctx, config) {
  async function ensureWorkspace(cwd, title) {
    let wr
    try { wr = ctx.workspaceRegistry || ctx.get('workspaceRegistry') } catch { wr = null }
    if (!wr || typeof wr.resolveByPath !== 'function' || typeof wr.create !== 'function') return null
    try {
      let row = await wr.resolveByPath(cwd)
      if (!row) {
        const created = await wr.create(cwd)
        row = (created?.workspace ?? created) || row
      }
      let obj = null
      const id = row && (row.workspaceId ?? row.id)
      if (id != null && typeof wr.get === 'function') {
        try {
          const got = wr.get(id)
          obj = (got && typeof got.then === 'function' ? await got : got) || null
        } catch { obj = null }
      }
      const ws = obj || row
      if (title && ws) {
        if (typeof ws.setTitle === 'function') {
          try { await ws.setTitle(title) } catch { /* title is cosmetic */ }
        } else if (typeof wr.rename === 'function' && id != null) {
          try { await wr.rename(id, title) } catch { /* title is cosmetic */ }
        }
      }
      return ws || null
    } catch { return null }
  }

  async function ensurePomasaWorkspace(attempt = 0) {
    ensurePomasaHome(config)
    const ws = await ensureWorkspace(pomasaHome(config), 'POMASA')
    if (!ws) {
      if (attempt < 10) setTimeout(() => { ensurePomasaWorkspace(attempt + 1) }, 2000)
      return
    }
    const attach = typeof ws.attachSession === 'function'
      ? () => ws.attachSession
      : (typeof ws.insertSessionBefore === 'function' ? () => ws.insertSessionBefore : null)
    if (attach) {
      try {
        for (const m of loadRegistry(config).mas) {
          const ids = [m.lastGenSessionId, ...Object.values(m.lastRunSessionIds || {})].filter(Boolean)
          for (const sid of ids) {
            try { await attach()(sid) } catch { /* stale session id */ }
          }
        }
      } catch { /* reconciliation is best-effort */ }
    }
  }

  return { ensureWorkspace, ensurePomasaWorkspace }
}
