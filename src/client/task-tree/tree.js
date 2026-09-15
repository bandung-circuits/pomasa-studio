// Task tree — flat unit folders + tree-child rows. Refresh via task-manager poll.
import { actionBus } from '../actions/bus.js'
import { PsButton } from '../buttons/button.js'
import { confirmDialog } from '../dialogue/queue.js'
import { t } from '../i18n.js'
import { locators, useLocators } from '../locators/context.js'
import { registerTitleAction } from '../parts/slots.js'
import { ScrollBox, ScrollFrame } from '../scrollbox/box.js'
import { formatTaskLabel, taskManager, useTaskManager } from '../task-manager/store.js'
import { UnitTreeChild } from './tree-child/child.js'
import { str } from '../util.js'

function PartTitlePlus(props) {
  return h(PsButton, {
    id: 'add',
    className: 'ps-part-title-btn',
    disabled: props.disabled,
    onClick: props.onClick,
    title: t('unit.add'),
  })
}

registerTitleAction({
  partId: 'task-tree',
  id: 'unit.add',
  order: 10,
  render: () => h(PartTitlePlus, {
    disabled: taskManager.busy,
    onClick: () => actionBus.emit('unit.prompt', {}),
  }),
})

function orderUnits(units) {
  const list = units || []
  const def = list.find((u) => u.key === 'default')
  const rest = list.filter((u) => u.key !== 'default')
  return def ? [def, ...rest] : rest
}

export function TaskTree() {
  const loc = useLocators()
  const tm = useTaskManager()
  const units = orderUnits(tm.units || [])

  const onSelectTask = (unitKey, taskKey) => taskManager.selectTask(unitKey, taskKey)
  const onRunTask = (unitKey, taskKey) => {
    taskManager.selectTask(unitKey, taskKey)
    requestRunForTask(unitKey, taskKey)
  }

  return h(ScrollFrame, null,
    h(ScrollBox, null,
      h('div', { className: 'ps-work-left-inner' },
        units.map((u) => h(UnitTreeChild, {
          key: u.key,
          unit: u,
          loc,
          busy: tm.busy,
          onSelectTask,
          onRunTask,
        })),
      ),
    ),
  )
}

export function requestRunForTask(unitKey, taskKey) {
  const masId = locators.masId
  if (taskManager.taskHasResults(unitKey, taskKey)) {
    actionBus.emit('run.choose', { masId, unitKey, taskKey })
    return
  }
  const name = (taskManager.descriptor && (taskManager.descriptor.name || taskManager.descriptor.id)) || str(masId)
  confirmDialog({
    title: t('run'),
    body: t('run.confirm.task', { name, unit: str(unitKey), task: formatTaskLabel(taskKey) }),
  }).then(async (ok) => {
    if (!ok) return
    let tid = taskKey
    if (!tid) {
      tid = await taskManager.addTask(unitKey)
      if (!tid) return
    }
    actionBus.emit('run.start', { masId, unitKey, taskKey: tid, mode: 'continue', instruction: '' })
  })
}

function requestRunForUnit(unitKey) {
  const loc = locators.snapshot()
  requestRunForTask(unitKey || loc.unitKey || 'default', loc.taskKey)
}
