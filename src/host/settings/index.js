/** Host-side settings placeholder — client language still uses localStorage. */
export function loadSettings(_config = {}) {
  return { version: 1, language: null }
}

export function saveSettings(_config, _patch) {
  return loadSettings(_config)
}
