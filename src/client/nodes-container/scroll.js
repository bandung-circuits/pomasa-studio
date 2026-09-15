// Nodes secondary scroll — pass-through flex column; canvas wrap only on the canvas cell.
import { ScrollBox, ScrollFrame, usePartScrollScale } from '../scrollbox/box.js'
import { registerSecondaryScroll } from '../secondary-window/window.js'
import { useTaskManager } from '../task-manager/store.js'

export function NodesContainerScrollWrap(props) {
  const scale = usePartScrollScale('nodes-container', true)
  const tm = useTaskManager()
  const content = props.children
  if (tm.generated === false || !tm.descriptor) {
    return h(ScrollFrame, null, h(ScrollBox, null, content))
  }
  return h(ScrollBox, { mode: 'canvas', scale }, content)
}

function NodesExpandSecondaryWrap(props) {
  return h('div', { className: 'ps-expand-scroll' }, props.children)
}

registerSecondaryScroll({
  windowId: 'nodes-container',
  Wrap: NodesExpandSecondaryWrap,
})
