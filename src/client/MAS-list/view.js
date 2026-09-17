// MAS list view mode — cards vs list rows.
const masListViewStore = {
  mode: 'cards',
  subs: new Set(),
  emit() { for (const fn of this.subs) fn() },
  setMode(mode) {
    const next = mode === 'list' ? 'list' : 'cards'
    if (this.mode === next) return
    this.mode = next
    this.emit()
  },
  subscribe(fn) { this.subs.add(fn); return () => { this.subs.delete(fn) } },
}

export function setMasListViewMode(mode) {
  masListViewStore.setMode(mode)
}

export function useMasListViewMode() {
  if (typeof React.useSyncExternalStore === 'function') {
    return React.useSyncExternalStore(
      masListViewStore.subscribe.bind(masListViewStore),
      () => masListViewStore.mode,
    )
  }
  const [mode, setMode] = React.useState(masListViewStore.mode)
  React.useEffect(() => masListViewStore.subscribe(() => setMode(masListViewStore.mode)), [])
  return mode
}
