// Generation progress bar — reads task-manager genStatus.

function AgentProcessingBar(props) {
  const loc = useLocators()
  const tm = useTaskManager()
  const masId = loc.masId
  const genStatus = tm.genStatus
  if (!masId || !genStatus) return null
  const gs = genStatus.status || 'idle'
  const stillWorking = gs === 'generating' || gs === 'queued'
  const failed = gs === 'failed'
  if (!stillWorking && !failed && props.hiddenWhenDone) return null

  return h('div', { className: 'ps-gen-bar' },
    h('div', { className: 'ps-gen-bar-inner' },
      h('span', { className: 'ps-dot ' + (failed ? 'failed' : stillWorking ? 'generating' : 'completed') }),
      h('span', { className: 'ps-gen-bar-text' },
        failed ? t('gen.card.title.failed') : stillWorking ? t('gen.card.title.working') : t('gen.card.title.idle')),
      h('span', { className: 'ps-caption' }, t('gen.status.caption') + str(gs)),
    ),
  )
}

function GenerationPanel(props) {
  const gs = (props.genStatus && props.genStatus.status) || 'idle'
  const stillWorking = gs === 'generating' || gs === 'queued'
  const failed = gs === 'failed'
  return h('div', { className: 'ps-work-center-inner' },
    h(psCard, null,
      h('div', { className: 'ps-card-title' }, failed ? t('gen.card.title.failed') : stillWorking ? t('gen.card.title.working') : t('gen.card.title.idle')),
      h('div', { className: 'ps-muted', style: { marginTop: 8 } }, failed
        ? t('gen.card.failed.body')
        : stillWorking
          ? t('gen.card.working.body')
          : t('gen.card.idle.body')),
      h('div', { className: 'ps-caption', style: { marginTop: 10 } }, t('gen.status.caption') + str(gs)),
      stillWorking ? h('div', { className: 'ps-caption', style: { marginTop: 14 } }, t('gen.session.hint')) : null,
    ),
  )
}
