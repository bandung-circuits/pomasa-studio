// MAS list — boot page content. Opens a MAS via locators + actions.

function MasList() {
  const api = getServices()
  const loc = useLocators()
  const [mas, setMas] = React.useState(null)
  const [error, setError] = React.useState(null)

  const refresh = React.useCallback(() => {
    api.listMas()
      .then((r) => {
        if (r.ok) { setMas(r.mas); setError(null) }
        else setError(r.error)
      })
      .catch((e) => setError(String(e && e.message || e)))
  }, [api])

  React.useEffect(() => {
    refresh()
    const t = setInterval(refresh, 3000)
    return () => clearInterval(t)
  }, [refresh])

  return h(ScrollFrame, null,
    h(ScrollBox, null,
      h('div', { className: 'ps-boot-list' },
        error ? h('div', { className: 'ps-notice err', style: { margin: '0 0 12px' } }, error) : null,
        mas === null ? h('div', { className: 'ps-muted', style: { padding: '20px 12px' } }, t('loading')) :
        mas.length === 0 ?
          h('div', { className: 'ps-nav-empty' }, t('nav.empty')) :
          h('div', { className: 'ps-boot-grid' },
            mas.map((m) =>
              h('div', {
                key: m.id,
                className: 'ps-card ps-boot-card clickable' + (loc.masId === m.id ? ' on' : ''),
                onClick: () => {
                  locators.set({ masId: m.id, unitKey: null, taskKey: null })
                  actionBus.emit('mas.open', { masId: m.id })
                },
              },
                h('div', { className: 'ps-card-title' },
                  h('span', { className: 'ps-dot ' + (MAS_STATUS_BADGE[m.status] || 'idle') }),
                  h('span', { className: 'ps-card-title-text', title: str(m.name || m.id) }, str(m.name || m.id)),
                ),
                m.description ? h('div', { className: 'ps-card-desc', title: str(m.description) }, str(m.description)) : null,
                h('div', { className: 'ps-card-footer' },
                  h('span', { className: 'ps-muted', title: str(m.unitCount) + ' ' + t('unit.count') }, str(m.unitCount) + ' ' + t('unit.count')),
                  h('span', { className: 'ps-muted', title: m.lastRunAt ? t('last.run') + ' ' + fmtTime(m.lastRunAt) : t('not.run') }, m.lastRunAt ? t('last.run') + ' ' + fmtTime(m.lastRunAt) : t('not.run')),
                  h('span', { className: 'spacer', style: { flex: 1 } }),
                  h(psBtn, {
                    ghost: true,
                    className: 'ps-btn-danger',
                    title: t('delete.tip'),
                    onClick: (e) => {
                      e.stopPropagation()
                      const name = str(m.name || m.id)
                      deleteDialog({
                        title: t('delete.mas'),
                        body: t('confirm.delete', { name, id: str(m.id) }),
                      }).then((choice) => {
                        if (!choice) return
                        api.deleteMas(m.id, choice === 'hard').then((r) => {
                          if (r && r.ok) {
                            refresh()
                            if (locators.masId === m.id) {
                              locators.set({ masId: null, unitKey: null, taskKey: null })
                              actionBus.emit('layout.boot', {})
                            }
                          } else setError((r && r.error) || t('delete.failed'))
                        })
                      })
                    },
                  }, t('delete.mas')),
                ),
              ),
            ),
          ),
      ),
    ),
  )
}
