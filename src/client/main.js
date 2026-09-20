// Client entry — bundled to lib/client.js by scripts/bundle-client.mjs.

import { createWorkbenchPanel, mountWorkbenchPanel } from './panel.js'
import { createSessionDriver } from './session-driver.js'
import { hostService, pomasaDiag, setHostContext } from './services/host-adapter.js'
import { CSS } from './styles.js'
import { setSessionsService, setWorkbenchPanel } from './util.js'
import { ensurePomasaWorkspaceClient } from './workspace-bootstrap.js'
export const inject = ['slots', 'workspaces', 'sessions']

function injectStyles() {
  if (typeof document === 'undefined') return
  const id = 'pomasa-studio-styles'
  if (document.getElementById(id)) return
  const el = document.createElement('style')
  el.id = id
  el.textContent = CSS
  document.head.appendChild(el)
}

export function apply(ctx) {
  const slots = ctx.get('slots')
  if (slots === undefined) return
  setHostContext(ctx)
  try { pomasaDiag('apply') } catch { /* ignore */ }
  injectStyles()

  const panel = createWorkbenchPanel()
  setWorkbenchPanel(panel)
  setSessionsService(hostService('sessions'))
  const driver = createSessionDriver(ctx)
  mountWorkbenchPanel(slots, panel, driver)
  ensurePomasaWorkspaceClient(ctx).catch(() => { /* best-effort */ })
}
