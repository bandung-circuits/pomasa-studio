// Studio mode — title-bar switch + dialogue-style picker (0=execute, 1=design).
import { actionBus } from '../actions/bus.js'
import { psBtn, psIconBtn } from '../buttons/button.js'
import { confirmDialog, portalDialogueModal } from '../dialogue/queue.js'
import { psHierarchyBackdropProps, snapshotHierarchyBase } from '../hierachy/stack.js'
import { t } from '../i18n.js'
import { useLocators } from '../locators/context.js'
import { getServices } from '../services/index.js'
import { MODE_DESIGN, MODE_EXECUTE, modePickerRef, resetStudioMode, studioModeRef, useModePickerOpen, useStudioModeIndex } from './store.js'
import { taskManager } from '../task-manager/store.js'

function modeDescLines(key) {
  return t(key).split('\n').map((line) => line.trim()).filter(Boolean)
}

function ModeDescCard(props) {
  const { title, lines, active } = props
  const cls = ['ps-mode-desc', active ? 'ps-mode-desc--active' : ''].filter(Boolean).join(' ')
  return h('div', { className: cls },
    h('div', { className: 'ps-mode-desc-title' }, title),
    lines.map((line, i) => h('div', { key: i, className: 'ps-mode-desc-line' }, line)),
  )
}

async function activateExecuteMode(loc) {
  studioModeRef.reset()
  taskManager.selectAgent('orchestrator')
  actionBus.emit('execute.mode.on', { masId: loc.masId })
  actionBus.emit('agent.chat.select', {
    masId: loc.masId,
    unitKey: loc.unitKey,
    taskKey: loc.taskKey,
    agentKey: 'orchestrator',
  })
}

async function activateDesignMode(loc, api) {
  taskManager.setNotice(null)
  const r = await api.designStart(loc.masId)
  if (!r || !r.ok) {
    taskManager.setNotice({ kind: 'err', text: (r && r.error) || t('mode.design.start.fail') })
    return false
  }
  studioModeRef.setDesign({ sessionId: r.sessionId, masRoot: r.masRoot })
  actionBus.emit('design.mode.on', {
    masId: loc.masId,
    sessionId: r.sessionId,
    masRoot: r.masRoot,
  })
  return true
}

export function StudioModeSwitchBtn() {
  const loc = useLocators()
  const modeIdx = useStudioModeIndex()
  const label = modeIdx === MODE_DESIGN ? t('mode.design') : t('mode.execute')
  if (!loc.masId) return null
  return h(psIconBtn, {
    icon: 'switch',
    onClick: () => modePickerRef.setOpen(true),
    title: t('mode.switch.title', { mode: label }),
  })
}

export function StudioModePickerHost() {
  const loc = useLocators()
  const open = useModePickerOpen()
  const modeIdx = useStudioModeIndex()
  const api = getServices()
  const [busy, setBusy] = React.useState(false)

  React.useEffect(() => actionBus.on('layout.boot', () => resetStudioMode()), [])
  React.useEffect(() => {
    resetStudioMode()
  }, [loc.masId])

  if (!open || !loc.masId) return null

  const close = () => modePickerRef.setOpen(false)

  const pickMode = async (next) => {
    if (busy || next === modeIdx) return
    if (next === MODE_DESIGN) {
      const ok = await confirmDialog({
        title: t('mode.confirm.toDesign.title'),
        body: t('mode.confirm.toDesign.body'),
        okLabel: t('mode.design'),
      })
      if (!ok) return
      setBusy(true)
      try {
        const done = await activateDesignMode(loc, api)
        if (done) close()
      } finally {
        setBusy(false)
      }
      return
    }
    const ok = await confirmDialog({
      title: t('mode.confirm.toExecute.title'),
      body: t('mode.confirm.toExecute.body'),
      okLabel: t('mode.execute'),
    })
    if (!ok) return
    await activateExecuteMode(loc)
    close()
  }

  const hierBase = snapshotHierarchyBase()
  return portalDialogueModal(h('div', Object.assign({}, psHierarchyBackdropProps('dialogue', hierBase), { onClick: close }),
    h('div', { className: 'ps-modal ps-mode-picker', onClick: (e) => e.stopPropagation() },
      h('div', { className: 'ps-modal-head' },
        h('span', { style: { fontWeight: 600, fontSize: 15 } }, t('mode.label')),
        h('span', { className: 'spacer', style: { flex: 1 } }),
        h(psBtn, { ghost: true, onClick: close }, '✕'),
      ),
      h('div', { className: 'ps-modal-body' },
        h('div', { className: 'ps-mode-segment' },
          h(psBtn, {
            primary: modeIdx === MODE_EXECUTE,
            ghost: modeIdx !== MODE_EXECUTE,
            disabled: busy,
            onClick: () => pickMode(MODE_EXECUTE),
          }, t('mode.execute')),
          h(psBtn, {
            primary: modeIdx === MODE_DESIGN,
            ghost: modeIdx !== MODE_DESIGN,
            disabled: busy,
            onClick: () => pickMode(MODE_DESIGN),
          }, busy && modeIdx !== MODE_DESIGN ? t('loading') : t('mode.design')),
        ),
        h('p', { className: 'ps-mode-picker-hint' }, t('mode.picker.hint')),
        h('div', { className: 'ps-mode-desc-list' },
          h(ModeDescCard, {
            title: t('mode.execute'),
            lines: modeDescLines('mode.execute.desc'),
            active: modeIdx === MODE_EXECUTE,
          }),
          h(ModeDescCard, {
            title: t('mode.design'),
            lines: modeDescLines('mode.design.desc'),
            active: modeIdx === MODE_DESIGN,
          }),
        ),
      ),
    ),
  ))
}
