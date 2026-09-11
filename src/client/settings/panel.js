// Settings secondary window — language toggle.

function SettingsPanel(props) {
  const lang = useConfigLang()
  if (!props.open) return null
  return portalSecondaryModal(0,
    h('div', Object.assign({}, psHierarchyBackdropProps('secondary', 0), { onClick: props.onClose }),
      h('div', { className: 'ps-modal', onClick: (e) => e.stopPropagation() },
        h('div', { className: 'ps-modal-head' },
          h('span', { style: { fontWeight: 600, fontSize: 15 } }, t('settings.title')),
          h('span', { className: 'spacer', style: { flex: 1 } }),
          h(psBtn, { ghost: true, onClick: props.onClose }, '✕'),
        ),
        h('div', { className: 'ps-modal-body' },
          h('div', { className: 'ps-field' },
            h('label', null, t('settings.language')),
            h('div', { className: 'ps-toolbar', style: { marginBottom: 0 } },
              h(psBtn, { primary: lang === 'zh', ghost: lang !== 'zh', onClick: () => configStore.setLang('zh') }, t('lang.zh')),
              h(psBtn, { primary: lang === 'en', ghost: lang !== 'en', onClick: () => configStore.setLang('en') }, t('lang.en')),
            ),
          ),
        ),
      ),
    ),
  )
}
