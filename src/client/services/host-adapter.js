// Host adapter — the only module that knows about the dsh host environment:
// gated ctx service probing, host DOM hooks ([data-conversation-scroll],
// [class*="sidebarCol"]), and host <body> classes. Everything here is
// best-effort: the host may gate property access or lack services entirely.

let hostCtx = null

export function setHostContext(ctx) { hostCtx = ctx }

export function sf(ctx, name) {
  if (!ctx) return null
  try { if (ctx[name]) return ctx[name] } catch { /* gated property access */ }
  if (typeof ctx.get === 'function') {
    try { return ctx.get(name) } catch { return null }
  }
  return null
}

export function hostService(name) { return sf(hostCtx, name) }

export function findConversationRoot() {
  if (typeof document === 'undefined') return null
  const scroll = document.querySelector('[data-conversation-scroll]')
  if (!scroll || !scroll.parentElement) return null
  return scroll.parentElement
}

export function findSidebarCol() {
  if (typeof document === 'undefined') return null
  return document.querySelector('[class*="sidebarCol"]')
}

export function setHostBodyClass(name, on) {
  if (typeof document === 'undefined') return
  if (on) document.body.classList.add(name)
  else document.body.classList.remove(name)
}

export function pomasaDiag(phase) {
  const ws = sf(hostCtx, 'workspaces')
  const ses = sf(hostCtx, 'sessions')
  const ui = sf(hostCtx, 'uiWorkspace')
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
