// Modal dialogue queue (confirm / prompt / progress).
import { psBtn } from '../buttons/button.js'
import { psHierarchyBackdropProps, psOverlayRoot, snapshotHierarchyBase } from '../hierachy/stack.js'
import { t } from '../i18n.js'
import { getServices } from '../services/index.js'
import { latestAssistantLine, str } from '../util.js'

const dialogueQueue = {
  items: [],
  subs: new Set(),
  emit() { for (const fn of this.subs) fn() },
  subscribe(fn) { this.subs.add(fn); return () => { this.subs.delete(fn) } },
  push(item) { this.items.push(item); this.emit() },
  shift() { const x = this.items.shift(); this.emit(); return x },
  peek() { return this.items[0] || null },
}

const progressDialogOpen = new Map()

function dialogueSubscribe(fn) { return dialogueQueue.subscribe(fn) }
function dialoguePeek() { return dialogueQueue.peek() }

export function deleteDialog(opts) {
  return new Promise((resolve) => {
    dialogueQueue.push({
      kind: 'delete',
      title: opts.title || '',
      body: opts.body || '',
      softLabel: opts.softLabel || t('dialog.delete.soft'),
      hardLabel: opts.hardLabel || t('dialog.delete.hard'),
      cancelLabel: opts.cancelLabel || t('dialog.cancel'),
      hierarchyBase: snapshotHierarchyBase(),
      resolve,
    })
  })
}

export function confirmDialog(opts) {
  return new Promise((resolve) => {
    dialogueQueue.push({
      kind: 'confirm',
      title: opts.title || '',
      body: opts.body || '',
      okLabel: opts.okLabel || t('dialog.ok'),
      cancelLabel: opts.cancelLabel || t('dialog.cancel'),
      danger: !!opts.danger,
      hierarchyBase: snapshotHierarchyBase(),
      resolve,
    })
  })
}

export function promptDialog(opts) {
  return new Promise((resolve) => {
    dialogueQueue.push({
      kind: 'prompt',
      title: opts.title || '',
      placeholder: opts.placeholder || '',
      initial: opts.initial || '',
      okLabel: opts.okLabel || t('dialog.ok'),
      cancelLabel: opts.cancelLabel || t('dialog.cancel'),
      hierarchyBase: snapshotHierarchyBase(),
      resolve,
    })
  })
}

export function progressDialog(opts) {
  const masId = opts && opts.masId ? String(opts.masId) : ''
  if (masId && progressDialogOpen.has(masId)) return progressDialogOpen.get(masId)
  const promise = new Promise((resolve) => {
    dialogueQueue.push({
      kind: 'progress',
      masId,
      title: (opts && opts.title) || t('gen.progress.title'),
      onCancel: opts && opts.onCancel ? opts.onCancel : null,
      hierarchyBase: snapshotHierarchyBase(),
      resolve,
    })
  })
  if (masId) {
    progressDialogOpen.set(masId, promise)
    promise.finally(() => { progressDialogOpen.delete(masId) })
  }
  return promise
}

function useDialoguePeek() {
  if (typeof React.useSyncExternalStore === 'function') {
    return React.useSyncExternalStore(dialogueSubscribe, dialoguePeek)
  }
  const [v, setV] = React.useState(dialogueQueue.peek())
  React.useEffect(() => dialogueQueue.subscribe(() => setV(dialogueQueue.peek())), [])
  return v
}

/** Portal dialogue backdrop above ConversationRoot dock (z=21) via #ps-overlay-root. */
export function portalDialogueModal(content) {
  const root = psOverlayRoot()
  if (root && typeof ReactDOM !== 'undefined' && ReactDOM.createPortal) {
    return ReactDOM.createPortal(content, root)
  }
  return content
}

function ProgressDialogBody(props) {
  const { item, onDismiss, onFinish } = props
  const api = getServices()
  const [status, setStatus] = React.useState('generating')
  const [latest, setLatest] = React.useState('')
  const [failed, setFailed] = React.useState(false)
  const [cancelling, setCancelling] = React.useState(false)
  const doneRef = React.useRef(false)

  const finish = React.useCallback((val) => {
    if (doneRef.current) return
    doneRef.current = true
    onFinish(val)
  }, [onFinish])

  React.useEffect(() => {
    if (!item.masId) return undefined
    let alive = true
    const tick = async () => {
      try {
        const gs = await api.generationStatus(item.masId)
        if (!alive || doneRef.current) return
        const st = (gs && gs.status) || 'idle'
        setStatus(st)
        if (st === 'completed') {
          finish(true)
          return
        }
        if (st === 'failed') {
          setFailed(true)
          return
        }
        const log = await api.generationLog(item.masId)
        if (!alive || doneRef.current) return
        const line = latestAssistantLine(log && log.log && log.log.events)
        if (line) setLatest(line)
      } catch { /* polling is best-effort */ }
    }
    tick()
    const id = setInterval(tick, 2000)
    return () => { alive = false; clearInterval(id) }
  }, [item.masId, api, finish])

  const stillWorking = !failed && status !== 'completed' && status !== 'failed'
  const lineText = latest || (stillWorking ? t('gen.progress.latest.empty') : '')

  const handleCancel = async () => {
    if (cancelling) return
    setCancelling(true)
    try {
      if (item.onCancel) await item.onCancel()
    } catch { /* best-effort */ }
    finish(false)
  }

  return h('div', { className: 'ps-modal-body' },
    h('div', { className: 'ps-gen-progress-head' },
      h('span', { className: 'ps-dot ' + (failed ? 'failed' : stillWorking ? 'generating' : 'completed') }),
      h('span', { style: { fontWeight: 600, fontSize: 14 } },
        failed ? t('gen.card.title.failed') : stillWorking ? t('gen.card.title.working') : t('gen.card.title.idle')),
    ),
    failed
      ? h('div', { className: 'ps-muted', style: { marginTop: 10 } }, t('gen.card.failed.body'))
      : h('div', { className: 'ps-muted', style: { marginTop: 8 } }, t('gen.progress.working.body')),
    stillWorking ? h('div', { className: 'ps-caption', style: { marginTop: 8 } }, t('gen.status.caption') + str(status)) : null,
    lineText ? h('div', { className: 'ps-gen-progress-line', title: lineText }, lineText) : null,
    h('div', { className: 'ps-toolbar', style: { marginTop: 18, justifyContent: 'flex-end' } },
      failed
        ? h(psBtn, { primary: true, onClick: () => finish(false) }, t('dialog.ok'))
        : stillWorking
          ? h(psBtn, { ghost: true, disabled: cancelling, onClick: handleCancel }, t('gen.progress.cancel'))
          : h(psBtn, { primary: true, onClick: () => finish(true) }, t('dialog.ok')),
    ),
  )
}

export function DialogueHost() {
  const item = useDialoguePeek()
  const inputRef = React.useRef(null)
  React.useEffect(() => {
    if (item && item.kind === 'prompt' && inputRef.current) inputRef.current.focus()
  }, [item])
  if (!item) return null
  const close = (val) => { item.resolve(val); dialogueQueue.shift() }
  const hierBase = item.hierarchyBase != null ? item.hierarchyBase : 0

  if (item.kind === 'progress') {
    return portalDialogueModal(h('div', Object.assign({}, psHierarchyBackdropProps('dialogue', hierBase), { onClick: () => close(null) }),
      h('div', { className: 'ps-modal ps-gen-progress', onClick: (e) => e.stopPropagation() },
        h('div', { className: 'ps-modal-head' },
          h('span', { style: { fontWeight: 600, fontSize: 15 } }, str(item.title)),
          h('span', { className: 'spacer', style: { flex: 1 } }),
          h(psBtn, { ghost: true, onClick: () => close(null), title: t('gen.progress.dismiss') }, '✕'),
        ),
        h(ProgressDialogBody, {
          item,
          onDismiss: () => close(null),
          onFinish: (val) => close(val),
        }),
      ),
    ))
  }

  if (item.kind === 'prompt') {
    const submit = () => {
      const v = String(inputRef.current && inputRef.current.value || '').trim()
      close(v || null)
    }
    return portalDialogueModal(h('div', Object.assign({}, psHierarchyBackdropProps('dialogue', hierBase), { onClick: () => close(null) }),
      h('div', { className: 'ps-modal', onClick: (e) => e.stopPropagation() },
        h('div', { className: 'ps-modal-head' },
          h('span', { style: { fontWeight: 600, fontSize: 15 } }, str(item.title)),
          h('span', { className: 'spacer', style: { flex: 1 } }),
          h(psBtn, { ghost: true, onClick: () => close(null) }, '✕'),
        ),
        h('div', { className: 'ps-modal-body' },
          h('input', {
            ref: inputRef,
            className: 'ps-input',
            defaultValue: item.initial,
            placeholder: item.placeholder,
            onKeyDown: (e) => {
              if (e.key === 'Enter') { e.preventDefault(); submit() }
              if (e.key === 'Escape') { e.preventDefault(); close(null) }
            },
          }),
          h('div', { className: 'ps-toolbar', style: { marginTop: 18, justifyContent: 'flex-end' } },
            h(psBtn, { ghost: true, onClick: () => close(null) }, str(item.cancelLabel)),
            h(psBtn, { primary: true, onClick: submit }, str(item.okLabel)),
          ),
        ),
      ),
    ))
  }

  if (item.kind === 'delete') {
    return portalDialogueModal(h('div', Object.assign({}, psHierarchyBackdropProps('dialogue', hierBase), { onClick: () => close(null) }),
      h('div', { className: 'ps-modal', onClick: (e) => e.stopPropagation() },
        h('div', { className: 'ps-modal-head' },
          h('span', { style: { fontWeight: 600, fontSize: 15 } }, str(item.title)),
          h('span', { className: 'spacer', style: { flex: 1 } }),
          h(psBtn, { ghost: true, onClick: () => close(null) }, '✕'),
        ),
        h('div', { className: 'ps-modal-body' },
          h('div', { className: 'ps-rerun-confirm danger' }, str(item.body)),
          h('div', { className: 'ps-toolbar', style: { marginTop: 18, justifyContent: 'flex-end', flexWrap: 'wrap', gap: 8 } },
            h(psBtn, { ghost: true, onClick: () => close(null) }, str(item.cancelLabel)),
            h(psBtn, { ghost: true, onClick: () => close('soft') }, str(item.softLabel)),
            h(psBtn, { primary: true, className: 'ps-rerun-confirm-btn', onClick: () => close('hard') }, str(item.hardLabel)),
          ),
        ),
      ),
    ))
  }

  if (item.kind === 'confirm') {
    return portalDialogueModal(h('div', Object.assign({}, psHierarchyBackdropProps('dialogue', hierBase), { onClick: () => close(false) }),
      h('div', { className: 'ps-modal', onClick: (e) => e.stopPropagation() },
        h('div', { className: 'ps-modal-head' },
          h('span', { style: { fontWeight: 600, fontSize: 15 } }, str(item.title)),
          h('span', { className: 'spacer', style: { flex: 1 } }),
          h(psBtn, { ghost: true, onClick: () => close(false) }, '✕'),
        ),
        h('div', { className: 'ps-modal-body' },
          h('div', { className: 'ps-rerun-confirm' + (item.danger ? ' danger' : '') }, str(item.body)),
          h('div', { className: 'ps-toolbar', style: { marginTop: 18, justifyContent: 'flex-end' } },
            h(psBtn, { ghost: true, onClick: () => close(false) }, str(item.cancelLabel)),
            h(psBtn, { primary: true, className: item.danger ? 'ps-rerun-confirm-btn' : '', onClick: () => close(true) }, str(item.okLabel)),
          ),
        ),
      ),
    ))
  }

  return null
}
