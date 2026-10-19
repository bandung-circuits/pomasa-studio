// Nodes canvas zoom — title action + temporary-window slider.
import { PsButton } from '../buttons/button.js'
import { useHierarchyBase } from '../hierachy/stack.js'
import { t } from '../i18n.js'
import { registerTitleAction } from '../parts/title-actions.js'
import { partScrollStore, usePartScrollScale } from '../scrollbox/box.js'
import { TemporaryWindow } from '../temporary-window/window.js'

export function NodesZoomTitleAction() {
  const anchorRef = React.useRef(null)
  const [open, setOpen] = React.useState(false)
  const scale = usePartScrollScale('nodes-container', true)
  const pct = Math.round(scale * 100)
  const hierarchyBase = useHierarchyBase()

  return h(React.Fragment, null,
    h('span', { ref: anchorRef },
      h(PsButton, {
        id: 'zoom',
        className: 'ps-part-title-btn',
        title: t('nodes.zoom'),
        onClick: () => setOpen((v) => !v),
      }),
    ),
    h(TemporaryWindow, {
      anchorRef,
      open,
      onOpenChange: setOpen,
      hierarchyBase,
    },
      h('div', { className: 'ps-temp-win-body' },
        h('div', { className: 'ps-temp-win-label' }, t('nodes.zoom')),
        h('input', {
          className: 'ps-temp-win-range',
          type: 'range',
          min: 50,
          max: 200,
          step: 5,
          value: pct,
          onChange: (e) => partScrollStore.setScale('nodes-container', Number(e.target.value) / 100),
        }),
        h('span', { className: 'ps-temp-win-pct' }, t('nodes.zoom.pct', { n: pct })),
      ),
    ),
  )
}

registerTitleAction({
  partId: 'nodes-container',
  id: 'nodes.zoom',
  order: 20,
  render: () => h(NodesZoomTitleAction, null),
})
