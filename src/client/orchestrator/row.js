// Orchestrator shell — container for subagent sequence (orchestrator is not a subagent node).
import { actionBus } from '../actions/bus.js'
import { psIconBtn } from '../buttons/button.js'
import { STAGE_STATUS_BADGE, psEmpty } from '../components.js'
import { nodeStageState, workflowRows } from '../data/graph.js'
import { t } from '../i18n.js'
import { useStudioMode } from '../studio-mode/store.js'
import { SubagentNode } from '../subagents/node.js'
import { taskManager } from '../task-manager/store.js'
import { str } from '../util.js'

const CANVAS_BRIDGE_STROKE = 'var(--dsw-alias-border-l3, #c8c8c8)'
function stageSameRow(fromEl, toEl) {
  const aTop = fromEl.offsetTop
  const aBottom = fromEl.offsetTop + fromEl.offsetHeight
  const bTop = toEl.offsetTop
  const bBottom = toEl.offsetTop + toEl.offsetHeight
  return Math.max(aTop, bTop) < Math.min(aBottom, bBottom)
}

function stageConnectorPoints(fromEl, toEl) {
  const x1 = fromEl.offsetLeft + fromEl.offsetWidth
  const x2 = toEl.offsetLeft
  const y = (fromEl.offsetTop + fromEl.offsetHeight / 2 + toEl.offsetTop + toEl.offsetHeight / 2) / 2
  return `${x1},${y} ${x2},${y}`
}

function CanvasStages(props) {
  const {
    stages,
    tm,
    selectedKey,
    aliveMap,
    designMode,
    onSelectNode,
    onSelectWithChat,
    onBlueprint,
    onChat,
  } = props
  const containerRef = React.useRef(null)
  const itemRefs = React.useRef([])
  const [bridges, setBridges] = React.useState([])

  React.useLayoutEffect(() => {
    itemRefs.current = itemRefs.current.slice(0, stages.length)
  }, [stages])

  React.useLayoutEffect(() => {
    const container = containerRef.current
    if (!container || !stages.length) {
      setBridges([])
      return undefined
    }

    const redraw = () => {
      const next = []
      for (let i = 0; i < stages.length - 1; i++) {
        const fromEl = itemRefs.current[i]
        const toEl = itemRefs.current[i + 1]
        if (!fromEl || !toEl || !stageSameRow(fromEl, toEl)) continue
        next.push(stageConnectorPoints(fromEl, toEl))
      }
      setBridges(next)
    }

    redraw()
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(redraw) : null
    if (ro) {
      ro.observe(container)
      stages.forEach((_, i) => {
        const el = itemRefs.current[i]
        if (el) ro.observe(el)
      })
    }
    return () => { if (ro) ro.disconnect() }
  }, [stages])

  return h('div', { ref: containerRef, className: 'ps-canvas-stages-wrap' },
    h('div', { className: 'ps-canvas-stages-flow' },
      stages.map((node, i) => {
        const state = nodeStageState(tm, node)
        const sessionInfo = aliveMap && aliveMap[node.key]
        return h('div', {
          key: node.key,
          className: 'ps-canvas-stage-slot',
          ref: (el) => { itemRefs.current[i] = el },
        },
          h(SubagentNode, {
            node,
            state,
            selected: selectedKey === node.key,
            sessionInfo,
            designMode,
            onSelectNode,
            onSelectWithChat,
            onBlueprint,
            onChat,
          }),
        )
      }),
    ),
    bridges.length
      ? h('svg', { className: 'ps-canvas-bridges', 'aria-hidden': true },
        bridges.map((points, i) => h('polyline', {
          key: i,
          points,
          fill: 'none',
          stroke: CANVAS_BRIDGE_STROKE,
          strokeWidth: 2,
          strokeLinecap: 'round',
          strokeLinejoin: 'round',
        })),
      )
      : null,
  )
}

function OrchestratorShell(props) {
  const { row, tm, loc, aliveMap, onSelectNode, onSelectWithChat, onBlueprint, onChat, designMode } = props
  const orch = row.orchestrator
  const stages = row.stages || []
  if (!orch) return null
  const selectedKey = loc.agentKey
  const orchState = nodeStageState(tm, orch)
  const orchSession = aliveMap && aliveMap[orch.key]
  const orchAlive = orchSession && orchSession.alive
  const orchRegistered = orchSession && orchSession.registered
  const orchHasChat = designMode || (orchSession && orchSession.sessionId)

  return h('div', {
    className: 'ps-orch-shell' + (selectedKey === orch.key ? ' on' : '') + (orchAlive ? ' alive' : ''),
  },
    h('div', { className: 'ps-orch-head' },
      h('div', {
        className: 'ps-orch-title-row',
        onClick: () => onSelectWithChat && onSelectWithChat(orch),
      },
        h('span', { className: 'ps-dot ' + (STAGE_STATUS_BADGE[orchState.status] || 'idle') }),
        h('span', { className: 'ps-orch-title' }, str(orch.title)),
        orchRegistered ? h('span', { className: 'ps-badge running', style: { marginLeft: 8 } }, orchAlive ? t('node.alive') : t('node.registered')) : null,
      ),
      h('div', { className: 'ps-orch-actions', onClick: (e) => e.stopPropagation() },
        h(psIconBtn, {
          icon: 'blueprint',
          disabled: !orch.agent,
          title: t('view.blueprint'),
          onClick: () => onBlueprint && onBlueprint(orch),
        }),
        h(psIconBtn, {
          icon: 'chat',
          disabled: !orchHasChat,
          title: orchHasChat ? t('node.chat') : t('node.chat.disabled'),
          onClick: () => onChat && onChat(orch),
        }),
      ),
    ),
    h('div', { className: 'ps-orch-body' },
      !stages.length
        ? h('div', { className: 'ps-muted', style: { padding: '8px 4px' } }, t('stage.none'))
        : h(CanvasStages, {
          stages,
          tm,
          selectedKey,
          aliveMap,
          designMode,
          onSelectNode,
          onSelectWithChat,
          onBlueprint,
          onChat,
        }),
    ),
  )
}

function chatSelectPayload(loc, node) {
  return {
    masId: loc.masId,
    unitKey: loc.unitKey,
    taskKey: loc.taskKey,
    agentKey: node.key,
    agentPath: node.agent,
    title: str(node.title),
  }
}

export function WorkflowCanvas(props) {
  const { descriptor, tm, loc, aliveMap } = props
  const designMode = useStudioMode() === 'design'
  const rows = workflowRows(descriptor)
  if (!rows.length) {
    return h('div', { className: 'ps-work-center-empty' }, h(psEmpty, { title: t('stage.none'), hint: t('stage.none.hint') }))
  }
  const emitChatSelect = (node) => {
    actionBus.emit('agent.chat.select', chatSelectPayload(loc, node))
  }
  const onSelectNode = (node) => {
    taskManager.selectAgent(node.key)
  }
  const onSelectWithChat = (node) => {
    taskManager.selectAgent(node.key)
    emitChatSelect(node)
  }
  const onBlueprint = (node) => {
    if (!node.agent) return
    actionBus.emit('file.open', {
      kind: 'blueprint',
      masId: loc.masId,
      title: str(node.title),
      path: String(node.agent),
      stage: node.index,
    })
  }
  const onChat = (node) => {
    emitChatSelect(node)
  }
  return h('div', { className: 'ps-canvas' },
    rows.map((row) => h(OrchestratorShell, {
      key: row.id,
      row,
      tm,
      loc,
      aliveMap,
      designMode,
      onSelectNode,
      onSelectWithChat,
      onBlueprint,
      onChat,
    })),
  )
}
