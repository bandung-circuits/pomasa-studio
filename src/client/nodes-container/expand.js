// Nodes canvas expand — secondary window with canvas + subagent details stack.

function NodesExpandWindowBody() {
  return h('div', { className: 'ps-expand-stack' },
    h('div', { className: 'ps-expand-canvas' },
      h(NodesContainerScrollWrap, null, h(NodesContainerBody, null)),
    ),
    h('div', { className: 'ps-expand-details' },
      h(SubagentDetailsPanel, null),
    ),
  )
}

function NodesExpandTitleAction() {
  const [open, setOpen] = React.useState(false)
  const setOpenTracked = (next) => {
    setOpen(next)
    setNodesExpandOpen(next)
  }
  React.useEffect(() => () => setNodesExpandOpen(false), [])
  return h(React.Fragment, null,
    h(PsButton, {
      id: 'expand',
      className: 'ps-part-title-btn',
      title: t('nodes.expand'),
      onClick: () => setOpenTracked(true),
    }),
    h(SecondaryWindow, {
      windowId: 'nodes-container',
      open,
      onClose: () => setOpenTracked(false),
      title: () => t('nodes.title'),
      description: () => t('nodes.canvas.hint'),
    }, h(NodesExpandWindowBody, null)),
  )
}

registerTitleAction({
  partId: 'nodes-container',
  id: 'nodes.expand',
  order: 30,
  render: () => h(NodesExpandTitleAction, null),
})

registerSecondaryTitleAction({
  windowId: 'nodes-container',
  id: 'nodes.zoom',
  order: 20,
  render: () => h(NodesZoomTitleAction, null),
})
