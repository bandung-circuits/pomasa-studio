// Nodes container — workflow canvas (phase 2). Reads task-manager + subagent registry.

function NodesContainerBody() {
  const tm = useTaskManager()
  const loc = useLocators()
  const api = getServices()
  const [aliveMap, setAliveMap] = React.useState({})

  React.useEffect(() => {
    if (!loc.masId || tm.generated !== true) return
    let stop = false
    const load = async () => {
      const r = await refreshSubagentList(api, loc.masId, loc.unitKey, loc.taskKey)
      if (stop || !r || !r.ok) return
      setAliveMap(r.alive || {})
    }
    load()
    const tmr = setInterval(load, 3000)
    return () => { stop = true; clearInterval(tmr) }
  }, [api, loc.masId, loc.unitKey, loc.taskKey, tm.generated])

  if (tm.generated === false) {
    return h(GenerationPanel, { genStatus: tm.genStatus })
  }
  if (!tm.descriptor) {
    return h('div', { className: 'ps-work-center-empty' }, h(psEmpty, { title: t('loading') }))
  }
  return h(WorkflowCanvas, { descriptor: tm.descriptor, tm, loc, aliveMap })
}

function NodesContainer() {
  return h(NodesContainerScrollWrap, null, h(NodesContainerBody, null))
}
