// Subagent node card — blueprint / select / chat actions.

function SubagentNode(props) {
  const {
    node,
    state,
    selected,
    sessionInfo,
    onSelect,
    onBlueprint,
    onChat,
  } = props
  const st = state || { status: 'waiting', artifactCount: 0 }
  const alive = sessionInfo && sessionInfo.alive
  const registered = sessionInfo && sessionInfo.registered
  const hasChat = sessionInfo && sessionInfo.sessionId
  return h('div', {
    className: 'ps-node stage' + (selected ? ' on' : '') + (alive ? ' alive' : ''),
    onClick: () => onSelect && onSelect(node),
  },
    h('div', { className: 'ps-node-head' },
      h('div', { className: 'ps-node-head-main' },
        h('span', { className: 'ps-dot ' + (STAGE_STATUS_BADGE[st.status] || 'idle') }),
        h('span', { className: 'ps-node-title' }, str(node.title)),
      ),
      registered ? h('span', { className: 'ps-badge running' }, alive ? t('node.alive') : t('node.registered')) : null,
    ),
    h('div', { className: 'ps-node-meta' }, stageCountText(st)),
    h('div', { className: 'ps-node-actions', onClick: (e) => e.stopPropagation() },
      h(psIconBtn, {
        icon: 'blueprint',
        disabled: !node.agent,
        title: t('view.blueprint'),
        onClick: () => onBlueprint && onBlueprint(node),
      }),
      h(psIconBtn, {
        icon: 'output',
        title: t('node.artifacts'),
        onClick: () => onSelect && onSelect(node),
      }),
      h(psIconBtn, {
        icon: 'chat',
        disabled: !hasChat,
        title: hasChat ? t('node.chat') : t('node.chat.disabled'),
        onClick: () => onChat && onChat(node),
      }),
    ),
  )
}
