// Boot toolbar action registry — leaf module (no imports).
const registry = new Map()

export function registerToolbarAction(spec) {
  const { toolbarId, id, order = 0, render, label, description, icon, onClick } = spec || {}
  if (!toolbarId || !id) return
  if (!render && !onClick) return
  if (!registry.has(toolbarId)) registry.set(toolbarId, [])
  const list = registry.get(toolbarId)
  const entry = { id, order, render, label, description, icon, onClick }
  const i = list.findIndex((x) => x.id === id)
  if (i >= 0) list[i] = entry
  else list.push(entry)
  list.sort((a, b) => a.order - b.order)
}

export function toolbarActions(toolbarId) {
  return (registry.get(toolbarId) || []).slice()
}
