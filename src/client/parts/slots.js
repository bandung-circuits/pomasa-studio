// Part registry — region + order + title/render; layout/grid compose regions.
import { MasList } from '../MAS-list/list.js'
import { AgentProcessingBar } from '../agent-processing-bar/bar.js'
import { BootTitleBarSlot, WorkTitleBarSlot } from '../basic-title-area/title.js'
import { AgentChatPanel } from '../chat/panel.js'
import { PartDescription } from '../description/hint.js'
import { RegionStack } from '../grid-view/grid.js'
import { psHierarchyMainProps } from '../hierachy/stack.js'
import { t } from '../i18n.js'
import { NodesContainer } from '../nodes-container/stages.js'
import { OperationController } from '../operation-controller/controls.js'
import { SubagentDetailsPanel } from '../subagent-details/artifacts.js'
import { currentStage, taskManager } from '../task-manager/store.js'
import { TaskTree } from '../task-tree/tree.js'
import { str } from '../util.js'

// Lazily created: tree.js/zoom.js/expand.js register at module scope, and this
// module imports them back for composition — under ESM that cycle runs their
// bodies before this module's top-level statements.
let titleActionRegistry = null
function titleActionsMap() {
  if (!titleActionRegistry) titleActionRegistry = new Map()
  return titleActionRegistry
}

export function registerTitleAction(spec) {
  const { partId, id, order = 0, render } = spec || {}
  if (!partId || !id || !render) return
  const registry = titleActionsMap()
  if (!registry.has(partId)) registry.set(partId, [])
  const list = registry.get(partId)
  const entry = { id, order, render }
  const i = list.findIndex((x) => x.id === id)
  if (i >= 0) list[i] = entry
  else list.push(entry)
  list.sort((a, b) => a.order - b.order)
}

function partTitleActions(partId) {
  return (titleActionsMap().get(partId) || []).slice()
}

function PartTitleBar(props) {
  const actions = partTitleActions(props.partId)
  if (!actions.length) return null
  return h('span', { className: 'ps-part-title-actions' },
    actions.map((entry) => h(React.Fragment, { key: entry.id },
      typeof entry.render === 'function' ? entry.render() : entry.render,
    )),
  )
}

export function PartFrame(props) {
  const {
    partId,
    title,
    description,
    children,
    partClassName,
    bodyClassName,
  } = props
  const desc = description != null
    ? (typeof description === 'function' ? description() : description)
    : null
  const mainHier = psHierarchyMainProps()
  const partCls = ['ps-part', mainHier.className, partClassName].filter(Boolean).join(' ')
  const bodyCls = 'ps-part-body' + (bodyClassName ? ' ' + bodyClassName : '')
  const descProps = typeof desc === 'string'
    ? { text: desc }
    : Object.assign({}, desc)
  delete descProps.hierarchyBase
  return h('div', { className: partCls, style: mainHier.style },
    h('div', { className: 'ps-part-title' },
      h('span', { className: 'ps-part-title-text' }, str(title)),
      desc ? h(PartDescription, descProps) : null,
      partId ? h(PartTitleBar, { partId }) : null,
    ),
    h('div', { className: bodyCls }, children),
  )
}

function currentStageTitle() {
  const tm = taskManager.snapshot()
  const stage = currentStage(tm)
  return stage ? str(stage.title) : t('choose.stage')
}

function createSlotRegistry() {
  const map = new Map()
  return {
    register(spec) {
      const slot = typeof spec === 'string' ? spec : spec.region
      if (!map.has(slot)) map.set(slot, [])
      const list = map.get(slot)
      const entry = typeof spec === 'string'
        ? { id: slot + '-' + list.length, region: slot, order: arguments[1] || 0, title: null, description: null, render: arguments[2] }
        : {
          id: spec.id,
          region: spec.region,
          order: spec.order || 0,
          title: spec.title != null ? spec.title : null,
          description: spec.description != null ? spec.description : null,
          partClassName: spec.partClassName || null,
          bodyClassName: spec.bodyClassName || null,
          render: spec.render,
        }
      list.push(entry)
      list.sort((a, b) => a.order - b.order)
      return () => {
        const i = list.findIndex((x) => x.id === entry.id)
        if (i >= 0) list.splice(i, 1)
      }
    },
    parts(region) {
      return (map.get(region) || []).slice()
    },
    render(region, props) {
      const list = map.get(region) || []
      return list.map((entry, i) => h(React.Fragment, { key: entry.id || region + '-' + i }, entry.render(props)))
    },
    renderRegion(region) {
      return h(RegionStack, { region })
    },
  }
}

export const layoutSlots = createSlotRegistry()
let studioSlotsReady = false

export function registerStudioSlots() {
  if (studioSlotsReady) return
  studioSlotsReady = true
  layoutSlots.register({ id: 'boot-title', region: 'boot.title', order: 0, title: null, render: () => h(BootTitleBarSlot, null) })
  layoutSlots.register({ id: 'boot-content', region: 'boot.content', order: 0, title: () => t('studio.tagline'), render: () => h(MasList, null) })
  layoutSlots.register({ id: 'work-title', region: 'work.title', order: 0, title: null, render: () => h(WorkTitleBarSlot, null) })
  layoutSlots.register({
    id: 'task-tree',
    region: 'work.left',
    order: 0,
    title: () => t('unit.label'),
    render: () => h(TaskTree, null),
  })
  layoutSlots.register({
    id: 'nodes-container',
    region: 'work.center',
    order: 0,
    title: () => t('nodes.title'),
    partClassName: 'ps-part-nodes',
    render: () => h(NodesContainer, null),
  })
  layoutSlots.register({ id: 'subagent-details', region: 'work.center', order: 1, title: currentStageTitle, render: () => h(SubagentDetailsPanel, null) })
  layoutSlots.register({ id: 'operation-controller', region: 'work.right', order: 0, title: () => t('run.control'), render: () => h(OperationController, null) })
  layoutSlots.register({ id: 'agent-chat', region: 'work.right', order: 1, title: () => t('chat.title'), bodyClassName: 'ps-part-body-chat', render: () => h(AgentChatPanel, null) })
  layoutSlots.register({ id: 'agent-processing-bar', region: 'work.bottom', order: 0, title: null, render: () => h(AgentProcessingBar, { hiddenWhenDone: true }) })
}
