// Part title action registry — leaf module (no imports) so the registry is
// created before any importer's module-scope code runs, regardless of bundle
// module order. Callers register at module scope; slots.js reads at render.
const registry = new Map()

export function registerTitleAction(spec) {
  const { partId, id, order = 0, render } = spec || {}
  if (!partId || !id || !render) return
  if (!registry.has(partId)) registry.set(partId, [])
  const list = registry.get(partId)
  const entry = { id, order, render }
  const i = list.findIndex((x) => x.id === id)
  if (i >= 0) list[i] = entry
  else list.push(entry)
  list.sort((a, b) => a.order - b.order)
}

export function partTitleActions(partId) {
  return (registry.get(partId) || []).slice()
}
