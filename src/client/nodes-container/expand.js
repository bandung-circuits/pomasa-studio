// Nodes canvas expand — secondary window with part-like title + registered scroll.

function NodesExpandTitleAction() {
  const [open, setOpen] = React.useState(false)
  return h(React.Fragment, null,
    h(PsButton, {
      id: 'expand',
      className: 'ps-part-title-btn',
      title: t('nodes.expand'),
      onClick: () => setOpen(true),
    }),
    h(SecondaryWindow, {
      windowId: 'nodes-container',
      open,
      onClose: () => setOpen(false),
      title: () => t('nodes.title'),
      description: () => t('nodes.canvas.hint'),
    }, h(NodesContainerBody, null)),
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
