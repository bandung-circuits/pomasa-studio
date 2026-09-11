// Orchestrator shell — container for subagent sequence (orchestrator is not a subagent node).

function OrchestratorShell(props) {
  const { row, tm, loc, aliveMap, onSelect, onBlueprint, onChat } = props
  const orch = row.orchestrator
  const stages = row.stages || []
  if (!orch) return null
  const selectedKey = loc.agentKey
  const orchState = nodeStageState(tm, orch)
  const orchSession = aliveMap && aliveMap[orch.key]
  const orchAlive = orchSession && orchSession.alive
  const orchRegistered = orchSession && orchSession.registered
  const orchHasChat = orchSession && orchSession.sessionId

  return h('div', {
    className: 'ps-orch-shell' + (selectedKey === orch.key ? ' on' : '') + (orchAlive ? ' alive' : ''),
  },
    h('div', { className: 'ps-orch-head' },
      h('div', {
        className: 'ps-orch-title-row',
        onClick: () => onSelect && onSelect(orch),
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
        : h('div', { className: 'ps-canvas-stages' },
          stages.map((node, i) => {
            const state = nodeStageState(tm, node)
            const sessionInfo = aliveMap && aliveMap[node.key]
            return h(React.Fragment, { key: node.key },
              i > 0 ? h('div', { className: 'ps-canvas-edge', 'aria-hidden': true }) : null,
              h(SubagentNode, {
                node,
                state,
                selected: selectedKey === node.key,
                sessionInfo,
                onSelect,
                onBlueprint,
                onChat,
              }),
            )
          }),
        ),
    ),
  )
}

function WorkflowCanvas(props) {
  const { descriptor, tm, loc, aliveMap } = props
  const rows = workflowRows(descriptor)
  if (!rows.length) {
    return h('div', { className: 'ps-work-center-empty' }, h(psEmpty, { title: t('stage.none'), hint: t('stage.none.hint') }))
  }
  const onSelect = (node) => taskManager.selectAgent(node.key)
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
    taskManager.selectAgent(node.key)
    actionBus.emit('agent.chat.select', { masId: loc.masId, unitKey: loc.unitKey, taskKey: loc.taskKey, agentKey: node.key })
  }
  return h('div', { className: 'ps-canvas' },
    rows.map((row) => h(OrchestratorShell, {
      key: row.id,
      row,
      tm,
      loc,
      aliveMap,
      onSelect,
      onBlueprint,
      onChat,
    })),
  )
}
