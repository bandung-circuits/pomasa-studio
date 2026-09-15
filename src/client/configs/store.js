// User-facing config state (language bridges to langStore in i18n.js).
import { langStore } from '../i18n.js'

export const configStore = {
  subs: new Set(),
  emit() { for (const fn of this.subs) fn() },
  getLang() { return langStore.val },
  setLang(v) { langStore.set(v); this.emit() },
  subscribe(fn) { this.subs.add(fn); return () => { this.subs.delete(fn) } },
}

export function configSubscribe(fn) { return configStore.subscribe(fn) }
function configGetLang() { return configStore.getLang() }

export function useConfigLang() {
  if (typeof React.useSyncExternalStore === 'function') {
    return React.useSyncExternalStore(configSubscribe, configGetLang)
  }
  const [v, setV] = React.useState(configStore.getLang())
  React.useEffect(() => configStore.subscribe(() => setV(configStore.getLang())), [])
  return v
}
