// Design mode — composer textarea helpers (stable [data-composer-seat] anchor).

function findComposerTextarea() {
  if (typeof document === 'undefined') return null
  const seat = document.querySelector('[data-composer-seat]')
  if (!seat) return null
  return seat.querySelector('textarea')
}

export function insertAgentIdToComposer(agentKey) {
  const ta = findComposerTextarea()
  if (!ta) return false
  const id = String(agentKey || '')
  if (!id) return false
  ta.value = id
  ta.dispatchEvent(new Event('input', { bubbles: true }))
  ta.focus()
  return true
}

function designFocusPrefix(focusAgent) {
  if (!focusAgent || !focusAgent.agentKey) return ''
  const parts = [`agentKey=${focusAgent.agentKey}`]
  if (focusAgent.title) parts.push(`title=${focusAgent.title}`)
  if (focusAgent.agentPath) parts.push(`path=${focusAgent.agentPath}`)
  return `[design-focus: ${parts.join(' ')}]\n`
}

function prependDesignFocusToComposer(focusAgent) {
  const ta = findComposerTextarea()
  if (!ta || !focusAgent || !focusAgent.agentKey) return
  const prefix = designFocusPrefix(focusAgent)
  if (!prefix || ta.value.startsWith(prefix)) return
  const body = ta.value.replace(/^\[design-focus:[^\]]*\]\n?/, '')
  ta.value = prefix + body
  ta.dispatchEvent(new Event('input', { bubbles: true }))
}

export function installDesignComposerHook(getFocusAgent) {
  if (typeof document === 'undefined') return () => {}
  const onKeyDown = (e) => {
    if (e.key !== 'Enter' || e.shiftKey || e.isComposing) return
    const focus = typeof getFocusAgent === 'function' ? getFocusAgent() : null
    if (!focus || !focus.agentKey) return
    prependDesignFocusToComposer(focus)
  }
  const onSubmit = (e) => {
    const focus = typeof getFocusAgent === 'function' ? getFocusAgent() : null
    if (!focus || !focus.agentKey) return
    prependDesignFocusToComposer(focus)
  }
  document.addEventListener('keydown', onKeyDown, true)
  document.addEventListener('submit', onSubmit, true)
  return () => {
    document.removeEventListener('keydown', onKeyDown, true)
    document.removeEventListener('submit', onSubmit, true)
  }
}
