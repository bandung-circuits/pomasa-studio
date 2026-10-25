// Workbench panel — shell.overlay slot host: panel open state, the sidebar-
// aligned shell root, and slot mounting (dock entry + overlay).
import { t, useLang, langStore } from './i18n.js'
import { findSidebarCol } from './services/host-adapter.js'
import { StudioRoot } from './workbench/app.js'

export function createWorkbenchPanel() {
  return {
    open: false,
    subs: new Set(),
    emit() { for (const fn of this.subs) fn() },
    toggle() { this.open = !this.open; this.emit() },
    close() { if (this.open) { this.open = false; this.emit() } },
    subscribe(fn) { this.subs.add(fn); return () => { this.subs.delete(fn) } },
  }
}

function usePanelOpen(panel) {
  if (typeof React.useSyncExternalStore === 'function') {
    return React.useSyncExternalStore(panel.subscribe.bind(panel), () => panel.open)
  }
  const [v, setV] = React.useState(panel.open)
  React.useEffect(() => panel.subscribe(() => setV(panel.open)), [panel])
  return v
}

export function WorkbenchPanel(props) {
  const { panel, driver } = props
  const open = usePanelOpen(panel)
  useLang()
  const [sb, setSb] = React.useState(280)
  React.useEffect(() => {
    if (!open) return
    const el = findSidebarCol()
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
        onRun: (masId, unitKey, taskKey, prompt, agentKey) => driver.drive('run', masId, unitKey, taskKey, prompt, agentKey),
        onFollowupExisting: (sessionId, prompt) => driver.followup(sessionId, prompt),
        onCancelRun: (masId) => driver.cancelRun(masId),
        onCancelGeneration: (masId) => driver.cancelGen(masId),
        onGeneration: (masId, prompt) => driver.drive('gen', masId, 'default', null, prompt, 'orchestrator'),
      }),
    ),
  )
}

export function mountWorkbenchPanel(slots, panel, driver) {
  // 入坞：dsh-app-dock 是 pomasa-studio 的依赖，入口交给坞（含 ready 延迟注册），
  // 自占 footer 槽移除（撤销 PR #3 的 footer 启动按钮方案）。容忍加载顺序：
  // 注册表已就位即注册；否则等 dsh-app-dock:ready 事件（once）。
  const registerWithDock = () => {
    if (typeof window === 'undefined' || !window.__dshAppDock__) return
    window.__dshAppDock__.register({ id: 'pomasa-studio', label: 'POMASA', icon: '◫', order: 40, onToggle: () => panel.toggle() })
    if (window.__dshAppDock__.lang) {
      window.__dshAppDock__.lang.subscribe(() => {
        const v = window.__dshAppDock__.lang.get()
        if (langStore.val !== v) { langStore.val = v; langStore.emit() }
      })
    }
  }
  if (typeof window !== 'undefined' && !window.__dshAppDock__) {
    window.addEventListener('dsh-app-dock:ready', registerWithDock, { once: true })
  }
  registerWithDock()

  slots.inject('shell.overlay', () => slots.register(
    { name: 'shell.overlay', id: 'pomasa-studio', order: 10, label: t('studio.title') },
    () => h(WorkbenchPanel, { panel, driver }),
  ))
}
