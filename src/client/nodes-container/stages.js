// Nodes container — workflow canvas (phase 2). Reads task-manager + subagent registry.
import { GenerationPanel } from '../agent-processing-bar/bar.js'
import { psEmpty } from '../components.js'
import { t } from '../i18n.js'
import { useLocators } from '../locators/context.js'
import { NodesContainerScrollWrap } from './scroll.js'
import { WorkflowCanvas } from '../orchestrator/row.js'
import { getServices } from '../services/index.js'
import { refreshSubagentList } from '../subagent-manager/store.js'
import { useTaskManager } from '../task-manager/store.js'
import { createPoller } from '../util/poller.js'

export function NodesContainerBody() {
  const tm = useTaskManager()
  const loc = useLocators()
  const api = getServices()
  const [aliveMap, setAliveMap] = React.useState({})

  React.useEffect(() => {
    if (!loc.masId || tm.generated !== true) return
    const poll = createPoller(async (stale) => {
      const r = await refreshSubagentList(api, loc.masId, loc.unitKey, loc.taskKey)
      if (stale() || !r || !r.ok) return
      setAliveMap(r.alive || {})
    }, 3000)
    poll.trigger()
    poll.start()
    return () => poll.stop()
  }, [api, loc.masId, loc.unitKey, loc.taskKey, tm.generated])

  if (tm.generated === false) {
    return h(GenerationPanel, { genStatus: tm.genStatus })
  }
  if (!tm.descriptor) {
    return h('div', { className: 'ps-work-center-empty' }, h(psEmpty, { title: t('loading') }))
  }
  return h(WorkflowCanvas, { descriptor: tm.descriptor, tm, loc, aliveMap })
}

export function NodesContainer() {
  return h(NodesContainerScrollWrap, null, h(NodesContainerBody, null))
}
