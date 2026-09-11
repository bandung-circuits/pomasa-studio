// Modal dialogue queue (confirm / prompt / info).

const dialogueQueue = {
  items: [],
  subs: new Set(),
  emit() { for (const fn of this.subs) fn() },
  subscribe(fn) { this.subs.add(fn); return () => { this.subs.delete(fn) } },
  push(item) { this.items.push(item); this.emit() },
  shift() { const x = this.items.shift(); this.emit(); return x },
  peek() { return this.items[0] || null },
}

function dialogueSubscribe(fn) { return dialogueQueue.subscribe(fn) }
function dialoguePeek() { return dialogueQueue.peek() }

function deleteDialog(opts) {
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

function confirmDialog(opts) {
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

function promptDialog(opts) {
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

function useDialoguePeek() {
  if (typeof React.useSyncExternalStore === 'function') {
    return React.useSyncExternalStore(dialogueSubscribe, dialoguePeek)
  }
  const [v, setV] = React.useState(dialogueQueue.peek())
  React.useEffect(() => dialogueQueue.subscribe(() => setV(dialogueQueue.peek())), [])
  return v
}

function DialogueHost() {
  const item = useDialoguePeek()
  const inputRef = React.useRef(null)
  React.useEffect(() => {
    if (item && item.kind === 'prompt' && inputRef.current) inputRef.current.focus()
  }, [item])
  if (!item) return null
  const close = (val) => { item.resolve(val); dialogueQueue.shift() }
  const hierBase = item.hierarchyBase != null ? item.hierarchyBase : 0

  if (item.kind === 'prompt') {
    const submit = () => {
      const v = String(inputRef.current && inputRef.current.value || '').trim()
      close(v || null)
    }
    return h('div', Object.assign({}, psHierarchyBackdropProps('dialogue', hierBase), { onClick: () => close(null) }),
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
    )
  }

  if (item.kind === 'delete') {
    return h('div', Object.assign({}, psHierarchyBackdropProps('dialogue', hierBase), { onClick: () => close(null) }),
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
    )
  }

  if (item.kind === 'confirm') {
    return h('div', Object.assign({}, psHierarchyBackdropProps('dialogue', hierBase), { onClick: () => close(false) }),
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
    )
  }

  return null
}
