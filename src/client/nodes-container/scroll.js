// Nodes secondary scroll — canvas zoom wrap registered for expand window.

function NodesContainerScrollWrap(props) {
  const scale = usePartScrollScale('nodes-container', true)
  const tm = useTaskManager()
  const content = props.children
  if (tm.generated === false || !tm.descriptor) {
    return h(ScrollFrame, null, h(ScrollBox, null, content))
  }
  return h(ScrollBox, { mode: 'canvas', scale }, content)
}

registerSecondaryScroll({
  windowId: 'nodes-container',
  Wrap: NodesContainerScrollWrap,
})
