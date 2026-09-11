// Boot layout — page title slot + content region (PartFrame via RegionStack).

function BootLayout() {
  registerStudioSlots()
  return h('div', { className: 'ps-layout-boot' },
    layoutSlots.render('boot.title'),
    h('div', { className: 'ps-boot-body' },
      layoutSlots.renderRegion('boot.content'),
    ),
  )
}
