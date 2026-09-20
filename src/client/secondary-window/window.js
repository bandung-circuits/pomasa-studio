// SecondaryWindow — part-like title bar + registered scroll body; portaled overlay.
import { psBtn } from '../buttons/button.js'
import { PartDescription } from '../description/hint.js'
import { HierarchyScope, psHierarchyBackdropProps, psOverlayRoot, useHierarchyBase } from '../hierachy/stack.js'
import { t } from '../i18n.js'
import { ScrollBox, ScrollFrame } from '../scrollbox/box.js'
import { str } from '../util.js'

const secondaryTitleRegistry = new Map()
const secondaryScrollRegistry = new Map()

export function registerSecondaryTitleAction(spec) {
  const { windowId, id, order = 0, render } = spec || {}
  if (!windowId || !id || !render) return
  if (!secondaryTitleRegistry.has(windowId)) secondaryTitleRegistry.set(windowId, [])
  const list = secondaryTitleRegistry.get(windowId)
  const entry = { id, order, render }
  const i = list.findIndex((x) => x.id === id)
  if (i >= 0) list[i] = entry
  else list.push(entry)
  list.sort((a, b) => a.order - b.order)
}

function secondaryTitleActions(windowId) {
  return (secondaryTitleRegistry.get(windowId) || []).slice()
}

export function registerSecondaryScroll(spec) {
  const { windowId, Wrap } = spec || {}
  if (!windowId || !Wrap) return
  secondaryScrollRegistry.set(windowId, Wrap)
}

function DefaultSecondaryScrollWrap(props) {
  return h(ScrollFrame, null, h(ScrollBox, null, props.children))
}

function SecondaryWindowTitleBar(props) {
  const { windowId, title, description, onClose } = props
  const actions = secondaryTitleActions(windowId)
  const desc = description != null
    ? (typeof description === 'function' ? description() : description)
    : null
  const descProps = typeof desc === 'string'
    ? { text: desc }
    : Object.assign({}, desc)
  delete descProps.hierarchyBase
  const titleText = typeof title === 'function' ? title() : title
  return h('div', { className: 'ps-part-title ps-secondary-title' },
    h('span', { className: 'ps-part-title-text' }, str(titleText)),
    desc ? h(PartDescription, descProps) : null,
    h('span', { className: 'ps-part-title-actions' },
      actions.map((entry) => h(React.Fragment, { key: entry.id },
        typeof entry.render === 'function' ? entry.render() : entry.render,
      )),
      h(psBtn, {
        ghost: true,
        className: 'ps-part-title-btn',
        onClick: onClose,
        title: t('secondary.close'),
      }, '✕'),
    ),
  )
}

export function SecondaryWindow(props) {
  const {
    windowId,
    open,
    onClose,
    title,
    description,
    className,
    bodyClassName,
    children,
    hierarchyBase,
  } = props

  const ctxBase = useHierarchyBase()
  const resolvedBase = hierarchyBase != null ? hierarchyBase : ctxBase

  React.useEffect(() => {
    if (!open) return
    const onKey = (e) => { if (e.key === 'Escape') onClose && onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  const ScrollWrap = secondaryScrollRegistry.get(windowId) || DefaultSecondaryScrollWrap
  const bodyCls = ['ps-secondary-body']
  if (bodyClassName) bodyCls.push(bodyClassName)
  const modalCls = ['ps-modal', 'ps-modal-wide', 'ps-secondary-window']
  if (className) modalCls.push(className)

  const backdrop = psHierarchyBackdropProps('secondary', resolvedBase)
  const modal = h(HierarchyScope, { kind: 'secondary', base: hierarchyBase },
    h('div', Object.assign({}, backdrop, { onClick: onClose }),
      h('div', { className: modalCls.join(' '), onClick: (e) => e.stopPropagation() },
        h(SecondaryWindowTitleBar, { windowId, title, description, onClose }),
        h('div', { className: bodyCls.join(' ') },
          h(ScrollWrap, null, children),
        ),
      ),
    ),
  )

  const root = psOverlayRoot()
  if (root && typeof ReactDOM !== 'undefined' && ReactDOM.createPortal) {
    return ReactDOM.createPortal(modal, root)
  }
  return modal
}
