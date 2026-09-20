// MAS list — boot page content. Opens a MAS via locators + actions.
import { actionBus } from '../actions/bus.js'
import { psBtn, psIconBtn } from '../buttons/button.js'
import { MAS_STATUS_BADGE, fmtTime } from '../components.js'
import { deleteDialog } from '../dialogue/queue.js'
import { t } from '../i18n.js'
import { locators, useLocators } from '../locators/context.js'
import { registerTitleAction } from '../parts/title-actions.js'
import { ScrollBox, ScrollFrame } from '../scrollbox/box.js'
import { getServices } from '../services/index.js'
import { str } from '../util.js'
import { createPoller } from '../util/poller.js'
import { setMasListViewMode, useMasListViewMode } from './view.js'

function MasListViewBtn(props) {
  const mode = useMasListViewMode()
  const active = mode === props.view
  return h(psIconBtn, {
    icon: props.icon,
    className: 'ps-part-title-btn ps-boot-view-btn' + (active ? ' on' : ''),
    onClick: () => setMasListViewMode(props.view),
    title: props.title,
    'aria-pressed': active ? 'true' : 'false',
  })
}

registerTitleAction({
  partId: 'boot-content',
  id: 'mas.view.list',
  order: 10,
  render: () => h(MasListViewBtn, {
    view: 'list',
    icon: 'text-list',
    title: t('boot.view.list'),
  }),
})

registerTitleAction({
  partId: 'boot-content',
  id: 'mas.view.cards',
  order: 20,
  render: () => h(MasListViewBtn, {
    view: 'cards',
    icon: 'card-list',
    title: t('boot.view.cards'),
  }),
})

function MasListCard(props) {
  const { m, selected, onOpen, onDelete } = props
  const listMode = props.listMode
  if (listMode) {
    return h('div', {
      className: 'ps-card ps-boot-card ps-boot-card--list clickable' + (selected ? ' on' : ''),
      onClick: onOpen,
    },
      h('span', { className: 'ps-dot ' + (MAS_STATUS_BADGE[m.status] || 'idle') }),
      h('div', { className: 'ps-boot-card-list-main' },
        h('span', { className: 'ps-card-title-text', title: str(m.name || m.id) }, str(m.name || m.id)),
        m.description
          ? h('span', { className: 'ps-boot-card-list-desc ps-muted', title: str(m.description) }, str(m.description))
          : null,
      ),
      h('span', { className: 'ps-boot-card-meta ps-muted' },
        str(m.unitCount) + ' ' + t('unit.count')
        + ' · '
        + (m.lastRunAt ? fmtTime(m.lastRunAt) : t('not.run')),
      ),
      h(psBtn, {
        ghost: true,
        className: 'ps-btn-danger ps-boot-card-list-delete',
        title: t('delete.tip'),
        onClick: onDelete,
      }, t('delete.mas')),
    )
  }
  return h('div', {
    className: 'ps-card ps-boot-card clickable' + (selected ? ' on' : ''),
    onClick: onOpen,
  },
    h('div', { className: 'ps-card-title' },
      h('span', { className: 'ps-dot ' + (MAS_STATUS_BADGE[m.status] || 'idle') }),
      h('span', { className: 'ps-card-title-text', title: str(m.name || m.id) }, str(m.name || m.id)),
    ),
    m.description
      ? h('div', { className: 'ps-card-desc', title: str(m.description) }, str(m.description))
      : null,
    h('div', { className: 'ps-card-footer' },
      h('span', { className: 'ps-muted', title: str(m.unitCount) + ' ' + t('unit.count') }, str(m.unitCount) + ' ' + t('unit.count')),
      h('span', { className: 'ps-muted', title: m.lastRunAt ? t('last.run') + ' ' + fmtTime(m.lastRunAt) : t('not.run') }, m.lastRunAt ? t('last.run') + ' ' + fmtTime(m.lastRunAt) : t('not.run')),
      h('span', { className: 'spacer', style: { flex: 1 } }),
      h(psBtn, {
        ghost: true,
        className: 'ps-btn-danger',
        title: t('delete.tip'),
        onClick: onDelete,
      }, t('delete.mas')),
    ),
  )
}

export function MasList() {
  const api = getServices()
  const loc = useLocators()
  const viewMode = useMasListViewMode()
  const listMode = viewMode === 'list'
  const [mas, setMas] = React.useState(null)
  const [error, setError] = React.useState(null)
  const pollRef = React.useRef(null)

  React.useEffect(() => {
    const poll = createPoller(async (stale) => {
      try {
        const r = await api.listMas()
        if (stale()) return
        if (r.ok) { setMas(r.mas); setError(null) }
        else setError(r.error)
      } catch (e) {
        if (!stale()) setError(String(e && e.message || e))
      }
    }, 3000)
    pollRef.current = poll
    poll.trigger()
    poll.start()
    return () => { poll.stop(); pollRef.current = null }
  }, [api])

  const onDelete = (m) => (e) => {
    e.stopPropagation()
    const name = str(m.name || m.id)
    deleteDialog({
      title: t('delete.mas'),
      body: t('confirm.delete', { name, id: str(m.id) }),
    }).then((choice) => {
      if (!choice) return
      api.deleteMas(m.id, choice === 'hard').then((r) => {
        if (r && r.ok) {
          if (pollRef.current) pollRef.current.trigger()
          if (locators.masId === m.id) {
            locators.set({ masId: null, unitKey: null, taskKey: null })
            actionBus.emit('layout.boot', {})
          }
        } else setError((r && r.error) || t('delete.failed'))
      })
    })
  }

  return h(ScrollFrame, null,
    h(ScrollBox, null,
      h('div', { className: 'ps-boot-list' },
        error ? h('div', { className: 'ps-notice err', style: { margin: '0 0 12px' } }, error) : null,
        mas === null ? h('div', { className: 'ps-muted', style: { padding: '20px 12px' } }, t('loading')) :
        mas.length === 0 ?
          h('div', { className: 'ps-nav-empty' }, t('nav.empty')) :
          h('div', { className: 'ps-boot-grid' + (listMode ? ' ps-boot-grid--list' : ' ps-boot-grid--cards') },
            mas.map((m) => h(MasListCard, {
              key: m.id,
              m,
              listMode,
              selected: loc.masId === m.id,
              onOpen: () => {
                locators.set({ masId: m.id, unitKey: null, taskKey: null })
                actionBus.emit('mas.open', { masId: m.id })
              },
              onDelete: onDelete(m),
            })),
          ),
      ),
    ),
  )
}
