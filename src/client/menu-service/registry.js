// Menu registry — one openOn action per menu; items forward actions only.
import { actionBus } from '../actions/bus.js'
import { menuState } from './menu.js'

const menuOpenWired = new Set()

function wireMenuOpen(entry) {
  if (!entry || !entry.openOn || menuOpenWired.has(entry.openOn)) return
  menuOpenWired.add(entry.openOn)
  actionBus.on(entry.openOn, (payload) => menuState.show(entry, payload))
}

export const menuService = {
  menus: [],
  register(spec) {
    if (!spec || !spec.id || !spec.openOn) return () => {}
    const entry = {
      id: spec.id,
      openOn: spec.openOn,
      placement: spec.placement || 'anchor-end',
      items: spec.items || (() => []),
    }
    this.menus.push(entry)
    wireMenuOpen(entry)
    return () => {
      const i = this.menus.findIndex((m) => m.id === entry.id)
      if (i >= 0) this.menus.splice(i, 1)
    }
  },
  wireAll() {
    for (const menu of this.menus) wireMenuOpen(menu)
  },
  list() { return this.menus.slice() },
  findByOpenAction(action) {
    return this.menus.find((m) => m.openOn === action) || null
  },
}
